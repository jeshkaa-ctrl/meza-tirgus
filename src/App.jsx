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
import DastojumsPDFKalkulators from "./DastojumsPDFKalkulators"
import GlobalHeader from "./GlobalHeader"
import ChatPage from "./ChatPage"
import PavadzimesRegistrs from "./PavadzimesRegistrs"
import RpAndrasPortals from "./RpAndrasPortals"
import DastojumuRegistrsPage from "./DastojumuRegistrsPage"
import KubiKalkulators from "./KubiKalkulators"
import LogistikaKalkulators from "./LogistikaKalkulators"
import MobilajiRiki from "./MobilajiRiki"
import KrautuvesMeritajsPage from "./KrautuvesMeritajsPage"
import DastojumsMeritajsPage from "./DastojumsMeritajsPage"
import SubscriptionPage from "./SubscriptionPage"
import MaksajumsPaldies from "./MaksajumsPaldies"
import JautaParMezuPage from "./JautaParMezuPage"
import JautaParMezuWidget from "./components/JautaParMezuWidget"
import MainPage from "./MainPage"
import TirgusLapa from "./kopiena/TirgusLapa"
import AdminDashboard from "./AdminDashboard"
import { supabase } from "./supabaseClient"
import { C as DS, F, spinnerCSS } from "./ds"
import CaurmeraPanel from "./CaurmeraPanel"
import RekinsPanel from "./RekinsPanel"
import CirsmaskicePage from "./CirsmaskicePage"
import CaurmeraPage from "./CaurmeraPage"
import AtjaunosanaPage from "./AtjaunosanaPage"
import LandingPage from "./LandingPage"
import RekinuKratuve from "./RekinuKratuve"

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
"pdfjs-dist/build/pdf.worker.min.mjs",
import.meta.url
).toString()
// ========== APP ==========

