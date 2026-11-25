import { useEffect, useRef } from "react";
import { CART_ARRIVAL_EVENT, CART_FLIGHT_EVENT, cartTarget } from "../utils/cartFlight";
import { feedbackMotionAllowed, supportsWaapi } from "../utils/motionPrefs";

type FlightDetail = { x: number; y: number };

/**
 * Decorative arc from the control a visitor tapped into the header cart. The
 * layer is fixed, empty until a flight starts, and cannot receive input. It
 * adds nothing to the cart: state changes come from the store alone.
 */
export function CartFlightLayer() {
  const layerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const layer = layerRef.current;
    if (!layer) return;

    const onFlight = (event: Event) => {
      const detail = (event as CustomEvent<FlightDetail>).detail;
      if (!detail || !feedbackMotionAllowed() || !supportsWaapi()) return;
      const target = cartTarget();
      if (!target) return;
      const to = target.getBoundingClientRect();
      if (!to.width || !to.height) return;

      const fromX = detail.x;
      const fromY = detail.y;
      const toX = to.left + to.width / 2;
      const toY = to.top + to.height / 2;
      const dx = toX - fromX;
      const dy = toY - fromY;

      const chip = document.createElement("span");
      chip.className = "cart-flight__chip";
      chip.setAttribute("aria-hidden", "true");
      const trail = document.createElement("span");
      trail.className = "cart-flight__trail";
      trail.setAttribute("aria-hidden", "true");
      layer.append(trail, chip);

      // A lifted arc reads as food travelling to the basket, not a straight line.
      const arc = (lift: number) => [
        { transform: `translate3d(${fromX}px, ${fromY}px, 0) translate(-50%, -50%) scale(.45)`, opacity: 0 },
        { transform: `translate3d(${fromX + dx * 0.42}px, ${fromY + dy * 0.42 - lift}px, 0) translate(-50%, -50%) scale(1)`, opacity: 1, offset: 0.42 },
        { transform: `translate3d(${toX}px, ${toY}px, 0) translate(-50%, -50%) scale(.28)`, opacity: 0 },
      ];
      const timing = { duration: 980, easing: "cubic-bezier(.36, .06, .24, 1)" };

      let settled = false;
      const cleanup = () => { chip.remove(); trail.remove(); };
      const finish = () => {
        cleanup();
        if (settled) return;
        settled = true;
        window.dispatchEvent(new CustomEvent(CART_ARRIVAL_EVENT));
      };

      const flight = chip.animate(arc(86), timing);
      trail.animate(arc(104), { ...timing, delay: 60 });
      flight.onfinish = finish;
      flight.oncancel = () => { settled = true; cleanup(); };
      // Never leave a glyph behind if the tab is hidden mid-flight.
      window.setTimeout(finish, 1750);
    };

    window.addEventListener(CART_FLIGHT_EVENT, onFlight);
    return () => window.removeEventListener(CART_FLIGHT_EVENT, onFlight);
  }, []);

  return <div ref={layerRef} className="cart-flight" aria-hidden="true" />;
}
