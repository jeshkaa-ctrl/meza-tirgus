import React, { useState, useEffect } from "react"
import * as pdfjsLib from "pdfjs-dist"
import { NOVADI } from "./novadi"
import { DARBIBAS_VEIDI } from "./RegModal"
import { C as DS, F, R, S, spinnerCSS } from "./ds"

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL("pdfjs-dist/build/pdf.worker.min.mjs", import.meta.url).toString()

// ── Tumšā tēma ───────────────────────────────────────────────────────────────
const T = {
  bg:         "#080f08",
  card:       "#111f11",
  inner:      "#1a2e1a",
  deep:       "#0f1a0f",
  border:     "#2d4a2d",
  borderSoft: "#1e3a1e",
  text:       "#e8f5e9",
  textSec:    "#a8d8a8",
  textMuted:  "#7ab87a",
  textDim:    "#557a55",
  accent:     "#4caf50",
  orange:     "#e65100",
  blue:       "#42a5f5",
  blueDark:   "#1565c0",
  error:      "#e57373",
  errorBg:    "#2a0a0a",
  warn:       "#f9a825",
  warnBg:     "#1a1408",
  infoBg:     "#0d1a0d",
  success:    "#81c784",
  successBg:  "#0a1f0a",
}

const inp = {
  background: T.deep,
  border: `1px solid ${T.border}`,
  color: T.text,
  borderRadius: 4,
  padding: "10px 9px",
  fontSize: 16,
  width: "100%",
  boxSizing: "border-box",
  outline: "none",
  minHeight: 44,
}

// ── localStorage helpers ──────────────────────────────────────────────────────
const getIzsoles    = () => { try { return JSON.parse(localStorage.getItem("mt_izsoles")    || "[]") } catch { return [] } }
const saveIzsoles   = (d) => { try { localStorage.setItem("mt_izsoles",    JSON.stringify(d)) } catch {} }
const getSolījumi   = () => { try { return JSON.parse(localStorage.getItem("mt_soljumi")    || "[]") } catch { return [] } }
const saveSolījumi  = (d) => { try { localStorage.setItem("mt_soljumi",    JSON.stringify(d)) } catch {} }
const getDalibnieki = () => { try { return JSON.parse(localStorage.getItem("mt_dalibnieki") || "[]") } catch { return [] } }
const saveDalibnieki= (d) => { try { localStorage.setItem("mt_dalibnieki", JSON.stringify(d)) } catch {} }

// ── Solīšanas solis ───────────────────────────────────────────────────────────
const getSolis = (sakumcena) => {
  if (sakumcena < 5000)  return 100
  if (sakumcena < 20000) return 500
  if (sakumcena < 50000) return 1000
  return 2000
}

// ── Izsoles fāze ──────────────────────────────────────────────────────────────
const getIzsoleFaze = (izsole) => {
  const tagad  = new Date()
  const sakums = izsole.sakums ? new Date(izsole.sakums) : null
  const beigas = new Date(izsole.beigas)
  if (sakums && tagad < sakums) return "gaida"
  if (tagad > beigas)           return "beigusies"
  return "aktiva"
}

// ── Laika formatēšana ─────────────────────────────────────────────────────────
const atlikušaisLaiks = (beigas) => {
  const diff = new Date(beigas) - new Date()
  if (diff <= 0) return { teksts: "Izsole beigusies", beigusies: true }
  const d = Math.floor(diff / 86400000)
  const h = Math.floor((diff % 86400000) / 3600000)
  const m = Math.floor((diff % 3600000)  / 60000)
  if (d > 0) return { teksts: `${d}d ${h}h atlikuši`,   beigusies: false }
  if (h > 0) return { teksts: `${h}h ${m}min atlikuši`, beigusies: false }
  return        { teksts: `${m} min atlikuši`,           beigusies: false }
}

const lidzSakumam = (sakums) => {
  const diff = new Date(sakums) - new Date()
  if (diff <= 0) return null
  const d = Math.floor(diff / 86400000)
  const h = Math.floor((diff % 86400000) / 3600000)
  if (d > 0) return `Sākas pēc ${d}d ${h}h`
  return `Sākas pēc ${h}h`
}

// ── Noteikumu modālis ─────────────────────────────────────────────────────────
function NoteikumiModal({ veids, onPiekritu, onAtcelt }) {
  const isIzlicejs = veids === "izlicejs"
  const isDaliba   = veids === "daliba"
  return (
    <div style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", background: "rgba(0,0,0,0.75)", zIndex: 2000, display: "flex", alignItems: "center", justifyContent: "center", padding: 16, boxSizing: "border-box" }}>
      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, maxWidth: 520, width: "100%", maxHeight: "85vh", overflow: "auto", padding: 28, boxShadow: "0 8px 32px rgba(0,0,0,0.6)" }}>
        <h3 style={{ color: T.accent, marginTop: 0, fontSize: 16 }}>
          {isIzlicejs ? "📋 Izsoles izlikšanas noteikumi" : isDaliba ? "📋 Dalības noteikumi" : "📋 Solīšanas noteikumi"}
        </h3>

        {isIzlicejs && (
          <div style={{ fontSize: 13, color: T.textSec, lineHeight: 1.7 }}>
            <p style={{ color: T.text }}><b>Pirms izlikšanas apliecini:</b></p>
            <ul style={{ paddingLeft: 20, margin: "8px 0", color: T.textSec }}>
              <li>Esmu tiesīgs pārdot vai iznomāt šo objektu</li>
              <li>Visas norādītās ziņas ir patiesas un precīzas</li>
              <li>Apņemos noslēgt darījumu ar augstākā solījuma iesniedzēju</li>
              <li>Saprotu, ka atkāpšanās no darījuma bez pamatota iemesla ietekmēs manu reputāciju platformā</li>
            </ul>
            <div style={{ background: T.warnBg, border: `1px solid ${T.warn}`, borderRadius: 6, padding: "10px 14px", fontSize: 12, marginTop: 8, color: T.warn }}>
              ⚠️ Meža tirgus platforma ir starpnieks un neuzņemas atbildību par darījuma izpildi. Darījums notiek tikai starp pārdevēju un pircēju. Platformai ir tiesības bloķēt lietotāju kontu ja tiek konstatēta ļaunprātīga rīcība.
            </div>
          </div>
        )}
        {isDaliba && (
          <div style={{ fontSize: 13, color: T.textSec, lineHeight: 1.7 }}>
            <p style={{ color: T.text }}><b>Reģistrējoties dalībai apliecini:</b></p>
            <ul style={{ paddingLeft: 20, margin: "8px 0" }}>
              <li>Esmu iepazinies ar izsoles aprakstu un objekta informāciju</li>
              <li>Mans solījums būs nopietns un finansiāli pamatots</li>
              <li>Saprotu, ka uzvarot esmu morāli atbildīgs pabeigt darījumu</li>
              <li>Atkāpšanās no uzvarētā solījuma tiks atzīmēta manā profilā</li>
            </ul>
            <p style={{ color: T.text }}><b>Solīšanas principi:</b></p>
            <ul style={{ paddingLeft: 20, margin: "8px 0" }}>
              <li>Redzi savu pēdējo solījumu un lielāko pašreizējo solījumu</li>
              <li>Citu solītāju identitāte ir slēpta līdz izsoles beigām</li>
              <li>Ja pēdējās 5 minūtēs tiek iesniegts jauns solījums — izsole pagarinās par 5 minūtēm</li>
              <li>Izsoles beigu brīdī lielākais solītājs uzvar</li>
            </ul>
            <div style={{ background: T.warnBg, border: `1px solid ${T.warn}`, borderRadius: 6, padding: "10px 14px", fontSize: 12, marginTop: 8, color: T.warn }}>
              ⚠️ Meža tirgus platforma ir starpnieks un neuzņemas atbildību par darījuma izpildi.
            </div>
          </div>
        )}
        {!isIzlicejs && !isDaliba && (
          <div style={{ fontSize: 13, color: T.textSec, lineHeight: 1.7 }}>
            <p style={{ color: T.text }}><b>Pirms solīšanas atgādinājums:</b></p>
            <ul style={{ paddingLeft: 20, margin: "8px 0" }}>
              <li>Solījums ir juridiski saistošs morāls pienākums</li>
              <li>Minimālais solīšanas solis ir norādīts pie solīšanas pogas</li>
              <li>Pēdējo 5 minūšu solījums pagarina izsoli par 5 minūtēm</li>
            </ul>
          </div>
        )}

        <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
          <button onClick={onPiekritu} style={{ flex: 1, padding: "10px 0", background: "#225522", color: "white", border: "none", borderRadius: 6, cursor: "pointer", fontWeight: "bold", fontSize: 14 }}>
            ✓ Piekrītu noteikumiem
          </button>
          <button onClick={onAtcelt} style={{ padding: "10px 16px", background: "#444", color: "white", border: "none", borderRadius: 6, cursor: "pointer" }}>
            Atcelt
          </button>
        </div>
      </div>
    </div>
  )
}

