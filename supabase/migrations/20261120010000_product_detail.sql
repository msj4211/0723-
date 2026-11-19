-- 상품 상세페이지: 상세 설명·상세 사진 (2026-11-20)
-- Supabase 대시보드 > SQL Editor에 붙여넣고 Run 한 번. 다시 실행해도 안전하다.
-- 상품(products)에 description(상세 설명), detail_images(상세 사진 주소 목록) 칸을 더하고,
-- 관리자 상품 저장·목록 함수를 그에 맞게 바꾼다. 기존 상품 정보는 바뀌지 않는다.

begin;

alter table public.products add column if not exists description text;
alter table public.products add column if not exists detail_images text[] not null default '{}';

drop function if exists public.admin_list_products_for_mall();
create function public.admin_list_products_for_mall()
returns table (id text, name text, summary text, price integer, partner_price integer,
               status text, thumbnail_url text, purchase_url text, sort_order integer,
               description text, detail_images text[])
language plpgsql stable security definer set search_path = public, pg_temp as $$
begin
  if not public.is_site_admin() then raise exception '관리자만 볼 수 있습니다'; end if;
  return query
    select p.id::text, p.name::text, p.summary::text, p.price::integer, p.partner_price,
           p.status::text, coalesce(p.thumbnail_url, to_jsonb(p) ->> 'image_url')::text,
           p.purchase_url::text, p.sort_order, p.description, p.detail_images
    from public.products p
    order by p.sort_order, p.name;
end; $$;

drop function if exists public.admin_save_product(text, text, text, integer, integer, text, text, text, integer);
create function public.admin_save_product(
  p_id text, p_name text, p_summary text, p_price integer, p_partner_price integer,
  p_thumbnail_url text, p_purchase_url text, p_status text, p_sort_order integer,
  p_description text, p_detail_images text[])
returns text
language plpgsql security definer set search_path = public, pg_temp as $$
declare v_id text;
begin
  if not public.is_site_admin() then raise exception '관리자만 바꿀 수 있습니다'; end if;
  if coalesce(trim(p_name), '') = '' then raise exception '상품 이름을 적어 주세요'; end if;
  if p_status not in ('active', 'draft') then raise exception '공개 상태가 올바르지 않습니다'; end if;

  if p_id is null or p_id = '' then
    insert into public.products (name, summary, price, partner_price, thumbnail_url, purchase_url,
                                 status, sort_order, description, detail_images)
    values (trim(p_name), nullif(trim(p_summary), ''), p_price,
            case when coalesce(p_partner_price, 0) > 0 then p_partner_price end,
            nullif(trim(p_thumbnail_url), ''), nullif(trim(p_purchase_url), ''), p_status,
            coalesce(p_sort_order, 0), nullif(trim(p_description), ''), coalesce(p_detail_images, '{}'))
    returning id::text into v_id;
  else
    update public.products set
      name = trim(p_name), summary = nullif(trim(p_summary), ''), price = p_price,
      partner_price = case when coalesce(p_partner_price, 0) > 0 then p_partner_price end,
      thumbnail_url = nullif(trim(p_thumbnail_url), ''), purchase_url = nullif(trim(p_purchase_url), ''),
      status = p_status, sort_order = coalesce(p_sort_order, 0),
      description = nullif(trim(p_description), ''), detail_images = coalesce(p_detail_images, '{}')
    where id::text = p_id
    returning id::text into v_id;
    if v_id is null then raise exception '없는 상품입니다'; end if;
  end if;
  return v_id;
end; $$;

revoke all on function public.admin_list_products_for_mall() from public, anon;
revoke all on function public.admin_save_product(text, text, text, integer, integer, text, text, text, integer, text, text[]) from public, anon;
grant execute on function public.admin_list_products_for_mall() to authenticated;
grant execute on function public.admin_save_product(text, text, text, integer, integer, text, text, text, integer, text, text[]) to authenticated;

commit;
