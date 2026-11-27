-- 교육 영상에 '교육 종류' 칸 추가 (2026-11-27)
-- 팀 교육 말고도 피부관리 교육 등 여러 교육 영상을 올리므로,
-- 영상마다 교육 종류(예: 팀 교육, 피부관리 교육)를 적고 회원 화면에서 종류별로 묶어 보여 준다.
-- 볼 사람 규칙(관리자 또는 승인 + 고른 회원)은 그대로다.

begin;

alter table public.edu_videos add column if not exists category text;

drop function if exists public.list_my_videos();
create function public.list_my_videos()
returns table (id uuid, title text, description text, month_label text, category text,
               storage_path text, created_at timestamptz)
language sql stable security definer set search_path = public, pg_temp as $$
  select v.id, v.title, v.description, v.month_label, v.category, v.storage_path, v.created_at
  from public.edu_videos v
  where v.is_active and v.storage_path is not null
    and (public.is_site_admin() or exists (
      select 1 from public.edu_video_viewers w
      join public.profiles p on p.id = w.user_id and p.education_status = 'approved'
      where w.video_id = v.id and w.user_id = auth.uid()))
  order by v.category nulls last, v.sort_order, v.created_at desc;
$$;

drop function if exists public.admin_list_videos();
create function public.admin_list_videos()
returns table (id uuid, title text, description text, month_label text, category text, storage_path text,
               file_size bigint, is_active boolean, sort_order integer,
               created_at timestamptz, viewer_ids uuid[])
language plpgsql stable security definer set search_path = public, pg_temp as $$
begin
  if not public.is_site_admin() then raise exception '관리자만 볼 수 있습니다'; end if;
  return query
    select v.id, v.title, v.description, v.month_label, v.category, v.storage_path, v.file_size,
           v.is_active, v.sort_order, v.created_at,
           coalesce((select array_agg(w.user_id order by w.added_at) from public.edu_video_viewers w
                     where w.video_id = v.id), '{}'::uuid[])
    from public.edu_videos v
    order by v.sort_order, v.created_at desc;
end; $$;

drop function if exists public.admin_save_video(uuid, text, text, text, text, bigint, boolean, integer);
create function public.admin_save_video(
  p_id uuid, p_title text, p_description text, p_month_label text,
  p_storage_path text, p_file_size bigint, p_is_active boolean, p_sort_order integer,
  p_category text)
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
    insert into public.edu_videos (title, description, month_label, is_active, sort_order, category)
    values (trim(p_title), nullif(trim(coalesce(p_description, '')), ''),
            nullif(trim(coalesce(p_month_label, '')), ''), false, coalesce(p_sort_order, 0),
            nullif(trim(coalesce(p_category, '')), ''))
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
      category = nullif(trim(coalesce(p_category, '')), ''),
      updated_at = now()
    where id = v_id;
    if not found then raise exception '해당 영상을 찾지 못했습니다'; end if;
  end if;
  return v_id;
end; $$;

revoke all on function public.list_my_videos() from public, anon;
grant execute on function public.list_my_videos() to authenticated;
revoke all on function public.admin_list_videos() from public, anon;
grant execute on function public.admin_list_videos() to authenticated;
revoke all on function public.admin_save_video(uuid, text, text, text, text, bigint, boolean, integer, text) from public, anon;
grant execute on function public.admin_save_video(uuid, text, text, text, text, bigint, boolean, integer, text) to authenticated;

commit;
