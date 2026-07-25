// Nogabalu ģeometrijas API — apvieno snapshot-geom.js un update-geom.js
// action=saglabat  — saglabā kadastrs sākotnējo stāvokli (bulk snapshot)
// action=atgriezt  — atjauno viena nogabala sākotnējo ģeometriju
// action=update    — atjaunina nogabala ģeometriju (update_nogabals_geom RPC)
import { acmValidetToken } from '../src/utils/acm.js'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const token  = req.headers['x-acm-token']
  const sesija = req.headers['x-acm-sesija']
  if (!acmValidetToken(token, sesija)) return res.status(403).json({ error: 'ACM_BLOCKED' })

  const sbUrl = process.env.VITE_SUPABASE_URL
  const sbKey = process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY
  if (!sbUrl || !sbKey) return res.status(503).json({ error: 'Servera konfigurācijas kļūda' })

  const h = {
    'apikey':        sbKey,
    'Authorization': `Bearer ${sbKey}`,
    'Content-Type':  'application/json',
  }

  const { action, kadastrs, nogabala_id, id, geojson } = req.body || {}

  try {
    // ── Ģeometrijas tiešs atjauninājums ─────────────────────────────────────────
    if (action === 'update') {
      if (!id || !geojson) return res.status(400).json({ error: 'id un geojson ir obligāti' })
      const r = await fetch(`${sbUrl}/rest/v1/rpc/update_nogabals_geom`, {
        method: 'POST',
        headers: { ...h, Prefer: 'return=minimal' },
        body: JSON.stringify({ p_id: Number(id), p_geojson: JSON.stringify(geojson) }),
        signal: AbortSignal.timeout(10000),
      })
      if (!r.ok) return res.status(500).json({ error: await r.text() })
      return res.status(200).json({ ok: true })
    }

    // ── Sākotnējā ģeometrija atjaunošana ────────────────────────────────────────
    if (action === 'atgriezt') {
      if (!nogabala_id) return res.status(400).json({ error: 'nogabala_id ir obligāts' })
      const r = await fetch(`${sbUrl}/rest/v1/rpc/atgriezt_sakotneju_geom`, {
        method: 'POST',
        headers: h,
        body: JSON.stringify({ p_id: Number(nogabala_id) }),
        signal: AbortSignal.timeout(10000),
      })
      const data = await r.json()
      if (!r.ok) return res.status(500).json({ error: JSON.stringify(data) })
      if (!data) return res.status(404).json({ error: 'Momentuzņēmums nav atrasts šim nogabalam' })
      return res.status(200).json({ geojson: data })
    }

    // ── Kadastrs snapshot saglabāšana (action=saglabat vai noklusējums) ──────────
    if (!kadastrs) return res.status(400).json({ error: 'kadastrs ir obligāts' })
    const r = await fetch(`${sbUrl}/rest/v1/rpc/saglabat_kadastrs_snapshots`, {
      method: 'POST',
      headers: h,
      body: JSON.stringify({ p_kadastrs: kadastrs }),
      signal: AbortSignal.timeout(15000),
    })
    const data = await r.json()
    if (!r.ok) return res.status(500).json({ error: JSON.stringify(data) })
    return res.status(200).json({ saglabati: data })
  } catch (e) {
    return res.status(503).json({ error: e.message })
  }
}
