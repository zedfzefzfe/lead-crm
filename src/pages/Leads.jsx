import { useMemo } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useLeads } from '../lib/leads'
import { EXTRA_FIELDS, ITEM, STATUTS, SOURCES, SOURCE_LABELS } from '../lib/constants'
import { formatDate, formatMAD, toISODate } from '../lib/format'
import StatusBadge from '../components/StatusBadge'
import LeadCard from '../components/LeadCard'

const FILTERS = ['q', 'statut', 'atelier', 'source', 'du', 'au']

export default function Leads() {
  const { leads, loading, error } = useLeads()
  const navigate = useNavigate()
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
      <div className="flex items-end justify-between gap-3">
        <div>
          <h1 className="font-serif text-3xl md:text-4xl">Leads</h1>
          <p className="text-sm text-muted mt-1">{filtered.length} sur {leads.length}</p>
        </div>
        <Link to="/ajouter" className="btn-gold hidden md:inline-flex">+ Ajouter un lead</Link>
      </div>

      <div className="card mt-5 p-4 grid gap-3 grid-cols-2 md:grid-cols-6">
        <input className="input col-span-2" placeholder="Rechercher nom ou téléphone…"
          value={f.q} onChange={(e) => setFilter('q', e.target.value)} />
        <select className="input" value={f.statut} onChange={(e) => setFilter('statut', e.target.value)}>
          <option value="">Tous statuts</option>
          {STATUTS.map((s) => <option key={s}>{s}</option>)}
        </select>
        <select className="input" value={f.source} onChange={(e) => setFilter('source', e.target.value)}>
          <option value="">Toutes sources</option>
          {SOURCES.map((s) => <option key={s} value={s}>{SOURCE_LABELS[s]}</option>)}
        </select>
        <select className="input col-span-2" value={f.atelier} onChange={(e) => setFilter('atelier', e.target.value)}>
          <option value="">{`Tous ${ITEM.plural}`}</option>
          {items.map((a) => <option key={a}>{a}</option>)}
        </select>
        <label className="text-xs text-muted md:col-span-1">Du
          <input type="date" className="input mt-1" value={f.du} onChange={(e) => setFilter('du', e.target.value)} />
        </label>
        <label className="text-xs text-muted md:col-span-1">Au
          <input type="date" className="input mt-1" value={f.au} onChange={(e) => setFilter('au', e.target.value)} />
        </label>
        {hasFilters && (
          <button className="text-sm text-gold-dark text-left md:col-span-4 self-end pb-2"
            onClick={() => setParams({}, { replace: true })}>
            Effacer les filtres
          </button>
        )}
      </div>

      {loading && <p className="mt-6 text-muted">Chargement…</p>}
      {error && <p className="mt-6 text-red-600">Erreur : {error}</p>}
      {!loading && filtered.length === 0 && <p className="mt-6 text-muted">Aucun lead.</p>}

      {/* Mobile: cards */}
      <div className="mt-5 grid gap-3 md:hidden">
        {filtered.map((l) => <LeadCard key={l.id} lead={l} />)}
      </div>

      {/* Desktop: table */}
      {filtered.length > 0 && (
        <div className="card mt-5 hidden md:block overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-sand/60 text-left text-xs uppercase tracking-wider text-muted">
              <tr>
                <th className="px-4 py-3 font-medium">Nom</th>
                <th className="px-4 py-3 font-medium">Téléphone</th>
                <th className="px-4 py-3 font-medium">Ville</th>
                <th className="px-4 py-3 font-medium">{ITEM.label}</th>
                {EXTRA_FIELDS.map((x) => <th key={x.key} className="px-4 py-3 font-medium">{x.label}</th>)}
                <th className="px-4 py-3 font-medium">Contact</th>
                <th className="px-4 py-3 font-medium">Source</th>
                <th className="px-4 py-3 font-medium">Statut</th>
                <th className="px-4 py-3 font-medium text-right">Acompte</th>
                <th className="px-4 py-3 font-medium">Reçu le</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((l) => (
                <tr key={l.id} onClick={() => navigate(`/leads/${l.id}`)}
                  className="border-t border-line cursor-pointer hover:bg-sand/40">
                  <td className="px-4 py-3 font-medium">{l.nom}</td>
                  <td className="px-4 py-3 whitespace-nowrap">{l.telephone}</td>
                  <td className="px-4 py-3">{l.ville}</td>
                  <td className="px-4 py-3">{l[ITEM.key]}</td>
                  {EXTRA_FIELDS.map((x) => <td key={x.key} className="px-4 py-3">{l[x.key] || '—'}</td>)}
                  <td className="px-4 py-3">{l.contact_pref || '—'}</td>
                  <td className="px-4 py-3">{SOURCE_LABELS[l.source]}</td>
                  <td className="px-4 py-3"><StatusBadge statut={l.statut} /></td>
                  <td className="px-4 py-3 text-right whitespace-nowrap">{l.montant_acompte > 0 ? formatMAD(l.montant_acompte) : '—'}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-muted">{formatDate(l.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
