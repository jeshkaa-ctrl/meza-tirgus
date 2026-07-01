import React, { useState, useEffect } from "react"
import { PIEGADES_VIETAS, SORT_NOSAUKUMI } from "./data/piegadesVietas"
import { getTransportsCena, aprekinattalumu } from "./data/transportaTarifi"
import { getKrautuveKoordinates } from "./data/pagastiKoordinates"
import { supabase } from "./supabaseClient"
import { C as DS, F, spinnerCSS } from "./ds"

const CENU_KOLS = {
  balki_P: 'cena_balki_p', balki_E: 'cena_balki_e', balki_M: 'cena_balki_m',
  sikbalki: 'cena_sikbalki', finieris: 'cena_finieris', zagbalki: 'cena_zagbalki',
  tara: 'cena_tara', papirmalka: 'cena_papirmalka', malka: 'cena_malka', skelda: 'cena_skelda',
}

// ─── STILI ───────────────────────────────────────────────────────────────────
const s = {
  app: { minHeight: "100vh", background: DS.bg, color: DS.text, fontFamily: F.family },
  hdr: { background: DS.glass, borderBottom: `1px solid ${DS.greenBdr}`, backdropFilter: "blur(8px)", padding: "0 12px", height: 52, display: "flex", alignItems: "center", gap: 8, position: "sticky", top: 0, zIndex: 10, overflowX: "auto" },
  hdrTitle: { margin: 0, color: DS.green, fontSize: F.md, fontWeight: F.weightBold },
  backBtn: { background: "transparent", border: "none", color: DS.green, padding: "0 4px", borderRadius: 6, cursor: "pointer", fontSize: 22, minWidth: 36, minHeight: 44 },
  body: { padding: "16px", maxWidth: 1100, margin: "0 auto" },
  card: { background: "#0d1f0d", border: "1px solid #1e3a1e", borderRadius: 10, padding: 16, marginBottom: 14 },
  cardTitle: { color: "#4caf50", fontWeight: 700, fontSize: 13, marginBottom: 12, display: "flex", alignItems: "center", gap: 6 },
  label: { fontSize: 11, color: "#81c784", fontWeight: 600, marginBottom: 3, display: "block", textTransform: "uppercase", letterSpacing: "0.08em" },
  input: { background: "#070d07", border: "1px solid #2d5a2d", borderRadius: 6, color: "#e0ede0", padding: "10px 10px", fontSize: 16, outline: "none", width: "100%", boxSizing: "border-box", minHeight: 44 },
  btn: { background: "linear-gradient(135deg,#2e7d32,#1b5e20)", color: "white", border: "none", borderRadius: 8, padding: "12px 28px", fontSize: 14, fontWeight: 700, cursor: "pointer" },
  btnSm: { background: "#1e3a1e", color: "#4caf50", border: "1px solid #2d5a2d", borderRadius: 6, padding: "6px 14px", fontSize: 12, cursor: "pointer" },
  btnDanger: { background: "#1a0000", color: "#ef5350", border: "1px solid #c62828", borderRadius: 6, padding: "6px 14px", fontSize: 12, cursor: "pointer" },
  grid2: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12 },
  grid3: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 10 },
  green: { color: "#4caf50", fontWeight: 700 },
  red: { color: "#ef5350", fontWeight: 700 },
  orange: { color: "#e65100", fontWeight: 700 },
  tag: (c) => ({ display: "inline-block", background: c + "22", color: c, border: `1px solid ${c}44`, borderRadius: 4, padding: "1px 7px", fontSize: 10, fontWeight: 700 }),
}

// ─── SORTIMENTU SARAKSTS ──────────────────────────────────────────────────────
const SORT_KRASA = {
  balki_P: "#2e7d32", balki_E: "#1565c0", balki_M: "#4a148c",
  sikbalki: "#0d47a1", finieris: "#e65100", zagbalki: "#6a1b9a",
  tara: "#1565c0", papirmalka: "#6a1b9a", malka: "#c62828", skelda: "#795548"
}

