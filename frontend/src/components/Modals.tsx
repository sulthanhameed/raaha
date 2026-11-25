import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  BadgeCheck,
  CheckCircle2,
  ChevronRight,
  LogOut,
  MapPin,
  Phone,
  Search,
  ShoppingBag,
  Star,
  User,
  X,
} from "lucide-react";
import { formatPrice, type FoodItem } from "../data/menu";
import type { DeliveryOrder } from "../data/tracking";
import { loadCapabilities, type ApiCapabilities } from "../lib/api";
import { forgetPendingAttempt, requestError, submitOrder, type GuestProfile } from "../lib/backend";
import { paymentLabel, startRazorpay } from "../lib/payments";
import { backendUnavailableMessage, supabase } from "../lib/supabase";
import { useApp } from "../store/app";
import { useMenu } from "../store/menu";
import { cn } from "../utils/cn";
import { showFoodImageFallback } from "../utils/imageFallback";
import { useDialogFocus } from "../utils/useDialogFocus";
import { useGuestCaptcha } from "../utils/useGuestCaptcha";
import { VegMark } from "./ui";

/* ------------------------------ Shell ------------------------------ */
function Shell({
  children,
  onClose,
  wide = false,
  label,
  closeDisabled = false,
}: {
  children: ReactNode;
  onClose: () => void;
  wide?: boolean;
  label: string;
  closeDisabled?: boolean;
}) {
  const close = () => { if (!closeDisabled) onClose(); };
  const dialogRef = useDialogFocus(true, close);

  return (
    <div
      className="animate-fade-in fixed inset-0 z-[80] flex items-end justify-center bg-ink/60 backdrop-blur-sm sm:items-center sm:p-6"
      onClick={close}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={label}
        tabIndex={-1}
        className={cn(
          "m3-dialog animate-sheet-up sm:animate-pop-in relative max-h-[92dvh] w-full overflow-y-auto rounded-t-[28px] sm:rounded-[28px]",
          wide ? "max-w-3xl" : "max-w-lg"
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={close}
          disabled={closeDisabled}
          aria-label="Close"
          className="m3-dialog__close absolute top-4 right-4 z-20 flex h-12 w-12 items-center justify-center rounded-full transition active:scale-95 disabled:opacity-40"
        >
          <X size={18} />
        </button>
        {children}
      </div>
    </div>
  );
}

/* ------------------------------ Search ------------------------------ */
export function SearchOverlay() {
  const { searchOpen, setSearchOpen, navigate } = useApp();
  const { categories: CATEGORIES, menu: MENU, categoryById } = useMenu();
  const [q, setQ] = useState("");
  const dialogRef = useDialogFocus(searchOpen, () => setSearchOpen(false));

  useEffect(() => {
    if (searchOpen) setQ("");
  }, [searchOpen]);

  const results = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return MENU.filter((m) => m.tag === "Bestseller").slice(0, 5);
    return MENU.filter(
      (m) =>
        m.name.toLowerCase().includes(needle) ||
        m.description.toLowerCase().includes(needle) ||
        m.ingredients.some((i) => i.toLowerCase().includes(needle)) ||
        categoryById(m.category).name.toLowerCase().includes(needle)
    ).slice(0, 9);
  }, [q, MENU, categoryById]);

  if (!searchOpen) return null;

  const row = (item: FoodItem) => (
    <button
      key={item.id}
      onClick={() => navigate("food", item.id)}
      className="flex w-full items-center gap-3 rounded-3xl p-2.5 text-left transition hover:bg-cream sm:gap-4"
    >
      <img src={item.image} alt="" loading="lazy" onError={showFoodImageFallback} className="h-12 w-12 shrink-0 rounded-2xl object-cover sm:h-16 sm:w-16" />
      <span className="min-w-0 flex-1">
        <span className="flex items-start gap-2">
          <VegMark veg={item.veg} className="mt-0.5 shrink-0" />
          <span className="font-display text-[17px] leading-snug font-semibold break-words text-ink">{item.name}</span>
        </span>
        <span className="mt-0.5 block text-[12px] leading-snug text-ink/70">
          {categoryById(item.category).name} · {item.time}
        </span>
      </span>
      <span className="shrink-0 text-right">
        <span className="block font-display text-[17px] font-semibold">{formatPrice(item.price)}</span>
        <span className="inline-flex items-center gap-1 text-[12px] font-bold text-ink/70">
          <Star size={11} className="fill-gold text-gold" aria-hidden="true" /> {item.rating.toFixed(1)}
        </span>
      </span>
      <ChevronRight size={17} className="hidden shrink-0 text-ink/30 sm:block" aria-hidden="true" />
    </button>
  );

  return (
    <div className="animate-fade-in fixed inset-0 z-[80] bg-ink/60 backdrop-blur-sm" onClick={() => setSearchOpen(false)}>
      <div
        ref={dialogRef}
        className="m3-dialog animate-sheet-up mx-auto mt-24 w-[calc(100%-2rem)] max-w-2xl overflow-hidden rounded-[28px] sm:mt-32"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Search dishes"
        tabIndex={-1}
      >
        <div className="flex items-center gap-3 border-b border-ink/8 px-5 py-4">
          <Search size={21} className="shrink-0 text-golddeep" />
          <input
            data-dialog-initial-focus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search dishes…"
            className="min-w-0 w-full bg-transparent font-sans text-[16px] font-medium text-ink outline-none placeholder:text-ink/70"
            aria-label="Search dishes"
          />
          <button
            onClick={() => setSearchOpen(false)}
            aria-label="Close search"
            className="m3-dialog__close flex h-12 w-12 shrink-0 items-center justify-center rounded-full transition active:scale-95"
          >
            <X size={17} />
          </button>
        </div>

        <div className="max-h-[55dvh] overflow-y-auto p-3.5">
          {!q && (
            <>
              <p className="lux-label-sm px-2 pt-1.5 pb-2.5 text-golddeep">Explore the menu</p>
              <div className="mb-2 flex flex-wrap gap-2 px-2">
                {CATEGORIES.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => navigate("menu", c.id)}
                    className="inline-flex min-h-12 items-center rounded-full bg-cream px-4 py-2 text-[12px] font-bold text-ink/75 ring-1 ring-ink/10 transition hover:bg-sand active:scale-95"
                  >
                    {c.name}
                  </button>
                ))}
              </div>
            </>
          )}
          {q && <p className="lux-label-sm px-2 pt-1.5 pb-2 text-golddeep">{results.length} result{results.length === 1 ? "" : "s"}</p>}
          {results.length === 0 ? (
            <p className="px-3 py-8 text-center text-[14px] text-ink/70">
              Nothing matched “{q}”. Try “biryani”, “dosa” or “chai”.
            </p>
          ) : (
            results.map(row)
          )}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------ Guest profile ------------------------------ */
