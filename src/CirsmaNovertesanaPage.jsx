import { useState } from "react"
import * as pdfjsLib from "pdfjs-dist"
import { getBonitate } from "./bonityEngine"
import { calcSortimentsByQuality } from "./qualityEngine"
import { formFactor } from "./tables"

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url
).toString()

const SUGAS = ["P","E","Lg","B","Ba","Bl","A","Oz","Os","G","M"]
const KVALITATES = ["A1","A","B","C","D","Malka"]
const AUGSNES_TIPI = ["Sl","Mr","Vr","Dm","Db","Nd","Vrs","Ds","Ks","Lk","Pv"]
const PIEVESANA = ["Viegli","Vidēji","Smagi","Tikai ziemā"]
const SEZONA = ["Visu gadu","Tikai ziemā (Lg)","Sausa vasara"]
const KVALITATE_COLORS = {
  A1:"#1b5e20", A:"#388e3c", B:"#81c784", C:"#fff176", D:"#ffb74d", Malka:"#e57373"
}
const KVALITATE_TEXT_COLORS = {
  A1:"white", A:"white", B:"#1b5e20", C:"#5d4037", D:"#5d4037", Malka:"white"
}
const KVALITATE_DESC = {
  A1:"A1 — Izcila kvalitāte. Taisns, pilnkokains stumbrs bez mehāniskiem bojājumiem. Dominē zāģbaļķi, galotne — papīrmalka",
  A:"A — Augsta kvalitāte. Nelielas formas novirzes, minimāli zarainuma defekti. Lielākā daļa zāģbaļķi",
  B:"B — Vidēja kvalitāte. Izteiktāka zarainums vai formas novirzes. Aptuveni puse zāģbaļķi, puse papīrmalka",
  C:"C — Zema kvalitāte. Ievērojami stumbra defekti, liela zarainums vai liektums. Galvenokārt papīrmalka",
  D:"D — Ļoti zema kvalitāte. Trupe, mehāniski bojājumi, stiprs liektums. Gandrīz visa papīrmalka vai malka",
  Malka:"Malka — Nokaltis vai sanitārā cirte. Koksne izmantojama tikai malkai un šķeldai"
}
const CIRTE_VEIDS = ["Kailcirte","Caurmēra cirte","Kopšanas cirte","Sanitārā cirte"]

const defaultSuga = () => ({
  suga:"P", vecums:0, h:0, g:0,
  kvalitate:"A", bonitate:"", kraja:0, sortimenti:{}
})

const defaultNogabals = () => ({
  nr:"", platiba:"", augsneTips:"Vr",
  sugas:[defaultSuga()]
})

const defaultCirsma = () => ({
  nosaukums:"", cirteVeids:"Kailcirte",
  pievesana:"Vidēji", sezona:"Visu gadu",
  piezimes:"", nogabali:[defaultNogabals()],
  dastojums:null
})

const parseNum = (v) => parseFloat(String(v).replace(",",".")) || 0

