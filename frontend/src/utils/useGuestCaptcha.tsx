import { Turnstile, type TurnstileInstance } from "@marsidev/react-turnstile";
import { useEffect, useMemo, useRef, useState, type RefObject } from "react";
import { supabase, turnstileSiteKey } from "../lib/supabase";

function VerificationWidget({ widget, onToken, onExpired, onFailure, onScriptFailure, onLoaded }: {
  widget: RefObject<TurnstileInstance | null>;
  onToken: (token: string) => void;
  onExpired: () => void;
  onFailure: () => void;
  onScriptFailure: () => void;
  onLoaded: () => void;
}) {
  const finishedLoading = useRef(false);
  const callbacks = useRef({ onToken, onExpired, onFailure, onScriptFailure, onLoaded });
  callbacks.current = { onToken, onExpired, onFailure, onScriptFailure, onLoaded };
  const scriptOptions = useMemo(() => ({
    onError: () => { finishedLoading.current = true; callbacks.current.onScriptFailure(); },
  }), []);

  useEffect(() => {
    // The library shares one script across widgets. If an earlier widget's
    // script failed, a later widget will not receive that script's error event.
    const timer = window.setTimeout(() => {
      if (!finishedLoading.current) callbacks.current.onScriptFailure();
    }, 15_000);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <Turnstile
      ref={widget}
      siteKey={turnstileSiteKey}
      options={{ size: "compact", refreshExpired: "auto", refreshTimeout: "auto" }}
      scriptOptions={scriptOptions}
      onWidgetLoad={() => { finishedLoading.current = true; callbacks.current.onLoaded(); }}
      onSuccess={(value) => { finishedLoading.current = true; callbacks.current.onToken(value); }}
      onExpire={() => callbacks.current.onExpired()}
      onTimeout={() => callbacks.current.onFailure()}
      onError={() => { finishedLoading.current = true; callbacks.current.onFailure(); }}
      onUnsupported={() => { finishedLoading.current = true; callbacks.current.onFailure(); }}
    />
  );
}

/**
 * Supabase Auth verifies the token on anonymous sign-in. Existing guest
 * sessions don't need another signup challenge; per-guest DB limits still apply.
 */
export function useGuestCaptcha(force = false) {
  const [hasSession, setHasSession] = useState<boolean | null>(turnstileSiteKey && supabase ? null : false);
  const [token, setToken] = useState<string>();
  const [failed, setFailed] = useState(false);
  const [scriptFailed, setScriptFailed] = useState(false);
  const widget = useRef<TurnstileInstance>(null);

  useEffect(() => {
    if (!turnstileSiteKey || !supabase) return;
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setHasSession(Boolean(session));
      if (session && !force) setToken(undefined);
    });
    return () => subscription.unsubscribe();
  }, [force]);

  const reset = () => {
    setToken(undefined);
    setFailed(false);
    setScriptFailed(false);
    widget.current?.reset();
  };

  const ready = !turnstileSiteKey || (!force && hasSession === true) || ((force || hasSession === false) && Boolean(token));
  const challenge = !turnstileSiteKey || !supabase || (!force && hasSession === true) ? null : !force && hasSession === null ? (
    <p role="status" className="text-[12px] text-ink/70">Checking guest session…</p>
  ) : (
    <div className="space-y-2">
      <p className="text-[12px] leading-relaxed text-ink/70">{force ? "Complete verification before signing in or creating an account." : "Complete guest verification before your first submission."}</p>
      <VerificationWidget
        widget={widget}
        onToken={(value) => { setToken(value); setFailed(false); setScriptFailed(false); }}
        onExpired={() => setToken(undefined)}
        onFailure={() => { setToken(undefined); setFailed(true); }}
        onScriptFailure={() => { setToken(undefined); setFailed(true); setScriptFailed(true); }}
        onLoaded={() => { setFailed(false); setScriptFailed(false); }}
      />
      {failed && <p role="alert" className="text-[12px] text-maroon">Verification could not load. {scriptFailed ? "Reloading the page will clear this form." : "Please check your connection and retry."}</p>}
      {failed && <button type="button" onClick={scriptFailed ? () => window.location.reload() : reset} className="m3-button m3-button--outlined inline-flex">{scriptFailed ? "Reload page" : "Retry verification"}</button>}
    </div>
  );
  return { ready, token, reset, challenge };
}
