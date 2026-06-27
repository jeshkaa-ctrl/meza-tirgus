// CORS proxy — VZD/GeoLatvija WFS kadastra datu iegūšanai
// Vercel aizpilda req.query automātiski — droši pārsūta uz geolatvija.lv

export default async function handler(req, res) {
  const params = new URLSearchParams(req.query).toString()
  const targetUrl = `https://geolatvija.lv/apis/wfs?${params}`
  console.log('[VZD proxy] →', targetUrl)

  try {
    const upstream = await fetch(targetUrl, {
      headers: {
        'Accept': 'application/json, application/xml, */*',
        'User-Agent': 'Mozilla/5.0 (compatible; MezaTirgus/1.0)',
        'Referer': 'https://geolatvija.lv/',
      },
    })
    const text = await upstream.text()
    console.log('[VZD proxy] status:', upstream.status, 'body[:200]:', text.slice(0, 200))
    res.setHeader('Content-Type', 'application/json')
    res.status(upstream.status).send(text)
  } catch (e) {
    console.error('[VZD proxy] kļūda:', e.message)
    res.status(502).json({ error: `VZD proxy kļūda: ${e.message}` })
  }
}
