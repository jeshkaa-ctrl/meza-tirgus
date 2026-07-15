export default async function handler(req, res) {
  const { kadastrs } = req.query
  if (!kadastrs || !/^\d{11}$/.test(kadastrs)) {
    return res.status(400).json({ error: 'Nepareizs kadastra numurs' })
  }

  const targetUrl = `https://geolatvija.lv/apis/wfs` +
    `?service=WFS&version=2.0.0&request=GetFeature` +
    `&typeNames=publicwfs:kkparcel` +
    `&outputFormat=application/json` +
    `&srsName=EPSG:4326` +
    `&CQL_FILTER=code%3D'${kadastrs}'`

  try {
    const r = await fetch(targetUrl, {
      headers: {
        'Accept': 'application/json, application/xml, */*',
        'User-Agent': 'Mozilla/5.0 (compatible; MezaTirgus/1.0)',
        'Referer': 'https://geolatvija.lv/',
      },
      signal: AbortSignal.timeout(10000),
    })
    const text = await r.text()
    console.log('[vzd] status:', r.status, 'body[:300]:', text.slice(0, 300))
    res.setHeader('Cache-Control', 's-maxage=3600')
    res.setHeader('Content-Type', 'application/json')
    return res.status(r.status).send(text)
  } catch (e) {
    console.error('[vzd] kļūda:', e.message)
    return res.status(502).json({ error: e.message })
  }
}
