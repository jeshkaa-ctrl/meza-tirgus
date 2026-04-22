import React, { useState, useEffect } from "react"
import * as pdfjsLib from "pdfjs-dist"
import { NOVADI } from "./novadi"
import { DARBIBAS_VEIDI } from "./RegModal"
import { parseMezvertePDF } from "./DastojumsPDFKalkulators"
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL("pdfjs-dist/build/pdf.worker.min.mjs", import.meta.url).toString()

// ── localStorage helpers ──────────────────────────────────────────────────────
const getIzsoles = () => { try { return JSON.parse(localStorage.getItem("mt_izsoles") || "[]") } catch { return [] } }
const saveIzsoles = (d) => { try { localStorage.setItem("mt_izsoles", JSON.stringify(d)) } catch {} }
const getSolījumi = () => { try { return JSON.parse(localStorage.getItem("mt_soljumi") || "[]") } catch { return [] } }
const saveSolījumi = (d) => { try { localStorage.setItem("mt_soljumi", JSON.stringify(d)) } catch {} }

// ── Laika formatēšana ─────────────────────────────────────────────────────────
const atlikusiisLaiks = (beigas) => {
  const diff = new Date(beigas) - new Date()
  if (diff <= 0) return { teksts: "Izsole beigusies", beigusies: true }
  const d = Math.floor(diff / 86400000)
  const h = Math.floor((diff % 86400000) / 3600000)
  const m = Math.floor((diff % 3600000) / 60000)
  if (d > 0) return { teksts: `${d}d ${h}h atlikuši`, beigusies: false }
  if (h > 0) return { teksts: `${h}h ${m}min atlikuši`, beigusies: false }
  return { teksts: `${m} min atlikuši`, beigusies: false }
}

// ── Noteikumu modālis ─────────────────────────────────────────────────────────
function NoteikumiModal({ veids, onPiekritu, onAtcelt }) {
  const isIzlicejs = veids === "izlicejs"
  return (
    <div style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", background: "rgba(0,0,0,0.6)", zIndex: 2000, display: "flex", alignItems: "center", justifyContent: "center", padding: 16, boxSizing: "border-box" }}>
      <div style={{ background: "white", borderRadius: 10, maxWidth: 520, width: "100%", maxHeight: "85vh", overflow: "auto", padding: 28, boxShadow: "0 8px 32px rgba(0,0,0,0.3)" }}>
        <h3 style={{ color: "#225522", marginTop: 0, fontSize: 16 }}>
          {isIzlicejs ? "📋 Izsoles izlikšanas noteikumi" : "📋 Solīšanas noteikumi"}
        </h3>

        {isIzlicejs ? (
          <div style={{ fontSize: 13, color: "#333", lineHeight: 1.7 }}>
            <p><b>Pirms izlikšanas apliecini:</b></p>
            <ul style={{ paddingLeft: 20, margin: "8px 0" }}>
              <li>Esmu tiesīgs pārdot vai iznomāt šo objektu</li>
              <li>Visas norādītās ziņas ir patiesas un precīzas</li>
              <li>Apņemos noslēgt darījumu ar augstākā solījuma iesniedzēju</li>
              <li>Saprotu, ka atkāpšanās no darījuma bez pamatota iemesla var ietekmēt manu reputāciju platformā</li>
            </ul>
            <p><b>Atbildības brīdinājums:</b></p>
            <div style={{ background: "#fff8e1", border: "1px solid #f9a825", borderRadius: 6, padding: "10px 14px", fontSize: 12 }}>
              ⚠️ Meža tirgus platforma ir starpnieks un neuzņemas atbildību par darījuma izpildi. Darījums notiek tikai starp pārdevēju un pircēju. Platformai ir tiesības bloķēt lietotāju kontu ja tiek konstatēta ļaunprātīga rīcība.
            </div>
          </div>
        ) : (
          <div style={{ fontSize: 13, color: "#333", lineHeight: 1.7 }}>
            <p><b>Pirms solīšanas apliecini:</b></p>
            <ul style={{ paddingLeft: 20, margin: "8px 0" }}>
              <li>Mans solījums ir nopietns un finansiāli pamatots</li>
              <li>Saprotu, ka uzvarot esmu morāli atbildīgs pabeigt darījumu</li>
              <li>Esmu iepazinies ar izsoles aprakstu un objekta informāciju</li>
              <li>Atkāpšanās no uzvarētā solījuma bez pamatota iemesla tiks atzīmēta manā profilā</li>
            </ul>
            <p><b>Solīšanas principi:</b></p>
            <ul style={{ paddingLeft: 20, margin: "8px 0" }}>
              <li>Tu redzi savu pēdējo solījumu un lielāko pašreizējo solījumu</li>
              <li>Citu solītāju identitāte ir slēpta līdz izsoles beigām</li>
              <li>Izsoles beigu brīdī lielākais solītājs uzvar</li>
            </ul>
            <div style={{ background: "#fff8e1", border: "1px solid #f9a825", borderRadius: 6, padding: "10px 14px", fontSize: 12 }}>
              ⚠️ Meža tirgus platforma ir starpnieks un neuzņemas atbildību par darījuma izpildi. Darījums notiek tikai starp pārdevēju un pircēju.
            </div>
          </div>
        )}

        <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
          <button onClick={onPiekritu} style={{ flex: 1, padding: "10px 0", background: "#225522", color: "white", border: "none", borderRadius: 6, cursor: "pointer", fontWeight: "bold", fontSize: 14 }}>
            ✓ Piekrītu noteikumiem
          </button>
          <button onClick={onAtcelt} style={{ padding: "10px 16px", background: "#888", color: "white", border: "none", borderRadius: 6, cursor: "pointer" }}>
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
          const page = await pdf.getPage(i)
          const content = await page.getTextContent()
          txt += content.items.map(item => item.str).join(" ") + "\n"
        }
        resolve(txt)
      } catch(err) { reject(err) }
    }
    reader.readAsArrayBuffer(file)
  })
}

// ── Atpazīst PDF tipu ─────────────────────────────────────────────────────────
function atpazitPDF(txt) {
  if (txt.includes("Mežvērte") || txt.includes("mezverte") || txt.includes("MEŽVĒRTE") || txt.includes("CIRSMAS NOVĒRTĒJUMS") || txt.includes("Lietkoksne")) return "dastojums"
  if (txt.includes("Meža inventarizācija") || txt.includes("Nogabala apraksts") || txt.includes("VMD")) return "inventarizacija"
  return "nezinams"
}

