// Cloudflare Pages Function: POST /api/capi-qualified
// Called every 15 min by Supabase pg_cron (supabase/migrations/20261107_bajaj_capi_cron.sql).
// Env (Cloudflare Pages > Settings > Variables and secrets):
//   META_CAPI_TOKEN      (secret, required)  Conversions API access token
//   META_CAPI_TEST_CODE  (optional)          e.g. TEST12345 -> events go to Events Manager > Test Events
//   VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY (already set for the CRM)
import { runJob } from '../../server/capi.js'

export async function onRequestPost({ request, env }) {
  let result
  try {
    result = await runJob(env, request.headers.get('x-job-secret'))
  } catch (e) {
    console.error('[capi] job error:', e && e.message)
    result = { status: 500, body: { ok: false, reason: 'job error' } }
  }
  return new Response(JSON.stringify(result.body), {
    status: result.status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  })
}

export const onRequest = () => new Response('Method not allowed', { status: 405 })
