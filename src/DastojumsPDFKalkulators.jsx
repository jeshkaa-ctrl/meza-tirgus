import { useState } from "react"
import * as pdfjsLib from "pdfjs-dist"

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url
).toString()

const SORT_NAMES = {
  log:"Baļķis (Resnā)", small:"Sīkbaļķis (Vidējā+Tievā)", veneer:"Finieris",
  tara:"Tara", pulp:"Papīrmalka", fire:"Malka", chips:"Atlikumi/Šķelda"
}
const DEFAULT_PRICES = {log:73, small:55, veneer:130, tara:48, pulp:50, fire:38, chips:12}
const DEFAULT_IZMAKSAS = {zaglesana:18, pievesana:12}

function parseMezvertePDF(txt) {
  const result = {
    nogabali:[], kopaKraja:0,
    log:0, small:0, veneer:0, tara:0, pulp:0, fire:0, chips:0
  }

  const kadMatch = txt.match(/(\d{11})/)
  result.kadastrs = kadMatch ? kadMatch[1] : ""
  result.saimnieciba = ""
  const saimMatch = txt.match(/([A-ZĀČĒĢĪĶĻŅŠŪŽ][a-zāčēģīķļņšūž]+)\s+\d{11}/)
  if(saimMatch) result.saimnieciba = saimMatch[1]

  const nogMatches = [...txt.matchAll(/Nogabals:\s*(\S+)/g)]
  const platibaMatches = [...txt.matchAll(/(\d+[.,]\d+)\s*ha/g)]
  result.nogabali = nogMatches
    .filter(m=>m[1]!=='A.Nogabals:' && !/^\d{2,}$/.test(m[1]) && m[1]!=='0')
    .map((m,i)=>({nr:m[1], platiba:platibaMatches[i]?.[1]?.replace(',','.')||""}))

  const getSortiments = (suga, resna, videja, tieva) => {
    const s = {log:0, small:0, veneer:0, tara:0}
    if(suga==='P'||suga==='E'||suga==='Lg') {
      s.log   = resna + videja*0.5
      s.small = videja*0.5 + tieva
    } else if(suga==='B') {
      s.veneer = resna
      s.tara   = videja + tieva
    } else if(suga==='A'||suga==='M') {
      s.log  = resna
      s.tara = videja + tieva
    } else if(suga==='Oz'||suga==='Os') {
      s.log   = resna
      s.small = videja
      s.tara  = tieva
    } else {
      s.tara = resna + videja + tieva
    }
    return s
  }

  // Sadala tekstu pa lapām
  const lapas = txt.split(/Cirsmas krāja,\s*m3:/)

  // Iegūst Kopā rindas
  const krajaRegex = /(\d[\d\s.,]+\d)\s+Kopā:\s+[\d.,]+\s*[\d.,]*\s*Cirsmas krāja/g
  let m
  const kopaRindas = []
  const txtTemp = txt
  while((m = krajaRegex.exec(txtTemp)) !== null) {
    const nums = m[1].match(/\d+[.,]\d+|\d+/g)?.map(n=>parseFloat(n.replace(',','.'))) || []
    if(nums.length >= 10) {
      let maxVal = 0, maxIdx = 1
      nums.forEach((v,i) => { if(v > maxVal && String(v).includes('.')) { maxVal = v; maxIdx = i } })
      kopaRindas.push({
        kraja: nums[maxIdx],
        pmalka: nums[maxIdx+6] || 0,
        malka:  nums[maxIdx+7] || 0,
        atlik:  nums[maxIdx+8] || 0
      })
    }
  }

  const SUGAS_MAP = {
    'Priede':'P','Egle':'E','Lapegle':'Lg',
    'Bērzs':'B','Baltalksnis':'Ba','Melnalksnis':'M',
    'Apse':'A','Ozols':'Oz','Osis':'Os','Goba':'G'
  }

  lapas.forEach((lapa, li) => {
    if(li >= kopaRindas.length) return
    const kopa = kopaRindas[li]
    result.kopaKraja += kopa.kraja
    result.pulp  += kopa.pmalka
    result.fire  += kopa.malka
    result.chips += kopa.atlik

   Object.keys(SUGAS_MAP).forEach(nos => {
      const suga = SUGAS_MAP[nos]
      const regex = new RegExp(nos + '\\s+([\\d\\s.,]+?)(?=' +
        Object.keys(SUGAS_MAP).join('|') + '|Kopā)', 'g')
      let sm
      while((sm = regex.exec(lapa)) !== null) {
        const nums = sm[1].match(/\d+[.,]\d+|\d+/g)?.map(n=>parseFloat(n.replace(',','.'))) || []
        if(nums.length < 6) continue
        const stumbr = nums[2] || 0
        if(stumbr < 0.01) continue
        const resna  = nums[4] || 0
        const videja = nums[5] || 0
        const tieva  = nums[6] || 0
        
        const s = getSortiments(suga, resna, videja, tieva)
        result.log    += s.log
        result.small  += s.small
        result.veneer += s.veneer
        result.tara   += s.tara
      }
    })
  })

  return result
}

