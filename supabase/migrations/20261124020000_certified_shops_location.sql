-- 공식 인증점 지도 표시용 위치(위도·경도) 추가 (2026-11-24)
-- 관리자 화면에서 주소를 저장할 때 카카오맵으로 위치를 찾아 함께 저장한다.
-- 공개 목록에도 위치를 내보내 지도에 핀을 찍는다. 다시 실행해도 안전하다.

begin;

alter table public.certified_shops add column if not exists lat double precision;
alter table public.certified_shops add column if not exists lng double precision;

drop function if exists public.list_certified_shops();
create function public.list_certified_shops()
returns table (cert_no text, branch text, shop_name text, region text, address text,
               map_url text, instagram text, certified_at date, lat double precision, lng double precision)
language sql stable security definer set search_path = public, pg_temp as $$
  select s.cert_no, s.branch, s.shop_name, s.region, s.address, s.map_url, s.instagram, s.certified_at, s.lat, s.lng
  from public.certified_shops s
  where s.status = 'active' and s.is_public
  order by s.sort_order, s.region, s.certified_at, s.branch;
$$;
revoke all on function public.list_certified_shops() from public;
grant execute on function public.list_certified_shops() to anon, authenticated;

-- 위치만 따로 저장 (주소로 찾은 좌표, 또는 지우기)
create or replace function public.admin_set_certified_shop_location(p_cert_no text, p_lat double precision, p_lng double precision)
returns text
language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if not public.is_site_admin() then raise exception '관리자만 바꿀 수 있습니다'; end if;
  if (p_lat is null) <> (p_lng is null) then raise exception '위치 값이 올바르지 않습니다'; end if;
  if p_lat is not null and (p_lat not between 33 and 39 or p_lng not between 124 and 132) then
    raise exception '국내 위치가 아닙니다';
  end if;
  update public.certified_shops set lat = p_lat, lng = p_lng, updated_at = now() where cert_no = p_cert_no;
  if not found then raise exception '해당 인증점을 찾지 못했습니다'; end if;
  return 'ok';
end; $$;
revoke all on function public.admin_set_certified_shop_location(text, double precision, double precision) from public, anon;
grant execute on function public.admin_set_certified_shop_location(text, double precision, double precision) to authenticated;

commit;
