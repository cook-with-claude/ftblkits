-- Build out the full shop navigation.
--
-- 20260727130000 seeded leagues, Retro, 25/26 and Club Kits as HIDDEN, on the
-- reasoning that a nav link to an empty page is a dead end. That was the wrong
-- call for a shop still being stocked: the owner needs the structure visible to
-- stock into it, and an empty section already renders a "check back soon" state
-- rather than looking broken. Thin-content risk is handled instead by keeping
-- empty sections out of sitemap.xml (see src/app/sitemap.ts).
--
-- Also splits Mystery Boxes into its own nav group. There will eventually be a
-- box per league plus national-team and retro boxes, so grouping them by type
-- (rather than listing every individual box at the top level) keeps the menu
-- readable as they are added.

-- 1. Reveal the shells seeded hidden.
update public.sections
set hidden = false
where slug in ('25-26-kits', 'retro-kits', 'club-kits', 'premier-league', 'la-liga',
               'serie-a', 'bundesliga', 'ligue-1');

-- 2. Competitions and the leagues a Beirut reseller is actually asked for.
--    Anything here can be renamed, reordered or removed from /admin without a
--    deploy -- this is only a starting set.
insert into public.sections (slug, label, nav_group, sort_order, accent, description, hidden)
values
  ('champions-league', 'Champions League', 'league', 10, '#1e2a78',
   'Kits from Europe''s premier club competition.', false),
  ('europa-league',    'Europa League',    'league', 20, null, null, false),
  ('primeira-liga',    'Primeira Liga',    'league', 80, null, null, false),
  ('eredivisie',       'Eredivisie',       'league', 90, null, null, false),
  ('saudi-pro-league', 'Saudi Pro League', 'league', 100, null, null, false),
  ('mls',              'MLS',              'league', 110, null, null, false)
on conflict (slug) do nothing;

-- Reorder the pre-seeded leagues so the new competitions sit above them.
update public.sections set sort_order = 30 where slug = 'premier-league';
update public.sections set sort_order = 40 where slug = 'la-liga';
update public.sections set sort_order = 50 where slug = 'serie-a';
update public.sections set sort_order = 60 where slug = 'bundesliga';
update public.sections set sort_order = 70 where slug = 'ligue-1';

-- 3. Mystery boxes become their own menu group.
--    Keep the `mystery-boxes` slug: it already holds the live mystery tier, the
--    home page band reads from it, and changing it would break existing links.
update public.sections
set nav_group = 'mystery',
    label = 'All Mystery Boxes',
    sort_order = 10,
    description = 'Every mystery box we run. Pick a size, we pick the kit.'
where slug = 'mystery-boxes';

insert into public.sections (slug, label, nav_group, sort_order, accent, description, hidden)
values
  ('league-mystery-boxes',  'League Mystery Boxes',  'mystery', 20, '#ec1e5c',
   'A surprise kit from the league you choose.', false),
  ('club-mystery-boxes',    'Club Mystery Boxes',    'mystery', 30, '#ec1e5c',
   'A surprise club shirt.', false),
  ('country-mystery-boxes', 'Country Mystery Boxes', 'mystery', 40, '#ec1e5c',
   'A surprise national-team kit.', false),
  ('retro-mystery-boxes',   'Retro Mystery Boxes',   'mystery', 50, '#ec1e5c',
   'A surprise shirt from a past season.', false)
on conflict (slug) do nothing;

-- 4. The existing mystery tier belongs in the all-boxes section it already has;
--    nothing to re-map. Left explicit so the next reader does not go looking.

-- Rollback: re-hide the shells, delete the new sections via
-- public.admin_delete_section(id) so product arrays are cleaned up too, and set
-- mystery-boxes back to nav_group 'type' with label 'Mystery Kits'.
