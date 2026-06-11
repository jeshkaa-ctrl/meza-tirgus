import { useState, useEffect, useRef } from 'react'
import 'leaflet/dist/leaflet.css'
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis,
  Tooltip, ResponsiveContainer, Legend,
} from 'recharts'
import { forestEngine } from './forestEngine'
import { C as DS, F, spinnerCSS } from './ds'

// ─── Sugas: VMD WFS kods (s10) → latviski nosaukums ──────────────────────────
// Pārbaudīts pēc reāliem LVM GEO datiem: 03=Egle, 04=Bērzs, 08=Apse
const SUGAS_KARTE = {
  1:'Priede',      2:'Lapegle',     3:'Egle',        4:'Bērzs',
  5:'Melnalksnis', 6:'Baltalksnis', 7:'Ozols',       8:'Apse',
  9:'Osis',        10:'Goba',       11:'Liepa',       12:'Vītols',
}
// ForestEngine īsie kodi
const SUGAS_KODS = {
  1:'P',  2:'P',  3:'E',  4:'B',
  5:'Bl', 6:'Ba', 7:'Oz', 8:'G',
  9:'Os', 10:'Os',11:'Ba',12:'Ba',
}
// Kartes fallback krāsas — VMD standarts
const SUGAS_KRASA = {
  1:'#d86010', // Priede — oranžs
  2:'#a06010', // Lapegle — tumši oranžs
  3:'#6040a0', // Egle — violets
  4:'#2060c0', // Bērzs — ZILS
  5:'#d03880', // Melnalksnis — magenta
  6:'#e060a8', // Baltalksnis — rozā
  7:'#585858', // Ozols — pelēks
  8:'#40a010', // Apse — ZAĻA
  9:'#888800', // Osis — olīvs
  10:'#a09060',// Goba — bēšs
  11:'#e8d000',// Liepa — DZELTENA
  12:'#40b898',// Vītols — tirkīzs
}
// LVM bonitātes kodi (bv10 lauks): 1=Ia, 2=I, 3=II, 4=III, 5=IV, 6=V; 0→default II
const BONITATES = { 1:'Ia', 2:'I', 3:'II', 4:'III', 5:'IV', 6:'V' }

// Vecuma grupas robežas (gadi) — standarta Latvijas meža inventarizācija
const VECUMA_ROBEZAS = {
  1:[20,40,80], 2:[20,40,80], 3:[20,40,80],  // Priede, Lapegle, Egle
  4:[10,20,40], 5:[10,20,40], 6:[10,20,40],  // Bērzs, Melnalksnis, Baltalksnis
  7:[20,40,80], 8:[10,20,40], 9:[10,20,40],  // Ozols, Apse, Osis
}
function getVecumaGrupa(sugaKods, vecums) {
  const b = VECUMA_ROBEZAS[sugaKods] || [20, 40, 80]
  if (vecums <= b[0]) return 1  // jaunaudze
  if (vecums <= b[1]) return 2  // vidēja vecuma
  if (vecums <= b[2]) return 3  // briestaudze
  return 4                       // pieaugusi
}

// Karte: krāsa pēc sugas + VECUMA GRUPAS — VMD standarts
// Priede=oranžs, Egle=violets, Bērzs=ZILS, Apse=ZAĻA, Liepa=dzeltena
const NOGABALA_KRASA = {
  // 1=Priede: gaiši oranžs → tumši oranžs/sarkans
  '1-1':'#ffd090','1-2':'#f49040','1-3':'#d86010','1-4':'#903008',
  // 2=Lapegle: tumšāks oranžs/brūns
  '2-1':'#ffe080','2-2':'#e0a030','2-3':'#a06010','2-4':'#604010',
  // 3=Egle: gaiši violets → tumši violets
  '3-1':'#ddd0f0','3-2':'#9880c8','3-3':'#6040a0','3-4':'#2a0868',
  // 4=Bērzs: gaiši zils → tumši zils
  '4-1':'#b8d8f8','4-2':'#5090e0','4-3':'#2060c0','4-4':'#103080',
  // 5=Melnalksnis: gaiši rozā → tumši magenta
  '5-1':'#ffd8e8','5-2':'#ff80b0','5-3':'#d03880','5-4':'#781040',
  // 6=Baltalksnis: rozā (cits tonis)
  '6-1':'#ffe8f8','6-2':'#ffa8d8','6-3':'#e060a8','6-4':'#a02868',
  // 7=Ozols: pelēks → tumšs
  '7-1':'#c8c8c8','7-2':'#909090','7-3':'#585858','7-4':'#282828',
  // 8=Apse: gaiši zaļa → tumši zaļa
  '8-1':'#c0f0a0','8-2':'#70d040','8-3':'#40a010','8-4':'#205010',
  // 9=Osis: olīvzaļš → tumšs
  '9-1':'#e8e870','9-2':'#c0c020','9-3':'#888800','9-4':'#484800',
  // 11=Liepa: dzeltens
  '11-1':'#fffff0','11-2':'#ffff60','11-3':'#e8d000','11-4':'#a09000',
}

// Sortimentu krāsas diagrammām
const SORT_KRASA = {
  log:'#2e7d32', small:'#4caf50', veneer:'#fbbf24',
  tara:'#f97316', pulp:'#64748b', fire:'#ef4444', chips:'#92400e',
}

// Aizsardzības noteikumi pa teritoriju tipiem
const AIZSARDZIBA = {
  dabas_liegums:     { cirte:'aizliegta',  label:'🔴 Cirte aizliegta'           },
  biosfera_pamata:   { cirte:'ierobežota', label:'🟠 Ierobežota cirte'           },
  biosfera_neutrala: { cirte:'kopsana',    label:'🟡 Kopšanas cirte atļauta'     },
  aizsargjosla:      { cirte:'ierobežota', label:'🟠 Ierobežota cirte'           },
  mikroliegums:      { cirte:'aizliegta',  label:'🔴 Cirte aizliegta'           },
  nav:               { cirte:'briva',      label:'🟢 Nav ierobežojumu'           },
}

const SORT_NOS = {
  log:'Zāģbaļķis', small:'Sīkbaļķis', veneer:'Finieris',
  tara:'Tara', pulp:'Papīrmalka', fire:'Malka', chips:'Šķelda',
}
const SORT_CENAS = { log:93, small:65, veneer:130, tara:48, pulp:50, fire:38, chips:15 }

const H_MAX = { Ia:38, I:33, II:28, III:23, IV:18, V:14 }
const T50   = { Ia:40, I:45, II:50, III:60, IV:70, V:80 }

// Kartes krāsa pēc cirtes lēmuma
function getLemumKrasa(lemums) {
  if (!lemums || lemums === '—') return '#757575'
  if (lemums === 'Cirte aizliegta')       return '#c62828'
  if (lemums.includes('ierobežot'))       return '#e65100'
  if (lemums.includes('Kopšanas'))        return '#f9a825'
  if (lemums.includes('Necērtams') || lemums.includes('Jaunaudze') || lemums.includes('Plantācija')) return '#757575'
  if (lemums.includes('Kailcirte') || lemums.includes('Galvenā cirte')) return '#2e7d32'
  return '#4caf50'
}

// Visstingrākais aizsardzības statuss no DAP feature masīva
function getAizsardzibaStatus(features) {
  if (!features?.length) return AIZSARDZIBA.nav
  const prioritate = ['aizliegta', 'ierobežota', 'kopsana', 'briva']
  let labakais = AIZSARDZIBA.nav
  for (const f of features) {
    const p = f.properties || {}
    const tips = (p.kategorija || p.tips || p.type || '').toLowerCase().replace(/ /g, '_')
    const rule = AIZSARDZIBA[tips]
    if (rule && prioritate.indexOf(rule.cirte) < prioritate.indexOf(labakais.cirte)) {
      labakais = rule
    }
  }
  return labakais
}

// ─── Palīgfunkcijas ───────────────────────────────────────────────────────────