function legacyProfile(): GuestProfile | null {
  try {
    const value: unknown = JSON.parse(localStorage.getItem("raaha-user") || "null");
    if (value && typeof value === "object" && "name" in value && "phone" in value &&
      typeof value.name === "string" && typeof value.phone === "string") return { name: value.name, phone: value.phone };
  } catch { /* A legacy profile is optional. */ }
  return null;
}

function AccountAccess() {
  const { authUser, authLoading } = useApp();
  const captcha = useGuestCaptcha(true);
  const [mode, setMode] = useState<"closed" | "signin" | "signup">("closed");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!supabase || busy || !captcha.ready || mode === "closed") return;
    if (mode === "signup" && password !== confirmation) { setError("The passwords do not match."); return; }
    setBusy(true);
    setMessage("");
    setError("");
    try {
      if (mode === "signup") {
        const redirect = `${window.location.origin}${window.location.pathname}`;
        const { data, error: authError } = await supabase.auth.signUp({
          email: email.trim(), password,
          options: { emailRedirectTo: redirect, ...(captcha.token ? { captchaToken: captcha.token } : {}) },
        });
        if (authError) throw authError;
        setMessage(data.session && data.user?.email_confirmed_at
          ? "Your account is ready."
          : "Check your email for a verification link, then return and sign in. If no email arrives, check spam or try signing in.");
        setMode("signin");
      } else {
        const { error: authError } = await supabase.auth.signInWithPassword({
          email: email.trim(), password,
          ...(captcha.token ? { options: { captchaToken: captcha.token } } : {}),
        });
        if (authError) throw authError;
        setMode("closed");
        setMessage("Signed in on this device.");
      }
      setPassword("");
      setConfirmation("");
    } catch {
      setError(mode === "signup" ? "We couldn’t create the account. Check your details and try again later." : "We couldn’t sign in. Check your email, password and verification status, then try again.");
    } finally {
      captcha.reset();
      setBusy(false);
    }
  };

  const signOut = async () => {
    if (!supabase || busy) return;
    setBusy(true);
    setError("");
    try {
      const { error: authError } = await supabase.auth.signOut({ scope: "local" });
      if (authError) throw authError;
      setMessage("Signed out on this device.");
      setMode("closed");
    } catch { setError("Couldn’t sign out. Please try again."); }
    finally { setBusy(false); }
  };

  const account = authUser && !authUser.is_anonymous && authUser.email;
  return (
    <section aria-label="Email account" className="mb-6 border-b border-ink/10 pb-6">
      <p className="lux-label-sm text-golddeep">Email account</p>
      {authLoading ? <p role="status" className="mt-2 text-[13px] text-ink/70">Checking your account…</p> : account ? (
        <div className="mt-2">
          <p className="break-all text-[14px] font-bold text-ink">{authUser.email}</p>
          <p className="mt-1 text-[12px] leading-relaxed text-ink/70">{authUser.email_confirmed_at ? "Verified email · ready to request an order." : "Verify your email before requesting an order."}</p>
          <button type="button" disabled={busy} onClick={() => void signOut()} className="m3-button m3-button--outlined mt-3 inline-flex disabled:opacity-50"><LogOut size={14} /> {busy ? "Signing out…" : "Sign out"}</button>
        </div>
      ) : (
        <>
          <p className="mt-2 text-[13px] leading-relaxed text-ink/70">Create an email and password account to request an order and receive its acknowledgement.</p>
          {authUser?.is_anonymous && <p className="mt-2 text-[12px] leading-relaxed text-ink/70">Signing in creates a separate account; this browser’s guest profile, reviews and table requests are not transferred automatically.</p>}
          <div className="mt-3 flex flex-wrap gap-2">
            <button type="button" disabled={!supabase || busy} onClick={() => { setMode("signin"); setError(""); }} aria-pressed={mode === "signin"} className="m3-button m3-button--tonal inline-flex disabled:opacity-50">Sign in</button>
            <button type="button" disabled={!supabase || busy} onClick={() => { setMode("signup"); setError(""); }} aria-pressed={mode === "signup"} className="m3-button m3-button--outlined inline-flex disabled:opacity-50">Create account</button>
          </div>
          {mode !== "closed" && (
            <form onSubmit={submit} className="mt-4 space-y-3">
              <div><label htmlFor="auth-email" className="lux-label-sm mb-1.5 block text-ink/60">Email address</label><input id="auth-email" className="m3-input" type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} maxLength={254} required /></div>
              <div><label htmlFor="auth-password" className="lux-label-sm mb-1.5 block text-ink/60">Password</label><input id="auth-password" className="m3-input" type="password" autoComplete={mode === "signup" ? "new-password" : "current-password"} value={password} onChange={(event) => setPassword(event.target.value)} minLength={mode === "signup" ? 8 : undefined} maxLength={128} required /></div>
              {mode === "signup" && <div><label htmlFor="auth-confirmation" className="lux-label-sm mb-1.5 block text-ink/60">Confirm password</label><input id="auth-confirmation" className="m3-input" type="password" autoComplete="new-password" value={confirmation} onChange={(event) => setConfirmation(event.target.value)} minLength={8} maxLength={128} required /></div>}
              {captcha.challenge}
              <button type="submit" disabled={busy || !captcha.ready} className="motion-cta m3-button m3-button--filled flex w-full disabled:opacity-50">
                <span className="motion-cta__glow" aria-hidden="true" />
                {busy ? "Please wait…" : mode === "signup" ? "Create email account" : "Sign in with email"}
              </button>
              {mode === "signup" && <p className="text-[11.5px] leading-relaxed text-ink/70">Use at least 8 characters. Your email is stored by Supabase Auth; passwords are not stored by this site.</p>}
            </form>
          )}
        </>
      )}
      {message && <p role="status" className="mt-3 text-[12px] leading-relaxed text-golddeep">{message}</p>}
      {error && <p role="alert" className="mt-3 text-[12px] leading-relaxed text-maroon">{error}</p>}
    </section>
  );
}

