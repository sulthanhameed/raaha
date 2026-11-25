import { expect, test, type Page } from "@playwright/test";
import { INFO } from "../src/data/menu";

async function fillRequest(page: Page) {
  await page.getByLabel("Your name").fill("Anu & Ravi");
  await page.getByLabel("Phone number").fill("+91 98765 43210");
  await page.getByLabel("Party size").fill("6");
  await page.getByLabel("Occasion").selectOption("Birthday");
  const minimum = await page.getByLabel("Preferred date").getAttribute("min");
  const nextWeek = new Date(`${minimum}T00:00:00Z`);
  nextWeek.setUTCDate(nextWeek.getUTCDate() + 7);
  await page.getByLabel("Preferred date").fill(nextWeek.toISOString().slice(0, 10));
  await page.getByLabel("Preferred time").fill("19:15");
  await page.getByLabel("Message (optional)").fill("Window seat & a birthday cake? #family");
}

test("reservation is reachable from the header and by direct link", async ({ page }, testInfo) => {
  await page.goto("/#/menu");
  const reserve = testInfo.project.name === "mobile"
    ? page.getByRole("navigation", { name: "Mobile navigation" }).getByRole("button", { name: "Reserve" })
    : page.locator("header").getByRole("button", { name: "Book a Table" });
  await reserve.click();
  await expect(page).toHaveURL(/\/#\/reserve$/);
  await expect(page.getByRole("heading", { level: 1, name: "Reserve your table" })).toBeVisible();
  await expect(reserve).toHaveAttribute("aria-current", "page");
  await page.reload();
  await expect(page.getByRole("form", { name: "Table reservation form" })).toBeVisible();
});

test("the form validates required fields and a meaningful phone number", async ({ page }) => {
  await page.goto("/#/reserve");
  const form = page.getByRole("form", { name: "Table reservation form" });
  const submit = form.getByRole("button", { name: "Review request" });
  await submit.click();
  expect(await form.evaluate((element: HTMLFormElement) => element.checkValidity())).toBe(false);
  await expect(page.getByRole("button", { name: "Send table request" })).toHaveCount(0);

  await fillRequest(page);
  await page.getByLabel("Your name").fill("  ");
  await submit.click();
  await expect(page.getByRole("alert")).toHaveText("Please enter your name.");
  await expect(page.getByLabel("Your name")).toBeFocused();
  await page.getByLabel("Your name").fill("Anu");
  await page.getByLabel("Phone number").fill("123");
  await submit.click();
  await expect(page.getByRole("alert")).toContainText("7 to 15 digits");
  await expect(page.getByLabel("Phone number")).toHaveAttribute("aria-invalid", "true");

  await page.getByLabel("Phone number").fill("9876543210");
  const date = page.getByLabel("Preferred date");
  await date.fill("2000-01-01");
  expect(await date.evaluate((element: HTMLInputElement) => element.validity.rangeUnderflow)).toBe(true);
  const minimum = (await date.getAttribute("min"))!;
  const nextWeek = new Date(`${minimum}T00:00:00Z`);
  nextWeek.setUTCDate(nextWeek.getUTCDate() + 7);
  await date.fill(nextWeek.toISOString().slice(0, 10));
  await submit.click();
  await expect(page.getByRole("heading", { name: "Review your request" })).toBeVisible();
});

test("review stays unsent when Supabase is not configured and preserves editable details", async ({ page }) => {
  const posts: string[] = [];
  page.on("request", (request) => { if (request.method() === "POST") posts.push(request.url()); });
  await page.goto("/#/reserve");
  await fillRequest(page);
  const preferredDate = await page.getByLabel("Preferred date").inputValue();
  await page.getByRole("button", { name: "Review request" }).click();
  const heading = page.getByRole("heading", { name: "Review your request" });
  await expect(heading).toBeFocused();
  await expect(page.getByText("A request is not a confirmed booking.", { exact: false }).first()).toBeVisible();
  await expect(page.getByText("Your request has not been sent.", { exact: false })).toBeVisible();
  await expect(page.getByRole("button", { name: "Send table request" })).toBeDisabled();
  await expect(page.getByRole("heading", { name: "Your request is saved." })).toHaveCount(0);
  const details = page.locator("pre");
  await expect(details).toContainText("Name: Anu & Ravi");
  await expect(details).toContainText("Phone: +91 98765 43210");
  await expect(details).toContainText("Guests: 6");
  await expect(details).toContainText(`Preferred date: ${preferredDate}`);
  await expect(details).toContainText("Preferred time: 19:15");
  await expect(details).toContainText("Additional notes: Window seat & a birthday cake? #family");
  expect(posts).toEqual([]);

  await page.getByRole("button", { name: "Edit details" }).click();
  await expect(page.getByLabel("Your name")).toBeFocused();
  await expect(page.getByLabel("Your name")).toHaveValue("Anu & Ravi");
  await expect(page.getByLabel("Preferred time")).toHaveValue("19:15");
  await page.getByLabel("Party size").fill("14");
  await page.getByRole("button", { name: "Review request" }).click();
  await expect(page.locator("pre")).toContainText("Guests: 14");
  expect(posts).toEqual([]);
});

test("reservation details can be copied, with a selectable fallback when clipboard access fails", async ({ page }) => {
  await page.goto("/#/reserve");
  await fillRequest(page);
  await page.getByRole("button", { name: "Review request" }).click();
  await page.evaluate(() => {
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText: async (text: string) => { (window as Window & { copiedText?: string }).copiedText = text; } },
    });
  });
  await page.getByRole("button", { name: "Copy details" }).click();
  await expect(page.locator('p[role="status"]').last()).toContainText("Details copied");
  expect(await page.evaluate(() => (window as Window & { copiedText?: string }).copiedText)).toContain("Name: Anu & Ravi");

  await page.evaluate(() => {
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText: async () => { throw new Error("Clipboard unavailable"); } },
    });
  });
  await page.getByRole("button", { name: "Copy details" }).click();
  await expect(page.locator('p[role="status"]').last()).toContainText("Please select and copy the details above");
  await expect(page.locator("pre")).toContainText("Name: Anu & Ravi");
});

