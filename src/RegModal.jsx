import React, { useState } from "react"

export default function RegModal({ onRegistreties, onAizvērt }) {
  const [vards, setVards] = useState("")
  const [epasts, setEpasts] = useState("")
  const [parole, setParole] = useState("")
  const [kludas, setKludas] = useState("")

  const iesniegt = () => {
    if (!vards.trim()) return setKludas("Lūdzu ievadi vārdu!")
    if (!epasts.includes("@")) return setKludas("Nepareizs e-pasts!")
    if (parole.length < 6) return setKludas("Parolei jābūt vismaz 6 simboli!")
    onRegistreties({ vards, epasts, parole })
  }

  return (
    <div style={{position:"fixed",top:0,left:0,width:"100%",height:"100%",background:"rgba(0,0,0,0.6)",zIndex:2000,display:"flex",alignItems:"center",justifyContent:"center"}}>
      <div style={{background:"white",padding:"32px",borderRadius:"10px",minWidth:"340px",boxShadow:"0 4px 24px rgba(0,0,0,0.2)"}}>
        <h2 style={{color:"#225522",marginTop:0}}>🌲 Reģistrācija</h2>
        <p style={{fontSize:"13px",color:"#555",marginBottom:"20px"}}>
          Reģistrējies lai drukātu PDF atskaites un izmantotu visas Meža tirgus iespējas.
        </p>
        {kludas && <div style={{background:"#ffebee",color:"#c62828",padding:"8px",borderRadius:"4px",marginBottom:"12px",fontSize:"12px"}}>{kludas}</div>}
        {[
          ["Vārds, uzvārds", vards, setVards, "text"],
          ["E-pasts", epasts, setEpasts, "email"],
          ["Parole", parole, setParole, "password"],
        ].map(([label, val, set, type]) => (
          <div key={label} style={{marginBottom:"12px"}}>
            <label style={{fontSize:"11px",fontWeight:"bold"}}>{label}:</label><br/>
            <input
              type={type}
              value={val}
              onChange={e => set(e.target.value)}
              style={{width:"100%",padding:"6px",border:"1px solid #ccc",borderRadius:"4px",fontSize:"13px",boxSizing:"border-box"}}
            />
          </div>
        ))}
        <button onClick={iesniegt} style={{width:"100%",padding:"10px",background:"#225522",color:"white",border:"none",borderRadius:"6px",cursor:"pointer",fontWeight:"bold",fontSize:"14px",marginBottom:"8px"}}>
          Reģistrēties →
        </button>
        <button onClick={onAizvērt} style={{width:"100%",padding:"8px",background:"none",border:"1px solid #ccc",borderRadius:"6px",cursor:"pointer",color:"#666",fontSize:"13px"}}>
          Vēlāk
        </button>
      </div>
    </div>
  )
}