// ── Parsē Mežvērtes PDF ───────────────────────────────────────────────────────
function parseDastojums(txt) {
  const result = { nogabali: [], kadastrs: "", saimnieciba: "", kopKub: 0, sortimenti: {} }

  const kadMatch = txt.match(/(\d{11})/)
  if (kadMatch) result.kadastrs = kadMatch[1]

  const saimMatch = txt.match(/([A-ZĀČĒĢĪĶĻŅŠŪŽ][a-zāčēģīķļņšūž]+)\s+\d{11}/)
  if (saimMatch) result.saimnieciba = saimMatch[1]

  const nogMatches = [...txt.matchAll(/Nogabals:\s*(\S+)/g)]
  const platibaMatches = [...txt.matchAll(/(\d+[.,]\d+)\s*ha/g)]

  result.nogabali = nogMatches
    .filter(m => m[1] !== "A.Nogabals:" && !/^\d{2,}$/.test(m[1]) && m[1] !== "0")
    .map((m, i) => ({ nr: m[1], platiba: platibaMatches[i]?.[1]?.replace(",", ".") || "" }))

  // Kubatūras rindas
  const kubMatches = [...txt.matchAll(/(\d+[.,]\d+)\s+m3/g)]
  result.kopKub = kubMatches.reduce((s, m) => s + parseFloat(m[1].replace(",", ".")), 0)

  // Sortimenti
 const sortMap = {
    log: ["Resnā", "baļķis", "zāģbaļķis"],
    small: ["Vidējā", "Tievā", "sīkbaļķis"],
    pulp: ["P.malka", "Papīrmalka", "papīrmalka"],
    fire: ["Malka", "malka"],
    chips: ["Atlikumi", "šķelda"],
    veneer: ["Finieris", "finieris"],
    tara: ["Tara", "tara"]
  }
  Object.keys(sortMap).forEach(k => {
    sortMap[k].forEach(kw => {
      const re = new RegExp(kw + ".*?(\\d+[.,]\\d+)\\s*m3")
      const m = txt.match(re)
      if (m) result.sortimenti[k] = (result.sortimenti[k] || 0) + parseFloat(m[1].replace(",", "."))
    })
  })

  return result
}

// ── Parsē inventarizācijas PDF ────────────────────────────────────────────────
function parseInventarizacija(txt) {
  const result = { nogabali: [], kadastrs: "", saimnieciba: "", kopPlatiba: 0 }

  const kadMatch = txt.match(/(\d{11})/)
  if (kadMatch) result.kadastrs = kadMatch[1]

  const saimMatch = txt.match(/Saimniecība:\s*([^\n]+)/)
  if (saimMatch) result.saimnieciba = saimMatch[1].trim().split(" ")[0]

  const nogabaliMatches = [...txt.matchAll(/Nogabals[:\s]+(\w+)[\s\S]*?(\d+[.,]\d+)\s*ha/g)]
  result.nogabali = nogabaliMatches.map(m => ({
    nr: m[1],
    platiba: m[2].replace(",", ".")
  }))

  result.kopPlatiba = result.nogabali.reduce((s, n) => s + parseFloat(n.platiba || 0), 0)

  return result
}

// ── Cenas ─────────────────────────────────────────────────────────────────────
const CENAS = { log: 73, small: 55, veneer: 130, tara: 48, pulp: 50, fire: 38, chips: 12 }
const SORT_NOSAUKUMI = {
  log: "Baļķis", small: "Sīkbaļķis", veneer: "Finieris",
  tara: "Tara", pulp: "Papīrmalka", fire: "Malka", chips: "Šķelda"
}
const IZMAKSAS_DEFOLT = { zaglesana: 18, pievesana: 12 }