function App(){
// Montonio return URL pārbaude — ja ?payment=success, rāda paldies lapu
const urlParams = new URLSearchParams(window.location.search)
const initialPage = urlParams.get('payment') === 'success' ? 'maksajums_paldies' : 'landing'

const [page,setPageRaw]=useState(initialPage)
const { user, loading: authLoading, registreties, pieteikties, iziet } = useAuth()

// Lapas izsekošana — ieraksta Supabase app_events tabulā (klusē ja tabulas nav)
const sesijasId = React.useRef(
  sessionStorage.getItem('mt_sesija') || (() => {
    const id = Math.random().toString(36).slice(2) + Date.now().toString(36)
    sessionStorage.setItem('mt_sesija', id)
    return id
  })()
)
const userRef = React.useRef(null)
React.useEffect(() => { userRef.current = user }, [user])
const setPage = React.useCallback((lapa) => {
  setPageRaw(lapa)
  supabase.from('app_events').insert({
    lapa,
    sesija_id: sesijasId.current,
    user_id: userRef.current?.id || null,
  }).then(() => {}).catch(() => {})
}, [])
const [showReg, setShowReg] = useState(false)
const [regAtpakal, setRegAtpakal] = useState(null)
const [showChat, setShowChat] = useState(false)

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

const [jaunaudzes,setJaunaudzes]=useState([])
const [skirotajsState,setSkirotajsState]=useState(null)
const [dastojumsPdfFile,setDastojumsPdfFile]=useState(null)
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
if(authLoading) return <div style={{minHeight:"100vh",background:"#080f08",display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:16}}><div style={{width:40,height:40,border:"3px solid #2d4a2d",borderTop:"3px solid #4caf50",borderRadius:"50%",animation:"spin 1s linear infinite"}}/><style>{"@keyframes spin{to{transform:rotate(360deg)}}"}</style><div style={{color:"#4a7a4a",fontSize:14}}>Ielādē...</div></div>

if(page==="sludinajumi") return <>
  <SludinajumiPage user={user} onBack={()=>setPage("main")}/>
  {showReg && <RegModal onRegistreties={async(d)=>{await registreties(d);setShowReg(false);if(regAtpakal)setPage(regAtpakal)}} onPieteikties={async(d)=>{await pieteikties(d);setShowReg(false);if(regAtpakal)setPage(regAtpakal)}} onAizvērt={()=>setShowReg(false)}/>}
</>
if(page==="landing") return <>
  <LandingPage onEnter={()=>setPage("main")} onStandard={()=>setPage("standard")} user={user} onIziet={iziet} onReg={()=>atvertReg("landing")} onSludinajumi={()=>setPage("sludinajumi")} onLikumi={()=>setPage("jautaparmezu")} onTirgus={()=>setPage("tirgus")}/>
  {showReg && <RegModal onRegistreties={async(d)=>{await registreties(d);setShowReg(false);if(regAtpakal)setPage(regAtpakal)}} onAizvērt={()=>setShowReg(false)}/>}
</>
if(page==="standard") return <StandardPage onBack={()=>setPage("main")} onPilna={(data)=>{
  if(data){
    setRows(data.rows||[])
    setIzcirtumi(data.izcirtumi||[])
    setJaunaudzes(data.jaunaudzes||[])
    setKadastrs(data.kadastrs||"")
    setSaimnieciba(data.saimnieciba||"")
  }
  setTimeout(()=>setPage("main"),50)
}}/>
if(page==="pdfSkirotajs") return <PdfSkirotajsPage onBack={()=>setPage("main")} savedState={skirotajsState} onSaveState={setSkirotajsState} onOpenDastojums={(file)=>{setDastojumsPdfFile(file); setPage("dastojumsPDF")}}/>
if(page==="cirsma") return <>
  <CirsmaNovertesanaPage onBack={()=>setPage("main")} kadastrsIn={kadastrs} saimniecibaIn={saimnieciba} savedState={cirsmaState} onSaveState={setCirsmaState} user={user} onReg={()=>atvertReg("cirsma")}/>
  {showReg && <RegModal onRegistreties={async(d)=>{await registreties(d);setShowReg(false);if(regAtpakal)setPage(regAtpakal)}} onAizvērt={()=>setShowReg(false)}/>}
</>
if(page==="atjaunosana") return <AtjaunosanaPage onBack={()=>setPage("main")} izcirtumi={izcirtumi} kadastrs={kadastrs} saimnieciba={saimnieciba}/>
if(page==="skice") return <>
  <CirsmaskicePage onBack={()=>setPage("main")} kadastrsIn={kadastrs} saimniecibaIn={saimnieciba} savedState={skiceState} onSaveState={setSkiceState} user={user} onReg={()=>atvertReg("skice")}/>
  {showReg && <RegModal onRegistreties={async(d)=>{await registreties(d);setShowReg(false);if(regAtpakal)setPage(regAtpakal)}} onAizvērt={()=>setShowReg(false)}/>}
</>
if(page==="caurmers") return <CaurmeraPage onBack={()=>setPage("main")} savedState={caurmersState} onSaveState={setCaurmersState}/>
if(page==="rekini") return <>
  <RekinuKratuve onBack={()=>setPage("main")} user={user} onReg={()=>atvertReg("rekini")}/>
  {showReg && <RegModal onRegistreties={async(d)=>{await registreties(d);setShowReg(false);if(regAtpakal)setPage(regAtpakal)}} onPieteikties={async(d)=>{await pieteikties(d);setShowReg(false);if(regAtpakal)setPage(regAtpakal)}} onAizvērt={()=>setShowReg(false)}/>}
</>
if(showChat) return <ChatPage user={user} onBack={()=>setShowChat(false)}/>
if(page==="caurmers_mobile") return <CaurmeraMobile onBack={()=>setPage("main")}/>
if(page==="cirsma_mobile") return <CirsmaNovertesanaMobile onBack={()=>setPage("main")}/>
if(page==="dastojums_pdf") return <DastojumsPDFKalkulators onBack={()=>setPage("main")}/>
if(page==="kubi") return <KubiKalkulators onBack={()=>setPage("main")}/>
if(page==="krautuves_meritajs")  return <KrautuvesMeritajsPage  onBack={()=>setPage("main")}/>
if(page==="dastojums_meritajs") return <DastojumsMeritajsPage onBack={()=>setPage("main")}/>
if(page==="subscription")      return <SubscriptionPage onBack={()=>setPage("main")} onNavigate={setPage} user={user}/>
if(page==="maksajums_paldies") return <MaksajumsPaldies onTurpina={()=>setPage("main")}/>
if(page==="tirgus") return <TirgusLapa user={user} onNavigate={setPage} onReg={()=>atvertReg("tirgus")}/>
if(page==="jautaparmezu")     return <JautaParMezuPage onBack={()=>setPage("main")}/>
if(page==="mobilie") return <MobilajiRiki onBack={()=>setPage("main")} onNavigate={(p)=>setPage(p)}/>
if(page==="dastojumsPDF") return <DastojumsPDFKalkulators onBack={()=>setPage("main")} initialFile={dastojumsPdfFile}/>
if(page==="pavadzimes") return <DastojumuRegistrsPage onBack={()=>setPage("main")} user={user} onReg={()=>atvertReg("pavadzimes")}/>
if(page==="rpandras") return <DastojumuRegistrsPage onBack={()=>setPage("main")} user={user} onReg={()=>atvertReg("rpandras")}/>
if(page==="logistika") return <LogistikaKalkulators onBack={()=>setPage("main")}/>
if(page==="dastojums") return <div style={{padding:"40px",fontFamily:"Arial"}}><button onClick={()=>setPage("main")} style={{marginBottom:"16px",padding:"6px 14px",background:"#555",color:"white",border:"none",borderRadius:"4px",cursor:"pointer"}}>Atpakaļ</button><h1>Dastojuma aprēķini</h1><p style={{color:"#888"}}>Drīzumā...</p></div>
if(page==="admin" && user?.epasts === "jeshkaa@inbox.lv") return <AdminDashboard onBack={()=>setPage("main")}/>
if(page==="main") return <>
  <MainPage onNavigate={setPage} user={user} onReg={()=>atvertReg("main")} onIziet={iziet}/>
  {showReg && <RegModal onRegistreties={async(d)=>{await registreties(d);setShowReg(false);if(regAtpakal)setPage(regAtpakal)}} onPieteikties={async(d)=>{await pieteikties(d);setShowReg(false);if(regAtpakal)setPage(regAtpakal)}} onAizvērt={()=>setShowReg(false)}/>}
</>

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
setPage("standard")
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

// Jaunaudžu kopšanas parsēšana
const jaunaudzeArr=[]
const jkRegex = /Nepieciešamais jaunaudžu kopšanas gads: (\d{4})/g
let jkMatch
while((jkMatch=jkRegex.exec(cleanTxt))!==null){
  const jkGads = Number(jkMatch[1])
  const pirmsIdx = jkMatch.index
  const pirmsText = cleanTxt.slice(Math.max(0, pirmsIdx-400), pirmsIdx)
  const nogabaliPirms = [...pirmsText.matchAll(/(\d+) ([\d,.]+) Mežaudze (\w+) ([\wēāīūčšžģķļņ\/\d]+)/g)]
  if(nogabaliPirms.length > 0){
    const pedigeisNog = nogabaliPirms[nogabaliPirms.length-1]
    const formula = pedigeisNog[4]||""
    const valdSuga = formula.match(/\d+([A-ZĒĀĪŪČŠŽĢĶĻŅa-zēāīūčšžģķļņ]+)/)?.[1]||""
    if(!["Ba","A","Bl"].includes(valdSuga)){
      jaunaudzeArr.push({
        nog: pedigeisNog[1],
        platiba: Number(pedigeisNog[2].replace(",","."))||0,
        tips: pedigeisNog[3],
        formula: formula,
        jkGads: jkGads,
        h:0, koki:0, jaunkFormula:""
      })
    }
  }
}
setJaunaudzes(jaunaudzeArr)

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
koki:Number(tokens[j+6])>100?Number(tokens[j+6]):Number(tokens[j+7])>=1000?Number(tokens[j+7]):0,
krm3ha:Number(tokens[j+6])>100?Number(tokens[j+7])||0:Number(tokens[j+7])>=1000?Number(tokens[j+8])||0:Number(tokens[j+7])||0,
speciesAges,plantacija:isPlantacija,harvestType:"",izcelsanas
})
}
}

