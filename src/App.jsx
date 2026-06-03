import React, { useState } from "react"
import { useAuth } from "./useAuth"
import RegModal from "./RegModal"
import * as pdfjsLib from "pdfjs-dist"
// Eager — vajadzīgi uzreiz vai lieto named exports
import StandardPage, { JaunaudžuParskats, AtjaunosanaParskats, IeaudzesanaParskats } from "./StandardPage"
import GlobalHeader from "./GlobalHeader"
import MainPage from "./MainPage"
import LandingPage from "./LandingPage"

// Lazy — ielādē tikai tad kad lietotājs atvērs šo lapu
const CirsmaNovertesanaPage  = React.lazy(() => import("./CirsmaNovertesanaPage"))
const PdfSkirotajsPage       = React.lazy(() => import("./PdfSkirotajsPage"))
const SludinajumiPage        = React.lazy(() => import("./SludinajumiPage"))
const CaurmeraMobile         = React.lazy(() => import("./CaurmeraMobile"))
const CirsmaNovertesanaMobile= React.lazy(() => import("./CirsmaNovertesanaMobile"))
const DastojumsPDFKalkulators= React.lazy(() => import("./DastojumsPDFKalkulators"))
const ChatPage               = React.lazy(() => import("./ChatPage"))
const DastojumuRegistrsPage  = React.lazy(() => import("./DastojumuRegistrsPage"))
const KubiKalkulators        = React.lazy(() => import("./KubiKalkulators"))
const LogistikaKalkulators   = React.lazy(() => import("./LogistikaKalkulators"))
const MobilajiRiki           = React.lazy(() => import("./MobilajiRiki"))
const KrautuvesMeritajsPage  = React.lazy(() => import("./KrautuvesMeritajsPage"))
const DastojumsMeritajsPage  = React.lazy(() => import("./DastojumsMeritajsPage"))
const SubscriptionPage       = React.lazy(() => import("./SubscriptionPage"))
const MaksajumsPaldies       = React.lazy(() => import("./MaksajumsPaldies"))
const JautaParMezuPage       = React.lazy(() => import("./JautaParMezuPage"))
const TirgusLapa             = React.lazy(() => import("./kopiena/TirgusLapa"))
const AdminDashboard         = React.lazy(() => import("./AdminDashboard"))
const PrivatumsPage          = React.lazy(() => import("./PrivatumsPage"))
const CirsmaskicePage        = React.lazy(() => import("./CirsmaskicePage"))
const CaurmeraPage           = React.lazy(() => import("./CaurmeraPage"))
const AtjaunosanaPage        = React.lazy(() => import("./AtjaunosanaPage"))
const RekinuKratuve          = React.lazy(() => import("./RekinuKratuve"))
const ParoleLapa             = React.lazy(() => import("./ParoleLapa"))
const CenuKalkulators        = React.lazy(() => import("./CenuKalkulators"))
const PircejuCenas           = React.lazy(() => import("./PircejuCenas"))
import { supabase } from "./supabaseClient"
import { C as DS, F, spinnerCSS } from "./ds"

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
"pdfjs-dist/build/pdf.worker.min.mjs",
import.meta.url
).toString()
// ========== APP ==========

