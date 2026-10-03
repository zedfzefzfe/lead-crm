import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useLeads } from '../lib/leads'
import { STATUTS, RAISONS, SOURCE_LABELS, FIELD_LABELS } from '../lib/constants'
import { formatDate, formatDateTime, formatMAD, telLink, whatsappLink } from '../lib/format'
import StatusBadge from '../components/StatusBadge'

export default function LeadDetail() {
  const { id } = useParams()
  const { leads, loading, updateLead, notify } = useLeads()
  const lead = leads.find((l) => l.id === id)

  if (loading) return <p className="text-muted">Chargement…</p>
  if (!lead) return <p className="text-muted">Lead introuvable. <Link className="text-gold-dark" to="/leads">Retour</Link></p>

  // Every change is saved immediately; Realtime pushes it to the rest of the team.
  const save = async (changes) => {
    try {
      await updateLead(lead.id, changes)
    } catch (e) {
      notify(`Erreur : ${e.message}`)
    }
  }

  return (
    <div className="max-w-3xl">
      <Link to="/leads" className="text-sm text-muted hover:text-ink">← Leads</Link>

      <div className="mt-3 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-serif text-3xl md:text-4xl">{lead.nom}</h1>
          <p className="text-sm text-muted mt-1">
            {lead.telephone}{lead.ville ? ` · ${lead.ville}` : ''} · {SOURCE_LABELS[lead.source]}
          </p>
          {lead.atelier && <p className="text-sm mt-1">Atelier : <b className="font-medium">{lead.atelier}</b></p>}
        </div>
        <StatusBadge statut={lead.statut} />
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3">
        <a href={telLink(lead.telephone)} className="btn-ghost">
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2Z" /></svg>
          Appeler
        </a>
        <a href={whatsappLink(lead)} target="_blank" rel="noopener noreferrer" className="btn bg-[#25D366] text-white hover:opacity-90">
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2Z" /></svg>
          WhatsApp
        </a>
      </div>

      <section className="card mt-5 p-5 grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label">Statut</label>
          <select className="input" value={lead.statut} onChange={(e) => save({ statut: e.target.value })}>
            {STATUTS.map((s) => <option key={s}>{s}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Raison</label>
          <select className="input" value={lead.raison || ''} onChange={(e) => save({ raison: e.target.value || null })}>
            <option value="">—</option>
            {RAISONS.map((r) => <option key={r}>{r}</option>)}
          </select>
        </div>
        <AcompteField key={`a-${lead.montant_acompte}`} value={lead.montant_acompte} onSave={(v) => save({ montant_acompte: v })} />
        <div>
          <label className="label">Prochaine relance</label>
          <input type="date" className="input" value={lead.prochaine_relance || ''}
            onChange={(e) => save({ prochaine_relance: e.target.value || null })} />
        </div>
        <NotesField key={`n-${lead.notes}`} value={lead.notes} onSave={(v) => save({ notes: v })} />
        <p className="sm:col-span-2 text-xs text-muted">
          Reçu le {formatDateTime(lead.created_at)} · Modifié le {formatDateTime(lead.updated_at)}
          {lead.updated_by ? ` par ${lead.updated_by}` : ''}
        </p>
      </section>

      <History leadId={lead.id} createdAt={lead.created_at} />
    </div>
  )
}

function AcompteField({ value, onSave }) {
  const [draft, setDraft] = useState(String(value ?? 0))
  const commit = () => {
    const n = Math.max(0, Number(draft.replace(',', '.')) || 0)
    if (n !== Number(value)) onSave(n)
    else setDraft(String(value ?? 0))
  }
  return (
    <div>
      <label className="label">Montant acompte (DH)</label>
      <input type="number" inputMode="decimal" min="0" step="any" className="input" value={draft}
        onChange={(e) => setDraft(e.target.value)} onBlur={commit}
        onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()} />
    </div>
  )
}

function NotesField({ value, onSave }) {
  const [draft, setDraft] = useState(value || '')
  const dirty = draft !== (value || '')
  return (
    <div className="sm:col-span-2">
      <label className="label">Notes</label>
      <textarea rows="4" className="input" value={draft} onChange={(e) => setDraft(e.target.value)}
        placeholder="Ce qu'elle a dit, ses disponibilités…" />
      {dirty && (
        <div className="mt-2 flex gap-2">
          <button className="btn-gold" onClick={() => onSave(draft)}>Enregistrer les notes</button>
          <button className="btn-ghost" onClick={() => setDraft(value || '')}>Annuler</button>
        </div>
      )}
    </div>
  )
}

function History({ leadId, createdAt }) {
  const [rows, setRows] = useState([])

  useEffect(() => {
    let active = true
    supabase
      .from('lead_history')
      .select('*')
      .eq('lead_id', leadId)
      .order('changed_at', { ascending: false })
      .then(({ data }) => active && setRows(data || []))

    const channel = supabase
      .channel(`history-${leadId}`)
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'lead_history', filter: `lead_id=eq.${leadId}` },
        (payload) => setRows((r) => (r.some((x) => x.id === payload.new.id) ? r : [payload.new, ...r])))
      .subscribe()

    return () => {
      active = false
      supabase.removeChannel(channel)
    }
  }, [leadId])

  const show = (field, v) => {
    if (v === null || v === undefined || v === '') return '—'
    return field === 'montant_acompte' ? formatMAD(v) : v
  }

  return (
    <section className="mt-6">
      <h2 className="text-xs font-medium uppercase tracking-wider text-muted mb-3">Historique</h2>
      <ol className="card divide-y divide-line">
        {rows.map((h) => (
          <li key={h.id} className="p-4 text-sm">
            <p>
              <b className="font-medium">{FIELD_LABELS[h.field] || h.field}</b>
              {h.field === 'notes' ? ' modifiées' : <> : <span className="text-muted">{show(h.field, h.old_value)}</span> → {show(h.field, h.new_value)}</>}
            </p>
            {h.field === 'notes' && h.new_value && (
              <p className="mt-1 text-muted whitespace-pre-line line-clamp-3">{h.new_value}</p>
            )}
            <p className="mt-1 text-xs text-muted">{h.changed_by || 'système'} · {formatDateTime(h.changed_at)}</p>
          </li>
        ))}
        <li className="p-4 text-sm text-muted">Lead créé le {formatDate(createdAt)}</li>
      </ol>
    </section>
  )
}
