import { AMBIENT_MOTION_EVENT, isAmbientMotionPaused } from "./ambientMotion";

/**
 * One place for "may this decoration move?" so every effect uses the same
 * rules: the OS reduced-motion preference always wins, the footer control
 * pauses continuous ambience, and short user-triggered feedback is separate.
 */
export const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";
export const POINTER_MOTION_QUERY = "(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)";

export function prefersReducedMotion() {
  return typeof window !== "undefined" && typeof window.matchMedia === "function"
    && window.matchMedia(REDUCED_MOTION_QUERY).matches;
}

export function supportsFinePointerMotion() {
  return typeof window !== "undefined" && typeof window.matchMedia === "function"
    && window.matchMedia(POINTER_MOTION_QUERY).matches;
}

/** Continuous decoration: honours reduced motion and the footer pause control. */
export function ambientMotionAllowed() {
  return !prefersReducedMotion() && !isAmbientMotionPaused();
}

/** Brief feedback after a tap/click: only reduced motion disables it. */
export function feedbackMotionAllowed() {
  return !prefersReducedMotion();
}

/** Call `sync` now and again whenever a motion preference or pause changes. */
export function subscribeMotionPreference(sync: () => void) {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") return () => {};
  const reduced = window.matchMedia(REDUCED_MOTION_QUERY);
  const pointer = window.matchMedia(POINTER_MOTION_QUERY);
  const onChange = () => sync();
  reduced.addEventListener("change", onChange);
  pointer.addEventListener("change", onChange);
  window.addEventListener(AMBIENT_MOTION_EVENT, onChange);
  sync();
  return () => {
    reduced.removeEventListener("change", onChange);
    pointer.removeEventListener("change", onChange);
    window.removeEventListener(AMBIENT_MOTION_EVENT, onChange);
  };
}

/** Web Animations API availability; effects degrade to no animation without it. */
export function supportsWaapi() {
  return typeof Element !== "undefined" && typeof Element.prototype.animate === "function";
}
