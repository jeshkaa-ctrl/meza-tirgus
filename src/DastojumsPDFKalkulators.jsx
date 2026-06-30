import React, { useState, useCallback, useEffect } from "react"
import * as pdfjsLib from "pdfjs-dist"
import { acmHeaders } from "./utils/acm"

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url
).toString()

// ─── KONSTANTES ──────────────────────────────────────────────────────────────

const SUGAS_LV = {
  P:"Priede", E:"Egle", B:"Bērzs", A:"Apse",
  M:"Melnalksnis", Ba:"Baltalksnis", Bl:"Blīgzna",
  Oz:"Ozols", Os:"Osis", Kl:"Kļava", Lp:"Lapukoki"
}

// Papīrmalku var dot tikai šīs sugas
const PAPIRMALKA_SUGAS = ["P","E","B","A"]

const SORT_KEYS = ["balki","sikbalki","tara","papirmalka","malka","skelda"]
const SORT_NAMES = {
  balki:"Baļķis", sikbalki:"Sīkbaļķis", tara:"Tara",
  papirmalka:"Papīrmalka", malka:"Malka", skelda:"Šķelda (bonuss)"
}
const SORT_COLORS = {
  balki:"#1b5e20", sikbalki:"#2e7d32", tara:"#1565c0",
  papirmalka:"#6a1b9a", malka:"#e65100", skelda:"#795548"
}

const DEFAULT_PRICES = {
  balki_P:80, balki_E:80, balki_B:80, balki_M:65, balki_A:70,
  sikbalki:70, tara:45, papirmalka:35, malka:33, skelda:8
}

const DEFAULT_IZMAKSAS = { izstrade: 19, skelda_izvesana: 5 }

// ─── SORTIMENTU LOĢIKA ───────────────────────────────────────────────────────
// vidKoks: vidējais koks m³ — nosaka kvalitātes klasi
// resna/videja/tieva/pmalka/malka/atlik — precīzas kolonnas no Mežvērtes
// Ja nav precīzu kolonnu, aprēķina no vidējā koka

function getSortimenti(suga, vidKoks, resna, videja, tieva, pmalka, malka, atlik) {
  const sort = { balki:0, sikbalki:0, tara:0, papirmalka:0, malka:0, skelda:0 }
  const kanPapirmalka = PAPIRMALKA_SUGAS.includes(suga)

  // Ja ir precīzas kolonnas no Mežvērtes (InterReg formāts)
  if (resna !== null && videja !== null) {
    sort.skelda = atlik || 0

    if (suga === "P") {
      sort.balki     = resna
      sort.sikbalki  = videja
      sort.papirmalka = tieva + pmalka
      sort.malka     = malka
    } else if (suga === "E") {
      sort.sikbalki  = videja
      sort.papirmalka = tieva + pmalka
      sort.malka     = malka
    } else if (suga === "B") {
      sort.tara      = videja + tieva
      sort.papirmalka = pmalka
      sort.malka     = malka
    } else if (suga === "A") {
      sort.balki     = videja   // vid koks >0.4 = baļķis
      sort.tara      = tieva
      sort.papirmalka = pmalka
      sort.malka     = malka
    } else if (suga === "M") {
      sort.balki     = videja
      sort.tara      = tieva
      sort.malka     = pmalka + malka
    } else {
      // Ba, Bl, Lapukoki, Kl, Os — nav papīrmalkas
      sort.tara      = videja + tieva
      sort.malka     = pmalka + malka
    }
    return sort
  }

  // Ja NAV precīzu kolonnu — aprēķina no vidējā koka (Södra formāts)
  if (suga === "P") {
    if (vidKoks >= 0.5)      return { balki:0.65, sikbalki:0.15, tara:0, papirmalka:0.10, malka:0, skelda:0.10 }
    else if (vidKoks >= 0.25) return { balki:0.45, sikbalki:0.20, tara:0, papirmalka:0.25, malka:0, skelda:0.10 }
    else                      return { balki:0, sikbalki:0.25, tara:0, papirmalka:0.50, malka:0, skelda:0.25 }
  } else if (suga === "E") {
    if (vidKoks >= 0.5)      return { balki:0, sikbalki:0.55, tara:0, papirmalka:0.35, malka:0, skelda:0.10 }
    else if (vidKoks >= 0.2)  return { balki:0, sikbalki:0.30, tara:0, papirmalka:0.60, malka:0, skelda:0.10 }
    else                      return { balki:0, sikbalki:0, tara:0, papirmalka:0.65, malka:0, skelda:0.35 }
  } else if (suga === "B") {
    if (vidKoks >= 0.5)      return { balki:0.25, sikbalki:0, tara:0.35, papirmalka:0.25, malka:0, skelda:0.15 }
    else if (vidKoks >= 0.25) return { balki:0, sikbalki:0, tara:0.40, papirmalka:0.35, malka:0, skelda:0.25 }
    else                      return { balki:0, sikbalki:0, tara:0.20, papirmalka:0.55, malka:0, skelda:0.25 }
  } else if (suga === "A") {
    if (vidKoks >= 0.8)      return { balki:0.45, sikbalki:0, tara:0.20, papirmalka:0.20, malka:0, skelda:0.15 }
    else if (vidKoks >= 0.4)  return { balki:0.25, sikbalki:0, tara:0.20, papirmalka:0.40, malka:0, skelda:0.15 }
    else                      return { balki:0, sikbalki:0, tara:0.15, papirmalka:0.55, malka:0, skelda:0.30 }
  } else if (suga === "M") {
    if (vidKoks >= 0.4)      return { balki:0.35, sikbalki:0, tara:0.30, papirmalka:0, malka:0.20, skelda:0.15 }
    else if (vidKoks >= 0.25) return { balki:0.20, sikbalki:0, tara:0.25, papirmalka:0, malka:0.35, skelda:0.20 }
    else                      return { balki:0, sikbalki:0, tara:0.15, papirmalka:0, malka:0.55, skelda:0.30 }
  } else {
    // Ba, Bl, Lapukoki utt — nav papīrmalkas
    if (vidKoks >= 0.25)     return { balki:0, sikbalki:0, tara:0.35, papirmalka:0, malka:0.45, skelda:0.20 }
    else                      return { balki:0, sikbalki:0, tara:0.15, papirmalka:0, malka:0.60, skelda:0.25 }
  }
}

