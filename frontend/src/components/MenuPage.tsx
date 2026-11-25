import { useEffect, useState } from "react";
import { useApp } from "../store/app";
import { CategoryDishes } from "./CategoryDishes";
import { EditorialCategories } from "./EditorialCategories";

export function MenuPage() {
  const { route } = useApp();
  const [revealedId, setRevealedId] = useState<string | null>(route.id || null);
  useEffect(() => {
    setRevealedId(route.id || null);
  }, [route.id]);
  return (
    <main className="pt-[var(--site-header-height)]">
      <EditorialCategories initialSelectedId={route.id} onReveal={setRevealedId} />
      {revealedId && <CategoryDishes categoryId={revealedId} />}
    </main>
  );
}
