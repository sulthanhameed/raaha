import { formatPrice } from "../data/menu";
import { useMenu } from "../store/menu";
import { useApp } from "../store/app";
import { showFoodImageFallback } from "../utils/imageFallback";

/* The menu page's dish showcase: the category wave stays artwork-only, and
   the revealed category's dishes live in their own section below it. */
export function CategoryDishes({ categoryId }: { categoryId: string }) {
  const { categories, itemsByCategory } = useMenu();
  const { navigate } = useApp();
  const category = categories.find((entry) => entry.id === categoryId);
  if (!category) return null;
  const items = itemsByCategory(categoryId);
  return (
    <section id="menu-category-dishes" className="menu-dishes" aria-labelledby="menu-dishes-title">
      <div className="menu-dishes__inner">
        <header className="menu-dishes__head">
          <p className="menu-dishes__eyebrow">Raaha / {category.name}</p>
          <h2 id="menu-dishes-title" className="menu-dishes__title">
            {category.name} <em>dishes</em>
          </h2>
          <p className="menu-dishes__count">
            {items.length} dishes · tap a dish to view it
          </p>
        </header>
        <ul className="menu-dishes__list" aria-label={`${category.name} dishes`}>
          {items.map((item) => (
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
      </div>
    </section>
  );
}
