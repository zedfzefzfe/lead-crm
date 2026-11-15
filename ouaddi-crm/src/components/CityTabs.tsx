import { useCity, type CityFilter } from '@/lib/city'
import { cn } from '@/lib/utils'

const OPTIONS: { v: CityFilter; label: string }[] = [
  { v: 'all', label: 'Tous' },
  { v: 'casablanca', label: 'Casa' },
  { v: 'rabat', label: 'Rabat' },
]

export function CityTabs({ className }: { className?: string }) {
  const { city, setCity } = useCity()
  return (
    <div className={cn('inline-flex rounded-lg border bg-card p-1', className)} role="tablist" aria-label="Ville">
      {OPTIONS.map(o => (
        <button
          key={o.v}
          role="tab"
          aria-selected={city === o.v}
          onClick={() => setCity(o.v)}
          className={cn(
            'h-9 rounded-md px-3.5 text-sm font-medium',
            city === o.v ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground',
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}
