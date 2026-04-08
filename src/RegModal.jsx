import React, { useState } from "react"

export default function RegModal({ onRegistreties, onPieteikties, onAizvērt }) {
  const [rezims, setRezims] = useState("jauns")
  const [vards, setVards] = useState("")
  const [epasts, setEpasts] = useState("")
  const [parole, setParole] = useState("")
  const [kludas, setKludas] = useState("")

  const iesniegt = () => {
    if (rezims === "jauns") {
      if (!vards.trim()) return setKludas("Lūdzu ievadi vārdu!")
      if (!epasts.includes("@")) return setKludas("Nepareizs e-pasts!")
      if (parole.length < 6) return setKludas("Parolei jābūt vismaz 6 simboli!")
      onRegistreties({ vards, epasts, parole })
    } else {
      if (!epasts.includes("@")) return setKludas("Nepareizs e-pasts!")
      if (!parole) return setKludas("Ievadi paroli!")
      onPieteikties({ epasts, parole })
    }
  }

  return (
    <div style={{position:"fixed",top:0,left:0,width:"100%",height:"100%",background:"rgba(0,0,0,0.6)",zIndex:2000,display:"flex",alignItems:"center",justifyContent:"center"}}>
      <div style={{background:"white",padding:"32px",borderRadius:"10px",minWidth:"340px",boxShadow:"0 4px 24px rgba(0,0,0,0.2)"}}>
        <h2 style={{color:"#225522",marginTop:0}}>🌲 {rezims==="jauns" ? "Abonēšana" : "Pieteikšanās"}</h2>
        <p style={{fontSize:"13px",color:"#555",marginBottom:"20px"}}>
          {rezims==="jauns"
            ? "Abonē lai drukātu PDF atskaites un izmantotu visas Meža tirgus iespējas."
            : "Piesakies ar savu e-pastu un paroli."}
        </p>
        {kludas && <div style={{background:"#ffebee",color:"#c62828",padding:"8px",borderRadius:"4px",marginBottom:"12px",fontSize:"12px"}}>{kludas}</div>}
        {rezims === "jauns" && (
          <div style={{marginBottom:"12px"}}>
            <label style={{fontSize:"11px",fontWeight:"bold"}}>Vārds, uzvārds:</label><br/>
            <input type="text" value={vards} onChange={e=>setVards(e.target.value)} style={{width:"100%",padding:"6px",border:"1px solid #ccc",borderRadius:"4px",fontSize:"13px",boxSizing:"border-box"}}/>
          </div>
        )}
        <div style={{marginBottom:"12px"}}>
          <label style={{fontSize:"11px",fontWeight:"bold"}}>E-pasts:</label><br/>
          <input type="email" value={epasts} onChange={e=>setEpasts(e.target.value)} style={{width:"100%",padding:"6px",border:"1px solid #ccc",borderRadius:"4px",fontSize:"13px",boxSizing:"border-box"}}/>
        </div>
        <div style={{marginBottom:"16px"}}>
          <label style={{fontSize:"11px",fontWeight:"bold"}}>Parole:</label><br/>
          <input type="password" value={parole} onChange={e=>setParole(e.target.value)} style={{width:"100%",padding:"6px",border:"1px solid #ccc",borderRadius:"4px",fontSize:"13px",boxSizing:"border-box"}}/>
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