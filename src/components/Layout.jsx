import { NavLink } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useLeads } from '../lib/leads'
import { useRelances } from '../pages/Relances'
import Toasts from './Toasts'

const NAV = [
  { to: '/', label: 'Tableau de bord', short: 'Accueil', icon: 'M3 12l9-8 9 8M5 10v10h5v-6h4v6h5V10' },
  { to: '/leads', label: 'Leads', short: 'Leads', icon: 'M16 19v-1a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v1M9 10a3 3 0 1 0 0-6 3 3 0 0 0 0 6M22 19v-1a4 4 0 0 0-3-3.9M16 4.1a3 3 0 0 1 0 5.8' },
  { to: '/relances', label: "À relancer aujourd'hui", short: 'Relances', icon: 'M12 8v4l3 2M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0' },
  { to: '/ajouter', label: 'Ajouter un lead', short: 'Ajouter', icon: 'M12 5v14M5 12h14' },
]

function Icon({ d }) {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d={d} />
    </svg>
  )
}

export default function Layout({ user, children }) {
  const { toasts } = useLeads()
  const relanceCount = useRelances().length

  const logout = () => supabase.auth.signOut()

  return (
    <div className="min-h-screen md:flex">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 border-r border-line bg-sand/40 px-5 py-8">
        <Brand />
        <nav className="mt-10 flex flex-col gap-1">
          {NAV.map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              end={n.to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition ${
                  isActive ? 'bg-white text-ink shadow-sm border border-line' : 'text-muted hover:text-ink'
                }`
              }
            >
              <Icon d={n.icon} />
              <span className="flex-1">{n.label}</span>
              {n.to === '/relances' && relanceCount > 0 && <Count n={relanceCount} />}
            </NavLink>
          ))}
        </nav>
        <div className="mt-auto text-xs text-muted">
          <p className="truncate">{user.email}</p>
          <button onClick={logout} className="mt-2 text-gold-dark hover:underline">
            Se déconnecter
          </button>
        </div>
      </aside>

      {/* Mobile header */}
      <header className="md:hidden sticky top-0 z-20 flex items-center justify-between border-b border-line bg-cream/90 backdrop-blur px-4 py-3">
        <Brand />
        <button onClick={logout} className="text-xs text-gold-dark">
          Déconnexion
        </button>
      </header>

      <main className="flex-1 md:ml-64 px-4 pt-5 pb-28 md:px-10 md:py-10 max-w-6xl">{children}</main>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-20 grid grid-cols-4 border-t border-line bg-white/95 backdrop-blur pb-[env(safe-area-inset-bottom)]">
        {NAV.map((n) => (
          <NavLink
            key={n.to}
            to={n.to}
            end={n.to === '/'}
            className={({ isActive }) =>
              `relative flex flex-col items-center gap-1 py-2.5 text-[11px] ${isActive ? 'text-gold-dark' : 'text-muted'}`
            }
          >
            <Icon d={n.icon} />
            {n.short}
            {n.to === '/relances' && relanceCount > 0 && (
              <span className="absolute top-1.5 left-1/2 ml-2">
                <Count n={relanceCount} />
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      <Toasts toasts={toasts} />
    </div>
  )
}

function Brand() {
  return (
    <div>
      <p className="font-serif text-2xl leading-none text-ink">Crea'rt</p>
      <p className="text-[10px] uppercase tracking-[0.25em] text-gold">Workshops · CRM</p>
    </div>
  )
}

function Count({ n }) {
  return (
    <span className="rounded-full bg-gold px-1.5 py-0.5 text-[10px] font-semibold leading-none text-white">{n}</span>
  )
}
