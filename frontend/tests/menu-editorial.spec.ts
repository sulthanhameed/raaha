import { expect, test, type Locator, type Page } from "@playwright/test";
import { CATEGORIES, formatPrice, itemsByCategory, type Category } from "../src/data/menu";

const plateFor = (scope: Page | Locator, category: Category) =>
  scope.getByRole("button", { name: `Select ${category.name}, ${itemsByCategory(category.id).length} dishes`, exact: true });

const menuSection = (page: Page) => page.getByRole("region", { name: "The Raaha menu." });

const dishButton = (scope: Page | Locator, name: string, price: number) =>
  scope.getByRole("button", { name: `${name} ${formatPrice(price)}`, exact: true });

// The revealed category's dishes live in the menu page's dish showcase,
// below the category wave — never inside the category rows themselves.
const dishesOf = (page: Page, _categoryId: string) =>
  page.locator("#menu-category-dishes .menu-dishes__list");

test("home and menu share the same category artwork and editorial wave", async ({ page }) => {
  await page.goto("/#/home");
  await page.evaluate(() => document.fonts.ready);
  const home = page.getByRole("region", { name: "Every craving, covered." });
  await expect(home.getByRole("list", { name: "Food categories" }).getByRole("listitem")).toHaveCount(CATEGORIES.length);
  const homeDesign = await home.evaluate((section) => ({
    wave: section.querySelector(".editorial-surface__wave path")?.getAttribute("d"),
    background: getComputedStyle(section).backgroundColor,
    images: [...section.querySelectorAll(".editorial-category__plate img")].map((image) => image.getAttribute("src")),
  }));
  const homeSize = await home.evaluate((section) => ({
    height: section.getBoundingClientRect().height,
    row: section.querySelector(".editorial-category")!.getBoundingClientRect().height,
    plates: [...section.querySelectorAll(".editorial-category__plate")].map((plate) => parseFloat(getComputedStyle(plate).width)),
  }));

  const homePlate = plateFor(home, CATEGORIES[0]);
  await homePlate.click();
  await expect(homePlate).toHaveAttribute("aria-pressed", "true");
  await expect(home.getByRole("heading", { level: 3, name: CATEGORIES[0].name })).toBeVisible();
  await expect(home.getByRole("button", { name: "View Menu" })).toHaveAccessibleDescription(CATEGORIES[0].name);
  await expect(home.locator(".editorial-category__dishes")).toHaveCount(0);

  await page.getByRole("button", { name: "Menu", exact: true }).click();
  await expect(page).toHaveURL(/\/#\/menu$/);
  const menu = menuSection(page);
  await expect(menu.getByRole("heading", { level: 1 })).toHaveText("The Raaha menu.");
  await expect(menu.getByRole("list", { name: "Food categories" }).getByRole("listitem")).toHaveCount(CATEGORIES.length);
  const menuDesign = await menu.evaluate((section) => ({
    wave: section.querySelector(".editorial-surface__wave path")?.getAttribute("d"),
    background: getComputedStyle(section).backgroundColor,
    images: [...section.querySelectorAll(".editorial-category__plate img")].map((image) => image.getAttribute("src")),
  }));
  expect(menuDesign).toEqual(homeDesign);
  expect(menuDesign.images.every((src) => src?.startsWith("/images/dish-cutouts/"))).toBe(true);
  const menuSize = await menu.evaluate((section) => ({
    height: section.getBoundingClientRect().height,
    row: section.querySelector(".editorial-category")!.getBoundingClientRect().height,
    plates: [...section.querySelectorAll(".editorial-category__plate")].map((plate) => parseFloat(getComputedStyle(plate).width)),
  }));
  // Shorten the space between foods, not the food images themselves.
  expect(menuSize.height).toBeLessThan(homeSize.height * 0.9);
  expect(menuSize.row).toBeLessThan(homeSize.row);
  expect(menuSize.plates).toHaveLength(homeSize.plates.length);
  menuSize.plates.forEach((width, index) => expect(width).toBeCloseTo(homeSize.plates[index], 2));
  await expect(menu.locator(".category-showcase, .table-scene")).toHaveCount(0);
});

test("compact menu keeps every home plate at its original responsive size", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "This test covers its own range of viewport sizes.");
  for (const width of [320, 360, 390, 480, 639, 640, 768, 1024, 1200, 1280, 1440, 1920]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/#/home");
    await page.evaluate(() => document.fonts.ready);
    const home = page.getByRole("region", { name: "Every craving, covered." });
    const homeLayout = await home.evaluate((section) => ({
      height: section.getBoundingClientRect().height,
      plates: [...section.querySelectorAll(".editorial-category__plate")].map((plate) => parseFloat(getComputedStyle(plate).width)),
    }));
    await page.goto("/#/menu");
    const menuLayout = await menuSection(page).evaluate((section) => ({
      height: section.getBoundingClientRect().height,
      plates: [...section.querySelectorAll(".editorial-category__plate")].map((plate) => parseFloat(getComputedStyle(plate).width)),
    }));
    expect(menuLayout.height, `${width}px menu height`).toBeLessThan(homeLayout.height);
    expect(menuLayout.plates).toHaveLength(CATEGORIES.length);
    menuLayout.plates.forEach((plate, index) => expect(plate, `${width}px ${CATEGORIES[index].name}`).toBeCloseTo(homeLayout.plates[index], 2));
  }
});

