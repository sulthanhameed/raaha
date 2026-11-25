-- Raaha's guest-facing backend. All private writes go through constrained
-- functions; a publishable key alone never grants access to restaurant data.

create table public.categories (
  id text primary key check (id ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(id) <= 80),
  name text not null check (char_length(btrim(name)) between 1 and 100),
  tagline text not null,
  description text not null,
  image_url text not null,
  position integer not null default 0
);

create table public.menu_items (
  id text primary key check (id ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(id) <= 80),
  category_id text not null references public.categories(id) on delete restrict,
  name text not null check (char_length(btrim(name)) between 1 and 150),
  description text not null,
  price_inr integer not null check (price_inr between 1 and 100000),
  vegetarian boolean not null,
  ingredients text[] not null default '{}',
  image_url text not null,
  sample_rating numeric(2,1) not null default 0 check (sample_rating between 0 and 5),
  sample_rating_count integer not null default 0 check (sample_rating_count >= 0),
  prep_time text not null,
  serves text not null,
  spice text not null check (spice in ('None', 'Mild', 'Medium', 'Hot')),
  calories text not null,
  tag text check (tag in ('Bestseller', 'Chef''s Special', 'Must Try', 'New')),
  position integer not null default 0,
  is_available boolean not null default true
);

-- A guest profile is tied to an anonymous Auth session, not a verified account.
create table public.guest_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  name text not null check (char_length(btrim(name)) between 1 and 100),
  phone text not null check (
    char_length(phone) <= 30 and phone ~ '^[0-9+(). -]+$'
    and char_length(regexp_replace(phone, '[^0-9]', '', 'g')) between 7 and 15
  )
);

-- Fixed-window limits survive review deletion. This schema is not exposed by
-- the Data API; signup/IP limits and additional bot protection are still needed.
create schema raaha_private;
revoke all on schema raaha_private from public, anon, authenticated;
create table raaha_private.submission_windows (
  user_id uuid not null references auth.users(id) on delete cascade,
  kind text not null,
  started_at timestamptz not null,
  submission_count integer not null,
  primary key (user_id, kind)
);

create function raaha_private.check_submission_limit(p_user uuid, p_kind text, p_limit integer, p_window interval)
returns void language plpgsql set search_path = '' as $$
declare v_count integer;
begin
  insert into raaha_private.submission_windows as w (user_id, kind, started_at, submission_count)
  values (p_user, p_kind, now(), 1)
  on conflict (user_id, kind) do update set
    started_at = case when w.started_at <= now() - p_window then now() else w.started_at end,
    submission_count = case when w.started_at <= now() - p_window then 1 else w.submission_count + 1 end
  returning submission_count into v_count;
  if v_count > p_limit then raise exception using errcode = 'P0001', message = 'RATE_LIMITED'; end if;
end;
$$;
revoke all on function raaha_private.check_submission_limit(uuid, text, integer, interval) from public, anon, authenticated;

-- Keep restaurant requests if an anonymous Auth user is removed. Such a request
-- becomes inaccessible to the original browser but remains visible to staff.
create table public.order_requests (
  id uuid primary key,
  user_id uuid references auth.users(id) on delete set null,
  customer_name text not null check (char_length(btrim(customer_name)) between 1 and 100),
  phone text not null check (
    char_length(phone) <= 30 and phone ~ '^[0-9+(). -]+$'
    and char_length(regexp_replace(phone, '[^0-9]', '', 'g')) between 7 and 15
  ),
  delivery_address text not null check (char_length(btrim(delivery_address)) between 5 and 500),
  subtotal_inr bigint not null check (subtotal_inr > 0),
  status text not null default 'pending' check (status in ('pending', 'contacted', 'closed')),
  request_hash text not null,
  internal_notes text,
  created_at timestamptz not null default now()
);

create table public.order_request_items (
  order_id uuid not null references public.order_requests(id) on delete cascade,
  item_id text not null references public.menu_items(id) on delete restrict,
  item_name text not null,
  quantity integer not null check (quantity between 1 and 20),
  unit_price_inr integer not null check (unit_price_inr > 0),
  position integer not null,
  primary key (order_id, item_id)
);

