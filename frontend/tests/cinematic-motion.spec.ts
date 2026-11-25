import { expect, test, type Page } from "@playwright/test";
import { formatPrice, signatureItems } from "../src/data/menu";

/** The film tour now opens the page, so entrance tests reach the hero first. */
const reachHero = async (page: Page) => {
  await page.locator(".home-hero").waitFor();
  await page.evaluate(() => {
    document.querySelector(".home-hero")?.scrollIntoView({ behavior: "instant", block: "center" });
  });
  await page.evaluate(() => new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))));
};

/**
 * The cinematic layer must stay decoration: nothing it adds may receive input,
 * announce itself twice, widen the page, or keep moving for a visitor who asked
 * for reduced motion.
 */

const item = signatureItems()[0];

async function watchFlights(page: Page) {
  await page.evaluate(() => {
    const state = { chips: 0, arrivals: 0, trails: 0 };
    (window as unknown as { __flights: typeof state }).__flights = state;
    new MutationObserver((records) => {
      for (const record of records) {
        for (const node of record.addedNodes) {
          if (!(node instanceof HTMLElement)) continue;
          if (node.classList.contains("cart-flight__chip")) state.chips += 1;
          if (node.classList.contains("cart-flight__trail")) state.trails += 1;
        }
      }
    }).observe(document.body, { childList: true, subtree: true });
    window.addEventListener("raaha:cart-arrival", () => { state.arrivals += 1; });
  });
}

const flightState = (page: Page) =>
  page.evaluate(() => (window as unknown as { __flights: { chips: number; arrivals: number; trails: number } }).__flights);

/** The curtain lives for well under a second, so record its arrival instead. */
async function watchCurtain(page: Page) {
  await page.evaluate(() => {
    const state = { appeared: 0 };
    (window as unknown as { __curtain: typeof state }).__curtain = state;
    new MutationObserver((records) => {
      for (const record of records) {
        for (const node of record.addedNodes) {
          if (node instanceof HTMLElement && node.classList.contains("route-curtain")) state.appeared += 1;
        }
      }
    }).observe(document.body, { childList: true, subtree: true });
  });
}

const curtainState = (page: Page) =>
  page.evaluate(() => (window as unknown as { __curtain: { appeared: number } }).__curtain);

test.beforeEach(async ({ page }) => {
  await page.route("**/google.com/maps**", (route) => route.abort());
  await page.route("**/tile.openstreetmap.org/**", (route) => route.abort());
});

test("an added dish flies to the cart, lands with a ring, and cleans up after itself", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "The flight targets the header cart button.");
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/#/home");
  const layer = page.locator(".cart-flight");
  await expect(layer).toHaveAttribute("aria-hidden", "true");
  await expect(layer).toHaveCSS("pointer-events", "none");
  const cart = page.getByRole("button", { name: "Cart, 0 items" });
  await expect(cart).toHaveAttribute("data-cart-target", "true");

  await watchFlights(page);
  const card = page.getByRole("button", { name: `${item.name}, ${formatPrice(item.price)}. View details`, exact: true });
  await card.scrollIntoViewIfNeeded();
  await card.locator("..").getByRole("button", { name: `Add ${item.name} to cart` }).click();
  await expect(page.getByRole("button", { name: "Cart, 1 items" })).toBeVisible();

  // One chip and one trail are created, the landing is announced, and neither
  // glyph is left in the document afterwards.
  await expect.poll(async () => (await flightState(page)).chips).toBe(1);
  await expect.poll(async () => (await flightState(page)).trails).toBe(1);
  await expect.poll(async () => (await flightState(page)).arrivals).toBe(1);
  // The ring is time-windowed, so it is asserted the moment the flight lands;
  // the cleanup polls below have no deadline of their own.
  await expect(page.locator(".site-cart-arrival")).toHaveCount(1);
  await expect(page.locator(".site-cart-badge")).toHaveCSS("animation-name", "cart-badge-pop");
  // The badge animation the flight triggers must not hide the ring's own pseudo.
  expect(await page.locator(".site-cart-arrival").evaluate((node) => getComputedStyle(node, "::after").pointerEvents)).toBe("none");
  await expect.poll(() => page.locator(".cart-flight__chip").count()).toBe(0);
  await expect.poll(() => page.locator(".cart-flight__trail").count()).toBe(0);
  await expect.poll(() => page.locator(".site-cart-arrival").count()).toBe(0);
});

