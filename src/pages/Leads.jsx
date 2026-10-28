import { useMemo } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useLeads } from '../lib/leads'
import { CLIENT, EXTRA_FIELDS, ITEM, STATUTS, SOURCES, SOURCE_LABELS } from '../lib/constants'
import { formatDate, formatMAD, toISODate } from '../lib/format'
import { NoteEditor, RelanceInput, StatusSelect } from '../components/QuickEdit'
import LeadCard from '../components/LeadCard'
import PageHeader from '../components/PageHeader'

const FILTERS = ['q', 'statut', 'atelier', 'source', 'du', 'au']

export default function Leads() {
  const { leads, loading, error } = useLeads()
  // Filters live in the URL so they survive a refresh and can be shared.
  const [params, setParams] = useSearchParams()
  const f = Object.fromEntries(FILTERS.map((k) => [k, params.get(k) || '']))

  const setFilter = (key, value) => {
    const next = new URLSearchParams(params)
    value ? next.set(key, value) : next.delete(key)
    setParams(next, { replace: true })
  }

  const items = useMemo(() => [...new Set(leads.map((l) => l[ITEM.key]).filter(Boolean))].sort(), [leads])

  const filtered = useMemo(() => {
    const q = f.q.toLowerCase().trim()
    const qDigits = q.replace(/\D/g, '')
    return leads.filter((l) => {
      if (f.statut && l.statut !== f.statut) return false
      if (f.atelier && l[ITEM.key] !== f.atelier) return false
      if (f.source && l.source !== f.source) return false
      const day = toISODate(new Date(l.created_at)) // local day
      if (f.du && day < f.du) return false
      if (f.au && day > f.au) return false
      if (q) {
        const inName = (l.nom || '').toLowerCase().includes(q)
        const inPhone = qDigits && (l.telephone || '').replace(/\D/g, '').includes(qDigits)
        if (!inName && !inPhone) return false
      }
      return true
    })
  }, [leads, f.q, f.statut, f.atelier, f.source, f.du, f.au])

  const hasFilters = FILTERS.some((k) => f[k])

  return (
    <div>
      <PageHeader title="Leads" subtitle={hasFilters ? `${filtered.length} sur ${leads.length} leads` : `${leads.length} leads`}>
        <Link to="/ajouter" className="btn-gold hidden md:inline-flex">
          <span className="text-[16px] leading-none">+</span> Ajouter un lead
        </Link>
      </PageHeader>

      {/* Filters */}
      <div className="grid grid-cols-3 items-center gap-2 md:flex md:flex-wrap">
        <div className="relative col-span-3 md:w-72">
          <svg viewBox="0 0 24 24" className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" />
          </svg>
          <input className="input pl-8" placeholder="Nom ou téléphone…" value={f.q} onChange={(e) => setFilter('q', e.target.value)} />
        </div>
        <Select value={f.statut} onChange={(v) => setFilter('statut', v)} placeholder="Statut" options={STATUTS} />
        <Select value={f.source} onChange={(v) => setFilter('source', v)} placeholder="Source"
          options={SOURCES.map((s) => [s, SOURCE_LABELS[s]])} />
        <Select value={f.atelier} onChange={(v) => setFilter('atelier', v)} placeholder={ITEM.label} options={items} />
        <div className="col-span-3 flex items-center gap-1.5 text-[13px] text-muted">
          <input type="date" aria-label="Du" className="input flex-1 md:w-[9.5rem] md:flex-none" value={f.du} onChange={(e) => setFilter('du', e.target.value)} />
          <span>→</span>
          <input type="date" aria-label="Au" className="input flex-1 md:w-[9.5rem] md:flex-none" value={f.au} onChange={(e) => setFilter('au', e.target.value)} />
        </div>
        {hasFilters && (
          <button className="h-9 rounded-md px-2.5 text-[13px] font-medium text-muted hover:bg-sand hover:text-ink"
            onClick={() => setParams({}, { replace: true })}>
            Réinitialiser
          </button>
        )}
      </div>

      {loading && <p className="mt-6 text-muted">Chargement…</p>}
      {error && <p className="mt-6 text-red-600">Erreur : {error}</p>}
      {!loading && filtered.length === 0 && (
        <div className="card mt-4 px-6 py-12 text-center">
          <p className="font-medium">Aucun lead</p>
          <p className="mt-1 text-[13px] text-muted">{hasFilters ? 'Aucun lead ne correspond à ces filtres.' : 'Les nouveaux leads apparaîtront ici automatiquement.'}</p>
        </div>
      )}

      {/* Mobile: cards */}
      <div className="mt-4 grid gap-2.5 md:hidden">
        {filtered.map((l) => <LeadCard key={l.id} lead={l} />)}
      </div>

      {/* Desktop: table */}
      {filtered.length > 0 && (
        <div className="card mt-4 hidden overflow-x-auto md:block">
          <table className="w-full text-[13px]">
            <thead className="border-b border-line bg-sand/50 text-left text-[12px] text-muted">
              <tr>
                <th className="px-4 py-2.5 font-medium">Client</th>
                <th className="px-4 py-2.5 font-medium">{ITEM.label}</th>
                <th className="px-3 py-2.5 font-medium">Statut</th>
                <th className="w-[30%] min-w-[14rem] px-4 py-2.5 font-medium">Note</th>
                {EXTRA_FIELDS.map((x) => <th key={x.key} className="px-4 py-2.5 font-medium">{x.label}</th>)}
                {CLIENT.quickRelance && <th className="px-4 py-2.5 font-medium">Relance</th>}
                <th className="px-4 py-2.5 text-right font-medium">Reçu</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {filtered.map((l) => (
                <tr key={l.id} className="align-top transition-colors hover:bg-sand/30">
                  <td className="px-4 py-3">
                    <Link to={`/leads/${l.id}`} className="whitespace-nowrap font-medium text-ink hover:text-gold">
                      {l.nom}
                    </Link>
                    <p className="mt-0.5 whitespace-nowrap tabular-nums text-muted">{l.telephone}{l.ville ? ` · ${l.ville}` : ''}</p>
                    {CLIENT.showContactPref && l.contact_pref && <p className="mt-0.5 text-[12px] text-muted">Contact : {l.contact_pref}</p>}
                  </td>
                  <td className="px-4 py-3">
                    <span className="whitespace-nowrap text-ink">{l[ITEM.key] || '—'}</span>
                    {l.montant_acompte > 0 && <p className="mt-0.5 whitespace-nowrap text-[12px] text-muted">Acompte {formatMAD(l.montant_acompte)}</p>}
                  </td>
                  <td className="min-w-[12.5rem] px-3 py-2"><StatusSelect lead={l} /></td>
                  <td className="px-2 py-1.5"><NoteEditor lead={l} /></td>
                  {EXTRA_FIELDS.map((x) => <td key={x.key} className="whitespace-nowrap px-4 py-3 text-ink">{l[x.key] || <span className="text-muted">—</span>}</td>)}
                  {CLIENT.quickRelance && <td className="px-3 py-2"><RelanceInput lead={l} /></td>}
                  <td className="whitespace-nowrap px-4 py-3 text-right text-muted">
                    <span className="tabular-nums">{formatDate(l.created_at)}</span>
                    <p className="mt-0.5 text-[12px]">{SOURCE_LABELS[l.source]}</p>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

// Compact dropdown filter. options: ['A', 'B'] or [['value', 'Label'], …]
function Select({ value, onChange, placeholder, options }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`input min-w-0 pr-7 md:w-auto md:max-w-[12rem] ${value ? 'border-gold/50 bg-gold/5 font-medium' : 'text-muted'}`}
    >
      <option value="">{placeholder}</option>
      {options.map((o) => {
        const [v, label] = Array.isArray(o) ? o : [o, o]
        return <option key={v} value={v}>{label}</option>
      })}
    </select>
  )
}
