import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input, Label, Select } from '@/components/ui/input'
import { Chips } from '@/components/Chips'
import { CITY_LABEL, SERVICE_LABEL, SOURCE_LABEL } from '@/lib/labels'
import { isValidPhone, normalizePhone } from '@/lib/phone'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/lib/toast'
import type { City, Lead, LeadSource, Service } from '@/lib/types'

const CITIES: City[] = ['casablanca', 'rabat', 'autre']
const SERVICES: Service[] = ['rideaux', 'fauteuils', 'les_deux']
const SOURCES = Object.keys(SOURCE_LABEL) as LeadSource[]

// Quick "add lead": name + phone + city are enough, everything else has a default.
export function LeadForm({ onDone }: { onDone: (lead: Lead, thenAppointment: boolean) => void }) {
  const toast = useToast()
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [city, setCity] = useState<City>('casablanca')
  const [service, setService] = useState<Service>('rideaux')
  const [source, setSource] = useState<LeadSource>('meta_ads')
  const [sourceDetail, setSourceDetail] = useState('')
  const [saving, setSaving] = useState(false)
  const [duplicate, setDuplicate] = useState<Pick<Lead, 'id' | 'full_name'> | null>(null)

  const digits = normalizePhone(phone)

  async function save(thenAppointment: boolean) {
    if (!fullName.trim()) return toast('Nom manquant', true)
    if (!isValidPhone(digits)) return toast('Numéro invalide (ex. 0661234567)', true)
    setSaving(true)
    const { data: existing } = await supabase.from('leads').select('id, full_name').eq('phone', digits).limit(1)
    if (existing?.length && !duplicate) {
      setDuplicate(existing[0])
      setSaving(false)
      return
    }
    const { data, error } = await supabase
      .from('leads')
      .insert({ full_name: fullName.trim(), phone: digits, city, service, source, source_detail: sourceDetail.trim() || null })
      .select()
      .single()
    setSaving(false)
    if (error) return toast(error.message, true)
    toast('Lead ajouté')
    onDone(data as Lead, thenAppointment)
  }

  return (
    <form className="space-y-4" onSubmit={e => { e.preventDefault(); save(false) }}>
      <div>
        <Label htmlFor="lf-name">Nom</Label>
        <Input id="lf-name" autoFocus autoComplete="off" value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Salma Bennani" />
      </div>
      <div>
        <Label htmlFor="lf-phone">Téléphone</Label>
        <Input id="lf-phone" type="tel" inputMode="tel" value={phone}
          onChange={e => { setPhone(e.target.value); setDuplicate(null) }} placeholder="06 61 23 45 67" />
        {phone && <p className="mt-1 text-xs text-muted-foreground">WhatsApp : +{digits}</p>}
        {duplicate && (
          <p className="mt-2 rounded-lg bg-amber-50 p-2 text-sm text-amber-900">
            Ce numéro existe déjà : <Link className="font-semibold underline" to={`/leads/${duplicate.id}`}>{duplicate.full_name}</Link>.
            Appuie encore sur Enregistrer pour l'ajouter quand même.
          </p>
        )}
      </div>
      <div>
        <Label>Ville</Label>
        <Chips value={city} options={CITIES} onChange={setCity} labels={CITY_LABEL} />
      </div>
      <div>
        <Label>Service</Label>
        <Chips value={service} options={SERVICES} onChange={setService} labels={SERVICE_LABEL} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="lf-source">Source</Label>
          <Select id="lf-source" value={source} onChange={e => setSource(e.target.value as LeadSource)}>
            {SOURCES.map(s => <option key={s} value={s}>{SOURCE_LABEL[s]}</option>)}
          </Select>
        </div>
        <div>
          <Label htmlFor="lf-detail">Pub / campagne</Label>
          <Input id="lf-detail" value={sourceDetail} onChange={e => setSourceDetail(e.target.value)} placeholder="optionnel" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 pt-1">
        <Button type="submit" variant="outline" size="lg" disabled={saving}>Enregistrer</Button>
        <Button type="button" size="lg" disabled={saving} onClick={() => save(true)}>Enregistrer + RDV</Button>
      </div>
    </form>
  )
}
