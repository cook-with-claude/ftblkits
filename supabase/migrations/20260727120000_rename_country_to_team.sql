-- Rebrand step 1 (EXPAND): generalise `country` to `team`.
--
-- The store is moving from national-team-only to every kit type (leagues, clubs,
-- national teams, retro). A club kit has no country in the sense this column
-- meant; "Argentina" and "Real Madrid" are both teams. The column keeps its role
-- as a display label + search term — the new `sections` taxonomy carries grouping.
--
-- Run after 20260711160855_launch_hardening.sql.
--
-- WHY NOT `alter table ... rename column`: the live storefront selects `country`.
-- A straight rename breaks production the instant it lands and keeps it broken
-- until the rebrand branch deploys — which is days, not minutes. So this is the
-- expand half of an expand/contract migration: both columns exist and are kept
-- identical by a trigger, so old code (reading `country`) and new code (reading
-- `team`) both work. The contract half — dropping `country` — ships separately,
-- AFTER the new code is live and verified.

alter table public.products
  add column if not exists team text;

update public.products
set team = country
where team is null;

alter table public.products
  alter column team set not null;

-- Keep the two columns identical in both directions for as long as both exist,
-- so it does not matter which one a given deploy writes. Assigning to NEW.* in a
-- BEFORE trigger is what makes this a write-through rather than a second write.
create or replace function public.products_sync_team_country()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'INSERT' then
    if new.team is null and new.country is not null then
      new.team := new.country;
    elsif new.country is null and new.team is not null then
      new.country := new.team;
    end if;
  elsif tg_op = 'UPDATE' then
    -- Whichever side the caller touched wins; if both changed, `team` wins
    -- because it is the column the new code owns.
    if new.team is distinct from old.team then
      new.country := new.team;
    elsif new.country is distinct from old.country then
      new.team := new.country;
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists products_sync_team_country on public.products;
create trigger products_sync_team_country
  before insert or update on public.products
  for each row
  execute function public.products_sync_team_country();

-- Mirror products_country_nonblank onto the new column. `not valid` matches the
-- repo's non-destructive style: it still enforces on every write, it just skips
-- the backfill scan.
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'products_team_nonblank') then
    alter table public.products
      add constraint products_team_nonblank check (length(btrim(team)) > 0) not valid;
  end if;
end
$$;

-- The mystery kit was stored with country = 'Mystery' because the column was
-- required and no nation applied. Under the new name the value reads as a label,
-- but "Mystery Kit" is clearer in the admin list and its name+team search.
update public.products
set team = 'Mystery Kit'
where is_mystery = true and team = 'Mystery';

-- Keep the seeded mystery description in step with src/lib/mystery.ts, which no
-- longer says "national-team". These two copies had already drifted.
update public.products
set description =
  'A surprise replica football kit selected from current in-stock styles. Choose your size and we will handle the rest.'
where is_mystery = true;

-- Rollback (safe at any point before the contract migration):
--   drop trigger if exists products_sync_team_country on public.products;
--   drop function if exists public.products_sync_team_country();
--   alter table public.products drop column if exists team;
