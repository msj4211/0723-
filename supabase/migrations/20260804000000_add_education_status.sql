-- 730스킨 이어테라피 교육생 승인 상태 도입 (최종본)
--
-- 사전 점검(읽기 전용 SQL) 결과를 그대로 반영한다:
--  - public.profiles / public.ear_points / public.user_favorites 모두 RLS 활성화됨
--  - "Anyone can view ear points" 정책이 ear_points를 누구에게나 공개 중
--  - "Anyone can view favorites" 정책이 user_favorites를 누구에게나 공개 중
--  - authenticated 역할이 profiles 테이블 전체에 대해 UPDATE 권한을 이미 갖고 있어서,
--    컬럼 단위 REVOKE만으로는 education_status 등을 보호할 수 없음
--    → 테이블 단위 UPDATE/INSERT 권한을 걷어낸 뒤, 회원이 실제로 써야 하는 컬럼만
--      다시 컬럼 단위로 부여하는 화이트리스트 방식으로 교체한다
--  - education_status/approved_at/approved_by 관련 컬럼·트리거·함수는 아직 없음(신규)
--  - ear_points는 현재 image_url 컬럼을 사용 중 — 이번 SQL은 ear_points의 어떤
--    컬럼도 추가/변경하지 않고, 기존 이어포인트 데이터(이름/설명/이미지)도
--    전혀 추가하거나 덮어쓰지 않는다. 정책 교체만 한다.
--  - Storage(이미지 비공개 버킷) 작업은 이번 SQL에 포함하지 않는다 — 별도 단계.

begin;

-- ============================================================
-- 1) profiles: 교육생 승인 상태 컬럼 추가 (컬럼만 추가, 기존 행 삭제·수정 없음)
-- ============================================================
alter table public.profiles
  add column if not exists education_status text not null default 'pending',
  add column if not exists approved_at timestamptz,
  add column if not exists approved_by uuid references auth.users(id) on delete set null;

-- 이미 있던 회원 행도 위 default 덕분에 자동으로 'pending'이 채워진다.

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'profiles_education_status_check'
      and conrelid = 'public.profiles'::regclass
  ) then
    alter table public.profiles
      add constraint profiles_education_status_check
      check (education_status in ('pending', 'approved', 'suspended'));
  end if;
end $$;

-- ------------------------------------------------------------
-- 컬럼 보호 (1차 방어선: 권한 재설계)
-- 점검 결과 authenticated가 profiles 테이블 전체에 대한 UPDATE/INSERT 권한을
-- 이미 갖고 있었다. Postgres에서는 테이블 단위 권한이 남아있는 한 컬럼 단위
-- REVOKE만으로는 그 컬럼에 대한 접근을 막을 수 없다(테이블 단위 권한이 모든
-- 컬럼에 대해 여전히 유효하기 때문). 그래서 테이블 단위 권한을 완전히
-- 걷어낸 뒤, 회원이 실제로 수정해야 하는 컬럼만 다시 "컬럼 단위"로 내준다.
-- education_status/approved_at/approved_by는 어떤 방식으로도 다시 내주지
-- 않으므로, 이 컬럼들을 포함한 UPDATE/INSERT 요청은 authenticated 역할
-- 자체에서 권한 오류로 거부된다.
-- Supabase 대시보드(Table Editor)는 postgres/service_role 등 더 높은
-- 권한으로 접속해 이 권한 체계 자체를 우회하므로, 원장님의 승인 작업에는
-- 영향이 없다.
-- ------------------------------------------------------------
revoke update on public.profiles from authenticated;
revoke insert on public.profiles from authenticated;

grant insert (id, name, phone, gender, age, marketing_agreed, updated_at)
  on public.profiles to authenticated;

grant update (name, phone, gender, age, marketing_agreed, updated_at)
  on public.profiles to authenticated;

