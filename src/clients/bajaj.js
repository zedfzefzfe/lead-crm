// Bajaj Maroc — motorcycle test-ride requests from bajajmaroc.com.
export default {
  brand: { name: 'Bajaj Maroc', tagline: 'Leads · CRM', title: 'Bajaj Maroc CRM' },
  // Overrides the colour tokens from index.css: cool greys + Bajaj blue.
  theme: {
    '--color-cream': '#f6f7f9',
    '--color-sand': '#eff1f5',
    '--color-line': '#e3e6ec',
    '--color-ink': '#111827',
    '--color-muted': '#6b7280',
    '--color-gold': '#0b5cad',
    '--color-gold-dark': '#084a8c',
  },

  statuts: ['Nouveau', 'Contacté', 'Pas de réponse', 'Intéressé', 'Essai programmé', 'Vendu', 'Perdu'],
  // Colour of the small dot shown next to each status.
  statutStyles: {
    Nouveau: 'bg-blue-500',
    Contacté: 'bg-slate-400',
    'Pas de réponse': 'bg-orange-500',
    Intéressé: 'bg-amber-400',
    'Essai programmé': 'bg-violet-500',
    Vendu: 'bg-green-600',
    Perdu: 'bg-red-500',
  },
  aRelancer: ['Nouveau', 'Pas de réponse', 'Intéressé'],
  won: ['Vendu'],
  closed: ['Vendu', 'Perdu'],
  lost: 'Perdu',
  raisons: ['Prix', 'Crédit refusé', 'Concessionnaire trop loin', 'Pas de réponse', 'Réfléchit', 'Acheté ailleurs', 'Autre'],

  sourceLabels: { landing: 'Site web', whatsapp: 'WhatsApp', instagram: 'Instagram / Facebook', autre: 'Autre' },

  item: {
    key: 'modele',
    label: 'Modèle',
    plural: 'modèles',
    default: '',
    options: ['Pulsar N125', 'Pulsar N250', 'Pulsar RS200', 'Pulsar NS 400Z'],
  },
  extraFields: [{ key: 'paiement', label: 'Paiement', options: ['Au comptant', 'Crédit à 0 %'] }],
  showAcompte: true,
  showContactPref: false,
  quickRelance: false, // the list shows Paiement instead (date stays on the lead page)

  whatsappMessage: (prenom, item) =>
    `Salam ${prenom} 👋\n` +
    `C'est Bajaj Maroc. Merci pour votre demande d'essai${item ? ` de la ${item}` : ''} 🏍️\n` +
    `Imta ywaf9ek ndiro l'essai? Njawbek 3la ay so2al 3la l'prix wla l'crédit.`,
}
