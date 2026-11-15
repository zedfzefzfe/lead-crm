import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, CalendarPlus, Check, MapPin, Phone, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input, Label, Select, Textarea } from '@/components/ui/input'
import { Chips } from '@/components/Chips'
import { CityBadge, RelanceBadge } from '@/components/Badges'
import { ApptRow } from '@/components/ApptRow'
import { AppointmentSheet } from '@/components/AppointmentSheet'
import { WhatsAppButton } from '@/components/WhatsAppButton'
import { useQuickAdd } from '@/components/QuickAdd'
import { useAuth } from '@/lib/auth'
import { must, useLive } from '@/lib/live'
import { APPT_SELECT, needsFollowUp } from '@/lib/queries'
import { addDays, dayKey, daysSince, fmtDateTime, fmtKeyShort, todayKey } from '@/lib/dates'
import { displayPhone, isValidPhone, normalizePhone } from '@/lib/phone'
import {
  ACTIVITY_LABEL, CITY_LABEL, LOST_REASONS, prettyActivity, SERVICE_LABEL, SOURCE_LABEL, STAGE_DOT, STAGE_LABEL, STAGES,
} from '@/lib/labels'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/lib/toast'
import type { Activity, ActivityType, AppointmentWithLead, City, Lead, LeadOverview, LeadSource, Service, Task } from '@/lib/types'
import { cn } from '@/lib/utils'

const CITIES: City[] = ['casablanca', 'rabat', 'autre']
const SERVICES: Service[] = ['rideaux', 'fauteuils', 'les_deux']
const NOTE_TYPES: ActivityType[] = ['note', 'appel', 'whatsapp']
const ACTIVITY_ICON: Record<ActivityType, string> = { note: '📝', appel: '📞', whatsapp: '💬', rdv: '📅', changement_statut: '➡️' }

