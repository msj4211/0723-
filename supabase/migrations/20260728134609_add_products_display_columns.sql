alter table public.products
  add column if not exists summary text,
  add column if not exists thumbnail_url text,
  add column if not exists purchase_url text,
  add column if not exists status text not null default 'draft',
  add column if not exists sort_order integer not null default 0;
