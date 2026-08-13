-- Retro shirts were seeded from the supplier's back catalogue into `retro-kits`
-- and nothing else, so all 368 of them were unreachable from any league page:
-- `retro-kits ∩ any of the 11 league sections` was exactly 0. A shopper on
-- /kits/premier-league saw 67 kits while 57 Premier League retro shirts sat in
-- the catalogue, findable only by searching for a club by name.
--
-- The fix is data, not UI. Every retro shirt names a `team`, and for most of
-- those teams we already stock a modern kit that is tagged into its league. So
-- the league membership is recoverable: join retro `team` to the league slugs
-- its own modern counterparts sit in, and append what is missing.
--
-- Reach, verified on 2026-08-13: 225 of 368 auto-tag this way. Four clubs have
-- retro stock but no modern counterpart to inherit from and are mapped by hand
-- below (8 further kits). The remaining 135 are national teams, which belong in
-- country sections rather than leagues -- 95 of them in countries that have no
-- section at all. Creating those is a navigation decision, deliberately left
-- out of this migration.
--
-- Idempotent: a slug already present is never appended, so a re-run is a no-op.

do $$
declare
  over_cap integer;
begin

with leagues(slug) as (
  select unnest(array[
    'champions-league','europa-league','premier-league','la-liga','serie-a',
    'bundesliga','ligue-1','primeira-liga','eredivisie','saudi-pro-league','mls'])
),

-- What each team's *modern* kits say about which leagues that team plays in.
-- Restricted to non-retro rows so a previous run of this migration cannot feed
-- its own output back in and widen the mapping on every re-run.
modern as (
  select distinct p.team, l.slug
  from public.products p
  join leagues l on l.slug = any(p.sections)
  where not ('retro-kits' = any(p.sections))
),

-- Clubs with retro stock and no modern kit to inherit from. Auxerre,
-- Strasbourg and Monaco are Ligue 1 sides the current roster does not carry;
-- FC Dallas is the same story in MLS.
manual(team, slug) as (
  values
    ('Auxerre',     'ligue-1'),
    ('Monaco',      'ligue-1'),
    ('Strasbourg',  'ligue-1'),
    ('FC Dallas',   'mls')
),

mapping as (
  select team, slug from modern
  union
  select team, slug from manual
),

target as (
  select
    p.id,
    array_agg(distinct m.slug) as add_slugs,
    cardinality(p.sections) as current_count
  from public.products p
  join mapping m on m.team = p.team
  where 'retro-kits' = any(p.sections)
    and not (m.slug = any(p.sections))
  group by p.id, p.sections
)

-- The membership trigger caps `sections` at 12 slugs and would abort the whole
-- migration on the first row that crossed it. Measured worst case here is 4, so
-- this only exists to fail loudly and early rather than mid-update if the
-- catalogue shape changes before this is applied.
select count(*) into over_cap
from target
where current_count + cardinality(add_slugs) > 12;

if over_cap > 0 then
  raise exception
    '% retro kits would exceed the 12-slug section cap; resolve before tagging', over_cap;
end if;

end $$;

with leagues(slug) as (
  select unnest(array[
    'champions-league','europa-league','premier-league','la-liga','serie-a',
    'bundesliga','ligue-1','primeira-liga','eredivisie','saudi-pro-league','mls'])
),
modern as (
  select distinct p.team, l.slug
  from public.products p
  join leagues l on l.slug = any(p.sections)
  where not ('retro-kits' = any(p.sections))
),
manual(team, slug) as (
  values
    ('Auxerre',     'ligue-1'),
    ('Monaco',      'ligue-1'),
    ('Strasbourg',  'ligue-1'),
    ('FC Dallas',   'mls')
),
mapping as (
  select team, slug from modern
  union
  select team, slug from manual
),
target as (
  select p.id, array_agg(distinct m.slug) as add_slugs
  from public.products p
  join mapping m on m.team = p.team
  where 'retro-kits' = any(p.sections)
    and not (m.slug = any(p.sections))
  group by p.id
)
update public.products p
-- Appended rather than rebuilt with array_agg(distinct ...): that would also
-- reorder the slugs already on the row. `add_slugs` is deduped and already
-- excludes anything present, so plain concatenation cannot introduce a
-- duplicate -- which the membership trigger rejects.
set sections = p.sections || t.add_slugs
from target t
where p.id = t.id;
