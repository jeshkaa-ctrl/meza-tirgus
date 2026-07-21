// Atjaunina nogabala ģeometriju meza_nogabali.geom via PostGIS RPC
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { id, geojson } = req.body || {}
  if (!id || !geojson) return res.status(400).json({ error: 'id un geojson ir obligāti' })

  const sbUrl = process.env.VITE_SUPABASE_URL
  const sbKey = process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY
  if (!sbUrl || !sbKey) return res.status(503).json({ error: 'Servera konfigurācijas kļūda' })

  try {
    const url = `${sbUrl}/rest/v1/rpc/update_nogabals_geom`
    const r = await fetch(url, {
      method: 'POST',
      headers: {
        'apikey': sbKey,
        'Authorization': `Bearer ${sbKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal',
      },
      body: JSON.stringify({ p_id: Number(id), p_geojson: JSON.stringify(geojson) }),
      signal: AbortSignal.timeout(10000),
    })
    if (!r.ok) {
      const txt = await r.text()
      return res.status(500).json({ error: txt })
    }
    return res.status(200).json({ ok: true })
  } catch (e) {
    return res.status(503).json({ error: e.message })
  }
}
