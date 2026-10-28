import { STATUT_STYLES } from '../lib/constants'
import { tv } from '../lib/i18n'

export function StatusDot({ statut, className = '' }) {
  return <span className={`inline-block h-2 w-2 shrink-0 rounded-full ${STATUT_STYLES[statut] || 'bg-stone-400'} ${className}`} />
}

export default function StatusBadge({ statut }) {
  return (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-md border border-line bg-white px-2 py-0.5 text-[12px] font-medium text-ink">
      <StatusDot statut={statut} />
      {tv(statut)}
    </span>
  )
}
