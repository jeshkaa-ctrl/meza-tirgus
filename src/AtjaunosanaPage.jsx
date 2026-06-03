import React, { useState } from "react"

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

export default AtjaunosanaPage