function aprēķinātSortimentus(nogabali) {
  const kop = { balki:0, sikbalki:0, tara:0, papirmalka:0, malka:0, skelda:0 }
  const balkiPaSugam = { P:0, E:0, B:0, A:0, M:0 }

  nogabali.forEach(n => {
    ;(n.sugas || []).forEach(s => {
      const m3 = s.likvid || 0
      if (m3 <= 0) return
      const prop = getSortimenti(
        s.suga, s.vidKoks,
        s.resna ?? null, s.videja ?? null, s.tieva ?? null,
        s.pmalka ?? null, s.malka ?? null, s.atlik ?? null
      )
      SORT_KEYS.forEach(k => {
        const v = (prop[k] || 0) * (prop[k] <= 1 ? m3 : 1) // proporcija vai absolūts
        kop[k] += v
      })
      // Baļķu sadalījums pa sugām priekš cenas
      if (prop.balki > 0) {
        const bv = prop.balki <= 1 ? prop.balki * m3 : prop.balki
        if (["P","E","B","A","M"].includes(s.suga)) balkiPaSugam[s.suga] = (balkiPaSugam[s.suga]||0) + bv
      }
    })
  })

  return { kop, balkiPaSugam }
}

function aprēķinātVērtību(kop, balkiPaSugam, prices, izmaksas) {
  const kopaM3 = Object.values(kop).reduce((s,v) => s+v, 0) - kop.skelda
  // Baļķu vērtība pa sugām
  const kopBalkiM3 = Object.values(balkiPaSugam).reduce((s,v)=>s+v,0)
  const vidBalkasCena = kopBalkiM3 > 0
    ? Object.entries(balkiPaSugam).reduce((s,[sg,v]) => s + v*(prices[`balki_${sg}`]||prices.balki_P||80), 0) / kopBalkiM3
    : (prices.balki_P || 80)

  const bruto =
    kop.balki    * vidBalkasCena +
    kop.sikbalki * (prices.sikbalki||70) +
    kop.tara     * (prices.tara||45) +
    kop.papirmalka*(prices.papirmalka||35) +
    kop.malka    * (prices.malka||33)
    // skelda nav bruto aprēķinā

  const izm = kopaM3 * (izmaksas.izstrade||19)
  const neto = bruto - izm
  const skeldaNeto = kop.skelda * Math.max(0, (prices.skelda||8) - (izmaksas.skelda_izvesana||5))

  return { bruto, izm, neto, skeldaNeto, kopaM3, vidBalkasCena }
}

// ─── AI PDF PARSĒŠANA ─────────────────────────────────────────────────────────

