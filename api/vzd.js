// CORS proxy — VZD/GeoLatvija WFS kadastra datu iegūšanai
// Dev: Vite proxy /api/vzd → geolatvija.lv/apis/wfs
// Prod: šis Vercel handler saņem /api/vzd?... → pārsūta uz geolatvija.lv

export default async function handler(req, res) {
  // Izvelk query string tieši no req.url — droši pret Vercel URL parsēšanas niansi
  const qs = req.url.includes('?') ? req.url.slice(req.url.indexOf('?')) : ''
  const targetUrl = `https://geolatvija.lv/apis/wfs${qs}`
  console.log('[VZD proxy] →', targetUrl)

  try {
    const upstream = await fetch(targetUrl, {
      headers: {
        'Accept': 'application/json, application/xml, */*',
        'User-Agent': 'Mozilla/5.0 (compatible; MezaTirgus/1.0)',
        'Referer': 'https://geolatvija.lv/',
      },
      redirect: 'follow',
    })
    const ct = upstream.headers.get('content-type') || ''
    res.setHeader('Cache-Control', 's-maxage=300')
    const text = await upstream.text()
    console.log('[VZD proxy] status:', upstream.status, 'ct:', ct, 'body[:200]:', text.slice(0,200))
    if (ct.includes('json') || text.trimStart().startsWith('{')) {
      try { return res.status(upstream.status).json(JSON.parse(text)) } catch {}
    }
    res.setHeader('Content-Type', ct || 'text/plain')
    return res.status(upstream.status).send(text)
  } catch (e) {
    return res.status(502).json({ error: `VZD proxy kļūda: ${e.message}` })
  }
}
