import { useEffect, type RefObject } from "react";

/** Pause CSS-only decoration when its container is outside the viewport.
 * Without IntersectionObserver the decoration remains usable and motion
 * preferences are still enforced by CSS. No scroll handlers or re-renders. */
export function usePauseOffscreen(ref: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const element = ref.current;
    if (!element || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry) element.dataset.motionPaused = entry.isIntersecting ? "false" : "true";
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, [ref]);
}
