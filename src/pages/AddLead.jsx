import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import PageHeader from '../components/PageHeader'
import { useLeads } from '../lib/leads'
import { EXTRA_FIELDS, ITEM, SOURCES, SOURCE_LABELS, STATUTS } from '../lib/constants'

// Manual entry for leads coming from WhatsApp / Instagram DMs.
export default function AddLead() {
  const { leads, addLead } = useLeads()
  const navigate = useNavigate()
  const [form, setForm] = useState({
    nom: '',
    telephone: '',
    ville: '',
    [ITEM.key]: ITEM.default,
    ...Object.fromEntries(EXTRA_FIELDS.map((x) => [x.key, ''])),
    source: 'whatsapp',
    statut: 'Nouveau',
    notes: '',
  })
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const items = [...new Set([ITEM.default, ...ITEM.options, ...leads.map((l) => l[ITEM.key])].filter(Boolean))]
  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value })

  // Warn if this phone number is already in the CRM (avoid duplicates).
  const digits = form.telephone.replace(/\D/g, '').slice(-9)
  const duplicate = digits.length === 9 && leads.find((l) => (l.telephone || '').replace(/\D/g, '').endsWith(digits))

  const submit = async (e) => {
    e.preventDefault()
    setBusy(true)
    setError('')
    try {
      const lead = await addLead({
        ...form,
        nom: form.nom.trim(),
        telephone: form.telephone.trim(),
        ville: form.ville.trim(),
        [ITEM.key]: form[ITEM.key].trim(),
        ...Object.fromEntries(EXTRA_FIELDS.map((x) => [x.key, form[x.key] || null])),
      })
      navigate(`/leads/${lead.id}`)
    } catch (err) {
      setError(err.message)
      setBusy(false)
    }
  }

  return (
    <div className="max-w-2xl">
      <PageHeader title="Ajouter un lead" subtitle="Pour les demandes reçues sur WhatsApp, Instagram ou par téléphone." />

      <form onSubmit={submit} className="card grid gap-4 p-5 sm:grid-cols-2 sm:p-6">
        <div className="sm:col-span-2">
          <label className="label">Nom *</label>
          <input required className="input" value={form.nom} onChange={set('nom')} />
        </div>
        <div>
          <label className="label">Téléphone *</label>
          <input required type="tel" inputMode="tel" className="input" value={form.telephone} onChange={set('telephone')} placeholder="06…" />
          {duplicate && (
            <p className="mt-1 text-xs text-orange-700">
              Ce numéro existe déjà : {duplicate.nom} ({duplicate.statut})
            </p>
          )}
        </div>
        <div>
          <label className="label">Ville</label>
          <input className="input" value={form.ville} onChange={set('ville')} />
        </div>
        <div className="sm:col-span-2">
          <label className="label">{ITEM.label}</label>
          <input className="input" list="items" value={form[ITEM.key]} onChange={set(ITEM.key)} />
          <datalist id="items">{items.map((a) => <option key={a} value={a} />)}</datalist>
        </div>
        {EXTRA_FIELDS.map((x) => (
          <div key={x.key} className="sm:col-span-2">
            <label className="label">{x.label}</label>
            <select className="input" value={form[x.key]} onChange={set(x.key)}>
              <option value="">—</option>
              {x.options.map((o) => <option key={o}>{o}</option>)}
            </select>
          </div>
        ))}
        <div>
          <label className="label">Source</label>
          <select className="input" value={form.source} onChange={set('source')}>
            {SOURCES.map((s) => <option key={s} value={s}>{SOURCE_LABELS[s]}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Statut</label>
          <select className="input" value={form.statut} onChange={set('statut')}>
            {STATUTS.map((s) => <option key={s}>{s}</option>)}
          </select>
        </div>
        <div className="sm:col-span-2">
          <label className="label">Notes</label>
          <textarea rows="3" className="input h-auto py-2" value={form.notes} onChange={set('notes')} />
        </div>
        {error && <p className="sm:col-span-2 text-[13px] text-red-600">{error}</p>}
        <div className="flex justify-end gap-2 border-t border-line pt-4 sm:col-span-2">
          <button type="button" className="btn-ghost" onClick={() => navigate(-1)}>Annuler</button>
          <button className="btn-gold" disabled={busy}>{busy ? 'Enregistrement…' : 'Enregistrer le lead'}</button>
        </div>
      </form>
    </div>
  )
}