create table public.reservation_requests (
  id uuid primary key,
  user_id uuid references auth.users(id) on delete set null,
  customer_name text not null check (char_length(btrim(customer_name)) between 1 and 100),
  phone text not null check (
    char_length(phone) <= 30 and phone ~ '^[0-9+(). -]+$'
    and char_length(regexp_replace(phone, '[^0-9]', '', 'g')) between 7 and 15
  ),
  guest_count integer not null check (guest_count between 1 and 100),
  preferred_date date not null,
  preferred_time time not null,
  occasion text not null check (char_length(occasion) <= 60),
  message text not null default '' check (char_length(message) <= 500),
  status text not null default 'pending' check (status in ('pending', 'contacted', 'closed')),
  request_hash text not null,
  internal_notes text,
  created_at timestamptz not null default now()
);

create table public.dish_reviews (
  id uuid primary key,
  user_id uuid references auth.users(id) on delete set null,
  item_id text not null references public.menu_items(id) on delete restrict,
  author_name text not null check (char_length(btrim(author_name)) between 1 and 60),
  review_text text not null check (char_length(btrim(review_text)) between 1 and 600),
  rating integer not null check (rating between 1 and 5),
  status text not null default 'pending' check (status in ('pending', 'published', 'hidden')),
  request_hash text not null,
  created_at timestamptz not null default now()
);

create index menu_items_category_position_idx on public.menu_items (category_id, position);
create index order_requests_owner_created_idx on public.order_requests (user_id, created_at desc);
create index reservation_requests_owner_created_idx on public.reservation_requests (user_id, created_at desc);
create index dish_reviews_item_status_created_idx on public.dish_reviews (item_id, status, created_at desc);
create index dish_reviews_owner_created_idx on public.dish_reviews (user_id, created_at desc);

alter table public.categories enable row level security;
alter table public.menu_items enable row level security;
alter table public.guest_profiles enable row level security;
alter table public.order_requests enable row level security;
alter table public.order_request_items enable row level security;
alter table public.reservation_requests enable row level security;
alter table public.dish_reviews enable row level security;

-- Supabase projects may grant public schema privileges by default; replace
-- them with only the access the application needs.
revoke all on public.categories, public.menu_items, public.guest_profiles,
  public.order_requests, public.order_request_items, public.reservation_requests,
  public.dish_reviews from public, anon, authenticated;

grant select on public.categories, public.menu_items to anon, authenticated;
create policy categories_public_read on public.categories for select to anon, authenticated using (true);
create policy available_menu_public_read on public.menu_items for select to anon, authenticated using (is_available);

grant select, insert, update, delete on public.guest_profiles to authenticated;
create policy guest_profile_owner on public.guest_profiles for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

-- Restaurant notes, phone numbers, idempotency hashes and owner IDs are not
-- exposed through the browser API, even to the request's own visitor.
grant select (id, customer_name, delivery_address, subtotal_inr, status, created_at)
  on public.order_requests to authenticated;
create policy order_owner_read on public.order_requests for select to authenticated
  using (user_id = (select auth.uid()));
grant select (order_id, item_id, item_name, quantity, unit_price_inr, position)
  on public.order_request_items to authenticated;
create policy order_item_owner_read on public.order_request_items for select to authenticated
  using (exists (select 1 from public.order_requests o where o.id = order_id));

-- Reservations and reviews have no direct client table grants. Reviews are
-- returned through a deliberately narrow function that omits all owner IDs.

create function public.submit_order_request(
  p_request_id uuid, p_customer_name text, p_phone text, p_delivery_address text, p_items jsonb
) returns table (request_id uuid, created_at timestamptz, subtotal_inr bigint, status text, items jsonb)
language plpgsql security definer set search_path = '' as $$
declare
  v_user uuid := auth.uid();
  v_hash text;
  v_existing public.order_requests%rowtype;
  v_line jsonb;
  v_id text;
  v_qty integer;
  v_expected integer;
  v_item public.menu_items%rowtype;
  v_seen text[] := '{}';
  v_subtotal bigint := 0;
  v_quantity integer := 0;