export function AccountModal() {
  const { accountOpen, setAccountOpen, user, authUser, profileLoading, profileLoadError, reloadProfile, saveUser, clearUser, toast, navigate } = useApp();
  const captcha = useGuestCaptcha();
  const [legacy, setLegacy] = useState(legacyProfile);
  const [mode, setMode] = useState<"in" | "up">(legacy?.name && legacy.name !== "Guest" ? "up" : "in");
  const [name, setName] = useState(legacy?.name ?? "");
  const [phone, setPhone] = useState(legacy?.phone ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const busy = useRef(false);

  if (!accountOpen) return null;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy.current || !captcha.ready) return;
    const n = mode === "up" ? name.trim() : name.trim() || "Guest";
    if (!n || !/^[0-9+(). -]+$/.test(phone.trim()) || phone.replace(/\D/g, "").length < 7 || phone.replace(/\D/g, "").length > 15) {
      setError("Please enter a name and a valid phone number with 7 to 15 digits.");
      return;
    }
    busy.current = true;
    setSaving(true);
    setError("");
    try {
      await saveUser({ name: n, phone: phone.trim() }, captcha.token);
      setLegacy(null);
      setAccountOpen(false);
      toast("Profile saved", authUser?.email && !authUser.is_anonymous ? "Saved to your email account." : "Available in this browser's guest session.");
    } catch {
      captcha.reset();
      setError("We couldn’t confirm the profile was saved. Please try again when the connection is available.");
    } finally {
      busy.current = false;
      setSaving(false);
    }
  };

  const clear = async () => {
    if (busy.current) return;
    busy.current = true;
    setSaving(true);
    setError("");
    try {
      await clearUser();
      setName("");
      setPhone("");
      setLegacy(null);
      toast("Guest profile cleared", "Your profile was removed from the online guest session.");
    } catch {
      setError("We couldn’t confirm the profile was cleared. Please try again.");
    } finally {
      busy.current = false;
      setSaving(false);
    }
  };

  return (
    <Shell onClose={() => setAccountOpen(false)} closeDisabled={saving} label="Your account">
      <div className="p-6 sm:p-8">
        <AccountAccess />
        {profileLoading ? (
          <p role="status" className="py-8 text-center text-[14px] text-ink/70">Loading your guest profile…</p>
        ) : profileLoadError ? (
          <div className="py-8 text-center">
            <p role="alert" className="text-[14px] text-ink/70">Your guest profile could not be loaded. Please reconnect before changing it.</p>
            <button type="button" onClick={() => void reloadProfile()} className="m3-button m3-button--tonal mt-4 inline-flex">Retry profile</button>
          </div>
        ) : user ? (
          <div className="text-center">
            <span className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-gold font-display text-3xl font-bold text-ink">
              {user.name.charAt(0).toUpperCase()}
            </span>
            <h3 className="mt-4 font-display text-3xl font-semibold">{user.name}</h3>
            <p className="mt-1 flex items-center justify-center gap-2 text-[14px] text-ink/70"><Phone size={14} /> {user.phone}</p>
            <p className="mt-3 text-[12px] leading-relaxed text-ink/70">{authUser?.email && !authUser.is_anonymous ? "Profile saved with your email account." : "Guest profile saved for this browser only. It is not a recoverable account."} Clearing this profile does not delete requests or reviews.</p>
            <div className="mt-6 grid grid-cols-2 gap-3 text-left">
              <button onClick={() => { setAccountOpen(false); navigate("cart"); }} className="rounded-3xl bg-cream p-4 transition hover:bg-sand">
                <ShoppingBag size={19} className="text-golddeep" /><span className="mt-2 block text-[13px] font-bold">Your Cart</span><span className="text-[12px] text-ink/70">Review &amp; checkout</span>
              </button>
              <button onClick={() => { setAccountOpen(false); navigate("reserve"); }} className="rounded-3xl bg-cream p-4 transition hover:bg-sand">
                <BadgeCheck size={19} className="text-golddeep" /><span className="mt-2 block text-[13px] font-bold">Book a Table</span><span className="text-[12px] text-ink/70">Send a table request</span>
              </button>
            </div>
            <button type="button" disabled={saving} onClick={clear} className="m3-button m3-button--outlined mt-6 inline-flex disabled:opacity-50">
              <LogOut size={14} /> {saving ? "Clearing…" : "Clear profile"}
            </button>
            {error && <p role="alert" className="mt-3 text-[13px] text-maroon">{error}</p>}
          </div>
        ) : (
          <>
            <div className="text-center">
              <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-cream"><User size={24} className="text-golddeep" /></span>
              <h3 className="mt-4 font-display text-3xl font-semibold">Your guest profile</h3>
              <p className="mt-1.5 text-[14px] text-ink/70">{authUser?.email && !authUser.is_anonymous ? "Save your contact details with this email account." : "Save your details for this browser's guest session, or create an email account above."}</p>
            </div>
            {legacy && <p className="mt-4 rounded-2xl bg-cream p-3 text-[12px] leading-relaxed text-ink/75">These details were saved locally by an earlier version. They will be sent online only if you choose Save profile.</p>}
            {!supabase && <p role="status" className="mt-4 rounded-2xl bg-cream p-3 text-[13px] text-ink/75">{backendUnavailableMessage} Profile saving is unavailable.</p>}
            <div className="mt-6 grid grid-cols-2 rounded-full bg-cream p-1" role="group" aria-label="Profile type">
              {(["in", "up"] as const).map((m) => (
                <button key={m} type="button" aria-pressed={mode === m} onClick={() => setMode(m)} className={cn("rounded-full py-2.5 text-[11px] font-bold tracking-[0.2em] uppercase transition", mode === m ? "bg-ink text-goldsoft shadow" : "text-ink/70")}>
                  {m === "in" ? "Guest profile" : "Add a name"}
                </button>
              ))}
            </div>
            <form onSubmit={submit} className="mt-5 space-y-3.5">
              <div>
                <label htmlFor="acc-name" className="lux-label-sm mb-1.5 block text-ink/60">Full name</label>
                <input id="acc-name" className="m3-input" placeholder="e.g. Priya Sharma" value={name} onChange={(e) => setName(e.target.value)} required={mode === "up"} maxLength={100} autoComplete="name" />
              </div>
              <div>
                <label htmlFor="acc-phone" className="lux-label-sm mb-1.5 block text-ink/60">Mobile number</label>
                <input id="acc-phone" className="m3-input" placeholder="Your contact number" type="tel" autoComplete="tel" value={phone} onChange={(e) => setPhone(e.target.value)} maxLength={30} required />
              </div>
              {captcha.challenge}
              {error && <p role="alert" className="text-[13px] text-maroon">{error}</p>}
              <button type="submit" disabled={!supabase || saving || !captcha.ready} className="motion-cta m3-button m3-button--filled flex w-full disabled:cursor-not-allowed disabled:opacity-50">
                <span className="motion-cta__glow" aria-hidden="true" />
                {saving ? "Saving…" : "Save profile"}
              </button>
              <p className="text-center text-[11.5px] text-ink/70">{authUser?.email && !authUser.is_anonymous ? "Your profile belongs to this signed-in account." : "Clearing browser data loses this guest session."}</p>
            </form>
          </>
        )}
      </div>
    </Shell>
  );
}

