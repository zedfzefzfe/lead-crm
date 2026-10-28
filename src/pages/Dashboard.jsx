import { Link } from 'react-router-dom'
import { useLeads } from '../lib/leads'
import { CLIENT, EXTRA_FIELDS, ITEM, STATUTS, STATUT_STYLES, SOURCE_LABELS } from '../lib/constants'
import { formatMAD } from '../lib/format'
import PageHeader from '../components/PageHeader'
import { t, tv } from '../lib/i18n'
import { StatusDot } from '../components/StatusBadge'

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
    const k = item[key] || 'Non renseigné'
    out[k] = (out[k] || 0) + 1
  }
  return Object.entries(out).sort((a, b) => b[1] - a[1])
}

export default function Dashboard() {
  const { leads, loading, error } = useLeads()

  if (loading) return <p className="text-muted">{t('loading')}</p>
  if (error) return <p className="text-red-600">{t('error', { x: error })}</p>

  const since = (date) => leads.filter((l) => new Date(l.created_at) >= date).length
  const won = leads.filter((l) => CLIENT.won.includes(l.statut)).length
  const conversion = leads.length ? Math.round((won / leads.length) * 100) : 0
  const deposits = leads.reduce((sum, l) => sum + Number(l.montant_acompte || 0), 0)
  const perStatut = Object.fromEntries(STATUTS.map((s) => [s, 0]))
  leads.forEach((l) => (perStatut[l.statut] = (perStatut[l.statut] || 0) + 1))

  const kpis = [
    { label: t('dash.today'), value: since(startOfToday()) },
    { label: t('dash.week'), value: since(startOfWeek()) },
    { label: t('dash.month'), value: since(startOfMonth()) },
    { label: t('dash.conversion'), value: `${conversion} %`, hint: CLIENT.won.map(tv).join(' + ') },
    ...(CLIENT.showAcompte ? [{ label: t('dash.deposits'), value: formatMAD(deposits) }] : []),
  ]

  return (
    <div>
      <PageHeader title={t('nav.dashboard')} subtitle={t('dash.total', { x: leads.length })} />

      {/* Key numbers */}
      <section className="card grid grid-cols-2 divide-line md:grid-cols-5 md:divide-x">
        {kpis.map((k, i) => (
          <div key={k.label} className={`px-5 py-4 ${i > 1 ? 'border-t border-line md:border-t-0' : ''} ${i === 4 ? 'col-span-2 md:col-span-1' : ''}`}>
            <p className="eyebrow">{k.label}</p>
            <p className="mt-1 text-[26px] font-semibold tracking-tight tabular-nums">{k.value}</p>
            {k.hint && <p className="text-[12px] text-muted">{k.hint}</p>}
          </div>
        ))}
      </section>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        {/* Pipeline by status */}
        <section className="card lg:col-span-2">
          <CardTitle>{t('dash.pipeline')}</CardTitle>
          <ul className="divide-y divide-line">
            {STATUTS.map((s) => (
              <li key={s}>
                <Link to={`/leads?statut=${encodeURIComponent(s)}`} className="flex items-center gap-3 px-5 py-2.5 hover:bg-sand/40">
                  <StatusDot statut={s} />
                  <span className="w-36 shrink-0 text-[13px]">{tv(s)}</span>
                  <div className="h-1.5 flex-1 rounded-full bg-sand">
                    <div className={`h-1.5 rounded-full ${STATUT_STYLES[s]}`} style={{ width: `${leads.length ? (perStatut[s] / leads.length) * 100 : 0}%` }} />
                  </div>
                  <span className="w-8 text-end text-[13px] font-medium tabular-nums">{perStatut[s]}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <Breakdown
          title={t('dash.lostReasons')}
          rows={countBy(leads.filter((l) => l.statut === CLIENT.lost), 'raison')}
          total={perStatut[CLIENT.lost]}
          empty={t('dash.noLost')}
        />
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <Breakdown title={t('dash.by', { x: t('dash.source') })} rows={countBy(leads, 'source').map(([k, v]) => [SOURCE_LABELS[k] || k, v])} total={leads.length} />
        <Breakdown title={t('dash.by', { x: tv(ITEM.label).toLowerCase() })} rows={countBy(leads, ITEM.key)} total={leads.length} />
        {EXTRA_FIELDS.map((x) => (
          <Breakdown key={x.key} title={t('dash.by', { x: tv(x.label).toLowerCase() })} rows={countBy(leads, x.key)} total={leads.length} />
        ))}
      </div>
    </div>
  )
}

function CardTitle({ children }) {
  return <h2 className="border-b border-line px-5 py-3 text-[14px] font-semibold">{children}</h2>
}

function Breakdown({ title, rows, total, empty = t('dash.noData') }) {
  return (
    <section className="card">
      <CardTitle>{title}</CardTitle>
      <div className="px-5 py-4">
        {rows.length === 0 && <p className="text-[13px] text-muted">{empty}</p>}
        <ul className="space-y-3">
          {rows.map(([name, n]) => (
            <li key={name}>
              <div className="flex justify-between text-[13px]">
                <span className="truncate pe-2">{tv(name)}</span>
                <span className="font-medium tabular-nums">
                  {n} <span className="font-normal text-muted">· {total ? Math.round((n / total) * 100) : 0} %</span>
                </span>
              </div>
              <div className="mt-1.5 h-1.5 rounded-full bg-sand">
                <div className="h-1.5 rounded-full bg-gold" style={{ width: `${total ? (n / total) * 100 : 0}%` }} />
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
