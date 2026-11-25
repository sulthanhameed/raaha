import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { User as AuthUser } from "@supabase/supabase-js";
import { INFO, type FoodItem } from "../data/menu";
import type { DeliveryOrder, MapPoint } from "../data/tracking";
import { deleteProfile, loadLatestOrder, loadProfile, saveProfile, type GuestProfile } from "../lib/backend";
import { supabase } from "../lib/supabase";

export type Page =
  | "home"
  | "menu"
  | "about"
  | "services"
  | "reserve"
  | "cart"
  | "food"
  | "dishes"
  | "tracking";

export interface Route {
  page: Page;
  id?: string;
}

interface CartLine {
  id: string;
  qty: number;
}

interface Toast {
  id: number;
  title: string;
  desc?: string;
}

interface AppState {
  route: Route;
  navigate: (page: Page, id?: string) => void;
  goHome: () => void;

  cart: CartLine[];
  cartCount: number;
  addToCart: (item: FoodItem, qty?: number, silent?: boolean) => void;
  setQty: (id: string, qty: number) => void;
  removeFromCart: (id: string) => void;
  clearCart: () => void;

  activeOrder: DeliveryOrder | null;
  orderLoadStatus: "loading" | "ready" | "unconfigured" | "error";
  reloadLatestOrder: () => Promise<void>;
  setActiveOrder: (order: DeliveryOrder | null) => void;
  setOrderDestination: (point: MapPoint) => void;

  searchOpen: boolean;
  setSearchOpen: (v: boolean) => void;
  accountOpen: boolean;
  setAccountOpen: (v: boolean) => void;
  checkoutOpen: boolean;
  setCheckoutOpen: (v: boolean) => void;

  user: GuestProfile | null;
  authUser: AuthUser | null;
  authLoading: boolean;
  profileLoading: boolean;
  profileLoadError: boolean;
  reloadProfile: () => Promise<void>;
  saveUser: (profile: GuestProfile, captchaToken?: string) => Promise<void>;
  clearUser: () => Promise<void>;

  toasts: Toast[];
  toast: (title: string, desc?: string) => void;
}

const Ctx = createContext<AppState | null>(null);

