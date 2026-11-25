import { expect, test, type Locator, type Page } from "@playwright/test";
/** The film tour now opens the page, so ambient-motion tests reach the hero first. */
const reachHero = async (page: Page) => {
  await page.locator(".home-hero").waitFor();
  await page.evaluate(() => {
    document.querySelector(".home-hero")?.scrollIntoView({ behavior: "instant", block: "center" });
  });
  await page.evaluate(() => new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))));
};

import { CATEGORIES, formatPrice, itemsByCategory } from "../src/data/menu";

const afterStyle = (element: Locator, property: "animationName" | "animationPlayState") =>
  element.evaluate((node, name) => getComputedStyle(node, "::after")[name], property);

const settleFrames = (page: import("@playwright/test").Page) =>
  page.evaluate(() => new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))));

test.beforeEach(async ({ page }) => {
  await page.route("**/google.com/maps**", (route) => route.abort());
});

test("hero spice illustrations move, pause offscreen and respond to live motion preferences", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/#/home");
  await reachHero(page);
  const hero = page.locator(".home-hero");
  const drawing = hero.locator(".hero-spices");
  const anise = drawing.locator(".hero-spices__anise");
  const leaf = drawing.locator(".hero-spices__leaf");
  const thread = drawing.locator(".hero-spices__thread");
  await expect(drawing).toHaveAttribute("aria-hidden", "true");
  await expect(drawing).toHaveAttribute("focusable", "false");
  await expect(drawing).toHaveCSS("pointer-events", "none");
  await expect(anise).toHaveCSS("animation-name", "spice-anise-float");
  await expect(leaf).toHaveCSS("animation-name", "spice-leaf-float");
  await expect(thread).toHaveCSS("animation-name", "spice-thread-travel");
  await expect(hero).toHaveAttribute("data-motion-paused", "false");
  const transform = () => anise.evaluate((node) => getComputedStyle(node).transform);
  const initial = await transform();
  await expect.poll(transform).not.toBe(initial);

  await page.evaluate(() => window.scrollTo({ top: document.documentElement.scrollHeight, behavior: "instant" }));
  await expect(hero).toHaveAttribute("data-motion-paused", "true");
  await expect(anise).toHaveCSS("animation-play-state", "paused");
  await expect(thread).toHaveCSS("animation-play-state", "paused");
  await settleFrames(page);
  const paused = await transform();
  await page.waitForTimeout(250);
  expect(await transform()).toBe(paused);
  await reachHero(page);
  await expect(hero).toHaveAttribute("data-motion-paused", "false");
  await expect(anise).toHaveCSS("animation-play-state", "running");

  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(thread).toBeHidden();
  await expect(anise).toHaveCSS("animation-name", "none");
  await expect(drawing).toBeVisible(); // still artwork, not motion
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await expect(anise).toHaveCSS("animation-name", "spice-anise-float");
  await hero.getByRole("button", { name: "View Menu" }).click();
  await expect(page).toHaveURL(/\/#\/menu$/);
});

test("the spice place setting is decorative on each banner and pauses offscreen", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  for (const route of ["about", "services", "reserve", "cart"]) {
    await page.goto(`/#/${route}`);
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
    const ornament = page.locator(".page-ornament");
    const spice = ornament.locator(".page-ornament__spice");
    await expect(ornament).toHaveAttribute("aria-hidden", "true");
    await expect(spice).toHaveAttribute("focusable", "false");
    await expect(spice).toHaveCSS("pointer-events", "none");
    await expect(spice).toHaveCSS("animation-name", "spice-banner-turn");
    await expect(spice.locator(".page-ornament__spice-anise")).toHaveCSS("animation-name", "spice-banner-counterturn");
    await expect(ornament).toHaveAttribute("data-motion-paused", "false");
  }
  const ornament = page.locator(".page-ornament");
  const spice = ornament.locator(".page-ornament__spice");
  const transform = () => spice.evaluate((node) => getComputedStyle(node).transform);
  const initial = await transform();
  await expect.poll(transform).not.toBe(initial);
  await page.evaluate(() => window.scrollTo({ top: document.documentElement.scrollHeight, behavior: "instant" }));
  await expect(ornament).toHaveAttribute("data-motion-paused", "true");
  await expect(spice).toHaveCSS("animation-play-state", "paused");
  await expect(spice.locator(".page-ornament__spice-anise")).toHaveCSS("animation-play-state", "paused");
  await settleFrames(page);
  const paused = await transform();
  await page.waitForTimeout(250);
  expect(await transform()).toBe(paused);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(spice).toHaveCSS("animation-name", "none");
  await page.goto("/#/reserve");
  await expect(page.getByRole("form", { name: "Table reservation form" })).toBeVisible();
});

