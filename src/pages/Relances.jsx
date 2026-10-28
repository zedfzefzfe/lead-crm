import { useLeads } from '../lib/leads'
import { A_RELANCER, CLIENT } from '../lib/constants'
import { formatDate, todayISO } from '../lib/format'
import LeadCard from '../components/LeadCard'
import PageHeader from '../components/PageHeader'
import { t } from '../lib/i18n'

// Leads to call back today:
// - a follow-up date is set → the lead shows from that day on (unless closed: won or lost);
// - no follow-up date → the lead shows while its status still needs a call (A_RELANCER, e.g. Nouveau).
// Oldest first, so nobody is forgotten.
export function useRelances() {
  const { leads } = useLeads()
  const today = todayISO()
  return leads
    .filter((l) => {
      if (CLIENT.closed.includes(l.statut)) return false
      if (l.prochaine_relance) return l.prochaine_relance <= today
      return A_RELANCER.includes(l.statut)
    })
    .sort((a, b) => a.created_at.localeCompare(b.created_at))
}

export default function Relances() {
  const { loading } = useLeads()
  const list = useRelances()
  const today = todayISO()

  return (
    <div>
      <PageHeader
        title={t('rel.title')}
        subtitle={t('rel.subtitle', { x: list.length === 1 ? t('rel.lead') : t('rel.leads', { x: list.length }) })}
      />

      {loading && <p className="text-muted">{t('loading')}</p>}
      {!loading && list.length === 0 && (
        <div className="card px-6 py-12 text-center">
          <p className="font-medium">{t('rel.emptyTitle')}</p>
          <p className="mt-1 text-[13px] text-muted">{t('rel.emptyText')}</p>
        </div>
      )}

      <div className="grid gap-2.5 md:grid-cols-2 xl:grid-cols-3">
        {list.map((l) => (
          <LeadCard
            key={l.id}
            lead={l}
            extra={
              l.prochaine_relance && (
                <span className={`font-medium ${l.prochaine_relance < today ? 'text-red-600' : 'text-gold'}`}>
                  {l.prochaine_relance === today ? t('rel.today') : t('rel.planned', { x: formatDate(l.prochaine_relance) })}
                  {l.prochaine_relance < today && t('rel.late')}
                </span>
              )
            }
          />
        ))}
      </div>
    </div>
  )
}
