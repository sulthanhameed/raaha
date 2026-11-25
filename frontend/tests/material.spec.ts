import { expect, test } from "@playwright/test";
import { itemById } from "../src/data/menu";

test.beforeEach(async ({ page }) => {
  // Layout and demo flows do not depend on external map availability.
  await page.route("**/google.com/maps**", (route) => route.abort());
  await page.route("**/tile.openstreetmap.org/**", (route) => route.abort());
});

test("shared Material surfaces and navigation fit each route", async ({ page }) => {
  for (const route of ["home", "menu", "menu/biryani", "dishes/biryani", "food/egg-biryani", "reserve", "services", "about", "cart", "tracking"]) {
    await page.goto(`/#/${route}`);
    const width = page.viewportSize()!.width;
    const layout = await page.evaluate(() => {
      const root = getComputedStyle(document.documentElement);
      return {
        scrollWidth: document.documentElement.scrollWidth,
        primary: root.getPropertyValue("--md-sys-color-primary").trim(),
        surface: root.getPropertyValue("--md-sys-color-surface-container-low").trim(),
        icons: [...document.querySelectorAll<HTMLElement>("header .site-nav-icon")].map((element) => {
          const box = element.getBoundingClientRect();
          return { width: box.width, height: box.height, left: box.left, right: box.right };
        }),
      };
    });
    expect(layout.scrollWidth, `${route} document width`).toBe(width);
    expect(layout.primary).toBeTruthy();
    expect(layout.surface).toBeTruthy();
    expect(layout.icons).toHaveLength(3);
    for (const icon of layout.icons) {
      expect(icon.width).toBeGreaterThanOrEqual(48);
      expect(icon.height).toBeGreaterThanOrEqual(48);
      expect(icon.left).toBeGreaterThanOrEqual(0);
      expect(icon.right).toBeLessThanOrEqual(width);
    }
  }
});

test("search starts in the field, contains keyboard focus, and restores its opener", async ({ page }) => {
  await page.goto("/#/home");
  const opener = page.getByRole("button", { name: "Search dishes" });
  await opener.focus();
  await page.keyboard.press("Enter");
  const dialog = page.getByRole("dialog", { name: "Search dishes" });
  const field = dialog.getByRole("textbox", { name: "Search dishes" });
  await expect(field).toBeFocused();
  await expect(page.locator("body")).toHaveCSS("overflow", "hidden");
  const last = dialog.getByRole("button").last();
  await page.keyboard.press("Shift+Tab");
  await expect(last).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(field).toBeFocused();
  await field.fill("biryani");
  const result = dialog.getByRole("button", { name: /Egg Biryani/ });
  await expect(result).toBeVisible();
  const resultName = result.getByText("Egg Biryani", { exact: true });
  const resultText = await resultName.evaluate((element) => ({
    width: element.clientWidth,
    scrollWidth: element.scrollWidth,
    whiteSpace: getComputedStyle(element).whiteSpace,
    overflow: getComputedStyle(element).textOverflow,
  }));
  expect(resultText.scrollWidth).toBeLessThanOrEqual(resultText.width);
  expect(resultText.whiteSpace).not.toBe("nowrap");
  expect(resultText.overflow).not.toBe("ellipsis");
  await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0);
  await expect(opener).toBeFocused();
  await expect(page.locator("body")).not.toHaveCSS("overflow", "hidden");
});

test("guest profile dialog traps focus and does not silently upload a legacy profile while offline", async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem("raaha-user", JSON.stringify({ name: "Anu", phone: "9876543210" })));
  await page.goto("/#/home");
  const accountButton = page.locator("header .site-nav-icon").nth(1);
  await accountButton.focus();
  await page.keyboard.press("Enter");
  const dialog = page.getByRole("dialog", { name: "Your account" });
  const close = dialog.getByRole("button", { name: "Close" });
  const save = dialog.getByRole("button", { name: "Save profile" });
  await expect(close).toBeFocused();
  await page.keyboard.press("Shift+Tab");
  await expect(dialog.getByLabel("Mobile number")).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(close).toBeFocused();
  await expect(dialog.getByLabel("Full name")).toHaveValue("Anu");
  await expect(dialog.getByLabel("Mobile number")).toHaveValue("9876543210");
  await expect(dialog.getByText("They will be sent online only if you choose Save profile.", { exact: false })).toBeVisible();
  await expect(save).toBeDisabled();
  await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem("raaha-user") || "null"))).toEqual({ name: "Anu", phone: "9876543210" });
  await page.keyboard.press("Escape");
  await expect(accountButton).toBeFocused();
});

test("cart names wrap on small screens and quantity and remove controls remain usable", async ({ page }) => {
  const item = itemById("chicken-dum-biryani")!;
  await page.goto(`/#/food/${item.id}`);
  await page.getByRole("button", { name: "Add to Cart", exact: true }).click();
  await page.getByRole("button", { name: "Cart, 1 items" }).click();
  const line = page.locator("main article").filter({ hasText: item.name }).first();
  const name = line.getByText(item.name, { exact: true });
  await expect(name).toBeVisible();
  const text = await name.evaluate((element) => {
    const style = getComputedStyle(element);
    return { width: element.clientWidth, scrollWidth: element.scrollWidth, overflow: style.textOverflow, whiteSpace: style.whiteSpace };
  });
  expect(text.scrollWidth).toBeLessThanOrEqual(text.width);
  expect(text.overflow).not.toBe("ellipsis");
  expect(text.whiteSpace).not.toBe("nowrap");
  for (const button of await line.getByRole("button").all()) {
    const box = (await button.boundingBox())!;
    expect(box.width).toBeGreaterThanOrEqual(48);
    expect(box.height).toBeGreaterThanOrEqual(48);
  }
  await line.getByRole("button", { name: "Increase quantity" }).click();
  await expect(page.getByRole("button", { name: "Cart, 2 items" })).toBeVisible();
  await line.getByRole("button", { name: "Decrease quantity" }).click();
  await expect(page.getByRole("button", { name: "Cart, 1 items" })).toBeVisible();
  await line.getByRole("button", { name: `Remove ${item.name} from cart` }).click();
  await expect(page.getByRole("heading", { name: "Your cart is craving attention" })).toBeVisible();
});

