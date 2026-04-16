import { useState } from "react"

const STORAGE_KEY = 'caurmers_v2'

const MIKSTI = ['B','A','Ba','Bl','G','M']
const BON_CLASSES = ['Ia','I','II','III','IV','V','Va']
const SUGAS = [
  {v:'B',l:'Bērzs (B)'},{v:'P',l:'Priede (P)'},{v:'E',l:'Egle (E)'},
  {v:'Lg',l:'Lapegle (Lg)'},{v:'A',l:'Apse (A)'},{v:'Oz',l:'Ozols (Oz)'},
  {v:'Os',l:'Osis (Os)'},{v:'Ba',l:'Baltalknis (Ba)'},{v:'Bl',l:'Melnalknis (Bl)'},
  {v:'G',l:'Goba (G)'},{v:'M',l:'Melnalksnis (M)'},
]
const minDiam = {
  P:{Ia:39,I:35,II:31,III:30,IV:30,V:30,Va:30},
  E:{Ia:31,I:29,II:29,III:27,IV:26,V:26,Va:26},
  Lg:{Ia:31,I:29,II:29,III:27,IV:26,V:26,Va:26},
  B:{Ia:31,I:27,II:25,III:25,IV:25,V:25,Va:25},
  A:{Ia:31,I:27,II:25,III:25,IV:25,V:25,Va:25},
  Ba:{Ia:25,I:25,II:25,III:25,IV:25,V:25,Va:25},
  Bl:{Ia:25,I:25,II:25,III:25,IV:25,V:25,Va:25},
  Oz:{Ia:39,I:35,II:31,III:30,IV:30,V:30,Va:30},
  Os:{Ia:31,I:29,II:29,III:27,IV:26,V:26,Va:26},
  G:{Ia:25,I:25,II:25,III:25,IV:25,V:25,Va:25},
  M:{Ia:25,I:25,II:25,III:25,IV:25,V:25,Va:25},
}
const bonitateSkujkoki = {
  10:[6,5,4,3,2,1],20:[12,9,7,6,4,2],30:[16,12,10,9,7,5],
  40:[20,17,14,12,9,7],50:[24,20,17,14,11,8],60:[28,23,19,16,13,10],
  70:[30,26,21,18,15,11],80:[32,27,23,20,16,13],90:[34,29,25,22,18,14],
  100:[35,30,26,23,19,15],110:[36,31,28,24,20,16],120:[38,33,29,25,21,17],
  130:[38,33,29,25,21,17],140:[39,34,30,26,22,18],150:[39,34,30,26,22,18],
}
const bonitateMiksti = {
  5:[5,4,3,2,1.5,1],10:[7,6,5,4,3,2],15:[11,10,8,6,5,4],
  20:[14,13,11,9,7,5],25:[16,15,12,10,8,6],30:[18,17,15,12,10,7],
  35:[20,19,16,13,11,9],40:[21,20,18,15,12,10],45:[23,22,19,16,13,11],
  50:[25,24,20,17,14,11],55:[26,25,22,18,15,12],60:[27,26,23,19,16,13],
  65:[28,27,24,20,16,13],70:[28.5,28,24,21,17,13],75:[29,28,25,21,18,14],
  80:[30,29,25,22,18,14],85:[31,30,26,23,19,15],90:[31,30,26,23,19,15],
  100:[31,30,27,23,20,15],110:[32,31,28,24,20,16],120:[33,32,28,25,21,17],
}

function calcBonitate(suga, vec, aug) {
  const tbl = MIKSTI.includes(suga) ? bonitateMiksti : bonitateSkujkoki
  const keys = Object.keys(tbl).map(Number).sort((a,b)=>a-b)
  let row = tbl[keys[0]]
  for (let i = keys.length-1; i >= 0; i--) {
    if (vec >= keys[i]) { row = tbl[keys[i]]; break }
  }
  for (let i = 0; i < row.length; i++) {
    if (aug >= row[i]) return { bon: BON_CLASSES[i], min: row[i] }
  }
  return { bon: 'Va', min: row[row.length-1] }
}

