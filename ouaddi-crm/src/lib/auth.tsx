import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from './supabase'
import type { Profile } from './types'

interface AuthState {
  session: Session | null | undefined // undefined = still checking the saved session
  profile: Profile | null
  profiles: Profile[] // whole team (for "assigné à")
  isAdmin: boolean
  reloadProfiles: () => Promise<void>
}

const AuthContext = createContext<AuthState | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null | undefined>(undefined)
  const [profiles, setProfiles] = useState<Profile[]>([])

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data } = supabase.auth.onAuthStateChange((_e, s) => setSession(s))
    return () => data.subscription.unsubscribe()
  }, [])

  const reloadProfiles = useCallback(async () => {
    const { data } = await supabase.from('profiles').select('*').order('full_name')
    setProfiles((data as Profile[]) ?? [])
  }, [])

  useEffect(() => {
    if (session) reloadProfiles()
    else setProfiles([])
  }, [session, reloadProfiles])

  const profile = profiles.find(p => p.id === session?.user.id) ?? null
  return (
    <AuthContext.Provider value={{ session, profile, profiles, isAdmin: profile?.role === 'admin', reloadProfiles }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth outside AuthProvider')
  return ctx
}
