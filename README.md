# Crea'rt Workshops — CRM

A small CRM for Crea'rt Workshops leads (landing page, WhatsApp, Instagram).
It updates in real time: when one person changes a lead, everyone else sees the change right away.

**Stack:** React + Vite + Tailwind CSS · Supabase (Postgres, Auth, Realtime) · Vercel

```
supabase/schema.sql      ← the SQL to run once in Supabase
src/
  lib/supabase.js        ← Supabase client (reads the 2 env variables)
  lib/leads.jsx          ← loads leads + realtime sync + "new lead" notification
  lib/constants.js       ← statuses, reasons, sources, badge colours, default atelier
  lib/format.js          ← dates, DH amounts, tel: / WhatsApp links
  components/            ← Layout (menu), StatusBadge, LeadCard, Toasts
  pages/                 ← Login, Dashboard, Leads, LeadDetail, Relances, AddLead
landing-page/            ← the change for the creart-workshops landing page (patch)
```

---

## 1. Database: run the SQL

1. Open Supabase → your project → **SQL Editor** → **New query**.
2. Paste the whole content of [`supabase/schema.sql`](supabase/schema.sql) and click **Run**.

This creates:

- the `leads` table (statut defaults to `Nouveau`, with value checks for statut / raison / source)
- the `lead_history` table, filled automatically by a trigger whenever `statut`, `raison`, `montant_acompte` or `notes` change
- a trigger that sets `updated_at`, and sets `updated_by` to the logged-in user's email (taken from their login, so it can't be faked)
- Row Level Security:
  - **anonymous** (landing page): can only INSERT a lead with `statut = 'Nouveau'` (and acompte 0). Cannot read anything.
  - **logged in**: can read, add and update all leads, and read the history. **Nobody can delete a lead**, so nothing gets lost.
- Realtime on `leads` (and on `lead_history`, so the history list on a lead page also updates live)

You can run the script again later; it won't break anything.

## 2. Create the 3 user accounts

There is no sign-up page. You create the accounts yourself:

1. Supabase → **Authentication** → **Users** → **Add user** → **Create new user**.
2. Enter the email and a password, and tick **Auto Confirm User**.
3. Do this 3 times: you, Houda, the assistant.
4. Recommended: **Authentication → Sign In / Providers → Email**: turn **off** "Allow new users to sign up".
   That way nobody else can create an account with your public key.

To change a password later: Users → click the user → **Send password recovery**, or delete the user and create them again.
Leads and history stay safe either way.

## 3. Code

- CRM: this repository.
- Landing page: the change is in [`landing-page/creart-workshops.patch`](landing-page/creart-workshops.patch).
  It only changes the bottom `<script>` part of `index.html` (see section 6).

## 4. Deploy on Vercel

1. Go to [vercel.com](https://vercel.com) → **Add New… → Project** → import this GitHub repository.
2. Vercel detects **Vite** on its own. Keep the defaults (build command `npm run build`, output folder `dist`).
3. Open **Environment Variables** and add these two:
   | Name | Value |
   |---|---|
   | `VITE_SUPABASE_URL` | your Project URL (Supabase → Project Settings → API) |
   | `VITE_SUPABASE_ANON_KEY` | your **anon public** key (never the service_role key) |
4. Click **Deploy**. If you add or change the variables later, use **Deployments → Redeploy** so they take effect.
5. Optional: in Supabase → **Authentication → URL Configuration**, set the **Site URL** to your Vercel address.

`vercel.json` sends every URL to the app, so links like `/leads/…` work when you refresh the page.

### Run it on your computer (optional)

```bash
cp .env.example .env.local   # then paste your URL + anon key into it
npm install
npm run dev
```

## 5. Test checklist

1. ☐ Open the CRM on a computer and log in with account A (for example Houda). Go to **Leads**.
2. ☐ Open the CRM on a phone and log in with account B (for example the assistant). Go to **Leads**.
3. ☐ On a third tab or device, open `creart-workshops.vercel.app` and submit the form with a test name and phone number.
4. ☐ Within a few seconds, the lead shows up on **both** screens without refreshing, with a "Nouveau lead : …" notification.
   It has source *Landing page*, atelier *Bougies Casa 17 Oct* and status *Nouveau*.
5. ☐ Check that the EmailJS email still arrives, the thank-you message still shows, and the Meta Pixel `Lead` event still fires (Meta Events Manager → Test events, or the Pixel Helper extension).
6. ☐ On device A, open the lead and change its status to *Intéressée*, then add a note.
7. ☐ On device B, the badge, the counts and the history update right away. The history says who changed what and when.
8. ☐ The **WhatsApp** button opens a chat with the right number (06… becomes 2126…) and a pre-filled message.
   The **Appeler** button starts a phone call.
9. ☐ **Ajouter un lead**: add a WhatsApp lead manually. It appears on the other device.
10. ☐ Close the phone browser and open it again: you are still logged in. **Déconnexion** logs you out.
11. ☐ Security check: in a private window, the CRM shows only the login page.

## 6. Landing page change (creart-workshops)

Three additions to `index.html`. EmailJS, the Pixel, the `Lead` event and the design are not touched:

1. The Supabase library is loaded from the CDN, next to EmailJS:
   `<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>`
2. `CONFIG.supabase = { url, anonKey, atelier: "Bougies Casa 17 Oct" }`. **Paste your URL and anon key here.**
   Until you do, the landing page works exactly as before and skips the CRM.
3. A `saveLeadToCRM(name, phone, city)` function, called in the EmailJS success callback right after `fbq('track','Lead')`.
   It runs in the background, and every error is caught and only written to the console.
   So if Supabase fails, the email, the pixel and the thank-you message are not affected.

To apply the patch by hand: in a clone of `creart-workshops`, run `git apply path/to/creart-workshops.patch`, then commit and push.

When you run a new atelier, change `atelier` in `CONFIG.supabase` on the landing page.
In the CRM, also change `DEFAULT_ATELIER` in `src/lib/constants.js` (the pre-filled value on "Ajouter un lead").
