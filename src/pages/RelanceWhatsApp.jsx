import { useEffect, useState } from 'react'
import QRCode from 'qrcode'
import { supabase } from '../lib/supabase'
import { useLeads } from '../lib/leads'
import PageHeader from '../components/PageHeader'
import { t } from '../lib/i18n'

// "Relance WhatsApp": the person who holds the SECONDARY phone scans the QR here,
// checks the connected number, then runs a test or the real paced sending.
// The sending itself is done by the program in whatsapp-relance/ (a computer that stays on);
// this page only shows its state (table wa_relance, live) and sends it commands.
// supabase/migrations/20261110_creart_whatsapp_relance.sql

const ONLINE_MS = 20_000 // no heartbeat for 20 s = program off

export default function RelanceWhatsApp() {
  const { notify, isAdmin } = useLeads()
  const [row, setRow] = useState(null)
  const [loadError, setLoadError] = useState(null)
  const [qrImg, setQrImg] = useState(null)
  const [now, setNow] = useState(Date.now())
  const [busy, setBusy] = useState(null)

  // State + live updates (and a slow poll, in case realtime is off).
  useEffect(() => {
    let alive = true
    const load = () =>
      supabase
        .from('wa_relance')
        .select('*')
        .eq('id', 1)
        .maybeSingle()
        .then(({ data, error }) => {
          if (!alive) return
          if (error) setLoadError(error.message)
          else { setRow(data); setLoadError(null) }
        })
    load()
    const poll = setInterval(load, 8000)
    const channel = supabase
      .channel('wa_relance')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'wa_relance' }, (p) => p.new && setRow(p.new))
      .subscribe()
    const tick = setInterval(() => setNow(Date.now()), 1000)
    return () => {
      alive = false
      clearInterval(poll)
      clearInterval(tick)
      supabase.removeChannel(channel)
    }
  }, [])

  useEffect(() => {
    if (!row?.qr) return setQrImg(null)
    QRCode.toDataURL(row.qr, { width: 320, margin: 1 }).then(setQrImg).catch(() => setQrImg(null))
  }, [row?.qr])

  const online = row?.heartbeat && now - new Date(row.heartbeat).getTime() < ONLINE_MS
  const status = online ? row.status : 'offline'
  const running = status === 'sending' || status === 'testing'
  const linked = ['connected', 'paused', 'done', 'sending', 'testing'].includes(status) && row?.wa_number

  const send = async (command, confirmText, arg = null) => {
    if (confirmText && !window.confirm(confirmText)) return
    setBusy(command)
    const { error } = await supabase.rpc('wa_relance_command', { p_command: command, p_arg: arg })
    setBusy(null)
    if (error) notify(t('error', { x: error.message }))
    else notify(t('wa.sentCmd'))
  }

  if (loadError) {
    return (
      <div>
        <PageHeader title={t('wa.title')} />
        <div className="card p-6 text-[14px] text-muted">{t('wa.notInstalled')}</div>
      </div>
    )
  }
  if (!row) return <p className="text-muted">{t('loading')}</p>

  const phone = row.wa_number ? `+${row.wa_number}` : ''
  const pct = row.total ? Math.round(((row.done + row.failed + row.skipped) / row.total) * 100) : 0
  const nextIn = row.next_at ? Math.max(0, Math.round((new Date(row.next_at).getTime() - now) / 1000)) : null

  return (
    <div>
      <PageHeader title={t('wa.title')} subtitle={t('wa.subtitle')} />

      <div className="mb-4 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-[13px] text-amber-900">
        {t('wa.secondaryWarning')}
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        {/* Connection */}
        <section className="card p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-[15px] font-semibold text-ink">{t('wa.connection')}</h2>
            <StatusPill status={status} />
          </div>

          {status === 'offline' && <p className="text-[14px] text-muted">{t('wa.offlineText')}</p>}

          {status === 'starting' && <p className="text-[14px] text-muted">{row.message || t('wa.starting')}</p>}

          {status === 'qr' && (
            <div className="flex flex-col items-center gap-3 text-center">
              {qrImg ? (
                <img src={qrImg} alt="QR WhatsApp" className="h-64 w-64 rounded-md border border-line bg-white p-2" />
              ) : (
                <div className="grid h-64 w-64 place-items-center text-muted">{t('loading')}</div>
              )}
              <ol className="max-w-sm list-decimal space-y-1 ps-5 text-start text-[13px] text-ink">
                <li>{t('wa.scan1')}</li>
                <li>{t('wa.scan2')}</li>
                <li>{t('wa.scan3')}</li>
              </ol>
              <p className="text-[12px] text-muted">{t('wa.qrRefresh')}</p>
              <PairByCode row={row} busy={busy} onPair={(num) => send('pair', null, num)} />
            </div>
          )}

          {linked && (
            <div className="space-y-3">
              <div className="rounded-md bg-sand px-4 py-3">
                <p className="eyebrow">{t('wa.connectedAs')}</p>
                <p dir="ltr" className="text-[20px] font-semibold tracking-tight text-ink">{phone}</p>
                {row.wa_name && <p className="text-[13px] text-muted">{row.wa_name}</p>}
              </div>
              <p className="text-[13px] text-muted">{t('wa.checkNumber')}</p>
              <button
                className="btn-ghost"
                disabled={!!busy}
                onClick={() => send('logout', t('wa.confirmLogout', { x: phone }))}
              >
                {t('wa.logout')}
              </button>
            </div>
          )}

          {status === 'error' && <p className="text-[14px] text-red-700">{row.message}</p>}

          {isAdmin && <RunnerKey />}
        </section>

        {/* Sending */}
        <section className="card p-5">
          <h2 className="mb-4 text-[15px] font-semibold text-ink">{t('wa.sending')}</h2>

          <div className="mb-4 grid grid-cols-3 gap-2 text-center">
            <Stat label={t('wa.statRemaining')} value={row.remaining} />
            <Stat label={row.dry_run ? t('wa.statTested') : t('wa.statSent')} value={row.done} />
            <Stat label={t('wa.statErrors')} value={row.failed + row.skipped} />
          </div>

          {(running || row.total > 0) && (
            <div className="mb-4">
              <div className="h-2 overflow-hidden rounded-full bg-sand">
                <div className="h-full bg-gold transition-all" style={{ width: `${pct}%` }} />
              </div>
              <p className="mt-1.5 text-[12px] text-muted">
                {row.dry_run ? t('wa.testRun') : t('wa.realRun')} · {pct}%
                {running && nextIn !== null && ` · ${t('wa.nextIn', { x: formatWait(nextIn) })}`}
              </p>
            </div>
          )}

          {row.message && status !== 'error' && status !== 'starting' && (
            <p className="mb-4 text-[13px] text-ink">{row.message}</p>
          )}

          <div className="flex flex-wrap gap-2">
            <button className="btn-ghost" disabled={!linked || running || !!busy} onClick={() => send('test')}>
              {t('wa.test')}
            </button>
            <button
              className="btn-gold"
              disabled={!linked || running || !!busy || row.remaining === 0}
              onClick={() => send('start', t('wa.confirmStart', { x: row.remaining, y: phone }))}
            >
              {status === 'paused' ? t('wa.resume') : t('wa.start')}
            </button>
            <button className="btn-ghost" disabled={!running || !!busy} onClick={() => send('pause')}>
              {t('wa.pause')}
            </button>
          </div>
          <p className="mt-3 text-[12px] text-muted">{t('wa.pacing')}</p>
        </section>
      </div>

      {/* Log */}
      <section className="card mt-4 p-5">
        <h2 className="mb-3 text-[15px] font-semibold text-ink">{t('wa.log')}</h2>
        {row.log?.length ? (
          <ul dir="auto" className="max-h-[420px] space-y-1 overflow-y-auto font-mono text-[12px] leading-5 text-ink">
            {[...row.log].reverse().map((l, i) => (
              <li key={i} className="flex gap-3">
                <span className="shrink-0 text-muted">{new Date(l.t).toLocaleTimeString()}</span>
                <span className="min-w-0 break-words">{l.m}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-[13px] text-muted">{t('wa.logEmpty')}</p>
        )}
      </section>
    </div>
  )
}

// When the CRM is open on the same phone as WhatsApp, the QR cannot be scanned:
// WhatsApp then links with an 8-character code typed on the phone, asked for that exact number.
function PairByCode({ row, busy, onPair }) {
  const [num, setNum] = useState('')
  const digits = num.replace(/\D/g, '').replace(/^0(?=[67])/, '212') // 06… / 07… -> 2126… / 2127…
  return (
    <div className="mt-2 w-full max-w-sm border-t border-line pt-4 text-start">
      <p className="text-[13px] font-medium text-ink">{t('wa.codeTitle')}</p>
      {row.pair_code ? (
        <div className="mt-2 space-y-2">
          <p className="text-[13px] text-muted">{t('wa.codeFor', { x: `+${row.pair_number}` })}</p>
          <p dir="ltr" className="rounded-md bg-sand py-3 text-center font-mono text-[26px] font-semibold tracking-[0.25em] text-ink">
            {row.pair_code.slice(0, 4)}-{row.pair_code.slice(4)}
          </p>
          <p className="text-[12px] text-muted">{t('wa.codeSteps')}</p>
        </div>
      ) : (
        <>
          <p className="mt-1 text-[12px] text-muted">{t('wa.codeHelp')}</p>
          <div className="mt-2 flex gap-2">
            <input
              dir="ltr"
              inputMode="tel"
              className="input"
              placeholder="2126XXXXXXXX"
              value={num}
              onChange={(e) => setNum(e.target.value)}
            />
            <button className="btn-ghost" disabled={digits.length < 11 || !!busy} onClick={() => onPair(digits)}>
              {t('wa.getCode')}
            </button>
          </div>
        </>
      )}
    </div>
  )
}

const PILL = {
  offline: 'bg-stone-400',
  starting: 'bg-blue-400',
  qr: 'bg-amber-400',
  connected: 'bg-green-600',
  paused: 'bg-amber-500',
  testing: 'bg-blue-500',
  sending: 'bg-green-500 animate-pulse',
  done: 'bg-green-700',
  error: 'bg-red-500',
}

function StatusPill({ status }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-line px-2.5 py-0.5 text-[12px] font-medium text-ink">
      <span className={`h-2 w-2 rounded-full ${PILL[status] || 'bg-stone-400'}`} />
      {t(`wa.status.${status}`)}
    </span>
  )
}

function Stat({ label, value }) {
  return (
    <div className="rounded-md bg-sand px-2 py-2.5">
      <p className="text-[20px] font-semibold text-ink">{value ?? 0}</p>
      <p className="text-[11px] text-muted">{label}</p>
    </div>
  )
}

function formatWait(s) {
  if (s >= 60) return `${Math.floor(s / 60)} min ${String(s % 60).padStart(2, '0')} s`
  return `${s} s`
}

// Admins: the secret key the sending program needs (whatsapp-relance/.env).
function RunnerKey() {
  const [key, setKey] = useState(null)
  const reveal = async () => {
    const { data, error } = await supabase.rpc('wa_relance_token')
    setKey(error ? `— ${error.message}` : data || '—')
  }
  return (
    <details className="mt-5 border-t border-line pt-4 text-[13px]">
      <summary className="cursor-pointer text-muted">{t('wa.keyTitle')}</summary>
      <p className="mt-2 text-muted">{t('wa.keyHelp')}</p>
      {key ? (
        <div className="mt-2 flex items-center gap-2">
          <code dir="ltr" className="min-w-0 flex-1 truncate rounded bg-sand px-2 py-1.5 text-[12px]">{key}</code>
          <button className="btn-ghost h-8" onClick={() => navigator.clipboard?.writeText(key)}>{t('wa.copy')}</button>
        </div>
      ) : (
        <button className="btn-ghost mt-2 h-8" onClick={reveal}>{t('wa.showKey')}</button>
      )}
    </details>
  )
}
