import React, { useState } from "react"
import CaurmeraPanel from "./CaurmeraPanel"

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

<button onClick={exportPDF} style={{padding:"8px 20px",background:"#225522",color:"white",border:"none",borderRadius:"4px",cursor:"pointer"}}>🖨 Drukāt / Saglabāt PDF</button>
</div>
)}
</div>
)
}

export default CaurmeraPage
