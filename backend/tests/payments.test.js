import test from 'node:test';
import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { readConfig } from '../src/config.js';

const ORDER = '11111111-1111-4111-8111-111111111111';
const USER = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const SECRET = 'test-key-secret';
const WEBHOOK = 'test-webhook-secret';
const hmac = (value, key) => createHmac('sha256', key).update(value).digest('hex');

function fixture() {
  const config = readConfig({ NODE_ENV: 'development', SUPABASE_URL: 'https://mock.supabase.co', SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_test', SUPABASE_SERVICE_ROLE_KEY: 'service-secret', RAZORPAY_KEY_ID: 'rzp_test_ABC123', RAZORPAY_KEY_SECRET: SECRET, RAZORPAY_WEBHOOK_SECRET: WEBHOOK });
  const state = { order: { id: ORDER, subtotal_inr: 358, status: 'pending', payment_method: 'razorpay', payment_status: 'unpaid' }, attempt: null, creates: [], captures: 0, payment: null };
  const db = {
    user: async (token) => token === 'verified-token' ? { id: USER, email: 'person@example.test', email_confirmed_at: '2026-01-01T00:00:00Z', is_anonymous: false } : token === 'guest-token' ? { id: USER, is_anonymous: true } : null,
    ownedOrder: async (token, id) => token === 'verified-token' && id === ORDER ? state.order : null,
    paymentForOrder: async () => state.attempt,
    paymentForGateway: async (id) => state.attempt?.gateway_order_id === id ? state.attempt : null,
    registerOrder: async (id, gatewayId, amount) => {
      if (!state.attempt) state.attempt = { order_id: id, gateway_order_id: gatewayId, amount_paise: amount, currency: 'INR', gateway_payment_id: null };
      return state.attempt;
    },
    recordCapture: async (gatewayId, paymentId, amount) => {
      assert.equal(gatewayId, state.attempt.gateway_order_id);
      assert.equal(amount, state.attempt.amount_paise);
      if (state.attempt.gateway_payment_id && state.attempt.gateway_payment_id !== paymentId) throw new Error('PAYMENT_MISMATCH');
      if (!state.attempt.gateway_payment_id) { state.captures++; state.attempt.gateway_payment_id = paymentId; state.order.payment_status = 'paid'; }
    },
  };
  const gateway = {
    orders: {
      create: async (params) => { state.creates.push(params); return { id: 'order_ABC123', amount: params.amount, currency: params.currency }; },
      fetchPayments: async () => ({ items: state.payment ? [state.payment] : [] }),
    },
    payments: { fetch: async () => state.payment },
  };
  const app = createApp(config, { db, gateway });
  return { app, state, db };
}
const create = (app, body = { orderId: ORDER }) => request(app).post('/api/payments/create').set('Authorization', 'Bearer verified-token').send(body);
const verify = (app, overrides = {}) => request(app).post('/api/payments/verify').set('Authorization', 'Bearer verified-token').send({ orderId: ORDER, gatewayOrderId: 'order_ABC123', paymentId: 'pay_ABC123', signature: hmac('order_ABC123|pay_ABC123', SECRET), ...overrides });

test('server prices the order, checks ownership, blocks guests and reuses the stored gateway order', async () => {
  const { app, state } = fixture();
  assert.equal((await request(app).post('/api/payments/create').send({ orderId: ORDER })).status, 401);
  assert.equal((await request(app).post('/api/payments/create').set('Authorization', 'Bearer guest-token').send({ orderId: ORDER })).status, 401);
  assert.equal((await create(app, { orderId: '22222222-2222-4222-8222-222222222222' })).status, 404);
  const result = await create(app, { orderId: ORDER, amount: 1, currency: 'USD' });
  assert.equal(result.status, 200);
  assert.deepEqual(result.body, { key: 'rzp_test_ABC123', gateway_order_id: 'order_ABC123', amount: 35800, currency: 'INR' });
  assert.deepEqual(state.creates[0], { amount: 35800, currency: 'INR', receipt: ORDER, partial_payment: false });
  assert.equal((await create(app)).body.gateway_order_id, 'order_ABC123');
  assert.equal(state.creates.length, 1);
  state.order.status = 'closed';
  assert.equal((await create(app)).status, 409);
});

test('a signature alone never marks authorized, mismatched or refunded payments as paid', async () => {
  const { app, state } = fixture();
  await create(app);
  state.payment = { id: 'pay_ABC123', order_id: 'order_ABC123', amount: 35800, currency: 'INR', status: 'authorized', captured: false };
  assert.equal((await verify(app, { signature: 'a'.repeat(64) })).status, 400);
  assert.equal((await verify(app, { gatewayOrderId: 'order_OTHER' })).status, 400);
  assert.deepEqual((await verify(app)).body, { status: 'pending' });
  assert.equal(state.captures, 0);
  state.payment = { ...state.payment, status: 'captured', captured: true, amount: 100 };
  assert.equal((await verify(app)).status, 400);
  state.payment = { ...state.payment, amount: 35800, currency: 'USD' };
  assert.equal((await verify(app)).status, 400);
  state.payment = { ...state.payment, currency: 'INR', amount_refunded: 100 };
  assert.deepEqual((await verify(app)).body, { status: 'pending' });
  assert.equal(state.captures, 0);
  state.payment = { ...state.payment, amount_refunded: 0 };
  assert.deepEqual((await verify(app)).body, { status: 'paid' });
  assert.deepEqual((await verify(app)).body, { status: 'paid' });
  assert.equal(state.captures, 1);
  assert.equal(state.order.status, 'pending'); // Payment never accepts the restaurant request.
  state.order.payment_status = 'refunded';
  assert.equal((await verify(app)).status, 409);
});

test('signed webhooks use raw bytes, verify the gateway independently and retry before registration', async () => {
  const { app, state } = fixture();
  const raw = JSON.stringify({ event: 'payment.captured', payload: { payment: { entity: { id: 'pay_ABC123', order_id: 'order_ABC123' } } } });
  const post = (signature, body = raw) => request(app).post('/api/payments/razorpay/webhook').set('Content-Type', 'application/json').set('x-razorpay-signature', signature).send(body);
  assert.equal((await post('b'.repeat(64))).status, 401);
  assert.equal((await post(hmac(raw, WEBHOOK), raw + ' ')).status, 401);
  assert.equal((await post(hmac(raw, WEBHOOK))).status, 503); // gateway registration may still be in flight
  await create(app);
  state.payment = { id: 'pay_ABC123', order_id: 'order_ABC123', amount: 35800, currency: 'INR', status: 'authorized', captured: false };
  assert.equal((await post(hmac(raw, WEBHOOK))).status, 503);
  assert.equal(state.captures, 0);
  state.payment = { ...state.payment, status: 'captured', captured: true };
  assert.deepEqual((await post(hmac(raw, WEBHOOK))).body, { received: true });
  assert.equal((await post(hmac(raw, WEBHOOK))).status, 200);
  assert.equal(state.captures, 1);
  const authorized = JSON.stringify({ event: 'payment.authorized' });
  assert.equal((await post(hmac(authorized, WEBHOOK), authorized)).status, 200);
});

test('reconciliation recovers a captured payment without trusting a browser callback', async () => {
  const { app, state } = fixture();
  await create(app);
  const reconcile = () => request(app).post('/api/payments/reconcile').set('Authorization', 'Bearer verified-token').send({ orderId: ORDER });
  assert.deepEqual((await reconcile()).body, { status: 'pending' });
  state.payment = { id: 'pay_ABC123', order_id: 'order_ABC123', amount: 35800, currency: 'INR', status: 'captured', captured: true };
  assert.deepEqual((await reconcile()).body, { status: 'paid' });
  assert.equal(state.captures, 1);
  assert.deepEqual((await reconcile()).body, { status: 'paid' });
});

test('live mode is disabled without an explicit opt-in', () => {
  const env = { NODE_ENV: 'production', SUPABASE_URL: 'https://example.supabase.co', SUPABASE_PUBLISHABLE_KEY: 'public', SUPABASE_SERVICE_ROLE_KEY: 'secret', RAZORPAY_KEY_ID: 'rzp_live_ABC', RAZORPAY_KEY_SECRET: SECRET, RAZORPAY_WEBHOOK_SECRET: WEBHOOK };
  assert.equal(readConfig(env).paymentsReady, false);
  assert.equal(readConfig({ ...env, RAZORPAY_ALLOW_LIVE: 'true' }).paymentsReady, true);
  assert.equal(readConfig({ ...env, SUPABASE_PUBLISHABLE_KEY: 'sb_secret_leak' }).databaseReady, false);
});
