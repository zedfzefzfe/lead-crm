// Crea'rt Workshops — creative workshops (candles, resin, soap, perfume…).
export default {
  brand: {
    name: "Crea'rt",
    tagline: 'Workshops · CRM',
    title: "Crea'rt CRM",
    logo: '/clients/creart-logo.png', // sidebar, login, phone header
    favicon: '/clients/creart-favicon.png', // browser tab icon
  },
  // Same look as Bajaj (neutral greys), with the Crea'rt logo colours: orange #FD924E + black.
  theme: {
    '--color-cream': '#f6f6f5',
    '--color-sand': '#f0efed',
    '--color-line': '#e5e3e0',
    '--color-ink': '#141414',
    '--color-muted': '#6b6965',
    '--color-gold': '#fd924e', // logo orange (buttons, badges, charts)
    '--color-gold-dark': '#f57f33', // hover
    '--color-on-gold': '#101010', // logo black on orange (readable; white on this orange is not)
    '--color-gold-ink': '#b85513', // deeper orange for links and phone numbers on white
  },

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
  showContactPref: true, // "Contact souhaité" column, filled by the landing page pop-up
  quickRelance: false, // no follow-up date column in the list (it stays on the lead page)
  interestedPage: 'Intéressée', // "Intéressées" page in the menu: leads with this status
  passwordDelete: true, // trash button on each lead, asks for the delete password (supabase/delete-password.sql)

  whatsappMessage: (prenom, item) =>
    `Salam ${prenom} 😊\n` +
    `C'est Crea'rt Workshops. Merci pour votre intérêt pour ${item ? `l'atelier ${item}` : 'nos ateliers'} ✨\n` +
    `Wach ba9i mhtama? Nqdro nkmlo l'inscription dyalk w njawbk 3la ay so2al 🌸`,
}
