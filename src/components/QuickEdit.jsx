import { useEffect, useState } from 'react'
import { useLeads } from '../lib/leads'
import { STATUTS } from '../lib/constants'
import { StatusDot } from './StatusBadge'
import { t, tv } from '../lib/i18n'
import { toISODate } from '../lib/format'

// Small controls to edit a lead straight from the list (no need to open the lead page).
// Every change is saved right away and pushed to the whole team by Realtime.

function useSave(lead) {
  const { updateLead, notify } = useLeads()
  return async (changes) => {
    try {
      await updateLead(lead.id, changes)
    } catch (e) {
      notify(t('error', { x: e.message }))
    }
  }
}

// Status dropdown that looks like the status badge (coloured dot + label).
export function StatusSelect({ lead }) {
  const save = useSave(lead)
  return (
    <div className="relative inline-flex w-full max-w-[14rem] items-center">
      <StatusDot statut={lead.statut} className="pointer-events-none absolute start-2.5" />
      <select
        value={lead.statut}
        onChange={(e) => save({ statut: e.target.value })}
        aria-label={t('leads.status')}
        className="h-8 w-full cursor-pointer appearance-none rounded-md border border-line bg-white ps-6 pe-7 text-[13px] font-medium text-ink outline-none hover:bg-sand/50 focus:border-gold focus:ring-3 focus:ring-gold/15"
      >
        {STATUTS.map((s) => (
          <option key={s} value={s}>
            {tv(s)}
          </option>
        ))}
      </select>
      <svg viewBox="0 0 10 6" className="pointer-events-none absolute end-2.5 h-1.5 w-2.5 text-muted" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M1 1l4 4 4-4" />
      </svg>
    </div>
  )
}

// Note shown beside the lead; click it, type the result of the call, it saves when you leave the field.
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

  if (!editing) {
    return (
      <button
        type="button"
        onClick={() => setEditing(true)}
        title={value || t('note.add')}
        className="block min-h-8 w-full rounded-md border border-transparent px-2.5 py-1.5 text-start text-[13px] leading-snug hover:border-line hover:bg-white"
      >
        {value ? <span className="line-clamp-2 whitespace-pre-line text-ink">{value}</span> : <span className="text-muted/70">{t('note.add')}</span>}
      </button>
    )
  }

  return (
    <textarea
      autoFocus
      rows={3}
      value={draft}
      placeholder={t('note.placeholder')}
      onFocus={(e) => e.currentTarget.setSelectionRange(draft.length, draft.length)}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault()
          e.currentTarget.blur()
        } else if (e.key === 'Escape') {
          setDraft(value)
          setEditing(false)
        }
      }}
      className="block w-full resize-none rounded-md border border-gold bg-white px-2.5 py-1.5 text-[13px] leading-snug outline-none ring-3 ring-gold/15 placeholder:text-muted/70"
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
        aria-label={t('lead.nextFollowUp')}
        onChange={(e) => save({ prochaine_relance: e.target.value || null })}
        className={`h-8 w-[8.75rem] rounded-md border px-2 text-[13px] outline-none focus:border-gold ${
          late ? 'border-red-200 bg-red-50 text-red-700' : value ? 'border-line bg-white' : 'border-line bg-white text-muted'
        }`}
      />
      {value ? (
        <button
          type="button"
          title={t('relance.remove')}
          onClick={() => save({ prochaine_relance: null })}
          className="rounded-md px-1.5 text-muted hover:text-red-600"
        >
          ×
        </button>
      ) : (
        <button
          type="button"
          title={t('relance.tomorrowTitle')}
          onClick={() => save({ prochaine_relance: tomorrow })}
          className="h-8 whitespace-nowrap rounded-md px-2 text-[13px] font-medium text-gold hover:bg-sand"
        >
          {t('relance.tomorrow')}
        </button>
      )}
    </div>
  )
}

