-- 730스킨이어테라피 공식 인증점 (2026-11-24)
-- 팀에 합류해 인증을 받은 샵을 사이트(#/certified)에 공개하고,
-- 현판·디플로마에 적힌 인증번호로 진짜 인증인지 조회할 수 있게 한다.
--
-- - 표는 사이트에서 직접 읽거나 쓸 수 없다. 아래 함수로만 다룬다.
-- - 공개 목록(list_certified_shops)은 '인증 유지 + 공개' 상태인 샵만,
--   이어리더 이름 없이 샵 정보만 돌려준다.
-- - 인증번호 조회(verify_certificate)는 번호를 정확히 넣었을 때 그 한 건만 돌려준다.
-- - 추가·수정은 관리자(site_admins)만 한다. 인증번호는 비워 두면 자동으로 매긴다.
--   형식: 730ER-발급연월(YYMM)-일련번호(001부터, 전체 통틀어 하나씩 증가)
-- - 기존 회원·상품·주문·신청 데이터는 건드리지 않는다.

begin;

create sequence if not exists public.certified_shops_serial;

create table if not exists public.certified_shops (
  id uuid primary key default gen_random_uuid(),
  cert_no text not null unique,
  branch text not null,                -- 예: 김포점
  shop_name text not null,             -- 예: ○○샵
  reader_name text not null,           -- 730 이어리더(인증받은 사람) 이름
  region text not null,                -- 지역 묶음 (예: 경기)
  address text,
  map_url text,
  instagram text,
  certified_at date not null default current_date,
  status text not null default 'active' check (status in ('active', 'paused', 'revoked')),
  is_public boolean not null default true,
  sort_order integer not null default 0,
  admin_memo text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.certified_shops enable row level security;
revoke all on public.certified_shops from anon, authenticated;

-- ---------- 공개 목록 (로그인 없이) ----------
create or replace function public.list_certified_shops()
returns table (cert_no text, branch text, shop_name text, region text, address text,
               map_url text, instagram text, certified_at date)
language sql stable security definer set search_path = public, pg_temp as $$
  select s.cert_no, s.branch, s.shop_name, s.region, s.address, s.map_url, s.instagram, s.certified_at
  from public.certified_shops s
  where s.status = 'active' and s.is_public
  order by s.sort_order, s.region, s.certified_at, s.branch;
$$;

-- ---------- 인증번호 조회 (로그인 없이) ----------
create or replace function public.verify_certificate(p_cert_no text)
returns table (cert_no text, branch text, shop_name text, reader_name text,
               certified_at date, status text)
language sql stable security definer set search_path = public, pg_temp as $$
  select s.cert_no, s.branch, s.shop_name, s.reader_name, s.certified_at, s.status
  from public.certified_shops s
  where upper(regexp_replace(s.cert_no, '[^A-Za-z0-9]', '', 'g'))
      = upper(regexp_replace(coalesce(p_cert_no, ''), '[^A-Za-z0-9]', '', 'g'))
    and char_length(coalesce(p_cert_no, '')) between 6 and 30
  limit 1;
$$;

-- ---------- 관리자용 ----------
create or replace function public.admin_list_certified_shops()
returns setof public.certified_shops
language plpgsql stable security definer set search_path = public, pg_temp as $$
begin
  if not public.is_site_admin() then raise exception '관리자만 볼 수 있습니다'; end if;
  return query select * from public.certified_shops order by sort_order, certified_at, created_at;
end; $$;

create or replace function public.admin_save_certified_shop(
  p_id uuid, p_cert_no text, p_branch text, p_shop_name text, p_reader_name text,
  p_region text, p_address text, p_map_url text, p_instagram text, p_certified_at date,
  p_status text, p_is_public boolean, p_sort_order integer, p_admin_memo text)
returns text
language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_date date := coalesce(p_certified_at, current_date);
  v_cert text := nullif(upper(trim(coalesce(p_cert_no, ''))), '');
  v_map text := nullif(trim(coalesce(p_map_url, '')), '');
  v_insta text := nullif(trim(coalesce(p_instagram, '')), '');
begin
  if not public.is_site_admin() then raise exception '관리자만 바꿀 수 있습니다'; end if;
  if coalesce(trim(p_branch), '') = '' or coalesce(trim(p_shop_name), '') = ''
     or coalesce(trim(p_reader_name), '') = '' or coalesce(trim(p_region), '') = '' then
    raise exception '지점명, 샵 이름, 이어리더 이름, 지역은 꼭 적어 주세요';
  end if;
  if p_status not in ('active', 'paused', 'revoked') then raise exception '알 수 없는 상태입니다'; end if;
  if v_map is not null and v_map !~* '^https://' then
    raise exception '지도 링크는 https:// 로 시작해야 합니다';
  end if;
  if v_insta is not null then
    v_insta := regexp_replace(v_insta, '^(https?://)?(www\.)?instagram\.com/', '', 'i');
    v_insta := regexp_replace(v_insta, '[/?#].*$', '');
    v_insta := ltrim(v_insta, '@');
    if v_insta !~ '^[A-Za-z0-9._]{1,30}$' then raise exception '인스타그램 계정 이름을 확인해 주세요'; end if;
  end if;

  if v_cert is null then
    v_cert := '730ER-' || to_char(v_date, 'YYMM') || '-' || lpad(nextval('public.certified_shops_serial')::text, 3, '0');
  end if;

  if p_id is null then
    insert into public.certified_shops (cert_no, branch, shop_name, reader_name, region, address,
      map_url, instagram, certified_at, status, is_public, sort_order, admin_memo)
    values (v_cert, trim(p_branch), trim(p_shop_name), trim(p_reader_name), trim(p_region),
      nullif(trim(coalesce(p_address, '')), ''), v_map, v_insta, v_date, p_status,
      coalesce(p_is_public, true), coalesce(p_sort_order, 0), nullif(trim(coalesce(p_admin_memo, '')), ''));
  else
    update public.certified_shops set
      cert_no = v_cert, branch = trim(p_branch), shop_name = trim(p_shop_name),
      reader_name = trim(p_reader_name), region = trim(p_region),
      address = nullif(trim(coalesce(p_address, '')), ''), map_url = v_map, instagram = v_insta,
      certified_at = v_date, status = p_status, is_public = coalesce(p_is_public, true),
      sort_order = coalesce(p_sort_order, 0), admin_memo = nullif(trim(coalesce(p_admin_memo, '')), ''),
      updated_at = now()
    where id = p_id;
    if not found then raise exception '해당 인증점을 찾지 못했습니다'; end if;
  end if;
  return v_cert;
exception when unique_violation then
  raise exception '이미 쓰고 있는 인증번호입니다';
end; $$;

revoke all on function public.list_certified_shops() from public;
revoke all on function public.verify_certificate(text) from public;
grant execute on function public.list_certified_shops() to anon, authenticated;
grant execute on function public.verify_certificate(text) to anon, authenticated;

revoke all on function public.admin_list_certified_shops() from public, anon;
revoke all on function public.admin_save_certified_shop(uuid, text, text, text, text, text, text, text, text, date, text, boolean, integer, text) from public, anon;
grant execute on function public.admin_list_certified_shops() to authenticated;
grant execute on function public.admin_save_certified_shop(uuid, text, text, text, text, text, text, text, text, date, text, boolean, integer, text) to authenticated;

commit;
