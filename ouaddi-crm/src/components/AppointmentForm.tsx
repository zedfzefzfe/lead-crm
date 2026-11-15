import { useEffect, useState } from 'react'
import { Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input, Label, Select, Textarea } from '@/components/ui/input'
import { Chips } from '@/components/Chips'
import { CityBadge } from '@/components/Badges'
import { APPT_TYPE_LABEL, APPT_TYPES, CITY_LABEL } from '@/lib/labels'
import { todayKey, toInstant } from '@/lib/dates'
import { displayPhone } from '@/lib/phone'
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
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<LeadLite[]>([])
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

  useEffect(() => {
    if (lead) return
    const q = query.trim()
    const t = setTimeout(async () => {
      let req = supabase.from('leads').select('id, full_name, phone, city, address, stage').order('updated_at', { ascending: false }).limit(8)
      if (q) {
        const safe = q.replace(/[,()%]/g, ' ')
        req = req.or(`full_name.ilike.%${safe}%,phone.ilike.%${safe.replace(/\D/g, '') || safe}%`)
      }
      const { data } = await req
      setResults((data as LeadLite[]) ?? [])
    }, 200)
    return () => clearTimeout(t)
  }, [query, lead])

  async function save() {
    if (!lead) return toast('Choisis le client', true)
    setSaving(true)
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
      <div>
        <Label>Client</Label>
        {lead ? (
          <div className="flex items-center justify-between gap-2 rounded-lg border bg-secondary/50 p-3">
            <div className="min-w-0">
              <div className="truncate font-medium">{lead.full_name}</div>
              <div className="text-xs text-muted-foreground">{displayPhone(lead.phone)}</div>
            </div>
            {!defaults.leadId && <Button type="button" variant="ghost" size="sm" onClick={() => setLead(null)}>Changer</Button>}
          </div>
        ) : (
          <div>
            <div className="relative">
              <Search className="pointer-events-none absolute top-3.5 left-3 size-4 text-muted-foreground" />
              <Input autoFocus className="pl-9" value={query} onChange={e => setQuery(e.target.value)} placeholder="Nom ou téléphone" />
            </div>
            <ul className="mt-2 max-h-56 divide-y overflow-y-auto rounded-lg border">
              {results.map(r => (
                <li key={r.id}>
                  <button type="button" onClick={() => pick(r)} className="flex w-full items-center justify-between gap-2 px-3 py-3 text-left hover:bg-secondary">
                    <span className="truncate">{r.full_name}</span>
                    <CityBadge city={r.city} />
                  </button>
                </li>
              ))}
              {!results.length && <li className="px-3 py-3 text-sm text-muted-foreground">Aucun lead trouvé</li>}
            </ul>
          </div>
        )}
      </div>
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
