import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { CATEGORIES as SAMPLE_CATEGORIES, MENU as SAMPLE_MENU, type Category, type FoodItem } from "../data/menu";
import { apiRequest } from "../lib/api";
import { supabase } from "../lib/supabase";

export type MenuStatus = "loading" | "ready" | "unconfigured" | "error";
interface MenuContext {
  categories: Category[];
  menu: FoodItem[];
  status: MenuStatus;
  refresh: () => Promise<void>;
  categoryById: (id: string) => Category;
  itemsByCategory: (id: string) => FoodItem[];
  itemById: (id: string) => FoodItem | undefined;
  signatureItems: () => FoodItem[];
}
const Context = createContext<MenuContext | null>(null);

interface CategoryRow { id: string; name: string; tagline: string; description: string; image_url: string }
interface ItemRow {
  id: string; category_id: string; name: string; description: string; price_inr: number;
  vegetarian: boolean; ingredients: string[]; image_url: string; sample_rating: number;
  sample_rating_count: number; prep_time: string; serves: string; spice: FoodItem["spice"];
  calories: string; tag: FoodItem["tag"] | null;
}

export function MenuProvider({ children }: { children: ReactNode }) {
  const [categories, setCategories] = useState(SAMPLE_CATEGORIES);
  const [menu, setMenu] = useState(SAMPLE_MENU);
  const [status, setStatus] = useState<MenuStatus>(supabase ? "loading" : "unconfigured");
  const requestNumber = useRef(0);

  const refresh = useCallback(async () => {
    if (!supabase) { setStatus("unconfigured"); return; }
    const request = ++requestNumber.current;
    setStatus("loading");
    try {
      const result = await apiRequest<{ categories: CategoryRow[]; items: ItemRow[] }>("/catalog", { auth: "none" });
      if (!Array.isArray(result?.categories) || !result.categories.length || !Array.isArray(result.items)) throw new Error("CATALOG_UNAVAILABLE");
      const cats = result.categories.map((row) => ({
        id: row.id, name: row.name, tagline: row.tagline, description: row.description, image: row.image_url,
      }));
      const dishes = result.items.map((row) => ({
        id: row.id, category: row.category_id, name: row.name, description: row.description,
        price: Number(row.price_inr), veg: row.vegetarian, ingredients: row.ingredients,
        image: row.image_url, rating: Number(row.sample_rating), ratingsCount: row.sample_rating_count,
        time: row.prep_time, serves: row.serves, spice: row.spice, calories: row.calories,
        ...(row.tag ? { tag: row.tag } : {}),
      }));
      const validId = (id: unknown) => typeof id === "string" && id.length <= 80 && /^[a-z0-9]+(-[a-z0-9]+)*$/.test(id);
      if (cats.some((c) => !validId(c.id) || typeof c.name !== "string" || !c.name.trim() ||
        typeof c.tagline !== "string" || typeof c.description !== "string" || typeof c.image !== "string") ||
        dishes.some((d) => !validId(d.id) || typeof d.name !== "string" || !d.name.trim() ||
          typeof d.description !== "string" || typeof d.image !== "string" || typeof d.veg !== "boolean" ||
          !Number.isInteger(d.price) || d.price < 1 || d.price > 100000 ||
          !Number.isFinite(d.rating) || d.rating < 0 || d.rating > 5 || !Number.isInteger(d.ratingsCount) || d.ratingsCount < 0 ||
          !Array.isArray(d.ingredients) || d.ingredients.some((ingredient) => typeof ingredient !== "string") ||
          typeof d.time !== "string" || typeof d.serves !== "string" || typeof d.calories !== "string" ||
          !["None", "Mild", "Medium", "Hot"].includes(d.spice) ||
          (d.tag !== undefined && !["Bestseller", "Chef's Special", "Must Try", "New"].includes(d.tag)) ||
          !cats.some((c) => c.id === d.category))) {
        throw new Error("CATALOG_UNAVAILABLE");
      }
      if (request !== requestNumber.current) return;
      setCategories(cats);
      setMenu(dishes);
      setStatus("ready");
    } catch {
      if (request !== requestNumber.current) return;
      setCategories(SAMPLE_CATEGORIES);
      setMenu(SAMPLE_MENU);
      setStatus("error");
    }
  }, []);

  useEffect(() => { void refresh(); }, [refresh]);

  const value = useMemo<MenuContext>(() => ({
    categories, menu, status, refresh,
    categoryById: (id) => categories.find((category) => category.id === id) ?? categories[0],
    itemsByCategory: (id) => menu.filter((item) => item.category === id),
    itemById: (id) => menu.find((item) => item.id === id),
    signatureItems: () => menu.filter((item) => item.tag === "Bestseller" || item.tag === "Chef's Special").slice(0, 8),
  }), [categories, menu, status, refresh]);
  return <Context.Provider value={value}>{children}</Context.Provider>;
}

export function useMenu(): MenuContext {
  const value = useContext(Context);
  if (!value) throw new Error("useMenu must be used inside MenuProvider");
  return value;
}
