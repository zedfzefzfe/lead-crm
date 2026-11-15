import type { ReactNode } from 'react'
import { NavLink } from 'react-router-dom'
import { CalendarDays, Columns3, Home, LogOut, Users, UsersRound } from 'lucide-react'
import { useAuth } from '@/lib/auth'
import { supabase } from '@/lib/supabase'
import { cn } from '@/lib/utils'

const NAV = [
  { to: '/', label: 'Accueil', icon: Home, end: true },
  { to: '/rdv', label: 'Rendez-vous', icon: CalendarDays },
  { to: '/pipeline', label: 'Pipeline', icon: Columns3 },
  { to: '/leads', label: 'Leads', icon: Users },
]

export function Logo({ className }: { className?: string }) {
  return (
    <div className={cn('leading-tight', className)}>
      <div className="font-serif text-lg font-semibold tracking-wide">Ouaddi Living</div>
      <div className="text-[11px] tracking-[0.2em] text-muted-foreground uppercase">Rideaux · Fauteuils</div>
    </div>
  )
}

export function Layout({ children }: { children: ReactNode }) {
  const { profile, isAdmin } = useAuth()
  const nav = isAdmin ? [...NAV, { to: '/equipe', label: 'Équipe', icon: UsersRound }] : NAV

  return (
    <div className="min-h-dvh lg:pl-60">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 hidden w-60 flex-col border-r bg-card p-4 lg:flex">
        <Logo className="px-2 pb-6" />
        <nav className="space-y-1">
          {nav.map(n => (
            <NavLink key={n.to} to={n.to} end={n.end}
              className={({ isActive }) => cn('flex h-11 items-center gap-3 rounded-lg px-3 text-sm font-medium',
                isActive ? 'bg-secondary text-foreground' : 'text-muted-foreground hover:bg-secondary/60 hover:text-foreground')}>
              <n.icon className="size-5" />{n.label}
            </NavLink>
          ))}
        </nav>
        <div className="mt-auto flex items-center justify-between gap-2 border-t px-2 pt-4">
          <div className="min-w-0">
            <div className="truncate text-sm font-medium">{profile?.full_name}</div>
            <div className="text-xs text-muted-foreground">{profile?.role === 'admin' ? 'Admin' : 'Agent'}</div>
          </div>
          <button onClick={() => supabase.auth.signOut()} className="grid size-10 place-items-center rounded-lg hover:bg-secondary" aria-label="Se déconnecter">
            <LogOut className="size-4" />
          </button>
        </div>
      </aside>

      {/* Phone header */}
      <header className="sticky top-0 z-30 flex items-center justify-between border-b bg-background/95 px-4 py-2.5 backdrop-blur lg:hidden">
        <Logo />
        <div className="flex items-center gap-1">
          {isAdmin && (
            <NavLink to="/equipe" className="grid size-10 place-items-center rounded-lg hover:bg-secondary" aria-label="Équipe">
              <UsersRound className="size-5" />
            </NavLink>
          )}
          <button onClick={() => supabase.auth.signOut()} className="grid size-10 place-items-center rounded-lg hover:bg-secondary" aria-label="Se déconnecter">
            <LogOut className="size-5" />
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 pt-4 pb-safe lg:px-8 lg:pt-8">{children}</main>

      {/* Phone bottom bar */}
      <nav className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-4 border-t bg-card bottom-safe lg:hidden">
        {NAV.map(n => (
          <NavLink key={n.to} to={n.to} end={n.end}
            className={({ isActive }) => cn('flex h-16 flex-col items-center justify-center gap-1 text-[11px] font-medium',
              isActive ? 'text-foreground' : 'text-muted-foreground')}>
            {({ isActive }) => (<>
              <n.icon className={cn('size-6', isActive && 'stroke-[2.4]')} />{n.label}
            </>)}
          </NavLink>
        ))}
      </nav>
    </div>
  )
}

export function PageTitle({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
      <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
      {children}
    </div>
  )
}
