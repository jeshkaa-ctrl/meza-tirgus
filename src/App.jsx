import React, { useState, useRef } from "react"
import { useAuth } from "./useAuth"
import RegModal from "./RegModal"
import * as pdfjsLib from "pdfjs-dist"
import CirsmaNovertesanaPage from "./CirsmaNovertesanaPage"
import PdfSkirotajsPage from "./PdfSkirotajsPage"
import { forestEngine } from "./forestEngine"
import { getBonitate } from "./bonityEngine"
import { minDiameter, formFactor } from "./tables"
import { calcSortimentsByQuality } from "./qualityEngine"
import StandardPage, { JaunaudžuParskats, AtjaunosanaParskats, IeaudzesanaParskats } from "./StandardPage"
import DastojumsPanel from "./DastojumsPanel"
import SludinajumiPage from "./SludinajumiPage"
import CaurmeraMobile from "./CaurmeraMobile"
import CirsmaNovertesanaMobile from "./CirsmaNovertesanaMobile"

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
"pdfjs-dist/build/pdf.worker.min.mjs",
import.meta.url
).toString()
// ========== CAURMERA PANELS ==========
function CaurmeraPanel({kadastrs="", nogabals="", saimnieciba="", savedState, onSaveState, user, onReg}) {
  const [suga, setSuga] = useState(savedState?.suga||"P")
  const [vecums, setVecums] = useState(savedState?.vecums||"")
  const [h, setH] = useState(savedState?.h||"")
  const [merijumi, setMerijumi] = useState(
    savedState?.merijumi || Array.from({length:40}, (_,i) => ({d: 15+i, n: 0}))
  )

  const saglabat = (jaunie) => onSaveState?.({
    suga: jaunie?.suga??suga,
    vecums: jaunie?.vecums??vecums,
    h: jaunie?.h??h,
    merijumi: jaunie?.merijumi??merijumi
  })

  const notirit = () => {
    if(window.confirm("Dzēst mērījumus?")) {
      const tuksi = Array.from({length:40}, (_,i) => ({d: 15+i, n: 0}))
      setMerijumi(tuksi)
      setSuga("P"); setVecums(""); setH("")
      onSaveState?.(null)
    }
  }

  const updateN = (i, val) => {
    const m = [...merijumi]
    m[i] = {...m[i], n: Number(val)||0}
    setMerijumi(m)
    saglabat({merijumi:m})
  }

 const [jaunsD, setJaunsD] = useState("")
  const [jaunsN, setJaunsN] = useState("")

  const pievienotManuali = () => {
    const d = Math.round(parseFloat(jaunsD)||0)
    const n = Math.max(0, parseInt(jaunsN)||0)
    if(!d || d < 5) return
    const esošs = merijumi.findIndex(r => r.d === d)
    let jauniM
    if(esošs !== -1) {
      jauniM = [...merijumi]
      jauniM[esošs] = {...jauniM[esošs], n: jauniM[esošs].n + n}
    } else {
      jauniM = [...merijumi, {d, n}].sort((a,b) => a.d - b.d)
    }
    setMerijumi(jauniM)
    saglabat({merijumi: jauniM})
    setJaunsD(""); setJaunsN("")
  }

  const sumDN = merijumi.reduce((s,r) => s + r.d*r.n, 0)
  const sumN = merijumi.reduce((s,r) => s + r.n, 0)
  const videjaisD = sumN > 0 ? (sumDN / sumN).toFixed(1) : "—"

 const bon = (vecums && h) ? getBonitate(suga, Number(vecums), Number(h)) : null
  const minD = bon ? (minDiameter[suga]?.[bon] || 0) : 0
  const cirteAtlauta = sumN > 0 && Math.round(parseFloat(videjaisD)) >= minD

  // Krājas aprēķins
  const [kvalitate, setKvalitate] = useState("A")
  const [platiba, setPlatiba2] = useState("")
  const kraja = (sumN > 0 && h) ? (() => {
    const F = formFactor[suga] || 0.5
    return merijumi.reduce((sum, r) => {
      if(!r.n) return sum
      const d = r.d / 100
      const vol = Math.PI * (d/2)**2 * Number(h) * F * r.n
      return sum + vol
    }, 0)
  })() : 0
  const sortimenti = (() => {
    if(kraja <= 0) return {}
    if(suga === "B") {
      const tot = kraja
      if(kvalitate === "A1" || kvalitate === "A") {
        return {log:0, veneer:tot*0.35, tara:tot*0.40, pulp:tot*0.20, chips:tot*0.05, small:0, fire:0}
      } else if(kvalitate === "B") {
        return {log:0, veneer:tot*0.15, tara:tot*0.35, pulp:tot*0.40, chips:tot*0.10, small:0, fire:0}
      } else if(kvalitate === "C") {
        return {log:0, veneer:0, tara:tot*0.20, pulp:tot*0.68, chips:tot*0.12, small:0, fire:0}
      } else {
        return {log:0, veneer:0, tara:0, pulp:tot*0.78, chips:tot*0.22, small:0, fire:0}
      }
    }
    return calcSortimentsByQuality(kraja, suga, kvalitate, parseFloat(videjaisD))
  })()
  const sortimentNames = {log:"Zāģbaļķi",small:"Sīkbaļķi",veneer:"Finieris",tara:"Tara",pulp:"Papīrmalka",fire:"Malka",chips:"Šķelda"}

  const exportPDF = () => {
    const today = new Date().toLocaleDateString("lv-LV")
    const aktiveRindas = merijumi.filter(r => r.n > 0)
    const col1 = aktiveRindas.slice(0, Math.ceil(aktiveRindas.length/3))
    const col2 = aktiveRindas.slice(Math.ceil(aktiveRindas.length/3), Math.ceil(aktiveRindas.length*2/3))
    const col3 = aktiveRindas.slice(Math.ceil(aktiveRindas.length*2/3))
    const maxRows = Math.max(col1.length, col2.length, col3.length)
    let tabRindas = ""
    for(let i=0; i<maxRows; i++) {
      const r1=col1[i], r2=col2[i], r3=col3[i]
      tabRindas += `<tr>
        <td>${i+1}.</td>
        <td>${r1?r1.d:""}</td><td>${r1?r1.n:""}</td><td>${r1?r1.d*r1.n:""}</td>
        <td>${r2?r2.d:""}</td><td>${r2?r2.n:""}</td><td>${r2?r2.d*r2.n:""}</td>
        <td>${r3?r3.d:""}</td><td>${r3?r3.n:""}</td><td>${r3?r3.d*r3.n:""}</td>
      </tr>`
    }
    const html = `<html><head><meta charset="UTF-8"><style>
body{font-family:Arial;font-size:10px;padding:20px;max-width:900px;margin:0 auto}
h3{text-align:center;font-size:12px;margin-bottom:4px}
table{border-collapse:collapse;width:100%;margin:8px 0}
th{background:#1565c0;color:white;padding:3px 5px;font-size:9px;text-align:center}
td{border:1px solid #ccc;padding:2px 5px;text-align:center;font-size:9px}
.info td{border:none;text-align:left;padding:2px 8px;font-size:10px}
.result{padding:8px;margin:8px 0;border-radius:4px;font-weight:bold;font-size:11px}
</style></head><body>
<h3>Mežaudzes valdošās koku sugas pirmā stāva koku caurmēru mērījumi,<br/>uzmērot visus valdošās koku sugas pirmā stāva kokus</h3>
<table class="info"><tbody>
<tr><td><b>Īpašuma nosaukums:</b></td><td>${saimnieciba||"___________________"}</td><td><b>Kadastrs:</b></td><td>${kadastrs||"___________________"}</td></tr>
<tr><td><b>Nogabals:</b></td><td>${nogabals||"___________________"}</td><td><b>Datums:</b></td><td>${today}</td></tr>
<tr><td><b>Valdošā suga:</b></td><td>${suga}</td><td><b>Vecums:</b></td><td>${vecums||"—"} gadi</td></tr>
<tr><td><b>Vidējais augstums:</b></td><td>${h||"—"} m</td><td><b>Bonitāte:</b></td><td>${bon||"—"}</td></tr>
</tbody></table>
<table>
<thead><tr>
<th>Nr.</th>
<th>d (cm)</th><th>N</th><th>d×N</th>
<th>d (cm)</th><th>N</th><th>d×N</th>
<th>d (cm)</th><th>N</th><th>d×N</th>
</tr></thead>
<tbody>${tabRindas}</tbody>
<tfoot>
<tr style="background:#e3f2fd;font-weight:bold">
  <td colspan="3">Caurmēru summa Σ(d×N)</td>
  <td colspan="3">${sumDN}</td>
  <td colspan="2">Koku skaits N</td>
  <td>${sumN}</td>
</tr>
<tr style="background:#1565c0;color:white;font-weight:bold">
  <td colspan="7">Vidējais caurmērs D = Σ(d×N) / N</td>
  <td colspan="3">${videjaisD} cm</td>
</tr>
</tfoot>
</table>
<div style="display:flex;justify-content:space-between;margin-top:40px;font-size:10px">
  <div>Izpildīja: ___________________________<br/><span style="font-size:8px">(vārds, uzvārds, paraksts, datums)</span></div>
  <div>Iesniedza: ___________________________<br/><span style="font-size:8px">(vārds, uzvārds, paraksts, datums)</span></div>
</div>
<p style="font-size:8px;color:#888;margin-top:16px">* Sagatavots ar Meža tirgus kalkulatoru</p>
</body></html>`
    const win = window.open("","_blank")
    win.document.write(html)
    win.document.close()
    win.print()
  }

  return (
    <div style={{marginTop:"24px",padding:"20px",border:"2px solid #1565c0",borderRadius:"8px",background:"white"}}>
      <h2 style={{color:"#1565c0",marginTop:0}}>📏 Caurmēra mērījumi</h2>

      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:"8px",marginBottom:"16px"}}>
        <div>
          <label style={{fontSize:"11px",fontWeight:"bold"}}>Valdošā suga:</label><br/>
          <select value={suga} onChange={e=>{setSuga(e.target.value);saglabat({suga:e.target.value})}} style={{width:"100%",padding:"4px",border:"1px solid #ccc",borderRadius:"4px"}}>
            <option>P</option><option>E</option><option>B</option>
          </select>
        </div>
        <div>
          <label style={{fontSize:"11px",fontWeight:"bold"}}>Vecums (gadi):</label><br/>
          <input type="number" value={vecums} onChange={e=>{setVecums(e.target.value);saglabat({vecums:e.target.value})}} style={{width:"100%",padding:"4px",border:"1px solid #ccc",borderRadius:"4px"}}/>
        </div>
        <div>
          <label style={{fontSize:"11px",fontWeight:"bold"}}>Vidējais augstums (m):</label><br/>
          <input type="number" value={h} onChange={e=>{setH(e.target.value);saglabat({h:e.target.value})}} style={{width:"100%",padding:"4px",border:"1px solid #ccc",borderRadius:"4px"}}/>
        </div>
        <div style={{display:"flex",alignItems:"flex-end"}}>
          <button onClick={notirit} style={{padding:"4px 12px",background:"#c62828",color:"white",border:"none",borderRadius:"4px",cursor:"pointer",fontSize:"11px"}}>🗑 Dzēst mērījumus</button>
        </div>
      </div>
      <div style={{display:"flex",gap:"8px",marginBottom:"12px",flexWrap:"wrap",alignItems:"center"}}>
      {user
          ? <button onClick={exportPDF} style={{padding:"6px 16px",background:"#225522",color:"white",border:"none",borderRadius:"4px",cursor:"pointer"}}>🖨 Drukāt / Saglabāt PDF</button>
          : <button onClick={()=>onReg?.()} style={{padding:"6px 16px",background:"#888",color:"white",border:"none",borderRadius:"4px",cursor:"pointer"}}>🔒 Reģistrējies lai drukātu PDF</button>
        }
        <a href="https://www.vmd.gov.lv" target="_blank" rel="noreferrer" style={{padding:"6px 14px",background:"#5d4037",color:"white",borderRadius:"4px",textDecoration:"none",fontSize:"13px"}}>🏛 VMD</a>
        <div style={{display:"flex",gap:"6px",alignItems:"center",background:"#f0f4ff",padding:"6px 10px",borderRadius:"6px",border:"1px solid #1565c0"}}>
          <span style={{fontSize:"11px",fontWeight:"bold",color:"#1565c0"}}>Manuāli:</span>
          <input type="number" value={jaunsD} onChange={e=>setJaunsD(e.target.value)} placeholder="d (cm)" style={{width:"60px",padding:"4px",border:"1px solid #ccc",borderRadius:"3px",fontSize:"12px"}}/>
          <input type="number" value={jaunsN} onChange={e=>setJaunsN(e.target.value)} placeholder="skaits" style={{width:"55px",padding:"4px",border:"1px solid #ccc",borderRadius:"3px",fontSize:"12px"}}/>
          <button onClick={pievienotManuali} style={{padding:"4px 10px",background:"#1565c0",color:"white",border:"none",borderRadius:"4px",cursor:"pointer",fontSize:"11px"}}>+ Pievienot</button>
        </div>
        <label style={{padding:"6px 16px",background:"#1565c0",color:"white",borderRadius:"4px",cursor:"pointer",fontSize:"13px"}}>
          📂 Augšupielādēt CSV
          <input type="file" accept=".csv" style={{display:"none"}} onChange={e=>{
            const file = e.target.files[0]; if(!file) return
            const reader = new FileReader()
            reader.onload = (ev) => {
              const text = ev.target.result
              const lines = text.split("\n").filter(l=>l.trim())
              const jaunie = [...merijumi]
              lines.forEach(line => {
                const parts = line.split(";")
                if(parts.length < 2) return
                const d = parseInt(parts[0])
                const n = parseInt(parts[1])
                if(isNaN(d) || isNaN(n)) return
                const idx = jaunie.findIndex(r => r.d === d)
                if(idx !== -1) jaunie[idx] = {...jaunie[idx], n}
              })
              setMerijumi(jaunie)
              saglabat({merijumi:jaunie})
            }
            reader.readAsText(file)
          }}/>
        </label>
      </div>

      {sumN > 0 && h && (
        <div style={{marginTop:"16px",padding:"12px",border:"1px solid #225522",borderRadius:"6px",background:"#f0f8f0"}}>
          <b style={{color:"#225522"}}>🌲 Krājas aprēķins</b>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"8px",marginTop:"8px"}}>
            
            <div>
              <label style={{fontSize:"11px",fontWeight:"bold"}}>Kvalitāte:</label><br/>
              <select value={kvalitate} onChange={e=>setKvalitate(e.target.value)} style={{width:"100%",padding:"4px",border:"1px solid #ccc",borderRadius:"4px"}}>
                <option>A1</option><option>A</option><option>B</option><option>C</option><option>D</option><option>Papīrmalka</option><option>Malka</option>
              </select>
            </div>
          </div>
          {kraja > 0 && (
            <div style={{marginTop:"10px"}}>
              <div style={{fontWeight:"bold",fontSize:"12px",color:"#225522",marginBottom:"6px"}}>Kopējā krāja: {kraja.toFixed(1)} m³</div>
              <table border="1" cellPadding="3" style={{fontSize:"11px",width:"100%"}}>
                <thead style={{background:"#225522",color:"white"}}>
                  <tr><th>Sortiments</th><th>m³</th></tr>
                </thead>
                <tbody>
                  {Object.keys(sortimenti).filter(k=>sortimenti[k]>0.1).map(k=>(
                    <tr key={k}><td>{sortimentNames[k]}</td><td style={{textAlign:"right"}}>{sortimenti[k].toFixed(1)}</td></tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
{vecums && h && (
        <div style={{marginBottom:"16px",padding:"12px",borderRadius:"6px",border:`2px solid ${cirteAtlauta?"#388e3c":"#c62828"}`,background:cirteAtlauta?"#e8f5e9":"#ffebee"}}>
          <b style={{fontSize:"13px",color:cirteAtlauta?"#225522":"#c62828"}}>
            {cirteAtlauta ? "✅ CIRTE ATĻAUTA" : "⛔ CIRTE NAV ATĻAUTA"}
          </b><br/>
          <span style={{fontSize:"11px"}}>
            Bonitāte: <b>{bon||"—"}</b> | 
            Minimālais caurmērs: <b>{minD} cm</b> | 
            Uzmērītais vidējais D: <b>{videjaisD} cm</b>
          </span>
          {!cirteAtlauta && sumN > 0 && (
            <div style={{marginTop:"6px",fontSize:"11px",color:"#c62828"}}>
              ⚠️ Vidējais caurmērs {videjaisD} cm ir mazāks par minimālo {minD} cm — nav jēgas iesniegt iesniegumu
            </div>
          )}
          {cirteAtlauta && (
            <div style={{marginTop:"6px",fontSize:"11px",color:"#225522"}}>
              ✓ Var iesniegt iesniegumu VMD par caurmēra cirtes apliecinājumu
            </div>
          )}
        </div>
      )}
      <div style={{overflowX:"auto"}}>
        <table border="1" cellPadding="4" style={{fontSize:"11px",minWidth:"600px",width:"100%"}}>
          <thead style={{background:"#1565c0",color:"white"}}>
            <tr>
              <th>Nr.</th>
              <th>Caurmērs d (cm)</th>
              <th>Koku skaits N</th>
              <th>d × N</th>
            </tr>
          </thead>
          <tbody>
            {merijumi.map((r,i) => (
              <tr key={i} style={{background:i%2===0?"white":"#f0f4ff"}}>
                <td>{i+1}.</td>
                <td>{r.d}</td>
                <td>
                  <input type="number" value={r.n||""} onChange={e=>updateN(i,e.target.value)}
                    style={{width:"60px",border:"1px solid #ccc",borderRadius:"3px",padding:"2px"}}/>
                </td>
                <td style={{textAlign:"right"}}>{r.d * r.n || 0}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr style={{background:"#e3f2fd",fontWeight:"bold"}}>
              <td colSpan="2">Kopsumma</td>
              <td>{sumN}</td>
              <td style={{textAlign:"right"}}>{sumDN}</td>
            </tr>
            <tr style={{background:"#1565c0",color:"white",fontWeight:"bold"}}>
              <td colSpan="3">Vidējais caurmērs D = Σ(d×N) / N</td>
              <td style={{textAlign:"right"}}>{videjaisD} cm</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  )
}
// ========== REKINA PANELIS ==========
function RekinsPanel({kadastrs, saimnieciba, platiba, onClose, user, onReg}){
const [sniedzejs, setSniedzejs] = useState(()=>JSON.parse(localStorage.getItem("rekins_sniedzejs")||"{}"))
const [sanemejs, setSanemejs] = useState({nosaukums:saimnieciba||"", regNr:"", adrese:"", banka:"", kods:"", konts:""})
const [rekinsNr, setRekinsNr] = useState(()=>{const n=Number(localStorage.getItem("rekins_nr")||0)+1;return n})
const [datums, setDatums] = useState(new Date().toLocaleDateString("lv-LV"))
const [apmaksaTermins, setApmaksaTermins] = useState(()=>{const d=new Date();d.setDate(d.getDate()+10);return d.toLocaleDateString("lv-LV")})
const [periods, setPeriods] = useState("")
const [pvnRezims, setPvnRezims] = useState("bez")
const [rindas, setRindas] = useState([
  {apraksts: kadastrs ? `Meža inventarizācija, kad.Nr. ${kadastrs}` : "", mervieniba:"ha", daudzums: platiba>0?platiba.toFixed(2):"", cena:"", summa:0}
])
const [izrakstija, setIzrakstija] = useState(sniedzejs.izrakstija||"")

const saveSniedzejs = (jauns) => {
  const j = {...sniedzejs, ...jauns}
  setSniedzejs(j)
  localStorage.setItem("rekins_sniedzejs", JSON.stringify(j))
}

const updateRinda = (i, field, val) => {
  const n = [...rindas]
  n[i] = {...n[i], [field]: val}
  if(field==="daudzums" || field==="cena"){
    const d = parseFloat(n[i].daudzums)||0
    const c = parseFloat(n[i].cena)||0
    n[i].summa = d*c
  }
  setRindas(n)
}

const pievienotRindu = () => setRindas([...rindas, {apraksts:"", mervieniba:"ha", daudzums:"", cena:"", summa:0}])
const dzestRindu = (i) => setRindas(rindas.filter((_,j)=>j!==i))

const kopaa = rindas.reduce((s,r)=>s+(r.summa||0), 0)
const pvn = pvnRezims==="pvn21" ? kopaa*0.21 : 0
const kopa_apmaksai = kopaa + pvn

const skaitliVardos = (n) => {
  const v = Math.floor(n)
  const c = Math.round((n-v)*100)
  const vieninieki = ["","viens","divi","trīs","četri","pieci","seši","septiņi","astoņi","deviņi","desmit","vienpadsmit","divpadsmit","trīspadsmit","četrpadsmit","piecpadsmit","sešpadsmit","septiņpadsmit","astoņpadsmit","deviņpadsmit"]
  const desmiti = ["","","divdesmit","trīsdesmit","četrdesmit","piecdesmit","sešdesmit","septiņdesmit","astoņdesmit","deviņdesmit"]
  const simti = ["","simts","divi simti","trīs simti","četri simti","pieci simti","seši simti","septiņi simti","astoņi simti","deviņi simti"]
  let s = ""
  if(v >= 1000) s += (v>=2000?vieninieki[Math.floor(v/1000)]+" ":"")+"tūkstoši "
  const h = Math.floor((v%1000)/100)
  if(h) s += simti[h]+" "
  const t = Math.floor((v%100)/10)
  const o = v%10
  if(v%100 < 20) s += vieninieki[v%100]+" "
  else { if(t) s += desmiti[t]+" "; if(o) s += vieninieki[o]+" " }
  return s.trim()+" euro "+(c>0?`un ${c} centi`:"un 00 centi")
}

const exportRekins = () => {
  localStorage.setItem("rekins_nr", rekinsNr)
const saglabataisRekinis = {
  id: Date.now(),
  nr: rekinsNr,
  gads: new Date().getFullYear(),
  datums,
  klients: sanemejs.nosaukums || "—",
  summa: kopa_apmaksai.toFixed(2),
  pvnRezims,
  sniedzejs: {...sniedzejs},
  sanemejs: {...sanemejs},
  rindas: [...rindas],
  periods,
  apmaksaTermins,
  izrakstija
}
const esosie = JSON.parse(localStorage.getItem("rekinu_kratuve") || "[]")
localStorage.setItem("rekinu_kratuve", JSON.stringify([saglabataisRekinis, ...esosie]))
  const gads = new Date().getFullYear()
  const html = `<html><head><meta charset="UTF-8">
<style>
body{font-family:Arial;font-size:11px;padding:24px;max-width:850px;margin:0 auto}
h2{text-align:center;font-size:13px;margin:4px 0}
table{border-collapse:collapse;width:100%;margin:8px 0}
th{background:#225522;color:white;padding:4px 8px;font-size:10px;text-align:left}
td{border:1px solid #ccc;padding:3px 8px;font-size:10px}
.info td{border:none;padding:2px 4px}
.label{font-weight:bold}
.total{font-weight:bold;background:#f0f8f0}
</style></head><body>
<p style="text-align:right;font-size:11px">${datums} &nbsp;&nbsp;&nbsp; <b>Rēķins Nr. ${rekinsNr} - ${gads}</b></p>
<table class="info"><tbody>
<tr><td style="width:50%;vertical-align:top">
<b>Pakalpojumu sniedzējs:</b><br/>
${sniedzejs.nosaukums||"___________________"}<br/>
Reģ.Nr. ${sniedzejs.regNr||"___________________"}<br/>
${sniedzejs.adrese||"___________________"}<br/>
Banka: ${sniedzejs.banka||"___________________"}<br/>
Kods: ${sniedzejs.kods||"___________________"}<br/>
Konts: ${sniedzejs.konts||"___________________"}
</td><td style="vertical-align:top">
<b>Pakalpojumu saņēmējs:</b><br/>
${sanemejs.nosaukums||"___________________"}<br/>
Reģ.Nr. ${sanemejs.regNr||"___________________"}<br/>
${sanemejs.adrese||"___________________"}<br/>
Banka: ${sanemejs.banka||"___________________"}<br/>
Kods: ${sanemejs.kods||"___________________"}<br/>
Konts: ${sanemejs.konts||"___________________"}
</td></tr>
</tbody></table>
${periods?`<p><b>Pakalpojumu sniegšanas periods:</b> ${periods}</p>`:""}
<p><b>Apmaksāt:</b> Līdz ${apmaksaTermins}</p>
<table>
<thead><tr><th>Nr.</th><th>Pakalpojuma nosaukums</th><th>Mērv.</th><th>Daudzums</th><th>Cena</th><th>Summa, EUR</th></tr></thead>
<tbody>
${rindas.map((r,i)=>`<tr><td>${i+1}</td><td>${r.apraksts}</td><td>${r.mervieniba}</td><td>${r.daudzums}</td><td>${parseFloat(r.cena||0).toFixed(2)}</td><td>${(r.summa||0).toFixed(2)}</td></tr>`).join("")}
</tbody>
<tfoot>
<tr class="total"><td colspan="5">Kopā</td><td>${kopaa.toFixed(2)}</td></tr>
${pvnRezims==="pvn21"?`<tr><td colspan="5">PVN 21%</td><td>${pvn.toFixed(2)}</td></tr><tr class="total"><td colspan="5">Kopā apmaksai</td><td>${kopa_apmaksai.toFixed(2)}</td></tr>`:""}
${pvnRezims==="reversais"?`<tr><td colspan="6" style="font-style:italic">Reversa PVN piemērošana saskaņā ar PVN likuma 142. pantu</td></tr>`:""}
</tfoot>
</table>
<p>Summa apmaksai vārdiem: <b>${skaitliVardos(kopa_apmaksai)}</b></p>
<div style="display:flex;justify-content:space-between;margin-top:30px;font-size:11px">
<div>Rēķinu izrakstīja: <b>${izrakstija||"___________________"}</b> ___________________________</div>
<div>${datums}</div>
</div>
<p style="font-size:9px;color:#888;margin-top:16px">Dokuments sagatavots elektroniski un derīgs bez paraksta.</p>
</body></html>`
  const win = window.open("","_blank")
  win.document.write(html)
  win.document.close()
  win.print()
  alert("✅ Rēķins Nr. " + rekinsNr + " saglabāts rēķinu krātuvē!")
}

return(
<div style={{marginTop:"24px",padding:"20px",border:"2px solid #e65100",borderRadius:"8px",background:"white"}}>
  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"16px"}}>
    <h2 style={{color:"#e65100",margin:0}}>🧾 Rēķina sagatave</h2>
    <button onClick={onClose} style={{padding:"4px 12px",background:"#888",color:"white",border:"none",borderRadius:"4px",cursor:"pointer"}}>✕ Aizvērt</button>
  </div>
  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"16px",marginBottom:"16px"}}>
    <div style={{padding:"12px",background:"#f0f8f0",borderRadius:"6px",border:"1px solid #225522"}}>
      <b style={{color:"#225522"}}>Pakalpojumu sniedzējs</b>
      {[["nosaukums","Nosaukums"],["regNr","Reģ.Nr."],["adrese","Adrese"],["banka","Banka"],["kods","SWIFT kods"],["konts","Konts"]].map(([k,l])=>(
        <div key={k} style={{marginTop:"6px"}}>
          <label style={{fontSize:"10px",fontWeight:"bold"}}>{l}:</label><br/>
          <input value={sniedzejs[k]||""} onChange={e=>saveSniedzejs({[k]:e.target.value})} style={{width:"100%",padding:"3px",border:"1px solid #ccc",borderRadius:"3px",fontSize:"11px"}}/>
        </div>
      ))}
      <div style={{marginTop:"6px"}}>
        <label style={{fontSize:"10px",fontWeight:"bold"}}>Rēķinu izrakstīja:</label><br/>
        <input value={izrakstija} onChange={e=>{setIzrakstija(e.target.value);saveSniedzejs({izrakstija:e.target.value})}} style={{width:"100%",padding:"3px",border:"1px solid #ccc",borderRadius:"3px",fontSize:"11px"}}/>
      </div>
    </div>
    <div style={{padding:"12px",background:"#fff8e1",borderRadius:"6px",border:"1px solid #f9a825"}}>
      <b style={{color:"#e65100"}}>Pakalpojumu saņēmējs</b>
      {[["nosaukums","Nosaukums"],["regNr","Reģ.Nr."],["adrese","Adrese"],["banka","Banka"],["kods","SWIFT kods"],["konts","Konts"]].map(([k,l])=>(
        <div key={k} style={{marginTop:"6px"}}>
          <label style={{fontSize:"10px",fontWeight:"bold"}}>{l}:</label><br/>
          <input value={sanemejs[k]||""} onChange={e=>setSanemejs({...sanemejs,[k]:e.target.value})} style={{width:"100%",padding:"3px",border:"1px solid #ccc",borderRadius:"3px",fontSize:"11px"}}/>
        </div>
      ))}
    </div>
  </div>
  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",gap:"8px",marginBottom:"12px"}}>
    <div>
      <label style={{fontSize:"10px",fontWeight:"bold"}}>Rēķina Nr.:</label><br/>
      <input value={rekinsNr} onChange={e=>setRekinsNr(e.target.value)} style={{width:"100%",padding:"3px",border:"1px solid #ccc",borderRadius:"3px",fontSize:"11px"}}/>
    </div>
    <div>
      <label style={{fontSize:"10px",fontWeight:"bold"}}>Datums:</label><br/>
      <input value={datums} onChange={e=>setDatums(e.target.value)} style={{width:"100%",padding:"3px",border:"1px solid #ccc",borderRadius:"3px",fontSize:"11px"}}/>
    </div>
    <div>
      <label style={{fontSize:"10px",fontWeight:"bold"}}>Apmaksas termiņš:</label><br/>
      <input value={apmaksaTermins} onChange={e=>setApmaksaTermins(e.target.value)} style={{width:"100%",padding:"3px",border:"1px solid #ccc",borderRadius:"3px",fontSize:"11px"}}/>
    </div>
    <div>
      <label style={{fontSize:"10px",fontWeight:"bold"}}>Periods:</label><br/>
      <input value={periods} onChange={e=>setPeriods(e.target.value)} placeholder="piem. 2026. gada marts" style={{width:"100%",padding:"3px",border:"1px solid #ccc",borderRadius:"3px",fontSize:"11px"}}/>
    </div>
  </div>
  <div style={{marginBottom:"12px"}}>
    <label style={{fontSize:"10px",fontWeight:"bold"}}>PVN režīms:</label><br/>
    <select value={pvnRezims} onChange={e=>setPvnRezims(e.target.value)} style={{padding:"4px",border:"1px solid #ccc",borderRadius:"3px",fontSize:"11px"}}>
      <option value="bez">Bez PVN</option>
      <option value="pvn21">PVN 21%</option>
      <option value="reversais">Reversais PVN (142. pants)</option>
    </select>
  </div>
  <table border="1" cellPadding="4" style={{fontSize:"11px",width:"100%",marginBottom:"8px"}}>
    <thead style={{background:"#225522",color:"white"}}>
      <tr><th>Nr.</th><th>Pakalpojuma nosaukums</th><th>Mērv.</th><th>Daudzums</th><th>Cena €</th><th>Summa €</th><th></th></tr>
    </thead>
    <tbody>
      {rindas.map((r,i)=>(
        <tr key={i}>
          <td>{i+1}</td>
          <td><input value={r.apraksts} onChange={e=>updateRinda(i,"apraksts",e.target.value)} style={{width:"100%",border:"none",fontSize:"11px"}}/></td>
          <td><input value={r.mervieniba} onChange={e=>updateRinda(i,"mervieniba",e.target.value)} style={{width:"40px",border:"none",fontSize:"11px"}}/></td>
          <td><input type="number" value={r.daudzums} onChange={e=>updateRinda(i,"daudzums",e.target.value)} style={{width:"60px",border:"none",fontSize:"11px"}}/></td>
          <td><input type="number" value={r.cena} onChange={e=>updateRinda(i,"cena",e.target.value)} style={{width:"60px",border:"none",fontSize:"11px"}}/></td>
          <td style={{textAlign:"right"}}>{(r.summa||0).toFixed(2)}</td>
          <td><button onClick={()=>dzestRindu(i)} style={{background:"none",border:"none",color:"#c62828",cursor:"pointer"}}>✕</button></td>
        </tr>
      ))}
    </tbody>
    <tfoot>
      <tr style={{background:"#f0f8f0",fontWeight:"bold"}}>
        <td colSpan="5">Kopā</td><td style={{textAlign:"right"}}>{kopaa.toFixed(2)}</td><td/>
      </tr>
      {pvnRezims==="pvn21" && <>
        <tr><td colSpan="5">PVN 21%</td><td style={{textAlign:"right"}}>{pvn.toFixed(2)}</td><td/></tr>
        <tr style={{background:"#e8f5e9",fontWeight:"bold"}}><td colSpan="5">Kopā apmaksai</td><td style={{textAlign:"right"}}>{kopa_apmaksai.toFixed(2)}</td><td/></tr>
      </>}
      {pvnRezims==="reversais" && <tr><td colSpan="7" style={{fontStyle:"italic",fontSize:"10px"}}>Reversa PVN piemērošana saskaņā ar PVN likuma 142. pantu</td></tr>}
    </tfoot>
  </table>
  <button onClick={pievienotRindu} style={{padding:"4px 12px",background:"#1565c0",color:"white",border:"none",borderRadius:"4px",cursor:"pointer",fontSize:"11px",marginBottom:"12px"}}>+ Pievienot rindu</button>
  <div style={{padding:"8px",background:"#f0f8f0",borderRadius:"4px",marginBottom:"12px",fontSize:"11px"}}>
    <b>Summa vārdiem:</b> {skaitliVardos(kopa_apmaksai)}
  </div>
  {user
    ? <button onClick={exportRekins} style={{padding:"8px 24px",background:"#e65100",color:"white",border:"none",borderRadius:"4px",cursor:"pointer",fontSize:"13px"}}>🖨 Drukāt / Saglabāt PDF</button>
    : <button onClick={()=>onReg?.()} style={{padding:"8px 24px",background:"#888",color:"white",border:"none",borderRadius:"4px",cursor:"pointer",fontSize:"13px"}}>🔒 Reģistrējies lai drukātu PDF</button>
  }
</div>
)
}

// ========== CIRSMAS SKICE ==========
function CirsmaskicePage({onBack,kadastrsIn="",saimniecibaIn="",savedState,onSaveState,user,onReg}){
const [kmlCoords,setKmlCoords]=useState(savedState?.kmlCoords||[])
const [kmlName,setKmlName]=useState(savedState?.kmlName||"")
const [kadastrs,setKadastrs]=useState(savedState?.kadastrs||kadastrsIn)
const [saimnieciba,setSaimnieciba]=useState(savedState?.saimnieciba||saimniecibaIn)
const [nogabals,setNogabals]=useState(savedState?.nogabals||"")

const [cirteVeids,setCirteVeids]=useState(savedState?.cirteVeids||"")
const [cirteIzpilde,setCirteIzpilde]=useState(savedState?.cirteIzpilde||"")
const [platiba,setPlatiba]=useState(savedState?.platiba||0)
const [showCaurmers,setShowCaurmers]=useState(false)
const [showDastojums,setShowDastojums]=useState(false)

const [caurmersState, setCaurmersState] = useState(savedState?.caurmersState||null)
const [showRekins, setShowRekins] = useState(false)

const saglabat = (jaunie) => onSaveState?.({
  kmlCoords:jaunie?.kmlCoords??kmlCoords,
  kmlName:jaunie?.kmlName??kmlName,
  kadastrs:jaunie?.kadastrs??kadastrs,
  saimnieciba:jaunie?.saimnieciba??saimnieciba,
  nogabals:jaunie?.nogabals??nogabals,
  cirteVeids:jaunie?.cirteVeids??cirteVeids,
  cirteIzpilde:jaunie?.cirteIzpilde??cirteIzpilde,
  platiba:jaunie?.platiba??platiba,
  caurmersState:jaunie?.caurmersState??caurmersState
})

const notirit = () => {
  if(window.confirm("Dzēst visu darbu?")) {
    setKmlCoords([]); setKmlName(""); setKadastrs(""); setSaimnieciba("")
    setNogabals(""); setCirteVeids(""); setCirteIzpilde(""); setPlatiba(0)
    onSaveState?.(null)
  }
}

const handleSHP=async(event)=>{
  const file=event.target.files[0]
  if(!file) return
  const {default:shpjs}=await import("https://cdn.jsdelivr.net/npm/shpjs@4/dist/shp.min.js")
  const buffer=await file.arrayBuffer()
  const geojson=await shpjs(buffer)
  const features=geojson.features||(geojson.type==="Feature"?[geojson]:[])
  if(!features.length){alert("SHP failā nav atrasts neviens objekts!");return}
  const geom=features[0].geometry
  let rawCoords=[]
  if(geom.type==="Polygon") rawCoords=geom.coordinates[0]
  else if(geom.type==="MultiPolygon") rawCoords=geom.coordinates[0][0]
  else{alert("SHP failā nav poligons!");return}
  const coords=rawCoords.map(c=>{
    if(Math.abs(c[0])>180){
      const wgs=lks92ToWgs84(c[0],c[1])
      return{lon:wgs.lon,lat:wgs.lat}
    }
    return{lon:c[0],lat:c[1]}
  })
  setKmlCoords(coords)
  let area=0
  for(let i=0;i<coords.length-1;i++){
    const j=(i+1)%(coords.length-1)
    area+=coords[i].lon*coords[j].lat
    area-=coords[j].lon*coords[i].lat
  }
  const latCenter = coords.reduce((s,c)=>s+c.lat,0)/coords.length
const lonM = 111320 * Math.cos(latCenter * Math.PI / 180)
const jaunaPlatiba=Math.abs(area)/2*111320*lonM/10000
  setPlatiba(jaunaPlatiba)
  const props=features[0].properties||{}
  if(props.PARCELCODE) setKadastrs(props.PARCELCODE)
  saglabat({kmlCoords:coords, platiba:jaunaPlatiba, kadastrs:props.PARCELCODE||kadastrs})
}

const lks92ToWgs84=(x,y)=>{
  const a=6378137.0,f=1/298.257222101,k0=0.9996
  const lon0=24*Math.PI/180,FE=500000,FN=-6000000
  const e2=2*f-f*f,e4=e2*e2,e6=e4*e2
  const M=(y-FN)/k0
  const mu=M/(a*(1-e2/4-3*e4/64-5*e6/256))
  const e1=(1-Math.sqrt(1-e2))/(1+Math.sqrt(1-e2))
  const phi1=mu+(3*e1/2-27*e1**3/32)*Math.sin(2*mu)+(21*e1**2/16-55*e1**4/32)*Math.sin(4*mu)+(151*e1**3/96)*Math.sin(6*mu)
  const N1=a/Math.sqrt(1-e2*Math.sin(phi1)**2)
  const T1=Math.tan(phi1)**2
  const C1=e2/(1-e2)*Math.cos(phi1)**2
  const R1=a*(1-e2)/Math.pow(1-e2*Math.sin(phi1)**2,1.5)
  const D=(x-FE)/(N1*k0)
  const lat=phi1-(N1*Math.tan(phi1)/R1)*(D**2/2-(5+3*T1+10*C1-4*C1**2-9*e2/(1-e2))*D**4/24+(61+90*T1+298*C1+45*T1**2-252*e2/(1-e2)-3*C1**2)*D**6/720)
  const lon=lon0+(D-(1+2*T1+C1)*D**3/6+(5-2*C1+28*T1-3*C1**2+8*e2/(1-e2)+24*T1**2)*D**5/120)/Math.cos(phi1)
  return{lat:lat*180/Math.PI,lon:lon*180/Math.PI}
}

const handleKML=async(event)=>{
const file=event.target.files[0]
if(!file) return
const text=await file.text()
const coordMatch=text.match(/<coordinates>([\s\S]*?)<\/coordinates>/)
if(!coordMatch) return
const coordStr=coordMatch[1].trim()
const pairs=coordStr.split(/\s+/).filter(s=>s.length>0)
const coords=pairs.map(p=>{
const [lon,lat]=p.split(",").map(Number)
return {lon,lat}
})
setKmlCoords(coords)
// Aprēķina platību (Shoelace formula)
let area=0
for(let i=0;i<coords.length-1;i++){
const j=(i+1)%(coords.length-1)
area+=coords[i].lon*coords[j].lat
area-=coords[j].lon*coords[i].lat
}
const latCenter = coords.reduce((s,c)=>s+c.lat,0)/coords.length
const lonM = 111320 * Math.cos(latCenter * Math.PI / 180)
const jaunaPlatiba = Math.abs(area)/2 * 111320 * lonM / 10000
setPlatiba(jaunaPlatiba)

const nameMatch=text.match(/<n>(.*?)<\/n>/)
if(nameMatch) setKmlName(nameMatch[1])
saglabat({kmlCoords:coords, platiba:jaunaPlatiba, kmlName:nameMatch?nameMatch[1]:kmlName})
}

// Pārvērš koordinātas uz SVG
const svgW=600, svgH=450
let minLon=Infinity,maxLon=-Infinity,minLat=Infinity,maxLat=-Infinity
kmlCoords.forEach(c=>{
if(c.lon<minLon)minLon=c.lon
if(c.lon>maxLon)maxLon=c.lon
if(c.lat<minLat)minLat=c.lat
if(c.lat>maxLat)maxLat=c.lat
})
const pad=40
const scaleX=(svgW-pad*2)/(maxLon-minLon||1)
const scaleY=(svgH-pad*2)/(maxLat-minLat||1)
const scale=Math.min(scaleX,scaleY)

const toSVG=(lon,lat)=>({
x:pad+(lon-minLon)*scale,
y:svgH-pad-(lat-minLat)*scale // ziemeļi uz augšu!
})

const points=kmlCoords.map(c=>toSVG(c.lon,c.lat))
const polyPoints=points.map(p=>`${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ")
const downloadSHP=()=>{
if(!kmlCoords.length) return
const wgs84ToLks92=(lon,lat)=>{
const a=6378137.0,f=1/298.257222101,k0=0.9996
const lon0=24*Math.PI/180,FE=500000,FN=-6000000
const e2=2*f-f*f,e4=e2*e2,e6=e4*e2
const latR=lat*Math.PI/180,lonR=lon*Math.PI/180
const N=a/Math.sqrt(1-e2*Math.sin(latR)**2)
const T=Math.tan(latR)**2,C=e2/(1-e2)*Math.cos(latR)**2
const A2=Math.cos(latR)*(lonR-lon0)
const M=a*((1-e2/4-3*e4/64-5*e6/256)*latR-(3*e2/8+3*e4/32+45*e6/1024)*Math.sin(2*latR)+(15*e4/256+45*e6/1024)*Math.sin(4*latR)-(35*e6/3072)*Math.sin(6*latR))
const x=FE+k0*N*(A2+(1-T+C)*A2**3/6+(5-18*T+T**2+72*C-58*e2/(1-e2))*A2**5/120)
const y=FN+k0*(M+N*Math.tan(latR)*(A2**2/2+(5-T+9*C+4*C**2)*A2**4/24+(61-58*T+T**2+600*C-330*e2/(1-e2))*A2**6/720))
return[x,y]
}
const lks=kmlCoords.map(c=>wgs84ToLks92(c.lon,c.lat))
const xs=lks.map(c=>c[0]),ys=lks.map(c=>c[1])
const n=lks.length
// SHP record
let rec=new ArrayBuffer(4+32+8+8+n*16)
let v=new DataView(rec)
v.setInt32(0,5,true)
v.setFloat64(4,Math.min(...xs),true);v.setFloat64(12,Math.min(...ys),true)
v.setFloat64(20,Math.max(...xs),true);v.setFloat64(28,Math.max(...ys),true)
v.setInt32(36,1,true);v.setInt32(40,n,true)
v.setInt32(44,0,true)
lks.forEach((c,i)=>{v.setFloat64(48+i*16,c[0],true);v.setFloat64(48+i*16+8,c[1],true)})
const recBytes=new Uint8Array(rec)
const recLen=recBytes.length
const fileLen=50+(4+recLen/2)
// SHP header
const shpBuf=new ArrayBuffer(100+8+recLen)
const sv=new DataView(shpBuf)
sv.setInt32(0,9994,false);sv.setInt32(24,fileLen,false)
sv.setInt32(28,1000,true);sv.setInt32(32,5,true)
sv.setFloat64(36,Math.min(...xs),true);sv.setFloat64(44,Math.min(...ys),true)
sv.setFloat64(52,Math.max(...xs),true);sv.setFloat64(60,Math.max(...ys),true)
sv.setFloat64(68,0,true);sv.setFloat64(76,0,true);sv.setFloat64(84,0,true);sv.setFloat64(92,0,true)
sv.setInt32(100,1,false);sv.setInt32(104,recLen/2,false)
new Uint8Array(shpBuf).set(recBytes,108)
// SHX
const shxBuf=new ArrayBuffer(108)
const hv=new DataView(shxBuf)
hv.setInt32(0,9994,false);hv.setInt32(24,54,false)
hv.setInt32(28,1000,true);hv.setInt32(32,5,true)
hv.setFloat64(36,Math.min(...xs),true);hv.setFloat64(44,Math.min(...ys),true)
hv.setFloat64(52,Math.max(...xs),true);hv.setFloat64(60,Math.max(...ys),true)
hv.setFloat64(68,0,true);hv.setFloat64(76,0,true);hv.setFloat64(84,0,true);hv.setFloat64(92,0,true)
hv.setInt32(100,50,false);hv.setInt32(104,recLen/2,false)
// DBF
const felltype=3
const parcelcode=(kadastrs||"").padEnd(11).slice(0,11)
const headerSize=32+2*32+1,recordSize=1+5+11
const dbfBuf=new ArrayBuffer(headerSize+recordSize+1)
const dv=new DataView(dbfBuf)
dv.setUint8(0,3);dv.setUint8(1,25);dv.setUint8(2,3);dv.setUint8(3,25)
dv.setUint32(4,1,true);dv.setUint16(8,headerSize,true);dv.setUint16(10,recordSize,true)
const dbfArr=new Uint8Array(dbfBuf)
const enc=new TextEncoder()
dbfArr.set(enc.encode("FELLTYPE\x00\x00\x00"),32)
dbfArr.set(enc.encode("N"),43);dbfArr[48]=5
dbfArr.set(enc.encode("PARCELCODE\x00"),64)
dbfArr.set(enc.encode("C"),75);dbfArr[80]=11
dbfArr[96]=0x0d
dbfArr[97]=0x20
dbfArr.set(enc.encode(String(felltype).padStart(5)),98)
dbfArr.set(enc.encode(parcelcode),103)
dbfArr[114]=0x1a
const prj='PROJCS["LKS92 / Latvia TM", GEOGCS["LKS92", DATUM["Latvia_1992", SPHEROID["GRS 1980", 6378137, 298.257222101, AUTHORITY["EPSG", "7019"]], TOWGS84[0, 0, 0, 0, 0, 0, 0], AUTHORITY["EPSG", "6661"]], PRIMEM["Greenwich", 0, AUTHORITY["EPSG", "8901"]], UNIT["degree", 0.0174532925199433, AUTHORITY["EPSG", "9122"]], AUTHORITY["EPSG", "4661"]], UNIT["metre", 1, AUTHORITY["EPSG", "9001"]], PROJECTION["Transverse_Mercator"], PARAMETER["latitude_of_origin", 0], PARAMETER["central_meridian", 24], PARAMETER["scale_factor", 0.9996], PARAMETER["false_easting", 500000], PARAMETER["false_northing", -6000000], AUTHORITY["EPSG", "3059"]]'
// ZIP
import("https://cdn.jsdelivr.net/npm/fflate@0.8.2/esm/browser.js").then(({zipSync,strToU8})=>{
const zip=zipSync({
"cirsma.shp":new Uint8Array(shpBuf),
"cirsma.shx":new Uint8Array(shxBuf),
"cirsma.dbf":dbfArr,
"cirsma.prj":strToU8(prj),
"cirsma.cpg":strToU8("UTF-8")
})
const blob=new Blob([zip],{type:"application/zip"})
const url=URL.createObjectURL(blob)
const a=document.createElement("a")
a.href=url;a.download=`cirsma_${kadastrs||"skice"}.zip`;a.click()
URL.revokeObjectURL(url)
})
}
const exportSkice=()=>{
const today=new Date().toLocaleDateString("lv-LV")

const svgContent=`
<svg width="750" height="500" xmlns="http://www.w3.org/2000/svg">
<rect width="750" height="500" fill="#f8f8f0" stroke="black" stroke-width="1"/>
<g stroke="#ddd" stroke-width="0.5">
<line x1="100" y1="0" x2="100" y2="500"/><line x1="200" y1="0" x2="200" y2="500"/>
<line x1="300" y1="0" x2="300" y2="500"/><line x1="400" y1="0" x2="400" y2="500"/>
<line x1="500" y1="0" x2="500" y2="500"/><line x1="600" y1="0" x2="600" y2="500"/>
<line x1="700" y1="0" x2="700" y2="500"/>
<line x1="0" y1="100" x2="750" y2="100"/><line x1="0" y1="200" x2="750" y2="200"/>
<line x1="0" y1="300" x2="750" y2="300"/><line x1="0" y1="400" x2="750" y2="400"/>
</g>
${kmlCoords.length>0 ? `<polygon points="${polyPoints}" fill="rgba(34,85,34,0.15)" stroke="#225522" stroke-width="2.5"/>` : ""}
${points.slice(0,-1).map((p,i)=>`
<circle cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="5" fill="#225522"/>
<text x="${(p.x+8).toFixed(1)}" y="${(p.y+4).toFixed(1)}" font-size="12" fill="#225522" font-weight="bold">${i+1}</text>
`).join("")}
<g transform="translate(710,40)">
<line x1="0" y1="25" x2="0" y2="-25" stroke="black" stroke-width="2"/>
<polygon points="0,-25 -7,-8 7,-8" fill="black"/>
<text x="-4" y="38" font-size="13" font-weight="bold" fill="black">N</text>
</g>
<g transform="translate(20,480)">
<rect x="0" y="-8" width="50" height="8" fill="black"/>
<rect x="50" y="-8" width="50" height="8" fill="white" stroke="black" stroke-width="1"/>
<text x="0" y="6" font-size="9">0</text>
<text x="90" y="6" font-size="9">100m</text>
</g>
${platiba>0 ? `<text x="375" y="250" font-size="16" fill="#225522" font-weight="bold" text-anchor="middle">${platiba.toFixed(2)} ha</text>` : ""}
</svg>`

const pts = kmlCoords.slice(0,-1)
const col1 = pts.slice(0, Math.ceil(pts.length/4))
const col2 = pts.slice(Math.ceil(pts.length/4), Math.ceil(pts.length*2/4))
const col3 = pts.slice(Math.ceil(pts.length*2/4), Math.ceil(pts.length*3/4))
const col4 = pts.slice(Math.ceil(pts.length*3/4))
const maxRows = Math.max(col1.length, col2.length, col3.length, col4.length)
let coordRows = ""
for(let i=0; i<maxRows; i++){
  const p1=col1[i], p2=col2[i], p3=col3[i], p4=col4[i]
  const idx1=i+1
  const idx2=col1.length+i+1
  const idx3=col1.length+col2.length+i+1
  const idx4=col1.length+col2.length+col3.length+i+1
  coordRows+=`<tr>
    <td>${p1?idx1:""}</td><td>${p1?p1.lon.toFixed(5):""}</td><td>${p1?p1.lat.toFixed(5):""}</td>
    <td style="border-left:2px solid #225522">${p2?idx2:""}</td><td>${p2?p2.lon.toFixed(5):""}</td><td>${p2?p2.lat.toFixed(5):""}</td>
    <td style="border-left:2px solid #225522">${p3?idx3:""}</td><td>${p3?p3.lon.toFixed(5):""}</td><td>${p3?p3.lat.toFixed(5):""}</td>
    <td style="border-left:2px solid #225522">${p4?idx4:""}</td><td>${p4?p4.lon.toFixed(5):""}</td><td>${p4?p4.lat.toFixed(5):""}</td>
  </tr>`
}

const html=`<html><head><meta charset="UTF-8">
<style>
body{font-family:Arial;font-size:11px;padding:12px;max-width:900px;margin:0 auto}
h2{text-align:center;font-size:15px;margin:4px 0}
table{border-collapse:collapse;width:100%;margin-bottom:6px}
th{background:#225522;color:white;padding:4px 8px;font-size:10px}
td{border:1px solid #ccc;padding:3px 8px;font-size:10px}
.label{background:#f0f0f0;font-weight:bold;width:35%}
.paraksts{display:flex;justify-content:space-between;margin-top:20px;padding-top:12px;border-top:1px solid #ccc;font-size:11px;page-break-inside:avoid}
</style></head><body>
<h2>CIRSMAS SKICE</h2>
<p style="text-align:center;font-size:11px;margin:2px 0">Valsts meža dienesta iesniegumam</p>
<table>
<tr><td class="label">Īpašuma nosaukums</td><td>${saimnieciba||"___________________"}</td></tr>
<tr><td class="label">Kadastra numurs</td><td>${kadastrs||"___________________"}</td></tr>
<tr><td class="label">Nogabala(-u) numurs</td><td>${nogabals ? nogabals.split(";").map(n=>n.trim()).filter(n=>n).join(", ") : "___________________"}</td></tr>
<tr><td class="label">Cirtes veids</td><td>${cirteVeids||"___________________"}</td></tr>
<tr><td class="label">Cirtes izpildes veids</td><td>${cirteIzpilde||"___________________"}</td></tr>
<tr><td class="label">Platība</td><td>${platiba>0 ? platiba.toFixed(2)+" ha" : "___________________"}</td></tr>
<tr><td class="label">Datums</td><td>${today}</td></tr>
</table>
${svgContent}
<table style="font-size:8px;width:100%;margin-top:8px">
  <thead><tr>
    <th>Nr</th><th>Garums</th><th>Platums</th>
    <th style="border-left:2px solid #888">Nr</th><th>Garums</th><th>Platums</th>
    <th style="border-left:2px solid #888">Nr</th><th>Garums</th><th>Platums</th>
    <th style="border-left:2px solid #888">Nr</th><th>Garums</th><th>Platums</th>
  </tr></thead>
  <tbody>${coordRows}</tbody>
</table>
<div class="paraksts">
  <div>Sastādīja: ___________________________<br/><span style="font-size:9px">(vārds, uzvārds)</span></div>
  <div>Datums: ___________________________</div>
  <div>Paraksts: ___________________________</div>
</div>
<p style="font-size:9px;color:#888;margin-top:8px">* Skice sagatavota ar Meža tirgus kalkulatoru. Koordinātas WGS84. Ziemeļi uz augšu.</p>
</body></html>`
const win=window.open("","_blank")
win.document.write(html)
win.document.close()
win.print()
}
return(
<div style={{padding:"40px",fontFamily:"Arial",maxWidth:"900px"}}>
<div style={{display:"flex",gap:"8px",marginBottom:"16px",alignItems:"center",flexWrap:"wrap",justifyContent:"space-between"}}>
  <div style={{display:"flex",gap:"8px",alignItems:"center",flexWrap:"wrap"}}>
    <button onClick={onBack} style={{padding:"6px 14px",background:"#555",color:"white",border:"none",borderRadius:"4px",cursor:"pointer"}}>← Atpakaļ</button>
    <button onClick={notirit} style={{padding:"6px 14px",background:"#c62828",color:"white",border:"none",borderRadius:"4px",cursor:"pointer"}}>🗑 Dzēst visu</button>
   <a href="https://www.lvmgeo.lv/kartes" target="_blank" rel="noreferrer" style={{padding:"6px 14px",background:"#2e7d32",color:"white",borderRadius:"4px",textDecoration:"none",fontSize:"13px"}}>🗺 LVM GEO</a>
<a href="https://www.vmd.gov.lv" target="_blank" rel="noreferrer" style={{padding:"6px 14px",background:"#5d4037",color:"white",borderRadius:"4px",textDecoration:"none",fontSize:"13px"}}>🏛 VMD</a>
    {kadastrs && <button onClick={()=>navigator.clipboard.writeText(kadastrs)} style={{padding:"6px 14px",background:"#1565c0",color:"white",border:"none",borderRadius:"4px",cursor:"pointer"}}>📋 Kopēt kadastru</button>}
  </div>
<button onClick={()=>setShowCaurmers(v=>!v)} style={{padding:"6px 14px",background:"#1565c0",color:"white",border:"none",borderRadius:"4px",cursor:"pointer"}}>📏 Caurmēra mērījumi</button>
<button onClick={()=>setShowDastojums(v=>!v)} style={{padding:"6px 14px",background:"#2e7d32",color:"white",border:"none",borderRadius:"4px",cursor:"pointer"}}>🌲 Dastojums</button>
</div>
<h1>Cirsmas skice</h1>

<div style={{display:"flex",gap:"16px",marginBottom:"16px",flexWrap:"wrap"}}>
<div>
<label style={{fontWeight:"bold"}}>Augšupielādēt KML failu:</label><br/>
<input type="file" accept=".kml" onChange={handleKML} style={{marginTop:"4px"}}/>
</div>
<div>
<label style={{fontWeight:"bold"}}>Augšupielādēt SHP failu (.zip):</label><br/>
<input type="file" accept=".zip" onChange={handleSHP} style={{marginTop:"4px"}}/>
</div>
</div>

<div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"12px",marginBottom:"16px"}}>
<div>
<label style={{fontSize:"12px",fontWeight:"bold"}}>Kadastra numurs:</label><br/>
<input value={kadastrs} onChange={e=>{setKadastrs(e.target.value);saglabat({kadastrs:e.target.value})}} style={{width:"100%",padding:"4px",border:"1px solid #ccc",borderRadius:"4px"}}/>
</div>
<div>
<label style={{fontSize:"12px",fontWeight:"bold"}}>Saimniecības nosaukums:</label><br/>
<input value={saimnieciba} onChange={e=>{setSaimnieciba(e.target.value);saglabat({saimnieciba:e.target.value})}} style={{width:"100%",padding:"4px",border:"1px solid #ccc",borderRadius:"4px"}}/>
</div>
<div>
<label style={{fontSize:"12px",fontWeight:"bold"}}>Nogabala numurs:</label><br/>
<input 
  value={nogabals} 
  onChange={e=>{
    let val = e.target.value.replace(/,/g, ";")
    setNogabals(val)
    saglabat({nogabals:val})
  }}
  onKeyDown={e=>{
    if(e.key===" "){
      e.preventDefault()
      const val = nogabals.trimEnd() + ";"
      setNogabals(val)
      saglabat({nogabals:val})
    }
  }}
  style={{width:"100%",padding:"4px",border:"1px solid #ccc",borderRadius:"4px"}}
  placeholder="p.ē. 3;5.1;7"
/>
</div>
<div>
<label style={{fontSize:"12px",fontWeight:"bold"}}>Cirtes veids:</label><br/>
<select value={cirteVeids} onChange={e=>{setCirteVeids(e.target.value);saglabat({cirteVeids:e.target.value})}} style={{width:"100%",padding:"4px",border:"1px solid #ccc",borderRadius:"4px"}}>
<option value="">— izvēlies —</option>
<option>Galvenā cirte</option>
<option>Kopšanas cirte</option>
<option>Sanitārā cirte</option>
<option>Jaunaudžu kopšana</option>
</select>
</div>
<div>
<label style={{fontSize:"12px",fontWeight:"bold"}}>Cirtes izpildes veids:</label><br/>
<select value={cirteIzpilde} onChange={e=>{setCirteIzpilde(e.target.value);saglabat({cirteIzpilde:e.target.value})}} style={{width:"100%",padding:"4px",border:"1px solid #ccc",borderRadius:"4px"}}>
<option value="">— izvēlies —</option>
{cirteVeids==="Galvenā cirte" && <>
  <option>Kailcirte</option>
  <option>Kailcirte pēc caurmēra</option>
  <option>Izlases cirte</option>
</>}
{cirteVeids==="Kopšanas cirte" && <option>Kopšanas cirte</option>}
{cirteVeids==="Sanitārā cirte" && <>
  <option>Sanitārā izlases cirte</option>
  <option>Sanitārā kailcirte pēc VMD atzinuma</option>
</>}
{cirteVeids==="Jaunaudžu kopšana" && <option>Jaunaudžu kopšana</option>}
</select>
</div>
</div>

{kmlCoords.length>0 && (
<div>
<div style={{border:"1px solid #225522",borderRadius:"6px",overflow:"hidden",marginBottom:"12px"}}>
<svg width="100%" viewBox={`0 0 ${svgW} ${svgH}`} xmlns="http://www.w3.org/2000/svg">
<rect width={svgW} height={svgH} fill="#f8f8f0"/>
<g stroke="#ddd" strokeWidth="0.5">
{[100,200,300,400,500].map(x=><line key={x} x1={x} y1="0" x2={x} y2={svgH}/>)}
{[100,200,300,400].map(y=><line key={y} x1="0" y1={y} x2={svgW} y2={y}/>)}
</g>
<polygon points={polyPoints} fill="rgba(34,85,34,0.15)" stroke="#225522" strokeWidth="2.5"/>
{points.slice(0,-1).map((p,i)=>(
<g key={i}>
<circle cx={p.x} cy={p.y} r="5" fill="#225522"/>
<text x={p.x+8} y={p.y+4} fontSize="12" fill="#225522" fontWeight="bold">{i+1}</text>
</g>
))}
{platiba>0 && (
<text x={svgW/2} y={svgH/2} fontSize="14" fill="#225522" fontWeight="bold" textAnchor="middle">{platiba.toFixed(2)} ha</text>
)}
<g transform="translate(560,40)">
<line x1="0" y1="25" x2="0" y2="-25" stroke="black" strokeWidth="2"/>
<polygon points="0,-25 -7,-8 7,-8" fill="black"/>
<text x="-4" y="38" fontSize="13" fontWeight="bold" fill="black">N</text>
</g>
<g transform="translate(20,430)">
<rect x="0" y="-8" width="50" height="8" fill="black"/>
<rect x="50" y="-8" width="50" height="8" fill="white" stroke="black" strokeWidth="1"/>
<text x="0" y="6" fontSize="9">0</text>
<text x="90" y="6" fontSize="9">100m</text>
</g>
</svg>
</div>

<table border="1" cellPadding="4" style={{fontSize:"11px",marginBottom:"12px"}}>
<thead><tr style={{background:"#225522",color:"white"}}><th>Punkts</th><th>Garums (WGS84)</th><th>Platums (WGS84)</th></tr></thead>
<tbody>
{kmlCoords.slice(0,-1).map((c,i)=>(
<tr key={i}>
<td>{i+1}</td>
<td>{c.lon.toFixed(6)}</td>
<td>{c.lat.toFixed(6)}</td>
</tr>
))}
</tbody>
</table>

{user
  ? <button onClick={exportSkice} style={{padding:"8px 20px",background:"#225522",color:"white",border:"none",borderRadius:"4px",cursor:"pointer"}}>🖨 Drukāt / Saglabāt PDF</button>
  : <button onClick={()=>{ console.log("onReg:", onReg); onReg?.() }} style={{padding:"8px 20px",background:"#888",color:"white",border:"none",borderRadius:"4px",cursor:"pointer"}}>🔒 Reģistrējies lai drukātu PDF</button>
}
<button onClick={()=>setShowRekins(true)} style={{marginLeft:"10px",padding:"8px 20px",background:"#e65100",color:"white",border:"none",borderRadius:"4px",cursor:"pointer"}}>
🧾 Izveidot rēķinu
</button>
<button onClick={downloadSHP} style={{marginLeft:"10px",padding:"8px 20px",background:"#1565c0",color:"white",border:"none",borderRadius:"4px",cursor:"pointer"}}>
Lejupielādēt SHP (LKS92)
</button>
</div>
)}

{kmlCoords.length===0 && (
<div style={{padding:"40px",textAlign:"center",color:"#888",border:"2px dashed #ccc",borderRadius:"8px"}}>
Augšupielādē KML failu no LVM GEO lai redzētu skici
</div>
)}

{showRekins && (
  <RekinsPanel
    kadastrs={kadastrs}
    saimnieciba={saimnieciba}
    platiba={platiba}
    onClose={()=>setShowRekins(false)}
    user={user}
    onReg={onReg}
  />
)}

{showCaurmers && (
  <CaurmeraPanel
    kadastrs={kadastrs} 
    nogabals={nogabals} 
    saimnieciba={saimnieciba}
    savedState={caurmersState}
    onSaveState={(s)=>{setCaurmersState(s);saglabat({caurmersState:s})}}
    user={user}
    onReg={onReg}
  />
)}

{showDastojums && (
  <DastojumsPanel
    kadastrs={kadastrs}
    saimnieciba={saimnieciba}
    onClose={()=>setShowDastojums(false)}
    user={user}
    onReg={onReg}
  />
)}
</div>
)
}

// ========== CAURMERA MERIJUMI ==========
function CaurmeraPage({onBack}){
const [suga,setSuga]=useState("E")
const [bonitāte,setBonitāte]=useState("I")
const [nogabals,setNogabals]=useState("")
const [kadastrs,setKadastrs]=useState(kadastrsIn)
const [saimnieciba,setSaimnieciba]=useState(saimniecibaIn)
const [h,setH]=useState(0)
const [merijumi,setMerijumi]=useState([])
const [jaunsD,setJaunsD]=useState("")

const {minDiameter}=require ? {} : {}

const minD={
P:{Ia:39,I:35,II:31,III:30},
E:{Ia:31,I:29,II:29,III:27},
B:{Ia:31,I:27,II:25,III:25}
}

const pievienot=()=>{
const d=parseFloat(jaunsD.replace(",","."))
if(!isNaN(d) && d>0){
setMerijumi([...merijumi,d])
setJaunsD("")
}
}

const dzest=(i)=>setMerijumi(merijumi.filter((_,j)=>j!==i))

const videjais=merijumi.length>0 ? merijumi.reduce((a,b)=>a+b,0)/merijumi.length : 0
const minDval=minD[suga]?.[bonitāte]||0
const cirteAtlauta=videjais>=minDval && merijumi.length>0

const exportPDF=()=>{
const today=new Date().toLocaleDateString("lv-LV")
const html=`<html><head><meta charset="UTF-8">
<style>
body{font-family:Arial;font-size:11px;padding:20px;max-width:700px;margin:0 auto}
h2{text-align:center}table{border-collapse:collapse;width:100%;margin-bottom:12px}
th{background:#225522;color:white;padding:4px 8px}td{border:1px solid #ccc;padding:3px 8px}
.label{background:#f0f0f0;font-weight:bold}.rezultats{font-size:14px;font-weight:bold;padding:10px;margin:10px 0;border-radius:4px}
</style></head><body>
<h2>CAURMĒRA MĒRĪJUMU PĀRSKATS</h2>
<table>
<tr><td class="label">Kadastra numurs</td><td>${kadastrs||"—"}</td></tr>
<tr><td class="label">Nogabala numurs</td><td>${nogabals||"—"}</td></tr>
<tr><td class="label">Mēramā suga</td><td>${suga}</td></tr>
<tr><td class="label">Bonitāte</td><td>${bonitāte}</td></tr>
<tr><td class="label">Koku skaits</td><td>${merijumi.length}</td></tr>
<tr><td class="label">Vidējais caurmērs</td><td>${videjais.toFixed(1)} cm</td></tr>
<tr><td class="label">Min. caurmērs cirtei</td><td>${minDval} cm</td></tr>
<tr><td class="label">Datums</td><td>${today}</td></tr>
</table>
<div class="rezultats" style="background:${cirteAtlauta?"#e8f5e9":"#ffebee"};color:${cirteAtlauta?"#225522":"#c62828"}">
${cirteAtlauta ? "CIRTE ATĻAUTA — vidējais caurmērs sasniegts" : "CIRTE NAV ATĻAUTA — vidējais caurmērs nav sasniegts"}
</div>
<table>
<thead><tr><th>Nr.</th><th>Caurmērs (cm)</th></tr></thead>
<tbody>${merijumi.map((d,i)=>`<tr><td>${i+1}</td><td>${d}</td></tr>`).join("")}</tbody>
</table>
<p style="font-size:9px;color:#888">* Mērījumi veikti 1.3m augstumā no saknes kakla. Sagatavots ar Meža tirgus kalkulatoru.</p>
</body></html>`
const win=window.open("","_blank")
win.document.write(html)
win.document.close()
win.print()
}

return(
<div style={{padding:"40px",fontFamily:"Arial",maxWidth:"700px"}}>
<button onClick={onBack} style={{marginBottom:"16px",padding:"6px 14px",background:"#555",color:"white",border:"none",borderRadius:"4px",cursor:"pointer"}}>Atpakal</button>
<h1>Caurmēra mērījumi</h1>

<div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"12px",marginBottom:"16px"}}>
<div>
<label style={{fontSize:"12px",fontWeight:"bold"}}>Kadastra numurs:</label><br/>
<input value={kadastrs} onChange={e=>setKadastrs(e.target.value)} style={{width:"100%",padding:"4px",border:"1px solid #ccc",borderRadius:"4px"}}/>
</div>
<div>
<label style={{fontSize:"12px",fontWeight:"bold"}}>Nogabala numurs:</label><br/>
<input value={nogabals} onChange={e=>setNogabals(e.target.value)} style={{width:"100%",padding:"4px",border:"1px solid #ccc",borderRadius:"4px"}}/>
</div>
<div>
<label style={{fontSize:"12px",fontWeight:"bold"}}>Suga:</label><br/>
<select value={suga} onChange={e=>setSuga(e.target.value)} style={{width:"100%",padding:"4px",border:"1px solid #ccc",borderRadius:"4px"}}>
<option>P</option><option>E</option><option>B</option>
</select>
</div>
<div>
<label style={{fontSize:"12px",fontWeight:"bold"}}>Bonitāte:</label><br/>
<select value={bonitāte} onChange={e=>setBonitāte(e.target.value)} style={{width:"100%",padding:"4px",border:"1px solid #ccc",borderRadius:"4px"}}>
<option>Ia</option><option>I</option><option>II</option><option>III</option>
</select>
</div>
</div>

<div style={{background:"#f0f8f0",padding:"12px",borderRadius:"6px",marginBottom:"16px",border:"1px solid #225522"}}>
<b>Minimālais caurmērs cirtei ({suga}, {bonitāte}):</b> {minDval} cm
</div>

<div style={{display:"flex",gap:"8px",marginBottom:"12px"}}>
<input
type="number"
value={jaunsD}
onChange={e=>setJaunsD(e.target.value)}
onKeyDown={e=>e.key==="Enter" && pievienot()}
placeholder="Caurmērs cm"
style={{padding:"6px",border:"1px solid #ccc",borderRadius:"4px",width:"120px",fontSize:"14px"}}
/>
<button onClick={pievienot} style={{padding:"6px 16px",background:"#225522",color:"white",border:"none",borderRadius:"4px",cursor:"pointer"}}>
+ Pievienot
</button>
</div>

{merijumi.length>0 && (
<div>
<div style={{display:"flex",flexWrap:"wrap",gap:"6px",marginBottom:"12px"}}>
{merijumi.map((d,i)=>(
<span key={i} style={{background:d>=minDval?"#e8f5e9":"#fff8e1",border:"1px solid #ccc",borderRadius:"4px",padding:"4px 8px",fontSize:"13px"}}>
{d} cm
<button onClick={()=>dzest(i)} style={{marginLeft:"6px",background:"none",border:"none",color:"#c62828",cursor:"pointer",fontWeight:"bold"}}>×</button>
</span>
))}
</div>

<div style={{padding:"12px",borderRadius:"6px",marginBottom:"12px",background:cirteAtlauta?"#e8f5e9":"#ffebee",border:`1px solid ${cirteAtlauta?"#388e3c":"#c62828"}`}}>
<b>Koku skaits:</b> {merijumi.length} &nbsp;|&nbsp;
<b>Vidējais caurmērs:</b> {videjais.toFixed(1)} cm &nbsp;|&nbsp;
<b style={{color:cirteAtlauta?"#225522":"#c62828"}}>
{cirteAtlauta ? "CIRTE ATĻAUTA" : "CIRTE NAV ATĻAUTA"}
</b>
</div>

{user
  ? <button onClick={exportPDF} style={{padding:"8px 20px",background:"#225522",color:"white",border:"none",borderRadius:"4px",cursor:"pointer"}}>🖨 Drukāt / Saglabāt PDF</button>
  : <button onClick={()=>onReg?.()} style={{padding:"8px 20px",background:"#888",color:"white",border:"none",borderRadius:"4px",cursor:"pointer"}}>🔒 Reģistrējies lai drukātu PDF</button>
}
</div>
)}
</div>
)
}
// ========== ATJAUNOSANAS PARSKATS ==========
function validateIzcirtums(ic){
const matches=ic.formula?.match(/(\d+)(Bl|Ba|Oz|Os|P|E|B|A|M|G)/g)||[]
const summa=matches.reduce((s,m)=>{const n=parseInt(m.match(/\d+/)[0]);return s+(n<=10?n*10:n)},0)
const dominantSp=matches.reduce((best,m)=>{const n=parseInt(m.match(/\d+/)[0]);const pct=n<=10?n*10:n;const sp=m.match(/[A-Za-z]+/)[0];return pct>(best.pct||0)?{sp,pct}:best},{}).sp||""
const h=Number(ic.h)||0
const koki=Number(ic.koki)||0
const errors=[]
const warnings=[]
if(summa!==100) errors.push(`Formula summa ir ${summa/10}, jābūt 10`)
if(!ic.h||h===0) errors.push("Nav norādīts augstums")
if(!ic.koki||koki===0) errors.push("Nav norādīts koku skaits")
// Pārbauda minimālo koku skaitu (MK noteikumi Nr.308, spēkā no 30.06.2022.)
const normalTreeCount={P:2000,E:1500,B:1500,A:1500,Ba:1500,Bl:1500,M:1500,Oz:1500,Os:1500,G:1500,liepa:1500}
if(dominantSp&&h>0&&koki>0){
const minKoki=normalTreeCount[dominantSp]||0
if(minKoki&&koki<minKoki) errors.push(`Koki ${koki} < min ${minKoki} gab/ha (${dominantSp})`)
if(minKoki&&["P","E","B"].includes(dominantSp)&&h>=2&&koki>minKoki){
warnings.push(`Nepieciešama jaunaudžu kopšana — ${dominantSp} H=${h}m, ${koki}>${minKoki} gab/ha`)
}
}
return{errors,warnings,dominantSp,valid:errors.length===0}
}

function AtjaunosanaPage({onBack,izcirtumi,kadastrs,saimnieciba}){
const [virsmezn,setVirsmezn]=useState("")
const [mezn,setMezn]=useState("")
const [vards,setVards]=useState("")
const [personas,setPersonas]=useState("")
const [adrese,setAdrese]=useState("")
const [talrunis,setTalrunis]=useState("")
const [ipasums,setIpasums]=useState(saimnieciba||"")
const [adminTerit,setAdminTerit]=useState("")
const [gads,setGads]=useState(new Date().getFullYear())
const [rindas,setRindas]=useState(()=>izcirtumi.map(ic=>({
...ic,
atjVeids:"Dabiski atjaunojot",
piezimes:""
})))

const updateRinda=(i,field,value)=>{
const n=[...rindas];n[i]={...n[i],[field]:value};setRindas(n)
}

const exportParskats=()=>{
const today=new Date().toLocaleDateString("lv-LV")
const tabula=rindas.map((r,i)=>{
const v=validateIzcirtums(r)
if(!v.valid) return ""
const dominantSp=v.dominantSp
return`<tr>
<td>${kadastrs||"—"}</td>
<td>—</td>
<td>${r.nog}</td>
<td>${r.platiba}</td>
<td>${dominantSp}</td>
<td>${r.h||"—"}</td>
<td>${r.koki||"—"}</td>
<td>${r.atjVeids}</td>
<td>—</td>
<td>${r.piezimes||""}</td>
</tr>`}).join("")

const html=`<html><head><meta charset="UTF-8">
<style>
body{font-family:"Times New Roman",serif;font-size:11px;padding:20px;max-width:900px;margin:0 auto}
h2{text-align:center;font-size:13px;font-weight:bold}
p{margin:4px 0}
table{border-collapse:collapse;width:100%;margin:12px 0;font-size:9px}
th{border:1px solid black;padding:3px 4px;text-align:center;font-weight:bold}
td{border:1px solid black;padding:3px 4px}
.label{font-weight:bold}
.sign{display:flex;justify-content:space-between;margin-top:20px}
.warn{background:#fff3cd;border:1px solid #f0ad4e;padding:6px;margin:8px 0;font-size:10px;color:#856404}
</style></head><body>
<p style="text-align:right">Valsts meža dienesta</p>
<p style="text-align:right"><b>${virsmezn||"_______________"} virsmežniecībai</b></p>
<p style="text-align:right">${mezn||"_______________"} mežniecībai</p>
<br/>
<h2>Pārskats ${gads}. gadā par darbībām meža zemēs, kurām nav nepieciešams apliecinājums</h2>
<p style="text-align:center;font-size:9px">Pārskata saņemšanas datums: ____________</p>
<br/>
<table style="width:100%;border:none;font-size:11px">
<tr><td style="border:none;width:50%"><span class="label">Īpašnieks:</span> ${vards||"___________________"}</td><td style="border:none"><span class="label">Personas kods:</span> ${personas||"___________________"}</td></tr>
<tr><td style="border:none"><span class="label">Adrese:</span> ${adrese||"___________________"}</td><td style="border:none"><span class="label">Tālrunis:</span> ${talrunis||"___________________"}</td></tr>
<tr><td style="border:none"><span class="label">Īpašuma nosaukums:</span> ${ipasums||"___________________"}</td><td style="border:none"><span class="label">Administratīvā teritorija:</span> ${adminTerit||"___________________"}</td></tr>
</table>
<br/>
<p>Apliecinu, ka esmu ${gads}. gadā veicis šādas darbības savā īpašumā vai tiesiskajā valdījumā:</p>
<p><b>Darbības veids – meža atjaunošana</b></p>
<table>
<thead><tr>
<th>Zemes vienības kadastra apzīmējums</th>
<th>Kvartāla Nr.</th>
<th>Nogabala Nr.</th>
<th>Atjaunotā platība, ha</th>
<th>Valdošā koku suga</th>
<th>Vidējais koku augstums, m</th>
<th>Vidējais koku skaits, gab/ha</th>
<th>Galvenais atjaunošanas veids</th>
<th>MRM saskaņojuma datums / sertifikāta nr.</th>
<th>Piezīmes</th>
</tr></thead>
<tbody>${tabula}</tbody>
</table>
<div class="sign">
<div>Datums: ${today}</div>
<div>Paraksts: ___________________</div>
<div>Paraksta atšifrējums: ___________________</div>
</div>
<p style="font-size:8px;margin-top:20px">* Šo veidlapu izstrādājis VMD un tai ir ieteikuma raksturs</p>
</body></html>`
const win=window.open("","_blank")
win.document.write(html)
win.document.close()
win.print()
}

return(
<div style={{padding:"40px",fontFamily:"Arial",maxWidth:"1000px"}}>
<button onClick={onBack} style={{marginBottom:"16px",padding:"6px 14px",background:"#555",color:"white",border:"none",borderRadius:"4px",cursor:"pointer"}}>Atpakaļ</button>
<h1>Meža atjaunošanas pārskats</h1>

<div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"12px",marginBottom:"20px",padding:"16px",background:"#f0f8f0",borderRadius:"6px",border:"1px solid #225522"}}>
<div>
<label style={{fontSize:"12px",fontWeight:"bold"}}>Virsmežniecība:</label><br/>
<input value={virsmezn} onChange={e=>setVirsmezn(e.target.value)} style={{width:"100%",padding:"4px",border:"1px solid #ccc",borderRadius:"4px"}}/>
</div>
<div>
<label style={{fontSize:"12px",fontWeight:"bold"}}>Mežniecība:</label><br/>
<input value={mezn} onChange={e=>setMezn(e.target.value)} style={{width:"100%",padding:"4px",border:"1px solid #ccc",borderRadius:"4px"}}/>
</div>
<div>
<label style={{fontSize:"12px",fontWeight:"bold"}}>Vārds, uzvārds / Juridiskās personas nosaukums:</label><br/>
<input value={vards} onChange={e=>setVards(e.target.value)} style={{width:"100%",padding:"4px",border:"1px solid #ccc",borderRadius:"4px"}}/>
</div>
<div>
<label style={{fontSize:"12px",fontWeight:"bold"}}>Personas kods / Reģ. numurs:</label><br/>
<input value={personas} onChange={e=>setPersonas(e.target.value)} style={{width:"100%",padding:"4px",border:"1px solid #ccc",borderRadius:"4px"}}/>
</div>
<div>
<label style={{fontSize:"12px",fontWeight:"bold"}}>Deklarētā adrese:</label><br/>
<input value={adrese} onChange={e=>setAdrese(e.target.value)} style={{width:"100%",padding:"4px",border:"1px solid #ccc",borderRadius:"4px"}}/>
</div>
<div>
<label style={{fontSize:"12px",fontWeight:"bold"}}>Tālrunis:</label><br/>
<input value={talrunis} onChange={e=>setTalrunis(e.target.value)} style={{width:"100%",padding:"4px",border:"1px solid #ccc",borderRadius:"4px"}}/>
</div>
<div>
<label style={{fontSize:"12px",fontWeight:"bold"}}>Īpašuma nosaukums:</label><br/>
<input value={ipasums} onChange={e=>setIpasums(e.target.value)} style={{width:"100%",padding:"4px",border:"1px solid #ccc",borderRadius:"4px"}}/>
</div>
<div>
<label style={{fontSize:"12px",fontWeight:"bold"}}>Administratīvā teritorija:</label><br/>
<input value={adminTerit} onChange={e=>setAdminTerit(e.target.value)} style={{width:"100%",padding:"4px",border:"1px solid #ccc",borderRadius:"4px"}}/>
</div>
<div>
<label style={{fontSize:"12px",fontWeight:"bold"}}>Pārskata gads:</label><br/>
<input type="number" value={gads} onChange={e=>setGads(Number(e.target.value))} style={{width:"100%",padding:"4px",border:"1px solid #ccc",borderRadius:"4px"}}/>
</div>
</div>

<h2>Nogabali</h2>
<div style={{overflowX:"auto"}}>
<table border="1" cellPadding="4" style={{fontSize:"11px",width:"100%",minWidth:"900px"}}>
<thead style={{background:"#225522",color:"white"}}>
<tr>
<th>Nog</th><th>Platība</th><th>Kadastrs</th><th>Valdošā suga</th><th>H (m)</th><th>Koki/ha</th><th>Atjaunošanas veids</th><th>Piezīmes</th><th>Statuss</th>
</tr>
</thead>
<tbody>
{rindas.map((r,i)=>{
const v=validateIzcirtums(r)
return(
<tr key={i} style={{background:v.errors.length>0?"#ffebee":v.warnings.length>0?"#fff8e1":"#e8f5e9"}}>
<td>{r.nog}</td>
<td>{r.platiba} ha</td>
<td>{kadastrs||"—"}</td>
<td>{v.dominantSp||"—"}</td>
<td><input type="number" value={r.h||""} onChange={e=>updateRinda(i,"h",parseFloat(e.target.value)||0)} style={{width:"45px",border:"1px solid #ccc",borderRadius:"3px"}}/></td>
<td><input type="number" value={r.koki||""} onChange={e=>updateRinda(i,"koki",Number(e.target.value))} style={{width:"60px",border:"1px solid #ccc",borderRadius:"3px"}}/></td>
<td>
<select value={r.atjVeids} onChange={e=>updateRinda(i,"atjVeids",e.target.value)} style={{padding:"2px",border:"1px solid #ccc",borderRadius:"3px"}}>
<option>Dabiski atjaunojot</option>
<option>Stādot</option>
<option>Sējot</option>
</select>
</td>
<td><input value={r.piezimes||""} onChange={e=>updateRinda(i,"piezimes",e.target.value)} style={{width:"100px",border:"1px solid #ccc",borderRadius:"3px"}}/></td>
<td style={{fontSize:"10px"}}>
{v.errors.map((e,j)=><div key={j} style={{color:"#c62828"}}>⛔ {e}</div>)}
{v.warnings.map((w,j)=><div key={j} style={{color:"#e65100"}}>⚠️ {w}</div>)}
{v.valid&&v.warnings.length===0&&<span style={{color:"#225522"}}>✓</span>}
</td>
</tr>
)
})}
</tbody>
</table>
</div>

<br/>
<button onClick={exportParskats} style={{padding:"10px 24px",background:"#225522",color:"white",border:"none",borderRadius:"4px",cursor:"pointer",fontSize:"14px"}}>
Drukāt / Saglabāt PDF
</button>
</div>
)
}
// ========== GALVENA APP ==========
function LandingPage({onEnter, onStandard, user, onIziet, onReg, onSludinajumi}){
return(
<div style={{fontFamily:"Arial",minHeight:"100vh",background:"#f6f9f2",maxWidth:"100%",overflowX:"hidden"}}>

  {/* HERO */}
 <div style={{background:"#1a3a1a",padding:"40px 40px 50px",textAlign:"center",display:"flex",flexDirection:"column",alignItems:"center"}}>
    <MezaTirgusLogo/>
    <p style={{color:"#aaa",fontSize:"15px",marginTop:"16px",maxWidth:"600px",margin:"16px auto 0"}}>
      Darbarīks meža speciālistam un meža īpašniekam
    </p>
    <div style={{display:"flex",gap:"12px",justifyContent:"center",marginTop:"28px",flexWrap:"wrap"}}>
      <button onClick={onStandard} style={{padding:"12px 32px",background:"#4caf50",color:"white",border:"none",borderRadius:"6px",fontSize:"16px",fontWeight:"bold",cursor:"pointer"}}>
        Sākt bezmaksas →
      </button>
      {user
        ? <div style={{display:"flex",gap:"8px",alignItems:"center"}}>
            <span style={{color:"#aaa",fontSize:"14px"}}>👤 {user.vards}</span>
            <button onClick={onIziet} style={{padding:"8px 20px",background:"transparent",color:"#aaa",border:"1px solid #aaa",borderRadius:"6px",fontSize:"14px",cursor:"pointer"}}>Iziet</button>
          </div>
        : <button onClick={onReg} style={{padding:"12px 32px",background:"transparent",color:"white",border:"2px solid white",borderRadius:"6px",fontSize:"16px",cursor:"pointer"}}>Reģistrēties</button>
      }
      <button onClick={onSludinajumi} style={{padding:"12px 32px",background:"transparent",color:"white",border:"2px solid #4caf50",borderRadius:"6px",fontSize:"16px",cursor:"pointer"}}>
        📢 Sludinājumi
      </button>
      <div style={{position:"relative",display:"inline-block"}}
  onMouseEnter={e=>e.currentTarget.querySelector('.pilna-menu').style.display='block'}
  onMouseLeave={e=>e.currentTarget.querySelector('.pilna-menu').style.display='none'}>
  <button onClick={onEnter} style={{padding:"12px 32px",background:"transparent",color:"white",border:"2px solid #4caf50",borderRadius:"6px",fontSize:"16px",cursor:"pointer"}}>
    Pilnā versija ▾
  </button>
  <div className="pilna-menu" style={{display:"none",position:"absolute",top:"100%",left:0,background:"white",border:"1px solid #225522",borderRadius:"6px",padding:"8px 0",minWidth:"200px",zIndex:100,marginTop:"4px"}}>
    {["📐 Cirsmas skice","📏 Caurmēra mērījumi","🌲 Dastojumu aprēķini","🧾 Rēķinu izveide","📊 Cirsmu vērtēšana"].map((t,i)=>(
      <div key={i} onClick={onEnter} style={{padding:"8px 16px",fontSize:"13px",color:"#225522",cursor:"pointer",borderBottom:"1px solid #f0f0f0"}}>{t}</div>
    ))}
  </div>
</div>
    </div>
  </div>

  {/* KAS IR MEŽA TIRGUS */}
  <div style={{maxWidth:"900px",margin:"0 auto",padding:"48px 24px 0",textAlign:"center",width:"100%",boxSizing:"border-box"}}>
    <h2 style={{color:"#225522",fontSize:"22px",textAlign:"center",marginBottom:"8px"}}>Kas ir Meža tirgus?</h2>
    <p style={{textAlign:"center",color:"#555",fontSize:"14px",marginBottom:"36px",maxWidth:"700px",margin:"0 auto 36px"}}>
      Meža tirgus ir platforma kas apvieno meža inventarizāciju, cirsmu vērtēšanu, 
      dastojumu aprēķinus, dokumentu sagatavošanu un rēķinu izveidi vienā vietā. 
      Visi aprēķini tiek veikti pēc Latvijā atzītām meža uzmērīšanas metodēm un formulām.
    </p>

    {/* BEZMAKSAS / MAKSAS */}
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"24px",marginBottom:"40px"}}>
      <div style={{background:"white",border:"2px solid #4caf50",borderRadius:"10px",padding:"24px"}}>
        <div style={{color:"#4caf50",fontWeight:"bold",fontSize:"16px",marginBottom:"16px"}}>✓ Bezmaksas</div>
        
          {["PDF augšupielāde un nogabalu analīze","Ieteikumi par cirtes veidu","Saimnieciskā un tirgus vērtība","Ciršanas ieteikumi pēc vecuma un bonitātes","Atjaunošanas pārskats"].map((t,i)=>(
        <div key={i} style={{fontSize:"13px",color:"#333",padding:"6px 0",borderBottom:"1px solid #f0f0f0"}}>✓ {t}</div>
        ))}
        <button onClick={onStandard} style={{marginTop:"16px",width:"100%",padding:"10px",background:"#4caf50",color:"white",border:"none",borderRadius:"6px",cursor:"pointer",fontWeight:"bold"}}>
          Sākt pamata versiju →
        </button>
      </div>
      <div style={{background:"white",border:"2px solid #225522",borderRadius:"10px",padding:"24px"}}>
        <div style={{color:"#225522",fontWeight:"bold",fontSize:"16px",marginBottom:"16px"}}>★ Pilnā versija</div>
        {["Cirsmas skice (KML/SHP) ar PDF","Caurmēra mērījumi ar izdruku","Krautuves vērtība","Sortimentu sadalījums un vērtība","Dastojumu aprēķini","Rēķinu izveide un drukāšana","PDF šķirotājs"].map((t,i)=>(
          <div key={i} style={{fontSize:"13px",color:"#333",padding:"6px 0",borderBottom:"1px solid #f0f0f0"}}>✓ {t}</div>
        ))}
        <button onClick={onEnter} style={{marginTop:"8px",width:"100%",padding:"10px",background:"#225522",color:"white",border:"none",borderRadius:"6px",cursor:"pointer",fontWeight:"bold"}}>
          Izmēģināt pilno versiju →
        </button>
      </div>
    </div>

    {/* KĀ TIEK APRĒĶINĀTS */}
    <div style={{background:"white",border:"1px solid #d0e4c8",borderRadius:"10px",padding:"24px",marginBottom:"40px"}}>
      <h3 style={{color:"#225522",marginTop:0}}>Kā tiek veikti aprēķini?</h3>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"16px",fontSize:"13px",color:"#444"}}>
        <div><b>Kubatūra</b><br/>Aprēķināta pēc Latvijā atzītajiem formas faktoriem katrai koku sugai atsevišķi.</div>
        <div><b>Bonitāte</b><br/>Noteikta pēc augstuma un vecuma attiecības — Latvijas meža bonitātes tabulām.</div>
        <div><b>Sortimentu sadalījums</b><br/>Aprēķināts pēc vidējā caurmēra un kvalitātes klases katrai sugai.</div>
        <div><b>Tirgus vērtība</b><br/>Balstīta uz aktuālajām sortimentu cenām ko lietotājs var atjaunināt jebkurā brīdī.</div>
        <div><b>Cirsmas krāja</b><br/>Aprēķināta pēc šķērslaukuma un vidējā augstuma — Latvijas meža inventarizācijas metodika.</div>
        <div><b>Precizitāte</b><br/>Aprēķinu precizitāte ir tieši atkarīga no inventarizācijas datu precizitātes.</div>
      </div>
    </div>

  </div>

  {/* FOOTER */}
  <div style={{background:"#1a3a1a",padding:"24px",textAlign:"center",marginTop:"20px"}}>
    <p style={{color:"#666",fontSize:"12px",margin:0}}>© 2026 Meža tirgus · meža-tirgus.lv · Darbarīks meža speciālistam un meža īpašniekam</p>
  </div>

</div>
)
}

function MezaTirgusLogo(){
return(
<svg width="240" height="72" viewBox="0 0 300 86" xmlns="http://www.w3.org/2000/svg">
  <rect width="300" height="86" rx="10" fill="#f0f6ec" stroke="#225522" strokeWidth="2"/>
  <rect x="10" y="8" width="68" height="70" rx="5" fill="white" stroke="#225522" strokeWidth="1"/>
  <line x1="10" y1="30" x2="78" y2="30" stroke="#c8dcc0" strokeWidth="0.6"/>
  <line x1="10" y1="52" x2="78" y2="52" stroke="#c8dcc0" strokeWidth="0.6"/>
  <line x1="32" y1="8" x2="32" y2="78" stroke="#c8dcc0" strokeWidth="0.6"/>
  <line x1="56" y1="8" x2="56" y2="78" stroke="#c8dcc0" strokeWidth="0.6"/>
  <polygon points="16,14 50,10 64,38 58,66 40,72 12,56 10,30" fill="rgba(34,85,34,0.1)" stroke="#225522" strokeWidth="1.6"/>
  <polygon points="24,18 20,28 28,28" fill="#225522"/>
  <polygon points="44,13 40,23 48,23" fill="#225522"/>
  <polygon points="36,42 32,52 40,52" fill="#2e7d32"/>
  <polygon points="54,36 50,46 58,46" fill="#2e7d32"/>
  <rect x="10" y="58" width="16" height="14" rx="3" fill="#225522"/>
  <text x="18" y="69" fontFamily="Arial" fontSize="9" fontWeight="bold" fill="white" textAnchor="middle">€</text>
  <line x1="88" y1="8" x2="88" y2="78" stroke="#d0e4c8" strokeWidth="1"/>
  <text x="194" y="34" fontFamily="Georgia, serif" fontSize="20" fontWeight="bold" fill="#225522" textAnchor="middle">MEŽA</text>
  <text x="194" y="56" fontFamily="Georgia, serif" fontSize="20" fontWeight="bold" fill="#1b5e20" textAnchor="middle">TIRGUS</text>
  <text x="194" y="70" fontFamily="Arial" fontSize="6.5" fill="#999" textAnchor="middle" letterSpacing="1.2">DARBARĪKS MEŽA SPECIĀLISTAM UN MEŽA ĪPAŠNIEKAM</text>
</svg>
)
}

function App(){
const [page,setPage]=useState("landing")
const { user, registreties, pieteikties, iziet } = useAuth()
const [showReg, setShowReg] = useState(false)
const [regAtpakal, setRegAtpakal] = useState(null)

const atvertReg = (atpakal) => {
  setRegAtpakal(atpakal || page)
  setShowReg(true)
}

const [rows,setRows]=useState([])
const [izcirtumi,setIzcirtumi]=useState([])
const [editing,setEditing]=useState(false)
const [hoverRow,setHoverRow]=useState(null)
const [kadastrs,setKadastrs]=useState("")
const [saimnieciba,setSaimnieciba]=useState("")
const [showPriceModal,setShowPriceModal]=useState(false)
const [showCustomModal,setShowCustomModal]=useState(false)
const [harvestCostPerM3,setHarvestCostPerM3]=useState(18)
const [forwardCostPerM3,setForwardCostPerM3]=useState(12)
const [customPrices,setCustomPrices]=useState({
log:93,small:65,veneer:130,tara:48,pulp:50,fire:38,chips:15
})
const [customNames,setCustomNames]=useState({
log:"Zāģbaļķi",small:"Sīkbaļķi",veneer:"Finieris",
tara:"Tara",pulp:"Papīrmalka",fire:"Malka",chips:"Šķelda"
})
const [activeSort,setActiveSort]=useState({
log:true,small:true,veneer:true,tara:true,pulp:true,fire:true,chips:true
})
const [extraSorts,setExtraSorts]=useState([])
const [parseText,setParseText]=useState("")
const [jaunaudzes,setJaunaudzes]=useState([])
const [skirotajsState,setSkirotajsState]=useState(null)
const [cirsmaState,setCirsmaState]=useState(null)
const [skiceState,setSkiceState]=useState(null)
const [caurmersState,setCaurmersState]=useState(null)
const [showAtjParskats,setShowAtjParskats]=useState(false)
const [showJkParskats,setShowJkParskats]=useState(false)
const [showIeaudParskats,setShowIeaudParskats]=useState(false)
const [papilduNogabali,setPapilduNogabali]=useState([])
const jkRef=React.useRef(null)
const atjRef=React.useRef(null)
const ieaudRef=React.useRef(null)
if(page==="sludinajumi") return <>
  <SludinajumiPage user={user} onBack={()=>setPage("main")}/>
  {showReg && <RegModal onRegistreties={(d)=>{registreties(d);setShowReg(false);if(regAtpakal)setPage(regAtpakal)}} onPieteikties={(d)=>{pieteikties(d,(kl)=>alert(kl));setShowReg(false);if(regAtpakal)setPage(regAtpakal)}} onAizvērt={()=>setShowReg(false)}/>}
</>
if(page==="landing") return <>
  <LandingPage onEnter={()=>setPage("main")} onStandard={()=>setPage("standard")} user={user} onIziet={iziet} onReg={()=>atvertReg("landing")} onSludinajumi={()=>setPage("sludinajumi")}/>
  {showReg && <RegModal onRegistreties={(d)=>{registreties(d);setShowReg(false);if(regAtpakal)setPage(regAtpakal)}} onAizvērt={()=>setShowReg(false)}/>}
</>
if(page==="standard") return <StandardPage onBack={()=>setPage("landing")} onPilna={(data)=>{
  if(data){
    setRows(data.rows||[])
    setIzcirtumi(data.izcirtumi||[])
    setJaunaudzes(data.jaunaudzes||[])
    setKadastrs(data.kadastrs||"")
    setSaimnieciba(data.saimnieciba||"")
  }
  setTimeout(()=>setPage("main"),50)
}}/>
if(page==="pdfSkirotajs") return <PdfSkirotajsPage onBack={()=>setPage("main")} savedState={skirotajsState} onSaveState={setSkirotajsState}/>
if(page==="cirsma") return <>
  <CirsmaNovertesanaPage onBack={()=>setPage("main")} kadastrsIn={kadastrs} saimniecibaIn={saimnieciba} savedState={cirsmaState} onSaveState={setCirsmaState} user={user} onReg={()=>atvertReg("cirsma")}/>
  {showReg && <RegModal onRegistreties={(d)=>{registreties(d);setShowReg(false);if(regAtpakal)setPage(regAtpakal)}} onAizvērt={()=>setShowReg(false)}/>}
</>
if(page==="atjaunosana") return <AtjaunosanaPage onBack={()=>setPage("main")} izcirtumi={izcirtumi} kadastrs={kadastrs} saimnieciba={saimnieciba}/>
if(page==="skice") return <>
  <CirsmaskicePage onBack={()=>setPage("main")} kadastrsIn={kadastrs} saimniecibaIn={saimnieciba} savedState={skiceState} onSaveState={setSkiceState} user={user} onReg={()=>atvertReg("skice")}/>
  {showReg && <RegModal onRegistreties={(d)=>{registreties(d);setShowReg(false);if(regAtpakal)setPage(regAtpakal)}} onAizvērt={()=>setShowReg(false)}/>}
</>
if(page==="caurmers") return <CaurmeraPage onBack={()=>setPage("main")} savedState={caurmersState} onSaveState={setCaurmersState}/>
if(page==="rekini") return <RekinuKratuve onBack={()=>setPage("main")} user={user} onReg={()=>atvertReg("rekini")}/>
if(page==="caurmers_mobile") return <CaurmeraMobile onBack={()=>setPage("main")}/>
if(page==="cirsma_mobile") return <CirsmaNovertesanaMobile onBack={()=>setPage("main")}/>
if(page==="dastojums") return <div style={{padding:"40px",fontFamily:"Arial"}}><button onClick={()=>setPage("main")} style={{marginBottom:"16px",padding:"6px 14px",background:"#555",color:"white",border:"none",borderRadius:"4px",cursor:"pointer"}}>Atpakaļ</button><h1>Dastojuma aprēķini</h1><p style={{color:"#888"}}>Drīzumā...</p></div>

const landPrices={
Ap:4500,Vr:4500,Nd:2500,Db:2500,Vrs:3000,Dm:3000,Kp:3000
}

const sortimentNames=customNames
const prices=customPrices

const handlePDF=async(event)=>{
console.log("PDF poga nospiesta")
const file=event.target.files[0]
if(!file) return
const reader=new FileReader()
reader.onload=async function(){
const typedArray=new Uint8Array(this.result)
const pdf=await pdfjsLib.getDocument(typedArray).promise
let fullText=""
for(let page=1;page<=pdf.numPages;page++){
const pageData=await pdf.getPage(page)
const textContent=await pageData.getTextContent()
textContent.items.forEach(item=>{ fullText+=item.str+" " })
}
parseNogabali(fullText)
}
reader.readAsArrayBuffer(file)
}

function parseNogabali(txt){
const cleanTxt = txt.replace(/\s+/g," ").trim()
const tokens=cleanTxt.split(" ")
const result=[]
const izcirtumiArr=[]

const kadMatch = cleanTxt.match(/apzīmējums-\s*(\S+)/)
if(kadMatch) setKadastrs(kadMatch[1])
const saimMatch = cleanTxt.match(/Saimniecība:\s*([^\n]+)/)
if(saimMatch) setSaimnieciba(saimMatch[1].trim().split(" ")[0])

const izcirtumRegex = /(\d+) ([\d,.]+) Izcirtums (\w+).*?izpildes veids un gads: ([\wēāīūčšžģķļņ ]+?) (\d{4}).*?atjaunošanas gads: (\d{4})/g
let icMatch
while((icMatch=izcirtumRegex.exec(cleanTxt))!==null){
izcirtumiArr.push({
nog:icMatch[1],
platiba:Number(icMatch[2].replace(",","."))||0,
tips:icMatch[3],
cirteVeids:icMatch[4].trim(),
cirteGads:Number(icMatch[5]),
atjaunGads:Number(icMatch[6]),
formula:"",h:0,koki:0,atjaunosanas:true
})
}

for(let i=0;i<tokens.length-3;i++){
const num0=parseFloat((tokens[i]||"").replace(",","."))
const num1=parseFloat((tokens[i+1]||"").replace(",","."))
if(!isNaN(num0)&&!isNaN(num1)&&tokens[i+2]&&tokens[i+2].includes("Mežaudze")){
let j=i+4
let formula=""
const bonitates=["Ia","I","II","III","IV","V"]
while(tokens[j]&&tokens[j]!=="D"&&tokens[j]!=="M"&&!bonitates.includes(tokens[j])){
formula+=tokens[j]+" "
j++
}
if(tokens[j]&&tokens[j]!=="D"&&tokens[j]!=="M") j++
const formulaStr=formula.trim()
const speciesMatches=formulaStr.match(/(\d+)(Bl|Ba|P|E|B|A|M|Oz|Os|G)(\d+)?/g)||[]
const speciesAges={}
let dominantAge=Number(tokens[j+4])||0
speciesMatches.forEach(m=>{
const parts=m.match(/(\d+)(Bl|Ba|P|E|B|A|M|Oz|Os|G)(\d+)?/)
if(parts&&parts[3]){speciesAges[parts[2]]=Number(parts[3]);if(!dominantAge)dominantAge=Number(parts[3])}
})
const isPlantacija=tokens.slice(j,j+30).some(t=>t.includes("Plantācijas"))
const izcelsanas=(tokens[j]==="M"||tokens[j]==="D")?tokens[j]:"D"
result.push({
nog:tokens[i]||"",platiba:parseFloat(tokens[i+1].replace(",","."))||0,
tips:tokens[i+3]||"",formula:formulaStr,bon:tokens[j+1]||"",
h:Number(tokens[j+2])||0,d:Number(tokens[j+3])||0,vec:dominantAge,
biez:Number(tokens[j+5])||0,
g:Number(tokens[j+6])>100?0:Number(tokens[j+6])||0,
koki:Number(tokens[j+6])>100?Number(tokens[j+6]):Number(tokens[j+7])||0,
krm3ha:Number(tokens[j+6])>100?Number(tokens[j+7])||0:Number(tokens[j+8])||0,
speciesAges,plantacija:isPlantacija,harvestType:"",izcelsanas
})
}
}
const jaunaudzeArr=[]
const jaunaudzeRegex=/(\d+) ([\d,.]+) Mežaudze (\w+).*?jaunaudžu kopšanas gads:\s*(\d{4})/g
let jaMatch
while((jaMatch=jaunaudzeRegex.exec(cleanTxt))!==null){
jaunaudzeArr.push({
nog:jaMatch[1],platiba:Number(jaMatch[2].replace(",","."))||0,
tips:jaMatch[3],kopšanasGads:Number(jaMatch[4])
})
}
setRows(result)
setIzcirtumi(izcirtumiArr)
setJaunaudzes(jaunaudzeArr)
}

function updateCell(index,field,value){
const newRows=[...rows]
const parsed=["platiba","h","d","vec","biez","g","koki","krm3ha"].includes(field)?Number(value):value
newRows[index][field]=parsed
setRows(newRows)
}

function updateIzcirtums(index,field,value){
const newIc=[...izcirtumi]
newIc[index][field]=value
setIzcirtumi(newIc)
}

let sortimentTotals={log:0,small:0,veneer:0,tara:0,pulp:0,fire:0,chips:0}

rows.forEach(row=>{
const calc=forestEngine(row)||{}
const sortiments=calc.sortiments||{}
Object.keys(sortimentTotals).forEach(k=>{sortimentTotals[k]+=sortiments[k]||0})
})

izcirtumi.forEach(ic=>{
if(ic.formula&&ic.h>0&&ic.koki>0){
const G=ic.koki*Math.PI*Math.pow(0.05,2)
const row={formula:ic.formula,h:ic.h,d:10,vec:5,g:G,koki:ic.koki,platiba:ic.platiba,bon:"II",biez:0.8,krm3ha:0,speciesAges:{},plantacija:false,harvestType:""}
const calc=forestEngine(row)||{}
const sortiments=calc.sortiments||{}
Object.keys(sortimentTotals).forEach(k=>{sortimentTotals[k]+=sortiments[k]||0})
}
})

const totalVolume=Object.values(sortimentTotals).reduce((a,b)=>a+b,0)
const totalMoney=Object.keys(sortimentTotals).reduce((sum,k)=>sum+(activeSort[k]!==false?sortimentTotals[k]*(prices[k]||0):0),0)+extraSorts.reduce((sum,s)=>sum+(s.volume||0)*(s.price||0),0)
const totalLandValue=rows.reduce((sum,row)=>sum+row.platiba*(landPrices[row.tips]||0),0)+izcirtumi.reduce((sum,ic)=>sum+ic.platiba*(landPrices[ic.tips]||0),0)
const stadijumuVertiba=rows.reduce((sum,row)=>sum+(row.izcelsanas==="M"?row.platiba*1500:0),0)
const harvestCost=16,forwardCost=12
const loggingCost=(harvestCost+forwardCost)*totalVolume
const roadsideValue=totalMoney-loggingCost
const economicValue=totalMoney+totalLandValue
const plantacijaValue=rows.reduce((sum,row)=>{const calc=forestEngine(row);return sum+(calc.decision==="Plantācija"?(calc.marketValue||0):0)},0)
const economicValueTotal=economicValue+plantacijaValue+stadijumuVertiba
const marketValue=rows.reduce((sum,row)=>{const calc=forestEngine(row);return sum+(calc.marketValue||0)},0)+totalLandValue+stadijumuVertiba

function exportPDF(){
const today=new Date().toLocaleDateString("lv-LV")
const totalArea=rows.reduce((s,r)=>s+r.platiba,0)+izcirtumi.reduce((s,ic)=>s+ic.platiba,0)
const html=`<html><head><meta charset="UTF-8"><style>body{font-family:Arial;font-size:11px;padding:20px}h2{color:#225522}table{border-collapse:collapse;width:100%;margin-bottom:20px}th{background:#225522;color:white;padding:4px 6px;font-size:9px}td{padding:3px 6px;border:1px solid #ccc;font-size:9px}tr:nth-child(even){background:#f0f8f0}.kops{font-size:12px;font-weight:bold;margin:4px 0}.warn{background:#fff8e1;border:1px solid #f9a825;padding:8px;margin-bottom:10px}.ic-row{background:#fff3e0}</style></head><body>
<h2>MEŽA TIRGUS — ĪPAŠUMA ANALĪZE</h2>
<p><b>Kadastra numurs:</b> ${kadastrs} | <b>Saimniecība:</b> ${saimnieciba}</p>
<p>Datums: ${today} | Platība: ${totalArea.toFixed(2)} ha | Nogabali: ${rows.length+izcirtumi.length}</p>
${izcirtumi.length>0?`<div class="warn"><b>Izcirtumi</b><table><thead><tr><th>Nog</th><th>Platība</th><th>Tips</th><th>Cirtes veids</th><th>Gads</th><th>Atjaunot līdz</th><th>Formula</th><th>H</th><th>Koki/ha</th><th>Statuss</th></tr></thead><tbody>${izcirtumi.map(ic=>`<tr><td>${ic.nog}</td><td>${ic.platiba} ha</td><td>${ic.tips}</td><td>${ic.cirteVeids}</td><td>${ic.cirteGads}</td><td><b>${ic.atjaunGads}</b></td><td>${ic.formula||"—"}</td><td>${ic.h||"—"}</td><td>${ic.koki||"—"}</td><td>${ic.formula?"Atjaunots":"Jāiesniedz VMD"}</td></tr>`).join("")}</tbody></table></div>`:""}
<table><thead><tr><th>Nog</th><th>Platība</th><th>Tips</th><th>Formula</th><th>H</th><th>D</th><th>Vec</th><th>G</th><th>Ieteiktā cirte</th><th>Krāja m³</th><th>Vērtība €</th></tr></thead><tbody>
${rows.map(r=>{const calc=forestEngine(r);return`<tr><td>${r.nog}</td><td>${r.platiba}</td><td>${r.tips}</td><td>${r.formula}</td><td>${r.h}</td><td>${r.d}</td><td>${r.vec}</td><td>${r.g}</td><td>${calc.decision}</td><td>${(calc.cutVolume||0).toFixed(1)}</td><td>${(calc.marketValue||0).toFixed(0)}</td></tr>`}).join("")}
</tbody></table>
<table><thead><tr><th>Sortiments</th><th>m³</th><th>Cena €</th><th>Vērtība €</th></tr></thead><tbody>
${Object.keys(sortimentTotals).filter(k=>activeSort[k]!==false).map(k=>`<tr><td>${sortimentNames[k]}</td><td>${sortimentTotals[k].toFixed(1)}</td><td>${prices[k]||0}</td><td>${(sortimentTotals[k]*(prices[k]||0)).toFixed(0)}</td></tr>`).join("")}
</tbody></table>
<div class="kops">Sortimentu vērtība: ${totalMoney.toFixed(0)} €</div>
<div class="kops">Zemes vērtība: ${totalLandValue.toFixed(0)} €</div>
<div class="kops">Saimnieciskā vērtība: ${economicValueTotal.toFixed(0)} €</div>
<div class="kops">Tirgus vērtība: ${marketValue.toFixed(0)} €</div>
${stadijumuVertiba>0?`<div class="kops" style="color:#225522">* Stādījumu vērtība: ${stadijumuVertiba.toFixed(0)} € (1500 €/ha)</div>`:""}
</body></html>`
const win=window.open("","_blank")
win.document.write(html)
win.document.close()
win.print()
}

return(
<div style={{padding:"40px",fontFamily:"Arial"}}>
{showReg && <RegModal onRegistreties={(d)=>{registreties(d);setShowReg(false)}} onPieteikties={(d)=>{pieteikties(d,(kl)=>alert(kl));setShowReg(false)}} onAizvērt={()=>setShowReg(false)}/>}

{showCustomModal && (
<div style={{position:"fixed",top:0,left:0,width:"100%",height:"100%",background:"rgba(0,0,0,0.5)",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center"}}>
<div style={{background:"white",padding:"30px",borderRadius:"8px",minWidth:"500px",maxHeight:"80vh",overflow:"auto"}}>
<h2>Personalizēt izstrādi</h2>
<h3>Izstrādes izmaksas</h3>
<table border="1" cellPadding="6"><thead><tr><th>Parametrs</th><th>€/m³</th></tr></thead><tbody>
<tr><td>Harvesteris</td><td><input type="number" value={harvestCostPerM3} onChange={e=>setHarvestCostPerM3(Number(e.target.value))} style={{width:"60px"}}/></td></tr>
<tr><td>Pievešana</td><td><input type="number" value={forwardCostPerM3} onChange={e=>setForwardCostPerM3(Number(e.target.value))} style={{width:"60px"}}/></td></tr>
</tbody></table>
<h3>Sortimenti un cenas</h3>
<table border="1" cellPadding="6"><thead><tr><th>Iekļaut</th><th>Sortiments</th><th>Cena €/m³</th></tr></thead><tbody>
{Object.keys(customPrices).map(k=>(
<tr key={k}>
<td><input type="checkbox" checked={activeSort[k]!==false} onChange={e=>setActiveSort({...activeSort,[k]:e.target.checked})}/></td>
<td><input value={customNames[k]} onChange={e=>setCustomNames({...customNames,[k]:e.target.value})} style={{width:"120px"}}/></td>
<td><input type="number" value={customPrices[k]} onChange={e=>setCustomPrices({...customPrices,[k]:Number(e.target.value)})} style={{width:"60px"}}/></td>
</tr>
))}
</tbody></table>
<h3>Papildu sortimenti</h3>
<table border="1" cellPadding="6"><thead><tr><th>Nosaukums</th><th>m³</th><th>Cena €/m³</th><th></th></tr></thead><tbody>
{extraSorts.map((s,i)=>(
<tr key={i}>
<td><input value={s.name} onChange={e=>{const n=[...extraSorts];n[i]={...n[i],name:e.target.value};setExtraSorts(n)}} style={{width:"120px"}}/></td>
<td><input type="number" value={s.volume} onChange={e=>{const n=[...extraSorts];n[i]={...n[i],volume:Number(e.target.value)};setExtraSorts(n)}} style={{width:"60px"}}/></td>
<td><input type="number" value={s.price} onChange={e=>{const n=[...extraSorts];n[i]={...n[i],price:Number(e.target.value)};setExtraSorts(n)}} style={{width:"60px"}}/></td>
<td><button onClick={()=>setExtraSorts(extraSorts.filter((_,j)=>j!==i))}>X</button></td>
</tr>
))}
</tbody></table>
<button onClick={()=>setExtraSorts([...extraSorts,{name:"Jauns",volume:0,price:0}])} style={{marginTop:"8px",marginBottom:"16px"}}>+ Pievienot sortimentu</button>
<br/>
<button onClick={()=>setShowCustomModal(false)} style={{marginRight:"10px",padding:"8px 16px",background:"#225522",color:"white",border:"none",borderRadius:"4px"}}>Saglabāt</button>
<button onClick={()=>setShowCustomModal(false)} style={{padding:"8px 16px"}}>Aizvērt</button>
</div>
</div>
)}

{showPriceModal && (
<div style={{position:"fixed",top:0,left:0,width:"100%",height:"100%",background:"rgba(0,0,0,0.5)",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center"}}>
<div style={{background:"white",padding:"30px",borderRadius:"8px",minWidth:"500px",maxHeight:"80vh",overflow:"auto"}}>
<h2>Atjaunināt cenas</h2>
<p>Ielīmē tekstu no LVM, LVMI vai citas lapas:</p>
<textarea value={parseText} onChange={e=>setParseText(e.target.value)} style={{width:"100%",height:"200px",marginBottom:"10px"}} placeholder="Ielīmē tekstu ar cenām šeit..."/>
<br/>
<button onClick={()=>{
const text=parseText.toLowerCase()
const newPrices={...customPrices}
const patterns={log:["zāģbaļķi","zāģbaļķ"],small:["sīkbaļķi","sīkbaļķ"],veneer:["finieris"],tara:["tara"],pulp:["papīrmalka"],fire:["malka"],chips:["šķelda"]}
Object.keys(patterns).forEach(k=>{patterns[k].forEach(pat=>{const idx=text.indexOf(pat);if(idx!==-1){const snippet=text.slice(idx,idx+30);const match=snippet.match(/(\d+[\.,]\d+|\d+)/);if(match){const val=parseFloat(match[1].replace(",","."));if(val>5&&val<500)newPrices[k]=val}}})})
setCustomPrices(newPrices)
alert("Cenas atjauninātas!")
}} style={{marginRight:"10px",padding:"8px 16px",background:"#225522",color:"white",border:"none",borderRadius:"4px"}}>Parsēt cenas</button>
<button onClick={()=>setShowPriceModal(false)} style={{padding:"8px 16px"}}>Aizvērt</button>
</div>
</div>
)}

<div style={{display:"flex",alignItems:"center",gap:"16px",marginBottom:"16px",flexWrap:"wrap"}}>
  <MezaTirgusLogo/>
  <button onClick={()=>setPage("landing")} style={{padding:"6px 14px",background:"#225522",color:"white",border:"none",borderRadius:"4px",cursor:"pointer",fontSize:"13px"}}>← Sākumlapa</button>
  <button onClick={()=>setPage("sludinajumi")} style={{padding:"6px 14px",background:"#388e3c",color:"white",border:"none",borderRadius:"4px",cursor:"pointer",fontSize:"13px"}}>
    📢 Sludinājumi
  </button>
  {user && <span style={{fontSize:"12px",color:"#225522"}}>👤 {user.vards}</span>}
  {user && <button onClick={iziet} style={{padding:"6px 12px",background:"#888",color:"white",border:"none",borderRadius:"4px",cursor:"pointer",fontSize:"12px"}}>Iziet</button>}
  {!user && <button onClick={()=>atvertReg("main")} style={{padding:"6px 14px",background:"#1565c0",color:"white",border:"none",borderRadius:"4px",cursor:"pointer",fontSize:"13px"}}>🔑 Pieteikties</button>}
</div>

{/* PRO RĪKI */}
<div style={{display:"flex",gap:"10px",marginBottom:"20px",flexWrap:"wrap"}}>
<button onClick={()=>setPage("skice")} style={{padding:"8px 16px",background:"#1565c0",color:"white",border:"none",borderRadius:"4px",cursor:"pointer"}}>📐 Cirsmas skice, caurmērs un dastojums</button>
<button onClick={()=>setPage("pdfSkirotajs")} style={{padding:"8px 16px",background:"#6a1b9a",color:"white",border:"none",borderRadius:"4px",cursor:"pointer"}}>PDF šķirotājs</button>
<button onClick={()=>setPage("cirsma")} style={{padding:"8px 16px",background:"#2e7d32",color:"white",border:"none",borderRadius:"4px",cursor:"pointer"}}>Cirsmas novērtēšana</button>
<button onClick={()=>setPage("rekini")} style={{padding:"8px 16px",background:"#e65100",color:"white",border:"none",borderRadius:"4px",cursor:"pointer"}}>🧾 Rēķinu krātuve</button>
<button onClick={()=>setPage("caurmers_mobile")} style={{padding:"8px 16px",background:"#0f1117",color:"#4ade80",border:"1px solid #4ade80",borderRadius:"4px",cursor:"pointer"}}>📏 Caurmērs (mobilais)</button>
<button onClick={()=>setPage("cirsma_mobile")} style={{padding:"8px 16px",background:"#0f1117",color:"#4ade80",border:"1px solid #4ade80",borderRadius:"4px",cursor:"pointer"}}>🌲 Cirsmas vērtēšana (mobilais)</button>


</div>

<div style={{marginBottom:"12px",display:"flex",gap:"8px",flexWrap:"wrap",alignItems:"center"}}>
<a href="https://www.lvmgeo.lv/kartes" target="_blank" rel="noreferrer" style={{padding:"6px 14px",background:"#2e7d32",color:"white",borderRadius:"4px",textDecoration:"none",fontSize:"12px",fontWeight:"bold"}}>🗺 LVM GEO</a>
<a href="https://www.vmd.gov.lv" target="_blank" rel="noreferrer" style={{padding:"6px 14px",background:"#5d4037",color:"white",borderRadius:"4px",textDecoration:"none",fontSize:"12px",fontWeight:"bold"}}>🏛 VMD</a>
  {kadastrs && <>
    <span style={{fontSize:"12px"}}><b>Kadastrs:</b> {kadastrs} | <b>Saimniecība:</b> {saimnieciba}</span>
    <button onClick={()=>navigator.clipboard.writeText(kadastrs)} style={{padding:"6px 14px",background:"#555",color:"white",border:"none",borderRadius:"4px",fontSize:"12px",cursor:"pointer"}}>📋 Kopēt kadastru</button>
  </>}
</div>

<input type="file" accept="application/pdf" onChange={handlePDF}/>

{jaunaudzes.length>0 && (
<div style={{background:"#e8f5e9",border:"1px solid #388e3c",borderRadius:"6px",padding:"12px",margin:"16px 0"}}>
<div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"8px"}}>
<b>Jaunaudžu kopšana</b>
<button onClick={()=>{
  const gatavs = jaunaudzes.some(ja=>ja.koki>0)
  if(!gatavs){alert("Aizpildiet vismaz vienam nogabalam koku skaitu!");return}
  setShowJkParskats(true)
  setTimeout(()=>jkRef.current?.scrollIntoView({behavior:"smooth"}),100)
}} style={{padding:"6px 14px",background:"#388e3c",color:"white",border:"none",borderRadius:"4px",cursor:"pointer",fontSize:"12px"}}>
  📋 Jaunaudžu kopšanas pārskats
</button>
</div>
<table border="1" cellPadding="6" style={{marginTop:"8px",width:"100%"}}>
<thead style={{background:"#388e3c",color:"white"}}><tr><th>Nog</th><th>Platība</th><th>Tips</th><th>Kopšanas gads</th><th>Valdošā suga</th><th>Augstums (m)</th><th>Audzes sastāvs</th><th>Koki/ha</th></tr></thead>
<tbody>
{jaunaudzes.map((ja,i)=>(
<tr key={i}>
<td>{ja.nog}</td><td>{ja.platiba} ha</td><td>{ja.tips}</td>
<td style={{color:ja.kopšanasGads<=new Date().getFullYear()?"#c62828":"black",fontWeight:ja.kopšanasGads<=new Date().getFullYear()?"bold":"normal"}}>
{ja.kopšanasGads<=new Date().getFullYear()?ja.kopšanasGads+" — Kavēta kopšana / nav iesniegts pārskats":ja.kopšanasGads}
</td>
<td>{ja.tips||"—"}</td>
<td><input type="number" step="0.1" min="0.1" value={ja.h||""} onChange={e=>{const n=[...jaunaudzes];n[i]={...n[i],h:parseFloat(e.target.value)||0};setJaunaudzes(n)}} placeholder="m" style={{width:"45px",border:"1px solid #ccc",borderRadius:"3px",padding:"2px"}}/></td>
<td><input value={ja.formula||""} onChange={e=>{const n=[...jaunaudzes];n[i]={...n[i],formula:e.target.value};setJaunaudzes(n)}} placeholder="p.ē. 10B" style={{width:"60px",border:"1px solid #ccc",borderRadius:"3px",padding:"2px"}}/></td>
<td><input type="number" value={ja.koki||""} onChange={e=>{const n=[...jaunaudzes];n[i]={...n[i],koki:Number(e.target.value)};setJaunaudzes(n)}} placeholder="gab" style={{width:"55px",border:"1px solid #ccc",borderRadius:"3px",padding:"2px"}}/></td>
</tr>
))}
</tbody>
</table>
</div>
)}

{izcirtumi.length>0 && (
<div style={{background:"#fff8e1",border:"1px solid #f9a825",borderRadius:"6px",padding:"12px",margin:"16px 0"}}>
<div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"8px",flexWrap:"wrap",gap:"8px"}}>
<b>Izcirtumi — nepieciešama atjaunošana</b>
<div style={{display:"flex",gap:"8px"}}>
<button onClick={()=>{
  const gatavs = izcirtumi.some(ic=>ic.formula&&ic.h>0&&ic.koki>0)
  if(!gatavs){alert("Aizpildiet vismaz vienam nogabalam: sugu, augstumu un koku skaitu!");return}
  setShowAtjParskats(true)
  setTimeout(()=>atjRef.current?.scrollIntoView({behavior:"smooth"}),100)
}} style={{padding:"6px 14px",background:"#225522",color:"white",border:"none",borderRadius:"4px",cursor:"pointer",fontSize:"12px"}}>
  📋 Atjaunošanas pārskats
</button>
<button onClick={()=>{
  const gatavs = izcirtumi.some(ic=>ic.atjVeids==="Stādot"&&ic.formula&&ic.h>0&&ic.koki>0)
  if(!gatavs){alert("Aizpildiet vismaz vienam nogabalam atjaunošanas veidu 'Stādot', sugu, augstumu un koku skaitu!");return}
  setShowIeaudParskats(true)
  setTimeout(()=>ieaudRef.current?.scrollIntoView({behavior:"smooth"}),100)
}} style={{padding:"6px 14px",background:"#1565c0",color:"white",border:"none",borderRadius:"4px",cursor:"pointer",fontSize:"12px"}}>
  🌱 Ieaudzēšanas pārskats
</button>
</div>
</div>
<table border="1" cellPadding="6" style={{marginTop:"8px",width:"100%"}}>
<thead style={{background:"#f9a825"}}>
<tr><th>Nog</th><th>Platība</th><th>Tips</th><th>Cirtes veids</th><th>Gads</th><th>Atjaunot līdz</th><th>Formula</th><th>H (m)</th><th>Koki/ha</th><th>Statuss</th></tr>
</thead>
<tbody>
{izcirtumi.map((ic,i)=>(
<tr key={i} style={{background:ic.atjaunGads<=new Date().getFullYear()?"#ffcccc":"#fffde7"}}>
<td>{ic.nog}</td><td>{ic.platiba} ha</td><td>{ic.tips}</td><td>{ic.cirteVeids}</td><td>{ic.cirteGads}</td><td><b>{ic.atjaunGads}</b></td>
<td><input style={{width:"90px"}} value={ic.formula} placeholder="p.ē. 10P" onChange={e=>updateIzcirtums(i,"formula",e.target.value)}/></td>
<td><input type="number" step="0.1" min="0.1" style={{width:"45px"}} value={ic.h||""} placeholder="m" onChange={e=>updateIzcirtums(i,"h",parseFloat(e.target.value.replace(",",".")))}/></td>
<td><input type="number" style={{width:"55px"}} value={ic.koki||""} placeholder="gab" onChange={e=>updateIzcirtums(i,"koki",Number(e.target.value))}/></td>
<td style={{fontSize:"10px",maxWidth:"180px"}}>
{(()=>{
if(!ic.formula&&!ic.h&&!ic.koki) return <span style={{color:"#c62828",fontWeight:"bold"}}>⚠️ Jāiesniedz VMD</span>
const matches=(ic.formula||"").match(/(\d+)(Bl|Ba|Oz|Os|P|E|B|A|M|G)/g)||[]
const summa=matches.reduce((s,m)=>{const n=parseInt(m.match(/\d+/)[0]);return s+(n<=10?n*10:n)},0)
const dominantM=matches.reduce((best,m)=>{const n=parseInt(m.match(/\d+/)[0]);const pct=n<=10?n*10:n;const sp=m.match(/[A-Za-z]+/)[0];return pct>(best.pct||0)?{sp,pct}:best},{})
const sp=dominantM.sp||""
const h=Number(ic.h)||0
const koki=Number(ic.koki)||0
const ntc={P:2000,E:1500,B:1500,A:1500,Ba:1500,Bl:1500,M:1500,Oz:1500,Os:1500,G:1500,liepa:1500}
const minKoki=ntc[sp]||0
const kludas=[]
const bridinas=[]
if(matches.length>0&&summa!==100) kludas.push(`Formula summa ${summa/10} ≠ 10`)
if(ic.formula&&matches.length===0) kludas.push("Formula nav atpazīta")
if(!ic.h||h===0) kludas.push("Nav augstums")
if(!ic.koki||koki===0) kludas.push("Nav koku skaits")
if(minKoki&&koki>0&&koki<minKoki) kludas.push(`Koki ${koki} < min ${minKoki} gab/ha`)
if(minKoki&&koki>0&&["P","E","B"].includes(sp)&&h>=2&&koki>minKoki) bridinas.push(`Vajadzīga jaunaudžu kopšana (${sp} H=${h}m, ${koki}>${minKoki})`)
if(kludas.length>0) return <div>{kludas.map((k,i)=><div key={i} style={{color:"#c62828",fontWeight:"bold"}}>⛔ {k}</div>)}</div>
if(bridinas.length>0) return <div>{bridinas.map((b,i)=><div key={i} style={{color:"#e65100",fontWeight:"bold"}}>⚠️ {b}</div>)}<div style={{color:"#225522",fontWeight:"bold"}}>✓ Var iesniegt</div></div>
return <span style={{color:"#225522",fontWeight:"bold"}}>✓ Atjaunots</span>
})()}
</td>
</tr>
))}
</tbody>
</table>
</div>
)}

<div style={{maxHeight:"500px",overflow:"auto"}}>
<table border="1" cellPadding="6">
<thead style={{position:"sticky",top:0,background:"#eee"}}>
<tr>
<th>Nog</th><th>Platība</th><th>Tips</th><th>Formula</th><th>H</th><th>D</th><th>Vecums</th><th>Biez</th><th>G</th><th>Koki/ha</th><th>Ieteiktā cirte</th><th>Izvēlētā cirte</th><th>Cirsmas krāja m³</th><th>Vērtība €</th>
</tr>
</thead>
<tbody>
{rows.map((r,i)=>{
const calc=forestEngine(r)
const treeCount=r.g>100?r.g:r.koki>0?r.koki:""
return(
<tr key={i} onMouseEnter={()=>setHoverRow(i)} onMouseLeave={()=>setHoverRow(null)} style={{background:hoverRow===i?"#e8f5e9":"white"}}>
<td>{r.nog}</td>
<td>{editing?<input style={{width:"50px"}} value={r.platiba} onChange={e=>updateCell(i,"platiba",e.target.value)}/>:r.platiba}</td>
<td>{editing?<input style={{width:"40px"}} value={r.tips} onChange={e=>updateCell(i,"tips",e.target.value)}/>:r.tips}</td>
<td>{editing?<input style={{width:"100px"}} value={r.formula} onChange={e=>updateCell(i,"formula",e.target.value)}/>:r.formula}</td>
<td>{editing?<input style={{width:"35px"}} value={r.h} onChange={e=>updateCell(i,"h",e.target.value)}/>:r.h}</td>
<td>{editing?<input style={{width:"35px"}} value={r.d} onChange={e=>updateCell(i,"d",e.target.value)}/>:r.d}</td>
<td>{editing?<input style={{width:"40px"}} value={r.vec} onChange={e=>updateCell(i,"vec",e.target.value)}/>:r.vec}</td>
<td>{editing?<input style={{width:"35px"}} value={r.biez} onChange={e=>updateCell(i,"biez",e.target.value)}/>:r.biez}</td>
<td>{editing?<input style={{width:"35px"}} value={r.g} onChange={e=>updateCell(i,"g",e.target.value)}/>:r.g}</td>
<td>{editing?<input style={{width:"50px"}} value={r.koki} onChange={e=>updateCell(i,"koki",e.target.value)}/>:treeCount}</td>
<td>{calc.decision}</td>
<td>
{editing?<select value={r.harvestType} onChange={e=>updateCell(i,"harvestType",e.target.value)}>
<option value="">—</option>
<option>Galvenā cirte (vecums)</option>
<option>Galvenā cirte (caurmērs)</option>
<option>Kailcirte</option>
<option>Kopšanas cirte</option>
<option>Sanitārā izlases cirte</option>
<option>Sanitārā vienlaidus cirte</option>
<option>Rekonstruktīvā vienlaidus cirte</option>
</select>:r.harvestType}
</td>
<td>{(calc.cutVolume||0).toFixed(1)}</td>
<td>{(calc.marketValue||0).toFixed(0)}</td>
</tr>
)
})}
{izcirtumi.filter(ic=>ic.formula&&ic.h>0).map((ic,i)=>(
<tr key={"ic"+i} style={{background:"#fff3e0"}}>
<td>{ic.nog}</td><td>{ic.platiba}</td><td>{ic.tips}</td><td>{ic.formula}</td><td>{ic.h}</td><td>—</td><td>—</td><td>—</td><td>—</td><td>{ic.koki||"—"}</td><td>Atjaunošana</td><td>—</td><td>—</td><td>—</td>
</tr>
))}
</tbody>
</table>
</div>

{rows.length>0 && (()=>{
const kailcirteGrupa=["Galvenā cirte (vecums)","Galvenā cirte (caurmērs)","Kailcirte","Sanitārā vienlaidus cirte","Rekonstruktīvā vienlaidus cirte"]
const kopsanasGrupa=["Kopšanas cirte","Sanitārā izlases cirte"]
let kcHa=0,kcVol=0,kkHa=0,kkVol=0
rows.forEach(row=>{
const calc=forestEngine(row)
const dec=calc.decision
const vol=calc.cutVolume||0
if(kailcirteGrupa.includes(dec)){kcHa+=row.platiba;kcVol+=vol}
if(kopsanasGrupa.includes(dec)){kkHa+=row.platiba;kkVol+=vol}
})
return(
<div style={{margin:"16px 0",padding:"12px",background:"#f0f8f0",border:"1px solid #225522",borderRadius:"6px"}}>
<b>Cirsmu kopsavilkums</b>
<table border="1" cellPadding="6" style={{marginTop:"8px"}}>
<thead style={{background:"#225522",color:"white"}}><tr><th>Cirtes veids</th><th>Platība (ha)</th><th>Kopā m³</th><th>Vidēji m³/ha</th></tr></thead>
<tbody>
<tr><td>Kailcirte (kopā)</td><td>{kcHa.toFixed(2)}</td><td>{kcVol.toFixed(1)}</td><td>{kcHa>0?(kcVol/kcHa).toFixed(1):"—"}</td></tr>
<tr><td>Kopšanas cirte (kopā)</td><td>{kkHa.toFixed(2)}</td><td>{kkVol.toFixed(1)}</td><td>{kkHa>0?(kkVol/kkHa).toFixed(1):"—"}</td></tr>
</tbody>
</table>
</div>
)
})()}

{showJkParskats && (
<div ref={jkRef}>
<JaunaudžuParskats
  jaunaudzes={jaunaudzes}
  rows={rows}
  kadastrs={kadastrs}
  saimnieciba={saimnieciba}
  papilduNogabali={papilduNogabali}
  setPapilduNogabali={setPapilduNogabali}
  onClose={()=>setShowJkParskats(false)}
/>
</div>
)}

{showAtjParskats && (
<div ref={atjRef}>
<AtjaunosanaParskats
  izcirtumi={izcirtumi}
  kadastrs={kadastrs}
  saimnieciba={saimnieciba}
  onClose={()=>setShowAtjParskats(false)}
/>
</div>
)}

{showIeaudParskats && (
<div ref={ieaudRef}>
<IeaudzesanaParskats
  izcirtumi={izcirtumi}
  kadastrs={kadastrs}
  saimnieciba={saimnieciba}
  onClose={()=>setShowIeaudParskats(false)}
/>
</div>
)}

<br/>
{!editing&&rows.length>0&&<button onClick={()=>setEditing(true)}>Labot datus</button>}
{editing&&<button onClick={()=>setEditing(false)}>Aprēķināt</button>}
<br/><br/>

<button onClick={exportPDF}>Izdrukāt PDF</button>
<button onClick={()=>{if(window.confirm("Vai PDF ir saglabāts? Visi dati tiks dzēsti!")){setRows([]);setIzcirtumi([]);setKadastrs("");setSaimnieciba("")}}} style={{marginLeft:"10px",padding:"6px 12px",background:"#c62828",color:"white",border:"none",borderRadius:"4px",cursor:"pointer"}}>Notīrīt visu</button>
<button onClick={()=>setShowCustomModal(true)} style={{marginLeft:"10px"}}>Personalizēt izstrādi</button>
<button onClick={()=>setShowPriceModal(true)} style={{marginLeft:"10px"}}>Atjaunināt cenas</button>

<br/><br/>
<h2>Sortimentu sadalījums</h2>
<table border="1" cellPadding="6">
<thead><tr><th>Sortiments</th><th>m³</th><th>Cena €</th><th>Vērtība €</th></tr></thead>
<tbody>
{Object.keys(sortimentTotals).filter(k=>activeSort[k]!==false).map(k=>{
const volume=sortimentTotals[k],price=prices[k]||0
return(<tr key={k}><td>{sortimentNames[k]}</td><td>{volume.toFixed(1)}</td><td>{price}</td><td>{(volume*price).toFixed(0)}</td></tr>)
})}
{extraSorts.map((s,i)=>(<tr key={"extra"+i}><td>{s.name}</td><td>{(s.volume||0).toFixed(1)}</td><td>{s.price||0}</td><td>{((s.volume||0)*(s.price||0)).toFixed(0)}</td></tr>))}
</tbody>
</table>

<br/>
<h2>Kubikmetru summa: {totalVolume.toFixed(1)} m³</h2>
<h2>Sortimentu vērtība: {totalMoney.toFixed(0)} €</h2>
<h2>Zemes vērtība: {totalLandValue.toFixed(0)} €</h2>
<h1>Saimnieciskā vērtība: {economicValueTotal.toFixed(0)} €</h1>
<h1>Tirgus vērtība: {marketValue.toFixed(0)} €</h1>
<h2>Krautuves vērtība: {roadsideValue.toFixed(0)} €</h2>
{stadijumuVertiba>0&&<p style={{color:"#225522",fontWeight:"bold"}}>* Stādījumu vērtība: {stadijumuVertiba.toFixed(0)} € (1500 €/ha)</p>}

</div>
)
}
function RekinuKratuve({ onBack, user, onReg }) {
  const [rekini, setRekini] = useState(() => JSON.parse(localStorage.getItem("rekinu_kratuve") || "[]"))
  const [filtrGads, setFiltrGads] = useState("")
  const [filtrKlients, setFiltrKlients] = useState("")
  const [showJaunsRekins, setShowJaunsRekins] = useState(false)

  const dzest = (id) => {
    if (!window.confirm("Dzēst šo rēķinu?")) return
    const jaunie = rekini.filter(r => r.id !== id)
    setRekini(jaunie)
    localStorage.setItem("rekinu_kratuve", JSON.stringify(jaunie))
  }

  const drukат = (r) => {
    const gads = new Date().getFullYear()
    const skaitliVardos = (n) => {
      const v = Math.floor(n), c = Math.round((n - v) * 100)
      const vien = ["","viens","divi","trīs","četri","pieci","seši","septiņi","astoņi","deviņi","desmit","vienpadsmit","divpadsmit","trīspadsmit","četrpadsmit","piecpadsmit","sešpadsmit","septiņpadsmit","astoņpadsmit","deviņpadsmit"]
      const des = ["","","divdesmit","trīsdesmit","četrdesmit","piecdesmit","sešdesmit","septiņdesmit","astoņdesmit","deviņdesmit"]
      const sim = ["","simts","divi simti","trīs simti","četri simti","pieci simti","seši simti","septiņi simti","astoņi simti","deviņi simti"]
      let s = ""
      if (v >= 1000) s += (v >= 2000 ? vien[Math.floor(v / 1000)] + " " : "") + "tūkstoši "
      const h = Math.floor((v % 1000) / 100)
      if (h) s += sim[h] + " "
      if (v % 100 < 20) s += vien[v % 100] + " "
      else { const t = Math.floor((v % 100) / 10), o = v % 10; if (t) s += des[t] + " "; if (o) s += vien[o] + " " }
      return s.trim() + " euro " + (c > 0 ? `un ${c} centi` : "un 00 centi")
    }
    const kopaa = r.rindas.reduce((s, l) => s + (l.summa || 0), 0)
    const pvn = r.pvnRezims === "pvn21" ? kopaa * 0.21 : 0
    const kopa_apmaksai = kopaa + pvn
    const html = `<html><head><meta charset="UTF-8">
<style>body{font-family:Arial;font-size:11px;padding:24px;max-width:850px;margin:0 auto}table{border-collapse:collapse;width:100%;margin:8px 0}th{background:#225522;color:white;padding:4px 8px;font-size:10px;text-align:left}td{border:1px solid #ccc;padding:3px 8px;font-size:10px}.info td{border:none;padding:2px 4px}.total{font-weight:bold;background:#f0f8f0}</style>
</head><body>
<p style="text-align:right;font-size:11px">${r.datums} &nbsp;&nbsp;&nbsp; <b>Rēķins Nr. ${r.nr} - ${r.gads}</b></p>
<table class="info"><tbody><tr>
<td style="width:50%;vertical-align:top"><b>Pakalpojumu sniedzējs:</b><br/>${r.sniedzejs.nosaukums || "—"}<br/>Reģ.Nr. ${r.sniedzejs.regNr || "—"}<br/>${r.sniedzejs.adrese || "—"}<br/>Banka: ${r.sniedzejs.banka || "—"}<br/>Kods: ${r.sniedzejs.kods || "—"}<br/>Konts: ${r.sniedzejs.konts || "—"}</td>
<td style="vertical-align:top"><b>Pakalpojumu saņēmējs:</b><br/>${r.sanemejs.nosaukums || "—"}<br/>Reģ.Nr. ${r.sanemejs.regNr || "—"}<br/>${r.sanemejs.adrese || "—"}<br/>Banka: ${r.sanemejs.banka || "—"}<br/>Kods: ${r.sanemejs.kods || "—"}<br/>Konts: ${r.sanemejs.konts || "—"}</td>
</tr></tbody></table>
${r.periods ? `<p><b>Pakalpojumu sniegšanas periods:</b> ${r.periods}</p>` : ""}
<p><b>Apmaksāt:</b> Līdz ${r.apmaksaTermins}</p>
<table><thead><tr><th>Nr.</th><th>Pakalpojuma nosaukums</th><th>Mērv.</th><th>Daudzums</th><th>Cena</th><th>Summa, EUR</th></tr></thead>
<tbody>${r.rindas.map((l, i) => `<tr><td>${i + 1}</td><td>${l.apraksts}</td><td>${l.mervieniba}</td><td>${l.daudzums}</td><td>${parseFloat(l.cena || 0).toFixed(2)}</td><td>${(l.summa || 0).toFixed(2)}</td></tr>`).join("")}</tbody>
<tfoot>
<tr class="total"><td colspan="5">Kopā</td><td>${kopaa.toFixed(2)}</td></tr>
${r.pvnRezims === "pvn21" ? `<tr><td colspan="5">PVN 21%</td><td>${pvn.toFixed(2)}</td></tr><tr class="total"><td colspan="5">Kopā apmaksai</td><td>${kopa_apmaksai.toFixed(2)}</td></tr>` : ""}
${r.pvnRezims === "reversais" ? `<tr><td colspan="6" style="font-style:italic">Reversa PVN piemērošana saskaņā ar PVN likuma 142. pantu</td></tr>` : ""}
</tfoot></table>
<p>Summa apmaksai vārdiem: <b>${skaitliVardos(kopa_apmaksai)}</b></p>
<div style="display:flex;justify-content:space-between;margin-top:30px;font-size:11px">
<div>Rēķinu izrakstīja: <b>${r.izrakstija || "—"}</b> ___________________________</div>
<div>${r.datums}</div></div>
<p style="font-size:9px;color:#888;margin-top:16px">Dokuments sagatavots elektroniski un derīgs bez paraksta.</p>
</body></html>`
    const win = window.open("", "_blank")
    win.document.write(html)
    win.document.close()
    win.print()
  }

  const gadi = [...new Set(rekini.map(r => r.gads))].sort((a, b) => b - a)
  const filtreti = rekini.filter(r =>
    (!filtrGads || r.gads === Number(filtrGads)) &&
    (!filtrKlients || (r.klients || "").toLowerCase().includes(filtrKlients.toLowerCase()))
  )
  const kopasSumma = filtreti.reduce((s, r) => s + parseFloat(r.summa || 0), 0)

  const tagad = new Date()
  const šisMenesis = tagad.getMonth() + 1
  const šisGads = tagad.getFullYear()

  const menesaRekini = rekini.filter(r => {
    const d = r.datums?.split(".")
    return d && Number(d[1]) === šisMenesis && Number(d[2]) === šisGads
  })
  const gadaRekini = rekini.filter(r => r.gads === šisGads)

  const aprekina = (saraksts) => {
    const kopa = saraksts.reduce((s, r) => s + parseFloat(r.summa || 0), 0)
    const pvnSumma = saraksts.reduce((s, r) => {
      const summa = parseFloat(r.summa || 0)
      return s + (r.pvnRezims === "pvn21" ? summa - summa / 1.21 : 0)
    }, 0)
    const bezPvn = kopa - pvnSumma
    return { bezPvn, pvnSumma, kopa }
  }

  const menesaStats = aprekina(menesaRekini)
  const gadaStats = aprekina(gadaRekini)
  const filtretoStats = aprekina(filtreti)

  const kartina = (virsraksts, stats, krasa) => (
    <div style={{ background: "white", border: `2px solid ${krasa}`, borderRadius: "8px", padding: "14px 18px", minWidth: "180px", flex: "1" }}>
      <div style={{ fontSize: "11px", color: "#888", marginBottom: "6px", fontWeight: "bold" }}>{virsraksts}</div>
      <div style={{ fontSize: "18px", fontWeight: "bold", color: krasa }}>{stats.kopa.toFixed(2)} €</div>
      <div style={{ fontSize: "10px", color: "#555", marginTop: "4px" }}>Bez PVN: {stats.bezPvn.toFixed(2)} €</div>
      <div style={{ fontSize: "10px", color: "#c62828" }}>PVN: {stats.pvnSumma.toFixed(2)} €</div>
    </div>
  )

  return (
    <div style={{ padding: "40px", fontFamily: "Arial", maxWidth: "1000px" }}>
      <div style={{ display: "flex", gap: "8px", alignItems: "center", marginBottom: "20px", flexWrap: "wrap" }}>
        <button onClick={onBack} style={{ padding: "6px 14px", background: "#555", color: "white", border: "none", borderRadius: "4px", cursor: "pointer" }}>← Atpakaļ</button>
        <h2 style={{ margin: 0, color: "#e65100" }}>🧾 Rēķinu krātuve</h2>
        {user && <span style={{ fontSize: "12px", color: "#555" }}>👤 {user.vards}</span>}
        <button onClick={() => setShowJaunsRekins(true)} style={{ padding: "8px 20px", background: "#e65100", color: "white", border: "none", borderRadius: "4px", cursor: "pointer", fontWeight: "bold" }}>+ Izveidot rēķinu</button>
      </div>

      {showJaunsRekins && (
        <RekinsPanel
          kadastrs="" saimnieciba="" platiba={0}
          onClose={() => { setShowJaunsRekins(false); setRekini(JSON.parse(localStorage.getItem("rekinu_kratuve") || "[]")) }}
          user={user} onReg={onReg}
        />
      )}

      {/* KARTIŅAS */}
      <div style={{ display: "flex", gap: "12px", marginBottom: "20px", flexWrap: "wrap" }}>
        {kartina(`📅 ${šisMenesis}. mēnesis (${menesaRekini.length} rēķini)`, menesaStats, "#1565c0")}
        {kartina(`📆 ${šisGads}. gads (${gadaRekini.length} rēķini)`, gadaStats, "#225522")}
        {kartina(`🔍 Filtrēts (${filtreti.length} rēķini)`, filtretoStats, "#e65100")}
      </div>

      {/* FILTRI */}
      <div style={{ display: "flex", gap: "8px", marginBottom: "16px", flexWrap: "wrap", alignItems: "center" }}>
        <select value={filtrGads} onChange={e => setFiltrGads(e.target.value)} style={{ padding: "4px 8px", border: "1px solid #ccc", borderRadius: "4px" }}>
          <option value="">Visi gadi</option>
          {gadi.map(g => <option key={g} value={g}>{g}</option>)}
        </select>
        <input value={filtrKlients} onChange={e => setFiltrKlients(e.target.value)} placeholder="Meklēt pēc klienta..." style={{ padding: "4px 8px", border: "1px solid #ccc", borderRadius: "4px", width: "200px" }} />
        {filtrKlients && <button onClick={() => setFiltrKlients("")} style={{ padding: "4px 10px", background: "#888", color: "white", border: "none", borderRadius: "4px", cursor: "pointer", fontSize: "11px" }}>✕ Notīrīt</button>}
      </div>

      {filtreti.length === 0
        ? <div style={{ padding: "40px", textAlign: "center", color: "#888", border: "2px dashed #ccc", borderRadius: "8px" }}>Nav saglabātu rēķinu</div>
        : <table border="1" cellPadding="6" style={{ fontSize: "12px", width: "100%", borderCollapse: "collapse" }}>
          <thead style={{ background: "#e65100", color: "white" }}>
            <tr><th>Nr.</th><th>Datums</th><th>Klients</th><th>Periods</th><th>Bez PVN €</th><th>PVN €</th><th>Kopā €</th><th>Darbības</th></tr>
          </thead>
          <tbody>
            {filtreti.map((r, i) => {
              const kopa = parseFloat(r.summa || 0)
              const pvn = r.pvnRezims === "pvn21" ? kopa - kopa / 1.21 : 0
              const bezPvn = kopa - pvn
              return (
                <tr key={r.id} style={{ background: i % 2 === 0 ? "white" : "#fff8f5" }}>
                  <td><b>{r.nr} - {r.gads}</b></td>
                  <td>{r.datums}</td>
                  <td>
                    <span onClick={() => setFiltrKlients(r.klients)} style={{ cursor: "pointer", color: "#1565c0", textDecoration: "underline" }} title="Filtrēt pēc šī klienta">
                      {r.klients}
                    </span>
                  </td>
                  <td>{r.periods || "—"}</td>
                  <td style={{ textAlign: "right" }}>{bezPvn.toFixed(2)}</td>
                  <td style={{ textAlign: "right", color: pvn > 0 ? "#c62828" : "#888" }}>{pvn.toFixed(2)}</td>
                  <td style={{ textAlign: "right", fontWeight: "bold" }}>{kopa.toFixed(2)}</td>
                  <td>
                    <button onClick={() => drukат(r)} style={{ padding: "3px 10px", background: "#e65100", color: "white", border: "none", borderRadius: "3px", cursor: "pointer", marginRight: "4px" }}>🖨 Drukāt</button>
                    <button onClick={() => dzest(r.id)} style={{ padding: "3px 10px", background: "#c62828", color: "white", border: "none", borderRadius: "3px", cursor: "pointer" }}>✕</button>
                  </td>
                </tr>
              )
            })}
          </tbody>
          <tfoot>
            <tr style={{ background: "#f5f5f5" }}>
              <td colSpan="4" style={{ textAlign: "right", fontSize: "11px" }}>Kopā bez PVN:</td>
              <td style={{ textAlign: "right", fontWeight: "bold" }}>{filtretoStats.bezPvn.toFixed(2)}</td>
              <td colSpan="3" />
            </tr>
            <tr style={{ background: "#f5f5f5" }}>
              <td colSpan="4" style={{ textAlign: "right", fontSize: "11px", color: "#c62828" }}>Kopā PVN:</td>
              <td />
              <td style={{ textAlign: "right", fontWeight: "bold", color: "#c62828" }}>{filtretoStats.pvnSumma.toFixed(2)}</td>
              <td colSpan="2" />
            </tr>
            <tr style={{ background: "#fff0e8" }}>
              <td colSpan="4" style={{ textAlign: "right", fontWeight: "bold" }}>Kopā apmaksai:</td>
              <td colSpan="2" />
              <td style={{ textAlign: "right", fontWeight: "bold", color: "#e65100", fontSize: "13px" }}>{filtretoStats.kopa.toFixed(2)} €</td>
              <td />
            </tr>
          </tfoot>
        </table>
      }
    </div>
  )
}

export default App