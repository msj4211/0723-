-- 회원 방문 기록 · 교육 영상 시청 기록 (2026-11-27)
-- - 로그인한 회원이 어떤 페이지에 들어왔는지 남긴다 (같은 페이지는 10분에 한 번만)
-- - 교육 영상을 어디까지 봤는지 남긴다 (영상별 · 회원별 한 줄, 가장 멀리 본 위치)
-- - 관리자만 볼 수 있다. 회원은 기록을 남기기만 하고 읽을 수 없다
-- - 방문 기록은 1년이 지나면 지운다
-- - 기존 회원·영상·주문·신청·인증점 데이터는 건드리지 않는다

begin;

-- ---------- 방문 기록 ----------
create table if not exists public.member_page_views (
  id bigserial primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  path text not null,
  created_at timestamptz not null default now()
);
create index if not exists member_page_views_user_time_idx on public.member_page_views (user_id, created_at desc);
create index if not exists member_page_views_time_idx on public.member_page_views (created_at desc);
alter table public.member_page_views enable row level security;
revoke all on public.member_page_views from anon, authenticated;

create or replace function public.log_page_view(p_path text)
returns void
language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_uid uuid := auth.uid();
  v_path text := left(trim(coalesce(p_path, '')), 200);
begin
  if v_uid is null then return; end if;
  -- 관리자 본인 기록은 남기지 않는다 (통계가 흐려지지 않게)
  if public.is_site_admin() then return; end if;
  if exists (select 1 from public.member_page_views
             where user_id = v_uid and path = v_path and created_at > now() - interval '10 minutes') then
    return;
  end if;
  insert into public.member_page_views (user_id, path) values (v_uid, v_path);
  delete from public.member_page_views
  where user_id = v_uid and created_at < now() - interval '1 year';
end; $$;

-- ---------- 교육 영상 시청 기록 ----------
create table if not exists public.edu_video_watch (
  video_id uuid not null references public.edu_videos(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  first_at timestamptz not null default now(),
  last_at timestamptz not null default now(),
  watched_seconds integer not null default 0,   -- 가장 멀리 본 위치(초)
  duration_seconds integer,
  primary key (video_id, user_id)
);
alter table public.edu_video_watch enable row level security;
revoke all on public.edu_video_watch from anon, authenticated;

create or replace function public.log_video_progress(p_video_id uuid, p_position numeric, p_duration numeric)
returns void
language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_uid uuid := auth.uid();
  v_pos integer := greatest(0, floor(coalesce(p_position, 0)))::integer;
  v_dur integer := case when coalesce(p_duration, 0) > 0 and p_duration < 86400 then floor(p_duration)::integer end;
begin
  if v_uid is null or public.is_site_admin() then return; end if;
  -- 이 영상을 볼 수 있는 회원만 기록한다
  if not exists (
    select 1 from public.edu_videos v
    join public.edu_video_viewers w on w.video_id = v.id and w.user_id = v_uid
    join public.profiles p on p.id = v_uid and p.education_status = 'approved'
    where v.id = p_video_id and v.is_active
  ) then return; end if;
  if v_dur is not null then v_pos := least(v_pos, v_dur); end if;
  insert into public.edu_video_watch (video_id, user_id, watched_seconds, duration_seconds)
  values (p_video_id, v_uid, v_pos, v_dur)
  on conflict (video_id, user_id) do update set
    last_at = now(),
    watched_seconds = greatest(public.edu_video_watch.watched_seconds, excluded.watched_seconds),
    duration_seconds = coalesce(excluded.duration_seconds, public.edu_video_watch.duration_seconds);
end; $$;

-- ---------- 관리자 보기 ----------
create or replace function public.admin_list_page_views(p_user_id uuid, p_days integer)
returns table (id bigint, user_id uuid, email text, name text, nickname text, path text, created_at timestamptz)
language plpgsql stable security definer set search_path = public, pg_temp as $$
begin
  if not public.is_site_admin() then raise exception '관리자만 볼 수 있습니다'; end if;
  return query
    select v.id, v.user_id, u.email::text,
           coalesce(nullif(p.name, ''), nullif(u.raw_user_meta_data ->> 'name', '')),
           nullif(p.nickname, ''), v.path, v.created_at
    from public.member_page_views v
    join auth.users u on u.id = v.user_id
    left join public.profiles p on p.id = v.user_id
    where (p_user_id is null or v.user_id = p_user_id)
      and v.created_at > now() - make_interval(days => least(greatest(coalesce(p_days, 30), 1), 366))
    order by v.created_at desc
    limit 2000;
end; $$;

create or replace function public.admin_list_video_watch()
returns table (video_id uuid, user_id uuid, first_at timestamptz, last_at timestamptz,
               watched_seconds integer, duration_seconds integer)
language plpgsql stable security definer set search_path = public, pg_temp as $$
begin
  if not public.is_site_admin() then raise exception '관리자만 볼 수 있습니다'; end if;
  return query
    select w.video_id, w.user_id, w.first_at, w.last_at, w.watched_seconds, w.duration_seconds
    from public.edu_video_watch w;
end; $$;

revoke all on function public.log_page_view(text) from public, anon;
revoke all on function public.log_video_progress(uuid, numeric, numeric) from public, anon;
revoke all on function public.admin_list_page_views(uuid, integer) from public, anon;
revoke all on function public.admin_list_video_watch() from public, anon;
grant execute on function public.log_page_view(text) to authenticated;
grant execute on function public.log_video_progress(uuid, numeric, numeric) to authenticated;
grant execute on function public.admin_list_page_views(uuid, integer) to authenticated;
grant execute on function public.admin_list_video_watch() to authenticated;

commit;