begin
  if v_user is null then raise exception using errcode = '42501', message = 'AUTH_REQUIRED'; end if;
  if p_request_id is null then raise exception using errcode = '22023', message = 'INVALID_REQUEST'; end if;
  if p_items is null or jsonb_typeof(p_items) is distinct from 'array' then
    raise exception using errcode = '22023', message = 'INVALID_ITEMS';
  end if;
  if jsonb_array_length(p_items) not between 1 and 50 or octet_length(p_items::text) > 20000 then
    raise exception using errcode = '22023', message = 'INVALID_ITEMS';
  end if;
  v_hash := encode(sha256(convert_to(jsonb_build_object(
    'name', btrim(p_customer_name), 'phone', btrim(p_phone), 'address', btrim(p_delivery_address), 'items', p_items
  )::text, 'UTF8')), 'hex');

  -- One lock per user makes idempotent retries and rate limits race-safe.
  perform pg_advisory_xact_lock(hashtextextended('order:' || v_user::text, 0));
  select * into v_existing from public.order_requests o where o.id = p_request_id and o.user_id = v_user;
  if found then
    if v_existing.request_hash <> v_hash then raise exception using errcode = '22023', message = 'REQUEST_MISMATCH'; end if;
    return query select v_existing.id, v_existing.created_at, v_existing.subtotal_inr, v_existing.status,
      (select coalesce(jsonb_agg(jsonb_build_object('id', i.item_id, 'name', i.item_name,
        'qty', i.quantity, 'price', i.unit_price_inr) order by i.position), '[]'::jsonb)
        from public.order_request_items i where i.order_id = v_existing.id);
    return;
  end if;
  if exists (select 1 from public.order_requests o where o.id = p_request_id) then
    raise exception using errcode = '22023', message = 'INVALID_REQUEST';
  end if;
  perform raaha_private.check_submission_limit(v_user, 'order', 5, interval '15 minutes');
  if p_customer_name is null or char_length(btrim(p_customer_name)) not between 1 and 100
    or p_phone is null or char_length(btrim(p_phone)) > 30 or btrim(p_phone) !~ '^[0-9+(). -]+$'
    or char_length(regexp_replace(p_phone, '[^0-9]', '', 'g')) not between 7 and 15
    or p_delivery_address is null or char_length(btrim(p_delivery_address)) not between 5 and 500 then
    raise exception using errcode = '22023', message = 'INVALID_CONTACT';
  end if;

  for v_line in select value from jsonb_array_elements(p_items) loop
    if jsonb_typeof(v_line) is distinct from 'object'
      or jsonb_typeof(v_line->'id') is distinct from 'string'
      or jsonb_typeof(v_line->'qty') is distinct from 'number'
      or jsonb_typeof(v_line->'expected_price') is distinct from 'number'
      or (v_line->>'id') !~ '^[a-z0-9]+(-[a-z0-9]+)*$'
      or char_length(v_line->>'id') > 80
      or (v_line->>'qty') !~ '^([1-9]|1[0-9]|20)$'
      or (v_line->>'expected_price') !~ '^[1-9][0-9]{0,5}$' then
      raise exception using errcode = '22023', message = 'INVALID_ITEMS';
    end if;
    v_id := v_line->>'id';
    v_qty := (v_line->>'qty')::integer;
    v_expected := (v_line->>'expected_price')::integer;
    if v_id = any(v_seen) then raise exception using errcode = '22023', message = 'INVALID_ITEMS'; end if;
    v_seen := array_append(v_seen, v_id);
    v_quantity := v_quantity + v_qty;
    if v_quantity > 100 then raise exception using errcode = '22023', message = 'INVALID_ITEMS'; end if;
    -- Lock catalogue rows through the transaction: a concurrent price edit
    -- cannot change the snapshot between validation and insertion.
    select * into v_item from public.menu_items m where m.id = v_id and m.is_available for share;
    if not found or v_item.price_inr <> v_expected then
      raise exception using errcode = 'P0001', message = 'MENU_CHANGED';
    end if;
    v_subtotal := v_subtotal + v_item.price_inr::bigint * v_qty;
  end loop;

  insert into public.order_requests (id, user_id, customer_name, phone, delivery_address, subtotal_inr, request_hash)
  values (p_request_id, v_user, btrim(p_customer_name), btrim(p_phone), btrim(p_delivery_address), v_subtotal, v_hash);
  insert into public.order_request_items (order_id, item_id, item_name, quantity, unit_price_inr, position)
  select p_request_id, m.id, m.name, (e.value->>'qty')::integer, m.price_inr, e.ordinality::integer
  from jsonb_array_elements(p_items) with ordinality e(value, ordinality)
  join public.menu_items m on m.id = e.value->>'id';
  return query select o.id, o.created_at, o.subtotal_inr, o.status,
    (select coalesce(jsonb_agg(jsonb_build_object('id', i.item_id, 'name', i.item_name,
      'qty', i.quantity, 'price', i.unit_price_inr) order by i.position), '[]'::jsonb)
      from public.order_request_items i where i.order_id = o.id)
    from public.order_requests o where o.id = p_request_id;
