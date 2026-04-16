import { useState } from "react"
import { getBonitate } from "./bonityEngine"
import { formFactor, GminTable, GkritTable } from "./tables"

const STORAGE_KEY = 'cirsma_mobile_v3'
const SUGAS_SARAKSTS = ["P","E","Lg","B","Ba","Bl","A","Oz","Os","G","M"]
const KVALITATES = ["A1","A","B","C","D","Papīrmalka","Malka"]
const AUGSNES_TIPI = ["Sl","Mr","Vr","Dm","Db","Nd","Vrs","Ds","Ks","Lk","Pv","Kp","As","Ap","Ln","Gr"]
const PIEVESANA = ["Visu gadu","Sausa vasara","Vasara/Ziemā","Tikai ziemā"]
const CIRTE_VEIDS = ["Galvenā cirte","Kopšanas cirte","Sanitārā cirte"]
const CIRTE_IZPILDE = {
  "Galvenā cirte":["Kailcirte","Kailcirte pēc caurmēra","Izlases cirte"],
  "Kopšanas cirte":["Kopšanas cirte"],
  "Sanitārā cirte":["Sanitārā izlases cirte","Sanitārā kailcirte pēc VMD atzinuma"]
}
const KVALITATE_DESC = {
  A1:{krasa:"#1b5e20",teksts:"white",apraksts:"Izcila kvalitāte — taisns, pilnkokains stumbrs bez defektiem. Dominē zāģbaļķi."},
  A:{krasa:"#388e3c",teksts:"white",apraksts:"Augsta kvalitāte — nelielas formas novirzes, minimāli zarainuma defekti. Lielākā daļa zāģbaļķi."},
  B:{krasa:"#689f38",teksts:"white",apraksts:"Vidēja kvalitāte — izteiktāks zarainums vai formas novirzes. Aptuveni puse zāģbaļķi, puse papīrmalka."},
  C:{krasa:"#f9a825",teksts:"#333",apraksts:"Zema kvalitāte — ievērojami stumbra defekti, liela zarainums vai liektums. Galvenokārt papīrmalka."},
  D:{krasa:"#e65100",teksts:"white",apraksts:"Ļoti zema kvalitāte — trupe, mehāniski bojājumi, stiprs liektums. Gandrīz visa papīrmalka vai malka."},
  Papīrmalka:{krasa:"#5d4037",teksts:"white",apraksts:"Jaunaudze vai sīkkoks — P/E/Lg/B/A → papīrmalka+šķelda, pārējie → malka+šķelda."},
  Malka:{krasa:"#c62828",teksts:"white",apraksts:"Nokaltis vai sanitārā cirte — koksne izmantojama tikai malkai un šķeldai."},
}
const SORT_NAMES = {log:"Zāģbaļķi",small:"Sīkbaļķi",veneer:"Finieris",tara:"Tara",pulp:"Papīrmalka",fire:"Malka",chips:"Šķelda"}
const DEFAULT_PRICES = {log:93,small:65,veneer:130,tara:48,pulp:50,fire:38,chips:12}

const parseNum = (v) => parseFloat(String(v).replace(",",".")) || 0
const uid = () => Math.random().toString(36).slice(2)

const defaultVieta = () => ({id:uid(), merijumi:{}})
const defaultSugaData = (suga) => ({id:uid(), suga, h:"", diametri:[], kvalitate:"A", bonitate:""})
const defaultNogabals = (nr="1") => ({
  id:uid(), nr, platiba:"", augsneTips:"Vr",
  vecums:"", cirteVeids:"Galvenā cirte", cirteIzpilde:"Kailcirte", pievesana:"Visu gadu",
  vietas:[defaultVieta()],
  sugas:[],
  otrsStavs:false,
  otrsStavsVietas:[defaultVieta()],
  otraSStavaSugas:[],
  piezimes:""
})
const defaultCirsma = () => ({id:uid(), nogabali:[defaultNogabals("1")]})

function load() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)||'null') } catch(e) { return null }
}
function save(d) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(d)) } catch(e) {}
}

function calcSortimentiPecSugas(volume, suga, kvalitate, D, vecums, bon) {
  if(volume<=0) return {}
  const d = parseNum(D)
  const vec = parseNum(vecums)

  if(suga==="Ba"||suga==="Bl"||suga==="M") {
    return {tara:volume*0.45, fire:volume*0.40, chips:volume*0.10, pulp:volume*0.05}
  }
  if(suga==="G") {
    return {tara:volume*0.20, pulp:volume*0.10, fire:volume*0.55, chips:volume*0.15}
  }
  if(suga==="A") {
    if(d>=18) return {tara:volume*0.40, pulp:volume*0.40, fire:volume*0.15, chips:volume*0.05}
    return {tara:volume*0.20, pulp:volume*0.60, fire:volume*0.15, chips:volume*0.05}
  }
  if(suga==="Oz"||suga==="Os") {
    if(d>=30) return {log:volume*0.55, small:volume*0.20, tara:volume*0.10, pulp:volume*0.10, fire:volume*0.03, chips:volume*0.02}
    if(d>=20) return {log:volume*0.40, small:volume*0.25, tara:volume*0.15, pulp:volume*0.15, fire:volume*0.03, chips:volume*0.02}
    return {small:volume*0.30, pulp:volume*0.55, fire:volume*0.10, chips:volume*0.05}
  }
  if(suga==="B") {
    if(d<18) return {pulp:volume*0.85, fire:volume*0.10, chips:volume*0.05}
    if(bon==="Ia"||bon==="I") return {veneer:volume*0.30, tara:volume*0.25, pulp:volume*0.20, fire:volume*0.03, chips:volume*0.02, small:volume*0.10, log:volume*0.10}
    if(vec>80) return {veneer:volume*0.08, tara:volume*0.35, pulp:volume*0.15, fire:volume*0.05, chips:volume*0.02, small:volume*0.15, log:volume*0.20}
    return {veneer:volume*0.15, tara:volume*0.30, pulp:volume*0.25, fire:volume*0.07, chips:volume*0.03, small:volume*0.10, log:volume*0.10}
  }
  // P, E, Lg
  if(kvalitate==="Malka") return {fire:volume*0.80, chips:volume*0.20}
  if(kvalitate==="Papīrmalka") return {pulp:volume*0.85, chips:volume*0.15}
  if(d<18) return {pulp:volume*0.85, fire:volume*0.10, chips:volume*0.05}
  if(kvalitate==="D") return {pulp:volume*0.75, fire:volume*0.15, chips:volume*0.10}
  if(kvalitate==="C") {
    if(d<26) return {small:volume*0.20, pulp:volume*0.60, fire:volume*0.10, chips:volume*0.10}
    return {log:volume*0.20, small:volume*0.20, pulp:volume*0.45, fire:volume*0.10, chips:volume*0.05}
  }
  if(d<26) return {log:volume*0.35, small:volume*0.20, pulp:volume*0.25, fire:volume*0.07, chips:volume*0.03, tara:volume*0.10}
  if(d<34) return {log:volume*0.50, small:volume*0.20, pulp:volume*0.12, fire:volume*0.05, chips:volume*0.03, tara:volume*0.10}
  return {log:volume*0.60, small:volume*0.20, pulp:volume*0.07, fire:volume*0.03, chips:volume*0.02, tara:volume*0.08}
}

