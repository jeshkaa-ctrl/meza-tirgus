// CORS proxy — VZD/GeoLatvija WFS kadastra datu iegūšanai
// Dev: Vite proxy /api/vzd → geolatvija.lv/apis/wfs
// Prod: šis Vercel handler saņem /api/vzd?... → pārsūta uz geolatvija.lv

export default async function handler(req, res) {
  const url = new URL(req.url, `https://${req.headers.host}`)
  const targetUrl = `https://geolatvija.lv/apis/wfs${url.search}`

  try {
    const upstream = await fetch(targetUrl, {
      headers: { Accept: 'application/json, */*' },
    })
    const ct = upstream.headers.get('content-type') || ''
    res.setHeader('Cache-Control', 's-maxage=300')
    if (ct.includes('json')) {
      const data = await upstream.json()
      return res.status(upstream.status).json(data)
    }
    const text = await upstream.text()
    res.setHeader('Content-Type', ct || 'text/plain')
    return res.status(upstream.status).send(text)
  } catch (e) {
    return res.status(502).json({ error: `VZD proxy kļūda: ${e.message}` })
  }
}
