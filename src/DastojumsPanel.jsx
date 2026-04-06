import React, { useState, useEffect } from "react"
import { calcDastojums, calcH } from "./dastojumsEngine"

const SUGAS = ["P","E","B","A","Ba","Bl","M","Oz","Os","G"]
const D_KLASES = [8,12,16,20,24,28,32,36,40,44,48,52,56,60,64,68]
const DEFAULT_CENAS = {log:93,small:65,veneer:130,tara:48,pulp:50,fire:38,chips:15}
const CENU_NOSAUKUMI = {log:"Zāģbaļķi",small:"Sīkbaļķi",veneer:"Finieris",tara:"Tara",pulp:"Papīrmalka",fire:"Malka",chips:"Šķelda"}

function tuksiMerijumi(){
  return D_KLASES.map(d=>({d,resni:0,videj:0,tiev:0,malka:0}))
}

export default function DastojumsPanel({kadastrs, saimnieciba, onClose, user, onReg}){
  const [stavi, setStavi] = useState([{suga:"P",hVid:0,merijumi:tuksiMerijumi()}])
  const [rezultati, setRezultati] = useState(null)
  const [cenas, setCenas] = useState(DEFAULT_CENAS)
  const [showCenas, setShowCenas] = useState(false)
  const [eko, setEko] = useState(SUGAS.map(s=>({suga:s,skaits:0,d:0})))

  const pievienotStavu = () => setStavi([...stavi,{suga:"E",hVid:0,merijumi:tuksiMerijumi()}])
  const dzestStavu = (i) => setStavi(stavi.filter((_,j)=>j!==i))

  const updateStavs = (i, field, val) => {
    const n=[...stavi]; n[i]={...n[i],[field]:val}; setStavi(n)
  }

  const updateEko = (si, field, val) => {
    const n=[...eko]; n[si]={...n[si],[field]:Math.max(0,Number(val)||0)}; setEko(n)
  }

  const updateMerijums = (si, di, field, val) => {
    const n=[...stavi]
    n[si].merijumi[di]={...n[si].merijumi[di],[field]:Math.max(0,Number(val)||0)}
    setStavi(n)
  }

  const calcEkoRez = () => {
    return eko
      .filter(r=>r.skaits>0 && r.d>0)
      .map(r=>{
        const hVid = stavi.find(s=>s.suga===r.suga)?.hVid || 20
        const h = calcH(r.d, hVid, r.suga)
        const vol = r.skaits * Math.PI * Math.pow(r.d/200,2) * h * 0.47
        const vertiba = vol * ((cenas.log+cenas.tara)/2)
        return {...r, h, vol, vertiba}
      })
  }

  const apreklinat = () => {
    const rez = stavi.map(s=>calcDastojums(s, cenas))
    setRezultati(rez)
  }

  const ekoRez = rezultati ? calcEkoRez() : []

  React.useEffect(()=>{
    if(rezultati) {
      const rez = stavi.map(s=>calcDastojums(s, cenas))
      setRezultati(rez)
    }
  },[cenas])

  const exportPDF = () => {
    if(!rezultati) return
    const today = new Date().toLocaleDateString("lv-LV")
    const kopaKraja = rezultati.reduce((s,r)=>s+r.kopaKraja,0)
    const kopaVertiba = rezultati.reduce((s,r)=>s+r.vertiba,0)

    const tabulas = rezultati.map(r=>{
      const rindas = r.rindas.map(row=>`<tr>
        <td>${row.d}</td><td>${row.h.toFixed(1)}</td><td>${row.skaits}</td>
        <td>${row.kraja.toFixed(3)}</td>
        <td>${(row.sorts.log||0).toFixed(3)}</td>
        <td>${(row.sorts.small||0).toFixed(3)}</td>
        <td>${(row.sorts.veneer||0).toFixed(3)}</td>
        <td>${(row.sorts.tara||0).toFixed(3)}</td>
        <td>${(row.sorts.pulp||0).toFixed(3)}</td>
        <td>${(row.sorts.fire||0).toFixed(3)}</td>
        <td>${(row.sorts.chips||0).toFixed(3)}</td>
      </tr>`).join("")
      return `<h3>${r.suga} — vidējais augstums ${r.hVid}m</h3>
      <table border="1" cellpadding="3" style="font-size:9px;border-collapse:collapse;width:100%">
      <thead style="background:#225522;color:white"><tr>
        <th>d (cm)</th><th>h (m)</th><th>Skaits</th><th>Krāja m³</th>
        <th>Zāģb.</th><th>Sīkb.</th><th>Finieris</th><th>Tara</th>
        <th>Papīrm.</th><th>Malka</th><th>Šķelda</th>
      </tr></thead><tbody>${rindas}</tbody>
      <tfoot><tr style="background:#e8f5e9;font-weight:bold">
        <td colspan="3">Kopā</td>
        <td>${r.kopaKraja.toFixed(3)}</td>
        <td>${(r.sortTotals.log||0).toFixed(3)}</td>
        <td>${(r.sortTotals.small||0).toFixed(3)}</td>
        <td>${(r.sortTotals.veneer||0).toFixed(3)}</td>
        <td>${(r.sortTotals.tara||0).toFixed(3)}</td>
        <td>${(r.sortTotals.pulp||0).toFixed(3)}</td>
        <td>${(r.sortTotals.fire||0).toFixed(3)}</td>
        <td>${(r.sortTotals.chips||0).toFixed(3)}</td>
      </tr></tfoot></table>`
    }).join("")

    const html=`<html><head><meta charset="UTF-8"><style>
body{font-family:Arial;font-size:11px;padding:20px;max-width:1000px;margin:0 auto}
h2{text-align:center;color:#225522}h3{color:#225522;margin-top:16px}
table{border-collapse:collapse;width:100%;margin-bottom:12px}
th{background:#225522;color:white;padding:3px 5px;font-size:9px}
td{border:1px solid #ccc;padding:2px 5px;font-size:9px}
</style></head><body>
<h2>CIRSMAS NOVĒRTĒJUMS — DASTOJUMS</h2>
<p><b>Saimniecība:</b> ${saimnieciba||"—"} | <b>Kadastrs:</b> ${kadastrs||"—"} | <b>Datums:</b> ${today}</p>
${tabulas}
<div style="margin-top:16px;padding:12px;background:#f0f8f0;border:1px solid #225522;border-radius:4px">
<b>Kopējā cirsmas krāja: ${kopaKraja.toFixed(2)} m³</b><br/>
<b>Likvīdā krāja: ${rezultati.reduce((s,r)=>s+r.likvida,0).toFixed(2)} m³</b><br/>
<b>Atliekas: ${rezultati.reduce((s,r)=>s+r.atlikasVol,0).toFixed(2)} m³</b><br/>
<hr style="border:none;border-top:1px solid #ccc;margin:8px 0"/>
<b>Cirsmas vērtība (bez šķeldas): ${(kopaVertiba - rezultati.reduce((s,r)=>s+(r.sortTotals.chips||0)*15,0)).toFixed(0)} €</b><br/>
<span style="color:#666">Šķeldas vērtība: ${rezultati.reduce((s,r)=>s+(r.sortTotals.chips||0)*15,0).toFixed(0)} €</span><br/>
<b style="font-size:13px">Kopējā vērtība: ${kopaVertiba.toFixed(0)} €</b>
</div>
${ekoRez.length>0?`
<div style="margin-top:12px;padding:12px;background:#fdf6f0;border:1px solid #6a4c2a;border-radius:4px">
<b style="color:#6a4c2a">🌳 Ekoloģiskie koki</b>
<table border="1" cellpadding="3" style="font-size:9px;border-collapse:collapse;width:100%;margin-top:6px">
<thead style="background:#6a4c2a;color:white"><tr>
<th>Suga</th><th>Skaits</th><th>d (cm)</th><th>h (m)</th><th>m³</th><th>Apt. vērtība</th>
</tr></thead><tbody>
${ekoRez.map(r=>`<tr>
<td>${r.suga}</td><td>${r.skaits}</td><td>${r.d}</td>
<td>${r.h.toFixed(1)}</td><td>${r.vol.toFixed(3)}</td><td>${r.vertiba.toFixed(0)} €</td>
</tr>`).join("")}
</tbody>
<tfoot><tr style="background:#f0e8e0;font-weight:bold">
<td colspan="3">Kopā</td><td>—</td>
<td>${ekoRez.reduce((s,r)=>s+r.vol,0).toFixed(3)}</td>
<td>${ekoRez.reduce((s,r)=>s+r.vertiba,0).toFixed(0)} €</td>
</tr></tfoot></table>
<p style="font-size:8px;color:#6a4c2a">* Ekoloģisko koku vērtība nav ieskaitīta cirsmas kopējā vērtībā</p>
</div>`:""}
<div style="display:flex;justify-content:space-between;margin-top:30px;font-size:10px">
<div>Uzmērīja: ___________________________</div>
<div>Novērtēja: ___________________________</div>
</div>
<p style="font-size:8px;color:#888;margin-top:12px">* Aprēķini veikti pēc Curtis augstuma regresijas un sugas formas faktoriem</p>
</body></html>`
    const win=window.open("","_blank")
    win.document.write(html)
    win.document.close()
    win.print()
  }

  return(
  <div style={{padding:"20px",fontFamily:"Arial",maxWidth:"1100px"}}>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"16px"}}>
      <h2 style={{color:"#225522",margin:0}}>🌲 Dastojuma aprēķins</h2>
      {onClose && <button onClick={onClose} style={{padding:"4px 12px",background:"#888",color:"white",border:"none",borderRadius:"4px",cursor:"pointer"}}>✕ Aizvērt</button>}
    </div>

    {stavi.map((stavs,si)=>(
    <div key={si} style={{border:"2px solid #225522",borderRadius:"8px",padding:"16px",marginBottom:"16px",background:"white"}}>
      <div style={{display:"flex",gap:"16px",alignItems:"center",marginBottom:"12px",flexWrap:"wrap"}}>
        <b style={{color:"#225522"}}>{stavs.suga}</b>
        <div>
          <label style={{fontSize:"11px",fontWeight:"bold"}}>Suga:</label><br/>
          <select value={stavs.suga} onChange={e=>updateStavs(si,"suga",e.target.value)} style={{padding:"4px",border:"1px solid #ccc",borderRadius:"3px"}}>
            {SUGAS.map(s=><option key={s}>{s}</option>)}
          </select>
        </div>
        <div>
          <label style={{fontSize:"11px",fontWeight:"bold"}}>Vidējais augstums (m):</label><br/>
          <input type="number" step="0.5" value={stavs.hVid||""} onChange={e=>updateStavs(si,"hVid",parseFloat(e.target.value)||0)} style={{width:"70px",padding:"4px",border:"1px solid #ccc",borderRadius:"3px"}}/>
        </div>
        {stavi.length>1 && <button onClick={()=>dzestStavu(si)} style={{padding:"4px 10px",background:"#c62828",color:"white",border:"none",borderRadius:"4px",cursor:"pointer",fontSize:"11px"}}>🗑 Dzēst stāvu</button>}
      </div>

      <div style={{overflowX:"auto"}}>
        <table border="1" cellPadding="4" style={{fontSize:"11px",minWidth:"600px"}}>
          <thead style={{background:"#225522",color:"white"}}>
            <tr>
              <th>d (cm)</th>
              <th>h (m)</th>
              <th>Resns</th>
              <th>Vidējs</th>
              <th>Tievs</th>
              <th>Malka</th>
              <th>Kopā</th>
            </tr>
          </thead>
          <tbody>
            {stavs.merijumi.map((row,di)=>{
              const h = stavs.hVid>0 ? calcH(row.d, stavs.hVid, stavs.suga) : 0
              const kopa = row.resni+row.videj+row.tiev+row.malka
              return(
              <tr key={di} style={{background:di%2===0?"white":"#f9f9f9"}}>
                <td style={{fontWeight:"bold",textAlign:"center"}}>{row.d}</td>
                <td style={{textAlign:"center",color:"#666"}}>{h>0?h.toFixed(1):"—"}</td>
                {["resni","videj","tiev","malka"].map(k=>(
                  <td key={k}>
                    <input type="number" min="0" value={row[k]||""} 
                      onChange={e=>updateMerijums(si,di,k,e.target.value)}
                      style={{width:"55px",border:"none",textAlign:"center",background:"transparent"}}/>
                  </td>
                ))}
                <td style={{textAlign:"center",fontWeight:"bold",color:kopa>0?"#225522":"#ccc"}}>{kopa||"—"}</td>
              </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
    ))}

    <div style={{border:"2px solid #6a4c2a",borderRadius:"8px",padding:"16px",marginBottom:"16px",background:"white"}}>
      <b style={{color:"#6a4c2a"}}>🌳 Ekoloģiskie koki</b>
      <div style={{overflowX:"auto",marginTop:"10px"}}>
        <table border="1" cellPadding="4" style={{fontSize:"11px",minWidth:"500px"}}>
          <thead style={{background:"#6a4c2a",color:"white"}}>
            <tr><th>Suga</th><th>Skaits</th><th>d (cm)</th><th>h (m)</th><th>m³</th></tr>
          </thead>
          <tbody>
            {eko.map((row,i)=>{
              const hVid = stavi.find(s=>s.suga===row.suga)?.hVid||20
              const h = row.d>0 ? calcH(row.d,hVid,row.suga) : 0
              const vol = row.d>0&&row.skaits>0 ? row.skaits*Math.PI*Math.pow(row.d/200,2)*h*0.47 : 0
              return(
              <tr key={i} style={{background:i%2===0?"white":"#fdf6f0"}}>
                <td style={{fontWeight:"bold",textAlign:"center"}}>{row.suga}</td>
                <td><input type="number" min="0" value={row.skaits||""} onChange={e=>updateEko(i,"skaits",e.target.value)} style={{width:"55px",border:"none",textAlign:"center",background:"transparent"}}/></td>
                <td><input type="number" min="0" value={row.d||""} onChange={e=>updateEko(i,"d",e.target.value)} style={{width:"55px",border:"none",textAlign:"center",background:"transparent"}}/></td>
                <td style={{textAlign:"center",color:"#666"}}>{h>0?h.toFixed(1):"—"}</td>
                <td style={{textAlign:"center",fontWeight:"bold",color:vol>0?"#6a4c2a":"#ccc"}}>{vol>0?vol.toFixed(3):"—"}</td>
              </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>

    <div style={{background:"#f0f6ec",border:"1px solid #225522",borderRadius:"6px",padding:"12px",marginBottom:"16px"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"8px"}}>
        <b style={{color:"#225522"}}>💶 Sortimentu cenas (€/m³)</b>
        <button onClick={()=>setShowCenas(!showCenas)} style={{padding:"3px 10px",background:"#225522",color:"white",border:"none",borderRadius:"4px",cursor:"pointer",fontSize:"11px"}}>
          {showCenas?"Paslēpt":"Rediģēt"}
        </button>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:"8px",fontSize:"12px"}}>
        {Object.keys(cenas).map(k=>(
          <div key={k}>
            <label style={{fontSize:"10px",color:"#666"}}>{CENU_NOSAUKUMI[k]}:</label><br/>
            {showCenas
              ? <input type="number" value={cenas[k]} onChange={e=>setCenas({...cenas,[k]:Number(e.target.value)})} style={{width:"70px",padding:"3px",border:"1px solid #ccc",borderRadius:"3px",fontSize:"12px"}}/>
              : <b>{cenas[k]} €</b>
            }
          </div>
        ))}
      </div>
    </div>

    <div style={{display:"flex",gap:"8px",marginBottom:"16px",flexWrap:"wrap"}}>
      <button onClick={pievienotStavu} style={{padding:"6px 14px",background:"#1565c0",color:"white",border:"none",borderRadius:"4px",cursor:"pointer"}}>+ Pievienot sugu</button>
      <button onClick={apreklinat} style={{padding:"6px 20px",background:"#225522",color:"white",border:"none",borderRadius:"4px",cursor:"pointer",fontWeight:"bold"}}>📊 Aprēķināt</button>
      {rezultati && (
  user
    ? <button onClick={exportPDF} style={{padding:"6px 20px",background:"#e65100",color:"white",border:"none",borderRadius:"4px",cursor:"pointer"}}>🖨 Drukāt PDF</button>
    : <button onClick={()=>setShowReg(true)} style={{padding:"6px 20px",background:"#888",color:"white",border:"none",borderRadius:"4px",cursor:"pointer"}}>🔒 Reģistrējies lai drukātu PDF</button>
)}
    </div>

    {rezultati && (
    <div style={{border:"2px solid #388e3c",borderRadius:"8px",padding:"16px",background:"#f0f8f0"}}>
      <h3 style={{color:"#225522",marginTop:0}}>📊 Rezultāti</h3>
      {rezultati.map((r,i)=>(
      <div key={i} style={{marginBottom:"16px"}}>
        <b>{r.suga} — {r.kopaSkaits} koki, krāja: {r.kopaKraja.toFixed(2)} m³</b>
        <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:"8px",marginTop:"8px",fontSize:"12px"}}>
          <div><b>Kopējā krāja:</b><br/>{r.kopaKraja.toFixed(2)} m³</div>
          <div><b>Atliekas ({Math.round(r.atlikas*100)}%):</b><br/>{r.atlikasVol.toFixed(2)} m³</div>
          <div><b>Likvīdā krāja:</b><br/>{r.likvida.toFixed(2)} m³</div>
          <div><b>Vērtība:</b><br/>{r.vertiba.toFixed(0)} €</div>
        </div>
      </div>
      ))}
      <div style={{padding:"12px",background:"white",borderRadius:"6px",border:"1px solid #225522",marginTop:"8px"}}>
        <b>Kopējā krāja: {rezultati.reduce((s,r)=>s+r.kopaKraja,0).toFixed(2)} m³</b><br/>
        <b style={{color:"#225522",fontSize:"16px"}}>Kopējā vērtība: {rezultati.reduce((s,r)=>s+r.vertiba,0).toFixed(0)} €</b>
      </div>
      {ekoRez.length>0 && (
      <div style={{padding:"12px",background:"#fdf6f0",borderRadius:"6px",border:"1px solid #6a4c2a",marginTop:"8px"}}>
        <b style={{color:"#6a4c2a"}}>🌳 Ekoloģiskie koki</b>
        <table style={{width:"100%",fontSize:"11px",marginTop:"8px",borderCollapse:"collapse"}}>
          <thead><tr style={{background:"#6a4c2a",color:"white"}}>
            <th style={{padding:"3px"}}>Suga</th><th>Skaits</th><th>d (cm)</th><th>h (m)</th><th>m³</th><th>Apt. vērtība</th>
          </tr></thead>
          <tbody>
            {ekoRez.map((r,i)=>(
            <tr key={i} style={{background:i%2===0?"white":"#fdf6f0",textAlign:"center"}}>
              <td style={{fontWeight:"bold"}}>{r.suga}</td>
              <td>{r.skaits}</td>
              <td>{r.d}</td>
              <td>{r.h.toFixed(1)}</td>
              <td>{r.vol.toFixed(3)}</td>
              <td>{r.vertiba.toFixed(0)} €</td>
            </tr>
            ))}
          </tbody>
          <tfoot><tr style={{background:"#f0e8e0",fontWeight:"bold",textAlign:"center"}}>
            <td colSpan="3">Kopā</td>
            <td>—</td>
            <td>{ekoRez.reduce((s,r)=>s+r.vol,0).toFixed(3)}</td>
            <td>{ekoRez.reduce((s,r)=>s+r.vertiba,0).toFixed(0)} €</td>
          </tr></tfoot>
        </table>
        <div style={{marginTop:"8px",fontSize:"11px",color:"#6a4c2a"}}>
          * Ekoloģisko koku vērtība <b>nav ieskaitīta</b> cirsmas kopējā vērtībā
        </div>
      </div>
      )}
    </div>
    )}
  </div>
  )
}