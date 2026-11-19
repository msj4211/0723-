-- 파트너 전용몰 (승인된 회원 전용 · 계좌이체 주문) (2026-11-19)
-- Supabase 대시보드 > SQL Editor에 붙여넣고 Run 한 번. 다시 실행해도 안전하다.
--
-- 1) products.partner_price : 파트너 전용몰 판매가. 비어 있으면 전용몰에 안 나온다.
-- 2) shop_settings : 입금 계좌·배송비·입금 기한·알림 주소 (관리자가 사이트에서 수정)
-- 3) orders : 주문. 가격은 서버가 products 표에서 다시 계산해서 저장한다
--    (화면에서 가격을 바꿔 보내도 소용없음)
-- 4) 함수: 회원용(설정 보기, 주문하기, 내 주문 보기, 입금 전 취소)
--          관리자용(주문 목록, 주문 상태 바꾸기, 설정 저장, 전용몰 가격 저장)
-- 기존 회원·상품 데이터는 바뀌지 않는다.

begin;

alter table public.products add column if not exists partner_price integer;

create table if not exists public.shop_settings (
  id integer primary key default 1 check (id = 1),
  bank_name text,
  account_number text,
  account_holder text,
  shipping_fee integer not null default 0,
  free_shipping_over integer,
  deposit_days integer not null default 3,
  notice text,
  order_webhook_url text,
  updated_at timestamptz not null default now()
);
insert into public.shop_settings (id) values (1) on conflict (id) do nothing;
alter table public.shop_settings enable row level security;
revoke all on public.shop_settings from anon, authenticated;

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  order_no text unique not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  items jsonb not null,
  items_total integer not null,
  shipping_fee integer not null default 0,
  total integer not null,
  recipient_name text not null,
  recipient_phone text not null,
  address text not null,
  depositor_name text not null,
  memo text,
  status text not null default 'pending_payment'
    check (status in ('pending_payment', 'paid', 'shipped', 'cancelled')),
  tracking text,
  admin_memo text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.orders enable row level security;
revoke all on public.orders from anon, authenticated;
drop policy if exists "Members can view own orders" on public.orders;
create policy "Members can view own orders" on public.orders
  for select to authenticated using (user_id = auth.uid());
grant select on public.orders to authenticated;

-- ---------- 회원용 ----------
create or replace function public.get_shop_settings()
returns table (bank_name text, account_number text, account_holder text,
               shipping_fee integer, free_shipping_over integer, deposit_days integer,
               notice text, order_webhook_url text)
language plpgsql stable security definer set search_path = public, pg_temp as $$
begin
  if not (public.is_approved_student() or public.is_site_admin()) then
    raise exception '승인된 회원만 볼 수 있습니다';
  end if;
  return query select s.bank_name, s.account_number, s.account_holder, s.shipping_fee,
                      s.free_shipping_over, s.deposit_days, s.notice, s.order_webhook_url
               from public.shop_settings s where s.id = 1;
end; $$;

create or replace function public.list_partner_products()
returns table (id text, name text, summary text, thumbnail_url text, price integer,
               partner_price integer, is_featured boolean, sort_order integer)
language plpgsql stable security definer set search_path = public, pg_temp as $$
begin
  if not (public.is_approved_student() or public.is_site_admin()) then
    raise exception '승인된 회원만 볼 수 있습니다';
  end if;
  return query
    select p.id::text, p.name::text, p.summary::text,
           coalesce(p.thumbnail_url, to_jsonb(p) ->> 'image_url')::text,
           p.price::integer, p.partner_price,
           coalesce((to_jsonb(p) ->> 'is_featured')::boolean, false), p.sort_order
    from public.products p
    where p.status = 'active' and p.partner_price is not null
    order by p.sort_order, p.name;
end; $$;

create or replace function public.place_order(
  order_items jsonb, p_recipient_name text, p_recipient_phone text,
  p_address text, p_depositor_name text, p_memo text)
returns table (order_no text, total integer)
language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_items jsonb := '[]'::jsonb;
  v_sum integer := 0;
  v_ship integer := 0;
  v_free integer;
  v_no text;
  r record;
begin
  if auth.uid() is null or not public.is_approved_student() then
    raise exception '승인된 회원만 주문할 수 있습니다';
  end if;
  if coalesce(trim(p_recipient_name), '') = '' or coalesce(trim(p_recipient_phone), '') = ''
     or coalesce(trim(p_address), '') = '' or coalesce(trim(p_depositor_name), '') = '' then
    raise exception '받는 분, 연락처, 주소, 입금자명을 모두 적어 주세요';
  end if;

  for r in
    select p.id::text as pid, p.name::text as pname, p.partner_price as unit,
           least(greatest(coalesce((i ->> 'qty')::integer, 0), 0), 99) as qty
    from jsonb_array_elements(order_items) i
    join public.products p on p.id::text = (i ->> 'id')
    where p.status = 'active' and p.partner_price is not null
  loop
    if r.qty > 0 then
      v_items := v_items || jsonb_build_object('id', r.pid, 'name', r.pname, 'unit_price', r.unit, 'qty', r.qty);
      v_sum := v_sum + r.unit * r.qty;
    end if;
  end loop;
  if v_sum <= 0 then
    raise exception '주문할 상품을 골라 주세요';
  end if;

  select s.shipping_fee, s.free_shipping_over into v_ship, v_free from public.shop_settings s where s.id = 1;
  v_ship := coalesce(v_ship, 0);
  if v_free is not null and v_sum >= v_free then v_ship := 0; end if;

  v_no := to_char(now() at time zone 'Asia/Seoul', 'YYMMDD') || '-' || upper(substr(md5(random()::text || clock_timestamp()::text), 1, 5));

  insert into public.orders (order_no, user_id, items, items_total, shipping_fee, total,
                             recipient_name, recipient_phone, address, depositor_name, memo)
  values (v_no, auth.uid(), v_items, v_sum, v_ship, v_sum + v_ship,
          trim(p_recipient_name), trim(p_recipient_phone), trim(p_address), trim(p_depositor_name), nullif(trim(p_memo), ''));

  return query select v_no, v_sum + v_ship;
