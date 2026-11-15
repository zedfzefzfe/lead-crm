# Ouaddi Living — CRM

Mobile-first CRM for made-to-measure curtains and armchairs (Casablanca, Rabat). Its main job is to keep track of **rendez-vous**: measuring visits, installations (pose) and deliveries. It is built on the same base as the Crea'rt and Bajaj CRMs: React + Vite + Tailwind, Supabase (Auth, RLS, Realtime) and Vercel. This app adds **TypeScript** and **shadcn/ui** components (`src/components/ui`).

## Phase 1 (this folder)

| Screen | What it does |
| --- | --- |
| **Accueil** | Today's RDV (split Casa / Rabat), the rest of the week, revenue marked « gagné » (week / month), follow-ups due (tasks + leads with no activity for > 3 days), funnel by stage, leads of the month by source |
| **Rendez-vous** | List (next 7 days), Day and Week views, one colour per type (mesures, pose, livraison, visite), Casa / Rabat filter. Tap an empty slot to create an RDV; tap an RDV to set its status in one tap, move it, or WhatsApp / call the client |
| **Pipeline** | Kanban by stage with drag and drop (long press on a phone). « Perdu » asks for the reason |
| **Leads** | Search and filters (stage, source, assignee, « à relancer ») |
| **Lead** | WhatsApp / Appeler / RDV buttons, stage, timeline, RDV, follow-ups, details (saved automatically) |
| **Équipe** (admin) | Names and roles |

- **« + » on every screen**: add a lead (name, phone, *Enregistrer*) or an RDV in 2–3 taps. *Enregistrer + RDV* opens the RDV form for the new lead straight away.
- **The timeline fills itself**: stage changes, new or moved RDV, WhatsApp opened or call started from the CRM. A lead with no activity for more than 3 days shows as **à relancer**.
- Times are always shown in **Moroccan time**. Lists refresh by themselves (Realtime) on every team phone.

## Setup

1. **Supabase**: create a project (separate from Crea'rt / Bajaj), then go to SQL Editor and run, in this order:
   1. [`supabase/migrations/20261115_01_ouaddi_schema.sql`](supabase/migrations/20261115_01_ouaddi_schema.sql): types, tables, RLS, triggers, Storage buckets.
   2. [`supabase/migrations/20261115_02_ouaddi_seed.sql`](supabase/migrations/20261115_02_ouaddi_seed.sql): 5 demo leads and their RDV. Optional; remove them with `delete from public.leads where source_detail like 'DEMO%';`.
   Both scripts can be run more than once.
2. **Accounts**: Authentication → Users → *Add user* (email + password, *Auto confirm*).
   **The first account created becomes admin**; the next ones are *agents*. Roles can be changed on the Équipe page.
   Also recommended: Authentication → Sign In / Providers → turn off *Allow new users to sign up*.
3. **Vercel**: new project from this repo, with **Root Directory = `ouaddi-crm`**, framework Vite, and these environment variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY` (the public anon / publishable key, **never** the service_role key)
4. Local run: `cp .env.example .env`, then `npm install` and `npm run dev`.

## Who can do what (RLS)

- Not logged in: no access at all.
- Admin and agent: read, add and edit leads, RDV, timeline, follow-ups and devis.
- Delete a lead or a devis, delete someone else's note, change a role: **admin only**. The database enforces this, not just the screen.

## Phase 2 (not built yet)

Devis (PDF) and photo upload: the `quotes` and `window-photos` buckets and their rules already exist. Also planned: automatic follow-up tasks, and a WhatsApp reminder the day before each RDV (J-1), sent through Evolution API by a Supabase Edge Function + pg_cron, with the URL and key in the function's secrets (never in the code).
