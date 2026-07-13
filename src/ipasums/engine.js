import { forestEngine } from '../forestEngine'
import { getVeidaugstums } from '../tables'
import { getBonitate } from '../bonityEngine'
import { thinningRemoveG } from '../thinningEngine'
import {
  SUGAS_KARTE, SUGAS_KODS, SUGAS_KRASA, BONITATES,
  SORT_CENAS, AIZSARDZIBA,
} from './constants'

// ── WFS ──────────────────────────────────────────────────────────────────────

export function buildWFS(geoPath, typeNames, cqlFilter, count = 100) {
  const cqlEnc = cqlFilter
    ? '&CQL_FILTER=' + cqlFilter
        .replace(/ /g,'%20').replace(/\(/g,'%28')
        .replace(/\)/g,'%29').replace(/,/g,'%2C')
    : ''
  return `/api/lvmgeo${geoPath}` +
    `?service=WFS&version=2.0.0&request=GetFeature` +
    `&typeNames=${encodeURIComponent(typeNames)}` +
    `&outputFormat=application/json&srsName=EPSG:4326&count=${count}` +
    cqlEnc
}

export async function lvmWFS(url) {
  const r = await fetch(url)
  if (!r.ok) {
    const body = await r.text().catch(() => '')
    throw new Error(`WFS_${r.status}:${body.slice(0, 300)}`)
  }
  const data = await r.json()
  if (data.error) throw new Error(data.error)
  return data
}

export async function wfsDiagnostika(geoPath, typeNames) {
  try {
    const data = await lvmWFS(buildWFS(geoPath, typeNames, null, 1))
    const feat = data?.features?.[0]
    if (feat?.properties) return `Pieejamie lauki: ${Object.keys(feat.properties).join(', ')}`
    return `Nav features. totalFeatures: ${data?.totalFeatures ?? '?'}`
  } catch (e) {
    return `Diagnostika neizdevās: ${e.message.slice(0, 150)}`
  }
}

