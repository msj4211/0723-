-- 730스킨 이어테라피 "한 계정 = 한 기기" 동시 로그인 차단.
--
-- 목적: 교육생 계정을 다른 사람에게 넘겨 동시에 쓰는 것을 막는다.
-- 새 기기에서 로그인하면 그 기기만 "지금 쓰는 기기"가 되고, 이전 기기는
-- 교육생 전용 데이터를 더 이상 받지 못한다(화면도 자동 로그아웃된다).
--
-- 구성
--  1) public.active_sessions: 계정별로 "지금 쓰는 기기"의 세션 ID 한 줄.
--     세션 ID는 Supabase 로그인 토큰 안의 session_id 값으로, 로그인할 때마다 새로 생긴다.
--  2) public.is_current_session(): 지금 요청을 보낸 기기가 그 "지금 쓰는 기기"인가.
--  3) public.is_approved_student()에 2)를 더한다.
--     ear_points / user_favorites / ear_point_details / ear_point_related_points /
--     user_ear_point_notes의 모든 정책이 이미 이 함수를 쓰고 있으므로, 정책을 하나도
--     건드리지 않고 다섯 테이블 전체에 서버 쪽 차단이 걸린다.
--
-- 실행 순서 주의
--  - 사이트 코드(js/single-session.js 포함)를 먼저 배포한 뒤 이 SQL을 실행한다.
--    코드가 먼저 올라가 있어야, 이미 로그인해 있던 교육생 기기가 자동으로
--    "지금 쓰는 기기"로 등록되어 데이터가 끊기지 않는다.
--  - 원장님이 Supabase 대시보드(Table Editor)로 하는 승인 작업에는 영향이 없다.
--
-- 이 파일은 기존 테이블의 데이터를 추가·수정·삭제하지 않는다.

begin;

-- ============================================================
-- 1) active_sessions 테이블
-- ============================================================
create table if not exists public.active_sessions (
  user_id uuid primary key references auth.users(id) on delete cascade,
  session_id uuid not null,
  updated_at timestamptz not null default now()
);

alter table public.active_sessions enable row level security;

-- Supabase 기본 권한(pg_default_acl)으로 자동 부여된 권한을 먼저 전부 걷어내고
-- 필요한 최소 권한만 다시 준다(20260809000000과 같은 방식).
revoke all on public.active_sessions from anon;
revoke all on public.active_sessions from authenticated;
grant select, insert, update on public.active_sessions to authenticated;

drop policy if exists "Users can view their own active session" on public.active_sessions;
drop policy if exists "Users can register their own active session" on public.active_sessions;
drop policy if exists "Users can replace their own active session" on public.active_sessions;

create policy "Users can view their own active session"
on public.active_sessions
for select
to authenticated
using (auth.uid() = user_id);

-- 본인 행만, 그리고 지금 자기 토큰의 세션 ID로만 등록·교체할 수 있다.
-- (다른 기기의 세션 ID를 임의로 적어 넣는 것을 막는다)
create policy "Users can register their own active session"
on public.active_sessions
for insert
to authenticated
with check (
  auth.uid() = user_id
  and session_id = nullif(auth.jwt() ->> 'session_id', '')::uuid
);

create policy "Users can replace their own active session"
on public.active_sessions
for update
to authenticated
using (auth.uid() = user_id)
with check (
  auth.uid() = user_id
  and session_id = nullif(auth.jwt() ->> 'session_id', '')::uuid
);

-- ============================================================
-- 2) 지금 요청한 기기가 "지금 쓰는 기기"인가
-- ============================================================
create or replace function public.is_current_session()
returns boolean
language sql
stable
security invoker
set search_path = public, pg_temp
as $$
  select exists (
    select 1 from public.active_sessions
    where active_sessions.user_id = auth.uid()
    and active_sessions.session_id = nullif(auth.jwt() ->> 'session_id', '')::uuid
  );
$$;

revoke execute on function public.is_current_session() from public;
revoke execute on function public.is_current_session() from anon;
grant execute on function public.is_current_session() to authenticated;

-- ============================================================
-- 3) is_approved_student()에 기기 확인을 더한다
-- (함수 이름·인자·반환형이 같으므로 기존 정책과 권한은 그대로 유지된다)
-- ============================================================
create or replace function public.is_approved_student()
returns boolean
language sql
stable
security invoker
set search_path = public, pg_temp
as $$
  select exists (
    select 1 from public.profiles
    where profiles.id = auth.uid()
    and profiles.education_status = 'approved'
  )
  and public.is_current_session();
$$;

revoke execute on function public.is_approved_student() from public;
revoke execute on function public.is_approved_student() from anon;
grant execute on function public.is_approved_student() to authenticated;

commit;

-- ============================================================
-- 되돌리기가 필요할 때(이 블록만 따로 실행):
--
-- create or replace function public.is_approved_student()
-- returns boolean language sql stable security invoker
-- set search_path = public, pg_temp
-- as $$
--   select exists (
--     select 1 from public.profiles
--     where profiles.id = auth.uid()
--     and profiles.education_status = 'approved'
--   );
-- $$;
-- ============================================================
