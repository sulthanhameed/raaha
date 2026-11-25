import { useEffect } from "react";
import { feedbackMotionAllowed, subscribeMotionPreference, supportsFinePointerMotion, supportsWaapi } from "./motionPrefs";

const CTA_SELECTOR = ".motion-cta";
const GLOW_SELECTOR = ".motion-cta__glow";
const RIPPLE_SELECTOR = ".m3-button:not(.m3-icon-button):not([data-no-ripple])";
const RIPPLE_CLASS = "press-ripple";

/**
 * One delegated pointer layer for the whole app:
 *  - a magnetic glow that tracks the cursor inside any `.motion-cta` that
 *    contains a `.motion-cta__glow` span (the button box never moves);
 *  - a Material-style press ripple inside `.m3-button` controls.
 * Both are decoration: `pointer-events: none`, removed on completion, and
 * disabled for reduced motion, coarse pointers and unsupported browsers.
 */
export function usePointerFeedback() {
  useEffect(() => {
    if (typeof document === "undefined") return;
    let glowFrame = 0;
    let glowTarget: HTMLElement | null = null;
    let glowX = 0;
    let glowY = 0;
    let bound = false;
    let rippleBound = false;

    const placeGlow = () => {
      glowFrame = 0;
      const cta = glowTarget;
      const glow = cta?.querySelector<HTMLElement>(GLOW_SELECTOR);
      if (!cta || !glow) return;
      const rect = cta.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      const x = Math.max(0, Math.min(rect.width, glowX - rect.left));
      const y = Math.max(0, Math.min(rect.height, glowY - rect.top));
      glow.style.setProperty("--glow-x", `${x.toFixed(1)}px`);
      glow.style.setProperty("--glow-y", `${y.toFixed(1)}px`);
    };
    const onMove = (event: PointerEvent) => {
      if (event.pointerType !== "mouse") return;
      const target = event.target as Element | null;
      const cta = target?.closest?.(CTA_SELECTOR) as HTMLElement | null;
      if (!cta) return;
      glowTarget = cta;
      glowX = event.clientX;
      glowY = event.clientY;
      if (!glowFrame) glowFrame = requestAnimationFrame(placeGlow);
    };
    const onDown = (event: PointerEvent) => {
      if (!feedbackMotionAllowed() || !supportsWaapi()) return;
      const target = event.target as Element | null;
      const button = target?.closest?.(RIPPLE_SELECTOR) as HTMLElement | null;
      if (!button || button.hasAttribute("disabled")) return;
      const rect = button.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      const size = Math.max(rect.width, rect.height) * 1.6;
      const x = (event.pointerType === "mouse" ? event.clientX : rect.left + rect.width / 2) - rect.left - size / 2;
      const y = (event.pointerType === "mouse" ? event.clientY : rect.top + rect.height / 2) - rect.top - size / 2;
      const ripple = document.createElement("span");
      ripple.className = `${RIPPLE_CLASS}${button.classList.contains("m3-button--filled") || button.classList.contains("m3-button--inverse") ? "" : " press-ripple--ink"}`;
      ripple.setAttribute("aria-hidden", "true");
      ripple.style.width = `${size.toFixed(1)}px`;
      ripple.style.height = `${size.toFixed(1)}px`;
      ripple.style.left = `${x.toFixed(1)}px`;
      ripple.style.top = `${y.toFixed(1)}px`;
      button.appendChild(ripple);
      const animation = ripple.animate(
        [
          { opacity: 0, transform: "scale(.28)" },
          { opacity: .55, transform: "scale(.72)", offset: .35 },
          { opacity: 0, transform: "scale(1.05)" },
        ],
        { duration: 520, easing: "cubic-bezier(.22, 1, .36, 1)" }
      );
      animation.onfinish = () => ripple.remove();
      animation.oncancel = () => ripple.remove();
      // Safety net if the animation events never fire.
      window.setTimeout(() => ripple.remove(), 900);
    };

    const sync = () => {
      const wanted = supportsFinePointerMotion();
      if (wanted && !bound) {
        document.addEventListener("pointermove", onMove, { passive: true });
        bound = true;
      } else if (!wanted && bound) {
        document.removeEventListener("pointermove", onMove);
        bound = false;
        if (glowFrame) cancelAnimationFrame(glowFrame);
        glowFrame = 0;
        glowTarget = null;
      }
      const rippleWanted = feedbackMotionAllowed() && supportsWaapi();
      if (rippleWanted && !rippleBound) {
        document.addEventListener("pointerdown", onDown, { passive: true });
        rippleBound = true;
      } else if (!rippleWanted && rippleBound) {
        document.removeEventListener("pointerdown", onDown);
        rippleBound = false;
      }
    };

    sync();
    const dispose = subscribeMotionPreference(sync);
    return () => {
      dispose();
      document.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerdown", onDown);
      rippleBound = false;
      if (glowFrame) cancelAnimationFrame(glowFrame);
      glowFrame = 0;
      glowTarget = null;
    };
  }, []);
}
