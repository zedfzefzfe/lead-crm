-- =====================================================================
-- Bajaj Maroc CRM — "Éligible" stays final for the team, but an admin
-- (listed in public.admins, see supabase/admin.sql) can remove it if it was a mistake.
-- Replaces the rule from 20261105_bajaj_eligible_final.sql. Safe to run more than once.
-- =====================================================================
create or replace function public.leads_keep_eligible()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if old.eligible is true and new.eligible is distinct from true and not public.is_admin() then
    new.eligible := true;
  end if;
  return new;
end;
$$;

drop trigger if exists leads_keep_eligible on public.leads;
create trigger leads_keep_eligible
  before update on public.leads
  for each row execute function public.leads_keep_eligible();
