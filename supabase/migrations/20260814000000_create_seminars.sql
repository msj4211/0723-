-- 세미나 신청 통합: iframe(GitHub Pages) + Google Apps Script 방식을 걷어내고
-- 메인 사이트 + Supabase로 이전하기 위한 테이블 생성.
--
-- 설계 원칙:
--  - 기존 테이블(ear_points/ear_point_details/ear_point_related_points/
--    profiles/products/user_ear_point_notes/user_favorites/guestbook)은
--    이 파일에서 전혀 건드리지 않는다.
--  - seminar_applications.seminar_id는 on delete restrict — 세미나를 지워도
--    신청 기록(개인정보 포함)이 함께 삭제되지 않고, 신청 기록이 남아있는
--    한 그 세미나 삭제 자체가 거부된다.
--  - 세미나 등록/수정/삭제, 신청자 조회는 전부 service_role(Supabase
--    대시보드/SQL Editor)에서만 가능하도록 설계한다 — 이번 범위에 프론트
--    관리자 화면은 만들지 않는다(anon/authenticated 대상 쓰기 정책 없음).
--  - 정원(capacity) 초과를 막는 자동 마감 로직은 넣지 않는다. 1차는
--    원장님이 status를 open→closed로 직접 바꿔 마감하는 방식을 전제로
--    한다. 동시 신청 경쟁 조건 때문에 단순 카운트 검사로 자동 마감을
--    구현하지 않았다 — 필요해지면 SECURITY DEFINER RPC나 서버 측 처리로
--    별도 설계해야 한다.
--  - purposes 배열의 완전한 중복 제거는 PostgreSQL CHECK 제약이 서브쿼리를
--    허용하지 않아 이 SQL만으로는 구현하지 않는다(새 SQL 함수도 만들지
--    않는다). 체크박스 UI 특성상 프론트에서 같은 값이 중복 전송될 일이
--    없다는 전제로, cardinality(purposes) between 1 and 4로 개수만
--    제한한다. 완전한 중복 방지가 필요해지면 프론트(Set 등)에서 처리한다.
--  - 기존 public.set_ear_point_updated_at() 트리거 함수(테이블에 종속되지
--    않는 범용 함수, 20260807000000에서 정의, 현재 원격에 존재 확인됨)를
--    그대로 재사용한다 — 새 함수를 만들거나 기존 함수 본문/권한을
--    바꾸지 않는다.
--  - create table if not exists / drop policy·trigger if exists 패턴을
--    쓰지만, 이미 존재하는 "불완전한" 테이블의 누락 컬럼·제약을 보완해
--    주지는 않는다 — 이 마이그레이션이 새로 한 번 정상 적용되는 것을
--    전제로 한 설계다. DROP TABLE이나 무조건적인 데이터 삭제 구문은
--    전혀 없다.

begin;

-- ============================================================
-- 1) seminars 테이블 생성
-- ============================================================
create table if not exists public.seminars (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  title_en text,
  description text,
  description_en text,
  location text,
  location_en text,
  notes text,
  notes_en text,
  starts_at timestamptz not null,
  ends_at timestamptz,
  price integer,
  capacity integer,
  status text not null default 'upcoming',
  published boolean not null default false,
  kakao_url text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint seminars_status_allowed
    check (status in ('upcoming', 'open', 'closed', 'cancelled')),
  constraint seminars_price_nonnegative
    check (price is null or price >= 0),
  constraint seminars_capacity_positive
    check (capacity is null or capacity >= 1),
  constraint seminars_sort_order_nonnegative
    check (sort_order >= 0),
  constraint seminars_ends_after_starts
    check (ends_at is null or ends_at >= starts_at),
  constraint seminars_title_not_blank
    check (btrim(title) <> '' and char_length(btrim(title)) <= 150),
  constraint seminars_title_en_not_blank
    check (title_en is null or (btrim(title_en) <> '' and char_length(btrim(title_en)) <= 150)),
  constraint seminars_description_not_blank
    check (description is null or (btrim(description) <> '' and char_length(btrim(description)) <= 2000)),
  constraint seminars_description_en_not_blank
    check (description_en is null or (btrim(description_en) <> '' and char_length(btrim(description_en)) <= 2000)),
  constraint seminars_location_not_blank
    check (location is null or (btrim(location) <> '' and char_length(btrim(location)) <= 200)),
  constraint seminars_location_en_not_blank
    check (location_en is null or (btrim(location_en) <> '' and char_length(btrim(location_en)) <= 200)),
  constraint seminars_notes_not_blank
    check (notes is null or (btrim(notes) <> '' and char_length(btrim(notes)) <= 2000)),
  constraint seminars_notes_en_not_blank
    check (notes_en is null or (btrim(notes_en) <> '' and char_length(btrim(notes_en)) <= 2000))
);

