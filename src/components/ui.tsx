import { useEffect, useRef, useState, type ReactNode } from "react";
import { Minus, Plus, Star } from "lucide-react";
import { formatPrice, type FoodItem } from "../data/menu";
import { useApp } from "../store/app";
import { cn } from "../utils/cn";

/* ------------------------------ Logo ------------------------------ */
export function LogoMark({ size = 44, dark = false }: { size?: number; dark?: boolean }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true" className="shrink-0">
      <circle cx="32" cy="32" r="30" fill={dark ? "#FAF6ED" : "#171208"} />
      <circle cx="32" cy="32" r="26.5" fill="none" stroke="#C6A15B" strokeWidth="1.3" />
      <circle cx="32" cy="32" r="23" fill="none" stroke="#C6A15B" strokeWidth="0.6" opacity="0.6" />
      <text
        x="32"
        y="41.5"
        textAnchor="middle"
        fontFamily="Fraunces, Georgia, serif"
        fontWeight="600"
        fontSize="27"
        fill="#C6A15B"
      >
        R
      </text>
      <circle cx="32" cy="13.5" r="1.4" fill="#C6A15B" />
      <circle cx="32" cy="50.5" r="1.4" fill="#C6A15B" />
    </svg>
  );
}

export function Logo({ dark = false, compact = false }: { dark?: boolean; compact?: boolean }) {
  const { goHome } = useApp();
  return (
    <button
      onClick={goHome}
      className="group flex shrink-0 items-center gap-2 text-left sm:gap-3"
      aria-label="Raaha Restaurant & Grill — home"
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
    <span className="inline-flex items-center gap-[2px]" aria-label={`Rated ${value} out of 5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          size={size}
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
  as: Tag = "div",
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
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
      className={cn("reveal", visible && "is-visible", className)}
      style={{ transitionDelay: `${delay}ms` }}
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
      <p className={cn("lux-label flex items-center gap-3", align === "center" && "justify-center", dark ? "text-goldsoft" : "text-golddeep")}>
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
        {title}{" "}
        {italic && <em className="gold-text font-semibold not-italic sm:italic">{italic}</em>}{" "}
        {after}
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
}: {
  qty: number;
  setQty: (n: number) => void;
  small?: boolean;
}) {
  const btn = cn(
    "flex items-center justify-center rounded-full bg-white text-ink shadow-sm transition hover:bg-cream active:scale-90",
    small ? "h-7 w-7" : "h-9 w-9"
  );
  return (
    <div
      className={cn(
        "inline-flex items-center gap-1 rounded-full bg-linen p-1",
        small ? "gap-0.5 p-0.5" : ""
      )}
    >
      <button className={btn} onClick={() => setQty(Math.max(0, qty - 1))} aria-label="Decrease quantity">
        <Minus size={small ? 13 : 15} />
      </button>
      <span className={cn("text-center font-bold tabular-nums", small ? "w-6 text-[13px]" : "w-8 text-[15px]")}>
        {qty}
      </span>
      <button className={btn} onClick={() => setQty(qty + 1)} aria-label="Increase quantity">
        <Plus size={small ? 13 : 15} />
      </button>
    </div>
  );
}

/* ------------------------------ Food card ------------------------------ */
export function FoodCard({ item, index = 0 }: { item: FoodItem; index?: number }) {
  const { navigate, addToCart } = useApp();
  return (
    <Reveal delay={Math.min(index, 6) * 60}>
      <article
        className="group relative cursor-pointer overflow-hidden rounded-[26px] bg-white shadow-card ring-1 ring-ink/5 transition-all duration-500 hover:-translate-y-1.5 hover:shadow-lux"
        onClick={() => navigate("food", item.id)}
        tabIndex={0}
        role="button"
        aria-label={`${item.name}, ${formatPrice(item.price)}. View details`}
        onKeyDown={(e) => {
          if (e.target !== e.currentTarget) return;
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            navigate("food", item.id);
          }
        }}
      >
        <div className="relative aspect-[4/3] overflow-hidden">
          <img
            src={item.image}
            alt={`${item.name} at Raaha Restaurant & Grill Madurai`}
            loading="lazy"
            decoding="async"
            className="img-warm h-full w-full object-cover transition-transform duration-[1200ms] ease-out group-hover:scale-110"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-ink/45 via-transparent to-transparent opacity-80" />
          <div className="absolute top-3 left-3 flex items-center gap-2">
            <VegMark veg={item.veg} />
            {item.tag && (
              <span className="rounded-full bg-ink/85 px-2.5 py-1 text-[9px] font-bold tracking-[0.18em] text-goldsoft uppercase backdrop-blur">
                {item.tag}
              </span>
            )}
          </div>
          <span className="absolute right-3 bottom-3 inline-flex items-center gap-1 rounded-full bg-white/95 px-2.5 py-1 text-xs font-extrabold text-ink shadow">
            <Star size={12} className="fill-gold text-gold" /> {item.rating.toFixed(1)}
          </span>
          <span className="absolute bottom-3 left-3 font-display text-lg font-semibold text-white drop-shadow">
            {formatPrice(item.price)}
          </span>
        </div>
        <div className="p-4 sm:p-5">
          <h3 className="font-display text-[19px] leading-snug font-semibold text-ink transition-colors group-hover:text-golddeep">
            {item.name}
          </h3>
          <p className="mt-1 line-clamp-2 min-h-[38px] text-[13px] leading-relaxed text-ink/60">
            {item.description}
          </p>
          <div className="mt-3.5 flex items-center justify-between">
            <span className="text-[11px] font-bold tracking-[0.14em] text-ink/45 uppercase">
              {item.time} · {item.serves}
            </span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                addToCart(item);
              }}
              className="rounded-full bg-ink px-4 py-2 text-[11px] font-bold tracking-[0.14em] text-paper uppercase transition-all hover:bg-golddeep hover:text-white active:scale-95"
              aria-label={`Add ${item.name} to cart`}
            >
              Add +
            </button>
          </div>
        </div>
      </article>
    </Reveal>
  );
}
