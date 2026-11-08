import { useState } from 'react'
import { useLeads } from '../lib/leads'
import { t } from '../lib/i18n'

// "Delete" for one lead, protected by a password checked in the database
// (supabase/delete-password.sql). Shown only when CLIENT.passwordDelete is on.
export default function DeleteLeadButton({ lead, variant = 'icon', onDeleted }) {
  const { deleteLeadsWithPassword, notify } = useLeads()
  const [open, setOpen] = useState(false)
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const close = () => {
    if (busy) return
    setOpen(false)
    setPassword('')
    setError('')
  }

  const submit = async (e) => {
    e.preventDefault()
    if (!password || busy) return
    setBusy(true)
    setError('')
    try {
      await deleteLeadsWithPassword([lead.id], password)
      notify(t('del.done', { x: lead.nom }))
      setOpen(false)
      onDeleted?.()
    } catch (err) {
      setError(
        err.code === 'wrong_password' ? t('del.wrong') : err.code === 'not_configured' ? t('del.notConfigured') : t('error', { x: err.message })
      )
    } finally {
      setBusy(false)
      setPassword('')
    }
  }

  const trash = (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6M10 11v6M14 11v6" />
    </svg>
  )

  return (
    <>
      {variant === 'icon' ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          title={t('del.button')}
          aria-label={t('del.button')}
          className="rounded-md p-1.5 text-muted/60 transition-colors hover:bg-red-50 hover:text-red-600"
        >
          {trash}
        </button>
      ) : (
        <button type="button" onClick={() => setOpen(true)} className="btn border border-red-200 bg-white text-red-600 hover:bg-red-50">
          {trash}
          {t('del.button')}
        </button>
      )}

      {open && (
        <div className="fixed inset-0 z-40 grid place-items-center bg-ink/40 px-4" onClick={close}>
          <form className="card w-full max-w-md p-6 text-start" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()} onSubmit={submit}>
            <div className="mb-4 grid h-10 w-10 place-items-center rounded-full bg-red-50 text-red-600">{trash}</div>
            <h2 className="whitespace-normal text-[17px] font-semibold text-ink">{t('del.title')}</h2>
            <p className="mt-1.5 whitespace-normal break-words text-[14px] font-normal text-muted">{t('del.text', { x: lead.nom })}</p>
            <label className="label mt-4" htmlFor={`del-pw-${lead.id}`}>{t('del.password')}</label>
            <input
              id={`del-pw-${lead.id}`}
              type="password"
              autoFocus
              autoComplete="off"
              className={`input ${error ? 'border-red-400 focus:border-red-500 focus:ring-red-500/15' : ''}`}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value)
                setError('')
              }}
            />
            {error && <p className="mt-1.5 text-[13px] font-medium text-red-600" role="alert">{error}</p>}
            <div className="mt-6 flex justify-end gap-2">
              <button type="button" className="btn-ghost" disabled={busy} onClick={close}>{t('cancel')}</button>
              <button type="submit" className="btn bg-red-600 text-white hover:bg-red-700" disabled={busy || !password}>
                {busy ? t('admin.deleting') : t('del.confirm')}
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  )
}
