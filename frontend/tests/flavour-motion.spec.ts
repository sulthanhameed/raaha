import { expect, test, type Locator, type Page } from "@playwright/test";
/** The film tour now opens the page, so ambient-motion tests reach the hero first. */
const reachHero = async (page: Page) => {
  await page.locator(".home-hero").waitFor();
  await page.evaluate(() => {
    document.querySelector(".home-hero")?.scrollIntoView({ behavior: "instant", block: "center" });
  });
  await page.evaluate(() => new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))));
};

import { CATEGORIES, formatPrice, itemsByCategory, signatureItems } from "../src/data/menu";

const pseudo = (element: Locator, property: "animationName" | "opacity" | "pointerEvents") =>
  element.evaluate((node, name) => getComputedStyle(node, "::after")[name], property);

test.beforeEach(async ({ page }) => {
  await page.route("**/google.com/maps**", (route) => route.abort());
});

test("hero aroma trails animate, pause offscreen and respect reduced motion", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/#/home");
  await reachHero(page);
  const hero = page.locator(".home-hero");
  const atmosphere = hero.locator(".home-hero__atmosphere");
  const scent = atmosphere.locator(".home-hero__scent");
  const trails = scent.locator(".home-hero__scent-trail");
  await expect(atmosphere).toHaveAttribute("aria-hidden", "true");
  await expect(scent).toHaveAttribute("focusable", "false");
  await expect(trails).toHaveCount(3);
  await expect(trails.first()).toHaveCSS("animation-name", "hero-aroma-travel");
  await expect(scent).toHaveCSS("pointer-events", "none");
  await expect(hero).toHaveAttribute("data-motion-paused", "false");
  const offset = () => trails.first().evaluate((node) => getComputedStyle(node).strokeDashoffset);
  const initial = await offset();
  await expect.poll(offset).not.toBe(initial);

  await page.evaluate(() => window.scrollTo({ top: document.documentElement.scrollHeight, behavior: "instant" }));
  await expect(hero).toHaveAttribute("data-motion-paused", "true");
  await expect(trails.first()).toHaveCSS("animation-play-state", "paused");
  await page.evaluate(() => new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))));
  const paused = await offset();
  await page.waitForTimeout(250);
  expect(await offset()).toBe(paused);
  await reachHero(page);
  await expect(hero).toHaveAttribute("data-motion-paused", "false");
  await expect(trails.first()).toHaveCSS("animation-play-state", "running");

  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(scent).toBeHidden();
  await expect(trails.first()).toHaveCSS("animation-name", "none");
  await hero.getByRole("button", { name: "View Menu" }).click();
  await expect(page).toHaveURL(/\/#\/menu$/);
});

test("heading accents and category orbits are decorative and keep plate sizes", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/#/home");
  const heading = page.locator(".home-story .section-head__accent");
  await heading.scrollIntoViewIfNeeded();
  await expect(heading.locator("xpath=ancestor::*[contains(concat(' ', normalize-space(@class), ' '), ' reveal ')][1]")).toHaveClass(/is-visible/);
  await expect.poll(() => pseudo(heading, "animationName")).toBe("section-accent-draw");
  expect(await pseudo(heading, "pointerEvents")).toBe("none");

  await page.goto("/#/menu");
  const category = CATEGORIES[0];
  const plate = page.getByRole("button", { name: `Select ${category.name}, ${itemsByCategory(category.id).length} dishes` });
  const well = plate.locator(".editorial-plate__well");
  const widthBefore = await plate.evaluate((node) => parseFloat(getComputedStyle(node).width));
  await plate.click();
  await expect(plate).toHaveAttribute("aria-pressed", "true");
  await expect.poll(() => pseudo(well, "animationName")).toBe("plate-orbit-swish");
  expect(await pseudo(well, "pointerEvents")).toBe("none");
  expect(await plate.evaluate((node) => parseFloat(getComputedStyle(node).width))).toBe(widthBefore);
  expect(widthBefore).toBeGreaterThanOrEqual(106);
  await expect(plate.locator("..").getByRole("button", { name: "View Menu" })).toBeVisible();

  await page.emulateMedia({ reducedMotion: "reduce" });
  expect(await pseudo(well, "animationName")).toBe("none");
  expect(await pseudo(well, "opacity")).toBe("0");
  const first = itemsByCategory(category.id)[0];
  await page.locator("#menu-category-dishes .menu-dishes__list")
    .getByRole("button", { name: `${first.name} ${formatPrice(first.price)}`, exact: true }).click();
  await expect(page).toHaveURL(new RegExp(`/#/food/${first.id}$`));
});


