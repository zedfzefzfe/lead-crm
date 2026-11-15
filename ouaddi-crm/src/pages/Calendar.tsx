import { useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PageTitle } from '@/components/Layout'
import { CityTabs } from '@/components/CityTabs'
import { ApptRow } from '@/components/ApptRow'
import { AppointmentSheet } from '@/components/AppointmentSheet'
import { useQuickAdd } from '@/components/QuickAdd'
import { useCity, matchCity } from '@/lib/city'
import { useLive } from '@/lib/live'
import { fetchAppointments } from '@/lib/queries'
import { addDays, dayKey, dayStartIso, fmtKeyLong, fmtKeyShort, fmtTime, minutesOfDay, todayKey, weekStart } from '@/lib/dates'
import { APPT_TYPE_DOT, APPT_TYPE_LABEL, APPT_TYPE_STYLE, APPT_TYPES } from '@/lib/labels'
import type { AppointmentWithLead } from '@/lib/types'
import { cn } from '@/lib/utils'

type View = 'liste' | 'jour' | 'semaine'
const START_H = 7
const END_H = 22
const HOUR_PX = 56

function defaultView(): View {
  try {
    const v = localStorage.getItem('ouaddi.calview')
    if (v === 'liste' || v === 'jour' || v === 'semaine') return v
  } catch { /* ignore */ }
  return window.matchMedia('(min-width: 1024px)').matches ? 'semaine' : 'liste'
}

export default function CalendarPage() {
  const { city } = useCity()
  const { addAppointment } = useQuickAdd()
  const [view, setViewState] = useState<View>(defaultView)
  const [anchor, setAnchor] = useState(todayKey())
  const [open, setOpen] = useState<AppointmentWithLead | null>(null)
  const today = todayKey()

  const setView = (v: View) => {
    setViewState(v)
    try { localStorage.setItem('ouaddi.calview', v) } catch { /* ignore */ }
  }

  // Range shown: one day, Monday → Sunday, or (list) the next 7 days from the anchor.
  const range = useMemo(() => {
    if (view === 'jour') return { from: anchor, days: 1 }
    if (view === 'semaine') return { from: weekStart(anchor), days: 7 }
    return { from: anchor, days: 7 }
  }, [view, anchor])
  const days = Array.from({ length: range.days }, (_, i) => addDays(range.from, i))

  const { data, error } = useLive(
    () => fetchAppointments(dayStartIso(range.from), dayStartIso(addDays(range.from, range.days))),
    [range.from, range.days],
    ['appointments'],
  )
  const appts = useMemo(() => (data ?? []).filter(a => matchCity(city, a.city)), [data, city])
  const byDay = useMemo(() => {
    const m = new Map<string, AppointmentWithLead[]>()
    for (const a of appts) {
      const k = dayKey(a.scheduled_at)
      m.set(k, [...(m.get(k) ?? []), a])
    }
    return m
  }, [appts])

  const step = view === 'jour' ? 1 : 7
  const title =
    view === 'jour' ? fmtKeyLong(anchor)
      : `${fmtKeyShort(range.from)} → ${fmtKeyShort(addDays(range.from, 6))}`

  return (
    <>
      <PageTitle title="Rendez-vous">
        <CityTabs />
      </PageTitle>

      <div className="mb-3 flex flex-wrap items-center gap-2">
        <div className="inline-flex rounded-lg border bg-card p-1">
          {(['liste', 'jour', 'semaine'] as View[]).map(v => (
            <button key={v} onClick={() => setView(v)}
              className={cn('h-9 rounded-md px-3 text-sm font-medium capitalize', view === v ? 'bg-primary text-primary-foreground' : 'text-muted-foreground')}>
              {v === 'liste' ? 'Liste' : v}
            </button>
          ))}
        </div>
        <div className="ml-auto flex items-center gap-1">
          <Button variant="outline" size="icon" className="size-10" aria-label="Précédent" onClick={() => setAnchor(addDays(anchor, -step))}><ChevronLeft /></Button>
          <Button variant="outline" size="sm" className="h-10" onClick={() => setAnchor(today)}>Aujourd'hui</Button>
          <Button variant="outline" size="icon" className="size-10" aria-label="Suivant" onClick={() => setAnchor(addDays(anchor, step))}><ChevronRight /></Button>
        </div>
      </div>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="text-sm font-medium capitalize">{title}</div>
        <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
          {APPT_TYPES.map(t => (
            <span key={t} className="inline-flex items-center gap-1.5"><span className={cn('size-2.5 rounded-full', APPT_TYPE_DOT[t])} />{APPT_TYPE_LABEL[t]}</span>
          ))}
        </div>
      </div>
      {error && <p className="mb-3 rounded-lg bg-red-50 p-3 text-sm text-red-800">{error}</p>}

      {view === 'liste' ? (
        <div className="space-y-4">
          {days.map(k => {
            const items = byDay.get(k) ?? []
            return (
              <section key={k}>
                <div className="mb-1.5 flex items-center justify-between">
                  <h2 className={cn('text-sm font-semibold capitalize', k === today && 'text-brand')}>
                    {k === today ? "Aujourd'hui · " : ''}{fmtKeyLong(k)}
                  </h2>
                  <button onClick={() => addAppointment({ date: k })} className="h-9 rounded-lg px-2 text-sm text-muted-foreground hover:bg-secondary">+ RDV</button>
                </div>
                <div className="divide-y rounded-xl border bg-card">
                  {items.map(a => <ApptRow key={a.id} appt={a} onClick={() => setOpen(a)} />)}
                  {!items.length && <p className="px-3 py-3 text-sm text-muted-foreground">—</p>}
                </div>
              </section>
            )
          })}
        </div>
      ) : (
        <TimeGrid days={days} byDay={byDay} today={today} onOpen={setOpen}
          onSlot={(date, time) => addAppointment({ date, time })}
          onDay={k => { setAnchor(k); setView('jour') }} />
      )}

      <AppointmentSheet appt={open} onClose={() => setOpen(null)} />
    </>
  )
}