// ── PDF parsēšana ─────────────────────────────────────────────────────────────
async function lasitPDF(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = async (e) => {
      try {
        const typedArray = new Uint8Array(e.target.result)
        const pdf = await pdfjsLib.getDocument(typedArray).promise
        let txt = ""
        for (let i = 1; i <= pdf.numPages; i++) {
          const page    = await pdf.getPage(i)
          const content = await page.getTextContent()
          txt += content.items.map(item => item.str).join(" ") + "\n"
        }
        resolve(txt)
      } catch(err) { reject(err) }
    }
    reader.readAsArrayBuffer(file)
  })
}

function atpazitPDF(txt) {
  if (txt.includes("Mežvērte") || txt.includes("MEŽVĒRTE") || txt.includes("CIRSMAS NOVĒRTĒJUMS") || txt.includes("Lietkoksne")) return "dastojums"
  if (txt.includes("Meža inventarizācija") || txt.includes("Nogabala apraksts") || txt.includes("VMD")) return "inventarizacija"
  return "nezinams"
}

function parseInventarizacija(txt) {
  const result = { nogabali: [], kadastrs: "", saimnieciba: "", kopPlatiba: 0 }
  const kadMatch  = txt.match(/(\d{11})/)
  if (kadMatch) result.kadastrs = kadMatch[1]
  const saimMatch = txt.match(/Saimniecība:\s*([^\n]+)/)
  if (saimMatch) result.saimnieciba = saimMatch[1].trim().split(" ")[0]
  const nogabaliMatches = [...txt.matchAll(/Nogabals[:\s]+(\w+)[\s\S]*?(\d+[.,]\d+)\s*ha/g)]
  result.nogabali   = nogabaliMatches.map(m => ({ nr: m[1], platiba: m[2].replace(",", ".") }))
  result.kopPlatiba = result.nogabali.reduce((s, n) => s + parseFloat(n.platiba || 0), 0)
  return result
}

const CENAS          = { log: 73, small: 55, veneer: 130, tara: 48, pulp: 50, fire: 38, chips: 12 }
const SORT_NOSAUKUMI = { log: "Baļķis", small: "Sīkbaļķis", veneer: "Finieris", tara: "Tara", pulp: "Papīrmalka", fire: "Malka", chips: "Šķelda" }
const IZMAKSAS_DEFOLT = { zaglesana: 18, pievesana: 12 }

