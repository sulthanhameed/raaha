import { useEffect } from "react";
import { subscribeMotionPreference, supportsFinePointerMotion } from "./motionPrefs";

const LIGHT_CLASS = "section-light";
const CREATED_MARK = "data-section-light-created";

/**
 * Give every `[data-section-light]` banner a warm pool of light that follows a
 * fine pointer. The pool is an appended decorative span: it never receives
 * input, never changes the banner's size, and is removed again on cleanup.
 * Touch devices, reduced motion and the footer pause switch leave it invisible.
 */
export function useSectionLights(...deps: unknown[]) {
  useEffect(() => {
    if (typeof document === "undefined") return;
    const sections = Array.from(document.querySelectorAll<HTMLElement>("[data-section-light]"));
    if (sections.length === 0) return;

    const cleanups: Array<() => void> = [];

    for (const section of sections) {
      let light = section.querySelector<HTMLElement>(`.${LIGHT_CLASS}[${CREATED_MARK}]`);
      const ensureLight = () => {
        if (light) return light;
        const created = document.createElement("span");
        created.className = LIGHT_CLASS;
        created.setAttribute("aria-hidden", "true");
        created.setAttribute(CREATED_MARK, "true");
        section.appendChild(created);
        light = created;
        return light;
      };
      const removeLight = () => {
        light?.remove();
        light = null;
        delete section.dataset.lightActive;
      };

      let frame = 0;
      let pointerX = 0;
      let pointerY = 0;

      const place = () => {
        frame = 0;
        const node = light;
        if (!node) return;
        const rect = section.getBoundingClientRect();
        if (!rect.width || !rect.height) return;
        const x = Math.max(0, Math.min(rect.width, pointerX - rect.left));
        const y = Math.max(0, Math.min(rect.height, pointerY - rect.top));
        node.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0) translate(-50%, -50%)`;
      };
      const onMove = (event: PointerEvent) => {
        if (event.pointerType !== "mouse") return;
        pointerX = event.clientX;
        pointerY = event.clientY;
        section.dataset.lightActive = "true";
        ensureLight();
        if (!frame) frame = requestAnimationFrame(place);
      };
      const onLeave = () => {
        section.dataset.lightActive = "false";
      };

      const sync = () => {
        if (supportsFinePointerMotion()) {
          if (!section.dataset.lightBound) {
            section.dataset.lightBound = "true";
            section.addEventListener("pointermove", onMove, { passive: true });
            section.addEventListener("pointerleave", onLeave);
          }
        } else {
          section.removeEventListener("pointermove", onMove);
          section.removeEventListener("pointerleave", onLeave);
          delete section.dataset.lightBound;
          if (frame) cancelAnimationFrame(frame);
          frame = 0;
          removeLight();
        }
      };

      sync();
      const dispose = subscribeMotionPreference(sync);
      cleanups.push(() => {
        dispose();
        section.removeEventListener("pointermove", onMove);
        section.removeEventListener("pointerleave", onLeave);
        delete section.dataset.lightBound;
        if (frame) cancelAnimationFrame(frame);
        frame = 0;
        removeLight();
      });
    }

    return () => cleanups.forEach((cleanup) => cleanup());
    // Re-scan whenever the rendered route changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}
