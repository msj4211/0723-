-- 가입 때 '운영하는 샵 상호명' 받기 + 별명 저장 권한 바로잡기 (2026-11-19)
-- Supabase 대시보드 > SQL Editor에 붙여넣고 Run 한 번. 다시 실행해도 안전하다.
--
-- 1) profiles에 shop_name(상호명) 칸 추가
-- 2) 회원이 자기 프로필의 별명·상호명을 저장할 수 있게 권한 추가
--    (회원은 정해진 칸만 쓸 수 있게 되어 있는데, 지난번 별명 칸은 권한을 안 줘서
--     별명을 넣고 프로필을 저장하면 저장이 안 되던 문제가 있었다)
-- 3) 회원 승인 관리 목록에 상호명을 함께 보여준다
--    (프로필에 없으면 가입할 때 저장된 상호명을 쓴다)
-- 기존 회원 정보는 바뀌지 않는다.

begin;

alter table public.profiles add column if not exists shop_name text;
alter table public.profiles add column if not exists nickname text;

grant insert (nickname, shop_name) on public.profiles to authenticated;
grant update (nickname, shop_name) on public.profiles to authenticated;

drop function if exists public.admin_list_members();

create function public.admin_list_members()
returns table (
  id uuid,
  email text,
  nickname text,
  name text,
  phone text,
  shop_name text,
  education_status text,
  created_at timestamptz,
  approved_at timestamptz,
  last_sign_in_at timestamptz,
  email_confirmed_at timestamptz
)
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
begin
  if not public.is_site_admin() then
    raise exception '관리자만 회원 목록을 볼 수 있습니다';
  end if;
  return query
    select u.id,
           u.email::text,
           nullif(p.nickname, ''),
           coalesce(nullif(p.name, ''), nullif(u.raw_user_meta_data ->> 'name', '')),
           coalesce(nullif(p.phone, ''), nullif(u.raw_user_meta_data ->> 'phone', '')),
           coalesce(nullif(p.shop_name, ''), nullif(u.raw_user_meta_data ->> 'shop_name', '')),
           coalesce(p.education_status, 'pending'),
           u.created_at,
           p.approved_at,
           u.last_sign_in_at,
           u.email_confirmed_at
    from auth.users u
    left join public.profiles p on p.id = u.id
    order by u.created_at desc;
end;
$$;

revoke all on function public.admin_list_members() from public, anon;
grant execute on function public.admin_list_members() to authenticated;

commit;
