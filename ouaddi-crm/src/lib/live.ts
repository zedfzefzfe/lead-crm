import { useCallback, useEffect, useRef, useState } from 'react'
import { supabase } from './supabase'

let channelSeq = 0

/**
 * Loads data and reloads it when the given tables change (Supabase Realtime),
 * so the calendar / pipeline stay up to date on every phone of the team.
 */
export function useLive<T>(load: () => Promise<T>, deps: unknown[], tables: string[]) {
  const [data, setData] = useState<T | undefined>(undefined)
  const [error, setError] = useState<string | null>(null)
  const loadRef = useRef(load)
  loadRef.current = load

  const reload = useCallback(async () => {
    try {
      setData(await loadRef.current())
      setError(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    }
  }, [])

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { reload() }, deps)

  const tablesKey = tables.join(',')
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined
    const ch = supabase.channel(`live-${tablesKey}-${++channelSeq}`)
    for (const table of tablesKey.split(',')) {
      ch.on('postgres_changes', { event: '*', schema: 'public', table }, () => {
        clearTimeout(timer)
        timer = setTimeout(reload, 300)
      })
    }
    ch.subscribe()
    return () => { clearTimeout(timer); supabase.removeChannel(ch) }
  }, [tablesKey, reload])

  return { data, error, reload, loading: data === undefined && !error }
}

/** Throws the Supabase error so useLive can show it. */
export function must<T>(res: { data: T | null; error: { message: string } | null }): T {
  if (res.error) throw new Error(res.error.message)
  return res.data as T
}
