import { useSearchParams } from 'react-router-dom'
import { CLIENT } from '../lib/constants'
import { matchesAtelier } from '../lib/leads'
import { t } from '../lib/i18n'

// Quick atelier filter (Crea'rt): "Tous · Casa 15 Nov · Tanger 21 Nov" with counts.
// The choice is kept in the address (?atelier=…), so the page can be refreshed or shared.
export function useAtelierFilter(list) {
  const [params, setParams] = useSearchParams()
  const groups = CLIENT.focusAteliers || []
  const current = groups.find((g) => g.key === params.get('atelier'))
  const filtered = current ? list.filter((l) => matchesAtelier(l, current)) : list
  const setKey = (key) => {
    const next = new URLSearchParams(params)
    if (key) next.set('atelier', key)
    else next.delete('atelier')
    setParams(next, { replace: true })
  }
  return { groups, current, filtered, setKey }
}

export default function AtelierChips({ list, filter }) {
  const { groups, current, setKey } = filter
  if (!groups.length) return null
  const chip = (key, label, n) => {
    const on = (current?.key || '') === key
    return (
      <button
        key={key || 'all'}
        type="button"
        onClick={() => setKey(key)}
        aria-pressed={on}
        className={`inline-flex h-8 items-center gap-1.5 rounded-full border px-3 text-[13px] font-medium transition-colors ${
          on ? 'border-ink bg-ink text-white' : 'border-line bg-white text-ink hover:bg-sand'
        }`}
      >
        {label}
        <span className={`rounded-full px-1.5 text-[11px] font-semibold tabular-nums ${on ? 'bg-white/20 text-white' : 'bg-sand text-muted'}`}>{n}</span>
      </button>
    )
  }
  return (
    <div className="mb-4 flex flex-wrap items-center gap-2" role="group" aria-label={t('chips.label')}>
      {chip('', t('chips.all'), list.length)}
      {groups.map((g) => chip(g.key, g.label, list.filter((l) => matchesAtelier(l, g)).length))}
    </div>
  )
}