test("food-card spotlight follows a fine pointer and clears on reduced motion", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "The spotlight is intended for fine-pointer devices.");
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/#/home");
  const item = signatureItems()[0];
  const card = page.getByRole("button", { name: `${item.name}, ${formatPrice(item.price)}. View details`, exact: true });
  const spotlight = card.locator("..").locator(".food-card__spotlight");
  await card.scrollIntoViewIfNeeded();
  const box = (await card.boundingBox())!;
  await page.mouse.move(box.x + box.width * .25, box.y + 35);
  await expect(spotlight).toHaveAttribute("aria-hidden", "true");
  await expect(spotlight).toHaveCSS("pointer-events", "none");
  await expect.poll(() => spotlight.evaluate((node: HTMLElement) => node.style.transform)).toContain("translate3d");
  await expect.poll(() => spotlight.evaluate((node) => Number(getComputedStyle(node).opacity))).toBeGreaterThan(.7);
  const first = await spotlight.evaluate((node: HTMLElement) => node.style.transform);
  await page.mouse.move(box.x + box.width * .75, box.y + 80);
  await expect.poll(() => spotlight.evaluate((node: HTMLElement) => node.style.transform)).not.toBe(first);

  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(spotlight).toBeHidden();
  await expect.poll(() => spotlight.evaluate((node: HTMLElement) => node.style.transform)).toBe("");
  await page.mouse.move(box.x + box.width * .5, box.y + 60);
  expect(await spotlight.evaluate((node: HTMLElement) => node.style.transform)).toBe("");
  await card.locator("..").getByRole("button", { name: `Add ${item.name} to cart` }).click();
  await expect(page.getByRole("button", { name: "Cart, 1 items" })).toBeVisible();
});

test("layered banner arcs move, pause offscreen and disappear for reduced motion", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/#/reserve");
  const ornament = page.locator(".page-ornament");
  const outer = ornament.locator(".page-ornament__arc--outer");
  const inner = ornament.locator(".page-ornament__arc--inner");
  await expect(ornament).toHaveAttribute("aria-hidden", "true");
  await expect(outer).toHaveCSS("animation-name", "ornament-arc-outer");
  await expect(inner).toHaveCSS("animation-name", "ornament-arc-inner");
  const transform = () => outer.evaluate((node) => getComputedStyle(node).transform);
  const initial = await transform();
  await expect.poll(transform).not.toBe(initial);
  await page.evaluate(() => window.scrollTo({ top: document.documentElement.scrollHeight, behavior: "instant" }));
  await expect(ornament).toHaveAttribute("data-motion-paused", "true");
  await expect(outer).toHaveCSS("animation-play-state", "paused");
  await expect(inner).toHaveCSS("animation-play-state", "paused");
  // Let the browser commit the paused animation frame before comparing it.
  await page.evaluate(() => new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))));
  const paused = await transform();
  await page.waitForTimeout(250);
  expect(await transform()).toBe(paused);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(outer).toBeHidden();
  await expect(inner).toBeHidden();
  await expect(page.getByRole("form", { name: "Table reservation form" })).toBeVisible();
});

test("a touch device keeps the card light inactive and its controls usable", async ({ browser, baseURL }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "This test creates its own touch context.");
  const context = await browser.newContext({
    baseURL,
    viewport: { width: 320, height: 800 },
    isMobile: true,
    hasTouch: true,
    reducedMotion: "no-preference",
  });
  try {
    const page = await context.newPage();
    await page.route("**/google.com/maps**", (route) => route.abort());
    await page.goto("/#/home");
    const item = signatureItems()[0];
    const card = page.getByRole("button", { name: `${item.name}, ${formatPrice(item.price)}. View details`, exact: true });
    const spotlight = card.locator("..").locator(".food-card__spotlight");
    await card.locator("..").getByRole("button", { name: `Add ${item.name} to cart` }).tap();
    await expect(page.getByRole("button", { name: "Cart, 1 items" })).toBeVisible();
    expect(await spotlight.evaluate((node: HTMLElement) => node.style.transform)).toBe("");
    await expect(spotlight).toHaveCSS("opacity", "0");
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(320);
  } finally {
    await context.close();
  }
});