-- ------------------------------------------------------------
-- 컬럼 보호 (2차 방어선: 트리거)
-- 위 권한 설계가 나중에 실수로 느슨해지더라도(예: 다른 기능을 추가하다가
-- "grant all on all tables in schema public to authenticated" 같은 구문을
-- 다시 실행하는 경우) 곧바로 구멍이 뚫리지 않도록, authenticated 역할이
-- education_status/approved_by를 바꾸려는 시도 자체를 트리거에서도 한 번
-- 더 막는다. current_user는 PostgREST가 요청마다 SET ROLE로 바꾸는 실제
-- 실행 역할을 가리키므로, postgres/service_role로 접속하는 대시보드
-- 작업에는 이 트리거가 관여하지 않는다.
-- 같은 트리거가 approved_at 자동 기록/초기화도 함께 처리한다:
--  - INSERT 시 education_status가 'approved'가 아니면 무조건 approved_at = null
--  - UPDATE 시 'approved'로 새로 바뀌는 순간 approved_at = now()
--  - UPDATE 시 'approved'가 아니게 되면 approved_at = null
-- ------------------------------------------------------------
create or replace function public.guard_profile_education_status()
returns trigger
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
begin
  if TG_OP = 'INSERT' then
    if current_user = 'authenticated' and (
      new.education_status is distinct from 'pending'
      or new.approved_at is not null
      or new.approved_by is not null
    ) then
      raise exception 'education_status/approved_at/approved_by는 가입 시 직접 지정할 수 없습니다';
    end if;

    if new.education_status = 'approved' then
      new.approved_at := coalesce(new.approved_at, now());
    else
      new.approved_at := null;
    end if;

    return new;
  end if;

  -- TG_OP = 'UPDATE'
  if current_user = 'authenticated' and (
    new.education_status is distinct from old.education_status
    or new.approved_at is distinct from old.approved_at
    or new.approved_by is distinct from old.approved_by
  ) then
    raise exception '교육생 승인 정보는 이 계정 권한으로 직접 수정할 수 없습니다';
  end if;

  if new.education_status = 'approved' and old.education_status is distinct from 'approved' then
    new.approved_at := now();
  elsif new.education_status <> 'approved' then
    new.approved_at := null;
  end if;

  return new;
end;
$$;

-- 이 함수는 트리거 전용이므로 일반 회원에게 직접 실행 권한을 부여하지 않는다.
revoke execute on function public.guard_profile_education_status() from public;

drop trigger if exists trg_guard_profile_education_status on public.profiles;
create trigger trg_guard_profile_education_status
before insert or update on public.profiles
for each row
execute function public.guard_profile_education_status();

-- ------------------------------------------------------------
-- 여러 정책이 재사용할 "현재 로그인한 사용자가 승인된 교육생인가" 함수.
--
-- SECURITY INVOKER(기본값)로 둔다 — 호출한 사용자 본인의 권한으로 profiles를
-- 조회하고, profiles의 기존 SELECT 정책("Users can view their own profile",
-- auth.uid() = id)이 이미 자기 행만 보이도록 제한하기 때문에, SECURITY
-- DEFINER로 권한을 격상시킬 필요가 없다(불필요한 권한 상승은 피한다).
-- search_path를 고정하고 스키마를 명시해 검색 경로 조작 공격을 방지했다.
-- 매개변수를 받지 않고 auth.uid()만 확인하므로, 임의의 다른 사용자 ID를
-- 넘겨 상태를 조회하는 것은 애초에 불가능하다.
--
-- 주의: 이 함수를 public.profiles 테이블 자체의 정책에서는 절대 쓰지 말 것
-- — profiles의 SELECT 정책이 이 함수를 다시 호출하면 무한 재귀가 된다.
-- (ear_points/user_favorites 정책에서 쓰는 것은 안전하다 — 재귀 없음.)
-- ------------------------------------------------------------
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
  );
$$;

-- 기본적으로 함수는 PUBLIC(익명 포함)이 호출할 수 있으므로, 이 함수는
-- authenticated에게만 실행 권한을 내준다.
revoke execute on function public.is_approved_student() from public;
grant execute on function public.is_approved_student() to authenticated;

-- ============================================================
-- 2) ear_points: 정책만 "승인된 교육생만 조회 가능"으로 교체한다.
-- 컬럼 추가/변경, 데이터 추가(seed)는 전혀 하지 않는다 — 기존 이어포인트
-- 이름·설명·이미지(image_url)는 지금 있는 그대로 유지된다.
-- 점검 결과에서 확인된 실제 정책 이름("Anyone can view ear points")을
-- 그대로 지정해서 삭제한다.
-- ============================================================
drop policy if exists "Anyone can view ear points" on public.ear_points;
drop policy if exists "Approved students can view ear points" on public.ear_points;

create policy "Approved students can view ear points"
on public.ear_points
for select
to authenticated
using (public.is_approved_student());

-- ============================================================
-- 3) user_favorites: 승인된 본인 데이터만 조회·추가·삭제 가능하도록 교체.
-- 점검 결과에서 확인된 실제 정책 이름을 그대로 지정해서 삭제한다.
-- ============================================================
drop policy if exists "Anyone can view favorites" on public.user_favorites;
drop policy if exists "Users can add their own favorites" on public.user_favorites;
drop policy if exists "Users can remove their own favorites" on public.user_favorites;
drop policy if exists "Approved students can view their own favorites" on public.user_favorites;
drop policy if exists "Approved students can add their own favorites" on public.user_favorites;
drop policy if exists "Approved students can remove their own favorites" on public.user_favorites;

create policy "Approved students can view their own favorites"
on public.user_favorites
for select
to authenticated
using (auth.uid() = user_id and public.is_approved_student());

create policy "Approved students can add their own favorites"
on public.user_favorites
for insert
to authenticated
with check (auth.uid() = user_id and public.is_approved_student());

create policy "Approved students can remove their own favorites"
on public.user_favorites
for delete
to authenticated
using (auth.uid() = user_id and public.is_approved_student());

commit;
