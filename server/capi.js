// Meta Conversions API — "QualifiedLead" for Bajaj leads confirmed eligible on the phone.
// Server-side only (Cloudflare Pages Function). Plain JS, no dependencies, testable with Node.
//
// Flow, every ~15 min (Supabase pg_cron -> POST /api/capi-qualified with x-job-secret):
//   1. capi_claim_due(secret): leads eligible for 2 h+, never sent -> capi_sent_at set (claimed)
//   2. one Conversions API request per lead
//   3. Meta error -> capi_release(secret, id) so the next run retries. Never touches the CRM UI.

export const DATASET_ID = '1438254284514631'
export const EVENT_NAME = 'QualifiedLead'
const API_VERSION = 'v23.0'

const enc = new TextEncoder()
export async function sha256(value) {
  const buf = await crypto.subtle.digest('SHA-256', enc.encode(value))
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('')
}

// Moroccan numbers to international digits, as Meta wants before hashing:
// "06 12 34 56 78", "+212 6…", "00212 6…", "212 6…", "612345678" -> "212612345678".
export function normalizePhone(raw) {
  let d = String(raw || '').replace(/\D/g, '')
  if (d.startsWith('00')) d = d.slice(2)
  if (d.startsWith('2120')) d = '212' + d.slice(4) // +212 (0)6…
  if (d.length === 10 && d.startsWith('0')) d = '212' + d.slice(1)
  if (d.length === 9 && /^[5-7]/.test(d)) d = '212' + d
  return d.length >= 8 ? d : ''
}

const clean = (v) => (typeof v === 'string' ? v.trim() : '')

// One lead -> one Conversions API event.
export async function buildEvent(lead) {
  const user_data = {}
  const phone = normalizePhone(lead.telephone)
  if (phone) user_data.ph = [await sha256(phone)]
  const email = clean(lead.email).toLowerCase()
  if (email) user_data.em = [await sha256(email)]
  if (clean(lead.fb_fbc)) user_data.fbc = clean(lead.fb_fbc) // not hashed (Meta spec)
  if (clean(lead.fb_fbp)) user_data.fbp = clean(lead.fb_fbp) // not hashed (Meta spec)

  const custom_data = { event_source: 'crm', lead_event_source: 'Bajaj Maroc CRM' }
  if (clean(lead.paiement)) custom_data.payment_type = clean(lead.paiement)
  if (clean(lead.situation_pro)) custom_data.employment_situation = clean(lead.situation_pro)

  return {
    event_name: EVENT_NAME,
    event_time: Math.floor(new Date(lead.eligible_marked_at).getTime() / 1000),
    event_id: `qlead_${lead.id}`, // stable per lead: Meta drops duplicates with the same id
    action_source: 'system_generated', // Meta's value for lead stages coming from a CRM
    user_data,
    custom_data,
  }
}

async function rpc(env, name, args) {
  const url = env.SUPABASE_URL || env.VITE_SUPABASE_URL
  const key = env.SUPABASE_ANON_KEY || env.VITE_SUPABASE_ANON_KEY
  const res = await fetch(`${url}/rest/v1/rpc/${name}`, {
    method: 'POST',
    headers: { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(args),
  })
  const text = await res.text()
  if (!res.ok) throw new Error(`${name} ${res.status} ${text.slice(0, 300)}`)
  return text ? JSON.parse(text) : null
}

async function sendToMeta(env, event) {
  const body = { data: [event] }
  if (env.META_CAPI_TEST_CODE) body.test_event_code = env.META_CAPI_TEST_CODE
  const res = await fetch(
    `https://graph.facebook.com/${env.META_API_VERSION || API_VERSION}/${DATASET_ID}/events?access_token=${encodeURIComponent(env.META_CAPI_TOKEN)}`,
    { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }
  )
  const json = await res.json().catch(() => null)
  if (!res.ok || !json || json.error) {
    const msg = json?.error ? `${json.error.code || ''} ${json.error.message || ''}`.trim() : `HTTP ${res.status}`
    throw new Error(`Meta: ${msg}`) // never includes the token
  }
  return json
}

// The whole job. Returns a summary; never throws for one lead's failure.
export async function runJob(env, secret, log = console) {
  if (!env.META_CAPI_TOKEN) return { status: 503, body: { ok: false, reason: 'META_CAPI_TOKEN not set' } }
  if (!secret) return { status: 401, body: { ok: false, reason: 'missing secret' } }

  let leads
  try {
    leads = (await rpc(env, 'capi_claim_due', { p_secret: secret, p_limit: 50 })) || []
  } catch (e) {
    const forbidden = /forbidden|42501/.test(e.message)
    log.error('[capi] claim failed:', e.message)
    return { status: forbidden ? 403 : 500, body: { ok: false, reason: forbidden ? 'forbidden' : 'claim failed' } }
  }

  const test = Boolean(env.META_CAPI_TEST_CODE)
  const results = []
  for (const lead of leads) {
    try {
      const meta = await sendToMeta(env, await buildEvent(lead))
      results.push({ id: lead.id, sent: true, events_received: meta.events_received, fbtrace_id: meta.fbtrace_id })
      log.log(`[capi] ${test ? 'TEST ' : ''}QualifiedLead sent for ${lead.id}`, meta.fbtrace_id || '')
      // Test mode: give the lead back, so it is sent for real once the test code is removed.
      if (test) await rpc(env, 'capi_release', { p_secret: secret, p_id: lead.id }).catch((e) => log.error('[capi] release failed:', e.message))
    } catch (e) {
      log.error(`[capi] send failed for ${lead.id}:`, e.message)
      results.push({ id: lead.id, sent: false, error: e.message })
      await rpc(env, 'capi_release', { p_secret: secret, p_id: lead.id }).catch((e2) =>
        log.error('[capi] release failed (lead stays claimed):', e2.message)
      )
    }
  }
  return { status: 200, body: { ok: true, test_mode: test, due: leads.length, results } }
}
