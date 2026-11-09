-- =====================================================================
-- Crea'rt CRM — count unanswered calls (max 6, then Perdue).
-- Paste into Supabase (Crea'rt project) > SQL Editor > New query > Run.
-- Additive and safe to run more than once. Existing leads start at 0 calls,
-- except leads already "Contacté" / "Pas de réponse", which count as 1 call.
-- =====================================================================

-- 1. Columns
alter table public.leads add column if not exists tentatives int not null default 0;
alter table public.leads add column if not exists derniere_tentative timestamptz;
do $$ begin
  alter table public.leads add constraint leads_tentatives_check check (tentatives >= 0);
exception when duplicate_object then null; end $$;

-- Leads already called once (status set before this change) count as 1 call.
update public.leads set tentatives = 1, derniere_tentative = coalesce(derniere_tentative, updated_at)
 where statut in ('Contacté', 'Pas de réponse') and tentatives = 0;

-- 2. First call: Nouveau -> Contacté / Pas de réponse counts as call 1/6.
create or replace function public.leads_first_attempt()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if old.statut = 'Nouveau' and new.statut in ('Contacté', 'Pas de réponse') and new.tentatives = 0 then
    new.tentatives := 1;
    new.derniere_tentative := now();
  end if;
  return new;
end;
$$;

drop trigger if exists leads_first_attempt on public.leads;
create trigger leads_first_attempt
  before update on public.leads
  for each row execute function public.leads_first_attempt();

-- 3. "Unanswered call" button: +1 call. On call p_max (6) the lead becomes Perdue,
--    reason "Pas de réponse". Done in one statement, so two salespeople clicking at
--    the same time both count. Runs with the caller's rights (logged-in users only).
create or replace function public.register_call_attempt(p_id uuid, p_max int default 6)
returns setof public.leads
language sql
as $$
  update public.leads
     set tentatives         = tentatives + 1,
         derniere_tentative = now(),
         statut = case when tentatives + 1 >= p_max then 'Perdue' else statut end,
         raison = case when tentatives + 1 >= p_max then 'Pas de réponse' else raison end
   where id = p_id
     and statut in ('Contacté', 'Pas de réponse')
  returning *;
$$;

revoke all on function public.register_call_attempt(uuid, int) from public, anon;
grant execute on function public.register_call_attempt(uuid, int) to authenticated;

-- 4. History: each unanswered call is written in the lead's history (who, when, n/6).
create or replace function public.leads_log_attempts()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.tentatives is distinct from old.tentatives then
    insert into lead_history (lead_id, changed_by, field, old_value, new_value)
    values (new.id, coalesce(auth.jwt() ->> 'email', new.updated_by), 'tentatives',
            old.tentatives::text, new.tentatives::text);
  end if;
  return new;
end;
$$;

drop trigger if exists leads_log_attempts on public.leads;
create trigger leads_log_attempts
  after update on public.leads
  for each row execute function public.leads_log_attempts();
