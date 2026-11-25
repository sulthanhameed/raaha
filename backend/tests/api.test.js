import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { readConfig } from '../src/config.js';
import { createEmailWorker, emailForJob } from '../src/email.js';

const ORDER = '11111111-1111-4111-8111-111111111111';
const USER = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const config = readConfig({ NODE_ENV: 'production', SUPABASE_URL: 'https://mock.supabase.co', SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_test', CORS_ALLOWED_ORIGINS: 'https://raaha.example' });

test('REST routes validate identity, fail closed without email, and never trust a client owner', async () => {
  const calls = [];
  const db = {
    user: async (token) => token === 'email' ? { id: USER, email: 'x@example.test', email_confirmed_at: '2026-01-01', is_anonymous: false } : token === 'guest' ? { id: USER, is_anonymous: true } : null,
    catalog: async () => ({ categories: [], items: [] }),
    submitOrder: async (token, body) => { calls.push(['order', token, body]); return [{ request_id: body.requestId }]; },
    saveProfile: async (...args) => calls.push(['profile', ...args]),
    submitReservation: async (...args) => { calls.push(['reservation', ...args]); return [{ request_id: ORDER }]; },
  };
  const order = (app, token) => request(app).post('/api/orders').set('Authorization', `Bearer ${token}`).send({ requestId: ORDER, paymentMethod: 'pay_later', user_id: 'attacker' });
  const noMail = createApp(config, { db });
  assert.equal((await order(noMail, 'email')).status, 503);
  const app = createApp(config, { db, mailer: { send: async () => {} } });
  assert.equal((await order(app, 'guest')).status, 403);
  assert.equal((await order(app, 'bad')).status, 401);
  assert.equal((await request(app).post('/api/orders').set('Authorization', 'Bearer email').send({ requestId: ORDER, paymentMethod: 'razorpay' })).status, 503);
  assert.equal((await order(app, 'email')).status, 200);
  assert.equal(calls[0][0], 'order');
  assert.equal(calls[0][1], USER); // The service RPC receives verified Auth identity, never the submitted user_id.
  const profile = await request(app).put('/api/profile').set('Authorization', 'Bearer guest').send({ user_id: 'attacker', name: 'A', phone: '9876543210' });
  assert.equal(profile.status, 200);
  assert.equal(calls[1][2], USER); // ID comes from verified Auth, not request JSON.
  assert.equal((await request(app).post('/api/reservations').set('Authorization', 'Bearer guest').send({ requestId: ORDER })).status, 200);
  assert.equal((await request(app).get('/api/catalog').set('Origin', 'https://evil.example')).status, 403);
  assert.equal((await request(app).get('/api/catalog').set('Origin', 'https://raaha.example')).headers['access-control-allow-origin'], 'https://raaha.example');
});

test('Auth proxy forwards only allowlisted Auth endpoints and overwrites the public key', async (t) => {
  let seen;
  const upstream = http.createServer((req, res) => {
    seen = { url: req.url, key: req.headers.apikey, method: req.method };
    req.resume();
    req.on('end', () => { res.setHeader('content-type', 'application/json'); res.end('{"ok":true}'); });
  });
  await new Promise((resolve) => upstream.listen(0, '127.0.0.1', resolve));
  t.after(() => new Promise((resolve) => upstream.close(resolve)));
  const localConfig = readConfig({ NODE_ENV: 'development', SUPABASE_URL: `http://127.0.0.1:${upstream.address().port}`, SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_test' });
  const app = createApp(localConfig);
  const forwarded = await request(app).post('/api/supabase/auth/v1/signup').set('apikey', 'attacker-key').send({ email: 'user@example.test' });
  assert.equal(forwarded.status, 200);
  assert.deepEqual(seen, { url: '/auth/v1/signup', key: 'sb_publishable_test', method: 'POST' });
  assert.equal((await request(app).get('/api/supabase/rest/v1/order_requests')).status, 404);
  assert.equal((await request(app).get('/api/supabase/auth/v1/signup/%2e%2e/admin')).status, 404);
});

test('email worker attempts both recipients, records failures, and does not claim a whole batch at once', async () => {
  const jobs = [
    { job_id: 'j1', order_id: ORDER, recipient_kind: 'restaurant', event_type: 'request', attempts: 1 },
    { job_id: 'j2', order_id: ORDER, recipient_kind: 'customer', event_type: 'request', attempts: 1 },
  ];
  const order = { id: ORDER, customer_name: 'Anu', customer_email: 'customer@example.test', phone: '9876543210', delivery_address: 'Madurai', subtotal_inr: 179, status: 'pending', payment_method: 'pay_later', payment_status: 'unpaid', order_request_items: [{ item_name: 'Egg Biryani', quantity: 1, unit_price_inr: 179, position: 1 }] };
  const sent = [], finished = [];
  const db = { claimEmailJobs: async () => jobs.length ? [jobs.shift()] : [], orderForEmail: async () => order, finishEmailJob: async (...args) => finished.push(args) };
  const mailer = { send: async (mail) => { sent.push(mail); if (mail.to === 'customer@example.test') throw new Error('SMTP failure'); } };
  const worker = createEmailWorker({ db, mailer, restaurantEmail: 'sultham456@gmail.com' });
  await worker.runOnce();
  assert.deepEqual(sent.map((m) => m.to), ['sultham456@gmail.com', 'customer@example.test']);
  assert.match(sent[0].text, /restaurant review, not an accepted order/i);
  assert.deepEqual(finished, [['j1', 1, true], ['j2', 1, false]]);
  assert.throws(() => emailForJob({}, null, 'x@example.test'), /EMAIL_DATA_MISSING/);
});
