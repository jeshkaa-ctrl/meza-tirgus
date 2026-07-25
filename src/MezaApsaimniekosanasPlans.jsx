import { useState, useEffect, useRef, useCallback, memo, useMemo } from 'react'
import { createPortal } from 'react-dom'
import 'leaflet/dist/leaflet.css'
import { supabase } from './supabaseClient'
import { C as DS, F, spinnerCSS } from './ds'
import { buildWFS, apstradatNogabalu } from './ipasums/engine'
import { NOGABALA_KRASA, SUGAS_KRASA, getVecumaGrupa } from './ipasums/constants'
import MapNogabalsModal from './map/MapNogabalsModal'
import { generateMAPpdf } from './map/mapPdfEngine'
import { parbauditVaiMaksaPdf } from './utils/pdfPaymentCheck'
import { PdfMaksasGate } from './components/PdfMaksasGate'
import { downloadPolygonSHP } from './map/shpDownload'
import { aprēķināt } from './map/landCategoryEngine'
import { acmHeaders } from './utils/acm'

const TILE_URLS = {
  osm:      'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
  satelits: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
}

const DRAWER_CLOSED = 72

// Atrod indeksu, pēc kura jāievieto jaunā virsotne (tuvākā mala)
function nearestEdgeIdx(coords, lng, lat) {
  let best = Infinity, bestIdx = 1
  for (let i = 0; i < coords.length; i++) {
    const [ax, ay] = coords[i], [bx, by] = coords[(i + 1) % coords.length]
    const dx = bx - ax, dy = by - ay
    const lenSq = dx*dx + dy*dy
    const t = lenSq === 0 ? 0 : Math.max(0, Math.min(1, ((lng-ax)*dx + (lat-ay)*dy) / lenSq))
    const d = (ax + t*dx - lng) ** 2 + (ay + t*dy - lat) ** 2
    if (d < best) { best = d; bestIdx = i + 1 }
  }
  return bestIdx
}

// ── Karte ────────────────────────────────────────────────────────────────────

