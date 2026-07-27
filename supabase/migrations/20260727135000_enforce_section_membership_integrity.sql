-- `products.sections` intentionally remains a text[] rather than a join table,
-- but the original application-only existence check had a TOCTOU gap:
-- a section could be deleted after validation and before the product write.
-- Direct Table Editor writes could also create dangling or duplicate slugs.
--
-- Validate and lock referenced section rows in the same transaction as every
-- membership write. The matching section trigger fans renames/deletes out for
-- every SQL path, not only calls made through the admin RPCs.

create or replace function public.products_validate_sections()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  bad_slug text;
  known_count integer;
begin
  select item.slug
  into bad_slug
  from unnest(new.sections) as item(slug)
  where item.slug is null
     or length(item.slug) > 60
     or item.slug !~ '^[a-z0-9]+(-[a-z0-9]+)*$'
  limit 1;

  if found then
    raise exception 'products.sections contains an invalid slug: %', coalesce(bad_slug, '<null>')
      using errcode = '23514';
  end if;

  select item.slug
  into bad_slug
  from unnest(new.sections) as item(slug)
  group by item.slug
  having count(*) > 1
  limit 1;

  if found then
    raise exception 'products.sections contains a duplicate slug: %', bad_slug
      using errcode = '23514';
  end if;

  if cardinality(new.sections) > 12 then
    raise exception 'products.sections may contain at most 12 slugs'
      using errcode = '23514';
  end if;

  -- FOR KEY SHARE makes the existence check and the product write one
  -- concurrency-safe operation. A concurrent section rename/delete must wait
  -- for this product write; its fan-out trigger then sees the committed row.
  select count(*)
  into known_count
  from (
    select slug
    from public.sections
    where slug = any(new.sections)
    for key share
  ) as locked_sections;

  if known_count <> cardinality(new.sections) then
    raise exception 'products.sections contains an unknown section'
      using errcode = '23503';
  end if;

  return new;
end;
$$;

drop trigger if exists products_validate_sections_insert on public.products;
create trigger products_validate_sections_insert
  before insert on public.products
  for each row
  execute function public.products_validate_sections();

drop trigger if exists products_validate_sections_update on public.products;
create trigger products_validate_sections_update
  before update of sections on public.products
  for each row
  execute function public.products_validate_sections();

create or replace function public.sections_sync_product_memberships()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'DELETE' then
    update public.products
    set sections = array_remove(sections, old.slug)
    where sections @> array[old.slug];
    return old;
  end if;

  if new.slug is distinct from old.slug then
    update public.products
    set sections = array_replace(sections, old.slug, new.slug)
    where sections @> array[old.slug];
  end if;
  return new;
end;
$$;

drop trigger if exists sections_sync_products_delete on public.sections;
create trigger sections_sync_products_delete
  after delete on public.sections
  for each row
  execute function public.sections_sync_product_memberships();

drop trigger if exists sections_sync_products_rename on public.sections;
create trigger sections_sync_products_rename
  after update of slug on public.sections
  for each row
  when (old.slug is distinct from new.slug)
  execute function public.sections_sync_product_memberships();

-- Replace slug-addressed RPCs with UUID-addressed versions. A slug can be
-- deleted and recreated for a different row between the route's read and RPC;
-- targeting the stable id prevents that ABA race. The expected old slug on
-- rename also turns concurrent edits into an explicit stale-write error.
drop function if exists public.admin_delete_section(text);
drop function if exists public.admin_rename_section_slug(text, text);

create function public.admin_delete_section(p_id uuid)
returns void
language plpgsql
set search_path = ''
as $$
begin
  delete from public.sections where id = p_id;
  if not found then
    raise exception 'Section not found' using errcode = 'P0002';
  end if;
end;
$$;

create function public.admin_rename_section_slug(p_id uuid, p_old text, p_new text)
returns void
language plpgsql
set search_path = ''
as $$
begin
  update public.sections
  set slug = p_new
  where id = p_id and slug = p_old;

  if not found then
    raise exception 'Section changed before it could be renamed' using errcode = 'P0002';
  end if;
end;
$$;

revoke execute on function public.products_validate_sections()
  from public, anon, authenticated;
revoke execute on function public.sections_sync_product_memberships()
  from public, anon, authenticated;
revoke execute on function public.admin_delete_section(uuid)
  from public, anon, authenticated;
revoke execute on function public.admin_rename_section_slug(uuid, text, text)
  from public, anon, authenticated;

grant execute on function public.admin_delete_section(uuid) to service_role;
grant execute on function public.admin_rename_section_slug(uuid, text, text) to service_role;