// Pārvērš GeoJSON poligonu uz WKT (INTERSECTS filtriem)
function geojsonToWKT(geojson) {
  if (!geojson) return null
  if (geojson.type === 'Polygon') {
    const coords = geojson.coordinates[0].map(c => `${c[0]} ${c[1]}`).join(', ')
    return `POLYGON((${coords}))`
  }
  if (geojson.type === 'MultiPolygon') {
    const polygons = geojson.coordinates.map(poly =>
      `(${poly[0].map(c => `${c[0]} ${c[1]}`).join(', ')})`
    )
    return `MULTIPOLYGON(${polygons.map(p => `(${p})`).join(', ')})`
  }
  return null
}


// Aizsardzības noteikumi (alias — detalizēts variants ar komentāriem)
const protectionRules = {
  dabas_liegums:     { cirte:'aizliegta',  label:'🔴 Cirte aizliegta'        },
  biosfera_pamata:   { cirte:'ierobežota', label:'🟠 Ierobežota cirte'        },
  biosfera_neutrala: { cirte:'kopsana',    label:'🟡 Kopšanas cirte atļauta'  },
  aizsargjosla:      { cirte:'ierobežota', label:'🟠 Ierobežota cirte'        },
  mikroliegums:      { cirte:'aizliegta',  label:'🔴 Cirte aizliegta'        },
}

// calcH — augstums no numeriskā bonitātes koda (bv10) un vecuma
function calcH(bonitāte, vecums) {
  const base = { 1:1.1, 2:1.0, 3:0.9, 4:0.8, 5:0.7, 6:0.6 }
  return Math.round((base[bonitāte] || 1.0) * Math.sqrt(vecums) * 2.2)
}

// calcG — šķērslaukums no numeriskā sugas koda (s10) un vecuma
function calcG(suga, vecums) {
  const base = { 1:0.9, 2:0.85, 3:0.8, 4:0.7 }
  return Math.round((base[suga] || 0.8) * vecums * 0.4)
}

function calcD(h) { return Math.max(Math.round(h * 0.78), 6) }

// Kubatūra: G × H × 0.45 × platiba_ha
function aprekinātKubaturu(g, h, platiba) {
  if (!g || !h || !platiba) return 0
  return Math.round(g * h * 0.45 * platiba)
}

// Cirtes lēmums pēc MK 935 minimālajiem vecumiem
// Minimālie cirtes vecumi pēc MK 935 — pēc PAREIZAJIEM VMD kodiem
// 1=Priede, 3=Egle, 4=Bērzs, 8=Apse, 9=Osis
const MIN_VECUMS = {
  1:101,  // Priede
  2:101,  // Lapegle
  3:81,   // Egle
  4:61,   // Bērzs
  5:71,   // Melnalksnis
  6:null, // Baltalksnis
  7:101,  // Ozols
  8:41,   // Apse
  9:61,   // Osis
  10:null, 11:null, 12:null,
}

function noteiktCirti(vecums, g, aizsardziba, suga) {
  if (aizsardziba === 'aizliegta') return { lēmums:'Cirte aizliegta', klase:'aizliegta' }
  if (!g || g === 0)               return { lēmums:'Necērtams',       klase:'nevertams' }
  const gMin  = 12
  const minV  = MIN_VECUMS[suga]
  const vecOk = minV === null || minV === undefined ? true : vecums >= minV
  if (vecOk && g >= gMin) return { lēmums:'Kailcirte',      klase:'kailcirte' }
  if (g >= gMin * 1.2)    return { lēmums:'Kopšanas cirte', klase:'kopsana'   }
  return { lēmums:'Necērtams', klase:'nevertams' }
}

// WFS URL caur proxy (dev: Vite; prod: Vercel)
function buildWFS(geoPath, typeNames, cqlFilter, count = 100) {
  const cqlEnc = cqlFilter
    ? '&CQL_FILTER=' + cqlFilter.replace(/ /g,'%20').replace(/\(/g,'%28').replace(/\)/g,'%29').replace(/,/g,'%2C')
    : ''
  return `/api/lvmgeo${geoPath}` +
    `?service=WFS&version=2.0.0&request=GetFeature` +
    `&typeNames=${encodeURIComponent(typeNames)}` +
    `&outputFormat=application/json&srsName=EPSG:4326&count=${count}` +
    cqlEnc
}

async function lvmWFS(url) {
  const r = await fetch(url)
  if (!r.ok) {
    const body = await r.text().catch(() => '')
    throw new Error(`WFS_${r.status}:${body.slice(0, 300)}`)
  }
  const data = await r.json()
  if (data.error) throw new Error(data.error)
  return data
}

async function wfsDiagnostika(geoPath, typeNames) {
  try {
    const data = await lvmWFS(buildWFS(geoPath, typeNames, null, 1))
    const feat = data?.features?.[0]
    if (feat?.properties) return `Pieejamie lauki: ${Object.keys(feat.properties).join(', ')}`
    return `Nav features. totalFeatures: ${data?.totalFeatures ?? '?'}`
  } catch (e) {
    return `Diagnostika neizdevās: ${e.message.slice(0, 150)}`
  }
}

// ─── color lauka parsēšana → bonitāte + biezība ──────────────────────────────
// Formāts: "10 1-2" → SUGA_KOD BON-BIEZIB
// bv10=0 vienmēr — bonitāte TIKAI no color lauka
function parseColor(color) {
  const s = String(color || '').trim()
  const m = s.match(/\d+\s+(\d+)-(\d+)/)
  if (m) {
    return {
      bonNum:  parseInt(m[1]) || 3,
      bieziba: Math.max(0.1, Math.min(1.0, parseFloat(m[2]) / 10)),
    }
  }
  return { bonNum: 3, bieziba: 1.0 }
}

