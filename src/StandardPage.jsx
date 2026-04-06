import React, { useState, useRef } from "react"
import * as pdfjsLib from "pdfjs-dist"
import { forestEngine } from "./forestEngine"

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
"pdfjs-dist/build/pdf.worker.min.mjs",
import.meta.url
).toString()

function JaunaudžuParskats({jaunaudzes, rows, kadastrs, saimnieciba, papilduNogabali, setPapilduNogabali, onClose}){
const [virsmezn, setVirsmezn] = useState("")
const [mezn, setMezn] = useState("")
const [vards, setVards] = useState(()=>localStorage.getItem("parskats_vards")||"")
const [personas, setPersonas] = useState(()=>localStorage.getItem("parskats_personas")||"")
const [adrese, setAdrese] = useState(()=>localStorage.getItem("parskats_adrese")||"")
const [talrunis, setTalrunis] = useState(()=>localStorage.getItem("parskats_talrunis")||"")
const [adminTerit, setAdminTerit] = useState(()=>localStorage.getItem("parskats_adminTerit")||"")
const [gads, setGads] = useState(new Date().getFullYear())
const [showPievienot, setShowPievienot] = useState(false)

const saglabatLoc = (key, val) => localStorage.setItem(key, val)

const visiNogabali = [...jaunaudzes, ...papilduNogabali]

const exportParskats = () => {
  const today = new Date().toLocaleDateString("lv-LV")
  const tabula = visiNogabali.map(ja=>`<tr>
    <td>${kadastrs||"—"}</td>
    <td>—</td>
    <td>${ja.nog}</td>
    <td>${ja.platiba}</td>
    <td>${ja.formula||"—"}</td>
    <td>${ja.h||"—"}</td>
    <td>${ja.koki||"—"}</td>
    <td>${ja.atzarošana||""}</td>
    <td>${ja.atzarošana||""}</td>
    <td></td>
  </tr>`).join("")

  const html=`<html><head><meta charset="UTF-8">
<style>
body{font-family:"Times New Roman",serif;font-size:11px;padding:20px;max-width:900px;margin:0 auto}
h2{text-align:center;font-size:13px;font-weight:bold}
p{margin:4px 0}
table{border-collapse:collapse;width:100%;margin:12px 0;font-size:9px}
th{border:1px solid black;padding:3px 4px;text-align:center;font-weight:bold}
td{border:1px solid black;padding:3px 4px}
.sign{display:flex;justify-content:space-between;margin-top:20px}
</style></head><body>
<p style="text-align:right">Valsts meža dienesta</p>
<p style="text-align:right"><b>${virsmezn||"_______________"} virsmežniecībai</b></p>
<p style="text-align:right">${mezn||"_______________"} mežniecībai</p>
<br/>
<h2>Pārskats ${gads}. gadā par darbībām meža zemēs, kurām nav nepieciešams apliecinājums</h2>
<p style="text-align:center;font-size:9px">Pārskata saņemšanas datums: ____________</p>
<br/>
<table style="width:100%;border:none;font-size:11px">
<tr><td style="border:none;width:50%"><b>Īpašnieks:</b> ${vards||"___________________"}</td><td style="border:none"><b>Personas kods:</b> ${personas||"___________________"}</td></tr>
<tr><td style="border:none"><b>Adrese:</b> ${adrese||"___________________"}</td><td style="border:none"><b>Tālrunis:</b> ${talrunis||"___________________"}</td></tr>
<tr><td style="border:none"><b>Īpašuma nosaukums:</b> ${saimnieciba||"___________________"}</td><td style="border:none"><b>Administratīvā teritorija:</b> ${adminTerit||"___________________"}</td></tr>
</table>
<br/>
<p>Apliecinu, ka esmu ${gads}. gadā veicis šādas darbības savā īpašumā vai tiesiskajā valdījumā:</p>
<p><b>Darbības veids – jaunaudžu kopšana</b></p>
<table>
<thead><tr>
<th>Zemes vienības kadastra apzīmējums</th>
<th>Kvartāla Nr.</th>
<th>Nogabala Nr.</th>
<th>Izkoptā platība, ha</th>
<th>Valdošā koku suga</th>
<th>Vidējais koku augstums, m</th>
<th>Vidējais koku skaits, gab/ha</th>
<th>Ja veikta atzarošana — atzarotā platība, ha</th>
<th>Ja veikta atzarošana — atzarotā koku suga</th>
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
  const win = window.open("","_blank")
  win.document.write(html)
  win.document.close()
  win.print()
}

return(
<div style={{marginTop:"24px",padding:"20px",border:"2px solid #388e3c",borderRadius:"8px",background:"white",marginBottom:"24px"}}>
  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"16px"}}>
    <h2 style={{color:"#388e3c",margin:0}}>📋 Jaunaudžu kopšanas pārskats</h2>
    <button onClick={onClose} style={{padding:"4px 12px",background:"#888",color:"white",border:"none",borderRadius:"4px",cursor:"pointer"}}>✕ Aizvērt</button>
  </div>
  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"12px",marginBottom:"16px"}}>
    <div><label style={{fontSize:"11px",fontWeight:"bold"}}>Virsmežniecība:</label><br/>
    <input value={virsmezn} onChange={e=>setVirsmezn(e.target.value)} style={{width:"100%",padding:"4px",border:"1px solid #ccc",borderRadius:"3px"}}/></div>
    <div><label style={{fontSize:"11px",fontWeight:"bold"}}>Mežniecība:</label><br/>
    <input value={mezn} onChange={e=>setMezn(e.target.value)} style={{width:"100%",padding:"4px",border:"1px solid #ccc",borderRadius:"3px"}}/></div>
    <div><label style={{fontSize:"11px",fontWeight:"bold"}}>Vārds, uzvārds:</label><br/>
    <input value={vards} onChange={e=>{setVards(e.target.value);saglabatLoc("parskats_vards",e.target.value)}} style={{width:"100%",padding:"4px",border:"1px solid #ccc",borderRadius:"3px"}}/></div>
    <div><label style={{fontSize:"11px",fontWeight:"bold"}}>Personas kods:</label><br/>
    <input value={personas} onChange={e=>{setPersonas(e.target.value);saglabatLoc("parskats_personas",e.target.value)}} style={{width:"100%",padding:"4px",border:"1px solid #ccc",borderRadius:"3px"}}/></div>
    <div><label style={{fontSize:"11px",fontWeight:"bold"}}>Adrese:</label><br/>
    <input value={adrese} onChange={e=>{setAdrese(e.target.value);saglabatLoc("parskats_adrese",e.target.value)}} style={{width:"100%",padding:"4px",border:"1px solid #ccc",borderRadius:"3px"}}/></div>
    <div><label style={{fontSize:"11px",fontWeight:"bold"}}>Tālrunis:</label><br/>
    <input value={talrunis} onChange={e=>{setTalrunis(e.target.value);saglabatLoc("parskats_talrunis",e.target.value)}} style={{width:"100%",padding:"4px",border:"1px solid #ccc",borderRadius:"3px"}}/></div>
    <div><label style={{fontSize:"11px",fontWeight:"bold"}}>Administratīvā teritorija:</label><br/>
    <input value={adminTerit} onChange={e=>{setAdminTerit(e.target.value);saglabatLoc("parskats_adminTerit",e.target.value)}} style={{width:"100%",padding:"4px",border:"1px solid #ccc",borderRadius:"3px"}}/></div>
    <div><label style={{fontSize:"11px",fontWeight:"bold"}}>Pārskata gads:</label><br/>
    <input type="number" value={gads} onChange={e=>setGads(Number(e.target.value))} style={{width:"100%",padding:"4px",border:"1px solid #ccc",borderRadius:"3px"}}/></div>
  </div>

  <div style={{marginBottom:"16px"}}>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"8px"}}>
      <b style={{fontSize:"13px"}}>Nogabali pārskatā ({visiNogabali.length})</b>
      <button onClick={()=>setShowPievienot(!showPievienot)} style={{padding:"4px 12px",background:"#1565c0",color:"white",border:"none",borderRadius:"4px",cursor:"pointer",fontSize:"12px"}}>
        + Pievienot nogabalu
      </button>
    </div>
    {showPievienot && (
    <div style={{background:"#f0f6ec",border:"1px solid #388e3c",borderRadius:"6px",padding:"12px",marginBottom:"12px"}}>
      <b style={{fontSize:"12px",color:"#225522"}}>Izvēlies nogabalus no īpašuma:</b>
      <div style={{maxHeight:"200px",overflowY:"auto",marginTop:"8px"}}>
        {rows.filter(r=>!jaunaudzes.find(ja=>ja.nog===r.nog)&&!papilduNogabali.find(p=>p.nog===r.nog)).map((r,i)=>(
          <div key={i} style={{display:"flex",alignItems:"center",gap:"8px",padding:"4px 0",borderBottom:"1px solid #ddd"}}>
            <input type="checkbox" onChange={e=>{
              if(e.target.checked) setPapilduNogabali([...papilduNogabali,{nog:r.nog,platiba:r.platiba,tips:r.tips,formula:r.formula,h:r.h,koki:r.koki}])
              else setPapilduNogabali(papilduNogabali.filter(p=>p.nog!==r.nog))
            }}/>
            <span style={{fontSize:"12px"}}>Nog. {r.nog} — {r.platiba} ha — {r.tips} — {r.formula}</span>
          </div>
        ))}
      </div>
    </div>
    )}
    <table border="1" cellPadding="4" style={{fontSize:"11px",width:"100%"}}>
      <thead style={{background:"#388e3c",color:"white"}}>
        <tr><th>Nog</th><th>Platība</th><th>Tips</th><th>Audzes sastāvs</th><th>H (m)</th><th>Koki/ha</th><th>Piezīmes</th></tr>
      </thead>
      <tbody>
        {visiNogabali.map((ja,i)=>(
          <tr key={i}>
            <td>{ja.nog}</td>
            <td><input type="number" step="0.01" value={ja.platiba||""} onChange={e=>{
              const isPapildu = i >= jaunaudzes.length
              if(isPapildu){const n=[...papilduNogabali];n[i-jaunaudzes.length]={...n[i-jaunaudzes.length],platiba:parseFloat(e.target.value)||0};setPapilduNogabali(n)}
            }} style={{width:"55px",border:"1px solid #ccc",borderRadius:"3px",padding:"2px"}}/></td>
            <td>{ja.tips}</td>
            <td><input value={ja.formula||""} onChange={e=>{
              const isPapildu = i >= jaunaudzes.length
              if(isPapildu){const n=[...papilduNogabali];n[i-jaunaudzes.length]={...n[i-jaunaudzes.length],formula:e.target.value};setPapilduNogabali(n)}
              else{const n=[...jaunaudzes];n[i]={...n[i],formula:e.target.value};setJaunaudzes && setJaunaudzes(n)}
            }} style={{width:"60px",border:"1px solid #ccc",borderRadius:"3px",padding:"2px"}}/></td>
            <td>{ja.h||"—"}</td>
            <td><input type="number" value={ja.koki||""} onChange={e=>{
              const isPapildu = i >= jaunaudzes.length
              if(isPapildu){const n=[...papilduNogabali];n[i-jaunaudzes.length]={...n[i-jaunaudzes.length],koki:Number(e.target.value)};setPapilduNogabali(n)}
              else{const n=[...jaunaudzes];n[i]={...n[i],koki:Number(e.target.value)};setJaunaudzes && setJaunaudzes(n)}
            }} style={{width:"55px",border:"1px solid #ccc",borderRadius:"3px",padding:"2px"}}/></td>
            <td><input value={ja.piezimes||""} onChange={e=>{
              const isPapildu = i >= jaunaudzes.length
              if(isPapildu){const n=[...papilduNogabali];n[i-jaunaudzes.length]={...n[i-jaunaudzes.length],piezimes:e.target.value};setPapilduNogabali(n)}
            }} style={{width:"80px",border:"1px solid #ccc",borderRadius:"3px",padding:"2px"}}/></td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>

  <button onClick={exportParskats} style={{padding:"8px 24px",background:"#388e3c",color:"white",border:"none",borderRadius:"4px",cursor:"pointer",fontSize:"13px"}}>
    🖨 Drukāt / Saglabāt PDF
  </button>
</div>
)
}

function IeaudzesanaParskats({izcirtumi, kadastrs, saimnieciba, onClose}){
const [virsmezn, setVirsmezn] = useState("")
const [mezn, setMezn] = useState("")
const [vards, setVards] = useState(()=>localStorage.getItem("parskats_vards")||"")
const [personas, setPersonas] = useState(()=>localStorage.getItem("parskats_personas")||"")
const [adrese, setAdrese] = useState(()=>localStorage.getItem("parskats_adrese")||"")
const [talrunis, setTalrunis] = useState(()=>localStorage.getItem("parskats_talrunis")||"")
const [adminTerit, setAdminTerit] = useState(()=>localStorage.getItem("parskats_adminTerit")||"")
const [gads, setGads] = useState(new Date().getFullYear())

const saglabatLoc = (key, val) => localStorage.setItem(key, val)

const stadoNogabali = izcirtumi.filter(ic=>ic.atjVeids==="Stādot"&&ic.formula&&ic.h>0&&ic.koki>0)

const exportParskats = () => {
  const today = new Date().toLocaleDateString("lv-LV")
  const tabula = stadoNogabali.map(ic=>`<tr>
    <td>${kadastrs||"—"}</td>
    <td>—</td>
    <td>${ic.nog}</td>
    <td>${ic.platiba}</td>
    <td>${ic.formula||"—"}</td>
    <td>${ic.vecums||"—"}</td>
    <td>${ic.h||"—"}</td>
    <td>${ic.koki||"—"}</td>
    <td>Stādot</td>
    <td>${ic.plantacija?"P":""}</td>
    <td>${ic.mrm||"—"}</td>
    <td>${ic.piezimes||""}</td>
  </tr>`).join("")

  const html=`<html><head><meta charset="UTF-8">
<style>
body{font-family:"Times New Roman",serif;font-size:11px;padding:20px;max-width:900px;margin:0 auto}
h2{text-align:center;font-size:13px;font-weight:bold}
p{margin:4px 0}
table{border-collapse:collapse;width:100%;margin:12px 0;font-size:8px}
th{border:1px solid black;padding:3px 4px;text-align:center;font-weight:bold}
td{border:1px solid black;padding:3px 4px}
.sign{display:flex;justify-content:space-between;margin-top:20px}
</style></head><body>
<p style="text-align:right">Valsts meža dienesta</p>
<p style="text-align:right"><b>${virsmezn||"_______________"} virsmežniecībai</b></p>
<p style="text-align:right">${mezn||"_______________"} mežniecībai</p>
<br/>
<h2>Pārskats ${gads}. gadā par darbībām meža zemēs, kurām nav nepieciešams apliecinājums</h2>
<p style="text-align:center;font-size:9px">Pārskata saņemšanas datums: ____________</p>
<br/>
<table style="width:100%;border:none;font-size:11px">
<tr><td style="border:none;width:50%"><b>Īpašnieks:</b> ${vards||"___________________"}</td><td style="border:none"><b>Personas kods:</b> ${personas||"___________________"}</td></tr>
<tr><td style="border:none"><b>Adrese:</b> ${adrese||"___________________"}</td><td style="border:none"><b>Tālrunis:</b> ${talrunis||"___________________"}</td></tr>
<tr><td style="border:none"><b>Īpašuma nosaukums:</b> ${saimnieciba||"___________________"}</td><td style="border:none"><b>Administratīvā teritorija:</b> ${adminTerit||"___________________"}</td></tr>
</table>
<br/>
<p>Apliecinu, ka esmu ${gads}. gadā veicis šādas darbības savā īpašumā vai tiesiskajā valdījumā:</p>
<p><b>Darbības veids – meža ieaudzēšana</b></p>
<table>
<thead><tr>
<th>Zemes vienības kadastra apzīmējums</th>
<th>Kvartāla Nr.</th>
<th>Nogabala Nr.</th>
<th>Ieaudzētā platība, ha</th>
<th>Valdošā koku suga</th>
<th>Koku vecums dabiski ieaugušām platībām</th>
<th>Vidējais koku augstums, m</th>
<th>Vidējais koku skaits, gab/ha</th>
<th>Galvenais ieaudzēšanas veids</th>
<th>Atzīme par plantāciju mežu (P)</th>
<th>MRM sertifikāta numurs</th>
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
  const win = window.open("","_blank")
  win.document.write(html)
  win.document.close()
  win.print()
}

return(
<div style={{marginTop:"24px",padding:"20px",border:"2px solid #1565c0",borderRadius:"8px",background:"white",marginBottom:"24px"}}>
  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"16px"}}>
    <h2 style={{color:"#1565c0",margin:0}}>🌱 Ieaudzēšanas pārskats</h2>
    <button onClick={onClose} style={{padding:"4px 12px",background:"#888",color:"white",border:"none",borderRadius:"4px",cursor:"pointer"}}>✕ Aizvērt</button>
  </div>
  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"12px",marginBottom:"16px"}}>
    <div><label style={{fontSize:"11px",fontWeight:"bold"}}>Virsmežniecība:</label><br/>
    <input value={virsmezn} onChange={e=>setVirsmezn(e.target.value)} style={{width:"100%",padding:"4px",border:"1px solid #ccc",borderRadius:"3px"}}/></div>
    <div><label style={{fontSize:"11px",fontWeight:"bold"}}>Mežniecība:</label><br/>
    <input value={mezn} onChange={e=>setMezn(e.target.value)} style={{width:"100%",padding:"4px",border:"1px solid #ccc",borderRadius:"3px"}}/></div>
    <div><label style={{fontSize:"11px",fontWeight:"bold"}}>Vārds, uzvārds:</label><br/>
    <input value={vards} onChange={e=>{setVards(e.target.value);saglabatLoc("parskats_vards",e.target.value)}} style={{width:"100%",padding:"4px",border:"1px solid #ccc",borderRadius:"3px"}}/></div>
    <div><label style={{fontSize:"11px",fontWeight:"bold"}}>Personas kods:</label><br/>
    <input value={personas} onChange={e=>{setPersonas(e.target.value);saglabatLoc("parskats_personas",e.target.value)}} style={{width:"100%",padding:"4px",border:"1px solid #ccc",borderRadius:"3px"}}/></div>
    <div><label style={{fontSize:"11px",fontWeight:"bold"}}>Adrese:</label><br/>
    <input value={adrese} onChange={e=>{setAdrese(e.target.value);saglabatLoc("parskats_adrese",e.target.value)}} style={{width:"100%",padding:"4px",border:"1px solid #ccc",borderRadius:"3px"}}/></div>
    <div><label style={{fontSize:"11px",fontWeight:"bold"}}>Tālrunis:</label><br/>
    <input value={talrunis} onChange={e=>{setTalrunis(e.target.value);saglabatLoc("parskats_talrunis",e.target.value)}} style={{width:"100%",padding:"4px",border:"1px solid #ccc",borderRadius:"3px"}}/></div>
    <div><label style={{fontSize:"11px",fontWeight:"bold"}}>Administratīvā teritorija:</label><br/>
    <input value={adminTerit} onChange={e=>{setAdminTerit(e.target.value);saglabatLoc("parskats_adminTerit",e.target.value)}} style={{width:"100%",padding:"4px",border:"1px solid #ccc",borderRadius:"3px"}}/></div>
    <div><label style={{fontSize:"11px",fontWeight:"bold"}}>Pārskata gads:</label><br/>
    <input type="number" value={gads} onChange={e=>setGads(Number(e.target.value))} style={{width:"100%",padding:"4px",border:"1px solid #ccc",borderRadius:"3px"}}/></div>
  </div>

  <div style={{marginBottom:"16px"}}>
    <b style={{fontSize:"13px"}}>Nogabali pārskatā — stādīšana ({stadoNogabali.length})</b>
    <table border="1" cellPadding="4" style={{fontSize:"11px",width:"100%",marginTop:"8px"}}>
      <thead style={{background:"#1565c0",color:"white"}}>
        <tr><th>Nog</th><th>Platība</th><th>Suga</th><th>H (m)</th><th>Koki/ha</th><th>MRM sertifikāts</th><th>Plantācija</th><th>Piezīmes</th></tr>
      </thead>
      <tbody>
        {stadoNogabali.map((ic,i)=>(
          <tr key={i}>
            <td>{ic.nog}</td><td>{ic.platiba} ha</td><td>{ic.formula}</td><td>{ic.h}</td><td>{ic.koki}</td>
            <td><input value={ic.mrm||""} onChange={e=>{const n=[...izcirtumi];const idx=n.findIndex(x=>x.nog===ic.nog);if(idx>=0){n[idx]={...n[idx],mrm:e.target.value}}}} placeholder="Nr." style={{width:"80px",border:"1px solid #ccc",borderRadius:"3px",padding:"2px"}}/></td>
            <td><input type="checkbox" checked={ic.plantacija||false} onChange={e=>{const n=[...izcirtumi];const idx=n.findIndex(x=>x.nog===ic.nog);if(idx>=0){n[idx]={...n[idx],plantacija:e.target.checked}}}}/></td>
            <td><input value={ic.piezimes||""} onChange={e=>{const n=[...izcirtumi];const idx=n.findIndex(x=>x.nog===ic.nog);if(idx>=0){n[idx]={...n[idx],piezimes:e.target.value}}}} style={{width:"80px",border:"1px solid #ccc",borderRadius:"3px",padding:"2px"}}/></td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>

  <div style={{background:"#fff8e1",border:"1px solid #f9a825",borderRadius:"6px",padding:"12px",marginBottom:"16px",fontSize:"12px"}}>
    ⚠️ <b>Svarīgi!</b> Iesniedzot ieaudzēšanas pārskatu mežniecībā, var tikt pieprasīti papildu dokumenti:
    <ul style={{margin:"6px 0 0 0",paddingLeft:"20px"}}>
      <li>Stādu izcelsmes sertifikāts</li>
      <li>Silavas atzinums par stādu piemērotību</li>
      <li>Stādu iegādes rēķins / rekvizīti</li>
    </ul>
  </div>
  <button onClick={exportParskats} style={{padding:"8px 24px",background:"#1565c0",color:"white",border:"none",borderRadius:"4px",cursor:"pointer",fontSize:"13px"}}>
    🖨 Drukāt / Saglabāt PDF
  </button>
</div>
)
}

function AtjaunosanaParskats({izcirtumi, kadastrs, saimnieciba, onClose}){
const [virsmezn, setVirsmezn] = useState("")
const [mezn, setMezn] = useState("")
const [vards, setVards] = useState(()=>localStorage.getItem("parskats_vards")||"")
const [personas, setPersonas] = useState(()=>localStorage.getItem("parskats_personas")||"")
const [adrese, setAdrese] = useState(()=>localStorage.getItem("parskats_adrese")||"")
const [talrunis, setTalrunis] = useState(()=>localStorage.getItem("parskats_talrunis")||"")
const [adminTerit, setAdminTerit] = useState(()=>localStorage.getItem("parskats_adminTerit")||"")
const [gads, setGads] = useState(new Date().getFullYear())

const saglabatLoc = (key, val) => localStorage.setItem(key, val)

const exportParskats = () => {
  const today = new Date().toLocaleDateString("lv-LV")
  const tabula = izcirtumi.filter(ic=>ic.formula&&ic.h>0&&ic.koki>0).map(ic=>`<tr>
    <td>${kadastrs||"—"}</td>
    <td>—</td>
    <td>${ic.nog}</td>
    <td>${ic.platiba}</td>
    <td>${ic.formula||"—"}</td>
    <td>${ic.h||"—"}</td>
    <td>${ic.koki||"—"}</td>
    <td>${ic.atjVeids||"Dabiski atjaunojot"}</td>
    <td>—</td>
    <td></td>
  </tr>`).join("")

  const html=`<html><head><meta charset="UTF-8">
<style>
body{font-family:"Times New Roman",serif;font-size:11px;padding:20px;max-width:900px;margin:0 auto}
h2{text-align:center;font-size:13px;font-weight:bold}
p{margin:4px 0}
table{border-collapse:collapse;width:100%;margin:12px 0;font-size:9px}
th{border:1px solid black;padding:3px 4px;text-align:center;font-weight:bold}
td{border:1px solid black;padding:3px 4px}
.sign{display:flex;justify-content:space-between;margin-top:20px}
</style></head><body>
<p style="text-align:right">Valsts meža dienesta</p>
<p style="text-align:right"><b>${virsmezn||"_______________"} virsmežniecībai</b></p>
<p style="text-align:right">${mezn||"_______________"} mežniecībai</p>
<br/>
<h2>Pārskats ${gads}. gadā par darbībām meža zemēs, kurām nav nepieciešams apliecinājums</h2>
<p style="text-align:center;font-size:9px">Pārskata saņemšanas datums: ____________</p>
<br/>
<table style="width:100%;border:none;font-size:11px">
<tr><td style="border:none;width:50%"><b>Īpašnieks:</b> ${vards||"___________________"}</td><td style="border:none"><b>Personas kods:</b> ${personas||"___________________"}</td></tr>
<tr><td style="border:none"><b>Adrese:</b> ${adrese||"___________________"}</td><td style="border:none"><b>Tālrunis:</b> ${talrunis||"___________________"}</td></tr>
<tr><td style="border:none"><b>Īpašuma nosaukums:</b> ${saimnieciba||"___________________"}</td><td style="border:none"><b>Administratīvā teritorija:</b> ${adminTerit||"___________________"}</td></tr>
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
<th>MRM saskaņojuma datums</th>
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
  const win = window.open("","_blank")
  win.document.write(html)
  win.document.close()
  win.print()
}

return(
<div style={{marginTop:"24px",padding:"20px",border:"2px solid #225522",borderRadius:"8px",background:"white",marginBottom:"24px"}}>
  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"16px"}}>
    <h2 style={{color:"#225522",margin:0}}>📋 Atjaunošanas pārskats</h2>
    <button onClick={onClose} style={{padding:"4px 12px",background:"#888",color:"white",border:"none",borderRadius:"4px",cursor:"pointer"}}>✕ Aizvērt</button>
  </div>
  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"12px",marginBottom:"16px"}}>
    <div><label style={{fontSize:"11px",fontWeight:"bold"}}>Virsmežniecība:</label><br/>
    <input value={virsmezn} onChange={e=>setVirsmezn(e.target.value)} style={{width:"100%",padding:"4px",border:"1px solid #ccc",borderRadius:"3px"}}/></div>
    <div><label style={{fontSize:"11px",fontWeight:"bold"}}>Mežniecība:</label><br/>
    <input value={mezn} onChange={e=>setMezn(e.target.value)} style={{width:"100%",padding:"4px",border:"1px solid #ccc",borderRadius:"3px"}}/></div>
    <div><label style={{fontSize:"11px",fontWeight:"bold"}}>Vārds, uzvārds:</label><br/>
    <input value={vards} onChange={e=>{setVards(e.target.value);saglabatLoc("parskats_vards",e.target.value)}} style={{width:"100%",padding:"4px",border:"1px solid #ccc",borderRadius:"3px"}}/></div>
    <div><label style={{fontSize:"11px",fontWeight:"bold"}}>Personas kods:</label><br/>
    <input value={personas} onChange={e=>{setPersonas(e.target.value);saglabatLoc("parskats_personas",e.target.value)}} style={{width:"100%",padding:"4px",border:"1px solid #ccc",borderRadius:"3px"}}/></div>
    <div><label style={{fontSize:"11px",fontWeight:"bold"}}>Adrese:</label><br/>
    <input value={adrese} onChange={e=>{setAdrese(e.target.value);saglabatLoc("parskats_adrese",e.target.value)}} style={{width:"100%",padding:"4px",border:"1px solid #ccc",borderRadius:"3px"}}/></div>
    <div><label style={{fontSize:"11px",fontWeight:"bold"}}>Tālrunis:</label><br/>
    <input value={talrunis} onChange={e=>{setTalrunis(e.target.value);saglabatLoc("parskats_talrunis",e.target.value)}} style={{width:"100%",padding:"4px",border:"1px solid #ccc",borderRadius:"3px"}}/></div>
    <div><label style={{fontSize:"11px",fontWeight:"bold"}}>Administratīvā teritorija:</label><br/>
    <input value={adminTerit} onChange={e=>{setAdminTerit(e.target.value);saglabatLoc("parskats_adminTerit",e.target.value)}} style={{width:"100%",padding:"4px",border:"1px solid #ccc",borderRadius:"3px"}}/></div>
    <div><label style={{fontSize:"11px",fontWeight:"bold"}}>Pārskata gads:</label><br/>
    <input type="number" value={gads} onChange={e=>setGads(Number(e.target.value))} style={{width:"100%",padding:"4px",border:"1px solid #ccc",borderRadius:"3px"}}/></div>
  </div>
  <div style={{background:"#f0f8f0",padding:"12px",borderRadius:"6px",marginBottom:"16px",fontSize:"12px"}}>
    <b>Nogabali pārskatā:</b> {izcirtumi.filter(ic=>ic.formula&&ic.h>0&&ic.koki>0).length} no {izcirtumi.length}
    {izcirtumi.filter(ic=>!ic.formula||!ic.h||!ic.koki).length>0 && (
      <span style={{color:"#c62828",marginLeft:"12px"}}>⚠️ {izcirtumi.filter(ic=>!ic.formula||!ic.h||!ic.koki).length} nogabali bez datiem — netiks iekļauti</span>
    )}
  </div>
  <button onClick={exportParskats} style={{padding:"8px 24px",background:"#225522",color:"white",border:"none",borderRadius:"4px",cursor:"pointer",fontSize:"13px"}}>
    🖨 Drukāt / Saglabāt PDF
  </button>
</div>
)
}

function StandardPage({onBack, onPilna}){
const [rows, setRows] = useState([])
const [izcirtumi, setIzcirtumi] = useState([])
const [jaunaudzes, setJaunaudzes] = useState([])
const [kadastrs, setKadastrs] = useState("")
const [saimnieciba, setSaimnieciba] = useState("")
const [showAtjParskats, setShowAtjParskats] = useState(false)
const [showJkParskats, setShowJkParskats] = useState(false)
const jkRef = React.useRef(null)
const atjRef = React.useRef(null)
const ieaudRef = React.useRef(null)
const [showIeaudParskats, setShowIeaudParskats] = useState(false)
const [papilduNogabali, setPapilduNogabali] = useState([])

const handlePDF = async(event) => {
  const file = event.target.files[0]
  if(!file) return
  const reader = new FileReader()
  reader.onload = async function(){
    const typedArray = new Uint8Array(this.result)
    const pdf = await pdfjsLib.getDocument(typedArray).promise
    let fullText = ""
    for(let page=1; page<=pdf.numPages; page++){
      const pageData = await pdf.getPage(page)
      const textContent = await pageData.getTextContent()
      textContent.items.forEach(item=>{ fullText+=item.str+" " })
    }
    parseNogabali(fullText)
  }
  reader.readAsArrayBuffer(file)
}

function parseNogabali(txt){
  const cleanTxt = txt.replace(/\s+/g," ").trim()
  const tokens = cleanTxt.split(" ")
  const result = []
  const izcirtumiArr = []
  const kadMatch = cleanTxt.match(/apzīmējums-\s*(\S+)/)
  if(kadMatch) setKadastrs(kadMatch[1])
  const saimMatch = cleanTxt.match(/Saimniecība:\s*([^\n]+)/)
  if(saimMatch) setSaimnieciba(saimMatch[1].trim().split(" ")[0])
  const izcirtumRegex = /(\d+) ([\d,.]+) Izcirtums (\w+).*?izpildes veids un gads: ([\wēāīūčšžģķļņ ]+?) (\d{4}).*?atjaunošanas gads: (\d{4})/g
  let icMatch
  while((icMatch=izcirtumRegex.exec(cleanTxt))!==null){
    izcirtumiArr.push({
      nog:icMatch[1], platiba:Number(icMatch[2].replace(",","."))||0,
      tips:icMatch[3], cirteVeids:icMatch[4].trim(),
      cirteGads:Number(icMatch[5]), atjaunGads:Number(icMatch[6]),
      formula:"", h:0, koki:0
    })
  }
  for(let i=0; i<tokens.length-3; i++){
    const num0 = parseFloat((tokens[i]||"").replace(",","."))
    const num1 = parseFloat((tokens[i+1]||"").replace(",","."))
    if(!isNaN(num0)&&!isNaN(num1)&&tokens[i+2]&&tokens[i+2].includes("Mežaudze")){
      let j = i+4
      let formula = ""
      const bonitates = ["Ia","I","II","III","IV","V"]
      while(tokens[j]&&tokens[j]!=="D"&&tokens[j]!=="M"&&!bonitates.includes(tokens[j])){
        formula += tokens[j]+" "; j++
      }
      if(tokens[j]&&tokens[j]!=="D"&&tokens[j]!=="M") j++
      const formulaStr = formula.trim()
      let dominantAge = Number(tokens[j+4])||0
      const izcelsanas = (tokens[j]==="M"||tokens[j]==="D")?tokens[j]:"D"
      result.push({
        nog:tokens[i]||"", platiba:parseFloat(tokens[i+1].replace(",","."))||0,
        tips:tokens[i+3]||"", formula:formulaStr, bon:tokens[j+1]||"",
        h:Number(tokens[j+2])||0, d:Number(tokens[j+3])||0, vec:dominantAge,
        biez:Number(tokens[j+5])||0,
        g:Number(tokens[j+6])>100?0:Number(tokens[j+6])||0,
        koki:Number(tokens[j+6])>100?Number(tokens[j+6]):Number(tokens[j+7])||0,
        krm3ha:Number(tokens[j+6])>100?Number(tokens[j+7])||0:Number(tokens[j+8])||0,
        speciesAges:{}, plantacija:false, harvestType:"", izcelsanas
      })
    }
  }
  const jaunaudzeArr = []
  const jaunaudzeRegex = /(\d+) ([\d,.]+) Mežaudze (\w+).*?jaunaudžu kopšanas gads:\s*(\d{4})/g
  let jaMatch
  while((jaMatch=jaunaudzeRegex.exec(cleanTxt))!==null){
    jaunaudzeArr.push({
      nog:jaMatch[1], platiba:Number(jaMatch[2].replace(",","."))||0,
      tips:jaMatch[3], kopšanasGads:Number(jaMatch[4])
    })
  }
  setRows(result)
  setIzcirtumi(izcirtumiArr)
  setJaunaudzes(jaunaudzeArr)
}

const landPrices = {Ap:4500,Vr:4500,Nd:2500,Db:2500,Vrs:3000,Dm:3000,Kp:3000}
const prices = {log:93,small:65,veneer:130,tara:48,pulp:50,fire:38,chips:15}
const sortimentNames = {log:"Zāģbaļķi",small:"Sīkbaļķi",veneer:"Finieris",tara:"Tara",pulp:"Papīrmalka",fire:"Malka",chips:"Šķelda"}

let sortimentTotals = {log:0,small:0,veneer:0,tara:0,pulp:0,fire:0,chips:0}
rows.forEach(row=>{
  const calc = forestEngine(row)||{}
  const sortiments = calc.sortiments||{}
  Object.keys(sortimentTotals).forEach(k=>{sortimentTotals[k]+=sortiments[k]||0})
})

const totalVolume = Object.values(sortimentTotals).reduce((a,b)=>a+b,0)
const totalMoney = Object.keys(sortimentTotals).reduce((sum,k)=>sum+sortimentTotals[k]*(prices[k]||0),0)
const totalLandValue = rows.reduce((sum,row)=>sum+row.platiba*(landPrices[row.tips]||0),0)+izcirtumi.reduce((sum,ic)=>sum+ic.platiba*(landPrices[ic.tips]||0),0)
const stadijumuVertiba = rows.reduce((sum,row)=>sum+(row.izcelsanas==="M"?row.platiba*1500:0),0)
const loggingCost = (16+12)*totalVolume
const roadsideValue = totalMoney - loggingCost
const economicValue = totalMoney + totalLandValue + stadijumuVertiba
const marketValue = rows.reduce((sum,row)=>{const calc=forestEngine(row);return sum+(calc.marketValue||0)},0)+totalLandValue+stadijumuVertiba

return(
<div style={{fontFamily:"Arial",minHeight:"100vh",background:"#f6f9f2"}}>
  {/* HERO */}
  <div style={{background:"#1a3a1a",padding:"32px 40px",color:"white"}}>
    <div style={{maxWidth:"1000px",margin:"0 auto"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"24px",flexWrap:"wrap",gap:"8px"}}>
        <button onClick={onBack} style={{padding:"8px 16px",background:"rgba(255,255,255,0.15)",color:"white",border:"1px solid rgba(255,255,255,0.3)",borderRadius:"4px",cursor:"pointer"}}>← Sākumlapa</button>
       <button onClick={()=>onPilna({rows,izcirtumi,jaunaudzes,kadastrs,saimnieciba})} style={{padding:"8px 20px",background:"#4caf50",color:"white",border:"none",borderRadius:"4px",cursor:"pointer",fontWeight:"bold"}}>Turpināt pilnajā versijā →</button>
      </div>
      <h1 style={{margin:"0 0 8px",fontSize:"28px"}}>Pamata versija</h1>
      <p style={{color:"#aaa",margin:"0 0 28px",fontSize:"14px"}}>Augšupielādē meža inventarizācijas PDF un saņem īpašuma analīzi</p>
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:"16px",marginBottom:"8px"}}>
        <div style={{background:"rgba(255,255,255,0.08)",borderRadius:"8px",padding:"16px",textAlign:"center"}}>
          <div style={{fontSize:"28px",marginBottom:"8px"}}>📄</div>
          <div style={{fontWeight:"bold",fontSize:"14px",marginBottom:"4px"}}>1. Augšupielādē</div>
          <div style={{fontSize:"12px",color:"#aaa"}}>Meža inventarizācijas PDF no VMD</div>
        </div>
        <div style={{background:"rgba(255,255,255,0.08)",borderRadius:"8px",padding:"16px",textAlign:"center"}}>
          <div style={{fontSize:"28px",marginBottom:"8px"}}>📊</div>
          <div style={{fontWeight:"bold",fontSize:"14px",marginBottom:"4px"}}>2. Saņem analīzi</div>
          <div style={{fontSize:"12px",color:"#aaa"}}>Nogabalu ieteikumi, saimnieciskā un tirgus vērtība</div>
        </div>
        <div style={{background:"rgba(255,255,255,0.08)",borderRadius:"8px",padding:"16px",textAlign:"center"}}>
          <div style={{fontSize:"28px",marginBottom:"8px"}}>📋</div>
          <div style={{fontWeight:"bold",fontSize:"14px",marginBottom:"4px"}}>3. Sagatavo pārskatus</div>
          <div style={{fontSize:"12px",color:"#aaa"}}>Atjaunošanas, jaunaudžu un ieaudzēšanas pārskati VMD</div>
        </div>
      </div>
    </div>
  </div>

<div style={{maxWidth:"1000px",margin:"0 auto",padding:"24px"}}></div>
  <div style={{background:"#f0f6ec",border:"1px solid #225522",borderRadius:"8px",padding:"16px",marginBottom:"24px"}}>
    <b style={{color:"#225522"}}>📄 Augšupielādēt meža inventarizācijas PDF</b><br/>
    <input type="file" accept="application/pdf" onChange={handlePDF} style={{marginTop:"8px"}}/>
    {kadastrs && <span style={{marginLeft:"16px",fontSize:"12px",color:"#555"}}><b>Kadastrs:</b> {kadastrs} | <b>Saimniecība:</b> {saimnieciba}</span>}
  </div>
  {rows.length>0 && (
  <div style={{marginBottom:"24px",overflowX:"auto"}}>
    <h2 style={{color:"#225522"}}>Nogabalu analīze</h2>
    <table border="1" cellPadding="6" style={{fontSize:"11px",width:"100%"}}>
      <thead style={{background:"#225522",color:"white"}}>
        <tr><th>Nog</th><th>Platība</th><th>Tips</th><th>Formula</th><th>H</th><th>D</th><th>Vec</th><th>Ieteiktā cirte</th><th>Krāja m³</th><th>Vērtība €</th></tr>
      </thead>
      <tbody>
        {rows.map((r,i)=>{
          const calc = forestEngine(r)
          return(
            <tr key={i} style={{background:i%2===0?"white":"#f0f8f0"}}>
              <td>{r.nog}</td><td>{r.platiba}</td><td>{r.tips}</td><td>{r.formula}</td>
              <td>{r.h}</td><td>{r.d}</td><td>{r.vec}</td>
              <td style={{color:"#225522",fontWeight:"bold"}}>{calc.decision}</td>
              <td>{(calc.cutVolume||0).toFixed(1)}</td>
              <td>{(calc.marketValue||0).toFixed(0)}</td>
            </tr>
          )
        })}
      </tbody>
    </table>
  </div>
  )}
  {jaunaudzes.length>0 && (
  <div style={{background:"#e8f5e9",border:"1px solid #388e3c",borderRadius:"6px",padding:"12px",marginBottom:"24px"}}>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"8px"}}>
    <b>Jaunaudžu kopšana</b>
    <button onClick={()=>{
      const gatavs = jaunaudzes.some(ja=>ja.koki>0)
      if(!gatavs){alert("Aizpildiet vismaz vienam nogabalam koku skaitu un audzes sastāvu!");return}
      setShowJkParskats(true)
      setTimeout(()=>jkRef.current?.scrollIntoView({behavior:"smooth"}),100)
    }} style={{padding:"6px 14px",background:"#388e3c",color:"white",border:"none",borderRadius:"4px",cursor:"pointer",fontSize:"12px"}}>
      📋 Izveidot jaunaudžu kopšanas pārskatu
    </button>
    </div>
    <table border="1" cellPadding="6" style={{marginTop:"8px",width:"100%",fontSize:"11px"}}>
    <thead style={{background:"#388e3c",color:"white"}}><tr><th>Nog</th><th>Platība</th><th>Tips</th><th>Kopšanas gads</th><th>Valdošā suga</th><th>Augstums (m)</th><th>Audzes sastāvs</th><th>Koki/ha</th></tr></thead>
      <tbody>
       {jaunaudzes.map((ja,i)=>(
          <tr key={i}>
            <td>{ja.nog}</td><td>{ja.platiba} ha</td><td>{ja.tips}</td>
            <td style={{color:ja.kopšanasGads<=new Date().getFullYear()?"#c62828":"black",fontWeight:"bold"}}>
              {ja.kopšanasGads<=new Date().getFullYear()?ja.kopšanasGads+" — Kavēta kopšana":ja.kopšanasGads}
            </td>
            <td>{ja.tips||"—"}</td>
<td><input type="number" value={ja.h||""} onChange={e=>{const n=[...jaunaudzes];n[i]={...n[i],h:parseFloat(e.target.value)||0};setJaunaudzes(n)}} placeholder="m" style={{width:"45px",border:"1px solid #ccc",borderRadius:"3px",padding:"2px"}}/></td>
<td><input value={ja.formula||""} onChange={e=>{const n=[...jaunaudzes];n[i]={...n[i],formula:e.target.value};setJaunaudzes(n)}} placeholder="p.ē. 10B" style={{width:"60px",border:"1px solid #ccc",borderRadius:"3px",padding:"2px"}}/></td>
<td><input type="number" value={ja.koki||""} onChange={e=>{const n=[...jaunaudzes];n[i]={...n[i],koki:Number(e.target.value)};setJaunaudzes(n)}} placeholder="gab" style={{width:"55px",border:"1px solid #ccc",borderRadius:"3px",padding:"2px"}}/></td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
  )}
  {izcirtumi.length>0 && (
  <div style={{background:"#fff8e1",border:"1px solid #f9a825",borderRadius:"6px",padding:"12px",marginBottom:"24px"}}>
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
    <table border="1" cellPadding="6" style={{marginTop:"8px",width:"100%",fontSize:"11px"}}>
      <thead style={{background:"#f9a825"}}>
        <tr><th>Nog</th><th>Platība</th><th>Tips</th><th>Cirtes veids</th><th>Gads</th><th>Atjaunot līdz</th><th>Suga</th><th>H (m)</th><th>Koki/ha</th><th>Atj. veids</th></tr>
      </thead>
      <tbody>
        {izcirtumi.map((ic,i)=>(
          <tr key={i} style={{background:ic.atjaunGads<=new Date().getFullYear()?"#ffcccc":"#fffde7"}}>
            <td>{ic.nog}</td><td>{ic.platiba} ha</td><td>{ic.tips}</td>
            <td>{ic.cirteVeids}</td><td>{ic.cirteGads}</td><td><b>{ic.atjaunGads}</b></td>
            <td><input value={ic.formula||""} onChange={e=>{const n=[...izcirtumi];n[i]={...n[i],formula:e.target.value};setIzcirtumi(n)}} placeholder="p.ē. 10P" style={{width:"60px",border:"1px solid #ccc",borderRadius:"3px",padding:"2px"}}/></td>
            <td><input type="number" step="0.1" min="0.1" value={ic.h||""} onChange={e=>{const n=[...izcirtumi];n[i]={...n[i],h:parseFloat(e.target.value)||0};setIzcirtumi(n)}} placeholder="m" style={{width:"45px",border:"1px solid #ccc",borderRadius:"3px",padding:"2px"}}/></td>
            <td><input type="number" value={ic.koki||""} onChange={e=>{const n=[...izcirtumi];n[i]={...n[i],koki:Number(e.target.value)};setIzcirtumi(n)}} placeholder="gab" style={{width:"55px",border:"1px solid #ccc",borderRadius:"3px",padding:"2px"}}/></td>
            <td><select value={ic.atjVeids||""} onChange={e=>{const n=[...izcirtumi];n[i]={...n[i],atjVeids:e.target.value};setIzcirtumi(n)}} style={{padding:"2px",border:"1px solid #ccc",borderRadius:"3px",fontSize:"11px"}}>
              <option value="">—</option>
              <option>Dabiski atjaunojot</option>
              <option>Stādot</option>
              <option>Sējot</option>
            </select></td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
  )}
  {rows.length>0 && (
  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"16px",marginBottom:"24px"}}>
    <div style={{background:"white",border:"2px solid #225522",borderRadius:"10px",padding:"20px"}}>
      <h3 style={{color:"#225522",marginTop:0}}>Saimnieciskā vērtība</h3>
      <div style={{fontSize:"28px",fontWeight:"bold",color:"#225522",marginBottom:"8px"}}>{economicValue.toFixed(0)} €</div>
      <p style={{fontSize:"12px",color:"#666",margin:0}}>Saimnieciskā vērtība atspoguļo īpašuma kopējo vērtību no saimnieciski-ekonomiskā viedokļa — ietver koksnes sortimentu vērtību, zemes vērtību pēc meža tipa, kā arī stādījumu vērtību ja tādi ir.</p>
    </div>
    <div style={{background:"white",border:"2px solid #1565c0",borderRadius:"10px",padding:"20px"}}>
      <h3 style={{color:"#1565c0",marginTop:0}}>Tirgus vērtība</h3>
      <div style={{fontSize:"28px",fontWeight:"bold",color:"#1565c0",marginBottom:"8px"}}>{marketValue.toFixed(0)} €</div>
      <p style={{fontSize:"12px",color:"#666",margin:0}}>Tirgus vērtība ir aplēstā cena par kādu īpašumu varētu pārdot brīvā tirgū. Tā ietver zemes tirgus vērtību, koksnes vērtību pēc aktuālajām tirgus cenām, kā arī stādījumu vērtību.</p>
    </div>
  </div>
  )}
  {rows.length>0 && (
  <div style={{background:"#f0f8f0",border:"1px solid #225522",borderRadius:"8px",padding:"16px",marginBottom:"24px",fontSize:"13px"}}>
    <b style={{color:"#225522"}}>Sortimentu kopsavilkums</b>
    <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:"8px",marginTop:"12px"}}>
      <div><b>Kopā koksne:</b><br/>{totalVolume.toFixed(1)} m³</div>
      <div><b>Sortimentu vērtība:</b><br/>{totalMoney.toFixed(0)} €</div>
      <div><b>Krautuves vērtība:</b><br/>{roadsideValue.toFixed(0)} €</div>
      <div><b>Zemes vērtība:</b><br/>{totalLandValue.toFixed(0)} €</div>
      {stadijumuVertiba>0 && <div><b>Stādījumu vērtība:</b><br/>{stadijumuVertiba.toFixed(0)} €</div>}
    </div>
  </div>
  )}
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

  

  {rows.length>0 && (
  <div style={{background:"#1a3a1a",borderRadius:"10px",padding:"20px",textAlign:"center",marginBottom:"24px"}}>
  <p style={{color:"#aaa",fontSize:"13px",marginBottom:"12px"}}>Lai iegūtu detalizētu sortimentu sadalījumu, cirsmas skici, caurmēra mērījumus un rēķinu izveidi — kā arī iespēju labot augšupielādēto datu vērtības un formulas —</p>
    <button onClick={()=>onPilna({rows,izcirtumi,jaunaudzes,kadastrs,saimnieciba})} style={{padding:"12px 32px",background:"#4caf50",color:"white",border:"none",borderRadius:"6px",fontSize:"15px",fontWeight:"bold",cursor:"pointer"}}>
      Turpināt pilnajā versijā →
    </button>
  </div>
  )}
</div>
)
}

export { JaunaudžuParskats, AtjaunosanaParskats, IeaudzesanaParskats }
export default StandardPage