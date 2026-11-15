import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  DndContext, DragOverlay, MouseSensor, TouchSensor, useDraggable, useDroppable, useSensor, useSensors,
  type DragEndEvent, type DragStartEvent,
} from '@dnd-kit/core'
import { CalendarClock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Sheet } from '@/components/ui/sheet'
import { PageTitle } from '@/components/Layout'
import { CityTabs } from '@/components/CityTabs'
import { CityBadge, RelanceBadge } from '@/components/Badges'
import { WhatsAppButton } from '@/components/WhatsAppButton'
import { useCity, matchCity } from '@/lib/city'
import { useLive } from '@/lib/live'
import { fetchLeads, needsFollowUp } from '@/lib/queries'
import { fmtRelative } from '@/lib/dates'
import { formatDH, LOST_REASONS, SERVICE_LABEL, STAGE_DOT, STAGE_LABEL, STAGES } from '@/lib/labels'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/lib/toast'
import type { LeadOverview, Stage } from '@/lib/types'
import { cn } from '@/lib/utils'

export default function Pipeline() {
  const { city } = useCity()
  const toast = useToast()
  const { data, error, reload } = useLive(fetchLeads, [], ['leads', 'appointments'])
  const [moved, setMoved] = useState<Record<string, Stage>>({}) // optimistic moves
  const [dragging, setDragging] = useState<LeadOverview | null>(null)
  const [lostFor, setLostFor] = useState<LeadOverview | null>(null)

  // Mouse: drag after 6 px. Finger: press ~¼ s, so the board still scrolls normally.
  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 8 } }),
  )

  const leads = useMemo(
    () => (data ?? []).filter(l => matchCity(city, l.city)).map(l => (moved[l.id] ? { ...l, stage: moved[l.id] } : l)),
    [data, city, moved],
  )
  const columns = STAGES.map(s => {
    const items = leads.filter(l => l.stage === s)
    return { stage: s, items, total: items.reduce((sum, l) => sum + (l.estimated_value ?? 0), 0) }
  })

  async function setStage(lead: LeadOverview, stage: Stage, lostReason?: string) {
    setMoved(m => ({ ...m, [lead.id]: stage }))
    const { error } = await supabase.from('leads')
      .update({ stage, ...(stage === 'perdu' ? { lost_reason: lostReason ?? null } : {}) })
      .eq('id', lead.id)
    if (error) toast(error.message, true)
    else toast(`${lead.full_name} → ${STAGE_LABEL[stage]}`)
    await reload()
    setMoved(m => { const { [lead.id]: _, ...rest } = m; return rest })
  }

  function onDragStart(e: DragStartEvent) {
    setDragging(leads.find(l => l.id === e.active.id) ?? null)
  }
  function onDragEnd(e: DragEndEvent) {
    setDragging(null)
    const lead = leads.find(l => l.id === e.active.id)
    const stage = e.over?.id as Stage | undefined
    if (!lead || !stage || stage === lead.stage) return
    if (stage === 'perdu') setLostFor(lead)
    else setStage(lead, stage)
  }

  return (
    <>
      <PageTitle title="Pipeline"><CityTabs /></PageTitle>
      <p className="-mt-2 mb-3 text-sm text-muted-foreground">Glisse une carte vers une autre colonne (sur téléphone : appui long, puis glisser).</p>
      {error && <p className="mb-3 rounded-lg bg-red-50 p-3 text-sm text-red-800">{error}</p>}

      <DndContext sensors={sensors} onDragStart={onDragStart} onDragEnd={onDragEnd} onDragCancel={() => setDragging(null)}>
        <div className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-4 lg:-mx-8 lg:px-8">
          {columns.map(c => (
            <Column key={c.stage} stage={c.stage} count={c.items.length} total={c.total}>
              {c.items.map(l => <DraggableCard key={l.id} lead={l} />)}
            </Column>
          ))}
        </div>
        <DragOverlay>{dragging && <LeadCard lead={dragging} lifted />}</DragOverlay>
      </DndContext>

      <Sheet open={!!lostFor} onOpenChange={o => !o && setLostFor(null)} title={`Perdu : ${lostFor?.full_name ?? ''}`}>
        <p className="mb-3 text-sm text-muted-foreground">Pourquoi ?</p>
        <div className="grid grid-cols-2 gap-2">
          {LOST_REASONS.map(r => (
            <Button key={r} variant="outline" onClick={() => { const l = lostFor!; setLostFor(null); setStage(l, 'perdu', r) }}>{r}</Button>
          ))}
        </div>
      </Sheet>
    </>
  )
}

function Column({ stage, count, total, children }: { stage: Stage; count: number; total: number; children: React.ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({ id: stage })
  return (
    <section ref={setNodeRef}
      className={cn('flex w-[17rem] shrink-0 snap-start flex-col rounded-xl border bg-secondary/40 transition-colors', isOver && 'border-ring bg-accent/50')}>
      <header className="flex items-center justify-between gap-2 px-3 pt-3 pb-2">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <span className={cn('size-2.5 rounded-full', STAGE_DOT[stage])} />{STAGE_LABEL[stage]}
          <span className="font-normal text-muted-foreground">{count}</span>
        </div>
        {total > 0 && <span className="text-xs text-muted-foreground tabular-nums">{formatDH(total)}</span>}
      </header>
      <div className="flex min-h-24 flex-1 flex-col gap-2 px-2 pb-2">{children}</div>
    </section>
  )
}

function DraggableCard({ lead }: { lead: LeadOverview }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: lead.id })
  return (
    <div ref={setNodeRef} {...listeners} {...attributes} className={cn('touch-manipulation', isDragging && 'opacity-30')}>
      <LeadCard lead={lead} />
    </div>
  )
}

function LeadCard({ lead, lifted }: { lead: LeadOverview; lifted?: boolean }) {
  const navigate = useNavigate()
  return (
    <div onClick={() => !lifted && navigate(`/leads/${lead.id}`)}
      className={cn('cursor-grab rounded-lg border bg-card p-3 select-none', lifted && 'rotate-2 shadow-xl')}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="truncate font-medium">{lead.full_name}</div>
          <div className="text-xs text-muted-foreground">{SERVICE_LABEL[lead.service]}</div>
        </div>
        <CityBadge city={lead.city} />
      </div>
      <div className="mt-2 flex items-center justify-between gap-2">
        <div className="min-w-0 space-y-1 text-xs">
          {lead.estimated_value != null && <div className="font-semibold tabular-nums">{formatDH(lead.estimated_value)}</div>}
          {lead.next_appt_at && (
            <div className="flex items-center gap-1 text-muted-foreground"><CalendarClock className="size-3.5" />{fmtRelative(lead.next_appt_at)}</div>
          )}
          {needsFollowUp(lead) && <RelanceBadge />}
        </div>
        {!lifted && <WhatsAppButton compact leadId={lead.id} phone={lead.phone} fullName={lead.full_name} />}
      </div>
    </div>
  )
}
