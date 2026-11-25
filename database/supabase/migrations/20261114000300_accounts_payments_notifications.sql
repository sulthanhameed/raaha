-- Email accounts are held in Supabase Auth (passwords are never stored here).
-- Requests remain pending until the restaurant reviews them, even after payment.
alter table public.order_requests
  add column customer_email text check (customer_email is null or char_length(customer_email) between 3 and 254),
  add column payment_method text not null default 'pay_later' check (payment_method in ('pay_later', 'razorpay')),
  add column payment_status text not null default 'unpaid' check (payment_status in ('unpaid', 'paid', 'partially_refunded', 'refunded'));

grant select (payment_method, payment_status) on public.order_requests to authenticated;

-- Private operational records: never grant the browser direct access.
create table public.payment_attempts (
  order_id uuid primary key references public.order_requests(id) on delete cascade,
  gateway_order_id text not null unique,
  amount_paise bigint not null check (amount_paise > 0),
  currency text not null default 'INR' check (currency = 'INR'),
  gateway_payment_id text unique,
  captured_at timestamptz,
  created_at timestamptz not null default now()
);
alter table public.payment_attempts enable row level security;
revoke all on public.payment_attempts from public, anon, authenticated;
grant select on public.payment_attempts to service_role;

create table public.order_email_jobs (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.order_requests(id) on delete cascade,
  event_type text not null check (event_type in ('request', 'payment')),
  recipient_kind text not null check (recipient_kind in ('restaurant', 'customer')),
  state text not null default 'pending' check (state in ('pending', 'sending', 'sent', 'failed')),
  attempts integer not null default 0,
  next_attempt_at timestamptz not null default now(),
  locked_until timestamptz,
  sent_at timestamptz,
  last_error text,
  created_at timestamptz not null default now(),
  unique (order_id, event_type, recipient_kind)
);
create index order_email_jobs_ready_idx on public.order_email_jobs (state, next_attempt_at);
alter table public.order_email_jobs enable row level security;
revoke all on public.order_email_jobs from public, anon, authenticated;
grant select on public.order_email_jobs, public.order_requests, public.order_request_items to service_role;

-- The old RPC is kept as an internal building block but cannot be called by a
-- browser. A confirmed Supabase Auth email is required for the new order flow.
revoke execute on function public.submit_order_request(uuid, text, text, text, jsonb) from authenticated;
create function public.submit_order_request_v2(
  p_request_id uuid, p_customer_name text, p_phone text, p_delivery_address text,
  p_items jsonb, p_payment_method text
) returns table (request_id uuid, created_at timestamptz, subtotal_inr bigint, status text, items jsonb, payment_method text, payment_status text)
language plpgsql security definer set search_path = '' as $$
declare
  v_user uuid := auth.uid();
  v_email text;
  v_row record;
  v_existing public.order_requests%rowtype;
begin
  if v_user is null then raise exception using errcode = '42501', message = 'AUTH_REQUIRED'; end if;
  select u.email into v_email from auth.users u where u.id = v_user and u.email_confirmed_at is not null;
  if v_email is null or char_length(v_email) not between 3 and 254 then
    raise exception using errcode = '42501', message = 'EMAIL_VERIFICATION_REQUIRED';
  end if;
  if p_payment_method is null or p_payment_method not in ('pay_later', 'razorpay') then
    raise exception using errcode = '22023', message = 'INVALID_PAYMENT_METHOD';
  end if;
  select * into v_row from public.submit_order_request(p_request_id, p_customer_name, p_phone, p_delivery_address, p_items);
  select * into v_existing from public.order_requests o where o.id = p_request_id and o.user_id = v_user;
  if v_existing.customer_email is null then
    update public.order_requests o set customer_email = v_email, payment_method = p_payment_method where o.id = p_request_id;
  elsif v_existing.customer_email <> v_email or v_existing.payment_method <> p_payment_method then
    raise exception using errcode = '22023', message = 'REQUEST_MISMATCH';
  end if;
  insert into public.order_email_jobs (order_id, event_type, recipient_kind)
  values (p_request_id, 'request', 'restaurant'), (p_request_id, 'request', 'customer')
  on conflict (order_id, event_type, recipient_kind) do nothing;
  return query select v_row.request_id, v_row.created_at, v_row.subtotal_inr, v_row.status, v_row.items,
    o.payment_method, o.payment_status from public.order_requests o where o.id = p_request_id;
end;
$$;
revoke all on function public.submit_order_request_v2(uuid, text, text, text, jsonb, text) from public, anon, authenticated;

-- Only the trusted Express server may create an order. It validates the bearer
-- token with Supabase Auth first and passes that user's ID, never a browser ID.
-- The internal v2 function rechecks the confirmed email and performs the
-- order/notification transaction. Both claim formats cover Supabase auth.uid()
-- variants; settings last only for this PostgREST transaction.
create function public.raaha_submit_order_for_user(
  p_user_id uuid, p_request_id uuid, p_customer_name text, p_phone text,
  p_delivery_address text, p_items jsonb, p_payment_method text
) returns table (request_id uuid, created_at timestamptz, subtotal_inr bigint, status text, items jsonb, payment_method text, payment_status text)
language plpgsql security definer set search_path = '' as $$
declare v_claims jsonb;
begin
  if p_user_id is null then raise exception using errcode = '42501', message = 'AUTH_REQUIRED'; end if;
  v_claims := coalesce(nullif(current_setting('request.jwt.claims', true), '')::jsonb, '{}'::jsonb);
  perform set_config('request.jwt.claim.sub', p_user_id::text, true);
  perform set_config('request.jwt.claims', jsonb_set(v_claims, '{sub}', to_jsonb(p_user_id::text), true)::text, true);
  return query select r.* from public.submit_order_request_v2(
    p_request_id, p_customer_name, p_phone, p_delivery_address, p_items, p_payment_method
  ) r;
