import { useApp } from "../store/app";
import { EditorialCategories } from "./EditorialCategories";

export function MenuPage() {
  const { route } = useApp();
  return (
    <main className="pt-[var(--site-header-height)]">
      <EditorialCategories initialSelectedId={route.id} />
    </main>
  );
}
