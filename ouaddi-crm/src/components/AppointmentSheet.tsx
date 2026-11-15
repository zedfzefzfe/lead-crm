import { useState } from 'react'
import { Link } from 'react-router-dom'
import { MapPin, Phone, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input, Label } from '@/components/ui/input'
import { Sheet } from '@/components/ui/sheet'
import { ApptStatusBadge, CityBadge } from '@/components/Badges'
import { WhatsAppButton } from '@/components/WhatsAppButton'
import { APPT_STATUS_LABEL, APPT_STATUSES, APPT_TYPE_DOT, APPT_TYPE_LABEL, SERVICE_LABEL } from '@/lib/labels'
import { dayKey, fmtKeyLong, fmtTime, toInstant } from '@/lib/dates'
import { firstName } from '@/lib/phone'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/lib/toast'
import type { ApptStatus, AppointmentWithLead } from '@/lib/types'
import { cn } from '@/lib/utils'

// Tap on a rendez-vous (calendar, dashboard): status in one tap, move it, WhatsApp the client.
export function AppointmentSheet({ appt, onClose }: { appt: AppointmentWithLead | null; onClose: () => void }) {
  const toast = useToast()
  const [moving, setMoving] = useState(false)
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')

  if (!appt) return null
  const lead = appt.lead

  async function setStatus(status: ApptStatus) {
    const { error } = await supabase.from('appointments').update({ status }).eq('id', appt!.id)
    if (error) return toast(error.message, true)
    toast(`RDV : ${APPT_STATUS_LABEL[status]}`)
    onClose()
  }
  async function move() {
    const { error } = await supabase.from('appointments').update({ scheduled_at: toInstant(date, time), status: 'planifie' }).eq('id', appt!.id)
    if (error) return toast(error.message, true)
    toast('RDV déplacé')
    setMoving(false)
    onClose()
  }
  async function remove() {
    if (!confirm('Supprimer ce rendez-vous ? (Pour un RDV qui n’a pas eu lieu, préfère « Annulé ».)')) return
    const { error } = await supabase.from('appointments').delete().eq('id', appt!.id)
    if (error) return toast(error.message, true)
    toast('RDV supprimé')
    onClose()
  }

  const confirmText = lead
    ? `Bonjour ${firstName(lead.full_name)}, c'est Ouaddi Living. Je vous confirme notre rendez-vous (${APPT_TYPE_LABEL[appt.type].toLowerCase()}) ${fmtKeyLong(dayKey(appt.scheduled_at))} à ${fmtTime(appt.scheduled_at)}${appt.address ? `, ${appt.address}` : ''}. À bientôt !`
    : ''

  return (
    <Sheet open onOpenChange={o => { if (!o) { setMoving(false); onClose() } }} title={`${APPT_TYPE_LABEL[appt.type]} — ${fmtTime(appt.scheduled_at)}`}>
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <span className={cn('size-2.5 rounded-full', APPT_TYPE_DOT[appt.type])} />
          <span className="capitalize">{fmtKeyLong(dayKey(appt.scheduled_at))}</span>
          <span className="text-muted-foreground">· {appt.duration_min} min</span>
          <CityBadge city={appt.city} />
          <ApptStatusBadge status={appt.status} />
        </div>

        {lead && (
          <div className="rounded-lg border p-3">
            <Link to={`/leads/${lead.id}`} onClick={onClose} className="font-semibold underline-offset-2 hover:underline">{lead.full_name}</Link>
            <div className="text-sm text-muted-foreground">{SERVICE_LABEL[lead.service]}</div>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <WhatsAppButton leadId={lead.id} phone={lead.phone} fullName={lead.full_name} text={confirmText} />
              <Button asChild variant="outline"><a href={`tel:+${lead.phone}`}><Phone />Appeler</a></Button>
            </div>
          </div>
        )}

        {appt.address && (
          <a className="flex items-start gap-2 text-sm underline-offset-2 hover:underline" target="_blank" rel="noreferrer"
            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(appt.address)}`}>
            <MapPin className="mt-0.5 size-4 shrink-0" />{appt.address}
          </a>
        )}
        {appt.notes && <p className="rounded-lg bg-secondary p-3 text-sm whitespace-pre-wrap">{appt.notes}</p>}

        <div>
          <Label>Statut</Label>
          <div className="grid grid-cols-3 gap-2">
            {APPT_STATUSES.map(s => (
              <Button key={s} variant={appt.status === s ? 'default' : 'outline'} onClick={() => setStatus(s)}>
                {APPT_STATUS_LABEL[s]}
              </Button>
            ))}
          </div>
        </div>

        {moving ? (
          <div className="space-y-2 rounded-lg border p-3">
            <div className="grid grid-cols-[1fr_7rem] gap-2">
              <Input type="date" value={date} onChange={e => setDate(e.target.value)} />
              <Input type="time" step={900} value={time} onChange={e => setTime(e.target.value)} />
            </div>
            <Button className="w-full" onClick={move} disabled={!date || !time}>Déplacer</Button>
          </div>
        ) : (
          <div className="grid grid-cols-[1fr_auto] gap-2">
            <Button variant="secondary" onClick={() => {
              setDate(dayKey(appt.scheduled_at)); setTime(fmtTime(appt.scheduled_at)); setMoving(true)
            }}>Déplacer</Button>
            <Button variant="ghost" size="icon" onClick={remove} aria-label="Supprimer"><Trash2 /></Button>
          </div>
        )}
      </div>
    </Sheet>
  )
}