async function parsePDFarAI(file) {
  const reader = new FileReader()
  const arrayBuffer = await new Promise((res, rej) => {
    reader.onload = () => res(reader.result)
    reader.onerror = rej
    reader.readAsArrayBuffer(file)
  })

  const pdfBytes = new Uint8Array(arrayBuffer)
  const pdf = await pdfjsLib.getDocument(pdfBytes).promise
  const base64Images = []

  for (let p = 1; p <= Math.min(pdf.numPages, 30); p++) {
    const page = await pdf.getPage(p)
    const viewport = page.getViewport({ scale: 2.0 })
    const canvas = document.createElement("canvas")
    canvas.width = viewport.width
    canvas.height = viewport.height
    await page.render({ canvasContext: canvas.getContext("2d"), viewport }).promise
    base64Images.push(canvas.toDataURL("image/jpeg", 0.85).split(",")[1])
  }

  const prompt = `Tu esi meža cirsmas dastojuma novērtētājs. Skaties uz šiem PDF lapām un nolasi datus.

SVARĪGI PRINCIPI:
1. "Paredzēts pārdošanai" = likvīdā krāja (tas ko rēķinām)
2. "Atlikumi" = šķelda bonuss (atsevišķi)
3. Vidējais koks m³ — nosaka kvalitāti

Katrai lapai ar "CIRSMAS NOVĒRTĒJUMS":
- saimnieciba: īpašuma nosaukums
- kadastrs: 11 ciparu numurs
- nogabals: skaitlis no "Nogabals:" lauka (ne Kvartāls, ne A.Nogabals)
- platiba: ha skaitlis
- sugas: katras sugas dati no tabulas

SUGAS KODI: Priede=P, Egle=E, Bērzs=B, Apse=A, Melnalksnis=M, Baltalksnis=Ba, Blīgzna=Bl, Ozols=Oz, Osis=Os, Kļava=Kl, Lapukoki=Lp

Ja tabula ir Mežvērtes InterReg formāts (kolonnas: Stumbra krāja | Kopā | Īp.kval | Resnā | Vidējā | Tievā | P.malka | Malka | Atlikumi | Paredzēts pārdošanai):
  - likvid = "Paredzēts pārdošanai" vērtība
  - atlik = "Atlikumi" vērtība
  - resna/videja/tieva/pmalka/malka = attiecīgās kolonnas
  - vidKoks = vidējais koks (pēdējā kolonna pirms saglabājamo koku sadaļas)

Ja tabula ir Södra formāts (kolonnas: Kopējā krāja | Atlikumi | Likvīdā krāja | Vidējais koks):
  - likvid = "Likvīdā krāja" vērtība
  - atlik = "Atlikumi" vērtība
  - vidKoks = "Vidējais koks" vērtība
  - resna/videja/tieva/pmalka/malka = null (nav šo kolonnu)

Atgriezies TIKAI ar JSON bez komentāriem:
{
  "saimnieciba": "",
  "kadastrs": "",
  "nogabali": [
    {
      "nr": "1",
      "platiba": 1.50,
      "sugas": [
        {
          "suga": "P",
          "likvid": 45.5,
          "atlik": 8.2,
          "vidKoks": 0.45,
          "resna": 12.3,
          "videja": 18.5,
          "tieva": 8.9,
          "pmalka": 5.8,
          "malka": 0.0
        }
      ]
    }
  ]
}`

  const response = await fetch("/api/anthropic/v1/messages", {
    method: "POST",
    headers: acmHeaders(),
    body: JSON.stringify({
      model: "claude-sonnet-4-6",
      max_tokens: 4000,
      messages: [{
        role: "user",
        content: [
          ...base64Images.map(b64 => ({
            type: "image",
            source: { type: "base64", media_type: "image/jpeg", data: b64 }
          })),
          { type: "text", text: prompt }
        ]
      }]
    })
  })

  const data = await response.json()
  if (!data.content?.[0]?.text) throw new Error("AI neatbildēja")
  const clean = data.content[0].text.replace(/```json|```/g, "").trim()
  return JSON.parse(clean)
}

// ─── STILI ────────────────────────────────────────────────────────────────────

const s = {
  app: { minHeight:"100vh", background:"#070d07", color:"#e0ede0", fontFamily:"'Courier New', monospace" },
  hdr: { background:"#0d1f0d", borderBottom:"2px solid #2d5a2d", padding:"14px 20px", display:"flex", alignItems:"center", gap:12 },
  hdrTitle: { margin:0, color:"#4caf50", fontSize:17, fontWeight:800, letterSpacing:"0.05em" },
  backBtn: { background:"transparent", border:"1px solid #2d5a2d", color:"#4caf50", padding:"6px 12px", borderRadius:6, cursor:"pointer", fontSize:13 },
  body: { padding:"20px", maxWidth:960, margin:"0 auto" },
  card: { background:"#0d1f0d", border:"1px solid #1e3a1e", borderRadius:10, padding:16, marginBottom:14 },
  cardTitle: { color:"#4caf50", fontWeight:700, fontSize:13, marginBottom:10, display:"flex", alignItems:"center", gap:6 },
  label: { fontSize:11, color:"#81c784", fontWeight:600, marginBottom:3, display:"block", textTransform:"uppercase", letterSpacing:"0.08em" },
  input: { background:"#070d07", border:"1px solid #2d5a2d", borderRadius:6, color:"#e0ede0", padding:"8px 10px", fontSize:14, outline:"none", width:"100%" },
  inputSm: { background:"#070d07", border:"1px solid #2d5a2d", borderRadius:6, color:"#e0ede0", padding:"6px 8px", fontSize:13, outline:"none", textAlign:"center" },
  btn: { background:"linear-gradient(135deg,#2e7d32,#1b5e20)", color:"white", border:"none", borderRadius:8, padding:"12px 28px", fontSize:14, fontWeight:700, cursor:"pointer" },
  btnSm: { background:"#1e3a1e", color:"#4caf50", border:"1px solid #2d5a2d", borderRadius:6, padding:"6px 14px", fontSize:12, cursor:"pointer" },
  tag: (c) => ({ display:"inline-block", background:c+"22", color:c, border:`1px solid ${c}44`, borderRadius:4, padding:"1px 7px", fontSize:10, fontWeight:700 }),
  divider: { height:1, background:"#1e3a1e", margin:"12px 0" },
  grid2: { display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 },
  grid3: { display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:10 },
}

