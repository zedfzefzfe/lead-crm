import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { supabase } from './supabase'
import { t } from './i18n'
import { CLIENT, ITEM } from './constants'

// Holds every lead in memory and keeps the list in sync with Supabase Realtime,
// so all pages update instantly for everyone who is logged in.

const LeadsContext = createContext(null)
const PAGE = 1000
const FB_FIELDS = ['fb_fbc', 'fb_fbp', 'fb_fbclid']

async function fetchAllLeads() {
  const rows = []
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await supabase
      .from('leads')
      .select('*')
      .order('created_at', { ascending: false })
      .range(from, from + PAGE - 1)
    if (error) throw error
    rows.push(...data)
    if (data.length < PAGE) return rows
  }
}

// Focus on some ateliers (CLIENT.focusAteliers): other leads are hidden, not deleted.
const plain = (s) => String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, ' ')
export const matchesAtelier = (lead, group) => group.words.every((w) => plain(lead[ITEM.key]).includes(w))
export const inFocus = (lead) => !CLIENT.focusAteliers || CLIENT.focusAteliers.some((g) => matchesAtelier(lead, g))
const SHOW_ALL_KEY = 'crm-show-all-ateliers'

export function LeadsProvider({ children }) {
  const [allLeads, setLeads] = useState([])
  const [showAll, setShowAllState] = useState(() => {
    try { return localStorage.getItem(SHOW_ALL_KEY) === '1' } catch { return false }
  })
  const setShowAll = useCallback((v) => {
    setShowAllState(v)
    try { localStorage.setItem(SHOW_ALL_KEY, v ? '1' : '0') } catch { /* private mode */ }
  }, [])
  const leads = useMemo(() => (showAll || !CLIENT.focusAteliers ? allLeads : allLeads.filter(inFocus)), [allLeads, showAll])
  const hiddenCount = allLeads.length - leads.length
  const showAllRef = useRef(showAll)
  showAllRef.current = showAll
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [toasts, setToasts] = useState([])
  const [isAdmin, setIsAdmin] = useState(false)

  // Is the logged-in user in the admins list? (false if supabase/admin.sql was not run)
  useEffect(() => {
    supabase.rpc('is_admin').then(({ data, error }) => setIsAdmin(!error && data === true))
  }, [])

  const notify = useCallback((text) => {
    const id = crypto.randomUUID()
    setToasts((t) => [...t, { id, text }])
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 5000)
  }, [])

  const reload = useCallback(async () => {
    try {
      setLeads(await fetchAllLeads())
      setError(null)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    reload()

    const channel = supabase
      .channel('leads-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'leads' }, (payload) => {
        if (payload.eventType === 'INSERT') {
          setLeads((list) =>
            list.some((l) => l.id === payload.new.id) ? list : [payload.new, ...list]
          )
          if (showAllRef.current || inFocus(payload.new)) notify(t('newLead', { x: payload.new.nom }))
        } else if (payload.eventType === 'UPDATE') {
          setLeads((list) => list.map((l) => (l.id === payload.new.id ? payload.new : l)))
        } else if (payload.eventType === 'DELETE') {
          setLeads((list) => list.filter((l) => l.id !== payload.old.id))
        }
      })
      .subscribe((status) => {
        // After a reconnect (phone back from sleep), reload to catch anything missed.
        if (status === 'SUBSCRIBED') reload()
      })

    return () => {
      supabase.removeChannel(channel)
    }
  }, [reload, notify])

  // Update a lead; the local list is patched right away and Realtime confirms it.
  const updateLead = useCallback(async (id, changes) => {
    const { data, error } = await supabase.from('leads').update(changes).eq('id', id).select().single()
    if (error) throw error
    setLeads((list) => list.map((l) => (l.id === id ? data : l)))
    return data
  }, [])

  // Admins only (checked by the database). Returns how many leads were really deleted.
  const deleteLeads = useCallback(async (ids) => {
    const { data, error } = await supabase.from('leads').delete().in('id', ids).select('id')
    if (error) throw error
    const gone = new Set(data.map((d) => d.id))
    setLeads((list) => list.filter((l) => !gone.has(l.id)))
    return gone.size
  }, [])

  // +1 unanswered call (the database turns the lead into Perdue at the last allowed call).
  const registerCallAttempt = useCallback(async (id) => {
    const { data, error } = await supabase.rpc('register_call_attempt', { p_id: id, p_max: CLIENT.relance?.maxAttempts || 6 })
    if (error) throw error
    const row = Array.isArray(data) ? data[0] : data
    if (row) setLeads((list) => list.map((l) => (l.id === id ? row : l)))
    return row
  }, [])

  // Any logged-in user, with the delete password (checked by the database, supabase/delete-password.sql).
  const deleteLeadsWithPassword = useCallback(async (ids, password) => {
    const { data, error } = await supabase.rpc('delete_leads_with_password', { p_password: password, p_ids: ids })
    if (error) {
      const err = new Error(error.message)
      if (/wrong_password/.test(error.message)) err.code = 'wrong_password'
      else if (error.code === 'PGRST202' || /delete_leads_with_password/.test(error.message)) err.code = 'not_configured'
      throw err
    }
    setLeads((list) => list.filter((l) => !ids.includes(l.id)))
    return data
  }, [])

  const addLead = useCallback(async (lead) => {
    // Meta identifiers are stored when present; when absent they are not sent (the column stays null).
    const row = { ...lead }
    for (const k of FB_FIELDS) {
      if (row[k] === undefined || row[k] === null || String(row[k]).trim() === '') delete row[k]
      else row[k] = String(row[k]).trim()
    }
    const { data, error } = await supabase.from('leads').insert(row).select().single()
    if (error) throw error
    setLeads((list) => (list.some((l) => l.id === data.id) ? list : [data, ...list]))
    return data
  }, [])

  return (
    <LeadsContext.Provider value={{ leads, loading, error, updateLead, addLead, deleteLeads, deleteLeadsWithPassword, registerCallAttempt, isAdmin, showAll, setShowAll, hiddenCount, toasts, notify }}>
      {children}
    </LeadsContext.Provider>
  )
}

export function useLeads() {
  return useContext(LeadsContext)
}
