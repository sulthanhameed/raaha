import { useEffect, useRef, type CSSProperties } from "react";
import { AMBIENT_MOTION_EVENT, isAmbientMotionPaused } from "../utils/ambientMotion";

// Fixed positions keep the effect deterministic on every render; only the
// decorative layer moves, never the hero's text or its interactive controls.
// Three hand-drawn, gently moving ribbons suggest aroma rising over the food.
const SCENT_PATHS = [
  "M 60 570 C 135 468 206 438 338 423 C 493 405 568 318 540 227 C 519 155 570 70 690 26",
  "M 690 575 C 575 520 456 522 397 446 C 337 369 383 312 443 249 C 505 181 450 95 359 24",
  "M 700 430 C 594 421 511 386 496 326 C 473 240 555 198 650 148 C 686 129 695 95 696 52",
];

const EMBERS = [
  { x: 53, y: 17, size: 3, duration: 12, delay: -2, drift: -24 },
  { x: 61, y: 38, size: 2, duration: 15, delay: -9, drift: 18 },
  { x: 68, y: 12, size: 3, duration: 13, delay: -6, drift: -28 },
  { x: 73, y: 54, size: 2, duration: 16, delay: -11, drift: 22 },
  { x: 81, y: 24, size: 4, duration: 14, delay: -4, drift: -16 },
  { x: 88, y: 44, size: 2, duration: 11, delay: -7, drift: 24 },
  { x: 95, y: 13, size: 3, duration: 15, delay: -10, drift: -22 },
  { x: 45, y: 8, size: 2, duration: 14, delay: -5, drift: 16 },
  { x: 77, y: 7, size: 2, duration: 12, delay: -8, drift: -18 },
  { x: 57, y: 66, size: 2, duration: 17, delay: -13, drift: 21 },
  { x: 90, y: 70, size: 3, duration: 16, delay: -3, drift: -24 },
  { x: 66, y: 82, size: 2, duration: 13, delay: -9, drift: 15 },
];

export function EmberAtmosphere() {
  const fieldRef = useRef<HTMLDivElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const field = fieldRef.current;
    const glow = glowRef.current;
    const hero = field?.closest<HTMLElement>(".home-hero");
    if (!field || !glow || !hero) return;

    const pointerMotion = window.matchMedia("(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)");
    let frame = 0;
    let listening = false;
    let x = 0;
    let y = 0;

    const resetGlow = () => {
      if (frame) window.cancelAnimationFrame(frame);
      frame = 0;
      glow.style.transform = "";
    };
    const onMove = (event: PointerEvent) => {
      const rect = hero.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      const horizontal = Math.max(-1, Math.min(1, (event.clientX - rect.left) / rect.width * 2 - 1));
      const vertical = Math.max(-1, Math.min(1, (event.clientY - rect.top) / rect.height * 2 - 1));
      x = horizontal * 14;
      y = vertical * 10;
      if (!frame) {
        frame = window.requestAnimationFrame(() => {
          glow.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`;
          frame = 0;
        });
      }
    };
    const syncPointerMotion = () => {
      const enabled = pointerMotion.matches && !isAmbientMotionPaused();
      if (enabled && !listening) {
        hero.addEventListener("pointermove", onMove, { passive: true });
        hero.addEventListener("pointerleave", resetGlow);
        listening = true;
      } else if (!enabled && listening) {
        hero.removeEventListener("pointermove", onMove);
        hero.removeEventListener("pointerleave", resetGlow);
        listening = false;
        resetGlow();
      }
    };
    syncPointerMotion();
    pointerMotion.addEventListener("change", syncPointerMotion);
    window.addEventListener(AMBIENT_MOTION_EVENT, syncPointerMotion);

    const visibility = typeof IntersectionObserver === "undefined" ? null : new IntersectionObserver(([entry]) => {
      hero.dataset.motionPaused = entry.isIntersecting ? "false" : "true";
    });
    visibility?.observe(hero);

    return () => {
      pointerMotion.removeEventListener("change", syncPointerMotion);
      window.removeEventListener(AMBIENT_MOTION_EVENT, syncPointerMotion);
      hero.removeEventListener("pointermove", onMove);
      hero.removeEventListener("pointerleave", resetGlow);
      resetGlow();
      visibility?.disconnect();
      delete hero.dataset.motionPaused;
    };
  }, []);

  return (
    <div ref={fieldRef} className="home-hero__atmosphere" aria-hidden="true">
      <div ref={glowRef} className="home-hero__glow"><span /></div>
      <svg className="home-hero__scent" viewBox="0 0 700 600" fill="none" focusable="false">
        <defs>
          <linearGradient id="home-scent-gold" x1="0" y1="1" x2="1" y2="0">
            <stop stopColor="#be6c30" stopOpacity=".15" />
            <stop offset=".48" stopColor="#f4cb80" />
            <stop offset="1" stopColor="#fbe8bc" stopOpacity=".15" />
          </linearGradient>
        </defs>
        {SCENT_PATHS.map((path, index) => (
          <g key={path}>
            <path className="home-hero__scent-guide" d={path} vectorEffect="non-scaling-stroke" />
            <path
              className={`home-hero__scent-trail home-hero__scent-trail--${index + 1}`}
              d={path}
              pathLength={100}
              vectorEffect="non-scaling-stroke"
            />
          </g>
        ))}
      </svg>
      <div className="home-hero__embers">
        {EMBERS.map((ember, index) => (
          <span
            key={index}
            className="home-hero__ember"
            style={{
              left: `${ember.x}%`,
              bottom: `${ember.y}%`,
              "--ember-size": `${ember.size}px`,
              "--ember-duration": `${ember.duration}s`,
              "--ember-delay": `${ember.delay}s`,
              "--ember-drift": `${ember.drift}px`,
            } as CSSProperties}
          />
        ))}
      </div>
    </div>
  );
}
