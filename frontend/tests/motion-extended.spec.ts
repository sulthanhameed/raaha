import { expect, test, type Locator } from "@playwright/test";

const scaleX = (element: Locator) => element.evaluate((node) => new DOMMatrixReadOnly(getComputedStyle(node).transform).a);
const pseudo = (element: Locator, property: "animationName" | "opacity" | "pointerEvents") =>
  element.evaluate((node, name) => getComputedStyle(node, "::after")[name], property);

test("page ornaments pause offscreen and respect a live reduced-motion change", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  // The about page's remote images are not needed to exercise its banner.
  await page.route("**/images.pexels.com/**", (route) => route.abort());
  for (const route of ["reserve", "services", "about", "cart"]) {
    await page.goto(`/#/${route}`);
    const ornament = page.locator(".page-ornament");
    const orbit = ornament.locator(".page-ornament__orbit");
    await expect(ornament).toHaveAttribute("aria-hidden", "true");
    await expect(ornament).toHaveAttribute("data-motion-paused", "false");
    await expect(orbit).toHaveCSS("animation-name", "ornament-orbit");
    // Jump twice: late layout growth (catalogue, maps) can extend the page
    // after the first jump and leave the banner on screen.
    await page.evaluate(() => window.scrollTo({ top: document.documentElement.scrollHeight, behavior: "instant" }));
    await page.waitForTimeout(250);
    await page.evaluate(() => window.scrollTo({ top: document.documentElement.scrollHeight, behavior: "instant" }));
    await expect(ornament).toHaveAttribute("data-motion-paused", "true");
    await expect(orbit).toHaveCSS("animation-play-state", "paused");
  }
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(page.locator(".page-ornament__orbit")).toHaveCSS("animation-name", "none");
});

test("navigation underlines move without moving their buttons", async ({ page }, testInfo) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/#/home");
  const nav = page.getByRole("navigation", { name: testInfo.project.name === "mobile" ? "Mobile navigation" : "Primary navigation" });
  const home = nav.getByRole("button", { name: "Home", exact: true });
  const menu = nav.getByRole("button", { name: "Menu", exact: true });
  const underline = menu.locator(".site-nav-underline");
  await expect(home).toHaveAttribute("aria-current", "page");
  await expect(underline).toHaveAttribute("aria-hidden", "true");
  const before = await menu.boundingBox();
  await menu.click();
  await expect(page).toHaveURL(/\/#\/menu$/);
  await expect(menu).toHaveAttribute("aria-current", "page");
  await expect.poll(() => scaleX(underline)).toBeGreaterThan(0.98);
  await expect.poll(() => scaleX(home.locator(".site-nav-underline"))).toBeLessThan(0.02);
  const after = await menu.boundingBox();
  expect(after?.width).toBeCloseTo(before!.width, 2);
  expect(after?.height).toBeCloseTo(before!.height, 2);

  await page.emulateMedia({ reducedMotion: "reduce" });
  const services = nav.getByRole("button", { name: "Services", exact: true });
  await services.click();
  await expect(services).toHaveAttribute("aria-current", "page");
  await expect(services.locator(".site-nav-underline")).toHaveCSS("transition-duration", "0s");
  expect(await scaleX(services.locator(".site-nav-underline"))).toBe(1);
});


test("food details, quantity and cart feedback animate without disrupting actions", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/#/food/egg-biryani");
  const photo = page.locator(".food-detail__photo");
  await expect(photo).toHaveCSS("animation-name", "dish-photo-arrive");
  await expect(page.getByRole("heading", { level: 1, name: "Egg Biryani" })).toHaveCSS("animation-name", "dish-copy-arrive");
  const quantity = page.locator(".quantity-value").first();
  await expect(quantity.locator("..")).toHaveAttribute("aria-live", "polite");
  await page.getByRole("button", { name: "Increase quantity" }).first().click();
  await expect(quantity).toHaveText("2");
  await expect(quantity).toHaveCSS("animation-name", "quantity-tick");

  const add = page.getByRole("button", { name: "Add to Cart", exact: true });
  await add.click();
  await expect(page.getByRole("button", { name: "Cart, 2 items" })).toBeVisible();
  const badge = page.locator(".site-cart-badge");
  await expect(badge).toHaveAttribute("aria-hidden", "true");
  await expect(badge).toHaveCSS("animation-name", "cart-badge-pop");
  const oldBadge = await badge.elementHandle();
  await add.click();
  await expect(page.getByRole("button", { name: "Cart, 4 items" })).toBeVisible();
  expect(await oldBadge!.evaluate((node) => node.isConnected)).toBe(false);

  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(photo).toHaveCSS("animation-name", "none");
  await page.getByRole("button", { name: "Increase quantity" }).first().click();
  await expect(quantity).toHaveText("3");
  await expect(quantity).toHaveCSS("animation-name", "none");
  await add.click();
  await expect(page.getByRole("button", { name: "Cart, 7 items" })).toBeVisible();
  await expect(badge).toHaveCSS("animation-name", "none");
});

test("home gold glint and primary button shimmer are decorative", async ({ page }, testInfo) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/#/home");
  const hero = page.locator(".home-hero");
  const gold = hero.locator(".home-hero__title-line .gold-text");
  const action = hero.getByRole("button", { name: "View Menu" });
  await expect(gold).toHaveCSS("animation-name", "hero-gold-glint");
  expect(await pseudo(action, "pointerEvents")).toBe("none");
  if (testInfo.project.name === "desktop") {
    await action.hover();
    await expect.poll(async () => Number(await pseudo(action, "opacity"))).toBeGreaterThan(0.9);
  }
  await page.mouse.move(0, 0);
  await page.keyboard.press("Tab");
  await action.focus();
  await expect(action).toBeFocused();
  await expect.poll(() => action.evaluate((element) => element.matches(":focus-visible"))).toBe(true);
  await expect.poll(async () => Number(await pseudo(action, "opacity"))).toBeGreaterThan(0.9);
  await page.evaluate(() => window.scrollTo({ top: document.documentElement.scrollHeight, behavior: "instant" }));
  await expect(hero).toHaveAttribute("data-motion-paused", "true");
  await expect(gold).toHaveCSS("animation-play-state", "paused");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(gold).toHaveCSS("animation-name", "none");
  expect(await pseudo(action, "opacity")).toBe("0");
  await action.click();
  await expect(page).toHaveURL(/\/#\/menu$/);
});
