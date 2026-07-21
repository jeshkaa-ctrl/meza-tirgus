import React, { useState } from "react"
import CaurmeraPanel from "./CaurmeraPanel"
import { parbauditVaiMaksaPdf } from './utils/pdfPaymentCheck'
import { PdfMaksasGate } from './components/PdfMaksasGate'
import RekinsPanel from "./RekinsPanel"
import DastojumsPanel from "./DastojumsPanel"

// ========== CIRSMAS SKICE ==========
function CirsmaskicePage({onBack,kadastrsIn="",saimniecibaIn="",savedState,onSaveState,user,onReg}){
const [kmlCoords,setKmlCoords]=useState(savedState?.kmlCoords||[])
const [kmlName,setKmlName]=useState(savedState?.kmlName||"")
const [kadastrs,setKadastrs]=useState(savedState?.kadastrs||kadastrsIn)
const [saimnieciba,setSaimnieciba]=useState(savedState?.saimnieciba||saimniecibaIn)
const [nogabals,setNogabals]=useState(savedState?.nogabals||"")

const [cirteVeids,setCirteVeids]=useState(savedState?.cirteVeids||"")
const [cirteIzpilde,setCirteIzpilde]=useState(savedState?.cirteIzpilde||"")
const [pdfMaksa,setPdfMaksa]=useState(null)
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
const exportSkice=async()=>{
const maksa = await parbauditVaiMaksaPdf(user, 'skice')
if (!maksa.allowed) { setPdfMaksa(maksa); return }

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
<div style="margin-top:12px;font-size:10px">
  <b>Piesaiste:</b> 1.virsotnes koordināta: ${kmlCoords[0] ? wgs84ToLks92(kmlCoords[0].lon, kmlCoords[0].lat)[0].toFixed(2) + "&nbsp;&nbsp;&nbsp;&nbsp;" + wgs84ToLks92(kmlCoords[0].lon, kmlCoords[0].lat)[1].toFixed(2) : "— —"}
</div>
<div style="margin-top:12px;padding:10px;border:1px solid #ccc;font-size:11px;max-width:520px">
  Apliecinu, ka cirsmas robeža apvidū ir zināma un zemes vienības robežzīmes un robežstigas apvidū ir ierīkotas un uzturētas atbilstoši normatīvajiem aktiem par zemes kadastrālo uzmērīšanu.
</div>
<div class="paraksts">
  <div>Sagatavoja: ___________________________<br/><span style="font-size:9px">(vārds, uzvārds, paraksts)</span></div>
  <div>${today}</div>
</div>
<p style="font-size:9px;color:#888;margin-top:8px">* Skice sagatavota ar Meža tirgus kalkulatoru. Koordinātas LKS92. Ziemeļi uz augšu.</p>
</body></html>`
const win=window.open("","_blank")
win.document.write(html)
win.document.close()
win.print()
}
return(
<div style={{minHeight:"100vh",background:"#080f08",color:"#e8f5e9",fontFamily:"Arial,sans-serif"}}>
<div style={{background:"#1b3a1b",borderBottom:"2px solid #4caf50",padding:"12px 20px",display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:"8px"}}>
  <div style={{display:"flex",gap:"8px",alignItems:"center",flexWrap:"wrap"}}>
    <button onClick={onBack} style={{padding:"6px 14px",background:"transparent",border:"none",color:"#4caf50",fontSize:"16px",cursor:"pointer"}}>← Atpakaļ</button>
    <button onClick={notirit} style={{padding:"6px 14px",background:"#c62828",color:"white",border:"none",borderRadius:"6px",cursor:"pointer",fontSize:"12px"}}>🗑 Dzēst visu</button>
    <a href="https://www.lvmgeo.lv/kartes" target="_blank" rel="noreferrer" style={{padding:"6px 14px",background:"#2e7d32",color:"white",borderRadius:"6px",textDecoration:"none",fontSize:"12px"}}>🗺 LVM GEO</a>
    <a href="https://www.vmd.gov.lv" target="_blank" rel="noreferrer" style={{padding:"6px 14px",background:"#5d4037",color:"white",borderRadius:"6px",textDecoration:"none",fontSize:"12px"}}>🏛 VMD</a>
    {kadastrs && <button onClick={()=>navigator.clipboard.writeText(kadastrs)} style={{padding:"6px 14px",background:"#1565c0",color:"white",border:"none",borderRadius:"6px",cursor:"pointer",fontSize:"12px"}}>📋 Kopēt kadastru</button>}
  </div>
  <div style={{display:"flex",gap:"8px"}}>
    <button onClick={()=>setShowCaurmers(v=>!v)} style={{padding:"6px 14px",background:"#1565c0",color:"white",border:"none",borderRadius:"6px",cursor:"pointer",fontSize:"12px"}}>📏 Caurmēra mērījumi</button>
    <button onClick={()=>setShowDastojums(v=>!v)} style={{padding:"6px 14px",background:"#225522",color:"white",border:"none",borderRadius:"6px",cursor:"pointer",fontSize:"12px"}}>🌲 Dastojums</button>
  </div>
</div>

<div style={{padding:"24px",maxWidth:"960px",margin:"0 auto"}}>
<h1 style={{color:"#4caf50",fontSize:"22px",fontWeight:800,marginBottom:"20px",letterSpacing:"-0.02em"}}>📐 Cirsmas skice</h1>

<div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"12px",marginBottom:"16px",padding:"16px",background:"#141f14",borderRadius:"10px",border:"1px solid #2d5a2d"}}>
<div>
<label style={{fontSize:"11px",color:"#81c784",fontWeight:"bold",display:"block",marginBottom:"4px"}}>Augšupielādēt KML failu:</label>
<input type="file" accept=".kml" onChange={handleKML} style={{color:"#e8f5e9",fontSize:"12px"}}/>
</div>
<div>
<label style={{fontSize:"11px",color:"#81c784",fontWeight:"bold",display:"block",marginBottom:"4px"}}>Augšupielādēt SHP failu (.zip):</label>
<input type="file" accept=".zip" onChange={handleSHP} style={{color:"#e8f5e9",fontSize:"12px"}}/>
</div>
</div>

<div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"12px",marginBottom:"16px"}}>
<div>
<label style={{fontSize:"11px",color:"#81c784",fontWeight:"bold",display:"block",marginBottom:"4px"}}>Kadastra numurs:</label>
<input value={kadastrs} onChange={e=>{setKadastrs(e.target.value);saglabat({kadastrs:e.target.value})}} style={{width:"100%",padding:"8px",background:"#0f1a0f",border:"1px solid #2d5a2d",borderRadius:"6px",color:"#e8f5e9",fontSize:"13px",boxSizing:"border-box"}}/>
</div>
<div>
<label style={{fontSize:"11px",color:"#81c784",fontWeight:"bold",display:"block",marginBottom:"4px"}}>Saimniecības nosaukums:</label>
<input value={saimnieciba} onChange={e=>{setSaimnieciba(e.target.value);saglabat({saimnieciba:e.target.value})}} style={{width:"100%",padding:"8px",background:"#0f1a0f",border:"1px solid #2d5a2d",borderRadius:"6px",color:"#e8f5e9",fontSize:"13px",boxSizing:"border-box"}}/>
</div>
<div>
<label style={{fontSize:"11px",color:"#81c784",fontWeight:"bold",display:"block",marginBottom:"4px"}}>Nogabala numurs:</label>
<input value={nogabals} onChange={e=>{let val=e.target.value.replace(/,/g,";");setNogabals(val);saglabat({nogabals:val})}} onKeyDown={e=>{if(e.key===" "){e.preventDefault();const val=nogabals.trimEnd()+";";setNogabals(val);saglabat({nogabals:val})}}} style={{width:"100%",padding:"8px",background:"#0f1a0f",border:"1px solid #2d5a2d",borderRadius:"6px",color:"#e8f5e9",fontSize:"13px",boxSizing:"border-box"}} placeholder="p.ē. 3;5.1;7"/>
</div>
<div>
<label style={{fontSize:"11px",color:"#81c784",fontWeight:"bold",display:"block",marginBottom:"4px"}}>Cirtes veids:</label>
<select value={cirteVeids} onChange={e=>{setCirteVeids(e.target.value);saglabat({cirteVeids:e.target.value})}} style={{width:"100%",padding:"8px",background:"#0f1a0f",border:"1px solid #2d5a2d",borderRadius:"6px",color:"#e8f5e9",fontSize:"13px"}}>
<option value="">— izvēlies —</option>
<option>Galvenā cirte</option>
<option>Kopšanas cirte</option>
<option>Sanitārā cirte</option>
<option>Jaunaudžu kopšana</option>
</select>
</div>
<div>
<label style={{fontSize:"11px",color:"#81c784",fontWeight:"bold",display:"block",marginBottom:"4px"}}>Cirtes izpildes veids:</label>
<select value={cirteIzpilde} onChange={e=>{setCirteIzpilde(e.target.value);saglabat({cirteIzpilde:e.target.value})}} style={{width:"100%",padding:"8px",background:"#0f1a0f",border:"1px solid #2d5a2d",borderRadius:"6px",color:"#e8f5e9",fontSize:"13px"}}>
<option value="">— izvēlies —</option>
{cirteVeids==="Galvenā cirte" && <><option>Kailcirte</option><option>Kailcirte pēc caurmēra</option><option>Izlases cirte</option></>}
{cirteVeids==="Kopšanas cirte" && <option>Kopšanas cirte</option>}
{cirteVeids==="Sanitārā cirte" && <><option>Sanitārā izlases cirte</option><option>Sanitārā kailcirte pēc VMD atzinuma</option></>}
{cirteVeids==="Jaunaudžu kopšana" && <option>Jaunaudžu kopšana</option>}
</select>
</div>
</div>

{kmlCoords.length>0 && (
<div>
<div style={{border:"2px solid #225522",borderRadius:"10px",overflow:"hidden",marginBottom:"16px"}}>
<svg width="100%" viewBox={`0 0 ${svgW} ${svgH}`} xmlns="http://www.w3.org/2000/svg">
<rect width={svgW} height={svgH} fill="#0a1a0a"/>
<g stroke="#1a3a1a" strokeWidth="0.5">
{[100,200,300,400,500].map(x=><line key={x} x1={x} y1="0" x2={x} y2={svgH}/>)}
{[100,200,300,400].map(y=><line key={y} x1="0" y1={y} x2={svgW} y2={y}/>)}
</g>
<polygon points={polyPoints} fill="rgba(76,175,80,0.15)" stroke="#4caf50" strokeWidth="2.5"/>
{points.slice(0,-1).map((p,i)=>(
<g key={i}>
<circle cx={p.x} cy={p.y} r="5" fill="#4caf50"/>
<text x={p.x+8} y={p.y+4} fontSize="12" fill="#81c784" fontWeight="bold">{i+1}</text>
</g>
))}
{platiba>0 && (
<text x={svgW/2} y={svgH/2} fontSize="16" fill="#4caf50" fontWeight="bold" textAnchor="middle">{platiba.toFixed(2)} ha</text>
)}
<g transform="translate(560,40)">
<line x1="0" y1="25" x2="0" y2="-25" stroke="#4caf50" strokeWidth="2"/>
<polygon points="0,-25 -7,-8 7,-8" fill="#4caf50"/>
<text x="-4" y="38" fontSize="13" fontWeight="bold" fill="#4caf50">N</text>
</g>
<g transform="translate(20,430)">
<rect x="0" y="-8" width="50" height="8" fill="#4caf50"/>
<rect x="50" y="-8" width="50" height="8" fill="#0a1a0a" stroke="#4caf50" strokeWidth="1"/>
<text x="0" y="6" fontSize="9" fill="#81c784">0</text>
<text x="90" y="6" fontSize="9" fill="#81c784">100m</text>
</g>
</svg>
</div>

<div style={{overflowX:"auto",marginBottom:"16px"}}>
<table border="1" cellPadding="4" style={{fontSize:"11px",width:"100%",borderCollapse:"collapse"}}>
<thead><tr style={{background:"#225522",color:"white"}}><th>Punkts</th><th>Garums (WGS84)</th><th>Platums (WGS84)</th></tr></thead>
<tbody>
{kmlCoords.slice(0,-1).map((c,i)=>(
<tr key={i} style={{background:i%2===0?"#0f1a0f":"#141f14",color:"#e8f5e9"}}>
<td>{i+1}</td>
<td>{c.lon.toFixed(6)}</td>
<td>{c.lat.toFixed(6)}</td>
</tr>
))}
</tbody>
</table>
</div>

<div style={{display:"flex",gap:"8px",flexWrap:"wrap"}}>
{user
  ? <><PdfMaksasGate info={pdfMaksa} onClose={() => setPdfMaksa(null)} /><button onClick={exportSkice} style={{padding:"8px 20px",background:"#225522",color:"white",border:"1px solid #4caf50",borderRadius:"6px",cursor:"pointer",fontSize:"13px",fontWeight:"bold"}}>🖨 Drukāt / Saglabāt PDF</button></>
  : <button onClick={()=>{onReg?.()}} style={{padding:"8px 20px",background:"#555",color:"white",border:"none",borderRadius:"6px",cursor:"pointer",fontSize:"13px"}}>🔒 Reģistrējies lai drukātu PDF</button>
}
<button onClick={()=>setShowRekins(true)} style={{padding:"8px 20px",background:"#e65100",color:"white",border:"none",borderRadius:"6px",cursor:"pointer",fontSize:"13px",fontWeight:"bold"}}>🧾 Izveidot rēķinu</button>
<button onClick={downloadSHP} style={{padding:"8px 20px",background:"#1565c0",color:"white",border:"none",borderRadius:"6px",cursor:"pointer",fontSize:"13px"}}>⬇ Lejupielādēt SHP</button>
</div>
</div>
)}

{kmlCoords.length===0 && (
<div style={{padding:"48px",textAlign:"center",color:"#4a7a4a",border:"2px dashed #2d5a2d",borderRadius:"10px",background:"#0f1a0f"}}>
<div style={{fontSize:"48px",marginBottom:"12px"}}>🗺</div>
<div style={{fontSize:"16px",fontWeight:"bold",color:"#4caf50",marginBottom:"6px"}}>Augšupielādē KML vai SHP failu</div>
<div style={{fontSize:"13px"}}>No LVM GEO → eksportē KML → augšupielādē šeit</div>
</div>
)}

{showRekins && <RekinsPanel kadastrs={kadastrs} saimnieciba={saimnieciba} platiba={platiba} onClose={()=>setShowRekins(false)} user={user} onReg={onReg}/>}
{showCaurmers && <CaurmeraPanel kadastrs={kadastrs} nogabals={nogabals} saimnieciba={saimnieciba} savedState={caurmersState} onSaveState={(s)=>{setCaurmersState(s);saglabat({caurmersState:s})}} user={user} onReg={onReg}/>}
{showDastojums && <DastojumsPanel kadastrs={kadastrs} saimnieciba={saimnieciba} onClose={()=>setShowDastojums(false)} user={user} onReg={onReg}/>}
</div>
</div>
)
}

export default CirsmaskicePage
