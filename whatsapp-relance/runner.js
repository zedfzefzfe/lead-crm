// Relance WhatsApp — Crea'rt. Programme d'envoi piloté depuis le CRM (page "Relance WhatsApp").
// Même messages et même cadence que send.js. Le QR, le numéro connecté et la progression
// s'affichent dans le CRM ; les boutons du CRM (Tester / Lancer / Pause / Déconnecter) pilotent ce programme.
// NUMÉRO SECONDAIRE UNIQUEMENT.
const { Client, LocalAuth } = require('whatsapp-web.js');
const fs = require('fs');
const path = require('path');

// ---------- .env (à côté de ce fichier) ----------
try {
  for (const line of fs.readFileSync(path.join(__dirname, '.env'), 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
    if (m && process.env[m[1]] === undefined) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
} catch (e) {}

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://shudwpehmotlgocrhrbo.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_KEY || 'sb_publishable_BTfHN9iSWtQu2-yOHsjCSQ_J_vVyv-O'; // clé publique
const RELANCE_TOKEN = process.env.RELANCE_TOKEN || '';      // clé du programme (CRM > Relance WhatsApp, admin)
const ALLOWED = (process.env.WA_ALLOWED_NUMBER || '').replace(/\D/g, ''); // numéro secondaire autorisé (optionnel)

if (!RELANCE_TOKEN) {
  console.error('❌ RELANCE_TOKEN manquant : copie la clé affichée dans le CRM (Relance WhatsApp) dans le fichier .env');
  process.exit(1);
}

// ===================== REGLAGES (identiques à send.js) =====================
const PER_BATCH       = 25;        // messages par lot
const MSG_MIN         = 50;        // secondes min entre 2 messages
const MSG_MAX         = 90;        // secondes max entre 2 messages
const BATCH_PAUSE_MIN = 45 * 60;   // pause entre lots (secondes) -> 45 min
const DAILY_MAX       = Number(process.env.DAILY_MAX || 70); // max d'envois réels par jour (heure du Maroc)

// Étape 1 : salutation seule (une des deux, au hasard). {nom} vide => sans prénom.
const GREETINGS = [
  'سلام {nom}، كنتمنى تكوني بخير',
  'سلام {nom}، لاباس عليك؟',
];
// Étape 2 : envoyé seulement quand la personne a répondu à la salutation.
const FOLLOWUP = 'بغيت غير نعلمك، حيت كنتي مهتمة بالفورماسيون ديال الشموع، عندنا فورماسيون جديدة نهار 15 نونبر إن شاء الله فكازا، ولكن الكروب صغير بزاف. واش نخلي ليك بلاصتك معانا؟';
const greetingFor = l => pick(GREETINGS).replace(l.prenom ? '{nom}' : ' {nom}', l.prenom || '');
const FOLLOW_MIN = 25, FOLLOW_MAX = 60; // secondes avant de répondre (comme une personne)
// ==========================================================================

const LEADS_FILE = path.join(__dirname, 'leads.json');
const SENT_FILE  = path.join(__dirname, 'sent.json');
const leads = JSON.parse(fs.readFileSync(LEADS_FILE, 'utf8'));
let sent = {};
try { sent = JSON.parse(fs.readFileSync(SENT_FILE, 'utf8')); } catch (e) {}
const save  = () => fs.writeFileSync(SENT_FILE, JSON.stringify(sent));
// greeted.json : salutation envoyée {num: date} ; followup.json : message 2 envoyé {num: date}.
const GREET_FILE = path.join(__dirname, 'greeted.json'), FOLLOW_FILE = path.join(__dirname, 'followup.json');
const readJson = f => { try { return JSON.parse(fs.readFileSync(f, 'utf8')); } catch (e) { return {}; } };
const greeted = readJson(GREET_FILE), followed = readJson(FOLLOW_FILE);
const saveGreet = () => fs.writeFileSync(GREET_FILE, JSON.stringify(greeted));
const saveFollow = () => fs.writeFileSync(FOLLOW_FILE, JSON.stringify(followed));
const rand  = (a, b) => a + Math.random() * (b - a);
const pick  = a => a[Math.floor(Math.random() * a.length)];
const todoList = () => leads.filter(l => l.num && !sent[l.num]);

// ---------- Lien avec le CRM (Supabase) ----------
let pending = {}, logs = [];
const report = patch => Object.assign(pending, patch);
const log = m => { console.log(m); logs.push({ t: new Date().toISOString(), m }); };

async function sync() {
  const body = { ...pending, log_add: logs };
  pending = {}; logs = [];
  try {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/rpc/wa_relance_sync`, {
      method: 'POST',
      headers: { apikey: SUPABASE_KEY, 'Content-Type': 'application/json', 'x-relance-token': RELANCE_TOKEN },
      body: JSON.stringify({ p_state: body }),
    });
    if (!r.ok) throw new Error(`${r.status} ${await r.text()}`);
    return await r.json(); // commande en attente (ou null)
  } catch (e) {
    pending = { ...body, ...pending }; delete pending.log_add; // on renverra au prochain tour
    logs = [...(body.log_add || []), ...logs];
    console.log('⚠️  CRM injoignable : ' + e.message.slice(0, 200));
    return null;
  }
}

// ---------- WhatsApp ----------
let client, connected = false, running = false, stopAsked = false;

// pairNumber : lier avec un code à 8 lettres pour ce numéro (mode intégré de whatsapp-web.js,
// qui redemande le code tout seul après les rechargements de WhatsApp Web).
function makeClient(pairNumber) {
  const c = new Client({
    authStrategy: new LocalAuth({ dataPath: path.join(__dirname, '.wwebjs_auth') }),
    ...(pairNumber ? { pairWithPhoneNumber: { phoneNumber: pairNumber, showNotification: true } } : {}),
    // handleSIG*: false -> Ctrl+C passe par shutdown() (prévient le CRM avant de fermer).
    puppeteer: { args: ['--no-sandbox', '--disable-setuid-sandbox'], handleSIGINT: false, handleSIGTERM: false, handleSIGHUP: false },
  });
  c.on('qr', qr => {
    connected = false;
    report({ status: 'qr', qr, wa_number: null, wa_name: null, pair_code: null, pair_number: null });
    console.log('📱 Nouveau QR affiché dans le CRM (page Relance WhatsApp).');
  });
  c.on('code', code => { report({ status: 'qr', qr: null, pair_code: code, pair_number: pairNumber }); log(`🔢 Code de liaison pour +${pairNumber} : ${code}`); });
  c.on('authenticated', () => report({ status: 'starting', qr: null, pair_code: null, message: 'Lien accepté, connexion…' }));
  c.on('auth_failure', m => { report({ status: 'error', message: 'Échec de connexion WhatsApp : ' + m }); log('❌ échec connexion : ' + m); });
  c.on('ready', async () => {
    const num = c.info?.wid?.user || '';
    if (ALLOWED && num !== ALLOWED) {
      log(`⛔ Numéro ${num} refusé : seul le numéro secondaire ${ALLOWED} est autorisé. Déconnexion.`);
      report({ status: 'error', message: `Mauvais numéro (${num}) : déconnecté. Scanne avec le numéro secondaire.` });
      await relink();
      return;
    }
    connected = true;
    const n = todoList().length;
    report({ status: 'connected', qr: null, pair_code: null, pair_number: null, wa_number: num, wa_name: c.info?.pushname || '', remaining: n,
             message: `Connecté. ${n} personne(s) restent à contacter.` });
    log(`✅ Connecté : +${num} (${c.info?.pushname || ''})`);
    setTimeout(() => catchUpReplies().catch(e => log('❌ réponses : ' + e.message)), 10000);
  });
  c.on('message', msg => onIncoming(msg).catch(e => log('❌ réponse : ' + e.message)));
  c.on('disconnected', async reason => {
    // 'LOGOUT' = WhatsApp Web recharge sa page (par ex. pendant la liaison) : la bibliothèque
    // s'en occupe toute seule. Fermer le navigateur à ce moment-là faisait planter le programme.
    if (reason === 'LOGOUT' && !connected) { console.log('↻ WhatsApp Web se recharge…'); return; }
    connected = false; stopAsked = true;
    log('🔌 WhatsApp déconnecté : ' + reason);
    report({ status: 'starting', wa_number: null, wa_name: null, message: 'Déconnecté, nouveau QR…' });
    await relink(false);
  });
  return c;
}

// Ouvre WhatsApp ; si la page ne charge pas (réseau), réessaie toute seule après 20 s.
// Après 2 échecs de suite, la session enregistrée est sans doute abîmée : on l'efface (il faudra rescanner).
let startFails = 0;
let pairNumber = null;
function start() {
  client = makeClient(pairNumber);
  client.initialize().then(() => { startFails = 0; }).catch(async e => {
    startFails++;
    log('❌ Ouverture de WhatsApp échouée (' + e.message + '). Nouvel essai dans 20 s…');
    report({ status: 'starting', message: 'WhatsApp ne répond pas, nouvel essai…' });
    try { await client.destroy(); } catch (x) {}
    if (startFails >= 2) {
      try { fs.renameSync(path.join(__dirname, '.wwebjs_auth'), path.join(__dirname, '.wwebjs_auth.bak-' + Date.now())); } catch (x) {}
      log('🧹 Session WhatsApp enregistrée effacée (abîmée) : un nouveau QR va s\'afficher.');
      startFails = 0;
    }
    setTimeout(start, 20000);
  });
}

let relinking = false;
async function relink(doLogout = true) {
  if (relinking) return; relinking = true;
  connected = false; stopAsked = true;
  pairNumber = null; // après une déconnexion, on revient au QR
  try { if (doLogout) await client.logout(); } catch (e) {}
  try { await client.destroy(); } catch (e) {}
  // Retire la session enregistrée : le prochain QR repart de zéro.
  try { fs.rmSync(path.join(__dirname, '.wwebjs_auth'), { recursive: true, force: true }); } catch (e) {}
  report({ status: 'starting', qr: null, pair_code: null, pair_number: null, wa_number: null, wa_name: null });
  start();
  relinking = false;
}

// Attente coupable par le bouton Pause (vérifie chaque seconde).
async function wait(seconds) {
  const end = Date.now() + seconds * 1000;
  report({ next_at: new Date(end).toISOString() });
  while (Date.now() < end && !stopAsked) await new Promise(r => setTimeout(r, 1000));
  report({ next_at: null });
}

// Un des 3 messages déjà envoyé depuis ce numéro à cette personne ? (ils contiennent tous « 15 نونبر »)
const MARK = '15 نونبر';
async function alreadySent(chatId) {
  try {
    const chat = await client.getChatById(chatId);
    const msgs = await chat.fetchMessages({ limit: 30 });
    return msgs.some(m => m.fromMe && (m.body || '').includes(MARK));
  } catch (e) {
    return false; // pas encore de conversation avec cette personne
  }
}

// Jour au Maroc (YYYY-MM-DD) et nombre de messages réellement envoyés ce jour-là (d'après sent.json).
const dayMA = d => new Intl.DateTimeFormat('en-CA', { timeZone: 'Africa/Casablanca' }).format(d);
const sentToday = () => Object.values(sent).filter(v => /^\d{4}-/.test(v) && dayMA(new Date(v)) === dayMA(new Date())).length;

// ---------- Étape 2 : quand une personne saluée répond, on envoie le message de la formation ----------
const followQueue = []; let following = false;
function queueFollow(num, chatId) {
  if (followed[num] || followQueue.some(q => q.num === num)) return;
  followQueue.push({ num, chatId });
  if (!following) processFollow();
}
async function processFollow() {
  following = true;
  while (followQueue.length) {
    const { num, chatId } = followQueue.shift();
    if (followed[num]) continue;
    await new Promise(r => setTimeout(r, rand(FOLLOW_MIN, FOLLOW_MAX) * 1000));
    if (!connected) { followQueue.unshift({ num, chatId }); break; }
    const l = leads.find(x => x.num === num) || { nom: num };
    try {
      await client.sendMessage(chatId, FOLLOWUP);
      followed[num] = new Date().toISOString(); saveFollow();
      log(`💬 ${l.nom} (${num}) a répondu → message de la formation envoyé.`);
    } catch (e) { log(`❌ message 2 pour ${l.nom} (${num}) : ${e.message}`); }
  }
  following = false;
}
async function onIncoming(msg) {
  if (msg.fromMe || msg.isStatus || (msg.from || '').endsWith('@g.us')) return;
  let num = (msg.from || '').split('@')[0];
  if (!greeted[num]) { try { num = (await msg.getContact()).number || num; } catch (e) {} }
  if (greeted[num] && !followed[num]) queueFollow(num, msg.from);
}
// Au démarrage : réponses arrivées pendant que le programme était éteint.
async function catchUpReplies() {
  const nums = Object.keys(greeted).filter(n => !followed[n]);
  if (!nums.length) return;
  let found = 0;
  for (const num of nums) {
    if (!connected) return;
    try {
      const chat = await client.getChatById(num + '@c.us');
      const msgs = await chat.fetchMessages({ limit: 10 });
      const since = new Date(greeted[num]).getTime();
      if (msgs.some(m => !m.fromMe && m.timestamp * 1000 > since)) { found++; queueFollow(num, chat.id._serialized); }
    } catch (e) {}
  }
  log(`🔎 Réponses vérifiées : ${found} personne(s) ont répondu pendant l'arrêt.`);
}

async function run(dry) {
  if (!dry && sentToday() >= DAILY_MAX) {
    log(`🛑 Limite du jour atteinte (${DAILY_MAX} messages). Reprends demain avec « Lancer l'envoi ».`);
    report({ status: 'paused', message: `Limite du jour atteinte (${DAILY_MAX}). Reprends demain.` });
    return;
  }
  running = true; stopAsked = false;
  let dailyStop = false;
  const todo = todoList();
  let done = 0, failed = 0, skipped = 0, inBatch = 0;
  const left = () => todo.length - done - failed - skipped;
  report({ status: dry ? 'testing' : 'sending', dry_run: dry, total: todo.length, done, failed, skipped,
           remaining: todo.length, message: null, next_at: null });
  log(`▶️  ${todo.length} à ${dry ? 'tester (rien n\'est envoyé)' : 'envoyer'}, par lots de ${PER_BATCH}` +
      (dry ? '' : ` — max ${DAILY_MAX} aujourd'hui (déjà ${sentToday()})`));

  for (const l of todo) {
    if (stopAsked) break;
    const text = greetingFor(l);
    try {
      if (dry) {
        log(`• (test) ${l.nom}  ${l.num}  →  ${text}`);
      } else {
        const reg = await client.getNumberId(l.num);           // le numero est-il sur WhatsApp ?
        if (!reg) {
          log(`⚠️  pas sur WhatsApp, ignoré : ${l.nom} (${l.num})`);
          sent[l.num] = 'no-wa'; save(); skipped++;
          report({ skipped, remaining: left() });
          continue;
        }
        // Sécurité anti-doublon : si la relance est déjà dans la conversation (envoyée avant un
        // redémarrage, même sans sent.json), on n'envoie pas une 2e fois.
        if (await alreadySent(reg._serialized)) {
          log(`↩️  déjà relancé(e), ignoré : ${l.nom} (${l.num})`);
          sent[l.num] = 'already'; save(); skipped++;
          report({ skipped, remaining: left() });
          continue;
        }
        await client.sendMessage(reg._serialized, text);
        sent[l.num] = greeted[l.num] = new Date().toISOString(); save(); saveGreet();
      }
      done++; inBatch++;
      if (!dry) log(`✅ ${done}. ${l.nom}  (${l.num})`);
      if (!dry && sentToday() >= DAILY_MAX) dailyStop = true;
    } catch (e) {
      log(`❌ erreur ${l.nom} (${l.num}) : ${e.message}`);
      if (!dry) { sent[l.num] = 'error'; save(); }
      failed++;
    }
    report({ done, failed, remaining: left() });
    if (dry) { if (inBatch >= PER_BATCH) { inBatch = 0; log(`--- fin du lot de ${PER_BATCH} (pause ~${Math.round(BATCH_PAUSE_MIN / 60)} min en réel) ---`); } continue; }
    if (left() === 0) break;
    if (dailyStop) break;
    if (inBatch >= PER_BATCH) {
      inBatch = 0;
      log(`⏸️  Lot de ${PER_BATCH} terminé. Pause ~${Math.round(BATCH_PAUSE_MIN / 60)} min…`);
      await wait(BATCH_PAUSE_MIN + rand(0, 300));
    } else {
      await wait(rand(MSG_MIN, MSG_MAX));
    }
  }

  running = false;
  const stopped = stopAsked && left() > 0;
  stopAsked = false;
  if (dry) {
    log(`🧪 Test terminé : ${done} personne(s) seraient contactées. Rien n'a été envoyé.`);
    report({ status: connected ? 'connected' : 'starting', remaining: todoList().length,
             message: `Test OK : ${done} personne(s) seraient contactées. Rien n'a été envoyé.` });
  } else if (dailyStop && left() > 0) {
    log(`🛑 Limite du jour atteinte : ${DAILY_MAX} messages aujourd'hui. ${left()} restant(s) → demain, clique « Reprendre l'envoi ».`);
    report({ status: 'paused', remaining: todoList().length,
             message: `Limite du jour (${DAILY_MAX}) atteinte. ${left()} restant(s) : reprends demain avec « Reprendre l'envoi ».` });
  } else if (stopped) {
    log(`⏸️  En pause. ${done} envoyé(s) ; ${left()} restant(s). « Lancer l'envoi » reprend où on s'est arrêté.`);
    report({ status: connected ? 'paused' : 'starting', remaining: todoList().length, message: `En pause après ${done} envoi(s).` });
  } else {
    log(`🎉 Fini. ${done} messages envoyés, ${failed} erreur(s), ${skipped} pas sur WhatsApp.`);
    report({ status: 'done', remaining: todoList().length, message: `Fini : ${done} envoyés, ${failed} erreurs, ${skipped} pas sur WhatsApp.` });
  }
}

async function handle(c) {
  if (!c || !c.command) return;
  const cmd = c.command;
  log(`🖱️  Commande reçue : ${cmd}`);
  if (cmd === 'pair') {
    const num = String(c.arg || '').replace(/\D/g, '');
    if (connected) return log('ℹ️  Déjà connecté : déconnecte d\'abord ce numéro.');
    if (num.length < 10) return log('ℹ️  Numéro invalide pour le code (format 2126XXXXXXXX).');
    if (ALLOWED && num !== ALLOWED) return log(`⛔ Code refusé : seul le numéro secondaire ${ALLOWED} est autorisé.`);
    report({ pair_number: num, pair_code: null, message: 'Demande du code…' });
    log(`🔢 Code de liaison demandé pour +${num}…`);
    // Relance WhatsApp en mode « code » pour ce numéro ; le code arrive par l'événement 'code'.
    pairNumber = num;
    try { await client.destroy(); } catch (e) {}
    start();
    return;
  }
  if (cmd === 'pause') { if (running) stopAsked = true; return; }
  if (cmd === 'logout') { log('🔌 Déconnexion du numéro demandée.'); await relink(); return; }
  if (cmd === 'test' || cmd === 'start') {
    if (running) return log('ℹ️  Un envoi est déjà en cours.');
    if (!connected) return log('ℹ️  WhatsApp n\'est pas connecté : scanne d\'abord le QR.');
    run(cmd === 'test').catch(e => { running = false; log('❌ ' + e.message); report({ status: 'error', message: e.message }); });
  }
}

// Boucle CRM : envoie l'état, récupère les clics (toutes les 4 s).
(async function loop() {
  for (;;) {
    const cmd = await sync();
    await handle(cmd).catch(e => log('❌ ' + e.message));
    await new Promise(r => setTimeout(r, 4000));
  }
})();

async function shutdown() {
  stopAsked = true;
  report({ status: 'offline', qr: null, next_at: null, message: 'Programme d\'envoi arrêté.' });
  await sync();
  try { await client.destroy(); } catch (e) {}
  process.exit(0);
}
// Une erreur imprévue ne doit jamais arrêter l'envoi : on la note et on rouvre WhatsApp.
let recovering = false;
async function recover(e) {
  const msg = e && e.message ? e.message : String(e);
  // Pendant la liaison, WhatsApp Web recharge sa page : ces erreurs sont normales et la
  // bibliothèque continue toute seule. Fermer le navigateur ici cassait la liaison.
  if (!connected && /Execution context was destroyed|detached Frame|Target closed|navigation/i.test(msg)) {
    console.log('↻ (rechargement pendant la liaison, ignoré) ' + msg);
    return;
  }
  log('❌ Erreur imprévue : ' + msg);
  if (recovering) return; recovering = true;
  connected = false; stopAsked = true;
  try { await client.destroy(); } catch (x) {}
  setTimeout(() => { recovering = false; start(); }, 5000);
}
process.on('uncaughtException', recover);
process.on('unhandledRejection', recover);
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

report({ status: 'starting', qr: null, pair_code: null, pair_number: null, wa_number: null, wa_name: null, remaining: todoList().length,
         message: 'Programme démarré, ouverture de WhatsApp…' });
log(`🚀 Programme d'envoi démarré (${leads.length} leads, ${todoList().length} restant(s)).`);
start();
