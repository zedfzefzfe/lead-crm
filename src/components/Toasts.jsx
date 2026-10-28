export default function Toasts({ toasts }) {
  return (
    <div className="pointer-events-none fixed inset-x-3 top-3 z-30 flex flex-col items-center gap-2 md:inset-x-auto md:end-6 md:top-auto md:bottom-6 md:items-end">
      {toasts.map((t) => (
        <div
          key={t.id}
          className="pointer-events-auto flex items-center gap-2.5 rounded-md bg-ink px-3.5 py-2.5 text-[13px] text-white shadow-lg"
        >
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
          {t.text}
        </div>
      ))}
    </div>
  )
}