let jaMatch
const jaunaudzeRegex = /(\d+) ([\d,.]+) Jaunaudze (\w+).*?kopšanas gads: (\d{4})/g
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
<table><thead><tr><th>Nog</th><th>Platība</th><th>Tips</th><th>Formula</th><th>H</th><th>D</th><th>Vec</th><th>G</th><th>Ieteiktā cirte</th><th>VMD krāja m³/ha</th><th>Aprēķ. krāja m³/ha</th><th>Cirsmas krāja m³</th><th>Vērtība €</th></tr></thead><tbody>
${rows.map(r=>{const calc=forestEngine(r);const ff={P:0.45,E:0.48,B:0.52,A:0.42,Ba:0.38,Bl:0.38,M:0.46,Oz:0.52,Os:0.50,G:0.52};const sp=(r.formula?.match(/(\d+)(Bl|Ba|Oz|Os|P|E|B|A|M|G)/)||[])[2]||"B";const ak=r.g&&r.h?(r.g*r.h*(ff[sp]||0.5)).toFixed(0):"—";return`<tr><td>${r.nog}</td><td>${r.platiba}</td><td>${r.tips}</td><td>${r.formula}</td><td>${r.h}</td><td>${r.d}</td><td>${r.vec}</td><td>${r.g}</td><td>${calc.decision}</td><td>${r.krm3ha||"—"}</td><td>${ak}</td><td>${(calc.cutVolume||0).toFixed(1)}</td><td>${(calc.marketValue||0).toFixed(0)}</td></tr>`}).join("")}
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
<div style={{fontFamily:"'Inter',Arial,sans-serif",background:"#080f08",minHeight:"100vh",color:"#e8f0e8"}}>
{user && <GlobalHeader user={user} onIziet={iziet} onOpenChat={()=>setShowChat(true)} onNavigate={(p)=>setPage(p)}/>}
{showReg && <RegModal onRegistreties={async(d)=>{await registreties(d);setShowReg(false)}} onPieteikties={async(d)=>{await pieteikties(d);setShowReg(false)}} onAizvērt={()=>setShowReg(false)}/>}

