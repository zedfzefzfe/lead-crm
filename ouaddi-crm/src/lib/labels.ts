import type { ActivityType, ApptStatus, ApptType, City, LeadSource, Service, Stage } from './types'

export const STAGES: Stage[] = [
  'nouveau', 'contacte', 'rdv_mesures', 'mesures_prises', 'devis_envoye',
  'negociation', 'gagne', 'pose_planifiee', 'termine', 'perdu',
]
export const STAGE_LABEL: Record<Stage, string> = {
  nouveau: 'Nouveau',
  contacte: 'Contacté',
  rdv_mesures: 'RDV mesures',
  mesures_prises: 'Mesures prises',
  devis_envoye: 'Devis envoyé',
  negociation: 'Négociation',
  gagne: 'Gagné',
  pose_planifiee: 'Pose planifiée',
  termine: 'Terminé',
  perdu: 'Perdu',
}
export const STAGE_DOT: Record<Stage, string> = {
  nouveau: 'bg-sky-500',
  contacte: 'bg-slate-400',
  rdv_mesures: 'bg-blue-600',
  mesures_prises: 'bg-indigo-500',
  devis_envoye: 'bg-amber-500',
  negociation: 'bg-orange-500',
  gagne: 'bg-emerald-600',
  pose_planifiee: 'bg-teal-500',
  termine: 'bg-emerald-800',
  perdu: 'bg-red-500',
}
// Won (counted in revenue) / closed (never "à relancer").
export const WON_STAGES: Stage[] = ['gagne', 'pose_planifiee', 'termine']
export const CLOSED_STAGES: Stage[] = ['gagne', 'pose_planifiee', 'termine', 'perdu']
export const LOST_REASONS = ['Prix', 'Délai', 'Pas de réponse', 'Acheté ailleurs', 'Projet reporté', 'Hors zone', 'Autre']

export const CITY_LABEL: Record<City, string> = { casablanca: 'Casa', rabat: 'Rabat', autre: 'Autre' }
export const CITY_BADGE: Record<City, string> = {
  casablanca: 'bg-sky-100 text-sky-800',
  rabat: 'bg-rose-100 text-rose-800',
  autre: 'bg-stone-200 text-stone-700',
}

export const SOURCE_LABEL: Record<LeadSource, string> = {
  meta_ads: 'Pub Meta',
  instagram_auto: 'Instagram auto',
  whatsapp: 'WhatsApp',
  referral: 'Parrainage',
  autre: 'Autre',
}

export const SERVICE_LABEL: Record<Service, string> = { rideaux: 'Rideaux', fauteuils: 'Fauteuils', les_deux: 'Rideaux + fauteuils' }

export const APPT_TYPES: ApptType[] = ['mesures', 'pose', 'livraison', 'visite']
export const APPT_TYPE_LABEL: Record<ApptType, string> = { mesures: 'Mesures', pose: 'Pose', livraison: 'Livraison', visite: 'Visite' }
// Calendar colours: block (left border + soft fill) and chip.
export const APPT_TYPE_STYLE: Record<ApptType, string> = {
  mesures: 'border-l-blue-600 bg-blue-50 text-blue-950',
  pose: 'border-l-emerald-600 bg-emerald-50 text-emerald-950',
  livraison: 'border-l-orange-500 bg-orange-50 text-orange-950',
  visite: 'border-l-violet-500 bg-violet-50 text-violet-950',
}
export const APPT_TYPE_DOT: Record<ApptType, string> = {
  mesures: 'bg-blue-600',
  pose: 'bg-emerald-600',
  livraison: 'bg-orange-500',
  visite: 'bg-violet-500',
}

export const APPT_STATUSES: ApptStatus[] = ['planifie', 'confirme', 'fait', 'annule', 'no_show']
export const APPT_STATUS_LABEL: Record<ApptStatus, string> = {
  planifie: 'Planifié',
  confirme: 'Confirmé',
  fait: 'Fait',
  annule: 'Annulé',
  no_show: 'Absent',
}
export const APPT_STATUS_BADGE: Record<ApptStatus, string> = {
  planifie: 'bg-stone-200 text-stone-800',
  confirme: 'bg-blue-100 text-blue-800',
  fait: 'bg-emerald-100 text-emerald-800',
  annule: 'bg-red-100 text-red-700 line-through',
  no_show: 'bg-amber-100 text-amber-800',
}

export const ACTIVITY_LABEL: Record<ActivityType, string> = {
  note: 'Note',
  appel: 'Appel',
  whatsapp: 'WhatsApp',
  rdv: 'Rendez-vous',
  changement_statut: 'Étape',
}

export const formatDH = (n: number | null | undefined) =>
  n == null ? '' : new Intl.NumberFormat('fr-MA', { maximumFractionDigits: 0 }).format(n) + ' DH'

// "rdv_mesures → mesures_prises" (written by the database) -> readable labels.
export function prettyActivity(type: ActivityType, content: string) {
  if (type !== 'changement_statut') return content
  return content
    .split(' → ')
    .map(s => STAGE_LABEL[s as Stage] ?? s)
    .join(' → ')
}