end;
$$;

create function public.submit_reservation_request(
  p_request_id uuid, p_customer_name text, p_phone text, p_guest_count integer,
  p_preferred_date date, p_preferred_time time, p_occasion text, p_message text
) returns table (request_id uuid, created_at timestamptz)
language plpgsql security definer set search_path = '' as $$
declare
  v_user uuid := auth.uid();
  v_hash text;
  v_existing public.reservation_requests%rowtype;
  v_now timestamp := now() at time zone 'Asia/Kolkata';
begin
  if v_user is null then raise exception using errcode = '42501', message = 'AUTH_REQUIRED'; end if;
  if p_request_id is null then raise exception using errcode = '22023', message = 'INVALID_REQUEST'; end if;
  v_hash := encode(sha256(convert_to(jsonb_build_object(
    'name', btrim(p_customer_name), 'phone', btrim(p_phone), 'guests', p_guest_count,
    'date', p_preferred_date, 'time', p_preferred_time, 'occasion', btrim(coalesce(p_occasion, '')),
    'message', btrim(coalesce(p_message, ''))
  )::text, 'UTF8')), 'hex');
  perform pg_advisory_xact_lock(hashtextextended('reservation:' || v_user::text, 0));
  select * into v_existing from public.reservation_requests r where r.id = p_request_id and r.user_id = v_user;
  if found then
    if v_existing.request_hash <> v_hash then raise exception using errcode = '22023', message = 'REQUEST_MISMATCH'; end if;
    return query select v_existing.id, v_existing.created_at;
    return;
  end if;
  if exists (select 1 from public.reservation_requests r where r.id = p_request_id) then
    raise exception using errcode = '22023', message = 'INVALID_REQUEST';
  end if;
  perform raaha_private.check_submission_limit(v_user, 'reservation', 5, interval '15 minutes');
  if p_customer_name is null or char_length(btrim(p_customer_name)) not between 1 and 100
    or p_phone is null or char_length(btrim(p_phone)) > 30 or btrim(p_phone) !~ '^[0-9+(). -]+$'
    or char_length(regexp_replace(p_phone, '[^0-9]', '', 'g')) not between 7 and 15
    or p_guest_count is null or p_guest_count not between 1 and 100
    or char_length(btrim(coalesce(p_occasion, ''))) > 60
    or char_length(btrim(coalesce(p_message, ''))) > 500 then
    raise exception using errcode = '22023', message = 'INVALID_CONTACT';
  end if;
  if p_preferred_date is null or p_preferred_time is null or p_preferred_time >= time '24:00'
    or p_preferred_date > v_now::date + 366 or p_preferred_date + p_preferred_time <= v_now then
    raise exception using errcode = '22023', message = 'INVALID_DATE';
  end if;
  insert into public.reservation_requests
    (id, user_id, customer_name, phone, guest_count, preferred_date, preferred_time, occasion, message, request_hash)
  values (p_request_id, v_user, btrim(p_customer_name), btrim(p_phone), p_guest_count,
    p_preferred_date, p_preferred_time, btrim(coalesce(p_occasion, '')), btrim(coalesce(p_message, '')), v_hash);
  return query select r.id, r.created_at from public.reservation_requests r where r.id = p_request_id;
end;
$$;

