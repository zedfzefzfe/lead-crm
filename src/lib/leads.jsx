import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { supabase } from './supabase'
import { t } from './i18n'

// Holds every lead in memory and keeps the list in sync with Supabase Realtime,
// so all pages update instantly for everyone who is logged in.

const LeadsContext = createContext(null)
const PAGE = 1000

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

export function LeadsProvider({ children }) {
  const [leads, setLeads] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [toasts, setToasts] = useState([])

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
          notify(t('newLead', { x: payload.new.nom }))
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

  const addLead = useCallback(async (lead) => {
    const { data, error } = await supabase.from('leads').insert(lead).select().single()
    if (error) throw error
    setLeads((list) => (list.some((l) => l.id === data.id) ? list : [data, ...list]))
    return data
  }, [])

  return (
    <LeadsContext.Provider value={{ leads, loading, error, updateLead, addLead, toasts, notify }}>
      {children}
    </LeadsContext.Provider>
  )
}

export function useLeads() {
  return useContext(LeadsContext)
}
