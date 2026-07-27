-- Rebrand step 2: admin-managed sections, and multi-section membership for kits.
--
-- The storefront is becoming real pages you click into (/kits/<slug>) instead of
-- one scrolling page with anchors. Sections live in the database so the owner can
-- create, rename, reorder and hide them from /admin without a deploy.
--
-- Purely additive: nothing here breaks the currently-deployed code.
--
-- Run after 20260727120000_rename_country_to_team.sql.

create table if not exists public.sections (
  id          uuid primary key default gen_random_uuid(),
  slug        text not null unique,
  label       text not null,
  nav_group   text not null default 'featured',
  sort_order  integer not null default 0,
  accent      text,
  description text,
  hidden      boolean not null default false,
  created_at  timestamptz not null default now()
);

-- Constraints follow the repo's style: guarded so the migration is idempotent,
-- and `not valid` so no backfill scan runs. `not valid` still enforces on every
-- insert and update -- it only skips validating pre-existing rows.
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'sections_slug_format') then
    -- Not cosmetic: the slug is both a URL path segment and a PostgREST filter
    -- value (sections=cs.{slug}), so a comma or brace here would silently
    -- corrupt the section query. Mirrored by SECTION_SLUG_RE in src/lib/sections.ts.
    alter table public.sections
      add constraint sections_slug_format
      check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and length(slug) <= 60) not valid;
  end if;

  if not exists (select 1 from pg_constraint where conname = 'sections_label_nonblank') then
    alter table public.sections
      add constraint sections_label_nonblank
      check (length(btrim(label)) > 0 and length(label) <= 60) not valid;
  end if;

  if not exists (select 1 from pg_constraint where conname = 'sections_nav_group_allowed') then
    -- Closed set: nav_group decides how the header renders a section, which is
    -- code. Mirrored by NAV_GROUPS in src/lib/sections.ts. Adding a group needs a
    -- migration; adding a section does not.
    alter table public.sections
      add constraint sections_nav_group_allowed
      check (nav_group in ('featured', 'type', 'league', 'country', 'club', 'mystery')) not valid;
  end if;

  if not exists (select 1 from pg_constraint where conname = 'sections_accent_format') then
    alter table public.sections
      add constraint sections_accent_format
      check (accent is null or accent ~ '^#[0-9a-f]{6}$') not valid;
  end if;

  if not exists (select 1 from pg_constraint where conname = 'sections_description_length') then
    alter table public.sections
      add constraint sections_description_length
      check (description is null or length(description) <= 300) not valid;
  end if;
end
$$;

-- Same RLS shape as public.products: read-only for the public, restricted to
-- visible rows. A hidden section is therefore unreadable by the anon key, so the
-- storefront 404s it without any application-level check.
alter table public.sections enable row level security;

revoke insert, update, delete, truncate, references, trigger on public.sections from anon, authenticated;
grant select on public.sections to anon, authenticated;

drop policy if exists "Public can read visible sections" on public.sections;
create policy "Public can read visible sections"
on public.sections
for select
to anon, authenticated
using (hidden = false);

-- Membership lives on the product as an array of slugs. Chosen over a join table
-- because the admin routes have no transaction layer, so a two-statement save
-- could half-apply; because it keeps the storefront read a single query (and so
-- keeps the ok/unavailable distinction in queries.ts); and because it stays
-- legible in the Supabase table editor, which is the documented break-glass path.
-- The integrity a foreign key would give is covered by the two functions below
-- plus a write-side existence check in the admin route.
alter table public.products
  add column if not exists sections text[] default '{}'::text[];

update public.products
set sections = '{}'::text[]
where sections is null;

alter table public.products
  alter column sections set default '{}'::text[],
  alter column sections set not null;

create index if not exists products_sections_gin on public.products using gin (sections);

