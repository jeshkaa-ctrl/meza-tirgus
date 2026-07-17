import { useState, useEffect, useRef, useCallback } from 'react'
import 'leaflet/dist/leaflet.css'
import { supabase } from './supabaseClient'
import { C as DS, F, spinnerCSS } from './ds'
import { buildWFS, apstradatNogabalu } from './ipasums/engine'
import { NOGABALA_KRASA, SUGAS_KRASA, getVecumaGrupa } from './ipasums/constants'
import MapNogabalsModal from './map/MapNogabalsModal'
import { generateMAPpdf } from './map/mapPdfEngine'
import { aprēķināt } from './map/landCategoryEngine'
import { acmHeaders } from './utils/acm'

// ── Karte ────────────────────────────────────────────────────────────────────

function MAPKarte({ kadGeom, nogabali, onNogabalsKliks, mapRef, planAttels, overlayOpacity, overlayRedigets }) {
  const leafletRef        = useRef(null)
  const kadLayRef         = useRef(null)
  const nogLayRef         = useRef(null)
  const overlayRef        = useRef(null)
  const cornersRef        = useRef([])
  const centerMarkerRef   = useRef(null)
  const prevPlanAttelsRef = useRef(null) // detektē vai planAttels mainījies
  const savedBoundsRef    = useRef(null) // saglabā pozīciju starp redigets pārslēgšanām

  // Inicializē karti un kadastra slāni
  useEffect(() => {
    if (!mapRef.current) return
    let active = true
    const init = async () => {
      const L = (await import('leaflet')).default
      if (!active) return
      if (leafletRef.current) { leafletRef.current.remove(); leafletRef.current = null }

      const map = L.map(mapRef.current, { zoomControl: true, attributionControl: false })
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 20 }).addTo(map)
      leafletRef.current = map

      if (kadGeom) {
        const kl = L.geoJSON(kadGeom, { style: { color: '#00BFFF', weight: 3, fillOpacity: 0 } }).addTo(map)
        kadLayRef.current = kl
        map.fitBounds(kl.getBounds(), { padding: [24, 24] })
      } else {
        map.setView([56.88, 24.60], 7)
      }
    }
    init().catch(console.error)
    return () => {
      active = false
      if (leafletRef.current) { leafletRef.current.remove(); leafletRef.current = null }
    }
  }, [kadGeom, mapRef])

  // Atjaunina nogabalu slāni
  useEffect(() => {
    if (!leafletRef.current) return
    let active = true
    const update = async () => {
      const L = (await import('leaflet')).default
      if (!active || !leafletRef.current) return
      if (nogLayRef.current) { nogLayRef.current.remove(); nogLayRef.current = null }
      if (nogabali.length === 0) return

      const layer = L.geoJSON(
        { type: 'FeatureCollection', features: nogabali.map(n => n.geojson) },
        {
          style: feat => {
            const n = nogabali.find(x => x.id === feat.id)
            const vg = n ? getVecumaGrupa(n.sugaKods, n.vecums) : 2
            return {
              color:       n?.mapManuali ? '#4caf50' : '#aaaaaa',
              weight:      n?.mapManuali ? 2.5 : 1.5,
              fillColor:   NOGABALA_KRASA[`${n?.sugaKods}-${vg}`] || SUGAS_KRASA[n?.sugaKods] || '#888',
              fillOpacity: 0.72,
              dashArray:   n?.mapManuali ? null : '4,3',
            }
          },
          onEachFeature: (feat, lyr) => {
            const n = nogabali.find(x => x.id === feat.id)
            if (!n) return
            const idx = nogabali.indexOf(n)
            lyr.on('click', () => onNogabalsKliks(n, idx))
            lyr.bindTooltip(
              `<b>${n.nr_text}</b> · ${n.sugaNos} ${n.vecums}g · ${n.platiba.toFixed(1)} ha${n.mapManuali ? ' <span style="color:#4caf50">✓ MAP</span>' : ''}`,
              { direction: 'top', sticky: true, className: 'map-tooltip' }
            )
          },
        }
      ).addTo(leafletRef.current)
      nogLayRef.current = layer

      if (!kadGeom && nogabali.length > 0) {
        leafletRef.current.fitBounds(layer.getBounds(), { padding: [20, 20] })
      }
    }
    update().catch(console.error)
    return () => { active = false }
  }, [nogabali, kadGeom, onNogabalsKliks])

  // Plāna attēls — overlay + pozicionēšanas marķieri
  useEffect(() => {
    if (!leafletRef.current) return
    let active = true

    // Ja planAttels mainījās uz jaunu — atiestatīt saglabāto pozīciju
    if (prevPlanAttelsRef.current !== planAttels) {
      savedBoundsRef.current = null
      prevPlanAttelsRef.current = planAttels
    }

    // Saglabāt un notīrīt veco overlay
    if (overlayRef.current) {
      savedBoundsRef.current = overlayRef.current.getBounds()
      overlayRef.current.remove()
      overlayRef.current = null
    }
    cornersRef.current.forEach(m => m.remove())
    cornersRef.current = []
    if (centerMarkerRef.current) { centerMarkerRef.current.remove(); centerMarkerRef.current = null }

    if (!planAttels) return

    const setup = async () => {
      const L = (await import('leaflet')).default
      if (!active || !leafletRef.current) return

      // Sākotnējās robežas — saglabātās, vai kadastra robežas, vai kartes skats
      const initialBounds = savedBoundsRef.current || (
        kadGeom ? L.geoJSON(kadGeom).getBounds() : leafletRef.current.getBounds()
      )

      const ov = L.imageOverlay(planAttels, initialBounds, {
        opacity:     overlayOpacity,
        interactive: false,
        zIndex:      200,
      }).addTo(leafletRef.current)
      overlayRef.current = ov

      if (!overlayRedigets) return

      // ── Stūru un centra marķieri ──────────────────────────────────
      const cornerIcon = L.divIcon({
        html: '<div style="width:14px;height:14px;background:#fff;border:2px solid #2e7d32;border-radius:3px;margin:-7px 0 0 -7px;cursor:grab;box-shadow:0 1px 5px rgba(0,0,0,0.6)"></div>',
        iconSize: [0, 0], className: '',
      })
      const centerIcon = L.divIcon({
        html: '<div style="width:20px;height:20px;background:#2e7d32;border:2px solid #fff;border-radius:50%;margin:-10px 0 0 -10px;cursor:move;box-shadow:0 1px 5px rgba(0,0,0,0.6)"></div>',
        iconSize: [0, 0], className: '',
      })

      const b = ov.getBounds()
      const cornerPositions = [b.getNorthWest(), b.getNorthEast(), b.getSouthEast(), b.getSouthWest()]

      const recalcBounds = () => {
        const pts = cornersRef.current.map(m => m.getLatLng())
        const lats = pts.map(p => p.lat), lngs = pts.map(p => p.lng)
        const nb = L.latLngBounds(
          [Math.min(...lats), Math.min(...lngs)],
          [Math.max(...lats), Math.max(...lngs)]
        )
        if (overlayRef.current) overlayRef.current.setBounds(nb)
        if (centerMarkerRef.current) centerMarkerRef.current.setLatLng(nb.getCenter())
      }

      cornersRef.current = cornerPositions.map(pos => {
        const m = L.marker(pos, { draggable: true, icon: cornerIcon, zIndexOffset: 900 }).addTo(leafletRef.current)
        m.on('drag', recalcBounds)
        return m
      })

      // Centra marķieris — velk visu overlay
      let lastPos = b.getCenter()
      const ctr = L.marker(b.getCenter(), { draggable: true, icon: centerIcon, zIndexOffset: 1000 }).addTo(leafletRef.current)
      ctr.on('dragstart', () => { lastPos = ctr.getLatLng() })
      ctr.on('drag', () => {
        const cur = ctr.getLatLng()
        const dlat = cur.lat - lastPos.lat
        const dlng = cur.lng - lastPos.lng
        lastPos = cur
        cornersRef.current.forEach(m => {
          const p = m.getLatLng()
          m.setLatLng([p.lat + dlat, p.lng + dlng])
        })
        recalcBounds()
      })
      centerMarkerRef.current = ctr
    }

    setup().catch(console.error)
    return () => { active = false }
  }, [planAttels, overlayRedigets, kadGeom])

  // Tikai opacity maiņa — nepārveido overlay
  useEffect(() => {
    if (overlayRef.current) overlayRef.current.setOpacity(overlayOpacity)
  }, [overlayOpacity])

  return null
}

