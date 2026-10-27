import client from '../clients'

// Everything that differs between clients lives in src/clients/<name>.js.
export const CLIENT = client
export const STATUTS = client.statuts
export const STATUT_STYLES = client.statutStyles
export const RAISONS = client.raisons
export const A_RELANCER = client.aRelancer
export const ITEM = client.item
export const EXTRA_FIELDS = client.extraFields

export const SOURCES = ['landing', 'whatsapp', 'instagram', 'autre']
export const SOURCE_LABELS = client.sourceLabels

export const FIELD_LABELS = {
  statut: 'Statut',
  raison: 'Raison',
  montant_acompte: 'Acompte',
  notes: 'Notes',
}
