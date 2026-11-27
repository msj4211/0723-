-- 730스킨이어테라피 교육 영상 (2026-11-27)
-- 온라인 교육 녹화 영상을 사이트에 올리고, 원장님이 영상마다 고른
-- 승인 회원만 볼 수 있게 한다.
--
-- - 영상 파일은 비공개 저장소(edu-videos)에 '<영상 id>/<파일 이름>'으로 둔다.
--   공개 주소가 없고, 볼 수 있는 사람만 잠깐 쓰는 주소(서명 주소)를 받는다.
-- - 볼 수 있는 사람 = 관리자, 또는 '승인 상태 + 그 영상에 골라 둔 회원'.
--   승인이 풀리거나(정지) 영상을 숨기면 바로 못 본다.
-- - 표는 사이트에서 직접 읽거나 쓸 수 없다. 아래 함수로만 다룬다.
-- - 기존 회원·상품·주문·신청·인증점 데이터는 건드리지 않는다.

begin;

-- ---------- 저장소 (비공개) ----------
insert into storage.buckets (id, name, public, allowed_mime_types)
values ('edu-videos', 'edu-videos', false,
        array['video/mp4', 'video/quicktime', 'video/webm', 'video/x-m4v'])
on conflict (id) do update set public = false,
  allowed_mime_types = excluded.allowed_mime_types;

