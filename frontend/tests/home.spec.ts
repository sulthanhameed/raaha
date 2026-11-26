import { expect, test } from "@playwright/test";
import { CATEGORIES, INFO, MENU, TESTIMONIALS, formatPrice, itemsByCategory, signatureItems } from "../src/data/menu";

const featured = signatureItems();

test.beforeEach(async ({ page }) => {
  // Map availability depends on the visitor's connection, not the home layout.
  await page.route("**/google.com/maps**", (route) => route.abort());
});

test("the restored dark hero keeps its image, menu and reservation actions", async ({ page }) => {
  await page.goto("/#/home");
  const hero = page.locator(".home-hero");
  await expect(hero.getByRole("heading", { level: 1, name: "Where Madurai comes to feast." })).toBeVisible();
  const image = hero.getByRole("img", { name: "Representative photograph of chicken biryani" });
  await expect(image).toHaveAttribute("src", "/images/dishes/family-biryani.webp");
  await expect.poll(() => image.evaluate((element: HTMLImageElement) => element.naturalWidth)).toBeGreaterThan(0);
  await expect(hero.locator(".home-hero__atmosphere")).toHaveAttribute("aria-hidden", "true");
  await expect(hero.getByText("4.8 · Sample rating for Raaha")).toBeVisible();
  if (!INFO.hoursConfirmed) await expect(hero.getByText("Opening hours to be confirmed")).toBeVisible();
  if (!INFO.phoneConfirmed) await expect(page.locator("main a[href^='tel:']")).toHaveCount(0);

  await hero.getByRole("button", { name: "View Menu" }).click();
  await expect(page).toHaveURL(/\/#\/menu$/);
  await expect(page.getByRole("heading", { level: 1, name: "The Raaha menu." })).toBeVisible();
  await page.goto("/#/home");
  await hero.getByRole("button", { name: "Book a Table" }).click();
  await expect(page).toHaveURL(/\/#\/reserve$/);
  await expect(page.getByRole("form", { name: "Table reservation form" })).toBeVisible();
});

test("signature dishes open details and add to the cart independently", async ({ page }) => {
  await page.goto("/#/home");
  const list = page.getByRole("list", { name: "Featured dishes" });
  await expect(list.getByRole("listitem")).toHaveCount(featured.length);
  for (const item of featured) {
    await expect(list.getByRole("button", { name: `${item.name}, ${formatPrice(item.price)}. View details`, exact: true })).toHaveCount(1);
    await expect(list.getByRole("button", { name: `Add ${item.name} to cart`, exact: true })).toHaveCount(1);
  }
  await expect(page.getByText("Food imagery and ratings are representative. The online menu is unavailable; sample dishes are shown.")).toBeVisible();

  const item = featured[0];
  const details = list.getByRole("button", { name: `${item.name}, ${formatPrice(item.price)}. View details`, exact: true });
  await details.focus();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(new RegExp(`/#/food/${item.id}$`));
  await expect(page.getByRole("heading", { level: 1, name: item.name })).toBeVisible();
  await page.goBack();
  await expect(page).toHaveURL(/\/#\/home$/);
  await list.getByRole("button", { name: `Add ${item.name} to cart` }).click();
  await list.getByRole("button", { name: `Add ${item.name} to cart` }).click();
  await expect(page).toHaveURL(/\/#\/home$/);
  const cart = page.getByRole("button", { name: "Cart, 2 items" });
  await expect(cart).toBeVisible();
  await cart.click();
  await expect(page).toHaveURL(/\/#\/cart$/);
  await expect(page.locator("main").getByRole("button", { name: `View ${item.name}` })).toBeVisible();
});

test("home links and the unchanged category plates lead to their destinations", async ({ page }) => {
  await page.goto("/#/home");
  await page.getByRole("button", { name: "More About Raaha" }).click();
  await expect(page).toHaveURL(/\/#\/about$/);
  await page.goto("/#/home");
  await page.getByRole("button", { name: /Table Booking/ }).click();
  await expect(page).toHaveURL(/\/#\/reserve$/);
  await expect(page.getByRole("form", { name: "Table reservation form" })).toBeVisible();
  await page.goto("/#/home");
  await page.getByRole("button", { name: /Dine-In/ }).click();
  await expect(page).toHaveURL(/\/#\/services$/);
  await page.goto("/#/home");
  await page.locator(".home-hero").getByRole("button", { name: "Explore the grill & tandoor menu" }).click();
  await expect(page).toHaveURL(/\/#\/menu\/grill-tandoor$/);
  await page.getByRole("button", { name: "View Menu" }).click();
  await expect(page).toHaveURL(/\/#\/dishes\/grill-tandoor$/);
  await expect(page.locator(".menu-dishes__list")).toHaveAttribute("aria-label", "Grill & Tandoor dishes");

  await page.goto("/#/home");
  const category = CATEGORIES.find((entry) => entry.id === "biryani")!;
  const categories = page.getByRole("region", { name: "Every craving, covered." });
  const plate = categories.getByRole("button", { name: `Select ${category.name}, ${itemsByCategory(category.id).length} dishes` });
  await plate.click();
  await expect(plate).toHaveAttribute("aria-pressed", "true");
  await expect(categories.locator(".editorial-category__dishes")).toHaveCount(0);
  await categories.getByRole("button", { name: "View Menu" }).click();
  await expect(page).toHaveURL(/\/#\/dishes\/biryani$/);
  const dishes = page.locator(".menu-dishes__list");
  await expect(dishes).toHaveAttribute("aria-label", "Biryani dishes");
  await expect(dishes.getByRole("listitem")).toHaveCount(itemsByCategory(category.id).length);
});

test("the section order, guest book and closing invitation are restored", async ({ page }) => {
  await page.goto("/#/home");
  const order = await page.locator("main > *").evaluateAll((elements) => elements.map((element) => {
    if (element.classList.contains("editorial-surface--home")) return "categories";
    return [...element.classList].find((name) => name.startsWith("home-"));
  }));
  expect(order).toEqual(["home-hero", "home-marquee", "home-story", "categories", "home-signatures", "home-services", "home-testimonials", "home-insta", "home-faq", "home-rating", "home-visit", "home-invitation"]);
  const story = page.locator(".home-story");
  await expect(story).toContainText(`${MENU.length}`);
  await expect(story).toContainText(`${CATEGORIES.length}`);
  if (!INFO.hoursConfirmed) await expect(story).not.toContainText("Open every day");
  const guestBook = page.locator(".home-testimonials");
  await expect(guestBook.getByRole("heading", { name: /Words from our tables/ })).toBeVisible();
  await expect(guestBook.getByText("Sample guest-book entries; these reviews have not been verified.")).toBeVisible();
  await expect(guestBook.locator("figure")).toHaveCount(TESTIMONIALS.length);
  await page.locator(".home-invitation").getByRole("button", { name: "Book a Table" }).click();
  await expect(page).toHaveURL(/\/#\/reserve$/);
  await expect(page.getByRole("form", { name: "Table reservation form" })).toBeVisible();
});

test("the hero has a local fallback and the visit section retains accessible directions", async ({ page }) => {
  await page.route("**/images/dishes/family-biryani.webp", (route) => route.abort());
  await page.goto("/#/home");
  const image = page.locator(".home-hero__photo");
  await expect(image).toHaveAttribute("src", "/images/food-unavailable.svg");
  await expect(image).toHaveAttribute("alt", "Food image unavailable");
  await expect.poll(() => image.evaluate((element: HTMLImageElement) => element.naturalWidth)).toBeGreaterThan(0);
  await expect(page.locator(".home-hero").getByRole("button", { name: "View Menu" })).toBeEnabled();
  const visit = page.locator(".home-visit");
  await expect(visit.getByRole("link", { name: "Open Maps" })).toHaveAttribute("href", /google\.com\/maps\/search/);
  const controls = await visit.getByRole("button").evaluateAll((buttons) => buttons.map((button) => {
    const box = button.getBoundingClientRect();
    return { width: box.width, height: box.height };
  }));
  expect(controls.length).toBeGreaterThan(4);
  for (const control of controls) {
    expect(control.width).toBeGreaterThanOrEqual(44);
    expect(control.height).toBeGreaterThanOrEqual(44);
  }
  const landmark = visit.getByRole("button", { name: "Meenakshi Amman Temple", exact: true });
  await expect(landmark).toBeVisible();
  await landmark.click();
  await expect(visit.locator("iframe")).toHaveAttribute("src", /Meenakshi%20Amman%20Temple/);
  await expect(visit.locator("iframe")).toHaveAttribute("title", /Meenakshi Amman Temple/);
  if (!INFO.hoursConfirmed) await expect(visit.getByText("Opening hours to be confirmed").first()).toBeVisible();
  if (!INFO.phoneConfirmed) await expect(visit.getByText("Phone number to be confirmed")).toBeVisible();
});

test("the restored home fits narrow phones through wide screens", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "This test covers its own viewport range.");
  await page.goto("/#/home");
  await page.evaluate(() => document.fonts.ready);
  for (const width of [320, 360, 390, 480, 639, 640, 768, 900, 960, 961, 1024, 1280, 1440, 1920]) {
    await page.setViewportSize({ width, height: width <= 390 ? 568 : 900 });
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
    const layout = await page.evaluate(() => {
      const hero = document.querySelector<HTMLElement>(".home-hero")!.getBoundingClientRect();
      const photo = document.querySelector<HTMLElement>(".home-hero__photo")!.getBoundingClientRect();
      const title = document.querySelector<HTMLElement>(".home-hero h1")!;
      const text = document.createRange();
      text.selectNodeContents(title);
      const titleBox = text.getBoundingClientRect();
      return {
        documentWidth: document.documentElement.scrollWidth,
        heroTop: hero.top, heroBottom: hero.bottom,
        photoLeft: photo.left, photoRight: photo.right,
        photoTop: photo.top, photoBottom: photo.bottom,
        titleLeft: titleBox.left, titleRight: titleBox.right,
      };
    });
    expect(layout.documentWidth, `${width}px document width`).toBe(width);
    expect(layout.titleLeft, `${width}px title left`).toBeGreaterThanOrEqual(0);
    expect(layout.titleRight, `${width}px title right`).toBeLessThanOrEqual(width);
    // With motion enabled the photo breathes beyond the clipped hero edges;
    // with reduced motion it is exactly the size of the hero.
    expect(layout.photoLeft, `${width}px hero photo left`).toBeLessThanOrEqual(0);
    expect(layout.photoRight, `${width}px hero photo right`).toBeGreaterThanOrEqual(width);
    expect(layout.photoTop, `${width}px hero photo top`).toBeLessThanOrEqual(layout.heroTop);
    expect(layout.photoBottom, `${width}px hero photo bottom`).toBeGreaterThanOrEqual(layout.heroBottom);

    const actions = page.locator(".home-hero .motion-cta");
    await expect(actions).toHaveCount(2);
    for (const action of await actions.all()) {
      await action.scrollIntoViewIfNeeded();
      const geometry = await action.evaluate((element) => {
        const box = element.getBoundingClientRect();
        const hit = document.elementFromPoint(box.left + box.width / 2, box.top + box.height / 2);
        return { left: box.left, right: box.right, width: box.width, height: box.height, clickable: !!hit && element.contains(hit) };
      });
      expect(geometry.left, `${width}px action left`).toBeGreaterThanOrEqual(0);
      expect(geometry.right, `${width}px action right`).toBeLessThanOrEqual(width);
      expect(geometry.width, `${width}px action width`).toBeGreaterThanOrEqual(44);
      expect(geometry.height, `${width}px action height`).toBeGreaterThanOrEqual(44);
      expect(geometry.clickable, `${width}px action hit target`).toBe(true);
    }

    const list = page.getByRole("list", { name: "Featured dishes" });
    await expect(list.getByRole("listitem")).toHaveCount(featured.length);
    for (const item of [featured[0], featured[featured.length - 1]]) {
      const add = list.getByRole("button", { name: `Add ${item.name} to cart` });
      await add.scrollIntoViewIfNeeded();
      const geometry = await add.evaluate((element) => {
        const box = element.getBoundingClientRect();
        const hit = document.elementFromPoint(box.left + box.width / 2, box.top + box.height / 2);
        return { width: box.width, height: box.height, clickable: !!hit && element.contains(hit) };
      });
      expect(geometry.width, `${width}px add width`).toBeGreaterThanOrEqual(44);
      expect(geometry.height, `${width}px add height`).toBeGreaterThanOrEqual(44);
      expect(geometry.clickable, `${width}px add hit target`).toBe(true);
    }
  }
});