test("category selection adds a short, noninteractive flourish without resizing plates", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/#/menu");
  const first = page.locator(".editorial-category").nth(0);
  const plate = first.getByRole("button", { name: `Select ${CATEGORIES[0].name}, ${itemsByCategory(CATEGORIES[0].id).length} dishes` });
  const size = () => plate.evaluate((node) => ({ width: getComputedStyle(node).width, height: getComputedStyle(node).height }));
  const original = await size();
  await plate.focus();
  await page.keyboard.press("Enter");
  await expect(plate).toHaveAttribute("aria-pressed", "true");
  const sparks = first.locator(".editorial-plate__sparks");
  await expect(sparks).toHaveAttribute("aria-hidden", "true");
  await expect(sparks).toHaveAttribute("focusable", "false");
  await expect(sparks).toHaveCSS("pointer-events", "none");
  await expect(sparks.locator(".editorial-plate__spark")).toHaveCount(4);
  await expect(sparks.locator(".editorial-plate__spark").first()).toHaveCSS("animation-name", "spice-spark");
  expect(await size()).toEqual(original);
  await expect(first.getByRole("button", { name: "View Menu" })).toBeVisible();

  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(sparks).toBeHidden();
  const second = page.locator(".editorial-category").nth(1);
  await second.getByRole("button", { name: /Select Grill & Tandoor/ }).click();
  await expect(second.locator(".editorial-plate__sparks")).toBeHidden();
  const grill = itemsByCategory("grill-tandoor")[0];
  await second.getByRole("button", { name: "View Menu" }).click();
  await page.locator(".menu-dishes__list")
    .getByRole("button", { name: `${grill.name} ${formatPrice(grill.price)}` }).click();
  await expect(page).toHaveURL(new RegExp(`/#/food/${grill.id}$`));
});


test("the marquee and decorative map pulse stop when offscreen", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/#/home");
  const marquee = page.locator(".home-marquee");
  const row = marquee.locator(".animate-marquee");
  await marquee.evaluate((node) => node.scrollIntoView({ block: "center", behavior: "instant" }));
  await expect(marquee).toHaveAttribute("data-motion-paused", "false");
  await expect(row).toHaveCSS("animation-name", "marquee");
  await expect(row).toHaveCSS("animation-play-state", "running");
  await page.evaluate(() => window.scrollTo({ top: document.documentElement.scrollHeight, behavior: "instant" }));
  await expect(marquee).toHaveAttribute("data-motion-paused", "true");
  await expect(row).toHaveCSS("animation-play-state", "paused");
  await settleFrames(page);
  const paused = await row.evaluate((node) => getComputedStyle(node).transform);
  await page.waitForTimeout(250);
  expect(await row.evaluate((node) => getComputedStyle(node).transform)).toBe(paused);
  await marquee.evaluate((node) => node.scrollIntoView({ block: "center", behavior: "instant" }));
  await expect(row).toHaveCSS("animation-play-state", "running");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(row).toHaveCSS("animation-name", "none");

  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/#/tracking");
  await page.getByRole("button", { name: "Preview demo route" }).click();
  const map = page.locator(".tracking-map");
  const pin = map.locator(".tracking-map__pin--courier");
  await map.evaluate((node) => node.scrollIntoView({ block: "center", behavior: "instant" }));
  await expect(map).toHaveAttribute("data-motion-paused", "false");
  await expect.poll(() => afterStyle(pin, "animationName")).toBe("tracker-pulse");
  await expect.poll(() => afterStyle(pin, "animationPlayState")).toBe("running");
  await page.evaluate(() => window.scrollTo({ top: document.documentElement.scrollHeight, behavior: "instant" }));
  await expect(map).toHaveAttribute("data-motion-paused", "true");
  await expect.poll(() => afterStyle(pin, "animationPlayState")).toBe("paused");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect.poll(() => afterStyle(pin, "animationName")).toBe("none");
  await page.getByRole("button", { name: "Play journey" }).click();
  await expect(page.getByRole("button", { name: "Pause preview" })).toBeVisible();
  await page.getByRole("button", { name: "Pause preview" }).click();
});

