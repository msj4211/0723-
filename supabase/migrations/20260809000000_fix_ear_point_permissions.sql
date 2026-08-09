-- 권한 검증에서 발견된 문제 수정.
--
-- 배경: Supabase는 postgres/supabase_admin이 public 스키마에 새 테이블/함수를
-- 만들 때 anon·authenticated에게 기본으로 전체 권한(테이블: arwdDxtm, 함수: EXECUTE)을
-- 자동 부여하도록 기본 권한(pg_default_acl)이 설정돼 있다. 20260807000000의
-- "GRANT SELECT ..." 같은 구문은 권한을 추가만 할 뿐 이미 자동으로 부여된 나머지
-- 권한을 제거하지 못했다. 이 파일은 REVOKE ALL로 먼저 완전히 비운 뒤 필요한
-- 최소 권한만 다시 GRANT한다.
--
-- 이 파일은 테이블/데이터/RLS 정책/트리거/함수 본문을 전혀 만들거나 삭제하거나
-- 변경하지 않는다 — GRANT/REVOKE만 다룬다.
--
-- 트리거 함수(guard_profile_education_status, set_ear_point_updated_at)에서
-- EXECUTE를 전부 회수해도 트리거 자체는 계속 정상 작동한다: PostgreSQL은
-- 트리거를 발동시킬 때 그 트리거를 일으킨 세션(예: authenticated로 실행되는
-- INSERT/UPDATE)이 트리거 함수에 대한 EXECUTE 권한을 갖고 있는지 확인하지
-- 않는다. 트리거 함수는 사용자가 이름으로 직접 호출하는 것이 아니라, 트리거
-- 메커니즘이 내부적으로 호출하기 때문이다(공식 문서 "Trigger Procedures":
-- 트리거 함수 실행은 일반적인 함수 호출 권한 검사 대상이 아니다). 그래서
-- 두 함수 모두 PUBLIC/anon/authenticated 전부에서 EXECUTE를 회수해도
-- profiles의 trg_guard_profile_education_status, ear_point_details/
-- user_ear_point_notes의 두 updated_at 트리거는 그대로 작동한다.
--
-- is_approved_student()는 트리거 함수가 아니라 RLS 정책의 USING 절에서
-- authenticated 역할이 직접 호출한다(ear_points/user_favorites/
-- ear_point_details/ear_point_related_points/user_ear_point_notes 5개
-- 테이블의 정책이 전부 "to authenticated"로 범위가 한정돼 있음). anon은
-- 이 정책들의 적용 대상 자체가 아니므로(TO authenticated 조건에 걸려
-- 정책이 아예 평가되지 않음) anon의 EXECUTE를 회수해도 기존 동작에
-- 영향이 없다. authenticated의 EXECUTE는 그대로 유지해야 다섯 테이블의
-- 조회/등록/수정/삭제가 계속 작동한다.
--
-- 실행 결과: 2026-08-09 Supabase SQL Editor에서 실행 완료(Success, no rows
-- returned), 검증용 읽기 전용 SQL A~F로 의도한 권한 상태와 정확히 일치함을
-- 확인했다. 이 파일은 그 실행 이력을 로컬 마이그레이션 파일로 남기기 위한
-- 것으로, 내용은 실제 실행한 SQL과 동일하다.

begin;

-- ============================================================
-- 1) ear_point_details / ear_point_related_points / user_ear_point_notes
--    테이블 권한 재설정
-- ============================================================
revoke all on public.ear_point_details from authenticated;
revoke all on public.ear_point_details from anon;
grant select on public.ear_point_details to authenticated;

revoke all on public.ear_point_related_points from authenticated;
revoke all on public.ear_point_related_points from anon;
grant select on public.ear_point_related_points to authenticated;

revoke all on public.user_ear_point_notes from authenticated;
revoke all on public.user_ear_point_notes from anon;
grant select, insert, update, delete on public.user_ear_point_notes to authenticated;
-- truncate/references/trigger/maintain은 의도적으로 다시 부여하지 않는다.

-- ============================================================
-- 2) 트리거 전용 함수의 EXECUTE 권한 전부 회수
-- (PUBLIC/anon/authenticated 모두 — 위 설명대로 트리거 동작에는 영향 없음)
-- ============================================================
revoke execute on function public.guard_profile_education_status() from public;
revoke execute on function public.guard_profile_education_status() from anon;
revoke execute on function public.guard_profile_education_status() from authenticated;

revoke execute on function public.set_ear_point_updated_at() from public;
revoke execute on function public.set_ear_point_updated_at() from anon;
revoke execute on function public.set_ear_point_updated_at() from authenticated;

-- ============================================================
-- 3) is_approved_student()는 RLS 정책에서 authenticated가 직접 호출하므로
-- PUBLIC과 anon만 회수하고 authenticated는 유지한다.
-- ============================================================
revoke execute on function public.is_approved_student() from public;
revoke execute on function public.is_approved_student() from anon;
grant execute on function public.is_approved_student() to authenticated;

commit;
