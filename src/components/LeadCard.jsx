import { Link } from 'react-router-dom'
import { CLIENT, EXTRA_FIELDS, ITEM, SOURCE_LABELS } from '../lib/constants'
import { formatDate, telLink } from '../lib/format'
import { NoteEditor, RelanceInput, StatusSelect } from './QuickEdit'

// Lead card used on mobile and on the "À relancer" page.
// Status, note and follow-up date can be changed right here; the name opens the full lead page.
export default function LeadCard({ lead, extra }) {
  return (
    <div className="card p-4">
      <div className="flex items-start justify-between gap-3">
        <Link to={`/leads/${lead.id}`} className="min-w-0 group">
          <p className="font-medium truncate group-hover:text-gold-dark">{lead.nom} <span className="text-muted">›</span></p>
        </Link>
        <StatusSelect lead={lead} />
      </div>
      <a href={telLink(lead.telephone)} className="text-sm text-gold-dark">
        {lead.telephone}
      </a>
      {lead.ville && <span className="text-sm text-muted"> · {lead.ville}</span>}
      <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted">
        {lead[ITEM.key] && <span>{lead[ITEM.key]}</span>}
        {lead.contact_pref && <span>Contact : {lead.contact_pref}</span>}
        <span>{SOURCE_LABELS[lead.source]}</span>
        <span>{formatDate(lead.created_at)}</span>
        {extra}
      </div>
      <div className="mt-3">
        <NoteEditor lead={lead} />
      </div>
      {EXTRA_FIELDS.map((x) => (
        <p key={x.key} className="mt-2 text-xs text-muted">
          {x.label} : <b className="font-medium text-ink">{lead[x.key] || '—'}</b>
        </p>
      ))}
      {CLIENT.quickRelance && (
        <div className="mt-2 flex items-center gap-2 text-xs text-muted">
          <span>Relance :</span>
          <RelanceInput lead={lead} />
        </div>
      )}
    </div>
  )
}
