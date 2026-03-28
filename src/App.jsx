import { useState } from "react"
import * as pdfjsLib from "pdfjs-dist"
import { forestEngine } from "./forestEngine"

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
"pdfjs-dist/build/pdf.worker.min.mjs",
import.meta.url
).toString()

// ========== CIRSMAS SKICE ==========
function CirsmaskicePage({onBack,kadastrsIn="",saimniecibaIn=""}){
const [kmlCoords,setKmlCoords]=useState([])
const [kmlName,setKmlName]=useState("")
const [kadastrs,setKadastrs]=useState(kadastrsIn)
const [saimnieciba,setSaimnieciba]=useState(saimniecibaIn)
const [nogabals,setNogabals]=useState("")
const [cirteVeids,setCirteVeids]=useState("")
const [cirteIzpilde,setCirteIzpilde]=useState("")
const [platiba,setPlatiba]=useState(0)
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
  setPlatiba(Math.abs(area)/2*111320*71695/10000)
  const props=features[0].properties||{}
  if(props.PARCELCODE) setKadastrs(props.PARCELCODE)
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
const areaWGS=Math.abs(area)/2
// Pārvērš WGS84 grādus uz ha (aptuveni Latvijas platumam)
const areaHa=areaWGS*111320*71695/10000
setPlatiba(areaHa)

const nameMatch=text.match(/<n>(.*?)<\/n>/)
if(nameMatch) setKmlName(nameMatch[1])
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
const coordsTable=kmlCoords.slice(0,-1).map((c,i)=>
`<tr><td>${i+1}</td><td>${c.lon.toFixed(6)}</td><td>${c.lat.toFixed(6)}</td></tr>`
).join("")

const svgContent=`
<svg width="600" height="450" xmlns="http://www.w3.org/2000/svg">
<rect width="600" height="450" fill="#f8f8f0" stroke="black" stroke-width="1"/>
<g stroke="#ddd" stroke-width="0.5">
<line x1="100" y1="0" x2="100" y2="450"/><line x1="200" y1="0" x2="200" y2="450"/>
<line x1="300" y1="0" x2="300" y2="450"/><line x1="400" y1="0" x2="400" y2="450"/>
<line x1="500" y1="0" x2="500" y2="450"/>
<line x1="0" y1="100" x2="600" y2="100"/><line x1="0" y1="200" x2="600" y2="200"/>
<line x1="0" y1="300" x2="600" y2="300"/><line x1="0" y1="400" x2="600" y2="400"/>
</g>
${kmlCoords.length>0 ? `<polygon points="${polyPoints}" fill="rgba(34,85,34,0.15)" stroke="#225522" stroke-width="2.5"/>` : ""}
${points.slice(0,-1).map((p,i)=>`
<circle cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="5" fill="#225522"/>
<text x="${(p.x+8).toFixed(1)}" y="${(p.y+4).toFixed(1)}" font-size="12" fill="#225522" font-weight="bold">${i+1}</text>
`).join("")}
<g transform="translate(560,40)">
<line x1="0" y1="25" x2="0" y2="-25" stroke="black" stroke-width="2"/>
<polygon points="0,-25 -7,-8 7,-8" fill="black"/>
<text x="-4" y="38" font-size="13" font-weight="bold" fill="black">N</text>
</g>
<g transform="translate(20,430)">
<rect x="0" y="-8" width="50" height="8" fill="black"/>
<rect x="50" y="-8" width="50" height="8" fill="white" stroke="black" stroke-width="1"/>
<text x="0" y="6" font-size="9">0</text>
<text x="90" y="6" font-size="9">100m</text>
</g>
${platiba>0 ? `<text x="300" y="225" font-size="14" fill="#225522" font-weight="bold" text-anchor="middle">${platiba.toFixed(2)} ha</text>` : ""}
</svg>`

const html=`<html><head><meta charset="UTF-8">
<style>
body{font-family:Arial;font-size:11px;padding:20px;max-width:800px;margin:0 auto}
h2{text-align:center;font-size:16px}
table{border-collapse:collapse;width:100%;margin-bottom:12px}
th{background:#225522;color:white;padding:4px 8px;font-size:10px}
td{border:1px solid #ccc;padding:3px 8px;font-size:10px}
.label{background:#f0f0f0;font-weight:bold;width:35%}
.sign{display:flex;justify-content:space-between;margin-top:20px;font-size:11px}
</style></head><body>
<h2>CIRSMAS SKICE</h2>
<p style="text-align:center;font-size:11px">Valsts meža dienesta iesniegumam</p>
<table>
<tr><td class="label">Īpašuma nosaukums</td><td>${kadastrs||"___________________"}</td></tr>
<tr><td class="label">Kadastra numurs</td><td>${kadastrs||"___________________"}</td></tr>
<tr><td class="label">Nogabala numurs</td><td>${nogabals||"___________________"}</td></tr>
<tr><td class="label">Cirtes veids</td><td>${cirteVeids||"___________________"}</td></tr>
<tr><td class="label">Cirtes izpildes veids</td><td>${cirteIzpilde||"___________________"}</td></tr>
<tr><td class="label">Platība</td><td>${platiba>0 ? platiba.toFixed(2)+" ha" : "___________________"}</td></tr>
<tr><td class="label">Datums</td><td>${today}</td></tr>
</table>
${svgContent}
<br/>
<table>
<thead><tr><th>Punkts</th><th>Garums (WGS84)</th><th>Platums (WGS84)</th></tr></thead>
<tbody>${coordsTable}</tbody>
</table>
<div class="sign">
<div>Sastādīja: ___________________</div>
<div>Paraksts: ___________________</div>
</div>
<p style="font-size:9px;color:#888;margin-top:16px">* Skice sagatavota ar Meža tirgus kalkulatoru. Koordinātas WGS84. Ziemeļi uz augšu.</p>
</body></html>`
const win=window.open("","_blank")
win.document.write(html)
win.document.close()
win.print()
}

