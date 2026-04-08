import React, { useState } from "react"
import { NOVADI } from "./novadi"

const DARBIBAS_VEIDI = [
  // Meža apsaimniekošana
  "Meža īpašnieks",
  "Meža apsaimniekotājs",
  "Mežzinis",
  "Stigotājs",
  // Inventarizācija/Vērtēšana
  "Meža taksators",
  "Meža inventarizētājs",
  "Meža vērtētājs",
  // Tehniskā izpilde
  "Mežizstrādātājs",
  "Harvestera operators",
  "Forvardera operators",
  "Kokvedēja vadītājs",
  "Zāģeris",
  // Atjaunošana/Kopšana
  "Jaunaudžu kopējs",
  "Meža stādītājs",
  "Meža sēklu un stādu audzētājs",
  "Āborists",
  // Tirdzniecība
  "Kokmateriālu tirgotājs",
  "Meža produkcijas iepircējs",
  "Mežizstrāde, cirsmu un meža īpašumu iegāde",
  // Projektēšana/Konsultācijas
  "Meža konsultants",
  "Meža projektu izstrādātājs",
  "Cits"
]

function NovadsAutocomplete({ onPievienot }) {
  const [ievade, setIevade] = useState("")
  const [piedavajumi, setPiedavajumi] = useState([])

  const handleChange = (val) => {
    setIevade(val)
    if (val.length < 1) { setPiedavajumi([]); return }
    const filtreti = NOVADI.filter(n => n.toLowerCase().startsWith(val.toLowerCase()))
    setPiedavajumi(filtreti.slice(0, 6))
  }

  const izveleties = (novads) => {
    onPievienot(novads)
    setIevade("")
    setPiedavajumi([])
  }

  return (
    <div style={{position:"relative"}}>
      <input
        value={ievade}
        onChange={e => handleChange(e.target.value)}
        placeholder="Raksti novada nosaukumu..."
        style={{width:"100%",padding:"6px",border:"1px solid #ccc",borderRadius:"4px",fontSize:"13px",boxSizing:"border-box"}}
      />
      {piedavajumi.length > 0 && (
        <div style={{position:"absolute",top:"100%",left:0,right:0,background:"white",border:"1px solid #ccc",borderRadius:"4px",zIndex:100,boxShadow:"0 2px 8px rgba(0,0,0,0.15)"}}>
          {piedavajumi.map(n => (
            <div key={n} onClick={() => izveleties(n)}
              style={{padding:"8px 12px",cursor:"pointer",fontSize:"13px",borderBottom:"1px solid #f0f0f0"}}
              onMouseEnter={e => e.target.style.background="#f0f8f0"}
              onMouseLeave={e => e.target.style.background="white"}>
              {n}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default function RegModal({ onRegistreties, onPieteikties, onAizvērt }) {
  const [rezims, setRezims] = useState("jauns")
  const [tips, setTips] = useState("privatpersona")
  const [vards, setVards] = useState("")
  const [uznemums, setUznemums] = useState("")
  const [darbiba, setDarbiba] = useState(DARBIBAS_VEIDI[0])
  const [talrunis, setTalrunis] = useState("")
  const [bazesNovads, setBazesNovads] = useState("")
  const [papilduNovadi, setPapilduNovadi] = useState([])
  const [epasts, setEpasts] = useState("")
 const [parole, setParole] = useState("")
  const [parole2, setParole2] = useState("")
  const [kludas, setKludas] = useState("")

  const paroleSpeks = () => {
    if (parole.length === 0) return null
    if (parole.length < 8) return "vaja"
    if (!/\d/.test(parole)) return "vaja"
    return "labi"
  }
  const speks = paroleSpeks()

  const pievienotNovadu = (novads) => {
    if (!papilduNovadi.includes(novads) && novads !== bazesNovads) {
      setPapilduNovadi([...papilduNovadi, novads])
    }
  }

  const nonemtNovadu = (novads) => {
    setPapilduNovadi(papilduNovadi.filter(n => n !== novads))
  }

  const iesniegt = () => {
    if (rezims === "jauns") {
      if (!vards.trim()) return setKludas("Lūdzu ievadi vārdu!")
      if (tips === "uznemums" && !uznemums.trim()) return setKludas("Ievadi uzņēmuma nosaukumu!")
      if (tips === "uznemums" && !bazesNovads) return setKludas("Izvēlies bāzes novadu!")
      if (!epasts.includes("@")) return setKludas("Nepareizs e-pasts!")
      if (parole.length < 8) return setKludas("Parolei jābūt vismaz 8 simboli!")
      if (!/\d/.test(parole)) return setKludas("Parolei jābūt vismaz viens cipars!")
      if (parole !== parole2) return setKludas("Paroles nesakrīt!")
      onRegistreties({ vards, uznemums, darbiba, talrunis, bazesNovads, papilduNovadi, epasts, parole, tips })
    } else {
      if (!epasts.includes("@")) return setKludas("Nepareizs e-pasts!")
      if (!parole) return setKludas("Ievadi paroli!")
      onPieteikties({ epasts, parole })
    }
  }

  return (
    <div style={{position:"fixed",top:0,left:0,width:"100%",height:"100%",background:"rgba(0,0,0,0.6)",zIndex:2000,display:"flex",alignItems:"center",justifyContent:"center"}}>
      <div style={{background:"white",padding:"28px",borderRadius:"10px",width:"420px",maxHeight:"90vh",overflowY:"auto",boxShadow:"0 4px 24px rgba(0,0,0,0.2)"}}>
        <h2 style={{color:"#225522",marginTop:0}}>🌲 {rezims==="jauns" ? "Abonēšana" : "Autorizēšanās"}</h2>

        {rezims === "jauns" && (
          <>
            <div style={{display:"flex",gap:"8px",marginBottom:"16px"}}>
              <button onClick={()=>setTips("privatpersona")} style={{flex:1,padding:"8px",background:tips==="privatpersona"?"#225522":"#f0f0f0",color:tips==="privatpersona"?"white":"#333",border:"none",borderRadius:"6px",cursor:"pointer",fontSize:"12px",fontWeight:"bold"}}>
                👤 Privātpersona
              </button>
              <button onClick={()=>setTips("uznemums")} style={{flex:1,padding:"8px",background:tips==="uznemums"?"#225522":"#f0f0f0",color:tips==="uznemums"?"white":"#333",border:"none",borderRadius:"6px",cursor:"pointer",fontSize:"12px",fontWeight:"bold"}}>
                🏢 Uzņēmums/Speciālists
              </button>
            </div>

            <div style={{marginBottom:"10px"}}>
              <label style={{fontSize:"11px",fontWeight:"bold"}}>Vārds, uzvārds:</label><br/>
              <input type="text" value={vards} onChange={e=>setVards(e.target.value)} style={{width:"100%",padding:"6px",border:"1px solid #ccc",borderRadius:"4px",fontSize:"13px",boxSizing:"border-box"}}/>
            </div>

            {tips === "uznemums" && (
              <>
                <div style={{marginBottom:"10px"}}>
                  <label style={{fontSize:"11px",fontWeight:"bold"}}>Uzņēmuma nosaukums:</label><br/>
                  <input type="text" value={uznemums} onChange={e=>setUznemums(e.target.value)} style={{width:"100%",padding:"6px",border:"1px solid #ccc",borderRadius:"4px",fontSize:"13px",boxSizing:"border-box"}}/>
                </div>
                <div style={{marginBottom:"10px"}}>
                  <label style={{fontSize:"11px",fontWeight:"bold"}}>Darbības veids:</label><br/>
                  <select value={darbiba} onChange={e=>setDarbiba(e.target.value)} style={{width:"100%",padding:"6px",border:"1px solid #ccc",borderRadius:"4px",fontSize:"13px"}}>
                    {DARBIBAS_VEIDI.map(d=><option key={d}>{d}</option>)}
                  </select>
                </div>
                <div style={{marginBottom:"10px"}}>
                  <label style={{fontSize:"11px",fontWeight:"bold"}}>Tālrunis:</label><br/>
                  <input type="tel" value={talrunis} onChange={e=>setTalrunis(e.target.value)} style={{width:"100%",padding:"6px",border:"1px solid #ccc",borderRadius:"4px",fontSize:"13px",boxSizing:"border-box"}}/>
                </div>
                <div style={{marginBottom:"10px"}}>
                  <label style={{fontSize:"11px",fontWeight:"bold"}}>Bāzes novads: <span style={{color:"#c62828"}}>*</span></label><br/>
                  <select value={bazesNovads} onChange={e=>setBazesNovads(e.target.value)} style={{width:"100%",padding:"6px",border:"1px solid #ccc",borderRadius:"4px",fontSize:"13px"}}>
                    <option value="">— izvēlies —</option>
                    {NOVADI.map(n=><option key={n}>{n}</option>)}
                  </select>
                </div>
                <div style={{marginBottom:"10px"}}>
                  <label style={{fontSize:"11px",fontWeight:"bold"}}>Papildu darbības novadi:</label><br/>
                  <NovadsAutocomplete onPievienot={pievienotNovadu}/>
                  {papilduNovadi.length > 0 && (
                    <div style={{display:"flex",flexWrap:"wrap",gap:"4px",marginTop:"6px"}}>
                      {papilduNovadi.map(n=>(
                        <span key={n} style={{background:"#e8f5e9",border:"1px solid #225522",borderRadius:"4px",padding:"3px 8px",fontSize:"11px",display:"flex",alignItems:"center",gap:"4px"}}>
                          {n}
                          <button onClick={()=>nonemtNovadu(n)} style={{background:"none",border:"none",color:"#c62828",cursor:"pointer",fontWeight:"bold",padding:"0",fontSize:"12px"}}>×</button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </>
        )}

        {kludas && <div style={{background:"#ffebee",color:"#c62828",padding:"8px",borderRadius:"4px",marginBottom:"10px",fontSize:"12px"}}>{kludas}</div>}

        <div style={{marginBottom:"10px"}}>
          <label style={{fontSize:"11px",fontWeight:"bold"}}>E-pasts:</label><br/>
          <input type="email" value={epasts} onChange={e=>setEpasts(e.target.value)} style={{width:"100%",padding:"6px",border:"1px solid #ccc",borderRadius:"4px",fontSize:"13px",boxSizing:"border-box"}}/>
        </div>
        <div style={{marginBottom:"10px"}}>
          <label style={{fontSize:"11px",fontWeight:"bold"}}>Parole:</label>
          <span style={{fontSize:"10px",color:"#888",marginLeft:"8px"}}>min. 8 simboli, vismaz 1 cipars</span><br/>
          <input type="password" value={parole} onChange={e=>setParole(e.target.value)}
            style={{width:"100%",padding:"6px",border:`1px solid ${speks==="labi"?"#388e3c":speks==="vaja"?"#c62828":"#ccc"}`,borderRadius:"4px",fontSize:"13px",boxSizing:"border-box",background:speks==="labi"?"#f0fff0":speks==="vaja"?"#fff0f0":"white"}}/>
          {speks==="vaja" && <span style={{fontSize:"10px",color:"#c62828"}}>⛔ Par īsu vai nav cipara</span>}
          {speks==="labi" && <span style={{fontSize:"10px",color:"#388e3c"}}>✓ Parole ir derīga</span>}
        </div>
        <div style={{marginBottom:"16px"}}>
          <label style={{fontSize:"11px",fontWeight:"bold"}}>Atkārtot paroli:</label><br/>
          <input type="password" value={parole2} onChange={e=>setParole2(e.target.value)}
            style={{width:"100%",padding:"6px",border:`1px solid ${parole2.length>0?(parole===parole2?"#388e3c":"#c62828"):"#ccc"}`,borderRadius:"4px",fontSize:"13px",boxSizing:"border-box",background:parole2.length>0?(parole===parole2?"#f0fff0":"#fff0f0"):"white"}}/>
          {parole2.length>0 && parole!==parole2 && <span style={{fontSize:"10px",color:"#c62828"}}>⛔ Paroles nesakrīt</span>}
          {parole2.length>0 && parole===parole2 && speks==="labi" && <span style={{fontSize:"10px",color:"#388e3c"}}>✓ Paroles sakrīt</span>}
        </div>

        <button onClick={iesniegt} style={{width:"100%",padding:"10px",background:"#225522",color:"white",border:"none",borderRadius:"6px",cursor:"pointer",fontWeight:"bold",fontSize:"14px",marginBottom:"8px"}}>
          {rezims==="jauns" ? "Abonēt →" : "Autorizēties →"}
        </button>
        <button onClick={()=>{setRezims(rezims==="jauns"?"esoss":"jauns");setKludas("")}} style={{width:"100%",padding:"8px",background:"none",border:"1px solid #ccc",borderRadius:"6px",cursor:"pointer",color:"#555",fontSize:"12px",marginBottom:"6px"}}>
          {rezims==="jauns" ? "Jau esmu abonents? Autorizēties" : "Nav konta? Abonēt"}
        </button>
        <button onClick={onAizvērt} style={{width:"100%",padding:"8px",background:"none",border:"none",cursor:"pointer",color:"#aaa",fontSize:"12px"}}>
          Vēlāk
        </button>
      </div>
    </div>
  )
}