import { useCallback, useEffect, useId, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { Minus, Plus, Star } from "lucide-react";
import { formatPrice, type FoodItem } from "../data/menu";
import { useApp } from "../store/app";
import { cn } from "../utils/cn";
import { showFoodImageFallback } from "../utils/imageFallback";
import { useCardSpotlight } from "../utils/useCardSpotlight";
import { usePointerTilt } from "../utils/usePointerTilt";
import { launchCartFlight } from "../utils/cartFlight";

/* ------------------------------ Logo ------------------------------ */
export function LogoMark({ size = 44, dark = false }: { size?: number; dark?: boolean }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true" className="shrink-0">
      <circle cx="32" cy="32" r="30" fill={dark ? "#F7F1E6" : "#171208"} />
      <circle cx="32" cy="32" r="26.5" fill="none" stroke="#BD9440" strokeWidth="1.3" />
      <circle cx="32" cy="32" r="23" fill="none" stroke="#BD9440" strokeWidth="0.6" opacity="0.6" />
      <text
        x="32"
        y="41.5"
        textAnchor="middle"
        fontFamily="'Cormorant Garamond Variable', Georgia, serif"
        fontWeight="600"
        fontSize="27"
        fill="#BD9440"
      >
        R
      </text>
      <circle cx="32" cy="13.5" r="1.4" fill="#BD9440" />
      <circle cx="32" cy="50.5" r="1.4" fill="#BD9440" />
    </svg>
  );
}

export function Logo({ dark = false, compact = false }: { dark?: boolean; compact?: boolean }) {
  const { goHome } = useApp();
  return (
    <button
      onClick={goHome}
      className="group flex min-h-12 shrink-0 items-center gap-2 text-left sm:gap-3"
    >
      <LogoMark size={compact ? 36 : 46} dark={dark} />
      <span className="leading-none">
        <span
          className={cn(
            "block font-display text-[21px] font-semibold tracking-[0.14em] transition-colors sm:text-[24px] sm:tracking-[0.2em]",
            dark ? "text-paper" : "text-ink"
          )}
        >
          RAAHA
        </span>
        {!compact && (
          <span className={cn("lux-label-sm mt-1.5 block", dark ? "text-goldsoft" : "text-golddeep")}>
            Restaurant &amp; Grill · Madurai
          </span>
        )}
      </span>
      <span className="sr-only">Home</span>
    </button>
  );
}

/* ---------------------------- Veg marker ---------------------------- */
export function VegMark({ veg, className }: { veg: boolean; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex h-[18px] w-[18px] items-center justify-center rounded-[4px] border-[1.5px] bg-white shadow-sm",
        veg ? "border-leaf" : "border-maroon",
        className
      )}
      role="img"
      aria-label={veg ? "Vegetarian" : "Non-vegetarian"}
      title={veg ? "Vegetarian" : "Non-vegetarian"}
    >
      <span className={cn("h-[8px] w-[8px] rounded-full", veg ? "bg-leaf" : "bg-maroon")} />
    </span>
  );
}

