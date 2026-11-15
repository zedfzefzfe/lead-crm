/** Any Moroccan way of writing a number -> international digits for wa.me (2126XXXXXXXX). */
export function normalizePhone(raw: string) {
  let d = raw.replace(/\D/g, '')
  if (d.startsWith('00')) d = d.slice(2)
  if (d.startsWith('0') && d.length === 10) d = '212' + d.slice(1) // 06… / 07… / 05…
  if (/^[5-7]\d{8}$/.test(d)) d = '212' + d // 6XXXXXXXX
  return d
}
export const isValidPhone = (d: string) => /^\d{8,15}$/.test(d)

/** +212 6 61 00 00 01 */
export function displayPhone(d: string) {
  if (/^212\d{9}$/.test(d)) return `+212 ${d[3]} ${d.slice(4, 6)} ${d.slice(6, 8)} ${d.slice(8, 10)} ${d.slice(10)}`
  return '+' + d
}

export function firstName(fullName: string) {
  return fullName.trim().split(/\s+/)[0] ?? ''
}

export function whatsappUrl(phone: string, text?: string) {
  return `https://wa.me/${phone}${text ? `?text=${encodeURIComponent(text)}` : ''}`
}

export const defaultWhatsappText = (fullName: string) =>
  `Bonjour ${firstName(fullName)}, c'est Ouaddi Living 👋 Merci pour votre demande. Quand seriez-vous disponible pour la prise de mesures ?`
