import { createContext, useCallback, useContext, useState, type ReactNode } from 'react'
import { cn } from './utils'

type Toast = { id: number; text: string; error?: boolean }
const ToastContext = createContext<(text: string, error?: boolean) => void>(() => {})

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const push = useCallback((text: string, error = false) => {
    const id = Date.now() + Math.random()
    setToasts(t => [...t, { id, text, error }])
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), error ? 6000 : 2500)
  }, [])
  return (
    <ToastContext.Provider value={push}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 bottom-24 z-[60] flex flex-col items-center gap-2 px-4 lg:bottom-6">
        {toasts.map(t => (
          <div key={t.id} role="status"
            className={cn('rounded-lg px-4 py-2.5 text-sm font-medium shadow-lg', t.error ? 'bg-destructive text-white' : 'bg-primary text-primary-foreground')}>
            {t.text}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export const useToast = () => useContext(ToastContext)
