import React, { useState } from "react"
import { getBonitate } from "./bonityEngine"
import { minDiameter, getVeidaugstums } from "./tables"
import { calcSortimentsByQuality } from "./qualityEngine"

export const getKlienti = () => { try { return JSON.parse(localStorage.getItem("rekins_klienti") || "[]") } catch { return [] } }
export const saveKlients = (klients) => { if (!klients.nosaukums) return; const esosie = getKlienti(); const jauIndex = esosie.findIndex(k => k.nosaukums === klients.nosaukums); if (jauIndex !== -1) { esosie[jauIndex] = { ...esosie[jauIndex], ...klients }; localStorage.setItem("rekins_klienti", JSON.stringify(esosie)) } else { localStorage.setItem("rekins_klienti", JSON.stringify([klients, ...esosie])) } }

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
    const vh = getVeidaugstums(Number(h), suga)
    return merijumi.reduce((sum, r) => {
      if(!r.n) return sum
      const d = r.d / 100
      const vol = Math.PI * (d/2)**2 * vh * r.n
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
    <div style={{marginTop:"24px",padding:"20px",border:"2px solid #4caf50",borderRadius:"10px",background:"#141f14",color:"#e8f5e9"}}>
      <h2 style={{color:"#4caf50",marginTop:0}}>📏 Caurmēra mērījumi</h2>

      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:"8px",marginBottom:"16px"}}>
        <div>
          <label style={{fontSize:"11px",fontWeight:"bold",color:"#81c784"}}>Valdošā suga:</label><br/>
          <select value={suga} onChange={e=>{setSuga(e.target.value);saglabat({suga:e.target.value})}} style={{width:"100%",padding:"6px",border:"1px solid #2d5a2d",borderRadius:"4px",background:"#0f1a0f",color:"#e8f5e9"}}>
            <option>P</option><option>E</option><option>B</option>
          </select>
        </div>
        <div>
          <label style={{fontSize:"11px",fontWeight:"bold",color:"#81c784"}}>Vecums (gadi):</label><br/>
          <input type="number" value={vecums} onChange={e=>{setVecums(e.target.value);saglabat({vecums:e.target.value})}} style={{width:"100%",padding:"6px",border:"1px solid #2d5a2d",borderRadius:"4px",background:"#0f1a0f",color:"#e8f5e9"}}/>
        </div>
        <div>
          <label style={{fontSize:"11px",fontWeight:"bold",color:"#81c784"}}>Vidējais augstums (m):</label><br/>
          <input type="number" value={h} onChange={e=>{setH(e.target.value);saglabat({h:e.target.value})}} style={{width:"100%",padding:"6px",border:"1px solid #2d5a2d",borderRadius:"4px",background:"#0f1a0f",color:"#e8f5e9"}}/>
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
       <div style={{display:"flex",gap:"6px",alignItems:"center",background:"#0f2b0f",padding:"6px 10px",borderRadius:"6px",border:"1px solid #2d5a2d"}}>
          <span style={{fontSize:"11px",fontWeight:"bold",color:"#81c784"}}>Manuāli:</span>
          <input type="number" value={jaunsD} onChange={e=>setJaunsD(e.target.value)} placeholder="d (cm)" style={{width:"60px",padding:"4px",border:"1px solid #2d5a2d",borderRadius:"3px",fontSize:"12px",background:"#0f1a0f",color:"#e8f5e9"}}/>
          <input type="number" value={jaunsN} onChange={e=>setJaunsN(e.target.value)} placeholder="skaits" style={{width:"55px",padding:"4px",border:"1px solid #2d5a2d",borderRadius:"3px",fontSize:"12px",background:"#0f1a0f",color:"#e8f5e9"}}/>
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
              <tr key={i} style={{background:i%2===0?"#0f1a0f":"#141f14",color:"#e8f5e9"}}>
                <td>{i+1}.</td>
                <td>{r.d}</td>
                <td>
                  <input type="number" value={r.n||""} onChange={e=>updateN(i,e.target.value)}
                    style={{width:"60px",border:"1px solid #2d5a2d",borderRadius:"3px",padding:"2px",background:"#0f2b0f",color:"#e8f5e9"}}/>
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

export default CaurmeraPanel
