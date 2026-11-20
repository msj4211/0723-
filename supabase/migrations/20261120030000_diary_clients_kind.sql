-- 다이어리 고객 목록을 PMS 다이어리 / 트러블 다이어리별로 따로 둔다.
alter table public.diary_clients
  add column if not exists kind text not null default 'pms';

alter table public.diary_clients
  drop constraint if exists diary_clients_kind_check;
alter table public.diary_clients
  add constraint diary_clients_kind_check check (kind in ('pms', 'trouble'));

-- 이미 만든 고객: 트러블 기록만 있으면 트러블 다이어리 고객으로 옮긴다.
update public.diary_clients c
set kind = 'trouble'
where exists (select 1 from public.diary_records r where r.client_id = c.id and r.kind = 'trouble')
  and not exists (select 1 from public.diary_records r where r.client_id = c.id and r.kind = 'pms');

create index if not exists diary_clients_owner_kind_idx on public.diary_clients(owner_id, kind, created_at);