return(
<div style={{padding:"40px",fontFamily:"Arial",maxWidth:"900px"}}>
<button onClick={onBack} style={{marginBottom:"16px",padding:"6px 14px",background:"#555",color:"white",border:"none",borderRadius:"4px",cursor:"pointer"}}>Atpakal</button>
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
<input value={kadastrs} onChange={e=>setKadastrs(e.target.value)} style={{width:"100%",padding:"4px",border:"1px solid #ccc",borderRadius:"4px"}}/>
</div>
<div>
<label style={{fontSize:"12px",fontWeight:"bold"}}>Nogabala numurs:</label><br/>
<input value={nogabals} onChange={e=>setNogabals(e.target.value)} style={{width:"100%",padding:"4px",border:"1px solid #ccc",borderRadius:"4px"}}/>
</div>
<div>
<label style={{fontSize:"12px",fontWeight:"bold"}}>Cirtes veids:</label><br/>
<select value={cirteVeids} onChange={e=>setCirteVeids(e.target.value)} style={{width:"100%",padding:"4px",border:"1px solid #ccc",borderRadius:"4px"}}>
<option value="">— izvēlies —</option>
<option>Galvenā cirte</option>
<option>Kopšanas cirte</option>
<option>Sanitārā cirte</option>
<option>Rekonstruktīvā cirte</option>
</select>
</div>
<div>
<label style={{fontSize:"12px",fontWeight:"bold"}}>Cirtes izpildes veids:</label><br/>
<select value={cirteIzpilde} onChange={e=>setCirteIzpilde(e.target.value)} style={{width:"100%",padding:"4px",border:"1px solid #ccc",borderRadius:"4px"}}>
<option value="">— izvēlies —</option>
<option>Vienlaidus</option>
<option>Kopšanas</option>
<option>Sanitārā cirte pēc VMD atzinuma</option>
<option>Sanitārā cirte</option>
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

<button onClick={exportSkice} style={{padding:"8px 20px",background:"#225522",color:"white",border:"none",borderRadius:"4px",cursor:"pointer"}}>
Drukāt / Saglabāt PDF
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

<button onClick={exportPDF} style={{padding:"8px 20px",background:"#225522",color:"white",border:"none",borderRadius:"4px",cursor:"pointer"}}>
Drukāt / Saglabāt PDF
</button>
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
function App(){
const [page,setPage]=useState("main")

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
if(page==="atjaunosana") return <AtjaunosanaPage onBack={()=>setPage("main")} izcirtumi={izcirtumi} kadastrs={kadastrs} saimnieciba={saimnieciba}/>
if(page==="skice") return <CirsmaskicePage onBack={()=>setPage("main")} kadastrsIn={kadastrs} saimniecibaIn={saimnieciba}/>
if(page==="caurmers") return <CaurmeraPage onBack={()=>setPage("main")}/>
if(page==="dastojums") return <div style={{padding:"40px",fontFamily:"Arial"}}><button onClick={()=>setPage("main")} style={{marginBottom:"16px",padding:"6px 14px",background:"#555",color:"white",border:"none",borderRadius:"4px",cursor:"pointer"}}>Atpakal</button><h1>Dastojuma aprēķini</h1><p style={{color:"#888"}}>Drīzumā...</p></div>

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

<h1>Meža tirgus</h1>

{/* PRO RĪKI */}
<div style={{display:"flex",gap:"10px",marginBottom:"20px",flexWrap:"wrap"}}>
<button onClick={()=>setPage("skice")} style={{padding:"8px 16px",background:"#1565c0",color:"white",border:"none",borderRadius:"4px",cursor:"pointer"}}>Cirsmas skice</button>
<button onClick={()=>setPage("caurmers")} style={{padding:"8px 16px",background:"#1565c0",color:"white",border:"none",borderRadius:"4px",cursor:"pointer"}}>Caurmēra mērījumi</button>
<button onClick={()=>setPage("dastojums")} style={{padding:"8px 16px",background:"#1565c0",color:"white",border:"none",borderRadius:"4px",cursor:"pointer"}}>Dastojuma aprēķini</button>
{(()=>{
const gatavs=izcirtumi.length>0&&izcirtumi.every(ic=>{
if(!ic.formula||!ic.formula.trim()) return false
if(!ic.h||Number(ic.h)===0) return false
if(!ic.koki||Number(ic.koki)===0) return false
const matches=ic.formula.match(/(\d+)(Bl|Ba|Oz|Os|P|E|B|A|M|G)/g)||[]
if(!matches||matches.length===0) return false
const summa=matches.reduce((s,m)=>{const n=parseInt(m.match(/\d+/)[0]);return s+(n<=10?n*10:n)},0)
return summa===100
})
return(
<button
onClick={()=>setPage("atjaunosana")}
disabled={!gatavs}
style={{padding:"8px 16px",background:gatavs?"#2e7d32":"#aaa",color:"white",border:"none",borderRadius:"4px",cursor:gatavs?"pointer":"not-allowed"}}
title={!gatavs?"Aizpildiet visiem izcirtumiem: formula (summa=10), H un koki/ha":""}
>
Atjaunošanas pārskats
</button>
)
})()}
</div>

{kadastrs && (
<div style={{marginBottom:"8px"}}>
<b>Kadastrs:</b> {kadastrs} | <b>Saimnieciba:</b> {saimnieciba}
{" "}
<a href={"https://www.lvmgeo.lv/kartes"} target="_blank" rel="noreferrer" style={{marginLeft:"12px",padding:"4px 10px",background:"#2e7d32",color:"white",borderRadius:"4px",textDecoration:"none",fontSize:"12px"}}>LVM GEO</a>
<button onClick={()=>navigator.clipboard.writeText(kadastrs)} style={{marginLeft:"8px",padding:"4px 10px",background:"#555",color:"white",border:"none",borderRadius:"4px",fontSize:"12px",cursor:"pointer"}}>Kopet kadastru</button>
</div>
)}

<input type="file" accept="application/pdf" onChange={handlePDF}/>

{jaunaudzes.length>0 && (
<div style={{background:"#e8f5e9",border:"1px solid #388e3c",borderRadius:"6px",padding:"12px",margin:"16px 0"}}>
<b>Jaunaudžu kopšana</b>
<table border="1" cellPadding="6" style={{marginTop:"8px",width:"100%"}}>
<thead style={{background:"#388e3c",color:"white"}}><tr><th>Nog</th><th>Platība</th><th>Tips</th><th>Kopšanas gads</th></tr></thead>
<tbody>
{jaunaudzes.map((ja,i)=>(
<tr key={i}>
<td>{ja.nog}</td><td>{ja.platiba} ha</td><td>{ja.tips}</td>
<td style={{color:ja.kopšanasGads<=new Date().getFullYear()?"#c62828":"black",fontWeight:ja.kopšanasGads<=new Date().getFullYear()?"bold":"normal"}}>
{ja.kopšanasGads<=new Date().getFullYear()?ja.kopšanasGads+" — Kavēta kopšana / nav iesniegts pārskats":ja.kopšanasGads}
</td>
</tr>
))}
</tbody>
</table>
</div>
)}

{izcirtumi.length>0 && (
<div style={{background:"#fff8e1",border:"1px solid #f9a825",borderRadius:"6px",padding:"12px",margin:"16px 0"}}>
<b>Izcirtumi — nepieciešama atjaunošana</b>
<table border="1" cellPadding="6" style={{marginTop:"8px",width:"100%"}}>
<thead style={{background:"#f9a825"}}>
<tr><th>Nog</th><th>Platība</th><th>Tips</th><th>Cirtes veids</th><th>Gads</th><th>Atjaunot līdz</th><th>Formula</th><th>H (m)</th><th>Koki/ha</th><th>Statuss</th></tr>
</thead>
<tbody>
{izcirtumi.map((ic,i)=>(
<tr key={i} style={{background:ic.atjaunGads<=new Date().getFullYear()?"#ffcccc":"#fffde7"}}>
<td>{ic.nog}</td><td>{ic.platiba} ha</td><td>{ic.tips}</td><td>{ic.cirteVeids}</td><td>{ic.cirteGads}</td><td><b>{ic.atjaunGads}</b></td>
<td><input style={{width:"90px"}} value={ic.formula} placeholder="p.ē. 10P" onChange={e=>updateIzcirtums(i,"formula",e.target.value)}/></td>
<td><input type="number" style={{width:"45px"}} value={ic.h||""} placeholder="m" onChange={e=>updateIzcirtums(i,"h",parseFloat(e.target.value.replace(",",".")))}/></td>
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

export default App