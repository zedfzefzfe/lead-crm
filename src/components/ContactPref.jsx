import { tv } from '../lib/i18n'

// How the client asked to be contacted on the landing page (Crea'rt): call now / tonight /
// tomorrow morning, or WhatsApp. "Appel maintenant" is highlighted because it is urgent.
export default function ContactPref({ value }) {
  if (!value) return <span className="text-muted">—</span>
  const whatsapp = /whatsapp/i.test(value)
  const urgent = value === 'Appel maintenant'
  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-md border px-2 py-1 text-[12px] font-medium ${
        urgent ? 'border-gold bg-gold text-on-gold' : whatsapp ? 'border-green-200 bg-green-50 text-green-800' : 'border-line bg-white text-ink'
      }`}
    >
      {whatsapp ? (
        <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="currentColor" aria-hidden="true">
          <path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2Z" />
        </svg>
      ) : (
        <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2Z" />
        </svg>
      )}
      {tv(value)}
    </span>
  )
}