{showCustomModal && (
<div style={{position:"fixed",top:0,left:0,width:"100%",height:"100%",background:"rgba(0,0,0,0.5)",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center"}}>
<div style={{background:"white",padding:"30px",borderRadius:"8px",minWidth:"500px",maxHeight:"80vh",overflow:"auto",color:"#111"}}>
<h2 style={{color:"#111"}}>Personalizēt izstrādi</h2>
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



{/* PRO RĪKI */}
<div style={{background:"#111f11",border:"1px solid #1e2e1e",borderRadius:"12px",padding:"16px",marginBottom:"20px"}}>
  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:"12px"}}>

    {/* CIRSMU DARBI */}
    <div style={{background:"#111f11",border:"1px solid #1e2e1e",borderRadius:"10px",padding:"14px"}}>
      <div style={{color:"#4caf50",fontSize:"11px",fontWeight:"bold",textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:"10px",paddingBottom:"6px",borderBottom:"1px solid #2d4a2d"}}>📐 Cirsmu darbi</div>
      <div style={{display:"flex",flexDirection:"column",gap:"8px"}}>
        <div onClick={()=>setPage("skice")} style={{background:"#1a3a1a",border:"1px solid #2d4a2d",borderRadius:"6px",padding:"10px 12px",cursor:"pointer"}}>
          <div style={{display:"flex",alignItems:"center",gap:"8px",marginBottom:"3px"}}>
            <span style={{fontSize:"16px"}}>🗺</span>
            <span style={{color:"white",fontSize:"13px",fontWeight:"bold"}}>Cirsmas skice</span>
          </div>
        <div style={{color:"#7ab87a",fontSize:"11px"}}>KML/SHP fails → skice ar koordinātām un PDF VMD iesniegumam</div>
<div style={{display:"flex",gap:4,flexWrap:"wrap",marginTop:6}}>
  {["📏 Caurmēri","🌲 Dastojums","⬇ SHP","🧾 Rēķins*"].map((t,i)=>(
    <span key={i} style={{fontSize:"10px",background:"rgba(76,175,80,0.1)",color:"#4a7a4a",padding:"2px 6px",borderRadius:4,border:"1px solid #1e3a1e"}}>{t}</span>
  ))}
  <div style={{fontSize:"10px",color:"#4a7a4a",marginTop:4,width:"100%"}}>* Rēķins pieejams pēc skices izveides</div>
</div>
        </div>
        <div onClick={()=>setPage("cirsma")} style={{background:"#1a3a1a",border:"1px solid #2d4a2d",borderRadius:"6px",padding:"10px 12px",cursor:"pointer"}}>
          <div style={{display:"flex",alignItems:"center",gap:"8px",marginBottom:"3px"}}>
            <span style={{fontSize:"16px"}}>🌲</span>
            <span style={{color:"white",fontSize:"13px",fontWeight:"bold"}}>Cirsmas novērtēšana</span>
          </div>
          <div style={{color:"#7ab87a",fontSize:"11px"}}>PDF no VMD → nogabalu analīze, cirsmas vērtība, ieteikumi</div>
        </div>
        
      </div>
    </div>

    {/* MOBILIE */}
    <div style={{background:"#111f11",border:"1px solid #1e2e1e",borderRadius:"10px",padding:"14px",marginBottom:"12px"}}>
      <div style={{color:"#4caf50",fontSize:"11px",fontWeight:"bold",textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:"10px",paddingBottom:"6px",borderBottom:"1px solid #2d4a2d"}}>📱 Laukā & birojā</div>
      <div onClick={()=>setPage("mobilie")} style={{background:"#1a3a1a",border:"1px solid #2d4a2d",borderRadius:"6px",padding:"14px 12px",cursor:"pointer",display:"flex",alignItems:"center",gap:"12px"}}>
        <span style={{fontSize:"32px"}}>📱</span>
        <div>
          <div style={{color:"white",fontSize:"14px",fontWeight:"bold",marginBottom:"4px"}}>Mobilie rīki</div>
          <div style={{color:"#7ab87a",fontSize:"11px"}}>Kubikmetru kalkulators, caurmērs, cirsmas vērtēšana, pavadzīmes</div>
        </div>
        <span style={{color:"#4caf50",fontSize:"20px",marginLeft:"auto"}}>→</span>
      </div>
    </div>
{/* MĒRĪJUMI */}
    <div style={{background:"#111f11",border:"1px solid #1e2e1e",borderRadius:"10px",padding:"14px"}}>
      <div style={{color:"#4caf50",fontSize:"11px",fontWeight:"bold",textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:"10px",paddingBottom:"6px",borderBottom:"1px solid #2d4a2d"}}>📏 Mērījumi & Aprēķini</div>
      <div style={{display:"flex",flexDirection:"column",gap:"8px"}}>
        
        
       <div onClick={()=>setPage("dastojums_pdf")} style={{background:"#1a3a1a",border:"1px solid #2d4a2d",borderRadius:"6px",padding:"10px 12px",cursor:"pointer"}}>
          <div style={{display:"flex",alignItems:"center",gap:"8px",marginBottom:"3px"}}>
            <span style={{fontSize:"16px"}}>📄</span>
            <span style={{color:"white",fontSize:"13px",fontWeight:"bold"}}>Dastojuma kalkulators</span>
          </div>
          <div style={{color:"#7ab87a",fontSize:"11px"}}>Mežvērtes PDF → sortimentu apjomi, krautuves vērtība, izdruka</div>
        </div>
        <div onClick={()=>setPage("logistika")} style={{background:"#1a3a1a",border:"1px solid #2d4a2d",borderRadius:"6px",padding:"10px 12px",cursor:"pointer"}}>
          <div style={{display:"flex",alignItems:"center",gap:"8px",marginBottom:"3px"}}>
            <span style={{fontSize:"16px"}}>🚛</span>
            <span style={{color:"white",fontSize:"13px",fontWeight:"bold"}}>Loģistikas kalkulators</span>
          </div>
          <div style={{color:"#7ab87a",fontSize:"11px"}}>Sortimenti → optimālā piegādes vieta, transports, NETO</div>
        </div>
      </div>
    </div>

    {/* BIZNESS + PAPILDRĪKI */}
    <div style={{display:"flex",flexDirection:"column",gap:"12px"}}>
      <div style={{background:"#0f2b0f",border:"1px solid #2d4a2d",borderRadius:"10px",padding:"14px",flex:1}}>
        <div style={{color:"#e65100",fontSize:"11px",fontWeight:"bold",textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:"10px",paddingBottom:"6px",borderBottom:"1px solid #2d4a2d"}}>💼 Bizness</div>
        <div onClick={()=>setPage("rekini")} style={{background:"#1a3a1a",border:"1px solid #2d4a2d",borderRadius:"6px",padding:"10px 12px",cursor:"pointer"}}>
          <div style={{display:"flex",alignItems:"center",gap:"8px",marginBottom:"3px"}}>
            <span style={{fontSize:"16px"}}>🧾</span>
            <span style={{color:"white",fontSize:"13px",fontWeight:"bold"}}>Rēķinu krātuve</span>
          </div>
         <div style={{color:"#ffaa70",fontSize:"11px"}}>Rēķinu izveide, drukāšana, mēneša un gada pārskats</div>
        </div>
        <div onClick={()=>setPage("pavadzimes")} style={{background:"#1a3a1a",border:"1px solid #2d4a2d",borderRadius:"6px",padding:"10px 12px",cursor:"pointer",marginTop:"8px"}}>
          <div style={{display:"flex",alignItems:"center",gap:"8px",marginBottom:"3px"}}>
            <span style={{fontSize:"16px"}}>📋</span>
            <span style={{color:"white",fontSize:"13px",fontWeight:"bold"}}>Pavadzīmju reģistrs</span>
          </div>
          <div style={{color:"#ffaa70",fontSize:"11px"}}>Foto → OCR → automātiska reģistrācija</div>
        </div>
        <div onClick={()=>setPage("rpandras")} style={{background:"#1a3a1a",border:"1px solid #4caf50",borderRadius:"6px",padding:"10px 12px",cursor:"pointer",marginTop:"8px"}}>
          <div style={{display:"flex",alignItems:"center",gap:"8px",marginBottom:"3px"}}>
            <span style={{fontSize:"16px"}}>🌲</span>
            <span style={{color:"#4caf50",fontSize:"13px",fontWeight:"bold"}}>RP Andras portāls</span>
          </div>
          <div style={{color:"#ffaa70",fontSize:"11px"}}>Vadības panelis — algas, rēķini, Excel</div>
        </div>
      </div>
      <div style={{background:"#0f1a0f",border:"1px solid #1a2a1a",borderRadius:"10px",padding:"14px"}}>
        <div style={{color:"#888",fontSize:"11px",fontWeight:"bold",textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:"8px",paddingBottom:"6px",borderBottom:"1px solid #1a2a1a"}}>🛠 Papildrīki</div>
        <div onClick={()=>setPage("pdfSkirotajs")} style={{background:"#111",border:"1px solid #1a2a1a",borderRadius:"6px",padding:"10px 12px",cursor:"pointer"}}>
          <div style={{display:"flex",alignItems:"center",gap:"8px",marginBottom:"3px"}}>
            <span style={{fontSize:"16px"}}>✂️</span>
            <span style={{color:"#aaa",fontSize:"13px",fontWeight:"bold"}}>PDF šķirotājs</span>
          </div>
          <div style={{color:"#666",fontSize:"11px"}}>Sadala VMD daudzīpašumu PDF pa kadastriem atsevišķos dokumentos</div>
        </div>
      </div>
    </div>

  </div>
</div>

<div style={{marginBottom:"12px",display:"flex",gap:"8px",flexWrap:"wrap",alignItems:"center"}}>
<a href="https://www.lvmgeo.lv/kartes" target="_blank" rel="noreferrer" style={{padding:"6px 14px",background:"#2e7d32",color:"white",borderRadius:"4px",textDecoration:"none",fontSize:"12px",fontWeight:"bold"}}>🗺 LVM GEO</a>
<a href="https://www.vmd.gov.lv" target="_blank" rel="noreferrer" style={{padding:"6px 14px",background:"#5d4037",color:"white",borderRadius:"4px",textDecoration:"none",fontSize:"12px",fontWeight:"bold"}}>🏛 VMD</a>
  {kadastrs && <>
    <span style={{fontSize:"12px"}}><b>Kadastrs:</b> {kadastrs} | <b>Saimniecība:</b> {saimnieciba}</span>
    <button onClick={()=>navigator.clipboard.writeText(kadastrs)} style={{padding:"6px 14px",background:"#555",color:"white",border:"none",borderRadius:"4px",fontSize:"12px",cursor:"pointer"}}>📋 Kopēt kadastru</button>
  </>}
</div>

<div style={{background:"#0f2b0f",border:"1px solid #2d4a2d",borderRadius:"8px",padding:"12px 16px",marginBottom:"12px",display:"flex",alignItems:"center",gap:"12px",flexWrap:"wrap"}}>
  <div>
    <div style={{color:"white",fontSize:"13px",fontWeight:"bold",marginBottom:"2px"}}>📂 Augšupielādēt VMD inventarizācijas PDF</div>
    <div style={{color:"#7ab87a",fontSize:"11px"}}>Meža inventarizācijas dokuments no VMD vai Mežvērtes — nogabalu apraksti, formula, vecums, krāja</div>
  </div>
  <label style={{padding:"8px 18px",background:"#225522",color:"white",borderRadius:"6px",cursor:"pointer",fontSize:"13px",fontWeight:"bold",whiteSpace:"nowrap",border:"1px solid #4caf50"}}>
    📄 Izvēlēties PDF
    <input type="file" accept="application/pdf" onChange={handlePDF} style={{display:"none"}}/>
  </label>
</div>

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
<button onClick={()=>{
  setShowJkParskats(true)
  setTimeout(()=>jkRef.current?.scrollIntoView({behavior:"smooth"}),100)
}} style={{padding:"6px 14px",background:"#2e7d32",color:"white",border:"none",borderRadius:"4px",cursor:"pointer",fontSize:"12px"}}>
  🪓 Jaunaudžu kopšanas pārskats
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
{jaunaudzes.length>0 && (
<div style={{background:"#e8f5e9",border:"1px solid #4caf50",borderRadius:"6px",padding:"12px",margin:"16px 0"}}>
<div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"8px",flexWrap:"wrap",gap:"8px"}}>
<b>🪓 Jaunaudžu kopšana nepieciešama</b>
<button onClick={()=>{
  setShowJkParskats(true)
  setTimeout(()=>jkRef.current?.scrollIntoView({behavior:"smooth"}),100)
}} style={{padding:"6px 14px",background:"#2e7d32",color:"white",border:"none",borderRadius:"4px",cursor:"pointer",fontSize:"12px"}}>
  🪓 Jaunaudžu kopšanas pārskats
</button>
</div>
<table border="1" cellPadding="6" style={{marginTop:"8px",width:"100%"}}>
<thead style={{background:"#4caf50",color:"white"}}>
<tr><th>Nog</th><th>Platība</th><th>Tips</th><th>Formula</th><th>JK gads</th><th>Jaun. sugu sastāvs</th><th>H (m)</th><th>Koki/ha</th></tr>
</thead>
<tbody>
{jaunaudzes.map((jk,i)=>(
<tr key={i} style={{background:jk.jkGads<=new Date().getFullYear()?"#ffcccc":"#f1f8f1"}}>
<td>{jk.nog}</td>
<td>{jk.platiba} ha</td>
<td>{jk.tips}</td>
<td>{jk.formula}</td>
<td><b style={{color:jk.jkGads<=new Date().getFullYear()?"#c62828":"#225522"}}>{jk.jkGads}</b></td>
<td><input style={{width:"100px",background:"white",color:"#111"}} value={jk.jaunkFormula||""} placeholder="p.ē. 10P" onChange={e=>{const n=[...jaunaudzes];n[i]={...n[i],jaunkFormula:e.target.value};setJaunaudzes(n)}}/></td>
<td><input type="number" style={{width:"45px",background:"white",color:"#111"}} value={jk.h||""} placeholder="m" onChange={e=>{const n=[...jaunaudzes];n[i]={...n[i],h:parseFloat(e.target.value)||0};setJaunaudzes(n)}}/></td>
<td><input type="number" style={{width:"55px",background:"white",color:"#111"}} value={jk.koki||""} placeholder="gab" onChange={e=>{const n=[...jaunaudzes];n[i]={...n[i],koki:Number(e.target.value)};setJaunaudzes(n)}}/></td>
</tr>
))}
</tbody>
</table>
</div>
)}
<div style={{maxHeight:"500px",overflow:"auto"}}>
<table border="1" cellPadding="6">
<thead style={{position:"sticky",top:0,background:"#1a3a1a"}}>
<tr>
<th style={{color:"#4caf50",padding:"8px 6px",fontSize:"11px",fontWeight:700,borderBottom:"2px solid #4caf50"}}>Nog</th><th style={{color:"#4caf50",padding:"8px 6px",fontSize:"11px",fontWeight:700,borderBottom:"2px solid #4caf50"}}>Platība</th><th style={{color:"#4caf50",padding:"8px 6px",fontSize:"11px",fontWeight:700,borderBottom:"2px solid #4caf50"}}>Tips</th><th style={{color:"#4caf50",padding:"8px 6px",fontSize:"11px",fontWeight:700,borderBottom:"2px solid #4caf50"}}>Formula</th><th style={{color:"#4caf50",padding:"8px 6px",fontSize:"11px",fontWeight:700,borderBottom:"2px solid #4caf50"}}>H</th><th style={{color:"#4caf50",padding:"8px 6px",fontSize:"11px",fontWeight:700,borderBottom:"2px solid #4caf50"}}>D</th><th style={{color:"#4caf50",padding:"8px 6px",fontSize:"11px",fontWeight:700,borderBottom:"2px solid #4caf50"}}>Vecums</th><th style={{color:"#4caf50",padding:"8px 6px",fontSize:"11px",fontWeight:700,borderBottom:"2px solid #4caf50"}}>Biez</th><th style={{color:"#4caf50",padding:"8px 6px",fontSize:"11px",fontWeight:700,borderBottom:"2px solid #4caf50"}}>G</th><th style={{color:"#4caf50",padding:"8px 6px",fontSize:"11px",fontWeight:700,borderBottom:"2px solid #4caf50"}}>Koki/ha</th><th style={{color:"#4caf50",padding:"8px 6px",fontSize:"11px",fontWeight:700,borderBottom:"2px solid #4caf50"}}>Ieteiktā cirte</th><th style={{color:"#4caf50",padding:"8px 6px",fontSize:"11px",fontWeight:700,borderBottom:"2px solid #4caf50"}}>Izvēlētā cirte</th><th style={{color:"#4caf50",padding:"8px 6px",fontSize:"11px",fontWeight:700,borderBottom:"2px solid #4caf50"}}>VMD krāja m³/ha</th><th style={{color:"#4caf50",padding:"8px 6px",fontSize:"11px",fontWeight:700,borderBottom:"2px solid #4caf50"}}>Aprēķ. krāja m³/ha</th><th style={{color:"#4caf50",padding:"8px 6px",fontSize:"11px",fontWeight:700,borderBottom:"2px solid #4caf50"}}>Cirsmas krāja m³</th><th style={{color:"#4caf50",padding:"8px 6px",fontSize:"11px",fontWeight:700,borderBottom:"2px solid #4caf50"}}>Vērtība €</th>
</tr>
</thead>
<tbody>
{rows.map((r,i)=>{
const calc=forestEngine(r)
const treeCount=r.g>100?r.g:r.koki>0?r.koki:""
return(
<tr key={i} onMouseEnter={()=>setHoverRow(i)} onMouseLeave={()=>setHoverRow(null)} style={{background:hoverRow===i?"#e8f5e9":"white", color:"#111"}}>
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
<td>{r.krm3ha||"—"}</td>
<td>{(()=>{const ff={P:0.45,E:0.48,B:0.52,A:0.42,Ba:0.38,Bl:0.38,M:0.46,Oz:0.52,Os:0.50,G:0.52};const sp=(r.formula?.match(/(\d+)(Bl|Ba|Oz|Os|P|E|B|A|M|G)/)||[])[2]||"B";return r.g&&r.h?(r.g*r.h*(ff[sp]||0.5)).toFixed(0):"—"})()}</td>
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
<div style={{margin:"16px 0",padding:"12px",background:"#f0f8f0",border:"1px solid #225522",borderRadius:"6px",color:"#111"}}>
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


<br/><br/>
<h2 style={{color:"#4caf50",fontSize:"16px",fontWeight:600,marginBottom:"12px",letterSpacing:"0.05em",textTransform:"uppercase"}}>Sortimentu sadalījums</h2>
<table style={{borderCollapse:"collapse",width:"260px"}}>
<thead><tr style={{borderBottom:"2px solid #2d5a2d"}}>
<th style={{color:"#4caf50",padding:"8px 12px",textAlign:"left",fontSize:"11px",fontWeight:700}}>Sortiments</th>
<th style={{color:"#4caf50",padding:"8px 12px",textAlign:"right",fontSize:"11px",fontWeight:700}}>m³</th>
<th style={{color:"#4caf50",padding:"8px 12px",textAlign:"right",fontSize:"11px",fontWeight:700}}>Cena €</th>
<th style={{color:"#4caf50",padding:"8px 12px",textAlign:"right",fontSize:"11px",fontWeight:700}}>Vērtība €</th>
</tr></thead>
<tbody>
{Object.keys(sortimentTotals).filter(k=>activeSort[k]!==false).map((k,i)=>{
const volume=sortimentTotals[k],price=prices[k]||0
return(<tr key={k} style={{borderBottom:"1px solid #1e3a1e",background:i%2===0?"#0f1a0f":"#111f11"}}>
<td style={{padding:"7px 12px",fontSize:"12px",color:"#e8f0e8"}}>{sortimentNames[k]}</td>
<td style={{padding:"7px 12px",fontSize:"12px",color:"#e8f0e8",textAlign:"right"}}>{volume.toFixed(1)}</td>
<td style={{padding:"7px 12px",fontSize:"12px",color:"#7ab87a",textAlign:"right"}}>{price}</td>
<td style={{padding:"7px 12px",fontSize:"12px",color:"#4caf50",fontWeight:600,textAlign:"right"}}>{(volume*price).toFixed(0)}</td>
</tr>)
})}
{extraSorts.map((s,i)=>(<tr key={"extra"+i}><td>{s.name}</td><td>{(s.volume||0).toFixed(1)}</td><td>{s.price||0}</td><td>{((s.volume||0)*(s.price||0)).toFixed(0)}</td></tr>))}
</tbody>
</table>

<br/>
<div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:"12px",margin:"20px 0",background:"#0f2b0f",borderRadius:"10px",padding:"16px",border:"1px solid #2d4a2d"}}>
  <div style={{textAlign:"center",padding:"12px",background:"#1a3a1a",borderRadius:"8px"}}>
    <div style={{color:"#7ab87a",fontSize:"11px",marginBottom:"4px"}}>Kopējā krāja</div>
    <div style={{color:"white",fontSize:"20px",fontWeight:"bold"}}>{totalVolume.toFixed(1)} m³</div>
  </div>
  <div style={{textAlign:"center",padding:"12px",background:"#1a3a1a",borderRadius:"8px"}}>
    <div style={{color:"#7ab87a",fontSize:"11px",marginBottom:"4px"}}>Sortimentu vērtība</div>
    <div style={{color:"#4caf50",fontSize:"20px",fontWeight:"bold"}}>{totalMoney.toFixed(0)} €</div>
  </div>
  <div style={{textAlign:"center",padding:"12px",background:"#1a3a1a",borderRadius:"8px"}}>
    <div style={{color:"#7ab87a",fontSize:"11px",marginBottom:"4px"}}>Zemes vērtība</div>
    <div style={{color:"#4caf50",fontSize:"20px",fontWeight:"bold"}}>{totalLandValue.toFixed(0)} €</div>
  </div>
  <div style={{textAlign:"center",padding:"12px",background:"#1a3a1a",borderRadius:"8px"}}>
    <div style={{color:"#7ab87a",fontSize:"11px",marginBottom:"4px"}}>Krautuves vērtība</div>
    <div style={{color:"#4caf50",fontSize:"20px",fontWeight:"bold"}}>{roadsideValue.toFixed(0)} €</div>
  </div>
  <div style={{textAlign:"center",padding:"16px",background:"#225522",borderRadius:"8px",border:"1px solid #4caf50"}}>
    <div style={{color:"#a8d8a8",fontSize:"11px",marginBottom:"4px"}}>Saimnieciskā vērtība</div>
    <div style={{color:"white",fontSize:"24px",fontWeight:"bold"}}>{economicValueTotal.toFixed(0)} €</div>
  </div>
  <div style={{textAlign:"center",padding:"16px",background:"#1b5e20",borderRadius:"8px",border:"2px solid #4caf50"}}>
    <div style={{color:"#a8d8a8",fontSize:"11px",marginBottom:"4px"}}>Tirgus vērtība</div>
    <div style={{color:"#4caf50",fontSize:"28px",fontWeight:"bold"}}>{marketValue.toFixed(0)} €</div>
  </div>
</div>
{stadijumuVertiba>0&&<p style={{color:"#225522",fontWeight:"bold"}}>* Stādījumu vērtība: {stadijumuVertiba.toFixed(0)} € (1500 €/ha)</p>}

</div>
)
}

export default App