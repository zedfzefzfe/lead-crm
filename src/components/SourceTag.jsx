// Small "CAPI" tag shown under a lead's name when the lead came from a Meta ad
// that carries UTM tags (currently the QualifiedLead / CAPI campaign).
// Display-only: it just reads the utm_* fields already present on the lead and
// renders nothing when they are absent, so it can never break lead loading.
export default function SourceTag({ lead, className = '' }) {
  if (!lead || !lead.utm_source) return null
  // Tooltip shows exactly where the lead came from (campaign · ad), when known.
  const detail = [lead.utm_campaign, lead.utm_content].filter(Boolean).join(' · ') || lead.utm_source
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
