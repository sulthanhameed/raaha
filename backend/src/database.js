import { createClient } from '@supabase/supabase-js';
import { ApiError } from './payments.js';

const auth = { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false };
const boundedFetch = async (input, init = {}) => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 12_000);
  const signal = init.signal;
  const abort = () => controller.abort();
  if (signal?.aborted) abort();
  else signal?.addEventListener('abort', abort, { once: true });
  try { return await fetch(input, { ...init, signal: controller.signal }); }
  finally { clearTimeout(timer); signal?.removeEventListener('abort', abort); }
};
const knownErrors = {
  AUTH_REQUIRED: 401, EMAIL_VERIFICATION_REQUIRED: 403, MENU_CHANGED: 409, REQUEST_MISMATCH: 409,
  RATE_LIMITED: 429, INVALID_REQUEST: 400, INVALID_ITEMS: 400, INVALID_CONTACT: 400,
  INVALID_DATE: 400, INVALID_REVIEW: 400, INVALID_PAYMENT_METHOD: 400,
};
function unwrap({ data, error }) {
  if (!error) return data;
  const message = String(error.message || '');
  for (const [code, status] of Object.entries(knownErrors)) {
    if (message === code || message.startsWith(`${code}:`)) throw new ApiError(status, code);
  }
  // Never forward arbitrary Postgres, HTTP or provider messages to a browser.
  throw new Error('DATABASE_ERROR');
}

/** All normal operations use the caller's JWT so Supabase RLS remains active. */
export function createDatabase(config) {
  if (!config.databaseReady) return null;
  const publicClient = createClient(config.url, config.publicKey, { auth, global: { fetch: boundedFetch } });
  const admin = config.serviceKey ? createClient(config.url, config.serviceKey, { auth, global: { fetch: boundedFetch } }) : null;
  const forUser = (token) => createClient(config.url, config.publicKey, { auth, global: { fetch: boundedFetch, headers: { Authorization: `Bearer ${token}` } } });
  const scoped = (token) => token ? forUser(token) : publicClient;
  const requireAdmin = () => { if (!admin) throw new Error('SERVICE_UNAVAILABLE'); return admin; };
  return {
    async user(token) {
      if (!token) return null;
      const { data, error } = await publicClient.auth.getUser(token);
      if (error) {
        if (error.status && error.status >= 400 && error.status < 500) return null;
        throw new Error('AUTH_UNAVAILABLE');
      }
      return data.user?.id ? data.user : null;
    },
    async catalog() {
      const [categories, items] = await Promise.all([
        publicClient.from('categories').select('id,name,tagline,description,image_url').order('position').order('id'),
        publicClient.from('menu_items').select('id,category_id,name,description,price_inr,vegetarian,ingredients,image_url,sample_rating,sample_rating_count,prep_time,serves,spice,calories,tag').order('position').order('id'),
      ]);
      return { categories: unwrap(categories), items: unwrap(items) };
    },
    async submitOrder(userId, input) {
      // Only Express has this service-role RPC; userId comes from verified Auth.
      return unwrap(await requireAdmin().rpc('raaha_submit_order_for_user', {
        p_user_id: userId, p_request_id: input.requestId, p_customer_name: input.name, p_phone: input.phone,
        p_delivery_address: input.address, p_items: input.items, p_payment_method: input.paymentMethod,
      }));
    },
    async latestOrder(token) {
      return unwrap(await forUser(token).from('order_requests')
        .select('id,created_at,customer_name,delivery_address,subtotal_inr,status,payment_method,payment_status,order_request_items(item_id,item_name,quantity,unit_price_inr,position)')
        .order('created_at', { ascending: false }).limit(1).maybeSingle());
    },
    async submitReservation(token, input) {
      return unwrap(await forUser(token).rpc('submit_reservation_request', {
        p_request_id: input.requestId, p_customer_name: input.name, p_phone: input.phone,
        p_guest_count: input.guests, p_preferred_date: input.date, p_preferred_time: input.time,
        p_occasion: input.occasion, p_message: input.message,
      }));
    },
    async listReviews(token, itemId) { return unwrap(await scoped(token).rpc('get_dish_reviews', { p_item_id: itemId })); },
    async submitReview(token, input) {
      return unwrap(await forUser(token).rpc('submit_dish_review', {
        p_request_id: input.requestId, p_item_id: input.itemId, p_author_name: input.name,
        p_review_text: input.text, p_rating: input.rating,
      }));
    },
    async deleteReview(token, id) { return unwrap(await forUser(token).rpc('delete_own_review', { p_review_id: id })); },
    async profile(token, userId) {
      return unwrap(await forUser(token).from('guest_profiles').select('name,phone').eq('user_id', userId).maybeSingle());
    },
    async saveProfile(token, userId, input) {
      unwrap(await forUser(token).from('guest_profiles').upsert({ user_id: userId, name: input.name, phone: input.phone }));
    },
    async deleteProfile(token, userId) { unwrap(await forUser(token).from('guest_profiles').delete().eq('user_id', userId)); },
    async ownedOrder(token, id) {
      return unwrap(await forUser(token).from('order_requests').select('id,subtotal_inr,status,payment_method,payment_status').eq('id', id).maybeSingle());
    },
    async paymentForOrder(id) {
      return unwrap(await requireAdmin().from('payment_attempts').select('order_id,gateway_order_id,gateway_payment_id,amount_paise,currency').eq('order_id', id).maybeSingle());
    },
    async paymentForGateway(id) {
      return unwrap(await requireAdmin().from('payment_attempts').select('order_id,gateway_order_id,gateway_payment_id,amount_paise,currency').eq('gateway_order_id', id).maybeSingle());
    },
    async registerOrder(id, gatewayId, amount) {
      const rows = unwrap(await requireAdmin().rpc('raaha_register_gateway_order', { p_order_id: id, p_gateway_order_id: gatewayId, p_amount_paise: amount }));
      if (!Array.isArray(rows) || !rows[0]) throw new Error('DATABASE_ERROR');
      return rows[0];
    },
    async recordCapture(gatewayId, paymentId, amount) {
      return unwrap(await requireAdmin().rpc('raaha_record_capture', { p_gateway_order_id: gatewayId, p_gateway_payment_id: paymentId, p_amount_paise: amount }));
    },
    // Claim one immediately before sending, so a queued batch cannot outlive its lease.
    async claimEmailJobs() { return unwrap(await requireAdmin().rpc('raaha_claim_email_jobs', { p_limit: 1 })); },
    async finishEmailJob(id, attempt, success) { unwrap(await requireAdmin().rpc('raaha_finish_email_job', { p_job_id: id, p_attempt: attempt, p_success: success, p_error: success ? '' : 'EMAIL_DELIVERY_FAILED' })); },
    async orderForEmail(id) {
      return unwrap(await requireAdmin().from('order_requests').select('id,created_at,customer_name,customer_email,phone,delivery_address,subtotal_inr,status,payment_method,payment_status,order_request_items(item_name,quantity,unit_price_inr,position)').eq('id', id).maybeSingle());
    },
  };
}
