-- 사이트 안 '회원 승인' 페이지용 관리자 권한 (2026-11-18)
-- Supabase 대시보드 > SQL Editor에 붙여넣고 Run 한 번. 다시 실행해도 안전하다.
--
-- - site_admins 표에 들어 있는 계정만 관리자다. 처음에는 msj7794@gmail.com 하나.
--   관리자를 늘리려면 맨 아래 insert 문의 이메일만 바꿔 다시 실행하면 된다.
-- - 회원 목록 보기와 승인 상태 바꾸기는 아래 두 함수로만 할 수 있고,
--   두 함수 모두 첫 줄에서 "부르는 사람이 관리자인가"를 확인한다.
--   관리자가 아니면 오류를 내고 아무것도 보여주거나 바꾸지 않는다.
-- - 기존 회원 정보·이어포인트 데이터는 건드리지 않는다.

begin;

create table if not exists public.site_admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);
alter table public.site_admins enable row level security;
-- 정책을 만들지 않으므로 사이트(로그인 회원 포함)에서는 이 표를 직접 읽거나 쓸 수 없다.
revoke all on public.site_admins from anon, authenticated;

create or replace function public.is_site_admin()
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (select 1 from public.site_admins where user_id = auth.uid());
$$;

create or replace function public.admin_list_members()
returns table (
  id uuid,
  email text,
  nickname text,
  name text,
  phone text,
  education_status text,
  created_at timestamptz,
  approved_at timestamptz,
  last_sign_in_at timestamptz
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
           p.name,
           p.phone,
           coalesce(p.education_status, 'pending'),
           u.created_at,
           p.approved_at,
           u.last_sign_in_at
    from auth.users u
    left join public.profiles p on p.id = u.id
    order by u.created_at desc;
end;
$$;

create or replace function public.admin_set_member_status(target_user uuid, new_status text)
returns text
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if not public.is_site_admin() then
    raise exception '관리자만 승인 상태를 바꿀 수 있습니다';
  end if;
  if new_status not in ('pending', 'approved', 'suspended') then
    raise exception '알 수 없는 상태입니다: %', new_status;
  end if;
  if target_user = auth.uid() then
    raise exception '내 계정의 상태는 여기서 바꿀 수 없습니다';
  end if;
  if not exists (select 1 from auth.users where id = target_user) then
    raise exception '없는 회원입니다';
  end if;

  -- 프로필을 아직 안 채운 회원은 프로필 줄이 없을 수 있어서, 없으면 만들면서 바꾼다.
  insert into public.profiles (id, education_status, approved_by)
  values (target_user, new_status, case when new_status = 'approved' then auth.uid() end)
  on conflict (id) do update
    set education_status = excluded.education_status,
        approved_by = case when excluded.education_status = 'approved' then auth.uid() else null end;

  return new_status;
end;
$$;

revoke all on function public.is_site_admin() from public, anon;
revoke all on function public.admin_list_members() from public, anon;
revoke all on function public.admin_set_member_status(uuid, text) from public, anon;
grant execute on function public.is_site_admin() to authenticated;
grant execute on function public.admin_list_members() to authenticated;
grant execute on function public.admin_set_member_status(uuid, text) to authenticated;

-- 첫 관리자: 원장님 계정
insert into public.site_admins (user_id)
select id from auth.users where email = 'msj7794@gmail.com'
on conflict (user_id) do nothing;

commit;
