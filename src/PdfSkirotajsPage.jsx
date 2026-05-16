import { useState, useCallback } from "react"
import * as pdfjsLib from "pdfjs-dist"
import { PDFDocument } from "pdf-lib"

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url
).toString()

const API_KEY = import.meta.env.VITE_ANTHROPIC_KEY || ""

// Konvertē PDF lapu uz base64 bildi
async function lapaUzBase64(pdfDoc, lapaNr) {
  const page = await pdfDoc.getPage(lapaNr)
  const viewport = page.getViewport({ scale: 2.0 })
  const canvas = document.createElement("canvas")
  canvas.width = viewport.width
  canvas.height = viewport.height
  const ctx = canvas.getContext("2d")
  await page.render({ canvasContext: ctx, viewport }).promise
  return canvas.toDataURL("image/jpeg", 0.85).split(",")[1]
}

// AI analizē vienu lapu
async function aiAnalizeLapu(base64, lapaNr) {
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": API_KEY,
      "anthropic-version": "2023-06-01",
      "anthropic-dangerous-direct-browser-access": "true"
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-5",
      max_tokens: 500,
      messages: [{
        role: "user",
        content: [
          { type: "image", source: { type: "base64", media_type: "image/jpeg", data: base64 } },
          {
            type: "text",
     text: `Skaties uz šo dokumenta lapu kā cilvēks. Saproti kontekstu vizuāli.

Atgriezies TIKAI ar JSON bez komentāriem:
{
  "veids": "novertejums" ja redzi cirsmas novērtējuma tabulu ar sugām un m3, "skice" ja redzi karti vai zīmējumu, "cits" visam pārējam,
  "kadastrs": "11 ciparu kadastra numurs no dokumenta vai null",
  "nogabals": "pirmais nogabala numurs no lauka 'Nogabals:' vai null",
  "nogabali": masīvs ar VISIEM nogabalu numuriem no lauka 'Nogabals:' — ja tur '2;3' tad ["2","3"], ja '8' tad ["8"], NEKAD null,
  "kvartals": "kvartāla numurs no lauka 'Kvartāls:' vai null",
  "saimnieciba": "īpašuma vai saimniecības nosaukums vai null",
  "platiba": "platība hektāros kā teksts, piem '2.10' vai null",
  "apraksts": "viena teikuma apraksts latviski — kas šī lapa ir un kas tajā atrodas"
}`
          }
        ]
      }]
    })
  })
  const data = await response.json()
  const txt = data.content?.[0]?.text || "{}"
  try {
    const parsed = JSON.parse(txt.replace(/```json|```/g, "").trim())
    if (!Array.isArray(parsed.nogabali)) {
  parsed.nogabali = parsed.nogabals ? [String(parsed.nogabals)] : [String(lapaNr)]
}
return { ...parsed, lapa: lapaNr }
  } catch {
    return { veids: "cits", lapa: lapaNr, apraksts: "Neizdevās analizēt" }
  }
}