alter table public.seminars enable row level security;

-- updated_at 자동 갱신: 새 함수를 만들지 않고 기존 범용 함수를 재사용한다.
-- (이 함수는 20260807000000_add_ear_point_details.sql에서 이미 정의됐고
-- 현재 원격 DB에 존재함을 읽기 전용으로 재확인했다. 본문/권한 변경 없음.)
drop trigger if exists trg_seminars_set_updated_at on public.seminars;
create trigger trg_seminars_set_updated_at
before update on public.seminars
for each row
execute function public.set_ear_point_updated_at();

-- ============================================================
-- 2) seminar_applications 테이블 생성
-- (seminars보다 반드시 뒤에 와야 FK가 참조할 대상이 이미 존재한다)
-- ============================================================
create table if not exists public.seminar_applications (
  id uuid primary key default gen_random_uuid(),
  seminar_id uuid not null references public.seminars(id) on delete restrict,
  name text not null,
  phone text not null,
  applicant_type text not null,
  purposes text[] not null,
  privacy_agreed boolean not null,
  privacy_policy_version text not null,
  created_at timestamptz not null default now(),

  constraint seminar_applications_name_not_blank
    check (btrim(name) <> '' and char_length(btrim(name)) <= 50),
  constraint seminar_applications_phone_not_blank
    check (btrim(phone) <> ''),
  constraint seminar_applications_phone_length
    check (char_length(btrim(phone)) <= 30),
  constraint seminar_applications_phone_charset
    check (btrim(phone) ~ '^[0-9+\-() ]+$'),
  constraint seminar_applications_phone_digit_count
    check (char_length(regexp_replace(phone, '[^0-9]', '', 'g')) between 7 and 15),
  constraint seminar_applications_applicant_type_allowed
    check (applicant_type in ('business', 'general')),
  constraint seminar_applications_purposes_count
    check (cardinality(purposes) between 1 and 4),
  constraint seminar_applications_purposes_no_null_elements
    check (array_position(purposes, null) is null),
  constraint seminar_applications_purposes_allowed
    check (purposes <@ array['personal_learning', 'clinic_review', 'product_inquiry', 'other']::text[]),
  constraint seminar_applications_privacy_agreed_true
    check (privacy_agreed = true),
  constraint seminar_applications_privacy_policy_version_not_blank
    check (btrim(privacy_policy_version) <> '' and char_length(btrim(privacy_policy_version)) <= 20)
);

-- 대시보드에서 관리자가 조회할 때 세미나별 신청자를 빠르게 찾기 위한 색인.
create index if not exists idx_seminar_applications_seminar_id
  on public.seminar_applications (seminar_id);

alter table public.seminar_applications enable row level security;

-- ============================================================
-- 3) RLS 정책
-- ============================================================
drop policy if exists "Anyone can view published seminars" on public.seminars;
create policy "Anyone can view published seminars"
on public.seminars
for select
to anon, authenticated
using (published = true);

-- 프론트에서 버튼을 막는 것과 별도로, DB 레벨에서도 published=true이고
-- status='open'인 세미나에만 신청이 들어갈 수 있도록 WITH CHECK에 EXISTS
-- 서브쿼리로 직접 검증한다. anon/authenticated 둘 다 seminars에 SELECT
-- 권한이 있고 그 SELECT 정책 자체가 published=true로 제한돼 있으므로,
-- 이 서브쿼리가 실제로 찾아낼 수 있는 행은 이미 published=true인 행뿐이다
-- (그 위에 status='open' 조건을 추가로 더함).
drop policy if exists "Anyone can apply to open seminars" on public.seminar_applications;
create policy "Anyone can apply to open seminars"
on public.seminar_applications
for insert
to anon, authenticated
with check (
  exists (
    select 1 from public.seminars s
    where s.id = seminar_applications.seminar_id
      and s.published = true
      and s.status = 'open'
  )
);

-- ============================================================
-- 4) 테이블 권한(RLS와는 별도 계층). Supabase가 새 테이블 생성 시
-- anon/authenticated에 기본으로 전체 권한을 자동 부여하므로, 반드시
-- REVOKE ALL로 먼저 비운 뒤 필요한 최소 권한만 다시 GRANT한다.
-- ============================================================
revoke all on public.seminars from anon;
revoke all on public.seminars from authenticated;
revoke all on public.seminar_applications from anon;
revoke all on public.seminar_applications from authenticated;

grant select on public.seminars to anon;
grant select on public.seminars to authenticated;
grant insert on public.seminar_applications to anon;
grant insert on public.seminar_applications to authenticated;

commit;
