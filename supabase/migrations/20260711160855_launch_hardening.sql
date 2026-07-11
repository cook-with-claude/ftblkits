-- Launch hardening: protect hidden rows at the database boundary and add
-- non-destructive validation for product data. Run after the admin-panel migration.

alter table public.products enable row level security;

update public.products
set description = case
  when name ilike '%pro%' then
    'A premium surprise replica kit selected from current in-stock national-team styles. Choose your size and we will keep the team a surprise.'
  else
    'A surprise replica national-team kit selected from current in-stock styles. Choose your size and we will handle the rest.'
end
where is_mystery = true;

-- Public policies are OR-combined. Remove any previous broad public SELECT
-- policies so a direct REST request cannot bypass the app's hidden=false filter.
do $$
declare
  p record;
begin
  for p in
    select policyname
    from pg_policies
    where schemaname = 'public'
      and tablename = 'products'
      and cmd in ('SELECT', 'ALL')
      and (
        'public' = any (roles)
        or 'anon' = any (roles)
        or 'authenticated' = any (roles)
      )
  loop
    execute format('drop policy if exists %I on public.products', p.policyname);
  end loop;
end
$$;

revoke insert, update, delete, truncate, references, trigger on public.products from anon, authenticated;
grant select on public.products to anon, authenticated;

create policy "Public can read visible products"
on public.products
for select
to anon, authenticated
using (hidden = false);

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'products_price_nonnegative'
  ) then
    alter table public.products
      add constraint products_price_nonnegative check (price >= 0) not valid;
  end if;
  if not exists (
    select 1 from pg_constraint where conname = 'products_name_nonblank'
  ) then
    alter table public.products
      add constraint products_name_nonblank check (length(btrim(name)) > 0) not valid;
  end if;
  if not exists (
    select 1 from pg_constraint where conname = 'products_country_nonblank'
  ) then
    alter table public.products
      add constraint products_country_nonblank check (length(btrim(country)) > 0) not valid;
  end if;
  if not exists (
    select 1 from pg_constraint where conname = 'products_visible_listing_complete'
  ) then
    alter table public.products
      add constraint products_visible_listing_complete
      check (
        hidden
        -- Mystery kits are intentionally visible without a product photo; they
        -- render via MysteryVisual, not image_url. Exempt them so editing a
        -- seeded mystery kit in the admin panel isn't rejected by this check.
        or is_mystery
        or (
          cardinality(coalesce(sizes, array[]::text[])) > 0
          and nullif(btrim(image_url), '') is not null
        )
      ) not valid;
  end if;
end
$$;
