import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  BadgeCheck,
  Bike,
  ChevronRight,
  Clock,
  Flame,
  Leaf,
  Mail,
  MapPin,
  MessageCircle,
  Navigation,
  Phone,
  ShoppingBag,
  Users,
  Wheat,
} from "lucide-react";
import { INFO, formatPrice } from "../data/menu";
import { useMenu } from "../store/menu";
import { useApp } from "../store/app";
import { cn } from "../utils/cn";
import { showFoodImageFallback } from "../utils/imageFallback";
import { launchCartFlight } from "../utils/cartFlight";
import { usePointerTilt } from "../utils/usePointerTilt";
import { CountUpValue } from "./CountUpValue";
import { SteamField } from "./SteamField";
import { FoodCard, QtyStepper, Reveal, VegMark } from "./ui";
import { RateStars } from "./StarRating";
import { DishReviews } from "./DishReviews";

export function FoodPage({ itemId }: { itemId: string }) {
  const { navigate, addToCart, setCheckoutOpen } = useApp();
  const { menu: MENU, categoryById, itemById, itemsByCategory, status } = useMenu();
  const [qty, setQty] = useState(1);
  const item = itemById(itemId);
  // Decorative lean of the dish photograph; declared before the early return so
  // the hook order never changes between dishes.
  const photoTiltRef = usePointerTilt<HTMLDivElement>({ maxDegrees: 3 });

  useEffect(() => setQty(1), [itemId]);

  const sameCategory = useMemo(
    () => (item ? itemsByCategory(item.category).filter((dish) => dish.id !== item.id).slice(0, 4) : []),
    [item, itemsByCategory]
  );
  const related = useMemo(
    () => (item ? MENU.filter((dish) => dish.category !== item.category && dish.tag).slice(0, 4) : []),
    [item, MENU]
  );

  if (!item) {
    return (
      <main className="mx-auto max-w-3xl px-4 pt-44 pb-28 text-center">
        <p className="font-display text-4xl font-semibold">That dish has left the kitchen.</p>
        <p className="mt-3 text-ink/60">We couldn’t find this item — explore the full menu instead.</p>
        <button
          onClick={() => navigate("menu")}
          className="mt-7 rounded-full bg-ink px-7 py-3.5 text-[11px] font-bold tracking-[0.2em] text-paper uppercase transition hover:bg-golddeep active:scale-95"
        >
          View Menu
        </button>
      </main>
    );
  }

  const cat = categoryById(item.category);

  const openCategory = () => {
    navigate("menu", cat.id);
  };

  const orderNow = () => {
    addToCart(item, qty, true);
    navigate("cart");
    window.setTimeout(() => setCheckoutOpen(true), 60);
  };

  return (
    <main className="pt-[var(--site-header-height)]">
      {/* Breadcrumb */}
      <div className="mx-auto max-w-7xl px-4 pt-6 sm:px-6 lg:px-8">
        <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1.5 text-[11px] font-bold tracking-[0.18em] text-ink/70 uppercase">
          <button onClick={() => navigate("home")} className="inline-flex min-h-12 min-w-12 items-center transition hover:text-golddeep">Home</button>
          <ChevronRight size={13} aria-hidden="true" />
          <button onClick={() => navigate("menu")} className="inline-flex min-h-12 min-w-12 items-center transition hover:text-golddeep">Menu</button>
          <ChevronRight size={13} aria-hidden="true" />
          <button onClick={openCategory} className="inline-flex min-h-12 items-center transition hover:text-golddeep">{cat.name}</button>
          <ChevronRight size={13} />
          <span className="text-golddeep" aria-current="page">{item.name}</span>
        </nav>
      </div>

      {/* Detail */}
      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
        <div className="grid gap-10 lg:grid-cols-2 lg:gap-14">
          {/* Left — image */}
          <div className="relative">
            <div className="sticky top-32">
              <div ref={photoTiltRef} className="relative overflow-hidden rounded-[34px] shadow-lux ring-1 ring-ink/10">
                {/* Only the artwork leans and steams; the badges, gradient and
                    the page's controls stay exactly where they are. */}
                <div className="tilt-art" data-tilt-layer>
                  <img
                    src={item.image}
                    alt={`Food photograph representing ${item.name} from ${cat.name}`}
                    className="food-detail__photo img-warm aspect-[4/3] w-full object-cover"
                    loading="eager"
                    onError={showFoodImageFallback}
                  />
                  <SteamField />
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-ink/50 via-transparent to-transparent" />
                <span className="absolute top-4 right-4 rounded-full bg-ink/70 px-3 py-2 text-[9px] font-bold tracking-[0.14em] text-white uppercase backdrop-blur">Representative photo</span>
                <div className="absolute top-4 left-4 flex gap-2">
                  <span className="flex items-center gap-2 rounded-full bg-white/95 py-1.5 pr-3 pl-1.5 shadow backdrop-blur">
                    <VegMark veg={item.veg} />
                    <span className="text-[11px] font-bold tracking-[0.14em] text-ink uppercase">
                      {item.veg ? "Pure Veg" : "Non-Veg"}
                    </span>
                  </span>
                </div>
                <div className="absolute right-5 bottom-5 left-5">
                  <div className="text-white">
                    <p className="text-[10px] font-bold tracking-[0.28em] text-goldsoft uppercase">{cat.tagline}</p>
                    <p className="mt-1 font-display text-2xl font-semibold drop-shadow">{cat.name}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right — details */}
          <div>
            <div>
              <p className="lux-label flex items-center gap-2.5 text-golddeep">
                <button onClick={openCategory} className="inline-flex min-h-12 items-center transition hover:text-ink">
                  {cat.name}
                </button>
                <span className="h-px w-8 bg-gold/60" aria-hidden="true" />
                <span className="text-ink/70">{item.serves}</span>
              </p>
              <h1 className="food-detail__title mt-4 font-display text-[42px] leading-[1.04] font-semibold tracking-tight text-balance sm:text-5xl lg:text-[56px]">
                {item.name}
              </h1>
              <p className="food-detail__description mt-4 text-[16px] leading-relaxed text-ink/70">{item.description}</p>
              <div className="food-detail__rate mt-6 rounded-3xl bg-cream/70 px-5 py-4 ring-1 ring-ink/10">
                <p className="lux-label text-golddeep">Rate this dish</p>
                <div className="mt-2">
                  <RateStars
                    storageKey={`dish:${item.id}`}
                    seedSum={item.rating * item.ratingsCount}
                    seedCount={item.ratingsCount}
                    noun={item.name}
                  />
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
                  document.getElementById("dish-reviews")?.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth" });
                  document.getElementById("dish-reviews-title")?.focus({ preventScroll: true });
                }}
                className="mt-2 inline-flex min-h-12 items-center gap-2 text-[12px] font-bold text-golddeep transition hover:text-maroon"
              >
                <MessageCircle size={15} aria-hidden="true" /> Read or write a review
              </button>
            </div>

            {/* Price + actions */}
            <div>
              <div className="m3-inverse-card mt-9 p-6 sm:p-7">
                <div className="flex flex-wrap items-end justify-between gap-4">
                  <div>
                    <p className="text-[10px] font-bold tracking-[0.26em] text-paper/70 uppercase">Price</p>
                    <p className="mt-1 font-display text-[40px] leading-none font-semibold">
                      {formatPrice(item.price)}
                      <span className="ml-2.5 align-middle font-sans text-[12px] font-semibold text-paper/70">
                        <CountUpValue value={item.price * qty} format={formatPrice} duration={700} /> for {qty} · charges to be confirmed
                      </span>
                    </p>
                  </div>
                  <div>
                    <p className="mb-2 text-[10px] font-bold tracking-[0.26em] text-paper/70 uppercase">Quantity</p>
                    <QtyStepper qty={qty} min={1} setQty={setQty} />
                  </div>
                </div>
                <div className="mt-6 grid gap-3 sm:grid-cols-2">
                  <button
                    onClick={(event) => {
                      launchCartFlight(event.currentTarget);
                      addToCart(item, qty);
                    }}
                    className="motion-cta m3-button m3-button--inverse-outlined inline-flex"
                  >
                    <span className="motion-cta__glow" aria-hidden="true" />
                    <ShoppingBag size={17} /> Add to Cart
                  </button>
                  <button
                    onClick={orderNow}
                    aria-describedby="checkout-preview-note"
                    className="motion-cta m3-button m3-button--inverse inline-flex"
                  >
                    <span className="motion-cta__glow" aria-hidden="true" />
                    <Bike size={17} /> Order Now
                  </button>
                </div>
                <p id="checkout-preview-note" className="mt-4 flex items-center gap-2 text-[12px] text-paper/70">
                  <BadgeCheck size={14} className="shrink-0 text-gold" />
                  {status === "ready" ? "Send a request for restaurant review; choose payment at checkout." : status === "loading" ? "Loading the online menu before requests can be sent." : "Sample menu shown. Online ordering is unavailable."}
                </p>
              </div>
            </div>

            {/* Quality & facts */}
            <div>
              <div className="mt-7 grid grid-cols-2 gap-3 sm:grid-cols-4">
                {[
                  { icon: Clock, label: "Prep Time", value: item.time },
                  { icon: Users, label: "Serves", value: item.serves.replace("Serves ", "") },
                  { icon: Flame, label: "Spice Level", value: item.spice },
                  { icon: Wheat, label: "Energy", value: item.calories },
                ].map(({ icon: Icon, label, value }) => (
                  <div key={label} className="m3-card m3-card--tonal rounded-3xl p-4">
                    <Icon size={17} className="text-golddeep" />
                    <p className="mt-2.5 text-[10px] font-bold tracking-[0.18em] text-ink/70 uppercase">{label}</p>
                    <p className="mt-0.5 font-display text-[17px] font-semibold">{value}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Ingredients */}
            <div>
              <h2 className="lux-label-sm mt-8 flex items-center gap-2 text-golddeep">
                <Leaf size={14} /> Ingredients &amp; Quality
              </h2>
              <p className="mt-2.5 text-[13.5px] leading-relaxed text-ink/70">
                Ingredients may vary. Please confirm allergens or preparation preferences with the restaurant.
              </p>
              <ul className="mt-3.5 flex flex-wrap gap-2">
                {item.ingredients.map((ing) => (
                  <li
                    key={ing}
                    className="rounded-full bg-white px-4 py-2 text-[12.5px] font-bold text-ink/70 shadow-sm ring-1 ring-ink/8"
                  >
                    {ing}
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <button
                onClick={openCategory}
                className="mt-4 inline-flex min-h-12 items-center gap-2 text-[12px] font-bold tracking-[0.18em] text-golddeep uppercase transition hover:text-ink"
              >
                <ArrowLeft size={15} /> Back to {cat.name}
              </button>
            </div>
          </div>
        </div>
      </section>

      <DishReviews key={item.id} item={item} />

      {/* More from this category */}
      <section className="bg-cream/60 py-16 lg:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="lux-label text-golddeep">From the same kitchen chapter</p>
              <h2 className="mt-3 font-display text-3xl font-semibold sm:text-4xl">
                More from <em className="gold-text font-semibold">{cat.name}</em>
              </h2>
            </div>
            <button
              onClick={openCategory}
              className="m3-button m3-button--tonal inline-flex"
            >
              View {cat.name} menu <ChevronRight size={14} />
            </button>
          </div>
          <div className="mt-9 grid grid-cols-1 gap-5 min-[480px]:grid-cols-2 lg:grid-cols-4">
            {sameCategory.map((dish, index) => (
              <FoodCard key={dish.id} item={dish} index={index} />
            ))}
          </div>
        </div>
      </section>

      {/* Other dishes */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
        <p className="lux-label text-golddeep">You may also like</p>
        <h2 className="mt-3 font-display text-3xl font-semibold sm:text-4xl">
          Explore beyond <em className="gold-text font-semibold">{cat.name}</em>
        </h2>
        <div className="mt-9 grid grid-cols-1 gap-5 min-[480px]:grid-cols-2 lg:grid-cols-4">
          {related.map((dish, index) => (
            <FoodCard key={dish.id} item={dish} index={index} />
          ))}
        </div>
      </section>

      {/* Contact strip */}
      <section className="mx-auto max-w-7xl px-4 pb-24 sm:px-6 lg:px-8">
        <Reveal>
          <div className="m3-inverse-card relative overflow-hidden px-6 py-10 sm:px-10">
            <div className="dot-grid pointer-events-none absolute inset-0 opacity-50" aria-hidden="true" />
            <div className="relative flex flex-col items-start justify-between gap-7 lg:flex-row lg:items-center">
              <div>
                <p className="lux-label-sm text-goldsoft">Need Help Ordering?</p>
                <h2 className="mt-2.5 font-display text-3xl leading-tight font-semibold sm:text-4xl">
                  Talk to the Raaha kitchen directly.
                </h2>
                <p className="mt-2 flex items-center gap-2 text-[14px] text-paper/65">
                  <MapPin size={15} className="text-gold" /> {INFO.addressShort}
                </p>
                <p className="mt-2 flex items-center gap-2 text-[14px] text-paper/65">
                  <Clock size={15} className="text-gold" /> {INFO.hoursConfirmed ? `Daily · ${INFO.hoursLabel}` : "Opening hours to be confirmed"}
                </p>
                <a href={`mailto:${INFO.email}`} className="mt-2 inline-flex min-h-12 items-center gap-2 text-[14px] text-paper/65 transition hover:text-paper">
                  <Mail size={15} className="text-gold" aria-hidden="true" /> {INFO.email}
                </a>
              </div>
              <div className="flex flex-wrap gap-3">
                {INFO.phoneConfirmed ? (
                  <a
                    href={INFO.phoneHref}
                    className="inline-flex items-center gap-2.5 rounded-full bg-gold px-6 py-3.5 text-[11px] font-bold tracking-[0.18em] text-ink uppercase transition hover:bg-goldsoft active:scale-95"
                  >
                    <Phone size={15} /> {INFO.phoneDisplay}
                  </a>
                ) : (
                  <span className="inline-flex items-center gap-2.5 rounded-full bg-white/10 px-6 py-3.5 text-[11px] font-bold tracking-[0.12em] text-paper/75 uppercase">
                    <Phone size={15} className="text-gold" /> Phone number to be confirmed
                  </span>
                )}
                <a
                  href={INFO.mapsLink}
                  target="_blank"
                  rel="noreferrer"
                  className="m3-button m3-button--inverse-outlined inline-flex"
                >
                  <Navigation size={15} /> Directions
                </a>
                <button
                  onClick={() => navigate("reserve")}
                  className={cn(
                    "inline-flex items-center gap-2.5 rounded-full px-6 py-3.5 text-[11px] font-bold tracking-[0.18em] uppercase transition active:scale-95",
                    "text-goldsoft hover:text-gold"
                  )}
                >
                  Book a Table
                </button>
              </div>
            </div>
          </div>
        </Reveal>
      </section>
    </main>
  );
}