export function geojsonToWKT(geojson) {
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

// ── Meža aprēķini ─────────────────────────────────────────────────────────────

export function calcH(bonitāte, vecums) {
  const base = { 1:1.1, 2:1.0, 3:0.9, 4:0.8, 5:0.7, 6:0.6 }
  return Math.round((base[bonitāte] || 1.0) * Math.sqrt(vecums) * 2.2)
}

export function calcG(suga, vecums) {
  const base = { 1:0.9, 2:0.85, 3:0.8, 4:0.7 }
  return Math.round((base[suga] || 0.8) * vecums * 0.4)
}

export function calcD(h) { return Math.max(Math.round(h * 0.78), 6) }

export function aprekinātKubaturu(g, h, platiba, kods) {
  if (!g || !h || !platiba) return 0
  return Math.round(g * getVeidaugstums(h, kods) * platiba)
}

function parseColor(color) {
  const m = String(color || '').trim().match(/\d+\s+(\d+)-(\d+)/)
  if (m) return { bonNum: parseInt(m[1]) || 3, bieziba: Math.max(0.1, Math.min(1.0, parseFloat(m[2]) / 10)) }
  return { bonNum: 3, bieziba: 1.0 }
}

const BON_REV = { 'Ia':1, 'I':2, 'II':3, 'III':4, 'IV':5, 'V':6 }

export function apstradatNogabalu(feat, i) {
  const p = feat.properties || {}
  // LVM GEO: p.gtf = taksa gads, vecums jākorektē uz šodien
  // Supabase: p.gtf nav, a10 jau aktuāls → gadskorekcija = 0
  const taksGads      = parseInt(p.gtf) || new Date().getFullYear()
  const gadskorekcija = new Date().getFullYear() - taksGads

  let bonNum, bieziba
  if (p.color != null) {
    // LVM GEO avots — bonitāte un bieziba no color lauka ("2 III-8" formāts)
    const parsed = parseColor(p.color)
    bonNum  = parsed.bonNum
    bieziba = parsed.bieziba
  } else {
    // Supabase avots — bonitāte no h10+a10, bieziba no g10
    const h = parseFloat(p.h10) || 0
    const a = parseInt(p.a10)   || 0
    const g = parseFloat(p.g10) || 0
    const kods = SUGAS_KODS[parseInt(p.s10) || 0] || 'P'
    const bonStr = (h > 0 && a > 10) ? getBonitate(kods, a, h) : 'II'
    bonNum  = BON_REV[bonStr] || 3
    bieziba = g > 0 ? Math.min(1.0, Math.max(0.1, g / 28)) : 1.0
  }

  const bonWfs  = BONITATES[bonNum] || 'II'
  const platiba = parseFloat(p.nog_plat) || 0

  const slani = [10,11,12,13,14].map(sfx => {
    const sKods = parseInt(p[`s${sfx}`]) || 0
    if (!sKods) return null
    const aWfs = parseInt(p[`a${sfx}`]) || 0
    const vec  = aWfs + gadskorekcija
    const hWfs = parseFloat(p[`h${sfx}`]) || 0
    const g    = parseFloat(p[`g${sfx}`]) || 0
    const d    = parseFloat(p[`d${sfx}`]) || 0
    const hEff = hWfs || calcH(bonNum, vec)
    const gEff = g || calcG(sKods, vec)
    const dEff = d || calcD(hEff)
    const kods = SUGAS_KODS[sKods] || 'P'
    const kub  = aprekinātKubaturu(gEff, hEff, platiba, kods)
    return {
      sKods, vec, aWfs, hWfs, hEff, gEff, dEff, kub, kods,
      nos:   SUGAS_KARTE[sKods] || 'Nezināma',
      krasa: SUGAS_KRASA[sKods] || '#4caf50',
    }
  }).filter(Boolean)

  // Nav mežaudzes — purvs, izcirtums vai tukšs nogabals
  if (slani.length === 0) {
    const nr_text = p.kvart != null
      ? (p.anog && p.anog !== '0' && p.anog !== 0) ? `${p.nog}.${p.anog}` : `${p.nog}-0`
      : String(i + 1)
    return {
      id: feat.id || `n${i}`, nr: i+1, nr_text,
      sugaKods: 0, suga: '—', sugaNos: 'Nav mežaudzes', sugaKrasa: '#4a4a4a',
      audzeFormula: '—', vecums: 0, vecumsWfs: 0, taksGads,
      bon: '—', bonNum: 0, bieziba: 0, platiba,
      h: 0, g: 0, d: 0,
      kubatura: 0, izcertamaKraja: 0,
      slani: [], sortVert: 0, sortimenti: {}, lemums: 'Nav mežaudzes', indVertiba: 0,
      mzVeids: p.mz_veids ?? null,
      geojson: feat, rawProps: p,
    }
  }

  // Galvenā suga = augstākais G (ne vienmēr WFS s10 — tas var būt jaunāks slānis ar a=0)
  const main = slani.reduce((best, sl) => sl.gEff > best.gEff ? sl : best)
  const gKopa        = slani.reduce((s,l) => s + l.gEff, 0)
  const kubaturaKopa = slani.reduce((s,l) => s + l.kub,  0)
  const audzeFormula = slani.map(l => `${Math.round(l.gEff / Math.max(gKopa,1) * 10)}${l.kods}`).join(' ')

  // Bonitāte: ja WFS satur faktisko augstumu — aprēķina precīzi no bonityEngine tabulas
  // Citādi izmanto WFS color lauka kodu (aptuvens)
  const bon = (main.hWfs > 0 && main.vec > 10)
    ? (getBonitate(main.kods, main.vec, main.hWfs) || bonWfs)
    : bonWfs

  const biezibasBrid = bieziba < 0.4 ? ` ⚠️ biezība ${bieziba}` : ''
  const TUKSI_SORT  = { log:0, small:0, veneer:0, tara:0, pulp:0, fire:0, chips:0 }
  let sortVert = 0, sortimenti = { ...TUKSI_SORT }, lemumsBezAiz = '—'

  try {
    // Lēmums pēc valdošās sugas + pilnās tabulas (rotationAge, minDiameter)
    const rezLemums = forestEngine({
      formula: audzeFormula, vec: main.vec, bon,
      h: main.hEff, g: gKopa, d: main.dEff,
      platiba, krm3ha: 0, harvestType: '', plantacija: false,
    })
    lemumsBezAiz = rezLemums.decision || '—'
    const lb = lemumsBezAiz.toLowerCase()
    const irKailcirte = lb.includes('kailcirte') || lb.includes('galvenā cirte')

    if (irKailcirte && slani.length > 1) {
      // Galvenā/Kailcirte ar vairākām sugām — katru sugu aprēķina atsevišķi
      // harvestType:'Kailcirte' obligāts — citādi sekundārās sugas saņem thinningDecision
      for (const sl of slani) {
        if (sl.kub <= 0) continue
        try {
          const slRez = forestEngine({
            formula: `10${sl.kods}`, vec: sl.vec, bon,
            h: sl.hEff, g: sl.gEff, d: sl.dEff,
            platiba, krm3ha: 0, harvestType: 'Kailcirte', plantacija: false,
          })
          Object.entries(slRez.sortiments || {}).forEach(([k,v]) => {
            sortimenti[k] = (sortimenti[k] || 0) + (v || 0)
          })
        } catch { /* ignorē */ }
      }
    } else if (irKailcirte) {
      // Viena suga — arī pārsūta kā Kailcirte lai forestEngine izmanto pareizo ceļu
      const rezKailcirte = forestEngine({
        formula: audzeFormula, vec: main.vec, bon,
        h: main.hEff, g: gKopa, d: main.dEff,
        platiba, krm3ha: 0, harvestType: 'Kailcirte', plantacija: false,
      })
      sortimenti = rezKailcirte.sortiments || { ...TUKSI_SORT }
    } else {
      // Kopšanas cirte — forestEngine rēķina visas sugas no audzeFormula
      sortimenti = rezLemums.sortiments || { ...TUKSI_SORT }
    }

    // Bērzs: malkas pārsadali tikai ļoti vecam/reto krāja
    if (main.sKods === 4 && kubaturaKopa > 0 && !lb.includes('kailcirte')) {
      sortimenti.fire = 0
      sortimenti.tara = kubaturaKopa * 0.55
      sortimenti.pulp = kubaturaKopa * 0.45
    }

    Object.entries(sortimenti).forEach(([k,v]) => { sortVert += (v||0) * (SORT_CENAS[k]||0) })
    sortVert = Math.round(sortVert)
  } catch { /* ignorē */ }

  const lemums = lemumsBezAiz + (biezibasBrid ? ` ${biezibasBrid}` : '')

  const izcertamaKraja = (() => {
    const lb = lemumsBezAiz.toLowerCase()
    if (lb.includes('kailcirte') || lb.includes('galvenā cirte')) return kubaturaKopa
    if (lb.includes('kopšanas cirte')) {
      // G_izcērtamais = G_esošais - G_min (pēc GminTable[h][suga])
      const removeG = thinningRemoveG({ formula: audzeFormula, h: main.hEff, g: gKopa, bon, vec: main.vec, d: main.dEff, platiba })
      const ratio = gKopa > 0 ? removeG / gKopa : 0
      return Math.round(ratio * kubaturaKopa)
    }
    return 0
  })()

  const nr_text = p.kvart != null
    ? (p.anog && p.anog !== '0' && p.anog !== 0) ? `${p.nog}.${p.anog}` : `${p.nog}-0`
    : String(i + 1)

  return {
    id: feat.id || `n${i}`, nr: i+1, nr_text,
    sugaKods: main.sKods, suga: main.kods, sugaNos: main.nos, sugaKrasa: main.krasa,
    audzeFormula, vecums: main.vec, vecumsWfs: main.aWfs, taksGads,
    bon, bonNum, bieziba, platiba,
    h: main.hEff, g: gKopa, d: main.dEff,
    kubatura: kubaturaKopa, izcertamaKraja,
    slani, sortVert, sortimenti, lemums, indVertiba: kubaturaKopa * 35,
    mzVeids: p.mz_veids ?? null,
    geojson: feat, rawProps: p,
  }
}

export function paarrekinatRindu(r) {
  r.suga      = SUGAS_KODS[r.sugaKods]  || 'P'
  r.sugaNos   = SUGAS_KARTE[r.sugaKods] || 'Nezināma'
  r.sugaKrasa = SUGAS_KRASA[r.sugaKods] || '#4caf50'
  const h = r.h || calcH(r.bon, r.vecums)
  const g = r.g || calcG(r.suga, r.vecums)
  // Pārrēķina bonitāti no faktiskā augstuma un vecuma (ja nav manuāli mainīta)
  if (h > 0 && r.vecums > 10) {
    const bonAuto = getBonitate(r.suga, r.vecums, h)
    if (bonAuto) r.bon = bonAuto
  }
  r.kubatura   = g && h && r.platiba ? aprekinātKubaturu(g, h, r.platiba, r.suga) : 0
  r.indVertiba = r.kubatura * 35
  if (r.kubatura > 0 && r.vecums > 20) {
    try {
      const rez = forestEngine({
        formula:`10${r.suga}`, vec:r.vecums, bon:r.bon,
        h, g, d: r.d || calcD(h), platiba:r.platiba,
        krm3ha:0, harvestType:'', plantacija:false,
      })
      r.lemums    = rez.decision    || '—'
      r.sortimenti= rez.sortiments  || {}
      let sv = 0
      Object.entries(r.sortimenti).forEach(([k,v]) => { sv += (v||0)*(SORT_CENAS[k]||0) })
      r.sortVert = Math.round(sv)
    } catch { r.lemums='—'; r.sortVert=0; r.sortimenti={} }
  } else { r.lemums='—'; r.sortVert=0; r.sortimenti={} }
  return r
}
