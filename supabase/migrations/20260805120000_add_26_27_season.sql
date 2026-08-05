-- Add the 26/27 season alongside 25/26, and reconcile the two histories of the
-- season row so a fresh project and production end up identical.
--
-- Background. 20260728100000_roll_season_to_26_27.sql *renamed* 25-26-kits to
-- 26-27-kits, because at the time the plan was to sell 26/27. The supplier then
-- turned out to have no 26/27 stock, so the rename was reverted -- but only in
-- the live database, by hand, with no migration recording it. The result is a
-- fork: production has 25-26-kits and no 26-27-kits, while a project rebuilt
-- from this folder has 26-27-kits and no 25-26-kits.
--
-- The supplier restocked in August 2026 and now carries a full 26/27 range, so
-- both rows are wanted: 26/27 is the current season and 25/26 stays on sale.
-- Every statement below is idempotent, so it converges on the same two rows
-- from either starting point -- and rolling a future season is an insert here
-- rather than a rename, because the season is now part of each kit's identity.

insert into public.sections (slug, label, nav_group, sort_order, description, hidden)
values
  -- 15 keeps this between World Cup 2026 (10) and 25/26 (20), so the newest
  -- season leads the two but the homepage hero CTA -- which points at the
  -- lowest-sorted featured section -- stays on the World Cup.
  ('26-27-kits', '26/27 Kits', 'featured', 15,
   'The 2026/27 strips, worn by this season''s squads.', false),
  ('25-26-kits', '25/26 Kits', 'featured', 20,
   'Last season''s 2025/26 strips, still in stock.', false)
on conflict (slug) do update
  set label       = excluded.label,
      nav_group   = excluded.nav_group,
      sort_order  = excluded.sort_order,
      description = excluded.description,
      hidden      = false;
