export default async function handler(req, res) {
  const { kadastrs } = req.query
  if (!kadastrs || !/^\d{11}$/.test(kadastrs)) {
    return res.status(400).json({ error: 'Nepareizs kadastra numurs' })
  }

  const url = `https://ows.lgia.gov.lv/arcgis/services/Cadastre/` +
    `MapServer/WFSServer?service=WFS&version=2.0.0` +
    `&request=GetFeature&typeNames=Cadastre:ZV` +
    `&CQL_FILTER=KADASTRA_APZIMEJUMS='${kadastrs}'` +
    `&outputFormat=application/json`

  try {
    const r = await fetch(url, {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(8000),
    })
    if (!r.ok) {
      const body = await r.text().catch(() => '')
      return res.status(r.status).json({ error: `VZD ${r.status}: ${body.slice(0, 200)}` })
    }
    const data = await r.json()
    res.setHeader('Cache-Control', 's-maxage=3600')
    return res.status(200).json(data)
  } catch (e) {
    return res.status(502).json({ error: e.message })
  }
}
