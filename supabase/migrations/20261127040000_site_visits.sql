-- 사이트 전체 방문 숫자 (2026-11-27)
-- 로그인하지 않은 방문자까지 포함해 방문자 수와 많이 본 페이지를 관리자 화면에서 보게 한다.
-- - 방문자는 이름이 아니라 브라우저마다 정해지는 무작위 번호로만 구분한다
-- - 같은 방문자가 같은 페이지를 10분 안에 다시 보면 한 번으로 친다
-- - 관리자 본인 방문은 세지 않는다. 기록은 400일이 지나면 지운다
-- - 관리자만 숫자를 볼 수 있고, 기록 자체는 아무도 직접 읽을 수 없다

begin;

create table if not exists public.site_visits (
  id bigserial primary key,
  visitor text not null,
  path text not null,
  created_at timestamptz not null default now()
);
create index if not exists site_visits_time_idx on public.site_visits (created_at desc);
create index if not exists site_visits_visitor_idx on public.site_visits (visitor, created_at desc);
alter table public.site_visits enable row level security;
revoke all on public.site_visits from anon, authenticated;

create or replace function public.log_site_visit(p_visitor text, p_path text)
returns void
language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_vis text := left(coalesce(p_visitor, ''), 64);
  v_path text := left(trim(coalesce(p_path, '')), 200);
begin
  if v_vis !~ '^[A-Za-z0-9-]{8,64}$' then return; end if;
  if auth.uid() is not null and public.is_site_admin() then return; end if;
  if exists (select 1 from public.site_visits
             where visitor = v_vis and path = v_path and created_at > now() - interval '10 minutes') then
    return;
  end if;
  insert into public.site_visits (visitor, path) values (v_vis, v_path);
  if random() < 0.01 then
    delete from public.site_visits where created_at < now() - interval '400 days';
  end if;
end; $$;

-- 관리자: 기간 숫자, 날짜별 숫자, 많이 본 페이지 (날짜는 한국 시간 기준)
create or replace function public.admin_site_stats(p_days integer)
returns jsonb
language plpgsql stable security definer set search_path = public, pg_temp as $$
declare
  v_days integer := least(greatest(coalesce(p_days, 7), 1), 366);
  v_today date := (now() at time zone 'Asia/Seoul')::date;
  v_from timestamptz := ((v_today - (v_days - 1))::timestamp at time zone 'Asia/Seoul');
  v_out jsonb;
begin
  if not public.is_site_admin() then raise exception '관리자만 볼 수 있습니다'; end if;
  with base as (
    select visitor, path, (created_at at time zone 'Asia/Seoul')::date as d
    from public.site_visits where created_at >= v_from
  )
  select jsonb_build_object(
    'today_visitors', (select count(distinct visitor) from base where d = v_today),
    'today_views', (select count(*) from base where d = v_today),
    'visitors', (select count(distinct visitor) from base),
    'views', (select count(*) from base),
    'daily', coalesce((select jsonb_agg(jsonb_build_object('d', g.d::date, 'visitors', coalesce(x.v, 0), 'views', coalesce(x.n, 0)) order by g.d)
                       from generate_series(v_today - (v_days - 1), v_today, interval '1 day') as g(d)
                       left join (select d, count(distinct visitor) v, count(*) n from base group by d) x on x.d = g.d::date), '[]'::jsonb),
    'pages', coalesce((select jsonb_agg(t) from (
                         select path, count(*) as views, count(distinct visitor) as visitors
                         from base group by path order by count(*) desc limit 15) t), '[]'::jsonb)
  ) into v_out;
  return v_out;
end; $$;

revoke all on function public.log_site_visit(text, text) from public;
grant execute on function public.log_site_visit(text, text) to anon, authenticated;
revoke all on function public.admin_site_stats(integer) from public, anon;
grant execute on function public.admin_site_stats(integer) to authenticated;

commit;
