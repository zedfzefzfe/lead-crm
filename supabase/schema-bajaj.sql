-- =====================================================================
-- Bajaj Maroc — CRM schema
-- Paste this whole file into Supabase > SQL Editor > New query > Run.
-- It is safe to run more than once.
-- =====================================================================

-- ---------- 1. Tables ----------------------------------------------------

create table if not exists public.leads (
  id                uuid primary key default gen_random_uuid(),
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  nom               text not null,
  telephone         text not null,
  ville             text,
  modele            text,
  paiement          text
                    check (paiement in ('Au comptant', 'Crédit à 0 %')),
  source            text not null default 'autre'
                    check (source in ('landing', 'whatsapp', 'instagram', 'autre')),
  statut            text not null default 'Nouveau'
                    check (statut in ('Nouveau', 'Contacté', 'Pas de réponse', 'Intéressé',
                                      'Essai programmé', 'Vendu', 'Perdu')),
  raison            text
                    check (raison in ('Prix', 'Crédit refusé', 'Concessionnaire trop loin', 'Pas de réponse',
                                      'Réfléchit', 'Acheté ailleurs', 'Autre')),
  montant_acompte   numeric not null default 0 check (montant_acompte >= 0),
  prochaine_relance date,
  notes             text not null default '',
  updated_by        text
);

create index if not exists leads_created_at_idx on public.leads (created_at desc);
create index if not exists leads_statut_idx     on public.leads (statut);

create table if not exists public.lead_history (
  id          uuid primary key default gen_random_uuid(),
  lead_id     uuid not null references public.leads (id) on delete cascade,
  changed_at  timestamptz not null default now(),
  changed_by  text,
  field       text not null,
  old_value   text,
  new_value   text
);

create index if not exists lead_history_lead_idx on public.lead_history (lead_id, changed_at desc);

-- ---------- 2. Triggers --------------------------------------------------

-- Keeps updated_at fresh and stamps updated_by with the logged-in user's email
-- (taken from the auth token, so it cannot be faked by the browser).
create or replace function public.leads_set_meta()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at := now();
  new.updated_by := coalesce(auth.jwt() ->> 'email', new.updated_by);
  return new;
end;
$$;

drop trigger if exists leads_set_meta on public.leads;
create trigger leads_set_meta
  before insert or update on public.leads
  for each row execute function public.leads_set_meta();

-- Writes one lead_history row per changed field.
-- SECURITY DEFINER so it can write history even though users have no INSERT right on it.
create or replace function public.leads_log_history()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  who text := coalesce(auth.jwt() ->> 'email', new.updated_by);
begin
  if new.statut is distinct from old.statut then
    insert into lead_history (lead_id, changed_by, field, old_value, new_value)
    values (new.id, who, 'statut', old.statut, new.statut);
  end if;
  if new.raison is distinct from old.raison then
    insert into lead_history (lead_id, changed_by, field, old_value, new_value)
    values (new.id, who, 'raison', old.raison, new.raison);
  end if;
  if new.montant_acompte is distinct from old.montant_acompte then
    insert into lead_history (lead_id, changed_by, field, old_value, new_value)
    values (new.id, who, 'montant_acompte', old.montant_acompte::text, new.montant_acompte::text);
  end if;
  if new.notes is distinct from old.notes then
    insert into lead_history (lead_id, changed_by, field, old_value, new_value)
    values (new.id, who, 'notes', old.notes, new.notes);
  end if;
  return new;
end;
$$;

drop trigger if exists leads_log_history on public.leads;
create trigger leads_log_history
  after update on public.leads
  for each row execute function public.leads_log_history();

-- ---------- 3. Row Level Security ----------------------------------------

alter table public.leads        enable row level security;
alter table public.lead_history enable row level security;

-- Table privileges (RLS policies below decide which rows).
revoke all on public.leads, public.lead_history from anon, authenticated;
grant insert                 on public.leads        to anon;
grant select, insert, update on public.leads        to authenticated;
grant select                 on public.lead_history to authenticated;

-- Landing page (anonymous): may only create a brand-new lead. Cannot read anything.
drop policy if exists "anon_insert_new_leads" on public.leads;
create policy "anon_insert_new_leads" on public.leads
  for insert to anon
  with check (statut = 'Nouveau' and montant_acompte = 0);

-- Team (logged in): read, add and update every lead. Nobody can delete (nothing gets lost).
drop policy if exists "team_select_leads" on public.leads;
create policy "team_select_leads" on public.leads
  for select to authenticated using (true);

drop policy if exists "team_insert_leads" on public.leads;
create policy "team_insert_leads" on public.leads
  for insert to authenticated with check (true);

drop policy if exists "team_update_leads" on public.leads;
create policy "team_update_leads" on public.leads
  for update to authenticated using (true) with check (true);

drop policy if exists "team_select_history" on public.lead_history;
create policy "team_select_history" on public.lead_history
  for select to authenticated using (true);

-- ---------- 4. Realtime --------------------------------------------------

do $$
begin
  if not exists (select 1 from pg_publication_tables
                 where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'leads') then
    alter publication supabase_realtime add table public.leads;
  end if;
  if not exists (select 1 from pg_publication_tables
                 where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'lead_history') then
    alter publication supabase_realtime add table public.lead_history;
  end if;
end;
$$;
