import { useMemo } from "react";
import { ArrowLeft, Star } from "lucide-react";
import { categoryById, formatPrice, type FoodItem } from "../data/menu";
import { reviewsFor } from "../data/reviews";
import { useMenu } from "../store/menu";
import { useApp } from "../store/app";
import { showFoodImageFallback } from "../utils/imageFallback";

function Rating({ rating, count }: { rating: number; count: number }) {
  return (
    <span className="menu-dishes__rating">
      <Star size={12} className="menu-dishes__star" aria-hidden="true" focusable="false" />
      <span>{rating.toFixed(1)}</span>
      <span className="menu-dishes__rating-count">({count.toLocaleString("en-IN")})</span>
      <span className="sr-only">{`rated ${rating} out of 5 from ${count} reviews`}</span>
    </span>
  );
}

function Stars({ rating }: { rating: number }) {
  return (
    <span className="menu-dishes__stars" role="img" aria-label={`Rated ${rating} out of 5`}>
      {[1, 2, 3, 4, 5].map((step) => (
        <Star
          key={step}
          size={13}
          className={step <= Math.round(rating) ? "is-on" : ""}
          aria-hidden="true"
          focusable="false"
        />
      ))}
    </span>
  );
}

/* A category's foods live on their own page: the category rows stay
   artwork-only, and View Menu leads here. Each card carries the dish's
   details and rating, and the page closes with guest reviews. */
export function CategoryDishesPage({ categoryId }: { categoryId: string }) {
  const { categories, itemsByCategory, menu } = useMenu();
  const { navigate } = useApp();
  const category = categories.find((entry) => entry.id === categoryId);
  const items = category ? itemsByCategory(categoryId) : [];
  const reviews = category ? reviewsFor(categoryId) : [];
  /* One highest-rated pick per neighbouring category, rotating from the
     category after this one, so every dishes page closes with a varied
     trail of related foods from the rest of the kitchen. */
  const related = useMemo<FoodItem[]>(() => {
    if (!category) return [];
    const index = categories.findIndex((entry) => entry.id === category.id);
    const picks: FoodItem[] = [];
    for (let step = 1; step <= categories.length && picks.length < 4; step += 1) {
      const other = categories[(index + step) % categories.length];
      if (!other || other.id === category.id) continue;
      const best = menu
        .filter((item) => item.category === other.id)
        .sort((a, b) => b.rating - a.rating)[0];
      if (best) picks.push(best);
    }
    return picks;
  }, [category, categories, menu]);
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
                <p className="menu-dishes__blurb">{category.description}</p>
                <p className="menu-dishes__count">
                  {items.length} dishes · tap a dish for its full details
                </p>
              </header>
              <ul className="menu-dishes__list" aria-label={`${category.name} dishes`}>
                {items.map((item) => (
                  <li key={item.id}>
                    <button type="button" className="menu-dishes__card" onClick={() => navigate("food", item.id)}>
                      <span className="menu-dishes__plate">
                        <img src={item.image} alt="" loading="lazy" decoding="async" onError={showFoodImageFallback} />
                        {item.tag && <span className="menu-dishes__tag">{item.tag}</span>}
                      </span>
                      <span className="menu-dishes__body">
                        <span className="menu-dishes__row">
                          <span
                            className={`menu-dishes__diet ${item.veg ? "is-veg" : "is-nonveg"}`}
                            role="img"
                            aria-label={item.veg ? "Vegetarian" : "Non-vegetarian"}
                          />
                          <span className="menu-dishes__name">{item.name}</span>
                          <span className="menu-dishes__price">{formatPrice(item.price)}</span>
                        </span>
                        <span className="menu-dishes__desc">{item.description}</span>
                        <span className="menu-dishes__meta">
                          <Rating rating={item.rating} count={item.ratingsCount} />
                          <span aria-hidden="true">·</span>
                          <span>{item.time}</span>
                          {item.spice !== "None" && (
                            <>
                              <span aria-hidden="true">·</span>
                              <span>{item.spice} spice</span>
                            </>
                          )}
                        </span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
              {related.length > 0 && (
                <section className="menu-dishes__related" aria-labelledby="menu-dishes-related-title">
                  <h2 id="menu-dishes-related-title" className="menu-dishes__reviews-title">
                    Related foods <em>from across the table</em>
                  </h2>
                  <p className="menu-dishes__blurb">
                    {`Guests who order ${category.name.toLowerCase()} often round out the table with these favourites from the rest of our kitchen.`}
                  </p>
                  <div className="menu-dishes__related-track">
                    <ul className="menu-dishes__related-list" aria-label={`Related foods to ${category.name}`}>
                      {[...related, ...related].map((item, position) => (
                        <li key={`${item.id}-${position}`} aria-hidden={position >= related.length ? true : undefined}>
                          <button
                            type="button"
                            className="menu-dishes__related-card"
                            tabIndex={position >= related.length ? -1 : 0}
                            onClick={() => navigate("food", item.id)}
                          >
                            <span className="menu-dishes__related-plate">
                              <img src={item.image} alt="" loading="lazy" decoding="async" onError={showFoodImageFallback} />
                            </span>
                            <span className="menu-dishes__related-body">
                              <span className="menu-dishes__related-name">{item.name}</span>
                              <span className="menu-dishes__related-cat">{categoryById(item.category).name}</span>
                              <span className="menu-dishes__related-meta">
                                <Rating rating={item.rating} count={item.ratingsCount} />
                                <span aria-hidden="true">·</span>
                                <span>{formatPrice(item.price)}</span>
                              </span>
                            </span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                </section>
              )}
              {reviews.length > 0 && (
                <section className="menu-dishes__reviews" aria-labelledby="menu-dishes-reviews-title">
                  <h2 id="menu-dishes-reviews-title" className="menu-dishes__reviews-title">
                    What guests say <em>about {category.name.toLowerCase()}</em>
                  </h2>
                  <ul className="menu-dishes__review-list">
                    {reviews.map((review) => (
                      <li key={review.id}>
                        <figure className="menu-dishes__review">
                          <Stars rating={review.rating} />
                          <blockquote className="menu-dishes__review-text">{review.text}</blockquote>
                          <figcaption className="menu-dishes__review-by">
                            {review.author} · {review.date} · ordered {review.dish}
                          </figcaption>
                        </figure>
                      </li>
                    ))}
                  </ul>
                </section>
              )}
            </>
          ) : (
            <p className="menu-dishes__count" role="status">Category unavailable.</p>
          )}
        </div>
      </section>
    </main>
  );
}
