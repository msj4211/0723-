-- PMS 다이어리 / 트러블 다이어리: 원장님이 고객별로 기록을 관리한다.
-- - 고객 목록(diary_clients)과 고객별 다이어리 기록(diary_records)은 만든 원장님 본인만 보고 고칠 수 있다.
-- - 다른 원장님이나 관리자도 남의 고객 기록은 볼 수 없다.

create table if not exists public.diary_clients (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name text not null check (char_length(btrim(name)) between 1 and 40),
  memo text not null default '' check (char_length(memo) <= 200),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists diary_clients_owner_idx on public.diary_clients(owner_id, created_at);

create table if not exists public.diary_records (
  client_id uuid not null references public.diary_clients(id) on delete cascade,
  kind text not null check (kind in ('pms', 'trouble')),
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  data jsonb not null default '{}'::jsonb check (pg_column_size(data) < 500000),
  updated_at timestamptz not null default now(),
  primary key (client_id, kind)
);
create index if not exists diary_records_owner_idx on public.diary_records(owner_id);

alter table public.diary_clients enable row level security;
alter table public.diary_records enable row level security;

revoke all on public.diary_clients from anon;
revoke all on public.diary_records from anon;
grant select, insert, update, delete on public.diary_clients to authenticated;
grant select, insert, update, delete on public.diary_records to authenticated;

drop policy if exists diary_clients_owner_all on public.diary_clients;
create policy diary_clients_owner_all on public.diary_clients
  for all to authenticated
  using (owner_id = auth.uid() and (public.is_approved_student() or public.is_site_admin()))
  with check (owner_id = auth.uid() and (public.is_approved_student() or public.is_site_admin()));

drop policy if exists diary_records_owner_all on public.diary_records;
create policy diary_records_owner_all on public.diary_records
  for all to authenticated
  using (owner_id = auth.uid() and (public.is_approved_student() or public.is_site_admin()))
  with check (
    owner_id = auth.uid()
    and (public.is_approved_student() or public.is_site_admin())
    and exists (
      select 1 from public.diary_clients c
      where c.id = client_id and c.owner_id = auth.uid()
    )
  );

create or replace function public.diary_touch_updated_at()
returns trigger language plpgsql set search_path = public, pg_temp as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists diary_clients_touch on public.diary_clients;
create trigger diary_clients_touch before update on public.diary_clients
  for each row execute function public.diary_touch_updated_at();
drop trigger if exists diary_records_touch on public.diary_records;
create trigger diary_records_touch before update on public.diary_records
  for each row execute function public.diary_touch_updated_at();
