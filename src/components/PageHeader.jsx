import LangSwitcher from './LangSwitcher'

// Title row used at the top of every page, with the page actions and the language switcher.
export default function PageHeader({ title, subtitle, children }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div className="min-w-0">
        <h1 className="text-[22px] font-semibold tracking-tight text-ink">{title}</h1>
        {subtitle && <p className="mt-0.5 text-[13px] text-muted">{subtitle}</p>}
      </div>
      <div className="flex items-center gap-2">
        {children}
        <LangSwitcher />
      </div>
    </div>
  )
}