// ── GALVENAIS KOMPONENTS ──────────────────────────────────────────────────────
function IzsoleForm({ user, onSaglabat, onAtcelt }) {
  const [solis, setSolis] = useState(1) // 1=forma, 2=analīze, 3=apstiprina
  const [nosaukums, setNosaukums] = useState("")
  const [apraksts, setApraksts] = useState("")
  const [kadastrs, setKadastrs] = useState("")
  const [novads, setNovads] = useState(user?.bazesNovads || "")
  const [sakumcena, setSakumcena] = useState("")
  const [beigas, setBeigas] = useState(() => {
    const d = new Date(); d.setDate(d.getDate() + 14)
    return d.toISOString().split("T")[0]
  })
  const [publiska, setPubliska] = useState(true)
  const [pdfFile, setPdfFile] = useState(null)
  const [pdfTeksts, setPdfTeksts] = useState("")
  const [pdfTips, setPdfTips] = useState(null)
  const [analīze, setAnalīze] = useState(null)
  const [pievienotAprēķinu, setPievienotAprēķinu] = useState(false)
  const [lādē, setLādē] = useState(false)
  const [kludas, setKludas] = useState("")
  const [showNoteikumi, setShowNoteikumi] = useState(false)
  const [izmaksas, setIzmaksas] = useState({ ...IZMAKSAS_DEFOLT })

  const lkmGeoUrl = kadastrs
    ? `https://www.lvmgeo.lv/kartes?cadastre=${kadastrs}`
    : "https://www.lvmgeo.lv/kartes"

  // ── PDF augšupielāde ────────────────────────────────────────────────────────
  const handlePDF = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    setPdfFile(file)
    setLādē(true)
    setAnalīze(null)
    setPdfTips(null)
    try {
      const txt = await lasitPDF(file)
      setPdfTeksts(txt)
     
      const tips = atpazitPDF(txt)
      console.log("PDF tips:", tips)
      setPdfTips(tips)
      if (tips === "dastojums") {
        const raw = parseMezvertePDF(txt)
        
        const rez = { tips, kadastrs: raw.kadastrs, saimnieciba: raw.saimnieciba, nogabali: raw.nogabali, kopKub: raw.kopaKraja, sortimenti: { log: raw.log, small: raw.small, veneer: raw.veneer, tara: raw.tara, pulp: raw.pulp, fire: raw.fire, chips: raw.chips } }
        setAnalīze(rez)
        if (rez.kadastrs && !kadastrs) setKadastrs(rez.kadastrs)
        if (rez.saimnieciba && !apraksts) setApraksts(rez.saimnieciba)
      } else if (tips === "inventarizacija") {
        const rez = parseInventarizacija(txt)
        setAnalīze({ tips, ...rez })
        if (rez.kadastrs && !kadastrs) setKadastrs(rez.kadastrs)
        if (rez.saimnieciba && !nosaukums) setNosaukums(rez.saimnieciba)
      }
    } catch (err) {
      console.error(err)
    }
    setLādē(false)
  }

  // ── Validācija ──────────────────────────────────────────────────────────────
  const validet = () => {
    if (!apraksts.trim()) return setKludas("Ievadi aprakstu!")
    if (!sakumcena || parseFloat(sakumcena) <= 0) return setKludas("Ievadi sākumcenu!")
    setKludas("")
    setShowNoteikumi(true)
  }

  // ── Saglabāšana ─────────────────────────────────────────────────────────────
  const saglabat = () => {
    const krautuves = pievienotAprēķinu && analīze ? (() => {
      const sort = analīze.sortimenti || {}
      return Object.keys(sort).filter(k => sort[k] > 0).reduce((s, k) => {
        s[k] = sort[k]
        return s
      }, {})
    })() : null

    const izsole = {
      id: Date.now(),
      nosaukums: nosaukums || apraksts.slice(0, 50),
      apraksts,
      kadastrs,
      novads,
      sakumcena: parseFloat(sakumcena),
      beigas: new Date(beigas).toISOString(),
      publiska,
      autors: user?.vards || "—",
      autorsEpasts: user?.epasts || "",
      autorsTalrunis: user?.talrunis || "",
      datums: new Date().toLocaleDateString("lv-LV"),
      statuss: "aktiva",
      uzvaretajs: null,
      pdfNosaukums: pdfFile?.name || null,
      analīze: pievienotAprēķinu ? analīze : null,
      krautuves,
    }
    onSaglabat(izsole)
    setShowNoteikumi(false)
  }

  const kopKub = analīze?.kopKub || 0
  const sortimenti = analīze?.sortimenti || {}
  const izmaксasKopa = (izmaksas.zaglesana + izmaksas.pievesana) * kopKub
  const sortVert = Object.keys(sortimenti).reduce((s, k) => s + (sortimenti[k] || 0) * (CENAS[k] || 0), 0)
  const krautuveVert = sortVert - izmaксasKopa

  return (
    <>
      {showNoteikumi && NoteikumiModal && (
        <NoteikumiModal veids="izlicejs" onPiekritu={saglabat} onAtcelt={() => setShowNoteikumi(false)} />
      )}

      <div style={{ background: "white", border: "2px solid #e65100", borderRadius: 10, padding: 24, marginBottom: 16 }}>
        <h3 style={{ color: "#e65100", marginTop: 0, fontSize: 16 }}>🏷 Izlikt izsolē</h3>

        {kludas && (
          <div style={{ background: "#ffebee", color: "#c62828", padding: 8, borderRadius: 4, marginBottom: 12, fontSize: 12 }}>{kludas}</div>
        )}

        {/* ── PAMATINFORMĀCIJA ── */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
          <div>
            <label style={{ fontSize: 11, fontWeight: "bold", display: "block", marginBottom: 3 }}>Kadastra numurs:</label>
            <div style={{ display: "flex", gap: 6 }}>
              <input value={kadastrs} onChange={e => setKadastrs(e.target.value)}
                placeholder="12345678901"
                style={{ flex: 1, padding: 6, border: "1px solid #ccc", borderRadius: 4, fontSize: 13 }} />
              <a href={lkmGeoUrl} target="_blank" rel="noreferrer"
                style={{ padding: "6px 10px", background: "#2e7d32", color: "white", borderRadius: 4, textDecoration: "none", fontSize: 12, whiteSpace: "nowrap", display: "flex", alignItems: "center" }}>
                🗺 LVM GEO
              </a>
            </div>
          </div>
          <div>
            <label style={{ fontSize: 11, fontWeight: "bold", display: "block", marginBottom: 3 }}>Novads / Pagasts:</label>
            <input value={novads} onChange={e => setNovads(e.target.value)}
              placeholder="piem. Ogres novads, Madlienas pagasts"
              style={{ width: "100%", padding: 6, border: "1px solid #ccc", borderRadius: 4, fontSize: 13, boxSizing: "border-box" }} />
          </div>
        </div>

        <div style={{ marginBottom: 12 }}>
          <label style={{ fontSize: 11, fontWeight: "bold", display: "block", marginBottom: 3 }}>Apraksts:</label>
          <textarea value={apraksts} onChange={e => setApraksts(e.target.value)} rows={4}
            placeholder="Apraksti īpašumu vai cirsmu — sugu sastāvs, vecums, piekļuve, ceļi, krautuve, īpašuma juridiskais statuss..."
            style={{ width: "100%", padding: 8, border: "1px solid #ccc", borderRadius: 4, fontSize: 13, boxSizing: "border-box", resize: "vertical" }} />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
          <div>
            <label style={{ fontSize: 11, fontWeight: "bold", display: "block", marginBottom: 3 }}>Sākumcena (€):</label>
            <input type="number" value={sakumcena} onChange={e => setSakumcena(e.target.value)}
              placeholder="0"
              style={{ width: "100%", padding: 6, border: "1px solid #ccc", borderRadius: 4, fontSize: 13, boxSizing: "border-box" }} />
          </div>
          <div>
            <label style={{ fontSize: 11, fontWeight: "bold", display: "block", marginBottom: 3 }}>Izsole beidzas:</label>
            <input type="date" value={beigas} onChange={e => setBeigas(e.target.value)}
              style={{ width: "100%", padding: 6, border: "1px solid #ccc", borderRadius: 4, fontSize: 13, boxSizing: "border-box" }} />
          </div>
        </div>

        {/* ── PUBLISKA / PRIVĀTA ── */}
        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 11, fontWeight: "bold", display: "block", marginBottom: 6 }}>Izsoles redzamība:</label>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={() => setPubliska(true)}
              style={{ padding: "8px 20px", background: publiska ? "#225522" : "#f5f5f5", color: publiska ? "white" : "#555", border: "1px solid #225522", borderRadius: 6, cursor: "pointer", fontSize: 13 }}>
              🌍 Publiska
            </button>
            <button onClick={() => setPubliska(false)}
              style={{ padding: "8px 20px", background: !publiska ? "#1565c0" : "#f5f5f5", color: !publiska ? "white" : "#555", border: "1px solid #1565c0", borderRadius: 6, cursor: "pointer", fontSize: 13 }}>
              🔒 Privāta
            </button>
          </div>
          <div style={{ fontSize: 11, color: "#888", marginTop: 4 }}>
            {publiska ? "Redzama visiem reģistrētiem lietotājiem" : "Redzama tikai uzaicinātiem lietotājiem"}
          </div>
        </div>

        {/* ── PDF AUGŠUPIELĀDE ── */}
        <div style={{ marginBottom: 16, padding: 16, background: "#f9f9f9", borderRadius: 8, border: "1px dashed #ccc" }}>
          <label style={{ fontSize: 11, fontWeight: "bold", display: "block", marginBottom: 6 }}>
            📎 PDF pielikums (inventarizācija, dastojums vai cits dokuments):
          </label>
          <input type="file" accept=".pdf" onChange={handlePDF}
            style={{ fontSize: 13 }} />
          {lādē && (
            <div style={{ marginTop: 8, fontSize: 13, color: "#1565c0" }}>⏳ Nolasa PDF...</div>
          )}
          {pdfFile && !lādē && (
            <div style={{ marginTop: 8, fontSize: 12, color: "#225522" }}>
              ✓ {pdfFile.name}
              {pdfTips === "dastojums" && <span style={{ marginLeft: 8, background: "#e8f5e9", padding: "2px 8px", borderRadius: 10, fontSize: 11 }}>🌲 Mežvērtes dastojums atpazīts</span>}
              {pdfTips === "inventarizacija" && <span style={{ marginLeft: 8, background: "#e3f2fd", padding: "2px 8px", borderRadius: 10, fontSize: 11 }}>📋 Inventarizācija atpazīta</span>}
              {pdfTips === "nezinams" && <span style={{ marginLeft: 8, background: "#fff8e1", padding: "2px 8px", borderRadius: 10, fontSize: 11 }}>📄 PDF pievienots kā pielikums</span>}
            </div>
          )}
        </div>

        {/* ── ANALĪZES REZULTĀTI ── */}
        {analīze && (
          <div style={{ marginBottom: 16, padding: 16, background: "#f0f8f0", border: "2px solid #225522", borderRadius: 8 }}>
            <div style={{ fontWeight: "bold", color: "#225522", marginBottom: 10, fontSize: 14 }}>
              📊 Analīzes rezultāti
              <span style={{ fontSize: 11, color: "#888", fontWeight: "normal", marginLeft: 8 }}>
                (precizitāte atkarīga no inventarizācijas datuma un precizitātes)
              </span>
            </div>

            {/* Nogabali */}
            {analīze.nogabali?.length > 0 && (
              <div style={{ marginBottom: 10 }}>
                <div style={{ fontSize: 12, fontWeight: "bold", color: "#555", marginBottom: 4 }}>Nogabali:</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {analīze.nogabali.map((n, i) => (
                    <span key={i} style={{ background: "white", border: "1px solid #c8dcc0", borderRadius: 4, padding: "3px 8px", fontSize: 12 }}>
                      {n.nr} {n.platiba ? `— ${n.platiba} ha` : ""}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Inventarizācija */}
            {analīze.tips === "inventarizacija" && analīze.kopPlatiba > 0 && (
              <div style={{ fontSize: 13, color: "#333", marginBottom: 8 }}>
                Kopējā platība: <b>{analīze.kopPlatiba.toFixed(2)} ha</b>
              </div>
            )}

            {/* Dastojums sortimenti */}
            {analīze.tips === "dastojums" && Object.keys(sortimenti).length > 0 && (
              <>
                <div style={{ marginBottom: 8 }}>
                  <div style={{ fontSize: 12, fontWeight: "bold", color: "#555", marginBottom: 6 }}>Izstrādes izmaksas:</div>
                  <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                    {[["zaglesana", "Zāģēšana €/m³"], ["pievesana", "Pievešana €/m³"]].map(([k, lbl]) => (
                      <div key={k} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12 }}>
                        <label>{lbl}:</label>
                        <input type="number" value={izmaksas[k]}
                          onChange={e => setIzmaksas({ ...izmaksas, [k]: parseFloat(e.target.value) || 0 })}
                          style={{ width: 55, padding: "3px 6px", border: "1px solid #ccc", borderRadius: 4, fontSize: 12 }} />
                      </div>
                    ))}
                  </div>
                </div>

                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12, marginBottom: 8 }}>
                  <thead>
                    <tr style={{ background: "#225522", color: "white" }}>
                      <th style={{ padding: "4px 8px", textAlign: "left" }}>Sortiments</th>
                      <th style={{ padding: "4px 8px", textAlign: "right" }}>m³</th>
                      <th style={{ padding: "4px 8px", textAlign: "right" }}>€/m³</th>
                      <th style={{ padding: "4px 8px", textAlign: "right" }}>Vērtība €</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.keys(sortimenti).filter(k => sortimenti[k] > 0).map((k, i) => (
                      <tr key={k} style={{ background: i % 2 === 0 ? "white" : "#f9f9f9" }}>
                        <td style={{ padding: "3px 8px", borderBottom: "1px solid #e0e0e0" }}>{SORT_NOSAUKUMI[k] || k}</td>
                        <td style={{ padding: "3px 8px", textAlign: "right", borderBottom: "1px solid #e0e0e0" }}>{sortimenti[k].toFixed(1)}</td>
                        <td style={{ padding: "3px 8px", textAlign: "right", borderBottom: "1px solid #e0e0e0" }}>{CENAS[k]}</td>
                        <td style={{ padding: "3px 8px", textAlign: "right", borderBottom: "1px solid #e0e0e0", fontWeight: "bold" }}>{(sortimenti[k] * (CENAS[k] || 0)).toFixed(0)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr style={{ background: "#f0f8f0" }}>
                      <td style={{ padding: "4px 8px", fontWeight: "bold" }}>Kopā</td>
                      <td style={{ padding: "4px 8px", textAlign: "right", fontWeight: "bold" }}>{kopKub.toFixed(1)} m³</td>
                      <td style={{ padding: "4px 8px" }}></td>
                      <td style={{ padding: "4px 8px", textAlign: "right", fontWeight: "bold" }}>{sortVert.toFixed(0)} €</td>
                    </tr>
                    <tr style={{ background: "#fff3e0" }}>
                      <td colSpan={3} style={{ padding: "4px 8px", fontSize: 11, color: "#e65100" }}>
                        Izstrādes izmaksas ({izmaksas.zaglesana + izmaksas.pievesana} €/m³ × {kopKub.toFixed(1)} m³)
                      </td>
                      <td style={{ padding: "4px 8px", textAlign: "right", color: "#c62828", fontWeight: "bold" }}>
                        -{izmaксasKopa.toFixed(0)} €
                      </td>
                    </tr>
                    <tr style={{ background: "#e8f5e9" }}>
                      <td colSpan={3} style={{ padding: "6px 8px", fontWeight: "bold", color: "#225522", fontSize: 13 }}>
                        🌲 Krautuves vērtība
                      </td>
                      <td style={{ padding: "6px 8px", textAlign: "right", fontWeight: "bold", color: "#225522", fontSize: 15 }}>
                        {krautuveVert.toFixed(0)} €
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </>
            )}

            {/* Izvēle — pievienot aprēķinu */}
            <div style={{ marginTop: 10, padding: "10px 14px", background: "white", border: "1px solid #c8dcc0", borderRadius: 6 }}>
              <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", fontSize: 13 }}>
                <input type="checkbox" checked={pievienotAprēķinu} onChange={e => setPievienotAprēķinu(e.target.checked)}
                  style={{ width: 18, height: 18 }} />
                <span>
                  <b>Pievienot aprēķinus izsoles sludinājumam</b>
                  <span style={{ display: "block", fontSize: 11, color: "#888", marginTop: 2 }}>
                    Pircēji redzēs oriģinālo PDF un aprēķina rezultātus
                  </span>
                </span>
              </label>
            </div>
          </div>
        )}

        {/* ── APLIECINĀJUMS ── */}
        <div style={{ marginBottom: 16, padding: "10px 14px", background: "#fff8e1", border: "1px solid #f9a825", borderRadius: 6, fontSize: 12 }}>
          ⚠️ Apliecinu, ka esmu tiesīgs pārdot vai iznomāt šo objektu un visas norādītās ziņas ir patiesas.
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={validet}
            style={{ padding: "10px 24px", background: "#e65100", color: "white", border: "none", borderRadius: 6, cursor: "pointer", fontWeight: "bold", fontSize: 14 }}>
            🏷 Izlikt izsolē
          </button>
          <button onClick={onAtcelt}
            style={{ padding: "10px 16px", background: "#888", color: "white", border: "none", borderRadius: 6, cursor: "pointer" }}>
            Atcelt
          </button>
        </div>
      </div>
    </>
  )
}


// ── Solīšanas modālis ─────────────────────────────────────────────────────────
function SolitModal({ izsole, user, onSolit, onAtcelt }) {
  const [summa, setSumma] = useState("")
  const [showNoteikumi, setShowNoteikumi] = useState(true)
  const [piekritu, setPiekritu] = useState(false)
  const [kludas, setKludas] = useState("")

  const solit = () => {
    const s = parseFloat(summa)
    const soljumi = getSolījumi().filter(s => s.izsolId === izsole.id)
    const lielakais = soljumi.length ? Math.max(...soljumi.map(s => s.summa)) : izsole.sakumcena
    if (!s || s <= 0) return setKludas("Ievadi solījuma summu!")
    if (s <= lielakais) return setKludas(`Solījumam jābūt lielākam par ${lielakais} €!`)
    onSolit(s)
  }

  const soljumi = getSolījumi().filter(s => s.izsolId === izsole.id)
  const lielakais = soljumi.length ? Math.max(...soljumi.map(s => s.summa)) : izsole.sakumcena
  const manasSoljumi = soljumi.filter(s => s.epasts === user?.epasts)
  const manamsPedjais = manasSoljumi.length ? Math.max(...manasSoljumi.map(s => s.summa)) : null

  if (showNoteikumi) return <NoteikumiModal veids="solitajs" onPiekritu={() => setShowNoteikumi(false)} onAtcelt={onAtcelt} />

  return (
    <div style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", background: "rgba(0,0,0,0.6)", zIndex: 2000, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div style={{ background: "white", borderRadius: 10, maxWidth: 400, width: "100%", padding: 28 }}>
        <h3 style={{ color: "#225522", marginTop: 0 }}>💰 Solīt — {izsole.nosaukums}</h3>

        <div style={{ background: "#f0f8f0", borderRadius: 6, padding: "10px 14px", marginBottom: 16, fontSize: 13 }}>
          <div>Sākumcena: <b>{izsole.sakumcena} €</b></div>
          <div>Lielākais solījums: <b style={{ color: "#e65100" }}>{lielakais} €</b></div>
          {manamsPedjais && <div>Mans pēdējais: <b style={{ color: "#1565c0" }}>{manamsPedjais} €</b></div>}
        </div>

        {kludas && <div style={{ background: "#ffebee", color: "#c62828", padding: 8, borderRadius: 4, marginBottom: 10, fontSize: 12 }}>{kludas}</div>}

        <label style={{ fontSize: 11, fontWeight: "bold" }}>Mans solījums (€):</label><br />
        <input type="number" value={summa} onChange={e => setSumma(e.target.value)}
          placeholder={`Vairāk par ${lielakais} €`}
          style={{ width: "100%", padding: 8, border: "2px solid #225522", borderRadius: 6, fontSize: 16, marginTop: 4, marginBottom: 16, boxSizing: "border-box" }}
          autoFocus />

        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={solit} style={{ flex: 1, padding: "10px 0", background: "#225522", color: "white", border: "none", borderRadius: 6, cursor: "pointer", fontWeight: "bold", fontSize: 14 }}>
            ✓ Apstiprināt solījumu
          </button>
          <button onClick={onAtcelt} style={{ padding: "10px 16px", background: "#888", color: "white", border: "none", borderRadius: 6, cursor: "pointer" }}>
            Atcelt
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Izsoles karte ─────────────────────────────────────────────────────────────
function IzsoleKarte({ izsole, user, onAtjaunot }) {
  const [showSolit, setShowSolit] = useState(false)
  const [showSolījumi, setShowSolījumi] = useState(false)

  const soljumi = getSolījumi()
    .filter(s => s.izsolId === izsole.id)
    .sort((a, b) => b.summa - a.summa)

  const lielakais = soljumi.length ? soljumi[0].summa : izsole.sakumcena
  const manasSoljumi = user ? soljumi.filter(s => s.epasts === user.epasts) : []
  const manamsPedjais = manasSoljumi.length ? Math.max(...manasSoljumi.map(s => s.summa)) : null
  const irAutors = user?.epasts === izsole.autorsEpasts
  const laiks = atlikusiisLaiks(izsole.beigas)

  const solit = (summa) => {
    const jauns = {
      id: Date.now(),
      izsolId: izsole.id,
      summa,
      epasts: user.epasts,
      vards: user.vards || user.epasts,
      talrunis: user.talrunis || "",
      ts: Date.now(),
    }
    const visi = [...getSolījumi(), jauns]
    saveSolījumi(visi)
    setShowSolit(false)
    onAtjaunot()
  }

  const apstiprinatUzvaretaju = (sol) => {
    if (!window.confirm(`Apstiprināt uzvarētāju: ${sol.vards}?`)) return
    const izsoles = getIzsoles().map(iz =>
      iz.id === izsole.id ? { ...iz, statuss: "pabeigta", uzvaretajs: sol } : iz
    )
    saveIzsoles(izsoles)
    onAtjaunot()
  }

  const dzest = () => {
    if (!window.confirm("Dzēst izsoli?")) return
    saveIzsoles(getIzsoles().filter(iz => iz.id !== izsole.id))
    onAtjaunot()
  }

  return (
    <>
      {showSolit && <SolitModal izsole={izsole} user={user} onSolit={solit} onAtcelt={() => setShowSolit(false)} />}

      <div style={{ background: "white", border: `2px solid ${laiks.beigusies ? "#ccc" : "#e65100"}`, borderRadius: 10, padding: 20, boxShadow: "0 2px 8px rgba(0,0,0,0.08)" }}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
          <div>
            <span style={{ background: "#fff3e0", color: "#e65100", padding: "2px 8px", borderRadius: 12, fontSize: 11, fontWeight: "bold" }}>
              🏷 {izsole.objektVeids}
            </span>
            {laiks.beigusies
              ? <span style={{ marginLeft: 6, background: "#f5f5f5", color: "#888", padding: "2px 8px", borderRadius: 12, fontSize: 11 }}>Beigusies</span>
              : <span style={{ marginLeft: 6, background: "#e8f5e9", color: "#225522", padding: "2px 8px", borderRadius: 12, fontSize: 11 }}>🟢 Aktīva</span>
            }
          </div>
          <div style={{ textAlign: "right", fontSize: 12, color: "#888" }}>
            <div>{izsole.datums}</div>
            {!laiks.beigusies && <div style={{ color: "#e65100", fontWeight: "bold" }}>⏱ {laiks.teksts}</div>}
          </div>
        </div>

        <h3 style={{ margin: "0 0 6px", color: "#225522", fontSize: 16 }}>{izsole.nosaukums}</h3>

        {/* Info rinda */}
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 10, fontSize: 12, color: "#555" }}>
          {izsole.novads && <span>📍 {izsole.novads}</span>}
          {izsole.platiba && <span>📐 {izsole.platiba} ha</span>}
          {izsole.kubatura && <span>🌲 {izsole.kubatura} m³</span>}
        </div>

        <p style={{ margin: "0 0 12px", fontSize: 13, color: "#444", lineHeight: 1.5 }}>{izsole.apraksts}</p>

        {/* Cenu bloks */}
        <div style={{ display: "flex", gap: 12, marginBottom: 14, flexWrap: "wrap" }}>
          <div style={{ background: "#f0f8f0", borderRadius: 6, padding: "8px 14px", flex: 1 }}>
            <div style={{ fontSize: 10, color: "#888", textTransform: "uppercase", letterSpacing: "0.05em" }}>Sākumcena</div>
            <div style={{ fontSize: 18, fontWeight: "bold", color: "#225522" }}>{izsole.sakumcena} €</div>
          </div>
          <div style={{ background: "#fff3e0", borderRadius: 6, padding: "8px 14px", flex: 1 }}>
            <div style={{ fontSize: 10, color: "#888", textTransform: "uppercase", letterSpacing: "0.05em" }}>Lielākais solījums</div>
            <div style={{ fontSize: 18, fontWeight: "bold", color: "#e65100" }}>{lielakais} €</div>
            <div style={{ fontSize: 11, color: "#888" }}>{soljumi.length} solītāj{soljumi.length === 1 ? "s" : "i"}</div>
          </div>
          {manamsPedjais && !irAutors && (
            <div style={{ background: "#e8eaf6", borderRadius: 6, padding: "8px 14px", flex: 1 }}>
              <div style={{ fontSize: 10, color: "#888", textTransform: "uppercase", letterSpacing: "0.05em" }}>Mans solījums</div>
              <div style={{ fontSize: 18, fontWeight: "bold", color: "#1565c0" }}>{manamsPedjais} €</div>
              {manamsPedjais >= lielakais
                ? <div style={{ fontSize: 11, color: "#225522" }}>🥇 Vadībā!</div>
                : <div style={{ fontSize: 11, color: "#c62828" }}>Pārsolīts</div>
              }
            </div>
          )}
        </div>

        {/* Autora info (redzama tikai pēc izsoles beigām vai autoram) */}
        {(laiks.beigusies || irAutors) && (
          <div style={{ fontSize: 12, color: "#666", marginBottom: 10, padding: "8px 12px", background: "#f9f9f9", borderRadius: 6 }}>
            <b>{izsole.autors}</b>
            {irAutors && izsole.autorsTalrunis && <span> · 📞 {izsole.autorsTalrunis}</span>}
          </div>
        )}

        {/* Īpašnieka skats — solījumu saraksts */}
        {irAutors && soljumi.length > 0 && (
          <div style={{ marginBottom: 12 }}>
            <button onClick={() => setShowSolījumi(v => !v)}
              style={{ padding: "6px 14px", background: "#1565c0", color: "white", border: "none", borderRadius: 4, cursor: "pointer", fontSize: 12 }}>
              {showSolījumi ? "▲ Slēpt" : "▼ Rādīt"} solījumus ({soljumi.length})
            </button>
            {showSolījumi && (
              <div style={{ marginTop: 8, border: "1px solid #e0e0e0", borderRadius: 6, overflow: "hidden" }}>
                {soljumi.map((s, i) => (
                  <div key={s.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 12px", background: i === 0 ? "#e8f5e9" : i % 2 === 0 ? "white" : "#fafafa", borderBottom: "1px solid #f0f0f0" }}>
                    <div>
                      <span style={{ fontWeight: "bold", color: i === 0 ? "#225522" : "#333" }}>{i + 1}. {s.vards}</span>
                      {s.talrunis && <span style={{ fontSize: 11, color: "#888", marginLeft: 8 }}>📞 {s.talrunis}</span>}
                      <span style={{ fontSize: 11, color: "#888", marginLeft: 8 }}>✉️ {s.epasts}</span>
                    </div>
                    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                      <span style={{ fontWeight: "bold", color: i === 0 ? "#225522" : "#333", fontSize: 15 }}>{s.summa} €</span>
                      {i === 0 && laiks.beigusies && izsole.statuss !== "pabeigta" && (
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

        {/* Uzvarētāja paziņojums */}
        {izsole.statuss === "pabeigta" && izsole.uzvaretajs && (
          <div style={{ background: "#e8f5e9", border: "2px solid #225522", borderRadius: 6, padding: "10px 14px", marginBottom: 12, fontSize: 13 }}>
            🏆 <b>Uzvarētājs:</b> {izsole.uzvaretajs.vards}
            {(irAutors || user?.epasts === izsole.uzvaretajs.epasts) && (
              <div style={{ marginTop: 6, fontSize: 12, color: "#555" }}>
                📞 {izsole.uzvaretajs.talrunis || "—"} · ✉️ {izsole.uzvaretajs.epasts}
                <div style={{ marginTop: 4, color: "#225522" }}>Sazinies un vienojies par darījuma nosacījumiem.</div>
              </div>
            )}
          </div>
        )}

        {/* Darbību pogas */}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {user && !irAutors && !laiks.beigusies && (
            <button onClick={() => setShowSolit(true)}
              style={{ padding: "8px 20px", background: "#e65100", color: "white", border: "none", borderRadius: 6, cursor: "pointer", fontWeight: "bold" }}>
              💰 Solīt
            </button>
          )}
          {!user && !laiks.beigusies && (
            <div style={{ fontSize: 12, color: "#888", padding: "8px 0" }}>🔒 Piesakies lai solītu</div>
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
  const [ievade, setIevade] = useState("")
  const [piedavajumi, setPiedavajumi] = useState([])

  const handleChange = (val) => {
    setIevade(val)
    if (val.length < 1) { setPiedavajumi([]); return }
    setPiedavajumi(NOVADI.filter(n => n.toLowerCase().startsWith(val.toLowerCase())).slice(0, 6))
  }

  const izveleties = (novads) => {
    onPievienot(novads)
    setIevade("")
    setPiedavajumi([])
  }

  return (
    <div style={{ position: "relative" }}>
      <input value={ievade} onChange={e => handleChange(e.target.value)} placeholder="Raksti novada nosaukumu..."
        style={{ width: "100%", padding: "6px", border: "1px solid #ccc", borderRadius: "4px", fontSize: "13px", boxSizing: "border-box" }} />
      {piedavajumi.length > 0 && (
        <div style={{ position: "absolute", top: "100%", left: 0, right: 0, background: "white", border: "1px solid #ccc", borderRadius: "4px", zIndex: 100, boxShadow: "0 2px 8px rgba(0,0,0,0.15)" }}>
          {piedavajumi.map(n => (
            <div key={n} onClick={() => izveleties(n)}
              style={{ padding: "8px 12px", cursor: "pointer", fontSize: "13px", borderBottom: "1px solid #f0f0f0" }}
              onMouseEnter={e => e.target.style.background = "#f0f8f0"}
              onMouseLeave={e => e.target.style.background = "white"}>
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
  const [virsraksts, setVirsraksts] = useState(esosais?.virsraksts || "")
  const [apraksts, setApraksts] = useState(esosais?.apraksts || "")
  const [darbiba, setDarbiba] = useState(esosais?.darbiba || user?.darbiba || DARBIBAS_VEIDI[0])
  const [cena, setCena] = useState(esosais?.cena || "")
  const [cenaPecVienosanas, setCenaPecVienosanas] = useState(esosais?.cenaPecVienosanas ?? false)
  const [novadi, setNovadi] = useState(esosais?.novadi || (user?.bazesNovads ? [user.bazesNovads] : []))
  const [kludas, setKludas] = useState("")

  const pievienotNovadu = (n) => { if (!novadi.includes(n)) setNovadi([...novadi, n]) }
  const nonemtNovadu = (n) => setNovadi(novadi.filter(x => x !== n))

  const saglabat = () => {
    if (!virsraksts.trim()) return setKludas("Ievadi virsrakstu!")
    if (!apraksts.trim()) return setKludas("Ievadi aprakstu!")
    if (novadi.length === 0) return setKludas("Izvēlies vismaz vienu novadu!")
    if (!cenaPecVienosanas && !cena) return setKludas("Ievadi cenu vai atzīmē 'Pēc vienošanās'!")
    const sl = {
      id: esosais?.id || Date.now(),
      virsraksts, apraksts, darbiba, cena, cenaPecVienosanas, novadi,
      autors: user?.vards || "—",
      uznemums: user?.uznemums || "",
      epasts: user?.epasts || "",
      talrunis: user?.talrunis || "",
      datums: esosais?.datums || new Date().toLocaleDateString("lv-LV"),
      beigas: esosais?.beigas || (() => { const d = new Date(); d.setMonth(d.getMonth() + 1); return d.toLocaleDateString("lv-LV") })()
    }
    onSaglabat(sl)
  }

  return (
    <div style={{ background: "white", border: "2px solid #225522", borderRadius: "8px", padding: "20px", marginBottom: "16px" }}>
      <h3 style={{ color: "#225522", marginTop: 0 }}>{esosais ? "✏️ Rediģēt sludinājumu" : "➕ Jauns sludinājums"}</h3>
      {kludas && <div style={{ background: "#ffebee", color: "#c62828", padding: "8px", borderRadius: "4px", marginBottom: "10px", fontSize: "12px" }}>{kludas}</div>}

      <div style={{ marginBottom: "10px" }}>
        <label style={{ fontSize: "11px", fontWeight: "bold" }}>Virsraksts:</label><br />
        <input value={virsraksts} onChange={e => setVirsraksts(e.target.value)}
          placeholder="piem. Piedāvāju jaunaudžu kopšanas pakalpojumus"
          style={{ width: "100%", padding: "6px", border: "1px solid #ccc", borderRadius: "4px", fontSize: "13px", boxSizing: "border-box" }} />
      </div>

      <div style={{ marginBottom: "10px" }}>
        <label style={{ fontSize: "11px", fontWeight: "bold" }}>Darbības veids:</label><br />
        <select value={darbiba} onChange={e => setDarbiba(e.target.value)}
          style={{ width: "100%", padding: "6px", border: "1px solid #ccc", borderRadius: "4px", fontSize: "13px" }}>
          {DARBIBAS_VEIDI.map(d => <option key={d}>{d}</option>)}
        </select>
      </div>

      <div style={{ marginBottom: "10px" }}>
        <label style={{ fontSize: "11px", fontWeight: "bold" }}>Apraksts:</label><br />
        <textarea value={apraksts} onChange={e => setApraksts(e.target.value)} rows={4}
          placeholder="Apraksti ko piedāvā, pieredzi, tehnikas nodrošinājumu utt."
          style={{ width: "100%", padding: "6px", border: "1px solid #ccc", borderRadius: "4px", fontSize: "13px", boxSizing: "border-box", resize: "vertical" }} />
      </div>

      <div style={{ marginBottom: "10px" }}>
        <label style={{ fontSize: "11px", fontWeight: "bold" }}>Darbības novadi:</label><br />
        <NovadsAutocomplete onPievienot={pievienotNovadu} />
        {novadi.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: "4px", marginTop: "6px" }}>
            {novadi.map(n => (
              <span key={n} style={{ background: "#e8f5e9", border: "1px solid #225522", borderRadius: "4px", padding: "3px 8px", fontSize: "11px", display: "flex", alignItems: "center", gap: "4px" }}>
                {n}
                <button onClick={() => nonemtNovadu(n)} style={{ background: "none", border: "none", color: "#c62828", cursor: "pointer", fontWeight: "bold", padding: "0", fontSize: "12px" }}>×</button>
              </span>
            ))}
          </div>
        )}
      </div>

      <div style={{ marginBottom: "16px" }}>
        <label style={{ fontSize: "11px", fontWeight: "bold" }}>Cena:</label><br />
        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          <input type="number" value={cena} onChange={e => setCena(e.target.value)} disabled={cenaPecVienosanas}
            placeholder="€/ha vai €/m³" style={{ width: "120px", padding: "6px", border: "1px solid #ccc", borderRadius: "4px", fontSize: "13px" }} />
          <label style={{ fontSize: "12px", display: "flex", alignItems: "center", gap: "4px" }}>
            <input type="checkbox" checked={cenaPecVienosanas} onChange={e => setCenaPecVienosanas(e.target.checked)} />
            Pēc vienošanās
          </label>
        </div>
      </div>

      <div style={{ display: "flex", gap: "8px" }}>
        <button onClick={saglabat} style={{ padding: "8px 20px", background: "#225522", color: "white", border: "none", borderRadius: "4px", cursor: "pointer", fontWeight: "bold" }}>
          💾 Saglabāt
        </button>
        {onAtcelt && <button onClick={onAtcelt} style={{ padding: "8px 16px", background: "#888", color: "white", border: "none", borderRadius: "4px", cursor: "pointer" }}>Atcelt</button>}
      </div>
    </div>
  )
}

// ── GALVENAIS KOMPONENTS ──────────────────────────────────────────────────────
export default function SludinajumiPage({ user, onBack }) {
  const [sludinajumi, setSludinajumi] = useState(() => {
    try { return JSON.parse(localStorage.getItem("mt_sludinajumi") || "[]") } catch { return [] }
  })
  const [izsoles, setIzsoles] = useState(getIzsoles())
  const [aktīvāCilne, setAktīvāCilne] = useState("sludinajumi")
  const [showForm, setShowForm] = useState(false)
  const [showIzsoleForm, setShowIzsoleForm] = useState(false)
  const [rediget, setRediget] = useState(null)
  const [filtrsNovads, setFiltrsNovads] = useState("")
  const [filtrsDarbiba, setFiltrsDarbiba] = useState("")
  const [tick, setTick] = useState(0)

  // Atjaunina laiku ik minūti
  useEffect(() => {
    const interval = setInterval(() => setTick(t => t + 1), 60000)
    return () => clearInterval(interval)
  }, [])

  const atjaunotIzsoles = () => setIzsoles(getIzsoles())

  const saglabatSludinajumu = (sl) => {
    const jaunie = rediget ? sludinajumi.map(s => s.id === sl.id ? sl : s) : [...sludinajumi, sl]
    setSludinajumi(jaunie)
    localStorage.setItem("mt_sludinajumi", JSON.stringify(jaunie))
    setShowForm(false)
    setRediget(null)
  }

  const dzestSludinajumu = (id) => {
    if (!window.confirm("Dzēst sludinājumu?")) return
    const jaunie = sludinajumi.filter(s => s.id !== id)
    setSludinajumi(jaunie)
    localStorage.setItem("mt_sludinajumi", JSON.stringify(jaunie))
  }

  const saglabatIzsoli = (iz) => {
    const jaunas = [...getIzsoles(), iz]
    saveIzsoles(jaunas)
    setIzsoles(jaunas)
    setShowIzsoleForm(false)
  }

  const filtreti = sludinajumi.filter(s => {
    if (filtrsNovads && !s.novadi?.includes(filtrsNovads)) return false
    if (filtrsDarbiba && s.darbiba !== filtrsDarbiba) return false
    return true
  }).sort((a, b) => b.id - a.id)

  const mansSludinajums = user ? sludinajumi.find(s => s.epasts === user.epasts) : null
  const aktīvasIzsoles = izsoles.filter(iz => iz.statuss === "aktiva")
  const beigušasIzsoles = izsoles.filter(iz => iz.statuss === "pabeigta")

  return (
    <div style={{ padding: "24px", fontFamily: "Arial", maxWidth: "900px", margin: "0 auto" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexWrap: "wrap", gap: "8px" }}>
        <h2 style={{ color: "#225522", margin: 0 }}>🌲 Meža tirgus</h2>
        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          {onBack && <button onClick={onBack} style={{ padding: "6px 14px", background: "#555", color: "white", border: "none", borderRadius: "4px", cursor: "pointer" }}>← Atpakaļ</button>}
        </div>
      </div>

   {/* Cilnes */}
      <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
        {[
          { id: "sludinajumi", label: `📢 Sludinājumi (${sludinajumi.length})`, krasa: "#225522" },
          { id: "izsoles", label: aktīvasIzsoles.length > 0 ? `🏷 Izsoles (${aktīvasIzsoles.length})` : "🏷 Izsoles", krasa: "#c62828" },
          { id: "beigtasizsoles", label: beigušasIzsoles.length > 0 ? `✓ Pabeigtas (${beigušasIzsoles.length})` : "✓ Pabeigtas", krasa: "#225522" },
        ].map(c => (
          <button key={c.id} onClick={() => setAktīvāCilne(c.id)}
            style={{ padding: "8px 24px", background: aktīvāCilne === c.id ? c.krasa : "#f5f5f5", color: aktīvāCilne === c.id ? "white" : "#555", border: `2px solid ${c.krasa}`, cursor: "pointer", fontWeight: aktīvāCilne === c.id ? "bold" : "normal", borderRadius: "6px", fontSize: 13, minWidth: 140 }}>
            {c.label}
          </button>
        ))}
      </div>
      {/* ── SLUDINĀJUMI ── */}
      {aktīvāCilne === "sludinajumi" && <>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, flexWrap: "wrap", gap: 8 }}>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <select value={filtrsDarbiba} onChange={e => setFiltrsDarbiba(e.target.value)}
              style={{ padding: "6px", border: "1px solid #ccc", borderRadius: "4px", fontSize: "12px" }}>
              <option value="">Visi darbības veidi</option>
              {DARBIBAS_VEIDI.map(d => <option key={d}>{d}</option>)}
            </select>
            <select value={filtrsNovads} onChange={e => setFiltrsNovads(e.target.value)}
              style={{ padding: "6px", border: "1px solid #ccc", borderRadius: "4px", fontSize: "12px" }}>
              <option value="">Visi novadi</option>
              {NOVADI.map(n => <option key={n}>{n}</option>)}
            </select>
            {(filtrsNovads || filtrsDarbiba) && (
              <button onClick={() => { setFiltrsNovads(""); setFiltrsDarbiba("") }}
                style={{ padding: "6px 12px", background: "#888", color: "white", border: "none", borderRadius: "4px", cursor: "pointer", fontSize: "12px" }}>
                ✕ Notīrīt
              </button>
            )}
          </div>
          {user && !mansSludinajums && !showForm && (
            <button onClick={() => setShowForm(true)}
              style={{ padding: "8px 16px", background: "#225522", color: "white", border: "none", borderRadius: "4px", cursor: "pointer", fontWeight: "bold" }}>
              ➕ Jauns sludinājums
            </button>
          )}
        </div>

        {!user && (
          <div style={{ background: "#fff8e1", border: "1px solid #f9a825", borderRadius: "6px", padding: "12px", marginBottom: "16px", fontSize: "13px" }}>
            ℹ️ Lai ievietotu sludinājumu — <b>abonē Meža tirgu</b> vai iegādājies sludinājumu par <b>6.99 €/mēnesī</b>
          </div>
        )}

        {showForm && <SludinajumsForm user={user} onSaglabat={saglabatSludinajumu} onAtcelt={() => setShowForm(false)} />}
        {rediget && <SludinajumsForm user={user} esosais={rediget} onSaglabat={saglabatSludinajumu} onAtcelt={() => setRediget(null)} />}

        {filtreti.length === 0
          ? <div style={{ padding: "40px", textAlign: "center", color: "#888", border: "2px dashed #ccc", borderRadius: "8px" }}>Nav sludinājumu</div>
          : <div style={{ display: "grid", gap: "12px" }}>
            {filtreti.map(s => (
              <div key={s.id} style={{ background: "white", border: "1px solid #d0e4c8", borderRadius: "8px", padding: "16px", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
                  <div>
                    <h3 style={{ margin: "0 0 4px", color: "#225522", fontSize: "15px" }}>{s.virsraksts}</h3>
                    <span style={{ background: "#e8f5e9", color: "#225522", padding: "2px 8px", borderRadius: "12px", fontSize: "11px", fontWeight: "bold" }}>{s.darbiba}</span>
                  </div>
                  <div style={{ textAlign: "right", fontSize: "12px", color: "#888" }}>
                    <div>{s.datums}</div>
                    <div style={{ color: "#225522", fontWeight: "bold", fontSize: "14px", marginTop: "4px" }}>
                      {s.cenaPecVienosanas ? "Pēc vienošanās" : `${s.cena} €`}
                    </div>
                  </div>
                </div>
                <p style={{ margin: "0 0 8px", fontSize: "13px", color: "#444", lineHeight: "1.5" }}>{s.apraksts}</p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "4px", marginBottom: "8px" }}>
                  {s.novadi?.map(n => (
                    <span key={n} style={{ background: "#f0f6ec", border: "1px solid #c8dcc0", borderRadius: "4px", padding: "2px 6px", fontSize: "11px" }}>📍 {n}</span>
                  ))}
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid #f0f0f0", paddingTop: "8px", marginTop: "4px" }}>
                  <div style={{ fontSize: "12px", color: "#666" }}>
                    <b>{s.uznemums || s.autors}</b>
                    {s.talrunis && <span> · 📞 {s.talrunis}</span>}
                    {s.epasts && <span> · ✉️ {s.epasts}</span>}
                  </div>
                  {user && user.epasts === s.epasts && (
                    <div style={{ display: "flex", gap: "6px" }}>
                      <button onClick={() => setRediget(s)} style={{ padding: "4px 10px", background: "#1565c0", color: "white", border: "none", borderRadius: "4px", cursor: "pointer", fontSize: "11px" }}>✏️ Rediģēt</button>
                      <button onClick={() => dzestSludinajumu(s.id)} style={{ padding: "4px 10px", background: "#c62828", color: "white", border: "none", borderRadius: "4px", cursor: "pointer", fontSize: "11px" }}>🗑 Dzēst</button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        }
      </>}

      {/* ── IZSOLES ── */}
      {aktīvāCilne === "izsoles" && <>
        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 12 }}>
          {user && !showIzsoleForm && (
            <button onClick={() => setShowIzsoleForm(true)}
              style={{ padding: "8px 18px", background: "#e65100", color: "white", border: "none", borderRadius: 6, cursor: "pointer", fontWeight: "bold" }}>
              🏷 Izlikt izsolē
            </button>
          )}
        </div>

        {showIzsoleForm && <IzsoleForm user={user} onSaglabat={saglabatIzsoli} onAtcelt={() => setShowIzsoleForm(false)} />}

        {aktīvasIzsoles.length === 0
          ? <div style={{ padding: "40px", textAlign: "center", color: "#888", border: "2px dashed #ccc", borderRadius: "8px" }}>Nav aktīvu izsolu</div>
          : <div style={{ display: "grid", gap: 16 }}>
            {aktīvasIzsoles.sort((a, b) => new Date(a.beigas) - new Date(b.beigas)).map(iz => (
              <IzsoleKarte key={iz.id} izsole={iz} user={user} onAtjaunot={atjaunotIzsoles} />
            ))}
          </div>
        }
      </>}

      {/* ── PABEIGTAS IZSOLES ── */}
      {aktīvāCilne === "beigtasizsoles" && <>
        {beigušasIzsoles.length === 0
          ? <div style={{ padding: "40px", textAlign: "center", color: "#888", border: "2px dashed #ccc", borderRadius: "8px" }}>Nav pabeigtu izsolu</div>
          : <div style={{ display: "grid", gap: 16 }}>
            {beigušasIzsoles.sort((a, b) => b.id - a.id).map(iz => (
              <IzsoleKarte key={iz.id} izsole={iz} user={user} onAtjaunot={atjaunotIzsoles} />
            ))}
          </div>
        }
      </>}
    </div>
  )
}
