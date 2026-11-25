import { useEffect, useRef, useState } from "react";
import { prefersReducedMotion, subscribeMotionPreference } from "./motionPrefs";

const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

type CountUpOptions = {
  /** Value the first animation starts from; defaults to the target (no intro count). */
  initial?: number;
  duration?: number;
};

/**
 * Count a displayed number up or down. The animated value is decorative:
 * callers keep the final value in an `sr-only` node so assistive technology
 * never hears a rapid series of intermediate amounts. Reduced motion makes the
 * value appear immediately, on first paint and on later changes.
 */
export function useCountUp(value: number, { initial, duration = 900 }: CountUpOptions = {}) {
  const target = Number.isFinite(value) ? value : 0;
  const [display, setDisplay] = useState(() => (prefersReducedMotion() ? target : initial ?? target));
  const displayRef = useRef(display);
  displayRef.current = display;

  useEffect(() => {
    let frame = 0;

    const run = () => {
      if (frame) cancelAnimationFrame(frame);
      frame = 0;
      if (prefersReducedMotion()) { setDisplay(target); return; }
      const from = displayRef.current;
      if (Math.abs(from - target) < 0.005) { setDisplay(target); return; }
      const start = performance.now();
      const step = (now: number) => {
        frame = 0;
        const progress = Math.min(1, Math.max(0, (now - start) / duration));
        setDisplay(from + (target - from) * easeOutCubic(progress));
        if (progress < 1) frame = requestAnimationFrame(step);
      };
      frame = requestAnimationFrame(step);
    };

    // Also restart cleanly if the visitor toggles reduced motion mid-flight.
    const dispose = subscribeMotionPreference(run);
    return () => { dispose(); if (frame) cancelAnimationFrame(frame); frame = 0; };
  }, [target, duration]);

  return display;
}
