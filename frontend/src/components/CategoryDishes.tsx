import { ArrowLeft } from "lucide-react";
import { formatPrice } from "../data/menu";
import { useMenu } from "../store/menu";
import { useApp } from "../store/app";
import { showFoodImageFallback } from "../utils/imageFallback";

/* A category's foods live on their own page: the category rows stay
   artwork-only, and View Menu leads here. */
export function CategoryDishesPage({ categoryId }: { categoryId: string }) {
  const { categories, itemsByCategory } = useMenu();
  const { navigate } = useApp();
  const category = categories.find((entry) => entry.id === categoryId);
  return (
    <main className="pt-[var(--site-header-height)]">
      <section className="menu-dishes" aria-labelledby="menu-dishes-title">
        <div className="menu-dishes__inner">
          <button type="button" className="menu-dishes__back" onClick={() => navigate("menu", categoryId || undefined)}>
            <ArrowLeft size={14} aria-hidden="true" /> <span>Back to the menu</span>
          </button>
          {category ? (
            <>
              <header className="menu-dishes__head">
                <p className="menu-dishes__eyebrow">Raaha / {category.name}</p>
                <h1 id="menu-dishes-title" className="menu-dishes__title">
                  {category.name} <em>dishes</em>
                </h1>
                <p className="menu-dishes__count">
                  {itemsByCategory(categoryId).length} dishes · tap a dish to view it
                </p>
              </header>
              <ul className="menu-dishes__list" aria-label={`${category.name} dishes`}>
                {itemsByCategory(categoryId).map((item) => (
                  <li key={item.id}>
                    <button type="button" onClick={() => navigate("food", item.id)}>
                      <span className="menu-dishes__plate">
                        <img src={item.image} alt="" loading="lazy" decoding="async" onError={showFoodImageFallback} />
                      </span>
                      <span className="menu-dishes__row">
                        <span className="menu-dishes__name">{item.name}</span>
                        <span className="menu-dishes__price">{formatPrice(item.price)}</span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <p className="menu-dishes__count" role="status">Category unavailable.</p>
          )}
        </div>
      </section>
    </main>
  );
}