test("each category reveals its name, count and contextual menu action", async ({ page }) => {
  await page.goto("/#/menu");
  const menu = menuSection(page);
  let previous: Category | undefined;
  for (const category of CATEGORIES) {
    const plate = plateFor(menu, category);
    await expect(plate).toHaveAttribute("aria-pressed", "false");
    await plate.click();
    await expect(plate).toHaveAttribute("aria-pressed", "true");
    if (previous) await expect(plateFor(menu, previous)).toHaveAttribute("aria-pressed", "false");
    await expect(menu.locator(".editorial-category__detail")).toHaveCount(1);
    const detail = plate.locator("..").locator(".editorial-category__detail");
    await expect(detail.getByRole("heading", { level: 2 })).toHaveText(category.name);
    await expect(detail.getByText(`${itemsByCategory(category.id).length} dishes`, { exact: true })).toBeVisible();
    await expect(plate.locator("..").locator(".editorial-category__dishes")).toHaveCount(0);
    await expect(plate.locator("..").getByRole("button", { name: "View Menu" })).toBeVisible();
    const dishes = dishesOf(page, category.id);
    await expect(dishes).toHaveAttribute("aria-label", `${category.name} dishes`);
    await expect(dishes.getByRole("listitem")).toHaveCount(itemsByCategory(category.id).length);
    const first = itemsByCategory(category.id)[0];
    await expect(dishButton(dishes, first.name, first.price)).toBeVisible();
    // The selected plate scales immediately with reduced motion and gradually
    // with normal motion, so wait for the visual selection to take effect.
    await expect.poll(() => plate.evaluate((element) => new DOMMatrixReadOnly(getComputedStyle(element).transform).a)).toBeGreaterThan(1);
    previous = category;
  }
});

test("all eight categories reveal their dish list on the menu and open a dish page", async ({ page }) => {
  for (const category of CATEGORIES) {
    await page.goto("/#/menu");
    await plateFor(menuSection(page), category).click();
    const dishes = dishesOf(page, category.id);
    await expect(dishes).toBeVisible();
    await expect(dishes).toHaveAttribute("aria-label", `${category.name} dishes`);
    await expect(dishes.getByRole("listitem")).toHaveCount(itemsByCategory(category.id).length);
    const first = itemsByCategory(category.id)[0];
    await dishButton(dishes, first.name, first.price).click();
    await expect(page).toHaveURL(new RegExp(`/#/food/${first.id}$`));
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(first.name);
  }
});

test("a keyboard user can reveal a category and follow its menu action", async ({ page }) => {
  await page.goto("/#/menu");
  const category = CATEGORIES.find((entry) => entry.id === "breads-rice")!;
  const plate = plateFor(menuSection(page), category);
  await plate.focus();
  await page.keyboard.press("Enter");
  await expect(plate).toHaveAttribute("aria-pressed", "true");
  const first = itemsByCategory(category.id)[0];
  const dish = dishButton(dishesOf(page, category.id), first.name, first.price);
  await page.keyboard.press("Tab");
  const view = menuSection(page).getByRole("button", { name: "View Menu" });
  await expect(view).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.locator("#menu-category-dishes")).toBeInViewport();
  await dish.focus();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(new RegExp(`/#/food/${first.id}$`));
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(first.name);
});

test("missing category cutouts fall back without breaking navigation", async ({ page }) => {
  await page.route("**/images/dish-cutouts/*.webp", (route) => route.abort());
  await page.goto("/#/menu");
  // Cover both the eagerly loaded first image and a lazy-loaded image below the fold.
  for (const category of [CATEGORIES[0], CATEGORIES[CATEGORIES.length - 1]]) {
    const plate = plateFor(menuSection(page), category);
    await plate.scrollIntoViewIfNeeded();
    const image = plate.locator("img");
    await expect(image).toHaveAttribute("src", "/images/food-unavailable.svg");
    await expect.poll(() => image.evaluate((element: HTMLImageElement) => element.complete && element.naturalWidth > 0)).toBe(true);
    await plate.click();
    await expect(plate).toHaveAttribute("aria-pressed", "true");
  }
  const first = itemsByCategory("beverages")[0];
  const dish = dishButton(dishesOf(page, "beverages"), first.name, first.price);
  await expect(dish).toBeVisible();
  await dish.click();
  await expect(page).toHaveURL(new RegExp(`/#/food/${first.id}$`));
});

