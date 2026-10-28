import { createContext, useContext, useEffect, useState } from 'react'

// Interface languages. Data stays in French in the database (statuses, reasons…);
// only what is shown on screen is translated, with tv() for those stored values.

export const LANGS = [
  { code: 'fr', label: 'Français', short: 'FR', locale: 'fr-FR', dir: 'ltr' },
  { code: 'en', label: 'English', short: 'EN', locale: 'en-GB', dir: 'ltr' },
  { code: 'ar', label: 'العربية', short: 'ع', locale: 'ar-MA', dir: 'rtl' },
]

// UI text. {x} placeholders are filled by t(key, { x: … }).
const UI = {
  // Navigation & layout
  'nav.dashboard': { fr: 'Tableau de bord', en: 'Dashboard', ar: 'لوحة القيادة' },
  'nav.dashboard.short': { fr: 'Accueil', en: 'Home', ar: 'الرئيسية' },
  'nav.leads': { fr: 'Leads', en: 'Leads', ar: 'العملاء' },
  'nav.relances': { fr: 'À relancer', en: 'Follow-ups', ar: 'للمتابعة' },
  'nav.relances.short': { fr: 'Relances', en: 'Follow-ups', ar: 'المتابعة' },
  'nav.add': { fr: 'Ajouter un lead', en: 'Add a lead', ar: 'إضافة عميل' },
  'nav.add.short': { fr: 'Ajouter', en: 'Add', ar: 'إضافة' },
  logout: { fr: 'Se déconnecter', en: 'Log out', ar: 'تسجيل الخروج' },
  'logout.short': { fr: 'Déconnexion', en: 'Log out', ar: 'خروج' },
  language: { fr: 'Langue', en: 'Language', ar: 'اللغة' },
  loading: { fr: 'Chargement…', en: 'Loading…', ar: 'جارٍ التحميل…' },
  error: { fr: 'Erreur : {x}', en: 'Error: {x}', ar: 'خطأ: {x}' },
  newLead: { fr: 'Nouveau lead : {x}', en: 'New lead: {x}', ar: 'عميل جديد: {x}' },
  configMissing: {
    fr: "Configuration manquante : ajoutez VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY dans les variables d'environnement.",
    en: 'Missing configuration: add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to the environment variables.',
    ar: 'الإعداد غير مكتمل: أضف VITE_SUPABASE_URL و VITE_SUPABASE_ANON_KEY إلى متغيرات البيئة.',
  },

  // Login
  'login.title': { fr: 'Connexion', en: 'Sign in', ar: 'تسجيل الدخول' },
  'login.email': { fr: 'Email', en: 'Email', ar: 'البريد الإلكتروني' },
  'login.password': { fr: 'Mot de passe', en: 'Password', ar: 'كلمة المرور' },
  'login.submit': { fr: 'Se connecter', en: 'Sign in', ar: 'دخول' },
  'login.busy': { fr: 'Connexion…', en: 'Signing in…', ar: 'جارٍ الدخول…' },
  'login.error': { fr: 'Email ou mot de passe incorrect.', en: 'Wrong email or password.', ar: 'البريد الإلكتروني أو كلمة المرور غير صحيحة.' },

  // Dashboard
  'dash.total': { fr: '{x} leads au total', en: '{x} leads in total', ar: '{x} عميل في المجموع' },
  'dash.today': { fr: "Aujourd'hui", en: 'Today', ar: 'اليوم' },
  'dash.week': { fr: 'Cette semaine', en: 'This week', ar: 'هذا الأسبوع' },
  'dash.month': { fr: 'Ce mois', en: 'This month', ar: 'هذا الشهر' },
  'dash.conversion': { fr: 'Taux de conversion', en: 'Conversion rate', ar: 'نسبة التحويل' },
  'dash.deposits': { fr: 'Acomptes encaissés', en: 'Deposits collected', ar: 'العربون المحصل' },
  'dash.pipeline': { fr: 'Pipeline', en: 'Pipeline', ar: 'مراحل البيع' },
  'dash.lostReasons': { fr: 'Raisons des leads perdus', en: 'Why leads were lost', ar: 'أسباب ضياع العملاء' },
  'dash.noLost': { fr: 'Aucun lead perdu', en: 'No lost leads', ar: 'لا يوجد عملاء ضائعون' },
  'dash.noData': { fr: 'Aucune donnée', en: 'No data', ar: 'لا توجد بيانات' },
  'dash.by': { fr: 'Par {x}', en: 'By {x}', ar: 'حسب {x}' },
  'dash.source': { fr: 'source', en: 'source', ar: 'المصدر' },

  // Leads list
  'leads.count': { fr: '{x} leads', en: '{x} leads', ar: '{x} عميل' },
  'leads.countOf': { fr: '{x} sur {y} leads', en: '{x} of {y} leads', ar: '{x} من {y} عميل' },
  'leads.search': { fr: 'Nom ou téléphone…', en: 'Name or phone…', ar: 'الاسم أو الهاتف…' },
  'leads.status': { fr: 'Statut', en: 'Status', ar: 'الحالة' },
  'leads.source': { fr: 'Source', en: 'Source', ar: 'المصدر' },
  'leads.from': { fr: 'Du', en: 'From', ar: 'من' },
  'leads.to': { fr: 'Au', en: 'To', ar: 'إلى' },
  'leads.reset': { fr: 'Réinitialiser', en: 'Reset', ar: 'إعادة تعيين' },
  'leads.empty': { fr: 'Aucun lead', en: 'No leads', ar: 'لا يوجد عملاء' },
  'leads.emptyFiltered': { fr: 'Aucun lead ne correspond à ces filtres.', en: 'No lead matches these filters.', ar: 'لا يوجد عميل يطابق هذه الفلاتر.' },
  'leads.emptyAll': { fr: 'Les nouveaux leads apparaîtront ici automatiquement.', en: 'New leads will show up here automatically.', ar: 'سيظهر العملاء الجدد هنا تلقائياً.' },
  'col.client': { fr: 'Client', en: 'Customer', ar: 'العميل' },
  'col.note': { fr: 'Note', en: 'Note', ar: 'ملاحظة' },
  'col.relance': { fr: 'Relance', en: 'Follow-up', ar: 'المتابعة' },
  'col.received': { fr: 'Reçu', en: 'Received', ar: 'تاريخ الاستلام' },
  deposit: { fr: 'Acompte {x}', en: 'Deposit {x}', ar: 'عربون {x}' },
  contact: { fr: 'Contact : {x}', en: 'Contact: {x}', ar: 'التواصل: {x}' },

  // Quick edit
  'note.add': { fr: 'Ajouter une note…', en: 'Add a note…', ar: 'أضف ملاحظة…' },
  'note.placeholder': { fr: "Résultat de l'appel…", en: 'Result of the call…', ar: 'نتيجة المكالمة…' },
  'relance.tomorrow': { fr: 'Demain', en: 'Tomorrow', ar: 'غداً' },
  'relance.tomorrowTitle': { fr: 'Relancer demain', en: 'Follow up tomorrow', ar: 'المتابعة غداً' },
  'relance.remove': { fr: 'Retirer la relance', en: 'Remove follow-up', ar: 'إلغاء المتابعة' },

  // Follow-ups page
  'rel.title': { fr: "À relancer aujourd'hui", en: 'Follow up today', ar: 'للمتابعة اليوم' },
  'rel.subtitle': { fr: '{x} à appeler · les plus anciens en premier', en: '{x} to call · oldest first', ar: '{x} للاتصال · الأقدم أولاً' },
  'rel.leads': { fr: '{x} leads', en: '{x} leads', ar: '{x} عميل' },
  'rel.lead': { fr: '1 lead', en: '1 lead', ar: 'عميل واحد' },
  'rel.emptyTitle': { fr: 'Rien à relancer', en: 'Nothing to follow up', ar: 'لا شيء للمتابعة' },
  'rel.emptyText': { fr: "Tous les leads ont été traités pour aujourd'hui.", en: 'All leads have been handled for today.', ar: 'تمت معالجة جميع العملاء لهذا اليوم.' },
  'rel.today': { fr: "Relance aujourd'hui", en: 'Follow-up today', ar: 'متابعة اليوم' },
  'rel.planned': { fr: 'Relance prévue le {x}', en: 'Follow-up planned on {x}', ar: 'متابعة مبرمجة يوم {x}' },
  'rel.late': { fr: ' · en retard', en: ' · overdue', ar: ' · متأخرة' },

  // Lead page
  'lead.back': { fr: 'Leads', en: 'Leads', ar: 'العملاء' },
  'lead.notFound': { fr: 'Lead introuvable.', en: 'Lead not found.', ar: 'العميل غير موجود.' },
  'lead.call': { fr: 'Appeler', en: 'Call', ar: 'اتصال' },
  'lead.followUp': { fr: 'Suivi', en: 'Follow-up', ar: 'المتابعة' },
  'lead.info': { fr: 'Informations', en: 'Details', ar: 'المعلومات' },
  'lead.history': { fr: 'Historique', en: 'History', ar: 'السجل' },
  'lead.status': { fr: 'Statut', en: 'Status', ar: 'الحالة' },
  'lead.reason': { fr: 'Raison', en: 'Reason', ar: 'السبب' },
  'lead.deposit': { fr: 'Montant acompte (DH)', en: 'Deposit amount (DH)', ar: 'مبلغ العربون (درهم)' },
  'lead.nextFollowUp': { fr: 'Prochaine relance', en: 'Next follow-up', ar: 'المتابعة القادمة' },
  'lead.notes': { fr: 'Notes', en: 'Notes', ar: 'ملاحظات' },
  'lead.notesPlaceholder': { fr: 'Ce qui a été dit, disponibilités…', en: 'What was said, availability…', ar: 'ما قيل، أوقات التوفر…' },
  save: { fr: 'Enregistrer', en: 'Save', ar: 'حفظ' },
  cancel: { fr: 'Annuler', en: 'Cancel', ar: 'إلغاء' },
  'info.phone': { fr: 'Téléphone', en: 'Phone', ar: 'الهاتف' },
  'info.city': { fr: 'Ville', en: 'City', ar: 'المدينة' },
  'info.contactPref': { fr: 'Préférence de contact', en: 'Contact preference', ar: 'طريقة التواصل المفضلة' },
  'info.source': { fr: 'Source', en: 'Source', ar: 'المصدر' },
  'info.received': { fr: 'Reçu le', en: 'Received', ar: 'تاريخ الاستلام' },
  'info.updated': { fr: 'Modifié', en: 'Updated', ar: 'آخر تعديل' },
  'hist.status': { fr: 'Statut', en: 'Status', ar: 'الحالة' },
  'hist.reason': { fr: 'Raison', en: 'Reason', ar: 'السبب' },
  'hist.deposit': { fr: 'Acompte', en: 'Deposit', ar: 'العربون' },
  'hist.notes': { fr: 'Notes', en: 'Notes', ar: 'الملاحظات' },
  'hist.notesChanged': { fr: ' modifiées', en: ' changed', ar: ' عُدّلت' },
  'hist.system': { fr: 'système', en: 'system', ar: 'النظام' },
  'hist.created': { fr: 'Lead créé le {x}', en: 'Lead created on {x}', ar: 'أُنشئ العميل يوم {x}' },

  // Add lead
  'add.subtitle': { fr: 'Pour les demandes reçues sur WhatsApp, Instagram ou par téléphone.', en: 'For requests received on WhatsApp, Instagram or by phone.', ar: 'للطلبات الواردة عبر واتساب أو انستغرام أو الهاتف.' },
  'add.name': { fr: 'Nom *', en: 'Name *', ar: 'الاسم *' },
  'add.phone': { fr: 'Téléphone *', en: 'Phone *', ar: 'الهاتف *' },
  'add.city': { fr: 'Ville', en: 'City', ar: 'المدينة' },
  'add.source': { fr: 'Source', en: 'Source', ar: 'المصدر' },
  'add.status': { fr: 'Statut', en: 'Status', ar: 'الحالة' },
  'add.notes': { fr: 'Notes', en: 'Notes', ar: 'ملاحظات' },
  'add.duplicate': { fr: 'Ce numéro existe déjà : {x} ({y})', en: 'This number already exists: {x} ({y})', ar: 'هذا الرقم موجود مسبقاً: {x} ({y})' },
  'add.submit': { fr: 'Enregistrer le lead', en: 'Save lead', ar: 'حفظ العميل' },
  'add.busy': { fr: 'Enregistrement…', en: 'Saving…', ar: 'جارٍ الحفظ…' },
}

