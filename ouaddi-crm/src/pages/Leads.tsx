import { useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Plus, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input, Select } from '@/components/ui/input'
import { PageTitle } from '@/components/Layout'
import { CityTabs } from '@/components/CityTabs'
import { CityBadge, RelanceBadge, StageBadge } from '@/components/Badges'
import { WhatsAppButton } from '@/components/WhatsAppButton'
import { useQuickAdd } from '@/components/QuickAdd'
import { useAuth } from '@/lib/auth'
import { useCity, matchCity } from '@/lib/city'
import { useLive } from '@/lib/live'
import { fetchLeads, needsFollowUp } from '@/lib/queries'
import { fmtDay, fmtRelative } from '@/lib/dates'
import { displayPhone } from '@/lib/phone'
import { formatDH, SERVICE_LABEL, SOURCE_LABEL, STAGE_LABEL, STAGES } from '@/lib/labels'
import type { LeadSource } from '@/lib/types'
import { cn } from '@/lib/utils'

export default function Leads() {
  const navigate = useNavigate()
  const { addLead } = useQuickAdd()
  const { city } = useCity()
  const { profiles } = useAuth()
  const [params, setParams] = useSearchParams()
  const [q, setQ] = useState('')
  const stage = params.get('stage') ?? ''
  const source = params.get('source') ?? ''
  const assigned = params.get('assigned') ?? ''
  const relance = params.get('relance') === '1'
  const setParam = (k: string, v: string) => {
    const p = new URLSearchParams(params)
    if (v) p.set(k, v); else p.delete(k)
    setParams(p, { replace: true })
  }

  const { data, error } = useLive(fetchLeads, [], ['leads', 'activities', 'appointments'])
  const names = useMemo(() => new Map(profiles.map(p => [p.id, p.full_name])), [profiles])

  const rows = useMemo(() => {
    const needle = q.trim().toLowerCase()
    const digits = needle.replace(/\D/g, '')
    return (data ?? []).filter(l =>
      matchCity(city, l.city) &&
      (!stage || l.stage === stage) &&
      (!source || l.source === source) &&
      (!assigned || (assigned === 'none' ? !l.assigned_to : l.assigned_to === assigned)) &&
      (!relance || needsFollowUp(l)) &&
      (!needle || l.full_name.toLowerCase().includes(needle) || (digits.length >= 3 && l.phone.includes(digits)) ||
        (l.address ?? '').toLowerCase().includes(needle)))
  }, [data, city, stage, source, assigned, relance, q])

  return (
    <>
      <PageTitle title="Leads">
        <div className="flex items-center gap-2">
          <CityTabs />
          <Button className="hidden lg:inline-flex" onClick={addLead}><Plus />Ajouter</Button>
        </div>
      </PageTitle>

      <div className="mb-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-[1fr_repeat(3,11rem)_auto]">
        <div className="relative sm:col-span-2 lg:col-span-1">
          <Search className="pointer-events-none absolute top-3.5 left-3 size-4 text-muted-foreground" />
          <Input className="pl-9" value={q} onChange={e => setQ(e.target.value)} placeholder="Nom, téléphone, quartier…" />
        </div>
        <Select value={stage} onChange={e => setParam('stage', e.target.value)} aria-label="Étape">
          <option value="">Toutes les étapes</option>
          {STAGES.map(s => <option key={s} value={s}>{STAGE_LABEL[s]}</option>)}
        </Select>
        <Select value={source} onChange={e => setParam('source', e.target.value)} aria-label="Source">
          <option value="">Toutes les sources</option>
          {(Object.keys(SOURCE_LABEL) as LeadSource[]).map(s => <option key={s} value={s}>{SOURCE_LABEL[s]}</option>)}
        </Select>
        <Select value={assigned} onChange={e => setParam('assigned', e.target.value)} aria-label="Assigné à">
          <option value="">Toute l'équipe</option>
          <option value="none">Non assigné</option>
          {profiles.map(p => <option key={p.id} value={p.id}>{p.full_name}</option>)}
        </Select>
        <Button variant={relance ? 'default' : 'outline'} onClick={() => setParam('relance', relance ? '' : '1')}>À relancer</Button>
      </div>

      {error && <p className="mb-3 rounded-lg bg-red-50 p-3 text-sm text-red-800">{error}</p>}
      <p className="mb-2 text-sm text-muted-foreground">{rows.length} lead{rows.length > 1 ? 's' : ''}</p>

      {/* Phone: cards */}
      <div className="space-y-2 lg:hidden">
        {rows.map(l => (
          <div key={l.id} onClick={() => navigate(`/leads/${l.id}`)} className="flex items-center gap-3 rounded-xl border bg-card p-3 active:bg-secondary">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="truncate font-medium">{l.full_name}</span>
                <CityBadge city={l.city} />
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                <StageBadge stage={l.stage} />
                {needsFollowUp(l) && <RelanceBadge />}
                {l.next_appt_at && <span>RDV {fmtRelative(l.next_appt_at)}</span>}
              </div>
            </div>
            <WhatsAppButton compact leadId={l.id} phone={l.phone} fullName={l.full_name} />
          </div>
        ))}
      </div>

      {/* Desktop: table */}
      <div className="hidden overflow-hidden rounded-xl border bg-card lg:block">
        <table className="w-full text-sm">
          <thead className="bg-secondary/60 text-left text-xs text-muted-foreground">
            <tr>
              <th className="px-3 py-2.5 font-medium">Client</th>
              <th className="px-3 py-2.5 font-medium">Étape</th>
              <th className="px-3 py-2.5 font-medium">Service</th>
              <th className="px-3 py-2.5 font-medium">Source</th>
              <th className="px-3 py-2.5 font-medium">Prochain RDV</th>
              <th className="px-3 py-2.5 text-right font-medium">Valeur</th>
              <th className="px-3 py-2.5 font-medium">Assigné</th>
              <th className="px-3 py-2.5" />
            </tr>
          </thead>
          <tbody className="divide-y">
            {rows.map(l => (
              <tr key={l.id} onClick={() => navigate(`/leads/${l.id}`)} className="cursor-pointer hover:bg-secondary/40">
                <td className="px-3 py-2.5">
                  <div className="flex items-center gap-2">
                    <Link to={`/leads/${l.id}`} className="font-medium" onClick={e => e.stopPropagation()}>{l.full_name}</Link>
                    <CityBadge city={l.city} />
                    {needsFollowUp(l) && <RelanceBadge />}
                  </div>
                  <div className="text-xs text-muted-foreground">{displayPhone(l.phone)} · ajouté {fmtDay(l.created_at)}</div>
                </td>
                <td className="px-3 py-2.5"><StageBadge stage={l.stage} /></td>
                <td className="px-3 py-2.5">{SERVICE_LABEL[l.service]}</td>
                <td className="px-3 py-2.5">
                  {SOURCE_LABEL[l.source]}
                  {l.source_detail && <div className="max-w-40 truncate text-xs text-muted-foreground">{l.source_detail}</div>}
                </td>
                <td className={cn('px-3 py-2.5', !l.next_appt_at && 'text-muted-foreground')}>{l.next_appt_at ? fmtRelative(l.next_appt_at) : '—'}</td>
                <td className="px-3 py-2.5 text-right tabular-nums">{formatDH(l.estimated_value)}</td>
                <td className="px-3 py-2.5 text-muted-foreground">{l.assigned_to ? names.get(l.assigned_to) : '—'}</td>
                <td className="px-3 py-2.5 text-right"><WhatsAppButton compact leadId={l.id} phone={l.phone} fullName={l.full_name} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {!rows.length && data && <p className="py-8 text-center text-sm text-muted-foreground">Aucun lead ne correspond.</p>}
    </>
  )
}
