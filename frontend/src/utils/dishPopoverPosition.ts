export interface SceneRect {
  left: number;
  top: number;
  width: number;
  height: number;
}

export interface DishPopoverPosition {
  left: number;
  top: number;
  side: "left" | "right" | "above" | "below";
  pointer: number;
}

const right = (rect: SceneRect) => rect.left + rect.width;
const bottom = (rect: SceneRect) => rect.top + rect.height;
const centerX = (rect: SceneRect) => rect.left + rect.width / 2;
const centerY = (rect: SceneRect) => rect.top + rect.height / 2;
const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

function overlap(first: SceneRect, second: SceneRect) {
  return Math.max(0, Math.min(right(first), right(second)) - Math.max(first.left, second.left)) *
    Math.max(0, Math.min(bottom(first), bottom(second)) - Math.max(first.top, second.top));
}

function distance(first: SceneRect, second: SceneRect) {
  const dx = Math.max(0, first.left - right(second), second.left - right(first));
  const dy = Math.max(0, first.top - bottom(second), second.top - bottom(first));
  return Math.hypot(dx, dy);
}

function containsCenter(rect: SceneRect, target: SceneRect) {
  // Leave a little room around the center, rather than allowing a button to
  // end a fraction of a pixel away where touch hit-testing can round into it.
  const clearance = 8;
  const x = centerX(target);
  const y = centerY(target);
  return x >= rect.left - clearance && x <= right(rect) + clearance &&
    y >= rect.top - clearance && y <= bottom(rect) + clearance;
}

function sideOf(card: SceneRect, target: SceneRect): DishPopoverPosition["side"] {
  if (right(card) <= target.left) return "left";
  if (card.left >= right(target)) return "right";
  if (bottom(card) <= target.top) return "above";
  if (card.top >= bottom(target)) return "below";
  const dx = centerX(card) - centerX(target);
  const dy = centerY(card) - centerY(target);
  return Math.abs(dx) > Math.abs(dy) ? (dx < 0 ? "left" : "right") : (dy < 0 ? "above" : "below");
}

/**
 * Place the selected-food popover near the plate without covering that plate
 * where possible. The image remains whole, and the popover stays on-screen;
 * on wider screens it can extend into the space beside the tabletop.
 */
export function positionDishPopover({
  sceneWidth,
  sceneHeight,
  sceneLeft,
  viewportWidth,
  target,
  selectedLabel,
  otherDishes,
  textRegions,
  width,
  height,
  buttons,
  overhang,
}: {
  sceneWidth: number;
  sceneHeight: number;
  sceneLeft: number;
  viewportWidth: number;
  target: SceneRect;
  /** The larger selected label is outside the button's rectangular hit area. */
  selectedLabel?: SceneRect;
  otherDishes: SceneRect[];
  textRegions: SceneRect[];
  width: number;
  height: number;
  /** Button rectangles relative to the popover, for keeping plates tappable. */
  buttons: SceneRect[];
  /** How far the card may hang below the scene; 0 when the scene already
   * reaches the bottom of the viewport, so the card never clips under it. */
  overhang?: number;
}): DishPopoverPosition {
  const margin = 8;
  const minX = Math.max(margin - sceneLeft, -width);
  const maxX = Math.max(minX, Math.min(viewportWidth - margin - sceneLeft - width, sceneWidth));
  const minY = margin;
  // A small overhang is preferable to pushing the label away from a plate
  // near the bottom of a compact phone-sized scene. Most of the card remains
  // over the photo and the category navigation is still below the scene.
  const maxY = Math.max(minY, sceneHeight - height + Math.min(overhang ?? 24, height * 0.2));
  const gap = 7;
  const xs = new Set([
    minX, maxX,
    target.left - width - gap,
    right(target) + gap,
    centerX(target) - width / 2,
    target.left,
    right(target) - width,
  ].map((x) => clamp(x, minX, maxX)));
  const ys = new Set([
    minY, maxY,
    target.top - height - gap,
    bottom(target) + gap,
    centerY(target) - height / 2,
    target.top,
    bottom(target) - height,
    ...(selectedLabel ? [selectedLabel.top - height - gap, bottom(selectedLabel) + gap] : []),
  ].map((y) => clamp(y, minY, maxY)));

  // Intermediate positions help the buttons avoid neighboring plates on
  // small screens, without forcing a fixed panel at the edge of the image.
  for (let x = minX; x < maxX; x += 12) xs.add(x);
  for (let y = minY; y < maxY; y += 12) ys.add(y);

  let best: SceneRect = { left: minX, top: minY, width, height };
  let bestScore = Infinity;
  for (const x of xs) {
    for (const y of ys) {
      const card = { left: x, top: y, width, height };
      const side = sideOf(card, target);
      // Prefer a pointer aimed at the plate rather than an unrelated corner.
      const misalignment = side === "left" || side === "right"
        ? Math.max(0, card.top + 12 - centerY(target), centerY(target) - bottom(card) + 12)
        : Math.max(0, card.left + 12 - centerX(target), centerX(target) - right(card) + 12);
      // Favor an unobscured target, short distance and a clear pointer, while
      // treating background text and neighboring plates as softer obstacles.
      const gapToTarget = distance(card, target);
      const plateOverlap = overlap(card, target);
      let score = plateOverlap * 500 + (plateOverlap > 1 ? 20000 : 0) + gapToTarget * 150 +
        Math.max(0, gapToTarget - 30) * 1200 + misalignment * 75;
      // Neighbouring plates are soft obstacles: the card may rest over part of
      // one (it is dismissible) as long as its buttons keep every centre free.
      const neighbourWeight = 0.12;
      const projectedPointer = side === "left" || side === "right"
        ? clamp(centerY(target), card.top + 12, bottom(card) - 12)
        : clamp(centerX(target), card.left + 12, right(card) - 12);
      const missesPlate = side === "left" || side === "right"
        ? projectedPointer < target.top || projectedPointer > bottom(target)
        : projectedPointer < target.left || projectedPointer > right(target);
      if (missesPlate) score += 40000;
      // The selected name now grows above its plate; don't hide it behind the
      // nearby card when a clear position is available.
      if (selectedLabel) score += overlap(card, selectedLabel) * 6;
      for (const dish of otherDishes) {
        score += overlap(card, dish) * neighbourWeight;
        if (buttons.some((button) => containsCenter({ ...button, left: x + button.left, top: y + button.top }, dish))) {
          score += 80000;
        }
      }
      for (const text of textRegions) score += overlap(card, text) * 0.15;
      if (buttons.some((button) => containsCenter({ ...button, left: x + button.left, top: y + button.top }, target))) {
        score += 120000;
      }
      if (score < bestScore) {
        best = card;
        bestScore = score;
      }
    }
  }

  const side = sideOf(best, target);
  const pointer = side === "left" || side === "right"
    ? clamp(centerY(target) - best.top, 12, height - 12)
    : clamp(centerX(target) - best.left, 12, width - 12);
  return { left: best.left, top: best.top, side, pointer };
}