// ─── Nogabala apstrāde (pēc WFS feature) ─────────────────────────────────────
function apstradatNogabalu(feat, i) {
  const p = feat.properties || {}

  // Vecuma korekcija: gtf = faktiskais taksācijas gads
  const taksGads     = parseInt(p.gtf) || 2011
  const gadskorekcija = new Date().getFullYear() - taksGads

  // Bonitāte un biezība no color lauka (bv10 vienmēr 0!)
  const { bonNum, bieziba } = parseColor(p.color)
  const bon = BONITATES[bonNum] || 'II'

  const platiba = parseFloat(p.nog_plat) || 0

  // Visi sugu slāņi (s10–s14) — summē kopējo G un kubatūru
  const SUFIKSI = [10, 11, 12, 13, 14]
  const slani = SUFIKSI.map(sfx => {
    const sKods = parseInt(p[`s${sfx}`]) || 0
    if (!sKods) return null
    const aWfs = parseInt(p[`a${sfx}`]) || 0
    const vec  = aWfs + gadskorekcija
    const h    = parseFloat(p[`h${sfx}`]) || 0
    const g    = parseFloat(p[`g${sfx}`]) || 0
    const d    = parseFloat(p[`d${sfx}`]) || 0
    const hEff = h || calcH(bonNum, vec)
    const gEff = g || calcG(sKods, vec)
    const dEff = d || calcD(hEff)
    const kub  = aprekinātKubaturu(gEff, hEff, platiba)
    const nos  = SUGAS_KARTE[sKods] || 'Nezināma'
    const kods = SUGAS_KODS[sKods]  || 'P'
    const krasa= SUGAS_KRASA[sKods] || '#4caf50'
    return { sKods, nos, kods, krasa, vec, aWfs, hEff, gEff, dEff, kub }
  }).filter(Boolean)

  // Galvenā suga (pirmais slānis)
  const main = slani[0] || { sKods:1, nos:'Priede', kods:'P', krasa:'#2e7d32', vec:60, aWfs:0, hEff:0, gEff:0, dEff:0, kub:0 }

  // Kopējie rādītāji
  const gKopa        = slani.reduce((s, l) => s + l.gEff, 0)
  const kubaturaKopa = slani.reduce((s, l) => s + l.kub,  0)

  // Audzes formula tekstā (piemēram "8P 2E")
  const audzeFormula = slani.map(l =>
    `${Math.round(l.gEff / Math.max(gKopa, 1) * 10)}${l.kods}`
  ).join(' ')

  // Cirtes lēmums pēc galvenās sugas (ar biezību kā brīdinājumu)
  const { lēmums: lemumsBezAiz } = noteiktCirti(main.vec, gKopa, 'briva', main.sKods)
  const biezibasBrid = bieziba < 0.4 ? ` ⚠️ biezība ${bieziba}` : ''

  // forestEngine sortimentiem (galvenā suga)
  let sortVert = 0, sortimenti = {}, lemums = lemumsBezAiz + biezibasBrid
  if (kubaturaKopa > 0 && main.vec > 20) {
    try {
      const rez = forestEngine({
        formula: `10${main.kods}`, vec: main.vec, bon,
        h: main.hEff, g: gKopa, d: main.dEff,
        platiba, krm3ha: 0, harvestType: '', plantacija: false,
      })
      sortimenti = rez.sortiments || {}
      // Bērzam: malka tikai nokaltis audze, parastā audzē 0
      if (main.sKods === 3 && kubaturaKopa > 0) {
        sortimenti.fire = 0
        sortimenti.tara = kubaturaKopa * 0.55
        sortimenti.pulp = kubaturaKopa * 0.45
      }
      sortVert = 0
      Object.entries(sortimenti).forEach(([k, v]) => { sortVert += (v||0) * (SORT_CENAS[k]||0) })
      sortVert = Math.round(sortVert)
    } catch { /* ignorē */ }
  }

  const indVertiba = kubaturaKopa * 35

  // Izcērtamā krāja pēc lēmuma
  const gMin = 12
  let izcertamaKraja = 0
  const lBase = lemumsBezAiz.toLowerCase()
  if (lBase.includes('kailcirte') || lBase.includes('galvenā cirte')) {
    izcertamaKraja = kubaturaKopa
  } else if (lBase.includes('kopšanas cirte')) {
    const ratio = gKopa > gMin ? (gKopa - gMin) / gKopa : 0
    izcertamaKraja = Math.round(Math.min(ratio * kubaturaKopa, kubaturaKopa * 0.30))
  }

  // Nogabala numurs
  const nr_text = p.kvart != null
    ? (p.anog && p.anog !== '0' && p.anog !== 0)
      ? `${p.nog}.${p.anog}`
      : `${p.nog}-0`
    : String(i + 1)

  return {
    id: feat.id || `n${i}`, nr: i + 1, nr_text,
    sugaKods:    main.sKods,
    suga:        main.kods,
    sugaNos:     main.nos,
    sugaKrasa:   main.krasa,
    audzeFormula,
    vecums:      main.vec,
    vecumsWfs:   main.aWfs,
    taksGads,
    bon, bonNum, bieziba,
    platiba,
    h: main.hEff, g: gKopa, d: main.dEff,
    kubatura: kubaturaKopa, izcertamaKraja,
    slani,
    sortVert, sortimenti, lemums, indVertiba,
    mzVeids: p.mz_veids ?? null,
    geojson: feat, rawProps: p,
  }
}

