import { useEffect, useRef, useState } from 'react'
import { LANGS, t, useLang } from '../lib/i18n'

// Globe button "FR / EN / ع" that opens a small menu to change the interface language.
export default function LangSwitcher() {
  const { lang, setLang } = useLang()
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const current = LANGS.find((l) => l.code === lang)

  useEffect(() => {
    if (!open) return
    const close = (e) => !ref.current?.contains(e.target) && setOpen(false)
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [open])

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label={t('language')}
        aria-expanded={open}
        className="btn-ghost gap-1.5 px-3"
      >
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
          <circle cx="12" cy="12" r="9" />
          <path d="M3 12h18M12 3c2.5 2.7 3.8 5.7 3.8 9s-1.3 6.3-3.8 9c-2.5-2.7-3.8-5.7-3.8-9S9.5 5.7 12 3Z" />
        </svg>
        <span className="text-[13px] font-semibold">{current.short}</span>
      </button>
      {open && (
        <ul className="absolute end-0 z-30 mt-1.5 w-40 overflow-hidden rounded-md border border-line bg-white py-1 shadow-lg">
          {LANGS.map((l) => (
            <li key={l.code}>
              <button
                type="button"
                onClick={() => {
                  setOpen(false)
                  setLang(l.code)
                }}
                className={`flex w-full items-center justify-between px-3 py-2 text-start text-[14px] hover:bg-sand ${
                  l.code === lang ? 'font-semibold text-gold' : 'text-ink'
                }`}
              >
                <span>{l.label}</span>
                <span className="text-[12px] text-muted">{l.short}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
