import { useEffect, useRef } from "react";

/** Move only a decorative light, never the card or its interactive targets. */
export function useCardSpotlight() {
  const cardRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const card = cardRef.current;
    const light = card?.querySelector<HTMLElement>(".food-card__spotlight");
    const imageArea = light?.parentElement;
    if (!card || !light || !imageArea) return;

    const preference = window.matchMedia("(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)");
    let frame = 0;
    let listening = false;
    let clientX = 0;
    let clientY = 0;

    const reset = () => {
      if (frame) window.cancelAnimationFrame(frame);
      frame = 0;
      light.style.removeProperty("transform");
    };
    const move = (event: PointerEvent) => {
      if (event.pointerType !== "mouse") return;
      clientX = event.clientX;
      clientY = event.clientY;
      if (!frame) {
        frame = window.requestAnimationFrame(() => {
          frame = 0;
          const rect = imageArea.getBoundingClientRect();
          if (!rect.width || !rect.height) return;
          const x = Math.max(0, Math.min(rect.width, clientX - rect.left)) - rect.width / 2;
          const y = Math.max(0, Math.min(rect.height, clientY - rect.top)) - rect.height / 2;
          light.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0) translate(-50%, -50%)`;
        });
      }
    };
    const sync = () => {
      if (preference.matches && !listening) {
        card.addEventListener("pointermove", move, { passive: true });
        card.addEventListener("pointerleave", reset);
        listening = true;
      } else if (!preference.matches && listening) {
        card.removeEventListener("pointermove", move);
        card.removeEventListener("pointerleave", reset);
        listening = false;
        reset();
      }
    };

    sync();
    preference.addEventListener("change", sync);
    return () => {
      preference.removeEventListener("change", sync);
      card.removeEventListener("pointermove", move);
      card.removeEventListener("pointerleave", reset);
      reset();
    };
  }, []);

  return cardRef;
}
