import { expect, test, type Page } from "@playwright/test";
/** The film tour now opens the page, so ambient-motion tests reach the hero first. */
const reachHero = async (page: Page) => {
  await page.locator(".home-hero").waitFor();
  await page.evaluate(() => {
    document.querySelector(".home-hero")?.scrollIntoView({ behavior: "instant", block: "center" });
  });
  await page.evaluate(() => new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))));
};

import { CATEGORIES, formatPrice, itemsByCategory } from "../src/data/menu";

test("the hero atmosphere and page motion are decorative and pause offscreen", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/#/home");
  await reachHero(page);
  const hero = page.locator(".home-hero");
  const field = hero.locator(".home-hero__atmosphere");
  const ember = field.locator(".home-hero__ember").first();
  await expect(page.getByRole("heading", { level: 1, name: "Where Madurai comes to feast." })).toBeVisible();
  await expect(field).toHaveAttribute("aria-hidden", "true");
  await expect(field.locator(".home-hero__ember")).toHaveCount(12);
  await expect(ember).toHaveCSS("animation-name", "ember-rise");
  await expect(hero.locator(".home-hero__photo")).toHaveCSS("animation-name", "hero-photo-breathe");
  await expect(page.locator(".route-arrival")).toHaveCSS("animation-name", "route-arrival");
  await expect(hero).toHaveAttribute("data-motion-paused", "false");

  await page.evaluate(() => window.scrollTo({ top: document.documentElement.scrollHeight, behavior: "instant" }));
  await expect(hero).toHaveAttribute("data-motion-paused", "true");
  await expect(ember).toHaveCSS("animation-play-state", "paused");
  await reachHero(page);
  await expect(hero).toHaveAttribute("data-motion-paused", "false");
  await expect(ember).toHaveCSS("animation-play-state", "running");
});

test("the reading line follows scroll and resets when navigating", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/#/home");
  const progress = page.locator(".site-scroll-progress");
  const fill = progress.locator(".site-scroll-progress__fill");
  await expect(progress).toHaveAttribute("aria-hidden", "true");
  const scale = () => fill.evaluate((element) => new DOMMatrixReadOnly(getComputedStyle(element).transform).a);
  await expect.poll(scale).toBeLessThan(0.01);
  await page.evaluate(() => window.scrollTo({ top: document.documentElement.scrollHeight, behavior: "instant" }));
  await expect.poll(scale).toBeGreaterThan(0.98);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(progress).toBeHidden();
  await expect.poll(() => fill.evaluate((element) => (element as HTMLElement).style.transform)).toBe("scaleX(0)");
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await expect(progress).toBeVisible();
  await expect.poll(scale).toBeGreaterThan(0.98);
  await page.goto("/#/menu");
  await expect(page.getByRole("heading", { name: "The Raaha menu." })).toBeVisible();
  await expect.poll(scale).toBeLessThan(0.01);
});

test("category plates arrive without moving their controls and show a selection halo", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/#/menu");
  const row = page.locator(".editorial-surface--menu .editorial-category").first();
  const plate = row.getByRole("button", { name: `Select ${CATEGORIES[0].name}, ${itemsByCategory(CATEGORIES[0].id).length} dishes` });
  const well = row.locator(".editorial-plate__well");
  await expect(row).toHaveClass(/has-arrived/);
  await expect(well).toHaveCSS("animation-name", "plate-serve-in");
  const widthBefore = await plate.evaluate((element) => parseFloat(getComputedStyle(element).width));
  await plate.click();
  await expect(plate).toHaveAttribute("aria-pressed", "true");
  await expect(row.getByRole("button", { name: "View Menu" })).toBeVisible();
  // Selection can enlarge the existing plate visually, but entrance animation
  // is only on its inner artwork and never changes the underlying CSS width.
  const widthAfter = await plate.evaluate((element) => parseFloat(getComputedStyle(element).width));
  expect(widthBefore).toBeGreaterThanOrEqual(106);
  expect(widthAfter).toBe(widthBefore);
  const halo = await well.evaluate((element) => ({
    animation: getComputedStyle(element, "::before").animationName,
    pointerEvents: getComputedStyle(element, "::before").pointerEvents,
  }));
  expect(halo).toEqual({ animation: "plate-halo", pointerEvents: "none" });
  const first = itemsByCategory(CATEGORIES[0].id)[0];
  await row.getByRole("button", { name: "View Menu" }).click();
  await page.locator(".menu-dishes__list")
    .getByRole("button", { name: `${first.name} ${formatPrice(first.price)}`, exact: true }).click();
  await expect(page).toHaveURL(new RegExp(`/#/food/${first.id}$`));
});

