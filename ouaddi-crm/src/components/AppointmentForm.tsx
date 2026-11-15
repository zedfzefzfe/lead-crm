import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input, Label, Select, Textarea } from '@/components/ui/input'
import { Chips } from '@/components/Chips'
import { APPT_TYPE_LABEL, APPT_TYPES, CITY_LABEL } from '@/lib/labels'
import { todayKey, toInstant } from '@/lib/dates'
import { displayPhone, isValidPhone, normalizePhone } from '@/lib/phone'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/auth'
import { useToast } from '@/lib/toast'
import type { ApptType, City, Lead } from '@/lib/types'

type LeadLite = Pick<Lead, 'id' | 'full_name' | 'phone' | 'city' | 'address' | 'stage'>
const CITIES: City[] = ['casablanca', 'rabat', 'autre']
const DURATIONS: Record<number, string> = { 30: '30 min', 60: '1 h', 90: '1 h 30', 120: '2 h', 180: '3 h' }

export interface AppointmentDefaults {
  leadId?: string
  date?: string // YYYY-MM-DD
  time?: string // HH:MM
  type?: ApptType
}

// Quick "add rendez-vous". From a lead page the lead is already chosen: type, date, time, save.
export function AppointmentForm({ defaults, onDone }: { defaults: AppointmentDefaults; onDone: () => void }) {
  const toast = useToast()
  const { session } = useAuth()
  const [lead, setLead] = useState<LeadLite | null>(null)
  const [name, setName] = useState('') // new client (when not opened from a lead page)
  const [phone, setPhone] = useState('')
  const [type, setType] = useState<ApptType>(defaults.type ?? 'mesures')
  const [date, setDate] = useState(defaults.date ?? todayKey())
  const [time, setTime] = useState(defaults.time ?? '10:00')
  const [duration, setDuration] = useState(60)
  const [city, setCity] = useState<City>('casablanca')
  const [address, setAddress] = useState('')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)

  function pick(l: LeadLite) {
    setLead(l)
    setCity(l.city)
    setAddress(l.address ?? '')
  }

  useEffect(() => {
    if (!defaults.leadId) return
    supabase.from('leads').select('id, full_name, phone, city, address, stage').eq('id', defaults.leadId).single()
      .then(({ data }) => data && pick(data as LeadLite))
  }, [defaults.leadId])

  // Typed client: reuse the lead with the same number, otherwise create it.
  async function resolveLead(): Promise<LeadLite | null> {
    if (lead) return lead
    const digits = normalizePhone(phone)
    if (!name.trim()) { toast('Nom du client manquant', true); return null }
    if (!isValidPhone(digits)) { toast('Numéro invalide (ex. 0661234567)', true); return null }
    const cols = 'id, full_name, phone, city, address, stage'
    const { data: found } = await supabase.from('leads').select(cols).eq('phone', digits).limit(1)
    if (found?.length) return found[0] as LeadLite
    const { data, error } = await supabase.from('leads')
      .insert({ full_name: name.trim(), phone: digits, city, address: address.trim() || null, stage: 'contacte' })
      .select(cols).single()
    if (error) { toast(error.message, true); return null }
    return data as LeadLite
  }

  async function save() {
    setSaving(true)
    const lead = await resolveLead()
    if (!lead) return setSaving(false)
    const { error } = await supabase.from('appointments').insert({
      lead_id: lead.id,
      type,
      scheduled_at: toInstant(date, time),
      duration_min: duration,
      city,
      address: address.trim() || null,
      notes: notes.trim(),
      assigned_to: session?.user.id ?? null,
    })
    if (!error) {
      // Keep the pipeline in step: a measuring RDV moves a fresh lead to "RDV mesures",
      // a pose RDV moves a won lead to "Pose planifiée".
      if (type === 'mesures' && ['nouveau', 'contacte'].includes(lead.stage)) {
        await supabase.from('leads').update({ stage: 'rdv_mesures' }).eq('id', lead.id)
      } else if (type === 'pose' && lead.stage === 'gagne') {
        await supabase.from('leads').update({ stage: 'pose_planifiee' }).eq('id', lead.id)
      }
      if (address.trim() && !lead.address) await supabase.from('leads').update({ address: address.trim() }).eq('id', lead.id)
    }
    setSaving(false)
    if (error) return toast(error.message, true)
    toast('Rendez-vous ajouté')
    onDone()
  }

  return (
    <form className="space-y-4" onSubmit={e => { e.preventDefault(); save() }}>
      {lead ? (
        <div>
          <Label>Client</Label>
          <div className="rounded-lg border bg-secondary/50 p-3">
            <div className="truncate font-medium">{lead.full_name}</div>
            <div className="text-xs text-muted-foreground">{displayPhone(lead.phone)}</div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <Label htmlFor="af-name">Nom du client</Label>
            <Input id="af-name" autoFocus autoComplete="off" value={name} onChange={e => setName(e.target.value)} placeholder="Salma Bennani" />
          </div>
          <div>
            <Label htmlFor="af-phone">Téléphone</Label>
            <Input id="af-phone" type="tel" inputMode="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="06 61 23 45 67" />
          </div>
        </div>
      )}
      <div>
        <Label>Type</Label>
        <Chips value={type} options={APPT_TYPES} onChange={setType} labels={APPT_TYPE_LABEL} />
      </div>
      <div className="grid grid-cols-[1fr_7rem] gap-3">
        <div>
          <Label htmlFor="af-date">Date</Label>
          <Input id="af-date" type="date" required value={date} onChange={e => setDate(e.target.value)} />
        </div>
        <div>
          <Label htmlFor="af-time">Heure</Label>
          <Input id="af-time" type="time" required step={900} value={time} onChange={e => setTime(e.target.value)} />
        </div>
      </div>
      <div className="grid grid-cols-[1fr_7rem] gap-3">
        <div>
          <Label>Ville</Label>
          <Chips size="sm" value={city} options={CITIES} onChange={setCity} labels={CITY_LABEL} />
        </div>
        <div>
          <Label htmlFor="af-dur">Durée</Label>
          <Select id="af-dur" value={duration} onChange={e => setDuration(Number(e.target.value))}>
            {Object.entries(DURATIONS).map(([m, label]) => <option key={m} value={m}>{label}</option>)}
          </Select>
        </div>
      </div>
      <div>
        <Label htmlFor="af-addr">Adresse</Label>
        <Input id="af-addr" value={address} onChange={e => setAddress(e.target.value)} placeholder="Quartier, rue, étage…" />
      </div>
      <div>
        <Label htmlFor="af-notes">Notes</Label>
        <Textarea id="af-notes" rows={2} value={notes} onChange={e => setNotes(e.target.value)} placeholder="Échantillons à apporter, code porte…" />
      </div>
      <Button type="submit" size="lg" className="w-full" disabled={saving}>Enregistrer le rendez-vous</Button>
    </form>
  )
}
