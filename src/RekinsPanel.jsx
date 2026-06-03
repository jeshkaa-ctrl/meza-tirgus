import React, { useState } from "react"
import { getKlienti, saveKlients } from "./CaurmeraPanel"

function RekinsPanel({kadastrs, saimnieciba, platiba, onClose, user, onReg}){
const [sniedzejs, setSniedzejs] = useState(()=>JSON.parse(localStorage.getItem("rekins_sniedzejs")||"{}"))
const [sanemejs, setSanemejs] = useState(()=>{ const p=JSON.parse(localStorage.getItem("rekins_sanemejs_pedejais")||"{}"); return {nosaukums:saimnieciba||p.nosaukums||"", regNr:p.regNr||"", adrese:p.adrese||"", banka:p.banka||"", kods:p.kods||"", konts:p.konts||""} })
const [rekinsNr, setRekinsNr] = useState(()=>{const n=Number(localStorage.getItem("rekins_nr")||0)+1;return n})
const [datums, setDatums] = useState(new Date().toLocaleDateString("lv-LV"))
const [apmaksaTermins, setApmaksaTermins] = useState(()=>{const d=new Date();d.setDate(d.getDate()+10);return d.toLocaleDateString("lv-LV")})
const [periods, setPeriods] = useState("")
const [pvnRezims, setPvnRezims] = useState("bez")
const [rindas, setRindas] = useState([
  {apraksts: kadastrs ? `Meža inventarizācija, kad.Nr. ${kadastrs}` : "", mervieniba:"ha", daudzums: platiba>0?platiba.toFixed(2):"", cena:"", summa:0}
])
const [izrakstija, setIzrakstija] = useState(sniedzejs.izrakstija||"")
const [klientuPiedav, setKlientuPiedav] = useState([])
const [showPiedav, setShowPiedav] = useState(false)
const handleNosaukums = (val) => { setSanemejs({...sanemejs, nosaukums: val}); if (val.length < 1) { setKlientuPiedav([]); setShowPiedav(false); return }; const atbilst = getKlienti().filter(k => k.nosaukums.toLowerCase().includes(val.toLowerCase())).slice(0, 6); setKlientuPiedav(atbilst); setShowPiedav(atbilst.length > 0) }
const izveleties = (klients) => { setSanemejs({ nosaukums: klients.nosaukums||"", regNr: klients.regNr||"", adrese: klients.adrese||"", banka: klients.banka||"", kods: klients.kods||"", konts: klients.konts||"" }); setShowPiedav(false); setKlientuPiedav([]) }
const saveSniedzejs = (jauns) => {
  const j = {...sniedzejs, ...jauns}
  setSniedzejs(j)
  localStorage.setItem("rekins_sniedzejs", JSON.stringify(j))
}

const updateRinda = (i, field, val) => {
  const n = [...rindas]
  n[i] = {...n[i], [field]: val}
  if(field==="daudzums" || field==="cena"){
    const d = parseFloat(n[i].daudzums)||0
    const c = parseFloat(n[i].cena)||0
    n[i].summa = d*c
  }
  setRindas(n)
}

const pievienotRindu = () => setRindas([...rindas, {apraksts:"", mervieniba:"ha", daudzums:"", cena:"", summa:0}])
const dzestRindu = (i) => setRindas(rindas.filter((_,j)=>j!==i))

const kopaa = rindas.reduce((s,r)=>s+(r.summa||0), 0)
const pvn = pvnRezims==="pvn21" ? kopaa*0.21 : 0
const kopa_apmaksai = kopaa + pvn

const skaitliVardos = (n) => {
  const v = Math.floor(n)
  const c = Math.round((n-v)*100)
  const vieninieki = ["","viens","divi","trīs","četri","pieci","seši","septiņi","astoņi","deviņi","desmit","vienpadsmit","divpadsmit","trīspadsmit","četrpadsmit","piecpadsmit","sešpadsmit","septiņpadsmit","astoņpadsmit","deviņpadsmit"]
  const desmiti = ["","","divdesmit","trīsdesmit","četrdesmit","piecdesmit","sešdesmit","septiņdesmit","astoņdesmit","deviņdesmit"]
  const simti = ["","simts","divi simti","trīs simti","četri simti","pieci simti","seši simti","septiņi simti","astoņi simti","deviņi simti"]
  let s = ""
  if(v >= 1000) s += (v>=2000?vieninieki[Math.floor(v/1000)]+" ":"")+"tūkstoši "
  const h = Math.floor((v%1000)/100)
  if(h) s += simti[h]+" "
  const t = Math.floor((v%100)/10)
  const o = v%10
  if(v%100 < 20) s += vieninieki[v%100]+" "
  else { if(t) s += desmiti[t]+" "; if(o) s += vieninieki[o]+" " }
  return s.trim()+" euro "+(c>0?`un ${c} centi`:"un 00 centi")
}

const exportRekins = () => {
  localStorage.setItem("rekins_nr", rekinsNr)
const saglabataisRekinis = {
  id: Date.now(),
  nr: rekinsNr,
  gads: new Date().getFullYear(),
  datums,
  klients: sanemejs.nosaukums || "—",
  summa: kopa_apmaksai.toFixed(2),
  pvnRezims,
  sniedzejs: {...sniedzejs},
  sanemejs: {...sanemejs},
  rindas: [...rindas],
  periods,
  apmaksaTermins,
  izrakstija
}
saveKlients({...sanemejs})
localStorage.setItem("rekins_sanemejs_pedejais", JSON.stringify(sanemejs))
const esosie = JSON.parse(localStorage.getItem("rekinu_kratuve") || "[]")
localStorage.setItem("rekinu_kratuve", JSON.stringify([saglabataisRekinis, ...esosie]))
  const gads = new Date().getFullYear()
  const html = `<html><head><meta charset="UTF-8">
<style>
body{font-family:Arial;font-size:11px;padding:24px;max-width:850px;margin:0 auto}
h2{text-align:center;font-size:13px;margin:4px 0}
table{border-collapse:collapse;width:100%;margin:8px 0}
th{background:#225522;color:white;padding:4px 8px;font-size:10px;text-align:left}
td{border:1px solid #ccc;padding:3px 8px;font-size:10px}
.info td{border:none;padding:2px 4px}
.label{font-weight:bold}
.total{font-weight:bold;background:#f0f8f0}
</style></head><body>
<p style="text-align:right;font-size:11px">${datums} &nbsp;&nbsp;&nbsp; <b>Rēķins Nr. ${rekinsNr} - ${gads}</b></p>
<table class="info"><tbody>
<tr><td style="width:50%;vertical-align:top">
<b>Pakalpojumu sniedzējs:</b><br/>
${sniedzejs.nosaukums||"___________________"}<br/>
Reģ.Nr. ${sniedzejs.regNr||"___________________"}<br/>
${sniedzejs.adrese||"___________________"}<br/>
Banka: ${sniedzejs.banka||"___________________"}<br/>
Kods: ${sniedzejs.kods||"___________________"}<br/>
Konts: ${sniedzejs.konts||"___________________"}
</td><td style="vertical-align:top">
<b>Pakalpojumu saņēmējs:</b><br/>
${sanemejs.nosaukums||"___________________"}<br/>
Reģ.Nr. ${sanemejs.regNr||"___________________"}<br/>
${sanemejs.adrese||"___________________"}<br/>
Banka: ${sanemejs.banka||"___________________"}<br/>
Kods: ${sanemejs.kods||"___________________"}<br/>
Konts: ${sanemejs.konts||"___________________"}
</td></tr>
</tbody></table>
${periods?`<p><b>Pakalpojumu sniegšanas periods:</b> ${periods}</p>`:""}
<p><b>Apmaksāt:</b> Līdz ${apmaksaTermins}</p>
<table>
<thead><tr><th>Nr.</th><th>Pakalpojuma nosaukums</th><th>Mērv.</th><th>Daudzums</th><th>Cena</th><th>Summa, EUR</th></tr></thead>
<tbody>
${rindas.map((r,i)=>`<tr><td>${i+1}</td><td>${r.apraksts}</td><td>${r.mervieniba}</td><td>${r.daudzums}</td><td>${parseFloat(r.cena||0).toFixed(2)}</td><td>${(r.summa||0).toFixed(2)}</td></tr>`).join("")}
</tbody>
<tfoot>
<tr class="total"><td colspan="5">Kopā</td><td>${kopaa.toFixed(2)}</td></tr>
${pvnRezims==="pvn21"?`<tr><td colspan="5">PVN 21%</td><td>${pvn.toFixed(2)}</td></tr><tr class="total"><td colspan="5">Kopā apmaksai</td><td>${kopa_apmaksai.toFixed(2)}</td></tr>`:""}
${pvnRezims==="reversais"?`<tr><td colspan="6" style="font-style:italic">Reversa PVN piemērošana saskaņā ar PVN likuma 142. pantu</td></tr>`:""}
</tfoot>
</table>
<p>Summa apmaksai vārdiem: <b>${skaitliVardos(kopa_apmaksai)}</b></p>
<div style="display:flex;justify-content:space-between;margin-top:30px;font-size:11px">
<div>Rēķinu izrakstīja: <b>${izrakstija||"___________________"}</b> ___________________________</div>
<div>${datums}</div>
</div>
<p style="font-size:9px;color:#888;margin-top:16px">Dokuments sagatavots elektroniski un derīgs bez paraksta.</p>
</body></html>`
  const win = window.open("","_blank")
  win.document.write(html)
  win.document.close()
  win.print()
  alert("✅ Rēķins Nr. " + rekinsNr + " saglabāts rēķinu krātuvē!")
}

return(
<div style={{marginTop:"24px",padding:"20px",border:"2px solid #4caf50",borderRadius:"8px",background:"#f0f8f0"}}>
  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"16px"}}>
    <h2 style={{color:"#225522",margin:0}}>🧾 Rēķina sagatave</h2>
    <button onClick={onClose} style={{padding:"4px 12px",background:"#888",color:"white",border:"none",borderRadius:"4px",cursor:"pointer"}}>✕ Aizvērt</button>
  </div>
  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"16px",marginBottom:"16px"}}>
    <div style={{padding:"12px",background:"#f0f8f0",borderRadius:"6px",border:"1px solid #225522"}}>
      <b style={{color:"#225522"}}>Pakalpojumu sniedzējs</b>
      {[["nosaukums","Nosaukums"],["regNr","Reģ.Nr."],["adrese","Adrese"],["banka","Banka"],["kods","SWIFT kods"],["konts","Konts"]].map(([k,l])=>(
        <div key={k} style={{marginTop:"6px"}}>
          <label style={{fontSize:"10px",fontWeight:"bold"}}>{l}:</label><br/>
        <input value={sniedzejs[k]||""} onChange={e=>saveSniedzejs({[k]:e.target.value})} style={{width:"100%",padding:"3px",border:"1px solid #ccc",borderRadius:"3px",fontSize:"11px",color:"#111",background:"white"}}/>
        </div>
      ))}
      <div style={{marginTop:"6px"}}>
        <label style={{fontSize:"10px",fontWeight:"bold"}}>Rēķinu izrakstīja:</label><br/>
        <input value={izrakstija} onChange={e=>{setIzrakstija(e.target.value);saveSniedzejs({izrakstija:e.target.value})}} style={{width:"100%",padding:"3px",border:"1px solid #ccc",borderRadius:"3px",fontSize:"11px"}}/>
      </div>
    </div>
    <div style={{padding:"12px",background:"#e8f5e9",borderRadius:"6px",border:"1px solid #4caf50"}}>
      <b style={{color:"#225522"}}>Pakalpojumu saņēmējs</b>
      <div style={{marginTop:"6px",position:"relative"}}>
        <label style={{fontSize:"10px",fontWeight:"bold"}}>Nosaukums:</label><br/>
        <input value={sanemejs.nosaukums||""} onChange={e=>handleNosaukums(e.target.value)} onBlur={()=>setTimeout(()=>setShowPiedav(false),150)} onFocus={()=>sanemejs.nosaukums&&handleNosaukums(sanemejs.nosaukums)} placeholder="Raksti klienta nosaukumu..." style={{width:"100%",padding:"3px",border:"1px solid #ccc",borderRadius:"3px",fontSize:"11px",boxSizing:"border-box"}}/>
        {showPiedav && klientuPiedav.length > 0 && (
          <div style={{position:"absolute",top:"100%",left:0,right:0,background:"white",border:"1px solid #f9a825",borderRadius:"4px",zIndex:100,boxShadow:"0 4px 12px rgba(0,0,0,0.15)",maxHeight:"200px",overflowY:"auto"}}>
            {klientuPiedav.map((k,i)=>(
              <div key={i} onMouseDown={()=>izveleties(k)} style={{padding:"8px 10px",cursor:"pointer",borderBottom:"1px solid #f5f5f5",fontSize:"11px"}} onMouseEnter={e=>e.currentTarget.style.background="#fff8e1"} onMouseLeave={e=>e.currentTarget.style.background="white"}>
                <div style={{fontWeight:"bold",color:"#e65100"}}>{k.nosaukums}</div>
                {k.regNr && <div style={{fontSize:"10px",color:"#888"}}>Reģ.Nr. {k.regNr}{k.adrese?" · "+k.adrese:""}</div>}
              </div>
            ))}
          </div>
        )}
      </div>
      {[["regNr","Reģ.Nr."],["adrese","Adrese"],["banka","Banka"],["kods","SWIFT kods"],["konts","Konts"]].map(([k,l])=>(
        <div key={k} style={{marginTop:"6px"}}>
          <label style={{fontSize:"10px",fontWeight:"bold"}}>{l}:</label><br/>
       <input value={sanemejs[k]||""} onChange={e=>setSanemejs({...sanemejs,[k]:e.target.value})} style={{width:"100%",padding:"3px",border:"1px solid #ccc",borderRadius:"3px",fontSize:"11px",color:"#111",background:"white"}}/>
        </div>
      ))}
    </div>
  </div>
  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",gap:"8px",marginBottom:"12px"}}>
    <div>
      <label style={{fontSize:"10px",fontWeight:"bold"}}>Rēķina Nr.:</label><br/>
      <input value={rekinsNr} onChange={e=>setRekinsNr(e.target.value)} style={{width:"100%",padding:"3px",border:"1px solid #ccc",borderRadius:"3px",fontSize:"11px"}}/>
    </div>
    <div>
      <label style={{fontSize:"10px",fontWeight:"bold"}}>Datums:</label><br/>
      <input value={datums} onChange={e=>setDatums(e.target.value)} style={{width:"100%",padding:"3px",border:"1px solid #ccc",borderRadius:"3px",fontSize:"11px"}}/>
    </div>
    <div>
      <label style={{fontSize:"10px",fontWeight:"bold"}}>Apmaksas termiņš:</label><br/>
      <input value={apmaksaTermins} onChange={e=>setApmaksaTermins(e.target.value)} style={{width:"100%",padding:"3px",border:"1px solid #ccc",borderRadius:"3px",fontSize:"11px"}}/>
    </div>
    <div>
      <label style={{fontSize:"10px",fontWeight:"bold"}}>Periods:</label><br/>
      <input value={periods} onChange={e=>setPeriods(e.target.value)} placeholder="piem. 2026. gada marts" style={{width:"100%",padding:"3px",border:"1px solid #ccc",borderRadius:"3px",fontSize:"11px"}}/>
    </div>
  </div>
  <div style={{marginBottom:"12px"}}>
    <label style={{fontSize:"10px",fontWeight:"bold"}}>PVN režīms:</label><br/>
    <select value={pvnRezims} onChange={e=>setPvnRezims(e.target.value)} style={{padding:"4px",border:"1px solid #ccc",borderRadius:"3px",fontSize:"11px"}}>
      <option value="bez">Bez PVN</option>
      <option value="pvn21">PVN 21%</option>
      <option value="reversais">Reversais PVN (142. pants)</option>
    </select>
  </div>
  <table border="1" cellPadding="4" style={{fontSize:"11px",width:"100%",marginBottom:"8px"}}>
    <thead style={{background:"#225522",color:"white"}}>
      <tr><th>Nr.</th><th>Pakalpojuma nosaukums</th><th>Mērv.</th><th>Daudzums</th><th>Cena €</th><th>Summa €</th><th></th></tr>
    </thead>
    <tbody>
      {rindas.map((r,i)=>(
        <tr key={i}>
          <td>{i+1}</td>
          <td><input value={r.apraksts} onChange={e=>updateRinda(i,"apraksts",e.target.value)} style={{width:"100%",border:"none",fontSize:"11px"}}/></td>
          <td><input value={r.mervieniba} onChange={e=>updateRinda(i,"mervieniba",e.target.value)} style={{width:"40px",border:"none",fontSize:"11px"}}/></td>
          <td><input type="number" value={r.daudzums} onChange={e=>updateRinda(i,"daudzums",e.target.value)} style={{width:"60px",border:"none",fontSize:"11px"}}/></td>
          <td><input type="number" value={r.cena} onChange={e=>updateRinda(i,"cena",e.target.value)} style={{width:"60px",border:"none",fontSize:"11px"}}/></td>
          <td style={{textAlign:"right"}}>{(r.summa||0).toFixed(2)}</td>
          <td><button onClick={()=>dzestRindu(i)} style={{background:"none",border:"none",color:"#c62828",cursor:"pointer"}}>✕</button></td>
        </tr>
      ))}
    </tbody>
    <tfoot>
      <tr style={{background:"#f0f8f0",fontWeight:"bold"}}>
        <td colSpan="5">Kopā</td><td style={{textAlign:"right"}}>{kopaa.toFixed(2)}</td><td/>
      </tr>
      {pvnRezims==="pvn21" && <>
        <tr><td colSpan="5">PVN 21%</td><td style={{textAlign:"right"}}>{pvn.toFixed(2)}</td><td/></tr>
        <tr style={{background:"#e8f5e9",fontWeight:"bold"}}><td colSpan="5">Kopā apmaksai</td><td style={{textAlign:"right"}}>{kopa_apmaksai.toFixed(2)}</td><td/></tr>
      </>}
      {pvnRezims==="reversais" && <tr><td colSpan="7" style={{fontStyle:"italic",fontSize:"10px"}}>Reversa PVN piemērošana saskaņā ar PVN likuma 142. pantu</td></tr>}
    </tfoot>
  </table>
  <button onClick={pievienotRindu} style={{padding:"4px 12px",background:"#1565c0",color:"white",border:"none",borderRadius:"4px",cursor:"pointer",fontSize:"11px",marginBottom:"12px"}}>+ Pievienot rindu</button>
  <div style={{padding:"8px",background:"#f0f8f0",borderRadius:"4px",marginBottom:"12px",fontSize:"11px"}}>
    <b>Summa vārdiem:</b> {skaitliVardos(kopa_apmaksai)}
  </div>
  {user
? <button onClick={exportRekins} style={{padding:"8px 24px",background:"#225522",color:"white",border:"1px solid #4caf50",borderRadius:"6px",cursor:"pointer",fontSize:"13px",fontWeight:"bold"}}>🖨 Drukāt / Saglabāt PDF</button>
: <button onClick={()=>{ console.log("onReg:", onReg); onReg?.() }} style={{padding:"8px 24px",background:"#888",color:"white",border:"none",borderRadius:"4px",cursor:"pointer",fontSize:"13px"}}>🔒 Reģistrējies lai drukātu PDF</button>
  }
</div>
)
}

export default RekinsPanel
