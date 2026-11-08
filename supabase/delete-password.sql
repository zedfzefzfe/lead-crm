-- =====================================================================
-- Delete leads with a password (Crea'rt CRM; works for any client project).
-- Paste into Supabase > SQL Editor > New query, CHANGE THE PASSWORD on the
-- marked line, then Run. Safe to run again: it just replaces the password.
--
-- The password is stored only as a bcrypt hash, and it is checked inside the
-- database: the CRM screens never see it, and nobody can delete a lead
-- without it (logged-in users only; the website cannot delete anything).
-- =====================================================================

create extension if not exists pgcrypto with schema extensions;

create schema if not exists crm_private;
revoke all on schema crm_private from public, anon, authenticated;

create table if not exists crm_private.delete_password (
  id   int primary key default 1 check (id = 1),
  hash text not null
);
alter table crm_private.delete_password enable row level security;
revoke all on crm_private.delete_password from public, anon, authenticated;

-- >>> Put your password between the quotes (at least 8 characters). <<<
insert into crm_private.delete_password (id, hash)
values (1, extensions.crypt('CHANGE-ME-PASSWORD', extensions.gen_salt('bf')))
on conflict (id) do update set hash = excluded.hash;

-- Deletes the given leads (and their history) if the password is right.
-- Returns how many leads were deleted. Wrong password: error "wrong_password".
create or replace function public.delete_leads_with_password(p_password text, p_ids uuid[])
returns int
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  n int;
begin
  if coalesce(auth.jwt() ->> 'role', '') <> 'authenticated' then
    raise exception 'not_logged_in' using errcode = '42501';
  end if;
  if p_password is null or not exists (
    select 1 from crm_private.delete_password where hash = extensions.crypt(p_password, hash)
  ) then
    perform pg_sleep(1); -- slows down guessing
    raise exception 'wrong_password' using errcode = '28P01';
  end if;
  delete from public.leads where id = any (p_ids);
  get diagnostics n = row_count;
  return n;
end;
$$;

revoke all on function public.delete_leads_with_password(text, uuid[]) from public, anon;
grant execute on function public.delete_leads_with_password(text, uuid[]) to authenticated;