end; $$;

create or replace function public.cancel_my_order(p_order_no text)
returns text
language plpgsql security definer set search_path = public, pg_temp as $$
begin
  update public.orders set status = 'cancelled', updated_at = now()
  where order_no = p_order_no and user_id = auth.uid() and status = 'pending_payment';
  if not found then raise exception '입금 전 주문만 취소할 수 있습니다'; end if;
  return 'cancelled';
end; $$;

-- ---------- 관리자용 ----------
create or replace function public.admin_list_orders()
returns table (id uuid, order_no text, email text, member_name text, shop_name text,
               items jsonb, items_total integer, shipping_fee integer, total integer,
               recipient_name text, recipient_phone text, address text, depositor_name text,
               memo text, status text, tracking text, admin_memo text, created_at timestamptz)
language plpgsql stable security definer set search_path = public, pg_temp as $$
begin
  if not public.is_site_admin() then raise exception '관리자만 볼 수 있습니다'; end if;
  return query
    select o.id, o.order_no, u.email::text,
           coalesce(nullif(pr.name, ''), u.raw_user_meta_data ->> 'name'),
           coalesce(nullif(to_jsonb(pr) ->> 'shop_name', ''), u.raw_user_meta_data ->> 'shop_name'),
           o.items, o.items_total, o.shipping_fee, o.total,
           o.recipient_name, o.recipient_phone, o.address, o.depositor_name,
           o.memo, o.status, o.tracking, o.admin_memo, o.created_at
    from public.orders o
    join auth.users u on u.id = o.user_id
    left join public.profiles pr on pr.id = o.user_id
    order by o.created_at desc;
end; $$;

create or replace function public.admin_update_order(p_id uuid, p_status text, p_tracking text, p_admin_memo text)
returns text
language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if not public.is_site_admin() then raise exception '관리자만 바꿀 수 있습니다'; end if;
  if p_status not in ('pending_payment', 'paid', 'shipped', 'cancelled') then
    raise exception '알 수 없는 상태입니다';
  end if;
  update public.orders set status = p_status, tracking = nullif(trim(p_tracking), ''),
         admin_memo = nullif(trim(p_admin_memo), ''), updated_at = now()
  where id = p_id;
  return p_status;
end; $$;

create or replace function public.admin_save_shop_settings(
  p_bank_name text, p_account_number text, p_account_holder text,
  p_shipping_fee integer, p_free_shipping_over integer, p_deposit_days integer,
  p_notice text, p_order_webhook_url text)
returns text
language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if not public.is_site_admin() then raise exception '관리자만 바꿀 수 있습니다'; end if;
  update public.shop_settings set
    bank_name = nullif(trim(p_bank_name), ''), account_number = nullif(trim(p_account_number), ''),
    account_holder = nullif(trim(p_account_holder), ''), shipping_fee = greatest(coalesce(p_shipping_fee, 0), 0),
    free_shipping_over = p_free_shipping_over, deposit_days = greatest(coalesce(p_deposit_days, 3), 1),
    notice = nullif(trim(p_notice), ''), order_webhook_url = nullif(trim(p_order_webhook_url), ''),
    updated_at = now()
  where id = 1;
  return 'ok';
end; $$;

create or replace function public.admin_list_products_for_mall()
returns table (id text, name text, price integer, partner_price integer, status text, thumbnail_url text)
language plpgsql stable security definer set search_path = public, pg_temp as $$
begin
  if not public.is_site_admin() then raise exception '관리자만 볼 수 있습니다'; end if;
  return query select p.id::text, p.name::text, p.price::integer, p.partner_price, p.status::text,
                      coalesce(p.thumbnail_url, to_jsonb(p) ->> 'image_url')::text
               from public.products p order by p.sort_order, p.name;
end; $$;

create or replace function public.admin_set_partner_price(p_id text, p_partner_price integer)
returns text
language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if not public.is_site_admin() then raise exception '관리자만 바꿀 수 있습니다'; end if;
  update public.products set partner_price = case when p_partner_price is null or p_partner_price <= 0 then null else p_partner_price end
  where id::text = p_id;
  return 'ok';
end; $$;

do $$
declare f text;
begin
  foreach f in array array[
    'get_shop_settings()', 'list_partner_products()',
    'place_order(jsonb, text, text, text, text, text)', 'cancel_my_order(text)',
    'admin_list_orders()', 'admin_update_order(uuid, text, text, text)',
    'admin_save_shop_settings(text, text, text, integer, integer, integer, text, text)',
    'admin_list_products_for_mall()', 'admin_set_partner_price(text, integer)']
  loop
    execute 'revoke all on function public.' || f || ' from public, anon';
    execute 'grant execute on function public.' || f || ' to authenticated';
  end loop;
end $$;

commit;
