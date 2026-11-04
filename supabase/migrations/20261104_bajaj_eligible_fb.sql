-- =====================================================================
-- Bajaj Maroc CRM — "Éligible" flag + Meta click identifiers
-- Run in Supabase (bajaj-crm project) > SQL Editor > New query > Run.
-- Additive and safe to run more than once: existing rows and the current
-- website insert (which sends none of these columns) keep working unchanged.
-- =====================================================================

-- Set by the sales team after confirming on the phone that the client qualifies
-- (credit or cash). Independent of statut.
alter table public.leads add column if not exists eligible boolean not null default false;

-- Meta identifiers (_fbc / _fbp cookies, fbclid URL parameter). Optional: null when absent.
alter table public.leads add column if not exists fb_fbc text;
alter table public.leads add column if not exists fb_fbp text;
alter table public.leads add column if not exists fb_fbclid text;
