-- =====================================================================
-- Ouaddi Living — CRM schema (rideaux & fauteuils sur mesure).
-- Paste into Supabase (Ouaddi project) > SQL Editor > New query > Run.
-- Safe to run more than once.
--
-- Rights (same rules as the Crea'rt / Bajaj CRMs):
--   - not logged in (anon): nothing at all;
--   - logged-in team (admin + agent): read, add, update everything;
--   - delete a lead / a devis / someone else's note: admin only.
-- =====================================================================

-- ---------- 1. Types ------------------------------------------------------
do $$ begin create type public.city_t        as enum ('casablanca', 'rabat', 'autre'); exception when duplicate_object then null; end $$;
do $$ begin create type public.lead_source_t as enum ('meta_ads', 'instagram_auto', 'whatsapp', 'referral', 'autre'); exception when duplicate_object then null; end $$;
do $$ begin create type public.service_t     as enum ('rideaux', 'fauteuils', 'les_deux'); exception when duplicate_object then null; end $$;
do $$ begin create type public.lead_stage_t  as enum ('nouveau', 'contacte', 'rdv_mesures', 'mesures_prises', 'devis_envoye',
                                                       'negociation', 'gagne', 'pose_planifiee', 'termine', 'perdu'); exception when duplicate_object then null; end $$;
do $$ begin create type public.appt_type_t   as enum ('mesures', 'pose', 'livraison', 'visite'); exception when duplicate_object then null; end $$;
do $$ begin create type public.appt_status_t as enum ('planifie', 'confirme', 'fait', 'annule', 'no_show'); exception when duplicate_object then null; end $$;
do $$ begin create type public.activity_t    as enum ('note', 'appel', 'whatsapp', 'rdv', 'changement_statut'); exception when duplicate_object then null; end $$;
do $$ begin create type public.quote_status_t as enum ('brouillon', 'envoye', 'accepte', 'refuse'); exception when duplicate_object then null; end $$;
do $$ begin create type public.task_status_t as enum ('a_faire', 'fait'); exception when duplicate_object then null; end $$;
do $$ begin create type public.user_role_t   as enum ('admin', 'agent'); exception when duplicate_object then null; end $$;

-- ---------- 2. Tables -----------------------------------------------------

-- One row per team member (created automatically at sign-up, see section 4).
create table if not exists public.profiles (
  id         uuid primary key references auth.users (id) on delete cascade,
  full_name  text not null default '',
  role       public.user_role_t not null default 'agent',
  created_at timestamptz not null default now()
);

create table if not exists public.leads (
  id              uuid primary key default gen_random_uuid(),
  full_name       text not null,
  phone           text not null check (phone ~ '^[0-9]{8,15}$'), -- international, digits only: 2126XXXXXXXX
  city            public.city_t not null default 'casablanca',
  address         text,
  source          public.lead_source_t not null default 'meta_ads',
  source_detail   text,
  service         public.service_t not null default 'rideaux',
  stage           public.lead_stage_t not null default 'nouveau',
  lost_reason     text,
  estimated_value numeric check (estimated_value >= 0),
  assigned_to     uuid references public.profiles (id) on delete set null,
  notes           text not null default '',
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index if not exists leads_stage_idx   on public.leads (stage);
create index if not exists leads_created_idx on public.leads (created_at desc);
create index if not exists leads_phone_idx   on public.leads (phone);

create table if not exists public.appointments (
  id            uuid primary key default gen_random_uuid(),
  lead_id       uuid not null references public.leads (id) on delete cascade,
  type          public.appt_type_t not null default 'mesures',
  scheduled_at  timestamptz not null,
  duration_min  int not null default 60 check (duration_min > 0),
  city          public.city_t not null default 'casablanca', -- copied from the lead, for the calendar filter
  address       text,
  status        public.appt_status_t not null default 'planifie',
  assigned_to   uuid references public.profiles (id) on delete set null,
  notes         text not null default '',
  reminder_sent boolean not null default false,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index if not exists appointments_when_idx on public.appointments (scheduled_at);
create index if not exists appointments_lead_idx on public.appointments (lead_id);

create table if not exists public.activities (
  id         uuid primary key default gen_random_uuid(),
  lead_id    uuid not null references public.leads (id) on delete cascade,
  type       public.activity_t not null default 'note',
  content    text not null default '',
  created_by uuid references public.profiles (id) on delete set null default auth.uid(),
  created_at timestamptz not null default now()
);
create index if not exists activities_lead_idx on public.activities (lead_id, created_at desc);

create table if not exists public.quotes (
  id         uuid primary key default gen_random_uuid(),
  lead_id    uuid not null references public.leads (id) on delete cascade,
  amount     numeric not null default 0 check (amount >= 0),
  details    text not null default '',
  status     public.quote_status_t not null default 'brouillon',
  file_url   text,
  created_at timestamptz not null default now()
);
create index if not exists quotes_lead_idx on public.quotes (lead_id);

create table if not exists public.tasks (
  id         uuid primary key default gen_random_uuid(),
  lead_id    uuid not null references public.leads (id) on delete cascade,
  title      text not null,
  due_date   date not null default current_date,
  status     public.task_status_t not null default 'a_faire',
  created_by uuid references public.profiles (id) on delete set null default auth.uid(),
  created_at timestamptz not null default now()
);
create index if not exists tasks_due_idx on public.tasks (status, due_date);

-- ---------- 3. Helpers ----------------------------------------------------

create or replace function public.is_admin()
returns boolean
language sql stable security definer set search_path = public
as $$ select exists (select 1 from profiles where id = auth.uid() and role = 'admin'); $$;
revoke all on function public.is_admin() from public, anon;
grant execute on function public.is_admin() to authenticated;

create or replace function public.set_updated_at()
returns trigger language plpgsql set search_path = public
as $$ begin new.updated_at := now(); return new; end; $$;

drop trigger if exists leads_updated_at on public.leads;
create trigger leads_updated_at before update on public.leads
  for each row execute function public.set_updated_at();
drop trigger if exists appointments_updated_at on public.appointments;
create trigger appointments_updated_at before update on public.appointments
  for each row execute function public.set_updated_at();

-- ---------- 4. Profiles: created at sign-up, role protected ---------------

-- New user (Supabase > Authentication > Add user) -> profile "agent".
-- The very first account becomes admin automatically.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  insert into profiles (id, full_name, role)
  values (new.id,
          coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1)),
          (case when exists (select 1 from profiles) then 'agent' else 'admin' end)::user_role_t)
  on conflict (id) do nothing;
  return new;
end;
$$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- Users created before this script: give them a profile too.
insert into public.profiles (id, full_name)
select u.id, split_part(u.email, '@', 1) from auth.users u
on conflict (id) do nothing;

-- An agent can rename themself but never change a role (theirs or anyone's).
-- auth.uid() is empty in the Supabase SQL Editor (project owner): allowed there.
create or replace function public.profiles_guard_role()
returns trigger language plpgsql set search_path = public
as $$
begin
  if new.role is distinct from old.role and auth.uid() is not null and not public.is_admin() then
    raise exception 'Seul un admin peut changer un rôle' using errcode = '42501';
  end if;
  return new;
end;
$$;
drop trigger if exists profiles_guard_role on public.profiles;
create trigger profiles_guard_role before update on public.profiles
  for each row execute function public.profiles_guard_role();

-- ---------- 5. Timeline: automatic activities (nothing gets lost) ---------

-- Stage change -> "changement_statut" line in the lead's timeline.
create or replace function public.leads_log_stage()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  if new.stage is distinct from old.stage then
    insert into activities (lead_id, type, content, created_by)
    values (new.id, 'changement_statut', old.stage::text || ' → ' || new.stage::text, auth.uid());
  end if;
  return new;
end;
$$;
drop trigger if exists leads_log_stage on public.leads;
create trigger leads_log_stage after update of stage on public.leads
  for each row execute function public.leads_log_stage();

-- New rendez-vous / status change -> "rdv" line in the timeline.
create or replace function public.appointments_log()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    insert into activities (lead_id, type, content, created_by)
    values (new.lead_id, 'rdv',
            'RDV ' || new.type::text || ' planifié le '
              || to_char(new.scheduled_at at time zone 'Africa/Casablanca', 'DD/MM/YYYY à HH24:MI'),
            auth.uid());
  elsif new.status is distinct from old.status or new.scheduled_at is distinct from old.scheduled_at then
    insert into activities (lead_id, type, content, created_by)
    values (new.lead_id, 'rdv',
            'RDV ' || new.type::text || ' : ' || new.status::text
              || case when new.scheduled_at is distinct from old.scheduled_at
                      then ' — déplacé au ' || to_char(new.scheduled_at at time zone 'Africa/Casablanca', 'DD/MM/YYYY à HH24:MI')
                      else '' end,
            auth.uid());
  end if;
  return new;
end;
$$;
drop trigger if exists appointments_log on public.appointments;
create trigger appointments_log after insert or update on public.appointments
  for each row execute function public.appointments_log();

-- ---------- 6. View used by lists, pipeline and dashboard -----------------
-- last_activity_at: to flag "à relancer" (no activity for more than 3 days).
-- next_appt_at: next planned / confirmed rendez-vous.
create or replace view public.leads_overview
with (security_invoker = true) as
select l.*,
       greatest(l.created_at, (select max(a.created_at) from public.activities a where a.lead_id = l.id)) as last_activity_at,
       (select min(ap.scheduled_at) from public.appointments ap
         where ap.lead_id = l.id and ap.status in ('planifie', 'confirme') and ap.scheduled_at >= now() - interval '2 hours') as next_appt_at
from public.leads l;

-- ---------- 7. Row Level Security -----------------------------------------
alter table public.profiles     enable row level security;
alter table public.leads        enable row level security;
alter table public.appointments enable row level security;
alter table public.activities   enable row level security;
alter table public.quotes       enable row level security;
alter table public.tasks        enable row level security;

revoke all on public.profiles, public.leads, public.appointments, public.activities,
              public.quotes, public.tasks, public.leads_overview from anon;
grant select, update on public.profiles to authenticated;
grant select, insert, update, delete on public.leads, public.appointments, public.activities,
                                         public.quotes, public.tasks to authenticated;
grant select on public.leads_overview to authenticated;

-- profiles
drop policy if exists "team_reads_profiles" on public.profiles;
create policy "team_reads_profiles" on public.profiles for select to authenticated using (true);
drop policy if exists "own_or_admin_updates_profile" on public.profiles;
create policy "own_or_admin_updates_profile" on public.profiles for update to authenticated
  using (id = auth.uid() or public.is_admin()) with check (id = auth.uid() or public.is_admin());

-- leads, appointments, tasks: whole team reads and writes
do $$
declare t text;
begin
  foreach t in array array['leads', 'appointments', 'tasks', 'quotes', 'activities'] loop
    execute format('drop policy if exists "team_select" on public.%I', t);
    execute format('create policy "team_select" on public.%I for select to authenticated using (true)', t);
    execute format('drop policy if exists "team_insert" on public.%I', t);
    execute format('create policy "team_insert" on public.%I for insert to authenticated with check (true)', t);
    execute format('drop policy if exists "team_update" on public.%I', t);
    execute format('create policy "team_update" on public.%I for update to authenticated using (true) with check (true)', t);
  end loop;
end $$;

-- delete rules
drop policy if exists "team_delete" on public.appointments;
create policy "team_delete" on public.appointments for delete to authenticated using (true);
drop policy if exists "team_delete" on public.tasks;
create policy "team_delete" on public.tasks for delete to authenticated using (true);
drop policy if exists "admin_delete" on public.leads;
create policy "admin_delete" on public.leads for delete to authenticated using (public.is_admin());
drop policy if exists "admin_delete" on public.quotes;
create policy "admin_delete" on public.quotes for delete to authenticated using (public.is_admin());
drop policy if exists "own_or_admin_delete" on public.activities;
create policy "own_or_admin_delete" on public.activities for delete to authenticated
  using (created_by = auth.uid() or public.is_admin());

-- ---------- 8. Storage (photos fenêtres, PDF devis) — private buckets -----
insert into storage.buckets (id, name, public) values ('window-photos', 'window-photos', false)
on conflict (id) do nothing;
insert into storage.buckets (id, name, public) values ('quotes', 'quotes', false)
on conflict (id) do nothing;

drop policy if exists "ouaddi_team_read_files" on storage.objects;
create policy "ouaddi_team_read_files" on storage.objects for select to authenticated
  using (bucket_id in ('window-photos', 'quotes'));
drop policy if exists "ouaddi_team_upload_files" on storage.objects;
create policy "ouaddi_team_upload_files" on storage.objects for insert to authenticated
  with check (bucket_id in ('window-photos', 'quotes'));
drop policy if exists "ouaddi_admin_delete_files" on storage.objects;
create policy "ouaddi_admin_delete_files" on storage.objects for delete to authenticated
  using (bucket_id in ('window-photos', 'quotes') and (owner = auth.uid() or public.is_admin()));

-- ---------- 9. Live updates (calendar / pipeline refresh by themselves) ---
do $$ begin alter publication supabase_realtime add table public.leads;        exception when duplicate_object then null; end $$;
do $$ begin alter publication supabase_realtime add table public.appointments; exception when duplicate_object then null; end $$;
