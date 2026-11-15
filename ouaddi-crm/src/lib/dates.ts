// Everything is shown in Moroccan time, whatever the phone's settings.
export const TZ = 'Africa/Casablanca'

const partsFmt = new Intl.DateTimeFormat('en-CA', {
  timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
})
function parts(d: Date) {
  const p = Object.fromEntries(partsFmt.formatToParts(d).map(x => [x.type, x.value]))
  return { y: +p.year, m: +p.month, d: +p.day, h: +p.hour, min: +p.minute }
}

/** 'YYYY-MM-DD' of an instant, in Casablanca. */
export function dayKey(d: Date | string) {
  const p = parts(new Date(d))
  return `${p.y}-${String(p.m).padStart(2, '0')}-${String(p.d).padStart(2, '0')}`
}
export const todayKey = () => dayKey(new Date())

/** Minutes since midnight (Casablanca) — for placing blocks in the calendar. */
export function minutesOfDay(d: Date | string) {
  const p = parts(new Date(d))
  return p.h * 60 + p.min
}

/** Casablanca local date ('YYYY-MM-DD') + time ('HH:MM') -> ISO instant. */
export function toInstant(date: string, time: string) {
  const [y, m, d] = date.split('-').map(Number)
  const [h, min] = time.split(':').map(Number)
  const guess = Date.UTC(y, m - 1, d, h, min)
  const p = parts(new Date(guess))
  const offset = Date.UTC(p.y, p.m - 1, p.d, p.h, p.min) - guess
  return new Date(guess - offset).toISOString()
}

/** Calendar arithmetic on 'YYYY-MM-DD' keys (no time zone involved). */
export function addDays(key: string, n: number) {
  const [y, m, d] = key.split('-').map(Number)
  const t = new Date(Date.UTC(y, m - 1, d + n))
  return t.toISOString().slice(0, 10)
}
export function weekStart(key: string) {
  const [y, m, d] = key.split('-').map(Number)
  const dow = new Date(Date.UTC(y, m - 1, d)).getUTCDay() // 0 = dimanche
  return addDays(key, -((dow + 6) % 7)) // lundi
}
export function monthStart(key: string) {
  return key.slice(0, 8) + '01'
}
/** Start of a Casablanca day as an ISO instant (for queries). */
export const dayStartIso = (key: string) => toInstant(key, '00:00')

const fmt = (o: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat('fr-FR', { timeZone: TZ, ...o })
const timeF = fmt({ hour: '2-digit', minute: '2-digit' })
const dayF = fmt({ weekday: 'short', day: 'numeric', month: 'short' })
const longDayF = fmt({ weekday: 'long', day: 'numeric', month: 'long' })
const dateTimeF = fmt({ day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })

export const fmtTime = (d: string | Date) => timeF.format(new Date(d))
export const fmtDay = (d: string | Date) => dayF.format(new Date(d))
export const fmtDateTime = (d: string | Date) => dateTimeF.format(new Date(d))
/** 'YYYY-MM-DD' -> "samedi 21 novembre" (noon UTC, so the day never shifts). */
export const fmtKeyLong = (key: string) => longDayF.format(new Date(key + 'T12:00:00Z'))
export const fmtKeyShort = (key: string) => dayF.format(new Date(key + 'T12:00:00Z'))

/** "aujourd'hui 14:00", "demain 10:30", "sam. 21 nov. 10:00" */
export function fmtRelative(d: string) {
  const k = dayKey(d)
  const t = todayKey()
  if (k === t) return `aujourd'hui ${fmtTime(d)}`
  if (k === addDays(t, 1)) return `demain ${fmtTime(d)}`
  if (k === addDays(t, -1)) return `hier ${fmtTime(d)}`
  return `${fmtDay(d)} ${fmtTime(d)}`
}

export function daysSince(d: string) {
  return Math.floor((Date.now() - new Date(d).getTime()) / 86_400_000)
}
