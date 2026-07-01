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
const VeikalsPage            = React.lazy(() => import("./VeikalsPage"))
const PrivatumsPage          = React.lazy(() => import("./PrivatumsPage"))
const CirsmaskicePage        = React.lazy(() => import("./CirsmaskicePage"))
const CaurmeraPage           = React.lazy(() => import("./CaurmeraPage"))
const AtjaunosanaPage        = React.lazy(() => import("./AtjaunosanaPage"))
const RekinuKratuve          = React.lazy(() => import("./RekinuKratuve"))
const ParoleLapa             = React.lazy(() => import("./ParoleLapa"))
const CenuKalkulators        = React.lazy(() => import("./CenuKalkulators"))
const PircejuCenas           = React.lazy(() => import("./PircejuCenas"))
const IpasumAnalīze              = React.lazy(() => import("./IpasumAnalīze"))
const MezaApsaimniekosanasPlans  = React.lazy(() => import("./MezaApsaimniekosanasPlans"))
const GramatvedisPage            = React.lazy(() => import("./gramatvedis/GramatvedisPage"))
const SelekcijasKalkulators      = React.lazy(() => import("./SelekcijasKalkulators"))
const JuristsPage                = React.lazy(() => import("./JuristsPage"))
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
  : urlParams.get('page') === 'veikals'
  ? 'veikals'
  : urlParams.get('page') === 'admin'
  ? 'admin'
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
  if (userRef.current?.id) {
    try {
      supabase.from('app_events').insert({
        user_id: userRef.current.id,
        tips: 'navigacija',
        dati: { lapa },
      }).then(() => {}).catch(() => {})
    } catch { /* ignorē */ }
  }
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
if(page==="admin") {
  const pinOk = localStorage.getItem('mt_admin_ok') === '1'
  if(!pinOk) return (
    <div style={{minHeight:'100vh',background:'#080f08',display:'flex',alignItems:'center',justifyContent:'center'}}>
      <form onSubmit={e=>{e.preventDefault();const v=e.target.pin.value;if(v==='2509'){localStorage.setItem('mt_admin_ok','1');setPageRaw('admin')}else{alert('Nepareizs PIN')}}}
        style={{background:'#0f1f0f',border:'1px solid #2d4a2d',borderRadius:12,padding:32,display:'flex',flexDirection:'column',gap:12,minWidth:280}}>
        <div style={{color:'#4caf50',fontSize:18,fontWeight:700,textAlign:'center'}}>🔒 Admin PIN</div>
        <input name="pin" type="password" autoFocus placeholder="PIN kods" maxLength={6}
          style={{padding:'10px 14px',borderRadius:8,border:'1px solid #2d4a2d',background:'#0a150a',color:'#e0e0e0',fontSize:16,textAlign:'center',letterSpacing:8,outline:'none'}}/>
        <button type="submit" style={{padding:'10px',borderRadius:8,background:'#2e7d32',color:'#fff',border:'none',fontSize:14,fontWeight:700,cursor:'pointer'}}>Ienākt</button>
      </form>
    </div>
  )
  if(authLoading) return <div style={{minHeight:"100vh",background:"#080f08",display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:16}}><div style={{width:40,height:40,border:"3px solid #2d4a2d",borderTop:"3px solid #4caf50",borderRadius:"50%",animation:"spin 1s linear infinite"}}/><style>{"@keyframes spin{to{transform:rotate(360deg)}}"}</style><div style={{color:"#4a7a4a",fontSize:14}}>Ielādē...</div></div>
  return (
    <React.Suspense fallback={<div style={{minHeight:"100vh",background:"#080f08",display:"flex",alignItems:"center",justifyContent:"center"}}><div style={{color:"#4caf50"}}>Ielādē...</div></div>}>
      <AdminDashboard onBack={()=>setPage("main")} onNavigate={setPage}/>
    </React.Suspense>
  )
}
if(authLoading) return <div style={{minHeight:"100vh",background:"#080f08",display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:16}}><div style={{width:40,height:40,border:"3px solid #2d4a2d",borderTop:"3px solid #4caf50",borderRadius:"50%",animation:"spin 1s linear infinite"}}/><style>{"@keyframes spin{to{transform:rotate(360deg)}}"}</style><div style={{color:"#4a7a4a",fontSize:14}}>Ielādē...</div></div>

if(page==="sludinajumi") return <>
  <SludinajumiPage user={user} onBack={()=>setPage("main")}/>
  {showReg && <RegModal onRegistreties={async(d)=>{await registreties(d);setShowReg(false);if(regAtpakal)setPage(regAtpakal)}} onPieteikties={async(d)=>{await pieteikties(d);setShowReg(false);if(regAtpakal)setPage(regAtpakal)}} onAizvērt={()=>setShowReg(false)} nosutitParolesReset={nosutitParolesReset}/>}