export default function LeadDetail() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const toast = useToast()
  const { profiles, isAdmin } = useAuth()
  const { addAppointment } = useQuickAdd()
  const [openAppt, setOpenAppt] = useState<AppointmentWithLead | null>(null)

  const lead = useLive(async () => must(await supabase.from('leads_overview').select('*').eq('id', id).maybeSingle()) as LeadOverview | null,
    [id], ['leads', 'activities', 'appointments'])
  const appts = useLive(async () => must(await supabase.from('appointments').select(APPT_SELECT).eq('lead_id', id).order('scheduled_at', { ascending: false })) as AppointmentWithLead[],
    [id], ['appointments'])
  const activities = useLive(async () => must(await supabase.from('activities').select('*').eq('lead_id', id).order('created_at', { ascending: false })) as Activity[],
    [id], ['activities'])
  const tasks = useLive(async () => must(await supabase.from('tasks').select('*').eq('lead_id', id).order('status').order('due_date')) as Task[],
    [id], ['tasks'])

  const names = useMemo(() => new Map(profiles.map(p => [p.id, p.full_name])), [profiles])
  const l = lead.data

  async function update(patch: Partial<Lead>, msg = 'Enregistré') {
    const { error } = await supabase.from('leads').update(patch).eq('id', id)
    if (error) return toast(error.message, true)
    toast(msg)
    lead.reload()
  }

  async function remove() {
    if (!confirm(`Supprimer ${l?.full_name} et tout son historique ?`)) return
    const { error } = await supabase.from('leads').delete().eq('id', id)
    if (error) return toast(error.message, true)
    toast('Lead supprimé')
    navigate('/leads')
  }

  if (lead.error) return <p className="rounded-lg bg-red-50 p-3 text-sm text-red-800">{lead.error}</p>
  if (lead.loading) return null
  if (!l) return <p className="py-10 text-center text-muted-foreground">Lead introuvable. <Link className="underline" to="/leads">Retour</Link></p>

  return (
    <>
      <button onClick={() => navigate(-1)} className="mb-3 -ml-2 flex h-10 items-center gap-1 rounded-lg px-2 text-sm text-muted-foreground hover:bg-secondary">
        <ArrowLeft className="size-4" />Retour
      </button>

      {/* Header: who + the 3 big actions */}
      <div className="mb-4 rounded-xl border bg-card p-4">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-2xl font-semibold tracking-tight">{l.full_name}</h1>
          <CityBadge city={l.city} />
          {needsFollowUp(l) && <RelanceBadge />}
        </div>
        <div className="mt-1 text-sm text-muted-foreground">
          {displayPhone(l.phone)} · {SERVICE_LABEL[l.service]} · {SOURCE_LABEL[l.source]}{l.source_detail ? ` (${l.source_detail})` : ''}
        </div>
        <div className="mt-1 text-xs text-muted-foreground">Dernière activité il y a {daysSince(l.last_activity_at)} j · ajouté le {fmtKeyShort(dayKey(l.created_at))}</div>
        <div className="mt-4 grid grid-cols-3 gap-2">
          <WhatsAppButton leadId={l.id} phone={l.phone} fullName={l.full_name} />
          <Button asChild variant="outline"><a href={`tel:+${l.phone}`} onClick={() => supabase.from('activities').insert({ lead_id: l.id, type: 'appel', content: 'Appel lancé depuis le CRM' }).then(() => {})}><Phone />Appeler</a></Button>
          <Button variant="outline" onClick={() => addAppointment({ leadId: l.id })}><CalendarPlus />RDV</Button>
        </div>
      </div>

      {/* Stage */}
      <div className="no-scrollbar -mx-4 mb-4 flex gap-2 overflow-x-auto px-4 lg:mx-0 lg:flex-wrap lg:px-0">
        {STAGES.map(s => (
          <button key={s} onClick={() => s !== l.stage && update({ stage: s, ...(s !== 'perdu' ? { lost_reason: null } : {}) }, STAGE_LABEL[s])}
            className={cn('flex h-10 shrink-0 items-center gap-2 rounded-full border px-3.5 text-sm font-medium',
              l.stage === s ? 'border-primary bg-primary text-primary-foreground' : 'bg-card hover:bg-secondary')}>
            <span className={cn('size-2 rounded-full', STAGE_DOT[s])} />{STAGE_LABEL[s]}
          </button>
        ))}
      </div>
      {l.stage === 'perdu' && (
        <div className="mb-4 max-w-sm">
          <Label>Raison de la perte</Label>
          <Select value={l.lost_reason ?? ''} onChange={e => update({ lost_reason: e.target.value || null })}>
            <option value="">—</option>
            {LOST_REASONS.map(r => <option key={r} value={r}>{r}</option>)}
          </Select>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_22rem] [&>*]:min-w-0">
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Rendez-vous</CardTitle>
              <Button size="sm" variant="secondary" onClick={() => addAppointment({ leadId: l.id })}><CalendarPlus />Ajouter</Button>
            </CardHeader>
            <CardContent>
              <div className="divide-y rounded-lg border">
                {(appts.data ?? []).map(a => (
                  <div key={a.id}>
                    <div className="bg-secondary/40 px-3 pt-1.5 text-[11px] font-medium text-muted-foreground capitalize">{fmtKeyShort(dayKey(a.scheduled_at))}</div>
                    <ApptRow appt={a} onClick={() => setOpenAppt(a)} />
                  </div>
                ))}
                {!appts.data?.length && <p className="px-3 py-3 text-sm text-muted-foreground">Aucun rendez-vous</p>}
              </div>
            </CardContent>
          </Card>

          <Timeline leadId={l.id} activities={activities.data ?? []} names={names} />
        </div>

        <div className="space-y-4">
          <Tasks leadId={l.id} tasks={tasks.data ?? []} />
          <Details lead={l} profiles={profiles} onSave={update} />
          {isAdmin && (
            <Button variant="ghost" className="w-full text-destructive" onClick={remove}><Trash2 />Supprimer le lead</Button>
          )}
        </div>
      </div>

      <AppointmentSheet appt={openAppt} onClose={() => setOpenAppt(null)} />
    </>
  )
}

