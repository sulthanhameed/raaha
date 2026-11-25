import { expect, test, type Page, type Route } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { CATEGORIES, MENU } from "../src/data/menu";

type Json = Record<string, any>;
const USER_ID = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const now = "2026-11-14T10:00:00.000Z";
const jwt = [
  { alg: "HS256", typ: "JWT" },
  { sub: USER_ID, role: "authenticated", exp: 4102444800 },
].map((part) => Buffer.from(JSON.stringify(part)).toString("base64url")).join(".") + ".test";

async function installSupabaseMock(page: Page) {
  const categories = CATEGORIES.map((c, i) => ({ id: c.id, name: c.name, tagline: c.tagline, description: c.description, image_url: c.image, position: i }));
  const menu = MENU.map((m, i) => ({
    id: m.id, category_id: m.category, name: m.name, description: m.description,
    price_inr: m.id === "egg-biryani" ? 211 : m.price, vegetarian: m.veg, ingredients: m.ingredients,
    image_url: m.image, sample_rating: m.rating, sample_rating_count: m.ratingsCount,
    prep_time: m.time, serves: m.serves, spice: m.spice, calories: m.calories, tag: m.tag ?? null,
    position: i, is_available: true,
  }));
  const state = {
    categories, menu,
    orders: new Map<string, Json>(), reservations: new Map<string, Json>(), reviews: new Map<string, Json>(),
    profile: null as Json | null,
    orderCalls: [] as Json[], reservationCalls: [] as Json[], reviewCalls: [] as Json[],
    signupCalls: 0, emailSignups: [] as Json[], signinCalls: [] as Json[],
    paymentCreates: [] as Json[], paymentVerifies: [] as Json[], paymentStatus: "pending" as "pending" | "paid",
    paymentsAvailable: true, notificationsAvailable: true,
    failCatalog: false, failSignup: false, failProfileLoad: false, corruptProfileLoad: false,
    failOrderLoad: false, corruptOrderLoad: false, dropOrderOnce: false, malformedOrderOnce: false,
    dropReservationOnce: false, dropReviewOnce: false,
  };
  const respond = async (route: Route, body: unknown, status = 200) => route.fulfill({
    status, contentType: "application/json",
    headers: { "access-control-allow-origin": "*", "access-control-allow-headers": "*", "access-control-allow-methods": "GET,POST,PUT,DELETE,OPTIONS" },
    body: status === 204 ? "" : JSON.stringify(body),
  });
  const session = (anonymous: boolean, email = "anu@example.test") => ({
    access_token: jwt, token_type: "bearer", expires_in: 3600, expires_at: Math.floor(Date.now() / 1000) + 3600,
    refresh_token: "test-refresh-token", user: {
      id: USER_ID, aud: "authenticated", role: "authenticated", is_anonymous: anonymous,
      ...(anonymous ? {} : { email, email_confirmed_at: now }), app_metadata: {}, user_metadata: {}, created_at: now,
    },
  });
  await page.route("**/google.com/maps**", (route) => route.abort());
  await page.route("**/tile.openstreetmap.org/**", (route) => route.abort());
  await page.route("https://checkout.razorpay.com/v1/checkout.js", (route) => route.fulfill({ contentType: "text/javascript", body: `
    window.Razorpay = class {
      constructor(options) { window.__razorpayOptions = options; }
      on(event, callback) { window.__razorpayFailed = callback; }
      open() { window.__razorpayOpened = true; }
      close() {}
    };
  ` }));
  await page.route("https://mock.raaha.test/**", async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const method = request.method();
    if (method === "OPTIONS") return respond(route, null, 204);
    if (url.pathname === "/api/supabase/auth/v1/signup") {
      const body = request.postDataJSON();
      if (body.email) {
        state.emailSignups.push(body);
        return respond(route, { id: USER_ID, email: body.email, aud: "authenticated", role: "authenticated", app_metadata: {}, user_metadata: {}, created_at: now, identities: [] });
      }
      state.signupCalls++;
      if (state.failSignup) return respond(route, { code: "unexpected_failure", msg: "Auth unavailable" }, 400);
      return respond(route, session(true));
    }
    if (url.pathname === "/api/supabase/auth/v1/token") {
      if (url.searchParams.get("grant_type") === "password") {
        const body = request.postDataJSON(); state.signinCalls.push(body);
        return respond(route, session(false, body.email));
      }
      return respond(route, { code: "unexpected_failure", msg: "Unexpected refresh" }, 400);
    }
    if (url.pathname === "/api/supabase/auth/v1/logout") return respond(route, null, 204);
    if (url.pathname === "/api/config") return respond(route, { database: true, payments: state.paymentsAvailable, notifications: state.notificationsAvailable });
    if (url.pathname === "/api/catalog") return state.failCatalog ? respond(route, { error: "SERVICE_UNAVAILABLE" }, 503) : respond(route, { categories: state.categories, items: state.menu.filter((m) => m.is_available) });
    if (url.pathname === "/api/profile") {
      if (method === "GET") return state.failProfileLoad ? respond(route, { error: "SERVICE_UNAVAILABLE" }, 503) : respond(route, state.corruptProfileLoad ? { name: null, phone: "9876543210" } : state.profile);
      if (method === "PUT") { state.profile = { ...request.postDataJSON(), user_id: USER_ID }; return respond(route, { saved: true }); }
      if (method === "DELETE") { state.profile = null; return respond(route, { deleted: true }); }
    }
    if (url.pathname === "/api/orders/latest") {
      if (state.failOrderLoad) return respond(route, { error: "SERVICE_UNAVAILABLE" }, 503);
      const latest = [...state.orders.values()].at(-1);
      if (!latest) return respond(route, null);
      return respond(route, { id: latest.request_id, created_at: latest.created_at, customer_name: latest.customer_name,
        delivery_address: latest.delivery_address, subtotal_inr: state.corruptOrderLoad ? 1 : latest.subtotal_inr, status: latest.status,
        payment_method: latest.payment_method, payment_status: latest.payment_status,
        order_request_items: latest.items.map((item: Json, i: number) => ({ item_id: item.id, item_name: item.name, quantity: item.qty, unit_price_inr: item.price, position: i + 1 })) });
    }
    if (url.pathname === "/api/orders") {
      const input = request.postDataJSON();
      const body = { p_request_id: input.requestId, p_customer_name: input.name, p_phone: input.phone, p_delivery_address: input.address, p_items: input.items, p_payment_method: input.paymentMethod };
      state.orderCalls.push(body);
      const existing = state.orders.get(body.p_request_id);
      if (existing) return respond(route, [existing]);
      const lines = body.p_items.map((line: Json) => {
        const dish = state.menu.find((m) => m.id === line.id && m.is_available);
        return dish && dish.price_inr === line.expected_price ? { id: dish.id, name: dish.name, qty: line.qty, price: dish.price_inr } : null;
      });
      if (lines.some((line: Json | null) => !line)) return respond(route, { error: "MENU_CHANGED" }, 409);
      const receipt = { request_id: body.p_request_id, created_at: now, subtotal_inr: lines.reduce((sum: number, item: Json) => sum + item.qty * item.price, 0), status: "pending", items: lines, customer_name: body.p_customer_name, delivery_address: body.p_delivery_address, payment_method: body.p_payment_method, payment_status: "unpaid" };
      state.orders.set(body.p_request_id, receipt);
      if (state.dropOrderOnce) { state.dropOrderOnce = false; return route.abort("failed"); }
      if (state.malformedOrderOnce) { state.malformedOrderOnce = false; return respond(route, []); }
      return respond(route, [receipt]);
    }
    if (url.pathname === "/api/reservations") {
      const input = request.postDataJSON();
      const body = { p_request_id: input.requestId, p_customer_name: input.name, p_phone: input.phone, p_guest_count: input.guests, p_preferred_date: input.date, p_preferred_time: input.time, p_occasion: input.occasion, p_message: input.message };
      state.reservationCalls.push(body);
      const receipt = state.reservations.get(body.p_request_id) ?? { request_id: body.p_request_id, created_at: now, status: "pending", ...body };
      state.reservations.set(body.p_request_id, receipt);
      if (state.dropReservationOnce) { state.dropReservationOnce = false; return route.abort("failed"); }
      return respond(route, [receipt]);
    }
    if (url.pathname.startsWith("/api/reviews/") && method === "GET") {
      const id = decodeURIComponent(url.pathname.slice("/api/reviews/".length));
      return respond(route, [...state.reviews.values()].filter((review) => review.item_id === id));
    }
    if (url.pathname === "/api/reviews" && method === "POST") {
      const input = request.postDataJSON();
      const body = { p_request_id: input.requestId, p_item_id: input.itemId, p_author_name: input.name, p_review_text: input.text, p_rating: input.rating };
      state.reviewCalls.push(body);
      state.reviews.set(body.p_request_id, { id: body.p_request_id, item_id: body.p_item_id, author_name: body.p_author_name,
        review_text: body.p_review_text, rating: body.p_rating, status: "pending", created_at: now, is_mine: true });
      if (state.dropReviewOnce) { state.dropReviewOnce = false; return route.abort("failed"); }
      return respond(route, [{ review_id: body.p_request_id, created_at: now }]);
    }
    if (url.pathname.startsWith("/api/reviews/") && method === "DELETE") {
      const id = decodeURIComponent(url.pathname.slice("/api/reviews/".length));
      const review = state.reviews.get(id);
      if (!review?.is_mine) return respond(route, false);
      state.reviews.delete(id); return respond(route, true);
    }
    if (url.pathname === "/api/payments/reconcile") return respond(route, { status: state.paymentStatus });
    if (url.pathname === "/api/payments/create") {
      const body = request.postDataJSON(); state.paymentCreates.push(body);
      const order = state.orders.get(body.orderId);
      return respond(route, { key: "rzp_test_ABC123", gateway_order_id: "order_ABC123", amount: order.subtotal_inr * 100, currency: "INR" });
    }
    if (url.pathname === "/api/payments/verify") {
      const body = request.postDataJSON(); state.paymentVerifies.push(body);
      const order = state.orders.get(body.orderId);
      if (state.paymentStatus === "paid") order.payment_status = "paid";
      return respond(route, { status: state.paymentStatus });
    }
    return respond(route, { error: `UNEXPECTED_${method}_${url.pathname}` }, 404);
  });
  return state;
}

