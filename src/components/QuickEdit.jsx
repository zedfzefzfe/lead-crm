import { useEffect, useState } from 'react'
import { useLeads } from '../lib/leads'
import { STATUTS, STATUT_STYLES } from '../lib/constants'
import { toISODate } from '../lib/format'

// Small controls to edit a lead straight from the list (no need to open the lead page).
// Every change is saved right away and pushed to the whole team by Realtime.

function useSave(lead) {
  const { updateLead, notify } = useLeads()
  return async (changes) => {
    try {
      await updateLead(lead.id, changes)
    } catch (e) {
      notify(`Erreur : ${e.message}`)
    }
  }
}

// Status dropdown that looks like the coloured badge.
export function StatusSelect({ lead }) {
  const save = useSave(lead)
  return (
    <select
      value={lead.statut}
      onChange={(e) => save({ statut: e.target.value })}
      aria-label="Statut"
      className={`cursor-pointer rounded-full py-1 pl-2.5 pr-6 text-xs font-medium ring-1 ring-inset outline-none appearance-none bg-no-repeat bg-[length:10px] bg-[right_8px_center] bg-[url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 10 6'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%23666' fill='none' stroke-width='1.5'/%3E%3C/svg%3E")] ${
        STATUT_STYLES[lead.statut] || 'bg-stone-100 text-stone-700 ring-stone-200'
      }`}
    >
      {STATUTS.map((s) => (
        <option key={s} value={s} className="bg-white text-ink">
          {s}
        </option>
      ))}
    </select>
  )
}

// Note shown beside the lead; tap it, type the result of the call, it saves when you leave the field.
export function NoteEditor({ lead }) {
  const save = useSave(lead)
  const value = lead.notes || ''
  const [draft, setDraft] = useState(value)
  const [editing, setEditing] = useState(false)

  // Follow changes made by teammates, unless this person is typing.
  useEffect(() => {
    if (!editing) setDraft(value)
  }, [value, editing])

  const commit = () => {
    setEditing(false)
    if (draft.trim() !== value.trim()) save({ notes: draft.trim() })
  }

  return (
    <textarea
      rows={editing ? 3 : draft ? 2 : 1}
      value={draft}
      placeholder="Ajouter une note…"
      onFocus={() => setEditing(true)}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault()
          e.currentTarget.blur()
        } else if (e.key === 'Escape') {
          setDraft(value)
          setEditing(false)
          e.currentTarget.blur()
        }
      }}
      className={`w-full resize-none rounded-lg border px-2 py-1.5 text-sm leading-snug outline-none transition ${
        editing
          ? 'border-gold bg-white ring-2 ring-gold/20'
          : 'border-transparent bg-sand/40 hover:border-line overflow-hidden'
      }`}
    />
  )
}

// Follow-up date. Any date up to today puts the lead in "À relancer aujourd'hui".
export function RelanceInput({ lead }) {
  const save = useSave(lead)
  const today = toISODate(new Date())
  const tomorrow = toISODate(new Date(Date.now() + 864e5))
  const value = lead.prochaine_relance || ''
  const late = value && value < today

  return (
    <div className="flex items-center gap-1">
      <input
        type="date"
        value={value}
        aria-label="Prochaine relance"
        onChange={(e) => save({ prochaine_relance: e.target.value || null })}
        className={`min-w-0 rounded-lg border px-2 py-1 text-xs outline-none focus:border-gold ${
          late ? 'border-red-200 bg-red-50 text-red-700' : value ? 'border-line bg-white' : 'border-line bg-white text-muted'
        }`}
      />
      {value ? (
        <button
          type="button"
          title="Retirer la relance"
          onClick={() => save({ prochaine_relance: null })}
          className="rounded-md px-1.5 text-muted hover:text-red-600"
        >
          ×
        </button>
      ) : (
        <button
          type="button"
          title="Relancer demain"
          onClick={() => save({ prochaine_relance: tomorrow })}
          className="whitespace-nowrap rounded-md px-1.5 py-1 text-xs text-gold-dark hover:bg-sand"
        >
          Demain
        </button>
      )}
    </div>
  )
}