test("the footer can pause ambient motion across routes and reloads", async ({ page }, testInfo) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/#/home");
  await reachHero(page);
  const hero = page.locator(".home-hero");
  const anise = hero.locator(".hero-spices__anise");
  const glow = hero.locator(".home-hero__glow");
  await expect(hero).toHaveAttribute("data-motion-paused", "false");
  if (testInfo.project.name === "desktop") {
    await page.mouse.move(1120, 450);
    await expect.poll(() => glow.evaluate((node: HTMLElement) => node.style.transform)).toContain("translate3d");
  }
  const pause = page.getByRole("button", { name: "Pause ambient motion" });
  await expect(pause).toHaveAccessibleDescription(/continuous decorative animation/i);
  await pause.focus();
  await expect(pause).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.locator("html")).toHaveAttribute("data-ambient-motion", "paused");
  expect(await page.evaluate(() => localStorage.getItem("raaha-ambient-motion"))).toBe("paused");
  await reachHero(page);
  await expect(hero).toHaveAttribute("data-motion-paused", "false");
  await expect(anise).toHaveCSS("animation-play-state", "paused");
  if (testInfo.project.name === "desktop") {
    await expect.poll(() => glow.evaluate((node: HTMLElement) => node.style.transform)).toBe("");
    await page.mouse.move(800, 250);
    expect(await glow.evaluate((node: HTMLElement) => node.style.transform)).toBe("");
  }
  const marquee = page.locator(".home-marquee");
  // Late lazy-asset layout growth can shift the strip after the first jump,
  // so re-center once the page has settled before asserting the resume flag.
  await marquee.evaluate((node) => node.scrollIntoView({ block: "center", behavior: "instant" }));
  await settleFrames(page);
  await marquee.evaluate((node) => node.scrollIntoView({ block: "center", behavior: "instant" }));
  await expect(marquee).toHaveAttribute("data-motion-paused", "false");
  await expect(marquee.locator(".animate-marquee")).toHaveCSS("animation-play-state", "paused");

  // The pause targets ambient loops, not brief feedback for an action.
  await page.goto("/#/menu");
  const category = page.locator(".editorial-category").first();
  await category.getByRole("button", { name: /Select Starters/ }).click();
  await expect(category.locator(".editorial-plate__spark").first()).toHaveCSS("animation-name", "spice-spark");
  await expect(category.locator(".editorial-plate__spark").first()).toHaveCSS("animation-play-state", "running");
  await expect(category.getByRole("button", { name: "View Menu" })).toBeVisible();

  await page.goto("/#/tracking");
  await page.getByRole("button", { name: "Preview demo route" }).click();
  const map = page.locator(".tracking-map");
  await map.evaluate((node) => node.scrollIntoView({ block: "center", behavior: "instant" }));
  await expect(map).toHaveAttribute("data-motion-paused", "false");
  await expect.poll(() => afterStyle(map.locator(".tracking-map__pin--courier"), "animationPlayState")).toBe("paused");

  await page.goto("/#/reserve");
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-ambient-motion", "paused");
  await expect(page.locator(".page-ornament__spice")).toHaveCSS("animation-play-state", "paused");
  await page.getByRole("button", { name: "Resume ambient motion" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-ambient-motion", "playing");
  const ornament = page.locator(".page-ornament");
  const banner = ornament.locator("..");
  await banner.scrollIntoViewIfNeeded();
  await expect(banner).toBeInViewport();
  await expect(ornament).toHaveAttribute("data-motion-paused", "false");
  await expect(ornament.locator(".page-ornament__spice")).toHaveCSS("animation-play-state", "running");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(page.locator(".page-ornament__spice")).toHaveCSS("animation-name", "none");
  await expect(page.getByRole("form", { name: "Table reservation form" })).toBeVisible();
});

test("motion and menu controls still work without IntersectionObserver", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.addInitScript(() => {
    Object.defineProperty(window, "IntersectionObserver", { configurable: true, value: undefined });
  });
  await page.goto("/#/home");
  await expect(page.getByRole("heading", { name: "Where Madurai comes to feast." })).toBeVisible();
  await expect(page.locator(".home-marquee")).toHaveAttribute("data-motion-paused", "false");
  await page.getByRole("button", { name: "Pause ambient motion" }).click();
  await expect(page.locator(".hero-spices__anise")).toHaveCSS("animation-play-state", "paused");
  await page.goto("/#/menu");
  const row = page.locator(".editorial-category").first();
  await row.getByRole("button", { name: /Select Starters/ }).click();
  await row.getByRole("button", { name: "View Menu" }).click();
  const dishes = page.locator(".menu-dishes__list");
  await expect(dishes).toBeVisible();
  await dishes.getByRole("button", { name: /Chicken 65/ }).click();
  await expect(page).toHaveURL(/\/#\/food\/chicken-65$/);
});

test("carousel taps navigate without widening the phone layout", async ({ browser, baseURL }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "This test creates its own mobile touch context.");
  const context = await browser.newContext({ baseURL, viewport: { width: 320, height: 800 }, isMobile: true, hasTouch: true, reducedMotion: "no-preference" });
  try {
    const page = await context.newPage();
    await page.route("**/google.com/maps**", (route) => route.abort());
    await page.goto("/#/menu");
    const row = page.locator(".editorial-category").first();
    await row.getByRole("button", { name: /Select Starters/ }).tap();
    await row.getByRole("button", { name: "View Menu" }).tap();
    await expect(page).toHaveURL(/\/#\/dishes\/starters$/);
    const dishes = page.locator(".menu-dishes__list");
    await dishes.getByRole("button", { name: /Pepper Chicken Fry/ }).tap();
    await expect(page).toHaveURL(/\/#\/food\/pepper-chicken-fry$/);
    await page.goBack();
    await expect(page).toHaveURL(/\/#\/dishes\/starters$/);
    await expect(dishes).toBeVisible();
    // The dish card may grow the row, but never widens the phone layout.
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(320);
  } finally {
    await context.close();
  }
});
