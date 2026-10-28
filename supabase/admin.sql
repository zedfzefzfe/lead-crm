-- =====================================================================
-- Admin: allow chosen accounts to delete leads.
-- Paste this file into Supabase > SQL Editor > New query > Run
-- (in each project where you want it: Crea'rt and/or Bajaj).
-- Safe to run more than once.
-- =====================================================================

-- 1. List of admin accounts (emails of users created in Authentication > Users).
create table if not exists public.admins (
  email text primary key
);

alter table public.admins enable row level security;
revoke all on public.admins from anon, authenticated;
grant select on public.admins to authenticated;

-- Each logged-in user can only see whether they themselves are admin.
drop policy if exists "read_own_admin_row" on public.admins;
create policy "read_own_admin_row" on public.admins
  for select to authenticated
  using (lower(email) = lower(auth.jwt() ->> 'email'));

-- 2. "Am I admin?" — used by the CRM to show the Administration page.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from admins where lower(email) = lower(auth.jwt() ->> 'email'));
$$;

revoke all on function public.is_admin() from public, anon;
grant execute on function public.is_admin() to authenticated;

-- 3. Only admins may delete leads (their history is deleted with them).
--    Everyone else keeps the same rights as before: read, add, update — no delete.
grant delete on public.leads to authenticated;

drop policy if exists "admin_delete_leads" on public.leads;
create policy "admin_delete_leads" on public.leads
  for delete to authenticated
  using (public.is_admin());

-- 4. Who is admin. ⚠️ Replace the email below by YOUR login email, then Run.
--    To add another admin later:  insert into public.admins (email) values ('other@email.com');
--    To remove one:               delete from public.admins where email = 'other@email.com';
insert into public.admins (email) values (lower('VOTRE_EMAIL@exemple.com'))
on conflict (email) do nothing;
