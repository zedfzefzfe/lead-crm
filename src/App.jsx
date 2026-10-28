import { useEffect, useState } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { isConfigured, supabase } from './lib/supabase'
import { LeadsProvider } from './lib/leads'
import Layout from './components/Layout'
import { t } from './lib/i18n'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Leads from './pages/Leads'
import LeadDetail from './pages/LeadDetail'
import Relances from './pages/Relances'
import AddLead from './pages/AddLead'
import Admin from './pages/Admin'

export default function App() {
  const [session, setSession] = useState(undefined)

  useEffect(() => {
    if (!isConfigured) return
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data } = supabase.auth.onAuthStateChange((_event, s) => setSession(s))
    return () => data.subscription.unsubscribe()
  }, [])

  if (!isConfigured) {
    return (
      <div className="min-h-screen grid place-items-center p-6 text-center">
        <p className="max-w-sm text-muted">{t('configMissing')}</p>
      </div>
    )
  }

  if (session === undefined) return null // checking the saved session
  if (!session) return <Login />

  return (
    <LeadsProvider>
      <Layout user={session.user}>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/leads" element={<Leads />} />
          <Route path="/leads/:id" element={<LeadDetail />} />
          <Route path="/relances" element={<Relances />} />
          <Route path="/ajouter" element={<AddLead />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </LeadsProvider>
  )
}