/* ------------------------------ Checkout ------------------------------ */
export function CheckoutModal() {
  const { checkoutOpen, setCheckoutOpen, setAccountOpen, cart, clearCart, navigate, user, authUser, authLoading, setActiveOrder, toast } = useApp();
  const { itemById, status, refresh } = useMenu();
  const [placedOrder, setPlacedOrder] = useState<DeliveryOrder | null>(null);
  const [form, setForm] = useState({ name: "", phone: "", address: "" });
  const [paymentMethod, setPaymentMethod] = useState<"pay_later" | "razorpay">("pay_later");
  const [capabilities, setCapabilities] = useState<ApiCapabilities | null>(null);
  const [capabilityError, setCapabilityError] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [paymentNotice, setPaymentNotice] = useState("");
  const busy = useRef(false);
  const currentAccount = useRef(authUser?.id);
  currentAccount.current = authUser?.id;
  const placedOwner = useRef<string | undefined>(undefined);
  const successHeading = useRef<HTMLHeadingElement>(null);
  const capabilityRequest = useRef(0);

  const refreshCapabilities = async () => {
    const request = ++capabilityRequest.current;
    setCapabilities(null);
    setCapabilityError(false);
    if (!supabase) return;
    try {
      const result = await loadCapabilities();
      if (request === capabilityRequest.current) setCapabilities(result);
    } catch { if (request === capabilityRequest.current) setCapabilityError(true); }
  };

  useEffect(() => {
    if (checkoutOpen && placedOrder) successHeading.current?.focus();
  }, [checkoutOpen, placedOrder]);

  useEffect(() => {
    if (placedOrder && placedOwner.current !== authUser?.id) {
      setPlacedOrder(null);
      setCheckoutOpen(false);
    }
  }, [authUser?.id, placedOrder, setCheckoutOpen]);

  useEffect(() => {
    if (!checkoutOpen) {
      capabilityRequest.current += 1;
      setPlacedOrder(null);
      setError("");
      setPaymentNotice("");
      return;
    }
    void refreshCapabilities();
  }, [checkoutOpen]);

  useEffect(() => {
    if (checkoutOpen) setForm((f) => ({ ...f, name: user?.name ?? f.name, phone: user?.phone ?? f.phone }));
  }, [checkoutOpen, user]);

  const lines = cart.map((l) => ({ item: itemById(l.id), qty: l.qty }))
    .filter((l): l is { item: FoodItem; qty: number } => Boolean(l.item));
  const subtotal = lines.reduce((sum, line) => sum + line.item.price * line.qty, 0);
  const invalidCart = lines.length !== cart.length || cart.length > 50 || cart.reduce((sum, line) => sum + line.qty, 0) > 100;
  const verified = Boolean(authUser?.email && authUser.email_confirmed_at && !authUser.is_anonymous);
  const canSend = status === "ready" && verified && capabilities?.database && capabilities.notifications &&
    (paymentMethod !== "razorpay" || capabilities.payments) && lines.length > 0 && !invalidCart;

  if (!checkoutOpen) return null;

  const place = async (event: React.FormEvent) => {
    event.preventDefault();
    if (busy.current || !canSend) return;
    const name = form.name.trim();
    const phone = form.phone.trim();
    const address = form.address.trim();
    const digits = phone.replace(/\D/g, "").length;
    if (!name || !/^[0-9+(). -]+$/.test(phone) || digits < 7 || digits > 15 || address.length < 5) {
      setError("Please enter your name, a valid phone number with 7 to 15 digits, and a complete delivery address.");
      return;
    }
    busy.current = true;
    const owner = authUser?.id;
    setSending(true);
    setError("");
    try {
      const order = await submitOrder({
        name, phone, address, paymentMethod,
        items: lines.map(({ item, qty }) => ({ id: item.id, qty, expected_price: item.price })),
      });
      // The request and email jobs are saved before any gateway interaction.
      if (currentAccount.current !== owner) {
        clearCart();
        setCheckoutOpen(false);
        toast("Request saved", "Sign in to the previous account to view it and check payment.");
        return;
      }
      placedOwner.current = owner;
      setPlacedOrder(order);
      setActiveOrder(order);
      clearCart();
      if (order.paymentMethod === "razorpay" && order.paymentStatus === "unpaid") {
        setPaymentNotice("Opening secure Razorpay checkout…");
        try {
          const result = await startRazorpay(order, { name, phone, email: authUser?.email });
          if (currentAccount.current !== owner) return;
          const updated: DeliveryOrder = { ...order, paymentStatus: result.status === "paid" ? "paid" : "unpaid" };
          setPlacedOrder(updated);
          setActiveOrder(updated);
          setPaymentNotice(result.message);
        } catch {
          setPaymentNotice("The request is saved, but payment could not be confirmed. Check its status from the request page before trying again.");
        }
      }
    } catch (cause) { setError(requestError(cause)); }
    finally { busy.current = false; setSending(false); }
  };

  const field = (id: string, label: string, props: React.InputHTMLAttributes<HTMLInputElement>) => (
    <div>
      <label htmlFor={id} className="lux-label-sm mb-1.5 block text-ink/60">{label}</label>
      <input id={id} className="m3-input" {...props} />
    </div>
  );

  return (
    <Shell onClose={() => setCheckoutOpen(false)} closeDisabled={sending} label="Checkout" wide>
      {placedOrder ? (
        <div className="p-8 text-center sm:p-12">
          <span className="animate-pop-in mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-leaf/15"><CheckCircle2 size={42} className="text-leaf" /></span>
          <p className="lux-label-sm mt-6 text-golddeep">Request received</p>
          <h3 ref={successHeading} tabIndex={-1} className="mt-2 font-display text-4xl font-semibold">Your request is saved.</h3>
          <p className="mx-auto mt-3 max-w-md text-[14.5px] leading-relaxed text-ink/70">
            Reference: <span className="break-all font-bold text-ink">{placedOrder.id}</span>. It is pending restaurant review, not an accepted order. Delivery and final charges still need confirmation.
          </p>
          <p className="mx-auto mt-3 max-w-md text-[13px] font-bold text-ink">{paymentLabel(placedOrder)}</p>
          {paymentNotice && <p role="status" className="mx-auto mt-2 max-w-md text-[12px] leading-relaxed text-ink/70">{paymentNotice}</p>}
          <p className="mx-auto mt-3 max-w-md text-[12px] leading-relaxed text-ink/70">Acknowledgement emails are queued for you and the restaurant. Delivery can be delayed; contact the restaurant if urgent.</p>
          {placedOrder.paymentMethod === "razorpay" && <p className="mx-auto mt-2 max-w-md text-[12px] leading-relaxed text-ink/70">If a paid request is declined, the restaurant must arrange a refund.</p>}
          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <button disabled={sending} onClick={() => { setCheckoutOpen(false); navigate("tracking"); }} className="motion-cta m3-button m3-button--filled inline-flex disabled:opacity-50">
              <span className="motion-cta__glow" aria-hidden="true" />
              View Request &amp; Route Preview
            </button>
            <button disabled={sending} onClick={() => { setCheckoutOpen(false); navigate("menu"); }} className="m3-button m3-button--tonal inline-flex disabled:opacity-50">Browse Menu</button>
          </div>
        </div>
      ) : (
        <div className="grid sm:grid-cols-[1.15fr_1fr]">
          <form onSubmit={place} className="space-y-4 p-6 sm:p-8">
            <div>
              <p className="lux-label-sm text-golddeep">Checkout</p>
              <h3 className="mt-1.5 font-display text-3xl font-semibold">Request delivery</h3>
              <p className="mt-3 rounded-2xl bg-maroon/8 px-4 py-3 text-[13px] leading-relaxed text-maroon">Every request is subject to restaurant review. A payment does not mean the order has been accepted.</p>
            </div>
            {status !== "ready" && <p role="status" className="rounded-2xl bg-cream px-4 py-3 text-[13px] leading-relaxed text-ink/75">{status === "loading" ? "Loading the online menu before requests can be sent…" : status === "unconfigured" ? backendUnavailableMessage : "The online menu could not be loaded. Requests are unavailable until it reconnects."}</p>}
            {status === "error" && <button type="button" onClick={() => void refresh()} className="m3-button m3-button--outlined inline-flex">Retry menu</button>}
            {supabase && capabilityError && <div><p role="status" className="text-[13px] text-maroon">Checkout services could not be checked.</p><button type="button" onClick={() => void refreshCapabilities()} className="m3-button m3-button--outlined mt-2 inline-flex">Retry checkout services</button></div>}
            {capabilities && !capabilities.notifications && <p role="status" className="rounded-2xl bg-cream p-3 text-[13px] text-ink/75">Order emails are not configured yet, so orders cannot be sent.</p>}
            {!authLoading && !verified && <div className="rounded-2xl bg-cream p-3"><p className="text-[13px] leading-relaxed text-ink/75">Sign in with a verified email account before ordering. Your acknowledgement will be sent there.</p><button type="button" onClick={() => { setCheckoutOpen(false); setAccountOpen(true); }} className="m3-button m3-button--tonal mt-3 inline-flex">Sign in or create account</button></div>}
            {verified && <p className="break-all text-[12px] text-ink/70">Order email: <strong>{authUser?.email}</strong></p>}
            {invalidCart && <p role="alert" className="text-[13px] text-maroon">Please remove unavailable dishes and keep requests within 50 dishes and 100 items total.</p>}
            {field("co-name", "Your name", { placeholder: "Full name", required: true, maxLength: 100, autoComplete: "name", value: form.name, onChange: (e) => setForm({ ...form, name: e.target.value }) })}
            {field("co-phone", "Mobile number", { placeholder: "Your contact number", required: true, maxLength: 30, type: "tel", autoComplete: "tel", value: form.phone, onChange: (e) => setForm({ ...form, phone: e.target.value }) })}
            <div>
              <label htmlFor="co-address" className="lux-label-sm mb-1.5 block text-ink/60">Delivery address</label>
              <textarea id="co-address" className="m3-input min-h-20 resize-y" placeholder="House no, street, area, Madurai" required minLength={5} maxLength={500} value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
            </div>
            <fieldset className="space-y-2">
              <legend className="lux-label-sm mb-2 text-ink/60">Payment method</legend>
              <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-ink/15 p-3 text-[13px]"><input type="radio" name="payment-method" value="pay_later" checked={paymentMethod === "pay_later"} onChange={() => setPaymentMethod("pay_later")} className="mt-1 accent-maroon" /><span><strong>Pay later</strong><br /><span className="text-ink/70">Arrange payment with the restaurant.</span></span></label>
              <label className="flex items-start gap-3 rounded-2xl border border-ink/15 p-3 text-[13px] has-[:disabled]:opacity-55"><input type="radio" name="payment-method" value="razorpay" checked={paymentMethod === "razorpay"} onChange={() => setPaymentMethod("razorpay")} disabled={!capabilities?.payments} className="mt-1 accent-maroon" /><span><strong>Razorpay online</strong><br /><span className="text-ink/70">Pay the item subtotal now; a declined request requires a refund. {!capabilities?.payments && "Currently unavailable."}</span></span></label>
            </fieldset>
            {error && <p role="alert" className="rounded-2xl bg-maroon/8 px-4 py-3 text-[13px] leading-relaxed text-maroon">{error}</p>}
            {error.includes("menu price") && <button type="button" onClick={() => void refresh()} className="m3-button m3-button--outlined inline-flex">Refresh menu</button>}
            {(error.includes("previous attempt") || error.includes("request with this reference")) && <button type="button" onClick={() => {
              if (window.confirm("The earlier request may already have been saved. Starting a new request could create a duplicate. Continue?")) { forgetPendingAttempt("order"); setError(""); }
            }} className="m3-button m3-button--outlined inline-flex">Start a new request</button>}
            <button type="submit" disabled={sending || !canSend} className="motion-cta m3-button m3-button--filled flex w-full disabled:cursor-not-allowed disabled:opacity-50">
              <span className="motion-cta__glow" aria-hidden="true" />
              {sending ? "Sending request…" : `Send Order Request · ${formatPrice(subtotal)}`}
            </button>
            <p className="text-center text-[11px] leading-relaxed text-ink/70">Your contact, email and address are stored for restaurant review. Acknowledgement emails are attempted for you and the restaurant.</p>
          </form>
          <aside className="border-t border-ink/8 bg-cream/60 p-6 sm:border-t-0 sm:border-l sm:p-8">
            <p className="lux-label-sm text-golddeep">Your request</p>
            <ul className="mt-4 space-y-3.5">
              {lines.map(({ item, qty }) => (
                <li key={item.id} className="flex items-center gap-3">
                  <img src={item.image} alt={item.name} onError={showFoodImageFallback} className="h-11 w-11 rounded-xl object-cover" />
                  <span className="min-w-0 flex-1"><span className="block truncate text-[13.5px] font-bold">{item.name}</span><span className="text-[12px] text-ink/70">× {qty}</span></span>
                  <span className="text-[13.5px] font-bold">{formatPrice(item.price * qty)}</span>
                </li>
              ))}
              {lines.length === 0 && <li className="text-[13px] text-ink/70">Your cart is empty or unavailable.</li>}
            </ul>
            <div className="mt-5 border-t border-dashed border-ink/15 pt-4 text-[13.5px]"><p className="flex justify-between font-display text-xl font-semibold text-ink"><span>Item subtotal</span><span>{formatPrice(subtotal)}</span></p></div>
            <p className="mt-4 flex items-start gap-2 text-[12px] leading-relaxed text-ink/70"><MapPin size={14} className="mt-0.5 shrink-0 text-golddeep" />Taxes, delivery availability and charges will need to be confirmed by the restaurant.</p>
          </aside>
        </div>
      )}
    </Shell>
  );
}

