import { useEffect, useRef, useState } from "react";
import { ArrowUpRight } from "lucide-react";
import { type Category } from "../data/menu";
import { useMenu } from "../store/menu";
import { tabletopCategoryImage } from "../data/tabletop";
import { useApp } from "../store/app";
import { cn } from "../utils/cn";
import { showFoodImageFallback } from "../utils/imageFallback";
import { Reveal } from "./ui";

function CategoryEntry({
  category,
  index,
  selected,
  onSelect,
  home,
}: {
  category: Category;
  index: number;
  selected: boolean;
  onSelect: () => void;
  home: boolean;
}) {
  const { navigate } = useApp();
  const { categories: CATEGORIES, itemsByCategory } = useMenu();
  const count = itemsByCategory(category.id).length;
  const Heading = home ? "h3" : "h2";
  const headingId = `${home ? "home" : "menu"}-category-${category.id}`;
  const entryRef = useRef<HTMLLIElement>(null);
  const [arrived, setArrived] = useState(false);

  useEffect(() => {
    const entry = entryRef.current;
    if (!entry) return;
    if (typeof IntersectionObserver === "undefined") {
      setArrived(true);
      return;
    }
    const observer = new IntersectionObserver(([observation]) => {
      if (observation.isIntersecting) {
        setArrived(true);
        observer.disconnect();
      }
    }, { threshold: 0.08 });
    observer.observe(entry);
    return () => observer.disconnect();
  }, []);

  return (
    <li
      ref={entryRef}
      id={`editorial-cat-${category.id}`}
      className={cn(
        "editorial-category",
        index % 2 === 0 ? "editorial-category--right" : "editorial-category--left",
        arrived && "has-arrived",
        selected && "is-selected"
      )}
    >
      <button
        type="button"
        className="editorial-category__plate editorial-plate"
        onClick={onSelect}
        aria-label={`Select ${category.name}, ${count} dishes`}
        aria-pressed={selected}
      >
        <span className="editorial-plate__well">
          <img
            src={tabletopCategoryImage(category)}
            alt=""
            loading={!home && index < 4 ? "eager" : "lazy"}
            fetchPriority={!home && index === 0 ? "high" : undefined}
            decoding="async"
            onError={showFoodImageFallback}
          />
          {selected && (
            <svg className="editorial-plate__sparks" viewBox="0 0 200 160" fill="none" aria-hidden="true" focusable="false">
              <g className="editorial-plate__spark editorial-plate__spark--first"><path d="M35 22 V34 M29 28 H41" /><circle cx="35" cy="28" r="2" fill="currentColor" stroke="none" /></g>
              <g className="editorial-plate__spark editorial-plate__spark--second"><path d="M164 35 V49 M157 42 H171" /><circle cx="164" cy="42" r="2" fill="currentColor" stroke="none" /></g>
              <g className="editorial-plate__spark editorial-plate__spark--third"><path d="M171 112 V121 M166.5 116.5 H175.5" /><circle cx="171" cy="116.5" r="1.5" fill="currentColor" stroke="none" /></g>
              <g className="editorial-plate__spark editorial-plate__spark--fourth"><path d="M30 105 C25 99 22 100 20 104 C20 110 25 113 30 112 C32 110 33 107 30 105Z" /></g>
            </svg>
          )}
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
          <Heading id={headingId} className="editorial-category__detail-title">{category.name}</Heading>
          <p>{count} dishes</p>
          <button
            type="button"
            className="editorial-category__view"
            aria-describedby={headingId}
            onClick={() => navigate("dishes", category.id)}
          >
            <span>View Menu <ArrowUpRight size={14} aria-hidden="true" /></span>
          </button>
        </div>
      )}
    </li>
  );
}

export function EditorialCategories({
  home = false,
  initialSelectedId,
}: {
  home?: boolean;
  initialSelectedId?: string;
}) {
  const { categories: CATEGORIES, status } = useMenu();
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  // Deep links (home plates, search, dish pages) open the menu with one
  // category already revealed and scrolled into view.
  useEffect(() => {
    if (!initialSelectedId) return;
    const index = CATEGORIES.findIndex((entry) => entry.id === initialSelectedId);
    if (index < 0) return;
    setSelectedIndex(index);
    document.getElementById(`editorial-cat-${initialSelectedId}`)?.scrollIntoView({ block: "center" });
  }, [initialSelectedId, CATEGORIES]);

  return (
    <section
      className={cn("editorial-surface relative isolate overflow-hidden", home ? "editorial-surface--home" : "editorial-surface--menu")}
      aria-labelledby={home ? "home-category-title" : "menu-category-title"}
    >
      <svg
        className="editorial-surface__wave"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <path d="M 100 0 C 62 0 54 3 53 9 C 48 17 45 22 52 30 S 61 43 46 51 S 40 63 54 71 S 62 84 48 91 C 54 96 85 99 100 100 Z" />
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
            {status !== "ready" && (
              <p className="mt-3 max-w-md text-[13px] font-semibold text-ink" role="status">
                {status === "loading" ? "Loading the online menu…" : "Showing a sample menu; the online menu is unavailable."}
              </p>
            )}
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
              home={home}
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
