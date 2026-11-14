import { useEffect, useRef, useState, type TouchEvent } from "react";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import { formatPrice, type Category, type FoodItem } from "../data/menu";
import { useApp } from "../store/app";
import { cn } from "../utils/cn";

const TABLE_PHOTO =
  "https://images.pexels.com/photos/9367128/pexels-photo-9367128.jpeg?auto=compress&cs=tinysrgb&fit=crop&w=1800&h=1200";
const VISIBLE_OFFSETS = [-2, -1, 0, 1, 2];
const vesselFor = (item: FoodItem) => {
  if (item.category === "beverages" || item.id === "kulfi-falooda") return "glass";
  if (["starters", "grill-tandoor", "south-indian", "breads-rice"].includes(item.category)) return "plate";
  return "bowl";
};
const foodPhoto = (item: FoodItem) =>
  item.image.replace("h=627&w=1200", vesselFor(item) === "glass" ? "h=720&w=500" : "h=560&w=560");
const arcLabel = (name: string) => {
  const short = name
    .replace(/^(Madurai|Raaha)\s+/i, "")
    .replace(/\s+Seeraga Samba/i, "")
    .replace(/\s+\([^)]*\)/g, "")
    .trim();
  if (short.length <= 23) return short;
  const words = short.split(/\s+/);
  return `${words[0]} ${words[words.length - 1]}`;
};

function DishBowl({
  item,
  position,
  active,
  onOpen,
}: {
  item: FoodItem;
  position: number;
  active: boolean;
  onOpen: () => void;
}) {
  const arcId = `dish-arc-${item.id}`;
  const vessel = vesselFor(item);

  return (
    <button
      type="button"
      className={cn("food-spread__bowl", `food-spread__bowl--${position + 1}`, `food-spread__bowl--${vessel}`, active && "is-active")}
      onClick={onOpen}
      aria-label={`View ${item.name}, ${formatPrice(item.price)}`}
      aria-pressed={active}
    >
      <span className="food-spread__dish">
        <img src={foodPhoto(item)} alt={item.name} loading={active ? "eager" : "lazy"} decoding="async" />
      </span>
      <svg className="food-spread__arc" viewBox={vessel === "glass" ? "0 0 260 260" : "0 0 260 190"} aria-hidden="true">
        <defs>
          <path id={arcId} d={vessel === "glass" ? "M 12 100 C 50 0 210 0 248 100" : "M 12 95 C 50 -10 210 -10 248 95"} />
        </defs>
        <text>
          <textPath href={`#${arcId}`} startOffset="50%" textAnchor="middle">
            {arcLabel(item.name).toUpperCase()}
          </textPath>
        </text>
      </svg>
    </button>
  );
}

function MenuList({
  title,
  items,
  activeId,
  onOpen,
}: {
  title: string[];
  items: FoodItem[];
  activeId: string;
  onOpen: (item: FoodItem) => void;
}) {
  return (
    <div className="food-spread__menu-column">
      <h2>
        {title.map((line) => <span key={line}>{line}</span>)}
      </h2>
      <ul>
        {items.map((item) => (
          <li key={item.id}>
            <button
              type="button"
              className={item.id === activeId ? "is-active" : ""}
              onClick={() => onOpen(item)}
              aria-label={`${item.name}, ${formatPrice(item.price)}, ${item.veg ? "vegetarian" : "non-vegetarian"}. View dish`}
            >
              <span className="food-spread__item-name">{item.name}</span>
              <span className="food-spread__item-price">{formatPrice(item.price)}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function CategoryFoodShowcase({ category, items }: { category: Category; items: FoodItem[] }) {
  const { navigate } = useApp();
  const [active, setActive] = useState(Math.min(2, items.length - 1));
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const selected = items[active];
  const splitAt = Math.ceil(items.length / 2);
  const longestWord = Math.max(...category.name.split(/\W+/).map((word) => word.length));
  const titleSize = category.name.length > 18 || longestWord > 8 ? "is-long" : category.name.length > 7 ? "is-medium" : "";

  useEffect(() => {
    [-3, 3].forEach((offset) => {
      const index = (active + offset + items.length) % items.length;
      const image = new Image();
      image.src = foodPhoto(items[index]);
    });
  }, [active, items]);

  const step = (direction: number) => {
    setActive((current) => (current + direction + items.length) % items.length);
  };

  const open = (item: FoodItem) => {
    navigate("food", item.id);
  };

  const onTouchStart = (event: TouchEvent<HTMLElement>) => {
    touchStart.current = { x: event.touches[0].clientX, y: event.touches[0].clientY };
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
      className="food-spread"
      role="region"
      aria-roledescription="carousel"
      aria-label={`${category.name} dishes`}
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
      <img className="food-spread__table" src={TABLE_PHOTO} alt="Real wooden restaurant table set with chairs" loading="eager" decoding="async" />
      <div className="food-spread__shade" aria-hidden="true" />

      <div className="food-spread__headline">
        <p>RAAHA / MADURAI</p>
        <h1>
          <span>THE</span>
          <strong className={titleSize}>{category.name}</strong>
          <span>MENU</span>
        </h1>
      </div>

      <div className="food-spread__featured" key={selected.id} aria-live="polite">
        <p>{String(active + 1).padStart(2, "0")} / {String(items.length).padStart(2, "0")} &nbsp; {category.name.toUpperCase()}</p>
        <h2>{selected.name}</h2>
        <span>{formatPrice(selected.price)}</span>
        <button type="button" onClick={() => open(selected)}>
          View Dish <ArrowRight size={15} aria-hidden="true" />
        </button>
      </div>

      <div className="food-spread__bowls" aria-label={`${category.name} food photos`}>
        {VISIBLE_OFFSETS.map((offset, position) => {
          const index = (active + offset + items.length) % items.length;
          const item = items[index];
          return (
            <DishBowl
              key={item.id}
              item={item}
              position={position}
              active={offset === 0}
              onOpen={() => open(item)}
            />
          );
        })}
      </div>

      <div className="food-spread__menu">
        <MenuList title={["CHOOSE", "YOUR", "PLATE:"]} items={items.slice(0, splitAt)} activeId={selected.id} onOpen={open} />
        <MenuList title={["MORE", "TO", "SAVOUR:"]} items={items.slice(splitAt)} activeId={selected.id} onOpen={open} />
      </div>

      <div className="food-spread__controls" aria-label="Dish slide controls">
        <button type="button" onClick={() => step(-1)} aria-label="Previous dish"><ChevronLeft size={19} aria-hidden="true" /></button>
        <span>{String(active + 1).padStart(2, "0")} / {String(items.length).padStart(2, "0")}</span>
        <button type="button" onClick={() => step(1)} aria-label="Next dish"><ChevronRight size={19} aria-hidden="true" /></button>
      </div>
    </section>
  );
}