-- ---------- 표 ----------
create table if not exists public.edu_videos (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  month_label text,                    -- 예: 2026년 12월 · 1기 1회차
  storage_path text,                   -- 저장소 안 파일 위치. 업로드 전에는 비어 있음
  file_size bigint,
  is_active boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.edu_videos enable row level security;
revoke all on public.edu_videos from anon, authenticated;

create table if not exists public.edu_video_viewers (
  video_id uuid not null references public.edu_videos(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  added_at timestamptz not null default now(),
  primary key (video_id, user_id)
);
create index if not exists edu_video_viewers_user_idx on public.edu_video_viewers (user_id);
alter table public.edu_video_viewers enable row level security;
revoke all on public.edu_video_viewers from anon, authenticated;

-- 이 사람이 이 영상 파일을 볼 수 있는지 (저장소 정책에서 씀)
create or replace function public.can_watch_edu_video(p_object_name text)
returns boolean
language sql stable security definer set search_path = public, pg_temp as $$
  select public.is_site_admin() or exists (
    select 1
    from public.edu_videos v
    join public.edu_video_viewers w on w.video_id = v.id and w.user_id = auth.uid()
    join public.profiles p on p.id = auth.uid() and p.education_status = 'approved'
    where v.is_active
      and v.storage_path = p_object_name
  );
$$;
revoke all on function public.can_watch_edu_video(text) from public, anon;
grant execute on function public.can_watch_edu_video(text) to authenticated;

-- ---------- 저장소 정책 ----------
drop policy if exists "Selected members watch edu videos" on storage.objects;
create policy "Selected members watch edu videos" on storage.objects
  for select to authenticated
  using (bucket_id = 'edu-videos' and public.can_watch_edu_video(name));

drop policy if exists "Admins upload edu videos" on storage.objects;
create policy "Admins upload edu videos" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'edu-videos' and public.is_site_admin());

drop policy if exists "Admins update edu videos" on storage.objects;
create policy "Admins update edu videos" on storage.objects
  for update to authenticated
  using (bucket_id = 'edu-videos' and public.is_site_admin());

drop policy if exists "Admins delete edu videos" on storage.objects;
create policy "Admins delete edu videos" on storage.objects
  for delete to authenticated
  using (bucket_id = 'edu-videos' and public.is_site_admin());

-- ---------- 회원: 내가 볼 수 있는 영상 ----------
create or replace function public.list_my_videos()
returns table (id uuid, title text, description text, month_label text,
               storage_path text, created_at timestamptz)
language sql stable security definer set search_path = public, pg_temp as $$
  select v.id, v.title, v.description, v.month_label, v.storage_path, v.created_at
  from public.edu_videos v
  where v.is_active and v.storage_path is not null
    and (public.is_site_admin() or exists (
      select 1 from public.edu_video_viewers w
      join public.profiles p on p.id = w.user_id and p.education_status = 'approved'
      where w.video_id = v.id and w.user_id = auth.uid()))
  order by v.sort_order, v.created_at desc;
$$;

-- ---------- 관리자 ----------
create or replace function public.admin_list_videos()
returns table (id uuid, title text, description text, month_label text, storage_path text,
               file_size bigint, is_active boolean, sort_order integer,
               created_at timestamptz, viewer_ids uuid[])
language plpgsql stable security definer set search_path = public, pg_temp as $$
begin
  if not public.is_site_admin() then raise exception '관리자만 볼 수 있습니다'; end if;
  return query
    select v.id, v.title, v.description, v.month_label, v.storage_path, v.file_size,
           v.is_active, v.sort_order, v.created_at,
           coalesce((select array_agg(w.user_id order by w.added_at) from public.edu_video_viewers w
                     where w.video_id = v.id), '{}'::uuid[])
    from public.edu_videos v
    order by v.sort_order, v.created_at desc;
end; $$;

create or replace function public.admin_save_video(
  p_id uuid, p_title text, p_description text, p_month_label text,
  p_storage_path text, p_file_size bigint, p_is_active boolean, p_sort_order integer)
returns uuid
language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_id uuid := p_id;
  v_path text := nullif(trim(coalesce(p_storage_path, '')), '');
begin
  if not public.is_site_admin() then raise exception '관리자만 바꿀 수 있습니다'; end if;
  if coalesce(trim(p_title), '') = '' then raise exception '영상 제목을 적어 주세요'; end if;
  if v_path is not null and v_id is not null and v_path not like v_id::text || '/%' then
    raise exception '영상 파일 위치가 올바르지 않습니다';
  end if;

  -- 새 영상은 파일을 올리기 전이라 항상 비공개로 만든다.
  if v_id is null then
    insert into public.edu_videos (title, description, month_label, is_active, sort_order)
    values (trim(p_title), nullif(trim(coalesce(p_description, '')), ''),
            nullif(trim(coalesce(p_month_label, '')), ''), false, coalesce(p_sort_order, 0))
    returning id into v_id;
  else
    update public.edu_videos set
      title = trim(p_title),
      description = nullif(trim(coalesce(p_description, '')), ''),
      month_label = nullif(trim(coalesce(p_month_label, '')), ''),
      storage_path = coalesce(v_path, storage_path),
      file_size = case when v_path is not null then p_file_size else file_size end,
      is_active = coalesce(p_is_active, false) and coalesce(v_path, storage_path) is not null,
      sort_order = coalesce(p_sort_order, 0),
      updated_at = now()
    where id = v_id;
    if not found then raise exception '해당 영상을 찾지 못했습니다'; end if;
  end if;
  return v_id;
end; $$;

create or replace function public.admin_set_video_viewers(p_video_id uuid, p_user_ids uuid[])
returns integer
language plpgsql security definer set search_path = public, pg_temp as $$
declare v_n integer;
begin
  if not public.is_site_admin() then raise exception '관리자만 바꿀 수 있습니다'; end if;
  if not exists (select 1 from public.edu_videos where id = p_video_id) then
    raise exception '해당 영상을 찾지 못했습니다';
  end if;
  delete from public.edu_video_viewers
  where video_id = p_video_id and not (user_id = any(coalesce(p_user_ids, '{}'::uuid[])));
  insert into public.edu_video_viewers (video_id, user_id)
  select p_video_id, u from unnest(coalesce(p_user_ids, '{}'::uuid[])) u
  join public.profiles p on p.id = u
  on conflict do nothing;
  select count(*) into v_n from public.edu_video_viewers where video_id = p_video_id;
  return v_n;
end; $$;

-- 영상 기록을 지운다. 파일은 사이트가 저장소에서 먼저 지운다.
create or replace function public.admin_delete_video(p_id uuid)
returns text
language plpgsql security definer set search_path = public, pg_temp as $$
declare v_path text;
begin
  if not public.is_site_admin() then raise exception '관리자만 바꿀 수 있습니다'; end if;
  delete from public.edu_videos where id = p_id returning storage_path into v_path;
  if not found then raise exception '해당 영상을 찾지 못했습니다'; end if;
  return v_path;
end; $$;

revoke all on function public.list_my_videos() from public, anon;
grant execute on function public.list_my_videos() to authenticated;
revoke all on function public.admin_list_videos() from public, anon;
revoke all on function public.admin_save_video(uuid, text, text, text, text, bigint, boolean, integer) from public, anon;
revoke all on function public.admin_set_video_viewers(uuid, uuid[]) from public, anon;
revoke all on function public.admin_delete_video(uuid) from public, anon;
grant execute on function public.admin_list_videos() to authenticated;
grant execute on function public.admin_save_video(uuid, text, text, text, text, bigint, boolean, integer) to authenticated;
grant execute on function public.admin_set_video_viewers(uuid, uuid[]) to authenticated;
grant execute on function public.admin_delete_video(uuid) to authenticated;

commit;
