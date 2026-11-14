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
  Navigation,
  Phone,
  ShoppingBag,
  Users,
  Wheat,
} from "lucide-react";
import { INFO, MENU, categoryById, formatPrice, itemById, itemsByCategory } from "../data/menu";
import { useApp } from "../store/app";
import { cn } from "../utils/cn";
import { FoodCard, QtyStepper, Reveal, VegMark } from "./ui";

export function FoodPage({ itemId }: { itemId: string }) {
  const { navigate, addToCart, setCheckoutOpen } = useApp();
  const [qty, setQty] = useState(1);
  const item = itemById(itemId);

  useEffect(() => setQty(1), [itemId]);

  const sameCategory = useMemo(
    () => (item ? itemsByCategory(item.category).filter((dish) => dish.id !== item.id).slice(0, 4) : []),
    [item]
  );
  const related = useMemo(
    () => (item ? MENU.filter((dish) => dish.category !== item.category && dish.tag).slice(0, 4) : []),
    [item]
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

  const orderNow = () => {
    addToCart(item, qty, true);
    navigate("cart");
    window.setTimeout(() => setCheckoutOpen(true), 60);
  };

  return (
    <main className="pt-[var(--site-header-height)]">
      {/* Breadcrumb */}
      <div className="mx-auto max-w-7xl px-4 pt-6 sm:px-6 lg:px-8">
        <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1.5 text-[11px] font-bold tracking-[0.18em] text-ink/45 uppercase">
          <button onClick={() => navigate("home")} className="transition hover:text-golddeep">Home</button>
          <ChevronRight size={13} />
          <button onClick={() => navigate("menu")} className="transition hover:text-golddeep">Menu</button>
          <ChevronRight size={13} />
          <button onClick={() => navigate("category", cat.id)} className="transition hover:text-golddeep">{cat.name}</button>
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
              <div className="relative overflow-hidden rounded-[34px] shadow-lux ring-1 ring-ink/10">
                <img
                  src={item.image}
                  alt={`Food photograph representing ${item.name} from ${cat.name}`}
                  className="img-warm aspect-[4/3] w-full object-cover"
                  loading="eager"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-ink/50 via-transparent to-transparent" />
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
                <button onClick={() => navigate("category", cat.id)} className="transition hover:text-ink">
                  {cat.name}
                </button>
                <span className="h-px w-8 bg-gold/60" aria-hidden="true" />
                <span className="text-ink/40">{item.serves}</span>
              </p>
              <h1 className="mt-4 font-display text-[42px] leading-[1.04] font-semibold tracking-tight text-balance sm:text-5xl lg:text-[56px]">
                {item.name}
              </h1>
              <p className="mt-4 text-[16px] leading-relaxed text-ink/70">{item.description}</p>
            </div>

            {/* Price + actions */}
            <div>
              <div className="mt-9 rounded-[28px] bg-ink p-6 text-paper shadow-lux sm:p-7">
                <div className="flex flex-wrap items-end justify-between gap-4">
                  <div>
                    <p className="text-[10px] font-bold tracking-[0.26em] text-paper/50 uppercase">Price</p>
                    <p className="mt-1 font-display text-[40px] leading-none font-semibold">
                      {formatPrice(item.price)}
                      <span className="ml-2.5 align-middle font-sans text-[12px] font-semibold text-paper/50">
                        {formatPrice(item.price * qty)} for {qty} · GST extra at checkout
                      </span>
                    </p>
                  </div>
                  <div>
                    <p className="mb-2 text-[10px] font-bold tracking-[0.26em] text-paper/50 uppercase">Quantity</p>
                    <QtyStepper qty={qty} setQty={(n) => setQty(Math.max(1, n))} />
                  </div>
                </div>
                <div className="mt-6 grid gap-3 sm:grid-cols-2">
                  <button
                    onClick={() => addToCart(item, qty)}
                    className="inline-flex items-center justify-center gap-2.5 rounded-full bg-white/10 py-4 text-[12px] font-bold tracking-[0.2em] text-paper uppercase ring-1 ring-white/25 transition hover:bg-white/20 active:scale-[0.98]"
                  >
                    <ShoppingBag size={17} /> Add to Cart
                  </button>
                  <button
                    onClick={orderNow}
                    className="inline-flex items-center justify-center gap-2.5 rounded-full bg-gold py-4 text-[12px] font-bold tracking-[0.2em] text-ink uppercase transition hover:bg-goldsoft active:scale-[0.98]"
                  >
                    <Bike size={17} /> Order Now
                  </button>
                </div>
                <p className="mt-4 flex items-center gap-2 text-[12px] text-paper/55">
                  <BadgeCheck size={14} className="shrink-0 text-gold" />
                  Free home delivery above ₹499 · Pay by UPI, card or cash
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
                  <div key={label} className="rounded-3xl bg-cream/80 p-4 ring-1 ring-ink/5">
                    <Icon size={17} className="text-golddeep" />
                    <p className="mt-2.5 text-[10px] font-bold tracking-[0.18em] text-ink/45 uppercase">{label}</p>
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
              <p className="mt-2.5 text-[13.5px] leading-relaxed text-ink/55">
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
                onClick={() => navigate("category", cat.id)}
                className="mt-6 inline-flex items-center gap-2 text-[12px] font-bold tracking-[0.18em] text-golddeep uppercase transition hover:text-ink"
              >
                <ArrowLeft size={15} /> Back to {cat.name}
              </button>
            </div>
          </div>
        </div>
      </section>

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
              onClick={() => navigate("category", cat.id)}
              className="inline-flex items-center gap-2 rounded-full bg-ink px-6 py-3 text-[11px] font-bold tracking-[0.18em] text-paper uppercase transition hover:bg-golddeep active:scale-95"
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
          <div className="relative overflow-hidden rounded-[32px] bg-ink px-6 py-10 text-paper shadow-lux sm:px-10">
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
                  <Clock size={15} className="text-gold" /> Daily · {INFO.hoursLabel}
                </p>
                <a href={`mailto:${INFO.email}`} className="mt-2 inline-flex items-center gap-2 text-[14px] text-paper/65 transition hover:text-paper">
                  <Mail size={15} className="text-gold" /> {INFO.email}
                </a>
              </div>
              <div className="flex flex-wrap gap-3">
                <a
                  href={INFO.phoneHref}
                  className="inline-flex items-center gap-2.5 rounded-full bg-gold px-6 py-3.5 text-[11px] font-bold tracking-[0.18em] text-ink uppercase transition hover:bg-goldsoft active:scale-95"
                >
                  <Phone size={15} /> {INFO.phoneDisplay}
                </a>
                <a
                  href={INFO.mapsLink}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2.5 rounded-full bg-white/10 px-6 py-3.5 text-[11px] font-bold tracking-[0.18em] text-paper uppercase ring-1 ring-white/25 transition hover:bg-white/20 active:scale-95"
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