test("a category deep link leads through to a dish and back to the revealed list", async ({ page }) => {
  const dish = itemsByCategory("biryani")[2];
  await page.goto("/#/menu/biryani");
  const dishes = dishesOf(page, "biryani");
  await expect(page.locator("#editorial-cat-biryani")).toBeInViewport();
  await expect(dishes).toHaveAttribute("aria-label", "Biryani dishes");
  await dishButton(dishes, dish.name, dish.price).click();
  await expect(page).toHaveURL(new RegExp(`/#/food/${dish.id}$`));
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(dish.name);
  await page.goBack();
  await expect(page).toHaveURL(/\/#\/menu\/biryani$/);
  await expect(dishButton(dishes, dish.name, dish.price)).toBeVisible();
  await page.getByRole("button", { name: "Menu", exact: true }).click();
  await expect(page).toHaveURL(/\/#\/menu$/);
});

test("changing categories during animation keeps the correct action and respects reduced motion", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/#/menu");
  for (const index of [0, 2, 6, 1]) await plateFor(menuSection(page), CATEGORIES[index]).click();
  const category = CATEGORIES[1];
  const menu = menuSection(page);
  await expect(plateFor(menu, category)).toHaveAttribute("aria-pressed", "true");
  const detail = menu.locator(".editorial-category__detail");
  await expect(detail).toHaveCount(1);
  await expect(detail.getByRole("heading", { level: 2 })).toHaveText(category.name);
  await expect(detail).toHaveCSS("animation-name", "editorial-detail-in-left");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(detail).toHaveCSS("animation-name", "none");
  const first = itemsByCategory(category.id)[0];
  await dishButton(dishesOf(page, category.id), first.name, first.price).click();
  await expect(page).toHaveURL(new RegExp(`/#/food/${first.id}$`));
});

test("category details and controls stay usable from small phones to wide screens", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "This test covers its own range of viewport sizes.");
  const viewports = [
    { width: 320, height: 568 }, { width: 360, height: 640 }, { width: 390, height: 844 },
    { width: 480, height: 900 }, { width: 600, height: 900 }, { width: 639, height: 900 },
    { width: 640, height: 900 }, { width: 768, height: 900 }, { width: 900, height: 900 },
    { width: 1024, height: 900 }, { width: 1200, height: 900 }, { width: 1280, height: 900 },
    { width: 1440, height: 900 }, { width: 1920, height: 900 },
  ];
  for (const viewport of viewports) {
    await page.setViewportSize(viewport);
    await page.goto("/#/menu");
    await page.evaluate(() => document.fonts.ready);
    for (const category of CATEGORIES) {
      const plate = plateFor(menuSection(page), category);
      await plate.click();
      const geometry = await plate.locator("..").evaluate((row) => {
        const plate = row.querySelector<HTMLButtonElement>(".editorial-category__plate")!;
        const detail = row.querySelector<HTMLElement>(".editorial-category__detail")!;
        const title = detail.querySelector<HTMLElement>(".editorial-category__detail-title")!;
        const view = row.querySelector<HTMLElement>(".editorial-category__view")!;
        const rowBox = row.getBoundingClientRect();
        const plateBox = plate.getBoundingClientRect();
        const detailBox = detail.getBoundingClientRect();
        const viewBox = view.getBoundingClientRect();
        const text = document.createRange();
        text.selectNodeContents(title);
        const textBox = text.getBoundingClientRect();
        const overlap = Math.max(0, Math.min(detailBox.right, plateBox.right) - Math.max(detailBox.left, plateBox.left)) *
          Math.max(0, Math.min(detailBox.bottom, plateBox.bottom) - Math.max(detailBox.top, plateBox.top));
        // Scroll each target into view first: a tall dish card may extend past
        // a short viewport, and coverage (not viewport fit) is what matters.
        const centerHits = (target: HTMLElement) => {
          target.scrollIntoView({ block: "center", behavior: "instant" });
          const box = target.getBoundingClientRect();
          const hit = document.elementFromPoint((box.left + box.right) / 2, (box.top + box.bottom) / 2);
          return hit !== null && target.contains(hit);
        };
        const surface = row.closest<HTMLElement>(".editorial-surface")!;
        const intersection = (a: DOMRect, b: DOMRect) =>
          Math.max(0, Math.min(a.right, b.right) - Math.max(a.left, b.left)) *
          Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top));
        const neighborPlates = [...surface.querySelectorAll<HTMLElement>(".editorial-category__plate")]
          .filter((other) => other !== plate).map((other) => other.getBoundingClientRect());
        const neighborPlateOverlap = Math.max(0, ...neighborPlates.map((other) => intersection(plateBox, other)));
        const neighborDetailOverlap = Math.max(0, ...neighborPlates.map((other) => intersection(detailBox, other)));
        const neighborViewOverlap = Math.max(0, ...neighborPlates.map((other) => intersection(viewBox, other)));
        const wave = surface.querySelector<SVGGeometryElement>(".editorial-surface__wave path")!;
        const screenToWave = wave.getScreenCTM()!.inverse();
        // Check the actual text bounds against the wave, including on ultrawide
        // screens where white text can otherwise land on the cream side.
        const textOnBackground = (element: Element, red: boolean) => {
          const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
          let node: Node | null;
          while ((node = walker.nextNode())) {
            if (!node.textContent?.trim()) continue;
            const range = document.createRange();
            range.selectNodeContents(node);
            for (const rect of range.getClientRects()) {
              if (rect.width < 1 || rect.height < 1) continue;
              for (const x of [rect.left + Math.min(2, rect.width / 2), rect.right - Math.min(2, rect.width / 2)]) {
                for (const y of [rect.top + Math.min(2, rect.height / 2), rect.bottom - Math.min(2, rect.height / 2)]) {
                  if (wave.isPointInFill(new DOMPoint(x, y).matrixTransform(screenToWave)) !== red) return false;
                }
              }
            }
          }
          return true;
        };
        const backdrops = [
          { element: detail, red: row.classList.contains("editorial-category--right") },
          { element: surface.querySelector(".editorial-category-heading__copy")!, red: false },
          { element: surface.querySelector(".editorial-category-heading__aside")!, red: true },
          { element: surface.querySelector(".editorial-surface__end > p")!, red: false },
          { element: surface.querySelector(".editorial-surface__end > span")!, red: true },
          ...[...surface.querySelectorAll(".editorial-category:not(.is-selected)")].map((entry) => ({
            element: entry.querySelector(".editorial-category__index")!,
            red: entry.classList.contains("editorial-category--right"),
          })),
        ];
        return {
          documentWidth: document.documentElement.scrollWidth,
          detailFitsRow: detailBox.top >= rowBox.top - 1 && detailBox.bottom <= rowBox.bottom + 1,
          neighborPlateOverlap,
          neighborDetailOverlap,
          readableBackdrops: backdrops.every(({ element, red }) => textOnBackground(element, red)),
          titleFitsDetail: textBox.left >= detailBox.left - 1 && textBox.right <= detailBox.right + 1 &&
            textBox.top >= detailBox.top - 1 && textBox.bottom <= detailBox.bottom + 1,
          viewFitsRow: viewBox.top >= rowBox.top - 1 && viewBox.bottom <= rowBox.bottom + 1 &&
            viewBox.left >= rowBox.left - 1 && viewBox.right <= rowBox.right + 1,
          viewWidth: viewBox.width,
          viewHeight: viewBox.height,
          viewUsable: centerHits(view),
          neighborViewOverlap,
          overlap,
          plateWidth: plateBox.width,
          plateHeight: plateBox.height,
          plateUsable: centerHits(plate),
        };
      });
      const context = `${viewport.width} × ${viewport.height}: ${category.name}`;
      expect(geometry.documentWidth, context).toBe(viewport.width);
      expect(geometry.detailFitsRow, context).toBe(true);
      // A full-size plate may extend outside its row, but cannot overlap another
      // plate or obscure the selected category's details.
      expect(geometry.neighborPlateOverlap, context).toBeLessThanOrEqual(1);
      expect(geometry.neighborDetailOverlap, context).toBeLessThanOrEqual(1);
      expect(geometry.readableBackdrops, context).toBe(true);
      expect(geometry.titleFitsDetail, context).toBe(true);
      expect(geometry.viewFitsRow, context).toBe(true);
      expect(geometry.neighborViewOverlap, context).toBeLessThanOrEqual(1);
      expect(geometry.viewWidth, context).toBeGreaterThanOrEqual(44);
      expect(geometry.viewHeight, context).toBeGreaterThanOrEqual(44);
      expect(geometry.viewUsable, context).toBe(true);
      expect(geometry.overlap, context).toBeLessThanOrEqual(1);
      expect(geometry.plateWidth, context).toBeGreaterThanOrEqual(44);
      expect(geometry.plateHeight, context).toBeGreaterThanOrEqual(44);
      expect(geometry.plateUsable, context).toBe(true);
    }
  }
});
