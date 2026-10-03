import { Link } from 'react-router-dom'
import StatusBadge from './StatusBadge'
import { SOURCE_LABELS } from '../lib/constants'
import { formatDate } from '../lib/format'

// Compact lead card used on mobile and on the "À relancer" page.
export default function LeadCard({ lead, extra }) {
  return (
    <Link to={`/leads/${lead.id}`} className="card block p-4 active:bg-sand">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-medium truncate">{lead.nom}</p>
          <p className="text-sm text-muted">{lead.telephone}{lead.ville ? ` · ${lead.ville}` : ''}</p>
        </div>
        <StatusBadge statut={lead.statut} />
      </div>
      <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted">
        {lead.atelier && <span>{lead.atelier}</span>}
        <span>{SOURCE_LABELS[lead.source]}</span>
        <span>{formatDate(lead.created_at)}</span>
        {extra}
      </div>
    </Link>
  )
}