// ─── GALVENAIS KOMPONENTS ─────────────────────────────────────────────────────

export default function DastojumsKalkulators({ onBack, initialFile }) {
  const [solis, setSolis] = useState(0) // 0=ielāde, 1=pārbaude, 2=cenas, 3=rezultāts
  const [loading, setLoading] = useState(false)
  const [kļūda, setKļūda] = useState("")
  const [aiDati, setAiDati] = useState(null)
  const [saimnieciba, setSaimnieciba] = useState("")
  const [kadastrs, setKadastrs] = useState("")
  const [nogabali, setNogabali] = useState([])
  const [prices, setPrices] = useState({...DEFAULT_PRICES})
  const [izmaksas, setIzmaksas] = useState({...DEFAULT_IZMAKSAS})

  useEffect(() => { if (initialFile) handleFile(initialFile) }, [])

  // Aprēķini
  const { kop, balkiPaSugam } = nogabali.length ? aprēķinātSortimentus(nogabali) : { kop:{balki:0,sikbalki:0,tara:0,papirmalka:0,malka:0,skelda:0}, balkiPaSugam:{} }
  const rez = aprēķinātVērtību(kop, balkiPaSugam, prices, izmaksas)

  const handleFile = async (file) => {
    if (!file) return
    setLoading(true)
    setKļūda("")
    try {
      const parsed = await parsePDFarAI(file)
      setAiDati(parsed)
      setSaimnieciba(parsed.saimnieciba || "")
      setKadastrs(parsed.kadastrs || "")
      setNogabali(parsed.nogabali || [])
      setSolis(1)
    } catch (e) {
      setKļūda("AI kļūda: " + e.message)
    }
    setLoading(false)
  }

  const updateSuga = (nogIdx, sugaIdx, field, val) => {
    setNogabali(prev => prev.map((n, ni) => ni !== nogIdx ? n : {
      ...n,
      sugas: n.sugas.map((s, si) => si !== sugaIdx ? s : { ...s, [field]: parseFloat(val)||0 })
    }))
  }

  const exportPDF = () => {
    const today = new Date().toLocaleDateString("lv-LV")
    const nogStr = nogabali.map(n => `${n.nr} (${n.platiba}ha)`).join(", ")
    const balkiCena = rez.vidBalkasCena.toFixed(0)

    const html = `<!DOCTYPE html><html><head><meta charset="UTF-8">
<style>
body{font-family:Arial;font-size:10px;padding:20px;max-width:900px;margin:0 auto;color:#111}
h2{color:#1b3a1b;border-bottom:2px solid #1b3a1b;padding-bottom:3px;margin:12px 0 6px;font-size:12px}
table{border-collapse:collapse;width:100%;margin-bottom:10px;font-size:10px}
th{background:#1b3a1b;color:white;padding:3px 6px;text-align:left}
td{border:1px solid #ccc;padding:2px 6px}
tr:nth-child(even){background:#f4faf4}
.r{text-align:right}.total{background:#c8e6c9!important;font-weight:bold}
.neto{background:#a5d6a7!important;font-weight:bold;font-size:12px}
.red{color:#c62828}.green{color:#1b5e20}
</style></head><body>
<h1 style="font-size:14px;color:#1b3a1b;text-align:center">🌲 DASTOJUMA KALKULATORS</h1>
<p><b>Saimniecība:</b> ${saimnieciba||'—'} | <b>Kadastrs:</b> ${kadastrs||'—'} | <b>Datums:</b> ${today}</p>
<p><b>Nogabali:</b> ${nogStr} | <b>Kopējā likvīdā krāja:</b> ${rez.kopaM3.toFixed(2)} m³</p>

<h2>Sortimentu apjomi un vērtība</h2>
<table><thead><tr><th>Sortiments</th><th>m³</th><th>€/m³</th><th class="r">Vērtība €</th></tr></thead><tbody>
${kop.balki>0.01?`<tr><td>Baļķis (vid. ${balkiCena} €/m³)</td><td>${kop.balki.toFixed(1)}</td><td>${balkiCena}</td><td class="r">${(kop.balki*rez.vidBalkasCena).toFixed(0)}</td></tr>`:''}
${kop.sikbalki>0.01?`<tr><td>Sīkbaļķis</td><td>${kop.sikbalki.toFixed(1)}</td><td>${prices.sikbalki}</td><td class="r">${(kop.sikbalki*prices.sikbalki).toFixed(0)}</td></tr>`:''}
${kop.tara>0.01?`<tr><td>Tara</td><td>${kop.tara.toFixed(1)}</td><td>${prices.tara}</td><td class="r">${(kop.tara*prices.tara).toFixed(0)}</td></tr>`:''}
${kop.papirmalka>0.01?`<tr><td>Papīrmalka</td><td>${kop.papirmalka.toFixed(1)}</td><td>${prices.papirmalka}</td><td class="r">${(kop.papirmalka*prices.papirmalka).toFixed(0)}</td></tr>`:''}
${kop.malka>0.01?`<tr><td>Malka</td><td>${kop.malka.toFixed(1)}</td><td>${prices.malka}</td><td class="r">${(kop.malka*prices.malka).toFixed(0)}</td></tr>`:''}
<tr class="total"><td colspan="3">BRUTO vērtība</td><td class="r">${rez.bruto.toFixed(0)} €</td></tr>
</tbody></table>

<h2>Izmaksas un rezultāts</h2>
<table><tbody>
<tr><td>Izstrāde ${izmaksas.izstrade} €/m³ × ${rez.kopaM3.toFixed(1)} m³</td><td class="r red">−${rez.izm.toFixed(0)} €</td></tr>
<tr class="neto"><td><b>🌲 NETO KRAUTUVES VĒRTĪBA</b></td><td class="r green"><b>${rez.neto.toFixed(0)} €</b></td></tr>
<tr><td style="color:#888">Neto €/m³ (likvīdā krāja)</td><td class="r" style="color:#888">${rez.kopaM3>0?(rez.neto/rez.kopaM3).toFixed(2):0} €/m³</td></tr>
${kop.skelda>0.01?`<tr><td style="color:#e65100">Šķelda bonuss ${kop.skelda.toFixed(1)} m³ × ${Math.max(0,(prices.skelda||8)-(izmaksas.skelda_izvesana||5))} €/m³</td><td class="r" style="color:#e65100">+${rez.skeldaNeto.toFixed(0)} €</td></tr>
<tr class="total"><td><b>Neto ar šķeldas bonusu</b></td><td class="r green"><b>${(rez.neto+rez.skeldaNeto).toFixed(0)} €</b></td></tr>`:''}
</tbody></table>
<p style="font-size:8px;color:#aaa;margin-top:16px;text-align:center">Sagatavots ar Meža tirgus kalkulatoru | meža-tirgus.lv · ${today}</p>
</body></html>`
    const win = window.open("", "_blank")
    win.document.write(html)
    win.document.close()
    win.print()
  }

  // ── RENDER ────────────────────────────────────────────────────────────────

  const Hdr = () => (
    <div style={s.hdr}>
      <button style={s.backBtn} onClick={onBack}>← Atpakaļ</button>
      <h1 style={s.hdrTitle}>📄 Dastojuma kalkulators</h1>
      {solis > 0 && (
        <div style={{marginLeft:"auto", display:"flex", gap:6}}>
          {["Ielāde","Dastojums","Cenas","Rezultāts"].map((lb,i) => (
            <span key={i} onClick={() => solis>0 && setSolis(i)}
              style={{padding:"4px 10px",borderRadius:20,fontSize:11,cursor:"pointer",
                background: i===solis ? "#2e7d32" : "#1e3a1e",
                color: i===solis ? "white" : "#4caf50",
                border: `1px solid ${i===solis?"#4caf50":"#2d5a2d"}`}}>
              {lb}
            </span>
          ))}
        </div>
      )}
    </div>
  )

  // SOLIS 0 — ielāde
  if (solis === 0) return (
    <div style={s.app}>
      <Hdr/>
      <div style={s.body}>
        <div style={{...s.card, border:"1px solid #2d5a2d", textAlign:"center", padding:40}}>
          <div style={{fontSize:48, marginBottom:16}}>🌲</div>
          <div style={{fontSize:18, fontWeight:700, color:"#4caf50", marginBottom:8}}>Dastojuma kalkulators</div>
          <div style={{fontSize:13, color:"#81c784", marginBottom:24}}>Augšupielādē Mežvērtes vai Södra dastojuma PDF</div>
          <label style={{display:"inline-block", padding:"12px 32px", background:"linear-gradient(135deg,#2e7d32,#1b5e20)",
            color:"white", borderRadius:8, cursor:"pointer", fontSize:14, fontWeight:700}}>
            📁 Izvēlēties PDF failu
            <input type="file" accept="application/pdf" style={{display:"none"}}
              onChange={e => e.target.files[0] && handleFile(e.target.files[0])}/>
          </label>
          {loading && (
            <div style={{marginTop:20, color:"#81c784"}}>
              <div style={{fontSize:24, marginBottom:8}}>⏳</div>
              <div>AI lasa PDF... Lūdzu uzgaidi</div>
              <div style={{fontSize:11, color:"#4caf50", marginTop:4}}>Atkarībā no lappušu skaita var aizņemt 15–30 sekundes</div>
            </div>
          )}
          {kļūda && <div style={{marginTop:16, color:"#ef5350", fontSize:13}}>{kļūda}</div>}
        </div>

        <div style={{...s.card, fontSize:12, color:"#81c784"}}>
          <div style={{fontWeight:700, marginBottom:8, color:"#4caf50"}}>Atbalstītie formāti:</div>
          <div>✓ Mežvērtes InterReg formāts (Resnā/Vidējā/Tievā/P.malka/Malka/Atlikumi kolonnas)</div>
          <div>✓ Södra formāts (Likvīdā krāja / Vidējais koks kolonnas)</div>
          <div style={{marginTop:8, color:"#558b2f"}}>* AI automātiski nosaka formātu un nolasa datus</div>
        </div>
      </div>
    </div>
  )

  // SOLIS 1 — dastojuma pārbaude
  if (solis === 1) return (
    <div style={s.app}>
      <Hdr/>
      <div style={s.body}>
        <div style={s.card}>
          <div style={s.cardTitle}>📋 Cirsmas informācija</div>
          <div style={s.grid2}>
            <div>
              <label style={s.label}>Saimniecība</label>
              <input style={s.input} value={saimnieciba} onChange={e=>setSaimnieciba(e.target.value)}/>
            </div>
            <div>
              <label style={s.label}>Kadastra numurs</label>
              <input style={s.input} value={kadastrs} onChange={e=>setKadastrs(e.target.value)}/>
            </div>
          </div>
        </div>

        {nogabali.map((n, ni) => (
          <div key={ni} style={s.card}>
            <div style={s.cardTitle}>
              🌲 Nogabals {n.nr}
              <span style={{fontSize:11, color:"#81c784", fontWeight:400}}>| {n.platiba} ha</span>
            </div>
            <div style={{overflowX:"auto"}}>
              <table style={{width:"100%", minWidth:820, borderCollapse:"collapse", fontSize:11}}>
                <thead>
                  <tr style={{borderBottom:"1px solid #2d5a2d"}}>
                    {[["Suga",130],["Likvīdā m³",85],["Vid.koks m³",85],["Resnā",80],["Vidējā",80],["Tievā",80],["P.malka",80],["Malka",80],["Atlikumi",80]].map(([h,w]) => (
                      <th key={h} style={{padding:"4px 6px", color:"#4caf50", fontWeight:600, textAlign:"center", fontSize:10, minWidth:w}}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(n.sugas||[]).map((sg, si) => (
                    <tr key={si} style={{borderBottom:"1px solid #1e3a1e"}}>
                      <td style={{padding:"3px 6px", fontWeight:700, color:"#a5d6a7"}}>
                        {SUGAS_LV[sg.suga]||sg.suga}
                        <span style={{...s.tag("#4caf50"), marginLeft:4}}>{sg.suga}</span>
                        {!PAPIRMALKA_SUGAS.includes(sg.suga) && <span style={{...s.tag("#e65100"), marginLeft:2}}>M</span>}
                      </td>
                      {["likvid","vidKoks","resna","videja","tieva","pmalka","malka","atlik"].map(f => (
                        <td key={f} style={{padding:"2px 4px"}}>
                          <input type="number" step="0.01"
                            value={sg[f] ?? ""}
                            onChange={e => updateSuga(ni, si, f, e.target.value)}
                            style={{...s.inputSm, width:"100%", minWidth:68, background: sg[f]===null?"#1a0a00":"#070d07"}}
                            placeholder={sg[f]===null?"—":"0"}/>
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={{marginTop:8, fontSize:11, color:"#558b2f"}}>
              Kopā: {(n.sugas||[]).reduce((sum,sg)=>sum+(sg.likvid||0),0).toFixed(2)} m³ likvīdā |{" "}
              {(n.sugas||[]).reduce((sum,sg)=>sum+(sg.atlik||0),0).toFixed(2)} m³ šķelda bonuss
            </div>
          </div>
        ))}

        <div style={{display:"flex", gap:10}}>
          <button style={s.btn} onClick={()=>setSolis(2)}>Tālāk → Cenas ›</button>
          <button style={s.btnSm} onClick={()=>setSolis(0)}>← Jauns PDF</button>
        </div>
      </div>
    </div>
  )

  // SOLIS 2 — cenas un izmaksas
  if (solis === 2) return (
    <div style={s.app}>
      <Hdr/>
      <div style={s.body}>
        <div style={s.card}>
          <div style={s.cardTitle}>💶 Materiālu cenas (€/m³)</div>
          <div style={s.grid3}>
            {[
              ["balki_P","Baļķis Priede"],["balki_E","Baļķis Egle"],["balki_B","Baļķis Bērzs"],
              ["balki_A","Baļķis Apse"],["balki_M","Baļķis Melnalksnis"],["sikbalki","Sīkbaļķis"],
              ["tara","Tara"],["papirmalka","Papīrmalka"],["malka","Malka"],
              ["skelda","Šķelda (krautuvē)"]
            ].map(([k,lb]) => (
              <div key={k}>
                <label style={s.label}>{lb}</label>
                <input type="number" style={s.input} value={prices[k]}
                  onChange={e=>setPrices({...prices,[k]:parseFloat(e.target.value)||0})}/>
              </div>
            ))}
          </div>
        </div>

        <div style={s.card}>
          <div style={s.cardTitle}>🪚 Izstrādes izmaksas</div>
          <div style={s.grid2}>
            <div>
              <label style={s.label}>Izstrāde (harvesteris + pievešana) €/m³</label>
              <input type="number" style={s.input} value={izmaksas.izstrade}
                onChange={e=>setIzmaksas({...izmaksas,izstrade:parseFloat(e.target.value)||0})}/>
            </div>
            <div>
              <label style={s.label}>Šķeldas izvešana €/m³</label>
              <input type="number" style={s.input} value={izmaksas.skelda_izvesana}
                onChange={e=>setIzmaksas({...izmaksas,skelda_izvesana:parseFloat(e.target.value)||0})}/>
              <div style={{fontSize:10,color:"#558b2f",marginTop:3}}>
                Šķelda neto: {Math.max(0,(prices.skelda||8)-(izmaksas.skelda_izvesana||5))} €/m³
              </div>
            </div>
          </div>
        </div>

        <div style={{display:"flex", gap:10}}>
          <button style={s.btn} onClick={()=>setSolis(3)}>Aprēķināt ›</button>
          <button style={s.btnSm} onClick={()=>setSolis(1)}>← Dastojums</button>
        </div>
      </div>
    </div>
  )

  // SOLIS 3 — rezultāts
  if (solis === 3) return (
    <div style={s.app}>
      <Hdr/>
      <div style={s.body}>

        {/* Galvenie skaitļi */}
        <div style={{display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:10, marginBottom:14}}>
          <div style={{...s.card, textAlign:"center", border:"1px solid #2d5a2d"}}>
            <div style={{fontSize:10,color:"#81c784",textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:4}}>Likvīdā krāja</div>
            <div style={{fontSize:26,fontWeight:800,color:"#4caf50"}}>{rez.kopaM3.toFixed(1)}</div>
            <div style={{fontSize:11,color:"#558b2f"}}>m³</div>
          </div>
          <div style={{...s.card, textAlign:"center", border:"1px solid #c62828"}}>
            <div style={{fontSize:10,color:"#ef9a9a",textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:4}}>NETO krautuvē</div>
            <div style={{fontSize:26,fontWeight:800,color:rez.neto>=0?"#4caf50":"#ef5350"}}>{rez.neto.toFixed(0)}</div>
            <div style={{fontSize:11,color:"#558b2f"}}>€</div>
          </div>
          <div style={{...s.card, textAlign:"center", border:"1px solid #1565c0"}}>
            <div style={{fontSize:10,color:"#90caf9",textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:4}}>Vidēji €/m³</div>
            <div style={{fontSize:26,fontWeight:800,color:"#64b5f6"}}>{rez.kopaM3>0?(rez.neto/rez.kopaM3).toFixed(2):0}</div>
            <div style={{fontSize:11,color:"#1565c0"}}>€/m³</div>
          </div>
        </div>

        {/* Sortimentu tabula */}
        <div style={s.card}>
          <div style={s.cardTitle}>📦 Sortimentu sadalījums</div>
          <table style={{width:"100%", borderCollapse:"collapse", fontSize:12}}>
            <thead>
              <tr style={{borderBottom:"1px solid #2d5a2d"}}>
                {["Sortiments","m³","% no krājas","€/m³","Vērtība €"].map(h=>(
                  <th key={h} style={{padding:"5px 8px",color:"#4caf50",fontSize:10,textAlign:h==="Sortiments"?"left":"right"}}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {kop.balki > 0.01 && (
                <tr style={{borderBottom:"1px solid #1e3a1e"}}>
                  <td style={{padding:"4px 8px",color:"#a5d6a7",fontWeight:700}}>Baļķis</td>
                  <td style={{padding:"4px 8px",textAlign:"right"}}>{kop.balki.toFixed(1)}</td>
                  <td style={{padding:"4px 8px",textAlign:"right",color:"#558b2f"}}>{(kop.balki/rez.kopaM3*100).toFixed(1)}%</td>
                  <td style={{padding:"4px 8px",textAlign:"right"}}>{rez.vidBalkasCena.toFixed(0)}</td>
                  <td style={{padding:"4px 8px",textAlign:"right",fontWeight:700,color:"#4caf50"}}>{(kop.balki*rez.vidBalkasCena).toFixed(0)}</td>
                </tr>
              )}
              {["sikbalki","tara","papirmalka","malka"].map(k => kop[k]>0.01 && (
                <tr key={k} style={{borderBottom:"1px solid #1e3a1e"}}>
                  <td style={{padding:"4px 8px",color:"#a5d6a7"}}>{SORT_NAMES[k]}</td>
                  <td style={{padding:"4px 8px",textAlign:"right"}}>{kop[k].toFixed(1)}</td>
                  <td style={{padding:"4px 8px",textAlign:"right",color:"#558b2f"}}>{(kop[k]/rez.kopaM3*100).toFixed(1)}%</td>
                  <td style={{padding:"4px 8px",textAlign:"right"}}>{prices[k]}</td>
                  <td style={{padding:"4px 8px",textAlign:"right",fontWeight:700,color:"#4caf50"}}>{(kop[k]*prices[k]).toFixed(0)}</td>
                </tr>
              ))}
              <tr style={{borderTop:"2px solid #2d5a2d", background:"#1e3a1e"}}>
                <td style={{padding:"5px 8px",fontWeight:700}} colSpan={2}>BRUTO KOPĀ</td>
                <td style={{padding:"5px 8px",textAlign:"right",color:"#558b2f"}}>{rez.kopaM3.toFixed(1)} m³</td>
                <td></td>
                <td style={{padding:"5px 8px",textAlign:"right",fontWeight:700,color:"#4caf50"}}>{rez.bruto.toFixed(0)} €</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Aprēķina kopsavilkums */}
        <div style={s.card}>
          <div style={s.cardTitle}>💰 Vērtības aprēķins</div>
          <div style={{fontSize:13}}>
            {[
              ["Bruto sortimentu vērtība", rez.bruto.toFixed(0)+" €", "#4caf50"],
              [`Izstrāde ${izmaksas.izstrade} €/m³ × ${rez.kopaM3.toFixed(1)} m³`, "−"+rez.izm.toFixed(0)+" €", "#ef5350"],
            ].map(([lb,val,col],i) => (
              <div key={i} style={{display:"flex",justifyContent:"space-between",padding:"6px 0",borderBottom:"1px solid #1e3a1e"}}>
                <span style={{color:"#a5d6a7"}}>{lb}</span>
                <span style={{fontWeight:700,color:col}}>{val}</span>
              </div>
            ))}
            <div style={{display:"flex",justifyContent:"space-between",padding:"10px 0",borderBottom:"2px solid #2d5a2d"}}>
              <span style={{fontWeight:800,fontSize:15,color:"#4caf50"}}>🌲 NETO KRAUTUVES VĒRTĪBA</span>
              <span style={{fontWeight:800,fontSize:22,color:rez.neto>=0?"#4caf50":"#ef5350"}}>{rez.neto.toFixed(0)} €</span>
            </div>
            {kop.skelda > 0.01 && (
              <>
                <div style={{display:"flex",justifyContent:"space-between",padding:"6px 0",borderBottom:"1px solid #1e3a1e"}}>
                  <span style={{color:"#e65100"}}>Šķelda bonuss {kop.skelda.toFixed(1)} m³ × {Math.max(0,(prices.skelda||8)-(izmaksas.skelda_izvesana||5))} €/m³</span>
                  <span style={{fontWeight:700,color:"#e65100"}}>+{rez.skeldaNeto.toFixed(0)} €</span>
                </div>
                <div style={{display:"flex",justifyContent:"space-between",padding:"8px 0"}}>
                  <span style={{fontWeight:700,color:"#a5d6a7"}}>Neto ar šķeldas bonusu</span>
                  <span style={{fontWeight:800,fontSize:18,color:"#64b5f6"}}>{(rez.neto+rez.skeldaNeto).toFixed(0)} €</span>
                </div>
              </>
            )}
            <div style={{display:"flex",justifyContent:"space-between",padding:"4px 0",fontSize:11,color:"#558b2f"}}>
              <span>Vidēji €/m³ likvīdajai krājai</span>
              <span>{rez.kopaM3>0?(rez.neto/rez.kopaM3).toFixed(2):0} €/m³</span>
            </div>
            {kop.skelda > 0.01 && (
              <div style={{display:"flex",justifyContent:"space-between",padding:"4px 0",fontSize:11,color:"#558b2f"}}>
                <span>Vidēji €/m³ ar bonusu</span>
                <span>{rez.kopaM3>0?((rez.neto+rez.skeldaNeto)/rez.kopaM3).toFixed(2):0} €/m³</span>
              </div>
            )}
          </div>
        </div>

        {rez.neto < 0 && (
          <div style={{padding:12, background:"#1a0000", border:"1px solid #c62828", borderRadius:8, marginBottom:14, color:"#ef5350", fontSize:13, fontWeight:700}}>
            ⚠️ UZMANĪBU! Izstrādes izmaksas pārsniedz sortimentu vērtību — cirste ir nerentabla!
          </div>
        )}

        <div style={{display:"flex", gap:10}}>
          <button style={s.btn} onClick={exportPDF}>🖨 Drukāt / Saglabāt PDF</button>
          <button style={s.btnSm} onClick={()=>setSolis(2)}>← Labot cenas</button>
          <button style={s.btnSm} onClick={()=>{ setSolis(0); setNogabali([]); setAiDati(null); setSaimnieciba(""); setKadastrs("") }}>
            📁 Jauns PDF
          </button>
        </div>
      </div>
    </div>
  )

  return null
}
