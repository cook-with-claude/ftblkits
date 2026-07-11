-- Admin panel support for products managed from /admin.
-- Run this against the Supabase project before deploying the admin-panel branch.

alter table public.products
  add column if not exists hidden boolean default false;

update public.products
set hidden = false
where hidden is null;

alter table public.products
  alter column hidden set default false,
  alter column hidden set not null;

alter table public.products
  add column if not exists is_mystery boolean default false;

update public.products
set is_mystery = false
where is_mystery is null;

alter table public.products
  alter column is_mystery set default false,
  alter column is_mystery set not null;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'kits',
  'kits',
  true,
  8388608,
  array['image/jpeg', 'image/png', 'image/webp', 'image/avif']::text[]
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