// Lejupielādē konkrētas lapas kā PDF
async function lejupieladetLapas(pdfBytes, lapas, faila_nosaukums) {
  const originalPdf = await PDFDocument.load(pdfBytes)
  const jaunsPdf = await PDFDocument.create()
  const kopetasLapas = await jaunsPdf.copyPages(originalPdf, lapas.map(l => l - 1))
  kopetasLapas.forEach(l => jaunsPdf.addPage(l))
  const bytes = await jaunsPdf.save()
  const blob = new Blob([bytes], { type: "application/pdf" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = faila_nosaukums
  a.click()
  URL.revokeObjectURL(url)
}

export default function PdfSkirotajsPage({ onBack, onOpenDastojums }) {
  const [stadija, setStadija] = useState("upload") // upload | analize | rezultati
  const [progress, setProgress] = useState("")
  const [progressPct, setProgressPct] = useState(0)
  const [lapuAnalizes, setLapuAnalizes] = useState([])
  const [pdfBytes, setPdfBytes] = useState(null)
  const [kopejaisLapuSkaits, setKopejaisLapuSkaits] = useState(0)
  const [skirosanaVeriba, setSkirosanaVeriba] = useState("nogabals") // nogabals | veids | lapas
  const [grupas, setGrupas] = useState([])
  const [skirotasGrupas, setSkirotasGrupas] = useState(false)

  const handlePDF = useCallback(async (file) => {
    if (!file) return
    setStadija("analize")
    setProgress("Ielādē PDF...")
    setProgressPct(0)
    setLapuAnalizes([])

    const arrayBuffer = await file.arrayBuffer()
    const pdfBytesArr = new Uint8Array(arrayBuffer.slice(0))
    setPdfBytes(arrayBuffer)

    const pdfDoc = await pdfjsLib.getDocument(pdfBytesArr).promise
    const kopejais = pdfDoc.numPages
    setKopejaisLapuSkaits(kopejais)

    const analizes = []
    for (let i = 1; i <= kopejais; i++) {
      setProgress(`AI analizē lapu ${i} no ${kopejais}...`)
      setProgressPct(Math.round((i - 1) / kopejais * 100))
      try {
        const base64 = await lapaUzBase64(pdfDoc, i)
        const analize = await aiAnalizeLapu(base64, i)
        analizes.push(analize)
        setLapuAnalizes([...analizes])
      } catch (e) {
        analizes.push({ veids: "cits", lapa: i, apraksts: "Kļūda: " + e.message })
        setLapuAnalizes([...analizes])
      }
    }

    setProgressPct(100)
    setProgress("Analīze pabeigta!")
    setStadija("rezultati")
    skirot(analizes, skirosanaVeriba)
  }, [skirosanaVeriba])

  const skirot = (analizes, veribaPec) => {
    let jaunasGrupas = []

    if (veribaPec === "nogabals") {
      const grupasMap = {}
      analizes.forEach(a => {
       const nogabaliSaraksts = a.nogabali?.length ? a.nogabali : a.nogabals ? [String(a.nogabals)] : [`lapa_${a.lapa}`]
       const atslega = nogabaliSaraksts.join("_")
        if (!grupasMap[atslega]) {
          grupasMap[atslega] = {
           nosaukums: atslega.startsWith("lapa_") ? `Lapa ${a.lapa}` : `Nogabals ${nogabaliSaraksts.join(", ")}`,
            lapas: [],
            kadastrs: a.kadastrs,
            saimnieciba: a.saimnieciba,
            irNovertejums: false
          }
        }
        grupasMap[atslega].lapas.push(a.lapa)
        if (a.veids === "novertejums") grupasMap[atslega].irNovertejums = true
      })
      jaunasGrupas = Object.values(grupasMap).sort((a, b) => a.lapas[0] - b.lapas[0])

    } else if (veribaPec === "veids") {
      const novertejumi = analizes.filter(a => a.veids === "novertejums")
      const skices = analizes.filter(a => a.veids === "skice")
      const citi = analizes.filter(a => a.veids === "cits")
      if (novertejumi.length) jaunasGrupas.push({ nosaukums: "Cirsmu novērtējumi", lapas: novertejumi.map(a => a.lapa), irNovertejums: true })
      if (skices.length) jaunasGrupas.push({ nosaukums: "Cirsmu skices", lapas: skices.map(a => a.lapa), irNovertejums: false })
      if (citi.length) jaunasGrupas.push({ nosaukums: "Citi dokumenti", lapas: citi.map(a => a.lapa), irNovertejums: false })

    } else if (veribaPec === "lapas") {
      jaunasGrupas = analizes.map(a => ({
        nosaukums: a.veids === "novertejums" ? `Novērtējums — nog. ${a.nogabals || a.lapa}` :
                   a.veids === "skice" ? `Skice — nog. ${a.nogabals || a.lapa}` : `Lapa ${a.lapa}`,
        lapas: [a.lapa],
        kadastrs: a.kadastrs,
        saimnieciba: a.saimnieciba,
        irNovertejums: a.veids === "novertejums"
      }))
    }

    setGrupas(jaunasGrupas)
    setSkirotasGrupas(true)
  }

  const mainaSkirosanu = (jaunaVeriba) => {
    setSkirosanaVeriba(jaunaVeriba)
    if (lapuAnalizes.length > 0) skirot(lapuAnalizes, jaunaVeriba)
  }

  const atvértDastojuma = async (grupa) => {
    if (!onOpenDastojums) return
    // Izveido pagaidu PDF no grupas lapām un padod tālāk
    const originalPdf = await PDFDocument.load(pdfBytes)
    const jaunsPdf = await PDFDocument.create()
    const kopetasLapas = await jaunsPdf.copyPages(originalPdf, grupa.lapas.map(l => l - 1))
    kopetasLapas.forEach(l => jaunsPdf.addPage(l))
    const bytes = await jaunsPdf.save()
    const blob = new Blob([bytes], { type: "application/pdf" })
    const file = new File([blob], `${grupa.nosaukums}.pdf`, { type: "application/pdf" })
    onOpenDastojums(file)
  }

  const veidaKrasa = (veids) => {
    if (veids === "novertejums") return "#4caf50"
    if (veids === "skice") return "#81c784"
    return "#4a7a4a"
  }

  const veidaEtiķete = (veids) => {
    if (veids === "novertejums") return "📋 Novērtējums"
    if (veids === "skice") return "🗺 Skice"
    return "📄 Cits"
  }

  return (
    <div style={{ minHeight: "100vh", background: "#080f08", color: "#e8f5e9", fontFamily: "Arial, sans-serif" }}>

      {/* HEADER */}
      <div style={{ background: "#1b3a1b", borderBottom: "2px solid #4caf50", padding: "12px 20px", display: "flex", alignItems: "center", gap: "16px" }}>
        <button onClick={onBack} style={{ background: "transparent", border: "none", color: "#4caf50", fontSize: "16px", cursor: "pointer" }}>← Atpakaļ</button>
        <h1 style={{ margin: 0, color: "#4caf50", fontSize: "18px", fontWeight: 800 }}>✂️ PDF šķirotājs</h1>
        {stadija === "rezultati" && (
          <span style={{ fontSize: "12px", color: "#81c784", marginLeft: "8px" }}>
            {kopejaisLapuSkaits} lapas · {grupas.length} grupas
          </span>
        )}
      </div>

      <div style={{ padding: "24px", maxWidth: "960px", margin: "0 auto" }}>

        {/* UPLOAD */}
        {stadija === "upload" && (
          <div>
            <p style={{ color: "#81c784", marginBottom: "24px", fontSize: "14px" }}>
              Augšupielādē PDF — AI automātiski analizē katru lapu un piedāvā sadalīšanas iespējas. Strādā ar skenētiem, bildētiem un jebkāda formāta dokumentiem.
            </p>

            <div
              onClick={() => document.getElementById("pdf-upload").click()}
              style={{ border: "2px dashed #2d5a2d", borderRadius: "16px", padding: "64px 24px", textAlign: "center", cursor: "pointer", background: "#0f1a0f", transition: "all 0.2s" }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = "#4caf50"; e.currentTarget.style.background = "#141f14" }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = "#2d5a2d"; e.currentTarget.style.background = "#0f1a0f" }}
            >
              <div style={{ fontSize: "56px", marginBottom: "16px" }}>📄</div>
              <div style={{ fontSize: "18px", fontWeight: 700, color: "#4caf50", marginBottom: "8px" }}>Augšupielādē PDF</div>
              <div style={{ fontSize: "13px", color: "#4a7a4a" }}>Uzspied vai ievelc failu šeit</div>
              <input id="pdf-upload" type="file" accept="application/pdf"
                onChange={e => { if (e.target.files[0]) handlePDF(e.target.files[0]) }}
                style={{ display: "none" }} />
            </div>

            <div style={{ marginTop: "24px", display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "12px" }}>
              {[
                { icon: "🌲", title: "Nogabali", text: "Sadala pēc nogabalu numuriem" },
                { icon: "📋", title: "Novērtējumi/Skices", text: "Atdala novērtējumus no skicēm" },
                { icon: "📄", title: "Pa lapām", text: "Katra lapa = atsevišķs fails" }
              ].map((f, i) => (
                <div key={i} style={{ padding: "16px", background: "#141f14", border: "1px solid #2d5a2d", borderRadius: "10px", textAlign: "center" }}>
                  <div style={{ fontSize: "28px", marginBottom: "8px" }}>{f.icon}</div>
                  <div style={{ fontSize: "13px", fontWeight: 700, color: "#4caf50", marginBottom: "4px" }}>{f.title}</div>
                  <div style={{ fontSize: "11px", color: "#4a7a4a" }}>{f.text}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ANALĪZES PROGRESS */}
        {stadija === "analize" && (
          <div style={{ textAlign: "center", padding: "48px 0" }}>
            <div style={{ fontSize: "48px", marginBottom: "24px", animation: "spin 2s linear infinite" }}>🔍</div>
            <div style={{ fontSize: "16px", color: "#4caf50", fontWeight: 700, marginBottom: "12px" }}>{progress}</div>
            <div style={{ background: "#141f14", borderRadius: "8px", height: "8px", overflow: "hidden", maxWidth: "400px", margin: "0 auto 24px" }}>
              <div style={{ background: "#4caf50", height: "100%", width: `${progressPct}%`, transition: "width 0.3s", borderRadius: "8px" }} />
            </div>

            {lapuAnalizes.length > 0 && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", justifyContent: "center", maxWidth: "600px", margin: "0 auto" }}>
                {lapuAnalizes.map((a, i) => (
                  <div key={i} style={{ padding: "6px 12px", background: "#141f14", border: `1px solid ${veidaKrasa(a.veids)}`, borderRadius: "6px", fontSize: "11px", color: veidaKrasa(a.veids) }}>
                    {veidaEtiķete(a.veids)} · Lapa {a.lapa}
                    {a.nogabals && <span style={{ color: "#81c784" }}> · Nog. {a.nogabals}</span>}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* REZULTĀTI */}
        {stadija === "rezultati" && (
          <div>
            {/* Analīzes kopsavilkums */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "12px", marginBottom: "20px" }}>
              {[
                { label: "Kopā lapas", value: kopejaisLapuSkaits, color: "#4caf50" },
                { label: "Novērtējumi", value: lapuAnalizes.filter(a => a.veids === "novertejums").length, color: "#81c784" },
                { label: "Skices", value: lapuAnalizes.filter(a => a.veids === "skice").length, color: "#4a7a4a" }
              ].map((s, i) => (
                <div key={i} style={{ background: "#141f14", border: "1px solid #2d5a2d", borderRadius: "10px", padding: "16px", textAlign: "center" }}>
                  <div style={{ fontSize: "11px", color: "#4a7a4a", marginBottom: "4px" }}>{s.label}</div>
                  <div style={{ fontSize: "28px", fontWeight: 700, color: s.color }}>{s.value}</div>
                </div>
              ))}
            </div>

            {/* Šķirošanas izvēle */}
            <div style={{ background: "#141f14", border: "1px solid #2d5a2d", borderRadius: "10px", padding: "16px", marginBottom: "20px" }}>
              <div style={{ fontSize: "13px", color: "#4caf50", fontWeight: 700, marginBottom: "12px" }}>✂️ Šķirot pēc:</div>
              <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                {[
                  { v: "nogabals", label: "🌲 Nogabaliem" },
                  { v: "veids", label: "📋 Novērtējumi / Skices" },
                  { v: "lapas", label: "📄 Katrai lapai atsevišķi" }
                ].map(opt => (
                  <button key={opt.v} onClick={() => mainaSkirosanu(opt.v)}
                    style={{ padding: "8px 16px", background: skirosanaVeriba === opt.v ? "#225522" : "#0f1a0f", border: `2px solid ${skirosanaVeriba === opt.v ? "#4caf50" : "#2d5a2d"}`, borderRadius: "8px", color: skirosanaVeriba === opt.v ? "#4caf50" : "#81c784", fontSize: "13px", cursor: "pointer", fontWeight: skirosanaVeriba === opt.v ? 700 : 400 }}>
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Grupas */}
            <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "20px" }}>
              {grupas.map((grupa, gi) => (
                <div key={gi} style={{ background: "#141f14", border: `1px solid ${grupa.irNovertejums ? "#4caf50" : "#2d5a2d"}`, borderRadius: "10px", padding: "16px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "8px" }}>
                    <div>
                      <div style={{ fontSize: "14px", fontWeight: 700, color: grupa.irNovertejums ? "#4caf50" : "#81c784" }}>
                        {grupa.nosaukums}
                      </div>
                      <div style={{ fontSize: "11px", color: "#4a7a4a", marginTop: "4px" }}>
                        Lapas: {grupa.lapas.join(", ")}
                        {grupa.kadastrs && <span> · Kadastrs: {grupa.kadastrs}</span>}
                        {grupa.saimnieciba && <span> · {grupa.saimnieciba}</span>}
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: "8px" }}>
                      {grupa.irNovertejums && onOpenDastojums && (
                        <button onClick={() => atvértDastojuma(grupa)}
                          style={{ padding: "8px 16px", background: "#0f2b0f", border: "1px solid #4caf50", borderRadius: "8px", color: "#4caf50", fontSize: "12px", cursor: "pointer", fontWeight: 700 }}>
                          📊 Dastojuma kalkulators
                        </button>
                      )}
                      <button onClick={() => lejupieladetLapas(pdfBytes, grupa.lapas, `${grupa.nosaukums.replace(/\s+/g,"_")}.pdf`)}
                        style={{ padding: "8px 16px", background: "#1b3a1b", border: "1px solid #2d5a2d", borderRadius: "8px", color: "#81c784", fontSize: "12px", cursor: "pointer" }}>
                        ⬇ PDF
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Lejupielādēt visus */}
            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
              <button onClick={async () => {
                for (const grupa of grupas) {
                  await lejupieladetLapas(pdfBytes, grupa.lapas, `${grupa.nosaukums.replace(/\s+/g,"_")}.pdf`)
                  await new Promise(r => setTimeout(r, 600))
                }
              }} style={{ padding: "10px 20px", background: "#225522", border: "1px solid #4caf50", borderRadius: "8px", color: "#4caf50", fontSize: "13px", cursor: "pointer", fontWeight: 700 }}>
                ⬇ Lejupielādēt visus ({grupas.length})
              </button>

              <button onClick={() => {
                setStadija("upload")
                setLapuAnalizes([])
                setGrupas([])
                setPdfBytes(null)
              }} style={{ padding: "10px 20px", background: "transparent", border: "1px solid #2d5a2d", borderRadius: "8px", color: "#4a7a4a", fontSize: "13px", cursor: "pointer" }}>
                🗑 Sākt no jauna
              </button>
            </div>

            {/* Lapu kopsavilkums */}
            <div style={{ marginTop: "24px", background: "#0f1a0f", border: "1px solid #1a3a1a", borderRadius: "10px", padding: "16px" }}>
              <div style={{ fontSize: "12px", color: "#4a7a4a", fontWeight: 700, marginBottom: "12px" }}>📋 AI analīzes rezultāti pa lapām</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px,1fr))", gap: "8px" }}>
                {lapuAnalizes.map((a, i) => (
                  <div key={i} style={{ padding: "10px 12px", background: "#141f14", border: `1px solid ${veidaKrasa(a.veids)}`, borderRadius: "8px", fontSize: "11px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                      <span style={{ color: veidaKrasa(a.veids), fontWeight: 700 }}>{veidaEtiķete(a.veids)}</span>
                      <span style={{ color: "#4a7a4a" }}>Lapa {a.lapa}</span>
                    </div>
                    {a.nogabals && <div style={{ color: "#81c784" }}>Nogabals: {a.nogabals}</div>}
                    {a.kvartals && <div style={{ color: "#81c784" }}>Kvartāls: {a.kvartals}</div>}
                    {a.kadastrs && <div style={{ color: "#4a7a4a" }}>Kadastrs: {a.kadastrs}</div>}
                    <div style={{ color: "#4a7a4a", marginTop: "4px", fontSize: "10px" }}>{a.apraksts}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
    </div>
  )
}