async function useVerifiedAccount(page: Page) {
  await page.addInitScript(({ userId, jwtValue, created }) => {
    const session = { access_token: jwtValue, token_type: "bearer", expires_in: 3600, expires_at: Math.floor(Date.now() / 1000) + 3600,
      refresh_token: "test-refresh-token", user: { id: userId, aud: "authenticated", role: "authenticated", is_anonymous: false,
        email: "anu@example.test", email_confirmed_at: created, app_metadata: {}, user_metadata: {}, created_at: created } };
    if (!localStorage.getItem("raaha-auth-v1")) localStorage.setItem("raaha-auth-v1", JSON.stringify(session));
  }, { userId: USER_ID, jwtValue: jwt, created: now });
}

async function openCheckout(page: Page) {
  await useVerifiedAccount(page);
  await page.goto("/#/food/egg-biryani");
  // The seeded fallback is ₹179; ₹211 proves the fetched catalogue is used.
  await expect(page.locator("main")).toContainText("₹211");
  await page.getByRole("button", { name: "Add to Cart", exact: true }).click();
  await page.getByRole("button", { name: "Cart, 1 items" }).click();
  await page.getByRole("button", { name: "Proceed to Checkout" }).click();
  const dialog = page.getByRole("dialog", { name: "Checkout" });
  await dialog.getByLabel("Your name").fill("Anu");
  await dialog.getByLabel("Mobile number").fill("9876543210");
  await dialog.getByLabel("Delivery address").fill("Chinna Chokikulam, Madurai");
  return dialog;
}