function Timeline({ leadId, activities, names }: { leadId: string; activities: Activity[]; names: Map<string, string> }) {
  const toast = useToast()
  const [type, setType] = useState<ActivityType>('note')
  const [text, setText] = useState('')
  const [saving, setSaving] = useState(false)

  async function add() {
    if (!text.trim()) return
    setSaving(true)
    const { error } = await supabase.from('activities').insert({ lead_id: leadId, type, content: text.trim() })
    setSaving(false)
    if (error) return toast(error.message, true)
    setText('')
  }

  return (
    <Card>
      <CardHeader><CardTitle>Historique</CardTitle></CardHeader>
      <CardContent>
        <div className="mb-4 space-y-2 rounded-lg border p-3">
          <Chips size="sm" value={type} options={NOTE_TYPES} onChange={setType} labels={ACTIVITY_LABEL} />
          <Textarea rows={2} value={text} onChange={e => setText(e.target.value)} placeholder="Ce qui a été dit, prochaine étape…" />
          <Button className="w-full" onClick={add} disabled={saving || !text.trim()}>Ajouter à l'historique</Button>
        </div>
        <ol className="space-y-3">
          {activities.map(a => (
            <li key={a.id} className="flex gap-3">
              <span className="mt-0.5 text-base" aria-hidden>{ACTIVITY_ICON[a.type]}</span>
              <div className="min-w-0 flex-1">
                <div className="text-sm whitespace-pre-wrap">{prettyActivity(a.type, a.content)}</div>
                <div className="text-xs text-muted-foreground">
                  {ACTIVITY_LABEL[a.type]} · {fmtDateTime(a.created_at)}{a.created_by && names.get(a.created_by) ? ` · ${names.get(a.created_by)}` : ''}
                </div>
              </div>
            </li>
          ))}
          {!activities.length && <li className="text-sm text-muted-foreground">Rien pour l'instant.</li>}
        </ol>
      </CardContent>
    </Card>
  )
}

function Tasks({ leadId, tasks }: { leadId: string; tasks: Task[] }) {
  const toast = useToast()
  const today = todayKey()
  const [title, setTitle] = useState('')
  const [due, setDue] = useState(addDays(today, 1))

  async function add() {
    if (!title.trim()) return
    const { error } = await supabase.from('tasks').insert({ lead_id: leadId, title: title.trim(), due_date: due })
    if (error) return toast(error.message, true)
    setTitle('')
  }
  const toggle = (t: Task) => supabase.from('tasks').update({ status: t.status === 'fait' ? 'a_faire' : 'fait' }).eq('id', t.id).then(() => {})

  return (
    <Card>
      <CardHeader><CardTitle>Relances</CardTitle></CardHeader>
      <CardContent className="space-y-2">
        {tasks.map(t => (
          <div key={t.id} className="flex items-center gap-2">
            <button onClick={() => toggle(t)} aria-label={t.status === 'fait' ? 'Rouvrir' : 'Fait'}
              className={cn('grid size-10 shrink-0 place-items-center rounded-lg border', t.status === 'fait' && 'border-emerald-600 bg-emerald-600 text-white')}>
              {t.status === 'fait' && <Check className="size-4" />}
            </button>
            <div className={cn('min-w-0 flex-1', t.status === 'fait' && 'text-muted-foreground line-through')}>
              <div className="truncate text-sm">{t.title}</div>
              <div className={cn('text-xs', t.status === 'a_faire' && t.due_date < today ? 'text-destructive' : 'text-muted-foreground')}>
                {t.due_date === today ? "Aujourd'hui" : fmtKeyShort(t.due_date)}
              </div>
            </div>
          </div>
        ))}
        <div className="grid grid-cols-[1fr_8.5rem] gap-2 pt-1">
          <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Relancer pour le devis…"
            onKeyDown={e => { if (e.key === 'Enter') add() }} />
          <Input type="date" value={due} onChange={e => setDue(e.target.value)} />
        </div>
        <div className="flex flex-wrap gap-2">
          {[['Demain', 1], ['+3 j', 3], ['+1 sem.', 7]].map(([label, n]) => (
            <button key={label} onClick={() => setDue(addDays(today, n as number))} className="h-8 rounded-md border px-2.5 text-xs hover:bg-secondary">{label}</button>
          ))}
          <Button size="sm" className="ml-auto" onClick={add} disabled={!title.trim()}>Ajouter</Button>
        </div>
      </CardContent>
    </Card>
  )
}

function Details({ lead, profiles, onSave }: {
  lead: LeadOverview
  profiles: { id: string; full_name: string }[]
  onSave: (patch: Partial<Lead>, msg?: string) => Promise<void>
}) {
  const [form, setForm] = useState(lead)
  useEffect(() => setForm(lead), [lead])
  const set = <K extends keyof Lead>(k: K, v: Lead[K]) => setForm(f => ({ ...f, [k]: v }))
  const saveText = (k: 'full_name' | 'address' | 'source_detail' | 'notes') => {
    const v = (form[k] ?? '').toString()
    if (v === (lead[k] ?? '')) return
    if (k === 'full_name' && !v.trim()) return setForm(lead)
    onSave({ [k]: k === 'notes' || k === 'full_name' ? v : v.trim() || null })
  }
  const savePhone = () => {
    const d = normalizePhone(form.phone)
    if (d === lead.phone) return
    if (!isValidPhone(d)) return setForm(lead)
    onSave({ phone: d })
  }

  return (
    <Card>
      <CardHeader><CardTitle>Infos</CardTitle></CardHeader>
      <CardContent className="space-y-3">
        <div>
          <Label>Nom</Label>
          <Input value={form.full_name} onChange={e => set('full_name', e.target.value)} onBlur={() => saveText('full_name')} />
        </div>
        <div>
          <Label>Téléphone (WhatsApp)</Label>
          <Input type="tel" value={form.phone} onChange={e => set('phone', e.target.value)} onBlur={savePhone} />
        </div>
        <div>
          <Label>Ville</Label>
          <Chips size="sm" value={form.city} options={CITIES} labels={CITY_LABEL} onChange={v => { set('city', v); onSave({ city: v }) }} />
        </div>
        <div>
          <Label>Adresse</Label>
          <div className="flex gap-2">
            <Input value={form.address ?? ''} onChange={e => set('address', e.target.value)} onBlur={() => saveText('address')} placeholder="Quartier, rue…" />
            {lead.address && (
              <Button asChild variant="outline" size="icon" className="shrink-0">
                <a target="_blank" rel="noreferrer" aria-label="Ouvrir dans Maps" href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(lead.address)}`}><MapPin /></a>
              </Button>
            )}
          </div>
        </div>
        <div>
          <Label>Service</Label>
          <Chips size="sm" value={form.service} options={SERVICES} labels={SERVICE_LABEL} onChange={v => { set('service', v); onSave({ service: v }) }} />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label>Valeur estimée (DH)</Label>
            <Input type="number" inputMode="numeric" min={0} value={form.estimated_value ?? ''}
              onChange={e => set('estimated_value', e.target.value === '' ? null : Number(e.target.value))}
              onBlur={() => form.estimated_value !== lead.estimated_value && onSave({ estimated_value: form.estimated_value })} />
          </div>
          <div>
            <Label>Assigné à</Label>
            <Select value={form.assigned_to ?? ''} onChange={e => { const v = e.target.value || null; set('assigned_to', v); onSave({ assigned_to: v }) }}>
              <option value="">—</option>
              {profiles.map(p => <option key={p.id} value={p.id}>{p.full_name}</option>)}
            </Select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label>Source</Label>
            <Select value={form.source} onChange={e => { const v = e.target.value as LeadSource; set('source', v); onSave({ source: v }) }}>
              {(Object.keys(SOURCE_LABEL) as LeadSource[]).map(s => <option key={s} value={s}>{SOURCE_LABEL[s]}</option>)}
            </Select>
          </div>
          <div>
            <Label>Pub / campagne</Label>
            <Input value={form.source_detail ?? ''} onChange={e => set('source_detail', e.target.value)} onBlur={() => saveText('source_detail')} />
          </div>
        </div>
        <div>
          <Label>Notes</Label>
          <Textarea rows={4} value={form.notes} onChange={e => set('notes', e.target.value)} onBlur={() => saveText('notes')}
            placeholder="Dimensions, tissu souhaité, budget…" />
        </div>
        <p className="text-xs text-muted-foreground">Les champs s'enregistrent tout seuls quand tu passes au suivant.</p>
      </CardContent>
    </Card>
  )
}

