import { CLIENT, ITEM } from './constants'

// Small helpers shared by the pages.

export function todayISO() {
  const d = new Date()
  return toISODate(d)
}

export function toISODate(d) {
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

export function formatDate(value) {
  if (!value) return '—'
  // Plain dates ("2026-10-17") are shown as-is in local time.
  const d = value.length === 10 ? new Date(value + 'T00:00:00') : new Date(value)
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
}

export function formatDateTime(value) {
  if (!value) return '—'
  return new Date(value).toLocaleString('fr-FR', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function formatMAD(n) {
  return `${Number(n || 0).toLocaleString('fr-FR')} DH`
}

// "06 12 34 56 78" / "+212 6..." / "00212 6..." -> "212612345678" for wa.me links.
export function toWhatsAppNumber(phone) {
  let digits = String(phone || '').replace(/\D/g, '')
  if (digits.startsWith('00')) digits = digits.slice(2)
  if (digits.startsWith('0') && digits.length === 10) digits = '212' + digits.slice(1)
  if (digits.length === 9) digits = '212' + digits
  return digits
}

export function whatsappLink(lead) {
  const prenom = (lead.nom || '').trim().split(/\s+/)[0]
  const message = CLIENT.whatsappMessage(prenom, lead[ITEM.key])
  return `https://wa.me/${toWhatsAppNumber(lead.telephone)}?text=${encodeURIComponent(message)}`
}

export function telLink(phone) {
  return `tel:${String(phone || '').replace(/[^\d+]/g, '')}`
}
