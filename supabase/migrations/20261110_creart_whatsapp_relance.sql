-- =====================================================================
-- Crea'rt CRM — "Relance WhatsApp" page.
-- Paste into Supabase (Crea'rt project) > SQL Editor > New query > Run.
-- Additive and safe to run more than once.
--
-- The sender program (whatsapp-relance/) keeps WhatsApp open on a computer that
-- stays on. It writes its state here (QR code, connected number, progress) and
-- reads the buttons clicked on the CRM page (test / start / pause / logout).
--   - Logged-in CRM users: read the state, send a command. Nothing else.
--   - The sender: identified by a secret key (header x-relance-token), shown to
--     admins on the page. Without that key nobody can write the state.
-- =====================================================================

-- 1. State: one row (id = 1).
create table if not exists public.wa_relance (
  id          int primary key default 1 check (id = 1),
  status      text not null default 'offline', -- offline|starting|qr|connected|testing|sending|paused|done|error
  qr          text,                             -- current QR code (refreshes every ~20 s)
  pair_code   text,                             -- or: 8-character code to type on the phone
  pair_number text,                             -- number the pairing code was asked for
  wa_number   text,                             -- number connected in WhatsApp (e.g. 2126…)
  wa_name     text,
  dry_run     boolean not null default false,   -- current run is a test (nothing sent)
  total       int not null default 0,           -- leads still to message at the start of the run
  done        int not null default 0,
  failed      int not null default 0,
  skipped     int not null default 0,           -- not on WhatsApp
  remaining   int not null default 0,
  next_at     timestamptz,                      -- next message / end of the batch pause
  message     text,                             -- last error / info line
  log         jsonb not null default '[]'::jsonb, -- last 200 lines [{t, m}]
  heartbeat   timestamptz,                      -- sender alive (every ~5 s)
  command     text check (command in ('test', 'start', 'pause', 'logout', 'pair')),
  command_arg text,                             -- 'pair': the phone number
  command_by  text,
  command_at  timestamptz,
  updated_at  timestamptz not null default now()
);
insert into public.wa_relance (id) values (1) on conflict (id) do nothing;

-- 2. Secret key of the sender program (no one can read this table directly).
create table if not exists public.wa_relance_secret (
  id    int primary key default 1 check (id = 1),
  token text not null default replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', '')
);
insert into public.wa_relance_secret (id) values (1) on conflict (id) do nothing;

alter table public.wa_relance        enable row level security;
alter table public.wa_relance_secret enable row level security;
revoke all on public.wa_relance, public.wa_relance_secret from anon, authenticated;
grant select on public.wa_relance to authenticated;

drop policy if exists "team_reads_wa_relance" on public.wa_relance;
create policy "team_reads_wa_relance" on public.wa_relance
  for select to authenticated using (true);

-- 3. CRM button -> command for the sender.
drop function if exists public.wa_relance_command(text);
create or replace function public.wa_relance_command(p_command text, p_arg text default null)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_command not in ('test', 'start', 'pause', 'logout', 'pair') then
    raise exception 'commande inconnue: %', p_command;
  end if;
  update wa_relance
     set command = p_command, command_arg = left(regexp_replace(coalesce(p_arg, ''), '\D', '', 'g'), 20),
         command_by = auth.jwt() ->> 'email', command_at = now()
   where id = 1;
end;
$$;
revoke all on function public.wa_relance_command(text, text) from public, anon;
grant execute on function public.wa_relance_command(text, text) to authenticated;

-- 4. Admins: see the sender's secret key (to set up the sender program).
create or replace function public.wa_relance_token()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select token from wa_relance_secret
   where id = 1
     and exists (select 1 from admins where lower(email) = lower(auth.jwt() ->> 'email'));
$$;
revoke all on function public.wa_relance_token() from public, anon;
grant execute on function public.wa_relance_token() to authenticated;

-- 5. Sender program: report state, receive the pending command (cleared once read).
--    Returns {command, arg} or null.
--    p_state: any of the state columns above, plus "log_add": [{t, m}, …] to append.
drop function if exists public.wa_relance_sync(jsonb);
create or replace function public.wa_relance_sync(p_state jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  sent_token text := current_setting('request.headers', true)::json ->> 'x-relance-token';
  cmd jsonb;
begin
  if sent_token is null or sent_token <> (select token from wa_relance_secret where id = 1) then
    raise exception 'cle du programme d''envoi invalide' using errcode = '42501';
  end if;

  -- A click older than 2 minutes (sender was off) is dropped, never run later by surprise.
  select case when command_at > now() - interval '2 minutes' and command is not null
              then jsonb_build_object('command', command, 'arg', command_arg) end
    into cmd from wa_relance where id = 1 for update;

  update wa_relance set
    status    = coalesce(p_state ->> 'status', status),
    qr        = case when p_state ? 'qr' then p_state ->> 'qr' else qr end,
    pair_code = case when p_state ? 'pair_code' then p_state ->> 'pair_code' else pair_code end,
    pair_number = case when p_state ? 'pair_number' then p_state ->> 'pair_number' else pair_number end,
    wa_number = case when p_state ? 'wa_number' then p_state ->> 'wa_number' else wa_number end,
    wa_name   = case when p_state ? 'wa_name' then p_state ->> 'wa_name' else wa_name end,
    dry_run   = coalesce((p_state ->> 'dry_run')::boolean, dry_run),
    total     = coalesce((p_state ->> 'total')::int, total),
    done      = coalesce((p_state ->> 'done')::int, done),
    failed    = coalesce((p_state ->> 'failed')::int, failed),
    skipped   = coalesce((p_state ->> 'skipped')::int, skipped),
    remaining = coalesce((p_state ->> 'remaining')::int, remaining),
    next_at   = case when p_state ? 'next_at' then (p_state ->> 'next_at')::timestamptz else next_at end,
    message   = case when p_state ? 'message' then p_state ->> 'message' else message end,
    log       = case when jsonb_typeof(p_state -> 'log_add') = 'array'
                     then (select coalesce(jsonb_agg(x order by n), '[]'::jsonb) from (
                             select x, n from jsonb_array_elements(log || (p_state -> 'log_add'))
                                    with ordinality as e(x, n)
                             order by n desc limit 200) last)
                     else log end,
    heartbeat = now(),
    command   = null,
    command_arg = null,
    updated_at = now()
  where id = 1;

  return cmd;
end;
$$;
revoke all on function public.wa_relance_sync(jsonb) from public;
grant execute on function public.wa_relance_sync(jsonb) to anon, authenticated;

-- 6. Live updates on the CRM page.
do $$ begin
  alter publication supabase_realtime add table public.wa_relance;
exception when duplicate_object then null; end $$;
