import { cn } from '@/lib/utils'

// Segmented choice with big tap targets (city, service, type…).
export function Chips<T extends string>({
  value, options, onChange, labels, className, size = 'md',
}: {
  value: T | null
  options: readonly T[]
  onChange: (v: T) => void
  labels: Record<T, string>
  className?: string
  size?: 'sm' | 'md'
}) {
  return (
    <div className={cn('flex flex-wrap gap-2', className)} role="radiogroup">
      {options.map(o => (
        <button
          key={o}
          type="button"
          role="radio"
          aria-checked={value === o}
          onClick={() => onChange(o)}
          className={cn(
            'rounded-lg border font-medium transition-colors',
            size === 'md' ? 'h-11 px-4 text-sm' : 'h-9 px-3 text-sm',
            value === o ? 'border-primary bg-primary text-primary-foreground' : 'border-input bg-card hover:bg-secondary',
          )}
        >
          {labels[o]}
        </button>
      ))}
    </div>
  )
}