// Places overlapping rendez-vous side by side.
function layoutDay(items: AppointmentWithLead[]) {
  const sorted = [...items].sort((a, b) => a.scheduled_at.localeCompare(b.scheduled_at))
  const lanesEnd: number[] = []
  const placed = sorted.map(a => {
    const start = minutesOfDay(a.scheduled_at)
    const end = start + Math.max(a.duration_min, 30)
    let lane = lanesEnd.findIndex(e => e <= start)
    if (lane === -1) { lane = lanesEnd.length; lanesEnd.push(end) } else lanesEnd[lane] = end
    return { a, start, end, lane }
  })
  return placed.map(p => ({ ...p, lanes: lanesEnd.length }))
}

function TimeGrid({
  days, byDay, today, onOpen, onSlot, onDay,
}: {
  days: string[]
  byDay: Map<string, AppointmentWithLead[]>
  today: string
  onOpen: (a: AppointmentWithLead) => void
  onSlot: (date: string, time: string) => void
  onDay: (k: string) => void
}) {
  const hours = Array.from({ length: END_H - START_H }, (_, i) => START_H + i)
  const week = days.length > 1
  return (
    <div className="overflow-x-auto rounded-xl border bg-card">
      <div className={cn('grid', week && 'min-w-[760px]')} style={{ gridTemplateColumns: `3rem repeat(${days.length}, minmax(0, 1fr))` }}>
        {/* header */}
        <div className="sticky top-0 border-b bg-card" />
        {days.map(k => (
          <button key={k} onClick={() => week && onDay(k)}
            className={cn('border-b border-l px-1 py-2 text-center text-xs font-semibold capitalize', k === today && 'bg-accent/50', week && 'hover:bg-secondary')}>
            {fmtKeyShort(k)}
          </button>
        ))}
        {/* hours column */}
        <div>
          {hours.map(h => (
            <div key={h} className="relative border-b text-right" style={{ height: HOUR_PX }}>
              <span className="absolute -top-2 right-1.5 bg-card px-0.5 text-[10px] text-muted-foreground tabular-nums">{h}:00</span>
            </div>
          ))}
        </div>
        {/* day columns */}
        {days.map(k => (
          <div key={k} className={cn('relative border-l', k === today && 'bg-accent/15')}>
            {hours.map(h => (
              <button key={h} aria-label={`Ajouter un RDV à ${h}:00`} onClick={() => onSlot(k, `${String(h).padStart(2, '0')}:00`)}
                className="block w-full border-b hover:bg-secondary/50" style={{ height: HOUR_PX }} />
            ))}
            {layoutDay(byDay.get(k) ?? []).map(({ a, start, end, lane, lanes }) => {
              const top = Math.max(0, ((start - START_H * 60) / 60) * HOUR_PX)
              const height = Math.max(26, ((end - start) / 60) * HOUR_PX - 2)
              const off = a.status === 'annule' || a.status === 'no_show'
              return (
                <button key={a.id} onClick={() => onOpen(a)}
                  className={cn('absolute overflow-hidden rounded-md border-l-4 px-1.5 py-1 text-left text-xs shadow-sm', APPT_TYPE_STYLE[a.type], off && 'opacity-50')}
                  style={{ top, height, left: `calc(${(lane / lanes) * 100}% + 2px)`, width: `calc(${100 / lanes}% - 4px)` }}>
                  <div className="font-semibold tabular-nums">{fmtTime(a.scheduled_at)}</div>
                  <div className={cn('truncate font-medium', a.status === 'annule' && 'line-through')}>{a.lead?.full_name}</div>
                  {height > 60 && <div className="truncate opacity-75">{APPT_TYPE_LABEL[a.type]}{a.status === 'confirme' ? ' · ✓' : ''}</div>}
                </button>
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )
}
