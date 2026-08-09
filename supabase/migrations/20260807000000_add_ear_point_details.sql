-- 이어포인트 상세페이지(위치/이유/관련혈자리/순서/관리/주의/영상)와 개인 메모용 테이블.
--
-- 설계 원칙:
--  - public.ear_points(id/name/description/image_url/created_at)는 전혀 건드리지
--    않는다. 상세 콘텐츠는 전부 별도 테이블에 둔다.
--  - 콘텐츠(선택하는 이유/위치 설명/적용 순서/관리 참고사항/피해야 하는 상황/
--    관련 혈자리/영상)는 이 마이그레이션에서 채우지 않는다 — 원장님이 검토 후
--    별도로 입력한다. 여기서는 스키마와 RLS만 만든다.
--  - combo_points/usage_steps/management_tips/avoid_when은 jsonb 배열
--    (text[] 대신)을 쓴다. 이유: (1) Supabase JS 클라이언트가 jsonb를
--    그대로 JS 배열/객체로 파싱해줘서 프론트에서 별도 파싱이 필요 없고,
--    (2) combo_points처럼 원소마다 이름+이유 두 값이 필요한 경우도
--    {"name":..., "reason":...} 객체로 그대로 담을 수 있어 text[]보다
--    유연하며, (3) usage_steps 등 단순 문자열 배열도 나중에 각 항목에
--    소제목을 붙이는 식으로 구조가 늘어나도 스키마 변경 없이 대응된다.
--  - "함께 활용하는 혈자리"(combo_points, 아코디언, 클릭해도 페이지 이동
--    없음)와 "관련 이어포인트"(아래 2) ear_point_related_points, 클릭 시
--    다른 상세페이지로 이동)는 서로 다른 개념이라 별도로 다룬다.
--    combo_points는 신문/교감/내분비/뇌간처럼 public.ear_points에 실제
--    행이 없는 이름도 다뤄야 해서 ear_point_details 안의 jsonb 컬럼으로
--    두고, ear_point_related_points만 ear_points를 FK로 참조한다.
--  - 기존 public.is_approved_student() 함수(20260804000000 마이그레이션에서
--    정의, profiles.id = auth.uid() 기준으로 education_status='approved'를
--    확인)를 그대로 재사용한다. 이 함수는 SECURITY INVOKER이고 profiles에서만
--    조회하므로, 여기서 재사용해도 무한 재귀 등의 위험이 없다(재귀는
--    profiles 테이블 자신의 정책에서 이 함수를 쓸 때만 발생). profiles의
--    정책 자체에는(이 파일 어디에서도) 이 함수를 쓰지 않는다.
--  - 기존 핵심 테이블의 데이터·컬럼·정책을 삭제하거나 변경하지 않는다.
--    이 파일에서 ALTER TABLE은 새로 만든 3개 테이블의 RLS를 켜는 데만
--    쓰고, DROP POLICY IF EXISTS도 새 테이블의 동일 이름 정책을 재생성
--    하기 위한 용도로만 쓴다 — public.profiles/public.ear_points/
--    public.user_favorites를 대상으로 한 ALTER/DROP/UPDATE/DELETE는
--    이 파일 어디에도 없고, 그 세 테이블의 기존 행도 전혀 건드리지 않는다.
--  - 이 SQL을 실수로 다시 실행해도 최대한 안전하도록(idempotent) 만든다:
--    create table은 if not exists를 쓰고, create policy/trigger 앞에는
--    항상 drop ... if exists를 먼저 실행해 "이미 있어서 실패" 하는 상황을
--    피한다. create or replace function도 재실행 시 그대로 덮어써서
--    안전하다. alter table ... enable row level security와 grant/revoke는
--    이미 같은 상태여도 에러 없이 통과하므로 별도 가드가 필요 없다.
--  - anon 역할에는 어떤 정책도, 어떤 테이블 권한도 주지 않는다(모두
--    to authenticated만 사용하고 anon 권한은 명시적으로 회수한다) —
--    승인 여부와 무관하게 로그인하지 않은 방문자는 이 세 테이블에 대해
--    항상 접근할 수 없다.

begin;

-- ============================================================
-- 0) updated_at 자동 갱신 트리거 함수.
-- ear_point_details/user_ear_point_notes가 UPDATE될 때마다 updated_at을
-- 서버 시간(now())으로 강제한다 — 클라이언트가 값을 깜빡 빼먹거나 잘못된
-- 값을 보내도 항상 실제 수정 시각이 남는다.
-- ============================================================
create or replace function public.set_ear_point_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- ============================================================
-- 1) ear_point_details: 이어포인트 1개당 상세 정보 1행(1:1).
-- ============================================================
-- combo_points: "함께 활용하는 혈자리"(아코디언, 클릭해도 페이지 이동 없음) 목록.
-- 신문/교감/내분비/뇌간처럼 public.ear_points에 별도 행이 없는 이름도 다뤄야
-- 해서(기존 js/pages.js의 수면 상세 정적 페이지 참고) public.ear_points를
-- FK로 참조하지 않는다. 그래서 아래 2)의 ear_point_related_points(클릭 시
-- 실제 다른 상세페이지로 이동하는 "관련 이어포인트", ear_points FK 있음)와는
-- 별개다. 각 원소는 {"name": "...", "reason": "..."} 형태이고, 배열 순서
-- 자체가 표시 순서다(steps처럼 별도 순번 컬럼을 두지 않는다).
create table if not exists public.ear_point_details (
  ear_point_id text primary key references public.ear_points(id) on delete cascade,
  selection_reason text,
  location_guide text,
  combo_points jsonb not null default '[]'::jsonb,
  usage_steps jsonb not null default '[]'::jsonb,
  management_tips jsonb not null default '[]'::jsonb,
  avoid_when jsonb not null default '[]'::jsonb,
  video_title text,
  video_url text,
  video_description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint ear_point_details_combo_points_is_array
    check (jsonb_typeof(combo_points) = 'array'),
  constraint ear_point_details_usage_steps_is_array
    check (jsonb_typeof(usage_steps) = 'array'),
  constraint ear_point_details_management_tips_is_array
    check (jsonb_typeof(management_tips) = 'array'),
  constraint ear_point_details_avoid_when_is_array
    check (jsonb_typeof(avoid_when) = 'array')
);

