import { useLeads } from '../lib/leads'
import { A_RELANCER, CLIENT } from '../lib/constants'
import { formatDate, todayISO } from '../lib/format'
import LeadCard from '../components/LeadCard'
import AtelierChips, { useAtelierFilter } from '../components/AtelierChips'
import { CallAttempts } from '../components/CallAttempts'
import PageHeader from '../components/PageHeader'
import { t } from '../lib/i18n'

// Leads to call back today:
// - a follow-up date is set → the lead shows from that day on (unless closed: won or lost);
// - no follow-up date → the lead shows while its status still needs a call (A_RELANCER, e.g. Nouveau).
// Oldest first, so nobody is forgotten.
export function useRelances() {
  const { leads } = useLeads()
  const today = todayISO()
  // Crea'rt: only leads already called without an answer (Contacté / Pas de réponse).
  // Not called for the longest time first, so a lead just called goes to the bottom.
  if (CLIENT.relance) {
    return leads
      .filter((l) => CLIENT.relance.statuts.includes(l.statut))
      .sort((a, b) => (a.derniere_tentative || a.updated_at || '').localeCompare(b.derniere_tentative || b.updated_at || ''))
  }
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
  const all = useRelances()
  const atelier = useAtelierFilter(all)
  const list = atelier.filtered
  const today = todayISO()

  return (
    <div>
      <PageHeader
        title={t('rel.title')}
        subtitle={t(CLIENT.relance ? 'rel.subtitleCalls' : 'rel.subtitle', { x: list.length === 1 ? t('rel.lead') : t('rel.leads', { x: list.length }), y: CLIENT.relance?.maxAttempts })}
      />

      <AtelierChips list={all} filter={atelier} />

      {loading && <p className="text-muted">{t('loading')}</p>}
      {!loading && list.length === 0 && (
        <div className="card px-6 py-12 text-center">
          <p className="font-medium">{t('rel.emptyTitle')}</p>
          <p className="mt-1 text-[13px] text-muted">{t(CLIENT.relance ? 'rel.emptyTextCalls' : 'rel.emptyText')}</p>
        </div>
      )}

      <div className="grid gap-2.5 md:grid-cols-2 xl:grid-cols-3">
        {list.map((l) => (
          <LeadCard
            key={l.id}
            lead={l}
            extra={
              CLIENT.relance ? (
                <div className="mt-1 border-t border-line pt-2.5"><CallAttempts lead={l} /></div>
              ) : l.prochaine_relance && (
                <span className={`font-medium ${l.prochaine_relance < today ? 'text-red-600' : 'text-gold-ink'}`}>
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