// ── Foto augšupielāde ─────────────────────────────────────────────────────────
function FotoUpload({ fotos, setFotos }) {
  const handleFoto = (e) => {
    const files = Array.from(e.target.files)
    files.forEach(file => {
      const reader = new FileReader()
      reader.onload = (ev) => setFotos(prev => [...prev, { nosaukums: file.name, data: ev.target.result }])
      reader.readAsDataURL(file)
    })
  }
  return (
    <div style={{ marginBottom: 16, padding: 14, background: T.deep, borderRadius: 8, border: `1px dashed ${T.border}` }}>
      <label style={{ fontSize: 11, fontWeight: "bold", display: "block", marginBottom: 6, color: T.textMuted }}>📸 Foto (cirsma, ceļš, krautuve):</label>
      <input type="file" accept="image/*" multiple onChange={handleFoto} style={{ fontSize: 13, color: T.textSec }} />
      {fotos.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 10 }}>
          {fotos.map((f, i) => (
            <div key={i} style={{ position: "relative" }}>
              <img src={f.data} alt={f.nosaukums} style={{ width: 80, height: 60, objectFit: "cover", borderRadius: 4, border: `1px solid ${T.border}` }} />
              <button onClick={() => setFotos(prev => prev.filter((_, j) => j !== i))}
                style={{ position: "absolute", top: -6, right: -6, background: "#c62828", color: "white", border: "none", borderRadius: "50%", width: 18, height: 18, cursor: "pointer", fontSize: 10, lineHeight: "18px", textAlign: "center", padding: 0 }}>✕</button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Izsoles forma ─────────────────────────────────────────────────────────────
function IzsoleForm({ user, onSaglabat, onAtcelt }) {
  const [apraksts,   setApraksts]   = useState("")
  const [kadastrs,   setKadastrs]   = useState("")
  const [novads,     setNovads]     = useState(user?.novads || "")
  const [sakumcena,  setSakumcena]  = useState("")
  const [sakums,     setSakums]     = useState(() => { const d = new Date(); d.setDate(d.getDate() + 1);  return d.toISOString().split("T")[0] })
  const [beigas,     setBeigas]     = useState(() => { const d = new Date(); d.setDate(d.getDate() + 14); return d.toISOString().split("T")[0] })
  const [publiska,   setPubliska]   = useState(true)
  const [pdfFile,    setPdfFile]    = useState(null)
  const [pdfTips,    setPdfTips]    = useState(null)
  const [analīze,    setAnalīze]    = useState(null)
  const [pievienotAprēķinu, setPievienotAprēķinu] = useState(false)
  const [lādē,       setLādē]       = useState(false)
  const [kludas,     setKludas]     = useState("")
  const [showNoteikumi, setShowNoteikumi] = useState(false)
  const [izmaksas,   setIzmaksas]   = useState({ ...IZMAKSAS_DEFOLT })
  const [fotos,      setFotos]      = useState([])
  const [pdfBase64,  setPdfBase64]  = useState(null)

  const lkmGeoUrl = kadastrs
    ? `https://www.lvmgeo.lv/kartes?cadastre=${kadastrs}`
    : "https://www.lvmgeo.lv/kartes"

  const handlePDF = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    setPdfFile(file)
    const reader2 = new FileReader()
    reader2.onload = (ev) => setPdfBase64(ev.target.result)
    reader2.readAsDataURL(file)
    setLādē(true)
    setAnalīze(null)
    setPdfTips(null)
    try {
      const txt  = await lasitPDF(file)
      const tips = atpazitPDF(txt)
      setPdfTips(tips)
      // dastojuma PDF parsēšana nav atbalstīta šajā formā — pievienots kā faila pielikums
      if (tips === "inventarizacija") {
        const rez = parseInventarizacija(txt)
        setAnalīze({ tips, ...rez })
        if (rez.kadastrs && !kadastrs) setKadastrs(rez.kadastrs)
      }
    } catch (err) { console.error(err) }
    setLādē(false)
  }

  const validet = () => {
    if (!apraksts.trim()) return setKludas("Ievadi aprakstu!")
    if (!sakumcena || parseFloat(sakumcena) <= 0) return setKludas("Ievadi sākumcenu!")
    if (new Date(sakums) >= new Date(beigas)) return setKludas("Beigu datumam jābūt pēc sākuma datuma!")
    setKludas("")
    setShowNoteikumi(true)
  }

  const saglabat = () => {
    const izsole = {
      id: Date.now(),
      nosaukums: apraksts.slice(0, 60),
      apraksts, kadastrs, novads,
      sakumcena: parseFloat(sakumcena),
      sakums: new Date(sakums).toISOString(),
      beigas: new Date(beigas).toISOString(),
      publiska,
      autors:        user?.vards    || "—",
      autorsEpasts:  user?.epasts   || "",
      autorsTalrunis:user?.talrunis || "",
      datums: new Date().toLocaleDateString("lv-LV"),
      statuss: "aktiva",
      uzvaretajs: null,
      pdfNosaukums: pdfFile?.name || null,
      pdfBase64:    pdfBase64    || null,
      analīze: pievienotAprēķinu ? analīze : null,
      fotos: fotos.slice(0, 5),
    }
    onSaglabat(izsole)
    setShowNoteikumi(false)
  }

  const sortimenti     = analīze?.sortimenti || {}
  const kopKub         = analīze?.kopKub     || 0
  const izmaksasKopa   = (izmaksas.zaglesana + izmaksas.pievesana) * kopKub
  const sortVert       = Object.keys(sortimenti).reduce((s, k) => s + (sortimenti[k] || 0) * (CENAS[k] || 0), 0)
  const krautuveVert   = sortVert - izmaksasKopa

  const labelSt = { fontSize: 11, fontWeight: "bold", display: "block", marginBottom: 3, color: T.textMuted }

  return (
    <>
      {showNoteikumi && <NoteikumiModal veids="izlicejs" onPiekritu={saglabat} onAtcelt={() => setShowNoteikumi(false)} />}
      <div style={{ background: T.card, border: `2px solid ${T.orange}`, borderRadius: 10, padding: 24, marginBottom: 16 }}>
        <h3 style={{ color: T.orange, marginTop: 0, fontSize: 16 }}>🏷 Izlikt izsolē</h3>
        {kludas && <div style={{ background: T.errorBg, color: T.error, padding: 8, borderRadius: 4, marginBottom: 12, fontSize: 12, border: `1px solid ${T.error}` }}>{kludas}</div>}

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12, marginBottom: 12 }}>
          <div>
            <label style={labelSt}>Kadastra numurs:</label>
            <div style={{ display: "flex", gap: 6 }}>
              <input value={kadastrs} onChange={e => setKadastrs(e.target.value)} placeholder="12345678901"
                style={{ ...inp, flex: 1 }} />
              <a href={lkmGeoUrl} target="_blank" rel="noreferrer"
                style={{ padding: "6px 10px", background: "#2e7d32", color: "white", borderRadius: 4, textDecoration: "none", fontSize: 12, whiteSpace: "nowrap", display: "flex", alignItems: "center" }}>
                🗺 LVM GEO
              </a>
            </div>
          </div>
          <div>
            <label style={labelSt}>Novads / Pagasts:</label>
            <input value={novads} onChange={e => setNovads(e.target.value)} placeholder="piem. Ogres novads"
              style={inp} />
          </div>
        </div>

        <div style={{ marginBottom: 12 }}>
          <label style={labelSt}>Apraksts:</label>
          <textarea value={apraksts} onChange={e => setApraksts(e.target.value)} rows={4}
            placeholder="Apraksti objektu — sugu sastāvs, vecums, piekļuve, ceļi, krautuve..."
            style={{ ...inp, resize: "vertical" }} />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 12, marginBottom: 16 }}>
          <div>
            <label style={labelSt}>Sākumcena (€):</label>
            <input type="number" value={sakumcena} onChange={e => setSakumcena(e.target.value)} placeholder="0"
              style={inp} />
            {sakumcena && <div style={{ fontSize: 11, color: T.textDim, marginTop: 2 }}>Solīšanas solis: {getSolis(parseFloat(sakumcena))} €</div>}
          </div>
          <div>
            <label style={labelSt}>Izsole sākas:</label>
            <input type="date" value={sakums} onChange={e => setSakums(e.target.value)} style={inp} />
          </div>
          <div>
            <label style={labelSt}>Izsole beidzas:</label>
            <input type="date" value={beigas} onChange={e => setBeigas(e.target.value)} style={inp} />
          </div>
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={labelSt}>Redzamība:</label>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={() => setPubliska(true)}
              style={{ padding: "8px 20px", background: publiska ? "#225522" : T.deep, color: publiska ? "white" : T.textMuted, border: `1px solid #225522`, borderRadius: 6, cursor: "pointer", fontSize: 13 }}>
              🌍 Publiska
            </button>
            <button onClick={() => setPubliska(false)}
              style={{ padding: "8px 20px", background: !publiska ? T.blueDark : T.deep, color: !publiska ? "white" : T.textMuted, border: `1px solid ${T.blueDark}`, borderRadius: 6, cursor: "pointer", fontSize: 13 }}>
              🔒 Privāta
            </button>
          </div>
        </div>

        <div style={{ marginBottom: 16, padding: 14, background: T.deep, borderRadius: 8, border: `1px dashed ${T.border}` }}>
          <label style={{ ...labelSt, marginBottom: 6 }}>📎 PDF pielikums (inventarizācija vai dastojums):</label>
          <input type="file" accept=".pdf" onChange={handlePDF} style={{ fontSize: 13, color: T.textSec }} />
          {lādē && <div style={{ marginTop: 8, fontSize: 13, color: T.blue }}>⏳ Nolasa PDF...</div>}
          {pdfFile && !lādē && (
            <div style={{ marginTop: 8, fontSize: 12, color: T.accent }}>
              ✓ {pdfFile.name}
              {pdfTips === "dastojums"      && <span style={{ marginLeft: 8, background: "#0a2a0a", color: T.accent,  padding: "2px 8px", borderRadius: 10, fontSize: 11, border: `1px solid ${T.border}` }}>🌲 Dastojums atpazīts</span>}
              {pdfTips === "inventarizacija"&& <span style={{ marginLeft: 8, background: "#0a1a2a", color: T.blue,    padding: "2px 8px", borderRadius: 10, fontSize: 11, border: `1px solid #1e3a5a` }}>📋 Inventarizācija atpazīta</span>}
              {pdfTips === "nezinams"       && <span style={{ marginLeft: 8, background: T.warnBg,  color: T.warn,   padding: "2px 8px", borderRadius: 10, fontSize: 11 }}>📄 PDF pievienots</span>}
            </div>
          )}
        </div>

        <FotoUpload fotos={fotos} setFotos={setFotos} />

        {analīze && analīze.tips === "dastojums" && Object.keys(sortimenti).length > 0 && (
          <div style={{ marginBottom: 16, padding: 16, background: T.deep, border: `2px solid ${T.accent}`, borderRadius: 8 }}>
            <div style={{ fontWeight: "bold", color: T.accent, marginBottom: 10, fontSize: 14 }}>
              📊 Analīzes rezultāti
              <span style={{ fontSize: 11, color: T.textDim, fontWeight: "normal", marginLeft: 8 }}>(precizitāte atkarīga no inventarizācijas datuma)</span>
            </div>
            {analīze.nogabali?.length > 0 && (
              <div style={{ marginBottom: 8, display: "flex", flexWrap: "wrap", gap: 6 }}>
                {analīze.nogabali.map((n, i) => (
                  <span key={i} style={{ background: T.inner, border: `1px solid ${T.border}`, borderRadius: 4, padding: "3px 8px", fontSize: 12, color: T.textSec }}>
                    {n.nr}{n.platiba ? ` — ${n.platiba} ha` : ""}
                  </span>
                ))}
              </div>
            )}
            <div style={{ marginBottom: 8, display: "flex", gap: 12, flexWrap: "wrap" }}>
              {[["zaglesana", "Zāģēšana €/m³"], ["pievesana", "Pievešana €/m³"]].map(([k, lbl]) => (
                <div key={k} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: T.textMuted }}>
                  <label>{lbl}:</label>
                  <input type="number" value={izmaksas[k]} onChange={e => setIzmaksas({ ...izmaksas, [k]: parseFloat(e.target.value) || 0 })}
                    style={{ ...inp, width: 55 }} />
                </div>
              ))}
            </div>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12, marginBottom: 8 }}>
              <thead><tr style={{ background: "#1b4a1b" }}>
                <th style={{ padding: "4px 8px", textAlign: "left",  color: T.textSec }}>Sortiments</th>
                <th style={{ padding: "4px 8px", textAlign: "right", color: T.textSec }}>m³</th>
                <th style={{ padding: "4px 8px", textAlign: "right", color: T.textSec }}>€/m³</th>
                <th style={{ padding: "4px 8px", textAlign: "right", color: T.textSec }}>€</th>
              </tr></thead>
              <tbody>
                {Object.keys(sortimenti).filter(k => sortimenti[k] > 0).map((k, i) => (
                  <tr key={k} style={{ background: i % 2 === 0 ? T.inner : T.deep }}>
                    <td style={{ padding: "3px 8px", borderBottom: `1px solid ${T.border}`, color: T.textSec }}>{SORT_NOSAUKUMI[k]}</td>
                    <td style={{ padding: "3px 8px", textAlign: "right", borderBottom: `1px solid ${T.border}`, color: T.textSec }}>{sortimenti[k].toFixed(1)}</td>
                    <td style={{ padding: "3px 8px", textAlign: "right", borderBottom: `1px solid ${T.border}`, color: T.textMuted }}>{CENAS[k]}</td>
                    <td style={{ padding: "3px 8px", textAlign: "right", borderBottom: `1px solid ${T.border}`, fontWeight: "bold", color: T.text }}>{(sortimenti[k] * (CENAS[k] || 0)).toFixed(0)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr style={{ background: "#0a2a0a" }}>
                  <td style={{ padding: "4px 8px", fontWeight: "bold", color: T.text }}>Kopā</td>
                  <td style={{ padding: "4px 8px", textAlign: "right", fontWeight: "bold", color: T.text }}>{kopKub.toFixed(1)} m³</td>
                  <td></td>
                  <td style={{ padding: "4px 8px", textAlign: "right", fontWeight: "bold", color: T.text }}>{sortVert.toFixed(0)} €</td>
                </tr>
                <tr style={{ background: "#1a0f00" }}>
                  <td colSpan={3} style={{ padding: "4px 8px", fontSize: 11, color: T.orange }}>Izmaksas ({izmaksas.zaglesana + izmaksas.pievesana} €/m³ × {kopKub.toFixed(1)} m³)</td>
                  <td style={{ padding: "4px 8px", textAlign: "right", color: "#e57373", fontWeight: "bold" }}>-{izmaksasKopa.toFixed(0)} €</td>
                </tr>
                <tr style={{ background: "#0a2a15" }}>
                  <td colSpan={3} style={{ padding: "6px 8px", fontWeight: "bold", color: T.accent, fontSize: 13 }}>🌲 Krautuves vērtība</td>
                  <td style={{ padding: "6px 8px", textAlign: "right", fontWeight: "bold", color: T.accent, fontSize: 15 }}>{krautuveVert.toFixed(0)} €</td>
                </tr>
              </tfoot>
            </table>
            <div style={{ padding: "10px 14px", background: T.inner, border: `1px solid ${T.border}`, borderRadius: 6 }}>
              <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", fontSize: 13, color: T.textSec }}>
                <input type="checkbox" checked={pievienotAprēķinu} onChange={e => setPievienotAprēķinu(e.target.checked)} style={{ width: 18, height: 18 }} />
                <span><b style={{ color: T.text }}>Pievienot aprēķinus izsoles sludinājumam</b>
                  <span style={{ display: "block", fontSize: 11, color: T.textDim, marginTop: 2 }}>Pircēji redzēs oriģinālo PDF un aprēķina rezultātus</span>
                </span>
              </label>
            </div>
          </div>
        )}

        <div style={{ marginBottom: 16, padding: "10px 14px", background: T.warnBg, border: `1px solid ${T.warn}`, borderRadius: 6, fontSize: 12, color: T.warn }}>
          ⚠️ Apliecinu, ka esmu tiesīgs pārdot vai iznomāt šo objektu un visas norādītās ziņas ir patiesas.
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={validet} style={{ padding: "10px 24px", background: T.orange, color: "white", border: "none", borderRadius: 6, cursor: "pointer", fontWeight: "bold", fontSize: 14 }}>
            🏷 Izlikt izsolē
          </button>
          <button onClick={onAtcelt} style={{ padding: "10px 16px", background: "#444", color: "white", border: "none", borderRadius: 6, cursor: "pointer" }}>
            Atcelt
          </button>
        </div>
      </div>
    </>
  )
}

