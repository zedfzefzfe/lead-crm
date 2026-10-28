import { NavLink } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useLeads } from '../lib/leads'
import { CLIENT } from '../lib/constants'
import { useRelances } from '../pages/Relances'
import Toasts from './Toasts'

const NAV = [
  { to: '/', label: 'Tableau de bord', short: 'Accueil', icon: 'M4 5h6v6H4zM14 5h6v4h-6zM14 13h6v6h-6zM4 15h6v4H4z' },
  { to: '/leads', label: 'Leads', short: 'Leads', icon: 'M16 19v-1a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v1M9 10a3 3 0 1 0 0-6 3 3 0 0 0 0 6M22 19v-1a4 4 0 0 0-3-3.9M16 4.1a3 3 0 0 1 0 5.8' },
  { to: '/relances', label: 'À relancer', short: 'Relances', icon: 'M12 8v4l3 2M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0' },
  { to: '/ajouter', label: 'Ajouter un lead', short: 'Ajouter', icon: 'M12 5v14M5 12h14' },
]

function Icon({ d, className = 'h-[18px] w-[18px]' }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
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
      <aside className="hidden md:fixed md:inset-y-0 md:flex md:w-60 md:flex-col border-r border-line bg-white">
        <div className="flex h-14 items-center border-b border-line px-4">
          <Brand />
        </div>
        <nav className="flex flex-col gap-0.5 p-3">
          {NAV.map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              end={n.to === '/'}
              className={({ isActive }) =>
                `flex h-9 items-center gap-2.5 rounded-md px-2.5 text-[14px] transition-colors ${
                  isActive ? 'bg-sand font-medium text-ink' : 'text-muted hover:bg-sand/60 hover:text-ink'
                }`
              }
            >
              <Icon d={n.icon} />
              <span className="flex-1">{n.label}</span>
              {n.to === '/relances' && relanceCount > 0 && <Count n={relanceCount} />}
            </NavLink>
          ))}
        </nav>
        <div className="mt-auto flex items-center gap-2.5 border-t border-line p-3">
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-sand text-[13px] font-semibold uppercase text-ink">
            {user.email[0]}
          </span>
          <p className="min-w-0 flex-1 truncate text-[13px] text-ink">{user.email}</p>
          <button onClick={logout} title="Se déconnecter" className="rounded-md p-1.5 text-muted hover:bg-sand hover:text-ink">
            <Icon d="M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3M10 17l5-5-5-5M15 12H3" className="h-4 w-4" />
          </button>
        </div>
      </aside>

      {/* Mobile header */}
      <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-line bg-white/95 px-4 backdrop-blur md:hidden">
        <Brand />
        <button onClick={logout} className="text-[13px] text-muted">
          Déconnexion
        </button>
      </header>

      <main className="min-w-0 flex-1 px-4 pb-28 pt-5 md:ml-60 md:px-8 md:py-8">
        <div className="mx-auto max-w-[1180px]">{children}</div>
      </main>

      {/* Mobile bottom nav */}
      <nav className="fixed inset-x-0 bottom-0 z-20 grid grid-cols-4 border-t border-line bg-white pb-[env(safe-area-inset-bottom)] md:hidden">
        {NAV.map((n) => (
          <NavLink
            key={n.to}
            to={n.to}
            end={n.to === '/'}
            className={({ isActive }) =>
              `relative flex flex-col items-center gap-1 py-2 text-[11px] font-medium ${isActive ? 'text-gold' : 'text-muted'}`
            }
          >
            <Icon d={n.icon} className="h-5 w-5" />
            {n.short}
            {n.to === '/relances' && relanceCount > 0 && (
              <span className="absolute left-1/2 top-1 ml-2.5">
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

export function Brand() {
  return (
    <div className="flex items-center gap-2.5">
      <span className="grid h-7 w-7 place-items-center rounded-md bg-gold text-[13px] font-bold text-white">
        {CLIENT.brand.name[0]}
      </span>
      <div className="leading-tight">
        <p className="text-[14px] font-semibold text-ink">{CLIENT.brand.name}</p>
        <p className="text-[11px] text-muted">{CLIENT.brand.tagline}</p>
      </div>
    </div>
  )
}

function Count({ n }) {
  return (
    <span className="min-w-5 rounded-full bg-gold px-1.5 py-px text-center text-[11px] font-semibold leading-4 text-white">{n}</span>
  )
}
