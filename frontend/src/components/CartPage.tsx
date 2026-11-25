import { ArrowLeft, ArrowRight, Bike, CalendarCheck, MessageCircle, Phone, ShoppingBag, Trash2 } from "lucide-react";
import { INFO, formatPrice, type FoodItem } from "../data/menu";
import { useApp } from "../store/app";
import { useMenu } from "../store/menu";
import { showFoodImageFallback } from "../utils/imageFallback";
import { BannerGlow } from "./BannerGlow";
import { CountUpValue } from "./CountUpValue";
import { PageOrnament } from "./PageOrnament";
import { FoodCard, QtyStepper, Reveal, VegMark } from "./ui";

export function CartPage() {
  const { cart, setQty, removeFromCart, navigate, setCheckoutOpen, activeOrder } = useApp();
  const { itemById, signatureItems, status } = useMenu();

  const lines = cart
    .map((l) => ({ item: itemById(l.id), qty: l.qty }))
    .filter((l): l is { item: FoodItem; qty: number } => Boolean(l.item));

  const subtotal = lines.reduce((s, l) => s + l.item.price * l.qty, 0);
  const missing = cart.filter((line) => !itemById(line.id));
  const tooMany = cart.length > 50 || cart.reduce((sum, line) => sum + line.qty, 0) > 100;
  const suggestions = signatureItems().filter((s) => !cart.some((c) => c.id === s.id)).slice(0, 4);

  return (
    <main className="pt-[var(--site-header-height)]">
      <section className="relative overflow-hidden bg-ink py-14 text-paper" data-section-light>
        <div className="dot-grid pointer-events-none absolute inset-0 opacity-50" aria-hidden="true" />
        <BannerGlow sweep />
        <PageOrnament />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Reveal>
            <p className="lux-label text-goldsoft">Your Selection</p>
            <h1 tabIndex={-1} data-dialog-return-fallback className="mt-4 font-display text-5xl leading-none font-medium sm:text-6xl">
              The <em className="gold-text font-semibold">Cart</em>
            </h1>
            <p className="mt-3.5 text-[15px] text-paper/65">
              {cart.length === 0 ? (
                "Nothing here yet — choose a dish to start your cart."
              ) : (
                <>
                  <CountUpValue value={cart.reduce((s, l) => s + l.qty, 0)} duration={720} /> item(s) in your cart.
                  Requests are reviewed by the restaurant.
                </>
              )}
            </p>
          </Reveal>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
        {cart.length === 0 ? (
          <Reveal>
            <div className="m3-card px-6 py-20 text-center">
              <span className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-cream">
                <ShoppingBag size={32} className="text-golddeep" />
              </span>
              <h2 className="mt-6 font-display text-3xl font-semibold">Your cart is craving attention</h2>
              <p className="mx-auto mt-2.5 max-w-sm text-[14.5px] text-ink/70">
                Explore the menu and add a dish to see a sample total.
              </p>
              <div className="mt-7 flex flex-wrap justify-center gap-3">
                <button
                  onClick={() => navigate("menu")}
                  className="motion-cta m3-button m3-button--filled group inline-flex"
                >
                  Browse the Menu <ArrowRight size={15} className="transition-transform group-hover:translate-x-1" />
                </button>
                <button onClick={() => navigate("tracking")} className="m3-button m3-button--tonal inline-flex">
                  {activeOrder ? "View request & route preview" : "Preview delivery tracking"}
                </button>
              </div>
            </div>
          </Reveal>
        ) : (
          <div className="grid items-start gap-7 lg:grid-cols-[1.5fr_1fr]">
            {/* Lines */}
            <div className="space-y-3.5">
              {lines.map(({ item, qty }) => (
                <Reveal key={item.id}>
                  <article className="anim-slide-x m3-card grid grid-cols-[80px_minmax(0,1fr)] gap-x-4 gap-y-3 p-4 sm:grid-cols-[112px_minmax(0,1fr)] sm:gap-x-5 sm:p-5">
                    <button onClick={() => navigate("food", item.id)} className="self-start sm:row-span-2" aria-label={`View ${item.name}`}>
                      <img
                        src={item.image}
                        alt={`Representative photograph of ${item.name}`}
                        loading="lazy"
                        onError={showFoodImageFallback}
                        className="img-warm h-20 w-20 rounded-[20px] object-cover sm:h-28 sm:w-28"
                      />
                    </button>
                    <div className="min-w-0">
                      <p className="flex items-start gap-2">
                        <VegMark veg={item.veg} className="mt-1 shrink-0" />
                        <span className="font-display text-[19px] leading-snug font-semibold break-words">{item.name}</span>
                      </p>
                      <p className="mt-1 text-[12px] font-semibold text-ink/70">{item.serves} · {item.time}</p>
                      <p className="mt-2 font-display text-[19px] font-semibold">
                        {formatPrice(item.price * qty)}
                        <span className="ml-2 font-sans text-[12px] font-semibold text-ink/70">{formatPrice(item.price)} each</span>
                      </p>
                    </div>
                    <div className="col-span-2 flex items-center justify-between gap-3 sm:col-span-1 sm:col-start-2">
                      <QtyStepper small qty={qty} setQty={(n) => setQty(item.id, n)} />
                      <button
                        onClick={() => removeFromCart(item.id)}
                        aria-label={`Remove ${item.name} from cart`}
                        className="m3-icon-button flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-cream text-ink/70 transition hover:bg-maroon/10 hover:text-maroon active:scale-95"
                      >
                        <Trash2 size={16} aria-hidden="true" />
                      </button>
                    </div>
                  </article>
                </Reveal>
              ))}

              {missing.map((line) => (
                <article key={line.id} className="m3-card flex items-center justify-between gap-3 p-5">
                  <p className="min-w-0 break-words text-[13px] text-ink/75">{line.id}: {status === "ready" ? "this dish is not in the current menu. Remove it before sending a request." : "availability cannot be checked until the online menu reconnects."}</p>
                  <button type="button" onClick={() => removeFromCart(line.id)} aria-label={`Remove unavailable item ${line.id}`} className="m3-icon-button flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-cream text-ink/70"><Trash2 size={16} aria-hidden="true" /></button>
                </article>
              ))}
              <Reveal delay={120}>
                <div className="flex flex-wrap gap-3 pt-2">
                  <button onClick={() => navigate("menu")} className="m3-button m3-button--tonal inline-flex">
                    <ArrowLeft size={16} aria-hidden="true" /> Add more dishes
                  </button>
                  <button onClick={() => navigate("reserve")} className="m3-button m3-button--outlined inline-flex">
                    <CalendarCheck size={16} aria-hidden="true" /> Prefer dining in? Book a table
                  </button>
                </div>
              </Reveal>
            </div>

            {/* Bill */}
            <Reveal delay={100}>
              <aside className="anim-clip m3-inverse-card sticky top-32 p-6 sm:p-7">
                <p className="lux-label-sm text-goldsoft">Request summary</p>
                <p className="mt-3 text-[13px] leading-relaxed text-paper/75">The restaurant must confirm the order, final price, taxes and delivery charges. Choose pay later or Razorpay at checkout when available.</p>
                {status !== "ready" && (
                  <p
                    role="status"
                    className={`mt-4 rounded-2xl bg-white/10 p-3 text-[13px] font-semibold text-paper${status === "loading" ? " shimmer-pill" : ""}`}
                  >
                    {status === "loading" ? "Loading the online menu…" : "Showing sample prices. Online ordering is unavailable."}
                  </p>
                )}
                {tooMany && <p role="alert" className="mt-4 rounded-2xl bg-white/10 p-3 text-[13px] font-semibold text-paper">A request can contain up to 50 dishes and 100 items total.</p>}
                <div className="mt-5 flex items-end justify-between border-t border-dashed border-white/20 pt-4">
                  <span className="text-[12px] font-bold tracking-[0.2em] text-paper/70 uppercase">Item subtotal</span>
                  <span className="font-display text-[32px] leading-none font-semibold">
                    <CountUpValue value={subtotal} format={formatPrice} initial={0} duration={1050} />
                  </span>
                </div>
                <button
                  onClick={() => setCheckoutOpen(true)}
                  data-dialog-return-focus
                  className="motion-cta m3-button m3-button--inverse group mt-6 flex w-full"
                >
                  <Bike size={17} /> Proceed to Checkout
                </button>
                {INFO.phoneConfirmed ? (
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
                ) : <p className="mt-4 text-center text-[11px] text-paper/70">Phone and WhatsApp number to be confirmed.</p>}
                <p className="mt-4 text-center text-[11.5px] leading-relaxed text-paper/70">
                  Restaurant: {INFO.addressShort}.<br />
                  {INFO.hoursConfirmed ? `Open daily · ${INFO.hoursLabel}` : "Opening hours to be confirmed"}
                </p>
              </aside>
            </Reveal>
          </div>
        )}

        {/* Suggestions */}
        {suggestions.length > 0 && (
          <div className="mt-16">
            <p className="lux-label text-golddeep">Complete the feast</p>
            <h2 className="mt-3 font-display text-3xl font-semibold sm:text-4xl">
              More to <em className="gold-text font-semibold">explore</em>
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
