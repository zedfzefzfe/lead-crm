import { Link } from 'react-router-dom'
import { useLeads } from '../lib/leads'
import { CLIENT, EXTRA_FIELDS, ITEM, STATUTS, STATUT_STYLES, SOURCE_LABELS } from '../lib/constants'
import { formatMAD } from '../lib/format'

function startOfToday() {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d
}

function startOfWeek() {
  const d = startOfToday()
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7)) // week starts Monday
  return d
}

function startOfMonth() {
  const d = startOfToday()
  d.setDate(1)
  return d
}

function countBy(list, key) {
  const out = {}
  for (const item of list) {
    const k = item[key] || '—'
    out[k] = (out[k] || 0) + 1
  }
  return Object.entries(out).sort((a, b) => b[1] - a[1])
}

export default function Dashboard() {
  const { leads, loading, error } = useLeads()

  if (loading) return <p className="text-muted">Chargement…</p>
  if (error) return <p className="text-red-600">Erreur : {error}</p>

  const since = (date) => leads.filter((l) => new Date(l.created_at) >= date).length
  const won = leads.filter((l) => CLIENT.won.includes(l.statut)).length
  const conversion = leads.length ? Math.round((won / leads.length) * 100) : 0
  const deposits = leads.reduce((sum, l) => sum + Number(l.montant_acompte || 0), 0)
  const perStatut = Object.fromEntries(STATUTS.map((s) => [s, 0]))
  leads.forEach((l) => (perStatut[l.statut] = (perStatut[l.statut] || 0) + 1))

  return (
    <div>
      <h1 className="font-serif text-3xl md:text-4xl">Tableau de bord</h1>
      <p className="text-sm text-muted mt-1">{leads.length} leads au total</p>

      <section className="mt-6 grid grid-cols-3 gap-3">
        <Kpi label="Aujourd'hui" value={since(startOfToday())} />
        <Kpi label="Cette semaine" value={since(startOfWeek())} />
        <Kpi label="Ce mois" value={since(startOfMonth())} />
      </section>

      <section className="mt-3 grid grid-cols-2 gap-3">
        <Kpi label="Taux de conversion" value={`${conversion} %`} hint={CLIENT.won.join(' + ')} gold />
        <Kpi label="Acomptes encaissés" value={formatMAD(deposits)} gold />
      </section>

      <h2 className="mt-8 mb-3 text-xs font-medium uppercase tracking-wider text-muted">Par statut</h2>
      <section className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
        {STATUTS.map((s) => (
          <Link key={s} to={`/leads?statut=${encodeURIComponent(s)}`}
            className={`rounded-2xl p-4 ring-1 ring-inset ${STATUT_STYLES[s]} hover:opacity-90`}>
            <p className="text-2xl font-semibold">{perStatut[s]}</p>
            <p className="text-xs mt-1">{s}</p>
          </Link>
        ))}
      </section>

      <section className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <Breakdown title="Par source" rows={countBy(leads, 'source').map(([k, v]) => [SOURCE_LABELS[k] || k, v])} total={leads.length} />
        <Breakdown title={`Par ${ITEM.label.toLowerCase()}`} rows={countBy(leads, ITEM.key)} total={leads.length} />
        {EXTRA_FIELDS.map((x) => (
          <Breakdown key={x.key} title={`Par ${x.label.toLowerCase()}`} rows={countBy(leads, x.key)} total={leads.length} />
        ))}
        <Breakdown
          title="Raisons des leads perdus"
          rows={countBy(leads.filter((l) => l.statut === CLIENT.lost), 'raison')}
          total={perStatut[CLIENT.lost]}
          empty="Aucun lead perdu"
        />
      </section>
    </div>
  )
}

function Kpi({ label, value, hint, gold }) {
  return (
    <div className={`card p-4 ${gold ? 'bg-gradient-to-br from-white to-sand' : ''}`}>
      <p className="text-[11px] uppercase tracking-wider text-muted">{label}</p>
      <p className={`mt-1 text-2xl md:text-3xl font-semibold ${gold ? 'text-gold-dark' : ''}`}>{value}</p>
      {hint && <p className="text-[11px] text-muted mt-1">{hint}</p>}
    </div>
  )
}

function Breakdown({ title, rows, total, empty = 'Aucune donnée' }) {
  return (
    <div className="card p-5">
      <h3 className="text-xs font-medium uppercase tracking-wider text-muted mb-4">{title}</h3>
      {rows.length === 0 && <p className="text-sm text-muted">{empty}</p>}
      <ul className="space-y-3">
        {rows.map(([name, n]) => (
          <li key={name}>
            <div className="flex justify-between text-sm">
              <span className="truncate pr-2">{name}</span>
              <span className="font-medium">{n}</span>
            </div>
            <div className="mt-1 h-1.5 rounded-full bg-sand">
              <div className="h-1.5 rounded-full bg-gold" style={{ width: `${total ? (n / total) * 100 : 0}%` }} />
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
