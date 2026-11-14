import { useEffect, useRef, useState, type TouchEvent } from "react";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import { CATEGORIES, itemsByCategory, type Category } from "../data/menu";
import { useApp } from "../store/app";

const VISIBLE_OFFSETS = [-2, -1, 0, 1, 2];
const thumbnailFor = (category: Category) => category.image.replace("h=627&w=1200", "h=560&w=560");

function CategoryBowl({
  category,
  categoryIndex,
  position,
  selected,
  onSelect,
}: {
  category: Category;
  categoryIndex: number;
  position: number;
  selected: boolean;
  onSelect: () => void;
}) {
  const arcId = `category-arc-${category.id}`;
  const count = itemsByCategory(category.id).length;

  return (
    <button
      type="button"
      className={`category-showcase__bowl category-showcase__bowl--${position + 1} ${selected ? "is-selected" : ""}`}
      onClick={onSelect}
      aria-label={`Select ${category.name}, ${count} dishes`}
      aria-pressed={selected}
    >
      <span className="category-showcase__dish">
        <img
          src={thumbnailFor(category)}
          alt={`Food representing ${category.name}`}
          loading={selected ? "eager" : "lazy"}
          decoding="async"
        />
      </span>
      <svg className="category-showcase__arc" viewBox="0 0 220 220" aria-hidden="true">
        <defs>
          <path id={arcId} d="M 18 113 A 92 92 0 0 1 202 113" />
        </defs>
        <text>
          <textPath href={`#${arcId}`} startOffset="50%" textAnchor="middle">
            RAAHA / {String(categoryIndex + 1).padStart(2, "0")}
          </textPath>
        </text>
      </svg>
    </button>
  );
}

export function CategoryShowcase() {
  const { navigate } = useApp();
  const [active, setActive] = useState(2);
  const [engaged, setEngaged] = useState(false);
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const selectionRef = useRef<HTMLDivElement | null>(null);
  const selected = CATEGORIES[active];
  const count = itemsByCategory(selected.id).length;

  useEffect(() => {
    // The two bowls just outside the current five-photo window are next in either direction.
    [-3, 3].forEach((offset) => {
      const index = (active + offset + CATEGORIES.length) % CATEGORIES.length;
      const image = new Image();
      image.src = thumbnailFor(CATEGORIES[index]);
    });
  }, [active]);

  useEffect(() => {
    if (!engaged || !window.matchMedia("(max-width: 767px)").matches) return;
    const frame = window.requestAnimationFrame(() => {
      const bounds = selectionRef.current?.getBoundingClientRect();
      if (bounds && bounds.bottom > window.innerHeight - 16) {
        window.scrollBy({ top: bounds.bottom - window.innerHeight + 32, behavior: "smooth" });
      }
    });
    return () => window.cancelAnimationFrame(frame);
  }, [active, engaged]);

  const step = (direction: number) => {
    setActive((current) => (current + direction + CATEGORIES.length) % CATEGORIES.length);
    setEngaged(true);
  };

  const select = (index: number) => {
    setActive(index);
    setEngaged(true);
  };

  const onTouchStart = (event: TouchEvent<HTMLElement>) => {
    touchStart.current = {
      x: event.touches[0].clientX,
      y: event.touches[0].clientY,
    };
  };

  const onTouchEnd = (event: TouchEvent<HTMLElement>) => {
    const start = touchStart.current;
    touchStart.current = null;
    if (!start) return;
    const dx = event.changedTouches[0].clientX - start.x;
    const dy = event.changedTouches[0].clientY - start.y;
    if (Math.abs(dx) > 55 && Math.abs(dx) > Math.abs(dy) * 1.3) step(dx < 0 ? 1 : -1);
  };

  return (
    <section
      className="category-showcase"
      role="region"
      aria-roledescription="carousel"
      aria-label="Browse Raaha food categories"
      tabIndex={0}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      onKeyDown={(event) => {
        if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
          event.preventDefault();
          step(event.key === "ArrowRight" ? 1 : -1);
        }
      }}
    >
      <svg
        className="category-showcase__wave"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <path d="M 54 0 C 43 13 46 24 55 34 S 61 48 48 59 S 38 76 53 86 S 58 96 52 100 L 100 100 L 100 0 Z" />
      </svg>
      <div className="category-showcase__texture" aria-hidden="true" />

      <div className="category-showcase__headline">
        <p>RAAHA / RESTAURANT &amp; GRILL</p>
        <h1 className="category-showcase__title">
          <span>THE</span>
          <strong>RAAHA</strong>
          <span>MENU</span>
        </h1>
      </div>

      <div className="category-showcase__note">
        <span>tap a bowl or use the arrows<br />to explore all eight menus.</span>
        <svg viewBox="0 0 42 44" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true">
          <path d="M9 7c12-8 29 4 26 18-2 12-19 15-26 4-6-10 7-18 16-9" />
          <path d="m20 18 5 2-3 5" />
        </svg>
      </div>

      <svg className="category-showcase__brush" viewBox="0 0 300 180" fill="none" aria-hidden="true">
        <path d="M284 12C161 17 42 81 37 167" stroke="currentColor" strokeWidth="9" strokeLinecap="round" />
        <path d="M269 34C139 56 71 109 83 171" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
        <path d="M241 18C147 7 51 33 12 91" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>

      <div className="category-showcase__bowls" aria-label="Select a category">
        {VISIBLE_OFFSETS.map((offset, position) => {
          const categoryIndex = (active + offset + CATEGORIES.length) % CATEGORIES.length;
          const category = CATEGORIES[categoryIndex];
          return (
            <CategoryBowl
              key={category.id}
              category={category}
              categoryIndex={categoryIndex}
              position={position}
              selected={engaged && offset === 0}
              onSelect={() => select(categoryIndex)}
            />
          );
        })}
      </div>

      <div className="category-showcase__footer">
        <div className="category-showcase__prompt" aria-hidden="true">
          <span>CHOOSE</span>
          <span>YOUR</span>
          <span>CATEGORY</span>
        </div>
        <div className="category-showcase__selection" aria-live="polite">
          {engaged ? (
            <div className="category-showcase__selection-content" key={selected.id} ref={selectionRef}>
              <p>NOW EXPLORING / {String(active + 1).padStart(2, "0")}</p>
              <h2>{selected.name}</h2>
              <span>{count} dishes</span>
              <button type="button" onClick={() => navigate("category", selected.id)}>
                Explore Menu <ArrowRight size={17} aria-hidden="true" />
              </button>
            </div>
          ) : (
            <p className="category-showcase__selection-hint">SELECT A PLATE<br />TO BEGIN</p>
          )}
        </div>
      </div>

      <div className="category-showcase__controls" aria-label="Category slide controls">
        <button type="button" onClick={() => step(-1)} aria-label="Previous category">
          <ChevronLeft size={19} aria-hidden="true" />
        </button>
        <span>{String(active + 1).padStart(2, "0")} / {String(CATEGORIES.length).padStart(2, "0")}</span>
        <button type="button" onClick={() => step(1)} aria-label="Next category">
          <ChevronRight size={19} aria-hidden="true" />
        </button>
      </div>
    </section>
  );
}