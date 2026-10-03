import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const isConfigured = Boolean(url && anonKey)

// The session is kept in localStorage and refreshed automatically,
// so the team stays logged in on their phones.
export const supabase = isConfigured
  ? createClient(url, anonKey, { auth: { persistSession: true, autoRefreshToken: true } })
  : null
