export default async function handler(req, res) {
  const { kadastrs } = req.query
  if (!kadastrs || !/^\d{11}$/.test(kadastrs)) {
    return res.status(400).json({ error: 'Nepareizs kadastra numurs' })
  }

  const lvmUrl = `https://lvmgeoserver.lvm.lv/geoserver/publicwfs/wfs?` +
    `service=WFS&version=2.0.0&request=GetFeature` +
    `&typeNames=publicwfs:kkparcel` +
    `&outputFormat=application/json` +
    `&CQL_FILTER=code='${kadastrs}'`

  const vzdUrl = `https://ows.lgia.gov.lv/arcgis/services/Cadastre/` +
    `MapServer/WFSServer?service=WFS&version=2.0.0` +
    `&request=GetFeature&typeNames=Cadastre:ZV` +
    `&CQL_FILTER=KADASTRA_APZIMEJUMS='${kadastrs}'` +
    `&outputFormat=application/json`

  for (const [avots, url] of [['lvm', lvmUrl], ['vzd', vzdUrl]]) {
    try {
      const r = await fetch(url, {
        headers: { Accept: 'application/json' },
        signal: AbortSignal.timeout(8000),
      })
      if (!r.ok) continue
      const data = await r.json()
      if (data?.features?.length > 0) {
        res.setHeader('Cache-Control', 's-maxage=3600')
        res.setHeader('X-Source', avots)
        return res.status(200).json(data)
      }
    } catch { /* nākamais avots */ }
  }

  return res.status(404).json({ error: 'Kadastra robeža nav atrasta' })
}
