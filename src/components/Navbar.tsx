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
import { Logo } from "./ui";

const LINKS: { page: Page; label: string }[] = [
  { page: "home", label: "Home" },
  { page: "menu", label: "Menu" },
  { page: "about", label: "About" },
  { page: "services", label: "Services" },
];

const MOBILE_LINKS: { page: Page; label: string }[] = [
  ...LINKS,
  { page: "reserve", label: "Reserve" },
];

function IconBtn({
  label,
  onClick,
  children,
  badge,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
  badge?: number;
}) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      className="relative flex h-10 w-10 items-center justify-center rounded-full text-ink transition-all hover:bg-cream hover:text-maroon active:scale-90 sm:h-11 sm:w-11"
    >
      {children}
      {badge !== undefined && badge > 0 && (
        <span className="absolute -top-0.5 -right-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-maroon px-1 text-[10px] font-extrabold text-white shadow">
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

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const active = (p: Page) =>
    route.page === p || (p === "menu" && (route.page === "category" || route.page === "food"));

  return (
    <>
      <div className="fixed inset-x-0 top-0 z-50">
        <div className="flex h-7 items-center justify-center gap-2 bg-ink px-2 text-center">
          {activeOrder ? (
            <button onClick={() => navigate("tracking")} className="inline-flex max-w-full items-center gap-2 text-[9px] font-bold tracking-[0.12em] text-goldsoft uppercase transition hover:text-paper sm:text-[10px] sm:tracking-[0.2em]">
              <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-gold" />
              <span className="truncate">{activeOrder.id} · Track route preview</span>
              <ArrowRight size={11} className="shrink-0" />
            </button>
          ) : (
            <>
              <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", open ? "animate-pulse-dot bg-green-400" : "bg-red-400")} />
              <p className="truncate text-[9px] font-bold tracking-[0.12em] text-paper/90 uppercase sm:text-[10px] sm:tracking-[0.22em]">
                {open ? "Open Now" : "Currently Closed"} · {INFO.hoursLabel}
                <span className="hidden sm:inline"> · Gokhale Road, Madurai</span>
              </p>
              <a
                href={INFO.phoneHref}
                className="ml-1 hidden shrink-0 items-center gap-1 text-[10px] font-bold tracking-[0.2em] text-goldsoft uppercase transition hover:text-gold lg:inline-flex"
              >
                <Phone size={10} /> Call Us
              </a>
            </>
          )}
        </div>

        <header
          className={cn(
            "border-b border-ink/10 bg-paper transition-shadow duration-300",
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
                    "relative whitespace-nowrap rounded-full px-3 py-2.5 text-[11px] font-bold tracking-[0.12em] uppercase transition-colors lg:px-4 lg:text-[12px] lg:tracking-[0.18em] xl:px-5",
                    active(l.page) ? "text-maroon" : "text-ink/80 hover:bg-cream hover:text-ink"
                  )}
                >
                  {l.label}
                  <span
                    className={cn(
                      "absolute inset-x-3 -bottom-0.5 h-[2px] rounded-full bg-maroon transition-opacity duration-300 lg:inset-x-4",
                      active(l.page) ? "opacity-100" : "opacity-0"
                    )}
                  />
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
              <IconBtn label={`Cart, ${cartCount} items`} onClick={() => navigate("cart")} badge={cartCount}>
                <ShoppingBag size={20} strokeWidth={2.2} />
              </IconBtn>
              <button
                onClick={() => navigate("reserve")}
                className="ml-1.5 hidden whitespace-nowrap rounded-full bg-ink px-6 py-3 text-[11px] font-bold tracking-[0.18em] text-paper uppercase transition-all hover:bg-maroon hover:text-white active:scale-95 xl:block"
              >
                Book a Table
              </button>
            </div>
          </div>
        </header>

        <nav
          className="no-scrollbar flex h-11 items-center justify-between overflow-x-auto border-b border-ink/10 bg-paper px-2 shadow-sm md:hidden"
          aria-label="Mobile navigation"
        >
          {MOBILE_LINKS.map((l) => (
            <button
              key={l.page}
              onClick={() => navigate(l.page)}
              aria-current={active(l.page) ? "page" : undefined}
              className={cn(
                "flex h-full shrink-0 items-center border-b-2 px-2.5 text-[10px] font-bold tracking-[0.11em] uppercase transition-colors",
                active(l.page)
                  ? "border-maroon text-maroon"
                  : "border-transparent text-ink/70 hover:text-ink"
              )}
            >
              {l.label}
            </button>
          ))}
        </nav>
      </div>
    </>
  );
}
