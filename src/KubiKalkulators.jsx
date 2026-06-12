import { useState, useEffect } from "react"
import { C as DS, F, spinnerCSS } from "./ds"

const SORT_MAP = {
  "3.7": "Baļķis", "4.9": "Baļķis", "6.1": "Baļķis",
  "3.1": "Zāģbaļķis",
  "2.8": "Finieris", "3.3": "Finieris",
  "2.5": "Tara",
  "2.9": "Gūlsnis",
  "3.0": "__malka__"
}

const SORT_COLOR = {
  "Baļķis": "#42a5f5", "Zāģbaļķis": "#ce93d8", "Finieris": "#4db6ac",
  "Tara": "#ffb74d", "Gūlsnis": "#a1887f",
  "Sausā malka": "#ff7043", "Malka": "#bcaaa4", "Papīrmalka": "#90a4ae"
}

const BTN = {
  background: "#e65100", border: "3px solid #ff8a50", borderRadius: "8px",
  color: "#000000", fontSize: "28px", fontWeight: "900",
  padding: "12px 0", cursor: "pointer", textAlign: "center", width: "100%"
}

export default function KubiKalkulators({ onBack }) {
  const [entries, setEntries] = useState(() => {
    try { return JSON.parse(localStorage.getItem("kubi_v3") || "[]") } catch { return [] }
  })
  const [valD, setValD] = useState("")
  const [valL, setValL] = useState(() => {
    try { return localStorage.getItem("kubi_lastL") || "" } catch { return "" }
  })
  const [active, setActive] = useState("d")
  const [showOv, setShowOv] = useState(false)
  const [showMalka, setShowMalka] = useState(false)
  const [savedTime, setSavedTime] = useState("saglabāts")
  const [pendingD, setPendingD] = useState(null)
  const [pendingL, setPendingL] = useState(null)

  useEffect(() => {
    localStorage.setItem("kubi_v3", JSON.stringify(entries))
    localStorage.setItem("kubi_lastL", valL)
    setSavedTime("saglabāts " + new Date().toLocaleTimeString("lv-LV", { hour: "2-digit", minute: "2-digit" }))
  }, [entries, valL])

  const kp = (ch) => {
    if (active === "d") {
      if (ch === ".") return
      if (valD.length >= 2) return
      setValD(v => v + ch)
    } else {
      if (ch === "." && valL.includes(".")) return
      if (valL.replace(".", "").length >= 3) return
      setValL(v => v + ch)
    }
  }

  const kpDel = () => {
    if (active === "d") setValD(v => v.slice(0, -1))
    else setValL(v => v.slice(0, -1))
  }

  const kpAdd = () => {
    if (!valL) { setActive("l"); return }
    if (!valD) { setActive("d"); return }
    const lKey = parseFloat(valL).toFixed(1)
    setPendingD(valD)
    setPendingL(valL)
    if (lKey === "3.0") {
      setShowMalka(true)
    } else {
      addEntry(valD, valL, null)
    }
  }

  const addEntry = (d, l, malkaType) => {
    const di = parseInt(d), li = parseFloat(l)
    const r = (di / 2) / 100
    const m3 = Math.PI * r * r * li
    const lKey = li.toFixed(1)
    let sort = SORT_MAP[lKey]
    if (sort === "__malka__") sort = malkaType || "Malka"
    else if (!sort) sort = null
    setEntries(prev => [...prev, { id: Date.now(), d: di, l: li, m3, sort }])
    setValD("")
    setActive("d")
    setShowMalka(false)
  }

  const confirmMalka = (type) => {
    addEntry(pendingD, pendingL, type)
  }

  const delEntry = (id) => {
    setEntries(prev => prev.filter(e => e.id !== id))
  }

  const getSortGroups = () => {
    const groups = {}, order = []
    entries.forEach(e => {
      const key = e.sort || ("?" + e.d + "x" + e.l)
      if (!groups[key]) { groups[key] = { name: e.sort, items: [], total: 0 }; order.push(key) }
      groups[key].items.push(e)
      groups[key].total += e.m3
    })
    return order.map(k => groups[k])
  }

  const total = entries.reduce((s, e) => s + e.m3, 0)
  const groups = getSortGroups()

  const printReport = () => {
    if (!entries.length) return
    const today = new Date().toLocaleDateString("lv-LV")
    const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Kubikmetru pārskats</title>
<style>body{font-family:Arial;font-size:11px;padding:20px;max-width:800px;margin:0 auto}h2{color:#225522;border-bottom:2px solid #225522;padding-bottom:4px}table{border-collapse:collapse;width:100%;margin-bottom:12px}th{background:#225522;color:white;padding:4px 8px;text-align:left;font-size:10px}td{border:1px solid #ccc;padding:3px 8px;font-size:10px}tr:nth-child(even){background:#f0f8f0}.total{font-weight:bold;background:#e8f5e9}</style>
</head><body>
<h2>Kubikmetru pārskats</h2>
<p><b>Datums:</b> ${today} | <b>Kopā:</b> ${total.toFixed(3)} m³ (${entries.length} gab)</p>
<h3>Pa sortimentiem</h3>
<table><thead><tr><th>Sortiments</th><th>Gabali</th><th>m³</th></tr></thead><tbody>
${groups.map(g => `<tr><td>${g.name || (g.items[0].d + "cm · " + g.items[0].l + "m")}</td><td>${g.items.length}</td><td>${g.total.toFixed(3)}</td></tr>`).join("")}
<tr class="total"><td>Kopā</td><td>${entries.length}</td><td>${total.toFixed(3)}</td></tr>
</tbody></table>
<h3>Visi mērījumi</h3>
<table><thead><tr><th>Nr.</th><th>Sortiments</th><th>Tievgalis cm</th><th>Garums m</th><th>m³</th></tr></thead><tbody>
${entries.map((e, i) => `<tr><td>${i + 1}</td><td>${e.sort || "—"}</td><td>${e.d}</td><td>${e.l}</td><td>${e.m3.toFixed(3)}</td></tr>`).join("")}
</tbody></table>
<p style="font-size:9px;color:#888;margin-top:16px">Meža tirgus kalkulators · ${today}</p>
</body></html>`
    // Blob URL — darbojas iOS Safari, Android Chrome un PWA
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href = url
    a.target = '_blank'
    a.rel = 'noopener'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    setTimeout(() => URL.revokeObjectURL(url), 10000)
  }

  const doReset = () => {
    if (!entries.length) return
    if (window.confirm("Pirms dzēšanas lejupielādēt PDF?")) printReport()
    if (window.confirm("Sākt jaunus mērījumus? Visi dati tiks dzēsti!")) {
      setEntries([])
    }
  }

  const s = { fontFamily: "Arial, sans-serif" }

  return (
    <div style={{ ...s, background: "#1a2e1a", minHeight: "100vh", maxWidth: "480px", margin: "0 auto" }}>

      {/* HEADER */}
      <div style={{ background: DS.glass, borderBottom: `1px solid ${DS.greenBdr}`, backdropFilter: "blur(8px)", padding: "0 12px", height: 52, display: "flex", alignItems: "center", gap: "8px", position: "sticky", top: 0, zIndex: 10 }}>
        <button onClick={onBack} style={{ background: "transparent", border: "none", color: DS.green, fontSize: "22px", cursor: "pointer", minWidth: 36, minHeight: 44 }}>←</button>
        <span style={{ color: DS.textSec, fontSize: F.base, fontWeight: F.weightBold, flex: 1 }}>📐 Kubikmetru kalkulators</span>
        <button onClick={() => setShowOv(v => !v)} style={{ padding: "5px 10px", borderRadius: "6px", fontSize: "12px", cursor: "pointer", fontWeight: "700", border: "2px solid #4caf50", color: showOv ? "#000" : "#4caf50", background: showOv ? "#4caf50" : "transparent" }}>Pārskats</button>
        {entries.length > 0 && (
          <button onClick={printReport} style={{ padding: "5px 10px", borderRadius: "6px", fontSize: "12px", cursor: "pointer", fontWeight: "700", border: "2px solid #81c784", color: "#000", background: "#4caf50" }}>📥 PDF</button>
        )}
        <span style={{ color: "#81c784", fontSize: "10px", whiteSpace: "nowrap" }}>{savedTime}</span>
      </div>

      {/* STATS */}
      <div style={{ background: "#0f1f0f", padding: "5px 12px", display: "flex", gap: "16px", borderBottom: "1px solid #1a3a1a" }}>
        <div><div style={{ color: "#4caf50", fontSize: "16px", fontWeight: "700" }}>{entries.length}</div><div style={{ color: "#ffffff", fontSize: "10px" }}>gabali</div></div>
        <div><div style={{ color: "#4caf50", fontSize: "16px", fontWeight: "700" }}>{total.toFixed(3)}</div><div style={{ color: "#ffffff", fontSize: "10px" }}>m³ kopā</div></div>
      </div>

      {/* INPUT DISPLAY */}
      <div style={{ background: "#0a1a0a", padding: "6px 12px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px", borderBottom: "1px solid #1a3a1a" }}>
        <div onClick={() => setActive("l")} style={{ background: "#1a3a1a", border: `2px solid ${active === "l" ? "#4caf50" : "#4a7a4a"}`, borderRadius: "6px", padding: "6px 8px", cursor: "pointer" }}>
          <div style={{ color: "#ffffff", fontSize: "10px", fontWeight: "700", marginBottom: "1px" }}>Garums (m)</div>
          <div style={{ color: "#ffffff", fontSize: "22px", fontWeight: "700", minHeight: "28px" }}>
            {valL}{active === "l" && <span style={{ display: "inline-block", width: "2px", height: "20px", background: "#4caf50", verticalAlign: "middle", marginLeft: "2px", animation: "blink 1s infinite" }} />}
          </div>
          <div style={{ fontSize: "9px", color: "#81c784" }}>spiedi lai mainītu</div>
        </div>
        <div onClick={() => setActive("d")} style={{ background: active === "d" ? "#0f2b0f" : "#1a3a1a", border: `2px solid ${active === "d" ? "#4caf50" : "#4a7a4a"}`, borderRadius: "6px", padding: "6px 8px", cursor: "pointer" }}>
          <div style={{ color: "#ffffff", fontSize: "10px", fontWeight: "700", marginBottom: "1px" }}>Tievgalis (cm)</div>
          <div style={{ color: "#ffffff", fontSize: "22px", fontWeight: "700", minHeight: "28px" }}>
            {valD}{active === "d" && <span style={{ display: "inline-block", width: "2px", height: "20px", background: "#4caf50", verticalAlign: "middle", marginLeft: "2px", animation: "blink 1s infinite" }} />}
          </div>
        </div>
      </div>

      {/* NUMPAD */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "5px", padding: "6px 12px", background: "#0f1f0f" }}>
        {["7","8","9","4","5","6","1","2","3","·","0"].map(k => (
          <button key={k} onClick={() => kp(k === "·" ? "." : k)} style={BTN}>{k}</button>
        ))}
        <button onClick={kpDel} style={{ ...BTN, background: "#c62828", border: "3px solid #ff5252", color: "#ffffff", fontSize: "22px" }}>⌫</button>
        <button onClick={kpAdd} style={{ ...BTN, background: "#4caf50", border: "3px solid #81c784", color: "#000000", fontSize: "16px", gridColumn: "1/4", padding: "13px 0" }}>+ PIEVIENOT</button>
      </div>

      {/* MALKA MODAL */}
      {showMalka && (
        <div style={{ background: "rgba(0,0,0,0.85)", padding: "12px" }}>
          <div style={{ background: "#1a3a1a", border: "2px solid #4caf50", borderRadius: "10px", padding: "12px" }}>
            <div style={{ color: "#ffffff", fontSize: "13px", marginBottom: "10px", textAlign: "center", fontWeight: "700" }}>Malkas veids (3.0 m)</div>
            {[["Sausā malka", "#bf360c"], ["Malka", "#5d4037"], ["Papīrmalka", "#37474f"]].map(([name, bg]) => (
              <button key={name} onClick={() => confirmMalka(name)} style={{ width: "100%", padding: "12px", border: "2px solid rgba(255,255,255,0.3)", borderRadius: "6px", fontSize: "14px", cursor: "pointer", fontWeight: "700", marginBottom: "6px", color: "#ffffff", background: bg, display: "block" }}>{name}</button>
            ))}
            <button onClick={() => setShowMalka(false)} style={{ width: "100%", padding: "12px", border: "2px solid rgba(255,255,255,0.3)", borderRadius: "6px", fontSize: "14px", cursor: "pointer", fontWeight: "700", color: "#aaa", background: "#2a2a2a", display: "block" }}>Atcelt</button>
          </div>
        </div>
      )}

      {/* PĀRSKATS */}
      {showOv && (
        <div style={{ background: "#0f1f0f", padding: "10px 12px", borderTop: "2px solid #4caf50" }}>
          <div style={{ color: "#ffffff", fontSize: "13px", marginBottom: "8px", fontWeight: "700" }}>Kopsavilkums pa sortimentiem</div>
          {groups.map((g, i) => {
            const color = SORT_COLOR[g.name] || "#aaa"
            const nm = g.name || (g.items[0].d + "cm/" + g.items[0].l + "m")
            return (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", borderBottom: "0.5px solid #1a3a1a", color: "#ffffff", fontSize: "12px" }}>
                <span style={{ color }}>{nm} ({g.items.length} gab)</span>
                <span>{g.total.toFixed(3)} m³</span>
              </div>
            )
          })}
          <div style={{ display: "flex", justifyContent: "space-between", borderTop: "2px solid #4caf50", marginTop: "6px", paddingTop: "8px" }}>
            <span style={{ color: "#4caf50", fontWeight: "700" }}>Kopā</span>
            <span style={{ color: "#4caf50", fontWeight: "700" }}>{total.toFixed(3)} m³</span>
          </div>
          <button onClick={printReport} style={{ marginTop: "10px", width: "100%", padding: "11px", borderRadius: "6px", fontSize: "13px", cursor: "pointer", fontWeight: "700", border: "2px solid #81c784", color: "#000000", background: "#4caf50" }}>Drukāt / PDF</button>
        </div>
      )}

      {/* LIST */}
      <div style={{ paddingBottom: "52px" }}>
        {entries.length === 0 ? (
          <div style={{ textAlign: "center", padding: "24px 16px", color: "#81c784" }}>
            <div style={{ fontSize: "32px", marginBottom: "8px" }}>📏</div>
            <div style={{ fontSize: "14px", marginBottom: "4px" }}>Ievadi garumu, tad tievgali</div>
            <div style={{ fontSize: "11px" }}>Garums paliek — tikai tievgalis mainās</div>
          </div>
        ) : groups.map((g, gi) => {
          const color = SORT_COLOR[g.name] || "#aaa"
          const nm = g.name || (g.items[0].d + "cm·" + g.items[0].l + "m")
          return (
            <div key={gi}>
              <div style={{ background: "#0f2b0f", padding: "5px 12px", display: "flex", justifyContent: "space-between", alignItems: "center", borderLeft: `3px solid ${color}` }}>
                <span style={{ fontSize: "11px", fontWeight: "700", color }}>{nm}</span>
                <span style={{ color: "#ffffff", fontSize: "11px" }}>{g.total.toFixed(3)} m³ · {g.items.length} gab</span>
              </div>
              {g.items.map(e => (
                <div key={e.id} style={{ background: "#141f14", borderBottom: "0.5px solid #1a3a1a", padding: "6px 12px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ color: "#ffffff", fontSize: "13px" }}>d={e.d}cm · {e.l}m</span>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <span style={{ color: "#4caf50", fontSize: "13px", fontWeight: "700" }}>{e.m3.toFixed(3)} m³</span>
                    <button onClick={() => delEntry(e.id)} style={{ background: "none", border: "none", color: "#ff6b6b", fontSize: "20px", cursor: "pointer", padding: "0 6px" }}>×</button>
                  </div>
                </div>
              ))}
            </div>
          )
        })}
      </div>

      {/* BOTTOM */}
      <div style={{ background: "#0f1f0f", borderTop: "2px solid #2d4a2d", padding: "6px 12px", position: "sticky", bottom: 0 }}>
        <button onClick={doReset} style={{ width: "100%", padding: "11px", borderRadius: "6px", fontSize: "13px", cursor: "pointer", fontWeight: "700", border: "2px solid rgba(255,255,255,0.3)", color: "#ffffff", background: "#c62828" }}>Jauni mērījumi</button>
      </div>

      <style>{`@keyframes blink{0%,100%{opacity:1}50%{opacity:0}}`}</style>
    </div>
  )
}
