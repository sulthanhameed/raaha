export const CART_FLIGHT_EVENT = "raaha:cart-flight";
export const CART_ARRIVAL_EVENT = "raaha:cart-arrival";

type CartFlightDetail = { x: number; y: number; hue?: "gold" | "leaf" };

/**
 * Start the decorative "dish flies to the cart" arc from a control the visitor
 * just used. The source rectangle is read synchronously by the caller, so the
 * effect still points at the right place after React re-renders the badge.
 * Purely visual: it never changes cart state, focus or layout.
 */
export function launchCartFlight(source: Element | null | undefined, hue: CartFlightDetail["hue"] = "gold") {
  if (!source || typeof window === "undefined" || typeof CustomEvent !== "function") return;
  const rect = source.getBoundingClientRect();
  if (!rect.width || !rect.height) return;
  const detail: CartFlightDetail = {
    x: rect.left + rect.width / 2,
    y: rect.top + rect.height / 2,
    hue,
  };
  window.dispatchEvent(new CustomEvent<CartFlightDetail>(CART_FLIGHT_EVENT, { detail }));
}

/** The header control the flight lands on. */
export function cartTarget() {
  return typeof document === "undefined" ? null : document.querySelector<HTMLElement>("[data-cart-target]");
}
