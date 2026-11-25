export const AMBIENT_MOTION_EVENT = "raaha:ambient-motion-change";
export const AMBIENT_MOTION_STORAGE_KEY = "raaha-ambient-motion";

/** The in-page control pauses automatic decoration; the OS preference still wins. */
export function isAmbientMotionPaused() {
  return document.documentElement.dataset.ambientMotion === "paused";
}
