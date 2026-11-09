import { useLeads } from '../lib/leads'
import { CLIENT } from '../lib/constants'
import LeadCard from '../components/LeadCard'
import PageHeader from '../components/PageHeader'
import { t } from '../lib/i18n'

// Leads whose status is the client's "interested" status (Crea'rt: Intéressée).
// A lead appears here as soon as a salesperson sets that status, and leaves when the
// status changes (e.g. Acompte payé). Most recently updated first.
export function useInteresses() {
  const { leads } = useLeads()
  if (!CLIENT.interestedPage) return []
  return leads
    .filter((l) => l.statut === CLIENT.interestedPage)
    .sort((a, b) => (b.updated_at || '').localeCompare(a.updated_at || ''))
}

export default function Interesses() {
  const { loading } = useLeads()
  const list = useInteresses()

  return (
    <div>
      <PageHeader title={t('int.title')} subtitle={t('int.subtitle', { x: list.length === 1 ? t('rel.lead') : t('rel.leads', { x: list.length }) })} />

      {loading && <p className="text-muted">{t('loading')}</p>}
      {!loading && list.length === 0 && (
        <div className="card px-6 py-12 text-center">
          <p className="font-medium">{t('int.emptyTitle')}</p>
          <p className="mt-1 text-[13px] text-muted">{t('int.emptyText')}</p>
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
