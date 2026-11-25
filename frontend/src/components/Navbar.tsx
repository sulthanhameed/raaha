import { useEffect, useState } from "react";
import {
  ArrowRight,
  Phone,
  Search,
  ShoppingBag,
  User,
} from "lucide-react";
import { INFO } from "../data/menu";
import { useApp, useOpenNow, type Page } from "../store/app";
import { cn } from "../utils/cn";
import { CART_ARRIVAL_EVENT } from "../utils/cartFlight";
import { Logo } from "./ui";
import { ScrollProgress } from "./ScrollProgress";

const LINKS: { page: Page; label: string }[] = [
  { page: "home", label: "Home" },
  { page: "menu", label: "Menu" },
  { page: "about", label: "About" },
  { page: "services", label: "Services" },
  { page: "reserve", label: "Reserve" },
];

function IconBtn({
  label,
  onClick,
  children,
  badge,
  className,
  cartTarget = false,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
  badge?: number;
  className?: string;
  /** Marks the control a decorative "added to cart" flight lands on. */
  cartTarget?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      data-cart-target={cartTarget ? "true" : undefined}
      className={cn(
        "site-nav-icon m3-icon-button relative flex h-12 w-12 items-center justify-center rounded-full text-ink transition-colors active:scale-95",
        className
      )}
    >
      {children}
      {badge !== undefined && badge > 0 && (
        <span key={badge} aria-hidden="true" className="site-cart-badge absolute -top-0.5 -right-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-maroon px-1 text-[10px] font-extrabold text-white shadow">
          {badge}
        </span>
      )}
    </button>
  );
}

