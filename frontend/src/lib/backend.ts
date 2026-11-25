import type { DeliveryOrder, TrackedItem } from "../data/tracking";
import { apiRequest } from "./api";
import { ensureGuestSession, existingGuestId, verifiedAccountId } from "./supabase";

export interface GuestProfile { name: string; phone: string }
export interface OrderInput {
  name: string;
  phone: string;
  address: string;
  paymentMethod: "pay_later" | "razorpay";
  items: { id: string; qty: number; expected_price: number }[];
}
export interface ReservationInput {
  name: string;
  phone: string;
  guests: number;
  date: string;
  time: string;
  occasion: string;
  message: string;
}
export interface ReviewInput { itemId: string; name: string; text: string; rating: number }
export interface DishReview {
  id: string;
  author_name: string;
  review_text: string;
  rating: number;
  created_at: string;
  status: "pending" | "published";
  is_mine: boolean;
}

type Attempt = { id: string; fingerprint: string };
const memoryAttempts = new Map<string, Attempt>();

// Persist only a hash and random id in this tab, never the contact details.
// Identical retries use the same id even after an uncertain network failure.
async function attemptFor(kind: string, payload: object): Promise<string> {
  if (!globalThis.crypto?.subtle || !globalThis.crypto.randomUUID) throw new Error("SECURE_CONTEXT_REQUIRED");
  const bytes = new TextEncoder().encode(JSON.stringify(payload));
  const hash = await crypto.subtle.digest("SHA-256", bytes);
  const fingerprint = [...new Uint8Array(hash)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
  let previous = memoryAttempts.get(kind);
  try {
    const stored = sessionStorage.getItem(`raaha-attempt:${kind}`);
    if (stored) previous = JSON.parse(stored) as Attempt;
  } catch { /* in-memory retry protection remains available */ }
  if (previous?.fingerprint === fingerprint && typeof previous.id === "string") return previous.id;
  if (previous?.id && previous.fingerprint) throw new Error("UNRESOLVED_ATTEMPT");
  const attempt = { id: crypto.randomUUID(), fingerprint };
  memoryAttempts.set(kind, attempt);
  try { sessionStorage.setItem(`raaha-attempt:${kind}`, JSON.stringify(attempt)); } catch { /* storage is optional */ }
  return attempt.id;
}

function clearAttempt(kind: string, id: string) {
  if (memoryAttempts.get(kind)?.id === id) memoryAttempts.delete(kind);
  try {
    const stored = sessionStorage.getItem(`raaha-attempt:${kind}`);
    if (stored && (JSON.parse(stored) as Attempt).id === id) sessionStorage.removeItem(`raaha-attempt:${kind}`);
  } catch { /* storage is optional */ }
}

export function forgetPendingAttempt(kind: string) {
  memoryAttempts.delete(kind);
  try { sessionStorage.removeItem(`raaha-attempt:${kind}`); } catch { /* storage is optional */ }
}

function clearOnDefinitiveRejection(kind: string, id: string, error: { message?: string }) {
  // These errors are raised inside the database transaction; none can commit a
  // request. Network and malformed-response errors remain unresolved instead.
  if (["MENU_CHANGED", "INVALID_REQUEST", "INVALID_ITEMS", "INVALID_CONTACT", "INVALID_DATE", "INVALID_REVIEW", "INVALID_PAYMENT_METHOD", "RATE_LIMITED", "AUTH_REQUIRED", "AUTH_CHANGED", "EMAIL_VERIFICATION_REQUIRED", "NOTIFICATIONS_UNAVAILABLE", "PAYMENT_UNAVAILABLE"].some((code) => error.message?.includes(code))) {
    clearAttempt(kind, id);
  }
}

function firstReceipt(data: unknown, expectedId: string, key = "request_id") {
  const row = Array.isArray(data) ? data[0] : null;
  if (!row || typeof row !== "object" || row[key] !== expectedId || typeof row.created_at !== "string" || !Number.isFinite(Date.parse(row.created_at))) {
    // A malformed response is not a success, even if the server may have committed.
    throw new Error("UNCONFIRMED_RESPONSE");
  }
  return row as Record<string, unknown>;
}

function toItems(value: unknown): TrackedItem[] {
  if (!Array.isArray(value) || value.length === 0) throw new Error("UNCONFIRMED_RESPONSE");
  return value.map((row) => {
    if (!row || typeof row.id !== "string" || typeof row.name !== "string" ||
      !Number.isInteger(row.qty) || row.qty < 1 || !Number.isInteger(row.price) || row.price < 1) {
      throw new Error("UNCONFIRMED_RESPONSE");
    }
    return { id: row.id, name: row.name, qty: row.qty, price: row.price };
  });
}

export async function submitOrder(input: OrderInput): Promise<DeliveryOrder> {
  const accountId = await verifiedAccountId();
  const requestId = await attemptFor("order", { accountId, ...input });
  let data: unknown;
  try {
    data = await apiRequest("/orders", { method: "POST", auth: "required", expectedUserId: accountId, body: { requestId, ...input } });
  } catch (error) {
    clearOnDefinitiveRejection("order", requestId, error as { message?: string });
    throw error;
  }
  const receipt = firstReceipt(data, requestId);
  const subtotal = Number(receipt.subtotal_inr);
  if (!Number.isSafeInteger(subtotal) || subtotal <= 0 || typeof receipt.status !== "string" || !["pending", "contacted", "closed"].includes(receipt.status) ||
    receipt.payment_method !== input.paymentMethod || !["unpaid", "paid", "partially_refunded", "refunded"].includes(String(receipt.payment_status))) throw new Error("UNCONFIRMED_RESPONSE");
  const items = toItems(receipt.items);
  if (items.reduce((sum, item) => sum + item.price * item.qty, 0) !== subtotal || items.length !== input.items.length ||
    items.some((item, index) => item.id !== input.items[index].id || item.qty !== input.items[index].qty || item.price !== input.items[index].expected_price)) {
    throw new Error("UNCONFIRMED_RESPONSE");
  }
  const createdAt = Date.parse(receipt.created_at as string);
  if (!Number.isFinite(createdAt)) throw new Error("UNCONFIRMED_RESPONSE");
  const order: DeliveryOrder = {
    id: requestId, createdAt, customerName: input.name, address: input.address,
    paymentMethod: input.paymentMethod, paymentStatus: receipt.payment_status as DeliveryOrder["paymentStatus"], total: subtotal, items, status: receipt.status,
  };
  clearAttempt("order", requestId);
  return order;
}

export async function submitReservation(input: ReservationInput, captchaToken?: string): Promise<string> {
  const guestId = await ensureGuestSession(captchaToken);
  const requestId = await attemptFor("reservation", { guestId, ...input });
  let data: unknown;
  try { data = await apiRequest("/reservations", { method: "POST", auth: "required", expectedUserId: guestId, body: { requestId, ...input } }); }
  catch (error) { clearOnDefinitiveRejection("reservation", requestId, error as { message?: string }); throw error; }
  firstReceipt(data, requestId);
  clearAttempt("reservation", requestId);
  return requestId;
}

export async function listReviews(itemId: string): Promise<DishReview[]> {
  const data = await apiRequest<unknown>(`/reviews/${encodeURIComponent(itemId)}`, { auth: "optional" });
  if (!Array.isArray(data) || data.some((row) => !row || typeof row.id !== "string" ||
    typeof row.author_name !== "string" || typeof row.review_text !== "string" ||
    !Number.isInteger(row.rating) || row.rating < 1 || row.rating > 5 ||
    typeof row.created_at !== "string" || !Number.isFinite(Date.parse(row.created_at)) ||
    !["pending", "published"].includes(row.status) || typeof row.is_mine !== "boolean")) {
    throw new Error("INVALID_RESPONSE");
  }
  return data as DishReview[];
}

export async function submitReview(input: ReviewInput, captchaToken?: string): Promise<void> {
  const guestId = await ensureGuestSession(captchaToken);
  const requestId = await attemptFor(`review:${input.itemId}`, { guestId, ...input });
  let data: unknown;
  try { data = await apiRequest("/reviews", { method: "POST", auth: "required", expectedUserId: guestId, body: { requestId, ...input } }); }
  catch (error) { clearOnDefinitiveRejection(`review:${input.itemId}`, requestId, error as { message?: string }); throw error; }
  firstReceipt(data, requestId, "review_id");
  clearAttempt(`review:${input.itemId}`, requestId);
}

export async function deleteReview(id: string): Promise<void> {
  await ensureGuestSession();
  const data = await apiRequest<boolean>(`/reviews/${encodeURIComponent(id)}`, { method: "DELETE", auth: "required" });
  if (data !== true) throw new Error("DELETE_NOT_CONFIRMED");
}

export async function loadProfile(): Promise<GuestProfile | null> {
  const id = await existingGuestId();
  if (!id) return null;
  const data = await apiRequest<GuestProfile | null>("/profile", { auth: "required" });
  if (data && (typeof data.name !== "string" || !data.name.trim() || typeof data.phone !== "string")) throw new Error("INVALID_RESPONSE");
  return data ? { name: data.name, phone: data.phone } : null;
}

export async function saveProfile(profile: GuestProfile, captchaToken?: string): Promise<void> {
  await ensureGuestSession(captchaToken);
  const result = await apiRequest<{ saved: boolean }>("/profile", { method: "PUT", auth: "required", body: profile });
  if (result.saved !== true) throw new Error("UNCONFIRMED_RESPONSE");
}

export async function deleteProfile(): Promise<void> {
  const id = await existingGuestId();
  if (!id) throw new Error("GUEST_SESSION_FAILED");
  const result = await apiRequest<{ deleted: boolean }>("/profile", { method: "DELETE", auth: "required" });
  if (result.deleted !== true) throw new Error("UNCONFIRMED_RESPONSE");
}

/** Load only the signed-in visitor's most recent request; RLS enforces ownership. */
export async function loadLatestOrder(): Promise<DeliveryOrder | null> {
  const id = await existingGuestId();
  if (!id) return null;
  const data = await apiRequest<Record<string, unknown> | null>("/orders/latest", { auth: "required" });
  if (!data) return null;
  if (typeof data.id !== "string" || typeof data.created_at !== "string" ||
    typeof data.customer_name !== "string" || typeof data.delivery_address !== "string" ||
    typeof data.status !== "string" || !["pending", "contacted", "closed"].includes(data.status) ||
    typeof data.payment_method !== "string" || !["pay_later", "razorpay"].includes(data.payment_method) ||
    typeof data.payment_status !== "string" || !["unpaid", "paid", "partially_refunded", "refunded"].includes(data.payment_status) ||
    !Array.isArray(data.order_request_items)) {
    throw new Error("INVALID_RESPONSE");
  }
  const rows = data.order_request_items as unknown as Array<{ item_id: string; item_name: string; quantity: number; unit_price_inr: number; position: number }>;
  if (rows.some((row) => !row || !Number.isInteger(row.position) || row.position < 1)) throw new Error("INVALID_RESPONSE");
  const items = toItems([...rows].sort((a, b) => a.position - b.position)
    .map((row) => ({ id: row.item_id, name: row.item_name, qty: row.quantity, price: row.unit_price_inr })));
  const total = Number(data.subtotal_inr);
  const createdAt = Date.parse(data.created_at);
  if (!Number.isSafeInteger(total) || total <= 0 || !Number.isFinite(createdAt) ||
    items.reduce((sum, item) => sum + item.qty * item.price, 0) !== total) throw new Error("INVALID_RESPONSE");
  return {
    id: data.id, createdAt, customerName: data.customer_name,
    address: data.delivery_address, paymentMethod: data.payment_method as DeliveryOrder["paymentMethod"],
    paymentStatus: data.payment_status as DeliveryOrder["paymentStatus"], total, items, status: data.status,
  };
}

/** Do not expose database internals or imply that a failed network request was not committed. */
export function requestError(error: unknown): string {
  const message = error && typeof error === "object" && "message" in error ? String(error.message) : "";
  if (message.includes("BACKEND_UNCONFIGURED")) return "Online requests are not configured. Nothing was sent.";
  if (message.includes("AUTH_CHANGED")) return "The signed-in account changed. Check your previous account's request before trying again.";
  if (message.includes("EMAIL_VERIFICATION_REQUIRED") || message.includes("AUTH_REQUIRED")) return "Sign in with a verified email account before sending an order request.";
  if (message.includes("NOTIFICATIONS_UNAVAILABLE")) return "Order emails are not configured yet, so this request was not sent.";
  if (message.includes("PAYMENT_UNAVAILABLE")) return "Online payment is unavailable. Choose pay later or try again later.";
  if (message.includes("MENU_CHANGED")) return "The menu price or availability changed. Refresh the menu and review your cart before trying again.";
  if (message.includes("RATE_LIMITED")) return "Too many requests were made from this guest session. Please wait and try again.";
  if (message.includes("INVALID_DATE")) return "Choose a future date and time in Madurai, within the next year.";
  if (message.includes("INVALID_CONTACT")) return "Please check your name, phone number and request details.";
  if (message.includes("INVALID_ITEMS")) return "Please check the items in your cart: up to 20 of each dish and 100 items total.";
  if (message.includes("INVALID_REVIEW")) return "Please check your rating, name and review text.";
  if (message.includes("REQUEST_MISMATCH")) return "A request with this reference already exists with different details. Please contact the restaurant before submitting again.";
  if (message.includes("UNRESOLVED_ATTEMPT")) return "A previous attempt may have been saved. Restore its original details and retry, or contact the restaurant before starting a new request.";
  if (message.includes("SECURE_CONTEXT_REQUIRED")) return "A secure browser connection is required to submit requests.";
  if (message.includes("GUEST_SESSION_FAILED")) return "A guest session could not be started, so nothing was sent. Please try again later.";
  if (message.includes("CAPTCHA_REQUIRED")) return "Please complete the guest verification before sending your request.";
  return "We couldn’t confirm whether it was sent. Retry without changing the details to avoid a duplicate, or contact the restaurant before starting a new request.";
}