// Values stored in the database (French) → how they are shown in each language.
const VALUES = {
  // Statuses
  Nouveau: { en: 'New', ar: 'جديد' },
  Contacté: { en: 'Contacted', ar: 'تم الاتصال' },
  'Pas de réponse': { en: 'No answer', ar: 'لا يرد' },
  Intéressée: { en: 'Interested', ar: 'مهتمة' },
  Intéressé: { en: 'Interested', ar: 'مهتم' },
  'Acompte payé': { en: 'Deposit paid', ar: 'دفع العربون' },
  Confirmée: { en: 'Confirmed', ar: 'مؤكدة' },
  Perdue: { en: 'Lost', ar: 'ضائعة' },
  'Essai programmé': { en: 'Test ride booked', ar: 'تجربة مبرمجة' },
  Vendu: { en: 'Sold', ar: 'تم البيع' },
  Perdu: { en: 'Lost', ar: 'ضائع' },
  // Reasons
  Prix: { en: 'Price', ar: 'السعر' },
  'Date / samedi': { en: 'Date / Saturday', ar: 'التاريخ / السبت' },
  Distance: { en: 'Distance', ar: 'المسافة' },
  Réfléchit: { en: 'Thinking it over', ar: 'يفكر في الأمر' },
  Autre: { en: 'Other', ar: 'أخرى' },
  'Crédit refusé': { en: 'Credit refused', ar: 'رفض القرض' },
  'Concessionnaire trop loin': { en: 'Dealer too far', ar: 'الوكيل بعيد' },
  'Acheté ailleurs': { en: 'Bought elsewhere', ar: 'اشترى من مكان آخر' },
  // Payment
  'Au comptant': { en: 'Cash', ar: 'نقداً' },
  'Crédit à 0 %': { en: '0% credit', ar: 'قرض بدون فوائد' },
  // Sources
  'Landing page': { en: 'Landing page', ar: 'صفحة الهبوط' },
  'Site web': { en: 'Website', ar: 'الموقع الإلكتروني' },
  WhatsApp: { en: 'WhatsApp', ar: 'واتساب' },
  Instagram: { en: 'Instagram', ar: 'انستغرام' },
  'Instagram / Facebook': { en: 'Instagram / Facebook', ar: 'انستغرام / فيسبوك' },
  // Contact preference (Crea'rt landing page)
  'Appel maintenant': { en: 'Call now', ar: 'اتصال الآن' },
  'Appel ce soir': { en: 'Call tonight', ar: 'اتصال هذا المساء' },
  'Appel demain matin': { en: 'Call tomorrow morning', ar: 'اتصال غداً صباحاً' },
  // Field names from the client config
  Atelier: { en: 'Workshop', ar: 'الورشة' },
  ateliers: { en: 'workshops', ar: 'الورشات' },
  Modèle: { en: 'Model', ar: 'الموديل' },
  modèles: { en: 'models', ar: 'الموديلات' },
  Paiement: { en: 'Payment', ar: 'طريقة الدفع' },
  'Non renseigné': { en: 'Not specified', ar: 'غير محدد' },
}