export default function DastojumsPDFKalkulators({ onBack }) {
  const [dati, setDati] = useState(null)
  const [saimnieciba, setSaimnieciba] = useState("")
  const [kadastrs, setKadastrs] = useState("")
  const [prices, setPrices] = useState({...DEFAULT_PRICES})
  const [izmaksas, setIzmaksas] = useState({zaglesana:"18", pievesana:"12"})
  const [loading, setLoading] = useState(false)
  const [apreklinats, setApreklinats] = useState(false)

  const parseDastojums = async (file) => {
    setLoading(true)
    setApreklinats(false)
    try {
      const reader = new FileReader()
      reader.onload = async function() {
        const pdf = await pdfjsLib.getDocument(new Uint8Array(this.result)).promise
        let txt = ""
        for(let p = 1; p <= pdf.numPages; p++) {
          const pg = await pdf.getPage(p)
          const tc = await pg.getTextContent()
          tc.items.forEach(i => { txt += i.str + " " })
        }
        const parsed = parseMezvertePDF(txt)
        setDati(parsed)
        if(parsed.saimnieciba) setSaimnieciba(parsed.saimnieciba)
        if(parsed.kadastrs) setKadastrs(parsed.kadastrs)
        setLoading(false)
      }
      reader.readAsArrayBuffer(file)
    } catch(e) {
      setLoading(false)
      alert("Kļūda lasot PDF!")
    }
  }

  const updateDati = (field, val) => {
    const d = {...dati, [field]: parseFloat(val)||0}
    d.kopaKraja = ['log','small','tara','pulp','fire','chips','veneer'].reduce((s,k)=>s+(d[k]||0),0)
    setDati(d)
  }

  const zagNum = parseFloat(String(izmaksas.zaglesana).replace(',','.')) || 0
  const pievNum = parseFloat(String(izmaksas.pievesana).replace(',','.')) || 0

  const kopsavilkums = apreklinats && dati ? (() => {
    const sortVertiba = Object.keys(SORT_NAMES).reduce((s,k)=>s+(dati[k]||0)*(prices[k]||0),0)
    const kopaKraja = dati.kopaKraja
    const zaglesanaKopa = kopaKraja * zagNum
    const pievesanaKopa = kopaKraja * pievNum
    const izstrade = zaglesanaKopa + pievesanaKopa
    const krautuvesVertiba = sortVertiba - izstrade
    return {sortVertiba, kopaKraja, izstrade, krautuvesVertiba, zaglesanaKopa, pievesanaKopa}
  })() : null

  const exportPDF = () => {
    if(!kopsavilkums) return
    const today = new Date().toLocaleDateString("lv-LV")
    const nogStr = dati.nogabali?.map(n=>`${n.nr}(${n.platiba}ha)`).join(", ") || "—"
    const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Dastojuma kalkulators</title>
<style>body{font-family:Arial;font-size:11px;padding:20px;max-width:900px;margin:0 auto}h2{color:#225522;border-bottom:2px solid #225522;padding-bottom:4px}table{border-collapse:collapse;width:100%;margin-bottom:12px}th{background:#225522;color:white;padding:4px 8px;font-size:10px;text-align:left}td{border:1px solid #ccc;padding:3px 8px;font-size:10px}tr:nth-child(even){background:#f0f8f0}.logo{font-size:18px;font-weight:bold;color:#225522}</style>
</head><body>
<div class="logo">🌲 MEŽA TIRGUS — Dastojuma kalkulators</div>
<p><b>Saimniecība:</b> ${saimnieciba||'—'} | <b>Kadastrs:</b> ${kadastrs||'—'} | <b>Datums:</b> ${today}</p>
<p><b>Nogabali:</b> ${nogStr} | <b>Kopējā krāja:</b> ${kopsavilkums.kopaKraja.toFixed(2)} m³</p>
<h2>Sortimentu apjomi un vērtība</h2>
<table><thead><tr><th>Sortiments</th><th>Apjoms m³</th><th>Cena €/m³</th><th>Vērtība €</th></tr></thead><tbody>
${Object.keys(SORT_NAMES).filter(k=>(dati[k]||0)>0.01).map(k=>`<tr><td>${SORT_NAMES[k]}</td><td>${(dati[k]||0).toFixed(2)}</td><td>${prices[k]}</td><td>${((dati[k]||0)*prices[k]).toFixed(0)}</td></tr>`).join("")}
</tbody><tfoot><tr style="background:#e8f5e9;font-weight:bold"><td colspan="3">Sortimentu vērtība kopā</td><td>${kopsavilkums.sortVertiba.toFixed(0)} €</td></tr></tfoot></table>
<h2>Izstrādes izmaksas</h2>
<table><thead><tr><th>Pakalpojums</th><th>Apjoms m³</th><th>Cena €/m³</th><th>Summa €</th></tr></thead><tbody>
<tr><td>Zāģēšana</td><td>${kopsavilkums.kopaKraja.toFixed(2)}</td><td>${zagNum}</td><td>${kopsavilkums.zaglesanaKopa.toFixed(0)}</td></tr>
<tr><td>Pievešana/izvešana</td><td>${kopsavilkums.kopaKraja.toFixed(2)}</td><td>${pievNum}</td><td>${kopsavilkums.pievesanaKopa.toFixed(0)}</td></tr>
</tbody><tfoot><tr style="background:#fff8e1;font-weight:bold"><td colspan="3">Izstrādes izmaksas kopā</td><td>${kopsavilkums.izstrade.toFixed(0)} €</td></tr></tfoot></table>
<h2>Kopsavilkums</h2>
<table><tbody>
<tr><td>Kopējā krāja</td><td style="text-align:right"><b>${kopsavilkums.kopaKraja.toFixed(2)} m³</b></td></tr>
<tr><td>Sortimentu vērtība</td><td style="text-align:right"><b>${kopsavilkums.sortVertiba.toFixed(0)} €</b></td></tr>
<tr><td>Izstrādes izmaksas (${zagNum+pievNum} €/m³)</td><td style="text-align:right"><b style="color:#c62828">− ${kopsavilkums.izstrade.toFixed(0)} €</b></td></tr>
<tr style="background:#e8f5e9"><td><b>🌲 KRAUTUVES VĒRTĪBA</b></td><td style="text-align:right"><b style="color:${kopsavilkums.krautuvesVertiba>=0?'#225522':'#c62828'};font-size:14px">${kopsavilkums.krautuvesVertiba.toFixed(0)} €</b></td></tr>
<tr><td style="color:#888">Krautuves cena uz m³</td><td style="text-align:right;color:#888">${kopsavilkums.kopaKraja>0?(kopsavilkums.krautuvesVertiba/kopsavilkums.kopaKraja).toFixed(2):0} €/m³</td></tr>
</tbody></table>
<p style="font-size:9px;color:#888;margin-top:16px">* Sagatavots ar Meža tirgus kalkulatoru · ${today}</p>
</body></html>`
    const win = window.open("","_blank")
    win.document.write(html)
    win.document.close()
    win.print()
  }

  return (
    <div style={{padding:"32px",fontFamily:"Arial",maxWidth:"900px"}}>
      <div style={{display:"flex",gap:"8px",marginBottom:"20px",alignItems:"center",flexWrap:"wrap"}}>
        <button onClick={onBack} style={{padding:"6px 14px",background:"#555",color:"white",border:"none",borderRadius:"4px",cursor:"pointer"}}>← Atpakaļ</button>
        <h1 style={{margin:0,color:"#225522",fontSize:"18px"}}>📄 Dastojuma kalkulators</h1>
      </div>

      <div style={{padding:"16px",background:"#f0f8f0",border:"1px solid #225522",borderRadius:"8px",marginBottom:"16px"}}>
        <b style={{color:"#225522"}}>1. Augšupielādē Mežvērtes dastojuma PDF</b>
        <div style={{marginTop:"8px",display:"flex",gap:"12px",alignItems:"center",flexWrap:"wrap"}}>
          <input type="file" accept="application/pdf" onChange={e=>{if(e.target.files[0])parseDastojums(e.target.files[0])}}/>
          {loading && <span style={{color:"#1565c0"}}>⏳ Lasa PDF...</span>}
          {dati && !loading && <span style={{color:"#225522",fontWeight:"bold"}}>✓ Ielādēts — {dati.nogabali?.length||0} nogabali, krāja: {dati.kopaKraja.toFixed(2)} m³</span>}
        </div>
      </div>

      {dati && (
        <>
          <div style={{padding:"12px",background:"white",border:"1px solid #ccc",borderRadius:"8px",marginBottom:"16px"}}>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"12px"}}>
              <div>
                <label style={{fontSize:"11px",fontWeight:"bold"}}>Saimniecība:</label><br/>
                <input value={saimnieciba} onChange={e=>setSaimnieciba(e.target.value)} style={{width:"100%",padding:"4px",border:"1px solid #ccc",borderRadius:"4px"}}/>
              </div>
              <div>
                <label style={{fontSize:"11px",fontWeight:"bold"}}>Kadastrs:</label><br/>
                <input value={kadastrs} onChange={e=>setKadastrs(e.target.value)} style={{width:"100%",padding:"4px",border:"1px solid #ccc",borderRadius:"4px"}}/>
              </div>
            </div>
            {dati.nogabali?.length>0 && (
              <div style={{marginTop:"8px",fontSize:"11px",color:"#555"}}>
                <b>Nogabali:</b> {dati.nogabali.map(n=>`${n.nr} (${n.platiba} ha)`).join(" | ")}
              </div>
            )}
          </div>

          <div style={{padding:"16px",background:"white",border:"1px solid #ccc",borderRadius:"8px",marginBottom:"16px"}}>
            <b style={{color:"#225522"}}>2. Pārbaudi sortimentu apjomus (var labot)</b>
            <div style={{fontSize:"11px",color:"#888",marginBottom:"8px",marginTop:"4px"}}>Dati nolasīti no PDF — pārbaudi vai atbilst oriģinālam</div>
            <table border="1" cellPadding="5" style={{fontSize:"12px",width:"100%",borderCollapse:"collapse"}}>
              <thead style={{background:"#225522",color:"white"}}>
                <tr><th>Sortiments</th><th>Apjoms m³</th><th>Cena €/m³</th><th>Vērtība €</th></tr>
              </thead>
              <tbody>
                {Object.keys(SORT_NAMES).map(k=>(
                  <tr key={k} style={{background:(dati[k]||0)>0.01?"white":"#f9f9f9"}}>
                    <td style={{fontWeight:(dati[k]||0)>0.01?"bold":"normal",color:(dati[k]||0)>0.01?"#225522":"#aaa"}}>{SORT_NAMES[k]}</td>
                    <td><input type="number" step="0.01" value={(dati[k]||0).toFixed(2)} onChange={e=>updateDati(k,e.target.value)} style={{width:"90px",padding:"3px",border:"1px solid #ccc",borderRadius:"3px",fontSize:"12px"}}/></td>
                    <td><input value={prices[k]} onChange={e=>setPrices({...prices,[k]:e.target.value})} onBlur={e=>{const v=parseFloat(String(e.target.value).replace(',','.'))||0;setPrices({...prices,[k]:v})}} style={{width:"60px",padding:"3px",border:"1px solid #ccc",borderRadius:"3px",fontSize:"12px"}}/></td>
                    <td style={{textAlign:"right",fontWeight:"bold",color:(dati[k]||0)>0.01?"#225522":"#ccc"}}>{((dati[k]||0)*(parseFloat(String(prices[k]).replace(',','.'))||0)).toFixed(0)} €</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr style={{background:"#e8f5e9",fontWeight:"bold"}}>
                  <td colSpan="2">Kopējā krāja: {dati.kopaKraja.toFixed(2)} m³</td>
                  <td>Sortimentu vērtība:</td>
                  <td style={{textAlign:"right"}}>{Object.keys(SORT_NAMES).reduce((s,k)=>s+(dati[k]||0)*(prices[k]||0),0).toFixed(0)} €</td>
                </tr>
              </tfoot>
            </table>
          </div>

          <div style={{padding:"16px",background:"white",border:"1px solid #ccc",borderRadius:"8px",marginBottom:"16px"}}>
            <b style={{color:"#225522"}}>3. Izstrādes izmaksas</b>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"12px",marginTop:"8px"}}>
              <div style={{padding:"10px",background:"#fff8e1",borderRadius:"6px",border:"1px solid #f9a825"}}>
                <label style={{fontSize:"11px",fontWeight:"bold"}}>🪚 Zāģēšana €/m³:</label><br/>
                <input inputMode="decimal" value={izmaksas.zaglesana}
                  onChange={e=>setIzmaksas({...izmaksas,zaglesana:e.target.value})}
                  style={{width:"80px",padding:"6px",border:"1px solid #ccc",borderRadius:"4px",fontSize:"14px",marginTop:"4px"}}/>
                <div style={{fontSize:"11px",color:"#888",marginTop:"4px"}}>Kopā: {(dati.kopaKraja*zagNum).toFixed(0)} €</div>
              </div>
              <div style={{padding:"10px",background:"#fff8e1",borderRadius:"6px",border:"1px solid #f9a825"}}>
                <label style={{fontSize:"11px",fontWeight:"bold"}}>🚜 Pievešana/izvešana €/m³:</label><br/>
                <input inputMode="decimal" value={izmaksas.pievesana}
                  onChange={e=>setIzmaksas({...izmaksas,pievesana:e.target.value})}
                  style={{width:"80px",padding:"6px",border:"1px solid #ccc",borderRadius:"4px",fontSize:"14px",marginTop:"4px"}}/>
                <div style={{fontSize:"11px",color:"#888",marginTop:"4px"}}>Kopā: {(dati.kopaKraja*pievNum).toFixed(0)} €</div>
              </div>
            </div>
            <div style={{marginTop:"10px",padding:"8px",background:"#fff8e1",borderRadius:"4px",fontSize:"12px",fontWeight:"bold"}}>
              Izstrādes izmaksas kopā: {(dati.kopaKraja*(zagNum+pievNum)).toFixed(0)} € &nbsp;|&nbsp; {zagNum+pievNum} €/m³ × {dati.kopaKraja.toFixed(2)} m³
            </div>
          </div>

          <button onClick={()=>setApreklinats(true)} style={{padding:"12px 32px",background:"#225522",color:"white",border:"none",borderRadius:"6px",cursor:"pointer",fontSize:"15px",fontWeight:"bold",marginBottom:"16px"}}>
            📊 Aprēķināt
          </button>

          {kopsavilkums && (
            <div style={{padding:"20px",background:kopsavilkums.krautuvesVertiba>=0?"#e8f5e9":"#ffebee",border:`2px solid ${kopsavilkums.krautuvesVertiba>=0?"#225522":"#c62828"}`,borderRadius:"8px",marginBottom:"16px"}}>
              <b style={{fontSize:"14px",color:"#225522"}}>4. Rezultāts</b>
              <table style={{width:"100%",marginTop:"12px",fontSize:"13px",borderCollapse:"collapse"}}>
                <tbody>
                  <tr style={{borderBottom:"1px solid #ccc"}}><td style={{padding:"6px 0"}}>Kopējā krāja</td><td style={{textAlign:"right",fontWeight:"bold"}}>{kopsavilkums.kopaKraja.toFixed(2)} m³</td></tr>
                  <tr style={{borderBottom:"1px solid #ccc"}}><td style={{padding:"6px 0"}}>Sortimentu vērtība</td><td style={{textAlign:"right",fontWeight:"bold",color:"#225522"}}>{kopsavilkums.sortVertiba.toFixed(0)} €</td></tr>
                  <tr style={{borderBottom:"1px solid #ccc"}}><td style={{padding:"6px 0"}}>🪚 Zāģēšana ({zagNum} €/m³)</td><td style={{textAlign:"right",color:"#c62828"}}>− {kopsavilkums.zaglesanaKopa.toFixed(0)} €</td></tr>
                  <tr style={{borderBottom:"2px solid #225522"}}><td style={{padding:"6px 0"}}>🚜 Pievešana ({pievNum} €/m³)</td><td style={{textAlign:"right",color:"#c62828"}}>− {kopsavilkums.pievesanaKopa.toFixed(0)} €</td></tr>
                  <tr><td style={{padding:"10px 0"}}><b style={{fontSize:"16px"}}>🌲 Krautuves vērtība (cenu griesti)</b></td><td style={{textAlign:"right"}}><b style={{fontSize:"24px",color:kopsavilkums.krautuvesVertiba>=0?"#225522":"#c62828"}}>{kopsavilkums.krautuvesVertiba.toFixed(0)} €</b></td></tr>
                  <tr><td style={{fontSize:"11px",color:"#888"}}>Krautuves cena uz m³</td><td style={{textAlign:"right",fontSize:"11px",color:"#888"}}>{kopsavilkums.kopaKraja>0?(kopsavilkums.krautuvesVertiba/kopsavilkums.kopaKraja).toFixed(2):0} €/m³</td></tr>
                </tbody>
              </table>
              {kopsavilkums.krautuvesVertiba < 0 && (
                <div style={{marginTop:"10px",padding:"10px",background:"#ffebee",borderRadius:"4px",color:"#c62828",fontWeight:"bold",fontSize:"13px"}}>
                  ⚠️ UZMANĪBU! Izstrādes izmaksas pārsniedz sortimentu vērtību — cirste ir nerentabla!
                </div>
              )}
              <button onClick={exportPDF} style={{marginTop:"16px",padding:"10px 24px",background:"#225522",color:"white",border:"none",borderRadius:"6px",cursor:"pointer",fontSize:"14px"}}>
                🖨 Drukāt / Saglabāt PDF
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}