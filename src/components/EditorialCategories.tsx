import { useState } from "react";
import { ArrowUpRight } from "lucide-react";
import { CATEGORIES, itemsByCategory, type Category } from "../data/menu";
import { useApp } from "../store/app";
import { cn } from "../utils/cn";
import { Reveal } from "./ui";

function CategoryEntry({
  category,
  index,
  selected,
  onSelect,
}: {
  category: Category;
  index: number;
  selected: boolean;
  onSelect: () => void;
}) {
  const { navigate } = useApp();
  const count = itemsByCategory(category.id).length;

  return (
    <li
      className={cn(
        "editorial-category",
        index % 2 === 0 ? "editorial-category--right" : "editorial-category--left",
        selected && "is-selected"
      )}
    >
      <button
        type="button"
        className="editorial-category__plate editorial-plate"
        onClick={onSelect}
        aria-label={`View ${category.name} category, ${count} dishes`}
        aria-pressed={selected}
      >
        <span className="editorial-plate__well">
          <img
            src={category.image}
            alt={`Food photograph representing ${category.name}`}
            loading="lazy"
            decoding="async"
          />
        </span>
      </button>

      <span className="editorial-category__index" aria-hidden="true">
        {String(index + 1).padStart(2, "0")} / {String(CATEGORIES.length).padStart(2, "0")}
      </span>
      {selected && (
        <div className="editorial-category__detail" aria-live="polite">
          <p className="editorial-category__detail-number">
            {String(index + 1).padStart(2, "0")} / {String(CATEGORIES.length).padStart(2, "0")}
          </p>
          <h3>{category.name}</h3>
          <p>{count} dishes</p>
          <button type="button" onClick={() => navigate("category", category.id)}>
            Explore Menu <ArrowUpRight size={14} aria-hidden="true" />
          </button>
        </div>
      )}
    </li>
  );
}

export function EditorialCategories({ home = false }: { home?: boolean }) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  return (
    <section
      className={cn("editorial-surface relative isolate overflow-hidden", home && "editorial-surface--home")}
      aria-labelledby={home ? "home-category-title" : "menu-category-title"}
    >
      <svg
        className="editorial-surface__wave"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        {home ? (
          <path d="M 100 0 C 62 0 54 3 53 9 C 48 17 45 22 52 30 S 61 43 46 51 S 40 63 54 71 S 62 84 48 91 C 54 96 85 99 100 100 Z" />
        ) : (
          <path d="M 53 0 C 48 7 45 14 52 21 S 61 38 46 47 S 40 62 54 70 S 62 85 47 92 S 47 99 52 100 L 100 100 L 100 0 Z" />
        )}
      </svg>
      <div className="editorial-surface__texture" aria-hidden="true" />

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-8 lg:px-10">
        <header className="editorial-category-heading">
          <Reveal className="editorial-category-heading__copy">
            <p className="text-[10px] font-extrabold tracking-[0.22em] text-maroon uppercase sm:text-[11px] sm:tracking-[0.34em]">
              Raaha / The Menu
            </p>
            {home ? (
              <h2 id="home-category-title" className="editorial-category-heading__title">
                Every craving, <em className="text-maroon">covered.</em>
              </h2>
            ) : (
              <h1 id="menu-category-title" className="editorial-category-heading__title">
                The Raaha <em className="text-maroon">menu.</em>
              </h1>
            )}
            <p className="editorial-category-heading__description">
              {CATEGORIES.length} categories. Tap a plate to reveal one.
            </p>
          </Reveal>
          <div className="editorial-category-heading__aside" aria-hidden="true">
            <span className="block font-display text-[clamp(4rem,10vw,9rem)] leading-none font-light text-paper/25">
              {String(CATEGORIES.length).padStart(2, "0")}
            </span>
            <span className="mt-2 block text-[10px] font-bold tracking-[0.22em] text-paper/85 uppercase sm:text-xs">
              Categories / Madurai
            </span>
          </div>
        </header>

        <ol className="editorial-list" aria-label="Food categories">
          {CATEGORIES.map((category, index) => (
            <CategoryEntry
              key={category.id}
              category={category}
              index={index}
              selected={selectedIndex === index}
              onSelect={() => setSelectedIndex(index)}
            />
          ))}
        </ol>

        <div className="editorial-surface__end flex items-center justify-between gap-4 py-7 sm:py-9">
          <p className="font-display text-lg text-ink italic sm:text-2xl">
            Always something good.
          </p>
          {!home && (
            <span className="text-[10px] font-bold tracking-[0.28em] text-paper/85 uppercase">
              Raaha / Madurai
            </span>
          )}
        </div>
      </div>
    </section>
  );
}