import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  BadgeCheck,
  Banknote,
  CheckCircle2,
  ChevronRight,
  CreditCard,
  LogOut,
  MapPin,
  Phone,
  Search,
  ShoppingBag,
  Smartphone,
  Star,
  User,
  X,
} from "lucide-react";
import {
  CATEGORIES,
  MENU,
  formatPrice,
  categoryById,
  itemById,
  type FoodItem,
} from "../data/menu";
import { useApp } from "../store/app";
import { cn } from "../utils/cn";
import { VegMark } from "./ui";

/* ------------------------------ Shell ------------------------------ */
function Shell({
  children,
  onClose,
  wide = false,
  label,
}: {
  children: ReactNode;
  onClose: () => void;
  wide?: boolean;
  label: string;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="animate-fade-in fixed inset-0 z-[80] flex items-end justify-center bg-ink/60 backdrop-blur-sm sm:items-center sm:p-6"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={label}
    >
      <div
        className={cn(
          "animate-sheet-up sm:animate-pop-in relative max-h-[92dvh] w-full overflow-y-auto rounded-t-[30px] bg-paper shadow-pop sm:rounded-[30px]",
          wide ? "max-w-3xl" : "max-w-lg"
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute top-4 right-4 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-ink/70 text-white backdrop-blur transition hover:bg-ink active:scale-90"
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
  const [q, setQ] = useState("");

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
  }, [q]);

  if (!searchOpen) return null;

  const row = (item: FoodItem) => (
    <button
      key={item.id}
      onClick={() => navigate("food", item.id)}
      className="flex w-full items-center gap-4 rounded-3xl p-2.5 text-left transition hover:bg-cream"
    >
      <img src={item.image} alt={item.name} loading="lazy" className="h-16 w-16 shrink-0 rounded-2xl object-cover" />
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2">
          <VegMark veg={item.veg} />
          <span className="truncate font-display text-[17px] font-semibold text-ink">{item.name}</span>
        </span>
        <span className="mt-0.5 block truncate text-[12px] text-ink/50">
          {categoryById(item.category).name} · {item.time}
        </span>
      </span>
      <span className="shrink-0 text-right">
        <span className="block font-display text-[17px] font-semibold">{formatPrice(item.price)}</span>
        <span className="inline-flex items-center gap-1 text-[12px] font-bold text-ink/55">
          <Star size={11} className="fill-gold text-gold" /> {item.rating.toFixed(1)}
        </span>
      </span>
      <ChevronRight size={17} className="shrink-0 text-ink/30" />
    </button>
  );

  return (
    <div className="animate-fade-in fixed inset-0 z-[80] bg-ink/60 backdrop-blur-sm" onClick={() => setSearchOpen(false)}>
      <div
        className="animate-sheet-up mx-auto mt-24 w-[calc(100%-2rem)] max-w-2xl overflow-hidden rounded-[30px] bg-paper shadow-pop sm:mt-32"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Search dishes"
      >
        <div className="flex items-center gap-3 border-b border-ink/8 px-5 py-4">
          <Search size={21} className="shrink-0 text-golddeep" />
          <input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search biryani, dosa, paneer…"
            className="w-full bg-transparent font-display text-xl font-medium text-ink outline-none placeholder:text-ink/35"
            aria-label="Search dishes"
          />
          <button
            onClick={() => setSearchOpen(false)}
            aria-label="Close search"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-cream transition hover:bg-sand active:scale-90"
          >
            <X size={17} />
          </button>
        </div>

        <div className="max-h-[55dvh] overflow-y-auto p-3.5">
          {!q && (
            <>
              <p className="lux-label-sm px-2 pt-1.5 pb-2.5 text-golddeep">Popular right now</p>
              <div className="mb-2 flex flex-wrap gap-2 px-2">
                {CATEGORIES.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => navigate("category", c.id)}
                    className="rounded-full bg-cream px-4 py-2 text-[12px] font-bold text-ink/70 ring-1 ring-ink/5 transition hover:bg-sand active:scale-95"
                  >
                    {c.name}
                  </button>
                ))}
              </div>
            </>
          )}
          {q && <p className="lux-label-sm px-2 pt-1.5 pb-2 text-golddeep">{results.length} result{results.length === 1 ? "" : "s"}</p>}
          {results.length === 0 ? (
            <p className="px-3 py-8 text-center text-[14px] text-ink/50">
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

/* ------------------------------ Account ------------------------------ */
export function AccountModal() {
  const { accountOpen, setAccountOpen, user, setUser, toast, navigate } = useApp();
  const [mode, setMode] = useState<"in" | "up">("in");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");

  if (!accountOpen) return null;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const n = mode === "up" ? name.trim() : name.trim() || "Guest";
    if (phone.replace(/\D/g, "").length < 10) {
      toast("Please check your phone number", "Enter a valid 10-digit mobile number.");
      return;
    }
    setUser({ name: n || "Guest", phone });
    setAccountOpen(false);
    toast(`Welcome${n ? `, ${n.split(" ")[0]}` : ""}!`, "You are signed in to Raaha.");
  };

  return (
    <Shell onClose={() => setAccountOpen(false)} label="Your account">
      <div className="p-6 sm:p-8">
        {user ? (
          <div className="text-center">
            <span className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-gold font-display text-3xl font-bold text-ink">
              {user.name.charAt(0).toUpperCase()}
            </span>
            <h3 className="mt-4 font-display text-3xl font-semibold">{user.name}</h3>
            <p className="mt-1 flex items-center justify-center gap-2 text-[14px] text-ink/55">
              <Phone size={14} /> {user.phone}
            </p>
            <div className="mt-6 grid grid-cols-2 gap-3 text-left">
              <button
                onClick={() => {
                  setAccountOpen(false);
                  navigate("cart");
                }}
                className="rounded-3xl bg-cream p-4 transition hover:bg-sand"
              >
                <ShoppingBag size={19} className="text-golddeep" />
                <span className="mt-2 block text-[13px] font-bold">Your Cart</span>
                <span className="text-[12px] text-ink/50">Review &amp; checkout</span>
              </button>
              <button
                onClick={() => {
                  setAccountOpen(false);
                  navigate("reserve");
                }}
                className="rounded-3xl bg-cream p-4 transition hover:bg-sand"
              >
                <BadgeCheck size={19} className="text-golddeep" />
                <span className="mt-2 block text-[13px] font-bold">Book a Table</span>
                <span className="text-[12px] text-ink/50">Reserve in seconds</span>
              </button>
            </div>
            <button
              onClick={() => {
                setUser(null);
                toast("Signed out", "See you again soon at Raaha.");
              }}
              className="mt-6 inline-flex items-center gap-2 rounded-full bg-ink px-6 py-3 text-[11px] font-bold tracking-[0.2em] text-paper uppercase transition hover:bg-maroon active:scale-95"
            >
              <LogOut size={14} /> Sign Out
            </button>
          </div>
        ) : (
          <>
            <div className="text-center">
              <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-cream">
                <User size={24} className="text-golddeep" />
              </span>
              <h3 className="mt-4 font-display text-3xl font-semibold">
                {mode === "in" ? "Welcome back" : "Join Raaha"}
              </h3>
              <p className="mt-1.5 text-[14px] text-ink/55">
                Faster checkout, table bookings and tasty updates.
              </p>
            </div>
            <div className="mt-6 grid grid-cols-2 rounded-full bg-cream p-1" role="tablist" aria-label="Account mode">
              {(["in", "up"] as const).map((m) => (
                <button
                  key={m}
                  role="tab"
                  aria-selected={mode === m}
                  onClick={() => setMode(m)}
                  className={cn(
                    "rounded-full py-2.5 text-[11px] font-bold tracking-[0.2em] uppercase transition",
                    mode === m ? "bg-ink text-goldsoft shadow" : "text-ink/55"
                  )}
                >
                  {m === "in" ? "Sign In" : "Create Account"}
                </button>
              ))}
            </div>
            <form onSubmit={submit} className="mt-5 space-y-3.5">
              <div>
                <label htmlFor="acc-name" className="lux-label-sm mb-1.5 block text-ink/60">Full name</label>
                <input
                  id="acc-name"
                  className="m3-input"
                  placeholder="e.g. Priya Sharma"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required={mode === "up"}
                  autoComplete="name"
                />
              </div>
              <div>
                <label htmlFor="acc-phone" className="lux-label-sm mb-1.5 block text-ink/60">Mobile number</label>
                <input
                  id="acc-phone"
                  className="m3-input"
                  placeholder="10-digit mobile number"
                  inputMode="tel"
                  autoComplete="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                />
              </div>
              <button
                type="submit"
                className="w-full rounded-full bg-ink py-4 text-[12px] font-bold tracking-[0.24em] text-paper uppercase transition hover:bg-golddeep hover:text-white active:scale-[0.98]"
              >
                {mode === "in" ? "Sign In" : "Create Account"}
              </button>
              <p className="text-center text-[11.5px] text-ink/40">
                By continuing you agree to receive order updates on call &amp; WhatsApp.
              </p>
            </form>
          </>
        )}
      </div>
    </Shell>
  );
}

/* ------------------------------ Checkout ------------------------------ */
export function CheckoutModal() {
  const { checkoutOpen, setCheckoutOpen, cart, clearCart, navigate, user, setActiveOrder } = useApp();
  const [placed, setPlaced] = useState(false);
  const [orderId, setOrderId] = useState("");
  const [form, setForm] = useState({ name: "", phone: "", address: "", pay: "upi" });

  useEffect(() => {
    if (checkoutOpen) {
      setPlaced(false);
      setForm((f) => ({ ...f, name: user?.name ?? f.name, phone: user?.phone ?? f.phone }));
    }
  }, [checkoutOpen, user]);

  const lines = cart
    .map((l) => ({ item: itemById(l.id), qty: l.qty }))
    .filter((l): l is { item: FoodItem; qty: number } => Boolean(l.item));
  const subtotal = lines.reduce((s, l) => s + l.item.price * l.qty, 0);
  const delivery = subtotal === 0 || subtotal >= 499 ? 0 : 40;
  const gst = Math.round(subtotal * 0.05);
  const total = subtotal + delivery + gst;

  if (!checkoutOpen) return null;

  const place = (e: React.FormEvent) => {
    e.preventDefault();
    const id = `RAAHA-${Math.floor(1000 + Math.random() * 9000)}`;
    setOrderId(id);
    setActiveOrder({
      id,
      createdAt: Date.now(),
      customerName: form.name.trim(),
      address: form.address.trim(),
      paymentMethod: form.pay,
      total,
      items: lines.map(({ item, qty }) => ({ id: item.id, name: item.name, qty, price: item.price })),
    });
    setPlaced(true);
    clearCart();
  };

  const field = (
    id: string,
    label: string,
    props: React.InputHTMLAttributes<HTMLInputElement>
  ) => (
    <div>
      <label htmlFor={id} className="lux-label-sm mb-1.5 block text-ink/60">{label}</label>
      <input id={id} className="m3-input" {...props} />
    </div>
  );

  return (
    <Shell onClose={() => setCheckoutOpen(false)} label="Checkout" wide>
      {placed ? (
        <div className="p-8 text-center sm:p-12">
          <span className="animate-pop-in mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-leaf/15">
            <CheckCircle2 size={42} className="text-leaf" />
          </span>
          <p className="lux-label-sm mt-6 text-golddeep">Route Preview Ready</p>
          <h3 className="mt-2 font-display text-4xl font-semibold">Your journey, mapped.</h3>
          <p className="mx-auto mt-3 max-w-sm text-[14.5px] leading-relaxed text-ink/60">
            <span className="font-bold text-ink">{orderId}</span> is saved on this device for a tracking preview.
            This demo does not send an order or payment to the restaurant and does not use live courier GPS.
          </p>
          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <button
              onClick={() => {
                setCheckoutOpen(false);
                navigate("tracking");
              }}
              className="rounded-full bg-ink px-7 py-3.5 text-[11px] font-bold tracking-[0.2em] text-paper uppercase transition hover:bg-golddeep active:scale-95"
            >
              View Route Preview
            </button>
            <button
              onClick={() => {
                setCheckoutOpen(false);
                navigate("menu");
              }}
              className="rounded-full bg-cream px-7 py-3.5 text-[11px] font-bold tracking-[0.2em] text-ink uppercase ring-1 ring-ink/10 transition hover:bg-sand active:scale-95"
            >
              Order More
            </button>
          </div>
        </div>
      ) : (
        <div className="grid sm:grid-cols-[1.15fr_1fr]">
          <form onSubmit={place} className="space-y-4 p-6 sm:p-8">
            <div>
              <p className="lux-label-sm text-golddeep">Checkout</p>
              <h3 className="mt-1.5 font-display text-3xl font-semibold">Almost there</h3>
            </div>
            {field("co-name", "Your name", {
              placeholder: "Full name",
              required: true,
              autoComplete: "name",
              value: form.name,
              onChange: (e) => setForm({ ...form, name: e.target.value }),
            })}
            {field("co-phone", "Mobile number", {
              placeholder: "10-digit mobile",
              required: true,
              inputMode: "tel",
              autoComplete: "tel",
              value: form.phone,
              onChange: (e) => setForm({ ...form, phone: e.target.value }),
            })}
            <div>
              <label htmlFor="co-address" className="lux-label-sm mb-1.5 block text-ink/60">Delivery address</label>
              <textarea
                id="co-address"
                className="m3-input min-h-20 resize-none"
                placeholder="House no, street, area, Madurai"
                required
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
              />
            </div>
            <fieldset>
              <legend className="lux-label-sm mb-2 text-ink/60">Payment</legend>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: "upi", label: "UPI", icon: Smartphone },
                  { id: "card", label: "Card", icon: CreditCard },
                  { id: "cod", label: "Cash", icon: Banknote },
                ].map(({ id, label, icon: Icon }) => (
                  <label
                    key={id}
                    className={cn(
                      "flex cursor-pointer flex-col items-center gap-1.5 rounded-2xl px-2 py-3.5 text-[12px] font-bold ring-1 transition",
                      form.pay === id ? "bg-ink text-goldsoft ring-ink" : "bg-cream text-ink/65 ring-ink/5 hover:bg-sand"
                    )}
                  >
                    <input
                      type="radio"
                      name="pay"
                      value={id}
                      checked={form.pay === id}
                      onChange={() => setForm({ ...form, pay: id })}
                      className="sr-only"
                    />
                    <Icon size={18} /> {label}
                  </label>
                ))}
              </div>
            </fieldset>
            <button
              type="submit"
              disabled={lines.length === 0}
              className="flex w-full items-center justify-center gap-2 rounded-full bg-ink py-4 text-[12px] font-bold tracking-[0.22em] text-paper uppercase transition hover:bg-golddeep hover:text-white active:scale-[0.98] disabled:opacity-40"
            >
              Create Demo Order · {formatPrice(total)}
            </button>
            <p className="text-center text-[11px] leading-relaxed text-ink/45">
              Demo checkout only. No payment is collected and no order is sent to Raaha.
            </p>
          </form>

          <aside className="border-t border-ink/8 bg-cream/60 p-6 sm:border-t-0 sm:border-l sm:p-8">
            <p className="lux-label-sm text-golddeep">Your Order</p>
            <ul className="mt-4 space-y-3.5">
              {lines.map(({ item, qty }) => (
                <li key={item.id} className="flex items-center gap-3">
                  <img src={item.image} alt={item.name} className="h-11 w-11 rounded-xl object-cover" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13.5px] font-bold">{item.name}</span>
                    <span className="text-[12px] text-ink/50">× {qty}</span>
                  </span>
                  <span className="text-[13.5px] font-bold">{formatPrice(item.price * qty)}</span>
                </li>
              ))}
              {lines.length === 0 && <li className="text-[13px] text-ink/50">Your cart is empty.</li>}
            </ul>
            <div className="mt-5 space-y-2 border-t border-dashed border-ink/15 pt-4 text-[13.5px]">
              <p className="flex justify-between text-ink/60"><span>Subtotal</span><span>{formatPrice(subtotal)}</span></p>
              <p className="flex justify-between text-ink/60">
                <span>Delivery</span>
                <span>{delivery === 0 ? <span className="font-bold text-leaf">FREE</span> : formatPrice(delivery)}</span>
              </p>
              <p className="flex justify-between text-ink/60"><span>GST (5%)</span><span>{formatPrice(gst)}</span></p>
              <p className="flex justify-between pt-1 font-display text-xl font-semibold text-ink">
                <span>To Pay</span><span>{formatPrice(total)}</span>
              </p>
            </div>
            <p className="mt-4 flex items-start gap-2 text-[12px] leading-relaxed text-ink/50">
              <MapPin size={14} className="mt-0.5 shrink-0 text-golddeep" />
              Delivering from 14 Gokhale Road, Chinna Chokikulam. Free delivery above ₹499.
            </p>
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
        <button
          key={t.id}
          onClick={() => navigate("cart")}
          className="animate-sheet-up pointer-events-auto flex w-full items-center gap-3 rounded-full bg-ink py-3 pr-6 pl-4 text-left shadow-pop"
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gold text-ink">
            <ShoppingBag size={16} />
          </span>
          <span className="min-w-0">
            <span className="block truncate text-[13px] font-bold text-paper">{t.title}</span>
            {t.desc && <span className="block truncate text-[12px] text-paper/60">{t.desc}</span>}
          </span>
          <span className="ml-auto shrink-0 text-[10px] font-bold tracking-[0.18em] text-goldsoft uppercase">
            View Cart
          </span>
        </button>
      ))}
    </div>
  );
}