</>
if(page==="landing") return <>
  <LandingPage onEnter={()=>setPage("main")} onStandard={()=>setPage("standard")} user={user} onIziet={iziet} onReg={()=>atvertReg("landing")} onSludinajumi={()=>setPage("sludinajumi")} onLikumi={()=>setPage("jautaparmezu")} onTirgus={()=>setPage("tirgus")} onPrivatums={()=>setPage("privatums")} onIpasums={()=>setPage("ipasums")} onVeikals={()=>setPage("veikals")} onAdmin={()=>setPage("admin")}/>
  {showReg && <RegModal onRegistreties={async(d)=>{await registreties(d);setShowReg(false);if(regAtpakal)setPage(regAtpakal)}} onAizvērt={()=>setShowReg(false)} nosutitParolesReset={nosutitParolesReset}/>}
</>
if(page==="ipasums") return (
  <React.Suspense fallback={<div style={{minHeight:"100vh",background:"#080f08",display:"flex",alignItems:"center",justifyContent:"center"}}><div style={{color:"#4caf50",fontSize:16}}>Ielādē...</div></div>}>
    <IpasumAnalīze onBack={()=>setPage("main")} user={user} />
  </React.Suspense>
)
if(page==="map-plans") {
  const isAdmin = localStorage.getItem('mt_admin_ok') === '1'
  if (!isAdmin) return (
    <div style={{minHeight:'100vh',background:'#080f08',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',fontFamily:'sans-serif',padding:24}}>
      <div style={{fontSize:52,marginBottom:16}}>🌳</div>
      <div style={{fontSize:22,fontWeight:700,color:'#4caf50',marginBottom:8,textAlign:'center'}}>Meža apsaimniekošanas plāns</div>
      <div style={{fontSize:15,color:'#81c784',marginBottom:32,textAlign:'center',maxWidth:340}}>Produkts šobrīd ir izstrādes stadijā un drīzumā būs pieejams.</div>
      <button onClick={()=>setPage('main')} style={{padding:'10px 28px',borderRadius:8,background:'#2e7d32',color:'#fff',border:'none',fontSize:14,fontWeight:600,cursor:'pointer'}}>← Atpakaļ</button>
    </div>
  )
  return (
    <React.Suspense fallback={<div style={{minHeight:"100vh",background:"#080f08",display:"flex",alignItems:"center",justifyContent:"center"}}><div style={{color:"#4caf50",fontSize:16}}>Ielādē...</div></div>}>
      <MezaApsaimniekosanasPlans onBack={()=>setPage("main")} />
    </React.Suspense>
  )
}
if(page==="gramatvedis") {
  const isAdmin = localStorage.getItem('mt_admin_ok') === '1'
  if (!isAdmin) return (
    <div style={{minHeight:'100vh',background:'#080f08',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',fontFamily:'sans-serif',padding:24}}>
      <div style={{fontSize:52,marginBottom:16}}>📊</div>
      <div style={{fontSize:22,fontWeight:700,color:'#4caf50',marginBottom:8,textAlign:'center'}}>Grāmatvedis</div>
      <div style={{fontSize:15,color:'#81c784',marginBottom:32,textAlign:'center',maxWidth:340}}>Šī sadaļa ir pieejama tikai administratoriem.</div>
      <button onClick={()=>setPage('main')} style={{padding:'10px 28px',borderRadius:8,background:'#2e7d32',color:'#fff',border:'none',fontSize:14,fontWeight:600,cursor:'pointer'}}>← Atpakaļ</button>
    </div>
  )
  return (
    <React.Suspense fallback={<div style={{minHeight:"100vh",background:"#080f08",display:"flex",alignItems:"center",justifyContent:"center"}}><div style={{color:"#4caf50",fontSize:16}}>Ielādē...</div></div>}>
      <GramatvedisPage onBack={()=>setPage("main")} />
    </React.Suspense>
  )
}
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
if(page==="dastojums_pdf") return <DastojumsPDFKalkulators onBack={()=>setPage("main")} onNavigateLogistika={()=>setPage("logistika")}/>
if(page==="kubi") return <KubiKalkulators onBack={()=>setPage("main")}/>
if(page==="krautuves_meritajs")  return <KrautuvesMeritajsPage  onBack={()=>setPage("main")}/>
if(page==="dastojums_meritajs") return <DastojumsMeritajsPage onBack={()=>setPage("main")}/>
if(page==="subscription")      return <SubscriptionPage onBack={()=>setPage("main")} onNavigate={setPage} user={user}/>
if(page==="maksajums_paldies") return <MaksajumsPaldies onTurpina={()=>setPage("main")}/>
if(page==="tirgus") return <TirgusLapa user={user} onNavigate={setPage} onReg={()=>atvertReg("tirgus")}/>
if(page==="jautaparmezu")     return <JautaParMezuPage onBack={()=>setPage("main")}/>
if(page==="mobilie") return <MobilajiRiki onBack={()=>setPage("main")} onNavigate={(p)=>setPage(p)}/>
if(page==="dastojumsPDF") return <DastojumsPDFKalkulators onBack={()=>setPage("main")} initialFile={dastojumsPdfFile} onNavigateLogistika={()=>setPage("logistika")}/>
if(page==="pavadzimes") return <DastojumuRegistrsPage onBack={()=>setPage("main")} user={user} onReg={()=>atvertReg("pavadzimes")}/>
if(page==="rpandras") return <DastojumuRegistrsPage onBack={()=>setPage("main")} user={user} onReg={()=>atvertReg("rpandras")}/>
if(page==="logistika") return <LogistikaKalkulators onBack={()=>setPage("main")}/>
if(page==="selektors") return <SelekcijasKalkulators onBack={()=>setPage("main")}/>
if(page==="jurists") return (
  <React.Suspense fallback={<div style={{minHeight:"100vh",background:"#050a14",display:"flex",alignItems:"center",justifyContent:"center"}}><div style={{color:"#42a5f5"}}>Ielādē...</div></div>}>
    <JuristsPage onBack={()=>setPage("main")}/>
  </React.Suspense>
)
if(page==="dastojums") { setPage("dastojums_pdf"); return null }
if(page==="privatums") return <PrivatumsPage onBack={()=>setPage("landing")}/>
if(page==="parole")  return <ParoleLapa onBack={()=>setPage("main")} mainitParoli={mainitParoli}/>
if(page==="cenas")        return <CenuKalkulators onBack={()=>setPage("main")}/>
if(page==="pirceja_cenas") return <PircejuCenas onBack={()=>setPage("main")} user={user}/>
if(page==="veikals") {
  const isAdmin = localStorage.getItem('mt_admin_ok') === '1'
  if (!isAdmin) return (
    <div style={{minHeight:'100vh',background:'#f9f6f1',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',fontFamily:'Georgia,serif',padding:24}}>
      <div style={{fontSize:48,marginBottom:16}}>🌲</div>
      <div style={{fontSize:22,fontWeight:700,color:'#2e4a1e',marginBottom:8,textAlign:'center'}}>Meža Tirgus Veikals</div>
      <div style={{fontSize:15,color:'#5a7a4a',marginBottom:32,textAlign:'center',maxWidth:340}}>Veikals šobrīd ir izstrādes stadijā un drīzumā tiks atvērts.</div>
      <div style={{fontSize:13,color:'#8a9a7a',marginBottom:32,textAlign:'center'}}>Sekojiet jaunumiem mūsu mājaslapā.</div>
      <button onClick={()=>setPage('landing')} style={{padding:'10px 28px',borderRadius:8,background:'#2e7d32',color:'#fff',border:'none',fontSize:14,fontWeight:600,cursor:'pointer'}}>← Atpakaļ</button>
    </div>
  )
  return (
    <React.Suspense fallback={<div style={{minHeight:"100vh",background:"#fff",display:"flex",alignItems:"center",justifyContent:"center"}}><div style={{color:"#2e7d32",fontSize:14}}>Ielādē veikalu...</div></div>}>
      <VeikalsPage onBack={()=>setPage("main")} user={user}/>
    </React.Suspense>
  )
}
if(page==="main") return <>
  <MainPage onNavigate={setPage} user={user} onReg={()=>atvertReg("main")} onIziet={iziet}/>
  {showReg && <RegModal onRegistreties={async(d)=>{await registreties(d);setShowReg(false);if(regAtpakal)setPage(regAtpakal)}} onPieteikties={async(d)=>{await pieteikties(d);setShowReg(false);if(regAtpakal)setPage(regAtpakal)}} onAizvērt={()=>setShowReg(false)} nosutitParolesReset={nosutitParolesReset}/>}
</>


return (
  <div onClick={()=>setPage('admin')} title="Admin" style={{position:'fixed',bottom:16,right:16,width:36,height:36,borderRadius:'50%',background:'rgba(15,31,15,0.85)',border:'1px solid #2d4a2d',display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',fontSize:16,zIndex:9999,backdropFilter:'blur(4px)'}}>
    🔒
  </div>
)
}

export default App