export default function CirsmaNovertesanaPage({onBack, kadastrsIn="", saimniecibaIn=""}) {
  const [kadastrs, setKadastrs] = useState(kadastrsIn)
  const [saimnieciba, setSaimnieciba] = useState(saimniecibaIn)
  const [cirsmas, setCirsmas] = useState([defaultCirsma()])
  const [prices] = useState({
    log:93, small:65, veneer:130, tara:48, pulp:50, fire:38, chips:15
  })

  const sortimentNames = {
    log:"Zāģbaļķi", small:"Sīkbaļķi", veneer:"Finieris",
    tara:"Tara", pulp:"Papīrmalka", fire:"Malka", chips:"Šķelda"
  }

  // ---- Update helpers ----
  const updateCirsma = (ci, field, value) => {
    const n = [...cirsmas]; n[ci] = {...n[ci], [field]: value}; setCirsmas(n)
  }

  const updateNogabals = (ci, ni, field, value) => {
    const n = [...cirsmas]
    n[ci].nogabali[ni] = {...n[ci].nogabali[ni], [field]: value}
    setCirsmas(n)
  }

  const updateSuga = (ci, ni, si, field, value) => {
    const n = [...cirsmas]
    const nog = n[ci].nogabali[ni]
    const suga = {...nog.sugas[si], [field]: value}
    if(["suga","vecums","h","g"].includes(field)){
      const vec = field==="vecums" ? parseNum(value) : parseNum(suga.vecums)
      const h   = field==="h"     ? parseNum(value) : parseNum(suga.h)
      const g   = field==="g"     ? parseNum(value) : parseNum(suga.g)
      const sp  = field==="suga"  ? value : suga.suga
      if(vec>0 && h>0) suga.bonitate = getBonitate(sp, vec, h)
      const F = formFactor[sp] || 0.5
      const plat = parseNum(nog.platiba) || 1
      suga.kraja = g * h * F * plat
      suga.sortimenti = calcSortimentsByQuality(suga.kraja, sp, suga.kvalitate)
    }
    if(field==="kvalitate"){
      suga.sortimenti = calcSortimentsByQuality(parseNum(suga.kraja), suga.suga, value)
    }
    n[ci].nogabali[ni].sugas[si] = suga
    setCirsmas(n)
  }

  const addNogabals = (ci) => {
    const n = [...cirsmas]
    n[ci].nogabali = [...n[ci].nogabali, defaultNogabals()]
    setCirsmas(n)
  }

  const removeNogabals = (ci, ni) => {
    const n = [...cirsmas]
    n[ci].nogabali = n[ci].nogabali.filter((_,i)=>i!==ni)
    setCirsmas(n)
  }

  const addSuga = (ci, ni) => {
    const n = [...cirsmas]
    n[ci].nogabali[ni].sugas = [...n[ci].nogabali[ni].sugas, defaultSuga()]
    setCirsmas(n)
  }

  const removeSuga = (ci, ni, si) => {
    const n = [...cirsmas]
    n[ci].nogabali[ni].sugas = n[ci].nogabali[ni].sugas.filter((_,i)=>i!==si)
    setCirsmas(n)
  }

  const addCirsma = () => setCirsmas([...cirsmas, defaultCirsma()])
  const removeCirsma = (ci) => setCirsmas(cirsmas.filter((_,i)=>i!==ci))

  // ---- Totals ----
  const calcNogabalsTotal = (nog) => {
    const t = {log:0,small:0,veneer:0,tara:0,pulp:0,fire:0,chips:0}
    nog.sugas.forEach(s => Object.keys(t).forEach(k => { t[k] += s.sortimenti[k]||0 }))
    return t
  }

  const calcCirsmaTotal = (cirsma) => {
    const t = {log:0,small:0,veneer:0,tara:0,pulp:0,fire:0,chips:0}
    cirsma.nogabali.forEach(nog => {
      const nt = calcNogabalsTotal(nog)
      Object.keys(t).forEach(k => { t[k] += nt[k] })
    })
    return t
  }

  const calcValue = (s) =>
    Object.keys(s).reduce((sum,k) => sum + (s[k]||0)*(prices[k]||0), 0)

  // ---- Dastojums PDF ----
  const handleDastojumsPDF = async (ci, event) => {
    const file = event.target.files[0]; if(!file) return
    const reader = new FileReader()
    reader.onload = async function() {
      const pdf = await pdfjsLib.getDocument(new Uint8Array(this.result)).promise
      let txt = ""
      for(let p=1; p<=pdf.numPages; p++){
        const pg = await pdf.getPage(p)
        const tc = await pg.getTextContent()
        tc.items.forEach(i=>{ txt += i.str + " " })
      }
      const lower = txt.toLowerCase()
      const result = {}
      const names = {
        log:["zāģbaļķi","zaģbaļķi"], small:["sīkbaļķi"],
        veneer:["finieris"], tara:["tara"],
        pulp:["papīrmalka"], fire:["malka"], chips:["šķelda"]
      }
      Object.keys(names).forEach(k => {
        names[k].forEach(name => {
          const idx = lower.indexOf(name)
          if(idx !== -1){
            const m = lower.slice(idx, idx+40).match(/(\d+[\.,]\d+|\d+)/)
            if(m) result[k] = parseFloat(m[1].replace(",","."))
          }
        })
      })
      const n = [...cirsmas]; n[ci].dastojums = result; setCirsmas(n)
    }
    reader.readAsArrayBuffer(file)
  }

  // ---- Export PDF ----
  const exportPDF = () => {
    const today = new Date().toLocaleDateString("lv-LV")
    let html = `<html><head><meta charset="UTF-8"><style>
body{font-family:Arial;font-size:11px;padding:20px;max-width:1000px;margin:0 auto}
h1{color:#225522;text-align:center;font-size:16px}
h2{color:#225522;font-size:13px;margin-top:16px;border-bottom:1px solid #225522}
h3{font-size:11px;margin:6px 0;color:#444}
table{border-collapse:collapse;width:100%;margin-bottom:8px}
th{background:#225522;color:white;padding:3px 5px;font-size:9px}
td{border:1px solid #ccc;padding:2px 5px;font-size:9px}
tr:nth-child(even){background:#f0f8f0}
.kops{font-weight:bold;font-size:11px;margin:3px 0}
.logo{text-align:center;font-size:20px;font-weight:bold;color:#225522;margin-bottom:2px}
.sub{text-align:center;font-size:9px;color:#888;margin-bottom:12px}
.pos{color:#225522;font-weight:bold}.neg{color:#c62828;font-weight:bold}
</style></head><body>
<div class="logo">🌲 MEŽA TIRGUS</div>
<div class="sub">Cirsmas novērtēšanas pārskats</div>
<p><b>Kadastrs:</b> ${kadastrs} | <b>Saimniecība:</b> ${saimnieciba} | <b>Datums:</b> ${today}</p>`

    let kopaTotals = {log:0,small:0,veneer:0,tara:0,pulp:0,fire:0,chips:0}
    let kopaVertiba = 0

    cirsmas.forEach((cirsma, ci) => {
      const ct = calcCirsmaTotal(cirsma)
      const cv = calcValue(ct)
      Object.keys(kopaTotals).forEach(k => kopaTotals[k] += ct[k])
      kopaVertiba += cv
      const kopPlat = cirsma.nogabali.reduce((s,n)=>s+parseNum(n.platiba),0)

      html += `<h2>Cirsma ${ci+1}${cirsma.nosaukums?" — "+cirsma.nosaukums:""} | ${cirsma.cirteVeids} | ${kopPlat.toFixed(2)} ha | ${cirsma.pievesana}</h2>`

      cirsma.nogabali.forEach((nog, ni) => {
        const nt = calcNogabalsTotal(nog)
        const nv = calcValue(nt)
        const nVol = Object.values(nt).reduce((a,b)=>a+b,0)
        html += `<h3>Nogabals ${nog.nr||ni+1} — ${nog.platiba} ha | ${nog.augsneTips}</h3>`
        html += `<table><thead><tr><th>Suga</th><th>Vec</th><th>H</th><th>G</th><th>Bon</th><th>Kval</th><th>Krāja m³</th><th>Zāģbaļķi</th><th>Finieris</th><th>Tara</th><th>Papīrmalka</th><th>Malka</th><th>Šķelda</th></tr></thead><tbody>`
        nog.sugas.forEach(s => {
          html += `<tr><td>${s.suga}</td><td>${s.vecums}</td><td>${s.h}</td><td>${s.g}</td><td>${s.bonitate||"—"}</td><td>${s.kvalitate}</td><td>${s.kraja.toFixed(1)}</td><td>${(s.sortimenti.log||0).toFixed(1)}</td><td>${(s.sortimenti.veneer||0).toFixed(1)}</td><td>${(s.sortimenti.tara||0).toFixed(1)}</td><td>${(s.sortimenti.pulp||0).toFixed(1)}</td><td>${(s.sortimenti.fire||0).toFixed(1)}</td><td>${(s.sortimenti.chips||0).toFixed(1)}</td></tr>`
        })
        html += `</tbody></table><p class="kops">Nogabals kopā: ${nVol.toFixed(1)} m³ | ${nv.toFixed(0)} €</p>`
      })

      html += `<p class="kops">▶ Cirsma kopā: ${Object.values(ct).reduce((a,b)=>a+b,0).toFixed(1)} m³ | ${cv.toFixed(0)} €</p>`
      if(cirsma.piezimes) html += `<p><b>Piezīmes:</b> ${cirsma.piezimes}</p>`

      if(cirsma.dastojums && Object.keys(cirsma.dastojums).length > 0){
        html += `<h3>Salīdzinājums ar dastojumu</h3><table><thead><tr><th>Sortiments</th><th>Mērījumi m³</th><th>Dastojums m³</th><th>Starpība m³</th><th>%</th></tr></thead><tbody>`
        Object.keys(ct).forEach(k => {
          const m = ct[k]||0, d = cirsma.dastojums[k]||0
          if(m<0.1 && d<0.1) return
          const st = m-d, pct = d>0?((st/d)*100).toFixed(1):"—"
          const cls = st>=0?"pos":"neg"
          html += `<tr><td>${sortimentNames[k]}</td><td>${m.toFixed(1)}</td><td>${d.toFixed(1)}</td><td class="${cls}">${st>0?"+":""}${st.toFixed(1)}</td><td class="${cls}">${pct!=="—"?(st>0?"+":"")+pct+"%":"—"}</td></tr>`
        })
        html += `</tbody></table>`
      }
    })

    html += `<h2>KOPSAVILKUMS</h2><table><thead><tr><th>Sortiments</th><th>Kopā m³</th><th>Cena €/m³</th><th>Vērtība €</th></tr></thead><tbody>`
    Object.keys(kopaTotals).forEach(k => {
      if(kopaTotals[k]<0.1) return
      html += "<tr><td>"+sortimentNames[k]+"</td><td>"+kopaTotals[k].toFixed(1)+"</td><td>"+prices[k]+"</td><td>"+(kopaTotals[k]*prices[k]).toFixed(0)+"</td></tr>"
    })
    html += `</tbody></table><p class="kops" style="font-size:13px">KOPĒJĀ VĒRTĪBA: ${kopaVertiba.toFixed(0)} €</p>
<p style="font-size:8px;color:#888;margin-top:16px">* Sagatavots ar Meža tirgus kalkulatoru</p></body></html>`
    const win = window.open("","_blank")
    win.document.write(html); win.document.close(); win.print()
  }

  // ---- Render ----
  return (
    <div style={{padding:"40px",fontFamily:"Arial",maxWidth:"1200px"}}>
      <button onClick={onBack} style={{marginBottom:"16px",padding:"6px 14px",background:"#555",color:"white",border:"none",borderRadius:"4px",cursor:"pointer"}}>Atpakaļ</button>
      <h1 style={{color:"#225522"}}>🌲 Cirsmas novērtēšana</h1>
<div style={{float:"right",width:"220px",padding:"10px",background:"white",border:"1px solid #ccc",borderRadius:"6px",fontSize:"11px",marginLeft:"16px"}}>
  <b style={{fontSize:"12px",color:"#225522"}}>Kvalitātes klases:</b>
  {Object.keys(KVALITATE_DESC).map(k=>(
    <div key={k} style={{marginTop:"6px",padding:"4px 8px",borderRadius:"4px",background:KVALITATE_COLORS[k],color:KVALITATE_TEXT_COLORS[k]}}>
      {KVALITATE_DESC[k]}
    </div>
  ))}
</div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"12px",marginBottom:"20px",padding:"12px",background:"#f0f8f0",borderRadius:"6px",border:"1px solid #225522"}}>
        <div>
          <label style={{fontSize:"12px",fontWeight:"bold"}}>Kadastra numurs:</label><br/>
          <input value={kadastrs} onChange={e=>setKadastrs(e.target.value)} style={{width:"100%",padding:"4px",border:"1px solid #ccc",borderRadius:"4px"}}/>
        </div>
        <div>
          <label style={{fontSize:"12px",fontWeight:"bold"}}>Saimniecības nosaukums:</label><br/>
          <input value={saimnieciba} onChange={e=>setSaimnieciba(e.target.value)} style={{width:"100%",padding:"4px",border:"1px solid #ccc",borderRadius:"4px"}}/>
        </div>
      </div>

      {cirsmas.map((cirsma, ci) => {
        const ct = calcCirsmaTotal(cirsma)
        const cv = calcValue(ct)
        const kopPlat = cirsma.nogabali.reduce((s,n)=>s+parseNum(n.platiba),0)

        return (
          <div key={ci} style={{border:"2px solid #225522",borderRadius:"8px",padding:"16px",marginBottom:"24px",background:"white"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"12px"}}>
              <h2 style={{margin:0,color:"#225522"}}>Cirsma {ci+1} — {kopPlat.toFixed(2)} ha</h2>
              {cirsmas.length>1 && <button onClick={()=>removeCirsma(ci)} style={{background:"#c62828",color:"white",border:"none",borderRadius:"4px",padding:"4px 10px",cursor:"pointer"}}>Dzēst</button>}
            </div>

            <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:"8px",marginBottom:"16px",padding:"8px",background:"#f9f9f9",borderRadius:"4px"}}>
              <div>
                <label style={{fontSize:"11px",fontWeight:"bold"}}>Nosaukums:</label><br/>
                <input value={cirsma.nosaukums} onChange={e=>updateCirsma(ci,"nosaukums",e.target.value)} style={{width:"100%",padding:"4px",border:"1px solid #ccc",borderRadius:"4px",fontSize:"12px"}}/>
              </div>
              <div>
                <label style={{fontSize:"11px",fontWeight:"bold"}}>Cirtes veids:</label><br/>
                <select value={cirsma.cirteVeids} onChange={e=>updateCirsma(ci,"cirteVeids",e.target.value)} style={{width:"100%",padding:"4px",border:"1px solid #ccc",borderRadius:"4px",fontSize:"12px"}}>
                  {CIRTE_VEIDS.map(t=><option key={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label style={{fontSize:"11px",fontWeight:"bold"}}>Pievešana:</label><br/>
                <select value={cirsma.pievesana} onChange={e=>updateCirsma(ci,"pievesana",e.target.value)} style={{width:"100%",padding:"4px",border:"1px solid #ccc",borderRadius:"4px",fontSize:"12px"}}>
                  {PIEVESANA.map(p=><option key={p}>{p}</option>)}
                </select>
              </div>
              <div>
                <label style={{fontSize:"11px",fontWeight:"bold"}}>Sezona:</label><br/>
                <select value={cirsma.sezona} onChange={e=>updateCirsma(ci,"sezona",e.target.value)} style={{width:"100%",padding:"4px",border:"1px solid #ccc",borderRadius:"4px",fontSize:"12px"}}>
                  {SEZONA.map(s=><option key={s}>{s}</option>)}
                </select>
              </div>
              <div style={{gridColumn:"span 4"}}>
                <label style={{fontSize:"11px",fontWeight:"bold"}}>Piezīmes:</label><br/>
                <input value={cirsma.piezimes} onChange={e=>updateCirsma(ci,"piezimes",e.target.value)} style={{width:"100%",padding:"4px",border:"1px solid #ccc",borderRadius:"4px",fontSize:"12px"}} placeholder="Dzīvnieku bojājumi, piepe, pievešanas apstākļi..."/>
              </div>
            </div>

            {cirsma.nogabali.map((nog, ni) => {
              const nt = calcNogabalsTotal(nog)
              const nv = calcValue(nt)
              const nVol = Object.values(nt).reduce((a,b)=>a+b,0)

              return (
                <div key={ni} style={{border:"1px solid #aad4aa",borderRadius:"6px",padding:"12px",marginBottom:"12px",background:"#fafff8"}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"8px"}}>
                    <b style={{color:"#225522",fontSize:"13px"}}>Nogabals {ni+1}</b>
                    {cirsma.nogabali.length>1 && <button onClick={()=>removeNogabals(ci,ni)} style={{background:"none",border:"1px solid #c62828",color:"#c62828",borderRadius:"4px",padding:"2px 8px",cursor:"pointer",fontSize:"11px"}}>Dzēst nog.</button>}
                  </div>

                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:"8px",marginBottom:"10px"}}>
                    <div>
                      <label style={{fontSize:"11px",fontWeight:"bold"}}>Nogabala Nr.:</label><br/>
                      <input value={nog.nr} onChange={e=>updateNogabals(ci,ni,"nr",e.target.value)} style={{width:"100%",padding:"4px",border:"1px solid #ccc",borderRadius:"4px",fontSize:"12px"}} placeholder="p.ē. 5"/>
                    </div>
                    <div>
                      <label style={{fontSize:"11px",fontWeight:"bold"}}>Platība (ha):</label><br/>
                      <input value={nog.platiba} onChange={e=>updateNogabals(ci,ni,"platiba",e.target.value)} style={{width:"100%",padding:"4px",border:"1px solid #ccc",borderRadius:"4px",fontSize:"12px"}} placeholder="1,5"/>
                    </div>
                    <div>
                      <label style={{fontSize:"11px",fontWeight:"bold"}}>Augsnes tips:</label><br/>
                      <select value={nog.augsneTips} onChange={e=>updateNogabals(ci,ni,"augsneTips",e.target.value)} style={{width:"100%",padding:"4px",border:"1px solid #ccc",borderRadius:"4px",fontSize:"12px"}}>
                        {AUGSNES_TIPI.map(t=><option key={t}>{t}</option>)}
                      </select>
                    </div>
                  </div>

                  <div style={{overflowX:"auto"}}>
                    <table border="1" cellPadding="3" style={{fontSize:"11px",width:"100%",minWidth:"850px"}}>
                      <thead style={{background:"#2e7d32",color:"white"}}>
                        <tr>
                          <th>Suga</th><th>Vecums</th><th>H (m)</th><th>G (m²/ha)</th>
                          <th>Bonitāte</th><th>Kvalitāte</th><th>Krāja m³</th>
                          <th>Zāģbaļķi</th><th>Finieris</th><th>Tara</th><th>Papīrmalka</th><th>Malka</th><th>Šķelda</th>
                          <th>Vērtība €</th><th></th>
                        </tr>
                      </thead>
                      <tbody>
                        {nog.sugas.map((s, si) => (
                          <tr key={si} style={{background:si%2===0?"white":"#f0f8f0"}}>
                            <td>
                              <select value={s.suga} onChange={e=>updateSuga(ci,ni,si,"suga",e.target.value)} style={{padding:"2px",fontSize:"11px"}}>
                                {SUGAS.map(sg=><option key={sg}>{sg}</option>)}
                              </select>
                            </td>
                            <td><input type="number" value={s.vecums||""} onChange={e=>updateSuga(ci,ni,si,"vecums",e.target.value)} style={{width:"42px",fontSize:"11px"}}/></td>
                            <td><input type="number" value={s.h||""} onChange={e=>updateSuga(ci,ni,si,"h",e.target.value)} style={{width:"38px",fontSize:"11px"}}/></td>
                            <td><input value={s.g||""} onChange={e=>updateSuga(ci,ni,si,"g",e.target.value)} style={{width:"42px",fontSize:"11px"}}/></td>
                            <td style={{textAlign:"center",fontWeight:"bold",color:"#225522"}}>{s.bonitate||"—"}</td>
                            <td>
                              <select value={s.kvalitate} onChange={e=>updateSuga(ci,ni,si,"kvalitate",e.target.value)} style={{padding:"2px",fontSize:"11px"}}>
                                {KVALITATES.map(k=><option key={k}>{k}</option>)}
                              </select>
                            </td>
                            <td style={{textAlign:"right"}}>{s.kraja.toFixed(1)}</td>
                            <td style={{textAlign:"right"}}>{(s.sortimenti.log||0).toFixed(1)}</td>
                            <td style={{textAlign:"right"}}>{(s.sortimenti.veneer||0).toFixed(1)}</td>
                            <td style={{textAlign:"right"}}>{(s.sortimenti.tara||0).toFixed(1)}</td>
                            <td style={{textAlign:"right"}}>{(s.sortimenti.pulp||0).toFixed(1)}</td>
                            <td style={{textAlign:"right"}}>{(s.sortimenti.fire||0).toFixed(1)}</td>
                            <td style={{textAlign:"right"}}>{(s.sortimenti.chips||0).toFixed(1)}</td>
                            <td style={{textAlign:"right",fontWeight:"bold"}}>{calcValue(s.sortimenti).toFixed(0)}</td>
                            <td><button onClick={()=>removeSuga(ci,ni,si)} style={{background:"none",border:"none",color:"#c62828",cursor:"pointer",fontWeight:"bold"}}>×</button></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div style={{display:"flex",gap:"8px",marginTop:"6px",alignItems:"center"}}>
                    <button onClick={()=>addSuga(ci,ni)} style={{padding:"3px 10px",background:"#225522",color:"white",border:"none",borderRadius:"4px",cursor:"pointer",fontSize:"11px"}}>+ Suga</button>
                    <span style={{fontSize:"11px",color:"#225522",fontWeight:"bold"}}>{nVol.toFixed(1)} m³ | {nv.toFixed(0)} €</span>
                  </div>
                </div>
              )
            })}

            <div style={{display:"flex",gap:"8px",marginTop:"8px",alignItems:"center",flexWrap:"wrap"}}>
              <button onClick={()=>addNogabals(ci)} style={{padding:"5px 14px",background:"#1565c0",color:"white",border:"none",borderRadius:"4px",cursor:"pointer",fontSize:"12px"}}>+ Pievienot nogabalu</button>
              <div style={{padding:"8px 12px",background:"#e8f5e9",borderRadius:"4px",fontSize:"12px",fontWeight:"bold"}}>
                Cirsma kopā: {Object.values(ct).reduce((a,b)=>a+b,0).toFixed(1)} m³ | {cv.toFixed(0)} €
              </div>
              <div style={{display:"flex",alignItems:"center",gap:"6px"}}>
                <label style={{fontSize:"11px",fontWeight:"bold",color:"#1565c0"}}>Dastojuma PDF:</label>
                <input type="file" accept="application/pdf" onChange={e=>handleDastojumsPDF(ci,e)} style={{fontSize:"11px"}}/>
                {cirsma.dastojums && <span style={{color:"#225522",fontSize:"11px"}}>✓ Ielādēts</span>}
              </div>
            </div>

            {cirsma.dastojums && Object.keys(cirsma.dastojums).length>0 && (
              <div style={{marginTop:"10px",padding:"10px",background:"#fff8e1",border:"1px solid #f9a825",borderRadius:"6px"}}>
                <b style={{fontSize:"12px"}}>Salīdzinājums ar dastojumu:</b>
                <table border="1" cellPadding="3" style={{fontSize:"11px",marginTop:"6px",width:"100%"}}>
                  <thead style={{background:"#f9a825"}}>
                    <tr><th>Sortiments</th><th>Mani mērījumi m³</th><th>Dastojums m³</th><th>Starpība m³</th><th>%</th></tr>
                  </thead>
                  <tbody>
                    {Object.keys(ct).map(k => {
                      const m=ct[k]||0, d=cirsma.dastojums[k]||0
                      if(m<0.1 && d<0.1) return null
                      const st=m-d, pct=d>0?((st/d)*100).toFixed(1):"—"
                      return (
                        <tr key={k}>
                          <td>{sortimentNames[k]}</td>
                          <td style={{textAlign:"right"}}>{m.toFixed(1)}</td>
                          <td style={{textAlign:"right"}}>{d.toFixed(1)}</td>
                          <td style={{textAlign:"right",color:st>=0?"#225522":"#c62828",fontWeight:"bold"}}>{st>0?"+":""}{st.toFixed(1)}</td>
                          <td style={{textAlign:"right",color:st>=0?"#225522":"#c62828",fontWeight:"bold"}}>{pct!=="—"?(st>0?"+":"")+pct+"%":"—"}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )
      })}

      <div style={{display:"flex",gap:"10px",marginBottom:"20px"}}>
        <button onClick={addCirsma} style={{padding:"8px 20px",background:"#1565c0",color:"white",border:"none",borderRadius:"4px",cursor:"pointer"}}>+ Pievienot cirsmu</button>
        <button onClick={exportPDF} style={{padding:"8px 20px",background:"#225522",color:"white",border:"none",borderRadius:"4px",cursor:"pointer",fontSize:"14px"}}>Drukāt / Saglabāt PDF</button>
      </div>
    </div>
  )
}