const STORAGE_KEY = 'crm-lang'
let current = 'fr'
try {
  const saved = localStorage.getItem(STORAGE_KEY)
  if (LANGS.some((l) => l.code === saved)) current = saved
} catch {
  // private mode: keep French
}

export function currentLang() {
  return LANGS.find((l) => l.code === current)
}

export function t(key, vars = {}) {
  const entry = UI[key]
  let text = entry ? entry[current] ?? entry.fr : key
  for (const [k, v] of Object.entries(vars)) text = text.replace(`{${k}}`, v)
  return text
}

// Translate a stored value (status, reason, payment…); unknown values are shown as they are.
export function tv(value) {
  if (value === null || value === undefined || current === 'fr') return value
  return VALUES[value]?.[current] ?? value
}

function applyToDocument() {
  const l = currentLang()
  document.documentElement.lang = l.code
  document.documentElement.dir = l.dir
}
applyToDocument()

const LangContext = createContext(null)

export function LangProvider({ children }) {
  const [lang, setLangState] = useState(current)

  useEffect(() => {
    current = lang
    applyToDocument()
    try {
      localStorage.setItem(STORAGE_KEY, lang)
    } catch {
      // ignore
    }
  }, [lang])

  const setLang = (code) => {
    current = code // so t()/tv() are already right during the re-render
    setLangState(code)
  }

  // key={lang} re-renders the whole app in the new language.
  return (
    <LangContext.Provider value={{ lang, setLang }}>
      <div key={lang} className="contents">{children}</div>
    </LangContext.Provider>
  )
}

export function useLang() {
  return useContext(LangContext)
}