// ─── GALVENAIS KOMPONENTS ─────────────────────────────────────────────────────
export default function LogistikaKalkulators({ onBack, sortimenti = null, kadastra = "" }) {

  // Krautuves dati
  const [kadastrs, setKadastrs] = useState(kadastra || "")
  const [krautuveNos, setKrautuveNos] = useState("")
  const [krautuveLat, setKrautuveLat] = useState("")
  const [krautuveLng, setKrautuveLng] = useState("")
  const [manualMode, setManualMode] = useState(false)

  // Sortimentu apjomi
  const [apjomi, setApjomi] = useState(() => {
    if (sortimenti) return sortimenti
    return {
      balki_P: 0, balki_E: 0, balki_M: 0, sikbalki: 0,
      finieris: 0, zagbalki: 0, tara: 0, papirmalka: 0, malka: 0, skelda: 0
    }
  })

  // Izstrādes izmaksas
  const [izstrade, setIzstrade] = useState(18)
  const [kravasIetilpibas, setKravasIetilpibas] = useState({
    balki_P: 30, balki_E: 30, balki_M: 30,
    sikbalki: 32, finieris: 25, zagbalki: 28,
    tara: 35, papirmalka: 35, malka: 28, skelda: 42,
  })

  // Dinamiskās pircēju vietas no Supabase
  const [dinamiskasVietas, setDinamiskasVietas] = useState([])
  const [visasVietas,      setVisasVietas]      = useState(PIEGADES_VIETAS)
  const [cenasLade,        setCenasLade]        = useState(true)

  // Piegādes vietu cenas — sākotnēji tukšas, aizpilda no Supabase
  const [cenas, setCenas] = useState(() => {
    const c = {}
    PIEGADES_VIETAS.forEach(v => {
      c[v.id] = {}
      v.pienem.forEach(s => { c[v.id][s] = "" })
    })
    return c
  })

  // Ielādē datus no Dastojuma kalkulatora (ja nāk caur pogu "Aprēķināt transportu")
  useEffect(() => {
    const saglabati = sessionStorage.getItem("dastojuma_sortimenti")
    if (saglabati) {
      try {
        const { apjomi: a, kadastrs: k } = JSON.parse(saglabati)
        if (a) setApjomi(a)
        if (k) setKadastrs(k)
      } catch {}
      sessionStorage.removeItem("dastojuma_sortimenti")
    }
  }, [])

  // Ielādē pircēju cenas no Supabase
  useEffect(() => {
    setCenasLade(true)
    supabase
      .from('pirceja_vietas')
      .select('*')
      .eq('aktiva', true)
      .then(({ data }) => {
        if (data?.length) {
          setDinamiskasVietas(data)

          const jaunasVietas = data.map(v => ({
            id:         `sb_${v.id}`,
            nosaukums:  v.nosaukums,
            lat:        v.lat,
            lng:        v.lng,
            novads:     v.novads,
            talrunis:   v.talrunis,
            epasts:     v.epasts,
            apraksts:   v.apraksts,
            pienem:     v.pienem || [],
            noSupabase: true,
          }))

          setVisasVietas([...jaunasVietas, ...PIEGADES_VIETAS])

          setCenas(prev => {
            const c = { ...prev }
            data.forEach(v => {
              const vid = `sb_${v.id}`
              c[vid] = {}
              ;(v.pienem || []).forEach(s => {
                const kol = CENU_KOLS[s]
                c[vid][s] = kol && v[kol] ? String(v[kol]) : ""
              })
            })
            return c
          })
        }
        setCenasLade(false)
      })
      .catch(() => setCenasLade(false))
  }, [])

  // Rezultāti
  const [rezultati, setRezultati] = useState(null)
  const [solis, setSolis] = useState(1) // 1=krautuve, 2=sortimenti, 3=cenas, 4=rezultāts

  // Aktīvais sortiments cenu ievadei
  const [aktivaisSortiments, setAktivaisSortiments] = useState("balki_P")

  // ── Kadastra → koordinātes ────────────────────────────────────────────────
  useEffect(() => {
    if (kadastrs.length >= 4) {
      const kord = getKrautuveKoordinates(kadastrs)
      if (kord) {
        setKrautuveLat(kord.lat.toString())
        setKrautuveLng(kord.lng.toString())
        setKrautuveNos(kord.nosaukums)
        setManualMode(false)
      } else {
        setKrautuveNos("")
        setManualMode(true)
      }
    }
  }, [kadastrs])

  // ── Cenas ievade ─────────────────────────────────────────────────────────
  const setCena = (vietaId, sortiments, val) => {
    setCenas(prev => ({
      ...prev,
      [vietaId]: { ...prev[vietaId], [sortiments]: val }
    }))
  }

  // ── Galvenais aprēķins ────────────────────────────────────────────────────
  const aprēķināt = () => {
    const lat = parseFloat(krautuveLat)
    const lng = parseFloat(krautuveLng)
    if (!lat || !lng) return

    // Aprēķina katram sortimentam optimālo piegādes vietu
    const sortRez = {}

    Object.entries(apjomi).forEach(([sort, m3]) => {
      if (!m3 || m3 <= 0) return

      const opcijas = []

      visasVietas.forEach(vieta => {
        if (!vieta.pienem.includes(sort)) return

        const km = aprekinattalumu(lat, lng, vieta.lat, vieta.lng)
        const transportsCena = getTransportsCena(km)
        const iepirkumsCena = parseFloat(cenas[vieta.id]?.[sort]) || 0
        const neto = iepirkumsCena - transportsCena

        const iet = parseFloat(kravasIetilpibas[sort]) || 30
        const braucieni = Math.ceil(m3 / iet)
        const atlikums = Math.round((m3 % iet) * 100) / 100

        opcijas.push({
          vieta,
          km,
          transportsCena: Math.round(transportsCena * 100) / 100,
          iepirkumsCena,
          neto: Math.round(neto * 100) / 100,
          netoKopa: Math.round(neto * m3 * 100) / 100,
          braucieni,
          atlikums,
          m3,
        })
      })

      // Kārto pēc neto (augošā) — labākā ir pēdējā
      opcijas.sort((a, b) => {
        if (a.iepirkumsCena === 0 && b.iepirkumsCena > 0) return 1
        if (b.iepirkumsCena === 0 && a.iepirkumsCena > 0) return -1
        return b.neto - a.neto
      })

      sortRez[sort] = opcijas
    })

    // Pārbauda atlikumus — vai piegādes vieta pieņem arī citus sortimentus
    const atlikumuAnalīze = []
    Object.entries(sortRez).forEach(([sort, opcijas]) => {
      if (opcijas.length === 0) return
      const labakais = opcijas[0]
      if (labakais.atlikums > 0 && labakais.atlikums < (parseFloat(kravasIetilpibas[sort]) || 30)) {
        // Meklē citus sortimentus kas varētu iet uz to pašu vietu
        const papildSortimenti = Object.entries(apjomi)
          .filter(([s, m]) => s !== sort && m > 0)
          .filter(([s]) => labakais.vieta.pienem.includes(s))
          .map(([s]) => SORT_NOSAUKUMI[s])

        if (papildSortimenti.length > 0) {
          atlikumuAnalīze.push({
            sortiments: sort,
            vieta: labakais.vieta.nosaukums,
            atlikums: labakais.atlikums,
            papild: papildSortimenti,
          })
        }
      }
    })

    // Kopējais NETO
    let kopNeto = 0
    let kopTransports = 0
    let kopBraucieni = 0
    Object.entries(sortRez).forEach(([sort, opcijas]) => {
      if (opcijas.length > 0 && opcijas[0].iepirkumsCena > 0) {
        kopNeto += opcijas[0].netoKopa
        kopTransports += opcijas[0].transportsCena * opcijas[0].m3
        kopBraucieni += opcijas[0].braucieni
      }
    })

    // Izstrādes izmaksas
    const kopaM3 = Object.values(apjomi).reduce((s, v) => s + (v || 0), 0)
    const izstradesIzm = kopaM3 * izstrade
    const galaRez = kopNeto - izstradesIzm

    setRezultati({ sortRez, atlikumuAnalīze, kopNeto, kopTransports, kopBraucieni, kopaM3, izstradesIzm, galaRez })
    setSolis(4)
  }

  // ── Aktīvo sortimentu saraksts (kam ir apjoms) ────────────────────────────
  const aktivieSortimenti = Object.entries(apjomi).filter(([, m]) => m > 0).map(([s]) => s)

  // ── Piegādes vietas kas pieņem aktīvo sortimentu ──────────────────────────
  const vietasPienemSort = visasVietas.filter(v => v.pienem.includes(aktivaisSortiments))

  // ─── RENDER ───────────────────────────────────────────────────────────────

  const Hdr = () => (
    <div style={s.hdr}>
      <button style={s.backBtn} onClick={onBack}>← Atpakaļ</button>
      <h1 style={s.hdrTitle}>🚛 Loģistikas kalkulators</h1>
      <div style={{ marginLeft: "auto", display: "flex", gap: 6 }}>
        {["Krautuve", "Sortimenti", "Cenas", "Rezultāts"].map((lb, i) => (
          <span key={i} onClick={() => solis > i && setSolis(i + 1)}
            style={{
              padding: "4px 10px", borderRadius: 20, fontSize: 11, cursor: solis > i ? "pointer" : "default",
              background: i + 1 === solis ? "#2e7d32" : i + 1 < solis ? "#1e3a1e" : "#0d1f0d",
              color: i + 1 === solis ? "white" : "#4caf50",
              border: `1px solid ${i + 1 === solis ? "#4caf50" : "#2d5a2d"}`
            }}>
            {i + 1 < solis ? "✓ " : ""}{lb}
          </span>
        ))}
      </div>
    </div>
  )

  // ── SOLIS 1 — Krautuve ────────────────────────────────────────────────────
  if (solis === 1) return (
    <div style={s.app}>
      <Hdr />
      <div style={s.body}>
        <div style={s.card}>
          <div style={s.cardTitle}>📍 Krautuves atrašanās vieta</div>
          <div style={s.grid2}>
            <div>
              <label style={s.label}>Kadastra numurs</label>
              <input style={s.input} value={kadastrs}
                onChange={e => setKadastrs(e.target.value)}
                placeholder="piemēram: 9682 002 0105" />
              {krautuveNos && (
                <div style={{ marginTop: 6, fontSize: 12, color: "#4caf50" }}>
                  ✓ Atrasts: <strong>{krautuveNos}</strong> ({krautuveLat}, {krautuveLng})
                </div>
              )}
              {kadastrs.length >= 4 && !krautuveNos && (
                <div style={{ marginTop: 6, fontSize: 12, color: "#e65100" }}>
                  ⚠ Pagasts nav atrasts — ievadi koordinātes manuāli
                </div>
              )}
            </div>
            <div>
              <label style={s.label}>Vai ievadi koordinātes manuāli</label>
              <div style={{ display: "flex", gap: 8 }}>
                <input style={{ ...s.input, width: "50%" }} value={krautuveLat}
                  onChange={e => { setKrautuveLat(e.target.value); setManualMode(true) }}
                  placeholder="Lat: 57.52" />
                <input style={{ ...s.input, width: "50%" }} value={krautuveLng}
                  onChange={e => { setKrautuveLng(e.target.value); setManualMode(true) }}
                  placeholder="Lng: 25.18" />
              </div>
            </div>
          </div>
        </div>

        <div style={s.card}>
          <div style={s.cardTitle}>⚙ Parametri</div>
          <div>
            <label style={s.label}>Izstrādes izmaksas (€/m³)</label>
            <input type="number" style={s.input} value={izstrade}
              onChange={e => setIzstrade(parseFloat(e.target.value) || 0)} />
          </div>
        </div>

        <button style={{
          ...s.btn,
          opacity: (!krautuveLat || !krautuveLng) ? 0.4 : 1,
          cursor: (!krautuveLat || !krautuveLng) ? "not-allowed" : "pointer",
        }} onClick={() => setSolis(2)}
          disabled={!krautuveLat || !krautuveLng}>
          Tālāk → Sortimenti ›
        </button>
      </div>
    </div>
  )

  // ── SOLIS 2 — Sortimenti ──────────────────────────────────────────────────
  if (solis === 2) return (
    <div style={s.app}>
      <Hdr />
      <div style={s.body}>
        <div style={s.card}>
          <div style={s.cardTitle}>📦 Sortimentu apjomi un kravas ietilpība</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12 }}>
            {Object.keys(SORT_NOSAUKUMI).map(sort => (
              <div key={sort} style={{ background: "#070d07", border: `1px solid ${SORT_KRASA[sort] || "#2d5a2d"}22`, borderRadius: 8, padding: "10px 12px" }}>
                <label style={{ ...s.label, color: SORT_KRASA[sort] || "#81c784", marginBottom: 6 }}>
                  {SORT_NOSAUKUMI[sort]}
                </label>
                <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 9, color: "#558b2f", marginBottom: 2 }}>APJOMS m³</div>
                    <input type="text" inputMode="decimal" style={{ ...s.input, padding: "7px 8px", fontSize: 14 }}
                      value={apjomi[sort] === 0 ? "" : (apjomi[sort] ?? "")}
                      onChange={e => {
                        const v = e.target.value.replace(",", ".")
                        setApjomi(prev => ({ ...prev, [sort]: v === "" ? 0 : (parseFloat(v) || prev[sort]) }))
                      }}
                      onBlur={e => {
                        const v = parseFloat(e.target.value.replace(",", "."))
                        if (!isNaN(v)) setApjomi(prev => ({ ...prev, [sort]: v }))
                      }}
                      placeholder="0" />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 9, color: "#558b2f", marginBottom: 2 }}>KRAVA m³</div>
                    <input type="text" inputMode="numeric" style={{ ...s.input, padding: "7px 8px", fontSize: 14 }}
                      value={kravasIetilpibas[sort] ?? ""}
                      onChange={e => {
                        const v = e.target.value.replace(/[^0-9.]/g, "")
                        setKravasIetilpibas(prev => ({ ...prev, [sort]: v }))
                      }}
                      onBlur={e => {
                        const v = parseFloat(e.target.value)
                        setKravasIetilpibas(prev => ({ ...prev, [sort]: isNaN(v) ? 30 : v }))
                      }}
                      placeholder="30" />
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 12, fontSize: 12, color: "#81c784" }}>
            Kopā: <strong style={s.green}>
              {Object.values(apjomi).reduce((s, v) => s + (v || 0), 0).toFixed(1)} m³
            </strong>
          </div>
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          <button style={s.btn} onClick={() => setSolis(3)}>Tālāk → Cenas ›</button>
          <button style={s.btnSm} onClick={() => setSolis(1)}>← Krautuve</button>
        </div>
      </div>
    </div>
  )

  // ── SOLIS 3 — Cenas ───────────────────────────────────────────────────────
  if (solis === 3) return (
    <div style={s.app}>
      <Hdr />
      <div style={s.body}>
        <div style={s.card}>
          <div style={s.cardTitle}>💶 Iepirkuma cenas pa piegādes vietām</div>
          <div style={{ fontSize: 11, color: "#81c784", marginBottom: 12 }}>
            Ievadi tikai tās cenas ko zini. Piegādes vietas bez cenām netiks iekļautas aprēķinā.
          </div>

          {/* Sortimentu tabs */}
          <div style={{ display: "flex", gap: 6, marginBottom: 16, flexWrap: "wrap" }}>
            {aktivieSortimenti.map(sort => (
              <button key={sort} onClick={() => setAktivaisSortiments(sort)}
                style={{
                  padding: "5px 12px", borderRadius: 20, fontSize: 11, cursor: "pointer", border: "none",
                  background: aktivaisSortiments === sort ? (SORT_KRASA[sort] || "#2e7d32") : "#1e3a1e",
                  color: "white", fontWeight: aktivaisSortiments === sort ? 700 : 400,
                }}>
                {SORT_NOSAUKUMI[sort]} ({apjomi[sort]} m³)
              </button>
            ))}
          </div>

          {/* Ielādēšanas indikators */}
          {cenasLade && (
            <div style={{ fontSize: 12, color: "#4caf50", marginBottom: 10 }}>
              ⏳ Ielādē reģistrēto pircēju aktuālās cenas...
            </div>
          )}

          {/* Pircēju vietas ar Supabase cenām — AUGŠĀ */}
          {(() => {
            const pircejuVietas = vietasPienemSort.filter(v => v.noSupabase)
            const statiski = vietasPienemSort.filter(v => !v.noSupabase)
            const lat = parseFloat(krautuveLat), lng = parseFloat(krautuveLng)

            const VietasKarte = ({ vieta, isPircejs }) => {
              const km = lat && lng ? aprekinattalumu(lat, lng, vieta.lat, vieta.lng) : "?"
              const trans = typeof km === "number" ? getTransportsCena(km).toFixed(2) : "?"
              const cena = parseFloat(cenas[vieta.id]?.[aktivaisSortiments]) || 0
              const neto = cena > 0 ? (cena - parseFloat(trans)).toFixed(2) : null
              return (
                <div key={vieta.id} style={{
                  background: isPircejs ? "#0a1a0a" : "#070d07",
                  border: `1px solid ${isPircejs ? "#2e7d32" : cena > 0 ? "#2d5a2d" : "#1a1a1a"}`,
                  borderRadius: 8, padding: 10,
                }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: isPircejs ? "#4caf50" : "#a5d6a7", marginBottom: 2, display: "flex", alignItems: "center", gap: 4, flexWrap: "wrap" }}>
                    {vieta.nosaukums}
                    {isPircejs && <span style={{ ...s.tag("#4caf50") }}>✓ Dzīva cena</span>}
                    {vieta.lat > 57.5 && <span style={{ ...s.tag("#e65100") }}>EE</span>}
                    {vieta.novads && <span style={{ fontSize: 9, color: "#4a7a4a" }}>📍 {vieta.novads}</span>}
                  </div>
                  <div style={{ fontSize: 10, color: "#558b2f", marginBottom: 6 }}>
                    ~{km} km | Trans: {trans} €/m³
                  </div>
                  <input type="text" inputMode="decimal"
                    style={{ ...s.input, fontSize: 13, padding: "5px 8px", borderColor: isPircejs && cena > 0 ? "#2e7d32" : undefined }}
                    value={cenas[vieta.id]?.[aktivaisSortiments] || ""}
                    onChange={e => setCena(vieta.id, aktivaisSortiments, e.target.value.replace(",", "."))}
                    placeholder="€/m³" />
                  {neto && (
                    <div style={{ marginTop: 4, fontSize: 11, color: parseFloat(neto) > 0 ? "#4caf50" : "#ef5350", fontWeight: 700 }}>
                      Neto: {neto} €/m³
                    </div>
                  )}
                  {isPircejs && vieta.talrunis && (
                    <div style={{ marginTop: 4, fontSize: 10, color: "#4a7a4a" }}>📞 {vieta.talrunis}</div>
                  )}
                </div>
              )
            }

            return (
              <>
                {pircejuVietas.length > 0 && (
                  <>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "#4caf50", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                      ✓ Reģistrētie pircēji — aktuālās cenas
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 8, marginBottom: 16 }}>
                      {pircejuVietas.map(v => <VietasKarte key={v.id} vieta={v} isPircejs />)}
                    </div>
                    <div style={{ fontSize: 11, color: "#4a7a4a", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                      Pārējie uzņēmumi — ievadi manuāli
                    </div>
                  </>
                )}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 8 }}>
                  {statiski.map(v => <VietasKarte key={v.id} vieta={v} isPircejs={false} />)}
                </div>
              </>
            )
          })()}
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          <button style={s.btn} onClick={aprēķināt}>🔢 Aprēķināt ›</button>
          <button style={s.btnSm} onClick={() => setSolis(2)}>← Sortimenti</button>
        </div>
      </div>
    </div>
  )

  // ── SOLIS 4 — Rezultāts ───────────────────────────────────────────────────
  if (solis === 4 && rezultati) {
    const { sortRez, atlikumuAnalīze, kopNeto, kopTransports, kopBraucieni, kopaM3, izstradesIzm, galaRez } = rezultati

    return (
      <div style={s.app}>
        <Hdr />
        <div style={s.body}>

          {/* Kopsavilkums */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 10, marginBottom: 14 }}>
            {[
              ["Likvīdā krāja", kopaM3.toFixed(1) + " m³", "#4caf50"],
              ["Transports kopā", kopTransports.toFixed(0) + " €", "#e65100"],
              ["Braucieni kopā", kopBraucieni + " reizes", "#64b5f6"],
              ["NETO pēc transporta", galaRez.toFixed(0) + " €", galaRez >= 0 ? "#4caf50" : "#ef5350"],
            ].map(([lb, val, col]) => (
              <div key={lb} style={{ ...s.card, textAlign: "center", padding: 12 }}>
                <div style={{ fontSize: 10, color: "#81c784", textTransform: "uppercase", marginBottom: 4 }}>{lb}</div>
                <div style={{ fontSize: 22, fontWeight: 800, color: col }}>{val}</div>
              </div>
            ))}
          </div>

          {/* Optimālie maršruti pa sortimentiem */}
          <div style={s.card}>
            <div style={s.cardTitle}>🎯 Optimālie maršruti pa sortimentiem</div>
            {Object.entries(sortRez).map(([sort, opcijas]) => {
              if (opcijas.length === 0) return null
              const lab = opcijas[0]
              const alternatīvas = opcijas.slice(1, 3)

              return (
                <div key={sort} style={{ marginBottom: 16, borderBottom: "1px solid #1e3a1e", paddingBottom: 16 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                    <span style={{ ...s.tag(SORT_KRASA[sort] || "#4caf50"), fontSize: 11 }}>
                      {SORT_NOSAUKUMI[sort]}
                    </span>
                    <span style={{ fontSize: 12, color: "#81c784" }}>{lab.m3} m³</span>
                    <span style={{ fontSize: 12, color: "#81c784" }}>→ {lab.braucieni} brauciens{lab.braucieni > 1 ? "i" : ""}</span>
                    {lab.atlikums > 0 && (
                      <span style={{ ...s.tag("#e65100"), fontSize: 10 }}>
                        atlikums {lab.atlikums} m³
                      </span>
                    )}
                  </div>

                  {/* Labākā izvēle */}
                  {lab.iepirkumsCena > 0 ? (
                    <div style={{ background: "#0a1f0a", border: `1px solid ${lab.vieta.noSupabase ? "#2e7d32" : "#2d5a2d"}`, borderRadius: 8, padding: 10, marginBottom: 8 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 6 }}>
                        <div>
                          <span style={{ fontSize: 13, fontWeight: 700, color: "#4caf50" }}>
                            ✅ {lab.vieta.nosaukums}
                          </span>
                          {lab.vieta.noSupabase && (
                            <span style={{ ...s.tag("#4caf50"), marginLeft: 6, fontSize: 9 }}>Reģistrēts pircējs</span>
                          )}
                          <span style={{ fontSize: 11, color: "#558b2f", marginLeft: 8 }}>~{lab.km} km</span>
                          {lab.vieta.talrunis && (
                            <span style={{ fontSize: 11, color: "#4a7a4a", marginLeft: 8 }}>📞 {lab.vieta.talrunis}</span>
                          )}
                          {lab.vieta.epasts && (
                            <span style={{ fontSize: 11, color: "#4a7a4a", marginLeft: 6 }}>✉ {lab.vieta.epasts}</span>
                          )}
                        </div>
                        <div style={{ textAlign: "right" }}>
                          <div style={{ fontSize: 11, color: "#81c784" }}>
                            Iepirkums: {lab.iepirkumsCena} € | Trans: -{lab.transportsCena} €
                          </div>
                          <div style={{ fontSize: 14, fontWeight: 700, color: lab.neto >= 0 ? "#4caf50" : "#ef5350" }}>
                            Neto: {lab.neto} €/m³ = {lab.netoKopa.toFixed(0)} €
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div style={{ background: "#1a0000", border: "1px solid #c62828", borderRadius: 8, padding: 10, marginBottom: 8, fontSize: 12, color: "#ef9a9a" }}>
                      ⚠ Nav ievadītas cenas šim sortimentam
                    </div>
                  )}

                  {/* Alternatīvas */}
                  {alternatīvas.length > 0 && alternatīvas.some(a => a.iepirkumsCena > 0) && (
                    <div style={{ fontSize: 11, color: "#558b2f" }}>
                      Alternatīvas: {alternatīvas.filter(a => a.iepirkumsCena > 0).map(a => (
                        <span key={a.vieta.id} style={{ marginRight: 12 }}>
                          {a.vieta.nosaukums} ({a.km}km, neto: {a.neto}€/m³)
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {/* Atlikumu analīze */}
          {atlikumuAnalīze.length > 0 && (
            <div style={{ ...s.card, border: "1px solid #e65100" }}>
              <div style={{ ...s.cardTitle, color: "#e65100" }}>💡 Atlikumu optimizācija</div>
              {atlikumuAnalīze.map((a, i) => (
                <div key={i} style={{ fontSize: 12, marginBottom: 8, color: "#ffcc80" }}>
                  <strong>{SORT_NOSAUKUMI[a.sortiments]}</strong> → {a.vieta} atlikums {a.atlikums} m³.
                  Šī vieta pieņem arī: <strong>{a.papild.join(", ")}</strong> — var papildināt kravu!
                </div>
              ))}
            </div>
          )}

          {/* Galīgais aprēķins */}
          <div style={s.card}>
            <div style={s.cardTitle}>💰 Galīgais aprēķins</div>
            {[
              ["Bruto (transporta neto)", kopNeto.toFixed(0) + " €", "#4caf50"],
              ["Izstrāde " + izstrade + " €/m³ × " + kopaM3.toFixed(1) + " m³", "− " + izstradesIzm.toFixed(0) + " €", "#ef5350"],
            ].map(([lb, val, col]) => (
              <div key={lb} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #1e3a1e" }}>
                <span style={{ color: "#a5d6a7" }}>{lb}</span>
                <span style={{ fontWeight: 700, color: col }}>{val}</span>
              </div>
            ))}
            <div style={{ display: "flex", justifyContent: "space-between", padding: "12px 0", marginTop: 4 }}>
              <span style={{ fontSize: 16, fontWeight: 800, color: "#4caf50" }}>🌲 NETO KRAUTUVĒ</span>
              <span style={{ fontSize: 24, fontWeight: 800, color: galaRez >= 0 ? "#4caf50" : "#ef5350" }}>
                {galaRez.toFixed(0)} €
              </span>
            </div>
          </div>

          <div style={{ display: "flex", gap: 10 }}>
            <button style={s.btnSm} onClick={() => setSolis(3)}>← Labot cenas</button>
            <button style={s.btnSm} onClick={() => { setSolis(1); setRezultati(null) }}>🔄 Jauns aprēķins</button>
          </div>
        </div>
      </div>
    )
  }

  return null
}
