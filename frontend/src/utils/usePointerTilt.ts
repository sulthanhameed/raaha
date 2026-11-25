import { useEffect, useRef } from "react";
import { subscribeMotionPreference, supportsFinePointerMotion } from "./motionPrefs";

type TiltOptions = {
  /** Maximum lean in degrees. Kept small so artwork never leaves its frame. */
  maxDegrees?: number;
  /** Selector of the decorative layer inside the container that may lean. */
  layerSelector?: string;
};

/**
 * Lean a decorative artwork layer toward a fine pointer. Only the layer named
 * by `layerSelector` is transformed: the container keeps its box, so stretched
 * buttons, links and their hit targets stay exactly where they were.
 *
 * The pointer listener sits on the container, so the container must be an
 * ancestor of whatever element receives the pointer (a stretched overlay button
 * is fine — events bubble to it).
 */
export function usePointerTilt<T extends HTMLElement>({ maxDegrees = 4, layerSelector = "[data-tilt-layer]" }: TiltOptions = {}) {
  const containerRef = useRef<T>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const layer = container.querySelector<HTMLElement>(layerSelector);
    if (!layer) return;

    let frame = 0;
    let clientX = 0;
    let clientY = 0;
    let bound = false;

    const reset = () => {
      if (frame) cancelAnimationFrame(frame);
      frame = 0;
      layer.style.transform = "";
    };
    const apply = () => {
      frame = 0;
      // Measure the container, never the layer: the layer is already transformed,
      // and feeding that back would make the lean drift frame after frame.
      const rect = container.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      // Progress from -1..1 across the container, clamped to its box.
      const px = Math.max(-1, Math.min(1, ((clientX - rect.left) / rect.width) * 2 - 1));
      const py = Math.max(-1, Math.min(1, ((clientY - rect.top) / rect.height) * 2 - 1));
      const rotateY = (px * maxDegrees).toFixed(2);
      const rotateX = (-py * maxDegrees).toFixed(2);
      layer.style.transform = `perspective(900px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.035, 1.035, 1)`;
    };
    const onMove = (event: PointerEvent) => {
      if (event.pointerType !== "mouse") return;
      clientX = event.clientX;
      clientY = event.clientY;
      if (!frame) frame = requestAnimationFrame(apply);
    };

    const sync = () => {
      if (supportsFinePointerMotion() && !bound) {
        container.addEventListener("pointermove", onMove, { passive: true });
        container.addEventListener("pointerleave", reset);
        bound = true;
      } else if (!supportsFinePointerMotion() && bound) {
        container.removeEventListener("pointermove", onMove);
        container.removeEventListener("pointerleave", reset);
        bound = false;
        reset();
      }
    };

    sync();
    const dispose = subscribeMotionPreference(sync);
    return () => {
      dispose();
      container.removeEventListener("pointermove", onMove);
      container.removeEventListener("pointerleave", reset);
      reset();
    };
  }, [maxDegrees, layerSelector]);

  return containerRef;
}
