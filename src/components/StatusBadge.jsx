import { STATUT_STYLES } from '../lib/constants'

export default function StatusBadge({ statut }) {
  return (
    <span
      className={`inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${
        STATUT_STYLES[statut] || 'bg-stone-100 text-stone-700 ring-stone-200'
      }`}
    >
      {statut}
    </span>
  )
}