export function Navbar() {
  const { route, navigate, cartCount, setSearchOpen, setAccountOpen, user, activeOrder } = useApp();
  const { open } = useOpenNow();
  const [scrolled, setScrolled] = useState(false);
  // Decorative landing ring after an "added to cart" flight reaches the button.
  const [cartArrival, setCartArrival] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const onArrival = () => {
      // Restart the ring even when several dishes land in quick succession.
      setCartArrival(false);
      window.requestAnimationFrame(() => window.requestAnimationFrame(() => setCartArrival(true)));
    };
    window.addEventListener(CART_ARRIVAL_EVENT, onArrival);
    return () => window.removeEventListener(CART_ARRIVAL_EVENT, onArrival);
  }, []);

  useEffect(() => {
    if (!cartArrival) return;
    // Long enough for the ring's own 950ms sweep to finish after the slower
    // flight lands, so the acknowledgement is never cut short.
    const timer = window.setTimeout(() => setCartArrival(false), 1150);
    return () => window.clearTimeout(timer);
  }, [cartArrival]);

  const active = (p: Page) =>
    route.page === p || (p === "menu" && route.page === "food");

  return (
    <>
      <div className="fixed inset-x-0 top-0 z-50">
        <div className="flex h-7 items-center justify-center gap-2 bg-ink px-2 text-center">
          {activeOrder ? (
            <button onClick={() => navigate("tracking")} className="inline-flex max-w-full items-center gap-2 text-[9px] font-bold tracking-[0.12em] text-goldsoft uppercase transition hover:text-paper sm:text-[10px] sm:tracking-[0.2em]">
              <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-gold" />
              <span className="truncate">Request {activeOrder.id.slice(0, 8)} · Route preview</span>
              <ArrowRight size={11} className="shrink-0" />
            </button>
          ) : (
            <>
              <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", !INFO.hoursConfirmed ? "bg-gold" : open ? "animate-pulse-dot bg-green-400" : "bg-red-400")} />
              <p className="truncate text-[9px] font-bold tracking-[0.12em] text-paper/90 uppercase sm:text-[10px] sm:tracking-[0.22em]">
                {INFO.hoursConfirmed ? `${open ? "Open Now" : "Currently Closed"} · ${INFO.hoursLabel}` : "Opening hours to be confirmed"}
                <span className="hidden sm:inline"> · Gokhale Road, Madurai</span>
              </p>
              {INFO.phoneConfirmed && (
                <a
                  href={INFO.phoneHref}
                  className="ml-1 hidden shrink-0 items-center gap-1 text-[10px] font-bold tracking-[0.2em] text-goldsoft uppercase transition hover:text-gold lg:inline-flex"
                >
                  <Phone size={10} /> Call Us
                </a>
              )}
            </>
          )}
        </div>

        <header
          className={cn(
            "site-header-surface border-b border-ink/10 transition-shadow duration-300",
            scrolled
              ? "shadow-[0_12px_32px_-18px_rgba(23,18,8,0.35)]"
              : "shadow-[0_4px_14px_-12px_rgba(23,18,8,0.2)]"
          )}
        >
          <div className="mx-auto flex h-[68px] max-w-7xl items-center justify-between gap-1 px-3 sm:px-6 md:h-[72px] md:gap-3 lg:px-8">
            <Logo compact />

            <nav className="hidden items-center gap-0 md:flex lg:gap-1" aria-label="Primary navigation">
              {LINKS.map((l) => (
                <button
                  key={l.page}
                  onClick={() => navigate(l.page)}
                  aria-current={active(l.page) ? "page" : undefined}
                  className={cn(
                    "site-nav-link relative inline-flex min-h-12 items-center justify-center whitespace-nowrap rounded-full px-3 py-2.5 text-[11px] font-bold tracking-[0.12em] uppercase transition-colors lg:px-4 lg:text-[12px] lg:tracking-[0.18em] xl:px-5",
                    l.page === "reserve" && "xl:hidden",
                    active(l.page) ? "text-maroon" : "text-ink/80 hover:bg-cream hover:text-ink"
                  )}
                >
                  {l.label}
                  <span className="site-nav-underline absolute inset-x-3 -bottom-0.5 h-[2px] rounded-full bg-maroon lg:inset-x-4" aria-hidden="true" />
                </button>
              ))}
            </nav>

            <div className="flex shrink-0 items-center gap-0 sm:gap-1">
              <IconBtn label="Search dishes" onClick={() => setSearchOpen(true)}>
                <Search size={20} strokeWidth={2.2} />
              </IconBtn>
              <IconBtn label={user ? `Account of ${user.name}` : "Your account"} onClick={() => setAccountOpen(true)}>
                {user ? (
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gold font-display text-[13px] font-bold text-ink">
                    {user.name.charAt(0).toUpperCase()}
                  </span>
                ) : (
                  <User size={20} strokeWidth={2.2} />
                )}
              </IconBtn>
              <IconBtn
                label={`Cart, ${cartCount} items`}
                onClick={() => navigate("cart")}
                badge={cartCount}
                cartTarget
                className={cartArrival ? "site-cart-arrival" : undefined}
              >
                <ShoppingBag size={20} strokeWidth={2.2} />
              </IconBtn>
              <button
                onClick={() => navigate("reserve")}
                aria-current={active("reserve") ? "page" : undefined}
                className="motion-cta m3-button m3-button--filled ml-1.5 hidden whitespace-nowrap xl:inline-flex"
              >
                <span className="motion-cta__glow" aria-hidden="true" />
                Book a Table
              </button>
            </div>
          </div>
        </header>

        <nav
          className="site-header-surface no-scrollbar flex h-12 items-center justify-between overflow-x-auto border-b border-ink/10 px-2 shadow-sm md:hidden"
          aria-label="Mobile navigation"
        >
          {LINKS.map((l) => (
            <button
              key={l.page}
              onClick={() => navigate(l.page)}
              aria-current={active(l.page) ? "page" : undefined}
              className={cn(
                "site-nav-link relative flex h-full min-w-0 flex-1 items-center justify-center border-b-2 border-transparent px-1.5 text-[9px] font-bold tracking-[0.07em] uppercase transition-colors min-[360px]:px-2 min-[360px]:text-[10px] min-[360px]:tracking-[0.1em]",
                active(l.page) ? "text-maroon" : "text-ink/70 hover:text-ink"
              )}
            >
              {l.label}
              <span className="site-nav-underline absolute inset-x-0 -bottom-0.5 h-[2px] bg-maroon" aria-hidden="true" />
            </button>
          ))}
        </nav>
        <ScrollProgress />
      </div>
    </>
  );
}
