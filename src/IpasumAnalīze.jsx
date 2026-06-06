import { useState, useEffect, useRef } from 'react'
import 'leaflet/dist/leaflet.css'
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis,
  Tooltip, ResponsiveContainer, Legend,
} from 'recharts'
import { forestEngine } from './forestEngine'
import { C as DS, F, R, spinnerCSS } from './ds'

// ─── Konstantes ───────────────────────────────────────────────────────────────

const SUGAS_KRASAS = {
  P: '#2e7d32', E: '#1565c0', B: '#f9a825', A: '#6a1b9a',
  Ba: '#558b2f', Bl: '#1b5e20', Oz: '#4e342e', Os: '#006064',
  M: '#7b1fa2', G: '#e65100',
}
const SUGAS_NOS = {
  P: 'Priede', E: 'Egle', B: 'Bērzs', A: 'Alksnis',
  Ba: 'Baltalksnis', Bl: 'Melnalksnis', Oz: 'Ozols', Os: 'Osis',
  M: 'Melnā kārkls', G: 'Apse',
}
const SORT_NOS = {
  log: 'Zāģbaļķis', small: 'Sīkbaļķis', veneer: 'Finieris',
  tara: 'Tara', pulp: 'Papīrmalka', fire: 'Malka', chips: 'Šķelda',
}
const SORT_CENAS = { log: 93, small: 65, veneer: 130, tara: 48, pulp: 50, fire: 38, chips: 15 }

const H_MAX = { Ia: 38, I: 33, II: 28, III: 23, IV: 18, V: 14, Va: 10 }
const T50   = { Ia: 40, I: 45, II: 50, III: 60, IV: 70, V: 80, Va: 90 }

// ─── Palīgfunkcijas ───────────────────────────────────────────────────────────

function calcH(bon, vec) {
  const hMax = H_MAX[bon] || 23
  const t50  = T50[bon]  || 55
  return Math.round(hMax * vec / (vec + t50) * 10) / 10
}
function calcG(suga, vec) {
  const base = ['P','E'].includes(suga) ? 28 : ['B','Oz','Os'].includes(suga) ? 22 : 18
  return Math.min(Math.round(base * Math.sqrt(Math.min(vec,100)/80) * 10)/10, 36)
}
function calcD(h) { return Math.max(Math.round(h * 0.78), 6) }