function App(){
// Montonio return URL pārbaude — ja ?payment=success, rāda paldies lapu
const urlParams = new URLSearchParams(window.location.search)
const initialPage = urlParams.get('payment') === 'success'
  ? 'maksajums_paldies'
  : urlParams.get('reset') === '1'
  ? 'parole'
  : 'landing'

const [page,setPageRaw]=useState(initialPage)
const { user, loading: authLoading, registreties, pieteikties, iziet, mainitParoli, nosutitParolesReset } = useAuth()

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

const [izcirtumi,  setIzcirtumi]  = useState([])
const [kadastrs,   setKadastrs]   = useState("")
const [saimnieciba,setSaimnieciba]= useState("")

const [skirotajsState,setSkirotajsState]=useState(null)
const [dastojumsPdfFile,setDastojumsPdfFile]=useState(null)
const [cirsmaState,setCirsmaState]=useState(null)
const [skiceState,setSkiceState]=useState(null)
const [caurmersState,setCaurmersState]=useState(null)
if(authLoading) return <div style={{minHeight:"100vh",background:"#080f08",display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:16}}><div style={{width:40,height:40,border:"3px solid #2d4a2d",borderTop:"3px solid #4caf50",borderRadius:"50%",animation:"spin 1s linear infinite"}}/><style>{"@keyframes spin{to{transform:rotate(360deg)}}"}</style><div style={{color:"#4a7a4a",fontSize:14}}>Ielādē...</div></div>

if(page==="sludinajumi") return <>
  <SludinajumiPage user={user} onBack={()=>setPage("main")}/>
  {showReg && <RegModal onRegistreties={async(d)=>{await registreties(d);setShowReg(false);if(regAtpakal)setPage(regAtpakal)}} onPieteikties={async(d)=>{await pieteikties(d);setShowReg(false);if(regAtpakal)setPage(regAtpakal)}} onAizvērt={()=>setShowReg(false)} nosutitParolesReset={nosutitParolesReset}/>}
</>
if(page==="landing") return <>
  <LandingPage onEnter={()=>setPage("main")} onStandard={()=>setPage("standard")} user={user} onIziet={iziet} onReg={()=>atvertReg("landing")} onSludinajumi={()=>setPage("sludinajumi")} onLikumi={()=>setPage("jautaparmezu")} onTirgus={()=>setPage("tirgus")} onPrivatums={()=>setPage("privatums")}/>
  {showReg && <RegModal onRegistreties={async(d)=>{await registreties(d);setShowReg(false);if(regAtpakal)setPage(regAtpakal)}} onAizvērt={()=>setShowReg(false)} nosutitParolesReset={nosutitParolesReset}/>}
</>
if(page==="standard") return <>
  <StandardPage
    onBack={()=>setPage("main")}
    user={user}
    onReg={()=>atvertReg("standard")}
    onPilna={(data)=>{
      if(data){
        setIzcirtumi(data.izcirtumi||[])
        setKadastrs(data.kadastrs||"")
        setSaimnieciba(data.saimnieciba||"")
      }
      setPage("cirsma")
    }}
  />
  {showReg && <RegModal onRegistreties={async(d)=>{await registreties(d);setShowReg(false);if(regAtpakal)setPage(regAtpakal)}} onPieteikties={async(d)=>{await pieteikties(d);setShowReg(false);if(regAtpakal)setPage(regAtpakal)}} onAizvērt={()=>setShowReg(false)} nosutitParolesReset={nosutitParolesReset}/>}
</>
if(page==="pdfSkirotajs") return <PdfSkirotajsPage onBack={()=>setPage("main")} savedState={skirotajsState} onSaveState={setSkirotajsState} onOpenDastojums={(file)=>{setDastojumsPdfFile(file); setPage("dastojumsPDF")}}/>
if(page==="cirsma") return <>
  <CirsmaNovertesanaPage onBack={()=>setPage("main")} kadastrsIn={kadastrs} saimniecibaIn={saimnieciba} savedState={cirsmaState} onSaveState={setCirsmaState} user={user} onReg={()=>atvertReg("cirsma")}/>
  {showReg && <RegModal onRegistreties={async(d)=>{await registreties(d);setShowReg(false);if(regAtpakal)setPage(regAtpakal)}} onAizvērt={()=>setShowReg(false)} nosutitParolesReset={nosutitParolesReset}/>}
</>
if(page==="atjaunosana") return <AtjaunosanaPage onBack={()=>setPage("main")} izcirtumi={izcirtumi} kadastrs={kadastrs} saimnieciba={saimnieciba}/>
if(page==="skice") return <>
  <CirsmaskicePage onBack={()=>setPage("main")} kadastrsIn={kadastrs} saimniecibaIn={saimnieciba} savedState={skiceState} onSaveState={setSkiceState} user={user} onReg={()=>atvertReg("skice")}/>
  {showReg && <RegModal onRegistreties={async(d)=>{await registreties(d);setShowReg(false);if(regAtpakal)setPage(regAtpakal)}} onAizvērt={()=>setShowReg(false)} nosutitParolesReset={nosutitParolesReset}/>}
</>
if(page==="caurmers") return <CaurmeraPage onBack={()=>setPage("main")} savedState={caurmersState} onSaveState={setCaurmersState}/>
if(page==="rekini") return <>
  <RekinuKratuve onBack={()=>setPage("main")} user={user} onReg={()=>atvertReg("rekini")}/>
  {showReg && <RegModal onRegistreties={async(d)=>{await registreties(d);setShowReg(false);if(regAtpakal)setPage(regAtpakal)}} onPieteikties={async(d)=>{await pieteikties(d);setShowReg(false);if(regAtpakal)setPage(regAtpakal)}} onAizvērt={()=>setShowReg(false)} nosutitParolesReset={nosutitParolesReset}/>}
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
if(page==="dastojums") { setPage("dastojums_pdf"); return null }
if(page==="privatums") return <PrivatumsPage onBack={()=>setPage("landing")}/>
if(page==="parole")  return <ParoleLapa onBack={()=>setPage("main")} mainitParoli={mainitParoli}/>
if(page==="cenas")        return <CenuKalkulators onBack={()=>setPage("main")}/>
if(page==="pirceja_cenas") return <PircejuCenas onBack={()=>setPage("main")} user={user}/>
if(page==="admin" && user?.epasts === "jeshkaa@inbox.lv") return <AdminDashboard onBack={()=>setPage("main")}/>
if(page==="main") return <>
  <MainPage onNavigate={setPage} user={user} onReg={()=>atvertReg("main")} onIziet={iziet}/>
  {showReg && <RegModal onRegistreties={async(d)=>{await registreties(d);setShowReg(false);if(regAtpakal)setPage(regAtpakal)}} onPieteikties={async(d)=>{await pieteikties(d);setShowReg(false);if(regAtpakal)setPage(regAtpakal)}} onAizvērt={()=>setShowReg(false)} nosutitParolesReset={nosutitParolesReset}/>}
</>


return null
}

export default App
