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
import { INFO, type FoodItem } from "../data/menu";
import type { DeliveryOrder, MapPoint } from "../data/tracking";

export type Page =
  | "home"
  | "menu"
  | "about"
  | "services"
  | "reserve"
  | "cart"
  | "category"
  | "food"
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
  setActiveOrder: (order: DeliveryOrder | null) => void;
  setOrderDestination: (point: MapPoint) => void;

  searchOpen: boolean;
  setSearchOpen: (v: boolean) => void;
  accountOpen: boolean;
  setAccountOpen: (v: boolean) => void;
  checkoutOpen: boolean;
  setCheckoutOpen: (v: boolean) => void;

  user: { name: string; phone: string } | null;
  setUser: (u: { name: string; phone: string } | null) => void;

  toasts: Toast[];
  toast: (title: string, desc?: string) => void;
}

const Ctx = createContext<AppState | null>(null);

function routeFromHash(): Route {
  const h = window.location.hash.replace(/^#\/?/, "");
  const [page, id] = h.split("/");
  const pages: Page[] = ["home", "menu", "about", "services", "reserve", "cart", "category", "food", "tracking"];
  if (pages.includes(page as Page)) return { page: page as Page, id };
  return { page: "home" };
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [route, setRoute] = useState<Route>({ page: "home" });
  const [cart, setCart] = useState<CartLine[]>(() => {
    try {
      return JSON.parse(localStorage.getItem("raaha-cart") || "[]");
    } catch {
      return [];
    }
  });
  const [activeOrder, setActiveOrder] = useState<DeliveryOrder | null>(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("raaha-active-order") || "null");
      return saved && typeof saved.id === "string" && typeof saved.address === "string" &&
        typeof saved.customerName === "string" && typeof saved.total === "number" && Array.isArray(saved.items)
        ? saved : null;
    } catch {
      return null;
    }
  });
  const [searchOpen, setSearchOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [user, setUser] = useState<{ name: string; phone: string } | null>(() => {
    try {
      return JSON.parse(localStorage.getItem("raaha-user") || "null");
    } catch {
      return null;
    }
  });
  const [toasts, setToasts] = useState<Toast[]>([]);
  const toastId = useRef(0);

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

  useEffect(() => {
    if (activeOrder) localStorage.setItem("raaha-active-order", JSON.stringify(activeOrder));
    else localStorage.removeItem("raaha-active-order");
  }, [activeOrder]);

  useEffect(() => {
    localStorage.setItem("raaha-user", JSON.stringify(user));
  }, [user]);

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
        if (found) return c.map((l) => (l.id === item.id ? { ...l, qty: l.qty + qty } : l));
        return [...c, { id: item.id, qty }];
      });
      if (!silent) toast("Added to cart", `${item.name} × ${qty}`);
    },
    [toast]
  );

  const setQty = useCallback((id: string, qty: number) => {
    setCart((c) =>
      qty <= 0 ? c.filter((l) => l.id !== id) : c.map((l) => (l.id === id ? { ...l, qty } : l))
    );
  }, []);

  const removeFromCart = useCallback((id: string) => {
    setCart((c) => c.filter((l) => l.id !== id));
  }, []);

  const clearCart = useCallback(() => setCart([]), []);

  const setOrderDestination = useCallback((point: MapPoint) => {
    setActiveOrder((order) => (order ? { ...order, destination: point } : null));
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
    setActiveOrder,
    setOrderDestination,
    searchOpen,
    setSearchOpen,
    accountOpen,
    setAccountOpen,
    checkoutOpen,
    setCheckoutOpen,
    user,
    setUser,
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
  const hour = now.getHours() + now.getMinutes() / 60;
  const open = hour >= INFO.openHour && hour < INFO.closeHour;
  return {
    open,
    label: open ? `Open now · Closes ${formatHour(INFO.closeHour)}` : `Opens ${formatHour(INFO.openHour)}`,
  };
}

export function formatHour(h: number) {
  const hr = h % 12 === 0 ? 12 : h % 12;
  return `${hr}:00 ${h < 12 ? "AM" : "PM"}`;
}
