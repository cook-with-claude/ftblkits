-- Close the two gaps in the expand/contract sync trigger:
--   1. an INSERT that supplies both columns with different values used to keep
--      the mismatch; and
--   2. an unrelated UPDATE did not repair a mismatch already on the row.
--
-- `team` remains authoritative when both sides conflict because it is the
-- column owned by the new application. Old-code writes that change only
-- `country` still win on that UPDATE, exactly as before.

create or replace function public.products_sync_team_country()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    if new.team is null and new.country is not null then
      new.team := new.country;
    elsif new.country is null and new.team is not null then
      new.country := new.team;
    elsif new.team is distinct from new.country then
      new.country := new.team;
    end if;
  elsif tg_op = 'UPDATE' then
    if new.team is distinct from old.team then
      new.country := new.team;
    elsif new.country is distinct from old.country then
      new.team := new.country;
    elsif new.team is distinct from new.country then
      -- Neither column changed in this statement, so this is pre-existing
      -- drift. Repair it using the new application's authoritative column.
      new.country := new.team;
    end if;
  end if;
  return new;
end;
$$;

-- Repair any mismatch admitted by the previous INSERT branch. This UPDATE also
-- passes through the corrected trigger, so both columns finish identical.
update public.products
set country = team
where country is distinct from team;

-- Trigger functions are not RPC endpoints. Remove the default PUBLIC execute
-- grant as defense in depth; the table trigger continues to invoke it.
revoke execute on function public.products_sync_team_country() from public, anon, authenticated;
