import { useState, useEffect, useMemo } from "react"
import { supabase } from './supabaseClient'

const SOFERI = [
  { vards: "Jānis Siņica",     auto: "SH58"   },
  { vards: "Oskars Pardencis", auto: "ER58"   },
  { vards: "Mareks Jančuks",   auto: "SH58"   },
  { vards: "Ivo Janovičs",     auto: "ER58"   },
  { vards: "Juris Žeikars",    auto: "LK1154" },
  { vards: "Jānis Miglonis",   auto: "LK1154" },
]

const SUGAS = { P:"Priede", E:"Egle", B:"Bērzs", A:"Alksnis", Ba:"Baltalksnis", Bl:"Melnalksnis", Oz:"Ozols", Os:"Osis", M:"Melnā kārkls", G:"Apse" }

const COLS = [
  { key: "datums",        label: "Datums"          },
  { key: "pvz_nr",        label: "Pvz. Nr."         },
  { key: "soferis",       label: "Šoferis"          },
  { key: "auto",          label: "Auto"             },
  { key: "no_kurienes",   label: "No kurienes"      },
  { key: "piegade",       label: "Piegādes vieta"   },
  { key: "sortiments",    label: "Sortiments"       },
  { key: "suga",          label: "Suga"             },
  { key: "kubi",          label: "m³ nosūtīti"      },
  { key: "kubi_uzmeriti", label: "m³ uzmērīti"      },
  { key: "km",            label: "km"               },
  { key: "veids",         label: "Veids"            },
  { key: "klients",       label: "Klients"          },
  { key: "cirt_apl_nr",   label: "Cirt. apl. Nr."  },
]

