export default async function handler(req, res) {
  const { kadastrs } = req.query
  if (!kadastrs || !/^\d{11}$/.test(kadastrs)) {
    return res.status(400).json({ error: 'Nepareizs kadastra numurs' })
  }

  // Mēģina geolatvija.lv WFS (prasa pārlūka sesiju — no servera bloķēts)
  const targetUrl = `https://geolatvija.lv/apis/wfs` +
    `?service=WFS&version=2.0.0&request=GetFeature` +
    `&typeNames=publicwfs:kkparcel` +
    `&outputFormat=application/json` +
    `&srsName=EPSG:4326` +
    `&CQL_FILTER=code%3D'${kadastrs}'`

  try {
    const r = await fetch(targetUrl, {
      headers: {
        'Accept': 'application/json, application/xml',
        'User-Agent': 'Mozilla/5.0 (compatible; MezaTirgus/1.0)',
        'Referer': 'https://geolatvija.lv/',
      },
      signal: AbortSignal.timeout(10000),
    })

    const text = await r.text()

    // Atklāj HTML atbildes (geolatvija bloķē bez sesijas)
    if (text.trim().startsWith('<') || text.includes('<!doctype')) {
      console.warn('[vzd] geolatvija.lv atgrieza HTML — serviss prasa autentifikāciju')
      return res.status(503).json({ error: 'Kadastra robežu serviss nav pieejams' })
    }

    const data = JSON.parse(text)
    if (!data?.features?.length) {
      return res.status(404).json({ error: 'Kadastra vienība nav atrasta', kadastrs })
    }

    res.setHeader('Cache-Control', 's-maxage=3600')
    res.setHeader('Content-Type', 'application/json')
    return res.status(200).json(data)

  } catch (e) {
    console.error('[vzd] kļūda:', e.message)
    return res.status(503).json({ error: 'Kadastra robežu serviss nav pieejams: ' + e.message })
  }
}