function routeFromHash(): Route {
  const h = window.location.hash.replace(/^#\/?/, "");
  const [page, id] = h.split("/");
  const pages: Page[] = ["home", "menu", "about", "services", "reserve", "cart", "food", "dishes", "tracking"];
  if (pages.includes(page as Page)) return { page: page as Page, id };
  return { page: "home" };
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [route, setRoute] = useState<Route>(() => routeFromHash());
  const [cart, setCart] = useState<CartLine[]>(() => {
    try {
      const saved: unknown = JSON.parse(localStorage.getItem("raaha-cart") || "[]");
      if (!Array.isArray(saved)) return [];
      const unique = new Map<string, CartLine>();
      for (const line of saved) {
        if (line && typeof line.id === "string" && /^[a-z0-9]+(-[a-z0-9]+)*$/.test(line.id) &&
          Number.isInteger(line.qty) && line.qty > 0 && line.qty <= 20) unique.set(line.id, { id: line.id, qty: line.qty });
      }
      return [...unique.values()];
    } catch {
      return [];
    }
  });
  // Old demo orders are deliberately not treated as real requests.
  const [activeOrder, setActiveOrderState] = useState<DeliveryOrder | null>(null);
  const [orderLoadStatus, setOrderLoadStatus] = useState<"loading" | "ready" | "unconfigured" | "error">(supabase ? "loading" : "unconfigured");
  const [searchOpen, setSearchOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [user, setUser] = useState<GuestProfile | null>(null);
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [authLoading, setAuthLoading] = useState(Boolean(supabase));
  const [profileLoading, setProfileLoading] = useState(Boolean(supabase));
  const [profileLoadError, setProfileLoadError] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const toastId = useRef(0);
  const profileRevision = useRef(0);
  const orderRevision = useRef(0);
  const profileFetch = useRef(0);
  const orderFetch = useRef(0);

  useEffect(() => {
    setRoute(routeFromHash());
    const onHash = () => {
      setRoute(routeFromHash());
      window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
    };
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  useEffect(() => {
    localStorage.setItem("raaha-cart", JSON.stringify(cart));
  }, [cart]);

  const reloadProfile = useCallback(async () => {
    if (!supabase) return;
    const fetch = ++profileFetch.current;
    const revision = profileRevision.current;
    setProfileLoading(true);
    try {
      const profile = await loadProfile();
      if (fetch === profileFetch.current && revision === profileRevision.current) {
        setUser(profile);
        setProfileLoadError(false);
      }
    } catch {
      if (fetch === profileFetch.current && revision === profileRevision.current) setProfileLoadError(true);
    } finally {
      if (fetch === profileFetch.current) setProfileLoading(false);
    }
  }, []);

  const reloadLatestOrder = useCallback(async () => {
    if (!supabase) return;
    const fetch = ++orderFetch.current;
    const revision = orderRevision.current;
    setOrderLoadStatus("loading");
    try {
      const order = await loadLatestOrder();
      if (fetch !== orderFetch.current || revision !== orderRevision.current) return;
      let dismissed = "";
      try { dismissed = localStorage.getItem("raaha-dismissed-request") ?? ""; } catch { /* optional */ }
      setActiveOrderState(order && order.id !== dismissed ? order : null);
      setOrderLoadStatus("ready");
    } catch {
      if (fetch === orderFetch.current && revision === orderRevision.current) setOrderLoadStatus("error");
    }
  }, []);

  useEffect(() => {
    if (!supabase) return;
    let stopped = false;
    let previousId: string | null | undefined;
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const nextId = session?.user.id ?? null;
      setAuthUser(session?.user ?? null);
      setAuthLoading(false);
      if (previousId === nextId) return;
      previousId = nextId;
      // Never display one account's profile or order in another account.
      profileRevision.current += 1;
      orderRevision.current += 1;
      setUser(null);
      setActiveOrderState(null);
      setProfileLoadError(false);
      setProfileLoading(true);
      setOrderLoadStatus("loading");
      // Do not call async Supabase methods inside its auth callback lock.
      window.setTimeout(() => {
        if (!stopped) { void reloadProfile(); void reloadLatestOrder(); }
      }, 0);
    });
    return () => { stopped = true; subscription.unsubscribe(); profileFetch.current += 1; orderFetch.current += 1; };
  }, [reloadProfile, reloadLatestOrder]);

  const saveUser = useCallback(async (profile: GuestProfile, captchaToken?: string) => {
    await saveProfile(profile, captchaToken);
    profileRevision.current += 1;
    setUser(profile);
    setProfileLoadError(false);
    // A legacy browser-only profile is moved only after the visitor presses Save.
    try { localStorage.removeItem("raaha-user"); } catch { /* optional */ }
  }, []);

  const clearUser = useCallback(async () => {
    await deleteProfile();
    profileRevision.current += 1;
    setUser(null);
    setProfileLoadError(false);
    try { localStorage.removeItem("raaha-user"); } catch { /* optional */ }
  }, []);

  const setActiveOrder = useCallback((order: DeliveryOrder | null) => {
    orderRevision.current += 1;
    setOrderLoadStatus("ready");
    setActiveOrderState((previous) => {
      try {
        if (!order && previous) localStorage.setItem("raaha-dismissed-request", previous.id);
        else if (order) localStorage.removeItem("raaha-dismissed-request");
      } catch { /* optional */ }
      return order;
    });
  }, []);

  // lock body scroll when any overlay is open
  const anyOverlay = searchOpen || accountOpen || checkoutOpen;
  useEffect(() => {
    document.body.style.overflow = anyOverlay ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [anyOverlay]);

  const navigate = useCallback((page: Page, id?: string) => {
    const target = `#/${page}${id ? `/${id}` : ""}`;
    if (window.location.hash === target) {
      setRoute({ page, id });
      window.scrollTo({ top: 0 });
    } else {
      window.location.hash = target;
    }
    setSearchOpen(false);
  }, []);

  const goHome = useCallback(() => navigate("home"), [navigate]);

  const toast = useCallback((title: string, desc?: string) => {
    const id = ++toastId.current;
    setToasts((t) => [...t, { id, title, desc }]);
    window.setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3400);
  }, []);

  const addToCart = useCallback(
    (item: FoodItem, qty = 1, silent = false) => {
      setCart((c) => {
        const found = c.find((l) => l.id === item.id);
        if (found) return c.map((l) => (l.id === item.id ? { ...l, qty: Math.min(20, l.qty + qty) } : l));
        return [...c, { id: item.id, qty: Math.min(20, Math.max(1, qty)) }];
      });
      if (!silent) toast("Added to cart", `${item.name} × ${qty}`);
    },
    [toast]
  );

  const setQty = useCallback((id: string, qty: number) => {
    setCart((c) =>
      qty <= 0 ? c.filter((l) => l.id !== id) : c.map((l) => (l.id === id ? { ...l, qty: Math.min(20, Math.floor(qty)) } : l))
    );
  }, []);

  const removeFromCart = useCallback((id: string) => {
    setCart((c) => c.filter((l) => l.id !== id));
  }, []);

  const clearCart = useCallback(() => setCart([]), []);

  const setOrderDestination = useCallback((point: MapPoint) => {
    setActiveOrderState((order) => (order ? { ...order, destination: point } : null));
  }, []);

  const cartCount = useMemo(() => cart.reduce((s, l) => s + l.qty, 0), [cart]);

  const value: AppState = {
    route,
    navigate,
    goHome,
    cart,
    cartCount,
    addToCart,
    setQty,
    removeFromCart,
    clearCart,
    activeOrder,
    orderLoadStatus,
    reloadLatestOrder,
    setActiveOrder,
    setOrderDestination,
    searchOpen,
    setSearchOpen,
    accountOpen,
    setAccountOpen,
    checkoutOpen,
    setCheckoutOpen,
    user,
    authUser,
    authLoading,
    profileLoading,
    profileLoadError,
    reloadProfile,
    saveUser,
    clearUser,
    toasts,
    toast,
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useApp(): AppState {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useApp must be used inside AppProvider");
  return ctx;
}

/* ------------------------- Open-now helper ------------------------- */
export function useOpenNow() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(t);
  }, []);
  const parts = new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Kolkata", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(now);
  const hour = Number(parts.find((part) => part.type === "hour")?.value) + Number(parts.find((part) => part.type === "minute")?.value) / 60;
  const open = hour >= INFO.openHour && hour < INFO.closeHour;
  return {
    open,
    label: INFO.hoursConfirmed
      ? open ? `Open now · Closes ${formatHour(INFO.closeHour)}` : `Opens ${formatHour(INFO.openHour)}`
      : "Opening hours to be confirmed",
  };
}

export function formatHour(h: number) {
  const hr = h % 12 === 0 ? 12 : h % 12;
  return `${hr}:00 ${h < 12 ? "AM" : "PM"}`;
}