// ── Nogabalu saraksta rinda ────────────────────────────────────────────────

function NogabalsRinda({ n, idx, onKliks, aktīvs }) {
  const zaļs = n.mapManuali
  return (
    <button
      onClick={() => onKliks(n, idx)}
      style={{
        width: '100%', textAlign: 'left', padding: '10px 12px',
        borderRadius: 8, cursor: 'pointer', border: 'none',
        background: aktīvs
          ? `${DS.green}22`
          : zaļs ? '#0a1f0a' : DS.bgInner,
        borderLeft: `3px solid ${zaļs ? DS.green : DS.greenBdr}`,
        marginBottom: 4,
        display: 'flex', alignItems: 'center', gap: 10,
      }}
    >
      {/* Statuss */}
      <span style={{
        width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 12, fontWeight: 700,
        background: zaļs ? DS.green : DS.bgDeep,
        color: zaļs ? '#fff' : DS.textDim,
        border: `1px solid ${zaļs ? DS.green : DS.greenBdr}`,
      }}>
        {zaļs ? '✓' : '+'}
      </span>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: zaļs ? DS.green : DS.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {n.nr_text} — {n.audzeFormula || n.sugaNos}
        </div>
        <div style={{ fontSize: 11, color: DS.textMut }}>
          {n.vecums ? `${n.vecums} g · ` : ''}{n.platiba.toFixed(2)} ha
          {n.mapManuali && n.lēmums && n.lēmums !== '—' && (
            <span style={{ color: DS.textDim }}> · {n.lēmums.slice(0, 30)}{n.lēmums.length > 30 ? '…' : ''}</span>
          )}
        </div>
      </div>

      <span style={{ fontSize: 16, color: DS.textDim, flexShrink: 0 }}>›</span>
    </button>
  )
}

// ── Galvenais komponents ──────────────────────────────────────────────────────

