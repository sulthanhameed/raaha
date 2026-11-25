import { expect, test, type Page, type Route } from "@playwright/test";

const user = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const jwt = [{ alg: "HS256", typ: "JWT" }, { sub: user, role: "authenticated", exp: 4102444800 }].map((part) => Buffer.from(JSON.stringify(part)).toString("base64url")).join(".") + ".test";

async function setup(page: Page, failScript = false) {
  const state = { signups: [] as any[], reservations: [] as any[], failAuth: false };
  const respond = (route: Route, value: unknown, status = 200) => route.fulfill({ status, contentType: "application/json", headers: {
    "access-control-allow-origin": "*", "access-control-allow-headers": "*", "access-control-allow-methods": "GET,POST,OPTIONS",
  }, body: status === 204 ? "" : JSON.stringify(value) });
  await page.route("**/google.com/maps**", (route) => route.abort());
  await page.route("https://challenges.cloudflare.com/turnstile/v0/api.js**", (route) => failScript ? route.abort() : route.fulfill({
    contentType: "text/javascript", body: `
      window.turnstile = {
        render(element, options) { window.__captchaOptions = options; element.innerHTML = '<div>Test verification widget</div>'; return 'test-widget'; },
        remove() {}, reset() { window.__captchaResets = (window.__captchaResets || 0) + 1; },
        getResponse() { return 'verified-token'; }, isExpired() { return false; }, ready(callback) { callback(); }
      };
      const callback = new URL(document.currentScript.src).searchParams.get('onload');
      setTimeout(() => window[callback]?.(), 0);
    `,
  }));
  await page.route("https://mock.raaha.test/**", async (route) => {
    const req = route.request();
    const path = new URL(req.url()).pathname;
    if (req.method() === "OPTIONS") return respond(route, null, 204);
    if (path === "/api/catalog") return respond(route, { categories: [{ id: "biryani", name: "Biryani", tagline: "Biryani", description: "Biryani", image_url: "/images/dishes/egg-biryani.webp" }], items: [] });
    if (path === "/api/supabase/auth/v1/signup") {
      state.signups.push(req.postDataJSON());
      if (state.failAuth) return respond(route, { msg: "Verification failed" }, 400);
      return respond(route, { access_token: jwt, token_type: "bearer", expires_in: 3600, expires_at: Math.floor(Date.now() / 1000) + 3600, refresh_token: "test", user: { id: user, aud: "authenticated", role: "authenticated", app_metadata: {}, user_metadata: {}, created_at: "2026-01-01T00:00:00Z" } });
    }
    if (path === "/api/reservations") {
      const body = req.postDataJSON(); state.reservations.push(body);
      return respond(route, [{ request_id: body.requestId, created_at: "2026-01-01T00:00:00Z" }]);
    }
    if (path === "/api/profile" || path === "/api/orders/latest") return respond(route, null);
    return respond(route, [], 200);
  });
  return state;
}

async function reviewForm(page: Page) {
  await page.goto("/#/reserve");
  await page.getByLabel("Your name").fill("Ravi");
  await page.getByLabel("Phone number").fill("9876543210");
  const min = (await page.getByLabel("Preferred date").getAttribute("min"))!;
  const date = new Date(`${min}T00:00:00Z`); date.setUTCDate(date.getUTCDate() + 7);
  await page.getByLabel("Preferred date").fill(date.toISOString().slice(0, 10));
  await page.getByLabel("Preferred time").fill("19:15");
  await page.getByRole("button", { name: "Review request" }).click();
}

async function solve(page: Page) {
  await expect.poll(() => page.evaluate(() => Boolean((window as any).__captchaOptions))).toBe(true);
  await page.evaluate(() => (window as any).__captchaOptions.callback("verified-token"));
}

test("requires a verified token for first guest signup and reuses the existing session", async ({ page }) => {
  const state = await setup(page);
  await reviewForm(page);
  const send = page.getByRole("button", { name: "Send table request" });
  await expect(page.getByText("Complete guest verification", { exact: false })).toBeVisible();
  await expect(send).toBeDisabled();
  await solve(page);
  await expect(send).toBeEnabled();
  await send.click();
  await expect(page.getByRole("heading", { name: "Your request is saved." })).toBeVisible();
  expect(state.signups).toHaveLength(1);
  expect(state.signups[0].gotrue_meta_security.captcha_token).toBe("verified-token");
  expect(state.reservations).toHaveLength(1);
  await page.getByRole("button", { name: "Make another request" }).click();
  const min = (await page.getByLabel("Preferred date").getAttribute("min"))!;
  const date = new Date(`${min}T00:00:00Z`); date.setUTCDate(date.getUTCDate() + 8);
  await page.getByLabel("Preferred date").fill(date.toISOString().slice(0, 10));
  await page.getByLabel("Preferred time").fill("19:15");
  await page.getByRole("button", { name: "Review request" }).click();
  await expect(page.getByText("Complete guest verification", { exact: false })).toHaveCount(0);
  await page.getByRole("button", { name: "Send table request" }).click();
  await expect(page.getByRole("heading", { name: "Your request is saved." })).toBeVisible();
  expect(state.signups).toHaveLength(1);
  expect(state.reservations).toHaveLength(2);
});

test("failed guest signup resets the challenge and does not send a reservation", async ({ page }) => {
  const state = await setup(page); state.failAuth = true;
  await reviewForm(page);
  await solve(page);
  await page.getByRole("button", { name: "Send table request" }).click();
  await expect(page.getByRole("alert")).toContainText("nothing was sent");
  await expect(page.getByRole("button", { name: "Send table request" })).toBeDisabled();
  expect(await page.evaluate(() => (window as any).__captchaResets)).toBeGreaterThanOrEqual(1);
  expect(state.reservations).toHaveLength(0);
});

test("a blocked verification script fails closed with a recovery message", async ({ page }) => {
  const state = await setup(page, true);
  await reviewForm(page);
  await expect(page.getByRole("alert")).toContainText("Verification could not load");
  await expect(page.getByRole("button", { name: "Reload page" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Send table request" })).toBeDisabled();
  expect(state.signups).toHaveLength(0);
});

test("an expired challenge disables submission until verification succeeds again", async ({ page }) => {
  const state = await setup(page);
  await reviewForm(page);
  const send = page.getByRole("button", { name: "Send table request" });
  await solve(page);
  await expect(send).toBeEnabled();
  await page.evaluate(() => (window as any).__captchaOptions["expired-callback"]());
  await expect(send).toBeDisabled();
  expect(state.signups).toHaveLength(0);
  await solve(page);
  await send.click();
  await expect(page.getByRole("heading", { name: "Your request is saved." })).toBeVisible();
  expect(state.reservations).toHaveLength(1);
});

test("a second widget reports a previously blocked verification script", async ({ page }) => {
  const state = await setup(page, true);
  await reviewForm(page);
  await expect(page.getByRole("alert")).toContainText("Verification could not load");
  // The first widget received the shared script error; the second needs its
  // own bounded wait because the browser won't fire that old error again.
  await page.clock.install();
  await page.getByRole("button", { name: "Your account" }).click();
  const account = page.getByRole("dialog", { name: "Your account" });
  await expect(account.getByText("Complete guest verification", { exact: false })).toBeVisible();
  await page.clock.fastForward(15_100);
  await expect(account.getByRole("alert")).toContainText("Verification could not load");
  await expect(account.getByRole("button", { name: "Reload page" })).toBeVisible();
  await expect(account.getByRole("button", { name: "Save profile" })).toBeDisabled();
  expect(state.signups).toHaveLength(0);
});
