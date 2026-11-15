import { createContext, useContext, useState, type ReactNode } from 'react'
import type { City } from './types'

// Casa / Rabat filter shared by dashboard, pipeline and calendar (remembered on this phone).
export type CityFilter = 'all' | Extract<City, 'casablanca' | 'rabat'>
const KEY = 'ouaddi.city'

const CityContext = createContext<{ city: CityFilter; setCity: (c: CityFilter) => void } | null>(null)

function load(): CityFilter {
  try {
    const v = localStorage.getItem(KEY)
    return v === 'casablanca' || v === 'rabat' ? v : 'all'
  } catch {
    return 'all'
  }
}

export function CityProvider({ children }: { children: ReactNode }) {
  const [city, setCityState] = useState<CityFilter>(load)
  const setCity = (c: CityFilter) => {
    setCityState(c)
    try { localStorage.setItem(KEY, c) } catch { /* private mode */ }
  }
  return <CityContext.Provider value={{ city, setCity }}>{children}</CityContext.Provider>
}

export function useCity() {
  const ctx = useContext(CityContext)
  if (!ctx) throw new Error('useCity outside CityProvider')
  return ctx
}

/** True when a row's city passes the filter ("autre" only shows under "Tous"). */
export const matchCity = (filter: CityFilter, city: City) => filter === 'all' || filter === city