/* ------------------------------- Toasts ------------------------------- */
export function Toasts() {
  const { toasts, navigate } = useApp();
  return (
    <div className="pointer-events-none fixed bottom-6 left-1/2 z-[90] flex w-full max-w-sm -translate-x-1/2 flex-col items-center gap-2 px-4 sm:bottom-8" aria-live="polite">
      {toasts.map((t) => (
        <div key={t.id} className="m3-snackbar toast-spring pointer-events-auto relative flex w-full items-center gap-3 rounded-2xl py-3 pr-4 pl-4 text-left shadow-pop">
          <span className="toast-icon flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gold text-ink" aria-hidden="true">
            {t.title === "Added to cart" ? <ShoppingBag size={17} /> : <BadgeCheck size={17} />}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-[13px] font-bold text-paper">{t.title}</span>
            {t.desc && <span className="block text-[12px] leading-snug text-paper/75">{t.desc}</span>}
          </span>
          {t.title === "Added to cart" && (
            <button type="button" onClick={() => navigate("cart")} className="min-h-12 shrink-0 rounded-full px-3 text-[12px] font-bold text-goldsoft hover:bg-white/10">
              View cart
            </button>
          )}
          {/* Shows how long this message stays; the text above never moves. */}
          <span className="toast-progress" aria-hidden="true">
            <span className="toast-progress__fill" />
          </span>
        </div>
      ))}
    </div>
  );
}