function aprKraja(nog, sugaData, stavs="pirmais") {
  const vietas = stavs==="pirmais" ? nog.vietas : nog.otrsStavsVietas
  const gMerijumi = vietas.map(v=>parseNum(v.merijumi?.[sugaData.suga]||0)).filter(v=>v>0)
  const vidG = gMerijumi.length ? gMerijumi.reduce((a,b)=>a+b,0)/gMerijumi.length : 0
  const vidD = sugaData.diametri.length ? sugaData.diametri.reduce((a,b)=>a+b,0)/sugaData.diametri.length : 0
  const vidH = parseNum(sugaData.h)
  const F = formFactor[sugaData.suga] || 0.5
  const plat = parseNum(nog.platiba) || 1
  const kraja = vidG * vidH * F * plat
  return {vidG, vidD, vidH, kraja}
}

export default function CirsmaNovertesanaMobile({ onBack }) {
  const init = load()
  const [kadastrs, setKadastrs] = useState(init?.kadastrs||'')
  const [saimnieciba, setSaimnieciba] = useState(init?.saimnieciba||'')
  const [veids, setVeids] = useState(init?.veids||'nogabals')
  const [cirsma, setCirsma] = useState(init?.cirsma||defaultCirsma())
  const [prices, setPrices] = useState(init?.prices||DEFAULT_PRICES)
  const [skats, setSkats] = useState('sakums')
  const [aktNi, setAktNi] = useState(0)
  const [aktSi, setAktSi] = useState(0)
  const [aktStavs, setAktStavs] = useState('pirmais')
  const [showKvalModal, setShowKvalModal] = useState(false)
  const [kvalModalCallback, setKvalModalCallback] = useState(null)
  const [npVal, setNpVal] = useState('')

  const sv = (jaunaCirsma, jK, jS, jV, jP) => {
    const d = {
      kadastrs: jK??kadastrs,
      saimnieciba: jS??saimnieciba,
      veids: jV??veids,
      cirsma: jaunaCirsma??cirsma,
      prices: jP??prices
    }
    setCirsma(d.cirsma)
    save(d)
  }

  const nog = cirsma.nogabali[aktNi] || cirsma.nogabali[0]

  const updNog = (jauns) => {
    const n = JSON.parse(JSON.stringify(cirsma))
    n.nogabali[aktNi] = {...n.nogabali[aktNi], ...jauns}
    sv(n)
  }

  const S = {
    app:{background:'#0f1117',minHeight:'100vh',color:'#f0f4f8',fontFamily:'system-ui,sans-serif',maxWidth:520,margin:'0 auto',paddingBottom:80},
    hdr:{background:'#12151e',borderBottom:'1px solid #2a2d3a',padding:'12px 16px',position:'sticky',top:0,zIndex:10},
    ttl:{fontSize:20,fontWeight:800,color:'#4ade80',fontFamily:'monospace'},
    sec:{padding:'14px 16px'},
    lbl:{fontSize:10,fontWeight:700,letterSpacing:2,color:'#6b7280',textTransform:'uppercase',marginBottom:4,display:'block'},
    inp:{background:'#1a1d26',border:'1px solid #2a2d3a',borderRadius:8,padding:'12px',color:'#f0f4f8',fontSize:15,width:'100%',outline:'none',boxSizing:'border-box',marginBottom:8},
    card:{background:'#1a1d26',border:'1px solid #2a2d3a',borderRadius:12,padding:14,marginBottom:10},
    cardGreen:{background:'#1a1d26',border:'1px solid #4ade80',borderRadius:12,padding:14,marginBottom:10},
    btnG:{background:'#166534',border:'1px solid #4ade80',borderRadius:10,color:'#4ade80',padding:'14px 16px',fontSize:15,fontWeight:700,cursor:'pointer',textAlign:'center',width:'100%',marginBottom:8},
    btnB:{background:'#1e3a5f',border:'1px solid #3b82f6',borderRadius:10,color:'#93c5fd',padding:'14px 16px',fontSize:15,fontWeight:700,cursor:'pointer',textAlign:'center',width:'100%',marginBottom:8},
    btnR:{background:'#1e1a1a',border:'1px solid #ef4444',borderRadius:10,color:'#ef4444',padding:'12px 16px',fontSize:13,fontWeight:600,cursor:'pointer',width:'100%',marginBottom:8},
    btn:{background:'#1a1d26',border:'1px solid #2a2d3a',borderRadius:10,color:'#f0f4f8',padding:'14px 16px',fontSize:14,fontWeight:600,cursor:'pointer',textAlign:'left',width:'100%',marginBottom:8},
    back:{background:'transparent',border:'1px solid #2a2d3a',color:'#6b7280',padding:'8px 16px',borderRadius:8,cursor:'pointer',fontSize:13},
    row:{display:'flex',gap:8,marginBottom:8},
    divider:{height:1,background:'#2a2d3a',margin:'12px 0'},
    npBtn:{background:'#1a1d26',border:'1px solid #2a2d3a',borderRadius:12,color:'#f0f4f8',fontFamily:'monospace',fontSize:26,fontWeight:700,padding:'16px 0',cursor:'pointer',userSelect:'none',textAlign:'center'},
    npDel:{background:'#1e1a1a',border:'1px solid #3a2a2a',borderRadius:12,color:'#ef4444',fontFamily:'monospace',fontSize:22,fontWeight:700,padding:'16px 0',cursor:'pointer',userSelect:'none',textAlign:'center'},
  }
  // ═══ KVALITĀTES MODĀLS ═══
  const KvalModal = ({onSelect, onClose}) => (
    <div style={{position:'fixed',top:0,left:0,width:'100%',height:'100%',background:'rgba(0,0,0,0.8)',zIndex:100,display:'flex',alignItems:'flex-end'}}>
      <div style={{background:'#12151e',width:'100%',borderRadius:'16px 16px 0 0',padding:'16px',maxHeight:'80vh',overflowY:'auto'}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
          <div style={{fontSize:16,fontWeight:700,color:'#4ade80'}}>Izvēlies kvalitāti</div>
          <button onClick={onClose} style={{background:'none',border:'none',color:'#6b7280',fontSize:24,cursor:'pointer'}}>×</button>
        </div>
        {Object.keys(KVALITATE_DESC).map(k=>(
          <button key={k} onClick={()=>{onSelect(k);onClose()}} style={{width:'100%',marginBottom:8,padding:'12px 16px',borderRadius:10,border:'2px solid transparent',background:KVALITATE_DESC[k].krasa,color:KVALITATE_DESC[k].teksts,cursor:'pointer',textAlign:'left'}}>
            <div style={{fontWeight:700,fontSize:15}}>{k}</div>
            <div style={{fontSize:12,marginTop:2,opacity:0.9}}>{KVALITATE_DESC[k].apraksts}</div>
          </button>
        ))}
      </div>
    </div>
  )

  // ═══ SĀKUMS ═══
  if(skats==='sakums') return (
    <div style={S.app}>
      <div style={S.hdr}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
          <div style={S.ttl}>Cirsma<span style={{color:'#f0f4f8'}}>.</span></div>
          <button onClick={onBack} style={S.back}>← Atpakaļ</button>
        </div>
      </div>
      <div style={S.sec}>
        <div style={S.card}>
          <span style={S.lbl}>Kadastrs *</span>
          <input style={S.inp} value={kadastrs} placeholder="piem. 42010010001"
            onChange={e=>{setKadastrs(e.target.value);save({kadastrs:e.target.value,saimnieciba,veids,cirsma,prices})}}/>
          <span style={S.lbl}>Saimniecība</span>
          <input style={S.inp} value={saimnieciba} placeholder="nav obligāts"
            onChange={e=>{setSaimnieciba(e.target.value);save({kadastrs,saimnieciba:e.target.value,veids,cirsma,prices})}}/>
        </div>

        <div style={S.card}>
          <span style={S.lbl}>Vērtēju</span>
          <div style={{display:'flex',gap:8,marginBottom:8}}>
            {['nogabals','cirsma'].map(v=>(
              <button key={v} onClick={()=>{setVeids(v);save({kadastrs,saimnieciba,veids:v,cirsma,prices})}}
                style={{flex:1,padding:'12px',borderRadius:8,border:`2px solid ${veids===v?'#4ade80':'#2a2d3a'}`,background:veids===v?'#166534':'#1a1d26',color:veids===v?'#4ade80':'#6b7280',fontWeight:700,cursor:'pointer',fontSize:14}}>
                {v==='nogabals'?'Nogabalu':'Cirsmu'}
              </button>
            ))}
          </div>
        </div>

        {cirsma.nogabali.map((n,ni)=>(
          <button key={n.id} style={S.btn} onClick={()=>{setAktNi(ni);setSkats('nogabals')}}>
            <div style={{display:'flex',justifyContent:'space-between'}}>
              <span style={{color:'#4ade80',fontWeight:700}}>Nogabals {n.nr||ni+1}</span>
              <span style={{color:'#6b7280',fontSize:12}}>{n.platiba||'—'} ha</span>
            </div>
            <div style={{fontSize:12,color:'#6b7280',marginTop:2}}>
              {n.sugas.length>0 ? n.sugas.map(s=>s.suga).join(', ') : 'Nav datu'}
            </div>
          </button>
        ))}

        {veids==='cirsma' && (
          <button style={S.btnG} onClick={()=>{
            const n=JSON.parse(JSON.stringify(cirsma))
            n.nogabali.push(defaultNogabals(String(n.nogabali.length+1)))
            sv(n)
            setAktNi(n.nogabali.length-1)
            setSkats('nogabals')
          }}>+ Pievienot nogabalu</button>
        )}

        <button style={S.btnB} onClick={()=>setSkats('cenas')}>⚙ Materiāla cenas</button>

        {cirsma.nogabali.some(n=>n.sugas.some(s=>s.h)) && (
          <button style={{...S.btnG,marginTop:4}} onClick={()=>setSkats('rezultati')}>📊 Rezultāti un PDF</button>
        )}

        <button style={S.btnR} onClick={()=>{
          if(!window.confirm('Dzēst visu?')) return
          const fresh={kadastrs:'',saimnieciba:'',veids:'nogabals',cirsma:defaultCirsma(),prices:DEFAULT_PRICES}
          setKadastrs('');setSaimnieciba('');setVeids('nogabals');setCirsma(fresh.cirsma);setPrices(fresh.prices)
          save(fresh)
        }}>🗑 Dzēst visu</button>
      </div>
    </div>
  )

  // ═══ NOGABALS ═══
  if(skats==='nogabals') return (
    <div style={S.app}>
      <div style={S.hdr}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
          <div style={S.ttl}>Nogabals {nog.nr||aktNi+1}</div>
          <button onClick={()=>setSkats('sakums')} style={S.back}>← Atpakaļ</button>
        </div>
      </div>
      <div style={S.sec}>
        <div style={S.card}>
          <div style={S.row}>
            <div style={{flex:1}}>
              <span style={S.lbl}>Nogabala Nr.</span>
              <input style={{...S.inp,marginBottom:0}} value={nog.nr} placeholder="piem. 5"
                onChange={e=>updNog({nr:e.target.value})}/>
            </div>
            <div style={{flex:1}}>
              <span style={S.lbl}>Platība (ha)</span>
              <input style={{...S.inp,marginBottom:0}} type="number" inputMode="decimal" step="0.01" value={nog.platiba} placeholder="1.5"
                onChange={e=>updNog({platiba:e.target.value})}/>
            </div>
          </div>
          <div style={{marginTop:8}}>
            <span style={S.lbl}>Vecums (gadi)</span>
            <input style={S.inp} type="number" inputMode="numeric" value={nog.vecums} placeholder="piem. 80"
              onChange={e=>updNog({vecums:e.target.value})}/>
            <span style={S.lbl}>Augsnes tips</span>
            <select style={S.inp} value={nog.augsneTips} onChange={e=>updNog({augsneTips:e.target.value})}>
              {AUGSNES_TIPI.map(t=><option key={t}>{t}</option>)}
            </select>
            <span style={S.lbl}>Cirtes veids</span>
            <select style={S.inp} value={nog.cirteVeids} onChange={e=>updNog({cirteVeids:e.target.value,cirteIzpilde:CIRTE_IZPILDE[e.target.value][0]})}>
              {CIRTE_VEIDS.map(t=><option key={t}>{t}</option>)}
            </select>
            <span style={S.lbl}>Izpildes veids</span>
            <select style={S.inp} value={nog.cirteIzpilde} onChange={e=>updNog({cirteIzpilde:e.target.value})}>
              {(CIRTE_IZPILDE[nog.cirteVeids]||[]).map(t=><option key={t}>{t}</option>)}
            </select>
            <span style={S.lbl}>Pievešana</span>
            <select style={S.inp} value={nog.pievesana} onChange={e=>updNog({pievesana:e.target.value})}>
              {PIEVESANA.map(p=><option key={p}>{p}</option>)}
            </select>
          </div>
        </div>

        <button style={S.btnG} onClick={()=>setSkats('g_merijumi')}>
          📍 G mērījumi
          <div style={{fontSize:12,fontWeight:400,marginTop:2}}>{nog.vietas.length} vieta(-s) · {nog.sugas.length>0?nog.sugas.map(s=>s.suga).join(', '):'nav datu'}</div>
        </button>

        {nog.sugas.length>0 && (
          <button style={S.btnG} onClick={()=>{setAktSi(0);setSkats('d_merijumi')}}>
            📏 D mērījumi un kvalitāte
            <div style={{fontSize:12,fontWeight:400,marginTop:2}}>{nog.sugas.filter(s=>s.diametri.length>0).length}/{nog.sugas.length} sugām ievadīti</div>
          </button>
        )}

        {nog.sugas.some(s=>s.h) && (
          <button style={S.btnG} onClick={()=>setSkats('augstumi')}>
            📐 Augstumi
            <div style={{fontSize:12,fontWeight:400,marginTop:2}}>{nog.sugas.filter(s=>s.h).length}/{nog.sugas.length} sugām ievadīti</div>
          </button>
        )}

        <div style={S.card}>
          <span style={S.lbl}>2. stāvs?</span>
          <div style={{display:'flex',gap:8}}>
            {['nē','jā'].map(v=>(
              <button key={v} onClick={()=>updNog({otrsStavs:v==='jā'})}
                style={{flex:1,padding:'10px',borderRadius:8,border:`2px solid ${(nog.otrsStavs&&v==='jā')||(!nog.otrsStavs&&v==='nē')?'#4ade80':'#2a2d3a'}`,background:(nog.otrsStavs&&v==='jā')||(!nog.otrsStavs&&v==='nē')?'#166534':'#1a1d26',color:(nog.otrsStavs&&v==='jā')||(!nog.otrsStavs&&v==='nē')?'#4ade80':'#6b7280',fontWeight:700,cursor:'pointer'}}>
                {v}
              </button>
            ))}
          </div>
          {nog.otrsStavs && (
            <button style={{...S.btnG,marginTop:8}} onClick={()=>{setAktStavs('otrais');setSkats('g_merijumi')}}>
              📍 2. stāva G mērījumi
            </button>
          )}
        </div>

        {cirsma.nogabali.length>1 && (
          <button style={S.btnR} onClick={()=>{
            if(!window.confirm('Dzēst šo nogabalu?')) return
            const n=JSON.parse(JSON.stringify(cirsma))
            n.nogabali=n.nogabali.filter((_,i)=>i!==aktNi)
            sv(n);setAktNi(0);setSkats('sakums')
          }}>🗑 Dzēst nogabalu</button>
        )}
      </div>
    </div>
  )
  // ═══ G MĒRĪJUMI ═══
  if(skats==='g_merijumi') {
    const vietas = aktStavs==='pirmais' ? nog.vietas : nog.otrsStavsVietas
    const vietasKey = aktStavs==='pirmais' ? 'vietas' : 'otrsStavsVietas'
    const sugasKey = aktStavs==='pirmais' ? 'sugas' : 'otraSStavaSugas'

    const videjaisG = (suga) => {
      const vals = vietas.map(v=>parseNum(v.merijumi?.[suga]||0)).filter(v=>v>0)
      return vals.length ? vals.reduce((a,b)=>a+b,0)/vals.length : 0
    }

    const visasSugas = [...new Set(vietas.flatMap(v=>Object.keys(v.merijumi||{})).filter(s=>vietas.some(v=>parseNum(v.merijumi?.[s])>0)))]

    return (
      <div style={S.app}>
        <div style={S.hdr}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
            <div style={S.ttl}>{aktStavs==='otrais'?'2. stāva ':''} G mērījumi</div>
            <button onClick={()=>{setAktStavs('pirmais');setSkats('nogabals')}} style={S.back}>← Atpakaļ</button>
          </div>
          <div style={{fontSize:11,color:'#6b7280',marginTop:4}}>Bitterlich — katrs koks = 1 m²/ha</div>
        </div>
        <div style={S.sec}>
          {vietas.map((vieta,vi)=>(
            <div key={vieta.id} style={S.card}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:10}}>
                <div style={{color:'#4ade80',fontWeight:700,fontSize:15}}>Vieta {vi+1}</div>
                {vietas.length>1 && (
                  <button onClick={()=>{
                    const n=JSON.parse(JSON.stringify(cirsma))
                    n.nogabali[aktNi][vietasKey]=vietas.filter((_,i)=>i!==vi)
                    sv(n)
                  }} style={{background:'none',border:'none',color:'#ef4444',fontSize:20,cursor:'pointer'}}>×</button>
                )}
              </div>
              {SUGAS_SARAKSTS.map(suga=>(
                <div key={suga} style={{display:'flex',alignItems:'center',gap:8,marginBottom:8}}>
                  <div style={{width:36,height:36,background:'#225522',borderRadius:6,display:'flex',alignItems:'center',justifyContent:'center',fontWeight:700,fontSize:13,color:'#4ade80',flexShrink:0}}>{suga}</div>
                  <input type="number" inputMode="numeric" placeholder="0"
                    style={{...S.inp,marginBottom:0,flex:1,textAlign:'center',fontSize:18}}
                    value={vieta.merijumi?.[suga]||''}
                    onChange={e=>{
                      const n=JSON.parse(JSON.stringify(cirsma))
                      n.nogabali[aktNi][vietasKey][vi].merijumi={...vieta.merijumi,[suga]:e.target.value}
                      sv(n)
                    }}/>
                </div>
              ))}
            </div>
          ))}

          <button style={S.btnG} onClick={()=>{
            const n=JSON.parse(JSON.stringify(cirsma))
            n.nogabali[aktNi][vietasKey]=[...vietas,defaultVieta()]
            sv(n)
          }}>+ Pievienot vietu</button>

          {visasSugas.length>0 && (
            <div style={S.cardGreen}>
              <div style={{fontSize:11,fontWeight:700,color:'#6b7280',textTransform:'uppercase',letterSpacing:1,marginBottom:8}}>Vidējais G un audzes formula</div>
              {visasSugas.map(s=>(
                <div key={s} style={{display:'flex',justifyContent:'space-between',marginBottom:4}}>
                  <span style={{color:'#4ade80',fontWeight:700,fontSize:15}}>{s}</span>
                  <span style={{fontFamily:'monospace',fontSize:14}}>{videjaisG(s).toFixed(2)} m²/ha ({vietas.filter(v=>parseNum(v.merijumi?.[s])>0).length} vietas)</span>
                </div>
              ))}
              <div style={S.divider}/>
              <div style={{fontSize:13,color:'#9ca3af'}}>
                Formula: {(()=>{
                  const kopG=visasSugas.reduce((s,sg)=>s+videjaisG(sg),0)
                  if(kopG===0) return '—'
                  return visasSugas.map(s=>{
                    const pct=Math.round(videjaisG(s)/kopG*10)
                    return pct>0?`${pct}${s}`:''
                  }).filter(Boolean).join('')
                })()}
              </div>
            </div>
          )}

          <button style={S.btnB} onClick={()=>{
            const n=JSON.parse(JSON.stringify(cirsma))
            const jaunaSugas = visasSugas.map(suga=>{
              const esosaSuga = n.nogabali[aktNi][sugasKey].find(s=>s.suga===suga)
              return esosaSuga || defaultSugaData(suga)
            })
            n.nogabali[aktNi][sugasKey] = jaunaSugas
            sv(n)
            if(aktStavs==='otrais'){
              setSkats('nogabals')
              setAktStavs('pirmais')
            } else {
              setAktSi(0)
              setSkats('d_merijumi')
            }
          }}>✓ Saglabāt un turpināt →</button>
        </div>
      </div>
    )
  }

  // ═══ D MĒRĪJUMI + KVALITĀTE ═══
  if(skats==='d_merijumi') {
    const sugasArr = aktStavs==='pirmais' ? nog.sugas : nog.otraSStavaSugas
    const sugaData = sugasArr[aktSi]
    if(!sugaData) { setSkats('nogabals'); return null }

    const vidD = sugaData.diametri.length ? (sugaData.diametri.reduce((a,b)=>a+b,0)/sugaData.diametri.length).toFixed(1) : null

    return (
      <div style={S.app}>
        {showKvalModal && <KvalModal onSelect={k=>{
          const n=JSON.parse(JSON.stringify(cirsma))
          const sarr = aktStavs==='pirmais' ? 'sugas' : 'otraSStavaSugas'
          n.nogabali[aktNi][sarr][aktSi].kvalitate=k
          sv(n)
        }} onClose={()=>setShowKvalModal(false)}/>}
        <div style={S.hdr}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
            <div style={S.ttl}>D mērījumi — <span style={{color:'#4ade80'}}>{sugaData.suga}</span></div>
            <button onClick={()=>setSkats('nogabals')} style={S.back}>← Atpakaļ</button>
          </div>
          <div style={{display:'flex',gap:8,marginTop:8,overflowX:'auto'}}>
            {sugasArr.map((s,si)=>(
              <button key={s.id} onClick={()=>setAktSi(si)}
                style={{padding:'6px 14px',borderRadius:20,border:`1px solid ${si===aktSi?'#4ade80':'#2a2d3a'}`,background:si===aktSi?'#166534':'#1a1d26',color:si===aktSi?'#4ade80':'#6b7280',cursor:'pointer',fontWeight:700,whiteSpace:'nowrap',fontSize:13}}>
                {s.suga} {s.diametri.length>0?'✓':''}
              </button>
            ))}
          </div>
        </div>
        <div style={S.sec}>
          <div style={S.cardGreen}>
            <div style={{fontSize:18,fontWeight:800,color:'#4ade80',marginBottom:8}}>{sugaData.suga}</div>
            <div style={{marginBottom:12}}>
              <span style={S.lbl}>Kvalitāte</span>
              <button onClick={()=>setShowKvalModal(true)}
                style={{width:'100%',padding:'12px 16px',borderRadius:10,border:'2px solid #4ade80',background:KVALITATE_DESC[sugaData.kvalitate]?.krasa||'#166534',color:KVALITATE_DESC[sugaData.kvalitate]?.teksts||'white',fontSize:15,fontWeight:700,cursor:'pointer',textAlign:'left'}}>
                {sugaData.kvalitate} — {KVALITATE_DESC[sugaData.kvalitate]?.apraksts?.slice(0,40)}...
                <span style={{float:'right'}}>▼</span>
              </button>
            </div>

            <span style={S.lbl}>Diametra mērījumi (cm) — vismaz 10</span>
            <div style={{display:'flex',gap:8,marginBottom:8}}>
              <div style={{flex:1,background:'#0f1117',border:'2px solid #4ade80',borderRadius:12,padding:'10px',textAlign:'center',minHeight:60,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center'}}>
                <div style={{fontFamily:'monospace',fontSize:36,fontWeight:700,color:npVal?'#4ade80':'#2a2d3a'}}>{npVal||'_'}</div>
                <div style={{fontSize:11,color:'#6b7280'}}>cm</div>
              </div>
              <button style={{width:80,background:npVal?'#4ade80':'#1a2a1a',color:npVal?'#0a1a0a':'#4b5563',borderRadius:12,border:'none',fontSize:14,fontWeight:800,cursor:npVal?'pointer':'default'}}
                onPointerDown={e=>{
                  e.preventDefault()
                  const val=parseFloat(npVal)
                  if(!val||val<1) return
                  const n=JSON.parse(JSON.stringify(cirsma))
                  const sarr=aktStavs==='pirmais'?'sugas':'otraSStavaSugas'
                  n.nogabali[aktNi][sarr][aktSi].diametri=[...sugaData.diametri,val]
                  sv(n); setNpVal('')
                }}>+<br/>PIEVIENO</button>
            </div>

            <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:6,marginBottom:10}}>
              {[1,2,3,4,5,6,7,8,9].map(n=>(
                <button key={n} style={S.npBtn} onPointerDown={e=>{e.preventDefault();setNpVal(v=>{if(v.includes('.')&&n==='.')return v;if(v.length>=4)return v;return v+n})}}>{n}</button>
              ))}
              <button style={S.npBtn} onPointerDown={e=>{e.preventDefault();setNpVal(v=>v.length>=4?v:v+'0')}}>0</button>
              <button style={S.npBtn} onPointerDown={e=>{e.preventDefault();setNpVal(v=>v.includes('.')?v:v+'.')}}>.</button>
              <button style={S.npDel} onPointerDown={e=>{e.preventDefault();setNpVal(v=>v.slice(0,-1))}}>⌫</button>
            </div>

            <div style={{display:'flex',flexWrap:'wrap',gap:4,marginBottom:8}}>
              {sugaData.diametri.map((d,i)=>(
                <span key={i} style={{background:'#225522',border:'1px solid #4ade80',borderRadius:16,padding:'4px 10px',fontSize:13,color:'#4ade80',display:'flex',alignItems:'center',gap:4}}>
                  {d}
                  <span onClick={()=>{
                    const n=JSON.parse(JSON.stringify(cirsma))
                    const sarr=aktStavs==='pirmais'?'sugas':'otraSStavaSugas'
                    n.nogabali[aktNi][sarr][aktSi].diametri=sugaData.diametri.filter((_,j)=>j!==i)
                    sv(n)
                  }} style={{color:'#ef4444',cursor:'pointer',fontWeight:700}}>×</span>
                </span>
              ))}
            </div>

            {vidD && (
              <div style={{color:'#4ade80',fontFamily:'monospace',fontSize:16,fontWeight:700}}>
                Vid.D = {vidD} cm ({sugaData.diametri.length} mērījumi)
                {sugaData.diametri.length<10 && <span style={{color:'#f9a825',fontSize:12,marginLeft:8}}>⚠ ieteicami vismaz 10</span>}
              </div>
            )}
          </div>

          <div style={{display:'flex',gap:8}}>
            {aktSi>0 && (
              <button style={{...S.btnB,flex:1,marginBottom:0}} onClick={()=>{setAktSi(aktSi-1);setNpVal('')}}>← Iepriekšējā</button>
            )}
            {aktSi<sugasArr.length-1 ? (
              <button style={{...S.btnG,flex:1,marginBottom:0}} onClick={()=>{setAktSi(aktSi+1);setNpVal('')}}>Nākamā suga →</button>
            ) : (
              <button style={{...S.btnG,flex:1,marginBottom:0}} onClick={()=>{setNpVal('');setSkats('augstumi')}}>✓ Uz augstumiem →</button>
            )}
          </div>

          <div style={{marginTop:8}}>
            <span style={S.lbl}>Pievienot sugu manuāli (2. stāvs utt.)</span>
            <div style={{display:'flex',gap:8}}>
              <select style={{...S.inp,marginBottom:0,flex:1}} id="jaunaSuga">
                {SUGAS_SARAKSTS.map(s=><option key={s}>{s}</option>)}
              </select>
              <button style={{...S.btnG,marginBottom:0,width:'auto',padding:'0 20px'}} onClick={()=>{
                const sel=document.getElementById('jaunaSuga').value
                const n=JSON.parse(JSON.stringify(cirsma))
                const sarr=aktStavs==='pirmais'?'sugas':'otraSStavaSugas'
                if(!n.nogabali[aktNi][sarr].find(s=>s.suga===sel&&s.diametri.length===0)){
                  n.nogabali[aktNi][sarr].push(defaultSugaData(sel))
                  sv(n)
                  setAktSi(n.nogabali[aktNi][sarr].length-1)
                }
              }}>+</button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ═══ AUGSTUMI ═══
  if(skats==='augstumi') {
    const sugasArr = nog.sugas
    return (
      <div style={S.app}>
        <div style={S.hdr}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
            <div style={S.ttl}>Augstumi</div>
            <button onClick={()=>setSkats('nogabals')} style={S.back}>← Atpakaļ</button>
          </div>
          <div style={{fontSize:11,color:'#6b7280',marginTop:4}}>Ievadi vidējo augstumu katrai sugai</div>
        </div>
        <div style={S.sec}>
          {sugasArr.map((s,si)=>(
            <div key={s.id} style={S.card}>
              <div style={{display:'flex',alignItems:'center',gap:12}}>
                <div style={{width:44,height:44,background:'#225522',borderRadius:8,display:'flex',alignItems:'center',justifyContent:'center',fontWeight:800,fontSize:16,color:'#4ade80',flexShrink:0}}>{s.suga}</div>
                <div style={{flex:1}}>
                  <span style={S.lbl}>Augstums (m)</span>
                  <input type="number" inputMode="decimal" step="0.1" placeholder="piem. 24"
                    style={{...S.inp,marginBottom:0,fontSize:18}}
                    value={s.h}
                    onChange={e=>{
                      const n=JSON.parse(JSON.stringify(cirsma))
                      n.nogabali[aktNi].sugas[si].h=e.target.value
                      const vec=parseNum(nog.vecums)
                      const h=parseNum(e.target.value)
                      if(vec>0&&h>0) n.nogabali[aktNi].sugas[si].bonitate=getBonitate(s.suga,vec,h)
                      sv(n)
                    }}/>
                </div>
                {s.bonitate && <div style={{fontSize:13,color:'#4ade80',fontWeight:700,fontFamily:'monospace',minWidth:30}}>{s.bonitate}</div>}
              </div>
            </div>
          ))}
          {nog.otraSStavaSugas?.length>0 && (
            <>
              <div style={{...S.divider,marginBottom:8}}/>
              <div style={{fontSize:12,color:'#6b7280',marginBottom:8}}>2. stāvs</div>
              {nog.otraSStavaSugas.map((s,si)=>(
                <div key={s.id} style={S.card}>
                  <div style={{display:'flex',alignItems:'center',gap:12}}>
                    <div style={{width:44,height:44,background:'#1e3a5f',borderRadius:8,display:'flex',alignItems:'center',justifyContent:'center',fontWeight:800,fontSize:16,color:'#93c5fd',flexShrink:0}}>{s.suga}</div>
                    <div style={{flex:1}}>
                      <span style={S.lbl}>Augstums (m)</span>
                      <input type="number" inputMode="decimal" step="0.1" placeholder="piem. 8"
                        style={{...S.inp,marginBottom:0,fontSize:18}}
                        value={s.h}
                        onChange={e=>{
                          const n=JSON.parse(JSON.stringify(cirsma))
                          n.nogabali[aktNi].otraSStavaSugas[si].h=e.target.value
                          sv(n)
                        }}/>
                    </div>
                  </div>
                </div>
              ))}
            </>
          )}
          <button style={S.btnG} onClick={()=>{
            updNog({piezimes:nog.piezimes})
            setSkats('piezimes')
          }}>✓ Saglabāt un turpināt →</button>
        </div>
      </div>
    )
  }
  // ═══ PIEZĪMES ═══
  if(skats==='piezimes') return (
    <div style={S.app}>
      <div style={S.hdr}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
          <div style={S.ttl}>Piezīmes</div>
          <button onClick={()=>setSkats('augstumi')} style={S.back}>← Atpakaļ</button>
        </div>
      </div>
      <div style={S.sec}>
        {[
          ['pievesana','🚛 Pievešana (ceļš, attālums, apstākļi)'],
          ['zaglesana','🪚 Zāģēšana (apstākļi cirsma)'],
          ['izvesana','🚜 Izvešana (apstākļi)'],
          ['citas','📝 Citas piezīmes']
        ].map(([key,label])=>(
          <div key={key} style={S.card}>
            <span style={S.lbl}>{label}</span>
            <textarea style={{...S.inp,minHeight:80,resize:'vertical'}}
              value={nog.piezimes?.[key]||''}
              onChange={e=>{
                const n=JSON.parse(JSON.stringify(cirsma))
                n.nogabali[aktNi].piezimes={...n.nogabali[aktNi].piezimes,[key]:e.target.value}
                sv(n)
              }}/>
          </div>
        ))}
        <button style={S.btnG} onClick={()=>setSkats('rezultati')}>📊 Aprēķināt rezultātus →</button>
        <button style={S.btnB} onClick={()=>setSkats('sakums')}>← Uz sākumu</button>
      </div>
    </div>
  )

  // ═══ CENAS ═══
  if(skats==='cenas') return (
    <div style={S.app}>
      <div style={S.hdr}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
          <div style={S.ttl}>Materiāla cenas</div>
          <button onClick={()=>setSkats('sakums')} style={S.back}>← Atpakaļ</button>
        </div>
      </div>
      <div style={S.sec}>
        {Object.keys(prices).map(k=>(
          <div key={k} style={S.card}>
            <div style={{display:'flex',alignItems:'center',gap:10}}>
              <span style={{color:'#4ade80',fontWeight:700,minWidth:90,fontSize:14}}>{SORT_NAMES[k]}</span>
              <input type="number" inputMode="decimal"
                style={{...S.inp,marginBottom:0,flex:1,textAlign:'right',fontSize:16}}
                value={prices[k]}
                onChange={e=>{
                  const p={...prices,[k]:Number(e.target.value)}
                  setPrices(p)
                  save({kadastrs,saimnieciba,veids,cirsma,prices:p})
                }}/>
              <span style={{color:'#6b7280',fontSize:13,minWidth:30}}>€/m³</span>
            </div>
          </div>
        ))}
        <button style={S.btnR} onClick={()=>{
          setPrices(DEFAULT_PRICES)
          save({kadastrs,saimnieciba,veids,cirsma,prices:DEFAULT_PRICES})
        }}>↺ Noklusējuma cenas</button>
      </div>
    </div>
  )

  // ═══ REZULTĀTI ═══
  if(skats==='rezultati') {
    const aprNogabals = (n) => {
      const sugaRez = []
      const aprstSugas = (sugasArr, stavs) => {
        sugasArr.forEach(s => {
          const vietas = stavs==='pirmais' ? n.vietas : n.otrsStavsVietas
          const gVals = vietas.map(v=>parseNum(v.merijumi?.[s.suga]||0)).filter(v=>v>0)
          const vidG = gVals.length ? gVals.reduce((a,b)=>a+b,0)/gVals.length : 0
          const vidD = s.diametri.length ? s.diametri.reduce((a,b)=>a+b,0)/s.diametri.length : 0
          const vidH = parseNum(s.h)
          const F = formFactor[s.suga] || 0.5
          const plat = parseNum(n.platiba) || 1
          const kraja = vidG * vidH * F * plat
          const sort = calcSortimentiPecSugas(kraja, s.suga, s.kvalitate, vidD, n.vecums, s.bonitate)
          sugaRez.push({suga:s.suga, vidG, vidD, vidH, kraja, sort, stavs, kvalitate:s.kvalitate, bonitate:s.bonitate})
        })
      }
      aprstSugas(n.sugas, 'pirmais')
      if(n.otrsStavs && n.otraSStavaSugas?.length>0) aprstSugas(n.otraSStavaSugas, 'otrais')
      const kopKraja = sugaRez.reduce((s,r)=>s+r.kraja,0)
      const kopSort = {}
      sugaRez.forEach(r=>Object.keys(r.sort||{}).forEach(k=>{kopSort[k]=(kopSort[k]||0)+(r.sort[k]||0)}))
      const kopVal = Object.keys(kopSort).reduce((s,k)=>s+(kopSort[k]||0)*(prices[k]||0),0)
      return {sugaRez, kopKraja, kopSort, kopVal}
    }

    const visRez = cirsma.nogabali.map(n=>aprNogabals(n))
    const visKraja = visRez.reduce((s,r)=>s+r.kopKraja,0)
    const visVal = visRez.reduce((s,r)=>s+r.kopVal,0)
    const visSort = {}
    visRez.forEach(r=>Object.keys(r.kopSort).forEach(k=>{visSort[k]=(visSort[k]||0)+(r.kopSort[k]||0)}))

    return (
      <div style={S.app}>
        <div style={S.hdr}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
            <div style={S.ttl}>Rezultāti</div>
            <button onClick={()=>setSkats('sakums')} style={S.back}>← Atpakaļ</button>
          </div>
        </div>
        <div style={S.sec}>
          <div style={S.cardGreen}>
            <div style={{fontSize:11,color:'#6b7280',letterSpacing:1,marginBottom:4}}>
              {veids==='cirsma'?'CIRSMA KOPĀ':'NOGABALS KOPĀ'}
            </div>
            <div style={{fontSize:32,fontWeight:800,color:'#4ade80',fontFamily:'monospace'}}>{visKraja.toFixed(1)} m³</div>
            <div style={{fontSize:22,fontWeight:700,color:'#f0f4f8'}}>{visVal.toFixed(0)} €</div>
          </div>

          {cirsma.nogabali.map((n,ni)=>{
            const rez=visRez[ni]
            return (
              <div key={n.id} style={S.card}>
                <div style={{color:'#4ade80',fontWeight:700,fontSize:15,marginBottom:8}}>
                  Nogabals {n.nr||ni+1} — {n.platiba} ha
                </div>
                {rez.sugaRez.map((r,ri)=>(
                  <div key={ri} style={{borderBottom:'1px solid #2a2d3a',paddingBottom:8,marginBottom:8}}>
                    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                      <span style={{color:'#4ade80',fontWeight:700,fontSize:16}}>{r.suga}
                        {r.stavs==='otrais'&&<span style={{color:'#93c5fd',fontSize:11,marginLeft:4}}>2.stāvs</span>}
                      </span>
                      <span style={{fontFamily:'monospace',fontSize:14}}>{r.kraja.toFixed(1)} m³ · {Object.keys(r.sort||{}).reduce((s,k)=>s+(r.sort[k]||0)*(prices[k]||0),0).toFixed(0)} €</span>
                    </div>
                    <div style={{fontSize:11,color:'#6b7280',marginTop:2}}>
                      G={r.vidG.toFixed(2)} · H={r.vidH}m · D={r.vidD>0?r.vidD.toFixed(1)+'cm':'—'} · {r.kvalitate} · {r.bonitate||'—'}
                    </div>
                    {Object.keys(r.sort||{}).filter(k=>(r.sort[k]||0)>0.1).map(k=>(
                      <div key={k} style={{display:'flex',justifyContent:'space-between',fontSize:11,color:'#9ca3af',marginLeft:8,marginTop:2}}>
                        <span>{SORT_NAMES[k]}</span>
                        <span>{(r.sort[k]||0).toFixed(1)} m³ × {prices[k]}€ = {((r.sort[k]||0)*prices[k]).toFixed(0)}€</span>
                      </div>
                    ))}
                  </div>
                ))}
                <div style={{display:'flex',justifyContent:'space-between',fontWeight:700,fontSize:14}}>
                  <span>Nogabals kopā</span>
                  <span style={{color:'#4ade80'}}>{rez.kopKraja.toFixed(1)} m³ · {rez.kopVal.toFixed(0)} €</span>
                </div>
                {n.piezimes?.pievesana&&<div style={{fontSize:11,color:'#6b7280',marginTop:4}}>🚛 {n.piezimes.pievesana}</div>}
                {n.piezimes?.zaglesana&&<div style={{fontSize:11,color:'#6b7280'}}>🪚 {n.piezimes.zaglesana}</div>}
                {n.piezimes?.izvesana&&<div style={{fontSize:11,color:'#6b7280'}}>🚜 {n.piezimes.izvesana}</div>}
                {n.piezimes?.citas&&<div style={{fontSize:11,color:'#6b7280'}}>📝 {n.piezimes.citas}</div>}
              </div>
            )
          })}

          <div style={S.card}>
            <div style={{fontSize:12,color:'#6b7280',fontWeight:700,marginBottom:8}}>SORTIMENTU KOPSAVILKUMS</div>
            {Object.keys(visSort).filter(k=>visSort[k]>0.1).map(k=>(
              <div key={k} style={{display:'flex',justifyContent:'space-between',marginBottom:4,fontSize:13}}>
                <span style={{color:'#f0f4f8'}}>{SORT_NAMES[k]}</span>
                <span style={{fontFamily:'monospace',color:'#4ade80'}}>{visSort[k].toFixed(1)} m³ · {(visSort[k]*prices[k]).toFixed(0)} €</span>
              </div>
            ))}
          </div>

          <button style={S.btnG} onClick={()=>{
            const today=new Date().toLocaleDateString('lv-LV')
            let html=`<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Cirsmas vērtēšana</title>
<style>body{font-family:Arial;font-size:11px;padding:20px;max-width:900px;margin:0 auto}h2{color:#225522;border-bottom:2px solid #225522;padding-bottom:4px}h3{color:#225522;margin:10px 0 4px}table{border-collapse:collapse;width:100%;margin-bottom:10px}th{background:#225522;color:white;padding:3px 6px;font-size:10px;text-align:left}td{border:1px solid #ccc;padding:3px 6px;font-size:10px}tr:nth-child(even){background:#f0f8f0}.kops{font-weight:bold;font-size:12px;margin:4px 0}.logo{font-size:18px;font-weight:bold;color:#225522}</style>
</head><body>
<div class="logo">🌲 MEŽA TIRGUS — Cirsmas novērtēšana</div>
<p><b>Kadastrs:</b> ${kadastrs} | <b>Saimniecība:</b> ${saimnieciba||'—'} | <b>Datums:</b> ${today}</p>
<p><b>Veids:</b> ${veids==='cirsma'?'Cirsma':'Nogabals'} | <b>Kopējā krāja:</b> ${visKraja.toFixed(1)} m³ | <b>Kopējā vērtība:</b> ${visVal.toFixed(0)} €</p>`

            cirsma.nogabali.forEach((n,ni)=>{
              const rez=visRez[ni]
              html+=`<h2>Nogabals ${n.nr||ni+1} — ${n.platiba} ha | ${n.augsneTips} | ${n.cirteVeids} | ${n.pievesana}</h2>`
              html+=`<table><thead><tr><th>Suga</th><th>Stāvs</th><th>Vid.G m²/ha</th><th>H m</th><th>Vid.D cm</th><th>Bon</th><th>Kval</th><th>Krāja m³</th><th>Zāģb.</th><th>Fin.</th><th>Tara</th><th>Papīrm.</th><th>Malka</th><th>Šķelda</th><th>€</th></tr></thead><tbody>`
              rez.sugaRez.forEach(r=>{
                const sVal=Object.keys(r.sort||{}).reduce((s,k)=>s+(r.sort[k]||0)*(prices[k]||0),0)
                html+=`<tr><td>${r.suga}</td><td>${r.stavs==='otrais'?'2.':'1.'}</td><td>${r.vidG.toFixed(2)}</td><td>${r.vidH}</td><td>${r.vidD>0?r.vidD.toFixed(1):'—'}</td><td>${r.bonitate||'—'}</td><td>${r.kvalitate}</td><td>${r.kraja.toFixed(1)}</td><td>${((r.sort?.log||0)).toFixed(1)}</td><td>${((r.sort?.veneer||0)).toFixed(1)}</td><td>${((r.sort?.tara||0)).toFixed(1)}</td><td>${((r.sort?.pulp||0)).toFixed(1)}</td><td>${((r.sort?.fire||0)).toFixed(1)}</td><td>${((r.sort?.chips||0)).toFixed(1)}</td><td>${sVal.toFixed(0)}</td></tr>`
              })
              html+=`</tbody></table>`
              html+=`<p class="kops">Nogabals kopā: ${rez.kopKraja.toFixed(1)} m³ | ${rez.kopVal.toFixed(0)} €</p>`
              if(n.piezimes?.pievesana) html+=`<p>🚛 <b>Pievešana:</b> ${n.piezimes.pievesana}</p>`
              if(n.piezimes?.zaglesana) html+=`<p>🪚 <b>Zāģēšana:</b> ${n.piezimes.zaglesana}</p>`
              if(n.piezimes?.izvesana) html+=`<p>🚜 <b>Izvešana:</b> ${n.piezimes.izvesana}</p>`
              if(n.piezimes?.citas) html+=`<p>📝 <b>Piezīmes:</b> ${n.piezimes.citas}</p>`
            })

            html+=`<h2>KOPSAVILKUMS</h2><table><thead><tr><th>Sortiments</th><th>Kopā m³</th><th>Cena €/m³</th><th>Vērtība €</th></tr></thead><tbody>`
            Object.keys(visSort).filter(k=>visSort[k]>0.1).forEach(k=>{
              html+=`<tr><td>${SORT_NAMES[k]}</td><td>${visSort[k].toFixed(1)}</td><td>${prices[k]}</td><td>${(visSort[k]*prices[k]).toFixed(0)}</td></tr>`
            })
            html+=`</tbody></table><p class="kops" style="font-size:14px">KOPĒJĀ VĒRTĪBA: ${visVal.toFixed(0)} €</p>`
            html+=`<p style="font-size:9px;color:#888;margin-top:16px">* Sagatavots ar Meža tirgus kalkulatoru · ${today}</p></body></html>`
            const win=window.open('','_blank')
            win.document.write(html)
            win.document.close()
            win.print()
          }}>🖨 Drukāt / Saglabāt PDF</button>

          <button style={S.btnB} onClick={()=>setSkats('cenas')}>⚙ Mainīt cenas</button>
          <button style={S.btnB} onClick={()=>setSkats('sakums')}>← Uz sākumu</button>
        </div>
      </div>
    )
  }

  return null
}