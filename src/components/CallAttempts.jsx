import { useState } from 'react'
import { useLeads } from '../lib/leads'
import { CLIENT } from '../lib/constants'
import { formatDateTime } from '../lib/format'
import { t } from '../lib/i18n'

// Unanswered-call counter (Crea'rt, CLIENT.relance): "Appel 2/6" + dots, and the
// "Pas de réponse +1" button. The 6th unanswered call turns the lead into Perdue
// (after a confirmation). Counting is done by the database (register_call_attempt).
export const isRelanceLead = (lead) => Boolean(CLIENT.relance && CLIENT.relance.statuts.includes(lead.statut))

export function AttemptsBadge({ lead, className = '' }) {
  if (!CLIENT.relance) return null
  const max = CLIENT.relance.maxAttempts
  const n = Math.min(lead.tentatives || 0, max)
  const last = n >= max - 1
  return (
    <span className={`inline-flex items-center gap-1.5 text-[12px] font-medium ${last ? 'text-red-600' : 'text-muted'} ${className}`} title={t('att.title')}>
      <span className="flex gap-0.5" aria-hidden="true">
        {Array.from({ length: max }, (_, i) => (
          <span key={i} className={`h-1.5 w-1.5 rounded-full ${i < n ? (last ? 'bg-red-500' : 'bg-gold') : 'bg-line'}`} />
        ))}
      </span>
      {t('att.count', { x: n, y: max })}
    </span>
  )
}

export function CallAttempts({ lead }) {
  const { registerCallAttempt, notify } = useLeads()
  const [busy, setBusy] = useState(false)
  const [confirming, setConfirming] = useState(false)
  if (!isRelanceLead(lead)) return null
  const max = CLIENT.relance.maxAttempts
  const n = lead.tentatives || 0
  const lastCall = n + 1 >= max

  const add = async () => {
    setBusy(true)
    try {
      const updated = await registerCallAttempt(lead.id)
      if (updated?.statut === 'Perdue') notify(t('att.lost', { x: lead.nom }))
    } catch (e) {
      notify(t('error', { x: e.message }))
    } finally {
      setBusy(false)
      setConfirming(false)
    }
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-2">
      <div className="min-w-0">
        <AttemptsBadge lead={lead} />
        {lead.derniere_tentative && <p className="mt-0.5 text-[11px] text-muted">{t('att.last', { x: formatDateTime(lead.derniere_tentative) })}</p>}
      </div>
      <button
        type="button"
        disabled={busy}
        onClick={() => (lastCall ? setConfirming(true) : add())}
        title={t('att.buttonTitle')}
        className="inline-flex h-8 items-center gap-1.5 whitespace-nowrap rounded-md border border-line bg-white px-2.5 text-[12px] font-semibold text-ink transition-colors hover:border-gold hover:bg-gold/5 disabled:opacity-50"
      >
        <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2zM16 2l6 6M22 2l-6 6" />
        </svg>
        {t('att.button')}
      </button>

      {confirming && (
        <div className="fixed inset-0 z-40 grid place-items-center bg-ink/40 px-4" onClick={() => !busy && setConfirming(false)}>
          <div className="card w-full max-w-md p-6 text-start" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-[17px] font-semibold text-ink">{t('att.confirmTitle', { x: max })}</h2>
            <p className="mt-1.5 text-[14px] text-muted">{t('att.confirmText', { x: lead.nom, y: max })}</p>
            <div className="mt-6 flex justify-end gap-2">
              <button type="button" className="btn-ghost" disabled={busy} onClick={() => setConfirming(false)}>{t('cancel')}</button>
              <button type="button" className="btn bg-red-600 text-white hover:bg-red-700" disabled={busy} onClick={add}>{t('att.confirmYes')}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
