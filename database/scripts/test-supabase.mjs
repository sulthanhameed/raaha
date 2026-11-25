// Run the actual migrations and authorization policies against embedded
// PostgreSQL. The small auth shim mimics Supabase's verified JWT uid; this is
// not a replacement for an integration test against a real Supabase project.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";

const ALICE = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const BOB = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const id = (n) => `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
const item = (id, qty, expected_price) => ({ id, qty, expected_price });

test("Supabase schema, request transactions, prices, moderation and row security", async (t) => {
  const db = new PGlite();
  await db.exec(`
    create role anon nologin;
    create role authenticated nologin;
    create role service_role nologin bypassrls;
    create schema auth;
    create table auth.users (id uuid primary key);
    create function auth.uid() returns uuid language sql stable as $$
      select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid
    $$;
    grant usage on schema auth to anon, authenticated;
    grant execute on function auth.uid() to anon, authenticated;
    insert into auth.users (id) values ('${ALICE}'), ('${BOB}');
  `);
  for (const file of ["20261114000100_raaha_backend.sql", "20261114000200_initial_catalog.sql"]) {
    await db.exec(await readFile(new URL(`../supabase/migrations/${file}`, import.meta.url), "utf8"));
  }

  const role = async (name, uid = "") => {
    await db.exec(`reset role; set role ${name}; select set_config('request.jwt.claim.sub', '${uid}', false);`);
  };
  const admin = () => db.exec("reset role");
  const order = (requestId, lines = [item("egg-biryani", 2, 179)], name = "Alice") => db.query(
    "select * from public.submit_order_request($1, $2, $3, $4, $5::jsonb)",
    [requestId, name, "+91 98765 43210", "123 Gokhale Road, Madurai", JSON.stringify(lines)]
  );
  const reservation = (requestId, guests = 4, date = "(now() at time zone 'Asia/Kolkata')::date + 1") => db.query(
    `select * from public.submit_reservation_request($1, $2, $3, $4, ${date}, '19:15'::time, $5, $6)`,
    [requestId, "Alice", "+91 98765 43210", guests, "Birthday", "Window seat"]
  );
  const review = (requestId, text = "Lovely dish") => db.query(
    "select * from public.submit_dish_review($1, $2, $3, $4, $5)", [requestId, "egg-biryani", "Alice", text, 5]
  );

  try {
    await t.test("initial catalogue is public but clients cannot mutate it or private tables", async () => {
      await role("anon");
      assert.equal((await db.query("select count(*)::int n from public.categories")).rows[0].n, 8);
      assert.equal((await db.query("select count(*)::int n from public.menu_items")).rows[0].n, 48);
      await assert.rejects(db.query("update public.menu_items set price_inr = 1 where id = 'egg-biryani'"), /permission denied/);
      await assert.rejects(db.query("select * from public.order_requests"), /permission denied/);
      await assert.rejects(order(id(1)), /permission denied/);
      await assert.rejects(db.query("select * from public.reservation_requests"), /permission denied/);
      await assert.rejects(db.query("select * from public.dish_reviews"), /permission denied/);
      await assert.rejects(db.query("select * from raaha_private.submission_windows"), /permission denied/);
    });

    await t.test("profile RLS is isolated between anonymous Auth users", async () => {
      await role("authenticated", ALICE);
      await db.query("insert into public.guest_profiles (user_id, name, phone) values ($1, $2, $3)", [ALICE, "Alice", "9876543210"]);
      await assert.rejects(db.query("insert into public.guest_profiles (user_id, name, phone) values ($1, $2, $3)", [BOB, "Bob", "9876543210"]), /row-level security/);
      await assert.rejects(db.query("update public.guest_profiles set phone = '12' where user_id = $1", [ALICE]), /check constraint/);
      await role("authenticated", BOB);
      assert.equal((await db.query("select * from public.guest_profiles")).rows.length, 0);
      const update = await db.query("update public.guest_profiles set name = 'Intruder' where user_id = $1 returning name", [ALICE]);
      assert.equal(update.rows.length, 0);
    });

    await t.test("order writes are atomic, idempotent and priced from locked catalogue rows", async () => {
      await role("authenticated", ALICE);
      const lines = [item("egg-biryani", 2, 179), item("chicken-65", 1, 229)];
      const first = (await order(id(1), lines)).rows[0];
      assert.equal(first.request_id, id(1));
      assert.equal(first.subtotal_inr, 587);
      assert.equal(first.status, "pending");
      assert.deepEqual(first.items.map((i) => [i.id, i.qty, i.price]), [["egg-biryani", 2, 179], ["chicken-65", 1, 229]]);
      assert.deepEqual((await order(id(1), lines)).rows[0], first);
      await assert.rejects(order(id(1), lines, "Different name"), /REQUEST_MISMATCH/);
      await assert.rejects(order(id(2), [item("egg-biryani", 1, 1)]), /MENU_CHANGED/);
      await assert.rejects(order(id(3), [item("egg-biryani", 21, 179)]), /INVALID_ITEMS/);
      await assert.rejects(order(id(4), [item("egg-biryani", 1, 179), item("egg-biryani", 1, 179)]), /INVALID_ITEMS/);
      await assert.rejects(db.query("select * from public.submit_order_request($1,$2,$3,$4,$5::jsonb)", [id(5), "A", "123", "Address", "{}"]), /INVALID_ITEMS/);
      await assert.rejects(db.query("insert into public.order_requests (id, customer_name, phone, delivery_address, subtotal_inr, request_hash) values ($1,'A','9876543210','address',1,'x')", [id(6)]), /permission denied/);
      await assert.rejects(db.query("select phone, internal_notes, request_hash from public.order_requests"), /permission denied/);
      assert.equal((await db.query("select id, customer_name, subtotal_inr from public.order_requests")).rows.length, 1);
      assert.equal((await db.query("select item_id, quantity, unit_price_inr from public.order_request_items")).rows.length, 2);
      await role("authenticated", BOB);
      assert.equal((await db.query("select id from public.order_requests")).rows.length, 0);
      assert.equal((await db.query("select item_id from public.order_request_items")).rows.length, 0);
      await assert.rejects(order(id(1), lines), /INVALID_REQUEST/);
      await admin();
      await db.query("update public.menu_items set price_inr=199 where id='egg-biryani'");
      const snapshots = (await db.query("select unit_price_inr from public.order_request_items where item_id='egg-biryani'")).rows;
      assert.equal(snapshots[0].unit_price_inr, 179);
      await role("authenticated", ALICE);
      await assert.rejects(order(id(7), [item("egg-biryani", 1, 179)]), /MENU_CHANGED/);
      assert.equal((await order(id(1), lines)).rows[0].subtotal_inr, 587);
      await admin();
      await db.query("update public.menu_items set price_inr=179, is_available=false where id='egg-biryani'");
      await role("authenticated", ALICE);
      assert.equal((await db.query("select id from public.menu_items where id='egg-biryani'")).rows.length, 0);
      await assert.rejects(order(id(8), [item("egg-biryani", 1, 179)]), /MENU_CHANGED/);
      await admin();
      await db.query("update public.menu_items set is_available=true where id='egg-biryani'");
    });

    await t.test("reservation validation uses future Madurai time and does not leak contacts", async () => {
      await role("authenticated", ALICE);
      const first = (await reservation(id(20))).rows[0];
      assert.equal(first.request_id, id(20));
      assert.deepEqual((await reservation(id(20))).rows[0], first);
      await assert.rejects(reservation(id(20), 8), /REQUEST_MISMATCH/);
      await assert.rejects(reservation(id(21), 0), /INVALID_CONTACT/);
      await assert.rejects(reservation(id(22), 4, "(now() at time zone 'Asia/Kolkata')::date - 1"), /INVALID_DATE/);
      await assert.rejects(reservation(id(23), 4, "(now() at time zone 'Asia/Kolkata')::date + 367"), /INVALID_DATE/);
      await assert.rejects(db.query("select * from public.reservation_requests"), /permission denied/);
      await role("authenticated", BOB);
      await assert.rejects(reservation(id(20)), /INVALID_REQUEST/);
      await admin();
      const rows = (await db.query("select customer_name, guest_count, status from public.reservation_requests")).rows;
      assert.deepEqual(rows, [{ customer_name: "Alice", guest_count: 4, status: "pending" }]);
    });

    await t.test("only approved reviews or the owner's pending reviews are visible", async () => {
      await role("authenticated", ALICE);
      assert.equal((await review(id(30))).rows[0].review_id, id(30));
      assert.equal((await review(id(30))).rows[0].review_id, id(30));
      await assert.rejects(review(id(30), "Edited"), /REQUEST_MISMATCH/);
      const own = (await db.query("select * from public.get_dish_reviews('egg-biryani')")).rows;
      assert.equal(own.length, 1);
      assert.equal(own[0].status, "pending");
      assert.equal(own[0].is_mine, true);
      assert.equal("user_id" in own[0], false);
      await role("authenticated", BOB);
      assert.equal((await db.query("select * from public.get_dish_reviews('egg-biryani')")).rows.length, 0);
      assert.equal((await db.query("select public.delete_own_review($1) as deleted", [id(30)])).rows[0].deleted, false);
      await admin();
      await db.query("update public.dish_reviews set status='published' where id=$1", [id(30)]);
      await role("anon");
      const publicReviews = (await db.query("select * from public.get_dish_reviews('egg-biryani')")).rows;
      assert.equal(publicReviews.length, 1);
      assert.equal(publicReviews[0].is_mine, false);
      await role("authenticated", ALICE);
      assert.equal((await db.query("select public.delete_own_review($1) as deleted", [id(30)])).rows[0].deleted, true);
      assert.equal((await db.query("select * from public.get_dish_reviews('egg-biryani')")).rows.length, 0);
    });

    await t.test("per-guest limits survive review deletion and do not block idempotent retries", async () => {
      await role("authenticated", ALICE);
      for (let n = 31; n <= 34; n++) {
        await review(id(n));
        await db.query("select public.delete_own_review($1)", [id(n)]);
      }
      await assert.rejects(review(id(35)), /RATE_LIMITED/);
      for (let n = 40; n <= 43; n++) await order(id(n));
      await assert.rejects(order(id(44)), /RATE_LIMITED/);
      const firstLines = [item("egg-biryani", 2, 179), item("chicken-65", 1, 229)];
      assert.equal((await order(id(1), firstLines)).rows[0].subtotal_inr, 587);
    });

    await t.test("deleting a guest leaves restaurant requests but removes guest profile", async () => {
      await admin();
      await db.query("delete from auth.users where id=$1", [ALICE]);
      const orderRows = (await db.query("select user_id, status from public.order_requests where id=$1", [id(1)])).rows;
      assert.deepEqual(orderRows, [{ user_id: null, status: "pending" }]);
      assert.equal((await db.query("select * from public.guest_profiles where user_id=$1", [ALICE])).rows.length, 0);
      assert.equal((await db.query("select * from public.reservation_requests where id=$1", [id(20)])).rows.length, 1);
      await role("authenticated", BOB);
      assert.equal((await db.query("select id from public.order_requests where id=$1", [id(1)])).rows.length, 0);
    });
  } finally {
    await db.close();
  }
});
