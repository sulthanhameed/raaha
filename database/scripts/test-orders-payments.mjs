import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';

const ALICE = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const BOB = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const orderId = '11111111-1111-4111-8111-111111111111';
const item = JSON.stringify([{ id: 'egg-biryani', qty: 2, expected_price: 179 }]);

test('verified accounts, payment records and notification outbox', async (t) => {
  const db = new PGlite();
  await db.exec(`
    create role anon nologin;
    create role authenticated nologin;
    create role service_role nologin bypassrls;
    create schema auth;
    create table auth.users (id uuid primary key, email text, email_confirmed_at timestamptz);
    create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
    grant usage on schema auth to anon, authenticated, service_role;
    grant execute on function auth.uid() to anon, authenticated, service_role;
    insert into auth.users (id,email,email_confirmed_at) values ('${ALICE}','alice@example.test',now()), ('${BOB}','bob@example.test',null);
  `);
  for (const file of ['20261114000100_raaha_backend.sql','20261114000200_initial_catalog.sql','20261114000300_accounts_payments_notifications.sql']) {
    await db.exec(await readFile(new URL(`../supabase/migrations/${file}`, import.meta.url), 'utf8'));
  }
  const role = async (name, uid = '') => db.exec(`reset role; set role ${name}; select set_config('request.jwt.claim.sub', '${uid}', false);`);
  const submit = (user = ALICE, id = orderId, method = 'razorpay') => db.query('select * from public.raaha_submit_order_for_user($1,$2,$3,$4,$5,$6::jsonb,$7)', [user,id,'Alice','9876543210','123 Madurai Road',item,method]);
  try {
    await t.test('only verified email users can submit and retries do not duplicate notifications', async () => {
      await role('authenticated', ALICE);
      await assert.rejects(db.query('select * from public.submit_order_request($1,$2,$3,$4,$5::jsonb)', [orderId,'Alice','9876543210','123 Madurai Road',item]), /permission denied/);
      await assert.rejects(db.query('select * from public.submit_order_request_v2($1,$2,$3,$4,$5::jsonb,$6)', [orderId,'Alice','9876543210','123 Madurai Road',item,'razorpay']), /permission denied/);
      await assert.rejects(submit(), /permission denied/);
      await role('service_role');
      await assert.rejects(submit(BOB), /EMAIL_VERIFICATION_REQUIRED/);
      const row = (await submit()).rows[0];
      assert.equal(row.subtotal_inr, 358);
      assert.equal(row.payment_method, 'razorpay');
      assert.equal(row.payment_status, 'unpaid');
      assert.deepEqual((await submit()).rows[0], row);
      await assert.rejects(submit(ALICE, orderId, 'pay_later'), /REQUEST_MISMATCH/);
      await role('authenticated', ALICE);
      await assert.rejects(db.query('select * from public.order_email_jobs'), /permission denied/);
      await assert.rejects(db.query('select * from public.payment_attempts'), /permission denied/);
      await assert.rejects(db.query("select public.raaha_record_capture('order_x','pay_x',35800)"), /permission denied/);
      await role('service_role');
      assert.equal((await db.query('select count(*)::int n from public.order_email_jobs')).rows[0].n, 2);
    });
    await t.test('gateway registration and captures are amount-checked and idempotent', async () => {
      await role('service_role');
      await assert.rejects(db.query("select * from public.raaha_register_gateway_order($1,'order_bad',1)",[orderId]), /INVALID_PAYMENT_ORDER/);
      const registered = (await db.query("select * from public.raaha_register_gateway_order($1,'order_ABC123',35800)",[orderId])).rows[0];
      assert.equal(registered.gateway_order_id, 'order_ABC123');
      const concurrent = (await db.query("select * from public.raaha_register_gateway_order($1,'order_DEF456',35800)",[orderId])).rows[0];
      assert.equal(concurrent.gateway_order_id, 'order_ABC123');
      await assert.rejects(db.query("select public.raaha_record_capture('order_ABC123','pay_ABC123',1)"), /PAYMENT_MISMATCH/);
      await assert.rejects(db.query("select public.raaha_record_capture('order_ABC123','pay_ABC123',null)"), /PAYMENT_MISMATCH/);
      assert.equal((await db.query("select public.raaha_record_capture('order_ABC123','pay_ABC123',35800) done")).rows[0].done, true);
      assert.equal((await db.query("select public.raaha_record_capture('order_ABC123','pay_ABC123',35800) done")).rows[0].done, false);
      await assert.rejects(db.query("select public.raaha_record_capture('order_ABC123','pay_OTHER',35800)"), /PAYMENT_MISMATCH/);
      assert.equal((await db.query('select payment_status from public.order_requests where id=$1',[orderId])).rows[0].payment_status, 'paid');
      assert.equal((await db.query('select count(*)::int n from public.order_email_jobs')).rows[0].n, 4);
      await role('authenticated', ALICE);
      assert.equal((await db.query('select payment_status from public.order_requests where id=$1',[orderId])).rows[0].payment_status, 'paid');
      await role('authenticated', BOB);
      assert.equal((await db.query('select payment_status from public.order_requests where id=$1',[orderId])).rows.length, 0);
    });
    await t.test('notification jobs are claimed once and can be retried safely', async () => {
      await role('service_role');
      const jobs = (await db.query('select * from public.raaha_claim_email_jobs(10)')).rows;
      assert.equal(jobs.length, 4);
      assert.equal((await db.query('select * from public.raaha_claim_email_jobs(10)')).rows.length, 0);
      // A stale lease cannot complete another worker's delivery.
      await db.query('select public.raaha_finish_email_job($1,$2,true,$3)', [jobs[0].job_id, jobs[0].attempts - 1, '']);
      assert.equal((await db.query('select state from public.order_email_jobs where id=$1', [jobs[0].job_id])).rows[0].state, 'sending');
      await db.query('select public.raaha_finish_email_job($1,$2,true,$3)', [jobs[0].job_id, jobs[0].attempts, '']);
      await db.query('select public.raaha_finish_email_job($1,$2,false,$3)', [jobs[1].job_id, jobs[1].attempts, 'Temporary delivery failure']);
      const states = (await db.query('select state from public.order_email_jobs where id=any($1::uuid[]) order by state', [[jobs[0].job_id,jobs[1].job_id]])).rows.map((r) => r.state);
      assert.deepEqual(states, ['pending','sent']);
    });
  } finally { await db.close(); }
});