// ── Solīšanas modālis ─────────────────────────────────────────────────────────
function SolitModal({ izsole, user, onSolit, onAtcelt }) {
  const [summa,  setSumma]  = useState("")
  const [showNoteikumi, setShowNoteikumi] = useState(false)
  const [kludas, setKludas] = useState("")

  const soljumi     = getSolījumi().filter(s => s.izsolId === izsole.id)
  const lielakais   = soljumi.length ? Math.max(...soljumi.map(s => s.summa)) : izsole.sakumcena
  const solis       = getSolis(izsole.sakumcena)
  const minSumma    = lielakais + solis
  const manasSoljumi = soljumi.filter(s => s.epasts === user?.epasts)
  const manamsPedjais = manasSoljumi.length ? Math.max(...manasSoljumi.map(s => s.summa)) : null

  const solit = () => {
    const s = parseFloat(summa)
    if (!s || s < minSumma) return setKludas(`Minimālais solījums: ${minSumma} € (solis: ${solis} €)`)
    onSolit(s)
  }

  if (showNoteikumi) return <NoteikumiModal veids="solitajs" onPiekritu={() => setShowNoteikumi(false)} onAtcelt={onAtcelt} />

  return (
    <div style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", background: "rgba(0,0,0,0.75)", zIndex: 2000, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, maxWidth: 400, width: "100%", padding: 28, boxShadow: "0 8px 32px rgba(0,0,0,0.6)" }}>
        <h3 style={{ color: T.accent, marginTop: 0 }}>💰 Solīt</h3>
        <div style={{ background: T.deep, borderRadius: 6, padding: "10px 14px", marginBottom: 16, fontSize: 13, border: `1px solid ${T.border}` }}>
          <div style={{ color: T.textSec }}>Sākumcena: <b style={{ color: T.text }}>{izsole.sakumcena.toLocaleString()} €</b></div>
          <div style={{ color: T.textSec }}>Lielākais solījums: <b style={{ color: T.orange }}>{lielakais.toLocaleString()} €</b></div>
          <div style={{ color: T.textSec }}>Minimālais nākamais: <b style={{ color: T.accent }}>{minSumma.toLocaleString()} €</b></div>
          <div style={{ fontSize: 11, color: T.textDim }}>Solīšanas solis: {solis} €</div>
          {manamsPedjais && <div style={{ marginTop: 4, color: T.textSec }}>Mans pēdējais: <b style={{ color: T.blue }}>{manamsPedjais.toLocaleString()} €</b></div>}
        </div>
        {kludas && <div style={{ background: T.errorBg, color: T.error, padding: 8, borderRadius: 4, marginBottom: 10, fontSize: 12 }}>{kludas}</div>}
        <label style={{ fontSize: 11, fontWeight: "bold", color: T.textMuted }}>Mans solījums (€):</label>
        <input type="number" value={summa} onChange={e => setSumma(e.target.value)}
          placeholder={`Min. ${minSumma} €`}
          style={{ ...inp, fontSize: 16, marginTop: 4, marginBottom: 8, border: `2px solid ${T.accent}` }} autoFocus />
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 16 }}>
          {[minSumma, minSumma + solis, minSumma + solis * 2].map(s => (
            <button key={s} onClick={() => setSumma(String(s))}
              style={{ padding: "4px 10px", background: T.inner, border: `1px solid ${T.accent}`, borderRadius: 4, cursor: "pointer", fontSize: 12, color: T.accent }}>
              {s.toLocaleString()} €
            </button>
          ))}
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={solit} style={{ flex: 1, padding: "10px 0", background: "#225522", color: "white", border: "none", borderRadius: 6, cursor: "pointer", fontWeight: "bold", fontSize: 14 }}>
            ✓ Apstiprināt solījumu
          </button>
          <button onClick={onAtcelt} style={{ padding: "10px 16px", background: "#444", color: "white", border: "none", borderRadius: 6, cursor: "pointer" }}>
            Atcelt
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Izsoles karte ─────────────────────────────────────────────────────────────
function IzsoleKarte({ izsole, user, onAtjaunot }) {
  const [showSolit,          setShowSolit]         = useState(false)
  const [showSolījumi,       setShowSolījumi]      = useState(false)
  const [showDalibaNoteikumi,setShowDalibaNoteikumi]= useState(false)
  const [showAnalīze,        setShowAnalīze]       = useState(false)

  const soljumi      = getSolījumi().filter(s => s.izsolId === izsole.id).sort((a, b) => b.summa - a.summa)
  const dalibnieki   = getDalibnieki().filter(d => d.izsolId === izsole.id)
  const lielakais    = soljumi.length ? soljumi[0].summa : izsole.sakumcena
  const manasSoljumi = user ? soljumi.filter(s => s.epasts === user.epasts) : []
  const manamsPedjais= manasSoljumi.length ? Math.max(...manasSoljumi.map(s => s.summa)) : null
  const irAutors     = user?.epasts === izsole.autorsEpasts
  const irDalibnieks = user ? dalibnieki.some(d => d.epasts === user.epasts) : false
  const laiks        = atlikušaisLaiks(izsole.beigas)
  const faze         = getIzsoleFaze(izsole)
  const solis        = getSolis(izsole.sakumcena)

  const reģistrētiesDalībai = () => {
    const jauns = { izsolId: izsole.id, epasts: user.epasts, vards: user.vards || user.epasts, ts: Date.now() }
    saveDalibnieki([...getDalibnieki(), jauns])
    setShowDalibaNoteikumi(false)
    onAtjaunot()
  }

  const solit = (summa) => {
    const visaSoljumi = getSolījumi()
    const beigasDate  = new Date(izsole.beigas)
    const diff        = beigasDate - new Date()
    let jaunāsBeigas  = izsole.beigas
    if (diff > 0 && diff < 5 * 60 * 1000) {
      const jaunaBeigas = new Date(beigasDate.getTime() + 5 * 60 * 1000)
      jaunāsBeigas = jaunaBeigas.toISOString()
      const izsoles = getIzsoles().map(iz => iz.id === izsole.id ? { ...iz, beigas: jaunāsBeigas } : iz)
      saveIzsoles(izsoles)
    }
    const jauns = { id: Date.now(), izsolId: izsole.id, summa, epasts: user.epasts, vards: user.vards || user.epasts, talrunis: user.talrunis || "", ts: Date.now() }
    saveSolījumi([...visaSoljumi, jauns])
    setShowSolit(false)
    onAtjaunot()
  }

  const apstiprinatUzvaretaju = (sol) => {
    if (!window.confirm(`Apstiprināt uzvarētāju: ${sol.vards}?`)) return
    const izsoles = getIzsoles().map(iz => iz.id === izsole.id ? { ...iz, statuss: "pabeigta", uzvaretajs: sol } : iz)
    saveIzsoles(izsoles)
    onAtjaunot()
  }

  const dzest = () => {
    if (!window.confirm("Dzēst izsoli?")) return
    saveIzsoles(getIzsoles().filter(iz => iz.id !== izsole.id))
    onAtjaunot()
  }

  const fazeBadge = () => {
    if (faze === "gaida")     return <span style={{ background: "#0a1a2a", color: T.blue,   padding: "2px 8px", borderRadius: 12, fontSize: 11, marginLeft: 6, border: `1px solid ${T.blueDark}` }}>⏳ {lidzSakumam(izsole.sakums)}</span>
    if (faze === "beigusies") return <span style={{ background: T.inner,  color: T.textDim, padding: "2px 8px", borderRadius: 12, fontSize: 11, marginLeft: 6, border: `1px solid ${T.border}` }}>Beigusies</span>
    return <span style={{ background: "#0a2a0a", color: T.accent, padding: "2px 8px", borderRadius: 12, fontSize: 11, marginLeft: 6, border: `1px solid ${T.border}` }}>🟢 Aktīva</span>
  }

  const analīzeData = izsole.analīze
  const sortimenti  = analīzeData?.sortimenti || {}

  const isBeigusiesVaiPabeigta = faze === "beigusies" || izsole.statuss === "pabeigta"

  return (
    <>
      {showSolit           && <SolitModal     izsole={izsole} user={user} onSolit={solit} onAtcelt={() => setShowSolit(false)} />}
      {showDalibaNoteikumi && <NoteikumiModal veids="daliba"  onPiekritu={reģistrētiesDalībai} onAtcelt={() => setShowDalibaNoteikumi(false)} />}

      <div style={{ background: T.card, border: `2px solid ${faze === "aktiva" ? T.orange : T.border}`, borderRadius: 10, padding: 20, boxShadow: "0 2px 12px rgba(0,0,0,0.3)" }}>

        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 4, alignItems: "center" }}>
            <span style={{ background: "#1a0f00", color: T.orange, padding: "2px 8px", borderRadius: 12, fontSize: 11, fontWeight: "bold", border: `1px solid ${T.orange}33` }}>🏷 Izsole</span>
            {fazeBadge()}
            {izsole.publiska === false && <span style={{ background: "#0a0a1a", color: "#9fa8da", padding: "2px 8px", borderRadius: 12, fontSize: 11, marginLeft: 4, border: "1px solid #3949ab33" }}>🔒 Privāta</span>}
          </div>
          <div style={{ textAlign: "right", fontSize: 12, color: T.textDim }}>
            <div>{izsole.datums}</div>
            {faze === "aktiva" && <div style={{ color: T.orange, fontWeight: "bold" }}>⏱ {laiks.teksts}</div>}
          </div>
        </div>

        <h3 style={{ margin: "0 0 6px", color: T.accent, fontSize: 16 }}>{izsole.nosaukums}</h3>

        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 8, fontSize: 12, color: T.textMuted }}>
          {izsole.novads && <span>📍 {izsole.novads}</span>}
          {izsole.kadastrs && (
            <a href={`https://www.lvmgeo.lv/kartes?cadastre=${izsole.kadastrs}`} target="_blank" rel="noreferrer"
              style={{ color: T.blue, textDecoration: "none", fontSize: 12 }}>
              🗺 {izsole.kadastrs}
            </a>
          )}
          {izsole.pdfNosaukums && izsole.pdfBase64 && (
            <a href={izsole.pdfBase64} download={izsole.pdfNosaukums}
              style={{ color: T.orange, textDecoration: "none", fontSize: 12 }}>
              📄 {izsole.pdfNosaukums} ⬇
            </a>
          )}
          {izsole.pdfNosaukums && !izsole.pdfBase64 && (
            <span style={{ color: T.orange }}>📄 {izsole.pdfNosaukums}</span>
          )}
        </div>

        {/* Datumi */}
        <div style={{ display: "flex", gap: 16, marginBottom: 10, fontSize: 12, color: T.textMuted }}>
          {izsole.sakums && <span>Sākas: <b style={{ color: T.textSec }}>{new Date(izsole.sakums).toLocaleDateString("lv-LV")}</b></span>}
          <span>Beidzas: <b style={{ color: T.textSec }}>{new Date(izsole.beigas).toLocaleDateString("lv-LV")}</b></span>
        </div>

        <p style={{ margin: "0 0 12px", fontSize: 13, color: T.textSec, lineHeight: 1.5 }}>{izsole.apraksts}</p>

        {/* Foto */}
        {izsole.fotos?.length > 0 && (
          <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
            {izsole.fotos.map((f, i) => (
              <img key={i} src={f.data} alt={f.nosaukums} style={{ width: 90, height: 68, objectFit: "cover", borderRadius: 6, border: `1px solid ${T.border}` }} />
            ))}
          </div>
        )}

        {/* Aprēķini */}
        {analīzeData && analīzeData.tips === "dastojums" && (
          <div style={{ marginBottom: 12 }}>
            <button onClick={() => setShowAnalīze(v => !v)}
              style={{ padding: "5px 12px", background: T.inner, border: `1px solid ${T.accent}`, borderRadius: 4, cursor: "pointer", fontSize: 12, color: T.accent }}>
              {showAnalīze ? "▲ Slēpt aprēķinus" : "▼ Rādīt sortimentu aprēķinus"}
            </button>
            {showAnalīze && (
              <div style={{ marginTop: 8, padding: 12, background: T.deep, borderRadius: 6, border: `1px solid ${T.border}` }}>
                <div style={{ fontSize: 12, fontWeight: "bold", color: T.accent, marginBottom: 6 }}>Kopējā krāja: {analīzeData.kopKub?.toFixed(1)} m³</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {Object.keys(sortimenti).filter(k => sortimenti[k] > 0.1).map(k => (
                    <span key={k} style={{ background: T.inner, border: `1px solid ${T.border}`, borderRadius: 4, padding: "3px 8px", fontSize: 11, color: T.textSec }}>
                      {SORT_NOSAUKUMI[k]}: {sortimenti[k].toFixed(1)} m³
                    </span>
                  ))}
                </div>
                <div style={{ fontSize: 11, color: T.textDim, marginTop: 6 }}>* Aprēķinu precizitāte atkarīga no inventarizācijas datuma</div>
              </div>
            )}
          </div>
        )}

        {/* Cenu bloki */}
        <div style={{ display: "flex", gap: 10, marginBottom: 14, flexWrap: "wrap" }}>
          <div style={{ background: "#0a1f0a", borderRadius: 6, padding: "8px 14px", flex: 1, border: `1px solid ${T.border}` }}>
            <div style={{ fontSize: 10, color: T.textDim, textTransform: "uppercase", letterSpacing: "0.05em" }}>Sākumcena</div>
            <div style={{ fontSize: 20, fontWeight: "bold", color: T.accent }}>{izsole.sakumcena?.toLocaleString()} €</div>
            <div style={{ fontSize: 11, color: T.textDim }}>Solis: {solis} €</div>
          </div>
          <div style={{ background: "#1a0f00", borderRadius: 6, padding: "8px 14px", flex: 1, border: `1px solid ${T.orange}33` }}>
            <div style={{ fontSize: 10, color: T.textDim, textTransform: "uppercase", letterSpacing: "0.05em" }}>Lielākais solījums</div>
            <div style={{ fontSize: 20, fontWeight: "bold", color: T.orange }}>{lielakais?.toLocaleString()} €</div>
            <div style={{ fontSize: 11, color: T.textDim }}>{soljumi.length} solījum{soljumi.length === 1 ? "s" : "i"} · {dalibnieki.length} dalībnieki</div>
          </div>
          {manamsPedjais && !irAutors && (
            <div style={{ background: "#0a0a1a", borderRadius: 6, padding: "8px 14px", flex: 1, border: "1px solid #1e2a5a" }}>
              <div style={{ fontSize: 10, color: T.textDim, textTransform: "uppercase", letterSpacing: "0.05em" }}>Mans solījums</div>
              <div style={{ fontSize: 20, fontWeight: "bold", color: T.blue }}>{manamsPedjais?.toLocaleString()} €</div>
              {manamsPedjais >= lielakais
                ? <div style={{ fontSize: 11, color: T.accent }}>🥇 Vadībā!</div>
                : <div style={{ fontSize: 11, color: T.error }}>Pārsolīts — min. {(lielakais + solis).toLocaleString()} €</div>
              }
            </div>
          )}
        </div>

        {/* Autors — redzams tikai pēc beigām vai autoram */}
        {(isBeigusiesVaiPabeigta || irAutors) && (
          <div style={{ fontSize: 12, color: T.textSec, marginBottom: 10, padding: "8px 12px", background: T.inner, borderRadius: 6, border: `1px solid ${T.border}` }}>
            <b>{izsole.autors}</b>
            {izsole.autorsTalrunis && <span> · 📞 {izsole.autorsTalrunis}</span>}
            {izsole.autorsEpasts   && <span> · ✉️ {izsole.autorsEpasts}</span>}
          </div>
        )}

        {/* Īpašnieka solījumu saraksts */}
        {irAutors && soljumi.length > 0 && (
          <div style={{ marginBottom: 12 }}>
            <button onClick={() => setShowSolījumi(v => !v)}
              style={{ padding: "6px 14px", background: T.blueDark, color: "white", border: "none", borderRadius: 4, cursor: "pointer", fontSize: 12 }}>
              {showSolījumi ? "▲ Slēpt" : "▼ Rādīt"} solījumus ({soljumi.length})
            </button>
            {showSolījumi && (
              <div style={{ marginTop: 8, border: `1px solid ${T.border}`, borderRadius: 6, overflow: "hidden" }}>
                {soljumi.map((s, i) => (
                  <div key={s.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 12px", background: i === 0 ? "#0a2a0a" : i % 2 === 0 ? T.inner : T.deep, borderBottom: `1px solid ${T.border}` }}>
                    <div>
                      <span style={{ fontWeight: "bold", color: i === 0 ? T.accent : T.textSec }}>{i + 1}. {s.vards}</span>
                      {s.talrunis && <span style={{ fontSize: 11, color: T.textDim, marginLeft: 8 }}>📞 {s.talrunis}</span>}
                      <span style={{ fontSize: 11, color: T.textDim, marginLeft: 8 }}>✉️ {s.epasts}</span>
                    </div>
                    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                      <span style={{ fontWeight: "bold", color: i === 0 ? T.accent : T.textSec, fontSize: 15 }}>{s.summa?.toLocaleString()} €</span>
                      {i === 0 && faze === "beigusies" && izsole.statuss !== "pabeigta" && (
                        <button onClick={() => apstiprinatUzvaretaju(s)}
                          style={{ padding: "4px 10px", background: "#225522", color: "white", border: "none", borderRadius: 4, cursor: "pointer", fontSize: 11 }}>
                          ✓ Apstiprināt
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Uzvarētājs */}
        {izsole.statuss === "pabeigta" && izsole.uzvaretajs && (
          <div style={{ background: "#0a2a15", border: `2px solid ${T.accent}`, borderRadius: 6, padding: "10px 14px", marginBottom: 12, fontSize: 13 }}>
            🏆 <b style={{ color: T.accent }}>Uzvarētājs:</b> <span style={{ color: T.text }}>{izsole.uzvaretajs.vards}</span>
            {(irAutors || user?.epasts === izsole.uzvaretajs.epasts) && (
              <div style={{ marginTop: 6, fontSize: 12, color: T.textSec }}>
                📞 {izsole.uzvaretajs.talrunis || "—"} · ✉️ {izsole.uzvaretajs.epasts}
                <div style={{ marginTop: 4, color: T.accent }}>Sazinies un vienojies par darījuma nosacījumiem.</div>
              </div>
            )}
          </div>
        )}

        {/* Darbību pogas */}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {user && !irAutors && faze === "gaida" && !irDalibnieks && (
            <button onClick={() => setShowDalibaNoteikumi(true)}
              style={{ padding: "8px 20px", background: T.blueDark, color: "white", border: "none", borderRadius: 6, cursor: "pointer", fontWeight: "bold" }}>
              ✋ Pieteikties dalībai
            </button>
          )}
          {user && !irAutors && faze === "gaida" && irDalibnieks && (
            <div style={{ padding: "8px 16px", background: "#0a2a0a", border: `1px solid ${T.accent}`, borderRadius: 6, fontSize: 13, color: T.accent }}>
              ✓ Dalība apstiprināta — gaidām izsoles sākumu
            </div>
          )}
          {user && !irAutors && faze === "aktiva" && !irDalibnieks && (
            <button onClick={() => setShowDalibaNoteikumi(true)}
              style={{ padding: "8px 20px", background: T.blueDark, color: "white", border: "none", borderRadius: 6, cursor: "pointer" }}>
              ✋ Pieteikties un solīt
            </button>
          )}
          {user && !irAutors && faze === "aktiva" && irDalibnieks && (
            <button onClick={() => setShowSolit(true)}
              style={{ padding: "8px 20px", background: T.orange, color: "white", border: "none", borderRadius: 6, cursor: "pointer", fontWeight: "bold" }}>
              💰 Solīt (min. {(lielakais + solis).toLocaleString()} €)
            </button>
          )}
          {!user && faze !== "beigusies" && izsole.statuss !== "pabeigta" && (
            <div style={{ fontSize: 12, color: T.textDim, padding: "8px 0" }}>🔒 Piesakies lai piedalītos izsolē</div>
          )}
          {irAutors && (
            <button onClick={dzest}
              style={{ padding: "6px 14px", background: "#c62828", color: "white", border: "none", borderRadius: 4, cursor: "pointer", fontSize: 12 }}>
              🗑 Dzēst izsoli
            </button>
          )}
        </div>
      </div>
    </>
  )
}

// ── Novads autocomplete ───────────────────────────────────────────────────────
function NovadsAutocomplete({ onPievienot }) {
  const [ievade,       setIevade]      = useState("")
  const [piedavajumi,  setPiedavajumi] = useState([])

  const handleChange = (val) => {
    setIevade(val)
    if (val.length < 1) { setPiedavajumi([]); return }
    setPiedavajumi(NOVADI.filter(n => n.toLowerCase().startsWith(val.toLowerCase())).slice(0, 6))
  }
  const izveleties = (novads) => { onPievienot(novads); setIevade(""); setPiedavajumi([]) }

  return (
    <div style={{ position: "relative" }}>
      <input value={ievade} onChange={e => handleChange(e.target.value)} placeholder="Raksti novada nosaukumu..."
        style={inp} />
      {piedavajumi.length > 0 && (
        <div style={{ position: "absolute", top: "100%", left: 0, right: 0, background: T.inner, border: `1px solid ${T.border}`, borderRadius: 4, zIndex: 100, boxShadow: "0 4px 16px rgba(0,0,0,0.4)" }}>
          {piedavajumi.map(n => (
            <div key={n} onClick={() => izveleties(n)}
              style={{ padding: "8px 12px", cursor: "pointer", fontSize: 13, borderBottom: `1px solid ${T.border}`, color: T.textSec }}
              onMouseEnter={e => e.currentTarget.style.background = "#225522"}
              onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
              {n}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Sludinājuma forma ─────────────────────────────────────────────────────────
function SludinajumsForm({ user, onSaglabat, onAtcelt, esosais }) {
  const [virsraksts,       setVirsraksts]       = useState(esosais?.virsraksts || "")
  const [apraksts,         setApraksts]         = useState(esosais?.apraksts   || "")
  const [darbiba,          setDarbiba]          = useState(esosais?.darbiba || user?.darbiba || DARBIBAS_VEIDI[0])
  const [cena,             setCena]             = useState(esosais?.cena        || "")
  const [cenaPecVienosanas,setCenaPecVienosanas]= useState(esosais?.cenaPecVienosanas ?? false)
  const [novadi,           setNovadi]           = useState(esosais?.novadi || (user?.novads ? [user.novads] : []))
  const [kludas,           setKludas]           = useState("")

  const pievienotNovadu = (n) => { if (!novadi.includes(n)) setNovadi([...novadi, n]) }
  const nonemtNovadu    = (n) => setNovadi(novadi.filter(x => x !== n))

  const saglabat = () => {
    if (!virsraksts.trim())   return setKludas("Ievadi virsrakstu!")
    if (!apraksts.trim())     return setKludas("Ievadi aprakstu!")
    if (novadi.length === 0)  return setKludas("Izvēlies vismaz vienu novadu!")
    if (!cenaPecVienosanas && !cena) return setKludas("Ievadi cenu vai atzīmē 'Pēc vienošanās'!")
    const sl = {
      id: esosais?.id || Date.now(), virsraksts, apraksts, darbiba, cena, cenaPecVienosanas, novadi,
      autors: user?.vards || "—", uznemums: user?.uznemums || "", epasts: user?.epasts || "", talrunis: user?.talrunis || "",
      datums: esosais?.datums || new Date().toLocaleDateString("lv-LV"),
      beigas: esosais?.beigas || (() => { const d = new Date(); d.setMonth(d.getMonth() + 1); return d.toLocaleDateString("lv-LV") })()
    }
    onSaglabat(sl)
  }

  const labelSt = { fontSize: 11, fontWeight: "bold", display: "block", marginBottom: 3, color: T.textMuted }

  return (
    <div style={{ background: T.card, border: `2px solid ${T.accent}`, borderRadius: 8, padding: 20, marginBottom: 16 }}>
      <h3 style={{ color: T.accent, marginTop: 0 }}>{esosais ? "✏️ Rediģēt sludinājumu" : "➕ Jauns sludinājums"}</h3>
      {kludas && <div style={{ background: T.errorBg, color: T.error, padding: 8, borderRadius: 4, marginBottom: 10, fontSize: 12, border: `1px solid ${T.error}33` }}>{kludas}</div>}

      <div style={{ marginBottom: 10 }}>
        <label style={labelSt}>Virsraksts:</label>
        <input value={virsraksts} onChange={e => setVirsraksts(e.target.value)} placeholder="piem. Piedāvāju jaunaudžu kopšanas pakalpojumus"
          style={inp} />
      </div>
      <div style={{ marginBottom: 10 }}>
        <label style={labelSt}>Darbības veids:</label>
        <select value={darbiba} onChange={e => setDarbiba(e.target.value)}
          style={{ ...inp }}>
          {DARBIBAS_VEIDI.map(d => <option key={d}>{d}</option>)}
        </select>
      </div>
      <div style={{ marginBottom: 10 }}>
        <label style={labelSt}>Apraksts:</label>
        <textarea value={apraksts} onChange={e => setApraksts(e.target.value)} rows={4} placeholder="Apraksti ko piedāvā..."
          style={{ ...inp, resize: "vertical" }} />
      </div>
      <div style={{ marginBottom: 10 }}>
        <label style={labelSt}>Darbības novadi:</label>
        <NovadsAutocomplete onPievienot={pievienotNovadu} />
        {novadi.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 6 }}>
            {novadi.map(n => (
              <span key={n} style={{ background: T.inner, border: `1px solid ${T.accent}`, borderRadius: 4, padding: "3px 8px", fontSize: 11, display: "flex", alignItems: "center", gap: 4, color: T.textSec }}>
                {n}
                <button onClick={() => nonemtNovadu(n)} style={{ background: "none", border: "none", color: T.error, cursor: "pointer", fontWeight: "bold", padding: 0, fontSize: 12 }}>×</button>
              </span>
            ))}
          </div>
        )}
      </div>
      <div style={{ marginBottom: 16 }}>
        <label style={labelSt}>Cena:</label>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <input type="number" value={cena} onChange={e => setCena(e.target.value)} disabled={cenaPecVienosanas}
            placeholder="€/ha vai €/m³" style={{ ...inp, width: 140, opacity: cenaPecVienosanas ? 0.5 : 1 }} />
          <label style={{ fontSize: 12, display: "flex", alignItems: "center", gap: 4, color: T.textSec }}>
            <input type="checkbox" checked={cenaPecVienosanas} onChange={e => setCenaPecVienosanas(e.target.checked)} />
            Pēc vienošanās
          </label>
        </div>
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <button onClick={saglabat} style={{ padding: "8px 20px", background: "#225522", color: "white", border: "none", borderRadius: 4, cursor: "pointer", fontWeight: "bold" }}>💾 Saglabāt</button>
        {onAtcelt && <button onClick={onAtcelt} style={{ padding: "8px 16px", background: "#444", color: "white", border: "none", borderRadius: 4, cursor: "pointer" }}>Atcelt</button>}
      </div>
    </div>
  )
}

// ── GALVENAIS KOMPONENTS ──────────────────────────────────────────────────────
export default function SludinajumiPage({ user, onBack }) {
  const [sludinajumi,    setSludinajumi]    = useState(() => { try { return JSON.parse(localStorage.getItem("mt_sludinajumi") || "[]") } catch { return [] } })
  const [izsoles,        setIzsoles]        = useState(getIzsoles())
  const [aktīvāCilne,   setAktīvāCilne]   = useState("sludinajumi")
  const [showForm,       setShowForm]       = useState(false)
  const [showIzsoleForm, setShowIzsoleForm] = useState(false)
  const [rediget,        setRediget]        = useState(null)
  const [filtrsNovads,   setFiltrsNovads]   = useState("")
  const [filtrsDarbiba,  setFiltrsDarbiba]  = useState("")

  useEffect(() => {
    const interval = setInterval(() => setIzsoles(getIzsoles()), 30000)
    return () => clearInterval(interval)
  }, [])

  const atjaunotIzsoles = () => setIzsoles(getIzsoles())

  const saglabatSludinajumu = (sl) => {
    const jaunie = rediget ? sludinajumi.map(s => s.id === sl.id ? sl : s) : [...sludinajumi, sl]
    setSludinajumi(jaunie)
    localStorage.setItem("mt_sludinajumi", JSON.stringify(jaunie))
    setShowForm(false); setRediget(null)
  }

  const dzestSludinajumu = (id) => {
    if (!window.confirm("Dzēst sludinājumu?")) return
    const jaunie = sludinajumi.filter(s => s.id !== id)
    setSludinajumi(jaunie)
    localStorage.setItem("mt_sludinajumi", JSON.stringify(jaunie))
  }

  const saglabatIzsoli = (iz) => {
    const jaunas = [...getIzsoles(), iz]
    saveIzsoles(jaunas); setIzsoles(jaunas); setShowIzsoleForm(false)
  }

  const filtreti = sludinajumi.filter(s => {
    if (filtrsNovads   && !s.novadi?.includes(filtrsNovads)) return false
    if (filtrsDarbiba  && s.darbiba !== filtrsDarbiba)       return false
    return true
  }).sort((a, b) => b.id - a.id)

  const mansSludinajums = user ? sludinajumi.find(s => s.epasts === user.epasts) : null

  // LABOT: izmanto getIzsoleFaze() nevis tikai statuss lauku
  const aktīvasIzsoles  = izsoles.filter(iz => iz.statuss !== "pabeigta" && getIzsoleFaze(iz) !== "beigusies")
  const beigušasIzsoles = izsoles.filter(iz => iz.statuss === "pabeigta"  || getIzsoleFaze(iz) === "beigusies")

  const tabSt = (id, krasa) => ({
    padding: "9px 16px",
    background: aktīvāCilne === id ? krasa : T.inner,
    color: aktīvāCilne === id ? "white" : T.textMuted,
    border: `2px solid ${krasa}`,
    cursor: "pointer",
    fontWeight: aktīvāCilne === id ? "bold" : "normal",
    borderRadius: 6,
    fontSize: 13,
    minHeight: 44,
    flex: 1,
  })

  const selSt = { ...inp, fontSize: 12, width: "auto" }

  return (
    <div style={{ minHeight: "100vh", background: T.bg, color: T.text, fontFamily: F.family }}>
      <style>{spinnerCSS}</style>

      {/* Sticky header */}
      <div style={{
        background: DS.glass, borderBottom: `1px solid ${T.border}`,
        backdropFilter: "blur(8px)", padding: "0 20px", height: 52,
        display: "flex", alignItems: "center", gap: 12,
        position: "sticky", top: 0, zIndex: 10,
      }}>
        {onBack && <button onClick={onBack} style={{ background: "transparent", border: "none", color: T.accent, fontSize: 22, cursor: "pointer", minWidth: 36, minHeight: 44 }}>←</button>}
        <div style={{ flex: 1 }}>
          <div style={{ color: T.accent, fontSize: F.md, fontWeight: F.weightBold }}>📢 Sludinājumi & Izsoles</div>
          <div style={{ color: T.textDim, fontSize: F.xs }}>Meža īpašumi un cirsmu tirdzniecība</div>
        </div>
      </div>

      <div style={{ maxWidth: 900, margin: "0 auto", padding: "20px 20px 60px" }}>

        {/* Cilnes */}
        <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
          <button style={tabSt("sludinajumi",   T.accent)}   onClick={() => setAktīvāCilne("sludinajumi")}>
            📢 Sludinājumi ({sludinajumi.length})
          </button>
          <button style={tabSt("izsoles",       T.orange)}   onClick={() => setAktīvāCilne("izsoles")}>
            🏷 Izsoles {aktīvasIzsoles.length > 0 ? `(${aktīvasIzsoles.length})` : ""}
          </button>
          <button style={tabSt("beigtasizsoles",T.textDim)}  onClick={() => setAktīvāCilne("beigtasizsoles")}>
            ✓ Pabeigtas {beigušasIzsoles.length > 0 ? `(${beigušasIzsoles.length})` : ""}
          </button>
        </div>

        {/* ── SLUDINĀJUMI ── */}
        {aktīvāCilne === "sludinajumi" && (
          <>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, flexWrap: "wrap", gap: 8 }}>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <select value={filtrsDarbiba} onChange={e => setFiltrsDarbiba(e.target.value)} style={selSt}>
                  <option value="">Visi darbības veidi</option>
                  {DARBIBAS_VEIDI.map(d => <option key={d}>{d}</option>)}
                </select>
                <select value={filtrsNovads} onChange={e => setFiltrsNovads(e.target.value)} style={selSt}>
                  <option value="">Visi novadi</option>
                  {NOVADI.map(n => <option key={n}>{n}</option>)}
                </select>
                {(filtrsNovads || filtrsDarbiba) && (
                  <button onClick={() => { setFiltrsNovads(""); setFiltrsDarbiba("") }}
                    style={{ padding: "6px 12px", background: "#444", color: T.textSec, border: "none", borderRadius: 4, cursor: "pointer", fontSize: 12 }}>
                    ✕ Notīrīt
                  </button>
                )}
              </div>
              {user && !mansSludinajums && !showForm && (
                <button onClick={() => setShowForm(true)}
                  style={{ padding: "8px 16px", background: "#225522", color: "white", border: "none", borderRadius: 4, cursor: "pointer", fontWeight: "bold" }}>
                  ➕ Jauns sludinājums
                </button>
              )}
            </div>

            {!user && (
              <div style={{ background: T.warnBg, border: `1px solid ${T.warn}`, borderRadius: 6, padding: 12, marginBottom: 16, fontSize: 13, color: T.warn }}>
                ℹ️ Lai ievietotu sludinājumu — <b>abonē Meža tirgu</b> vai iegādājies par <b>6.99 €/mēnesī</b>
              </div>
            )}

            {showForm  && <SludinajumsForm user={user} onSaglabat={saglabatSludinajumu} onAtcelt={() => setShowForm(false)} />}
            {rediget   && <SludinajumsForm user={user} esosais={rediget} onSaglabat={saglabatSludinajumu} onAtcelt={() => setRediget(null)} />}

            {filtreti.length === 0
              ? <div style={{ padding: 40, textAlign: "center", color: T.textDim, border: `2px dashed ${T.border}`, borderRadius: 8 }}>Nav sludinājumu</div>
              : (
                <div style={{ display: "grid", gap: 12 }}>
                  {filtreti.map(s => (
                    <div key={s.id} style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16, boxShadow: "0 1px 4px rgba(0,0,0,0.3)" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                        <div>
                          <h3 style={{ margin: "0 0 4px", color: T.accent, fontSize: 15 }}>{s.virsraksts}</h3>
                          <span style={{ background: "#0a2a0a", color: T.accent, padding: "2px 8px", borderRadius: 12, fontSize: 11, fontWeight: "bold", border: `1px solid ${T.border}` }}>{s.darbiba}</span>
                        </div>
                        <div style={{ textAlign: "right", fontSize: 12, color: T.textDim }}>
                          <div>{s.datums}</div>
                          <div style={{ color: T.accent, fontWeight: "bold", fontSize: 14, marginTop: 4 }}>{s.cenaPecVienosanas ? "Pēc vienošanās" : `${s.cena} €`}</div>
                        </div>
                      </div>
                      <p style={{ margin: "0 0 8px", fontSize: 13, color: T.textSec, lineHeight: 1.5 }}>{s.apraksts}</p>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 8 }}>
                        {s.novadi?.map(n => (
                          <span key={n} style={{ background: T.deep, border: `1px solid ${T.border}`, borderRadius: 4, padding: "2px 6px", fontSize: 11, color: T.textMuted }}>📍 {n}</span>
                        ))}
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: `1px solid ${T.border}`, paddingTop: 8, marginTop: 4 }}>
                        <div style={{ fontSize: 12, color: T.textMuted }}>
                          <b style={{ color: T.textSec }}>{s.uznemums || s.autors}</b>
                          {s.talrunis && <span> · 📞 {s.talrunis}</span>}
                          {s.epasts   && <span> · ✉️ {s.epasts}</span>}
                        </div>
                        {user && user.epasts === s.epasts && (
                          <div style={{ display: "flex", gap: 6 }}>
                            <button onClick={() => setRediget(s)} style={{ padding: "4px 10px", background: T.blueDark, color: "white", border: "none", borderRadius: 4, cursor: "pointer", fontSize: 11 }}>✏️ Rediģēt</button>
                            <button onClick={() => dzestSludinajumu(s.id)} style={{ padding: "4px 10px", background: "#c62828", color: "white", border: "none", borderRadius: 4, cursor: "pointer", fontSize: 11 }}>🗑 Dzēst</button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )
            }
          </>
        )}

        {/* ── IZSOLES ── */}
        {aktīvāCilne === "izsoles" && (
          <>
            <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 12 }}>
              {user && !showIzsoleForm && (
                <button onClick={() => setShowIzsoleForm(true)}
                  style={{ padding: "8px 18px", background: T.orange, color: "white", border: "none", borderRadius: 6, cursor: "pointer", fontWeight: "bold" }}>
                  🏷 Izlikt izsolē
                </button>
              )}
            </div>
            {showIzsoleForm && <IzsoleForm user={user} onSaglabat={saglabatIzsoli} onAtcelt={() => setShowIzsoleForm(false)} />}
            {aktīvasIzsoles.length === 0
              ? <div style={{ padding: 40, textAlign: "center", color: T.textDim, border: `2px dashed ${T.border}`, borderRadius: 8 }}>Nav aktīvu izsolu</div>
              : (
                <div style={{ display: "grid", gap: 16 }}>
                  {aktīvasIzsoles.sort((a, b) => new Date(a.beigas) - new Date(b.beigas)).map(iz => (
                    <IzsoleKarte key={iz.id} izsole={iz} user={user} onAtjaunot={atjaunotIzsoles} />
                  ))}
                </div>
              )
            }
          </>
        )}

        {/* ── PABEIGTAS ── */}
        {aktīvāCilne === "beigtasizsoles" && (
          <>
            {beigušasIzsoles.length === 0
              ? <div style={{ padding: 40, textAlign: "center", color: T.textDim, border: `2px dashed ${T.border}`, borderRadius: 8 }}>Nav pabeigtu izsolu</div>
              : (
                <div style={{ display: "grid", gap: 16 }}>
                  {beigušasIzsoles.sort((a, b) => b.id - a.id).map(iz => (
                    <IzsoleKarte key={iz.id} izsole={iz} user={user} onAtjaunot={atjaunotIzsoles} />
                  ))}
                </div>
              )
            }
          </>
        )}

      </div>
    </div>
  )
}