test("the flight is skipped entirely for reduced motion, and adding still works", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "This assertion covers the header cart button.");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/#/home");
  await watchFlights(page);
  const card = page.getByRole("button", { name: `${item.name}, ${formatPrice(item.price)}. View details`, exact: true });
  await card.scrollIntoViewIfNeeded();
  await card.locator("..").getByRole("button", { name: `Add ${item.name} to cart` }).click();
  await expect(page.getByRole("button", { name: "Cart, 1 items" })).toBeVisible();
  await page.waitForTimeout(300);
  expect(await flightState(page)).toEqual({ chips: 0, arrivals: 0, trails: 0 });
  await expect(page.locator(".cart-flight__chip")).toHaveCount(0);
  await expect(page.locator(".site-cart-arrival")).toHaveCount(0);
});

test("cart totals count to their value without announcing intermediate amounts", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/#/home");
  const card = page.getByRole("button", { name: `${item.name}, ${formatPrice(item.price)}. View details`, exact: true });
  await card.scrollIntoViewIfNeeded();
  const add = card.locator("..").getByRole("button", { name: `Add ${item.name} to cart` });
  await add.click();
  await add.click();
  await page.getByRole("button", { name: "Cart, 2 items" }).click();
  await expect(page.getByRole("heading", { name: "The Cart" })).toBeVisible();

  const summary = page.locator("aside").filter({ hasText: "Request summary" });
  const total = summary.locator("span.font-display").last();
  // The running digits are decorative; the final amount is the announced one.
  await expect(total.locator(".count-value")).toHaveAttribute("aria-hidden", "true");
  await expect.poll(() => total.locator(".count-value").innerText()).toBe(formatPrice(item.price * 2));
  await expect(total.locator(".sr-only")).toHaveText(formatPrice(item.price * 2));
  // innerText separates the two spans; textContent shows the deliberate pair:
  // a decorative running number plus the announced final amount.
  expect(await total.textContent()).toBe(`${formatPrice(item.price * 2)}${formatPrice(item.price * 2)}`);
  await expect(total.locator(".count-value")).toHaveCSS("animation-name", "count-tick");

  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(total.locator(".count-value")).toHaveText(formatPrice(item.price * 2));
  await expect(total.locator(".count-value")).toHaveCSS("animation-name", "none");
});

test("dark banners carry a pointer light that never widens the page or takes input", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "The light follows a fine pointer.");
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/#/cart");
  const banner = page.locator("[data-section-light]").first();
  await expect(banner).toHaveCSS("pointer-events", "auto");
  const box = (await banner.boundingBox())!;
  await page.mouse.move(box.x + box.width * 0.3, box.y + box.height * 0.5);
  const light = banner.locator(".section-light");
  await expect.poll(() => light.count()).toBe(1);
  await expect(light).toHaveAttribute("aria-hidden", "true");
  await expect(light).toHaveCSS("pointer-events", "none");
  await expect.poll(() => light.evaluate((node: HTMLElement) => node.style.transform)).toContain("translate3d");
  await expect(banner).toHaveAttribute("data-light-active", "true");
  const first = await light.evaluate((node: HTMLElement) => node.style.transform);
  await page.mouse.move(box.x + box.width * 0.7, box.y + box.height * 0.4);
  await expect.poll(() => light.evaluate((node: HTMLElement) => node.style.transform)).not.toBe(first);
  // The pool is clipped by its banner, so the document never scrolls sideways.
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(1440);

  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(light).toHaveCount(0);
  await expect(banner.locator(".section-light")).toHaveCount(0);
  await page.mouse.move(box.x + box.width * 0.5, box.y + box.height * 0.5);
  await expect(banner.locator(".section-light")).toHaveCount(0);
});

