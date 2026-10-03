import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLeads } from '../lib/leads'
import { DEFAULT_ATELIER, SOURCES, SOURCE_LABELS, STATUTS } from '../lib/constants'

// Manual entry for leads coming from WhatsApp / Instagram DMs.
export default function AddLead() {
  const { leads, addLead } = useLeads()
  const navigate = useNavigate()
  const [form, setForm] = useState({
    nom: '',
    telephone: '',
    ville: '',
    atelier: DEFAULT_ATELIER,
    source: 'whatsapp',
    statut: 'Nouveau',
    notes: '',
  })
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const ateliers = [...new Set([DEFAULT_ATELIER, ...leads.map((l) => l.atelier).filter(Boolean)])]
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
        atelier: form.atelier.trim(),
      })
      navigate(`/leads/${lead.id}`)
    } catch (err) {
      setError(err.message)
      setBusy(false)
    }
  }

  return (
    <div className="max-w-xl">
      <h1 className="font-serif text-3xl md:text-4xl">Ajouter un lead</h1>
      <p className="text-sm text-muted mt-1">Pour les demandes reçues sur WhatsApp ou Instagram.</p>

      <form onSubmit={submit} className="card mt-5 p-5 grid gap-4 sm:grid-cols-2">
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
          <label className="label">Atelier</label>
          <input className="input" list="ateliers" value={form.atelier} onChange={set('atelier')} />
          <datalist id="ateliers">{ateliers.map((a) => <option key={a} value={a} />)}</datalist>
        </div>
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
          <textarea rows="3" className="input" value={form.notes} onChange={set('notes')} />
        </div>
        {error && <p className="sm:col-span-2 text-sm text-red-600">{error}</p>}
        <button className="btn-gold sm:col-span-2" disabled={busy}>{busy ? 'Enregistrement…' : 'Enregistrer le lead'}</button>
      </form>
    </div>
  )
}
