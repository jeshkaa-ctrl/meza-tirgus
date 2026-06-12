import { useState } from 'react'
import 'leaflet/dist/leaflet.css'
import { C as DS, F, spinnerCSS } from './ds'
import { AIZSARDZIBA, getAizsardzibaStatus, SORT_CENAS } from './ipasums/constants'
import { buildWFS, lvmWFS, wfsDiagnostika, apstradatNogabalu, paarrekinatRindu } from './ipasums/engine'
import IpasumKarte      from './ipasums/Karte'
import IpasumTabula     from './ipasums/Tabula'
import IpasumDiagrammas from './ipasums/Diagrammas'

const CILNES = [
  { id:'karte',      label:'🗺 Karte'      },
  { id:'tabula',     label:'📋 Tabula'     },
  { id:'diagrammas', label:'📊 Diagrammas' },
]

export default function IpasumAnalīze({ onBack }) {
  const [faze,     setFaze]     = useState('ievads')
  const [kadInput, setKadInput] = useState('')
  const [kluda,    setKluda]    = useState('')
  const [ladeText, setLadeText] = useState('')
  const [kadGeom,  setKadGeom]  = useState(null)
  const [editData, setEditData] = useState([])
  const [dapTer,   setDapTer]   = useState([])
  const [aizsStatus, setAizsStatus] = useState(AIZSARDZIBA.nav)
  const [cilne,    setCilne]    = useState('karte')
  const [slani,    setSlani]    = useState({ nogabali:true, dap:true, kadastra:true, ortofoto:false })

  // ── Analīze ─────────────────────────────────────────────────────────────────
  const analizet = async () => {
    const kad = kadInput.replace(/\s/g, '')
    if (!/^\d{11}$/.test(kad)) {
      setKluda('Kadastra numuram jābūt 11 cipariem (piemērs: 42820040063)'); return
    }
    setKluda(''); setFaze('lade'); setLadeText('Saņem kadastra robežas...')
    try {
      // 1. Kadastra robeža
      const kadUrl = buildWFS('/publicwfs/wfs', 'publicwfs:kkparcel', `code='${kad}'`)
      let kadData
      try {
        kadData = await lvmWFS(kadUrl)
      } catch (e) {
        if (e.message.startsWith('WFS_400') || e.message.startsWith('WFS_500')) {
          setLadeText('Diagnostika...')
          const info = await wfsDiagnostika('/publicwfs/wfs', 'publicwfs:kkparcel')
          setFaze('ievads'); setKluda(`LVM GEO kļūda. ${info}`); return
        }
        throw e
      }
      const kadFeat = kadData?.features?.[0]
      if (!kadFeat) { setFaze('ievads'); setKluda(`Kadastra '${kad}' nav atrasts LVM GEO.`); return }
      setKadGeom(kadFeat)

      // 2. VMD nogabali
      setLadeText('Iegūst VMD nogabalu datus...')
      const vmdUrl  = buildWFS('/publicwfs/ows', 'publicwfs:vmdpubliccompartments', `kadastrs='${kad}'`, 500)
      const vmdRaw  = await fetch(vmdUrl)
      const vmdText = await vmdRaw.text()
      let vmdData
      try { vmdData = JSON.parse(vmdText) } catch { throw new Error('WFS nav JSON: ' + vmdText.slice(0,200)) }
      if (vmdData.error) throw new Error(vmdData.error)

      // 3. Egļu aizsardzība
      setLadeText('Iegūst aizsardzības teritorijas...')
      let dapFeatures = []
      try {
        const dapData = await lvmWFS(buildWFS('/publicwfs/ows', 'publicwfs:vmdspruceprotcompartments', `cadaster='${kad}'`, 20))
        dapFeatures = dapData?.features || []
      } catch { /* nav kritiski */ }

      setLadeText('Aprēķina meža vērtību...')
      const aizsardzibaStatus = getAizsardzibaStatus(dapFeatures)
      const nogabali = (vmdData?.features || []).map((f,i) => {
        const n = apstradatNogabalu(f, i)
        if (aizsardzibaStatus.cirte === 'aizliegta') n.lemums = 'Cirte aizliegta'
        else if (aizsardzibaStatus.cirte === 'ierobežota' && n.lemums !== '—') n.lemums += ' — Ierobežota'
        return n
      })

      setEditData(nogabali.map(n => ({ ...n })))
      setDapTer(dapFeatures)
      setAizsStatus(aizsardzibaStatus)
      setCilne('karte')
      setFaze('rezultats')
    } catch (e) {
      console.error('IpasumAnalīze:', e)
      setFaze('ievads')
      setKluda(`Kļūda: ${e.message.slice(0, 200)}`)
    }
  }

  // ── Tabulas rediģēšana ───────────────────────────────────────────────────────
  const updateRinda = (i, lauks, val) => {
    setEditData(prev => {
      const arr = [...prev]
      arr[i] = paarrekinatRindu({ ...arr[i], [lauks]: lauks === 'bon' ? val : (parseFloat(val) || 0) })
      return arr
    })
  }

  // ── Kopsavilkuma aprēķini ────────────────────────────────────────────────────
  const kopPlatiba  = editData.reduce((s,n)=>s+n.platiba,0)
  const kopKubatura = editData.reduce((s,n)=>s+n.kubatura,0)
  const kopIndVert  = editData.reduce((s,n)=>s+n.indVertiba,0)
  const izcGalv = editData.reduce((s,n)=>{const lb=n.lemums.toLowerCase(); return (lb.includes('kailcirte')||lb.includes('galvenā cirte'))?s+n.izcertamaKraja:s},0)
  const izcKops = editData.reduce((s,n)=>(n.lemums.toLowerCase().includes('kopšanas cirte')?s+n.izcertamaKraja:s),0)
  const sugasPaPlat = editData.reduce((acc,n)=>{ acc[n.sugaNos]=(acc[n.sugaNos]||0)+n.platiba; return acc },{})
  const domSuga  = Object.entries(sugasPaPlat).sort((a,b)=>b[1]-a[1])[0]?.[0] || '—'
  const vidVecums= kopPlatiba>0 ? Math.round(editData.reduce((s,n)=>s+n.vecums*n.platiba,0)/kopPlatiba) : 0

  const C = { bg:DS.bg, card:DS.bgCard, inner:DS.bgInner, border:DS.greenBdr, text:DS.text, dim:DS.textDim, sec:DS.textSec, green:DS.green }
  const inp = { background:DS.bgDeep, border:`1px solid ${DS.greenBdr}`, color:DS.text, borderRadius:6, padding:'10px 14px', fontSize:16, outline:'none', width:'100%', boxSizing:'border-box', fontFamily:F.family }
  const btnPrimary = { background:`linear-gradient(135deg,${DS.green},${DS.greenDk})`, color:'white', border:'none', borderRadius:8, padding:'13px 28px', fontSize:15, fontWeight:700, cursor:'pointer', minHeight:44 }

  // ═══════════ IEVADS ══════════════════════════════════════════════════════════
  if (faze === 'ievads') return (
    <div style={{ minHeight:'100vh', background:C.bg, color:C.text, fontFamily:F.family }}>
      <style>{spinnerCSS}</style>
      <div style={{ background:DS.glass, borderBottom:`1px solid ${C.border}`, backdropFilter:'blur(8px)', padding:'0 20px', height:52, display:'flex', alignItems:'center', gap:12, position:'sticky', top:0, zIndex:10 }}>
        {onBack && <button onClick={onBack} style={{ background:'none', border:'none', color:C.green, fontSize:22, cursor:'pointer', minWidth:36, minHeight:44 }}>←</button>}
        <div>
          <div style={{ color:C.green, fontSize:F.md, fontWeight:F.weightBold }}>🗺 Īpašuma analīze</div>
          <div style={{ color:C.dim, fontSize:F.xs }}>LVM GEO automātiskā meža inventarizācija</div>
        </div>
      </div>
      <div style={{ maxWidth:560, margin:'0 auto', padding:'32px 20px 60px' }}>
        <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:16, padding:'28px 24px', marginBottom:16 }}>
          <div style={{ fontSize:13, color:C.sec, marginBottom:20, lineHeight:1.6 }}>
            Ievadi 11-ciparu kadastra numuru — sistēma automātiski iegūst nogabalu datus no LVM GEO,
            aprēķina kubatūru pēc MK 228 veidaugstumu tabulas un indikatīvo vērtību.
          </div>
          <label style={{ fontSize:11, color:C.dim, fontWeight:600, display:'block', marginBottom:6, textTransform:'uppercase', letterSpacing:'0.08em' }}>
            Kadastra numurs
          </label>
          <div style={{ display:'flex', gap:10, marginBottom:8 }}>
            <input value={kadInput}
              onChange={e=>setKadInput(e.target.value.replace(/[^\d\s]/g,''))}
              onKeyDown={e=>e.key==='Enter'&&analizet()}
              placeholder="Piemērs: 42820040063" maxLength={14}
              style={{ ...inp, flex:1 }} />
            <button onClick={analizet} style={{ ...btnPrimary, padding:'13px 20px' }}>🔍</button>
          </div>
          <div style={{ fontSize:11, color:C.dim }}>
            11 cipari bez atstarpēm. <span style={{ color:C.green }}>Piemērs: 42820040063</span>
          </div>
          {kluda && (
            <div style={{ marginTop:12, background:'#2a0a0a', border:'1px solid #c62828', borderRadius:8, padding:'10px 14px', fontSize:12, color:'#ef9a9a' }}>
              ⚠️ {kluda}
            </div>
          )}
          <button onClick={analizet} style={{ ...btnPrimary, width:'100%', marginTop:20 }}>
            Analizēt īpašumu →
          </button>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(140px,1fr))', gap:10 }}>
          {[
            { icon:'🌲', text:'VMD nogabali — suga, vecums, bonitāte, platība' },
            { icon:'📊', text:'Kubatūra pēc MK 228 veidaugstumu tabulas'        },
            { icon:'🔒', text:'Egļu aizsardzības zonas no LVM GEO'              },
            { icon:'🗺', text:'Interaktīva karte, tabula un diagrammas'          },
          ].map((x,i) => (
            <div key={i} style={{ background:C.inner, border:`1px solid ${C.border}`, borderRadius:10, padding:'12px 14px' }}>
              <div style={{ fontSize:20, marginBottom:6 }}>{x.icon}</div>
              <div style={{ fontSize:11, color:C.sec, lineHeight:1.5 }}>{x.text}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )

  // ═══════════ IELĀDE ══════════════════════════════════════════════════════════
  if (faze === 'lade') return (
    <div style={{ minHeight:'100vh', background:C.bg, display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column', gap:20, fontFamily:F.family }}>
      <style>{spinnerCSS}{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <div style={{ width:52, height:52, border:`3px solid ${DS.greenBdr}`, borderTop:`3px solid ${DS.green}`, borderRadius:'50%', animation:'spin 1s linear infinite' }} />
      <div style={{ textAlign:'center' }}>
        <div style={{ color:DS.green, fontSize:F.md, fontWeight:600, marginBottom:6 }}>🗺 Analizē īpašumu</div>
        <div style={{ color:C.sec, fontSize:F.sm }}>{ladeText}</div>
        <div style={{ color:C.dim, fontSize:F.xs, marginTop:4 }}>{kadInput}</div>
      </div>
    </div>
  )

  // ═══════════ REZULTĀTI ═══════════════════════════════════════════════════════
  return (
    <div style={{ minHeight:'100vh', background:C.bg, color:C.text, fontFamily:F.family }}>
      <style>{spinnerCSS}</style>

      {/* Header */}
      <div style={{ background:DS.glass, borderBottom:`1px solid ${C.border}`, backdropFilter:'blur(8px)', padding:'0 16px', height:52, display:'flex', alignItems:'center', gap:10, position:'sticky', top:0, zIndex:10 }}>
        <button onClick={()=>setFaze('ievads')} style={{ background:'none', border:'none', color:C.green, fontSize:22, cursor:'pointer', minWidth:36, minHeight:44 }}>←</button>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ color:C.green, fontSize:F.md, fontWeight:F.weightBold, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>🗺 {kadInput}</div>
          <div style={{ color:C.dim, fontSize:F.xs }}>
            {editData.length} nogabali · {kopPlatiba.toFixed(2)} ha · {kopKubatura.toFixed(0)} m³
            {editData[0]?.taksGads && <span style={{ color:'#f9a825', marginLeft:6 }}>· taks. {editData[0].taksGads}</span>}
          </div>
        </div>
      </div>

      {/* Aizsardzības josla */}
      {aizsStatus.cirte !== 'briva' && (
        <div style={{ margin:'10px 16px 0', padding:'8px 14px', borderRadius:8, fontSize:13, fontWeight:600,
          background: aizsStatus.cirte==='aizliegta' ? '#2a0a0a' : '#1a1000',
          border:`1px solid ${aizsStatus.cirte==='aizliegta' ? '#c62828' : '#e65100'}`,
          color: aizsStatus.cirte==='aizliegta' ? '#ef9a9a' : '#ffcc80' }}>
          {aizsStatus.label}
          {dapTer.length>0 && <span style={{ fontSize:11, marginLeft:8, opacity:0.7 }}>({dapTer.length} teritorija)</span>}
        </div>
      )}

      {/* DAP brīdinājums */}
      <div style={{ margin:'8px 16px 0', padding:'8px 14px', borderRadius:8, background:'#1a1408', border:'1px solid #f9a82544', display:'flex', alignItems:'center', justifyContent:'space-between', gap:12, flexWrap:'wrap' }}>
        <div style={{ fontSize:12, color:'#ffcc80' }}>⚠️ Pārbaudiet mikroliegrumus, dabas liegrumus un aizsargjoslas:</div>
        <a href={`https://www.dap.gov.lv/lv/aizsargajamas-teritorijas/mikroliegumi?search=${kadInput}`}
          target="_blank" rel="noreferrer"
          style={{ fontSize:12, fontWeight:700, color:'#f9a825', textDecoration:'none', padding:'4px 12px', border:'1px solid #f9a82566', borderRadius:6, background:'#f9a82511', flexShrink:0 }}>
          dap.gov.lv →
        </a>
      </div>

      {/* Kopsavilkuma kartiņas */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(120px,1fr))', gap:8, padding:'10px 16px 0' }}>
        {[
          { label:'Kopplatība',   val:`${kopPlatiba.toFixed(1)} ha`,          color:C.green    },
          { label:'Nogabali',     val: editData.length,                        color:DS.info    },
          { label:'Dom. suga',    val: domSuga,                                color:'#f9a825'  },
          { label:'Vid. vecums',  val: vidVecums ? `${vidVecums} g.` : '—',   color:C.sec      },
          { label:'Kopkubatūra',  val:`${kopKubatura.toFixed(0)} m³`,         color:'#4ade80'  },
          { label:'Galv. cirtē',  val: izcGalv>0 ? `${izcGalv} m³` : '—',   color:'#2e7d32'  },
          { label:'Kopš. cirtē',  val: izcKops>0 ? `${izcKops} m³` : '—',   color:'#f9a825'  },
          { label:'Ind. vērtība', val:`${kopIndVert.toLocaleString()} €`,     color:'#4ade80'  },
        ].map((x,i) => (
          <div key={i} style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:10, padding:'10px 12px' }}>
            <div style={{ fontSize:9, color:C.dim, marginBottom:3, textTransform:'uppercase', letterSpacing:'0.06em' }}>{x.label}</div>
            <div style={{ fontSize:16, fontWeight:700, color:x.color, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{x.val}</div>
          </div>
        ))}
      </div>

      {/* Cilnes */}
      <div style={{ display:'flex', gap:0, padding:'10px 16px 0', borderBottom:`1px solid ${C.border}`, overflowX:'auto' }}>
        {CILNES.map(c => (
          <button key={c.id} onClick={()=>setCilne(c.id)} style={{
            background:'none', border:'none', fontFamily:F.family, whiteSpace:'nowrap',
            borderBottom: cilne===c.id ? `2px solid ${DS.green}` : '2px solid transparent',
            color: cilne===c.id ? DS.green : C.sec,
            padding:'8px 16px', fontSize:F.sm, fontWeight: cilne===c.id ? 600 : 400, cursor:'pointer',
          }}>{c.label}</button>
        ))}
      </div>

      {/* Cilņu saturs */}
      {cilne === 'karte' && (
        <IpasumKarte kadGeom={kadGeom} editData={editData} dapTer={dapTer} slani={slani} setSlani={setSlani} />
      )}
      {cilne === 'tabula' && (
        <IpasumTabula editData={editData} updateRinda={updateRinda}
          kopPlatiba={kopPlatiba} kopKubatura={kopKubatura} />
      )}
      {cilne === 'diagrammas' && (
        <IpasumDiagrammas editData={editData} dapTer={dapTer}
          kopPlatiba={kopPlatiba} kopKubatura={kopKubatura} kopIndVert={kopIndVert}
          domSuga={domSuga} vidVecums={vidVecums} />
      )}
    </div>
  )
}