alter table public.ear_point_details enable row level security;

drop trigger if exists trg_ear_point_details_set_updated_at on public.ear_point_details;
create trigger trg_ear_point_details_set_updated_at
before update on public.ear_point_details
for each row
execute function public.set_ear_point_updated_at();

-- approved 회원만 SELECT 가능. INSERT/UPDATE/DELETE 정책은 만들지 않는다 —
-- RLS가 켜진 테이블에 정책이 없는 동작(action)은 어떤 역할이든 기본적으로
-- 거부되므로, 콘텐츠 입력·수정은 (RLS를 우회하는) service_role로 대시보드/
-- SQL Editor에서만 가능하다. anon은 to authenticated 조건 자체에 걸려
-- 애초에 정책 대상이 아니므로 0행을 받는다. pending/suspended 회원은
-- is_approved_student()가 false를 반환해 마찬가지로 0행을 받는다.
drop policy if exists "Approved students can view ear point details" on public.ear_point_details;

create policy "Approved students can view ear point details"
on public.ear_point_details
for select
to authenticated
using (public.is_approved_student());

-- ============================================================
-- 2) ear_point_related_points: "이 이어포인트와 함께 활용하는 혈자리" 관계.
-- ============================================================
create table if not exists public.ear_point_related_points (
  ear_point_id text not null references public.ear_points(id) on delete cascade,
  related_ear_point_id text not null references public.ear_points(id) on delete cascade,
  reason text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),

  primary key (ear_point_id, related_ear_point_id),
  constraint ear_point_related_points_no_self_reference
    check (ear_point_id <> related_ear_point_id)
);

alter table public.ear_point_related_points enable row level security;

drop policy if exists "Approved students can view related ear points" on public.ear_point_related_points;

create policy "Approved students can view related ear points"
on public.ear_point_related_points
for select
to authenticated
using (public.is_approved_student());

-- ============================================================
-- 3) user_ear_point_notes: 승인된 교육생 본인만 보는 개인 메모.
-- 회원 1명 x 이어포인트 1개당 메모 1개(같은 조합 재저장 시 upsert로 덮어쓴다).
-- ============================================================
create table if not exists public.user_ear_point_notes (
  user_id uuid not null references auth.users(id) on delete cascade,
  ear_point_id text not null references public.ear_points(id) on delete cascade,
  note text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  primary key (user_id, ear_point_id),
  constraint user_ear_point_notes_note_not_blank check (btrim(note) <> '')
);

alter table public.user_ear_point_notes enable row level security;

drop trigger if exists trg_user_ear_point_notes_set_updated_at on public.user_ear_point_notes;
create trigger trg_user_ear_point_notes_set_updated_at
before update on public.user_ear_point_notes
for each row
execute function public.set_ear_point_updated_at();

drop policy if exists "Approved students can view their own notes" on public.user_ear_point_notes;
drop policy if exists "Approved students can add their own notes" on public.user_ear_point_notes;
drop policy if exists "Approved students can update their own notes" on public.user_ear_point_notes;
drop policy if exists "Approved students can delete their own notes" on public.user_ear_point_notes;

create policy "Approved students can view their own notes"
on public.user_ear_point_notes
for select
to authenticated
using (auth.uid() = user_id and public.is_approved_student());

create policy "Approved students can add their own notes"
on public.user_ear_point_notes
for insert
to authenticated
with check (auth.uid() = user_id and public.is_approved_student());

create policy "Approved students can update their own notes"
on public.user_ear_point_notes
for update
to authenticated
using (auth.uid() = user_id and public.is_approved_student())
with check (auth.uid() = user_id and public.is_approved_student());

create policy "Approved students can delete their own notes"
on public.user_ear_point_notes
for delete
to authenticated
using (auth.uid() = user_id and public.is_approved_student());

-- ============================================================
-- 4) 테이블 권한(RLS와는 별도 계층). PostgREST 요청은 테이블 권한과 RLS를
-- 모두 통과해야 실제로 행에 접근할 수 있으므로, RLS만 믿지 않고 테이블
-- 단위 권한도 실제로 필요한 만큼만 명시적으로 내준다(20260804000000
-- 마이그레이션에서 profiles에 적용한 것과 같은 방어 원칙).
-- ============================================================
revoke all on public.ear_point_details from anon;
revoke all on public.ear_point_related_points from anon;
revoke all on public.user_ear_point_notes from anon;

grant select on public.ear_point_details to authenticated;
grant select on public.ear_point_related_points to authenticated;
grant select, insert, update, delete on public.user_ear_point_notes to authenticated;

commit;