// ─── Galvenā komponente ───────────────────────────────────────────────────────
export default function IpasumAnalīze({ onBack }) {
  const [faze,     setFaze]     = useState('ievads')
  const [kadInput, setKadInput] = useState('')
  const [kluda,    setKluda]    = useState('')
  const [ladeText, setLadeText] = useState('')
  const [kadGeom,  setKadGeom]  = useState(null)
  const [nogabali, setNogabali] = useState([])   // apstrādāti, nemainīgi
  const [editData, setEditData] = useState([])   // rediģējama kopija
  const [dapTer,          setDapTer]          = useState([])
  const [aizsardzibaStatus, setAizsardzibaStatus] = useState(AIZSARDZIBA.nav)
  const [cilne,    setCilne]    = useState('karte')
  const [slani,    setSlani]    = useState({ nogabali:true, dap:true, kadastra:true, ortofoto:false })

  const mapRef     = useRef(null)
  const leafletRef = useRef(null)
  const layersRef  = useRef({})

  // ── Karte ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (faze !== 'rezultats' || cilne !== 'karte' || !mapRef.current) return
    const initLapja = async () => {
      const L = (await import('leaflet')).default
      // Vienmēr destroy veco karti — div var būt remounted pēc cilnes maiņas
      if (leafletRef.current) {
        leafletRef.current.remove()
        leafletRef.current = null
        layersRef.current = {}
      }
      const map = L.map(mapRef.current, { zoomControl: true, attributionControl: false })
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 20 }).addTo(map)
      leafletRef.current = map
      ;['kadLayer','nogLayer','dapLayer','ortofoto'].forEach(k => {
        if (layersRef.current[k]) { map.removeLayer(layersRef.current[k]); delete layersRef.current[k] }
      })
      if (layersRef.current.labels) {
        layersRef.current.labels.forEach(l => map.removeLayer(l))
        layersRef.current.labels = []
      }
      if (layersRef.current.kadPoints) {
        layersRef.current.kadPoints.forEach(p => map.removeLayer(p))
        layersRef.current.kadPoints = []
      }
      if (slani.ortofoto) {
        layersRef.current.ortofoto = L.tileLayer.wms(
          'https://lvmgeoserver.lvm.lv/geoserver/ows?',
          { layers:'publicwms:ortofoto_2023', format:'image/png', transparent:true, opacity:0.9 }
        ).addTo(map)
      }
      if (slani.kadastra && kadGeom) {
        const kl = L.geoJSON(kadGeom, {
          style: { color:'#00BFFF', weight:3, fillOpacity:0, dashArray:null },
        }).addTo(map)
        layersRef.current.kadLayer = kl
        map.fitBounds(kl.getBounds(), { padding:[30,30] })

        // Robežpunkti (lauzuma vietas)
        const geom = kadGeom.geometry
        if (geom?.coordinates) {
          const ring = geom.type === 'Polygon'
            ? geom.coordinates[0]
            : geom.coordinates[0][0]
          layersRef.current.kadPoints = []
          ring.forEach((coord, idx) => {
            if (idx === ring.length - 1) return // pēdējais = pirmais
            const cm = L.circleMarker([coord[1], coord[0]], {
              radius: 4, color:'#00BFFF', fillColor:'#ffffff',
              fillOpacity:1, weight:2,
            }).addTo(map)
            cm.bindTooltip(String(idx + 1), {
              permanent: false, direction:'top',
            })
            layersRef.current.kadPoints.push(cm)
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
              const colorKey = n ? `${n.sugaKods}-${vg}` : ''
              return {
                color: '#333', weight: 1,
                fillColor: NOGABALA_KRASA[colorKey] || SUGAS_KRASA[n?.sugaKods] || '#888',
                fillOpacity: 0.80,
              }
            },
            onEachFeature: (feat, layer) => {
              const n = editData.find(x => x.id === feat.id)
              if (!n) return

              const lemumKrasa = getLemumKrasa(n.lemums)
              const taksInfo = n.taksGads ? ` (taks. ${n.taksGads})` : ''
              const sugasRindas = (n.slani || []).map(l =>
                `<tr><td style="color:#888;font-size:10px">${l.nos}</td>` +
                `<td style="text-align:right;font-size:10px">${l.vec} g · H${l.hEff}m · G${l.gEff} · ${l.kub}m³</td></tr>`
              ).join('')
              layer.bindPopup(
                `<div style="font-family:Arial;font-size:12px;min-width:210px">` +
                `<b style="font-size:13px">${n.nr_text} — ${n.audzeFormula || n.sugaNos}</b><br>` +
                `<table style="margin-top:6px;border-collapse:collapse;width:100%">` +
                `<tr><td style="color:#666;padding:2px 0">Vecums</td><td style="text-align:right;font-weight:600">${n.vecums} g.${taksInfo}</td></tr>` +
                `<tr><td style="color:#666">Bonitāte / Biezība</td><td style="text-align:right;font-weight:600">${n.bon} / ${n.bieziba}</td></tr>` +
                `<tr><td style="color:#666">Platība</td><td style="text-align:right;font-weight:600">${n.platiba.toFixed(2)} ha</td></tr>` +
                `<tr><td style="color:#666">G kopa / H</td><td style="text-align:right;font-weight:600">${n.g} m²/ha / ${n.h} m</td></tr>` +
                sugasRindas +
                `<tr><td style="color:#666">Kubatūra</td><td style="text-align:right;font-weight:600">${n.kubatura} m³</td></tr>` +
                `<tr><td style="color:#666">Ind. vērtība</td><td style="text-align:right;color:#4caf50;font-weight:700">~${n.indVertiba.toLocaleString()} €</td></tr>` +
                `<tr><td style="color:#666">Lēmums</td><td style="text-align:right;font-weight:700;color:${lemumKrasa};font-size:11px">${n.lemums}</td></tr>` +
                (n.mzVeids != null ? `<tr><td style="color:#666">MZ veids</td><td style="text-align:right;font-size:10px">${n.mzVeids}</td></tr>` : '') +
                `</table></div>`
              )

              // Nogabala numura label centrā
              layer.on('add', function () {
                try {
                  const center = layer.getBounds().getCenter()
                  const label = L.marker(center, {
                    icon: L.divIcon({
                      className: '',
                      html: `<div style="background:rgba(0,0,0,0.65);color:#fff;font-size:10px;font-weight:700;padding:2px 5px;border-radius:3px;white-space:nowrap;pointer-events:none">${n.nr_text}</div>`,
                      iconAnchor: [15, 10],
                    }),
                    interactive: false,
                  })
                  label.addTo(map)
                  if (!layersRef.current.labels) layersRef.current.labels = []
                  layersRef.current.labels.push(label)
                } catch { /* ignorē ja nav bounds */ }
              })
            },
          }
        ).addTo(map)
        layersRef.current.nogLayer = nl
        if (!slani.kadastra) map.fitBounds(nl.getBounds(), { padding:[30,30] })
      }
      if (slani.dap && dapTer.length > 0) {
        const dl = L.geoJSON(
          { type:'FeatureCollection', features:dapTer },
          { style:{ color:'#e53935', weight:2, fillColor:'#e53935', fillOpacity:0.18, dashArray:'4,4' },
            onEachFeature: (feat, layer) => {
              const p = feat.properties || {}
              layer.bindPopup(`🔒 Egļu aizsardzības zona`)
            }
          }
        ).addTo(map)
        layersRef.current.dapLayer = dl
      }
    }
    initLapja().catch(console.error)
    return () => {
      if (leafletRef.current && faze !== 'rezultats') {
        leafletRef.current.remove(); leafletRef.current = null
      }
    }
  }, [faze, cilne, kadGeom, editData, dapTer, slani])

  useEffect(() => {
    if (faze !== 'rezultats' && leafletRef.current) {
      leafletRef.current.remove(); leafletRef.current = null
    }
  }, [faze])

  // ── Analīze ───────────────────────────────────────────────────────────────
  const analizet = async () => {
    const kad = kadInput.replace(/\s/g, '')
    if (!/^\d{11}$/.test(kad)) {
      setKluda('Kadastra numuram jābūt 11 cipariem (piemērs: 42820040063)'); return
    }
    setKluda(''); setFaze('lade'); setLadeText('Saņem kadastra robežas...')
    console.log('🔍 DEBUG analizet sākums, kad=', kad)
    try {
      // 1. Kadastra robeža (publicwfs:kkparcel, lauks: code)
      const kadUrl = buildWFS('/publicwfs/wfs', 'publicwfs:kkparcel', `code='${kad}'`)
      console.log('🔍 KAD URL:', kadUrl)
      let kadData
      try {
        kadData = await lvmWFS(kadUrl)
      } catch (e) {
        console.log('🔍 KAD kļūda:', e.message)
        if (e.message.startsWith('WFS_400') || e.message.startsWith('WFS_500')) {
          setLadeText('Diagnostika...')
          const info = await wfsDiagnostika('/publicwfs/wfs', 'publicwfs:kkparcel')
          setFaze('ievads'); setKluda(`LVM GEO kļūda. ${info}`); return
        }
        throw e
      }
      console.log('🔍 KAD features:', kadData?.features?.length, 'pirmais:', kadData?.features?.[0]?.properties?.code)
      const kadFeat = kadData?.features?.[0]
      if (!kadFeat) {
        setFaze('ievads'); setKluda(`Kadastra '${kad}' nav atrasts LVM GEO.`); return
      }
      setKadGeom(kadFeat)

      setLadeText('Iegūst VMD nogabalu datus...')

      // 2. VMD nogabali — pilnais debug
      const vmdUrl = buildWFS('/publicwfs/ows', 'publicwfs:vmdpubliccompartments', `kadastrs='${kad}'`, 500)
      console.log('=== WFS URL ===', vmdUrl)

      const vmdRaw = await fetch(vmdUrl)
      const vmdText = await vmdRaw.text()
      console.log('=== RESPONSE STATUS ===', vmdRaw.status)
      console.log('=== WFS RAW RESPONSE (pirmie 2000 simboli) ===')
      console.log(vmdText.substring(0, 2000))

      let vmdData
      try { vmdData = JSON.parse(vmdText) } catch (e) { throw new Error('WFS nav JSON: ' + vmdText.slice(0, 200)) }
      if (vmdData.error) throw new Error(vmdData.error)

      console.log('=== FEATURES SKAITS ===', vmdData.features?.length)
      console.log('=== PIRMAIS FEATURE ===', JSON.stringify(vmdData.features?.[0], null, 2))

      const nogFeatures = vmdData?.features || []

      setLadeText('Iegūst aizsardzības teritorijas...')

      // 3. Egļu aizsardzības nogabali — vmdspruceprotcompartments (cadaster lauks)
      let dapFeatures = []
      try {
        const dapData = await lvmWFS(
          buildWFS('/publicwfs/ows', 'publicwfs:vmdspruceprotcompartments', `cadaster='${kad}'`, 20)
        )
        dapFeatures = dapData?.features || []
      } catch { /* nav kritiski */ }

      setLadeText('Aprēķina meža vērtību...')

      const norm = nogFeatures.map((f, i) => apstradatNogabalu(f, i))

      // Aizsardzības statuss pārraksta lemumu ja cirte aizliegta
      const aizsStatus = getAizsardzibaStatus(dapFeatures)
      const normArAizsardzibu = norm.map(n => ({
        ...n,
        lemums: aizsStatus.cirte === 'aizliegta' ? 'Cirte aizliegta'
              : aizsStatus.cirte === 'ierobežota' ? `${n.lemums !== '—' ? n.lemums + ' — ' : ''}Ierobežota`
              : n.lemums,
      }))

      setNogabali(normArAizsardzibu)
      setEditData(normArAizsardzibu.map(n => ({ ...n })))
      setDapTer(dapFeatures)
      setAizsardzibaStatus(aizsStatus)
      setCilne('karte')
      setFaze('rezultats')

    } catch (e) {
      console.error('IpasumAnalīze:', e)
      setFaze('ievads')
      setKluda(`Kļūda: ${e.message.slice(0, 200)}`)
    }
  }

  // ── Tabulas rediģēšana ────────────────────────────────────────────────────
  const updateRinda = (i, lauks, val) => {
    setEditData(prev => {
      const arr = [...prev]
      const r = { ...arr[i], [lauks]: lauks === 'bon' ? val : (parseFloat(val) || 0) }
      r.suga     = SUGAS_KODS[r.sugaKods]  || 'P'
      r.sugaNos  = SUGAS_KARTE[r.sugaKods] || 'Nezināma'
      r.sugaKrasa= SUGAS_KRASA[r.sugaKods] || '#4caf50'
      const h = r.h || calcH(r.bon, r.vecums)
      const g = r.g || calcG(r.suga, r.vecums)
      r.kubatura = g && h && r.platiba ? Math.round(g * h * 0.45 * r.platiba) : 0
      r.indVertiba = r.kubatura * 35
      if (r.kubatura > 0 && r.vecums > 20) {
        try {
          const rez = forestEngine({ formula:`10${r.suga}`, vec:r.vecums, bon:r.bon, h, g, d:r.d||calcD(h), platiba:r.platiba, krm3ha:0, harvestType:'', plantacija:false })
          r.lemums = rez.decision || '—'; r.sortimenti = rez.sortiments || {}
          let sv = 0
          Object.entries(r.sortimenti).forEach(([k,v]) => { sv += (v||0)*(SORT_CENAS[k]||0) })
          r.sortVert = Math.round(sv)
        } catch { r.lemums='—'; r.sortVert=0; r.sortimenti={} }
      } else { r.lemums='—'; r.sortVert=0; r.sortimenti={} }
      arr[i] = r
      return arr
    })
  }

  // ── PDF eksports ──────────────────────────────────────────────────────────
  const eksportPDF = () => {
    const datums = new Date().toLocaleDateString('lv-LV')
    const kopPlat = editData.reduce((s,n)=>s+n.platiba, 0)
    const kopKub  = editData.reduce((s,n)=>s+n.kubatura, 0)
    const kopVert = editData.reduce((s,n)=>s+n.indVertiba, 0)
    const rindas  = editData.map(n =>
      `<tr><td>${n.nr_text}</td><td>${n.sugaNos}</td><td>${n.vecums}</td><td>${n.bon}</td>` +
      `<td class=r>${n.platiba.toFixed(2)}</td><td class=r>${n.h||'—'}</td>` +
      `<td class=r>${n.g||'—'}</td><td class=r>${n.kubatura}</td>` +
      `<td>${n.lemums}</td><td class=r>${n.indVertiba.toLocaleString()}</td></tr>`
    ).join('')
    const html = `<!DOCTYPE html><html><head><meta charset="UTF-8">
<title>Meža analīze — ${kadInput}</title><style>
body{font:11px Arial,sans-serif;padding:20px;color:#111}
h1{font-size:16px;color:#225522;margin:0 0 6px}
.meta{font-size:10px;color:#555;margin-bottom:14px;display:flex;gap:30px;flex-wrap:wrap}
table{border-collapse:collapse;width:100%;margin-top:10px;font-size:10px}
th{background:#225522;color:#fff;padding:5px 6px;white-space:nowrap}
th.r,td.r{text-align:right}
td{border:1px solid #ddd;padding:4px 6px}
.tot td{background:#e8f5e9;font-weight:bold}
.foot{margin-top:16px;font-size:9px;color:#aaa;border-top:1px solid #ddd;padding-top:6px}
</style></head><body>
<h1>🌲 Meža īpašuma analīze · LVM GEO dati</h1>
<div class="meta">
  <div><b>Kadastra Nr.:</b> ${kadInput}</div><div><b>Datums:</b> ${datums}</div>
  <div><b>Kopplatība:</b> ${kopPlat.toFixed(2)} ha</div>
  <div><b>Kopkubatūra:</b> ${kopKub.toFixed(0)} m³</div>
  <div><b>Ind. vērtība:</b> ${kopVert.toLocaleString()} € (×35€/m³)</div>
</div>
${dapTer.length>0?`<p style="color:#c62828;font-size:10px">⚠️ ${dapTer.length} egļu aizsardzības zona(s)</p>`:''}
<table><thead><tr>
  <th>Nogabals</th><th>Suga</th><th>Vec.</th><th>Bon.</th>
  <th class=r>ha</th><th class=r>H m</th><th class=r>G</th>
  <th class=r>m³</th><th>Lēmums</th><th class=r>Ind.€</th>
</tr></thead><tbody>${rindas}</tbody>
<tfoot><tr class=tot><td colspan=4>Kopā</td>
  <td class=r>${kopPlat.toFixed(2)}</td><td></td><td></td>
  <td class=r>${kopKub.toFixed(0)}</td><td></td>
  <td class=r>${kopVert.toLocaleString()}</td>
</tr></tfoot></table>
<div class=foot>Ģenerēts: meža-tirgus.lv · Avots: LVM GEO WFS · Kubatūra: G×H×0.45×ha · Vērtība: indikatīva</div>
</body></html>`
    const w = window.open('', '_blank')
    w.document.write(html); w.document.close(); w.print()
  }

  // ── Aprēķini kopsavilkumam ─────────────────────────────────────────────
  const kopPlatiba  = editData.reduce((s,n) => s + n.platiba, 0)
  const kopKubatura = editData.reduce((s,n) => s + n.kubatura, 0)
  const kopIndVert  = editData.reduce((s,n) => s + n.indVertiba, 0)
  const izcGalv = editData.reduce((s,n) =>
    (n.lemums.toLowerCase().includes('kailcirte') || n.lemums.toLowerCase().includes('galvenā cirte'))
      ? s + n.izcertamaKraja : s, 0)
  const izcKops = editData.reduce((s,n) =>
    n.lemums.toLowerCase().includes('kopšanas cirte')
      ? s + n.izcertamaKraja : s, 0)

  // Dominējošā suga (pēc platības)
  const sugasPaPlat = editData.reduce((acc, n) => {
    acc[n.sugaNos] = (acc[n.sugaNos] || 0) + n.platiba; return acc
  }, {})
  const domSuga = Object.entries(sugasPaPlat).sort((a,b)=>b[1]-a[1])[0]?.[0] || '—'

  // Svērtais vidējais vecums
  const vidVecums = kopPlatiba > 0
    ? Math.round(editData.reduce((s,n) => s + n.vecums * n.platiba, 0) / kopPlatiba)
    : 0

  // ── Stili ─────────────────────────────────────────────────────────────
  const C = { bg:DS.bg, card:DS.bgCard, inner:DS.bgInner, border:DS.greenBdr,
              text:DS.text, dim:DS.textDim, sec:DS.textSec, green:DS.green }
  const inp = {
    background:DS.bgDeep, border:`1px solid ${DS.greenBdr}`, color:DS.text,
    borderRadius:6, padding:'10px 14px', fontSize:16, outline:'none',
    width:'100%', boxSizing:'border-box', fontFamily:F.family,
  }
  const btnPrimary = {
    background:`linear-gradient(135deg,${DS.green},${DS.greenDk})`,
    color:'white', border:'none', borderRadius:8,
    padding:'13px 28px', fontSize:15, fontWeight:700, cursor:'pointer', minHeight:44,
  }
  const tpStyle = { background:DS.bgCard, border:`1px solid ${DS.greenBdr}`, borderRadius:8, fontSize:11, color:DS.text }
  const tkStyle = { fill:DS.textDim, fontSize:10 }

  // ── Diagrammu dati ─────────────────────────────────────────────────────
  const pieData = Object.entries(sugasPaPlat)
    .map(([nos, ha]) => ({
      name: nos,
      value: Math.round(ha * 100) / 100,
      krasa: editData.find(n => n.sugaNos === nos)?.sugaKrasa || '#4caf50',
    }))

  const barKub = editData
    .filter(n => n.kubatura > 0)
    .map(n => ({ name: n.nr_text, m3: n.kubatura, fill: n.sugaKrasa }))

  const barVert = editData
    .filter(n => n.sortVert > 0)
    .map(n => ({ name: n.nr_text, eur: n.sortVert, fill: n.sugaKrasa }))

  const sortPieData = Object.entries(
    editData.reduce((acc, n) => {
      Object.entries(n.sortimenti).forEach(([k, v]) => { acc[k] = (acc[k]||0) + (v||0) })
      return acc
    }, {})
  ).filter(([,v]) => v > 0.5)
    .map(([k, v]) => ({
      name: SORT_NOS[k] || k,
      value: Math.round(v),
      fill: SORT_KRASA[k] || '#4caf50',
    }))

  const sortKopa = editData.reduce((acc, n) => {
    Object.entries(n.sortimenti).forEach(([k,v]) => { acc[k] = (acc[k]||0) + (v||0) })
    return acc
  }, {})
  const sortBar = Object.entries(sortKopa)
    .filter(([,v]) => v > 0.5)
    .map(([k,v]) => ({ name: SORT_NOS[k]||k, m3: Math.round(v), eur: Math.round(v*(SORT_CENAS[k]||0)) }))

  // ═══════════════════════════════════════════════════════════════════════
  // FĀZE: IEVADS
  // ═══════════════════════════════════════════════════════════════════════
  if (faze === 'ievads') return (
    <div style={{ minHeight:'100vh', background:C.bg, color:C.text, fontFamily:F.family }}>
      <style>{spinnerCSS}</style>
      <div style={{ background:DS.glass, borderBottom:`1px solid ${C.border}`, backdropFilter:'blur(8px)',
        padding:'0 20px', height:52, display:'flex', alignItems:'center', gap:12,
        position:'sticky', top:0, zIndex:10 }}>
        {onBack && <button onClick={onBack} style={{ background:'none', border:'none', color:C.green,
          fontSize:22, cursor:'pointer', minWidth:36, minHeight:44 }}>←</button>}
        <div>
          <div style={{ color:C.green, fontSize:F.md, fontWeight:F.weightBold }}>🗺 Īpašuma analīze</div>
          <div style={{ color:C.dim, fontSize:F.xs }}>LVM GEO automātiskā meža inventarizācija</div>
        </div>
      </div>

      <div style={{ maxWidth:560, margin:'0 auto', padding:'32px 20px 60px' }}>
        <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:16, padding:'28px 24px', marginBottom:16 }}>
          <div style={{ fontSize:13, color:C.sec, marginBottom:20, lineHeight:1.6 }}>
            Ievadi 11-ciparu kadastra numuru — sistēma iegūst nogabalu datus no LVM GEO,
            aprēķina kubatūru (G×H×0.45×ha) un indikatīvo vērtību.
          </div>
          <label style={{ fontSize:11, color:C.dim, fontWeight:600, display:'block', marginBottom:6, textTransform:'uppercase', letterSpacing:'0.08em' }}>
            Kadastra numurs
          </label>
          <div style={{ display:'flex', gap:10, marginBottom:8 }}>
            <input value={kadInput}
              onChange={e => setKadInput(e.target.value.replace(/[^\d\s]/g,''))}
              onKeyDown={e => e.key==='Enter' && analizet()}
              placeholder="Piemērs: 42820040063" maxLength={14}
              style={{ ...inp, flex:1 }} />
            <button onClick={analizet} style={{ ...btnPrimary, padding:'13px 20px' }}>🔍</button>
          </div>
          <div style={{ fontSize:11, color:C.dim }}>
            11 cipari bez atstarpēm. <span style={{ color:C.green }}>Piemērs: 42820040063</span>
          </div>
          {kluda && (
            <div style={{ marginTop:12, background:'#2a0a0a', border:'1px solid #c62828',
              borderRadius:8, padding:'10px 14px', fontSize:12, color:'#ef9a9a' }}>
              ⚠️ {kluda}
            </div>
          )}
          <button onClick={analizet} style={{ ...btnPrimary, width:'100%', marginTop:20 }}>
            Analizēt īpašumu →
          </button>
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(160px,1fr))', gap:10, marginBottom:20 }}>
          {[
            { icon:'🌲', text:'VMD nogabali — suga, vecums, bonitāte, platība' },
            { icon:'📊', text:'Kubatūra G×H×0.45×ha + forestEngine sortimenti' },
            { icon:'🔒', text:'Egļu aizsardzības nogabali (publicwfs)' },
            { icon:'🗺', text:'Leaflet karte + rediģējama tabula + diagrammas' },
          ].map((x,i) => (
            <div key={i} style={{ background:C.inner, border:`1px solid ${C.border}`, borderRadius:10, padding:'12px 14px' }}>
              <div style={{ fontSize:20, marginBottom:6 }}>{x.icon}</div>
              <div style={{ fontSize:11, color:C.sec, lineHeight:1.5 }}>{x.text}</div>
            </div>
          ))}
        </div>

        <div style={{ textAlign:'center', paddingTop:8, borderTop:`1px solid ${C.border}` }}>
          <div style={{ fontSize:12, color:C.dim, marginBottom:10 }}>Vai izmanto VMD inventarizācijas PDF:</div>
          <button onClick={onBack} style={{ background:'transparent', border:`1px solid ${C.border}`,
            color:C.sec, borderRadius:8, padding:'10px 20px', fontSize:13, cursor:'pointer', fontFamily:F.family }}>
            📄 VMD PDF analīze (manuāli)
          </button>
        </div>
      </div>
    </div>
  )

  // ═══════════════════════════════════════════════════════════════════════
  // FĀZE: IELĀDE
  // ═══════════════════════════════════════════════════════════════════════
  if (faze === 'lade') return (
    <div style={{ minHeight:'100vh', background:C.bg, display:'flex', alignItems:'center',
      justifyContent:'center', flexDirection:'column', gap:20, fontFamily:F.family }}>
      <style>{spinnerCSS}{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <div style={{ width:52, height:52, border:`3px solid ${DS.greenBdr}`,
        borderTop:`3px solid ${DS.green}`, borderRadius:'50%', animation:'spin 1s linear infinite' }} />
      <div style={{ textAlign:'center' }}>
        <div style={{ color:DS.green, fontSize:F.md, fontWeight:600, marginBottom:6 }}>🗺 Analizē īpašumu</div>
        <div style={{ color:C.sec, fontSize:F.sm }}>{ladeText}</div>
        <div style={{ color:C.dim, fontSize:F.xs, marginTop:4 }}>{kadInput}</div>
      </div>
    </div>
  )

  // ═══════════════════════════════════════════════════════════════════════
  // FĀZE: REZULTĀTI
  // ═══════════════════════════════════════════════════════════════════════
  const CILNES = [
    { id:'karte',     label:'🗺 Karte'      },
    { id:'tabula',    label:'📋 Tabula'     },
    { id:'diagrammas',label:'📊 Diagrammas' },
  ]

  return (
    <div style={{ minHeight:'100vh', background:C.bg, color:C.text, fontFamily:F.family }}>
      <style>{spinnerCSS}</style>

      {/* Header */}
      <div style={{ background:DS.glass, borderBottom:`1px solid ${C.border}`, backdropFilter:'blur(8px)',
        padding:'0 16px', height:52, display:'flex', alignItems:'center', gap:10,
        position:'sticky', top:0, zIndex:10 }}>
        <button onClick={() => setFaze('ievads')} style={{ background:'none', border:'none', color:C.green,
          fontSize:22, cursor:'pointer', minWidth:36, minHeight:44 }}>←</button>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ color:C.green, fontSize:F.md, fontWeight:F.weightBold, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
            🗺 {kadInput}
          </div>
          <div style={{ color:C.dim, fontSize:F.xs }}>
            {editData.length} nogabali · {kopPlatiba.toFixed(2)} ha · {kopKubatura.toFixed(0)} m³
            {editData[0]?.taksGads && (
              <span style={{ color:'#f9a825', marginLeft:6 }}>· taks. {editData[0].taksGads}</span>
            )}
          </div>
        </div>
        <button onClick={eksportPDF} style={{ background:DS.greenDk, color:'white',
          border:`1px solid ${DS.green}`, borderRadius:8, padding:'8px 14px',
          fontSize:12, fontWeight:600, cursor:'pointer', flexShrink:0 }}>
          📥 PDF
        </button>
      </div>

      {/* Egļu aizsardzības josla (ja atrasta) */}
      {aizsardzibaStatus.cirte !== 'briva' && (
        <div style={{
          margin:'10px 16px 0', padding:'8px 14px', borderRadius:8, fontSize:13, fontWeight:600,
          background: aizsardzibaStatus.cirte === 'aizliegta' ? '#2a0a0a' : '#1a1000',
          border: `1px solid ${aizsardzibaStatus.cirte === 'aizliegta' ? '#c62828' : '#e65100'}`,
          color: aizsardzibaStatus.cirte === 'aizliegta' ? '#ef9a9a' : '#ffcc80',
        }}>
          {aizsardzibaStatus.label}
          {dapTer.length > 0 && <span style={{ fontSize:11, marginLeft:8, opacity:0.7 }}>({dapTer.length} teritorija)</span>}
        </div>
      )}

      {/* DAP brīdinājums — mikroliegumi/dabas liegumi nav publiski WFS */}
      <div style={{
        margin:'8px 16px 0', padding:'8px 14px', borderRadius:8,
        background:'#1a1408', border:'1px solid #f9a82544',
        display:'flex', alignItems:'center', justifyContent:'space-between', gap:12, flexWrap:'wrap',
      }}>
        <div style={{ fontSize:12, color:'#ffcc80' }}>
          ⚠️ Pārbaudiet mikroliegrumus, dabas liegrumus un aizsargjoslas:
        </div>
        <a
          href={`https://www.dap.gov.lv/lv/aizsargajamas-teritorijas/mikroliegumi?search=${kadInput}`}
          target="_blank" rel="noreferrer"
          style={{
            fontSize:12, fontWeight:700, color:'#f9a825',
            textDecoration:'none', padding:'4px 12px',
            border:'1px solid #f9a82566', borderRadius:6,
            background:'#f9a82511', flexShrink:0,
          }}
        >
          dap.gov.lv →
        </a>
      </div>

      {/* Kopsavilkuma kartiņas */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(120px,1fr))', gap:8, padding:'10px 16px 0' }}>
        {[
          { label:'Kopplatība',     val:`${kopPlatiba.toFixed(1)} ha`,        color:C.green   },
          { label:'Nogabali',       val: editData.length,                      color:DS.info   },
          { label:'Dom. suga',      val: domSuga,                              color:'#f9a825' },
          { label:'Vid. vecums',    val: vidVecums ? `${vidVecums} g.` : '—', color:C.sec     },
          { label:'Kopkubatūra',    val:`${kopKubatura.toFixed(0)} m³`,       color:'#4ade80' },
          { label:'Galv. cirtē',    val: izcGalv > 0 ? `${izcGalv} m³` : '—', color:'#2e7d32' },
          { label:'Kopš. cirtē',    val: izcKops > 0 ? `${izcKops} m³` : '—', color:'#f9a825' },
          { label:'Ind. vērtība',   val:`${kopIndVert.toLocaleString()} €`,   color:'#4ade80' },
        ].map((x,i) => (
          <div key={i} style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:10, padding:'10px 12px' }}>
            <div style={{ fontSize:9, color:C.dim, marginBottom:3, textTransform:'uppercase', letterSpacing:'0.06em' }}>{x.label}</div>
            <div style={{ fontSize:16, fontWeight:700, color:x.color, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{x.val}</div>
          </div>
        ))}
      </div>

      {/* Cilnes */}
      <div style={{ display:'flex', gap:0, padding:'10px 16px 0', borderBottom:`1px solid ${C.border}`, overflowX:'auto' }}>
        {CILNES.map(c => (
          <button key={c.id} onClick={() => setCilne(c.id)} style={{
            background:'none', border:'none', fontFamily:F.family, whiteSpace:'nowrap',
            borderBottom: cilne===c.id ? `2px solid ${DS.green}` : '2px solid transparent',
            color: cilne===c.id ? DS.green : C.sec,
            padding:'8px 16px', fontSize:F.sm, fontWeight: cilne===c.id ? 600 : 400, cursor:'pointer',
          }}>{c.label}</button>
        ))}
      </div>

      {/* ── KARTE ── */}
      {cilne === 'karte' && (
        <div style={{ padding:'12px 16px 80px' }}>
          <div style={{ display:'flex', flexWrap:'wrap', gap:8, marginBottom:10 }}>
            {[
              { id:'nogabali', label:'🌲 Nogabali' },
              { id:'dap',      label:'🔒 Aizsardzība' },
              { id:'kadastra', label:'📐 Kadastra' },
              { id:'ortofoto', label:'🛰 Ortofoto' },
            ].map(s => (
              <button key={s.id} onClick={() => setSlani(prev=>({...prev,[s.id]:!prev[s.id]}))} style={{
                padding:'5px 12px', borderRadius:16, fontSize:12, cursor:'pointer', fontFamily:F.family,
                background: slani[s.id] ? `${DS.green}22` : C.inner,
                border:`1px solid ${slani[s.id] ? DS.green : C.border}`,
                color: slani[s.id] ? DS.green : C.dim, fontWeight: slani[s.id] ? 600 : 400,
              }}>{s.label}</button>
            ))}
          </div>
          <div ref={mapRef} style={{ width:'100%', height:420, borderRadius:12,
            border:`1px solid ${C.border}`, background:'#1a2e1a', overflow:'hidden' }} />

          {/* Leģenda — suga + vecuma grupa */}
          <div style={{ display:'flex', flexWrap:'wrap', gap:6, marginTop:10 }}>
            {[...new Map(editData.map(n => {
              const vg = getVecumaGrupa(n.sugaKods, n.vecums)
              const vgLabel = ['','I','II','III','IV'][vg] || ''
              return [`${n.sugaNos} ${vgLabel}`, NOGABALA_KRASA[`${n.sugaKods}-${vg}`] || n.sugaKrasa]
            }))].map(([label, krasa]) => (
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

          {/* Nogabalu saraksts zem kartes */}
          {editData.length === 0 && (
            <div style={{ marginTop:16, padding:'20px', textAlign:'center', color:C.dim, fontSize:13 }}>
              Nav atrasti nogabali VMD datos šim kadastra numuram.
            </div>
          )}
        </div>
      )}

      {/* ── TABULA ── */}
      {cilne === 'tabula' && (
        <div style={{ padding:'12px 8px 80px', overflowX:'auto' }}>
          <div style={{ fontSize:11, color:C.dim, padding:'0 8px 10px' }}>
            Noklikšķini uz lauka lai rediģētu — kubatūra un vērtība atjaunojas automātiski.
          </div>
          <table style={{ width:'100%', borderCollapse:'collapse', minWidth:860, fontSize:12 }}>
            <thead>
              <tr style={{ background:'#1b4a1b' }}>
                {[
                  { h:'Nog.',     mw:55  },
                  { h:'Suga',     mw:90  },
                  { h:'Vec.',     mw:50  },
                  { h:'Bon.',     mw:50  },
                  { h:'ha',       mw:55  },
                  { h:'H m',      mw:45  },
                  { h:'G m²/ha',  mw:65  },
                  { h:'Kubatūra', mw:70  },
                  { h:'Lēmums',   mw:120 },
                  { h:'Ind. €',   mw:75  },
                ].map(({ h, mw }, i) => (
                  <th key={i} style={{ padding:'6px 8px', textAlign:i<2?'left':'right',
                    color:C.sec, fontWeight:700, fontSize:10, whiteSpace:'nowrap',
                    border:`1px solid ${C.border}`, minWidth: mw }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {editData.map((n,i) => (
                <tr key={n.id} style={{ background: i%2===0 ? C.inner : C.bg }}>
                  <td style={{ padding:'4px 8px', border:`1px solid ${C.border}`, color:C.dim, fontWeight:600, whiteSpace:'nowrap' }}>{n.nr_text}</td>
                  <td style={{ padding:'4px 8px', border:`1px solid ${C.border}`, color:n.sugaKrasa, fontWeight:700 }}>{n.sugaNos}</td>
                  {/* Vec. rediģējams */}
                  <td style={{ padding:'2px 4px', border:`1px solid ${C.border}` }}>
                    <input type="number" value={n.vecums} onChange={e=>updateRinda(i,'vecums',e.target.value)}
                      style={{ background:'transparent', border:'none', color:C.text, width:48, textAlign:'right', fontSize:12, fontFamily:F.family }} />
                  </td>
                  {/* Bon. rediģējams */}
                  <td style={{ padding:'2px 4px', border:`1px solid ${C.border}` }}>
                    <select value={n.bon} onChange={e=>updateRinda(i,'bon',e.target.value)}
                      style={{ background:'transparent', border:'none', color:C.sec, fontSize:12, cursor:'pointer', fontFamily:F.family }}>
                      {['Ia','I','II','III','IV','V'].map(b=><option key={b} value={b} style={{ background:'#111f11' }}>{b}</option>)}
                    </select>
                  </td>
                  {/* Platiba rediģējama */}
                  <td style={{ padding:'2px 4px', border:`1px solid ${C.border}` }}>
                    <input type="number" step="0.01" value={n.platiba.toFixed(2)} onChange={e=>updateRinda(i,'platiba',e.target.value)}
                      style={{ background:'transparent', border:'none', color:C.text, width:60, textAlign:'right', fontSize:12, fontFamily:F.family }} />
                  </td>
                  <td style={{ padding:'4px 8px', border:`1px solid ${C.border}`, textAlign:'right', color:C.sec }}>{n.h||'—'}</td>
                  <td style={{ padding:'4px 8px', border:`1px solid ${C.border}`, textAlign:'right', color:C.sec }}>{n.g||'—'}</td>
                  <td style={{ padding:'4px 8px', border:`1px solid ${C.border}`, textAlign:'right', fontWeight:700, color:n.kubatura>0?C.text:C.dim }}>
                    {n.kubatura > 0 ? n.kubatura : '—'}
                  </td>
                  <td style={{ padding:'4px 8px', border:`1px solid ${C.border}`, textAlign:'left', color:C.dim, fontSize:11, whiteSpace:'nowrap' }}>{n.lemums}</td>
                  <td style={{ padding:'4px 8px', border:`1px solid ${C.border}`, textAlign:'right', fontWeight:700, color:'#4ade80' }}>
                    {n.indVertiba > 0 ? n.indVertiba.toLocaleString() : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr style={{ background:'#0a2a0a' }}>
                <td colSpan={4} style={{ padding:'6px 8px', border:`1px solid ${C.border}`, fontWeight:700, color:C.green }}>Kopā</td>
                <td style={{ padding:'6px 8px', border:`1px solid ${C.border}`, textAlign:'right', fontWeight:700, color:C.text }}>{kopPlatiba.toFixed(2)}</td>
                <td colSpan={2} style={{ border:`1px solid ${C.border}` }}/>
                <td style={{ padding:'6px 8px', border:`1px solid ${C.border}`, textAlign:'right', fontWeight:700, color:C.text }}>{kopKubatura.toFixed(0)}</td>
                <td style={{ border:`1px solid ${C.border}` }}/>
                <td style={{ padding:'6px 8px', border:`1px solid ${C.border}`, textAlign:'right', fontWeight:700, color:'#4ade80' }}>{kopIndVert.toLocaleString()}</td>
              </tr>
            </tfoot>
          </table>
          <div style={{ fontSize:10, color:C.dim, padding:'8px 8px 0' }}>
            * Kubatūra = G × H × 0.45 × ha · Ind. vērtība = kubatūra × 35 €/m³ (orientējoša)
          </div>
        </div>
      )}

      {/* ── DIAGRAMMAS ── */}
      {cilne === 'diagrammas' && (
        <div style={{ padding:'16px 16px 80px' }}>

          {/* Platība pa sugām — sektoru diagramma */}
          {pieData.length > 0 && (
            <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:12, padding:16, marginBottom:14 }}>
              <div style={{ fontSize:12, fontWeight:700, color:C.green, marginBottom:12 }}>📊 Platības sadalījums pa sugām</div>
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie data={pieData} dataKey="value" nameKey="name"
                    cx="50%" cy="50%" outerRadius={90} innerRadius={30}
                    label={({name,value,percent})=>`${name} ${value}ha (${(percent*100).toFixed(0)}%)`}
                    labelLine={{ stroke:C.sec, strokeWidth:1 }}>
                    {pieData.map((e,i) => <Cell key={i} fill={e.krasa} />)}
                  </Pie>
                  <Tooltip contentStyle={tpStyle} formatter={v=>[`${v} ha`,'Platība']} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Kubatūra pa nogabaliem */}
          {barKub.length > 0 && (
            <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:12, padding:16, marginBottom:14 }}>
              <div style={{ fontSize:12, fontWeight:700, color:C.green, marginBottom:12 }}>🪵 Kubatūra pa nogabaliem (m³)</div>
              <ResponsiveContainer width="100%" height={Math.min(220, barKub.length*32+60)}>
                <BarChart data={barKub} layout="vertical" margin={{ left:30, right:20 }}>
                  <XAxis type="number" tick={tkStyle} />
                  <YAxis type="category" dataKey="name" tick={{ ...tkStyle, fontSize:11 }} width={50} />
                  <Tooltip contentStyle={tpStyle} formatter={v=>[`${v} m³`,'Kubatūra']} />
                  <Bar dataKey="m3" radius={[0,4,4,0]}>
                    {barKub.map((e,i) => <Cell key={i} fill={e.fill} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Vērtība pa nogabaliem */}
          {barVert.length > 0 && (
            <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:12, padding:16, marginBottom:14 }}>
              <div style={{ fontSize:12, fontWeight:700, color:C.green, marginBottom:12 }}>💰 Vērtība pa nogabaliem (€)</div>
              <ResponsiveContainer width="100%" height={Math.min(220, barVert.length*32+60)}>
                <BarChart data={barVert} layout="vertical" margin={{ left:30, right:20 }}>
                  <XAxis type="number" tick={tkStyle} />
                  <YAxis type="category" dataKey="name" tick={{ ...tkStyle, fontSize:11 }} width={50} />
                  <Tooltip contentStyle={tpStyle} formatter={v=>[`${v.toLocaleString()} €`,'Vērtība']} />
                  <Bar dataKey="eur" radius={[0,4,4,0]}>
                    {barVert.map((e,i) => <Cell key={i} fill={e.fill} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Sortimentu sadalījums — sektoru */}
          {sortPieData.length > 0 && (
            <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:12, padding:16, marginBottom:14 }}>
              <div style={{ fontSize:12, fontWeight:700, color:C.green, marginBottom:12 }}>🪵 Sortimentu sadalījums (m³)</div>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={sortPieData} dataKey="value" nameKey="name"
                    cx="50%" cy="50%" outerRadius={80} innerRadius={28}
                    label={({name,value})=>`${name} ${value}m³`} labelLine={{ stroke:C.sec, strokeWidth:1 }}>
                    {sortPieData.map((e,i) => <Cell key={i} fill={e.fill} />)}
                  </Pie>
                  <Tooltip contentStyle={tpStyle} formatter={v=>[`${v} m³`,'Apjoms']} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Sortimentu vērtība */}
          {sortBar.length > 0 && (
            <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:12, padding:16, marginBottom:14 }}>
              <div style={{ fontSize:12, fontWeight:700, color:C.green, marginBottom:12 }}>💰 Sortimentu sadalījums (m³ un €)</div>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={sortBar} margin={{ bottom:40 }}>
                  <XAxis dataKey="name" tick={{ ...tkStyle, fontSize:9 }} angle={-30} textAnchor="end" interval={0} />
                  <YAxis tick={tkStyle} />
                  <Tooltip contentStyle={tpStyle}
                    formatter={(v,n) => [`${v.toLocaleString()} ${n==='eur'?'€':'m³'}`, n==='eur'?'Vērtība':'Apjoms']} />
                  <Bar dataKey="m3"  fill={DS.greenMd||'#4caf50'} name="m3"  radius={[4,4,0,0]} />
                  <Bar dataKey="eur" fill="#f9a825"               name="eur" radius={[4,4,0,0]} />
                  <Legend formatter={v=>v==='m3'?'m³':'€'} wrapperStyle={{ color:C.dim, fontSize:11 }} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Kopsavilkuma kartīte */}
          <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:12, padding:16 }}>
            <div style={{ fontSize:12, fontWeight:700, color:C.green, marginBottom:12 }}>🌲 Kopsavilkums</div>
            {[
              ['Kopplatība', `${kopPlatiba.toFixed(2)} ha`],
              ['Dominējošā suga', domSuga],
              ['Vidējais vecums', `${vidVecums} gadi`],
              ['Kopkubatūra (G×H×0.45×ha)', `${kopKubatura.toFixed(0)} m³`],
              ['Indikatīvā vērtība (×35€/m³)', `${kopIndVert.toLocaleString()} €`],
              ...(dapTer.length > 0 ? [['⚠️ Egļu aizsardzības zonas', `${dapTer.length} gab.`]] : []),
            ].map(([k,v],i) => (
              <div key={i} style={{ display:'flex', justifyContent:'space-between', padding:'6px 0',
                borderBottom:`1px solid ${C.border}`, fontSize:13 }}>
                <span style={{ color:C.sec }}>{k}</span>
                <span style={{ color:C.text, fontWeight:600 }}>{v}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