function exportExcel(records, filtrFilename) {
  const headers = COLS.map(c => c.label)
  const rows = records.map(r => COLS.map(c => {
    if (c.key === "suga" && r[c.key]) return `${r[c.key]} (${SUGAS[r[c.key]] || r[c.key]})`
    return r[c.key] ?? ""
  }))
  const csvContent = [headers, ...rows].map(row =>
    row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(";")
  ).join("\n")
  const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = `rpandras_${filtrFilename}_${new Date().toISOString().slice(0,10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

function RekinsModal({ records, onClose }) {
  const [rekinsNr, setRekinsNr] = useState("")
  const [datums, setDatums] = useState(new Date().toLocaleDateString("lv-LV"))
  const [sanemejs, setSanemejs] = useState("")
  const [kmTarifs, setKmTarifs] = useState("")
  const [m3Tarifs, setM3Tarifs] = useState("")
  const [pvnRezims, setPvnRezims] = useState("bez")

  const kopaKm = records.reduce((s, r) => s + (parseFloat(r.km) || 0), 0)
  const kopaM3 = records.reduce((s, r) => s + (parseFloat(r.kubi) || 0), 0)
  const kmSumma = kopaKm * (parseFloat(kmTarifs) || 0)
  const m3Summa = kopaM3 * (parseFloat(m3Tarifs) || 0)
  const kopaa = kmSumma + m3Summa
  const pvn = pvnRezims === "pvn21" ? kopaa * 0.21 : 0
  const kopa_apmaksai = kopaa + pvn

  const drukāt = () => {
    const today = new Date().toLocaleDateString("lv-LV")
    const html = `<html><head><meta charset="UTF-8">
<style>
body{font-family:Arial;font-size:11px;padding:24px;max-width:850px;margin:0 auto}
h2{text-align:center;font-size:14px;margin:4px 0}
table{border-collapse:collapse;width:100%;margin:8px 0}
th{background:#225522;color:white;padding:4px 8px;font-size:10px;text-align:left}
td{border:1px solid #ccc;padding:3px 8px;font-size:10px}
.total{font-weight:bold;background:#f0f8f0}
</style></head><body>
<h2>RĒĶINS Nr. ${rekinsNr || "___"}</h2>
<p style="text-align:center;font-size:11px">${datums}</p>
<p><b>Pakalpojumu saņēmējs:</b> ${sanemejs || "___________________"}</p>
<p><b>Pakalpojumu sniedzējs:</b> RP Andras</p>
<h3>Pavadzīmes:</h3>
<table><thead><tr><th>Datums</th><th>Pvz.Nr.</th><th>Šoferis</th><th>No kurienes</th><th>Uz kurieni</th><th>Sortiments</th><th>m³</th><th>km</th></tr></thead>
<tbody>
${records.map(r => `<tr>
  <td>${r.datums || ""}</td>
  <td>${r.pvz_nr || ""}</td>
  <td>${r.soferis || ""}</td>
  <td>${r.no_kurienes || ""}</td>
  <td>${r.piegade || ""}</td>
  <td>${r.sortiments || ""}</td>
  <td>${r.kubi || ""}</td>
  <td>${r.km || ""}</td>
</tr>`).join("")}
</tbody>
<tfoot>
<tr class="total"><td colspan="6">Kopā</td><td>${kopaM3.toFixed(3)}</td><td>${kopaKm.toFixed(1)}</td></tr>
</tfoot></table>
<h3>Aprēķins:</h3>
<table><tbody>
${parseFloat(kmTarifs) > 0 ? `<tr><td>Transporta pakalpojumi (${kopaKm.toFixed(1)} km × ${kmTarifs} €/km)</td><td style="text-align:right;font-weight:bold">${kmSumma.toFixed(2)} €</td></tr>` : ""}
${parseFloat(m3Tarifs) > 0 ? `<tr><td>Koksnes pārvadāšana (${kopaM3.toFixed(3)} m³ × ${m3Tarifs} €/m³)</td><td style="text-align:right;font-weight:bold">${m3Summa.toFixed(2)} €</td></tr>` : ""}
<tr class="total"><td>Kopā bez PVN</td><td style="text-align:right">${kopaa.toFixed(2)} €</td></tr>
${pvnRezims === "pvn21" ? `<tr><td>PVN 21%</td><td style="text-align:right">${pvn.toFixed(2)} €</td></tr>
<tr class="total"><td><b>Kopā apmaksai</b></td><td style="text-align:right"><b>${kopa_apmaksai.toFixed(2)} €</b></td></tr>` : ""}
${pvnRezims === "reversais" ? `<tr><td colspan="2" style="font-style:italic">Reversa PVN piemērošana saskaņā ar PVN likuma 142. pantu</td></tr>` : ""}
</tbody></table>
<div style="display:flex;justify-content:space-between;margin-top:40px;font-size:11px">
<div>Izrakstīja: ___________________________</div>
<div>${datums}</div>
</div>
<p style="font-size:9px;color:#888;margin-top:16px">Sagatavots ar Meža tirgus platformu</p>
</body></html>`
    const win = window.open("", "_blank")
    win.document.write(html)
    win.document.close()
    win.print()
  }

  return (
    <div style={{position:"fixed",top:0,left:0,width:"100%",height:"100%",background:"rgba(0,0,0,0.7)",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center"}}>
      <div style={{background:"#141f14",border:"2px solid #4caf50",borderRadius:12,padding:28,width:"560px",maxHeight:"90vh",overflow:"auto"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
          <b style={{color:"#4caf50",fontSize:16}}>🧾 Rēķina sagatave</b>
          <button onClick={onClose} style={{background:"none",border:"none",color:"#81c784",cursor:"pointer",fontSize:20}}>✕</button>
        </div>

        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:16}}>
          <div>
            <label style={{fontSize:11,color:"#81c784",display:"block",marginBottom:4}}>Rēķina Nr.:</label>
            <input value={rekinsNr} onChange={e=>setRekinsNr(e.target.value)}
              style={{width:"100%",background:"#0f1a0f",border:"1px solid #2d5a2d",borderRadius:6,padding:"8px",color:"#e8f5e9",fontSize:12,boxSizing:"border-box"}}/>
          </div>
          <div>
            <label style={{fontSize:11,color:"#81c784",display:"block",marginBottom:4}}>Datums:</label>
            <input value={datums} onChange={e=>setDatums(e.target.value)}
              style={{width:"100%",background:"#0f1a0f",border:"1px solid #2d5a2d",borderRadius:6,padding:"8px",color:"#e8f5e9",fontSize:12,boxSizing:"border-box"}}/>
          </div>
        </div>

        <div style={{marginBottom:16}}>
          <label style={{fontSize:11,color:"#81c784",display:"block",marginBottom:4}}>Pakalpojumu saņēmējs:</label>
          <input value={sanemejs} onChange={e=>setSanemejs(e.target.value)} placeholder="Uzņēmuma nosaukums..."
            style={{width:"100%",background:"#0f1a0f",border:"1px solid #2d5a2d",borderRadius:6,padding:"8px",color:"#e8f5e9",fontSize:12,boxSizing:"border-box"}}/>
        </div>

        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:16}}>
          <div style={{padding:12,background:"#0f2b0f",borderRadius:8,border:"1px solid #2d5a2d"}}>
            <label style={{fontSize:11,color:"#81c784",display:"block",marginBottom:4}}>Tarifs €/km:</label>
            <input type="number" value={kmTarifs} onChange={e=>setKmTarifs(e.target.value)} placeholder="0.00"
              style={{width:"100%",background:"#0f1a0f",border:"1px solid #2d5a2d",borderRadius:6,padding:"8px",color:"#e8f5e9",fontSize:14,boxSizing:"border-box"}}/>
            <div style={{fontSize:11,color:"#4a7a4a",marginTop:4}}>Kopā km: {kopaKm.toFixed(1)} → {kmSumma.toFixed(2)} €</div>
          </div>
          <div style={{padding:12,background:"#0f2b0f",borderRadius:8,border:"1px solid #2d5a2d"}}>
            <label style={{fontSize:11,color:"#81c784",display:"block",marginBottom:4}}>Tarifs €/m³:</label>
            <input type="number" value={m3Tarifs} onChange={e=>setM3Tarifs(e.target.value)} placeholder="0.00"
              style={{width:"100%",background:"#0f1a0f",border:"1px solid #2d5a2d",borderRadius:6,padding:"8px",color:"#e8f5e9",fontSize:14,boxSizing:"border-box"}}/>
            <div style={{fontSize:11,color:"#4a7a4a",marginTop:4}}>Kopā m³: {kopaM3.toFixed(3)} → {m3Summa.toFixed(2)} €</div>
          </div>
        </div>

        <div style={{marginBottom:16}}>
          <label style={{fontSize:11,color:"#81c784",display:"block",marginBottom:4}}>PVN režīms:</label>
          <select value={pvnRezims} onChange={e=>setPvnRezims(e.target.value)}
            style={{background:"#0f1a0f",border:"1px solid #2d5a2d",borderRadius:6,padding:"8px",color:"#e8f5e9",fontSize:12}}>
            <option value="bez">Bez PVN</option>
            <option value="pvn21">PVN 21%</option>
            <option value="reversais">Reversais PVN (142. pants)</option>
          </select>
        </div>

        <div style={{padding:16,background:"#1b3a1b",borderRadius:8,marginBottom:20,border:"1px solid #4caf50"}}>
          <div style={{display:"flex",justifyContent:"space-between",fontSize:13,marginBottom:8}}>
            <span style={{color:"#81c784"}}>Kopā bez PVN:</span>
            <b style={{color:"#4caf50"}}>{kopaa.toFixed(2)} €</b>
          </div>
          {pvn > 0 && <div style={{display:"flex",justifyContent:"space-between",fontSize:13,marginBottom:8}}>
            <span style={{color:"#81c784"}}>PVN 21%:</span>
            <b style={{color:"#ffb74d"}}>{pvn.toFixed(2)} €</b>
          </div>}
          <div style={{display:"flex",justifyContent:"space-between",fontSize:16,borderTop:"1px solid #2d5a2d",paddingTop:8}}>
            <b style={{color:"white"}}>Kopā apmaksai:</b>
            <b style={{color:"#4caf50",fontSize:20}}>{kopa_apmaksai.toFixed(2)} €</b>
          </div>
          <div style={{fontSize:11,color:"#4a7a4a",marginTop:8}}>
            Ietverts: {records.length} pavadzīmes | {kopaM3.toFixed(3)} m³ | {kopaKm.toFixed(1)} km
          </div>
        </div>

        <button onClick={drukāt}
          style={{width:"100%",background:"#225522",border:"1px solid #4caf50",borderRadius:8,padding:"12px",color:"#4caf50",fontSize:14,fontWeight:700,cursor:"pointer"}}>
          🖨 Drukāt / Saglabāt PDF
        </button>
      </div>
    </div>
  )
}

function AlgasModal({ records, onClose }) {
  const [kmTarifs, setKmTarifs] = useState("")
  const [m3Tarifs, setM3Tarifs] = useState("")

  const soferuStats = useMemo(() => {
    const stats = {}
    records.forEach(r => {
      if (!r.soferis) return
      if (!stats[r.soferis]) stats[r.soferis] = { vards: r.soferis, auto: r.auto || "", km: 0, m3: 0, pvz: 0 }
      stats[r.soferis].km += parseFloat(r.km) || 0
      stats[r.soferis].m3 += parseFloat(r.kubi) || 0
      stats[r.soferis].pvz += 1
    })
    return Object.values(stats)
  }, [records])

  const drukāt = () => {
    const today = new Date().toLocaleDateString("lv-LV")
    const html = `<html><head><meta charset="UTF-8">
<style>
body{font-family:Arial;font-size:11px;padding:24px;max-width:850px;margin:0 auto}
h2{text-align:center;font-size:14px}
table{border-collapse:collapse;width:100%;margin:8px 0}
th{background:#225522;color:white;padding:4px 8px;font-size:10px}
td{border:1px solid #ccc;padding:3px 8px;font-size:10px}
.total{font-weight:bold;background:#f0f8f0}
</style></head><body>
<h2>ALGU APRĒĶINS</h2>
<p style="text-align:center">${today}</p>
<table><thead><tr>
<th>Šoferis</th><th>Auto</th><th>Pvz. skaits</th><th>km</th><th>m³</th>
${parseFloat(kmTarifs) > 0 ? "<th>km summa</th>" : ""}
${parseFloat(m3Tarifs) > 0 ? "<th>m³ summa</th>" : ""}
<th>KOPĀ</th>
</tr></thead><tbody>
${soferuStats.map(s => {
  const kmS = s.km * (parseFloat(kmTarifs) || 0)
  const m3S = s.m3 * (parseFloat(m3Tarifs) || 0)
  return `<tr>
    <td><b>${s.vards}</b></td>
    <td>${s.auto}</td>
    <td>${s.pvz}</td>
    <td>${s.km.toFixed(1)}</td>
    <td>${s.m3.toFixed(3)}</td>
    ${parseFloat(kmTarifs) > 0 ? `<td>${kmS.toFixed(2)} €</td>` : ""}
    ${parseFloat(m3Tarifs) > 0 ? `<td>${m3S.toFixed(2)} €</td>` : ""}
    <td><b>${(kmS + m3S).toFixed(2)} €</b></td>
  </tr>`
}).join("")}
</tbody>
<tfoot><tr class="total">
  <td colspan="3">KOPĀ</td>
  <td>${soferuStats.reduce((s,r)=>s+r.km,0).toFixed(1)}</td>
  <td>${soferuStats.reduce((s,r)=>s+r.m3,0).toFixed(3)}</td>
  ${parseFloat(kmTarifs) > 0 ? `<td>${soferuStats.reduce((s,r)=>s+r.km*(parseFloat(kmTarifs)||0),0).toFixed(2)} €</td>` : ""}
  ${parseFloat(m3Tarifs) > 0 ? `<td>${soferuStats.reduce((s,r)=>s+r.m3*(parseFloat(m3Tarifs)||0),0).toFixed(2)} €</td>` : ""}
  <td><b>${soferuStats.reduce((s,r)=>s+r.km*(parseFloat(kmTarifs)||0)+r.m3*(parseFloat(m3Tarifs)||0),0).toFixed(2)} €</b></td>
</tr></tfoot></table>
<p style="font-size:9px;color:#888;margin-top:16px">Sagatavots ar Meža tirgus platformu · ${today}</p>
</body></html>`
    const win = window.open("", "_blank")
    win.document.write(html)
    win.document.close()
    win.print()
  }

  return (
    <div style={{position:"fixed",top:0,left:0,width:"100%",height:"100%",background:"rgba(0,0,0,0.7)",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center"}}>
      <div style={{background:"#141f14",border:"2px solid #ffb74d",borderRadius:12,padding:28,width:"600px",maxHeight:"90vh",overflow:"auto"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
          <b style={{color:"#ffb74d",fontSize:16}}>💰 Algu aprēķins</b>
          <button onClick={onClose} style={{background:"none",border:"none",color:"#81c784",cursor:"pointer",fontSize:20}}>✕</button>
        </div>

        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:20}}>
          <div style={{padding:12,background:"#0f2b0f",borderRadius:8,border:"1px solid #2d5a2d"}}>
            <label style={{fontSize:11,color:"#81c784",display:"block",marginBottom:4}}>Tarifs €/km:</label>
            <input type="number" value={kmTarifs} onChange={e=>setKmTarifs(e.target.value)} placeholder="0.00"
              style={{width:"100%",background:"#0f1a0f",border:"1px solid #2d5a2d",borderRadius:6,padding:"8px",color:"#e8f5e9",fontSize:16,boxSizing:"border-box"}}/>
          </div>
          <div style={{padding:12,background:"#0f2b0f",borderRadius:8,border:"1px solid #2d5a2d"}}>
            <label style={{fontSize:11,color:"#81c784",display:"block",marginBottom:4}}>Tarifs €/m³:</label>
            <input type="number" value={m3Tarifs} onChange={e=>setM3Tarifs(e.target.value)} placeholder="0.00"
              style={{width:"100%",background:"#0f1a0f",border:"1px solid #2d5a2d",borderRadius:6,padding:"8px",color:"#e8f5e9",fontSize:16,boxSizing:"border-box"}}/>
          </div>
        </div>

        <table style={{width:"100%",borderCollapse:"collapse",marginBottom:20}}>
          <thead>
            <tr style={{background:"#1b3a1b",borderBottom:"2px solid #2d5a2d"}}>
              <th style={{padding:"8px",textAlign:"left",fontSize:11,color:"#4caf50"}}>Šoferis</th>
              <th style={{padding:"8px",textAlign:"right",fontSize:11,color:"#4caf50"}}>km</th>
              <th style={{padding:"8px",textAlign:"right",fontSize:11,color:"#4caf50"}}>m³</th>
              <th style={{padding:"8px",textAlign:"right",fontSize:11,color:"#ffb74d"}}>Summa</th>
            </tr>
          </thead>
          <tbody>
            {soferuStats.map((s,i) => {
              const kmS = s.km * (parseFloat(kmTarifs) || 0)
              const m3S = s.m3 * (parseFloat(m3Tarifs) || 0)
              return (
                <tr key={i} style={{borderBottom:"1px solid #1b3a1b",background:i%2===0?"#0f1a0f":"transparent"}}>
                  <td style={{padding:"10px 8px",color:"#e8f5e9",fontSize:13,fontWeight:600}}>{s.vards}</td>
                  <td style={{padding:"10px 8px",color:"#81c784",textAlign:"right"}}>{s.km.toFixed(1)}</td>
                  <td style={{padding:"10px 8px",color:"#81c784",textAlign:"right"}}>{s.m3.toFixed(3)}</td>
                  <td style={{padding:"10px 8px",color:"#ffb74d",textAlign:"right",fontWeight:700,fontSize:14}}>{(kmS+m3S).toFixed(2)} €</td>
                </tr>
              )
            })}
          </tbody>
          <tfoot>
            <tr style={{borderTop:"2px solid #4caf50"}}>
              <td style={{padding:"10px 8px",color:"#4caf50",fontWeight:700}}>KOPĀ</td>
              <td style={{padding:"10px 8px",color:"#4caf50",textAlign:"right",fontWeight:700}}>{soferuStats.reduce((s,r)=>s+r.km,0).toFixed(1)}</td>
              <td style={{padding:"10px 8px",color:"#4caf50",textAlign:"right",fontWeight:700}}>{soferuStats.reduce((s,r)=>s+r.m3,0).toFixed(3)}</td>
              <td style={{padding:"10px 8px",color:"#4caf50",textAlign:"right",fontWeight:700,fontSize:16}}>
                {soferuStats.reduce((s,r)=>s+r.km*(parseFloat(kmTarifs)||0)+r.m3*(parseFloat(m3Tarifs)||0),0).toFixed(2)} €
              </td>
            </tr>
          </tfoot>
        </table>

        <button onClick={drukāt}
          style={{width:"100%",background:"#3a2800",border:"1px solid #ffb74d",borderRadius:8,padding:"12px",color:"#ffb74d",fontSize:14,fontWeight:700,cursor:"pointer"}}>
          🖨 Drukāt algu lapu
        </button>
      </div>
    </div>
  )
}

export default function RpAndrasPortals({ onBack, noHeader }) {
  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Filtri
  const [filtrSoferis, setFiltrSoferis] = useState("")
  const [filtrSortiments, setFiltrSortiments] = useState("")
  const [filtrPiegade, setFiltrPiegade] = useState("")
  const [filtrVeids, setFiltrVeids] = useState("")
const [filtrKlients, setFiltrKlients] = useState("")
  const [filtrNo, setFiltrNo] = useState("")
  const [filtrLidz, setFiltrLidz] = useState("")

  // Modāļi
  const [showRekins, setShowRekins] = useState(false)
  const [showAlgas, setShowAlgas] = useState(false)

  useEffect(() => { loadData() }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from("pavadzimes")
        .select("*")
        .order("datums", { ascending: false })
      if (error) throw error
      setRecords(data || [])
    } catch (err) {
      setError("Kļūda ielādējot: " + err.message)
    } finally {
      setLoading(false)
    }
  }

  const filtreti = useMemo(() => {
    return records.filter(r => {
      if (filtrSoferis && r.soferis !== filtrSoferis) return false
      if (filtrSortiments && !(r.sortiments||"").toLowerCase().includes(filtrSortiments.toLowerCase())) return false
      if (filtrPiegade && !(r.piegade||"").toLowerCase().includes(filtrPiegade.toLowerCase())) return false
      if (filtrKlients && !(r.klients||"").toLowerCase().includes(filtrKlients.toLowerCase())) return false
      if (filtrVeids && r.veids !== filtrVeids) return false
      if (filtrNo && r.datums < filtrNo) return false
      if (filtrLidz && r.datums > filtrLidz) return false
      return true
    })
  }, [records, filtrSoferis, filtrSortiments, filtrPiegade, filtrVeids, filtrNo, filtrLidz])

  const stats = useMemo(() => {
    const kopaKubi = filtreti.reduce((s, r) => s + (parseFloat(r.kubi) || 0), 0)
    const kopaKm = filtreti.reduce((s, r) => s + (parseFloat(r.km) || 0), 0)
    const kopaUzmeriti = filtreti.reduce((s, r) => s + (parseFloat(r.kubi_uzmeriti) || 0), 0)
    const starpiba = kopaUzmeriti - kopaKubi

    const paSoferiem = {}
    filtreti.forEach(r => {
      if (!r.soferis) return
      if (!paSoferiem[r.soferis]) paSoferiem[r.soferis] = { km: 0, m3: 0, pvz: 0 }
      paSoferiem[r.soferis].km += parseFloat(r.km) || 0
      paSoferiem[r.soferis].m3 += parseFloat(r.kubi) || 0
      paSoferiem[r.soferis].pvz += 1
    })

    return { kopaKubi, kopaKm, kopaUzmeriti, starpiba, paSoferiem }
  }, [filtreti])

  const notīrītFiltrus = () => {
    setFiltrSoferis(""); setFiltrSortiments(""); setFiltrPiegade("")
    setFiltrVeids(""); setFiltrNo(""); setFiltrLidz(""); setFiltrKlients("")
  }

  const unikalie = (key) => [...new Set(records.map(r => r[key]).filter(Boolean))].sort()

  const filtrFilename = [
    filtrSoferis || "visi",
    filtrNo || "",
    filtrLidz || ""
  ].filter(Boolean).join("_")

  return (
    <div style={{minHeight:"100vh",background:"#0a0f0a",color:"#e8f5e9",fontFamily:"Arial,sans-serif"}}>

      {/* HEADER — slēpts ja noHeader */}
      {!noHeader && (
      <div style={{background:"#1b3a1b",borderBottom:"2px solid #4caf50",padding:"14px 24px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <div style={{display:"flex",alignItems:"center",gap:16}}>
          <button onClick={onBack} style={{background:"transparent",border:"none",color:"#4caf50",fontSize:22,cursor:"pointer",minWidth:36,minHeight:44}}>←</button>
          <div>
            <div style={{fontSize:16,fontWeight:700,color:"#4caf50"}}>📊 RP Andras — Vadība</div>
            <div style={{fontSize:11,color:"#4a7a4a"}}>Pavadzīmju vadības panelis</div>
          </div>
        </div>
        <div style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap"}}>
          <button onClick={loadData} style={{background:"transparent",border:"1px solid #2d5a2d",borderRadius:6,padding:"6px 12px",color:"#81c784",fontSize:12,cursor:"pointer"}}>↻ Atjaunot</button>
          <button onClick={()=>exportExcel(filtreti, filtrFilename)} style={{background:"#0f2b0f",border:"1px solid #4caf50",borderRadius:6,padding:"6px 14px",color:"#4caf50",fontSize:12,cursor:"pointer",fontWeight:700}}>⬇ Excel</button>
          <button onClick={()=>setShowAlgas(true)} style={{background:"#3a2800",border:"1px solid #ffb74d",borderRadius:6,padding:"6px 14px",color:"#ffb74d",fontSize:12,cursor:"pointer",fontWeight:700}}>💰 Algas</button>
          <button onClick={()=>setShowRekins(true)} style={{background:"#225522",border:"1px solid #4caf50",borderRadius:6,padding:"6px 14px",color:"#4caf50",fontSize:12,cursor:"pointer",fontWeight:700}}>🧾 Rēķins</button>
        </div>
      </div>
      )}
      {/* Action bar kad noHeader */}
      {noHeader && (
        <div style={{padding:"10px 20px",display:"flex",gap:8,flexWrap:"wrap",borderBottom:"1px solid #2d4a2d"}}>
          <button onClick={loadData} style={{background:"transparent",border:"1px solid #2d5a2d",borderRadius:6,padding:"6px 12px",color:"#81c784",fontSize:12,cursor:"pointer"}}>↻ Atjaunot</button>
          <button onClick={()=>exportExcel(filtreti, filtrFilename)} style={{background:"#0f2b0f",border:"1px solid #4caf50",borderRadius:6,padding:"6px 14px",color:"#4caf50",fontSize:12,cursor:"pointer",fontWeight:700}}>⬇ Excel</button>
          <button onClick={()=>setShowAlgas(true)} style={{background:"#3a2800",border:"1px solid #ffb74d",borderRadius:6,padding:"6px 14px",color:"#ffb74d",fontSize:12,cursor:"pointer",fontWeight:700}}>💰 Algas</button>
          <button onClick={()=>setShowRekins(true)} style={{background:"#225522",border:"1px solid #4caf50",borderRadius:6,padding:"6px 14px",color:"#4caf50",fontSize:12,cursor:"pointer",fontWeight:700}}>🧾 Rēķins</button>
        </div>
      )}

      <div style={{padding:"20px 24px"}}>

        {/* KOPSAVILKUMS */}
        <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,marginBottom:20}}>
          {[
            { label:"Pavadzīmes", value: filtreti.length, unit:"", color:"#4caf50" },
            { label:"Nosūtīts", value: stats.kopaKubi.toFixed(3), unit:"m³", color:"#81c784" },
            { label:"Uzmērīts", value: stats.kopaUzmeriti.toFixed(3), unit:"m³", color:"#ffb74d" },
            { label:"Kopā km", value: stats.kopaKm.toFixed(1), unit:"km", color:"#4caf50" },
          ].map((s,i) => (
            <div key={i} style={{background:"#141f14",border:"1px solid #2d5a2d",borderRadius:10,padding:"16px"}}>
              <div style={{fontSize:11,color:"#4a7a4a",marginBottom:4}}>{s.label}</div>
              <div style={{fontSize:22,fontWeight:700,color:s.color}}>{s.value} <span style={{fontSize:13,color:"#4a7a4a"}}>{s.unit}</span></div>
            </div>
          ))}
        </div>

        {/* ŠOFERU KOPSAVILKUMS */}
        {Object.keys(stats.paSoferiem).length > 0 && (
          <div style={{background:"#141f14",border:"1px solid #2d5a2d",borderRadius:10,padding:16,marginBottom:20}}>
            <div style={{fontSize:13,fontWeight:700,color:"#4caf50",marginBottom:12}}>👤 Pa šoferiem</div>
            <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
              {Object.entries(stats.paSoferiem).map(([vards, s]) => (
                <div key={vards} style={{background:"#0f2b0f",border:"1px solid #1b3a1b",borderRadius:8,padding:"10px 14px",cursor:"pointer"}}
                  onClick={()=>setFiltrSoferis(filtrSoferis===vards?"":vards)}>
                  <div style={{fontSize:12,fontWeight:700,color:filtrSoferis===vards?"#4caf50":"#e8f5e9"}}>{vards}</div>
                  <div style={{fontSize:11,color:"#4a7a4a"}}>{s.pvz} pvz | {s.m3.toFixed(1)} m³ | {s.km.toFixed(0)} km</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* FILTRI */}
        <div style={{background:"#141f14",border:"1px solid #2d5a2d",borderRadius:10,padding:16,marginBottom:16}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
            <span style={{fontSize:13,fontWeight:700,color:"#4caf50"}}>🔍 Filtri</span>
            <button onClick={notīrītFiltrus} style={{background:"transparent",border:"1px solid #2d5a2d",borderRadius:4,padding:"4px 10px",color:"#4a7a4a",fontSize:11,cursor:"pointer"}}>Notīrīt</button>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr) repeat(2,1fr) 1fr",gap:10}}>
            <div>
              <label style={{fontSize:10,color:"#4a7a4a",display:"block",marginBottom:3}}>Šoferis:</label>
              <select value={filtrSoferis} onChange={e=>setFiltrSoferis(e.target.value)}
                style={{width:"100%",background:"#0f1a0f",border:"1px solid #2d5a2d",borderRadius:5,padding:"6px",color:"#e8f5e9",fontSize:11}}>
                <option value="">Visi</option>
                {SOFERI.map(s=><option key={s.vards} value={s.vards}>{s.vards}</option>)}
              </select>
            </div>
            <div>
              <label style={{fontSize:10,color:"#4a7a4a",display:"block",marginBottom:3}}>Sortiments:</label>
              <input value={filtrSortiments} onChange={e=>setFiltrSortiments(e.target.value)} placeholder="Meklēt..."
                style={{width:"100%",background:"#0f1a0f",border:"1px solid #2d5a2d",borderRadius:5,padding:"6px",color:"#e8f5e9",fontSize:11,boxSizing:"border-box"}}/>
            </div>
            <div>
              <label style={{fontSize:10,color:"#4a7a4a",display:"block",marginBottom:3}}>Piegādes vieta:</label>
              <input value={filtrPiegade} onChange={e=>setFiltrPiegade(e.target.value)} placeholder="Meklēt..."
                style={{width:"100%",background:"#0f1a0f",border:"1px solid #2d5a2d",borderRadius:5,padding:"6px",color:"#e8f5e9",fontSize:11,boxSizing:"border-box"}}/>
            </div>
            <div>
              <label style={{fontSize:10,color:"#4a7a4a",display:"block",marginBottom:3}}>Klients:</label>
              <input value={filtrKlients||""} onChange={e=>setFiltrKlients(e.target.value)} placeholder="Meklēt..."
                style={{width:"100%",background:"#0f1a0f",border:"1px solid #2d5a2d",borderRadius:5,padding:"6px",color:"#e8f5e9",fontSize:11,boxSizing:"border-box"}}/>
            </div>
            <div>
              <label style={{fontSize:10,color:"#4a7a4a",display:"block",marginBottom:3}}>Veids:</label>
              <select value={filtrVeids} onChange={e=>setFiltrVeids(e.target.value)}
                style={{width:"100%",background:"#0f1a0f",border:"1px solid #2d5a2d",borderRadius:5,padding:"6px",color:"#e8f5e9",fontSize:11}}>
                <option value="">Visi</option>
                <option value="Sava krautuve">Sava krautuve</option>
                <option value="Pakalpojums">Pakalpojums</option>
              </select>
            </div>
            <div>
              <label style={{fontSize:10,color:"#4a7a4a",display:"block",marginBottom:3}}>No datuma:</label>
              <input type="date" value={filtrNo} onChange={e=>setFiltrNo(e.target.value)}
                style={{width:"100%",background:"#0f1a0f",border:"1px solid #2d5a2d",borderRadius:5,padding:"6px",color:"#e8f5e9",fontSize:11,boxSizing:"border-box"}}/>
            </div>
            <div>
              <label style={{fontSize:10,color:"#4a7a4a",display:"block",marginBottom:3}}>Līdz datumam:</label>
              <input type="date" value={filtrLidz} onChange={e=>setFiltrLidz(e.target.value)}
                style={{width:"100%",background:"#0f1a0f",border:"1px solid #2d5a2d",borderRadius:5,padding:"6px",color:"#e8f5e9",fontSize:11,boxSizing:"border-box"}}/>
            </div>
          </div>
        </div>

        {/* KĻŪDA */}
        {error && (
          <div style={{background:"#3e1f1f",border:"1px solid #c62828",padding:"10px 16px",borderRadius:6,color:"#ff6b6b",marginBottom:16,fontSize:12}}>
            {error}
          </div>
        )}

        {/* TABULA */}
        {loading
          ? <div style={{textAlign:"center",padding:"60px",color:"#4a7a4a",fontSize:14}}>⏳ Ielādē...</div>
          : filtreti.length === 0
          ? <div style={{textAlign:"center",padding:"60px",color:"#4a7a4a",fontSize:14}}>📋 Nav ierakstu</div>
          : (
            <div style={{overflowX:"auto"}}>
              <table style={{width:"100%",borderCollapse:"collapse",fontSize:11}}>
                <thead>
                  <tr style={{background:"#1b3a1b",borderBottom:"2px solid #2d5a2d"}}>
                    {COLS.map(col => (
                      <th key={col.key} style={{padding:"10px 8px",textAlign:"left",color:"#4caf50",fontWeight:700,borderRight:"1px solid #2d5a2d",whiteSpace:"nowrap"}}>
                        {col.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtreti.map((rec, i) => (
                    <tr key={rec.id} style={{borderBottom:"1px solid #1b3a1b",background:i%2===0?"#0f1a0f":"transparent"}}>
                      {COLS.map(col => (
                        <td key={col.key} style={{padding:"8px",borderRight:"1px solid #1b3a1b",color:
                          col.key==="kubi"||col.key==="km"?"#4caf50":
                          col.key==="soferis"?"#ffb74d":"#e8f5e9",
                          whiteSpace:"nowrap"
                        }}>
                          {col.key==="suga"&&rec[col.key]
                            ? `${rec[col.key]} (${SUGAS[rec[col.key]]||rec[col.key]})`
                            : col.key==="veids"&&rec[col.key]==="Pakalpojums"
                            ? <span style={{color:"#ffb74d"}}>🤝 {rec[col.key]}</span>
                            : col.key==="veids"&&rec[col.key]==="Sava krautuve"
                            ? <span style={{color:"#4caf50"}}>🌲 {rec[col.key]}</span>
                            : rec[col.key]||"—"
                          }
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr style={{background:"#1b3a1b",borderTop:"2px solid #4caf50"}}>
                    <td colSpan="8" style={{padding:"10px 8px",color:"#4caf50",fontWeight:700}}>
                      KOPĀ: {filtreti.length} pavadzīmes
                    </td>
                    <td style={{padding:"10px 8px",color:"#4caf50",fontWeight:700}}>{stats.kopaKubi.toFixed(3)}</td>
                    <td style={{padding:"10px 8px",color:"#ffb74d",fontWeight:700}}>{stats.kopaUzmeriti.toFixed(3)}</td>
                    <td style={{padding:"10px 8px",color:"#4caf50",fontWeight:700}}>{stats.kopaKm.toFixed(1)}</td>
                    <td colSpan="3" style={{padding:"10px 8px",color:"#4a7a4a",fontSize:10}}>
                      Starpība: {stats.starpiba > 0 ? "+" : ""}{stats.starpiba.toFixed(3)} m³
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )
        }
      </div>

      {/* MODĀĻI */}
      {showRekins && <RekinsModal records={filtreti} onClose={()=>setShowRekins(false)}/>}
      {showAlgas && <AlgasModal records={filtreti} onClose={()=>setShowAlgas(false)}/>}

      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
    </div>
  )
}
