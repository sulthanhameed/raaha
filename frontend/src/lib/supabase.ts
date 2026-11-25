import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const rawApiBase = import.meta.env.VITE_API_BASE_URL?.trim().replace(/\/$/, "") ?? "";
const key = (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? import.meta.env.VITE_SUPABASE_ANON_KEY)?.trim() ?? "";

// Vite values are public. Refuse obvious secret keys and legacy service-role JWTs.
function isPrivilegedKey(value: string) {
  if (value.startsWith("sb_secret_")) return true;
  try {
    const payload = value.split(".")[1];
    if (!payload) return false;
    const decoded = JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/")));
    return decoded.role === "service_role" || decoded.role === "supabase_admin";
  } catch { return false; }
}

// Prefer same-origin /api and an ingress proxy. Absolute API URLs must be HTTPS;
// browser-facing code must never point at the sandbox's localhost backend.
function validApiBase(value: string) {
  if (/^\/(?:[A-Za-z0-9_-]+\/)*[A-Za-z0-9_-]+$/.test(value)) return true;
  try {
    const parsed = new URL(value);
    return parsed.protocol === "https:" && !parsed.username && !parsed.password && !parsed.search && !parsed.hash;
  } catch { return false; }
}

export const apiBase = validApiBase(rawApiBase) ? rawApiBase : "";

// Bound waits so an unreachable API does not leave a form submitting forever.
export const boundedFetch: typeof fetch = async (input, init) => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15_000);
  const upstream = init?.signal;
  const abort = () => controller.abort();
  if (upstream?.aborted) abort();
  else upstream?.addEventListener("abort", abort, { once: true });
  try { return await fetch(input, { ...init, signal: controller.signal }); }
  finally { clearTimeout(timer); upstream?.removeEventListener("abort", abort); }
};

// The browser SDK handles Auth only. It reaches Auth through Express; catalog,
// requests, profiles, reviews, payments and tracking use explicit Express REST routes.
export const supabase: SupabaseClient | null = apiBase && key && !isPrivilegedKey(key)
  ? createClient(new URL(`${apiBase}/supabase`, window.location.origin).toString(), key, {
      global: { fetch: boundedFetch },
      auth: { storageKey: "raaha-auth-v1" },
    })
  : null;

export const backendUnavailableMessage = "Online requests are unavailable because the Express API is not configured.";
export const turnstileSiteKey = import.meta.env.VITE_TURNSTILE_SITE_KEY?.trim() ?? "";

let signingIn: Promise<string> | null = null;

/** Anonymous sessions remain available for table requests, profiles and reviews. */
export async function ensureGuestSession(captchaToken?: string): Promise<string> {
  if (!supabase) throw new Error("BACKEND_UNCONFIGURED");
  const client = supabase;
  if (!signingIn) {
    signingIn = (async () => {
      const { data: current, error: sessionError } = await client.auth.getSession();
      if (sessionError) throw new Error("GUEST_SESSION_FAILED");
      if (current.session?.user.id) return current.session.user.id;
      if (turnstileSiteKey && !captchaToken) throw new Error("CAPTCHA_REQUIRED");
      const { data, error } = await client.auth.signInAnonymously(captchaToken ? { options: { captchaToken } } : undefined);
      if (error || !data.user?.id || !data.session) throw new Error("GUEST_SESSION_FAILED");
      return data.user.id;
    })().finally(() => { signingIn = null; });
  }
  return signingIn;
}

export async function existingGuestId(): Promise<string | null> {
  if (!supabase) return null;
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  return data.session?.user.id ?? null;
}

export async function verifiedAccountId(): Promise<string> {
  if (!supabase) throw new Error("BACKEND_UNCONFIGURED");
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  const user = data.session?.user;
  if (!user?.id || user.is_anonymous || !user.email || !user.email_confirmed_at) throw new Error("EMAIL_VERIFICATION_REQUIRED");
  return user.id;
}
