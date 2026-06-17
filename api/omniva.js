// CORS proxy — Omniva pakomātu sarakstam
// Dev: Vite proxy /api/omniva → omniva.lv/locations/json
// Prod: šis Vercel handler

export default async function handler(req, res) {
  try {
    const upstream = await fetch('https://www.omniva.lv/locations/json', {
      headers: { Accept: 'application/json' },
    })
    if (!upstream.ok) return res.status(upstream.status).json({ error: 'Omniva API kļūda' })
    const data = await upstream.json()
    res.setHeader('Cache-Control', 's-maxage=3600') // 1h Vercel cache
    res.setHeader('Access-Control-Allow-Origin', '*')
    return res.status(200).json(data)
  } catch (e) {
    return res.status(502).json({ error: `Proxy kļūda: ${e.message}` })
  }
}