test("animated category controls remain tappable across screen sizes", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "This test covers its own range of viewport sizes.");
  await page.emulateMedia({ reducedMotion: "no-preference" });
  for (const width of [320, 390, 639, 640, 768, 1024, 1200, 1440, 1920]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/#/menu");
    for (const category of CATEGORIES) {
      const row = page.locator(".editorial-surface--menu .editorial-category").nth(CATEGORIES.indexOf(category));
      const plate = row.getByRole("button", { name: `Select ${category.name}, ${itemsByCategory(category.id).length} dishes` });
      await plate.evaluate((element) => element.scrollIntoView({ block: "center", behavior: "instant" }));
      const box = await plate.boundingBox();
      expect(box, `${width}px: ${category.name} plate`).not.toBeNull();
      expect(box!.width, `${width}px: ${category.name} plate width`).toBeGreaterThanOrEqual(44);
      expect(box!.height, `${width}px: ${category.name} plate height`).toBeGreaterThanOrEqual(44);
      // Click the live center directly, including while the inner entrance is
      // still playing, rather than waiting for animations to finish.
      await page.mouse.click(box!.x + box!.width / 2, box!.y + box!.height / 2);
      await expect(plate, `${width}px: ${category.name}`).toHaveAttribute("aria-pressed", "true");
      const action = row.locator(".editorial-category__view");
      const geometry = await action.evaluate((element) => {
        const box = element.getBoundingClientRect();
        const hit = document.elementFromPoint(box.left + box.width / 2, box.top + box.height / 2);
        return { width: box.width, height: box.height, usable: !!hit && element.contains(hit), documentWidth: document.documentElement.scrollWidth };
      });
      expect(geometry.width, `${width}px: ${category.name} action width`).toBeGreaterThanOrEqual(44);
      expect(geometry.height, `${width}px: ${category.name} action height`).toBeGreaterThanOrEqual(44);
      expect(geometry.usable, `${width}px: ${category.name} action hit target`).toBe(true);
      expect(geometry.documentWidth, `${width}px document width`).toBe(width);
    }
  }
});

test("plates remain available if IntersectionObserver is unavailable", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.addInitScript(() => {
    Object.defineProperty(window, "IntersectionObserver", { configurable: true, value: undefined });
  });
  await page.goto("/#/menu");
  const row = page.locator(".editorial-surface--menu .editorial-category").first();
  await expect(row).toHaveClass(/has-arrived/);
  await row.getByRole("button", { name: /Select Starters/ }).click();
  await expect(row.getByRole("button", { name: "View Menu" })).toBeVisible();
});

test("reduced motion stops ambient effects and keeps menu and booking navigation usable", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/#/home");
  await expect(page.locator(".home-hero__embers")).toBeHidden();
  await expect(page.locator(".home-hero__photo")).toHaveCSS("animation-name", "none");
  await expect(page.locator(".home-hero__title-line").first()).toHaveCSS("animation-name", "none");
  await expect(page.locator(".animate-marquee")).toHaveCSS("animation-name", "none");
  await expect(page.locator(".site-scroll-progress")).toBeHidden();
  await expect(page.locator(".route-arrival")).toHaveCSS("animation-name", "none");

  await page.goto("/#/menu");
  const row = page.locator(".editorial-surface--menu .editorial-category").first();
  await expect(row.locator(".editorial-plate__well")).toHaveCSS("animation-name", "none");
  await row.getByRole("button", { name: /Select Starters/ }).click();
  await expect(row.locator(".editorial-category__detail")).toHaveCSS("animation-name", "none");
  await expect(row.getByRole("button", { name: "View Menu" })).toBeVisible();
  await page.goto("/#/reserve");
  await expect(page.getByRole("form", { name: "Table reservation form" })).toBeVisible();
});

test("desktop pointer glow and card highlight follow motion preferences", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "The mobile layout does not rely on hover.");
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/#/home");
  await reachHero(page);
  await expect(page.locator(".home-hero")).toHaveAttribute("data-motion-paused", "false");
  const glow = page.locator(".home-hero__glow");
  await page.mouse.move(1120, 450);
  await expect.poll(() => glow.evaluate((element) => (element as HTMLElement).style.transform)).toContain("translate3d");

  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect.poll(() => glow.evaluate((element) => (element as HTMLElement).style.transform)).toBe("");
  await page.mouse.move(800, 250);
  expect(await glow.evaluate((element) => (element as HTMLElement).style.transform)).toBe("");

  await page.emulateMedia({ reducedMotion: "no-preference" });
  const card = page.locator(".food-card").first();
  await card.locator(".food-card__link").focus();
  const sheen = card.locator(".food-card__sheen");
  await expect.poll(() => sheen.evaluate((element) => Number(getComputedStyle(element).opacity))).toBeGreaterThan(0.9);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(sheen).toBeHidden();
});