create function public.submit_dish_review(
  p_request_id uuid, p_item_id text, p_author_name text, p_review_text text, p_rating integer
) returns table (review_id uuid, created_at timestamptz)
language plpgsql security definer set search_path = '' as $$
declare
  v_user uuid := auth.uid();
  v_hash text;
  v_existing public.dish_reviews%rowtype;
begin
  if v_user is null then raise exception using errcode = '42501', message = 'AUTH_REQUIRED'; end if;
  if p_request_id is null then raise exception using errcode = '22023', message = 'INVALID_REQUEST'; end if;
  v_hash := encode(sha256(convert_to(jsonb_build_object(
    'item', p_item_id, 'name', btrim(p_author_name), 'text', btrim(p_review_text), 'rating', p_rating
  )::text, 'UTF8')), 'hex');
  perform pg_advisory_xact_lock(hashtextextended('review:' || v_user::text, 0));
  select * into v_existing from public.dish_reviews r where r.id = p_request_id and r.user_id = v_user;
  if found then
    if v_existing.request_hash <> v_hash then raise exception using errcode = '22023', message = 'REQUEST_MISMATCH'; end if;
    return query select v_existing.id, v_existing.created_at;
    return;
  end if;
  if exists (select 1 from public.dish_reviews r where r.id = p_request_id) then
    raise exception using errcode = '22023', message = 'INVALID_REQUEST';
  end if;
  perform raaha_private.check_submission_limit(v_user, 'review', 5, interval '1 hour');
  if p_item_id is null or not exists (select 1 from public.menu_items m where m.id = p_item_id and m.is_available)
    or p_author_name is null or char_length(btrim(p_author_name)) not between 1 and 60
    or p_review_text is null or char_length(btrim(p_review_text)) not between 1 and 600
    or p_rating is null or p_rating not between 1 and 5 then
    raise exception using errcode = '22023', message = 'INVALID_REVIEW';
  end if;
  insert into public.dish_reviews (id, user_id, item_id, author_name, review_text, rating, request_hash)
  values (p_request_id, v_user, p_item_id, btrim(p_author_name), btrim(p_review_text), p_rating, v_hash);
  return query select r.id, r.created_at from public.dish_reviews r where r.id = p_request_id;
end;
$$;

-- Everyone can read published reviews, and the current guest can also see
-- their own pending reviews. No Auth UUIDs or internal data are returned.
create function public.get_dish_reviews(p_item_id text)
returns table (id uuid, author_name text, review_text text, rating integer, created_at timestamptz, status text, is_mine boolean)
language sql stable security definer set search_path = '' as $$
  select r.id, r.author_name, r.review_text, r.rating, r.created_at, r.status,
    coalesce(r.user_id = auth.uid(), false) as is_mine
  from public.dish_reviews r
  where r.item_id = p_item_id
    and (r.status = 'published' or (r.status = 'pending' and r.user_id = auth.uid()))
  order by r.created_at desc limit 100;
$$;

create function public.delete_own_review(p_review_id uuid) returns boolean
language plpgsql security definer set search_path = '' as $$
declare v_user uuid := auth.uid();
begin
  if v_user is null then raise exception using errcode = '42501', message = 'AUTH_REQUIRED'; end if;
  delete from public.dish_reviews r where r.id = p_review_id and r.user_id = v_user;
  return found;
end;
$$;

revoke all on function public.submit_order_request(uuid, text, text, text, jsonb) from public, anon, authenticated;
revoke all on function public.submit_reservation_request(uuid, text, text, integer, date, time, text, text) from public, anon, authenticated;
revoke all on function public.submit_dish_review(uuid, text, text, text, integer) from public, anon, authenticated;
revoke all on function public.get_dish_reviews(text) from public, anon, authenticated;
revoke all on function public.delete_own_review(uuid) from public, anon, authenticated;
grant execute on function public.submit_order_request(uuid, text, text, text, jsonb) to authenticated;
grant execute on function public.submit_reservation_request(uuid, text, text, integer, date, time, text, text) to authenticated;
grant execute on function public.submit_dish_review(uuid, text, text, text, integer) to authenticated;
grant execute on function public.get_dish_reviews(text) to anon, authenticated;
grant execute on function public.delete_own_review(uuid) to authenticated;