-- Seed the taxonomy. Deliberately NOT seeding 50 countries and 30 leagues the way
-- larger resellers do: only 8 nations are stocked, so the rest would be dead nav
-- links and thin pages. League/club/season shells are seeded hidden -- one toggle
-- in /admin turns each on the day stock arrives.
insert into public.sections (slug, label, nav_group, sort_order, accent, description, hidden)
values
  ('world-cup-2026', 'World Cup 2026', 'featured', 10, '#1e2a78',
   'National-team kits for the 2026 tournament.', false),
  ('25-26-kits',     '25/26 Kits',     'featured', 20, null,
   'The current season''s releases.', true),
  ('retro-kits',     'Retro Kits',     'featured', 30, null,
   'Classic shirts from past seasons.', true),

  ('national-teams', 'National Teams', 'type', 10, '#00a86b',
   'Country kits, home and away.', false),
  ('club-kits',      'Club Kits',      'type', 20, null,
   'Domestic club shirts from every major league.', true),
  ('mystery-boxes',  'Mystery Kits',   'type', 30, '#ec1e5c',
   'A surprise kit picked by us. You choose the size.', false),

  ('argentina', 'Argentina', 'country', 10, null, null, false),
  ('brazil',    'Brazil',    'country', 20, null, null, false),
  ('england',   'England',   'country', 30, null, null, false),
  ('france',    'France',    'country', 40, null, null, false),
  ('germany',   'Germany',   'country', 50, null, null, false),
  ('morocco',   'Morocco',   'country', 60, null, null, false),
  ('portugal',  'Portugal',  'country', 70, null, null, false),
  ('spain',     'Spain',     'country', 80, null, null, false),

  ('premier-league', 'Premier League', 'league', 10, null, null, true),
  ('la-liga',        'La Liga',        'league', 20, null, null, true),
  ('serie-a',        'Serie A',        'league', 30, null, null, true),
  ('bundesliga',     'Bundesliga',     'league', 40, null, null, true),
  ('ligue-1',        'Ligue 1',        'league', 50, null, null, true)
on conflict (slug) do nothing;

-- Backfill the existing catalog. An explicit value list rather than lower(team)
-- so the mapping is reviewable, and three sections each so multi-membership is
-- exercised by real data from day one.
update public.products p
set sections = array['national-teams', 'world-cup-2026', s.slug]
from (values
  ('Argentina', 'argentina'),
  ('Brazil',    'brazil'),
  ('England',   'england'),
  ('France',    'france'),
  ('Germany',   'germany'),
  ('Morocco',   'morocco'),
  ('Portugal',  'portugal'),
  ('Spain',     'spain')
) as s(team, slug)
where p.team = s.team
  and p.is_mystery = false
  and p.sections = '{}'::text[];

update public.products
set sections = array['mystery-boxes']
where is_mystery = true
  and sections = '{}'::text[];

-- Deleting or re-slugging a section has to touch two tables. Doing that from the
-- Node admin route would be two non-atomic statements, so a crash between them
-- would leave products pointing at a section that no longer exists. These run the
-- fan-out and the row change in one function body, which is one transaction.
create or replace function public.admin_delete_section(p_slug text)
returns void
language plpgsql
-- Pinned; every table below is schema-qualified.
set search_path = ''
as $$
begin
  update public.products
  set sections = array_remove(sections, p_slug)
  where sections @> array[p_slug];

  delete from public.sections where slug = p_slug;
end;
$$;

create or replace function public.admin_rename_section_slug(p_old text, p_new text)
returns void
language plpgsql
set search_path = ''
as $$
begin
  update public.sections set slug = p_new where slug = p_old;

  update public.products
  set sections = array_replace(sections, p_old, p_new)
  where sections @> array[p_old];
end;
$$;

-- The admin routes call these with the service-role key, which bypasses RLS, so
-- there is no reason for either function to be reachable by the public roles.
revoke execute on function public.admin_delete_section(text) from anon, authenticated;
revoke execute on function public.admin_rename_section_slug(text, text) from anon, authenticated;

-- Rollback:
--   drop function if exists public.admin_rename_section_slug(text, text);
--   drop function if exists public.admin_delete_section(text);
--   drop index if exists products_sections_gin;
--   alter table public.products drop column if exists sections;
--   drop table if exists public.sections;
