import { useEffect, useRef } from 'react'
import { C as DS } from '../ds'
import { NOGABALA_KRASA, SUGAS_KRASA, getVecumaGrupa, getLemumKrasa } from './constants'

const SLANU_POGAS = [
  { id:'nogabali', label:'🌲 Nogabali'    },
  { id:'dap',      label:'🔒 Aizsardzība' },
  { id:'kadastra', label:'📐 Kadastra'    },
  { id:'ortofoto', label:'🛰 Ortofoto'    },
]

export default function IpasumKarte({ kadGeom, editData, dapTer, slani, setSlani }) {
  const mapRef     = useRef(null)
  const leafletRef = useRef(null)
  const layersRef  = useRef({})

  useEffect(() => {
    if (!mapRef.current) return
    const init = async () => {
      const L = (await import('leaflet')).default
      if (leafletRef.current) { leafletRef.current.remove(); leafletRef.current = null; layersRef.current = {} }

      const map = L.map(mapRef.current, { zoomControl: true, attributionControl: false })
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 20 }).addTo(map)
      leafletRef.current = map

      if (slani.ortofoto) {
        layersRef.current.ortofoto = L.tileLayer.wms(
          'https://lvmgeoserver.lvm.lv/geoserver/ows?',
          { layers:'publicwms:ortofoto_2023', format:'image/png', transparent:true, opacity:0.9 }
        ).addTo(map)
      }

      if (slani.kadastra && kadGeom) {
        const kl = L.geoJSON(kadGeom, {
          style: { color:'#00BFFF', weight:3, fillOpacity:0 },
        }).addTo(map)
        layersRef.current.kadLayer = kl
        map.fitBounds(kl.getBounds(), { padding:[30,30] })

        const geom = kadGeom.geometry
        if (geom?.coordinates) {
          const ring = geom.type === 'Polygon' ? geom.coordinates[0] : geom.coordinates[0][0]
          layersRef.current.kadPoints = ring.slice(0,-1).map((coord, idx) => {
            const cm = L.circleMarker([coord[1], coord[0]], {
              radius:4, color:'#00BFFF', fillColor:'#ffffff', fillOpacity:1, weight:2,
            }).addTo(map)
            cm.bindTooltip(String(idx+1), { permanent:false, direction:'top' })
            return cm
          })
        }
      }

      if (slani.nogabali && editData.length > 0) {
        const nl = L.geoJSON(
          { type:'FeatureCollection', features: editData.map(n => n.geojson) },
          {
            style: feat => {
              const n = editData.find(x => x.id === feat.id)
              const vg = n ? getVecumaGrupa(n.sugaKods, n.vecums) : 2
              return {
                color:'#333', weight:1,
                fillColor: NOGABALA_KRASA[`${n?.sugaKods}-${vg}`] || SUGAS_KRASA[n?.sugaKods] || '#888',
                fillOpacity: 0.80,
              }
            },
            onEachFeature: (feat, layer) => {
              const n = editData.find(x => x.id === feat.id)
              if (!n) return
              const lemumKrasa = getLemumKrasa(n.lemums)
              const taksInfo   = n.taksGads ? ` (taks. ${n.taksGads})` : ''
              const sugasRindas = (n.slani||[]).map(l =>
                `<tr><td style="color:#888;font-size:10px">${l.nos}</td>` +
                `<td style="text-align:right;font-size:10px">${l.vec} g · H${l.hEff}m · G${l.gEff} · ${l.kub}m³</td></tr>`
              ).join('')
              layer.bindPopup(
                `<div style="font-family:Arial;font-size:12px;min-width:210px">` +
                `<b style="font-size:13px">${n.nr_text} — ${n.audzeFormula||n.sugaNos}</b><br>` +
                `<table style="margin-top:6px;border-collapse:collapse;width:100%">` +
                `<tr><td style="color:#666">Vecums</td><td style="text-align:right;font-weight:600">${n.vecums} g.${taksInfo}</td></tr>` +
                `<tr><td style="color:#666">Bonitāte / Biezība</td><td style="text-align:right;font-weight:600">${n.bon} / ${n.bieziba}</td></tr>` +
                `<tr><td style="color:#666">Platība</td><td style="text-align:right;font-weight:600">${n.platiba.toFixed(2)} ha</td></tr>` +
                `<tr><td style="color:#666">G / H</td><td style="text-align:right;font-weight:600">${n.g} m²/ha / ${n.h} m</td></tr>` +
                sugasRindas +
                `<tr><td style="color:#666">Kubatūra</td><td style="text-align:right;font-weight:600">${n.kubatura} m³</td></tr>` +
                `<tr><td style="color:#666">Ind. vērtība</td><td style="text-align:right;color:#4caf50;font-weight:700">~${n.indVertiba.toLocaleString()} €</td></tr>` +
                `<tr><td style="color:#666">Lēmums</td><td style="text-align:right;font-weight:700;color:${lemumKrasa};font-size:11px">${n.lemums}</td></tr>` +
                (n.mzVeids!=null?`<tr><td style="color:#666">MZ veids</td><td style="text-align:right;font-size:10px">${n.mzVeids}</td></tr>`:'') +
                `</table></div>`
              )
              layer.on('add', function() {
                try {
                  const center = layer.getBounds().getCenter()
                  const label = L.marker(center, {
                    icon: L.divIcon({
                      className:'',
                      html:`<div style="background:rgba(0,0,0,0.65);color:#fff;font-size:10px;font-weight:700;padding:2px 5px;border-radius:3px;white-space:nowrap;pointer-events:none">${n.nr_text}</div>`,
                      iconAnchor:[15,10],
                    }),
                    interactive:false,
                  })
                  label.addTo(map)
                  if (!layersRef.current.labels) layersRef.current.labels = []
                  layersRef.current.labels.push(label)
                } catch { /* nav bounds */ }
              })
            },
          }
        ).addTo(map)
        layersRef.current.nogLayer = nl
        if (!slani.kadastra) map.fitBounds(nl.getBounds(), { padding:[30,30] })
      }

      if (slani.dap && dapTer.length > 0) {
        layersRef.current.dapLayer = L.geoJSON(
          { type:'FeatureCollection', features:dapTer },
          {
            style:{ color:'#e53935', weight:2, fillColor:'#e53935', fillOpacity:0.18, dashArray:'4,4' },
            onEachFeature: (_,layer) => layer.bindPopup('🔒 Egļu aizsardzības zona'),
          }
        ).addTo(map)
      }
    }
    init().catch(console.error)
    return () => { if (leafletRef.current) { leafletRef.current.remove(); leafletRef.current = null } }
  }, [kadGeom, editData, dapTer, slani])

  const C = { inner: DS.bgInner, border: DS.greenBdr, dim: DS.textDim, green: DS.green }

  const legende = [...new Map(editData.map(n => {
    const vg = getVecumaGrupa(n.sugaKods, n.vecums)
    return [`${n.sugaNos} ${'IIIIIV'.slice(vg-1,vg)||vg}`, NOGABALA_KRASA[`${n.sugaKods}-${vg}`] || n.sugaKrasa]
  })).entries()]

  return (
    <div style={{ padding:'12px 16px 80px' }}>
      {/* Slāņu pogas */}
      <div style={{ display:'flex', flexWrap:'wrap', gap:8, marginBottom:10 }}>
        {SLANU_POGAS.map(s => (
          <button key={s.id} onClick={() => setSlani(prev => ({ ...prev, [s.id]: !prev[s.id] }))} style={{
            padding:'5px 12px', borderRadius:16, fontSize:12, cursor:'pointer',
            background: slani[s.id] ? `${DS.green}22` : C.inner,
            border:`1px solid ${slani[s.id] ? DS.green : C.border}`,
            color: slani[s.id] ? DS.green : C.dim, fontWeight: slani[s.id] ? 600 : 400,
          }}>{s.label}</button>
        ))}
      </div>

      {/* Karte */}
      <div ref={mapRef} style={{
        width:'100%', height:420, borderRadius:12,
        border:`1px solid ${C.border}`, background:'#1a2e1a', overflow:'hidden',
      }} />

      {/* Leģenda */}
      <div style={{ display:'flex', flexWrap:'wrap', gap:6, marginTop:10 }}>
        {legende.map(([label, krasa]) => (
          <span key={label} style={{ display:'flex', alignItems:'center', gap:5,
            background:C.inner, border:`1px solid ${C.border}`, borderRadius:12, padding:'3px 10px', fontSize:11 }}>
            <span style={{ width:10, height:10, borderRadius:'50%', background:krasa, display:'inline-block' }}/>
            {label}
          </span>
        ))}
        {dapTer.length > 0 && (
          <span style={{ display:'flex', alignItems:'center', gap:5, background:'#2a0a0a',
            border:'1px solid #e53935', borderRadius:12, padding:'3px 10px', fontSize:11, color:'#ef9a9a' }}>
            <span style={{ width:10, height:10, borderRadius:'50%', background:'#e53935', display:'inline-block' }}/>
            Egļu aizsardzība
          </span>
        )}
      </div>

      {editData.length === 0 && (
        <div style={{ marginTop:16, padding:'20px', textAlign:'center', color:C.dim, fontSize:13 }}>
          Nav atrasti nogabali VMD datos šim kadastra numuram.
        </div>
      )}
    </div>
  )
}
