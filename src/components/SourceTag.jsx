// Small "CAPI" tag shown under a lead's name when the lead came from the new
// QualifiedLead campaign.
//
// How we tell that campaign apart: its ads tag the URL with readable NAMES
// (utm_campaign = "sales compagne", via {{campaign.name}}), while the older ads
// tag with Meta's numeric IDs (e.g. "120252184919550742", via {{campaign.id}}).
// So a lead is from the tracked campaign only when its utm_campaign contains a
// letter — a real campaign name — rather than being just an ID number.
//
// Display-only: it reads the utm_* fields already present on the lead and renders
// nothing otherwise, so it can never break lead loading.
export const isCapiLead = (lead) => /[a-z]/i.test(String((lead && lead.utm_campaign) || ''))

export default function SourceTag({ lead, className = '' }) {
  if (!isCapiLead(lead)) return null
  // Tooltip shows exactly where the lead came from (campaign · ad).
  const detail = [lead.utm_campaign, lead.utm_content].filter(Boolean).join(' · ')
  return (
    <span
      title={detail}
      className={`inline-flex items-center gap-1 whitespace-nowrap rounded border border-gold/40 bg-gold/10 px-1.5 py-[1px] text-[10px] font-semibold uppercase tracking-wide text-gold-ink ${className}`}
    >
      <span className="inline-block h-1.5 w-1.5 rounded-full bg-gold" aria-hidden="true" />
      CAPI
    </span>
  )
}
