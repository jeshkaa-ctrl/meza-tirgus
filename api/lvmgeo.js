// CORS proxy — LVM GEO WFS/WMS datu iegūšanai (path-based routing)
// Dev: Vite proxy /api/lvmgeo/* → lvmgeoserver.lvm.lv/geoserver/*
// Prod: šis Vercel handler saņem /api/lvmgeo/* → pārsūta uz geoserver

export default async function handler(req, res) {
  const url = new URL(req.url, `https://${req.headers.host}`)

  // /api/lvmgeo/publicwfs/wfs?... → /geoserver/publicwfs/wfs?...
  const lvmPath = url.pathname.replace(/^\/api\/lvmgeo/, '')
  const targetUrl = `https://lvmgeoserver.lvm.lv/geoserver${lvmPath}${url.search}`

  if (!targetUrl.startsWith('https://lvmgeoserver.lvm.lv/geoserver/')) {
    return res.status(400).json({ error: 'Atļauts tikai lvmgeoserver.lvm.lv/geoserver' })
  }

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
    return res.status(502).json({ error: `Proxy kļūda: ${e.message}` })
  }
}
