import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Check, ChevronRight } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PageTitle } from '@/components/Layout'
import { CityTabs } from '@/components/CityTabs'
import { ApptRow } from '@/components/ApptRow'
import { AppointmentSheet } from '@/components/AppointmentSheet'
import { CityBadge, RelanceBadge } from '@/components/Badges'
import { WhatsAppButton } from '@/components/WhatsAppButton'
import { useCity, matchCity } from '@/lib/city'
import { must, useLive } from '@/lib/live'
import { fetchAppointments, fetchLeads, needsFollowUp } from '@/lib/queries'
import { addDays, dayKey, dayStartIso, fmtKeyLong, fmtKeyShort, monthStart, todayKey, weekStart } from '@/lib/dates'
import { formatDH, SOURCE_LABEL, STAGE_DOT, STAGE_LABEL, STAGES } from '@/lib/labels'
import { supabase } from '@/lib/supabase'
import type { AppointmentWithLead, Lead, LeadSource, Task } from '@/lib/types'
import { cn } from '@/lib/utils'

type TaskWithLead = Task & { lead: Pick<Lead, 'id' | 'full_name' | 'phone' | 'city'> | null }

export default function Dashboard() {
  const { city } = useCity()
  const [open, setOpen] = useState<AppointmentWithLead | null>(null)
  const today = todayKey()
  const wStart = weekStart(today)
  const mStart = monthStart(today)
  const from = wStart < mStart ? wStart : mStart

  const leads = useLive(fetchLeads, [], ['leads', 'activities', 'appointments'])
  const appts = useLive(() => fetchAppointments(dayStartIso(wStart), dayStartIso(addDays(wStart, 7))), [wStart], ['appointments'])
  const tasks = useLive(async () => must(
    await supabase.from('tasks').select('*, lead:leads(id, full_name, phone, city)')
      .eq('status', 'a_faire').lte('due_date', today).order('due_date'),
  ) as TaskWithLead[], [today], ['tasks'])
  // "→ gagne" lines of the timeline = when a lead was won.
  const wins = useLive(async () => must(
    await supabase.from('activities').select('lead_id, created_at')
      .eq('type', 'changement_statut').like('content', '%→ gagne').gte('created_at', dayStartIso(from)),
  ) as { lead_id: string; created_at: string }[], [from], ['activities'])

  const allLeads = useMemo(() => (leads.data ?? []).filter(l => matchCity(city, l.city)), [leads.data, city])
  const weekAppts = useMemo(() => (appts.data ?? []).filter(a => matchCity(city, a.city)), [appts.data, city])
  const todayAppts = weekAppts.filter(a => dayKey(a.scheduled_at) === today)
  const restOfWeek = weekAppts.filter(a => dayKey(a.scheduled_at) > today)
  const dueTasks = (tasks.data ?? []).filter(t => t.lead && matchCity(city, t.lead.city))
  const stale = allLeads.filter(needsFollowUp)

  const revenue = useMemo(() => {
    const byId = new Map(allLeads.map(l => [l.id, l]))
    const sum = (sinceKey: string) => {
      const ids = new Set((wins.data ?? []).filter(w => dayKey(w.created_at) >= sinceKey).map(w => w.lead_id))
      return [...ids].reduce((s, id) => s + (byId.get(id)?.estimated_value ?? 0), 0)
    }
    return { week: sum(wStart), month: sum(mStart) }
  }, [wins.data, allLeads, wStart, mStart])

  const stageCounts = STAGES.map(s => ({ s, n: allLeads.filter(l => l.stage === s).length }))
  const maxStage = Math.max(1, ...stageCounts.map(x => x.n))
  const monthLeads = allLeads.filter(l => dayKey(l.created_at) >= mStart)
  const bySource = Object.entries(
    monthLeads.reduce<Record<string, number>>((acc, l) => ({ ...acc, [l.source]: (acc[l.source] ?? 0) + 1 }), {}),
  ).sort((a, b) => b[1] - a[1])

  const split = city === 'all'
    ? [{ key: 'casablanca', title: 'Casa', items: todayAppts.filter(a => a.city === 'casablanca') },
       { key: 'rabat', title: 'Rabat', items: todayAppts.filter(a => a.city === 'rabat') },
       { key: 'autre', title: 'Autre', items: todayAppts.filter(a => a.city === 'autre') }].filter(g => g.key !== 'autre' || g.items.length)
    : [{ key: city, title: '', items: todayAppts }]

  async function doneTask(id: string) {
    await supabase.from('tasks').update({ status: 'fait' }).eq('id', id)
  }

  const error = leads.error || appts.error || tasks.error
  return (
    <>
      <PageTitle title="Aujourd'hui">
        <CityTabs />
      </PageTitle>
      <p className="-mt-3 mb-4 text-sm text-muted-foreground capitalize">{fmtKeyLong(today)}</p>
      {error && <p className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-800">{error}</p>}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3 [&>*]:min-w-0">
        {/* Today's rendez-vous */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Rendez-vous aujourd'hui <span className="text-muted-foreground">({todayAppts.length})</span></CardTitle>
            <Link to="/rdv" className="flex items-center text-sm text-muted-foreground hover:text-foreground">Agenda<ChevronRight className="size-4" /></Link>
          </CardHeader>
          <CardContent className={cn('grid grid-cols-1 gap-3 [&>*]:min-w-0', split.length > 1 && 'sm:grid-cols-2')}>
            {split.map(g => (
              <div key={g.key}>
                {g.title && <div className="mb-1 flex items-center gap-2"><CityBadge city={g.key as Lead['city']} /><span className="text-xs text-muted-foreground">{g.items.length} RDV</span></div>}
                <div className="divide-y rounded-lg border">
                  {g.items.map(a => <ApptRow key={a.id} appt={a} onClick={() => setOpen(a)} showCity={false} />)}
                  {!g.items.length && <p className="px-3 py-4 text-sm text-muted-foreground">Aucun rendez-vous</p>}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Money */}
        <Card>
          <CardHeader><CardTitle>Gagné</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-2 gap-3">
            <div className="rounded-lg bg-secondary p-3">
              <div className="text-xs text-muted-foreground">Cette semaine</div>
              <div className="text-xl font-semibold tabular-nums">{formatDH(revenue.week) || '0 DH'}</div>
            </div>
            <div className="rounded-lg bg-secondary p-3">
              <div className="text-xs text-muted-foreground">Ce mois</div>
              <div className="text-xl font-semibold tabular-nums">{formatDH(revenue.month) || '0 DH'}</div>
            </div>
            <p className="col-span-2 text-xs text-muted-foreground">Valeur estimée des leads passés à « Gagné ».</p>
          </CardContent>
        </Card>

        {/* Rest of the week */}
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle>Cette semaine <span className="text-muted-foreground">({restOfWeek.length} à venir)</span></CardTitle></CardHeader>
          <CardContent>
            <div className="divide-y rounded-lg border">
              {restOfWeek.map((a, i) => {
                const k = dayKey(a.scheduled_at)
                const newDay = i === 0 || dayKey(restOfWeek[i - 1].scheduled_at) !== k
                return (
                  <div key={a.id}>
                    {newDay && <div className="bg-secondary/60 px-3 py-1.5 text-xs font-semibold capitalize">{fmtKeyShort(k)}</div>}
                    <ApptRow appt={a} onClick={() => setOpen(a)} />
                  </div>
                )
              })}
              {!restOfWeek.length && <p className="px-3 py-4 text-sm text-muted-foreground">Rien d'autre cette semaine</p>}
            </div>
          </CardContent>
        </Card>

        {/* Follow-ups */}
        <Card>
          <CardHeader><CardTitle>Relances <span className="text-muted-foreground">({dueTasks.length + stale.length})</span></CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {dueTasks.map(t => (
              <div key={t.id} className="flex items-center gap-2 rounded-lg border p-2">
                <button onClick={() => doneTask(t.id)} aria-label="Fait" className="grid size-10 shrink-0 place-items-center rounded-lg border hover:bg-secondary"><Check className="size-4" /></button>
                <Link to={`/leads/${t.lead_id}`} className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium">{t.title}</div>
                  <div className={cn('truncate text-xs', t.due_date < today ? 'text-destructive' : 'text-muted-foreground')}>
                    {t.lead?.full_name} · {t.due_date < today ? `en retard (${fmtKeyShort(t.due_date)})` : "aujourd'hui"}
                  </div>
                </Link>
                {t.lead && <WhatsAppButton compact leadId={t.lead.id} phone={t.lead.phone} fullName={t.lead.full_name} />}
              </div>
            ))}
            {stale.slice(0, 8).map(l => (
              <div key={l.id} className="flex items-center gap-2 rounded-lg border p-2">
                <Link to={`/leads/${l.id}`} className="min-w-0 flex-1 pl-1">
                  <div className="truncate text-sm font-medium">{l.full_name}</div>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground"><RelanceBadge />{STAGE_LABEL[l.stage]}</div>
                </Link>
                <WhatsAppButton compact leadId={l.id} phone={l.phone} fullName={l.full_name} />
              </div>
            ))}
            {stale.length > 8 && <Link to="/leads?relance=1" className="block text-center text-sm text-muted-foreground hover:text-foreground">+ {stale.length - 8} autres à relancer</Link>}
            {!dueTasks.length && !stale.length && <p className="py-2 text-sm text-muted-foreground">Tout est à jour 👌</p>}
          </CardContent>
        </Card>

        {/* Funnel */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Pipeline</CardTitle>
            <Link to="/pipeline" className="flex items-center text-sm text-muted-foreground hover:text-foreground">Ouvrir<ChevronRight className="size-4" /></Link>
          </CardHeader>
          <CardContent className="space-y-1.5">
            {stageCounts.map(({ s, n }) => (
              <div key={s} className="grid grid-cols-[8.5rem_1fr_2rem] items-center gap-2 text-sm">
                <span className="truncate text-muted-foreground">{STAGE_LABEL[s]}</span>
                <div className="h-5 rounded bg-secondary">
                  <div className={cn('h-5 rounded', STAGE_DOT[s])} style={{ width: `${(n / maxStage) * 100}%`, minWidth: n ? 6 : 0 }} />
                </div>
                <span className="text-right font-semibold tabular-nums">{n}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Sources */}
        <Card>
          <CardHeader><CardTitle>Leads du mois par source</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {bySource.map(([s, n]) => (
              <div key={s} className="flex items-center justify-between text-sm">
                <span>{SOURCE_LABEL[s as LeadSource]}</span>
                <span className="font-semibold tabular-nums">{n}</span>
              </div>
            ))}
            {!bySource.length && <p className="text-sm text-muted-foreground">Aucun lead ce mois-ci</p>}
            <div className="flex items-center justify-between border-t pt-2 text-sm font-semibold"><span>Total</span><span className="tabular-nums">{monthLeads.length}</span></div>
          </CardContent>
        </Card>
      </div>

      <AppointmentSheet appt={open} onClose={() => setOpen(null)} />
    </>
  )
}
