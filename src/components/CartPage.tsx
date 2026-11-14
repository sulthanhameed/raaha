import { ArrowRight, Bike, CalendarCheck, MessageCircle, Phone, ShoppingBag, Trash2 } from "lucide-react";
import { INFO, formatPrice, itemById, signatureItems, type FoodItem } from "../data/menu";
import { useApp } from "../store/app";
import { FoodCard, QtyStepper, Reveal, VegMark } from "./ui";

export function CartPage() {
  const { cart, setQty, removeFromCart, navigate, setCheckoutOpen, activeOrder } = useApp();

  const lines = cart
    .map((l) => ({ item: itemById(l.id), qty: l.qty }))
    .filter((l): l is { item: FoodItem; qty: number } => Boolean(l.item));

  const subtotal = lines.reduce((s, l) => s + l.item.price * l.qty, 0);
  const delivery = subtotal === 0 || subtotal >= 499 ? 0 : 40;
  const gst = Math.round(subtotal * 0.05);
  const total = subtotal + delivery + gst;
  const toFree = Math.max(0, 499 - subtotal);
  const suggestions = signatureItems().filter((s) => !cart.some((c) => c.id === s.id)).slice(0, 4);

  return (
    <main className="pt-[var(--site-header-height)]">
      <section className="relative overflow-hidden bg-ink py-14 text-paper">
        <div className="dot-grid pointer-events-none absolute inset-0 opacity-50" aria-hidden="true" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Reveal>
            <p className="lux-label text-goldsoft">Your Selection</p>
            <h1 className="mt-4 font-display text-5xl leading-none font-medium sm:text-6xl">
              The <em className="gold-text font-semibold">Cart</em>
            </h1>
            <p className="mt-3.5 text-[15px] text-paper/65">
              {lines.length === 0
                ? "Nothing here yet — the grill is waiting for its first order."
                : `${lines.reduce((s, l) => s + l.qty, 0)} item(s) · prepared fresh once you check out.`}
            </p>
          </Reveal>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
        {lines.length === 0 ? (
          <Reveal>
            <div className="rounded-[32px] bg-white px-6 py-20 text-center shadow-card ring-1 ring-ink/5">
              <span className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-cream">
                <ShoppingBag size={32} className="text-golddeep" />
              </span>
              <h2 className="mt-6 font-display text-3xl font-semibold">Your cart is craving attention</h2>
              <p className="mx-auto mt-2.5 max-w-sm text-[14.5px] text-ink/55">
                Start with a bestseller — the Madurai Chicken Dum Biryani rarely disappoints.
              </p>
              <button
                onClick={() => navigate("menu")}
                className="group mt-7 inline-flex items-center gap-2.5 rounded-full bg-ink px-8 py-4 text-[12px] font-bold tracking-[0.22em] text-paper uppercase transition hover:bg-golddeep hover:text-white active:scale-95"
              >
                Browse the Menu <ArrowRight size={15} className="transition-transform group-hover:translate-x-1" />
              </button>
              <button onClick={() => navigate("tracking")} className="mt-3 block rounded-full bg-cream px-8 py-3.5 text-[11px] font-bold tracking-[0.18em] text-ink uppercase transition hover:bg-sand sm:mx-auto">
                {activeOrder ? "Track saved order" : "Preview delivery tracking"}
              </button>
            </div>
          </Reveal>
        ) : (
          <div className="grid items-start gap-7 lg:grid-cols-[1.5fr_1fr]">
            {/* Lines */}
            <div className="space-y-3.5">
              {lines.map(({ item, qty }) => (
                <Reveal key={item.id}>
                  <article className="flex gap-4 rounded-[26px] bg-white p-4 shadow-card ring-1 ring-ink/5 sm:gap-5 sm:p-5">
                    <button onClick={() => navigate("food", item.id)} className="shrink-0" aria-label={`View ${item.name}`}>
                      <img
                        src={item.image}
                        alt={`${item.name} at Raaha Restaurant & Grill`}
                        loading="lazy"
                        className="img-warm h-24 w-24 rounded-[20px] object-cover sm:h-28 sm:w-28"
                      />
                    </button>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="flex items-center gap-2">
                            <VegMark veg={item.veg} />
                            <span className="truncate font-display text-[19px] font-semibold">{item.name}</span>
                          </p>
                          <p className="mt-0.5 text-[12px] font-semibold text-ink/45">
                            {item.serves} · {item.time}
                          </p>
                        </div>
                        <button
                          onClick={() => removeFromCart(item.id)}
                          aria-label={`Remove ${item.name} from cart`}
                          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-cream text-ink/50 transition hover:bg-maroon/10 hover:text-maroon active:scale-90"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                        <QtyStepper small qty={qty} setQty={(n) => setQty(item.id, n)} />
                        <p className="font-display text-[19px] font-semibold">
                          {formatPrice(item.price * qty)}
                          <span className="ml-2 font-sans text-[12px] font-semibold text-ink/40">
                            {formatPrice(item.price)} each
                          </span>
                        </p>
                      </div>
                    </div>
                  </article>
                </Reveal>
              ))}

              <Reveal delay={120}>
                <div className="flex flex-wrap gap-3 pt-2">
                  <button
                    onClick={() => navigate("menu")}
                    className="inline-flex items-center gap-2 rounded-full bg-cream px-6 py-3 text-[11px] font-bold tracking-[0.18em] text-ink uppercase ring-1 ring-ink/8 transition hover:bg-sand active:scale-95"
                  >
                    ← Add More Dishes
                  </button>
                  <button
                    onClick={() => navigate("reserve")}
                    className="inline-flex items-center gap-2 rounded-full bg-cream px-6 py-3 text-[11px] font-bold tracking-[0.18em] text-ink uppercase ring-1 ring-ink/8 transition hover:bg-sand active:scale-95"
                  >
                    <CalendarCheck size={14} className="text-golddeep" /> Prefer dining in? Book a table
                  </button>
                </div>
              </Reveal>
            </div>

            {/* Bill */}
            <Reveal delay={100}>
              <aside className="sticky top-32 rounded-[30px] bg-ink p-6 text-paper shadow-lux sm:p-7">
                <p className="lux-label-sm text-goldsoft">Bill Summary</p>
                <div className="mt-5 space-y-2.5 text-[14px]">
                  <p className="flex justify-between text-paper/65">
                    <span>Subtotal</span>
                    <span className="font-semibold text-paper">{formatPrice(subtotal)}</span>
                  </p>
                  <p className="flex justify-between text-paper/65">
                    <span>Delivery</span>
                    <span className="font-semibold text-paper">
                      {delivery === 0 ? <span className="text-green-300">FREE</span> : formatPrice(delivery)}
                    </span>
                  </p>
                  <p className="flex justify-between text-paper/65">
                    <span>GST (5%)</span>
                    <span className="font-semibold text-paper">{formatPrice(gst)}</span>
                  </p>
                </div>
                {toFree > 0 && (
                  <div className="mt-5 rounded-2xl bg-white/8 p-4 ring-1 ring-white/10">
                    <p className="text-[12.5px] leading-relaxed text-paper/75">
                      Add <strong className="text-goldsoft">{formatPrice(toFree)}</strong> more for{" "}
                      <strong className="text-goldsoft">FREE delivery</strong>
                    </p>
                    <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-white/15">
                      <div
                        className="h-full rounded-full bg-gold transition-all duration-700"
                        style={{ width: `${Math.min(100, (subtotal / 499) * 100)}%` }}
                      />
                    </div>
                  </div>
                )}
                <div className="mt-5 flex items-end justify-between border-t border-dashed border-white/20 pt-4">
                  <span className="text-[12px] font-bold tracking-[0.2em] text-paper/55 uppercase">To Pay</span>
                  <span className="font-display text-[32px] leading-none font-semibold">{formatPrice(total)}</span>
                </div>
                <button
                  onClick={() => setCheckoutOpen(true)}
                  className="group mt-6 flex w-full items-center justify-center gap-2.5 rounded-full bg-gold py-4 text-[12px] font-bold tracking-[0.22em] text-ink uppercase transition hover:bg-goldsoft active:scale-[0.98]"
                >
                  <Bike size={17} /> Proceed to Checkout
                </button>
                <div className="mt-4 grid grid-cols-2 gap-2.5">
                  <a
                    href={INFO.phoneHref}
                    className="inline-flex items-center justify-center gap-2 rounded-full bg-white/10 py-3 text-[10.5px] font-bold tracking-[0.16em] text-paper uppercase ring-1 ring-white/15 transition hover:bg-white/15 active:scale-95"
                  >
                    <Phone size={13} /> Call to Order
                  </a>
                  <a
                    href={INFO.whatsappHref}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center justify-center gap-2 rounded-full bg-white/10 py-3 text-[10.5px] font-bold tracking-[0.16em] text-paper uppercase ring-1 ring-white/15 transition hover:bg-white/15 active:scale-95"
                  >
                    <MessageCircle size={13} /> WhatsApp
                  </a>
                </div>
                <p className="mt-4 text-center text-[11.5px] leading-relaxed text-paper/45">
                  Delivering from {INFO.addressShort}.<br />
                  Open daily · {INFO.hoursLabel}
                </p>
              </aside>
            </Reveal>
          </div>
        )}

        {/* Suggestions */}
        {suggestions.length > 0 && (
          <div className="mt-16">
            <p className="lux-label text-golddeep">Complete the Feast</p>
            <h2 className="mt-3 font-display text-3xl font-semibold sm:text-4xl">
              Guests also <em className="gold-text font-semibold">added</em>
            </h2>
            <div className="mt-8 grid grid-cols-1 gap-5 min-[480px]:grid-cols-2 lg:grid-cols-4">
              {suggestions.map((s, i) => (
                <FoodCard key={s.id} item={s} index={i} />
              ))}
            </div>
          </div>
        )}
      </section>
    </main>
  );
}
