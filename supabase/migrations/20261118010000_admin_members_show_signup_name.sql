-- 회원 승인 관리 화면에 가입 때 쓴 이름·전화번호와 이메일 인증 여부를 보여준다 (2026-11-18)
-- Supabase 대시보드 > SQL Editor에 붙여넣고 Run 한 번. 다시 실행해도 안전하다.
-- 프로필(profiles)에 이름이 없으면 가입 정보(auth.users의 user metadata)에 저장된 이름을 쓴다.
-- 반환 칸이 늘어서 함수를 지우고 다시 만든다. 회원 정보는 바뀌지 않는다.

begin;

drop function if exists public.admin_list_members();

create function public.admin_list_members()
returns table (
  id uuid,
  email text,
  nickname text,
  name text,
  phone text,
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
           (to_jsonb(p) ->> 'nickname'),
           coalesce(nullif(p.name, ''), nullif(u.raw_user_meta_data ->> 'name', '')),
           coalesce(nullif(p.phone, ''), nullif(u.raw_user_meta_data ->> 'phone', '')),
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
