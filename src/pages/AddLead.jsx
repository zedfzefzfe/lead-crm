import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import PageHeader from '../components/PageHeader'
import { t, tv } from '../lib/i18n'
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
        // only filled extra fields are sent (works even before a new column exists in the database)
        ...Object.fromEntries(EXTRA_FIELDS.filter((x) => form[x.key]).map((x) => [x.key, form[x.key]])),
      })
      navigate(`/leads/${lead.id}`)
    } catch (err) {
      setError(err.message)
      setBusy(false)
    }
  }

  return (
    <div className="max-w-2xl">
      <PageHeader title={t('nav.add')} subtitle={t('add.subtitle')} />

      <form onSubmit={submit} className="card grid gap-4 p-5 sm:grid-cols-2 sm:p-6">
        <div className="sm:col-span-2">
          <label className="label">{t('add.name')}</label>
          <input required className="input" value={form.nom} onChange={set('nom')} />
        </div>
        <div>
          <label className="label">{t('add.phone')}</label>
          <input required type="tel" inputMode="tel" className="input" value={form.telephone} onChange={set('telephone')} placeholder="06…" />
          {duplicate && (
            <p className="mt-1 text-xs text-orange-700">
              {t('add.duplicate', { x: duplicate.nom, y: tv(duplicate.statut) })}
            </p>
          )}
        </div>
        <div>
          <label className="label">{t('add.city')}</label>
          <input className="input" value={form.ville} onChange={set('ville')} />
        </div>
        <div className="sm:col-span-2">
          <label className="label">{tv(ITEM.label)}</label>
          <input className="input" list="items" value={form[ITEM.key]} onChange={set(ITEM.key)} />
          <datalist id="items">{items.map((a) => <option key={a} value={a} />)}</datalist>
        </div>
        {EXTRA_FIELDS.map((x) => (
          <div key={x.key} className="sm:col-span-2">
            <label className="label">{tv(x.label)}</label>
            <select className="input" value={form[x.key]} onChange={set(x.key)}>
              <option value="">—</option>
              {x.options.map((o) => <option key={o} value={o}>{tv(o)}</option>)}
            </select>
          </div>
        ))}
        <div>
          <label className="label">{t('add.source')}</label>
          <select className="input" value={form.source} onChange={set('source')}>
            {SOURCES.map((s) => <option key={s} value={s}>{tv(SOURCE_LABELS[s])}</option>)}
          </select>
        </div>
        <div>
          <label className="label">{t('add.status')}</label>
          <select className="input" value={form.statut} onChange={set('statut')}>
            {STATUTS.map((s) => <option key={s} value={s}>{tv(s)}</option>)}
          </select>
        </div>
        <div className="sm:col-span-2">
          <label className="label">{t('add.notes')}</label>
          <textarea rows="3" className="input h-auto py-2" value={form.notes} onChange={set('notes')} />
        </div>
        {error && <p className="sm:col-span-2 text-[13px] text-red-600">{error}</p>}
        <div className="flex justify-end gap-2 border-t border-line pt-4 sm:col-span-2">
          <button type="button" className="btn-ghost" onClick={() => navigate(-1)}>{t('cancel')}</button>
          <button className="btn-gold" disabled={busy}>{busy ? t('add.busy') : t('add.submit')}</button>
        </div>
      </form>
    </div>
  )
}
