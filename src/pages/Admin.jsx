import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useLeads } from '../lib/leads'
import { ITEM, SOURCE_LABELS, STATUTS } from '../lib/constants'
import { formatDate } from '../lib/format'
import { t, tv } from '../lib/i18n'
import PageHeader from '../components/PageHeader'
import StatusBadge from '../components/StatusBadge'

// Admins only: select leads and delete them permanently.
// The database itself refuses deletes from non-admin accounts (supabase/admin.sql).
export default function Admin() {
  const { leads, loading, isAdmin, deleteLeads, notify } = useLeads()
  const [q, setQ] = useState('')
  const [statut, setStatut] = useState('')
  const [selected, setSelected] = useState(() => new Set())
  const [confirming, setConfirming] = useState(false)
  const [busy, setBusy] = useState(false)

  const filtered = useMemo(() => {
    const text = q.toLowerCase().trim()
    const digits = text.replace(/\D/g, '')
    return leads.filter((l) => {
      if (statut && l.statut !== statut) return false
      if (!text) return true
      return (l.nom || '').toLowerCase().includes(text) || (digits && (l.telephone || '').replace(/\D/g, '').includes(digits))
    })
  }, [leads, q, statut])

  if (!isAdmin) {
    return (
      <div>
        <PageHeader title={t('nav.admin')} />
        <div className="card px-6 py-12 text-center text-muted">{t('admin.noAccess')}</div>
      </div>
    )
  }

  // Only count selected leads that still exist (a teammate may have deleted some).
  const ids = leads.filter((l) => selected.has(l.id)).map((l) => l.id)
  const allShown = filtered.length > 0 && filtered.every((l) => selected.has(l.id))

  const toggle = (id) =>
    setSelected((s) => {
      const next = new Set(s)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })

  const toggleAll = () =>
    setSelected((s) => {
      const next = new Set(s)
      filtered.forEach((l) => (allShown ? next.delete(l.id) : next.add(l.id)))
      return next
    })

  const remove = async () => {
    setBusy(true)
    try {
      const n = await deleteLeads(ids)
      notify(n > 0 ? t('admin.deleted', { x: n }) : t('admin.notAllowed'))
      setSelected(new Set())
    } catch (e) {
      notify(t('error', { x: e.message }))
    } finally {
      setBusy(false)
      setConfirming(false)
    }
  }

  return (
    <div className="pb-20">
      <PageHeader title={t('nav.admin')} subtitle={t('admin.subtitle')} />

      <div className="flex flex-wrap items-center gap-2">
        <input className="input w-full md:w-72" placeholder={t('leads.search')} value={q} onChange={(e) => setQ(e.target.value)} />
        <select className={`input w-auto pe-7 ${statut ? 'border-gold/50 bg-gold/5 font-medium' : 'text-muted'}`} value={statut} onChange={(e) => setStatut(e.target.value)}>
          <option value="">{t('leads.status')}</option>
          {STATUTS.map((s) => <option key={s} value={s}>{tv(s)}</option>)}
        </select>
      </div>

      {loading && <p className="mt-6 text-muted">{t('loading')}</p>}

      <div className="card mt-4 overflow-hidden">
        <label className="flex cursor-pointer items-center gap-3 border-b border-line bg-sand/50 px-4 py-2.5 text-[13px] font-medium text-muted">
          <input type="checkbox" className="h-4 w-4 accent-[var(--color-gold)]" checked={allShown} onChange={toggleAll} />
          {t('admin.selectAll')} ({filtered.length})
        </label>
        {filtered.length === 0 && !loading && <p className="px-4 py-10 text-center text-[13px] text-muted">{t('leads.empty')}</p>}
        <ul className="divide-y divide-line">
          {filtered.map((l) => (
            <li key={l.id}>
              <label className={`flex cursor-pointer items-center gap-3 px-4 py-3 transition-colors ${selected.has(l.id) ? 'bg-red-50/60' : 'hover:bg-sand/30'}`}>
                <input type="checkbox" className="h-4 w-4 shrink-0 accent-[var(--color-gold)]" checked={selected.has(l.id)} onChange={() => toggle(l.id)} />
                <div className="min-w-0 flex-1">
                  <Link to={`/leads/${l.id}`} className="font-medium text-ink hover:text-gold" onClick={(e) => e.stopPropagation()}>
                    {l.nom}
                  </Link>
                  <p className="truncate text-[12px] text-muted">
                    {[l.telephone, l[ITEM.key], tv(SOURCE_LABELS[l.source]), formatDate(l.created_at)].filter(Boolean).join(' · ')}
                  </p>
                </div>
                <StatusBadge statut={l.statut} />
              </label>
            </li>
          ))}
        </ul>
      </div>

      {/* Action bar */}
      {ids.length > 0 && (
        <div className="fixed inset-x-3 bottom-20 z-20 mx-auto flex max-w-xl items-center justify-between gap-3 rounded-lg bg-ink px-4 py-3 text-white shadow-xl md:bottom-6 md:start-68 md:end-8">
          <span className="whitespace-nowrap text-[14px] font-medium">{t('admin.selected', { x: ids.length })}</span>
          <div className="flex gap-2">
            <button className="btn hidden h-8 px-3 text-white/80 hover:text-white sm:inline-flex" onClick={() => setSelected(new Set())}>{t('admin.clear')}</button>
            <button className="btn h-8 bg-red-600 px-3 text-white hover:bg-red-700" onClick={() => setConfirming(true)}>{t('admin.deleteN', { x: ids.length })}</button>
          </div>
        </div>
      )}

      {/* Confirmation */}
      {confirming && (
        <div className="fixed inset-0 z-40 grid place-items-center bg-ink/40 px-4" onClick={() => !busy && setConfirming(false)}>
          <div className="card w-full max-w-md p-6" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 grid h-10 w-10 place-items-center rounded-full bg-red-50 text-red-600">
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6M10 11v6M14 11v6" />
              </svg>
            </div>
            <h2 className="text-[17px] font-semibold">{t('admin.confirmTitle', { x: ids.length })}</h2>
            <p className="mt-1.5 text-[14px] text-muted">{t('admin.confirmText')}</p>
            <div className="mt-6 flex justify-end gap-2">
              <button className="btn-ghost" disabled={busy} onClick={() => setConfirming(false)}>{t('cancel')}</button>
              <button className="btn bg-red-600 text-white hover:bg-red-700" disabled={busy} onClick={remove}>
                {busy ? t('admin.deleting') : t('admin.deleteN', { x: ids.length })}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