test("long request details wrap without overflowing a small phone", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "mobile", "The mobile project covers the narrow layout.");
  await page.goto("/#/reserve");
  await fillRequest(page);
  await page.getByLabel("Your name").fill("A".repeat(100));
  await page.getByLabel("Message (optional)").fill("request".repeat(70));
  await page.getByRole("button", { name: "Review request" }).click();
  const geometry = await page.locator("pre").evaluate((element) => ({
    documentWidth: document.documentElement.scrollWidth,
    width: element.clientWidth,
    scrollWidth: element.scrollWidth,
  }));
  expect(geometry.documentWidth).toBe(320);
  expect(geometry.scrollWidth).toBeLessThanOrEqual(geometry.width);
  await expect(page.getByRole("button", { name: "Send table request" })).toBeDisabled();
});

test("unconfirmed phone and hours are not presented as real restaurant details", async ({ page }) => {
  await page.goto("/#/reserve");
  if (!INFO.phoneConfirmed) {
    await expect(page.locator('a[href^="tel:"]')).toHaveCount(0);
    await expect(page.locator('a[href^="https://wa.me/"]')).toHaveCount(0);
    await expect(page.locator("body")).not.toContainText(INFO.phoneDisplay);
  }
  if (!INFO.hoursConfirmed) {
    await expect(page.locator("body")).not.toContainText(INFO.hoursLabel);
    await expect(page.getByText("Opening hours to be confirmed", { exact: true }).first()).toBeVisible();
  }
});

test("reservation navigation and form remain usable across viewport sizes", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "This test covers its own range of viewport sizes.");
  for (const width of [320, 360, 390, 639, 767, 768, 900, 1024, 1279, 1280, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/#/menu");
    const button = width < 768
      ? page.getByRole("navigation", { name: "Mobile navigation" }).getByRole("button", { name: "Reserve" })
      : width < 1280
        ? page.getByRole("navigation", { name: "Primary navigation" }).getByRole("button", { name: "Reserve" })
        : page.locator("header").getByRole("button", { name: "Book a Table" });
    await expect(button, `${width}px header link`).toBeVisible();
    const box = (await button.boundingBox())!;
    expect(box.x, `${width}px header left`).toBeGreaterThanOrEqual(0);
    expect(box.x + box.width, `${width}px header right`).toBeLessThanOrEqual(width);
    expect(box.width, `${width}px header target width`).toBeGreaterThanOrEqual(44);
    expect(box.height, `${width}px header target height`).toBeGreaterThanOrEqual(44);
    await button.click();
    await expect(page).toHaveURL(/\/#\/reserve$/);
    const form = page.getByRole("form", { name: "Table reservation form" });
    await expect(form).toBeVisible();
    const layout = await form.evaluate((element) => ({
      documentWidth: document.documentElement.scrollWidth,
      controls: [...element.querySelectorAll<HTMLElement>("input, select, textarea, button")].map((control) => {
        const rect = control.getBoundingClientRect();
        return { left: rect.left, right: rect.right, height: rect.height };
      }),
    }));
    expect(layout.documentWidth, `${width}px document width`).toBe(width);
    for (const control of layout.controls) {
      expect(control.left, `${width}px control left`).toBeGreaterThanOrEqual(0);
      expect(control.right, `${width}px control right`).toBeLessThanOrEqual(width);
      expect(control.height, `${width}px control height`).toBeGreaterThanOrEqual(44);
    }
  }
});

test.describe("restaurant timezone date constraints", () => {
  test.use({ timezoneId: "Pacific/Kiritimati" });
  test("the minimum reservation date follows Madurai’s calendar day", async ({ page }) => {
    await page.clock.install({ time: new Date("2031-04-15T12:30:00Z") });
    await page.goto("/#/reserve");
    await expect(page.getByLabel("Preferred date")).toHaveAttribute("min", "2031-04-15");
  });
});
