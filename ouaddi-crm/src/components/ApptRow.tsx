import { ApptStatusBadge, CityBadge } from '@/components/Badges'
import { APPT_TYPE_DOT, APPT_TYPE_LABEL } from '@/lib/labels'
import { fmtTime } from '@/lib/dates'
import type { AppointmentWithLead } from '@/lib/types'
import { cn } from '@/lib/utils'

// One line of an agenda list: time · type · client · status. Big tap target.
export function ApptRow({ appt, onClick, showCity = true }: { appt: AppointmentWithLead; onClick: () => void; showCity?: boolean }) {
  const off = appt.status === 'annule' || appt.status === 'no_show'
  return (
    <button onClick={onClick} className={cn('flex w-full items-center gap-3 px-3 py-3 text-left hover:bg-secondary/60', off && 'opacity-60')}>
      <div className="w-12 shrink-0 text-sm font-semibold tabular-nums">{fmtTime(appt.scheduled_at)}</div>
      <span className={cn('size-2.5 shrink-0 rounded-full', APPT_TYPE_DOT[appt.type])} />
      <div className="min-w-0 flex-1">
        <div className={cn('truncate font-medium', appt.status === 'annule' && 'line-through')}>{appt.lead?.full_name ?? '—'}</div>
        <div className="truncate text-xs text-muted-foreground">
          {APPT_TYPE_LABEL[appt.type]}{appt.address ? ` · ${appt.address}` : ''}
        </div>
      </div>
      <div className="flex shrink-0 flex-col items-end gap-1">
        {showCity && <CityBadge city={appt.city} />}
        <ApptStatusBadge status={appt.status} />
      </div>
    </button>
  )
}