/* ------------------------------ Stars ------------------------------ */
export function Stars({ value, size = 13 }: { value: number; size?: number }) {
  return (
    <span className="inline-flex items-center gap-[2px]" role="img" aria-label={`Rated ${value} out of 5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          size={size}
          aria-hidden="true"
          className={
            i <= Math.round(value) ? "fill-gold text-gold" : "fill-sand text-sand"
          }
        />
      ))}
    </span>
  );
}

/* --------------------------- Reveal on scroll --------------------------- */
export function Reveal({
  children,
  className,
  delay = 0,
  stagger,
  as: Tag = "div",
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  /** Arrival order within a list; replaces `delay` with a stepped animation. */
  stagger?: number;
  as?: "div" | "section" | "article" | "li";
}) {
  const ref = useRef<HTMLElement | null>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") {
      setVisible(true);
      return;
    }
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            setVisible(true);
            obs.unobserve(e.target);
          }
        });
      },
      { threshold: 0.12 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return (
    <Tag
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ref={ref as any}
      className={cn("reveal", stagger !== undefined && "stagger-item", visible && "is-visible", className)}
      style={
        stagger === undefined
          ? { transitionDelay: `${delay}ms` }
          : ({ "--stagger-index": Math.max(0, Math.min(14, stagger)) } as CSSProperties)
      }
    >
      {children}
    </Tag>
  );
}

/* --------------------------- Section heading --------------------------- */
export function SectionHead({
  eyebrow,
  title,
  italic,
  after,
  align = "center",
  dark = false,
  desc,
}: {
  eyebrow: string;
  title?: string;
  italic?: string;
  after?: string;
  align?: "center" | "left";
  dark?: boolean;
  desc?: string;
}) {
  return (
    <Reveal className={cn("max-w-2xl", align === "center" ? "mx-auto text-center" : "text-left")}>
      <p className={cn("lux-label anim-letters flex items-center gap-3", align === "center" && "justify-center", dark ? "text-goldsoft" : "text-golddeep")}>
        <span className="hidden h-px w-8 bg-gold/60 sm:block" aria-hidden="true" />
        {eyebrow}
        <span className="hidden h-px w-8 bg-gold/60 sm:block" aria-hidden="true" />
      </p>
      <h2
        className={cn(
          "mt-4 font-display text-4xl leading-[1.08] font-medium tracking-tight text-balance sm:text-5xl",
          dark ? "text-paper" : "text-ink"
        )}
      >
        {/* The printed line slides out from behind its own mask on arrival. */}
        <span className="mask-line">
          <span className="mask-line__inner">
            {title}{" "}
            {italic && <em className="section-head__accent gold-text font-semibold not-italic sm:italic">{italic}</em>}{" "}
            {after}
          </span>
        </span>
      </h2>
      {desc && (
        <p className={cn("mt-4 text-[15px] leading-relaxed", dark ? "text-paper/70" : "text-ink/65")}>
          {desc}
        </p>
      )}
    </Reveal>
  );
}

/* ----------------------------- Qty stepper ----------------------------- */
export function QtyStepper({
  qty,
  setQty,
  small = false,
  min = 0,
}: {
  qty: number;
  setQty: (n: number) => void;
  small?: boolean;
  min?: number;
}) {
  const btn = "m3-icon-button flex h-12 w-12 items-center justify-center rounded-full bg-white text-ink shadow-sm transition hover:bg-cream active:scale-95 disabled:cursor-not-allowed disabled:opacity-40";
  return (
    <div className="inline-flex items-center rounded-full bg-linen p-1" role="group" aria-label="Quantity">
      <button type="button" className={btn} onClick={() => setQty(Math.max(min, qty - 1))} disabled={qty <= min} aria-label="Decrease quantity">
        <Minus size={small ? 14 : 16} aria-hidden="true" />
      </button>
      <span aria-live="polite" aria-atomic="true" className={cn("text-center font-bold text-ink tabular-nums", small ? "w-6 text-[13px]" : "w-8 text-[15px]")}>
        <span key={qty} className="quantity-value">{qty}</span>
      </span>
      <button type="button" className={btn} onClick={() => setQty(Math.min(20, qty + 1))} disabled={qty >= 20} aria-label="Increase quantity">
        <Plus size={small ? 14 : 16} aria-hidden="true" />
      </button>
    </div>
  );
}

/* ------------------------------ Food card ------------------------------ */
export function FoodCard({ item, index = 0 }: { item: FoodItem; index?: number }) {
  const { navigate, addToCart } = useApp();
  const spotlightRef = useCardSpotlight();
  const tiltRef = usePointerTilt<HTMLElement>({ maxDegrees: 3.5 });
  const descriptionId = useId();
  // Both effects listen on the card itself, because its stretched detail button
  // covers the artwork and would swallow pointer events from a sibling layer.
  const cardRef = useCallback(
    (node: HTMLElement | null) => {
      spotlightRef.current = node;
      tiltRef.current = node;
    },
    [spotlightRef, tiltRef]
  );
  return (
    <Reveal delay={Math.min(index, 6) * 60}>
      <article ref={cardRef} className="food-card m3-card m3-card--interactive group relative overflow-hidden transition-shadow duration-300">
        {/* The stretched detail button and add button are siblings, not nested controls. */}
        <button
          type="button"
          className="food-card__link absolute inset-0 z-10 rounded-[28px]"
          onClick={() => navigate("food", item.id)}
          aria-label={`${item.name}, ${formatPrice(item.price)}. View details`}
          aria-describedby={descriptionId}
        />
        <div className="relative aspect-[4/5] overflow-hidden">
          {/* Only this artwork wrapper leans toward the pointer; the stretched
              detail button above is a sibling and never moves. */}
          <div className="tilt-art h-full w-full" data-tilt-layer>
            <img
              src={item.image}
              alt={`Representative photograph of ${item.name}`}
              loading="lazy"
              decoding="async"
              onError={showFoodImageFallback}
              className="img-warm h-full w-full object-cover transition-transform duration-[1200ms] ease-out group-hover:scale-110"
            />
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-ink/45 via-transparent to-transparent opacity-80" />
          <div className="food-card__sheen" aria-hidden="true" />
          <span className="food-card__spotlight" aria-hidden="true" />
          <div className="absolute top-3 left-3 flex items-center gap-2">
            <VegMark veg={item.veg} />
            {item.tag && (
              <span className="rounded-full bg-ink/85 px-2.5 py-1 text-[9px] font-bold tracking-[0.18em] text-goldsoft uppercase backdrop-blur">
                {item.tag}
              </span>
            )}
          </div>
          <span role="img" aria-label={`Sample rating ${item.rating.toFixed(1)} out of 5`} className="absolute right-3 bottom-3 inline-flex items-center gap-1 rounded-full bg-white/95 px-2.5 py-1 text-xs font-extrabold text-ink shadow">
            <Star size={12} className="fill-gold text-gold" aria-hidden="true" /> {item.rating.toFixed(1)}
          </span>
          <span className="absolute bottom-3 left-3 font-display text-lg font-semibold text-white drop-shadow">
            {formatPrice(item.price)}
          </span>
        </div>
        <div className="px-4 pt-4 sm:px-5 sm:pt-5">
          <h3 className="font-display text-[19px] leading-snug font-semibold text-ink transition-colors group-hover:text-maroon">{item.name}</h3>
          <p id={descriptionId} className="mt-1 line-clamp-2 min-h-[38px] text-[13px] leading-relaxed text-ink/70">{item.description}</p>
        </div>
        <div className="flex items-center justify-between gap-2 p-4 pt-3 sm:px-5 sm:pb-5">
          <span className="text-[11px] font-bold tracking-[0.1em] text-ink/70 uppercase">{item.time} · {item.serves}</span>
          <button
            type="button"
            onClick={(event) => {
              launchCartFlight(event.currentTarget);
              addToCart(item);
            }}
            className="motion-cta m3-button m3-button--tonal relative z-20 inline-flex shrink-0 px-4"
            aria-label={`Add ${item.name} to cart`}
          >
            <span className="motion-cta__glow" aria-hidden="true" />
            Add <Plus size={16} aria-hidden="true" />
          </button>
        </div>
      </article>
    </Reveal>
  );
}
