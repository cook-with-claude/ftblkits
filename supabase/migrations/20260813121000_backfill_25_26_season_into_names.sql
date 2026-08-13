-- The README makes the season part of every kit's identity -- "Arsenal 26/27
-- Home" -> arsenal-26-27-home.jpg -- because that is what lets two seasons sit
-- side by side without the seeder skipping rows or the importer overwriting the
-- previous season's photo.
--
-- 138 kits predate that convention and are still named "<Team> <Variant>". They
-- are all tagged 25-26-kits, so the season is known; it is just missing from the
-- name. On a shelf next to the 26/27 range this reads as a mistake: "Arsenal
-- Home" sits directly beside "Arsenal 26/27 Home" for 80 different teams, and a
-- shopper cannot tell whether the unlabelled one is older, newer, or a
-- duplicate. The name is also what the card, the page title and the WhatsApp
-- order message all show, so one write fixes all three.
--
-- Scope, verified on 2026-08-13:
--   * 138 rows are seasonless and tagged 25-26-kits -- every one of them starts
--     with its own `team` followed by a space, so the insertion point is exact.
--   * 16 further seasonless rows are left alone: the world-cup-2026 national
--     shirts and the mystery tier genuinely have no season.
--
-- Idempotent: `name !~ '[0-9]'` stops a re-run from inserting the season twice.

update public.products
set name = team || ' 25/26 ' || substring(name from length(team) + 2)
where '25-26-kits' = any(sections)
  -- No digit anywhere in the name is the same seasonless test the audit used,
  -- and it doubles as the re-run guard: once "25/26" is in there, the row stops
  -- matching.
  and name !~ '[0-9]'
  -- Anchored on the literal prefix rather than LIKE, so a team name containing
  -- % or _ cannot turn into a wildcard. A row whose name does not begin with
  -- its team is skipped rather than mangled.
  and left(name, length(team) + 1) = team || ' ';
