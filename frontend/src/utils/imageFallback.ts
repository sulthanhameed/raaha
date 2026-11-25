import type { SyntheticEvent } from "react";

const FALLBACK_IMAGE = "/images/food-unavailable.svg";

/** Replace a missing food photo with a local, lightweight illustration. */
export function showFoodImageFallback(event: SyntheticEvent<HTMLImageElement>) {
  const image = event.currentTarget;
  if (image.getAttribute("src") === FALLBACK_IMAGE) {
    // Avoid an error loop if the fallback itself is missing too.
    image.style.visibility = "hidden";
    return;
  }
  if (image.alt) image.alt = "Food image unavailable";
  image.src = FALLBACK_IMAGE;
}
