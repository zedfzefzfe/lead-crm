export const STATUTS = [
  'Nouveau',
  'Contacté',
  'Pas de réponse',
  'Intéressée',
  'Acompte payé',
  'Confirmée',
  'Perdue',
]

export const RAISONS = ['Prix', 'Date / samedi', 'Distance', 'Pas de réponse', 'Réfléchit', 'Autre']

export const SOURCES = ['landing', 'whatsapp', 'instagram', 'autre']

export const SOURCE_LABELS = {
  landing: 'Landing page',
  whatsapp: 'WhatsApp',
  instagram: 'Instagram',
  autre: 'Autre',
}

// Badge colours per status (Tailwind classes).
export const STATUT_STYLES = {
  Nouveau: 'bg-blue-50 text-blue-700 ring-blue-200',
  Contacté: 'bg-stone-100 text-stone-700 ring-stone-200',
  'Pas de réponse': 'bg-orange-50 text-orange-700 ring-orange-200',
  Intéressée: 'bg-yellow-50 text-yellow-800 ring-yellow-200',
  'Acompte payé': 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  Confirmée: 'bg-green-100 text-green-800 ring-green-300',
  Perdue: 'bg-red-50 text-red-700 ring-red-200',
}

// Statuses that still need someone to call back.
export const A_RELANCER = ['Nouveau', 'Pas de réponse', 'Intéressée']

export const FIELD_LABELS = {
  statut: 'Statut',
  raison: 'Raison',
  montant_acompte: 'Acompte',
  notes: 'Notes',
}

export const DEFAULT_ATELIER = 'Bougies Casa 17 Oct'
