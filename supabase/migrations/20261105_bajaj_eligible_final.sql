-- =====================================================================
-- Bajaj Maroc CRM — "Éligible" is final.
-- Once a lead is marked eligible it can never be set back to not eligible,
-- even outside the CRM screens. (Admins can still delete a lead from Administration.)
-- Safe to run more than once.
-- =====================================================================
create or replace function public.leads_keep_eligible()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if old.eligible is true and new.eligible is distinct from true then
    new.eligible := true;
  end if;
  return new;
end;
$$;

drop trigger if exists leads_keep_eligible on public.leads;
create trigger leads_keep_eligible
  before update on public.leads
  for each row execute function public.leads_keep_eligible();
