import { useRef } from "react";
import { cn } from "../utils/cn";
import { usePauseOffscreen } from "../utils/usePauseOffscreen";

/**
 * A slow breathing light behind a dark banner's content, plus an optional single
 * gold sweep when the banner arrives. Both sit inside the banner's existing
 * `overflow-hidden` frame: no layout change, no input, paused offscreen.
 */
export function BannerGlow({ className, sweep = false }: { className?: string; sweep?: boolean }) {
  const glowRef = useRef<HTMLDivElement>(null);
  usePauseOffscreen(glowRef);
  return (
    <>
      {sweep && <span className="banner-sweep" aria-hidden="true" />}
      <div ref={glowRef} className={cn("banner-glow", className)} aria-hidden="true">
        <span />
      </div>
    </>
  );
}
