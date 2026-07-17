export default async function handler(req, res) {
  const { kadastrs } = req.query
  if (!kadastrs || !/^\d{11}$/.test(kadastrs)) {
    return res.status(400).json({ error: 'Nepareizs kadastra numurs' })
  }

  const sbUrl = process.env.VITE_SUPABASE_URL
  const sbKey = process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY

  if (!sbUrl || !sbKey) {
    return res.status(503).json({ error: 'Servera konfigurācijas kļūda' })
  }

  try {
    // Vaicā kadastru_robezas_geo skatu — geometry atgriežas kā parsēts JSON objekts
    const url = `${sbUrl}/rest/v1/kadastru_robezas_geo` +
      `?kadastrs=eq.${encodeURIComponent(kadastrs)}` +
      `&select=kadastrs,area_m2,geometry` +
      `&limit=1`

    const r = await fetch(url, {
      headers: {
        'apikey':        sbKey,
        'Authorization': `Bearer ${sbKey}`,
        'Accept':        'application/json',
      },
      signal: AbortSignal.timeout(8000),
    })

    if (!r.ok) {
      const body = await r.text()
      console.error('[vzd] Supabase kļūda:', r.status, body)
      return res.status(503).json({ error: 'Kadastra robežu serviss nav pieejams' })
    }

    const rows = await r.json()

    if (!rows?.length || !rows[0].geometry) {
      return res.status(404).json({ error: 'Kadastra vienība nav atrasta', kadastrs })
    }

    const { geometry, area_m2 } = rows[0]

    // Atgriežam GeoJSON FeatureCollection ko MezaApsaimniekosanasPlans.jsx
    // izmanto kā kadGeom: features[0] = kadFeat
    res.setHeader('Cache-Control', 's-maxage=86400')
    res.setHeader('Content-Type', 'application/json')
    return res.status(200).json({
      type:     'FeatureCollection',
      features: [{
        type:       'Feature',
        id:         kadastrs,
        geometry,
        properties: { kadastrs, area_m2 },
      }],
    })

  } catch (e) {
    console.error('[vzd] kļūda:', e.message)
    return res.status(503).json({ error: 'Kadastra robežu serviss nav pieejams: ' + e.message })
  }
}
