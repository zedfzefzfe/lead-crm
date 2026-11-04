-- =====================================================================
-- Bajaj Maroc CRM — server-side Meta Conversions API "QualifiedLead"
--
-- 1. eligible_marked_at: set to now() when a lead becomes eligible, cleared when un-marked.
-- 2. capi_sent_at: set when the QualifiedLead event is sent, so it is never sent twice.
-- 3. Two functions used only by the scheduled job (functions/api/capi-qualified.js on
--    Cloudflare Pages). They need a secret that only the database and the scheduler know.
--
-- Additive and safe to run more than once. Run AFTER supabase/admin.sql and
-- 20261106_bajaj_eligible_admin_undo.sql. The scheduler itself is in
-- 20261107_bajaj_capi_cron.sql.
-- =====================================================================

-- ---------- 1. Columns ----------------------------------------------------

alter table public.leads add column if not exists eligible_marked_at timestamptz;
alter table public.leads add column if not exists capi_sent_at       timestamptz;

create index if not exists leads_capi_due_idx on public.leads (eligible_marked_at)
  where eligible and capi_sent_at is null;

-- Leads that were already eligible before this migration: use their last update as the
-- marking time, so they are sent too (only those marked in the last 7 days can be sent:
-- Meta refuses older events).
update public.leads set eligible_marked_at = updated_at
 where eligible and eligible_marked_at is null;

-- ---------- 2. Keep both columns honest ------------------------------------
-- The CRM (anon / logged-in users) can never write them directly:
-- - eligible_marked_at follows the eligible flag (false -> true: now(); true -> false: null);
-- - capi_sent_at can only be changed by the scheduled job (or from the SQL editor).
-- Runs after leads_keep_eligible (triggers run in name order), so an un-mark refused
-- for a non-admin does not clear the date.

create or replace function public.leads_stamp_eligible()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  privileged boolean :=
    coalesce(current_setting('capi.job', true), '') = 'on'                     -- the scheduled job
    or coalesce(auth.jwt() ->> 'role', '') not in ('anon', 'authenticated');  -- SQL editor / service
begin
  if tg_op = 'INSERT' then
    if not privileged then
      new.capi_sent_at := null;
      new.eligible_marked_at := case when new.eligible then now() end;
    elsif new.eligible and new.eligible_marked_at is null then
      new.eligible_marked_at := now();
    end if;
    return new;
  end if;

  if not privileged then
    new.capi_sent_at := old.capi_sent_at;
  end if;

  if new.eligible is distinct from old.eligible then
    new.eligible_marked_at := case when new.eligible then now() end;
  elsif not privileged then
    new.eligible_marked_at := old.eligible_marked_at;
  end if;
  return new;
end;
$$;

drop trigger if exists leads_stamp_eligible on public.leads;
create trigger leads_stamp_eligible
  before insert or update on public.leads
  for each row execute function public.leads_stamp_eligible();

-- ---------- 3. Job secret (never exposed to the CRM or the website) ------

create schema if not exists capi_private;
revoke all on schema capi_private from public, anon, authenticated;

create table if not exists capi_private.settings (
  id     int primary key default 1 check (id = 1),
  secret text not null
);
revoke all on capi_private.settings from public, anon, authenticated;
alter table capi_private.settings enable row level security; -- extra lock; the job functions run as owner

-- Random secret, generated once. Nobody has to copy it anywhere: the scheduler reads it here.
insert into capi_private.settings (id, secret)
values (1, replace(gen_random_uuid()::text, '-', '') || replace(gen_random_uuid()::text, '-', ''))
on conflict (id) do nothing;

create or replace function capi_private.check_secret(p_secret text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_secret is null or not exists (select 1 from capi_private.settings where secret = p_secret) then
    raise exception 'forbidden' using errcode = '42501';
  end if;
end;
$$;
revoke all on function capi_private.check_secret(text) from public, anon, authenticated;

-- ---------- 4. Functions for the scheduled job ----------------------------

-- Claims the leads that are due and returns them. Due = still eligible, never sent,
-- marked more than 2 hours ago (and less than 7 days ago, Meta's limit).
-- Claiming sets capi_sent_at right away, so two runs at the same time can never send the
-- same lead twice. If Meta then fails, the job calls capi_release() to retry next run.
create or replace function public.capi_claim_due(p_secret text, p_limit int default 50)
returns setof public.leads
language plpgsql
security definer
set search_path = public
as $$
begin
  perform capi_private.check_secret(p_secret);
  perform set_config('capi.job', 'on', true);
  return query
    with due as (
      select l.id from public.leads l
       where l.eligible
         and l.capi_sent_at is null
         and l.eligible_marked_at < now() - interval '2 hours'
         and l.eligible_marked_at > now() - interval '7 days'
       order by l.eligible_marked_at
       limit greatest(1, least(coalesce(p_limit, 50), 200))
       for update skip locked
    )
    update public.leads l set capi_sent_at = now()
      from due where l.id = due.id
    returning l.*;
end;
$$;

-- Gives a claimed lead back (Meta error, or test mode) so a later run sends it.
create or replace function public.capi_release(p_secret text, p_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  perform capi_private.check_secret(p_secret);
  perform set_config('capi.job', 'on', true);
  update public.leads set capi_sent_at = null where id = p_id;
end;
$$;

revoke all on function public.capi_claim_due(text, int) from public;
revoke all on function public.capi_release(text, uuid) from public;
grant execute on function public.capi_claim_due(text, int) to anon, authenticated;
grant execute on function public.capi_release(text, uuid) to anon, authenticated;
