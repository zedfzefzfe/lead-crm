export default function Toasts({ toasts }) {
  return (
    <div className="fixed z-30 top-3 inset-x-3 md:inset-x-auto md:right-6 md:top-6 flex flex-col gap-2 items-center md:items-end pointer-events-none">
      {toasts.map((t) => (
        <div
          key={t.id}
          className="pointer-events-auto rounded-xl border border-gold/30 bg-white px-4 py-3 text-sm shadow-lg flex items-center gap-2"
        >
          <span className="h-2 w-2 rounded-full bg-gold animate-pulse" />
          {t.text}
        </div>
      ))}
    </div>
  )
}