function normBon(raw) {
  const s = String(raw || 'II').trim()
  const m = { '1a':'Ia','ia':'Ia','1':'I','2':'II','3':'III','4':'IV','5':'V','5a':'Va','va':'Va' }
  return m[s.toLowerCase()] || s
}
function normSuga(raw) {
  if (!raw) return 'P'
  const s = String(raw).trim()
  const m = { 'Priede':'P','Egle':'E','Bērzs':'B','Berzs':'B','Alksnis':'A',
    'Baltalksnis':'Ba','Melnalksnis':'Bl','Ozols':'Oz','Osis':'Os','Apse':'G' }
  return m[s] || s.split(/[\s(]/)[0].trim() || 'P'
}

function geojsonToWKT(geom) {
  if (!geom) return null
  if (geom.type === 'Polygon') {
    return `POLYGON((${geom.coordinates.map(r => r.map(p=>`${p[0]} ${p[1]}`).join(',')).join('),(')}))`
  }
  if (geom.type === 'MultiPolygon') {
    const polys = geom.coordinates
      .map(poly => poly.map(r => r.map(p=>`${p[0]} ${p[1]}`).join(',')).join('),('))
      .map(p => `((${p}))`).join(',')
    return `MULTIPOLYGON(${polys})`
  }
  return null
}

async function lvmWFS(url) {
  const r = await fetch(`/api/lvmgeo?url=${encodeURIComponent(url)}`)
  if (!r.ok) throw new Error(`LVM GEO atbildes kods: ${r.status}`)
  const data = await r.json()
  if (data.error) throw new Error(data.error)
  return data
}

function aprekināt(suga, vecums, bon, platiba, h, g, d) {
  const row = {
    formula: `10${suga}`, vec: vecums, bon, h, g, d,
    platiba, krm3ha: 0, harvestType: '', plantacija: false,
  }
  let rez
  try { rez = forestEngine(row) } catch { rez = null }
  const kraja   = rez?.volume   ? Math.round(rez.volume)      : Math.round(g * h * 0.45 * platiba)
  const vertiba = rez?.marketValue != null ? Math.round(rez.marketValue) : 0
  const sortimenti = rez?.sortiments || {}
  const lemums  = rez?.decision || '—'
  // Sortimentu vērtība (pārsvarā pozitīvāka par stumpage)
  let sortVert = 0
  Object.entries(sortimenti).forEach(([k, v]) => { sortVert += (v || 0) * (SORT_CENAS[k] || 0) })
  return { kraja, vertiba: Math.max(vertiba, 0), sortVert: Math.round(sortVert), sortimenti, lemums }
}

function normalizēNogabals(feat, i) {
  const p    = feat.properties || {}
  const suga = normSuga(p.SPECIES || p.SUG  || p.SUGA  || p.SUGA1 || p.species || 'P')
  const vec  = parseInt(p.VECUMS  || p.AGE  || p.VEC   || p.age   || 0) || 60
  const bon  = normBon(p.BONITETE || p.BON  || p.BONIT || p.bonite|| 'II')
  // platiba: SHAPE_Area ir m², pārvērš uz ha
  const shapeArea = parseFloat(p.SHAPE_Area || p.SHAPE_AREA || 0)
  const platiba   = parseFloat(p.AREA_HA || p.PLATIBA || p.PLATIB || p.HA || 0) ||
                    (shapeArea > 100 ? shapeArea / 10000 : shapeArea) || 1.0
  const h   = parseFloat(p.H || p.HEIGHT || 0) || calcH(bon, vec)
  const g   = parseFloat(p.G || p.BASAL  || 0) || calcG(suga, vec)
  const d   = parseFloat(p.D || p.DBH    || 0) || calcD(h)

  const { kraja, vertiba, sortVert, sortimenti, lemums } = aprekināt(suga, vec, bon, platiba, h, g, d)

  return { id: feat.id || `n${i}`, nr: i+1, suga, vecums: vec, bon, platiba, h, g, d,
           kraja, vertiba, sortVert, sortimenti, lemums, geojson: feat, rawProps: p }
}

// ─── Galvenā komponente ───────────────────────────────────────────────────────

export default function IpasumAnalīze({ onBack }) {
  const [faze,         setFaze]         = useState('ievads')
  const [kadInput,     setKadInput]     = useState('')
  const [kluda,        setKluda]        = useState('')
  const [ladeText,     setLadeText]     = useState('')
  const [kadGeom,      setKadGeom]      = useState(null)
  const [kadProps,     setKadProps]     = useState(null)
  const [nogabali,     setNogabali]     = useState([])
  const [dapTer,       setDapTer]       = useState([])
  const [editData,     setEditData]     = useState([])
  const [cilne,        setCilne]        = useState('karte')
  const [slani,        setSlani]        = useState({ nogabali:true, dap:true, kadastra:true, ortofoto:false })

  const mapRef      = useRef(null)
  const leafletRef  = useRef(null)
  const layersRef   = useRef({})

  // ── Karte init/update ──────────────────────────────────────────────────────
  useEffect(() => {
    if (faze !== 'rezultats' || cilne !== 'karte') return
    if (!mapRef.current) return

    let L
    const initLapja = async () => {
      L = (await import('leaflet')).default

      if (!leafletRef.current) {
        const map = L.map(mapRef.current, { zoomControl: true, attributionControl: false })
        // OSM pamata slānis
        layersRef.current.osm = L.tileLayer(
          'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
          { maxZoom: 20, attribution: '© OpenStreetMap' }
        ).addTo(map)
        leafletRef.current = map
      }
      const map = leafletRef.current

      // Notīra veco feature slāņus
      ;['kadLayer','nogLayer','dapLayer','ortofoto'].forEach(k => {
        if (layersRef.current[k]) { map.removeLayer(layersRef.current[k]); delete layersRef.current[k] }
      })

      // Ortofoto (Latvijas ģeoportāls WMS)
      if (slani.ortofoto) {
        layersRef.current.ortofoto = L.tileLayer.wms(
          'https://lvmgeoserver.lvm.lv/geoserver/ows?',
          { layers: 'publicwms:ortofoto_2023', format: 'image/png', transparent: true, opacity: 0.9 }
        ).addTo(map)
      }

      // Kadastra robeža
      if (slani.kadastra && kadGeom) {
        const kadLayer = L.geoJSON(kadGeom, {
          style: { color: '#fff', weight: 3, fillOpacity: 0.05, dashArray: '6,4' },
        }).addTo(map)
        layersRef.current.kadLayer = kadLayer
        map.fitBounds(kadLayer.getBounds(), { padding: [30, 30] })
      }

      // Nogabali (krāsoti pēc sugas)
      if (slani.nogabali && nogabali.length > 0) {
        const nog = L.geoJSON(
          { type: 'FeatureCollection', features: nogabali.map(n => n.geojson) },
          {
            style: feat => ({
              color: '#fff', weight: 1,
              fillColor: SUGAS_KRASAS[normSuga(feat?.properties?.SUG || feat?.properties?.SUGA || feat?.properties?.SPECIES)] || '#4caf50',
              fillOpacity: 0.5,
            }),
            onEachFeature: (feat, layer) => {
              const n = nogabali.find(x => x.id === feat.id)
              if (n) layer.bindPopup(
                `<b>${SUGAS_NOS[n.suga]||n.suga}</b> · ${n.vecums} g. · ${n.bon}<br>` +
                `${n.platiba.toFixed(2)} ha · ${n.kraja} m³ · ~${n.sortVert} €`
              )
            },
          }
        ).addTo(map)
        layersRef.current.nogLayer = nog
        if (!slani.kadastra) map.fitBounds(nog.getBounds(), { padding: [30, 30] })
      }

      // DAP teritorijas
      if (slani.dap && dapTer.length > 0) {
        const dap = L.geoJSON(
          { type: 'FeatureCollection', features: dapTer },
          { style: { color: '#e53935', weight: 2, fillColor: '#e53935', fillOpacity: 0.18, dashArray: '4,4' },
            onEachFeature: (feat, layer) => {
              const p = feat.properties || {}
              layer.bindPopup(`🔒 ${p.NOSAUKUMS || p.KATEGORIJA || 'Aizsargājamā teritorija'}`)
            }
          }
        ).addTo(map)
        layersRef.current.dapLayer = dap
      }
    }
    initLapja().catch(console.error)

    return () => {
      if (leafletRef.current && faze !== 'rezultats') {
        leafletRef.current.remove()
        leafletRef.current = null
      }
    }
  }, [faze, cilne, kadGeom, nogabali, dapTer, slani])

  // Tīra karti kad atstāj rezultātu skatu
  useEffect(() => {
    if (faze !== 'rezultats' && leafletRef.current) {
      leafletRef.current.remove()
      leafletRef.current = null
    }
  }, [faze])

  // ── Galvenā analīzes funkcija ───────────────────────────────────────────────
  const analizet = async () => {
    const kad = kadInput.replace(/\s/g, '')
    if (!/^\d{11}$/.test(kad)) {
      setKluda('Kadastra numuram jābūt 11 cipariem (piemērs: 42820040063)')
      return
    }
    setKluda('')
    setFaze('lade')
    setLadeText('Saņem kadastra robežas...')

    try {
      // 1. Kadastra robežas
      const kadURL = `https://lvmgeoserver.lvm.lv/geoserver/publicwfs/wfs?service=WFS&version=2.0.0&request=GetFeature&typeNames=publicwfs:Kadastra_karte&CQL_FILTER=KADASTRA_APZIMEJUMS='${kad}'&outputFormat=application/json`
      const kadData = await lvmWFS(kadURL)
      const kadFeat = kadData?.features?.[0]
      if (!kadFeat) {
        setFaze('ievads')
        setKluda('Kadastra numurs nav atrasts LVM GEO. Pārbaudi numuru un mēģini vēlreiz.')
        return
      }
      setKadGeom(kadFeat)
      setKadProps(kadFeat.properties)

      // 2. WKT no kadastra ģeometrijas VMD un DAP vaicājumiem
      const wkt = geojsonToWKT(kadFeat.geometry)
      if (!wkt) throw new Error('Nevar noteikt kadastra ģeometriju')

      setLadeText('Iegūst VMD nogabalu datus...')

      // 3. VMD nogabali
      const vmdURL = `https://lvmgeoserver.lvm.lv/geoserver/publicwfs/ows?service=WFS&version=2.0.0&request=GetFeature&typeNames=publicwfs:vmdpubliccompartments&CQL_FILTER=INTERSECTS(the_geom,${wkt})&outputFormat=application/json`
      const vmdData = await lvmWFS(vmdURL)
      const nogFeatures = vmdData?.features || []

      setLadeText('Iegūst DAP aizsargājamās teritorijas...')

      // 4. DAP teritorijas
      let dapFeatures = []
      try {
        const dapURL = `https://lvmgeoserver.lvm.lv/geoserver/publicwfs/ows?service=WFS&version=2.0.0&request=GetFeature&typeNames=publicwfs:dap_teritorijas&CQL_FILTER=INTERSECTS(the_geom,${wkt})&outputFormat=application/json`
        const dapData = await lvmWFS(dapURL)
        dapFeatures = dapData?.features || []
      } catch { /* DAP nav obligāti */ }

      setLadeText('Aprēķina meža vērtību...')

      // 5. Normalizē nogabalus + forestEngine
      const normNog = nogFeatures.map((f, i) => normalizēNogabals(f, i))

      setNogabali(normNog)
      setDapTer(dapFeatures)
      setEditData(normNog.map(n => ({ ...n })))
      setCilne('karte')
      setFaze('rezultats')

    } catch (e) {
      console.error('IpasumAnalīze kļūda:', e)
      setFaze('ievads')
      setKluda(`Kļūda: ${e.message}. Pārbaudi internetu un mēģini vēlreiz.`)
    }
  }

  // ── Rediģēšanas loģika ─────────────────────────────────────────────────────
  const updateRinda = (i, lauks, val) => {
    setEditData(prev => {
      const jaunie = [...prev]
      const r = { ...jaunie[i], [lauks]: lauks === 'suga' ? val : parseFloat(val) || 0 }
      // Pārrēķina atkarīgās vērtības
      r.h = parseFloat(r.h) || calcH(r.bon, r.vecums)
      r.g = parseFloat(r.g) || calcG(r.suga, r.vecums)
      r.d = parseFloat(r.d) || calcD(r.h)
      const { kraja, vertiba, sortVert, sortimenti, lemums } = aprekināt(r.suga, r.vecums, r.bon, r.platiba, r.h, r.g, r.d)
      r.kraja = kraja; r.vertiba = vertiba; r.sortVert = sortVert
      r.sortimenti = sortimenti; r.lemums = lemums
      jaunie[i] = r
      return jaunie
    })
  }

  // ── PDF eksports (HTML → jauns logs → print) ───────────────────────────────
  const eksportPDF = () => {
    const datums = new Date().toLocaleDateString('lv-LV')
    const kopPlatiba = editData.reduce((s,n) => s+n.platiba, 0)
    const kopKraja   = editData.reduce((s,n) => s+n.kraja, 0)
    const kopVert    = editData.reduce((s,n) => s+n.sortVert, 0)

    const rindas = editData.map(n => `
      <tr>
        <td>${n.nr}</td>
        <td>${SUGAS_NOS[n.suga]||n.suga}</td>
        <td>${n.vecums}</td>
        <td>${n.bon}</td>
        <td>${n.platiba.toFixed(2)}</td>
        <td>${n.h}</td>
        <td>${n.g}</td>
        <td>${n.kraja}</td>
        <td>${n.lemums}</td>
        <td>${n.sortVert.toLocaleString()}</td>
      </tr>`).join('')

    const html = `<!DOCTYPE html><html><head><meta charset="UTF-8">
<title>Īpašuma analīze — ${kadInput}</title>
<style>
body{font-family:Arial,sans-serif;font-size:11px;padding:20px;color:#111}
h1{font-size:16px;color:#225522;margin:0 0 8px}
.meta{display:flex;gap:40px;margin-bottom:16px;font-size:10px;color:#555}
table{border-collapse:collapse;width:100%;margin-top:12px;font-size:10px}
th{background:#225522;color:#fff;padding:5px 6px;text-align:right;white-space:nowrap}
th:first-child,th:nth-child(2),th:nth-child(9){text-align:left}
td{border:1px solid #ddd;padding:4px 6px;text-align:right}
td:first-child,td:nth-child(2),td:nth-child(9){text-align:left}
.total td{background:#e8f5e9;font-weight:bold}
.dap{margin-top:14px;font-size:10px;color:#c62828}
.footer{margin-top:20px;font-size:9px;color:#aaa;border-top:1px solid #ddd;padding-top:8px}
</style></head><body>
<h1>🌲 Meža īpašuma analīze</h1>
<div class="meta">
  <div><b>Kadastra Nr.:</b> ${kadInput}</div>
  <div><b>Datums:</b> ${datums}</div>
  <div><b>Kopplatība:</b> ${kopPlatiba.toFixed(2)} ha</div>
  <div><b>Kopkrāja:</b> ${kopKraja} m³</div>
  <div><b>Orientējošā vērtība:</b> ${kopVert.toLocaleString()} €</div>
</div>
${dapTer.length > 0 ? `<div class="dap">⚠️ Īpašumā vai tuvumā: ${dapTer.length} aizsargājama teritorija(-as)</div>` : ''}
<table>
  <thead><tr>
    <th>Nr.</th><th>Suga</th><th>Vec.</th><th>Bon.</th><th>ha</th>
    <th>H m</th><th>G m²/ha</th><th>m³</th><th>Lēmums</th><th>Sort.€</th>
  </tr></thead>
  <tbody>${rindas}</tbody>
  <tfoot><tr class="total">
    <td colspan="4">Kopā</td>
    <td>${kopPlatiba.toFixed(2)}</td>
    <td></td><td></td>
    <td>${kopKraja}</td>
    <td></td>
    <td>${kopVert.toLocaleString()}</td>
  </tr></tfoot>
</table>
<div class="footer">Ģenerēts: meža-tirgus.lv · Dati: LVM GEO · Aprēķini: orientējoši, balstīti uz WFS nogabalu datiem</div>
</body></html>`

    const w = window.open('', '_blank')
    w.document.write(html)
    w.document.close()
    w.print()
  }

  // ── Kopsavilkuma skaitļi ──────────────────────────────────────────────────
  const kopPlatiba = editData.reduce((s,n) => s + n.platiba, 0)
  const kopKraja   = editData.reduce((s,n) => s + n.kraja, 0)
  const kopVert    = editData.reduce((s,n) => s + n.sortVert, 0)

  // ── Stili ─────────────────────────────────────────────────────────────────
  const C = { bg: DS.bg, card: DS.bgCard, inner: DS.bgInner, border: DS.greenBdr,
              text: DS.text, dim: DS.textDim, sec: DS.textSec, green: DS.green }
  const inp = {
    background: DS.bgDeep, border: `1px solid ${DS.greenBdr}`, color: DS.text,
    borderRadius: 6, padding: '10px 14px', fontSize: 16, outline: 'none',
    width: '100%', boxSizing: 'border-box', fontFamily: F.family,
  }
  const btnPrimary = {
    background: `linear-gradient(135deg, ${DS.green}, ${DS.greenDk})`,
    color: 'white', border: 'none', borderRadius: 8,
    padding: '13px 28px', fontSize: 15, fontWeight: 700,
    cursor: 'pointer', minHeight: 44,
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // FĀZE: IEVADS
  // ═══════════════════════════════════════════════════════════════════════════
  if (faze === 'ievads') return (
    <div style={{ minHeight: '100vh', background: C.bg, color: C.text, fontFamily: F.family }}>
      <style>{spinnerCSS}</style>

      {/* Header */}
      <div style={{ background: DS.glass, borderBottom: `1px solid ${C.border}`, backdropFilter: 'blur(8px)',
        padding: '0 20px', height: 52, display: 'flex', alignItems: 'center', gap: 12,
        position: 'sticky', top: 0, zIndex: 10 }}>
        {onBack && <button onClick={onBack} style={{ background:'none', border:'none', color: C.green,
          fontSize: 22, cursor: 'pointer', padding: '0 4px', minWidth: 36, minHeight: 44 }}>←</button>}
        <div>
          <div style={{ color: C.green, fontSize: F.md, fontWeight: F.weightBold }}>🗺 Īpašuma analīze</div>
          <div style={{ color: C.dim, fontSize: F.xs }}>LVM GEO automātiskā meža inventarizācija</div>
        </div>
      </div>

      {/* Forma */}
      <div style={{ maxWidth: 560, margin: '0 auto', padding: '32px 20px 60px' }}>
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: '28px 24px', marginBottom: 16 }}>
          <div style={{ fontSize: 13, color: C.sec, marginBottom: 20, lineHeight: 1.6 }}>
            Ievadi 11-ciparu kadastra numuru — sistēma automātiski iegūst
            nogabalu datus no LVM GEO, aprēķina kubatūru un meža vērtību.
          </div>

          <label style={{ fontSize: 11, color: C.dim, fontWeight: 600, display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Kadastra numurs
          </label>
          <div style={{ display: 'flex', gap: 10, marginBottom: 8 }}>
            <input
              value={kadInput}
              onChange={e => setKadInput(e.target.value.replace(/[^\d\s]/g, ''))}
              onKeyDown={e => e.key === 'Enter' && analizet()}
              placeholder="Piemērs: 42820040063"
              maxLength={14}
              style={{ ...inp, flex: 1 }}
            />
            <button onClick={analizet} style={{ ...btnPrimary, padding: '13px 20px' }}>
              🔍
            </button>
          </div>
          <div style={{ fontSize: 11, color: C.dim }}>
            Formatā: 11 cipari bez atstarpēm. <span style={{ color: C.green }}>Piemērs: 42820040063</span>
          </div>

          {kluda && (
            <div style={{ marginTop: 12, background: '#2a0a0a', border: '1px solid #c62828',
              borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#ef9a9a' }}>
              ⚠️ {kluda}
            </div>
          )}

          <button onClick={analizet} style={{ ...btnPrimary, width: '100%', marginTop: 20 }}>
            Analizēt īpašumu →
          </button>
        </div>

        {/* Info kartiņas */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 10, marginBottom: 20 }}>
          {[
            { icon: '🌲', text: 'VMD nogabali — suga, vecums, bonitāte, platība' },
            { icon: '📊', text: 'Kubatūra un sortimentu vērtība katram nogabalam' },
            { icon: '🔒', text: 'DAP aizsargājamās teritorijas un mikroliegumi' },
            { icon: '🗺', text: 'Interaktīva karte ar slāņu izvēlni' },
          ].map((x, i) => (
            <div key={i} style={{ background: C.inner, border: `1px solid ${C.border}`, borderRadius: 10, padding: '12px 14px' }}>
              <div style={{ fontSize: 20, marginBottom: 6 }}>{x.icon}</div>
              <div style={{ fontSize: 11, color: C.sec, lineHeight: 1.5 }}>{x.text}</div>
            </div>
          ))}
        </div>

        <div style={{ textAlign: 'center', paddingTop: 8, borderTop: `1px solid ${C.border}` }}>
          <div style={{ fontSize: 12, color: C.dim, marginBottom: 10 }}>
            Vai izmanto esošo VMD inventarizācijas PDF:
          </div>
          <button onClick={onBack} style={{ background: 'transparent', border: `1px solid ${C.border}`,
            color: C.sec, borderRadius: 8, padding: '10px 20px', fontSize: 13, cursor: 'pointer',
            fontFamily: F.family }}>
            📄 VMD PDF analīze (manuāli)
          </button>
        </div>
      </div>
    </div>
  )

  // ═══════════════════════════════════════════════════════════════════════════
  // FĀZE: IELĀDE
  // ═══════════════════════════════════════════════════════════════════════════
  if (faze === 'lade') return (
    <div style={{ minHeight: '100vh', background: C.bg, display: 'flex', alignItems: 'center',
      justifyContent: 'center', flexDirection: 'column', gap: 20, fontFamily: F.family }}>
      <style>{spinnerCSS}{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <div style={{ width: 52, height: 52, border: `3px solid ${DS.greenBdr}`,
        borderTop: `3px solid ${DS.green}`, borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
      <div style={{ textAlign: 'center' }}>
        <div style={{ color: DS.green, fontSize: F.md, fontWeight: 600, marginBottom: 6 }}>
          🗺 Analizē īpašumu
        </div>
        <div style={{ color: C.sec, fontSize: F.sm }}>{ladeText}</div>
        <div style={{ color: C.dim, fontSize: F.xs, marginTop: 4 }}>{kadInput}</div>
      </div>
    </div>
  )

  // ═══════════════════════════════════════════════════════════════════════════
  // FĀZE: REZULTĀTI
  // ═══════════════════════════════════════════════════════════════════════════

  const CILNES = [
    { id: 'karte',     label: '🗺 Karte' },
    { id: 'tabula',    label: '📋 Tabula' },
    { id: 'diagrammas',label: '📊 Diagrammas' },
  ]

  // Recharts dati
  const pieData = Object.entries(
    editData.reduce((acc, n) => { acc[n.suga] = (acc[n.suga] || 0) + n.platiba; return acc }, {})
  ).map(([suga, ha]) => ({ name: SUGAS_NOS[suga] || suga, value: Math.round(ha * 100) / 100, suga }))

  const barKraja = editData.map(n => ({ name: `#${n.nr} ${SUGAS_NOS[n.suga]||n.suga}`, m3: n.kraja }))
  const barVert  = editData.map(n => ({ name: `#${n.nr}`, eur: n.sortVert }))

  const sortKopa = editData.reduce((acc, n) => {
    Object.entries(n.sortimenti).forEach(([k, v]) => { acc[k] = (acc[k] || 0) + (v || 0) })
    return acc
  }, {})
  const sortBar = Object.entries(sortKopa)
    .filter(([, v]) => v > 0.5)
    .map(([k, v]) => ({ name: SORT_NOS[k] || k, m3: Math.round(v), eur: Math.round(v * (SORT_CENAS[k] || 0)) }))

  const tpStyle = { background: DS.bgCard, border: `1px solid ${DS.greenBdr}`, borderRadius: 8, fontSize: 11, color: DS.text }
  const tkStyle = { fill: DS.textDim, fontSize: 10 }

  return (
    <div style={{ minHeight: '100vh', background: C.bg, color: C.text, fontFamily: F.family }}>
      <style>{spinnerCSS}</style>

      {/* Header */}
      <div style={{ background: DS.glass, borderBottom: `1px solid ${C.border}`, backdropFilter: 'blur(8px)',
        padding: '0 16px', height: 52, display: 'flex', alignItems: 'center', gap: 10,
        position: 'sticky', top: 0, zIndex: 10 }}>
        <button onClick={() => setFaze('ievads')} style={{ background:'none', border:'none', color: C.green,
          fontSize: 22, cursor: 'pointer', minWidth: 36, minHeight: 44 }}>←</button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ color: C.green, fontSize: F.md, fontWeight: F.weightBold, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            🗺 {kadInput}
          </div>
          <div style={{ color: C.dim, fontSize: F.xs }}>
            {editData.length} nogabali · {kopPlatiba.toFixed(2)} ha · {kopKraja} m³
          </div>
        </div>
        <button onClick={eksportPDF} style={{ background: DS.greenDk, color: 'white',
          border: `1px solid ${DS.green}`, borderRadius: 8, padding: '8px 14px',
          fontSize: 12, fontWeight: 600, cursor: 'pointer', flexShrink: 0 }}>
          📥 PDF
        </button>
      </div>

      {/* Kopsavilkuma kartiņas */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 8, padding: '12px 16px 0' }}>
        {[
          { label: 'Kopplatība', val: `${kopPlatiba.toFixed(2)} ha`, color: C.green },
          { label: 'Nogabali',   val: editData.length,              color: DS.info },
          { label: 'Kopkrāja',   val: `${kopKraja} m³`,            color: '#f9a825' },
          { label: 'Sort. vērt.', val: `${kopVert.toLocaleString()} €`, color: '#4ade80' },
          { label: 'DAP teritorijas', val: dapTer.length, color: dapTer.length > 0 ? '#ef4444' : C.sec },
        ].map((x, i) => (
          <div key={i} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: '10px 12px' }}>
            <div style={{ fontSize: 10, color: C.dim, marginBottom: 3, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{x.label}</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: x.color }}>{x.val}</div>
          </div>
        ))}
      </div>

      {/* Cilnes */}
      <div style={{ display: 'flex', gap: 0, padding: '12px 16px 0', borderBottom: `1px solid ${C.border}`, overflowX: 'auto' }}>
        {CILNES.map(c => (
          <button key={c.id} onClick={() => setCilne(c.id)} style={{
            background: 'none', border: 'none',
            borderBottom: cilne === c.id ? `2px solid ${DS.green}` : '2px solid transparent',
            color: cilne === c.id ? DS.green : C.sec,
            padding: '8px 16px', fontSize: F.sm,
            fontWeight: cilne === c.id ? 600 : 400,
            cursor: 'pointer', fontFamily: F.family, whiteSpace: 'nowrap',
          }}>{c.label}</button>
        ))}
      </div>

      {/* ── KARTE ── */}
      {cilne === 'karte' && (
        <div style={{ padding: '12px 16px 80px' }}>
          {/* Slāņu izvēlne */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 10 }}>
            {[
              { id: 'nogabali', label: '🌲 Nogabali' },
              { id: 'dap',      label: '🔒 DAP' },
              { id: 'kadastra', label: '📐 Kadastra' },
              { id: 'ortofoto', label: '🛰 Ortofoto' },
            ].map(s => (
              <button key={s.id} onClick={() => setSlani(prev => ({ ...prev, [s.id]: !prev[s.id] }))}
                style={{
                  padding: '5px 12px', borderRadius: 16, fontSize: 12, cursor: 'pointer', fontFamily: F.family,
                  background: slani[s.id] ? `${DS.green}22` : C.inner,
                  border: `1px solid ${slani[s.id] ? DS.green : C.border}`,
                  color: slani[s.id] ? DS.green : C.dim,
                  fontWeight: slani[s.id] ? 600 : 400,
                }}>{s.label}
              </button>
            ))}
          </div>

          {/* Karte */}
          <div ref={mapRef} style={{ width: '100%', height: 420, borderRadius: 12,
            border: `1px solid ${C.border}`, background: '#1a2e1a', overflow: 'hidden' }} />

          {/* Sugas leģenda */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 10 }}>
            {[...new Set(editData.map(n => n.suga))].map(suga => (
              <span key={suga} style={{
                display: 'flex', alignItems: 'center', gap: 5,
                background: C.inner, border: `1px solid ${C.border}`,
                borderRadius: 12, padding: '3px 10px', fontSize: 11,
              }}>
                <span style={{ width: 10, height: 10, borderRadius: '50%', background: SUGAS_KRASAS[suga] || C.green, display: 'inline-block' }}/>
                {SUGAS_NOS[suga] || suga}
              </span>
            ))}
            {dapTer.length > 0 && (
              <span style={{ display: 'flex', alignItems: 'center', gap: 5,
                background: '#2a0a0a', border: '1px solid #e53935',
                borderRadius: 12, padding: '3px 10px', fontSize: 11, color: '#ef9a9a' }}>
                <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#e53935', display: 'inline-block' }}/>
                DAP teritorija
              </span>
            )}
          </div>
        </div>
      )}

      {/* ── TABULA (rediģējama) ── */}
      {cilne === 'tabula' && (
        <div style={{ padding: '12px 8px 80px', overflowX: 'auto' }}>
          <div style={{ fontSize: 11, color: C.dim, padding: '0 8px 10px' }}>
            Noklikšķini uz lauka lai rediģētu — aprēķini atjaunojas automātiski.
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 640, fontSize: 12 }}>
            <thead>
              <tr style={{ background: '#1b4a1b' }}>
                {['#','Suga','Vec.','Bon.','ha','H m','G','m³','Lēmums','Sort. €'].map((h, i) => (
                  <th key={i} style={{ padding: '6px 8px', textAlign: i < 2 ? 'left' : 'right',
                    color: C.sec, fontWeight: 700, fontSize: 10, whiteSpace: 'nowrap',
                    border: `1px solid ${C.border}` }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {editData.map((n, i) => (
                <tr key={n.id} style={{ background: i % 2 === 0 ? C.inner : C.bg }}>
                  <td style={{ padding: '4px 8px', border: `1px solid ${C.border}`, color: C.dim }}>{n.nr}</td>
                  {/* Suga */}
                  <td style={{ padding: '2px 4px', border: `1px solid ${C.border}` }}>
                    <select value={n.suga} onChange={e => updateRinda(i, 'suga', e.target.value)}
                      style={{ background: 'transparent', border: 'none', color: SUGAS_KRASAS[n.suga]||C.green,
                        fontSize: 12, cursor: 'pointer', fontWeight: 700, fontFamily: F.family }}>
                      {Object.keys(SUGAS_NOS).map(s => <option key={s} value={s} style={{ background: '#111f11', color: '#e8f5e9' }}>{s} — {SUGAS_NOS[s]}</option>)}
                    </select>
                  </td>
                  {/* Vecums */}
                  <td style={{ padding: '2px 4px', border: `1px solid ${C.border}` }}>
                    <input type="number" value={n.vecums} onChange={e => updateRinda(i,'vecums',e.target.value)}
                      style={{ background: 'transparent', border: 'none', color: C.text, width: 44, textAlign: 'right', fontSize: 12, fontFamily: F.family }} />
                  </td>
                  {/* Bonitāte */}
                  <td style={{ padding: '2px 4px', border: `1px solid ${C.border}` }}>
                    <select value={n.bon} onChange={e => updateRinda(i,'bon',e.target.value)}
                      style={{ background: 'transparent', border: 'none', color: C.sec, fontSize: 12, cursor: 'pointer', fontFamily: F.family }}>
                      {['Ia','I','II','III','IV','V','Va'].map(b => <option key={b} value={b} style={{ background: '#111f11' }}>{b}</option>)}
                    </select>
                  </td>
                  {/* Ha */}
                  <td style={{ padding: '2px 4px', border: `1px solid ${C.border}` }}>
                    <input type="number" step="0.01" value={n.platiba.toFixed(2)} onChange={e => updateRinda(i,'platiba',e.target.value)}
                      style={{ background: 'transparent', border: 'none', color: C.text, width: 54, textAlign: 'right', fontSize: 12, fontFamily: F.family }} />
                  </td>
                  <td style={{ padding: '4px 8px', border: `1px solid ${C.border}`, textAlign: 'right', color: C.sec }}>{n.h}</td>
                  <td style={{ padding: '4px 8px', border: `1px solid ${C.border}`, textAlign: 'right', color: C.sec }}>{n.g}</td>
                  <td style={{ padding: '4px 8px', border: `1px solid ${C.border}`, textAlign: 'right', fontWeight: 700, color: C.text }}>{n.kraja}</td>
                  <td style={{ padding: '4px 8px', border: `1px solid ${C.border}`, textAlign: 'left', color: C.dim, fontSize: 11, whiteSpace: 'nowrap' }}>{n.lemums}</td>
                  <td style={{ padding: '4px 8px', border: `1px solid ${C.border}`, textAlign: 'right', fontWeight: 700, color: '#4ade80' }}>{n.sortVert.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr style={{ background: '#0a2a0a' }}>
                <td colSpan={4} style={{ padding: '6px 8px', border: `1px solid ${C.border}`, fontWeight: 700, color: C.green }}>Kopā</td>
                <td style={{ padding: '6px 8px', border: `1px solid ${C.border}`, textAlign: 'right', fontWeight: 700, color: C.text }}>{kopPlatiba.toFixed(2)}</td>
                <td colSpan={2} style={{ border: `1px solid ${C.border}` }}/>
                <td style={{ padding: '6px 8px', border: `1px solid ${C.border}`, textAlign: 'right', fontWeight: 700, color: C.text }}>{kopKraja}</td>
                <td style={{ border: `1px solid ${C.border}` }}/>
                <td style={{ padding: '6px 8px', border: `1px solid ${C.border}`, textAlign: 'right', fontWeight: 700, color: '#4ade80' }}>{kopVert.toLocaleString()}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}

      {/* ── DIAGRAMMAS ── */}
      {cilne === 'diagrammas' && (
        <div style={{ padding: '16px 16px 80px' }}>

          {/* Platība pa sugām */}
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 16, marginBottom: 14 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: C.green, marginBottom: 12 }}>Platība pa sugām (ha)</div>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({name, value}) => `${name} ${value}ha`} labelLine={false}>
                  {pieData.map((entry, i) => (
                    <Cell key={i} fill={SUGAS_KRASAS[entry.suga] || '#4caf50'} />
                  ))}
                </Pie>
                <Tooltip contentStyle={tpStyle} formatter={(v) => [`${v} ha`, 'Platība']} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Kubatūra pa nogabaliem */}
          {barKraja.length > 0 && (
            <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 16, marginBottom: 14 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: C.green, marginBottom: 12 }}>Kubatūra pa nogabaliem (m³)</div>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={barKraja} margin={{ bottom: 30 }}>
                  <XAxis dataKey="name" tick={{ ...tkStyle, fontSize: 9 }} angle={-35} textAnchor="end" interval={0} />
                  <YAxis tick={tkStyle} />
                  <Tooltip contentStyle={tpStyle} formatter={v => [`${v} m³`, 'Kubatūra']} />
                  <Bar dataKey="m3" fill={DS.green} radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Sortimentu sadalījums */}
          {sortBar.length > 0 && (
            <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 16, marginBottom: 14 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: C.green, marginBottom: 12 }}>Sortimentu vērtība (€)</div>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={sortBar} margin={{ bottom: 40 }}>
                  <XAxis dataKey="name" tick={{ ...tkStyle, fontSize: 9 }} angle={-30} textAnchor="end" interval={0} />
                  <YAxis tick={tkStyle} />
                  <Tooltip contentStyle={tpStyle} formatter={(v, n) => [`${v.toLocaleString()} ${n === 'eur' ? '€' : 'm³'}`, n === 'eur' ? 'Vērtība' : 'Apjoms']} />
                  <Bar dataKey="m3" fill={DS.greenMd || '#4caf50'} name="m3" radius={[4,4,0,0]} />
                  <Bar dataKey="eur" fill="#f9a825" name="eur" radius={[4,4,0,0]} />
                  <Legend formatter={v => v === 'm3' ? 'm³' : '€'} wrapperStyle={{ color: C.dim, fontSize: 11 }} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* DAP brīdinājums */}
          {dapTer.length > 0 && (
            <div style={{ background: '#2a0a0a', border: '2px solid #e53935', borderRadius: 12, padding: '14px 16px' }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#ef9a9a', marginBottom: 8 }}>
                ⚠️ {dapTer.length} aizsargājama teritorija
              </div>
              {dapTer.slice(0, 5).map((f, i) => {
                const p = f.properties || {}
                return (
                  <div key={i} style={{ fontSize: 12, color: '#ffcdd2', padding: '4px 0', borderBottom: '1px solid #4a1a1a' }}>
                    🔒 {p.NOSAUKUMS || p.KATEGORIJA || p.TIPS || 'Aizsargājamā teritorija'}
                    {p.TIPS && p.TIPS !== p.NOSAUKUMS && <span style={{ color: '#ef9a9a', marginLeft: 6 }}>({p.TIPS})</span>}
                  </div>
                )
              })}
              {dapTer.length > 5 && <div style={{ fontSize: 11, color: '#ef9a9a', marginTop: 4 }}>un vēl {dapTer.length - 5}...</div>}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