test("steam rises over a dish and the route curtain sweeps once per navigation", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "The curtain assertion navigates from a dish page.");
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/#/food/egg-biryani");

  const steam = page.locator(".steam-field");
  await expect(steam).toHaveAttribute("aria-hidden", "true");
  await expect(steam).toHaveCSS("pointer-events", "none");
  await expect(steam.locator(".steam-wisp")).toHaveCount(3);
  await expect(steam.locator(".steam-wisp").first()).toHaveCSS("animation-name", "steam-rise");
  // The artwork leans, but its badges and the page controls stay put.
  const photo = page.locator(".food-detail__photo");
  await expect(photo).toHaveCSS("animation-name", "dish-photo-arrive");
  await expect(page.getByRole("heading", { level: 1, name: "Egg Biryani" })).toBeVisible();

  // Navigating paints exactly one curtain band, which then removes itself.
  await watchCurtain(page);
  await expect(page.locator(".route-curtain")).toHaveCount(0);
  await page.getByRole("button", { name: "Menu", exact: true }).first().click();
  await expect(page).toHaveURL(/#\/menu$/);
  await expect(page.getByRole("heading", { name: "The Raaha menu." })).toBeVisible();
  await expect.poll(async () => (await curtainState(page)).appeared).toBe(1);
  await expect.poll(() => page.locator(".route-curtain").count()).toBe(0);
  await expect.poll(() => page.locator(".route-curtain__band").count()).toBe(0);

  // Reduced motion: no steam, and no curtain on the next navigation.
  await page.goto("/#/food/egg-biryani");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(page.locator(".steam-field")).toBeHidden();
  await expect(page.locator(".steam-wisp").first()).toBeHidden();
  await expect(page.locator(".steam-wisp").first()).toHaveCSS("animation-name", "none");
  const before = (await curtainState(page)).appeared;
  await page.getByRole("button", { name: "Menu", exact: true }).first().click();
  await expect(page).toHaveURL(/#\/menu$/);
  await expect(page.getByRole("heading", { name: "The Raaha menu." })).toBeVisible();
  expect(await curtainState(page)).toEqual({ appeared: before });
  await expect(page.locator(".route-curtain")).toHaveCount(0);
});

test("toast feedback springs in, shows its lifetime, and stays still for reduced motion", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "This uses the desktop card layout.");
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/#/home");
  const card = page.getByRole("button", { name: `${item.name}, ${formatPrice(item.price)}. View details`, exact: true });
  await card.scrollIntoViewIfNeeded();
  await card.locator("..").getByRole("button", { name: `Add ${item.name} to cart` }).click();
  const toast = page.locator(".m3-snackbar").first();
  await expect(toast).toHaveCSS("animation-name", "toast-spring");
  await expect(toast.locator(".toast-icon")).toHaveCSS("animation-name", "toast-icon-pop");
  const fill = toast.locator(".toast-progress__fill");
  await expect(fill).toHaveCSS("animation-name", "toast-progress");
  await expect(toast.locator(".toast-progress")).toHaveAttribute("aria-hidden", "true");
  await expect(toast.locator(".toast-progress")).toHaveCSS("pointer-events", "none");
  await expect(toast.getByRole("button", { name: "View cart" })).toBeVisible();
  // The message text is readable while the decoration runs.
  await expect(toast).toContainText("Added to cart");

  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(toast).toHaveCSS("animation-name", "none");
  await expect(toast.locator(".toast-progress")).toBeHidden();
  await expect(toast.getByRole("button", { name: "View cart" })).toBeEnabled();
  await toast.getByRole("button", { name: "View cart" }).click();
  await expect(page).toHaveURL(/#\/cart$/);
  await expect(page.getByRole("heading", { name: "The Cart" })).toBeVisible();
});

test("section headings arrive behind a mask without changing their name", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/#/services");
  const heading = page.getByRole("heading", { level: 2, name: /A simple way to/ });
  await heading.scrollIntoViewIfNeeded();
  const mask = heading.locator(".mask-line");
  const inner = mask.locator(".mask-line__inner");
  await expect(mask).toHaveCSS("overflow", "hidden");
  await expect(heading.locator(".mask-line__inner")).toHaveCount(1);
  await expect.poll(() => inner.evaluate((node) => getComputedStyle(node).animationName)).toBe("mask-line-rise");
  await expect.poll(() => inner.evaluate((node) => new DOMMatrixReadOnly(getComputedStyle(node).transform).f)).toBeLessThan(1);
  // The accessible name is unchanged by the extra masking spans.
  expect((await heading.innerText()).replace(/\s+/g, " ").trim().length).toBeGreaterThan(6);

  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(inner).toHaveCSS("animation-name", "none");
  await expect.poll(() => inner.evaluate((node) => new DOMMatrixReadOnly(getComputedStyle(node).transform).f)).toBe(0);
  await expect(heading).toBeVisible();
});