export default function MezaApsaimniekosanasPlans({ onBack }) {
  const [faze,            setFaze]            = useState('ievads')
  const [kadInput,        setKadInput]        = useState('')
  const [kluda,           setKluda]           = useState('')
  const [ladeText,        setLadeText]        = useState('')
  const [nogabali,        setNogabali]        = useState([])
  const [kadGeom,         setKadGeom]         = useState(null)
  const [mapModal,        setMapModal]        = useState(null)
  const [drawerOpen,      setDrawerOpen]      = useState(false)
  const [lvmKluda,        setLvmKluda]        = useState(false)
  const [titullapa,       setTitullapa]       = useState({ novads: '', pagasts: '', nosaukums: '' })
  const [pdfLade,         setPdfLade]         = useState(false)
  const [uploadLade,      setUploadLade]      = useState(false)
  const [uploadProgress,  setUploadProgress]  = useState('')
  const [uploadKluda,     setUploadKluda]     = useState('')
  const [planAttels,      setPlanAttels]      = useState(null)  // data URL plāna lapai
  const [overlayOpacity,  setOverlayOpacity]  = useState(0.55)
  const [overlayRedigets, setOverlayRedigets] = useState(false)
  const [nogLade,         setNogLade]         = useState(false)
  const [nogKluda,        setNogKluda]        = useState(null)

  const mapDivRef = useRef(null)
  const isMobile  = typeof window !== 'undefined' && window.innerWidth < 700

  // ── LVM GEO timeout ─────────────────────────────────────────────────────────
  const lvmFetch = async (url, ms = 8000) => {
    const ctrl = new AbortController()
    const timer = setTimeout(() => ctrl.abort(), ms)
    try {
      const r = await fetch(url, { signal: ctrl.signal })
      clearTimeout(timer)
      if (!r.ok) throw new Error(`WFS_${r.status}`)
      const data = await r.json()
      if (data.error) throw new Error(data.error)
      return data
    } catch (e) {
      clearTimeout(timer)
      if (e.name === 'AbortError') throw new Error('WFS_TIMEOUT')
      throw e
    }
  }

  // ── Ielādēt ─────────────────────────────────────────────────────────────────
  const ielādet = async () => {
    const kad = kadInput.replace(/\s/g, '')
    if (!/^\d{11}$/.test(kad)) { setKluda('Kadastra numuram jābūt 11 cipariem'); return }
    setKluda(''); setFaze('lade'); setLadeText('Ielādē kadastra robežas...')
    let lvmErr = false

    let kadFeat = null
    try {
      const d = await lvmFetch(`/api/vzd?kadastrs=${kad}`)
      kadFeat = d?.features?.[0]
    } catch { lvmErr = true }

    setLadeText('Ielādē VMD nogabalu datus...')
    let vmdFeats = []
    try {
      const { data: sbData } = await supabase
        .from('meza_nogabali')
        .select('*')
        .eq('kadastrs', kad)
      if (sbData && sbData.length > 0) {
        vmdFeats = sbData.map(n => ({ properties: n, geometry: null }))
      } else {
        const d = await lvmFetch(buildWFS('/publicwfs/ows', 'publicwfs:vmdpubliccompartments', `kadastrs='${kad}'`, 500))
        vmdFeats = d?.features || []
      }
    } catch { lvmErr = true }

    setLvmKluda(lvmErr)
    setKadGeom(kadFeat)
    setNogabali(vmdFeats.map((f, i) => apstradatNogabalu(f, i)))
    setFaze('darbs')
  }

  // ── Modāla apstrāde ─────────────────────────────────────────────────────────
  const atvertModalu = useCallback((n, idx) => {
    setMapModal({ nogabals: n, index: idx })
    if (isMobile) setDrawerOpen(false)
  }, [isMobile])

  const saglabatNogabalu = (saved) => {
    setNogabali(prev => {
      const arr = [...prev]
      arr[mapModal.index] = { ...arr[mapModal.index], ...saved }
      return arr
    })
    setMapModal(null)
  }

  // ── Nogabalu manuālā ielāde (atsevišķs solis pēc robežas) ──────────────────
  const ieladetNogabalus = async () => {
    const kad = kadInput.replace(/\s/g, '')
    setNogLade(true)
    setNogKluda(null)
    try {
      const { data, error } = await supabase
        .from('meza_nogabali')
        .select('*')
        .eq('kadastrs', kad)
      if (error) throw error
      if (!data?.length) {
        setNogKluda('Nogabali nav atrasti šim kadastram VMD datos.')
        return
      }
      setNogabali(data.map((n, i) => apstradatNogabalu({ properties: n, geometry: null }, i)))
    } catch (e) {
      setNogKluda('Nogabalu ielāde neizdevās: ' + e.message)
    } finally {
      setNogLade(false)
    }
  }

  // ── PDF ģenerēšana ──────────────────────────────────────────────────────────
  const genPdf = async () => {
    if (pdfLade) return
    setPdfLade(true)
    try {
      await generateMAPpdf({
        kadastrs:   kadInput.replace(/\s/g, ''),
        titullapa,
        nogabali,
        mapElement: mapDivRef.current,
      })
    } catch (e) {
      console.error('PDF kļūda:', e)
      alert(`PDF kļūda: ${e.message}`)
    } finally {
      setPdfLade(false)
    }
  }

  // ── Inventarizācijas PDF augšupielāde ────────────────────────────────────────
  const convertNogabals = (n, i) => {
    const base = {
      id: `upload_${i}`,
      nr: n.nr || (i + 1),
      nr_text: String(n.nr || (i + 1)),
      kategorija: n.kategorija || 'MA',
      platiba: parseFloat(n.platiba) || 0,
      suga: n.suga || '',
      sugaNos: n.sugaNos || '',
      vecums: parseInt(n.vecums) || 0,
      h: parseFloat(n.h) || 0,
      d: parseFloat(n.d) || 0,
      g: parseFloat(n.g) || 0,
      bieziba: parseFloat(n.bieziba) || 0,
      mezaTips: n.mezaTips || '',
      bonitate: n.bonitate || '',
      audzeFormula: n.audzeFormula || '',
      bojajumsVeids: n.bojajumsVeids || '',
      bojajumsProc: parseInt(n.bojajumsProc) || 0,
      mapManuali: true,
      geojson: { type: 'Feature', id: `upload_${i}`, geometry: null, properties: {} },
    }
    try {
      const rez = aprēķināt(base)
      return { ...base, ...rez }
    } catch {
      return { ...base, krajaHa: 0, kraja: 0, lēmums: '—', izcApjoms: 0 }
    }
  }

  const parsePDF = async (file) => {
    setUploadLade(true)
    setUploadKluda('')
    setUploadProgress('Atver PDF...')
    try {
      const pdfjs = await import('pdfjs-dist')
      const pdfjsLib = pdfjs.default || pdfjs
      const arrayBuf = await file.arrayBuffer()
      const pdf = await pdfjsLib.getDocument({ data: arrayBuf }).promise
      const lapsuSk = Math.min(pdf.numPages, 10)
      setUploadProgress(`Renderē ${lapsuSk} lappuses...`)

      const images    = []  // base64 bez data: prefix
      const dataUrls  = []  // pilni data URLs

      for (let i = 1; i <= lapsuSk; i++) {
        const page = await pdf.getPage(i)
        const viewport = page.getViewport({ scale: 1.5 })
        const canvas = document.createElement('canvas')
        canvas.width = viewport.width
        canvas.height = viewport.height
        await page.render({ canvasContext: canvas.getContext('2d'), viewport }).promise
        const dataUrl = canvas.toDataURL('image/jpeg', 0.72)
        dataUrls.push(dataUrl)
        images.push(dataUrl.split(',')[1])
      }

      setUploadProgress('Sūta uz AI analīzi...')
      const body = {
        model: 'claude-sonnet-4-6',
        max_tokens: 4096,
        messages: [{
          role: 'user',
          content: [
            ...images.map(img => ({
              type: 'image',
              source: { type: 'base64', media_type: 'image/jpeg', data: img },
            })),
            {
              type: 'text',
              text: `Šis ir Latvijas meža inventarizācijas vai apsaimniekošanas plāna PDF. Atbildi ar JSON objektu šādā struktūrā:
{"planLapaIndekss": N, "nogabali": [...]}

kur N (0-bāzēts) ir tās lapas indekss, kas satur GRAFISKU nogabalu plāna attēlu ar numuriem un robežām uz kartes (nevis tabulu ar skaitļiem). Ja grafiska plāna nav — liec 0.

Katram nogabalam:
{"nr":<numurs>,"platiba":<ha>,"kategorija":"<MA|IzA|Izc|ML|DBL|Vir|Sm|BA|PK|Pu|Ce|Gr|Kr>","suga":"<P|E|B|A|Bl|Ol|Ozs|Lp|Ks|>","sugaNos":"<pilns>","vecums":<gadi>,"h":<m>,"d":<cm>,"g":<m²/ha>,"bieziba":<0-1>,"mezaTips":"<Vr|Gs|Dm|Sl|Lk|Vc|Ln|Kg|>","bonitate":"<Ia|I|II|III|IV|V|>","audzeFormula":"<piem. 8P2E>"}

Kategorijas: MA=Mežaudze, IzA=Iznīkusi audze, Izc=Izcirtums, ML=Meža lauce, Pu=Purvs, BA=Bioloģiski aktīvs, Ce=Ceļi/stigas, Gr=Grāvji, Kr=Krūmājs
Meža tipi: Vr=Viršu, Gs=Gāršas, Dm=Damakšņa, Sl=Slapjā, Lk=Liekņa, Vc=Vēra, Ln=Lāna, Kg=Kūdrāja
Sugas: P=Priede, E=Egle, B=Bērzs, A=Apse, Bl=Melnalksnis, Ol=Baltalknis, Ozs=Ozols, Lp=Liepa, Ks=Kļava

Ja lauks nav norādīts — izmanto 0 vai tukšu virkni.
Atbildi TIKAI ar JSON objektu. Bez markdown, bez komentāriem.`,
            },
          ],
        }],
      }

      const resp = await fetch('/api/anthropic/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...acmHeaders() },
        body: JSON.stringify(body),
      })
      if (!resp.ok) throw new Error(`API kļūda ${resp.status}`)
      const result = await resp.json()
      const rawText = result.content?.[0]?.text || ''

      setUploadProgress('Apstrādā rezultātus...')
      const match = rawText.match(/\{[\s\S]*\}/)
      if (!match) throw new Error('AI neatrada nogabalus šajā PDF. Pārliecinies ka dokuments satur inventarizācijas tabulas.')
      let parsed
      try { parsed = JSON.parse(match[0]) }
      catch { throw new Error('Neizdevās parsēt AI atbildi. Mēģini vēlreiz.') }

      const nogabaliArr = Array.isArray(parsed) ? parsed : (parsed.nogabali || [])
      if (!nogabaliArr.length) throw new Error('Netika atrasts neviens nogabals.')

      // Plāna attēls kā kartes slānis
      const planIdx = typeof parsed.planLapaIndekss === 'number'
        ? Math.min(Math.max(0, parsed.planLapaIndekss), dataUrls.length - 1)
        : 0
      setPlanAttels(dataUrls[planIdx])
      setOverlayRedigets(false)

      const converted = nogabaliArr.map((n, i) => convertNogabals(n, i))
      setNogabali(converted)
      setFaze('darbs')
    } catch (e) {
      setUploadKluda(e.message)
    } finally {
      setUploadLade(false)
      setUploadProgress('')
    }
  }

  // ── Statistika ───────────────────────────────────────────────────────────────
  const maNogabali    = nogabali.filter(n => ['MA','IzA'].includes(n.kategorija))
  const aizpilditi    = nogabali.filter(n => n.mapManuali).length
  const kopā          = nogabali.length
  // MA nogabali obligāti aizpildāmi (bez tiem PDF nav pilnvērtīgs)
  const visiGatavi    = kopā > 0 && maNogabali.every(n => n.mapManuali)
  const kopPlatiba    = nogabali.reduce((s, n) => s + n.platiba, 0)
  const kopKraja      = nogabali.reduce((s, n) => s + (n.kraja || n.kubatura || 0), 0)

  // ────────────────────── IEVADS ───────────────────────────────────────────────
  if (faze === 'ievads') return (
    <div style={{ minHeight: '100vh', background: DS.bg, color: DS.text, fontFamily: F.family }}>
      <style>{spinnerCSS}</style>

      <div style={{ background: DS.glass, borderBottom: `1px solid ${DS.greenBdr}`, backdropFilter: 'blur(8px)', padding: '0 16px', height: 52, display: 'flex', alignItems: 'center', gap: 10, position: 'sticky', top: 0, zIndex: 10 }}>
        {onBack && <button onClick={onBack} style={{ background: 'none', border: 'none', color: DS.green, fontSize: 22, cursor: 'pointer', minWidth: 36, minHeight: 44 }}>←</button>}
        <div style={{ color: DS.green, fontSize: F.md, fontWeight: 700 }}>🌳 Apsaimniekošanas plāns</div>
      </div>

      <div style={{ maxWidth: 480, margin: '0 auto', padding: '32px 20px' }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🌳</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: DS.text, marginBottom: 8 }}>Meža apsaimniekošanas plāns</div>
          <div style={{ fontSize: 13, color: DS.textMut, lineHeight: 1.6, maxWidth: 360, margin: '0 auto' }}>
            Ievadi kadastra numuru. Sistēma ielādēs nogabalus no LVM GEO — tu aizpildīsi katru ar terēna datiem un iegūsi gatavu MAP dokumentu.
          </div>
        </div>

        <div style={{ background: DS.bgCard, border: `1px solid ${DS.greenBdr}`, borderRadius: 12, padding: '20px' }}>
          <div style={{ fontSize: 12, color: DS.textMut, marginBottom: 6, fontWeight: 600 }}>KADASTRA NUMURS</div>
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              value={kadInput}
              onChange={e => setKadInput(e.target.value.replace(/[^\d\s]/g, ''))}
              onKeyDown={e => e.key === 'Enter' && ielādet()}
              placeholder="Piemērs: 42820040063"
              maxLength={14}
              autoFocus
              style={{ flex: 1, padding: '11px 14px', borderRadius: 8, background: DS.bgDeep, border: `1px solid ${DS.greenBdr}`, color: DS.text, fontSize: 16, outline: 'none', fontFamily: F.family }}
            />
            <button
              onClick={ielādet}
              style={{ padding: '11px 18px', borderRadius: 8, background: `linear-gradient(135deg,${DS.green},${DS.greenDk})`, color: '#fff', border: 'none', fontSize: 15, fontWeight: 700, cursor: 'pointer' }}
            >
              Ielādēt
            </button>
          </div>
          {kluda && (
            <div style={{ marginTop: 10, padding: '8px 12px', borderRadius: 7, background: DS.errorBg, border: `1px solid ${DS.errorBdr}`, fontSize: 12, color: DS.error }}>
              ⚠️ {kluda}
            </div>
          )}

          {/* Testa datu poga (dev) */}
          <button
            onClick={async () => {
              const { TEST_KADASTRS, TEST_NOGABALI, TEST_TITULLAPA } = await import('./map/testData.js')
              setKadInput(TEST_KADASTRS)
              setNogabali(TEST_NOGABALI)
              setTitullapa(TEST_TITULLAPA)
              setFaze('darbs')
            }}
            style={{ marginTop: 12, padding: '8px 14px', borderRadius: 7, background: 'none', border: `1px solid ${DS.greenBdr}`, color: DS.textDim, fontSize: 11, cursor: 'pointer', width: '100%' }}
          >
            🧪 Ielādēt testa datus (76760040019)
          </button>
        </div>

        {/* Augšupielāde — alternatīvs ceļš */}
        <div style={{ marginTop: 16, position: 'relative' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <div style={{ flex: 1, height: 1, background: DS.greenBdr }} />
            <span style={{ fontSize: 11, color: DS.textDim, whiteSpace: 'nowrap', padding: '0 4px' }}>vai augšupielādē esošo dokumentu</span>
            <div style={{ flex: 1, height: 1, background: DS.greenBdr }} />
          </div>
          <div style={{ background: DS.bgCard, border: `1px solid ${DS.greenBdr}`, borderRadius: 12, padding: '16px 18px' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: DS.text, marginBottom: 4 }}>📄 Inventarizācija / apsaimniekošanas plāns</div>
            <div style={{ fontSize: 11, color: DS.textMut, marginBottom: 12, lineHeight: 1.5 }}>
              Augšupielādē PDF — AI parsēs nogabalus automātiski (nogabala nr., platiba, suga, vecums, G, bonitate u.c.)
            </div>
            <label style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              padding: '10px 14px', borderRadius: 8, cursor: uploadLade ? 'wait' : 'pointer',
              border: `1.5px dashed ${DS.green}`,
              background: uploadLade ? DS.bgDeep : 'transparent',
              color: uploadLade ? DS.textDim : DS.green,
              fontSize: 13, fontWeight: 600, transition: 'background 0.15s',
              opacity: uploadLade ? 0.7 : 1,
            }}>
              <input
                type="file"
                accept=".pdf"
                disabled={uploadLade}
                onChange={e => { if (e.target.files?.[0]) parsePDF(e.target.files[0]) }}
                style={{ display: 'none' }}
              />
              {uploadLade
                ? `⏳ ${uploadProgress || 'Apstrādā...'}`
                : '⬆ Izvēlēties PDF'}
            </label>
            {uploadKluda && (
              <div style={{ marginTop: 10, padding: '8px 12px', borderRadius: 7, background: DS.errorBg, border: `1px solid ${DS.errorBdr}`, fontSize: 11, color: DS.error, lineHeight: 1.5 }}>
                ⚠️ {uploadKluda}
              </div>
            )}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 20 }}>
          {[
            { icon: '🗺', text: 'Nogabali no LVM GEO ar pirmapstrādi' },
            { icon: '📋', text: 'Tiešsaistes datu ievade katram nogabalam' },
            { icon: '📐', text: 'Platību kontrole ±0.3 ha tolerance' },
            { icon: '📄', text: 'Ģenerē MAP PDF MK 384 formātā' },
          ].map((x, i) => (
            <div key={i} style={{ background: DS.bgCard, border: `1px solid ${DS.greenBdr}`, borderRadius: 10, padding: '12px 14px' }}>
              <div style={{ fontSize: 20, marginBottom: 5 }}>{x.icon}</div>
              <div style={{ fontSize: 11, color: DS.textSec, lineHeight: 1.5 }}>{x.text}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )

  // ────────────────────── IELĀDE ───────────────────────────────────────────────
  if (faze === 'lade') return (
    <div style={{ minHeight: '100vh', background: DS.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 20, fontFamily: F.family }}>
      <style>{spinnerCSS}{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <div style={{ width: 52, height: 52, border: `3px solid ${DS.greenBdr}`, borderTop: `3px solid ${DS.green}`, borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
      <div style={{ textAlign: 'center' }}>
        <div style={{ color: DS.green, fontSize: F.md, fontWeight: 600, marginBottom: 6 }}>🌳 Ielādē MAP datus</div>
        <div style={{ color: DS.textSec, fontSize: F.sm }}>{ladeText}</div>
        <div style={{ color: DS.textDim, fontSize: F.xs, marginTop: 4 }}>{kadInput}</div>
      </div>
    </div>
  )

  // ────────────────────── DARBA SKATS ──────────────────────────────────────────

  const inp9 = {
    padding: '7px 10px', borderRadius: 6, background: DS.bgDeep,
    border: `1px solid ${DS.greenBdr}`, color: DS.text, fontSize: 12,
    outline: 'none', width: '100%', boxSizing: 'border-box', fontFamily: F.family,
  }

  const SarakstaPane = () => (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Galvene */}
      <div style={{ padding: '12px 14px', borderBottom: `1px solid ${DS.greenBdr}`, flexShrink: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: DS.text, marginBottom: 4 }}>
          {kadInput} · {kopPlatiba.toFixed(1)} ha
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ flex: 1, height: 6, borderRadius: 3, background: DS.bgDeep, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${kopā > 0 ? (aizpilditi / kopā) * 100 : 0}%`, background: DS.green, borderRadius: 3, transition: 'width 0.3s' }} />
          </div>
          <span style={{ fontSize: 11, color: DS.textMut, flexShrink: 0 }}>{aizpilditi}/{kopā}</span>
        </div>
      </div>

      {/* LVM GEO kļūda */}
      {lvmKluda && (
        <div style={{ margin: '8px 10px 0', padding: '8px 10px', borderRadius: 7, background: '#1f1000', border: '1px solid #e65100', fontSize: 11, color: '#ffb74d', lineHeight: 1.5 }}>
          ⚠️ LVM GEO pagaidām nav pieejams. Nogabali netika ielādēti automātiski.
        </div>
      )}

      {/* Saraksts */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '8px 10px' }}>
        {nogabali.length === 0 ? (
          <div style={{ padding: '20px 8px', textAlign: 'center' }}>
            {nogKluda && (
              <div style={{ fontSize: 11, color: '#ffb74d', marginBottom: 10, lineHeight: 1.5 }}>
                ⚠️ {nogKluda}
              </div>
            )}
            <button
              onClick={ieladetNogabalus}
              disabled={nogLade}
              style={{
                padding: '10px 18px', borderRadius: 8,
                cursor: nogLade ? 'wait' : 'pointer',
                background: `linear-gradient(135deg,${DS.green},${DS.greenDk})`,
                color: '#fff', border: 'none', fontSize: 13, fontWeight: 600,
                opacity: nogLade ? 0.7 : 1, width: '100%',
              }}
            >
              {nogLade ? '⏳ Meklē VMD datos...' : '🌲 Pievienot nogabalus'}
            </button>
            <div style={{ fontSize: 10, color: DS.textDim, marginTop: 8, lineHeight: 1.5 }}>
              Meklē VMD meža taksācijas datus pēc kadastra
            </div>
          </div>
        ) : (
          nogabali.map((n, idx) => (
            <NogabalsRinda
              key={n.id} n={n} idx={idx}
              onKliks={atvertModalu}
              aktīvs={mapModal?.index === idx}
            />
          ))
        )}
      </div>

      {/* Titullapas dati */}
      <div style={{ padding: '10px 10px 0', borderTop: `1px solid ${DS.greenBdr}`, flexShrink: 0 }}>
        <div style={{ fontSize: 10, color: DS.textDim, marginBottom: 6, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>
          📄 Titullapas dati
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 5, marginBottom: 8 }}>
          {[
            { lauks: 'nosaukums', placeholder: 'Īpašuma nosaukums (piem. "Priedes")' },
            { lauks: 'novads',    placeholder: 'Novads (piem. Saulkrastu novads)' },
            { lauks: 'pagasts',   placeholder: 'Pagasts' },
          ].map(({ lauks, placeholder }) => (
            <input
              key={lauks}
              value={titullapa[lauks]}
              onChange={e => setTitullapa(prev => ({ ...prev, [lauks]: e.target.value }))}
              placeholder={placeholder}
              style={inp9}
            />
          ))}
        </div>
      </div>

      {/* PDF poga */}
      <div style={{ padding: '6px 10px 14px', flexShrink: 0 }}>
        {visiGatavi ? (
          <button
            onClick={genPdf}
            disabled={pdfLade}
            style={{
              width: '100%', padding: '13px', borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: pdfLade ? 'wait' : 'pointer',
              background: pdfLade ? DS.greenDk : `linear-gradient(135deg,${DS.green},${DS.greenDk})`,
              color: '#fff', border: 'none', opacity: pdfLade ? 0.8 : 1,
            }}
          >
            {pdfLade ? '⏳ Gatavo PDF...' : '📄 Ģenerēt apsaimniekošanas plānu PDF'}
          </button>
        ) : (
          <div style={{ textAlign: 'center', fontSize: 11, color: DS.textDim, padding: '6px 0' }}>
            Aizpildi {maNogabali.filter(n => !n.mapManuali).length} mežaudžu nogabalus lai ģenerētu PDF
          </div>
        )}
      </div>
    </div>
  )

  // ── Overlay vadības panelis ───────────────────────────────────────────────────
  const OverlayPanel = () => !planAttels ? null : (
    <div style={{
      position: 'absolute', right: 10, bottom: 16, zIndex: 400,
      background: 'rgba(8,16,8,0.93)',
      border: `1px solid ${DS.green}`,
      borderRadius: 10, padding: '10px 12px',
      minWidth: 210,
      backdropFilter: 'blur(8px)',
      boxShadow: '0 4px 16px rgba(0,0,0,0.55)',
      fontFamily: F.family,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: DS.green }}>📋 Vecais plāns</div>
        <button
          onClick={() => { setPlanAttels(null); setOverlayRedigets(false) }}
          style={{ background: 'none', border: 'none', color: DS.textDim, fontSize: 15, cursor: 'pointer', padding: '0 2px', lineHeight: 1 }}
          title="Noņemt slāni"
        >✕</button>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
        <span style={{ fontSize: 10, color: DS.textDim, flexShrink: 0, minWidth: 28 }}>
          {Math.round(overlayOpacity * 100)}%
        </span>
        <input
          type="range" min={0} max={100}
          value={Math.round(overlayOpacity * 100)}
          onChange={e => setOverlayOpacity(Number(e.target.value) / 100)}
          style={{ flex: 1, accentColor: DS.green, cursor: 'pointer' }}
        />
      </div>

      <button
        onClick={() => setOverlayRedigets(r => !r)}
        style={{
          width: '100%', padding: '6px 8px', borderRadius: 6,
          border: `1px solid ${overlayRedigets ? DS.green : DS.greenBdr}`,
          background: overlayRedigets ? `${DS.green}33` : 'transparent',
          color: overlayRedigets ? DS.green : DS.textMut,
          fontSize: 11, cursor: 'pointer', textAlign: 'left', fontFamily: F.family,
        }}
      >
        {overlayRedigets ? '✓ Pozicionēšanas režīms aktīvs' : '✎ Pozicionēt attēlu'}
      </button>

      {overlayRedigets && (
        <div style={{ marginTop: 7, fontSize: 10, color: DS.textDim, lineHeight: 1.6 }}>
          ● Velc zaļo centru — pārvietot<br />
          ■ Velc stūru marķierus — mērogot
        </div>
      )}
    </div>
  )

  // ── Desktop layout ────────────────────────────────────────────────────────────
  if (!isMobile) return (
    <div style={{ minHeight: '100vh', background: DS.bg, color: DS.text, fontFamily: F.family, display: 'flex', flexDirection: 'column' }}>
      <style>{spinnerCSS}</style>

      {/* Header */}
      <div style={{ background: DS.glass, borderBottom: `1px solid ${DS.greenBdr}`, backdropFilter: 'blur(8px)', padding: '0 16px', height: 52, display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0, zIndex: 10 }}>
        <button onClick={onBack || (() => setFaze('ievads'))} style={{ background: 'none', border: 'none', color: DS.green, fontSize: 22, cursor: 'pointer', minWidth: 36, minHeight: 44 }}>←</button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ color: DS.green, fontSize: F.md, fontWeight: 700 }}>🌳 Apsaimniekošanas plāns — {kadInput}</div>
          <div style={{ color: DS.textDim, fontSize: F.xs }}>
            {nogabali.length} nogabali · {kopPlatiba.toFixed(2)} ha
            {kopKraja > 0 && ` · ${kopKraja.toFixed(0)} m³`}
          </div>
        </div>
        <button
          onClick={() => setFaze('ievads')}
          style={{ padding: '6px 14px', borderRadius: 7, background: 'none', border: `1px solid ${DS.greenBdr}`, color: DS.textMut, fontSize: 12, cursor: 'pointer' }}
        >
          ← Cits kadastra
        </button>
      </div>

      {/* Saturs */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* Kreisais panelis */}
        <div style={{ width: 300, flexShrink: 0, borderRight: `1px solid ${DS.greenBdr}`, background: DS.bgCard, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <SarakstaPane />
        </div>

        {/* Karte */}
        <div style={{ flex: 1, position: 'relative', background: '#1a2e1a' }}>
          <div ref={mapDivRef} style={{ position: 'absolute', inset: 0 }} />
          <MAPKarte
            kadGeom={kadGeom} nogabali={nogabali} onNogabalsKliks={atvertModalu} mapRef={mapDivRef}
            planAttels={planAttels} overlayOpacity={overlayOpacity} overlayRedigets={overlayRedigets}
          />
          <OverlayPanel />
        </div>
      </div>

      {/* Modāls */}
      {mapModal && (
        <MapNogabalsModal
          nogabals={mapModal.nogabals}
          onSave={saglabatNogabalu}
          onClose={() => setMapModal(null)}
        />
      )}
    </div>
  )

  // ── Mobilais layout ───────────────────────────────────────────────────────────
  const DRAWER_CLOSED = 72
  const DRAWER_OPEN   = Math.round(window.innerHeight * 0.55)

  return (
    <div style={{ minHeight: '100vh', background: DS.bg, color: DS.text, fontFamily: F.family, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <style>{spinnerCSS}</style>

      {/* Header */}
      <div style={{ background: DS.glass, borderBottom: `1px solid ${DS.greenBdr}`, backdropFilter: 'blur(8px)', padding: '0 16px', height: 52, display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0, zIndex: 20 }}>
        <button onClick={onBack || (() => setFaze('ievads'))} style={{ background: 'none', border: 'none', color: DS.green, fontSize: 22, cursor: 'pointer', minWidth: 36, minHeight: 44 }}>←</button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ color: DS.green, fontSize: 14, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>🌳 {kadInput}</div>
          <div style={{ color: DS.textDim, fontSize: 11 }}>{aizpilditi}/{kopā} nogabali ievadīti</div>
        </div>
      </div>

      {/* Karte — aizpilda atlikušo vietu */}
      <div style={{ flex: 1, position: 'relative', background: '#1a2e1a', zIndex: 1 }}>
        <div ref={mapDivRef} style={{ position: 'absolute', inset: 0 }} />
        <MAPKarte
          kadGeom={kadGeom} nogabali={nogabali} onNogabalsKliks={atvertModalu} mapRef={mapDivRef}
          planAttels={planAttels} overlayOpacity={overlayOpacity} overlayRedigets={overlayRedigets}
        />
        <OverlayPanel />
      </div>

      {/* Bottom Drawer */}
      <div style={{
        position: 'fixed', left: 0, right: 0, bottom: 0,
        height: drawerOpen ? DRAWER_OPEN : DRAWER_CLOSED,
        transition: 'height 0.3s ease',
        background: DS.bgCard,
        borderTop: `1px solid ${DS.greenBdr}`,
        boxShadow: '0 -4px 20px rgba(0,0,0,0.4)',
        zIndex: 15,
        display: 'flex', flexDirection: 'column',
      }}>
        {/* Handle */}
        <button
          onClick={() => setDrawerOpen(o => !o)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '10px 0 4px', flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}
        >
          <div style={{ width: 36, height: 4, borderRadius: 2, background: DS.greenBdr }} />
          <div style={{ fontSize: 11, color: DS.textMut, fontFamily: F.family }}>
            {drawerOpen
              ? '▾ Aizvērt sarakstu'
              : `▴ Nogabalu saraksts (${aizpilditi}/${kopā})`}
          </div>
        </button>

        {/* Saraksts */}
        {drawerOpen && (
          <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <SarakstaPane />
          </div>
        )}

        {/* Kompaktais skats kad aizvērts */}
        {!drawerOpen && (
          <div style={{ padding: '0 14px', display: 'flex', alignItems: 'center', gap: 10, marginTop: 2 }}>
            <div style={{ flex: 1, height: 5, borderRadius: 3, background: DS.bgDeep, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${kopā > 0 ? (aizpilditi / kopā) * 100 : 0}%`, background: DS.green, borderRadius: 3 }} />
            </div>
            {visiGatavi && (
              <button
                onClick={genPdf}
                disabled={pdfLade}
                style={{ padding: '6px 14px', borderRadius: 7, background: DS.green, color: '#fff', border: 'none', fontSize: 12, fontWeight: 700, cursor: pdfLade ? 'wait' : 'pointer', flexShrink: 0 }}
              >
                {pdfLade ? '⏳' : '📄 PDF'}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Modāls */}
      {mapModal && (
        <MapNogabalsModal
          nogabals={mapModal.nogabals}
          onSave={saglabatNogabalu}
          onClose={() => setMapModal(null)}
        />
      )}
    </div>
  )
}
