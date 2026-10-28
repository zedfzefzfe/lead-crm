// Crea'rt Workshops — creative workshops (candles, resin, soap, perfume…).
export default {
  brand: { name: "Crea'rt", tagline: 'Workshops · CRM', title: "Crea'rt CRM" },
  theme: {}, // keeps the default cream / soft gold colours from index.css

  statuts: ['Nouveau', 'Contacté', 'Pas de réponse', 'Intéressée', 'Acompte payé', 'Confirmée', 'Perdue'],
  // Colour of the small dot shown next to each status.
  statutStyles: {
    Nouveau: 'bg-blue-500',
    Contacté: 'bg-stone-400',
    'Pas de réponse': 'bg-orange-500',
    Intéressée: 'bg-amber-400',
    'Acompte payé': 'bg-emerald-500',
    Confirmée: 'bg-green-600',
    Perdue: 'bg-red-500',
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
  showContactPref: true,
  quickRelance: true, // follow-up date column in the leads list // "Contact" column, filled by the landing page pop-up

  whatsappMessage: (prenom, item) =>
    `Salam ${prenom} 😊\n` +
    `C'est Crea'rt Workshops. Merci pour votre intérêt pour ${item ? `l'atelier ${item}` : 'nos ateliers'} ✨\n` +
    `Wach ba9i mhtama? Nqdro nkmlo l'inscription dyalk w njawbk 3la ay so2al 🌸`,
}
