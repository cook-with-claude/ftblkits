-- Roll the current-season section from 25/26 to 26/27.
--
-- 20260727130000 seeded the season shell as `25-26-kits` / "25/26 Kits" with the
-- description "The current season's releases." That was already a season behind:
-- 26/27 is the season being sold. The slug is a URL (/kits/25-26-kits) and a
-- PostgREST filter value, so both it and the label have to move.
--
-- Renaming rather than adding a second section: nothing is stocked under the old
-- slug (verified zero products carried '25-26-kits' before this ran), so there is
-- no 25/26 catalog to preserve, and a stale season sitting in the nav is the bug
-- being fixed. A real 25/26 archive can be added later as its own section.
--
-- A plain update is enough -- the sections_sync_products_rename trigger added in
-- 20260727135000 fans a slug change out to products.sections in the same
-- statement, so no separate membership update (or RPC) is needed here.

update public.sections
set slug = '26-27-kits',
    label = '26/27 Kits'
where slug = '25-26-kits';

-- Rollback:
--   update public.sections set slug = '25-26-kits', label = '25/26 Kits'
--   where slug = '26-27-kits';
