import { useLeads } from '../lib/leads'
import { A_RELANCER, CLIENT } from '../lib/constants'
import { formatDate, todayISO } from '../lib/format'
import LeadCard from '../components/LeadCard'

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
      <h1 className="font-serif text-3xl md:text-4xl">À relancer aujourd'hui</h1>
      <p className="text-sm text-muted mt-1">
        {list.length} lead{list.length > 1 ? 's' : ''} · les plus anciens en premier
      </p>

      {loading && <p className="mt-6 text-muted">Chargement…</p>}
      {!loading && list.length === 0 && (
        <p className="card mt-6 p-6 text-center text-muted">Tout le monde a été relancé ✨</p>
      )}

      <div className="mt-5 grid gap-3 md:grid-cols-2">
        {list.map((l) => (
          <LeadCard
            key={l.id}
            lead={l}
            extra={
              l.prochaine_relance && (
                <span className={l.prochaine_relance < today ? 'text-red-600 font-medium' : 'text-gold-dark font-medium'}>
                  Relance : {l.prochaine_relance === today ? "aujourd'hui" : formatDate(l.prochaine_relance)}
                </span>
              )
            }
          />
        ))}
      </div>
    </div>
  )
}
