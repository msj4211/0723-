-- 730스킨이어테라피 팀(가맹) 신청서 (2026-11-20)
-- Supabase 대시보드 > SQL Editor에 붙여넣고 Run 한 번. 다시 실행해도 안전하다.
--
-- - 신청은 로그인 없이 누구나 할 수 있다. 단, 표에 직접 쓰지 못하고
--   submit_team_application 함수로만 넣을 수 있다(입력값 검사 포함).
-- - 신청 내용은 누구도 직접 읽을 수 없다. 관리자(site_admins)만
--   admin_list_team_applications 함수로 목록을 본다.
-- - 같은 연락처로 10분 안에 다시 내면 막는다(실수로 두 번 누르는 것 방지).
-- - 기존 회원·상품·주문 데이터는 건드리지 않는다.

begin;

create table if not exists public.team_applications (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text not null,
  shop_name text,
  region text not null,
  role text not null check (role in ('owner', 'therapist', 'beginner')),
  instagram text,
  experience text[] not null default '{}',
  motivation text not null,
  expectation text,
  contact_time text,
  agreed_principles boolean not null default false,
  agreed_privacy boolean not null default false,
  status text not null default 'new'
    check (status in ('new', 'contacted', 'accepted', 'declined')),
  admin_memo text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.team_applications enable row level security;
-- 정책을 만들지 않으므로 사이트에서는 이 표를 직접 읽거나 쓸 수 없다.
revoke all on public.team_applications from anon, authenticated;

create index if not exists team_applications_phone_created_idx
  on public.team_applications (phone, created_at desc);

-- ---------- 신청하기 (로그인 없이 가능) ----------
create or replace function public.submit_team_application(
  p_name text, p_phone text, p_shop_name text, p_region text, p_role text,
  p_instagram text, p_experience text[], p_motivation text, p_expectation text,
  p_contact_time text, p_agreed_principles boolean, p_agreed_privacy boolean)
returns text
language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_phone text := regexp_replace(coalesce(p_phone, ''), '[^0-9]', '', 'g');
  v_exp text[];
begin
  if coalesce(trim(p_name), '') = '' or char_length(trim(p_name)) > 30 then
    raise exception '이름을 적어 주세요';
  end if;
  if char_length(v_phone) < 9 or char_length(v_phone) > 12 then
    raise exception '연락처를 숫자로 정확히 적어 주세요';
  end if;
  if coalesce(trim(p_region), '') = '' or char_length(trim(p_region)) > 50 then
    raise exception '활동 지역을 적어 주세요';
  end if;
  if p_role not in ('owner', 'therapist', 'beginner') then
    raise exception '구분을 골라 주세요';
  end if;
  if coalesce(trim(p_motivation), '') = '' or char_length(trim(p_motivation)) > 2000 then
    raise exception '신청 동기를 적어 주세요';
  end if;
  if char_length(coalesce(p_shop_name, '')) > 60 or char_length(coalesce(p_instagram, '')) > 60
     or char_length(coalesce(p_expectation, '')) > 2000 or char_length(coalesce(p_contact_time, '')) > 60 then
    raise exception '입력한 내용이 너무 길어요';
  end if;
  if p_agreed_principles is not true or p_agreed_privacy is not true then
    raise exception '팀 약속과 개인정보 수집·이용에 동의해 주세요';
  end if;

  select coalesce(array_agg(e), '{}') into v_exp
  from unnest(coalesce(p_experience, '{}')) e
  where e in ('seminar', 'advanced', 'reflexer');

  if exists (select 1 from public.team_applications
             where phone = v_phone and created_at > now() - interval '10 minutes') then
    raise exception '방금 신청이 접수됐어요. 잠시 후 연락드릴게요';
  end if;

  insert into public.team_applications (name, phone, shop_name, region, role, instagram,
    experience, motivation, expectation, contact_time, agreed_principles, agreed_privacy)
  values (trim(p_name), v_phone, nullif(trim(p_shop_name), ''), trim(p_region), p_role,
    nullif(trim(p_instagram), ''), v_exp, trim(p_motivation), nullif(trim(p_expectation), ''),
    nullif(trim(p_contact_time), ''), true, true);

  return 'ok';
end; $$;

-- ---------- 관리자용 ----------
create or replace function public.admin_list_team_applications()
returns table (id uuid, name text, phone text, shop_name text, region text, role text,
               instagram text, experience text[], motivation text, expectation text,
               contact_time text, status text, admin_memo text, created_at timestamptz)
language plpgsql stable security definer set search_path = public, pg_temp as $$
begin
  if not public.is_site_admin() then raise exception '관리자만 볼 수 있습니다'; end if;
  return query
    select a.id, a.name, a.phone, a.shop_name, a.region, a.role, a.instagram, a.experience,
           a.motivation, a.expectation, a.contact_time, a.status, a.admin_memo, a.created_at
    from public.team_applications a
    order by a.created_at desc;
end; $$;

create or replace function public.admin_update_team_application(p_id uuid, p_status text, p_admin_memo text)
returns text
language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if not public.is_site_admin() then raise exception '관리자만 바꿀 수 있습니다'; end if;
  if p_status not in ('new', 'contacted', 'accepted', 'declined') then
    raise exception '알 수 없는 상태입니다';
  end if;
  update public.team_applications
     set status = p_status, admin_memo = nullif(trim(p_admin_memo), ''), updated_at = now()
   where id = p_id;
  return p_status;
end; $$;

revoke all on function public.submit_team_application(text, text, text, text, text, text, text[], text, text, text, boolean, boolean) from public;
grant execute on function public.submit_team_application(text, text, text, text, text, text, text[], text, text, text, boolean, boolean) to anon, authenticated;

revoke all on function public.admin_list_team_applications() from public, anon;
revoke all on function public.admin_update_team_application(uuid, text, text) from public, anon;
grant execute on function public.admin_list_team_applications() to authenticated;
grant execute on function public.admin_update_team_application(uuid, text, text) to authenticated;

commit;