test("scroll-driven parallax only runs where the browser can drive it", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "This checks a scroll timeline on a wide layout.");
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/#/home");
  const supported = await page.evaluate(() => CSS.supports("animation-timeline", "view()"));
  test.skip(!supported, "This Chromium build has no scroll-driven animation support.");
  const column = page.locator(".home-story .parallax-drift").first();
  await expect(column).toHaveCSS("animation-timeline", "view()");
  await column.scrollIntoViewIfNeeded();
  const translate = () => column.evaluate((node) => getComputedStyle(node).translate);
  const near = await translate();
  await page.evaluate(() => window.scrollTo({ top: document.documentElement.scrollHeight, behavior: "instant" }));
  await expect.poll(translate).not.toBe(near);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(1440);

  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(column).toHaveCSS("animation-name", "none");
  await expect(page.getByRole("heading", { level: 1, name: "Where Madurai comes to feast." })).toBeVisible();
});

test("artwork tilt and button glow follow a fine pointer without moving controls", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "Tilt and glow are fine-pointer effects.");
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/#/home");
  const card = page.getByRole("button", { name: `${item.name}, ${formatPrice(item.price)}. View details`, exact: true });
  await card.scrollIntoViewIfNeeded();
  const detailBox = (await card.boundingBox())!;
  const art = card.locator("..").locator(".tilt-art");
  await expect(art).toHaveCSS("pointer-events", "auto");
  await page.mouse.move(detailBox.x + detailBox.width * 0.3, detailBox.y + 40);
  await expect.poll(() => art.evaluate((node: HTMLElement) => node.style.transform)).toContain("rotateY");
  // The stretched detail button keeps its exact box while the artwork leans.
  const afterArt = (await card.boundingBox())!;
  expect(Math.abs(afterArt.x - detailBox.x)).toBeLessThan(0.5);
  expect(Math.abs(afterArt.width - detailBox.width)).toBeLessThan(0.5);

  const add = card.locator("..").getByRole("button", { name: `Add ${item.name} to cart` });
  const glow = add.locator(".motion-cta__glow");
  await expect(glow).toHaveAttribute("aria-hidden", "true");
  await expect(glow).toHaveCSS("pointer-events", "none");
  await add.hover();
  await expect.poll(() => glow.evaluate((node: HTMLElement) => node.style.getPropertyValue("--glow-x"))).toContain("px");
  // A late layout shift can slide the button out from under the cursor;
  // re-hover once so the glow state reflects the pointer actually resting on it.
  await add.hover();
  await expect.poll(async () => Number(await glow.evaluate((node) => getComputedStyle(node).opacity))).toBeGreaterThan(0.9);
  // A press leaves a ripple that removes itself again.
  await add.click();
  await expect(page.getByRole("button", { name: "Cart, 1 items" })).toBeVisible();
  await expect.poll(() => page.locator(".press-ripple").count()).toBe(0);

  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(art).toHaveCSS("transform", "none");
  await expect(glow).toBeHidden();
  // The inline lean is cleared from the media-change handler, a tick after CSS.
  await expect.poll(() => art.evaluate((node: HTMLElement) => node.style.transform)).toBe("");
  await expect(add).toBeVisible();
  await expect(add).toBeEnabled();
});

const signature = (locator: import("@playwright/test").Locator) =>
  locator.evaluate((node) => {
    const style = getComputedStyle(node);
    return {
      name: style.animationName,
      timing: style.animationTimingFunction,
      fill: style.animationFillMode,
    };
  });

/** Reads a signature once its entrance has actually been handed the element. */
async function awaitSignature(locator: import("@playwright/test").Locator) {
  await expect
    .poll(async () => (await signature(locator)).name, { message: "entrance should be running" })
    .not.toBe("none");
  return signature(locator);
}

