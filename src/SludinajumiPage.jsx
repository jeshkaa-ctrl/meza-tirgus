import React, { useState, useEffect } from "react"
import { NOVADI } from "./novadi"
import { DARBIBAS_VEIDI } from "./RegModal"

function NovadsAutocomplete({ onPievienot }) {
  const [ievade, setIevade] = useState("")
  const [piedavajumi, setPiedavajumi] = useState([])

  const handleChange = (val) => {
    setIevade(val)
    if (val.length < 1) { setPiedavajumi([]); return }
    setPiedavajumi(NOVADI.filter(n => n.toLowerCase().startsWith(val.toLowerCase())).slice(0, 6))
  }

  const izveleties = (novads) => {
    onPievienot(novads)
    setIevade("")
    setPiedavajumi([])
  }

  return (
    <div style={{position:"relative"}}>
      <input value={ievade} onChange={e=>handleChange(e.target.value)} placeholder="Raksti novada nosaukumu..."
        style={{width:"100%",padding:"6px",border:"1px solid #ccc",borderRadius:"4px",fontSize:"13px",boxSizing:"border-box"}}/>
      {piedavajumi.length > 0 && (
        <div style={{position:"absolute",top:"100%",left:0,right:0,background:"white",border:"1px solid #ccc",borderRadius:"4px",zIndex:100,boxShadow:"0 2px 8px rgba(0,0,0,0.15)"}}>
          {piedavajumi.map(n=>(
            <div key={n} onClick={()=>izveleties(n)}
              style={{padding:"8px 12px",cursor:"pointer",fontSize:"13px",borderBottom:"1px solid #f0f0f0"}}
              onMouseEnter={e=>e.target.style.background="#f0f8f0"}
              onMouseLeave={e=>e.target.style.background="white"}>
              {n}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function SludinajumsForm({ user, onSaglabat, onAtcelt, esosais }) {
  const [virsraksts, setVirsraksts] = useState(esosais?.virsraksts || "")
  const [apraksts, setApraksts] = useState(esosais?.apraksts || "")
  const [darbiba, setDarbiba] = useState(esosais?.darbiba || user?.darbiba || DARBIBAS_VEIDI[0])
  const [cena, setCena] = useState(esosais?.cena || "")
  const [cenaPecVienosanas, setCenaPecVienosanas] = useState(esosais?.cenaPecVienosanas ?? false)
  const [novadi, setNovadi] = useState(esosais?.novadi || (user?.bazesNovads ? [user.bazesNovads] : []))
  const [kludas, setKludas] = useState("")

  const pievienotNovadu = (n) => {
    if (!novadi.includes(n)) setNovadi([...novadi, n])
  }
  const nonemtNovadu = (n) => setNovadi(novadi.filter(x => x !== n))

  const saglabat = () => {
    if (!virsraksts.trim()) return setKludas("Ievadi virsrakstu!")
    if (!apraksts.trim()) return setKludas("Ievadi aprakstu!")
    if (novadi.length === 0) return setKludas("Izvēlies vismaz vienu novadu!")
    if (!cenaPecVienosanas && !cena) return setKludas("Ievadi cenu vai atzīmē 'Pēc vienošanās'!")
    const sl = {
      id: esosais?.id || Date.now(),
      virsraksts, apraksts, darbiba, cena, cenaPecVienosanas, novadi,
      autors: user?.vards || "—",
      uznemums: user?.uznemums || "",
      epasts: user?.epasts || "",
      talrunis: user?.talrunis || "",
      datums: esosais?.datums || new Date().toLocaleDateString("lv-LV"),
      beigas: esosais?.beigas || (() => {
        const d = new Date(); d.setMonth(d.getMonth() + 1)
        return d.toLocaleDateString("lv-LV")
      })()
    }
    onSaglabat(sl)
  }

  return (
    <div style={{background:"white",border:"2px solid #225522",borderRadius:"8px",padding:"20px",marginBottom:"16px"}}>
      <h3 style={{color:"#225522",marginTop:0}}>{esosais ? "✏️ Rediģēt sludinājumu" : "➕ Jauns sludinājums"}</h3>
      {kludas && <div style={{background:"#ffebee",color:"#c62828",padding:"8px",borderRadius:"4px",marginBottom:"10px",fontSize:"12px"}}>{kludas}</div>}

      <div style={{marginBottom:"10px"}}>
        <label style={{fontSize:"11px",fontWeight:"bold"}}>Virsraksts:</label><br/>
        <input value={virsraksts} onChange={e=>setVirsraksts(e.target.value)} placeholder="piem. Piedāvāju jaunaudžu kopšanas pakalpojumus"
          style={{width:"100%",padding:"6px",border:"1px solid #ccc",borderRadius:"4px",fontSize:"13px",boxSizing:"border-box"}}/>
      </div>

      <div style={{marginBottom:"10px"}}>
        <label style={{fontSize:"11px",fontWeight:"bold"}}>Darbības veids:</label><br/>
        <select value={darbiba} onChange={e=>setDarbiba(e.target.value)}
          style={{width:"100%",padding:"6px",border:"1px solid #ccc",borderRadius:"4px",fontSize:"13px"}}>
          {DARBIBAS_VEIDI.map(d=><option key={d}>{d}</option>)}
        </select>
      </div>

      <div style={{marginBottom:"10px"}}>
        <label style={{fontSize:"11px",fontWeight:"bold"}}>Apraksts:</label><br/>
        <textarea value={apraksts} onChange={e=>setApraksts(e.target.value)} rows={4}
          placeholder="Apraksti ko piedāvā, pieredzi, tehnikas nodrošinājumu utt."
          style={{width:"100%",padding:"6px",border:"1px solid #ccc",borderRadius:"4px",fontSize:"13px",boxSizing:"border-box",resize:"vertical"}}/>
      </div>

      <div style={{marginBottom:"10px"}}>
        <label style={{fontSize:"11px",fontWeight:"bold"}}>Darbības novadi:</label><br/>
        <NovadsAutocomplete onPievienot={pievienotNovadu}/>
        {novadi.length > 0 && (
          <div style={{display:"flex",flexWrap:"wrap",gap:"4px",marginTop:"6px"}}>
            {novadi.map(n=>(
              <span key={n} style={{background:"#e8f5e9",border:"1px solid #225522",borderRadius:"4px",padding:"3px 8px",fontSize:"11px",display:"flex",alignItems:"center",gap:"4px"}}>
                {n}
                <button onClick={()=>nonemtNovadu(n)} style={{background:"none",border:"none",color:"#c62828",cursor:"pointer",fontWeight:"bold",padding:"0",fontSize:"12px"}}>×</button>
              </span>
            ))}
          </div>
        )}
      </div>

      <div style={{marginBottom:"16px"}}>
        <label style={{fontSize:"11px",fontWeight:"bold"}}>Cena:</label><br/>
        <div style={{display:"flex",gap:"8px",alignItems:"center"}}>
          <input type="number" value={cena} onChange={e=>setCena(e.target.value)} disabled={cenaPecVienosanas}
            placeholder="€/ha vai €/m³" style={{width:"120px",padding:"6px",border:"1px solid #ccc",borderRadius:"4px",fontSize:"13px"}}/>
          <label style={{fontSize:"12px",display:"flex",alignItems:"center",gap:"4px"}}>
            <input type="checkbox" checked={cenaPecVienosanas} onChange={e=>setCenaPecVienosanas(e.target.checked)}/>
            Pēc vienošanās
          </label>
        </div>
      </div>

      <div style={{display:"flex",gap:"8px"}}>
        <button onClick={saglabat} style={{padding:"8px 20px",background:"#225522",color:"white",border:"none",borderRadius:"4px",cursor:"pointer",fontWeight:"bold"}}>
          💾 Saglabāt
        </button>
        {onAtcelt && <button onClick={onAtcelt} style={{padding:"8px 16px",background:"#888",color:"white",border:"none",borderRadius:"4px",cursor:"pointer"}}>
          Atcelt
        </button>}
      </div>
    </div>
  )
}

export default function SludinajumiPage({ user, onBack }) {
  const [sludinajumi, setSludinajumi] = useState(() => {
    try { return JSON.parse(localStorage.getItem("mt_sludinajumi") || "[]") }
    catch { return [] }
  })
  const [showForm, setShowForm] = useState(false)
  const [rediget, setRediget] = useState(null)
  const [filtrsNovads, setFiltrsNovads] = useState("")
  const [filtrsDarbiba, setFiltrsDarbiba] = useState("")

  const saglabatSludinajumu = (sl) => {
    const jaunie = rediget
      ? sludinajumi.map(s => s.id === sl.id ? sl : s)
      : [...sludinajumi, sl]
    setSludinajumi(jaunie)
    localStorage.setItem("mt_sludinajumi", JSON.stringify(jaunie))
    setShowForm(false)
    setRediget(null)
  }

  const dzestSludinajumu = (id) => {
    if (!window.confirm("Dzēst sludinājumu?")) return
    const jaunie = sludinajumi.filter(s => s.id !== id)
    setSludinajumi(jaunie)
    localStorage.setItem("mt_sludinajumi", JSON.stringify(jaunie))
  }

  const filtreti = sludinajumi.filter(s => {
    if (filtrsNovads && !s.novadi?.includes(filtrsNovads)) return false
    if (filtrsDarbiba && s.darbiba !== filtrsDarbiba) return false
    return true
  }).sort((a, b) => b.id - a.id)

  const mansSludinajums = user ? sludinajumi.find(s => s.epasts === user.epasts) : null

  return (
    <div style={{padding:"24px",fontFamily:"Arial",maxWidth:"900px",margin:"0 auto"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"16px",flexWrap:"wrap",gap:"8px"}}>
        <h2 style={{color:"#225522",margin:0}}>🌲 Sludinājumi</h2>
        <div style={{display:"flex",gap:"8px",alignItems:"center"}}>
          {onBack && <button onClick={onBack} style={{padding:"6px 14px",background:"#555",color:"white",border:"none",borderRadius:"4px",cursor:"pointer"}}>← Atpakaļ</button>}
          {user && !mansSludinajums && !showForm && (
            <button onClick={()=>setShowForm(true)} style={{padding:"8px 16px",background:"#225522",color:"white",border:"none",borderRadius:"4px",cursor:"pointer",fontWeight:"bold"}}>
              ➕ Ievietot sludinājumu
            </button>
          )}
        </div>
      </div>

      {!user && (
        <div style={{background:"#fff8e1",border:"1px solid #f9a825",borderRadius:"6px",padding:"12px",marginBottom:"16px",fontSize:"13px"}}>
          ℹ️ Lai ievietotu sludinājumu — <b>abonē Meža tirgu</b> vai iegādājies sludinājumu par <b>6.99 €/mēnesī</b>
        </div>
      )}

      {showForm && (
        <SludinajumsForm user={user} onSaglabat={saglabatSludinajumu} onAtcelt={()=>setShowForm(false)}/>
      )}

      {rediget && (
        <SludinajumsForm user={user} esosais={rediget} onSaglabat={saglabatSludinajumu} onAtcelt={()=>setRediget(null)}/>
      )}

      {/* Filtri */}
      <div style={{display:"flex",gap:"8px",marginBottom:"16px",flexWrap:"wrap"}}>
        <select value={filtrsDarbiba} onChange={e=>setFiltrsDarbiba(e.target.value)}
          style={{padding:"6px",border:"1px solid #ccc",borderRadius:"4px",fontSize:"12px"}}>
          <option value="">Visi darbības veidi</option>
          {DARBIBAS_VEIDI.map(d=><option key={d}>{d}</option>)}
        </select>
        <select value={filtrsNovads} onChange={e=>setFiltrsNovads(e.target.value)}
          style={{padding:"6px",border:"1px solid #ccc",borderRadius:"4px",fontSize:"12px"}}>
          <option value="">Visi novadi</option>
          {NOVADI.map(n=><option key={n}>{n}</option>)}
        </select>
        {(filtrsNovads || filtrsDarbiba) && (
          <button onClick={()=>{setFiltrsNovads("");setFiltrsDarbiba("")}}
            style={{padding:"6px 12px",background:"#888",color:"white",border:"none",borderRadius:"4px",cursor:"pointer",fontSize:"12px"}}>
            ✕ Notīrīt filtrus
          </button>
        )}
        <span style={{fontSize:"12px",color:"#888",alignSelf:"center"}}>{filtreti.length} sludinājumi</span>
      </div>

      {/* Sludinājumu saraksts */}
      {filtreti.length === 0 ? (
        <div style={{padding:"40px",textAlign:"center",color:"#888",border:"2px dashed #ccc",borderRadius:"8px"}}>
          Nav sludinājumu
        </div>
      ) : (
        <div style={{display:"grid",gap:"12px"}}>
          {filtreti.map(s=>(
            <div key={s.id} style={{background:"white",border:"1px solid #d0e4c8",borderRadius:"8px",padding:"16px",boxShadow:"0 1px 4px rgba(0,0,0,0.06)"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:"8px"}}>
                <div>
                  <h3 style={{margin:"0 0 4px",color:"#225522",fontSize:"15px"}}>{s.virsraksts}</h3>
                  <span style={{background:"#e8f5e9",color:"#225522",padding:"2px 8px",borderRadius:"12px",fontSize:"11px",fontWeight:"bold"}}>{s.darbiba}</span>
                </div>
                <div style={{textAlign:"right",fontSize:"12px",color:"#888"}}>
                  <div>{s.datums}</div>
                  <div style={{color:"#225522",fontWeight:"bold",fontSize:"14px",marginTop:"4px"}}>
                    {s.cenaPecVienosanas ? "Pēc vienošanās" : `${s.cena} €`}
                  </div>
                </div>
              </div>
              <p style={{margin:"0 0 8px",fontSize:"13px",color:"#444",lineHeight:"1.5"}}>{s.apraksts}</p>
              <div style={{display:"flex",flexWrap:"wrap",gap:"4px",marginBottom:"8px"}}>
                {s.novadi?.map(n=>(
                  <span key={n} style={{background:"#f0f6ec",border:"1px solid #c8dcc0",borderRadius:"4px",padding:"2px 6px",fontSize:"11px"}}>📍 {n}</span>
                ))}
              </div>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",borderTop:"1px solid #f0f0f0",paddingTop:"8px",marginTop:"4px"}}>
                <div style={{fontSize:"12px",color:"#666"}}>
                  <b>{s.uznemums || s.autors}</b>
                  {s.talrunis && <span> · 📞 {s.talrunis}</span>}
                  {s.epasts && <span> · ✉️ {s.epasts}</span>}
                </div>
                {user && user.epasts === s.epasts && (
                  <div style={{display:"flex",gap:"6px"}}>
                    <button onClick={()=>setRediget(s)} style={{padding:"4px 10px",background:"#1565c0",color:"white",border:"none",borderRadius:"4px",cursor:"pointer",fontSize:"11px"}}>✏️ Rediģēt</button>
                    <button onClick={()=>dzestSludinajumu(s.id)} style={{padding:"4px 10px",background:"#c62828",color:"white",border:"none",borderRadius:"4px",cursor:"pointer",fontSize:"11px"}}>🗑 Dzēst</button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}