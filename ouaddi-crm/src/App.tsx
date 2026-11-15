import { Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider, useAuth } from '@/lib/auth'
import { CityProvider } from '@/lib/city'
import { ToastProvider } from '@/lib/toast'
import { isConfigured } from '@/lib/supabase'
import { Layout } from '@/components/Layout'
import { QuickAddProvider } from '@/components/QuickAdd'
import Login from '@/pages/Login'
import Dashboard from '@/pages/Dashboard'
import Pipeline from '@/pages/Pipeline'
import CalendarPage from '@/pages/Calendar'
import Leads from '@/pages/Leads'
import LeadDetail from '@/pages/LeadDetail'
import Team from '@/pages/Team'

function Shell() {
  const { session } = useAuth()
  if (session === undefined) return null // checking the saved session
  if (!session) return <Login />
  return (
    <CityProvider>
      <QuickAddProvider>
        <Layout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/rdv" element={<CalendarPage />} />
            <Route path="/pipeline" element={<Pipeline />} />
            <Route path="/leads" element={<Leads />} />
            <Route path="/leads/:id" element={<LeadDetail />} />
            <Route path="/equipe" element={<Team />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Layout>
      </QuickAddProvider>
    </CityProvider>
  )
}

export default function App() {
  if (!isConfigured) {
    return (
      <div className="grid min-h-dvh place-items-center p-6 text-center text-muted-foreground">
        Configuration manquante : ajoute VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY (fichier .env ou Vercel).
      </div>
    )
  }
  return (
    <ToastProvider>
      <AuthProvider>
        <Shell />
      </AuthProvider>
    </ToastProvider>
  )
}