end;
$$;
revoke all on function public.raaha_submit_order_for_user(uuid, uuid, text, text, text, jsonb, text) from public, anon, authenticated;
grant execute on function public.raaha_submit_order_for_user(uuid, uuid, text, text, text, jsonb, text) to service_role;

-- Concurrent gateway order creation may produce orphan gateway orders. Only the
-- one atomically stored here is ever returned to the customer for checkout.
create function public.raaha_register_gateway_order(p_order_id uuid, p_gateway_order_id text, p_amount_paise bigint)
returns table (gateway_order_id text, amount_paise bigint, currency text)
language plpgsql security definer set search_path = '' as $$
declare v_order public.order_requests%rowtype;
begin
  select * into v_order from public.order_requests o where o.id = p_order_id for update;
  if not found or v_order.status = 'closed' or v_order.payment_method <> 'razorpay' or v_order.payment_status <> 'unpaid'
    or p_gateway_order_id is null or p_gateway_order_id !~ '^order_[A-Za-z0-9]+$'
    or p_amount_paise is null or p_amount_paise <> v_order.subtotal_inr * 100 then
    raise exception using errcode = '22023', message = 'INVALID_PAYMENT_ORDER';
  end if;
  insert into public.payment_attempts (order_id, gateway_order_id, amount_paise)
  values (p_order_id, p_gateway_order_id, p_amount_paise)
  on conflict (order_id) do nothing;
  return query select p.gateway_order_id, p.amount_paise, p.currency from public.payment_attempts p where p.order_id = p_order_id;
end;
$$;

-- Called only after the server verifies Razorpay's signature AND independently
-- checks the captured payment, amount, currency and gateway order via its API.
create function public.raaha_record_capture(p_gateway_order_id text, p_gateway_payment_id text, p_amount_paise bigint)
returns boolean language plpgsql security definer set search_path = '' as $$
declare v_payment public.payment_attempts%rowtype;
begin
  select * into v_payment from public.payment_attempts p where p.gateway_order_id = p_gateway_order_id for update;
  if not found or p_gateway_payment_id is null or p_gateway_payment_id !~ '^pay_[A-Za-z0-9]+$'
    or p_amount_paise is null or p_amount_paise <> v_payment.amount_paise then
    raise exception using errcode = '22023', message = 'PAYMENT_MISMATCH';
  end if;
  if v_payment.gateway_payment_id is not null then
    if v_payment.gateway_payment_id <> p_gateway_payment_id then raise exception using errcode = '22023', message = 'PAYMENT_MISMATCH'; end if;
    return false;
  end if;
  update public.payment_attempts p set gateway_payment_id = p_gateway_payment_id, captured_at = now() where p.order_id = v_payment.order_id;
  update public.order_requests o set payment_status = 'paid' where o.id = v_payment.order_id and o.payment_method = 'razorpay';
  insert into public.order_email_jobs (order_id, event_type, recipient_kind)
  values (v_payment.order_id, 'payment', 'restaurant'), (v_payment.order_id, 'payment', 'customer')
  on conflict (order_id, event_type, recipient_kind) do nothing;
  return true;
end;
$$;

create function public.raaha_claim_email_jobs(p_limit integer default 10)
returns table (job_id uuid, order_id uuid, event_type text, recipient_kind text, attempts integer)
language sql security definer set search_path = '' as $$
  update public.order_email_jobs j set state = 'sending', attempts = j.attempts + 1, locked_until = now() + interval '2 minutes'
  where j.id in (
    select q.id from public.order_email_jobs q
    where (q.state = 'pending' and q.next_attempt_at <= now()) or (q.state = 'sending' and q.locked_until < now())
    order by q.created_at for update skip locked limit greatest(1, least(coalesce(p_limit, 10), 20))
  ) returning j.id, j.order_id, j.event_type, j.recipient_kind, j.attempts;
$$;
-- The attempt number is a lease token. A slow worker cannot finish a job that
-- has already been reclaimed by another worker after its lease expired.
create function public.raaha_finish_email_job(p_job_id uuid, p_attempt integer, p_success boolean, p_error text default '')
returns void language sql security definer set search_path = '' as $$
  update public.order_email_jobs j set
    state = case when p_success then 'sent' when j.attempts >= 10 then 'failed' else 'pending' end,
    sent_at = case when p_success then now() else null end,
    next_attempt_at = case when p_success then j.next_attempt_at else now() + interval '5 minutes' end,
    locked_until = null,
    last_error = case when p_success then null else left(coalesce(p_error, 'Delivery failed'), 200) end
  where j.id = p_job_id and j.state = 'sending' and j.attempts = p_attempt;
$$;

revoke all on function public.raaha_register_gateway_order(uuid, text, bigint) from public, anon, authenticated;
revoke all on function public.raaha_record_capture(text, text, bigint) from public, anon, authenticated;
revoke all on function public.raaha_claim_email_jobs(integer) from public, anon, authenticated;
revoke all on function public.raaha_finish_email_job(uuid, integer, boolean, text) from public, anon, authenticated;
grant execute on function public.raaha_register_gateway_order(uuid, text, bigint) to service_role;
grant execute on function public.raaha_record_capture(text, text, bigint) to service_role;
grant execute on function public.raaha_claim_email_jobs(integer) to service_role;
grant execute on function public.raaha_finish_email_job(uuid, integer, boolean, text) to service_role;