export default function CaurmeraMobile({ onBack }) {
  const [suga, setSuga] = useState('B')
  const [augstums, setAugstums] = useState('')
  const [vecums, setVecums] = useState('')
  const [measurements, setMeasurements] = useState([])
  const [npVal, setNpVal] = useState('')
  const [saved, setSaved] = useState('')

  useState(() => {
    try {
      const s = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null')
      if (s) {
        if (s.suga) setSuga(s.suga)
        if (s.augstums) setAugstums(s.augstums)
        if (s.vecums) setVecums(s.vecums)
        if (Array.isArray(s.measurements)) setMeasurements(s.measurements)
        if (s.savedAt) setSaved('Ielādēts: ' + new Date(s.savedAt).toLocaleTimeString('lv-LV',{hour:'2-digit',minute:'2-digit'}))
      }
    } catch(e) {}
  }, [])

  const doSave = (s, a, v, m) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ suga:s, augstums:a, vecums:v, measurements:m, savedAt: new Date().toISOString() }))
      setSaved('Saglabāts: ' + new Date().toLocaleTimeString('lv-LV',{hour:'2-digit',minute:'2-digit'}))
    } catch(e) {}
  }

  const aug = parseFloat(augstums) || 0
  const vec = parseFloat(vecums) || 0
  const bonResult = (aug > 0 && vec > 0) ? calcBonitate(suga, vec, aug) : null
  const bon = bonResult ? bonResult.bon : 'I'
  const minCaur = (minDiam[suga] && minDiam[suga][bon]) ? minDiam[suga][bon] : 25
  const vidD = measurements.length ? measurements.reduce((a,b)=>a+b,0)/measurements.length : null
  const summa = measurements.reduce((a,b)=>a+b,0)
  const isOk = vidD !== null ? vidD >= minCaur : null
  const diff = vidD !== null ? (vidD - minCaur).toFixed(1) : null
  const hasVal = npVal.length > 0 && parseFloat(npVal) >= 1
  const eligBorder = isOk===null?'#2a2d3a':isOk?'#4ade80':'#ef4444'

  function npPress(c) { setNpVal(v => { if(c==='.'&&v.includes('.')) return v; if(v.length>=4) return v; return v+c }) }
  function npDel() { setNpVal(v => v.slice(0,-1)) }
  function addMeas() {
    const val = parseFloat(npVal)
    if (!val||val<1||val>200) return
    const m = [...measurements, val]
    setMeasurements(m)
    setNpVal('')
    doSave(suga, augstums, vecums, m)
  }
  function delMeas(i) {
    const m = measurements.filter((_,idx)=>idx!==i)
    setMeasurements(m)
    doSave(suga, augstums, vecums, m)
  }
  function clearAll() {
    if (window.confirm('Dzēst visus mērījumus?')) {
      setMeasurements([])
      doSave(suga, augstums, vecums, [])
    }
  }

  function exportCSV() {
    let csv = `Caurmērs\nSuga;${suga}\nAugstums;${augstums} m\nVecums;${vecums} gadi\nBonitāte;${bon}\n\nNr.;cm\n`
    measurements.forEach((v,i) => { csv += `${i+1};${v}\n` })
    csv += `\nKoki;${measurements.length}\nSumma;${summa}\nVid.D;${vidD?vidD.toFixed(1):'—'}\nMin.;${minCaur}\nAtbilstība;${isOk===null?'—':isOk?'Atbilst':'Neatbilst'}\n`
    const blob = new Blob(['\ufeff'+csv],{type:'text/csv;charset=utf-8;'})
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `caurmers_${suga}_${new Date().toISOString().slice(0,10)}.csv`
    a.click()
  }

  function exportPrint() {
    const date = new Date().toLocaleDateString('lv-LV')
    const tblRows = measurements.map((v,i) => `<tr><td>${i+1}</td><td>${v} cm</td></tr>`).join('')
    const statusTxt = isOk===null?'—':isOk
      ?`✓ ATBILST (vid. ${vidD.toFixed(1)} cm, min. ${minCaur} cm, +${diff} cm)`
      :`✗ NEATBILST (vid. ${vidD.toFixed(1)} cm, min. ${minCaur} cm, ${diff} cm)`
    const win = window.open('','_blank')
    win.document.write(`<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Caurmērs</title>
<style>body{font-family:monospace;padding:20px;font-size:13px}h2{border-bottom:2px solid #111;padding-bottom:6px}.info{display:grid;grid-template-columns:1fr 1fr;gap:4px 32px;margin-bottom:14px}.lbl{color:#555;font-size:11px;text-transform:uppercase}.val{font-weight:bold}.status{border:2px solid ${isOk?'#16a34a':'#dc2626'};padding:10px;border-radius:6px;margin-bottom:14px;font-weight:bold;color:${isOk?'#16a34a':'#dc2626'}}table{width:100%;border-collapse:collapse}th{text-align:left;border-bottom:1px solid #ccc;padding:4px 8px;font-size:11px;color:#555}td{padding:4px 8px;border-bottom:1px solid #eee}.summary{background:#f5f5f5;padding:10px;border-radius:6px;display:flex;gap:32px}.sv{font-size:20px;font-weight:bold}.sl{font-size:10px;color:#777;text-transform:uppercase}</style>
</head><body>
<h2>Caurmērs — Mērījumu izdruka</h2>
<div class="info"><span class="lbl">Suga</span><span class="val">${suga}</span><span class="lbl">Augstums</span><span class="val">${augstums} m</span><span class="lbl">Vecums</span><span class="val">${vecums} gadi</span><span class="lbl">Bonitāte</span><span class="val">${bon}</span><span class="lbl">Datums</span><span class="val">${date}</span></div>
<div class="status">${statusTxt}</div>
<table><tr><th>Nr.</th><th>Diametrs</th></tr>${tblRows}</table>
<div class="summary"><div><div class="sv">${measurements.length}</div><div class="sl">Koki</div></div><div><div class="sv">${summa}</div><div class="sl">G.summa</div></div><div><div class="sv">${vidD?vidD.toFixed(1):'—'}</div><div class="sl">Vid.D cm</div></div></div>
<script>window.onload=()=>window.print();<\/script>
</body></html>`)
    win.document.close()
  }

  return (
    <div style={{background:'#0f1117',minHeight:'100vh',color:'#f0f4f8',fontFamily:'system-ui,sans-serif',maxWidth:480,margin:'0 auto',paddingBottom:40}}>
      <div style={{background:'#12151e',borderBottom:'1px solid #2a2d3a',padding:'14px 16px 10px',position:'sticky',top:0,zIndex:10}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
  <div style={{fontSize:22,fontWeight:800,letterSpacing:-1,fontFamily:'monospace'}}>Caur<span style={{color:'#4ade80'}}>mērs</span></div>
          <button onClick={onBack} style={{background:'transparent',border:'1px solid #2a2d3a',color:'#6b7280',padding:'6px 14px',borderRadius:8,cursor:'pointer',fontSize:13}}>← Atpakaļ</button>
          <button onClick={onBack} style={{background:'transparent',border:'1px solid #2a2d3a',color:'#6b7280',padding:'6px 14px',borderRadius:8,cursor:'pointer',fontSize:13}}>← Atpakaļ</button>
        </div>
        <div style={{fontSize:10,color:'#6b7280',minHeight:14,marginTop:4}}>{saved}</div>
        <div style={{display:'flex',gap:8,marginTop:8}}>
          {[{v:measurements.length,l:'Koki'},{v:summa,l:'G.summa'}].map(({v,l})=>(
            <div key={l} style={{background:'#1a1d26',border:'1px solid #2a2d3a',borderRadius:8,padding:'6px 12px',textAlign:'center',minWidth:72}}>
              <div style={{fontFamily:'monospace',fontSize:18,fontWeight:700,color:'#4ade80',lineHeight:1.1}}>{v}</div>
              <div style={{fontSize:9,fontWeight:700,letterSpacing:1,color:'#6b7280',textTransform:'uppercase',marginTop:2}}>{l}</div>
            </div>
          ))}
          <div style={{background:'#1a1d26',border:'1px solid #4ade80',borderRadius:8,padding:'6px 12px',textAlign:'center',minWidth:72}}>
            <div style={{fontFamily:'monospace',fontSize:22,fontWeight:700,color:'#4ade80',lineHeight:1.1}}>{vidD!==null?vidD.toFixed(1):'—'}</div>
            <div style={{fontSize:9,fontWeight:700,letterSpacing:1,color:'#6b7280',textTransform:'uppercase',marginTop:2}}>Vid.D</div>
          </div>
        </div>
      </div>

      <div style={{padding:'16px 16px 0'}}>
        <div style={{fontSize:10,fontWeight:800,letterSpacing:2,color:'#6b7280',textTransform:'uppercase',marginBottom:10}}>Audzes parametri</div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
          <div style={{display:'flex',flexDirection:'column',gap:4}}>
            <div style={{fontSize:9,fontWeight:700,letterSpacing:1.5,color:'#6b7280',textTransform:'uppercase'}}>Suga</div>
            <select style={{background:'#1a1d26',border:'1px solid #2a2d3a',borderRadius:8,padding:'10px 12px',color:'#f0f4f8',fontFamily:'monospace',fontSize:15,outline:'none'}} value={suga} onChange={e=>{setSuga(e.target.value);doSave(e.target.value,augstums,vecums,measurements)}}>
              {SUGAS.map(s=><option key={s.v} value={s.v}>{s.l}</option>)}
            </select>
          </div>
          <div style={{display:'flex',flexDirection:'column',gap:4}}>
            <div style={{fontSize:9,fontWeight:700,letterSpacing:1.5,color:'#6b7280',textTransform:'uppercase'}}>Augstums (m)</div>
            <input style={{background:'#1a1d26',border:'1px solid #2a2d3a',borderRadius:8,padding:'10px 12px',color:'#f0f4f8',fontFamily:'monospace',fontSize:15,outline:'none'}} type="number" value={augstums} onChange={e=>{setAugstums(e.target.value);doSave(suga,e.target.value,vecums,measurements)}} inputMode="decimal"/>
          </div>
          <div style={{display:'flex',flexDirection:'column',gap:4}}>
            <div style={{fontSize:9,fontWeight:700,letterSpacing:1.5,color:'#6b7280',textTransform:'uppercase'}}>Vecums (gadi)</div>
            <input style={{background:'#1a1d26',border:'1px solid #2a2d3a',borderRadius:8,padding:'10px 12px',color:'#f0f4f8',fontFamily:'monospace',fontSize:15,outline:'none'}} type="number" value={vecums} onChange={e=>{setVecums(e.target.value);doSave(suga,augstums,e.target.value,measurements)}} inputMode="numeric"/>
          </div>
          <div style={{display:'flex',flexDirection:'column',gap:4}}>
            <div style={{fontSize:9,fontWeight:700,letterSpacing:1.5,color:'#6b7280',textTransform:'uppercase'}}>Bonitāte <span style={{color:'#4ade80',fontSize:8}}>AUTO</span></div>
            <div style={{background:'#1a1d26',border:'1px solid #2a2d3a',borderRadius:8,padding:'10px 12px',display:'flex',alignItems:'center',gap:8}}>
              <span style={{fontFamily:'monospace',fontSize:20,fontWeight:700,color:'#4ade80'}}>{bonResult?bonResult.bon:'—'}</span>
              <span style={{fontSize:11,color:'#6b7280'}}>{bonResult?`≥${bonResult.min}m`:''}</span>
            </div>
          </div>
        </div>
      </div>

      <div style={{margin:'12px 16px 0',background:'#1a1d26',border:`1px solid ${eligBorder}`,borderRadius:12,padding:14}}>
        <div style={{fontSize:9,fontWeight:800,letterSpacing:2,color:'#6b7280',textTransform:'uppercase',marginBottom:6}}>Min. caurmērs galvenajai cirsmai</div>
        <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:6}}>
          <div style={{fontFamily:'monospace',fontSize:34,fontWeight:700,color:'#f0f4f8',lineHeight:1}}>≥ {minCaur}<span style={{fontSize:16,color:'#6b7280'}}> cm</span></div>
          <div style={{background:'#3b82f6',color:'white',fontFamily:'monospace',fontSize:12,fontWeight:700,padding:'2px 8px',borderRadius:6}}>{bon}</div>
        </div>
        <div style={{fontSize:13,fontWeight:600,display:'flex',alignItems:'center',gap:6}}>
          <div style={{width:8,height:8,borderRadius:'50%',background:eligBorder,flexShrink:0}}/>
          <span>{isOk===null?'Nav mērījumu':isOk?`Vid. ${vidD.toFixed(1)} cm — atbilst (+${diff} cm)`:`Vid. ${vidD.toFixed(1)} cm — neatbilst (${diff} cm)`}</span>
        </div>
      </div>

      <div style={{padding:'14px 16px 0'}}>
        <div style={{display:'flex',gap:8,marginBottom:10,alignItems:'stretch'}}>
          <div style={{flex:1,background:'#1a1d26',border:'2px solid #4ade80',borderRadius:14,padding:'12px 16px',textAlign:'center',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',minHeight:80}}>
            <div style={{fontFamily:'monospace',fontSize:46,fontWeight:700,color:npVal?'#4ade80':'#2a2d3a',lineHeight:1,letterSpacing:2}}>{npVal||'_ _'}</div>
            <div style={{fontSize:11,color:'#6b7280',marginTop:3,fontWeight:600,letterSpacing:1}}>cm</div>
          </div>
          <button style={{width:90,background:hasVal?'#4ade80':'#1a2a1a',color:hasVal?'#0a1a0a':'#4b5563',borderRadius:14,border:'none',fontFamily:'monospace',fontSize:15,fontWeight:800,cursor:hasVal?'pointer':'default',lineHeight:1.2,padding:'0 8px'}}
            onPointerDown={e=>{e.preventDefault();if(hasVal)addMeas()}}>+<br/>PIEVIENO</button>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:8}}>
          {[1,2,3,4,5,6,7,8,9].map(n=>(
            <button key={n} style={{background:'#1a1d26',border:'1px solid #2a2d3a',borderRadius:12,color:'#f0f4f8',fontFamily:'monospace',fontSize:26,fontWeight:700,padding:'16px 0',cursor:'pointer',userSelect:'none',textAlign:'center'}}
              onPointerDown={e=>{e.preventDefault();npPress(String(n))}}>{n}</button>
          ))}
          <button style={{background:'#1a1d26',border:'1px solid #2a2d3a',borderRadius:12,color:'#f0f4f8',fontFamily:'monospace',fontSize:26,fontWeight:700,padding:'16px 0',cursor:'pointer',userSelect:'none',textAlign:'center'}} onPointerDown={e=>{e.preventDefault();npPress('0')}}>0</button>
          <button style={{background:'#1a1d26',border:'1px solid #2a2d3a',borderRadius:12,color:'#f0f4f8',fontFamily:'monospace',fontSize:26,fontWeight:700,padding:'16px 0',cursor:'pointer',userSelect:'none',textAlign:'center'}} onPointerDown={e=>{e.preventDefault();npPress('.')}}>.</button>
          <button style={{background:'#1e1a1a',border:'1px solid #3a2a2a',borderRadius:12,color:'#ef4444',fontFamily:'monospace',fontSize:22,fontWeight:700,padding:'16px 0',cursor:'pointer',userSelect:'none',textAlign:'center'}} onPointerDown={e=>{e.preventDefault();npDel()}}>⌫</button>
        </div>
      </div>

      <div style={{height:1,background:'#2a2d3a',margin:'14px 16px 0'}}/>

      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'10px 16px 0'}}>
        <div style={{fontSize:10,fontWeight:800,letterSpacing:2,color:'#6b7280',textTransform:'uppercase'}}>Mērījumi</div>
        <button style={{background:'transparent',border:'1px solid #2a2d3a',color:'#6b7280',fontSize:13,fontWeight:600,padding:'5px 14px',borderRadius:8,cursor:'pointer'}} onClick={clearAll}>Dzēst visu</button>
      </div>
      <div style={{padding:'8px 16px 0',display:'flex',flexDirection:'column',gap:6}}>
        {measurements.length===0
          ? <div style={{textAlign:'center',color:'#6b7280',fontSize:13,padding:'20px 0'}}>Nav mērījumu</div>
          : [...measurements].map((v,i)=>({v,i})).reverse().map(({v,i})=>(
              <div key={i} style={{background:'#1a1d26',border:'1px solid #2a2d3a',borderRadius:8,padding:'12px 14px',display:'flex',alignItems:'center'}}>
                <span style={{fontFamily:'monospace',fontSize:12,color:'#6b7280',minWidth:28}}>{i+1}.</span>
                <span style={{fontFamily:'monospace',fontSize:18,fontWeight:700,color:'#4ade80',flex:1}}>{v} cm</span>
                <button style={{background:'none',border:'none',color:'#6b7280',fontSize:22,cursor:'pointer',padding:'0 4px',lineHeight:1}} onClick={()=>delMeas(i)}>×</button>
              </div>
            ))
        }
      </div>

      <div style={{display:'flex',gap:8,padding:'14px 16px 0'}}>
        <button style={{flex:1,padding:13,borderRadius:10,fontSize:13,fontWeight:700,cursor:'pointer',background:'#1a1d26',color:'#f0f4f8',border:'1px solid #2a2d3a'}} onClick={exportCSV}>⬇ CSV</button>
        <button style={{flex:1,padding:13,borderRadius:10,fontSize:13,fontWeight:700,cursor:'pointer',background:'#4ade80',color:'#0a1a0a',border:'none'}} onClick={exportPrint}>🖨 Izdruka</button>
      </div>
    </div>
  )
}