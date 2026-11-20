-- 신청서 방문 숫자 세기 (2026-11-20)
-- Supabase 대시보드 > SQL Editor에 붙여넣고 Run 한 번. 다시 실행해도 안전하다.
--
-- - 신청서(#/apply)를 열 때마다 log_page_view 함수가 한 줄 남긴다(로그인 없이 가능).
--   남기는 것은 페이지 이름, 기기마다 만든 무작위 번호, 시각뿐이다(이름·연락처·IP 없음).
-- - 같은 기기가 30분 안에 다시 열면 한 번으로 친다(새로고침으로 숫자가 부풀지 않게).
-- - 관리자(site_admins)가 연 것은 세지 않는다.
-- - 숫자는 관리자만 admin_page_view_stats 함수로 본다. 표는 아무도 직접 읽거나 쓸 수 없다.

begin;

create table if not exists public.page_views (
  id bigint generated always as identity primary key,
  page text not null,
  visitor text not null,
  created_at timestamptz not null default now()
);
alter table public.page_views enable row level security;
revoke all on public.page_views from anon, authenticated;

create index if not exists page_views_page_visitor_idx
  on public.page_views (page, visitor, created_at desc);

create or replace function public.log_page_view(p_page text, p_visitor text)
returns void
language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if p_page is null or p_page not in ('apply') then return; end if;
  if p_visitor is null or p_visitor !~ '^[A-Za-z0-9-]{8,64}$' then return; end if;
  if auth.uid() is not null and public.is_site_admin() then return; end if;
  if exists (select 1 from public.page_views
             where page = p_page and visitor = p_visitor
               and created_at > now() - interval '30 minutes') then
    return;
  end if;
  insert into public.page_views (page, visitor) values (p_page, p_visitor);
end; $$;

create or replace function public.admin_page_view_stats(p_page text)
returns table (today_views bigint, total_views bigint, today_visitors bigint, total_visitors bigint,
               today_applications bigint, total_applications bigint)
language plpgsql stable security definer set search_path = public, pg_temp as $$
declare
  v_today timestamptz := date_trunc('day', now() at time zone 'Asia/Seoul') at time zone 'Asia/Seoul';
begin
  if not public.is_site_admin() then raise exception '관리자만 볼 수 있습니다'; end if;
  return query
    select
      (select count(*) from public.page_views v where v.page = p_page and v.created_at >= v_today),
      (select count(*) from public.page_views v where v.page = p_page),
      (select count(distinct v.visitor) from public.page_views v where v.page = p_page and v.created_at >= v_today),
      (select count(distinct v.visitor) from public.page_views v where v.page = p_page),
      (select count(*) from public.team_applications a where p_page = 'apply' and a.created_at >= v_today),
      (select count(*) from public.team_applications a where p_page = 'apply');
end; $$;

revoke all on function public.log_page_view(text, text) from public;
grant execute on function public.log_page_view(text, text) to anon, authenticated;
revoke all on function public.admin_page_view_stats(text) from public, anon;
grant execute on function public.admin_page_view_stats(text) to authenticated;

commit;