async function fillReservation(page: Page) {
  await page.goto("/#/reserve");
  await page.getByLabel("Your name").fill("Anu & Ravi");
  await page.getByLabel("Phone number").fill("+91 98765 43210");
  await page.getByLabel("Party size").fill("14");
  await page.getByLabel("Occasion").selectOption("Birthday");
  const min = (await page.getByLabel("Preferred date").getAttribute("min"))!;
  const date = new Date(`${min}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + 7);
  await page.getByLabel("Preferred date").fill(date.toISOString().slice(0, 10));
  await page.getByLabel("Preferred time").fill("19:15");
  await page.getByLabel("Message (optional)").fill("Window seat & cake");
  await page.getByRole("button", { name: "Review request" }).click();
}

test("pay-later order uses server prices, survives reload and remains pending review", async ({ page }) => {
  const backend = await installSupabaseMock(page);
  const dialog = await openCheckout(page);
  await expect(dialog.getByText("Every request is subject to restaurant review", { exact: false })).toBeVisible();
  await dialog.getByRole("button", { name: /Send Order Request/ }).click();
  await expect(dialog.getByRole("heading", { name: "Your request is saved." })).toBeFocused();
  await expect(dialog.getByText("not an accepted order", { exact: false })).toBeVisible();
  expect(backend.signupCalls).toBe(0);
  expect(backend.orderCalls[0].p_payment_method).toBe("pay_later");
  expect(backend.orders.size).toBe(1);
  expect(backend.orderCalls[0].p_items).toEqual([{ id: "egg-biryani", qty: 1, expected_price: 211 }]);
  expect(backend.orderCalls[0].p_phone).toBe("9876543210");
  expect(backend.orderCalls[0].p_delivery_address).toBe("Chinna Chokikulam, Madurai");
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem("raaha-cart") || "[]"))).toEqual([]);
  expect(await page.evaluate(() => localStorage.getItem("raaha-active-order"))).toBeNull();
  const findings = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"]).analyze();
  expect(findings.violations.map((violation) => violation.id)).toEqual([]);
  await dialog.getByRole("button", { name: "View Request & Route Preview" }).click();
  await expect(page.getByText("Pending restaurant review")).toBeVisible();
  await expect(page.getByText("These milestones and the courier marker are a simulation", { exact: false })).toBeVisible();
  await page.reload();
  await expect(page.getByText("Pending restaurant review")).toBeVisible();
  await expect(page.getByText("Egg Biryani", { exact: false }).last()).toBeVisible();
  await page.getByRole("button", { name: "Hide request on this device" }).click();
  await page.reload();
  await expect(page.getByText("No saved order yet")).toBeVisible();
  expect(backend.orders.size).toBe(1); // Hiding is not cancellation or deletion.
});

test("lost order acknowledgement retains the cart and retries the same idempotency reference", async ({ page }) => {
  const backend = await installSupabaseMock(page);
  backend.dropOrderOnce = true;
  const dialog = await openCheckout(page);
  await dialog.getByRole("button", { name: /Send Order Request/ }).click();
  await expect(dialog.getByRole("alert")).toContainText("couldn’t confirm whether it was sent");
  await expect(dialog.getByRole("heading", { name: "Your request is saved." })).toHaveCount(0);
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem("raaha-cart") || "[]"))).toEqual([{ id: "egg-biryani", qty: 1 }]);
  await dialog.getByRole("button", { name: /Send Order Request/ }).click();
  await expect(dialog.getByRole("heading", { name: "Your request is saved." })).toBeVisible();
  expect(backend.orderCalls).toHaveLength(2);
  expect(backend.orderCalls[0].p_request_id).toBe(backend.orderCalls[1].p_request_id);
  expect(backend.orders.size).toBe(1);
});

test("a malformed success response is not treated as a saved order", async ({ page }) => {
  const backend = await installSupabaseMock(page);
  backend.malformedOrderOnce = true;
  const dialog = await openCheckout(page);
  await dialog.getByRole("button", { name: /Send Order Request/ }).click();
  await expect(dialog.getByRole("alert")).toContainText("couldn’t confirm");
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem("raaha-cart") || "[]"))).toEqual([{ id: "egg-biryani", qty: 1 }]);
  await dialog.getByRole("button", { name: /Send Order Request/ }).click();
  await expect(dialog.getByRole("heading", { name: "Your request is saved." })).toBeVisible();
  expect(backend.orderCalls[0].p_request_id).toBe(backend.orderCalls[1].p_request_id);
  expect(backend.orders.size).toBe(1);
});

test("changed prices are rejected without clearing the cart and can be refreshed", async ({ page }) => {
  const backend = await installSupabaseMock(page);
  const dialog = await openCheckout(page);
  backend.menu.find((item) => item.id === "egg-biryani")!.price_inr = 239;
  await dialog.getByRole("button", { name: /Send Order Request/ }).click();
  await expect(dialog.getByRole("alert")).toContainText("menu price or availability changed");
  expect(backend.orders.size).toBe(0);
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem("raaha-cart") || "[]"))).toEqual([{ id: "egg-biryani", qty: 1 }]);
  await dialog.getByRole("button", { name: "Refresh menu" }).click();
  await expect(dialog.getByRole("button", { name: /Send Order Request.*₹239/ })).toBeEnabled();
  await dialog.getByRole("button", { name: /Send Order Request/ }).click();
  await expect(dialog.getByRole("heading", { name: "Your request is saved." })).toBeVisible();
  expect([...backend.orders.values()][0].subtotal_inr).toBe(239);
});

test("reservation is saved for review, not confirmed; a lost acknowledgement retries safely", async ({ page }) => {
  const backend = await installSupabaseMock(page);
  backend.dropReservationOnce = true;
  await fillReservation(page);
  await expect(page.getByRole("heading", { name: "Review your request" })).toBeFocused();
  await page.getByRole("button", { name: "Send table request" }).click();
  await expect(page.getByRole("alert")).toContainText("couldn’t confirm whether it was sent");
  await expect(page.getByRole("heading", { name: "Your request is saved." })).toHaveCount(0);
  await page.getByRole("button", { name: "Send table request" }).click();
  await expect(page.getByRole("heading", { name: "Your request is saved." })).toBeFocused();
  await expect(page.getByText("This is not a confirmed booking", { exact: false })).toBeVisible();
  expect(backend.reservations.size).toBe(1);
  expect(backend.reservationCalls[0].p_request_id).toBe(backend.reservationCalls[1].p_request_id);
  expect(backend.reservationCalls[0]).toMatchObject({ p_customer_name: "Anu & Ravi", p_phone: "+91 98765 43210", p_guest_count: 14, p_preferred_time: "19:15", p_occasion: "Birthday", p_message: "Window seat & cake" });
  const findings = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"]).analyze();
  expect(findings.violations.map((violation) => violation.id)).toEqual([]);
});

test("guest-auth failure sends no request and reports failure", async ({ page }) => {
  const backend = await installSupabaseMock(page);
  backend.failSignup = true;
  await fillReservation(page);
  await page.getByRole("button", { name: "Send table request" }).click();
  await expect(page.getByRole("alert")).toContainText("nothing was sent");
  await expect(page.getByRole("heading", { name: "Your request is saved." })).toHaveCount(0);
  expect(backend.reservations.size).toBe(0);
  expect(backend.reservationCalls).toHaveLength(0);
});

test("reviews are submitted for moderation and only the owner can remove their review", async ({ page }) => {
  const backend = await installSupabaseMock(page);
  backend.reviews.set("published", { id: "published", item_id: "egg-biryani", author_name: "Guest", review_text: "Already approved", rating: 5, status: "published", created_at: now, is_mine: false });
  await page.goto("/#/food/egg-biryani");
  const section = page.locator("#dish-reviews");
  await expect(section.getByText("Already approved")).toBeVisible();
  await expect(section.getByRole("button", { name: "Remove review by Guest" })).toHaveCount(0);
  await section.getByRole("radio", { name: "4 stars" }).locator("..").click();
  await section.getByLabel("Your name").fill("Ravi");
  await section.getByLabel("Your review").fill("A freshly submitted note.");
  await section.getByRole("button", { name: "Submit review" }).click();
  await expect(section.getByRole("status")).toContainText("awaiting restaurant review");
  await expect(section.getByText("Awaiting moderation · visible only to you", { exact: false })).toBeVisible();
  expect(backend.reviewCalls[0]).toMatchObject({ p_item_id: "egg-biryani", p_author_name: "Ravi", p_review_text: "A freshly submitted note.", p_rating: 4 });
  await section.getByRole("button", { name: "Remove review by Ravi" }).click();
  await expect(section.getByText("A freshly submitted note.")).toHaveCount(0);
  expect(backend.reviews.size).toBe(1);
});

test("guest profile moves legacy details only on explicit save and clears online", async ({ page }) => {
  const backend = await installSupabaseMock(page);
  await page.addInitScript(() => { if (!localStorage.getItem("legacy-added")) { localStorage.setItem("raaha-user", JSON.stringify({ name: "Anu", phone: "9876543210" })); localStorage.setItem("legacy-added", "1"); } });
  await page.goto("/#/home");
  await page.getByRole("button", { name: "Your account" }).click();
  const dialog = page.getByRole("dialog", { name: "Your account" });
  await expect(dialog.getByText("These details were saved locally", { exact: false })).toBeVisible();
  expect(backend.profile).toBeNull();
  await dialog.getByRole("button", { name: "Save profile" }).click();
  await expect(dialog).toHaveCount(0);
  expect(backend.profile).toMatchObject({ user_id: USER_ID, name: "Anu", phone: "9876543210" });
  expect(await page.evaluate(() => localStorage.getItem("raaha-user"))).toBeNull();
  await page.reload();
  await expect(page.getByRole("button", { name: "Account of Anu" })).toBeVisible();
  await page.getByRole("button", { name: "Account of Anu" }).click();
  await page.getByRole("button", { name: "Clear profile" }).click();
  await expect(page.getByRole("heading", { name: "Your guest profile" })).toBeVisible();
  expect(backend.profile).toBeNull();
});

test("catalogue outage falls back to sample data but cannot send an order", async ({ page }) => {
  const backend = await installSupabaseMock(page);
  await useVerifiedAccount(page);
  backend.failCatalog = true;
  await page.goto("/#/food/egg-biryani");
  await expect(page.getByText("Sample menu shown. Online ordering is unavailable.")).toBeVisible();
  await page.getByRole("button", { name: "Add to Cart", exact: true }).click();
  await page.getByRole("button", { name: "Cart, 1 items" }).click();
  await page.getByRole("button", { name: "Proceed to Checkout" }).click();
  const dialog = page.getByRole("dialog", { name: "Checkout" });
  await expect(dialog.getByRole("button", { name: /Send Order Request/ })).toBeDisabled();
  expect(backend.orders.size).toBe(0);
  await expect(dialog.getByRole("button", { name: "Retry menu" })).toBeVisible();
  backend.failCatalog = false;
  await dialog.getByRole("button", { name: "Retry menu" }).click();
  await expect(dialog.getByRole("button", { name: /Send Order Request.*₹211/ })).toBeEnabled();
});

test("a changed order cannot silently replace an unresolved submission", async ({ page }) => {
  const backend = await installSupabaseMock(page);
  backend.dropOrderOnce = true;
  const dialog = await openCheckout(page);
  await dialog.getByRole("button", { name: /Send Order Request/ }).click();
  await expect(dialog.getByRole("alert")).toContainText("couldn’t confirm");
  // The retry marker stores only a fingerprint and random reference, not contact details.
  const marker = await page.evaluate(() => sessionStorage.getItem("raaha-attempt:order") || "");
  expect(marker).not.toContain("9876543210");
  expect(marker).not.toContain("Chinna Chokikulam");
  await dialog.getByLabel("Delivery address").fill("East Street, Madurai");
  await dialog.getByRole("button", { name: /Send Order Request/ }).click();
  await expect(dialog.getByRole("alert")).toContainText("previous attempt may have been saved");
  expect(backend.orderCalls).toHaveLength(1);
  page.once("dialog", (confirmation) => confirmation.dismiss());
  await dialog.getByRole("button", { name: "Start a new request" }).click();
  await expect(dialog.getByRole("button", { name: "Start a new request" })).toBeVisible();
  await dialog.getByLabel("Delivery address").fill("Chinna Chokikulam, Madurai");
  await dialog.getByRole("button", { name: /Send Order Request/ }).click();
  await expect(dialog.getByRole("heading", { name: "Your request is saved." })).toBeVisible();
  expect(backend.orderCalls).toHaveLength(2);
  expect(backend.orderCalls[0].p_request_id).toBe(backend.orderCalls[1].p_request_id);
  expect(backend.orders.size).toBe(1);
  expect(await page.evaluate(() => sessionStorage.getItem("raaha-attempt:order"))).toBeNull();
});

test("starting a different reservation after an uncertain attempt requires an explicit duplicate warning", async ({ page }) => {
  const backend = await installSupabaseMock(page);
  backend.dropReservationOnce = true;
  await fillReservation(page);
  await page.getByRole("button", { name: "Send table request" }).click();
  await expect(page.getByRole("alert")).toContainText("couldn’t confirm");
  await page.getByRole("button", { name: "Edit details" }).click();
  await page.getByLabel("Party size").fill("15");
  await page.getByRole("button", { name: "Review request" }).click();
  await page.getByRole("button", { name: "Send table request" }).click();
  await expect(page.getByRole("alert")).toContainText("previous attempt may have been saved");
  expect(backend.reservationCalls).toHaveLength(1);
  let warning = "";
  page.once("dialog", async (confirmation) => { warning = confirmation.message(); await confirmation.accept(); });
  await page.getByRole("button", { name: "Start a new request" }).click();
  expect(warning).toContain("duplicate");
  await page.getByRole("button", { name: "Send table request" }).click();
  await expect(page.getByRole("heading", { name: "Your request is saved." })).toBeVisible();
  expect(backend.reservationCalls).toHaveLength(2);
  expect(backend.reservationCalls[0].p_request_id).not.toBe(backend.reservationCalls[1].p_request_id);
  expect(backend.reservations.size).toBe(2); // The warning is real: the first request was saved too.
});

test("an uncertain review retry blocks changes until the original details are restored", async ({ page }) => {
  const backend = await installSupabaseMock(page);
  backend.dropReviewOnce = true;
  await page.goto("/#/food/egg-biryani");
  const section = page.locator("#dish-reviews");
  await section.getByRole("radio", { name: "5 stars" }).locator("..").click();
  await section.getByLabel("Your name").fill("Ravi");
  await section.getByLabel("Your review").fill("Lovely dish");
  await section.getByRole("button", { name: "Submit review" }).click();
  await expect(section.getByRole("status")).toContainText("couldn’t confirm");
  await section.getByLabel("Your review").fill("Edited review");
  await section.getByRole("button", { name: "Submit review" }).click();
  await expect(section.getByRole("status")).toContainText("previous attempt may have been saved");
  expect(backend.reviewCalls).toHaveLength(1);
  await section.getByLabel("Your review").fill("Lovely dish");
  await section.getByRole("button", { name: "Submit review" }).click();
  await expect(section.getByRole("status")).toContainText("awaiting restaurant review");
  expect(backend.reviewCalls).toHaveLength(2);
  expect(backend.reviewCalls[0].p_request_id).toBe(backend.reviewCalls[1].p_request_id);
  expect(backend.reviews.size).toBe(1);
});

test("profile and saved request load failures are recoverable and do not imply deletion", async ({ page }) => {
  const backend = await installSupabaseMock(page);
  const checkout = await openCheckout(page);
  await checkout.getByRole("button", { name: /Send Order Request/ }).click();
  await expect(checkout.getByRole("heading", { name: "Your request is saved." })).toBeVisible();
  await checkout.getByRole("button", { name: "Browse Menu" }).click();
  await page.getByRole("button", { name: "Your account" }).click();
  const account = page.getByRole("dialog", { name: "Your account" });
  await account.getByLabel("Full name").fill("Anu");
  await account.getByLabel("Mobile number").fill("9876543210");
  await account.getByRole("button", { name: "Save profile" }).click();
  await expect(account).toHaveCount(0);
  backend.failProfileLoad = true;
  backend.failOrderLoad = true;
  await page.goto("/#/tracking");
  await page.reload();
  await expect(page.getByText("Request details unavailable")).toBeVisible();
  await expect(page.getByText("This does not mean it was cancelled", { exact: false })).toBeVisible();
  await page.getByRole("button", { name: "Your account" }).click();
  await expect(account.getByRole("alert")).toContainText("could not be loaded");
  backend.failProfileLoad = false;
  backend.corruptProfileLoad = true;
  await account.getByRole("button", { name: "Retry profile" }).click();
  await expect(account.getByRole("alert")).toContainText("could not be loaded");
  backend.corruptProfileLoad = false;
  await account.getByRole("button", { name: "Retry profile" }).click();
  await expect(account.getByRole("heading", { name: "Anu" })).toBeVisible();
  await account.getByRole("button", { name: "Close", exact: true }).click();
  backend.failOrderLoad = false;
  // An incomplete/corrupt server response must also be displayed as a load error.
  backend.corruptOrderLoad = true;
  await page.getByRole("button", { name: "Retry loading request" }).click();
  await expect(page.getByText("Request details unavailable")).toBeVisible();
  backend.corruptOrderLoad = false;
  await page.getByRole("button", { name: "Retry loading request" }).click();
  await expect(page.getByText("Pending restaurant review")).toBeVisible();
  expect(backend.orders.size).toBe(1);
  expect(backend.profile?.name).toBe("Anu");
});

test("new online categories and dishes remain browsable on the menu dish card", async ({ page }) => {
  const backend = await installSupabaseMock(page);
  backend.categories.push({ id: "seasonal", name: "Seasonal", tagline: "Fresh today", description: "Seasonal dishes", image_url: "/images/dishes/egg-biryani.webp", position: 9 });
  backend.menu.push({ ...backend.menu[0], id: "seasonal-plate", category_id: "seasonal", name: "Seasonal Plate", price_inr: 299, position: 99 });
  await page.goto("/#/menu");
  const menu = page.getByRole("region", { name: "The Raaha menu." });
  await menu.getByRole("button", { name: "Select Seasonal, 1 dishes" }).click();
  await menu.getByRole("button", { name: "View Menu" }).click();
  await expect(page).toHaveURL(/\/#\/dishes\/seasonal$/);
  const dishes = page.locator(".menu-dishes__list");
  await expect(dishes).toHaveAttribute("aria-label", "Seasonal dishes");
  await expect(dishes.getByRole("listitem")).toHaveCount(1);
  await dishes.getByRole("button", { name: "Seasonal Plate ₹299", exact: true }).click();
  await expect(page).toHaveURL(/\/#\/food\/seasonal-plate$/);
  await expect(page.getByRole("heading", { level: 1, name: "Seasonal Plate" })).toBeVisible();
  await expect(page.locator("main")).toContainText("₹299");
});

test("malformed online catalogue data falls back safely until it is corrected", async ({ page }) => {
  const backend = await installSupabaseMock(page);
  await useVerifiedAccount(page);
  backend.menu.find((item) => item.id === "egg-biryani")!.price_inr = 0;
  await page.goto("/#/food/egg-biryani");
  await expect(page.getByText("Sample menu shown. Online ordering is unavailable.")).toBeVisible();
  await page.getByRole("button", { name: "Add to Cart", exact: true }).click();
  await page.getByRole("button", { name: "Cart, 1 items" }).click();
  await page.getByRole("button", { name: "Proceed to Checkout" }).click();
  const dialog = page.getByRole("dialog", { name: "Checkout" });
  await expect(dialog.getByRole("button", { name: /Send Order Request/ })).toBeDisabled();
  backend.menu.find((item) => item.id === "egg-biryani")!.price_inr = 211;
  await dialog.getByRole("button", { name: "Retry menu" }).click();
  await expect(dialog.getByRole("button", { name: /Send Order Request.*₹211/ })).toBeEnabled();
  expect(backend.orders.size).toBe(0);
});

test("email signup requires verification, then a customer can sign in", async ({ page }) => {
  const backend = await installSupabaseMock(page);
  await page.goto("/#/home");
  await page.getByRole("button", { name: "Your account" }).click();
  const dialog = page.getByRole("dialog", { name: "Your account" });
  await dialog.getByRole("button", { name: "Create account", exact: true }).click();
  await dialog.getByLabel("Email address").fill("new@example.test");
  await dialog.getByLabel("Password", { exact: true }).fill("a-strong-password");
  await dialog.getByLabel("Confirm password").fill("a-strong-password");
  await dialog.getByRole("button", { name: "Create email account" }).click();
  await expect(dialog.getByText("Check your email for a verification link", { exact: false })).toBeVisible();
  expect(backend.emailSignups[0]).toMatchObject({ email: "new@example.test", password: "a-strong-password" });
  expect(backend.orders.size).toBe(0);
  expect(await page.evaluate(() => localStorage.getItem("raaha-auth-v1") || "")).not.toContain("a-strong-password");
  await dialog.getByLabel("Password", { exact: true }).fill("a-strong-password");
  await dialog.getByRole("button", { name: "Sign in with email" }).click();
  await expect(dialog.getByText("Verified email · ready to request an order.")).toBeVisible();
  expect(backend.signinCalls[0]).toMatchObject({ email: "new@example.test", password: "a-strong-password" });
});

test("checkout requires a verified account and refuses orders if email is unconfigured", async ({ page }) => {
  const backend = await installSupabaseMock(page);
  await page.goto("/#/food/egg-biryani");
  await expect(page.locator("main")).toContainText("₹211");
  await page.getByRole("button", { name: "Add to Cart", exact: true }).click();
  await page.getByRole("button", { name: "Cart, 1 items" }).click();
  await page.getByRole("button", { name: "Proceed to Checkout" }).click();
  const dialog = page.getByRole("dialog", { name: "Checkout" });
  await expect(dialog.getByText("Sign in with a verified email account", { exact: false })).toBeVisible();
  await expect(dialog.getByRole("button", { name: /Send Order Request/ })).toBeDisabled();
  expect(backend.orders.size).toBe(0);
  await dialog.getByRole("button", { name: "Close" }).click();
  backend.notificationsAvailable = false;
  await useVerifiedAccount(page);
  await page.reload();
  await page.getByRole("button", { name: "Proceed to Checkout" }).click();
  await expect(dialog.getByText("Order emails are not configured yet", { exact: false })).toBeVisible();
  await expect(dialog.getByRole("button", { name: /Send Order Request/ })).toBeDisabled();
  expect(backend.orders.size).toBe(0);
});

test("Razorpay is opened after saving, and only server-confirmed capture displays paid", async ({ page }) => {
  const backend = await installSupabaseMock(page);
  const dialog = await openCheckout(page);
  await dialog.getByRole("radio", { name: /Razorpay online/ }).check();
  await dialog.getByRole("button", { name: /Send Order Request/ }).click();
  await expect.poll(() => page.evaluate(() => Boolean((window as any).__razorpayOpened))).toBe(true);
  await expect(dialog.getByRole("heading", { name: "Your request is saved." })).toBeVisible();
  expect(backend.orders.size).toBe(1);
  expect(backend.orderCalls[0].p_payment_method).toBe("razorpay");
  expect(backend.paymentCreates).toHaveLength(1);
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem("raaha-cart") || "[]"))).toEqual([]);
  backend.paymentStatus = "paid"; // This response represents the Express server's verified captured payment.
  await page.evaluate(() => (window as any).__razorpayOptions.handler({ razorpay_order_id: "order_ABC123", razorpay_payment_id: "pay_ABC123", razorpay_signature: "test-signature" }));
  await expect(dialog.getByText("Paid online · item subtotal")).toBeVisible();
  await expect(dialog.getByText("not an accepted order", { exact: false })).toBeVisible();
  expect(backend.paymentVerifies[0]).toMatchObject({ gatewayOrderId: "order_ABC123", paymentId: "pay_ABC123" });
  expect([...backend.orders.values()][0].status).toBe("pending");
});

test("a closed Razorpay checkout stays unpaid and can recover through reconciliation", async ({ page }) => {
  const backend = await installSupabaseMock(page);
  const dialog = await openCheckout(page);
  await dialog.getByRole("radio", { name: /Razorpay online/ }).check();
  await dialog.getByRole("button", { name: /Send Order Request/ }).click();
  await expect.poll(() => page.evaluate(() => Boolean((window as any).__razorpayOpened))).toBe(true);
  await page.evaluate(() => (window as any).__razorpayOptions.modal.ondismiss());
  await expect(dialog.getByText("Razorpay payment not confirmed")).toBeVisible();
  await expect(dialog.getByText("Checkout was closed", { exact: false })).toBeVisible();
  expect(backend.paymentVerifies).toHaveLength(0);
  await dialog.getByRole("button", { name: "View Request & Route Preview" }).click();
  await expect(page.getByText("Razorpay payment not confirmed")).toBeVisible();
  backend.paymentStatus = "paid"; // Server reconciliation, e.g. after a delayed webhook.
  await page.getByRole("button", { name: "Check payment status" }).click();
  await expect(page.getByText("Paid online · item subtotal")).toBeVisible();
  await expect(page.getByText("request still needs restaurant review", { exact: false })).toBeVisible();
});
