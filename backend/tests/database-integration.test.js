import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { readConfig } from '../src/config.js';

const USER = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const ORDER = '11111111-1111-4111-8111-111111111111';

test('Express talks to Supabase Auth and REST with verified ownership and the correct key scopes', async (t) => {
  const seen = [];
  const upstream = http.createServer(async (req, res) => {
    let text = '';
    for await (const chunk of req) text += chunk;
    const url = new URL(req.url, 'http://example.test');
    seen.push({ path: url.pathname, method: req.method, auth: req.headers.authorization, apikey: req.headers.apikey, body: text ? JSON.parse(text) : null });
    res.setHeader('content-type', 'application/json');
    if (url.pathname === '/auth/v1/user') {
      if (req.headers.authorization !== 'Bearer valid-user-token') { res.statusCode = 401; res.end('{"msg":"invalid"}'); return; }
      res.end(JSON.stringify({ id: USER, email: 'user@example.test', email_confirmed_at: '2026-01-01T00:00:00Z', is_anonymous: false, aud: 'authenticated', app_metadata: {}, user_metadata: {} }));
    } else if (url.pathname === '/rest/v1/categories') res.end('[{"id":"biryani"}]');
    else if (url.pathname === '/rest/v1/menu_items') res.end('[{"id":"egg-biryani"}]');
    else if (url.pathname === '/rest/v1/rpc/raaha_submit_order_for_user') {
      const body = JSON.parse(text);
      if (body.p_customer_name === 'Reject') { res.statusCode = 400; res.end('{"code":"P0001","message":"MENU_CHANGED"}'); return; }
      res.end(JSON.stringify([{ request_id: body.p_request_id, created_at: '2026-01-01T00:00:00Z', subtotal_inr: 179, status: 'pending', items: [{ id: 'egg-biryani', name: 'Egg Biryani', qty: 1, price: 179 }], payment_method: 'pay_later', payment_status: 'unpaid' }]));
    } else if (url.pathname === '/rest/v1/guest_profiles' && req.method === 'GET') res.end('[{"name":"Anu","phone":"9876543210"}]');
    else { res.statusCode = 404; res.end('{"message":"not found"}'); }
  });
  await new Promise((resolve) => upstream.listen(0, '127.0.0.1', resolve));
  t.after(() => new Promise((resolve) => upstream.close(resolve)));
  const config = readConfig({ NODE_ENV: 'development', SUPABASE_URL: `http://127.0.0.1:${upstream.address().port}`, SUPABASE_PUBLISHABLE_KEY: 'public-key', SUPABASE_SERVICE_ROLE_KEY: 'service-secret' });
  const app = createApp(config, { mailer: { send: async () => {} } });
  const catalog = await request(app).get('/api/catalog');
  assert.equal(catalog.status, 200);
  assert.equal(catalog.body.items[0].id, 'egg-biryani');
  const input = { requestId: ORDER, name: 'Anu', phone: '9876543210', address: 'Madurai street', paymentMethod: 'pay_later', items: [{ id: 'egg-biryani', qty: 1, expected_price: 179 }], user_id: 'attacker' };
  const response = await request(app).post('/api/orders').set('Authorization', 'Bearer valid-user-token').send(input);
  assert.equal(response.status, 200);
  assert.equal(response.body[0].request_id, ORDER);
  const rpc = seen.find((r) => r.path === '/rest/v1/rpc/raaha_submit_order_for_user');
  assert.equal(rpc.body.p_user_id, USER);
  assert.equal(rpc.apikey, 'service-secret');
  assert.equal(rpc.auth, 'Bearer service-secret');
  assert.equal(JSON.stringify(response.body).includes('service-secret'), false);
  const profile = await request(app).get('/api/profile').set('Authorization', 'Bearer valid-user-token');
  assert.equal(profile.status, 200);
  assert.equal(profile.body.name, 'Anu');
  const scoped = seen.find((r) => r.path === '/rest/v1/guest_profiles');
  assert.equal(scoped.apikey, 'public-key');
  assert.equal(scoped.auth, 'Bearer valid-user-token');
  const rejected = await request(app).post('/api/orders').set('Authorization', 'Bearer valid-user-token').send({ ...input, name: 'Reject' });
  assert.equal(rejected.status, 409);
  assert.deepEqual(rejected.body, { error: 'MENU_CHANGED' });
});
