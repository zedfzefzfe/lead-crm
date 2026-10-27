// Crea'rt Workshops — creative workshops (candles, resin, soap, perfume…).
export default {
  brand: { name: "Crea'rt", tagline: 'Workshops · CRM', title: "Crea'rt CRM" },
  theme: {}, // keeps the default cream / soft gold colours from index.css

  statuts: ['Nouveau', 'Contacté', 'Pas de réponse', 'Intéressée', 'Acompte payé', 'Confirmée', 'Perdue'],
  statutStyles: {
    Nouveau: 'bg-blue-50 text-blue-700 ring-blue-200',
    Contacté: 'bg-stone-100 text-stone-700 ring-stone-200',
    'Pas de réponse': 'bg-orange-50 text-orange-700 ring-orange-200',
    Intéressée: 'bg-yellow-50 text-yellow-800 ring-yellow-200',
    'Acompte payé': 'bg-emerald-50 text-emerald-700 ring-emerald-200',
    Confirmée: 'bg-green-100 text-green-800 ring-green-300',
    Perdue: 'bg-red-50 text-red-700 ring-red-200',
  },
  aRelancer: ['Nouveau', 'Pas de réponse', 'Intéressée'], // still need a call back
  won: ['Acompte payé', 'Confirmée'], // counted in the conversion rate
  closed: ['Confirmée', 'Perdue'], // no follow-up reminder any more
  lost: 'Perdue',
  raisons: ['Prix', 'Date / samedi', 'Distance', 'Pas de réponse', 'Réfléchit', 'Autre'],

  sourceLabels: { landing: 'Landing page', whatsapp: 'WhatsApp', instagram: 'Instagram', autre: 'Autre' },

  // What the lead is interested in (column name in the leads table).
  item: { key: 'atelier', label: 'Atelier', plural: 'ateliers', default: 'Bougies Casa 31 Oct', options: [] },
  extraFields: [], // more dropdown fields, e.g. payment method
  showAcompte: true,
  showContactPref: true, // "Contact" column, filled by the landing page pop-up

  whatsappMessage: (prenom, item) =>
    `Salam ${prenom} 😊\n` +
    `C'est Crea'rt Workshops. Merci pour votre intérêt pour ${item ? `l'atelier ${item}` : 'nos ateliers'} ✨\n` +
    `Wach ba9i mhtama? Nqdro nkmlo l'inscription dyalk w njawbk 3la ay so2al 🌸`,
}
