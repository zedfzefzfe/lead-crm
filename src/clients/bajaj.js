// Bajaj Maroc — motorcycle test-ride requests from bajajmaroc.com.
export default {
  brand: { name: 'Bajaj Maroc', tagline: 'Leads · CRM', title: 'Bajaj Maroc CRM' },
  // Overrides the colour/font tokens from index.css: cool greys + Bajaj blue.
  theme: {
    '--color-cream': '#f5f7fa',
    '--color-sand': '#e9eef5',
    '--color-line': '#d9e0ea',
    '--color-ink': '#16202e',
    '--color-muted': '#64748b',
    '--color-gold': '#0057b8',
    '--color-gold-dark': '#003f87',
    '--font-serif': '"Inter", ui-sans-serif, system-ui, sans-serif',
  },

  statuts: ['Nouveau', 'Contacté', 'Pas de réponse', 'Intéressé', 'Essai programmé', 'Vendu', 'Perdu'],
  statutStyles: {
    Nouveau: 'bg-blue-50 text-blue-700 ring-blue-200',
    Contacté: 'bg-stone-100 text-stone-700 ring-stone-200',
    'Pas de réponse': 'bg-orange-50 text-orange-700 ring-orange-200',
    Intéressé: 'bg-yellow-50 text-yellow-800 ring-yellow-200',
    'Essai programmé': 'bg-violet-50 text-violet-700 ring-violet-200',
    Vendu: 'bg-green-100 text-green-800 ring-green-300',
    Perdu: 'bg-red-50 text-red-700 ring-red-200',
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

  whatsappMessage: (prenom, item) =>
    `Salam ${prenom} 👋\n` +
    `C'est Bajaj Maroc. Merci pour votre demande d'essai${item ? ` de la ${item}` : ''} 🏍️\n` +
    `Imta ywaf9ek ndiro l'essai? Njawbek 3la ay so2al 3la l'prix wla l'crédit.`,
}
