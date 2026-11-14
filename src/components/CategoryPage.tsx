import { ArrowLeft, ArrowRight } from "lucide-react";
import { CATEGORIES, categoryById, itemsByCategory } from "../data/menu";
import { useApp } from "../store/app";
import { CategoryFoodShowcase } from "./CategoryFoodShowcase";

export function CategoryPage({ categoryId }: { categoryId: string }) {
  const { navigate } = useApp();
  const category = categoryById(categoryId);
  const items = itemsByCategory(category.id);
  const index = CATEGORIES.findIndex((entry) => entry.id === category.id);
  const previous = CATEGORIES[(index - 1 + CATEGORIES.length) % CATEGORIES.length];
  const next = CATEGORIES[(index + 1) % CATEGORIES.length];

  return (
    <main className="pt-[var(--site-header-height)]">
      <CategoryFoodShowcase category={category} items={items} />
      <section className="bg-ink px-4 py-12 text-paper sm:px-6 lg:px-8 lg:py-16">
        <div className="mx-auto grid max-w-7xl items-end gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:gap-14">
          <div>
            <p className="lux-label-sm text-goldsoft">The Raaha menu</p>
            <h2 className="mt-3 font-display text-3xl leading-tight font-medium sm:text-4xl">
              Another chapter <em className="gold-text font-semibold">awaits.</em>
            </h2>
          </div>
          <nav className="grid gap-5 sm:grid-cols-2" aria-label="Change food category">
            <button
              type="button"
              onClick={() => navigate("category", previous.id)}
              aria-label={`Previous category: ${previous.name}`}
              className="group flex items-center gap-4 border-t border-white/30 py-4 text-left transition hover:border-goldsoft"
            >
              <ArrowLeft size={20} className="shrink-0 text-goldsoft transition group-hover:-translate-x-1" />
              <span>
                <span className="block text-[10px] font-bold tracking-[0.2em] text-paper/50 uppercase">Previous category</span>
                <span className="mt-1 block font-display text-xl font-semibold">{previous.name}</span>
              </span>
            </button>
            <button
              type="button"
              onClick={() => navigate("category", next.id)}
              aria-label={`Next category: ${next.name}`}
              className="group flex items-center justify-between gap-4 border-t border-white/30 py-4 text-left transition hover:border-goldsoft"
            >
              <span>
                <span className="block text-[10px] font-bold tracking-[0.2em] text-paper/50 uppercase">Next category</span>
                <span className="mt-1 block font-display text-xl font-semibold">{next.name}</span>
              </span>
              <ArrowRight size={20} className="shrink-0 text-goldsoft transition group-hover:translate-x-1" />
            </button>
          </nav>
        </div>
      </section>
    </main>
  );
}