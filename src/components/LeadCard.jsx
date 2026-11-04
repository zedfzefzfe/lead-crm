import { Link } from 'react-router-dom'
import { CLIENT, EXTRA_FIELDS, ITEM, SOURCE_LABELS } from '../lib/constants'
import { formatDate, telLink } from '../lib/format'
import { canMarkEligible, EligibleToggle, NoteEditor, RelanceInput, StatusSelect } from './QuickEdit'
import ContactPref from './ContactPref'
import { t, tv } from '../lib/i18n'

// Lead card used on mobile and on the "À relancer" page.
// Status, note (and follow-up date for some clients) can be changed right here; the name opens the lead page.
export default function LeadCard({ lead, extra }) {
  const details = [
    lead[ITEM.key],
    ...EXTRA_FIELDS.map((x) => tv(lead[x.key])),
    tv(SOURCE_LABELS[lead.source]),
    formatDate(lead.created_at),
  ].filter(Boolean)

  return (
    <div className="card p-3.5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <Link to={`/leads/${lead.id}`} className="block truncate text-[15px] font-medium text-ink hover:text-gold-ink">
            {lead.nom}
          </Link>
          <a href={telLink(lead.telephone)} className="text-[13px] tabular-nums text-gold-ink">
            {lead.telephone}
          </a>
          {lead.ville && <span className="text-[13px] text-muted"> · {lead.ville}</span>}
        </div>
        <div className="flex w-40 shrink-0 flex-col items-end gap-2">
          <StatusSelect lead={lead} />
          {/* On cards, nothing at all until the client was reached on the phone */}
          {CLIENT.eligibleButton && (lead.eligible === true || canMarkEligible(lead)) && <EligibleToggle lead={lead} />}
        </div>
      </div>
      <p className="mt-2 text-[12px] text-muted">
        {details.join(' · ')}
      </p>
      {extra && <div className="mt-1 text-[12px]">{extra}</div>}
      {CLIENT.showContactPref && lead.contact_pref && (
        <div className="mt-2">
          <ContactPref value={lead.contact_pref} />
        </div>
      )}
      <div className="mt-2.5 rounded-md border border-line bg-cream/60">
        <NoteEditor lead={lead} />
      </div>
      {CLIENT.quickRelance && (
        <div className="mt-2 flex items-center gap-2 text-[12px] text-muted">
          <span>{t('col.relance')}</span>
          <RelanceInput lead={lead} />
        </div>
      )}
    </div>
  )
}
