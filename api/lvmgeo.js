// CORS proxy — LVM GEO WFS/WMS datu iegūšanai
const ALLOWED_HOST = 'https://lvmgeoserver.lvm.lv/'

export default async function handler(req, res) {
  const { url } = req.query
  if (!url) return res.status(400).json({ error: 'Nav URL parametra' })

  const decoded = decodeURIComponent(url)
  if (!decoded.startsWith(ALLOWED_HOST)) {
    return res.status(400).json({ error: 'Atļauts tikai lvmgeoserver.lvm.lv' })
  }

  try {
    const upstream = await fetch(decoded, {
      headers: { 'Accept': 'application/json, */*' },
    })
    const ct = upstream.headers.get('content-type') || ''
    if (ct.includes('json')) {
      const data = await upstream.json()
      res.setHeader('Cache-Control', 's-maxage=300')
      return res.status(upstream.status).json(data)
    }
    const text = await upstream.text()
    res.setHeader('Content-Type', ct || 'text/plain')
    res.setHeader('Cache-Control', 's-maxage=300')
    return res.status(upstream.status).send(text)
  } catch (e) {
    return res.status(502).json({ error: `Proxy kļūda: ${e.message}` })
  }
}
