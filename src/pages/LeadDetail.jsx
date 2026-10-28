import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useLeads } from '../lib/leads'
import { CLIENT, EXTRA_FIELDS, ITEM, STATUTS, RAISONS, SOURCE_LABELS, FIELD_LABELS } from '../lib/constants'
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

  const infos = [
    ['Téléphone', lead.telephone],
    ['Ville', lead.ville],
    [ITEM.label, lead[ITEM.key]],
    ...EXTRA_FIELDS.map((x) => [x.label, lead[x.key]]),
    ['Préférence de contact', lead.contact_pref],
    ['Source', SOURCE_LABELS[lead.source]],
    ['Reçu le', formatDateTime(lead.created_at)],
    ['Modifié', `${formatDateTime(lead.updated_at)}${lead.updated_by ? ` · ${lead.updated_by}` : ''}`],
  ].filter(([, v]) => v)

  return (
    <div>
      <Link to="/leads" className="inline-flex items-center gap-1 text-[13px] text-muted hover:text-ink">
        <span aria-hidden>←</span> Leads
      </Link>

      <div className="mt-2 mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-sand text-[15px] font-semibold uppercase">
            {(lead.nom || '?')[0]}
          </span>
          <div className="min-w-0">
            <h1 className="truncate text-[22px] font-semibold tracking-tight">{lead.nom}</h1>
            <div className="mt-0.5 flex items-center gap-2 text-[13px] text-muted">
              <StatusBadge statut={lead.statut} />
              {lead[ITEM.key] && <span>{lead[ITEM.key]}</span>}
            </div>
          </div>
        </div>
        <div className="flex w-full gap-2 sm:w-auto">
          <a href={telLink(lead.telephone)} className="btn-ghost flex-1 sm:flex-none">
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2Z" /></svg>
            Appeler
          </a>
          <a href={whatsappLink(lead)} target="_blank" rel="noopener noreferrer" className="btn flex-1 bg-[#1faa59] text-white hover:bg-[#178f4a] sm:flex-none">
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2Z" /></svg>
            WhatsApp
          </a>
        </div>
      </div>

      <div className="grid items-start gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <section className="card">
            <h2 className="border-b border-line px-5 py-3 text-[14px] font-semibold">Suivi</h2>
            <div className="grid gap-4 p-5 sm:grid-cols-2">
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
              {CLIENT.showAcompte && (
                <AcompteField key={`a-${lead.montant_acompte}`} value={lead.montant_acompte} onSave={(v) => save({ montant_acompte: v })} />
              )}
              <div>
                <label className="label">Prochaine relance</label>
                <input type="date" className="input" value={lead.prochaine_relance || ''}
                  onChange={(e) => save({ prochaine_relance: e.target.value || null })} />
              </div>
              <NotesField key={`n-${lead.notes}`} value={lead.notes} onSave={(v) => save({ notes: v })} />
            </div>
          </section>

          <History leadId={lead.id} createdAt={lead.created_at} />
        </div>

        <section className="card">
          <h2 className="border-b border-line px-5 py-3 text-[14px] font-semibold">Informations</h2>
          <dl className="divide-y divide-line">
            {infos.map(([k, v]) => (
              <div key={k} className="flex justify-between gap-4 px-5 py-2.5 text-[13px]">
                <dt className="shrink-0 text-muted">{k}</dt>
                <dd className="text-right font-medium text-ink">{v}</dd>
              </div>
            ))}
          </dl>
        </section>
      </div>
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
      <textarea rows="4" className="input h-auto py-2" value={draft} onChange={(e) => setDraft(e.target.value)}
        placeholder="Ce qui a été dit, disponibilités…" />
      {dirty && (
        <div className="mt-2 flex gap-2">
          <button className="btn-gold" onClick={() => onSave(draft)}>Enregistrer</button>
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
    <section className="card">
      <h2 className="border-b border-line px-5 py-3 text-[14px] font-semibold">Historique</h2>
      <ol className="px-5 py-4">
        {rows.map((h) => (
          <li key={h.id} className="relative border-l border-line pb-4 pl-4 text-[13px]">
            <span className="absolute -left-[4.5px] top-1.5 h-2 w-2 rounded-full border-2 border-white bg-gold" />
            <p>
              <span className="font-medium">{FIELD_LABELS[h.field] || h.field}</span>
              {h.field === 'notes' ? ' modifiées' : <> : <span className="text-muted line-through decoration-muted/40">{show(h.field, h.old_value)}</span> → {show(h.field, h.new_value)}</>}
            </p>
            {h.field === 'notes' && h.new_value && (
              <p className="mt-1 line-clamp-3 whitespace-pre-line text-muted">{h.new_value}</p>
            )}
            <p className="mt-0.5 text-[12px] text-muted">{h.changed_by || 'système'} · {formatDateTime(h.changed_at)}</p>
          </li>
        ))}
        <li className="relative border-l border-transparent pl-4 text-[13px] text-muted">
          <span className="absolute -left-[4.5px] top-1.5 h-2 w-2 rounded-full bg-line" />
          Lead créé le {formatDate(createdAt)}
        </li>
      </ol>
    </section>
  )
}
