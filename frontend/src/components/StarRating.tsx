import { useState } from "react";
import { Star } from "lucide-react";

const storageKeyFor = (key: string) => `raaha:rating:${key}`;

function readStored(key: string): number {
  try {
    const value = Number(window.localStorage.getItem(storageKeyFor(key)));
    return Number.isInteger(value) && value >= 1 && value <= 5 ? value : 0;
  } catch {
    return 0;
  }
}

/* Interactive five-star input. A guest's own rating is kept on their
   device and folded into the seeded house average for the display. */
export function RateStars({
  storageKey,
  seedSum,
  seedCount,
  noun,
}: {
  storageKey: string;
  seedSum: number;
  seedCount: number;
  noun: string;
}) {
  const [mine, setMine] = useState(() => readStored(storageKey));
  const [hover, setHover] = useState(0);
  const submit = (value: number) => {
    setMine(value);
    try {
      window.localStorage.setItem(storageKeyFor(storageKey), String(value));
    } catch {
      /* private browsing: the rating still shows for this visit */
    }
  };
  const total = seedCount + (mine ? 1 : 0);
  const average = (seedSum + mine) / Math.max(1, total);
  const shown = hover || mine;
  return (
    <div className="rate-stars">
      <div className="rate-stars__input" role="group" aria-label={`Rate ${noun} from 1 to 5 stars`}>
        {[1, 2, 3, 4, 5].map((value) => (
          <button
            key={value}
            type="button"
            className={`rate-stars__btn ${shown >= value ? "is-on" : ""}`}
            aria-label={`Rate ${value} star${value > 1 ? "s" : ""}`}
            aria-pressed={mine === value}
            onClick={() => submit(value)}
            onMouseEnter={() => setHover(value)}
            onMouseLeave={() => setHover(0)}
          >
            <Star size={20} aria-hidden="true" focusable="false" />
          </button>
        ))}
      </div>
      <p className="rate-stars__summary" role="status">
        {mine
          ? `Thank you — you rated ${mine} star${mine > 1 ? "s" : ""} · `
          : "Tap a star to leave your rating · "}
        {average.toFixed(1)} average from {total.toLocaleString("en-IN")} guests
      </p>
    </div>
  );
}
