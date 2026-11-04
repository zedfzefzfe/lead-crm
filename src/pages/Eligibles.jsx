import { useLeads } from '../lib/leads'
import LeadCard from '../components/LeadCard'
import PageHeader from '../components/PageHeader'
import { t } from '../lib/i18n'

// Leads a salesperson confirmed as eligible (credit or cash) after the phone call (Bajaj).
// Most recently updated first. Marking is final, so a lead never leaves this page.
export function useEligibles() {
  const { leads } = useLeads()
  return leads.filter((l) => l.eligible === true).sort((a, b) => (b.updated_at || '').localeCompare(a.updated_at || ''))
}

export default function Eligibles() {
  const { loading } = useLeads()
  const list = useEligibles()

  return (
    <div>
      <PageHeader title={t('elig.title')} subtitle={t('elig.subtitle', { x: list.length === 1 ? t('rel.lead') : t('rel.leads', { x: list.length }) })} />

      {loading && <p className="text-muted">{t('loading')}</p>}
      {!loading && list.length === 0 && (
        <div className="card px-6 py-12 text-center">
          <p className="font-medium">{t('elig.emptyTitle')}</p>
          <p className="mt-1 text-[13px] text-muted">{t('elig.emptyText')}</p>
        </div>
      )}

      <div className="grid gap-2.5 md:grid-cols-2 xl:grid-cols-3">
        {list.map((l) => (
          <LeadCard key={l.id} lead={l} />
        ))}
      </div>
    </div>
  )
}
