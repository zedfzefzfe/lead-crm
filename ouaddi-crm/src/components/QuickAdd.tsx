import { createContext, useContext, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { CalendarPlus, Plus, UserPlus } from 'lucide-react'
import { Sheet } from '@/components/ui/sheet'
import { LeadForm } from '@/components/LeadForm'
import { AppointmentForm, type AppointmentDefaults } from '@/components/AppointmentForm'

interface QuickAdd {
  addLead: () => void
  addAppointment: (d?: AppointmentDefaults) => void
}
const QuickAddContext = createContext<QuickAdd>({ addLead: () => {}, addAppointment: () => {} })
export const useQuickAdd = () => useContext(QuickAddContext)

// Global "+" : add a lead or a rendez-vous from any screen (2–3 taps).
export function QuickAddProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate()
  const [menu, setMenu] = useState(false)
  const [leadOpen, setLeadOpen] = useState(false)
  const [appt, setAppt] = useState<AppointmentDefaults | null>(null)

  const api: QuickAdd = {
    addLead: () => { setMenu(false); setLeadOpen(true) },
    addAppointment: d => { setMenu(false); setAppt(d ?? {}) },
  }

  return (
    <QuickAddContext.Provider value={api}>
      {children}

      <button
        onClick={() => setMenu(true)}
        aria-label="Ajouter"
        className="fixed right-4 z-40 grid size-14 place-items-center rounded-full bg-primary text-primary-foreground shadow-lg lg:right-8 lg:bottom-8"
        style={{ bottom: 'calc(5rem + env(safe-area-inset-bottom))' }}
      >
        <Plus className="size-7" />
      </button>

      <Sheet open={menu} onOpenChange={setMenu} title="Ajouter">
        <div className="grid grid-cols-2 gap-3">
          <button onClick={api.addLead} className="flex h-28 flex-col items-center justify-center gap-2 rounded-xl border bg-secondary/50 font-medium hover:bg-secondary">
            <UserPlus className="size-7" />Lead
          </button>
          <button onClick={() => api.addAppointment()} className="flex h-28 flex-col items-center justify-center gap-2 rounded-xl border bg-secondary/50 font-medium hover:bg-secondary">
            <CalendarPlus className="size-7" />Rendez-vous
          </button>
        </div>
      </Sheet>

      <Sheet open={leadOpen} onOpenChange={setLeadOpen} title="Nouveau lead">
        {leadOpen && (
          <LeadForm onDone={(lead, thenAppointment) => {
            setLeadOpen(false)
            if (thenAppointment) setAppt({ leadId: lead.id })
            else navigate(`/leads/${lead.id}`)
          }} />
        )}
      </Sheet>

      <Sheet open={appt !== null} onOpenChange={o => !o && setAppt(null)} title="Nouveau rendez-vous">
        {appt && <AppointmentForm key={JSON.stringify(appt)} defaults={appt} onDone={() => setAppt(null)} />}
      </Sheet>
    </QuickAddContext.Provider>
  )
}
