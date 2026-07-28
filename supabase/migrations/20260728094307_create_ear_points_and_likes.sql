create table public.ear_points (
  id text primary key,
  name text not null,
  description text,
  image_url text,
  created_at timestamptz not null default now()
);

create table public.user_favorites (
  user_id uuid not null references auth.users(id) on delete cascade,
  ear_point_id text not null references public.ear_points(id) on delete cascade,
  created_at timestamptz not null default now(),

  primary key (user_id, ear_point_id)
);

alter table public.ear_points enable row level security;
alter table public.user_favorites enable row level security;

create policy "Anyone can view ear points"
on public.ear_points
for select
to anon, authenticated
using (true);

create policy "Anyone can view favorites"
on public.user_favorites
for select
to anon, authenticated
using (true);

create policy "Users can add their own favorites"
on public.user_favorites
for insert
to authenticated
with check (auth.uid() = user_id);

create policy "Users can remove their own favorites"
on public.user_favorites
for delete
to authenticated
using (auth.uid() = user_id);