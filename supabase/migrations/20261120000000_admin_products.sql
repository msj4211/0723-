-- 관리자가 사이트에서 직접 상품을 추가·수정하고 사진을 올릴 수 있게 한다 (2026-11-20)
-- Supabase 대시보드 > SQL Editor에 붙여넣고 Run 한 번. 다시 실행해도 안전하다.
--
-- 1) 상품 사진 보관함(product-images): 누구나 볼 수 있고, 올리기·바꾸기·지우기는 관리자만
-- 2) admin_save_product : 상품 새로 만들기 / 고치기 (관리자만)
-- 3) admin_list_products_for_mall : 상품 관리 화면용 목록 (요약·스마트스토어 링크·순서 포함)
-- 기존 상품·회원 데이터는 바뀌지 않는다.

begin;

insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do update set public = true;

drop policy if exists "Admins upload product images" on storage.objects;
create policy "Admins upload product images" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'product-images' and public.is_site_admin());

drop policy if exists "Admins update product images" on storage.objects;
create policy "Admins update product images" on storage.objects
  for update to authenticated
  using (bucket_id = 'product-images' and public.is_site_admin());

drop policy if exists "Admins delete product images" on storage.objects;
create policy "Admins delete product images" on storage.objects
  for delete to authenticated
  using (bucket_id = 'product-images' and public.is_site_admin());

drop function if exists public.admin_list_products_for_mall();
create function public.admin_list_products_for_mall()
returns table (id text, name text, summary text, price integer, partner_price integer,
               status text, thumbnail_url text, purchase_url text, sort_order integer)
language plpgsql stable security definer set search_path = public, pg_temp as $$
begin
  if not public.is_site_admin() then raise exception '관리자만 볼 수 있습니다'; end if;
  return query
    select p.id::text, p.name::text, p.summary::text, p.price::integer, p.partner_price,
           p.status::text, coalesce(p.thumbnail_url, to_jsonb(p) ->> 'image_url')::text,
           p.purchase_url::text, p.sort_order
    from public.products p
    order by p.sort_order, p.name;
end; $$;

create or replace function public.admin_save_product(
  p_id text, p_name text, p_summary text, p_price integer, p_partner_price integer,
  p_thumbnail_url text, p_purchase_url text, p_status text, p_sort_order integer)
returns text
language plpgsql security definer set search_path = public, pg_temp as $$
declare v_id text;
begin
  if not public.is_site_admin() then raise exception '관리자만 바꿀 수 있습니다'; end if;
  if coalesce(trim(p_name), '') = '' then raise exception '상품 이름을 적어 주세요'; end if;
  if p_status not in ('active', 'draft') then raise exception '공개 상태가 올바르지 않습니다'; end if;

  if p_id is null or p_id = '' then
    insert into public.products (name, summary, price, partner_price, thumbnail_url, purchase_url, status, sort_order)
    values (trim(p_name), nullif(trim(p_summary), ''), p_price,
            case when coalesce(p_partner_price, 0) > 0 then p_partner_price end,
            nullif(trim(p_thumbnail_url), ''), nullif(trim(p_purchase_url), ''), p_status, coalesce(p_sort_order, 0))
    returning id::text into v_id;
  else
    update public.products set
      name = trim(p_name), summary = nullif(trim(p_summary), ''), price = p_price,
      partner_price = case when coalesce(p_partner_price, 0) > 0 then p_partner_price end,
      thumbnail_url = nullif(trim(p_thumbnail_url), ''), purchase_url = nullif(trim(p_purchase_url), ''),
      status = p_status, sort_order = coalesce(p_sort_order, 0)
    where id::text = p_id
    returning id::text into v_id;
    if v_id is null then raise exception '없는 상품입니다'; end if;
  end if;
  return v_id;
end; $$;

revoke all on function public.admin_list_products_for_mall() from public, anon;
revoke all on function public.admin_save_product(text, text, text, integer, integer, text, text, text, integer) from public, anon;
grant execute on function public.admin_list_products_for_mall() to authenticated;
grant execute on function public.admin_save_product(text, text, text, integer, integer, text, text, text, integer) to authenticated;

commit;