function MAPKarte({
  kadGeom, nogabali, onNogabalsKliks, mapRef, planAttels, overlayOpacity, overlayRedigets,
  hoverIdx, mapSlānis, onTileKluda, gpsAktivs, onGpsKluda, onGpsPozicija, marsruts, kadastrs,
  merRezims, onMerUpdate, laukaRezims,
  // Ģeometrijas rediģēšana
  geomEditTarget, geomEditAddMode, geomEditDelMode, geomEditGpsPoint,
  onGeomEditCoords, onGeomAddModeDone, onGeomDelModeDone, onGeomGpsVertexDone,
  geomSetVertex, onGeomVertexSelect, onGeomSetVertexDone,
}) {
  const leafletRef        = useRef(null)
  const kadLayRef         = useRef(null)
  const nogLayRef         = useRef(null)
  const nogLabelsLayRef   = useRef(null)
  const overlayRef        = useRef(null)
  const cornersRef        = useRef([])
  const centerMarkerRef   = useRef(null)
  const prevPlanAttelsRef = useRef(null) // detektē vai planAttels mainījies
  const savedBoundsRef    = useRef(null) // saglabā pozīciju starp redigets pārslēgšanām
  const tileLayRef        = useRef(null)
  const tileErrRef        = useRef(0)
  const mapSlānisRef      = useRef(mapSlānis)
  const gpsMarkerRef      = useRef(null)
  const gpsCircleRef      = useRef(null)
  const gpsWatchRef       = useRef(null)
  const gpsCenteredRef    = useRef(false)
  const centroidsMarkerRef    = useRef(null)
  const marsrutsLayRef        = useRef(null)
  const merLayRef             = useRef(null)
  const merMarkersRef         = useRef([])
  const merLabelRef           = useRef(null)
  const merPunktiRef          = useRef([])
  const merRezimRef           = useRef('nav')
  const merFinishedRef        = useRef(false)
  const merPendingRef         = useRef(null)
  const merClickHandlerRef    = useRef(null)
  const merDblClickHandlerRef = useRef(null)
  const geomEditStateRef      = useRef({ coords: null, rebuild: null })
  const geomEditDelModeRef    = useRef(false)
  const laukaRezimRef         = useRef(laukaRezims)
  useEffect(() => { laukaRezimRef.current = laukaRezims }, [laukaRezims])

  // Inicializē karti un kadastra slāni
  useEffect(() => {
    if (!mapRef.current) return
    let active = true
    const init = async () => {
      const L = (await import('leaflet')).default
      if (!active) return
      if (leafletRef.current) { leafletRef.current.remove(); leafletRef.current = null }

      const map = L.map(mapRef.current, { zoomControl: true, attributionControl: false })
      const tl = L.tileLayer(TILE_URLS[mapSlānisRef.current] || TILE_URLS.osm, { maxZoom: 20 })
      tl.on('tileerror', () => { tileErrRef.current++; if (tileErrRef.current >= 3 && onTileKluda) onTileKluda(true) })
      tl.on('tileload',  () => { if (tileErrRef.current > 0) { tileErrRef.current = 0; if (onTileKluda) onTileKluda(false) } })
      tl.addTo(map)
      tileLayRef.current = tl
      leafletRef.current = map

      if (kadGeom) {
        const kl = L.geoJSON(kadGeom, { style: { color: '#00BFFF', weight: 3, fillOpacity: 0 } }).addTo(map)
        kadLayRef.current = kl
        const center = kl.getBounds().getCenter()

        // Centroīda pin — tālā mērogā (zoom < 12) parāda īpašuma atrašanās vietu
        const pinIcon = L.divIcon({
          html: '<div style="width:30px;height:30px;background:#2e7d32;border:2.5px solid #fff;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:15px;box-shadow:0 2px 10px rgba(0,0,0,0.6);margin:-15px 0 0 -15px">🌲</div>',
          iconSize: [0, 0], className: '',
        })
        const pin = L.marker(center, { icon: pinIcon, zIndexOffset: 1500 })
        if (kadastrs) pin.bindTooltip(`<b>${kadastrs}</b>`, { direction: 'top', offset: [0, -8] })
        centroidsMarkerRef.current = pin

        const updatePin = () => {
          if (!centroidsMarkerRef.current) return
          if (map.getZoom() < 12) {
            if (!map.hasLayer(centroidsMarkerRef.current)) centroidsMarkerRef.current.addTo(map)
          } else {
            if (map.hasLayer(centroidsMarkerRef.current)) centroidsMarkerRef.current.remove()
          }
        }
        map.on('zoomend', updatePin)
        updatePin()

        map.fitBounds(kl.getBounds(), { padding: [24, 24] })
      } else {
        map.setView([56.88, 24.60], 7)
      }
    }
    init().catch(console.error)
    return () => {
      active = false
      centroidsMarkerRef.current = null
      if (leafletRef.current) { leafletRef.current.remove(); leafletRef.current = null }
    }
  }, [kadGeom, mapRef])

  // Tile slāņa maiņa — noņem veco, pievieno jauno (ne mount, jo leafletRef vēl null)
  useEffect(() => {
    mapSlānisRef.current = mapSlānis
    if (!leafletRef.current) return
    const swap = async () => {
      const L = (await import('leaflet')).default
      if (!leafletRef.current) return
      if (tileLayRef.current) { tileLayRef.current.remove(); tileLayRef.current = null }
      tileErrRef.current = 0
      if (onTileKluda) onTileKluda(false)
      const tl = L.tileLayer(TILE_URLS[mapSlānis] || TILE_URLS.osm, { maxZoom: 20 })
      tl.on('tileerror', () => { tileErrRef.current++; if (tileErrRef.current >= 3 && onTileKluda) onTileKluda(true) })
      tl.on('tileload',  () => { if (tileErrRef.current > 0) { tileErrRef.current = 0; if (onTileKluda) onTileKluda(false) } })
      tl.addTo(leafletRef.current)
      tileLayRef.current = tl
    }
    swap().catch(console.error)
  }, [mapSlānis]) // eslint-disable-line react-hooks/exhaustive-deps

  // Atjaunina nogabalu slāni
  useEffect(() => {
    if (!leafletRef.current) return
    let active = true
    const update = async () => {
      const L = (await import('leaflet')).default
      if (!active || !leafletRef.current) return
      if (nogLayRef.current) { nogLayRef.current.remove(); nogLayRef.current = null }
      if (nogLabelsLayRef.current) { nogLabelsLayRef.current.remove(); nogLabelsLayRef.current = null }
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
            lyr.on('click', () => { if (merRezimRef.current !== 'nav') return; onNogabalsKliks(n, idx) })
            lyr.bindTooltip(
              `<b>${n.nr_text}</b> · ${n.sugaNos} ${n.vecums}g · ${n.platiba.toFixed(1)} ha${n.mapManuali ? ' <span style="color:#4caf50">✓ MAP</span>' : ''}`,
              { direction: 'top', sticky: true, className: 'map-tooltip' }
            )
          },
        }
      ).addTo(leafletRef.current)
      nogLayRef.current = layer

      // Nogabalu numuru etiķetes kartē (viduspunkts katram nogabalam)
      const labelsLay = L.layerGroup()
      nogabali.forEach(n => {
        if (!n.geojson?.geometry) return
        try {
          const center = L.geoJSON(n.geojson).getBounds().getCenter()
          L.marker(center, {
            icon: L.divIcon({
              html: `<div style="background:rgba(0,0,0,0.75);color:#e8f5e9;border:1px solid #4caf5099;border-radius:3px;padding:1px 4px;font-size:10px;font-weight:700;white-space:nowrap;pointer-events:none;line-height:1.4">${n.nr_text}</div>`,
              className: '', iconSize: [0, 0], iconAnchor: [0, 0],
            }),
            interactive: false, zIndexOffset: 600,
          }).addTo(labelsLay)
        } catch { /* nav ģeometrijas */ }
      })
      nogLabelsLayRef.current = labelsLay
      labelsLay.addTo(leafletRef.current)

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

  // Hover izcelšana — atjaunina tikai stilus, nerekrē slāni
  useEffect(() => {
    if (!nogLayRef.current) return
    nogLayRef.current.eachLayer(lyr => {
      const feat = lyr.feature
      const nIdx = nogabali.findIndex(x => x.id === feat?.id)
      if (nIdx < 0) return
      const n  = nogabali[nIdx]
      const vg = n ? getVecumaGrupa(n.sugaKods, n.vecums) : 2
      const hl = nIdx === hoverIdx
      lyr.setStyle({
        color:       hl ? '#ffeb3b' : (n?.mapManuali ? '#4caf50' : '#aaaaaa'),
        weight:      hl ? 3.5       : (n?.mapManuali ? 2.5 : 1.5),
        fillColor:   NOGABALA_KRASA[`${n?.sugaKods}-${vg}`] || SUGAS_KRASA[n?.sugaKods] || '#888',
        fillOpacity: hl ? 0.88 : 0.72,
        dashArray:   n?.mapManuali ? null : '4,3',
      })
    })
  }, [hoverIdx, nogabali])

  // Tikai opacity maiņa — nepārveido overlay
  useEffect(() => {
    if (overlayRef.current) overlayRef.current.setOpacity(overlayOpacity)
  }, [overlayOpacity])

  // GPS marķieris — zils (precīzs) vai sarkans (vājš) punkts + precizitātes aplis
  useEffect(() => {
    const cleanup = () => {
      if (gpsWatchRef.current != null) { navigator.geolocation.clearWatch(gpsWatchRef.current); gpsWatchRef.current = null }
      if (gpsMarkerRef.current) { gpsMarkerRef.current.remove(); gpsMarkerRef.current = null }
      if (gpsCircleRef.current) { gpsCircleRef.current.remove(); gpsCircleRef.current = null }
      gpsCenteredRef.current = false
      if (onGpsPozicija) onGpsPozicija(null)
    }

    if (!gpsAktivs) { cleanup(); return }
    if (!navigator.geolocation) { if (onGpsKluda) onGpsKluda('Geolocation nav atbalstīts šajā pārlūkā'); return }

    const startWatch = async () => {
      const L = (await import('leaflet')).default

      const dotIcon = (good) => L.divIcon({
        html: `<div style="width:16px;height:16px;border-radius:50%;background:${good ? '#2196f3' : '#f44336'};border:2.5px solid #fff;box-shadow:0 0 0 2px ${good ? '#2196f3' : '#f44336'}44,0 2px 8px rgba(0,0,0,0.5);margin:-8px 0 0 -8px"></div>`,
        iconSize: [0, 0], className: '',
      })

      gpsWatchRef.current = navigator.geolocation.watchPosition(
        (pos) => {
          if (!leafletRef.current) return
          const { latitude: lat, longitude: lng, accuracy } = pos.coords
          const good = accuracy < 50
          const latlng = [lat, lng]

          if (!gpsMarkerRef.current) {
            gpsMarkerRef.current = L.marker(latlng, { icon: dotIcon(good), zIndexOffset: 2000 }).addTo(leafletRef.current)
          } else {
            gpsMarkerRef.current.setLatLng(latlng)
            gpsMarkerRef.current.setIcon(dotIcon(good))
          }

          if (!gpsCircleRef.current) {
            gpsCircleRef.current = L.circle(latlng, {
              radius: accuracy, color: '#2196f3', weight: 1,
              fillColor: '#2196f3', fillOpacity: 0.1, interactive: false,
            }).addTo(leafletRef.current)
          } else {
            gpsCircleRef.current.setLatLng(latlng)
            gpsCircleRef.current.setRadius(accuracy)
          }

          if (!gpsCenteredRef.current) {
            leafletRef.current.setView(latlng, Math.max(leafletRef.current.getZoom(), 15))
            gpsCenteredRef.current = true
          }

          if (onGpsKluda) onGpsKluda(null)
          if (onGpsPozicija) onGpsPozicija({ lat, lng })
          if (laukaRezimRef.current) {
            leafletRef.current.setView(latlng, leafletRef.current.getZoom())
          }
        },
        (err) => { if (onGpsKluda) onGpsKluda(err.message) },
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 5000 }
      )
    }

    if (leafletRef.current) {
      startWatch().catch(console.error)
    }
    return cleanup
  }, [gpsAktivs]) // eslint-disable-line react-hooks/exhaustive-deps

  // Maršruts — uzzīmē GeoJSON līniju kartē
  useEffect(() => {
    if (!leafletRef.current) return
    const draw = async () => {
      const L = (await import('leaflet')).default
      if (!leafletRef.current) return
      if (marsrutsLayRef.current) { marsrutsLayRef.current.remove(); marsrutsLayRef.current = null }
      if (!marsruts) return
      const layer = L.geoJSON(marsruts, { style: { color: '#FF6B00', weight: 4, opacity: 0.88 } }).addTo(leafletRef.current)
      marsrutsLayRef.current = layer
      leafletRef.current.fitBounds(layer.getBounds(), { padding: [30, 30] })
    }
    draw().catch(console.error)
  }, [marsruts])

  // Mērīšanas rīki — attālums un laukums
  useEffect(() => {
    merRezimRef.current = merRezims
    const map = leafletRef.current

    const clearLayers = () => {
      if (merLayRef.current) { merLayRef.current.remove(); merLayRef.current = null }
      merMarkersRef.current.forEach(m => m.remove()); merMarkersRef.current = []
      if (merLabelRef.current) { merLabelRef.current.remove(); merLabelRef.current = null }
      merPunktiRef.current = []
    }

    if (merPendingRef.current) { clearTimeout(merPendingRef.current); merPendingRef.current = null }
    clearLayers()

    if (!map) { if (onMerUpdate) onMerUpdate(null); return }
    if (map._container) map._container.style.cursor = ''
    if (merRezims === 'nav') { if (onMerUpdate) onMerUpdate(null); return }

    map._container.style.cursor = 'crosshair'
    merFinishedRef.current = false

    const showLabel = (L, latlng, text) => {
      if (merLabelRef.current) { merLabelRef.current.remove(); merLabelRef.current = null }
      if (!text) return
      merLabelRef.current = L.marker(latlng, {
        icon: L.divIcon({
          html: `<div style="background:rgba(8,0,20,0.92);border:1.5px solid #e040fb;border-radius:6px;padding:3px 9px;font-size:12px;font-weight:700;color:#e040fb;white-space:nowrap;box-shadow:0 2px 8px rgba(0,0,0,0.5)">${text}</div>`,
          className: '', iconSize: [0, 0],
        }),
        interactive: false, zIndexOffset: 3500,
      }).addTo(map)
    }

    const redraw = (L, pts) => {
      if (merLayRef.current) { merLayRef.current.remove(); merLayRef.current = null }
      const mode = merRezimRef.current
      if (mode === 'attālums') {
        if (pts.length >= 2) {
          merLayRef.current = L.polyline(pts, { color: '#e040fb', weight: 3, opacity: 0.9, interactive: false }).addTo(map)
        }
        let total = 0
        for (let i = 1; i < pts.length; i++) total += L.latLng(pts[i - 1]).distanceTo(L.latLng(pts[i]))
        const txt = pts.length >= 2 ? fmtDist(total) : null
        showLabel(L, pts[pts.length - 1], txt)
        if (onMerUpdate) onMerUpdate(txt)
      } else {
        if (pts.length >= 3) {
          merLayRef.current = L.polygon(pts, {
            color: '#e040fb', weight: 2, opacity: 0.9,
            fillColor: '#e040fb', fillOpacity: 0.15, interactive: false,
          }).addTo(map)
          const ha = polygonAreaHa(pts)
          const txt = `${ha.toFixed(2)} ha`
          showLabel(L, merLayRef.current.getBounds().getCenter(), txt)
          if (onMerUpdate) onMerUpdate(txt)
        } else if (pts.length === 2) {
          merLayRef.current = L.polyline(pts, { color: '#e040fb', weight: 2, opacity: 0.9, interactive: false }).addTo(map)
          if (onMerUpdate) onMerUpdate(null)
        } else {
          if (onMerUpdate) onMerUpdate(null)
        }
      }
    }

    const handleClick = (e) => {
      if (merPendingRef.current) { clearTimeout(merPendingRef.current); merPendingRef.current = null }
      merPendingRef.current = setTimeout(async () => {
        merPendingRef.current = null
        if (merFinishedRef.current) return
        const L = (await import('leaflet')).default
        if (!leafletRef.current) return
        const pts = merPunktiRef.current
        pts.push({ lat: e.latlng.lat, lng: e.latlng.lng })
        const dot = L.circleMarker(e.latlng, {
          radius: 5, color: '#fff', weight: 2, fillColor: '#e040fb', fillOpacity: 1, interactive: false,
        }).addTo(map)
        merMarkersRef.current.push(dot)
        redraw(L, pts)
      }, 220)
    }

    const handleDblClick = () => {
      if (merPendingRef.current) { clearTimeout(merPendingRef.current); merPendingRef.current = null }
      if (merFinishedRef.current) return
      merFinishedRef.current = true
      if (map._container) map._container.style.cursor = ''
      map.off('click', handleClick)
      map.off('dblclick', handleDblClick)
      merClickHandlerRef.current = null
      merDblClickHandlerRef.current = null
    }

    merClickHandlerRef.current = handleClick
    merDblClickHandlerRef.current = handleDblClick
    map.on('click', handleClick)
    map.on('dblclick', handleDblClick)

    return () => {
      if (merPendingRef.current) { clearTimeout(merPendingRef.current); merPendingRef.current = null }
      if (merClickHandlerRef.current) { map.off('click', merClickHandlerRef.current); merClickHandlerRef.current = null }
      if (merDblClickHandlerRef.current) { map.off('dblclick', merDblClickHandlerRef.current); merDblClickHandlerRef.current = null }
    }
  }, [merRezims]) // eslint-disable-line react-hooks/exhaustive-deps

  // Sync delete mode ref — closure vertex handlers redz aktuālo vērtību
  useEffect(() => { geomEditDelModeRef.current = geomEditDelMode }, [geomEditDelMode])

  // ── Ģeometrijas virsotņu rediģēšana ──────────────────────────────────────────
  useEffect(() => {
    if (!geomEditTarget || !leafletRef.current) return
    let active = true
    const editCoords = []   // [[lng, lat], ...] — mutable, shared with handlers
    let vMarkers = []
    let ePoly = null

    const setup = async () => {
      const L = (await import('leaflet')).default
      if (!active || !leafletRef.current) return
      const { n } = geomEditTarget
      const geom = n.geojson?.geometry
      if (!geom || !['Polygon', 'MultiPolygon'].includes(geom.type)) return

      const ring = geom.type === 'Polygon'
        ? geom.coordinates[0]
        : geom.coordinates[0][0]
      ring.slice(0, -1).forEach(c => editCoords.push([c[0], c[1]]))

      // Padara oriģinālo slāni gaiši
      if (nogLayRef.current) {
        nogLayRef.current.eachLayer(l => l.setStyle({ opacity: 0.2, fillOpacity: 0.08 }))
      }
      if (nogLabelsLayRef.current) nogLabelsLayRef.current.eachLayer(l => l.setOpacity?.(0.2))

      const toLL = ([lng, lat]) => L.latLng(lat, lng)

      const rebuildPoly = () => {
        if (ePoly) { ePoly.remove(); ePoly = null }
        if (editCoords.length < 2) return
        ePoly = L.polygon(editCoords.map(toLL), {
          color: '#e040fb', weight: 2, fillColor: '#e040fb',
          fillOpacity: 0.14, dashArray: '5,3', interactive: false,
        }).addTo(leafletRef.current)
        if (onGeomEditCoords) onGeomEditCoords([...editCoords])
      }

      const buildVMarkers = () => {
        vMarkers.forEach(m => { try { m.closePopup(); m.remove() } catch {} })
        vMarkers = editCoords.map(([lng, lat], i) => {
          const m = L.marker([lat, lng], {
            draggable: true,
            icon: L.divIcon({
              html: `<div style="width:14px;height:14px;background:#e040fb;border:2.5px solid #fff;border-radius:50%;margin:-7px 0 0 -7px;cursor:grab;box-shadow:0 1px 6px rgba(0,0,0,0.55)"></div>`,
              iconSize: [0, 0], className: '',
            }),
            zIndexOffset: 1200,
          }).addTo(leafletRef.current)

          m.on('drag', e => {
            editCoords[i] = [e.latlng.lng, e.latlng.lat]
            rebuildPoly()
          })

          m.on('click', e => {
            L.DomEvent.stopPropagation(e.originalEvent)
            if (geomEditDelModeRef.current) {
              if (editCoords.length <= 3) return
              editCoords.splice(i, 1)
              rebuildPoly()
              buildVMarkers()
              if (onGeomEditCoords) onGeomEditCoords([...editCoords])
              if (onGeomDelModeDone) onGeomDelModeDone()
            } else {
              const [cLng, cLat] = editCoords[i]
              if (onGeomVertexSelect) onGeomVertexSelect(i, cLat, cLng)
            }
          })

          return m
        })
      }

      buildVMarkers()
      rebuildPoly()

      geomEditStateRef.current = {
        coords: editCoords,
        rebuild: () => { rebuildPoly(); buildVMarkers() },
      }

      if (onGeomEditCoords) onGeomEditCoords([...editCoords])
    }

    setup().catch(console.error)

    return () => {
      active = false
      vMarkers.forEach(m => { try { m.closePopup(); m.remove() } catch {} })
      vMarkers = []
      if (ePoly) { try { ePoly.remove() } catch {} ePoly = null }
      geomEditStateRef.current = { coords: null, rebuild: null }

      // Atjauno oriģinālo slāni
      if (nogLayRef.current) {
        nogLayRef.current.eachLayer(lyr => {
          const n2 = nogabali.find(x => x.id === lyr.feature?.id)
          if (!n2) return
          const vg = getVecumaGrupa(n2.sugaKods, n2.vecums)
          lyr.setStyle({
            color: n2.mapManuali ? '#4caf50' : '#aaaaaa',
            weight: n2.mapManuali ? 2.5 : 1.5,
            fillColor: NOGABALA_KRASA[`${n2.sugaKods}-${vg}`] || SUGAS_KRASA[n2.sugaKods] || '#888',
            fillOpacity: 0.72, dashArray: n2.mapManuali ? null : '4,3',
          })
        })
      }
      if (nogLabelsLayRef.current) nogLabelsLayRef.current.eachLayer(l => l.setOpacity?.(1))
    }
  }, [geomEditTarget?.n?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── "Pievienot virsotni" — nākamais klikšķis kartē ievieto punktu tuvākajā malā
  useEffect(() => {
    if (!leafletRef.current || !geomEditAddMode) return
    const map = leafletRef.current
    map.getContainer().style.cursor = 'crosshair'

    const handle = (e) => {
      const { coords, rebuild } = geomEditStateRef.current
      if (!coords?.length) return
      const { lng, lat } = e.latlng
      const idx = nearestEdgeIdx(coords, lng, lat)
      coords.splice(idx, 0, [lng, lat])
      if (rebuild) rebuild()
      if (onGeomEditCoords) onGeomEditCoords([...coords])
      if (onGeomAddModeDone) onGeomAddModeDone()
    }

    map.on('click', handle)
    return () => {
      map.off('click', handle)
      if (map.getContainer()) map.getContainer().style.cursor = ''
    }
  }, [geomEditAddMode]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── GPS virsotne — ievieto virsotni GPS pozīcijā
  useEffect(() => {
    if (!geomEditGpsPoint) return
    const { coords, rebuild } = geomEditStateRef.current
    if (!coords?.length) return
    const { lat, lng } = geomEditGpsPoint
    const idx = nearestEdgeIdx(coords, lng, lat)
    coords.splice(idx, 0, [lng, lat])
    if (rebuild) rebuild()
    if (onGeomEditCoords) onGeomEditCoords([...coords])
    if (onGeomGpsVertexDone) onGeomGpsVertexDone()
  }, [geomEditGpsPoint]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Virsotnes koordinātu atjauninājums (manuāla ievade) ─────────────────────
  useEffect(() => {
    if (!geomSetVertex) return
    const { coords, rebuild } = geomEditStateRef.current
    if (!coords || geomSetVertex.idx < 0 || geomSetVertex.idx >= coords.length) return
    coords[geomSetVertex.idx] = [geomSetVertex.lng, geomSetVertex.lat]
    rebuild?.()
    if (onGeomEditCoords) onGeomEditCoords([...coords])
    if (onGeomSetVertexDone) onGeomSetVertexDone()
  }, [geomSetVertex]) // eslint-disable-line react-hooks/exhaustive-deps

  return null
}

function nearestBoundaryPoint(kadGeom, userLat, userLng) {
  const geom = kadGeom?.geometry
  if (!geom) return null
  const rings = geom.type === 'Polygon' ? geom.coordinates
    : geom.type === 'MultiPolygon' ? geom.coordinates.flat(1)
    : []
  let best = null, bestD = Infinity
  for (const ring of rings) {
    for (const [lng, lat] of ring) {
      const d = (lat - userLat) ** 2 + (lng - userLng) ** 2
      if (d < bestD) { bestD = d; best = { lat, lng } }
    }
  }
  return best
}

function polygonAreaHa(latlngs) {
  if (latlngs.length < 3) return 0
  const R = 6371000, rad = Math.PI / 180
  let area = 0
  const n = latlngs.length
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n
    const xi = latlngs[i].lng * rad * Math.cos(latlngs[i].lat * rad)
    const yi = latlngs[i].lat * rad
    const xj = latlngs[j].lng * rad * Math.cos(latlngs[j].lat * rad)
    const yj = latlngs[j].lat * rad
    area += xi * yj - xj * yi
  }
  return Math.abs(area / 2) * R * R / 10000
}

function fmtDist(m) {
  return m < 1000 ? `${Math.round(m)} m` : `${(m / 1000).toFixed(2)} km`
}

// ── Nogabalu saraksta rinda ────────────────────────────────────────────────

function NogabalsRinda({ n, idx, onKliks, onHover, aktīvs }) {
  const zaļs = n.mapManuali
  return (
    <button
      onClick={() => onKliks(n, idx)}
      onMouseEnter={() => onHover(idx)}
      onMouseLeave={() => onHover(null)}
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

// ── Nogabalu saraksta panelis (memo — novērš re-mount pie parent re-render) ───

const SarakstaPane = memo(function SarakstaPane({
  kadInput, kopPlatiba, kopā, aizpilditi, lvmKluda,
  nogabali, nogKluda, nogLade, ieladetNogabalus,
  atvertModalu, setHoverIdx, mapModal,
  maNogabali, visiGatavi, pdfLade, onPdfKliks,
  onSnapshot, snapshotSaglabats, snapshotLade,
}) {
  const sortedWithIdx = useMemo(() => {
    const nrKey = s => { const p = String(s || '').split(/[.\-]/).map(Number); return (p[0] || 0) * 10000 + (p[1] || 0) }
    return nogabali
      .map((n, originalIdx) => ({ n, originalIdx }))
      .sort((a, b) => nrKey(a.n.nr_text) - nrKey(b.n.nr_text))
  }, [nogabali])
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
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
      {lvmKluda && (
        <div style={{ margin: '8px 10px 0', padding: '8px 10px', borderRadius: 7, background: '#1f1000', border: '1px solid #e65100', fontSize: 11, color: '#ffb74d', lineHeight: 1.5 }}>
          ⚠️ LVM GEO pagaidām nav pieejams. Nogabali netika ielādēti automātiski.
        </div>
      )}
      <div style={{ flex: 1, overflowY: 'auto', padding: '8px 10px' }}>
        {(nogabali.length === 0 || !nogabali[0]?.geojson?.geometry) ? (
          <div style={{ padding: nogabali.length > 0 ? '8px' : '20px 8px', textAlign: 'center' }}>
            {nogKluda && (
              <div style={{ fontSize: 11, color: '#ffb74d', marginBottom: 10, lineHeight: 1.5 }}>⚠️ {nogKluda}</div>
            )}
            <button
              onClick={ieladetNogabalus} disabled={nogLade}
              style={{
                padding: '10px 18px', borderRadius: 8, cursor: nogLade ? 'wait' : 'pointer',
                background: `linear-gradient(135deg,${DS.green},${DS.greenDk})`,
                color: '#fff', border: 'none', fontSize: 13, fontWeight: 600,
                opacity: nogLade ? 0.7 : 1, width: '100%',
              }}
            >
              {nogLade ? '⏳ Meklē VMD datos...' : nogabali.length > 0 ? '🗺️ Ielādēt poligonus kartē' : '🌲 Pievienot nogabalus'}
            </button>
            <div style={{ fontSize: 10, color: DS.textDim, marginTop: 8, lineHeight: 1.5 }}>
              Meklē VMD meža taksācijas datus pēc kadastra
            </div>
          </div>
        ) : (<>
          {!snapshotSaglabats && (
            <div style={{ marginBottom: 8, padding: '8px 6px', borderRadius: 8, background: 'rgba(46,125,50,0.12)', border: `1px solid ${DS.greenBdr}` }}>
              <div style={{ fontSize: 10, color: DS.textDim, marginBottom: 6, lineHeight: 1.5 }}>
                Saglabā sākotnējo ģeometriju kā drošības tīklu pirms rediģēšanas
              </div>
              <button
                onClick={onSnapshot} disabled={snapshotLade}
                style={{
                  width: '100%', padding: '9px 12px', borderRadius: 7,
                  background: snapshotLade ? DS.bgDeep : `linear-gradient(135deg,${DS.green},${DS.greenDk})`,
                  color: '#fff', border: 'none', fontSize: 12, fontWeight: 700,
                  cursor: snapshotLade ? 'wait' : 'pointer', opacity: snapshotLade ? 0.7 : 1,
                }}
              >
                {snapshotLade ? '⏳ Saglabā...' : '📸 Saglabāt sākotnējo stāvokli'}
              </button>
            </div>
          )}
          {snapshotSaglabats && (
            <div style={{ marginBottom: 8, fontSize: 10, color: DS.green, padding: '5px 8px', borderRadius: 6, background: `${DS.green}11`, border: `1px solid ${DS.green}44` }}>
              ✓ Sākotnējais stāvoklis saglabāts — ↺ atgriešana pieejama rediģēšanas panelī
            </div>
          )}
          {sortedWithIdx.map(({ n, originalIdx }) => (
            <NogabalsRinda
              key={n.id} n={n} idx={originalIdx}
              onKliks={atvertModalu} onHover={setHoverIdx}
              aktīvs={mapModal?.index === originalIdx}
            />
          ))}
        </>)}
      </div>
      <div style={{ padding: '6px 10px 14px', flexShrink: 0 }}>
        {visiGatavi ? (
          <button
            onClick={onPdfKliks} disabled={pdfLade}
            style={{
              width: '100%', padding: '13px', borderRadius: 10, fontSize: 14, fontWeight: 700,
              cursor: pdfLade ? 'wait' : 'pointer',
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
})

// ── Galvenais komponents ──────────────────────────────────────────────────────

export default function MezaApsaimniekosanasPlans({ onBack, onReg }) {
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
  const [hoverIdx,        setHoverIdx]        = useState(null)
  const [mapSlānis,       setMapSlānis]       = useState('osm')
  const [tileKluda,       setTileKluda]       = useState(false)
  const [gpsAktivs,       setGpsAktivs]       = useState(false)
  const [gpsKluda,        setGpsKluda]        = useState(null)
  const [gpsPozicija,     setGpsPozicija]     = useState(null)
  const [marsruts,        setMarsruts]        = useState(null)
  const [marsrutsInfo,    setMarsrutsInfo]    = useState(null)
  const [marsrutsLade,    setMarsrutsLade]    = useState(false)
  const [marsrutsKluda,   setMarsrutsKluda]   = useState(null)
  const [merRezims,       setMerRezims]       = useState('nav')
  const [merResultats,    setMerResultats]    = useState(null)
  const [pdfModalOpen,    setPdfModalOpen]    = useState(false)
  const [pdfMaksa,        setPdfMaksa]        = useState(null)
  const [geomEditTarget,  setGeomEditTarget]  = useState(null)  // { n, idx }
  const [geomEditAddMode, setGeomEditAddMode] = useState(false)
  const [geomEditDelMode, setGeomEditDelMode] = useState(false)
  const [geomEditGpsPoint,setGeomEditGpsPoint]= useState(null)
  const [geomEditLade,    setGeomEditLade]    = useState(false)
  const [geomManual,      setGeomManual]      = useState(null) // null | { idx: null|number, lat:'', lng:'', kluda:'' }
  const [geomSetVertex,   setGeomSetVertex]   = useState(null) // null | { idx, lat, lng }
  const [geomEditKluda,         setGeomEditKluda]         = useState(null)
  const [snapshotSaglabats,     setSnapshotSaglabats]     = useState(false)
  const [snapshotLade,          setSnapshotLade]          = useState(false)
  const [atgriestLade,          setAtgriestLade]          = useState(false)
  const [laukaRezims,           setLaukaRezims]           = useState(false)
  const [laukaAtbloketProgress, setLaukaAtbloketProgress] = useState(0)
  const [laukaWakeLockAtbalsts, setLaukaWakeLockAtbalsts] = useState(true)
  const geomEditCoordsRef  = useRef(null)
  const wakeLockRef        = useRef(null)
  const laukaHoldStartRef  = useRef(null)
  const laukaHoldInterval  = useRef(null)

  const mapDivRef           = useRef(null)
  const isMobile            = typeof window !== 'undefined' && window.innerWidth < 700
  const drawerAutoOpenedRef = useRef(false)

  // ── Auto-atvērt drawer mobilajā skatā tiklīdz nogabali ielādēti ──────────────
  useEffect(() => {
    if (isMobile && nogabali.length > 0 && !drawerAutoOpenedRef.current) {
      drawerAutoOpenedRef.current = true
      setDrawerOpen(true)
    }
  }, [nogabali.length]) // eslint-disable-line react-hooks/exhaustive-deps

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

  const izslēgtLaukaRezimu = useCallback(() => {
    setLaukaRezims(false)
    setLaukaAtbloketProgress(0)
    setLaukaWakeLockAtbalsts(true)
    clearInterval(laukaHoldInterval.current)
    if (wakeLockRef.current) {
      wakeLockRef.current.release().catch(() => {})
      wakeLockRef.current = null
    }
  }, [])

  // Re-acquire wake lock kad tab kļūst redzama un lauka režīms vēl aktīvs
  useEffect(() => {
    const fn = async () => {
      if (document.visibilityState === 'visible' && laukaRezims && 'wakeLock' in navigator) {
        try { wakeLockRef.current = await navigator.wakeLock.request('screen') } catch { /* silent */ }
      }
    }
    document.addEventListener('visibilitychange', fn)
    return () => document.removeEventListener('visibilitychange', fn)
  }, [laukaRezims])

  const saglabatNogabalu = (saved) => {
    setNogabali(prev => {
      const arr = [...prev]
      arr[mapModal.index] = { ...arr[mapModal.index], ...saved }
      return arr
    })
    setMapModal(null)
  }

  // ── Ģeometrijas rediģēšana ───────────────────────────────────────────────────
  const saveGeomEdit = async () => {
    const coords = geomEditCoordsRef.current
    if (!coords?.length || !geomEditTarget) return
    const { n, idx } = geomEditTarget
    const geomType = n.geojson?.geometry?.type
    if (!geomType) return

    // Aizver gredzenu un veido jauno ģeometriju
    const ring = [...coords, coords[0]]
    const newGeometry = geomType === 'Polygon'
      ? { type: 'Polygon', coordinates: [ring] }
      : { type: 'MultiPolygon', coordinates: [[ring]] }  // vienkāršo uz vienu polygonu

    if (isNaN(Number(n.id))) {
      setGeomEditKluda('Šim nogabalam nav DB ID — saglabāšana nav iespējama')
      return
    }
    setGeomEditLade(true)
    setGeomEditKluda(null)
    try {
      const { error } = await supabase.rpc('update_nogabals_geom', {
        p_id: Number(n.id),
        p_geojson: JSON.stringify(newGeometry),
      })
      if (error) throw new Error(error.message)
      setNogabali(prev => prev.map((nog, i) => i !== idx ? nog : {
        ...nog,
        geojson: { ...nog.geojson, geometry: newGeometry },
      }))
      setGeomEditTarget(null)
      setGeomEditDelMode(false)
      geomEditCoordsRef.current = null
    } catch (e) {
      setGeomEditKluda(e.message)
    } finally {
      setGeomEditLade(false)
    }
  }

  // ── Ģeometrijas momentuzņēmums ───────────────────────────────────────────────
  const saglabatMomentuznemumu = async () => {
    const kad = kadInput.replace(/\s/g, '')
    setSnapshotLade(true)
    try {
      const r = await fetch('/api/snapshot-geom', {
        method: 'POST',
        headers: acmHeaders(),
        body: JSON.stringify({ action: 'saglabat', kadastrs: kad }),
      })
      const d = await r.json()
      if (!r.ok) throw new Error(d.error || 'Servera kļūda')
      setSnapshotSaglabats(true)
    } catch (e) {
      alert('Momentuzņēmuma saglabāšana neizdevās: ' + e.message)
    } finally {
      setSnapshotLade(false)
    }
  }

  const atgrieztSakotnejoGeom = async () => {
    const { n, idx } = geomEditTarget
    if (!window.confirm(`Atgriezt nogabalu ${n.nr_text} uz sākotnējo stāvokli? Nesaglabātās izmaiņas tiks zaudētas.`)) return
    setAtgriestLade(true)
    setGeomEditKluda(null)
    try {
      const r = await fetch('/api/snapshot-geom', {
        method: 'POST',
        headers: acmHeaders(),
        body: JSON.stringify({ action: 'atgriezt', nogabala_id: n.id }),
      })
      const d = await r.json()
      if (!r.ok) throw new Error(d.error || 'Servera kļūda')
      setNogabali(prev => prev.map((nog, i) => i !== idx ? nog : {
        ...nog,
        geojson: { ...nog.geojson, geometry: d.geojson },
      }))
      setGeomEditTarget(null)
      setGeomEditKluda(null)
      setGeomEditAddMode(false)
      setGeomEditDelMode(false)
      setGeomManual(null)
      setGeomSetVertex(null)
    } catch (e) {
      setGeomEditKluda('Atgriešana neizdevās: ' + e.message)
    } finally {
      setAtgriestLade(false)
    }
  }

  // ── Nogabalu manuālā ielāde (atsevišķs solis pēc robežas) ──────────────────
  const ieladetNogabalus = async () => {
    const kad = kadInput.replace(/\s/g, '')
    setNogLade(true)
    setNogKluda(null)
    try {
      const { data, error } = await supabase
        .from('meza_nogabali_geo')
        .select('*')
        .eq('kadastrs', kad)
      if (error) throw error
      if (!data?.length) {
        setNogKluda('Nogabali nav atrasti šim kadastram VMD datos.')
        return
      }
      setNogabali(data.map((n, i) => apstradatNogabalu({
        type: 'Feature',
        id: String(n.id),
        geometry: n.geometry || null,
        properties: n,
      }, i)))
    } catch (e) {
      setNogKluda('Nogabalu ielāde neizdevās: ' + e.message)
    } finally {
      setNogLade(false)
    }
  }

  // ── Maršruta aprēķins (OSRM) ────────────────────────────────────────────────
  const aprēķinātMarsrutu = async () => {
    if (!gpsPozicija || !kadGeom) return
    setMerRezims('nav'); setMerResultats(null)
    setMarsrutsLade(true)
    setMarsrutsKluda(null)
    setMarsruts(null)
    setMarsrutsInfo(null)
    try {
      const near = nearestBoundaryPoint(kadGeom, gpsPozicija.lat, gpsPozicija.lng)
      if (!near) throw new Error('Nevar noteikt īpašuma robežas punktu')
      const url = `https://router.project-osrm.org/route/v1/driving/${gpsPozicija.lng},${gpsPozicija.lat};${near.lng},${near.lat}?overview=full&geometries=geojson`
      const ctrl = new AbortController()
      const timer = setTimeout(() => ctrl.abort(), 10000)
      const resp = await fetch(url, { signal: ctrl.signal })
      clearTimeout(timer)
      if (!resp.ok) throw new Error('osrm_err')
      const data = await resp.json()
      const route = data.routes?.[0]
      if (!route) throw new Error('Maršruts nav atrasts')
      setMarsruts(route.geometry)
      setMarsrutsInfo({ distKm: (route.distance / 1000).toFixed(1), minUtes: Math.round(route.duration / 60) })
    } catch (e) {
      const isNet = e.name === 'AbortError' || e.message === 'osrm_err' || e.message.includes('fetch')
      setMarsrutsKluda(isNet ? 'Maršruta serviss pagaidām nav pieejams' : e.message)
    } finally {
      setMarsrutsLade(false)
    }
  }

  // ── PDF ģenerēšana ──────────────────────────────────────────────────────────
  const genPdf = async () => {
    if (pdfLade) return
    const maksa = await parbauditVaiMaksaPdf(null, 'MAP')
    if (!maksa.allowed) { setPdfMaksa(maksa); return }
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

  // ── Lauka režīms — Wake Lock + UI bloķēšana ─────────────────────────────────
  const ieslegtLaukaRezimu = async () => {
    setLaukaRezims(true)
    if ('wakeLock' in navigator) {
      try {
        const lock = await navigator.wakeLock.request('screen')
        lock.addEventListener('release', () => setLaukaWakeLockAtbalsts(false))
        wakeLockRef.current = lock
      } catch {
        setLaukaWakeLockAtbalsts(false)
      }
    } else {
      setLaukaWakeLockAtbalsts(false)
    }
  }

  const sakutTuret = (e) => {
    e.preventDefault()
    laukaHoldStartRef.current = Date.now()
    laukaHoldInterval.current = setInterval(() => {
      const progress = Math.min(100, ((Date.now() - laukaHoldStartRef.current) / 2000) * 100)
      setLaukaAtbloketProgress(progress)
      if (progress >= 100) {
        clearInterval(laukaHoldInterval.current)
        izslēgtLaukaRezimu()
      }
    }, 50)
  }

  const atceltTuret = () => {
    clearInterval(laukaHoldInterval.current)
    setLaukaAtbloketProgress(0)
  }

  const LaukaRezimOverlay = () => {
    if (!laukaRezims) return null
    return createPortal(
      <div
        style={{
          position: 'fixed', inset: 0, zIndex: 2000,
          background: 'rgba(0,8,0,0.10)',
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'flex-end',
          paddingBottom: 52,
          pointerEvents: 'all',
          touchAction: 'none',
          userSelect: 'none', WebkitUserSelect: 'none',
        }}
        onContextMenu={e => e.preventDefault()}
        onPointerDown={e => { if (e.target === e.currentTarget) e.stopPropagation() }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
          <div style={{
            fontSize: 11, color: 'rgba(255,255,255,0.8)',
            background: 'rgba(0,0,0,0.65)',
            padding: '4px 16px', borderRadius: 20,
            backdropFilter: 'blur(6px)',
            letterSpacing: 0.6, fontFamily: F.family,
          }}>
            🔒 LAUKA REŽĪMS AKTĪVS
          </div>
          {!laukaWakeLockAtbalsts && (
            <div style={{
              fontSize: 10, color: '#ffb74d',
              background: 'rgba(0,0,0,0.75)',
              padding: '5px 14px', borderRadius: 10,
              maxWidth: 250, textAlign: 'center', lineHeight: 1.5,
              fontFamily: F.family,
            }}>
              ⚠️ Šī ierīce neatbalsta ekrāna bloķēšanu — iestati manuāli garāku ekrāna izslēgšanās laiku ierīces iestatījumos
            </div>
          )}
          <button
            onPointerDown={sakutTuret}
            onPointerUp={atceltTuret}
            onPointerLeave={atceltTuret}
            onPointerCancel={atceltTuret}
            style={{
              position: 'relative', overflow: 'hidden',
              padding: '15px 34px', borderRadius: 34,
              background: 'rgba(8,24,8,0.92)',
              border: `2px solid ${DS.green}88`,
              color: '#fff', fontSize: 14, fontWeight: 700,
              cursor: 'pointer', fontFamily: F.family,
              backdropFilter: 'blur(10px)',
              boxShadow: '0 4px 28px rgba(0,0,0,0.65)',
              touchAction: 'none', WebkitUserSelect: 'none',
              minWidth: 200, textAlign: 'center',
            }}
          >
            {/* Hold progress fill */}
            <div style={{
              position: 'absolute', left: 0, top: 0, bottom: 0,
              width: `${laukaAtbloketProgress}%`,
              background: `${DS.green}38`,
              pointerEvents: 'none',
              transition: laukaAtbloketProgress === 0 ? 'none' : 'width 0.05s linear',
            }} />
            <span style={{ position: 'relative' }}>
              🔓 {laukaAtbloketProgress > 0 ? 'Tur nospiestu...' : 'Atbloķēt (turi 2s)'}
            </span>
          </button>
        </div>
      </div>,
      document.body
    )
  }

  // ── Tile slāņu izvēlne ───────────────────────────────────────────────────────
  const TileSlāņiPanel = () => (
    <div style={{
      position: 'absolute', left: 10, bottom: isMobile ? DRAWER_CLOSED + 8 : 16, zIndex: 400,
      display: 'flex', flexDirection: 'column', gap: 4,
      fontFamily: F.family,
    }}>
      {[
        { key: 'osm',      label: '🗺️ Karte' },
        { key: 'satelits', label: '🛰️ Satelīts' },
      ].map(({ key, label }) => (
        <button
          key={key}
          onClick={() => { setMapSlānis(key); setMerRezims('nav'); setMerResultats(null) }}
          style={{
            padding: '6px 11px', borderRadius: 7, fontSize: 12, fontWeight: 600,
            border: `1px solid ${mapSlānis === key ? DS.green : DS.greenBdr}`,
            background: mapSlānis === key ? `${DS.green}cc` : 'rgba(8,16,8,0.88)',
            color: mapSlānis === key ? '#fff' : DS.textMut,
            cursor: 'pointer', textAlign: 'left',
            backdropFilter: 'blur(6px)',
            boxShadow: '0 2px 8px rgba(0,0,0,0.45)',
            fontFamily: F.family,
          }}
        >
          {label}
        </button>
      ))}

      {/* Maršruts — tikai kad īpašums ielādēts */}
      {kadGeom && <>
        <div style={{ height: 1, background: DS.greenBdr, margin: '2px 0' }} />
        <button
          onClick={aprēķinātMarsrutu}
          disabled={!gpsAktivs || !gpsPozicija || marsrutsLade}
          title={!gpsAktivs ? 'Ieslēdz GPS lai aprēķinātu maršrutu' : !gpsPozicija ? 'Gaida GPS pozīciju...' : 'Aprēķināt maršrutu uz īpašumu'}
          style={{
            padding: '6px 11px', borderRadius: 7, fontSize: 12, fontWeight: 600,
            border: `1px solid ${marsrutsInfo ? DS.green : DS.greenBdr}`,
            background: marsrutsInfo ? `${DS.green}44` : 'rgba(8,16,8,0.88)',
            color: (!gpsAktivs || !gpsPozicija) ? DS.textDim : DS.text,
            cursor: (!gpsAktivs || !gpsPozicija || marsrutsLade) ? 'not-allowed' : 'pointer',
            backdropFilter: 'blur(6px)',
            boxShadow: '0 2px 8px rgba(0,0,0,0.45)',
            fontFamily: F.family,
            opacity: (!gpsAktivs || !gpsPozicija) ? 0.55 : 1,
          }}
        >
          {marsrutsLade ? '⏳ Aprēķina...' : '🚗 Maršruts'}
        </button>
        {marsrutsInfo && (
          <div style={{
            padding: '5px 10px', borderRadius: 7, fontSize: 11, fontWeight: 600,
            background: 'rgba(8,16,8,0.88)', border: `1px solid ${DS.green}`,
            color: DS.green, backdropFilter: 'blur(6px)', boxShadow: '0 2px 8px rgba(0,0,0,0.45)',
            display: 'flex', alignItems: 'center', gap: 4,
          }}>
            <span style={{ flex: 1 }}>{marsrutsInfo.distKm} km · ~{marsrutsInfo.minUtes} min</span>
            <button
              onClick={() => { setMarsruts(null); setMarsrutsInfo(null); setMarsrutsKluda(null) }}
              style={{ background: 'none', border: 'none', color: DS.textDim, fontSize: 13, cursor: 'pointer', padding: 0, lineHeight: 1 }}
            >✕</button>
          </div>
        )}
        {marsrutsKluda && (
          <div style={{ fontSize: 10, color: '#ffb74d', maxWidth: 140, lineHeight: 1.4, padding: '2px 0' }}>⚠️ {marsrutsKluda}</div>
        )}
      </>}

      {/* Mērīšanas rīki */}
      <div style={{ height: 1, background: DS.greenBdr, margin: '2px 0' }} />
      {[
        { key: 'attālums', label: '📏 Mērīt', hint: 'Mērīt attālumu — klikšķini punktus, dubultklikšķis pabeigt' },
        { key: 'laukums',  label: '📐 Laukums', hint: 'Mērīt laukumu — klikšķini virsotnes, dubultklikšķis pabeigt' },
      ].map(({ key, label, hint }) => (
        <button
          key={key}
          onClick={() => { setMerRezims(merRezims === key ? 'nav' : key); setMerResultats(null) }}
          title={hint}
          style={{
            padding: '6px 11px', borderRadius: 7, fontSize: 12, fontWeight: 600,
            border: `1px solid ${merRezims === key ? '#e040fb' : DS.greenBdr}`,
            background: merRezims === key ? 'rgba(224,64,251,0.22)' : 'rgba(8,16,8,0.88)',
            color: merRezims === key ? '#e040fb' : DS.textMut,
            cursor: 'pointer', textAlign: 'left',
            backdropFilter: 'blur(6px)',
            boxShadow: '0 2px 8px rgba(0,0,0,0.45)',
            fontFamily: F.family,
          }}
        >
          {label}
        </button>
      ))}
      {merRezims !== 'nav' && !merResultats && (
        <div style={{ fontSize: 10, color: '#e040fb99', lineHeight: 1.4, padding: '1px 2px', maxWidth: 140 }}>
          {merRezims === 'attālums' ? 'Klikšķini punktus · 2× pabeigt' : 'Klikšķini virsotnes · 2× pabeigt'}
        </div>
      )}
      {merResultats && (
        <div style={{
          padding: '5px 10px', borderRadius: 7, fontSize: 11, fontWeight: 600,
          background: 'rgba(8,16,8,0.88)', border: '1px solid #e040fb',
          color: '#e040fb', backdropFilter: 'blur(6px)', boxShadow: '0 2px 8px rgba(0,0,0,0.45)',
          display: 'flex', alignItems: 'center', gap: 4,
        }}>
          <span style={{ flex: 1 }}>{merRezims === 'laukums' ? '📐' : '📏'} {merResultats}</span>
          <button
            onClick={() => { setMerRezims('nav'); setMerResultats(null) }}
            style={{ background: 'none', border: 'none', color: DS.textDim, fontSize: 13, cursor: 'pointer', padding: 0, lineHeight: 1 }}
            title="Notīrīt mērījumu"
          >🗑️</button>
        </div>
      )}

      {/* Lauka režīms */}
      <div style={{ height: 1, background: DS.greenBdr, margin: '2px 0' }} />
      <button
        onClick={laukaRezims ? izslēgtLaukaRezimu : ieslegtLaukaRezimu}
        title="Bloķē ekrānu pret nejaušiem pieskārieniem un tur ekrānu ieslēgtu"
        style={{
          padding: '6px 11px', borderRadius: 7, fontSize: 12, fontWeight: 600,
          border: `1px solid ${laukaRezims ? DS.green : DS.greenBdr}`,
          background: laukaRezims ? `${DS.green}33` : 'rgba(8,16,8,0.88)',
          color: laukaRezims ? DS.green : DS.textMut,
          cursor: 'pointer', textAlign: 'left',
          backdropFilter: 'blur(6px)',
          boxShadow: '0 2px 8px rgba(0,0,0,0.45)',
          fontFamily: F.family,
        }}
      >
        {laukaRezims ? '🔒 Aktīvs' : '🔒 Lauka režīms'}
      </button>
    </div>
  )

  // ── Ģeometrijas rediģēšanas UI ───────────────────────────────────────────────
  const GeomOverlays = () => (
    <>
      {/* Rediģēšanas panelis — redzams kamēr geomEditTarget aktīvs */}
      {geomEditTarget && (
        <div style={{
          position: 'absolute', top: 10, left: '50%', transform: 'translateX(-50%)',
          zIndex: 1500, background: 'rgba(8,0,20,0.96)',
          border: '1.5px solid #e040fb', borderRadius: 10,
          padding: '10px 14px', fontFamily: F.family,
          boxShadow: '0 4px 20px rgba(0,0,0,0.7)',
          display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap',
          maxWidth: 'calc(100% - 32px)',
        }}>
          <span style={{ fontSize: 12, color: '#e040fb', fontWeight: 700, marginRight: 2 }}>
            ✏️ {geomEditTarget.n.nr_text}
          </span>

          <button
            onClick={() => setGeomEditAddMode(true)}
            disabled={geomEditAddMode}
            style={{
              padding: '5px 10px', borderRadius: 7, fontSize: 12, fontWeight: 600,
              border: `1px solid ${geomEditAddMode ? '#e040fb' : '#e040fb66'}`,
              background: geomEditAddMode ? '#e040fb33' : 'rgba(224,64,251,0.12)',
              color: geomEditAddMode ? '#e040fb' : '#e040fbaa',
              cursor: geomEditAddMode ? 'default' : 'pointer', fontFamily: F.family,
            }}
          >➕ Virsotne</button>

          <button
            onClick={() => { setGeomEditDelMode(d => !d); setGeomEditAddMode(false) }}
            style={{
              padding: '5px 10px', borderRadius: 7, fontSize: 12, fontWeight: 600,
              border: `1px solid ${geomEditDelMode ? '#e040fb' : '#e040fb66'}`,
              background: geomEditDelMode ? '#e040fb33' : 'rgba(224,64,251,0.12)',
              color: geomEditDelMode ? '#e040fb' : '#e040fbaa',
              cursor: 'pointer', fontFamily: F.family,
            }}
          >🗑️ Dzēst</button>

          <button
            onClick={() => {
              const coords = geomEditCoordsRef.current
              if (coords?.length >= 3) downloadPolygonSHP(coords, geomEditTarget.n.nr_text)
            }}
            style={{
              padding: '5px 10px', borderRadius: 7, fontSize: 12, fontWeight: 600,
              border: '1px solid #e040fb66', background: 'rgba(224,64,251,0.12)',
              color: '#e040fbaa', cursor: 'pointer', fontFamily: F.family,
            }}
          >📥 SHP</button>

          {gpsPozicija && (
            <button
              onClick={() => setGeomEditGpsPoint(gpsPozicija)}
              style={{
                padding: '5px 10px', borderRadius: 7, fontSize: 12, fontWeight: 600,
                border: '1px solid #e040fb66', background: 'rgba(224,64,251,0.12)',
                color: '#e040fbaa', cursor: 'pointer', fontFamily: F.family,
              }}
            >📍 GPS virsotne</button>
          )}

          <button
            onClick={() => { setGeomManual({ idx: null, lat: '', lng: '', kluda: '' }); setGeomEditAddMode(false); setGeomEditDelMode(false) }}
            style={{
              padding: '5px 10px', borderRadius: 7, fontSize: 12, fontWeight: 600,
              border: `1px solid ${geomManual ? '#e040fb' : '#e040fb66'}`,
              background: geomManual ? '#e040fb33' : 'rgba(224,64,251,0.12)',
              color: geomManual ? '#e040fb' : '#e040fbaa',
              cursor: 'pointer', fontFamily: F.family,
            }}
          >⌨️ Koordinātas</button>

          <button
            onClick={saveGeomEdit}
            disabled={geomEditLade || atgriestLade}
            style={{
              padding: '5px 12px', borderRadius: 7, fontSize: 12, fontWeight: 700,
              border: '1px solid #e040fb', background: '#e040fb',
              color: '#fff', cursor: geomEditLade ? 'wait' : 'pointer', fontFamily: F.family,
              opacity: geomEditLade ? 0.7 : 1,
            }}
          >{geomEditLade ? '⏳' : '💾 Saglabāt'}</button>

          <button
            onClick={atgrieztSakotnejoGeom}
            disabled={geomEditLade || atgriestLade}
            title="Atgriezt uz sākotnējo stāvokli (ja tika saglabāts momentuzņēmums)"
            style={{
              padding: '5px 10px', borderRadius: 7, fontSize: 12, fontWeight: 600,
              border: '1px solid #e040fb66', background: 'rgba(224,64,251,0.12)',
              color: atgriestLade ? '#e040fb' : '#e040fbaa',
              cursor: atgriestLade ? 'wait' : 'pointer', fontFamily: F.family,
            }}
          >{atgriestLade ? '⏳' : '↺ Sākotnējais'}</button>

          <button
            onClick={() => { setGeomEditTarget(null); setGeomEditKluda(null); setGeomEditAddMode(false); setGeomEditDelMode(false); setGeomManual(null); setGeomSetVertex(null) }}
            style={{
              padding: '5px 10px', borderRadius: 7, fontSize: 12, fontWeight: 600,
              border: `1px solid ${DS.greenBdr}`, background: 'transparent',
              color: DS.textMut, cursor: 'pointer', fontFamily: F.family,
            }}
          >✕ Atcelt</button>

          {geomEditAddMode && (
            <div style={{ width: '100%', fontSize: 11, color: '#e040fb88', marginTop: 2 }}>
              Klikšķini kartē lai pievienotu virsotni
            </div>
          )}
          {geomEditDelMode && (
            <div style={{ width: '100%', fontSize: 11, color: '#e040fb88', marginTop: 2 }}>
              Klikšķini uz virsotnes (violetais punkts) lai to dzēstu
            </div>
          )}
          {!geomEditAddMode && !geomEditDelMode && !geomManual && (
            <div style={{ width: '100%', fontSize: 11, color: '#e040fb55', marginTop: 2 }}>
              Klikšķini uz virsotnes lai redzētu/labotu tās koordinātas
            </div>
          )}
          {geomManual && (() => {
            const lat = parseFloat(geomManual.lat)
            const lng = parseFloat(geomManual.lng)
            const validNums = !isNaN(lat) && !isNaN(lng)
            const outsideLatvia = validNums && (lat < 55.5 || lat > 58.5 || lng < 20.5 || lng > 28.5)
            const inpStyle = { flex: 1, padding: '6px 8px', borderRadius: 5, background: '#110011', border: '1px solid #e040fb55', color: '#fff', fontSize: 12, fontFamily: F.family, outline: 'none' }
            const apstradat = () => {
              if (!validNums) { setGeomManual(m => ({ ...m, kluda: 'Ievadi skaitļus decimālgrādos (piem. 56.9234, 25.1234)' })); return }
              if (geomManual.idx === null) {
                setGeomEditGpsPoint({ lat, lng })
              } else {
                setGeomSetVertex({ idx: geomManual.idx, lat, lng })
              }
              setGeomManual(null)
            }
            return (
              <div style={{ width: '100%', marginTop: 4, background: 'rgba(224,64,251,0.07)', borderRadius: 7, padding: '8px 10px', display: 'flex', flexDirection: 'column', gap: 5 }}>
                <div style={{ fontSize: 11, color: '#e040fb', fontWeight: 600 }}>
                  {geomManual.idx === null ? '➕ Jauna virsotne' : `✏️ Virsotne #${geomManual.idx + 1}`} — koordinātas
                </div>
                <div style={{ display: 'flex', gap: 5 }}>
                  <input placeholder="Platums (Lat) 56.xxxx" value={geomManual.lat}
                    onChange={e => setGeomManual(m => ({ ...m, lat: e.target.value, kluda: '' }))}
                    onKeyDown={e => e.key === 'Enter' && apstradat()}
                    style={inpStyle} />
                  <input placeholder="Garums (Lng) 25.xxxx" value={geomManual.lng}
                    onChange={e => setGeomManual(m => ({ ...m, lng: e.target.value, kluda: '' }))}
                    onKeyDown={e => e.key === 'Enter' && apstradat()}
                    style={inpStyle} />
                </div>
                {outsideLatvia && <div style={{ fontSize: 10, color: '#ffb74d' }}>⚠️ Koordinātas šķiet ārpus Latvijas — pārliecinies par pareizību</div>}
                {geomManual.kluda && <div style={{ fontSize: 10, color: DS.error }}>{geomManual.kluda}</div>}
                <div style={{ display: 'flex', gap: 5 }}>
                  <button onClick={apstradat} style={{ flex: 1, padding: '5px', borderRadius: 5, background: '#e040fb', border: 'none', color: '#fff', fontSize: 12, cursor: 'pointer', fontFamily: F.family, fontWeight: 700 }}>
                    {geomManual.idx === null ? 'Pievienot' : 'Atjaunot'}
                  </button>
                  <button onClick={() => setGeomManual(null)} style={{ padding: '5px 10px', borderRadius: 5, background: 'transparent', border: '1px solid #e040fb55', color: '#e040fbaa', fontSize: 12, cursor: 'pointer', fontFamily: F.family }}>✕</button>
                </div>
              </div>
            )
          })()}
          {geomEditKluda && (
            <div style={{ width: '100%', fontSize: 11, color: DS.error, marginTop: 2 }}>⚠️ {geomEditKluda}</div>
          )}
        </div>
      )}
    </>
  )

  const TileKludaIndikators = () => !tileKluda ? null : (
    <div style={{
      position: 'absolute', top: 10, left: '50%', transform: 'translateX(-50%)',
      zIndex: 401, background: 'rgba(30,20,0,0.92)',
      border: '1px solid #e65100', borderRadius: 8,
      padding: '6px 12px', fontSize: 11, color: '#ffb74d',
      backdropFilter: 'blur(6px)', boxShadow: '0 2px 10px rgba(0,0,0,0.5)',
      fontFamily: F.family, whiteSpace: 'nowrap', pointerEvents: 'none',
    }}>
      ⚠️ Kartes attēli neielādējas (vājš signāls) — robežas un dati redzami
    </div>
  )

  const GpsPoga = () => (
    <div style={{ position: 'absolute', top: 10, right: 10, zIndex: 400, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
      <button
        onClick={() => { setGpsAktivs(a => !a); setGpsKluda(null) }}
        title={gpsAktivs ? 'Izslēgt GPS' : 'Ieslēgt GPS atrašanās vietu'}
        style={{
          width: 38, height: 38, borderRadius: 8,
          border: `1px solid ${gpsKluda ? '#f44336' : gpsAktivs ? DS.green : DS.greenBdr}`,
          background: gpsKluda ? 'rgba(30,0,0,0.9)' : gpsAktivs ? `${DS.green}cc` : 'rgba(8,16,8,0.88)',
          color: gpsKluda ? '#f44336' : gpsAktivs ? '#fff' : DS.textMut,
          fontSize: 18, cursor: 'pointer',
          backdropFilter: 'blur(6px)',
          boxShadow: '0 2px 8px rgba(0,0,0,0.45)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
      >
        📍
      </button>
      {gpsKluda && (
        <div style={{
          background: 'rgba(30,0,0,0.92)', border: '1px solid #f44336',
          borderRadius: 7, padding: '5px 9px', fontSize: 10, color: '#f44336',
          maxWidth: 180, lineHeight: 1.4, backdropFilter: 'blur(6px)',
          boxShadow: '0 2px 8px rgba(0,0,0,0.45)', fontFamily: F.family,
        }}>
          ⚠️ {gpsKluda}
        </div>
      )}
    </div>
  )

  // ── Desktop layout ────────────────────────────────────────────────────────────
  if (!isMobile) return (
    <div style={{ height: '100vh', background: DS.bg, color: DS.text, fontFamily: F.family, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <style>{spinnerCSS}</style>
      <LaukaRezimOverlay />

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
          <SarakstaPane
            kadInput={kadInput} kopPlatiba={kopPlatiba} kopā={kopā} aizpilditi={aizpilditi}
            lvmKluda={lvmKluda} nogabali={nogabali} nogKluda={nogKluda} nogLade={nogLade}
            ieladetNogabalus={ieladetNogabalus} atvertModalu={atvertModalu} setHoverIdx={setHoverIdx}
            mapModal={mapModal} maNogabali={maNogabali} visiGatavi={visiGatavi}
            pdfLade={pdfLade} onPdfKliks={() => setPdfModalOpen(true)}
            onSnapshot={saglabatMomentuznemumu} snapshotSaglabats={snapshotSaglabats} snapshotLade={snapshotLade}
          />
        </div>

        {/* Karte */}
        <div style={{ flex: 1, position: 'relative', background: '#1a2e1a' }}>
          <div ref={mapDivRef} style={{ position: 'absolute', inset: 0 }} />
          <MAPKarte
            kadGeom={kadGeom} nogabali={nogabali} onNogabalsKliks={atvertModalu} mapRef={mapDivRef}
            planAttels={planAttels} overlayOpacity={overlayOpacity} overlayRedigets={overlayRedigets} hoverIdx={hoverIdx}
            mapSlānis={mapSlānis} onTileKluda={setTileKluda}
            gpsAktivs={gpsAktivs} onGpsKluda={setGpsKluda}
            onGpsPozicija={setGpsPozicija} marsruts={marsruts} kadastrs={kadInput.replace(/\s/g, '')}
            merRezims={merRezims} onMerUpdate={setMerResultats} laukaRezims={laukaRezims}
            geomEditTarget={geomEditTarget} geomEditAddMode={geomEditAddMode}
            geomEditDelMode={geomEditDelMode} geomEditGpsPoint={geomEditGpsPoint}
            onGeomEditCoords={coords => { geomEditCoordsRef.current = coords }}
            onGeomAddModeDone={() => setGeomEditAddMode(false)}
            onGeomDelModeDone={() => setGeomEditDelMode(false)}
            onGeomGpsVertexDone={() => setGeomEditGpsPoint(null)}
            geomSetVertex={geomSetVertex}
            onGeomVertexSelect={(idx, lat, lng) => setGeomManual({ idx, lat: lat.toFixed(7), lng: lng.toFixed(7), kluda: '' })}
            onGeomSetVertexDone={() => setGeomSetVertex(null)}
          />
          <TileSlāņiPanel />
          <TileKludaIndikators />
          <GpsPoga />
          <GeomOverlays />
          <OverlayPanel />
        </div>
      </div>

      {/* Nogabala rediģēšanas modālis */}
      {mapModal && (
        <MapNogabalsModal
          nogabals={mapModal.nogabals}
          onSave={saglabatNogabalu}
          onClose={() => setMapModal(null)}
          onGeomEdit={() => {
            const { nogabals: n, index: idx } = mapModal
            setMapModal(null)
            setGeomEditTarget({ n, idx })
          }}
        />
      )}

      {/* PDF titullapas modālis */}
      {pdfModalOpen && (
        <div
          onClick={() => setPdfModalOpen(false)}
          style={{
            position: 'fixed', inset: 0, zIndex: 2000,
            background: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: 20, fontFamily: F.family,
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: DS.bgCard, border: `1px solid ${DS.greenBdr}`,
              borderRadius: 16, padding: 24, width: '100%', maxWidth: 440,
              color: DS.text, boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
            }}
          >
            <div style={{ fontSize: 16, fontWeight: 700, color: DS.green, marginBottom: 16 }}>
              📄 Titullapas dati
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
              {[
                { lauks: 'nosaukums', label: 'Īpašuma nosaukums', placeholder: 'Piemērs: Priedes' },
                { lauks: 'novads',    label: 'Novads',             placeholder: 'Piemērs: Saulkrastu novads' },
                { lauks: 'pagasts',   label: 'Pagasts',            placeholder: 'Piemērs: Zvejniekciema pagasts' },
              ].map(({ lauks, label, placeholder }) => (
                <div key={lauks}>
                  <div style={{ fontSize: 11, color: DS.textMut, marginBottom: 4, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    {label}
                  </div>
                  <input
                    value={titullapa[lauks]}
                    onChange={e => setTitullapa(prev => ({ ...prev, [lauks]: e.target.value }))}
                    placeholder={placeholder}
                    style={{
                      padding: '10px 14px', borderRadius: 8, background: DS.bgDeep,
                      border: `1px solid ${DS.greenBdr}`, color: DS.text, fontSize: 14,
                      outline: 'none', width: '100%', boxSizing: 'border-box', fontFamily: F.family,
                    }}
                  />
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={() => setPdfModalOpen(false)}
                style={{
                  flex: 1, padding: '12px', borderRadius: 10, fontSize: 14, fontWeight: 600,
                  background: 'none', border: `1px solid ${DS.greenBdr}`,
                  color: DS.textMut, cursor: 'pointer', fontFamily: F.family,
                }}
              >
                Atcelt
              </button>
              <button
                onClick={() => { setPdfModalOpen(false); genPdf() }}
                disabled={pdfLade}
                style={{
                  flex: 2, padding: '12px', borderRadius: 10, fontSize: 14, fontWeight: 700,
                  background: `linear-gradient(135deg,${DS.green},${DS.greenDk})`,
                  color: '#fff', border: 'none', cursor: pdfLade ? 'wait' : 'pointer',
                  opacity: pdfLade ? 0.8 : 1, fontFamily: F.family,
                }}
              >
                {pdfLade ? '⏳ Gatavo PDF...' : '📄 Ģenerēt PDF'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )

  // ── Mobilais layout ───────────────────────────────────────────────────────────
  const DRAWER_OPEN = Math.round(window.innerHeight * 0.55)

  return (
    <div style={{ minHeight: '100vh', background: DS.bg, color: DS.text, fontFamily: F.family, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <LaukaRezimOverlay />
      <PdfMaksasGate info={pdfMaksa} onClose={() => setPdfMaksa(null)} onReg={onReg} />
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
          mapSlānis={mapSlānis} onTileKluda={setTileKluda}
          gpsAktivs={gpsAktivs} onGpsKluda={setGpsKluda}
          onGpsPozicija={setGpsPozicija} marsruts={marsruts} kadastrs={kadInput.replace(/\s/g, '')}
          merRezims={merRezims} onMerUpdate={setMerResultats} laukaRezims={laukaRezims}
          geomEditTarget={geomEditTarget} geomEditAddMode={geomEditAddMode}
          geomEditDelMode={geomEditDelMode} geomEditGpsPoint={geomEditGpsPoint}
          onGeomEditCoords={coords => { geomEditCoordsRef.current = coords }}
          onGeomAddModeDone={() => setGeomEditAddMode(false)}
          onGeomDelModeDone={() => setGeomEditDelMode(false)}
          onGeomGpsVertexDone={() => setGeomEditGpsPoint(null)}
          geomSetVertex={geomSetVertex}
          onGeomVertexSelect={(idx, lat, lng) => setGeomManual({ idx, lat: lat.toFixed(7), lng: lng.toFixed(7), kluda: '' })}
          onGeomSetVertexDone={() => setGeomSetVertex(null)}
        />
        <TileSlāņiPanel />
        <TileKludaIndikators />
        <GpsPoga />
        <GeomOverlays />
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
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            padding: '10px 0 6px', flexShrink: 0,
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5,
            touchAction: 'none', minHeight: 44, width: '100%',
          }}
        >
          <div style={{
            width: 40, height: 4, borderRadius: 2,
            background: drawerOpen ? DS.greenBdr : DS.green,
            transition: 'background 0.2s',
          }} />
          <div style={{
            fontSize: drawerOpen ? 11 : 14,
            color: drawerOpen ? DS.textMut : DS.green,
            fontFamily: F.family,
            fontWeight: drawerOpen ? 400 : 700,
            transition: 'all 0.2s',
          }}>
            {drawerOpen
              ? '▾ Aizvērt sarakstu'
              : `▴ Nogabalu saraksts (${aizpilditi}/${kopā})`}
          </div>
        </button>

        {/* Saraksts */}
        {drawerOpen && (
          <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <SarakstaPane
              kadInput={kadInput} kopPlatiba={kopPlatiba} kopā={kopā} aizpilditi={aizpilditi}
              lvmKluda={lvmKluda} nogabali={nogabali} nogKluda={nogKluda} nogLade={nogLade}
              ieladetNogabalus={ieladetNogabalus} atvertModalu={atvertModalu} setHoverIdx={setHoverIdx}
              mapModal={mapModal} maNogabali={maNogabali} visiGatavi={visiGatavi}
              pdfLade={pdfLade} onPdfKliks={() => setPdfModalOpen(true)}
              onSnapshot={saglabatMomentuznemumu} snapshotSaglabats={snapshotSaglabats} snapshotLade={snapshotLade}
            />
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

      {/* Nogabala rediģēšanas modālis */}
      {mapModal && (
        <MapNogabalsModal
          nogabals={mapModal.nogabals}
          onSave={saglabatNogabalu}
          onClose={() => setMapModal(null)}
          onGeomEdit={() => {
            const { nogabals: n, index: idx } = mapModal
            setMapModal(null)
            setGeomEditTarget({ n, idx })
          }}
        />
      )}

      {/* PDF titullapas modālis */}
      {pdfModalOpen && (
        <div
          onClick={() => setPdfModalOpen(false)}
          style={{
            position: 'fixed', inset: 0, zIndex: 2000,
            background: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: 20, fontFamily: F.family,
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: DS.bgCard, border: `1px solid ${DS.greenBdr}`,
              borderRadius: 16, padding: 24, width: '100%', maxWidth: 440,
              color: DS.text, boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
            }}
          >
            <div style={{ fontSize: 16, fontWeight: 700, color: DS.green, marginBottom: 16 }}>
              📄 Titullapas dati
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
              {[
                { lauks: 'nosaukums', label: 'Īpašuma nosaukums', placeholder: 'Piemērs: Priedes' },
                { lauks: 'novads',    label: 'Novads',             placeholder: 'Piemērs: Saulkrastu novads' },
                { lauks: 'pagasts',   label: 'Pagasts',            placeholder: 'Piemērs: Zvejniekciema pagasts' },
              ].map(({ lauks, label, placeholder }) => (
                <div key={lauks}>
                  <div style={{ fontSize: 11, color: DS.textMut, marginBottom: 4, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    {label}
                  </div>
                  <input
                    value={titullapa[lauks]}
                    onChange={e => setTitullapa(prev => ({ ...prev, [lauks]: e.target.value }))}
                    placeholder={placeholder}
                    style={{
                      padding: '10px 14px', borderRadius: 8, background: DS.bgDeep,
                      border: `1px solid ${DS.greenBdr}`, color: DS.text, fontSize: 14,
                      outline: 'none', width: '100%', boxSizing: 'border-box', fontFamily: F.family,
                    }}
                  />
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={() => setPdfModalOpen(false)}
                style={{
                  flex: 1, padding: '12px', borderRadius: 10, fontSize: 14, fontWeight: 600,
                  background: 'none', border: `1px solid ${DS.greenBdr}`,
                  color: DS.textMut, cursor: 'pointer', fontFamily: F.family,
                }}
              >
                Atcelt
              </button>
              <button
                onClick={() => { setPdfModalOpen(false); genPdf() }}
                disabled={pdfLade}
                style={{
                  flex: 2, padding: '12px', borderRadius: 10, fontSize: 14, fontWeight: 700,
                  background: `linear-gradient(135deg,${DS.green},${DS.greenDk})`,
                  color: '#fff', border: 'none', cursor: pdfLade ? 'wait' : 'pointer',
                  opacity: pdfLade ? 0.8 : 1, fontFamily: F.family,
                }}
              >
                {pdfLade ? '⏳ Gatavo PDF...' : '📄 Ģenerēt PDF'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