test("each surface keeps its own entrance signature instead of one shared fade", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "Signature coverage is checked on the wide layout.");
  await page.emulateMedia({ reducedMotion: "no-preference" });

  await page.goto("/#/home");
  await reachHero(page);
  const hero = page.locator(".home-hero");
  const eyebrow = await awaitSignature(hero.locator(".anim-letters"));
  const lead = await awaitSignature(hero.locator(".anim-blur"));
  expect(eyebrow).toMatchObject({ name: "letter-settle", timing: "cubic-bezier(0.22, 1, 0.36, 1)" });
  expect(lead).toMatchObject({ name: "focus-pull", timing: "cubic-bezier(0.16, 0.84, 0.44, 1)" });

  const photo = page.locator(".home-story .anim-kenburns");
  await photo.scrollIntoViewIfNeeded();
  const kenburns = await awaitSignature(photo);
  expect(kenburns).toMatchObject({ name: "kenburns-settle", fill: "backwards" });

  const tile = page.locator(".home-services .anim-scale-settle").first();
  await tile.scrollIntoViewIfNeeded();
  const settle = await awaitSignature(tile);
  expect(settle).toMatchObject({ name: "scale-settle", timing: "cubic-bezier(0.34, 1.56, 0.64, 1)" });

  const quote = page.locator(".home-testimonials .anim-tilt-rise").first();
  await quote.scrollIntoViewIfNeeded();
  const tip = await awaitSignature(quote);
  expect(tip).toMatchObject({ name: "tilt-rise", timing: "cubic-bezier(0.34, 1.45, 0.5, 1)" });

  await page.goto("/#/about");
  const value = page.locator(".anim-clip").first();
  await value.scrollIntoViewIfNeeded();
  const wipe = await awaitSignature(value);
  expect(wipe).toMatchObject({ name: "clip-unveil", timing: "cubic-bezier(0.65, 0.02, 0.2, 1)" });

  await page.goto("/#/services");
  const help = page.locator(".anim-slide-x").first();
  await help.scrollIntoViewIfNeeded();
  const row = await awaitSignature(help);
  expect(row).toMatchObject({ name: "slide-x-in" });

  // A panel that is already on screen when the route lands animates on mount,
  // uncovered top-down so it cannot nudge a narrow document wider.
  await page.goto("/#/tracking");
  const panel = await awaitSignature(page.locator(".tracking-panel.anim-veil"));
  expect(panel).toMatchObject({ name: "veil-drop", timing: "cubic-bezier(0.19, 1, 0.22, 1)" });

  // Eight distinct signatures, not one repeated fade.
  const names = new Set([eyebrow.name, lead.name, kenburns.name, settle.name, tip.name, wipe.name, row.name, panel.name]);
  expect(names.size).toBe(8);
  // And the entrance hands each element back once it finishes.
  expect(kenburns.fill).toBe("backwards");
  expect(tip.fill).toBe("backwards");
});

test("the vocabulary moves at a calmer pace than the original glide", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "Pace is asserted on one layout.");
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/#/home");
  // The shared reveal is slower than the original 0.9s glide...
  await expect(page.locator(".reveal").first()).toHaveCSS("transition-duration", "1.15s, 1.15s");
  await expect(page.locator(".home-marquee .animate-marquee").first()).toHaveCSS("animation-duration", "36s");
  // ...and so is each character layered on top of it, once the hero reveals.
  await reachHero(page);
  await expect(page.locator(".home-hero .anim-letters")).toHaveCSS("animation-duration", "1.2s");
  await expect(page.locator(".home-hero .anim-blur")).toHaveCSS("animation-duration", "1.1s");

  await page.goto("/#/menu");
  await expect(page.locator(".editorial-surface--menu .editorial-plate__well").first())
    .toHaveCSS("animation-duration", "1.08s");

  await page.goto("/#/home");
  const card = page.getByRole("button", { name: `${item.name}, ${formatPrice(item.price)}. View details`, exact: true });
  await card.scrollIntoViewIfNeeded();
  await card.locator("..").getByRole("button", { name: `Add ${item.name} to cart` }).click();
  await expect(page.locator(".m3-snackbar").first()).toHaveCSS("animation-duration", "0.72s");
  await expect(page.locator(".site-cart-badge")).toHaveCSS("animation-duration", "0.56s");
});

test("every entrance character stands down for reduced motion and stays readable", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "One layout is enough to assert the fallback.");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/#/home");
  for (const selector of [".home-hero .anim-letters", ".home-hero .anim-blur", ".home-services .anim-scale-settle"]) {
    const target = page.locator(selector).first();
    await target.scrollIntoViewIfNeeded();
    await expect(target).toHaveCSS("animation-name", "none");
    // Nothing may be left holding an entrance frame: full opacity, no filter.
    await expect(target).toBeVisible();
    expect(await target.evaluate((node) => getComputedStyle(node).opacity)).toBe("1");
    expect(await target.evaluate((node) => getComputedStyle(node).filter)).toBe("none");
  }
  await page.goto("/#/about");
  const value = page.locator(".anim-clip").first();
  await value.scrollIntoViewIfNeeded();
  await expect(value).toHaveCSS("animation-name", "none");
  await expect(value).toHaveCSS("clip-path", "none");
  await expect(value).toBeVisible();
});
