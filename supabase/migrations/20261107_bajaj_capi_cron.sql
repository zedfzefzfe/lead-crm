-- =====================================================================
-- Bajaj Maroc CRM — run the QualifiedLead job every 15 minutes.
-- Supabase is the clock (Cloudflare Pages has no scheduler): pg_cron calls the
-- Cloudflare Pages Function, which holds the Meta token. Run after
-- 20261107_bajaj_capi_qualified.sql. Safe to run more than once.
--
-- If your CRM address is not https://lead-crm-abs.pages.dev, change it below.
-- =====================================================================

create extension if not exists pg_cron;
create extension if not exists pg_net;

-- Calls the job once (also handy to test it by hand: select public.capi_run_job();)
create or replace function public.capi_run_job()
returns bigint
language sql
security definer
set search_path = public
as $$
  select net.http_post(
    url := 'https://lead-crm-abs.pages.dev/api/capi-qualified',
    headers := jsonb_build_object('Content-Type', 'application/json',
                                  'x-job-secret', (select secret from capi_private.settings where id = 1)),
    body := '{}'::jsonb,
    timeout_milliseconds := 30000
  );
$$;
revoke all on function public.capi_run_job() from public, anon, authenticated;

-- Every 15 minutes (same name = replaces the previous schedule).
select cron.schedule('capi-qualified-leads', '*/15 * * * *', 'select public.capi_run_job();');
