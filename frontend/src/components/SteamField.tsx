import { useRef } from "react";
import { cn } from "../utils/cn";
import { usePauseOffscreen } from "../utils/usePauseOffscreen";

/**
 * Rising steam over hot artwork. Purely decorative: the field is absolutely
 * positioned inside an existing `overflow-hidden` frame, so it changes no
 * layout and receives no input. It stops when its frame scrolls away.
 */
export function SteamField({ className, wisps = 3 }: { className?: string; wisps?: number }) {
  const fieldRef = useRef<HTMLDivElement>(null);
  usePauseOffscreen(fieldRef);
  const count = Math.max(1, Math.min(4, Math.floor(wisps)));
  return (
    <div ref={fieldRef} className={cn("steam-field", className)} aria-hidden="true">
      {Array.from({ length: count }, (_, index) => (
        <span key={index} className={cn("steam-wisp", `steam-wisp--${index + 1}`)} />
      ))}
    </div>
  );
}