test("unconfigured checkout contains focus and never claims an order was sent", async ({ page }) => {
  const posts: string[] = [];
  page.on("request", (request) => { if (request.method() === "POST") posts.push(request.url()); });
  await page.goto("/#/food/egg-biryani");
  await page.getByRole("button", { name: "Add to Cart", exact: true }).click();
  await page.getByRole("button", { name: "Cart, 1 items" }).click();
  const opener = page.getByRole("button", { name: "Proceed to Checkout" });
  await opener.focus();
  await page.keyboard.press("Enter");
  const dialog = page.getByRole("dialog", { name: "Checkout" });
  const close = dialog.getByRole("button", { name: "Close" });
  await expect(close).toBeFocused();
  await page.keyboard.press("Shift+Tab");
  await expect(dialog.getByRole("radio", { name: /Pay later/ })).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(close).toBeFocused();
  await dialog.getByLabel("Your name").fill("Anu");
  await dialog.getByLabel("Mobile number").fill("9876543210");
  await dialog.getByLabel("Delivery address").fill("Chinna Chokikulam, Madurai");
  await expect(dialog.getByText("Online requests are unavailable", { exact: false })).toBeVisible();
  await expect(dialog.getByRole("button", { name: /Send Order Request/ })).toBeDisabled();
  await expect(dialog.getByRole("heading", { name: "Your request is saved." })).toHaveCount(0);
  await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem("raaha-cart") || "[]"))).toEqual([{ id: "egg-biryani", qty: 1 }]);
  expect(await page.evaluate(() => localStorage.getItem("raaha-active-order"))).toBeNull();
  expect(posts).toEqual([]);
  await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0);
  await expect(opener).toBeFocused();
});

test("direct Order Now returns keyboard focus to the cart checkout action", async ({ page }) => {
  await page.goto("/#/food/egg-biryani");
  await page.getByRole("button", { name: "Order Now", exact: true }).focus();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/#\/cart$/);
  const dialog = page.getByRole("dialog", { name: "Checkout" });
  await expect(dialog.getByRole("button", { name: "Close" })).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Proceed to Checkout" })).toBeFocused();
});

test("review controls are keyboard usable and legacy local notes are not silently uploaded", async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem("raaha-reviews:egg-biryani", JSON.stringify([{ id: "old", name: "Ravi", text: "A note saved on this device.", rating: 4, date: new Date().toISOString() }])));
  await page.goto("/#/food/egg-biryani");
  const review = page.locator("#dish-reviews");
  await review.getByRole("radio", { name: "1 star", exact: true }).focus();
  await page.keyboard.press("ArrowRight");
  await page.keyboard.press("ArrowRight");
  await page.keyboard.press("ArrowRight");
  await expect(review.getByRole("radio", { name: "4 stars" })).toBeChecked();
  await review.getByLabel("Your name").fill("Ravi");
  await review.getByLabel("Your review").fill("A new review.");
  await expect(review.getByRole("button", { name: "Submit review" })).toBeDisabled();
  await expect(review.getByText("A note saved on this device.")).toBeVisible();
  await expect(review.getByText("These notes have not been sent to the restaurant.", { exact: false })).toBeVisible();
  await review.getByRole("button", { name: "Remove local note by Ravi" }).click();
  await expect(review.getByText("A note saved on this device.")).toHaveCount(0);
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem("raaha-reviews:egg-biryani") || "null"))).toEqual([]);
});

test("the route preview uses touch-sized controls and stays below the fixed header", async ({ page }) => {
  await page.goto("/#/tracking");
  await page.getByRole("button", { name: "Preview demo route" }).click();
  const slider = page.getByRole("slider", { name: "Preview courier position along the route" });
  const box = (await slider.boundingBox())!;
  expect(box.height).toBeGreaterThanOrEqual(48);
  await slider.focus();
  await page.keyboard.press("End");
  await expect(slider).toHaveValue("100");
  await expect(page.getByRole("heading", { name: "Preview: At your door" })).toBeVisible();
  await page.getByRole("button", { name: "Restart route preview" }).click();
  await expect(slider).toHaveValue("6");
  for (const control of [page.getByRole("button", { name: "Full route" }), page.getByRole("button", { name: "Find courier" }), page.getByRole("button", { name: "Zoom in" }), page.getByRole("button", { name: "Zoom out" })]) {
    const dimensions = (await control.boundingBox())!;
    expect(dimensions.width).toBeGreaterThanOrEqual(48);
    expect(dimensions.height).toBeGreaterThanOrEqual(48);
  }

  // Align the bottom of the Leaflet map with the fixed header: its high internal
  // z-indices must not cover the header controls as the page scrolls.
  await page.evaluate(() => {
    const map = document.querySelector(".tracking-map")!.getBoundingClientRect();
    window.scrollTo({ top: window.scrollY + map.bottom - 95, behavior: "instant" });
  });
  const unobstructed = await page.locator("header .site-nav-icon").evaluateAll((icons) => icons.map((icon) => {
    const box = icon.getBoundingClientRect();
    const hit = document.elementFromPoint(box.left + box.width / 2, box.top + box.height / 2);
    return !!hit && icon.contains(hit);
  }));
  expect(unobstructed).toEqual([true, true, true]);
});
