import { expect, test, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

// Automated checks catch common regressions; they are not a complete manual
// accessibility audit and do not establish WCAG conformance.
async function expectNoAutomatedViolations(page: Page, state: string) {
  await page.evaluate(() => document.fonts.ready);
  const { violations } = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
    .analyze();
  const findings = violations.map((violation) => ({
    rule: violation.id,
    impact: violation.impact,
    targets: violation.nodes.map((node) => node.target),
  }));
  expect(findings, `Automated accessibility findings: ${state}`).toEqual([]);
}

test.beforeEach(async ({ page }) => {
  await page.route("**/google.com/maps**", (route) => route.abort());
  await page.route("**/tile.openstreetmap.org/**", (route) => route.abort());
});

test("main routes have no detected WCAG-tagged violations", async ({ page }) => {
  for (const route of ["home", "menu", "menu/biryani", "dishes/biryani", "food/egg-biryani", "reserve", "services", "about", "cart", "tracking"]) {
    await page.goto(`/#/${route}`);
    await expectNoAutomatedViolations(page, route);
  }
});

test("normal-motion and paused selection states have no detected WCAG-tagged violations", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/#/home");
  // Let entrance/reveal transitions settle so the scan checks the rendered
  // state, rather than an intermediate transparency frame.
  await page.waitForTimeout(1200);
  await expectNoAutomatedViolations(page, "animated home");
  await page.getByRole("button", { name: "Pause ambient motion" }).click();
  await page.waitForTimeout(1200);
  await expectNoAutomatedViolations(page, "ambient motion paused");
  await page.getByRole("button", { name: "Resume ambient motion" }).click();

  await page.goto("/#/menu");
  await page.locator(".editorial-category").first().getByRole("button", { name: /Select Starters/ }).click();
  await page.waitForTimeout(1200);
  await expectNoAutomatedViolations(page, "animated category selection");
  await page.goto("/#/dishes/biryani");
  const biryaniDishes = page.locator(".menu-dishes__list");
  await expect(biryaniDishes).toBeVisible();
  await page.waitForTimeout(1200);
  await expectNoAutomatedViolations(page, "revealed category dish list");
  await biryaniDishes.getByRole("button", { name: /Mutton Seeraga Samba Biryani/ }).click();
  await page.waitForTimeout(1200);
  await expectNoAutomatedViolations(page, "dish page reached from the menu dish list");
});

test("dialogs and unavailable request states have no detected WCAG-tagged violations", async ({ page }) => {
  await page.goto("/#/home");
  await page.getByRole("button", { name: "Search dishes" }).click();
  await page.getByRole("textbox", { name: "Search dishes" }).fill("biryani");
  await expectNoAutomatedViolations(page, "search results");
  await page.keyboard.press("Escape");

  await page.getByRole("button", { name: "Your account" }).click();
  await page.getByRole("button", { name: "Add a name" }).click();
  await expectNoAutomatedViolations(page, "local profile form");
  await page.getByLabel("Full name").fill("Ravi");
  await page.getByLabel("Mobile number").fill("9876543210");
  await expect(page.getByRole("button", { name: "Save profile" })).toBeDisabled();
  await page.keyboard.press("Escape");

  await page.goto("/#/food/egg-biryani");
  await page.getByRole("button", { name: "Add to Cart", exact: true }).click();
  await page.getByRole("button", { name: "Cart, 1 items" }).click();
  await expectNoAutomatedViolations(page, "filled cart");
  await page.getByRole("button", { name: "Proceed to Checkout" }).click();
  await expectNoAutomatedViolations(page, "checkout");
  await page.getByLabel("Delivery address").fill("Chinna Chokikulam, Madurai");
  await expect(page.getByRole("button", { name: /Send Order Request/ })).toBeDisabled();
  await page.keyboard.press("Escape");
  await page.goto("/#/tracking");
  await page.getByRole("button", { name: "Preview demo route" }).click();
  await expectNoAutomatedViolations(page, "active route preview");

  await page.goto("/#/reserve");
  await page.getByLabel("Your name").fill("Ravi");
  await page.getByLabel("Phone number").fill("9876543210");
  const minimum = (await page.getByLabel("Preferred date").getAttribute("min"))!;
  const nextWeek = new Date(`${minimum}T00:00:00Z`);
  nextWeek.setUTCDate(nextWeek.getUTCDate() + 7);
  await page.getByLabel("Preferred date").fill(nextWeek.toISOString().slice(0, 10));
  await page.getByLabel("Preferred time").fill("19:15");
  await page.getByRole("button", { name: "Review request" }).click();
  await expectNoAutomatedViolations(page, "table enquiry review");

  await page.goto("/#/food/egg-biryani");
  await page.getByRole("radio", { name: "4 stars" }).locator("..").click();
  await page.getByLabel("Your name").fill("Ravi");
  await page.getByLabel("Your review").fill("A note saved on this device.");
  await expect(page.getByRole("button", { name: "Submit review" })).toBeDisabled();
  await expectNoAutomatedViolations(page, "unavailable review submission");
});
