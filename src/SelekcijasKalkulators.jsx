import React, { useState, useRef, useCallback } from "react"

const MAX_ATTELI = 3

const s = {
  app:   { minHeight: "100vh", background: "#050d05", color: "#e0ede0", fontFamily: "'Inter',sans-serif" },
  hdr:   { background: "rgba(10,25,10,0.95)", borderBottom: "1px solid #1e3a1e", backdropFilter: "blur(8px)", padding: "0 16px", height: 52, display: "flex", alignItems: "center", gap: 10, position: "sticky", top: 0, zIndex: 10 },
  back:  { background: "transparent", border: "none", color: "#4caf50", fontSize: 22, cursor: "pointer", padding: "0 4px", minWidth: 36, minHeight: 44 },
  title: { margin: 0, color: "#4caf50", fontSize: 15, fontWeight: 700 },
  body:  { padding: "16px", maxWidth: 720, margin: "0 auto" },
  card:  { background: "#0d1f0d", border: "1px solid #1e3a1e", borderRadius: 12, padding: 16, marginBottom: 14 },
  btn:   { background: "linear-gradient(135deg,#2e7d32,#1b5e20)", color: "white", border: "none", borderRadius: 8, padding: "13px 24px", fontSize: 14, fontWeight: 700, cursor: "pointer", minHeight: 48 },
  btnSm: { background: "#1e3a1e", color: "#4caf50", border: "1px solid #2d5a2d", borderRadius: 6, padding: "8px 16px", fontSize: 13, cursor: "pointer", minHeight: 40 },
  btnRed:{ background: "#1a0000", color: "#ef5350", border: "1px solid #c62828", borderRadius: 6, padding: "6px 12px", fontSize: 12, cursor: "pointer" },
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const r = new FileReader()
    r.onload = () => resolve(r.result.split(",")[1])
    r.onerror = reject
    r.readAsDataURL(file)
  })
}

function FormatetsRezultats({ teksts }) {
  const rindas = teksts.split("\n")
  const elementi = []
  let i = 0

  while (i < rindas.length) {
    const r = rindas[i].trim()

    if (r === "") { elementi.push(<div key={i} style={{ height: 6 }} />); i++; continue }

    // Galvenais vērtējums — iekrāsota rūtiņa
    if (r.startsWith("🟢") || r.startsWith("🟡") || r.startsWith("🔴")) {
      const bg = r.startsWith("🟢") ? "#0a2a0a" : r.startsWith("🟡") ? "#1a1a00" : "#1a0000"
      const bc = r.startsWith("🟢") ? "#2e7d32" : r.startsWith("🟡") ? "#f57f17" : "#c62828"
      const col = r.startsWith("🟢") ? "#4caf50" : r.startsWith("🟡") ? "#ffb300" : "#ef5350"
      elementi.push(
        <div key={i} style={{ background: bg, border: `2px solid ${bc}`, borderRadius: 10, padding: "12px 16px", marginBottom: 10, marginTop: 4 }}>
          <span style={{ fontSize: 16, fontWeight: 800, color: col }}>{r}</span>
        </div>
      )
      i++; continue
    }

    // ⛔ līnijas — sarkans fons
    if (r.includes("⛔")) {
      elementi.push(
        <div key={i} style={{ background: "#1a0000", border: "1px solid #c62828", borderRadius: 8, padding: "10px 14px", marginBottom: 8, color: "#ef5350", fontWeight: 700, fontSize: 13 }}>
          {r}
        </div>
      )
      i++; continue
    }

    // Sekciju galvenes (sākas ar emoji + lielie burti + ":")
    if (/^[🦌📸📐⚖️📖⚠️💡📅🏆🎯📝🔭✦]/.test(r) && (r.includes(":") || r.length < 50)) {
      elementi.push(
        <div key={i} style={{ fontSize: 14, fontWeight: 700, color: "#4caf50", marginTop: 12, marginBottom: 4, borderBottom: "1px solid #1e3a1e", paddingBottom: 4 }}>
          {r}
        </div>
      )
      i++; continue
    }

    // Parastā rinda
    elementi.push(
      <div key={i} style={{ fontSize: 13, lineHeight: 1.65, color: "#c8e6c9", marginBottom: 2, paddingLeft: r.startsWith("-") || r.startsWith("✦") || r.startsWith("•") ? 8 : 0 }}>
        {r}
      </div>
    )
    i++
  }

  return <div>{elementi}</div>
}

export default function SelekcijasKalkulators({ onBack }) {
  const [atteli, setAtteli]       = useState([])  // [{ file, preview }]
  const [lade, setLade]           = useState(false)
  const [rezultats, setRezultats] = useState("")
  const [kļūda, setKļūda]         = useState("")
  const [velk, setVelk]           = useState(false)

  const kameraRef  = useRef()
  const galerijRef = useRef()

  const pienemFailu = useCallback((file) => {
    if (!file) return
    if (!file.type.startsWith("image/")) {
      setKļūda("Lūdzu augšupielādē attēlu (JPG, PNG, WEBP, HEIC).")
      return
    }
    if (atteli.length >= MAX_ATTELI) {
      setKļūda(`Maksimāli ${MAX_ATTELI} attēli vienā analīzē.`)
      return
    }
    setKļūda("")
    setRezultats("")
    const preview = URL.createObjectURL(file)
    setAtteli(prev => [...prev, { file, preview }])
  }, [atteli.length])

  const nodzestAttelu = (idx) => {
    setAtteli(prev => {
      URL.revokeObjectURL(prev[idx].preview)
      return prev.filter((_, i) => i !== idx)
    })
    setRezultats("")
  }

  const analizet = async () => {
    if (!atteli.length) return
    setLade(true)
    setKļūda("")
    setRezultats("")
    try {
      const images = await Promise.all(
        atteli.map(async a => ({
          image: await fileToBase64(a.file),
          mimeType: a.file.type,
        }))
      )
      const r = await fetch("/api/selektors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ images }),
      })
      const d = await r.json()
      if (!r.ok) throw new Error(d.error || "Servera kļūda")
      setRezultats(d.teksts)
    } catch (e) {
      setKļūda("Kļūda: " + e.message)
    } finally {
      setLade(false)
    }
  }

  const jauns = () => {
    atteli.forEach(a => URL.revokeObjectURL(a.preview))
    setAtteli([])
    setRezultats("")
    setKļūda("")
  }

  const varPievienot = atteli.length < MAX_ATTELI
  const irAtteli = atteli.length > 0

  return (
    <div style={s.app}>
      <div style={s.hdr}>
        <button style={s.back} onClick={onBack}>←</button>
        <h1 style={s.title}>🦌 Selektors</h1>
        <span style={{ fontSize: 11, color: "#558b2f", marginLeft: 4 }}>AI selekcijas palīgs</span>
      </div>

      <div style={s.body}>

        {/* Attēlu rinda */}
        {irAtteli && (
          <div style={s.card}>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
              {atteli.map((a, idx) => (
                <div key={idx} style={{ position: "relative", flexShrink: 0 }}>
                  <img
                    src={a.preview}
                    alt={`Attēls ${idx + 1}`}
                    style={{ width: atteli.length === 1 ? "100%" : 110, maxWidth: "100%", height: atteli.length === 1 ? "auto" : 110, maxHeight: atteli.length === 1 ? 400 : 110, objectFit: "cover", borderRadius: 8, display: "block" }}
                  />
                  <button
                    onClick={() => nodzestAttelu(idx)}
                    style={{ position: "absolute", top: 4, right: 4, background: "#1a0000cc", border: "1px solid #c62828", color: "#ef5350", borderRadius: 4, fontSize: 12, padding: "2px 6px", cursor: "pointer", lineHeight: 1 }}
                  >✕</button>
                  {atteli.length > 1 && (
                    <div style={{ position: "absolute", bottom: 4, left: 4, background: "#00000088", color: "#fff", fontSize: 10, borderRadius: 4, padding: "2px 6px" }}>
                      {idx + 1}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Poga pievienot papildu attēlu */}
            {varPievienot && (
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 11, color: "#558b2f", marginBottom: 8 }}>
                  {atteli.length === 1
                    ? "Selektors var analizēt līdz 3 attēliem — pievienot vēl leņķi?"
                    : `${atteli.length}/3 attēli — vēl ${MAX_ATTELI - atteli.length} vieta`}
                </div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <button style={s.btnSm} onClick={() => kameraRef.current.click()}>
                    📷 Fotografēt
                  </button>
                  <button style={s.btnSm} onClick={() => galerijRef.current.click()}>
                    🖼 No galerijas
                  </button>
                </div>
              </div>
            )}

            {/* Galvenās pogas */}
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              {!rezultats && !lade && (
                <button style={s.btn} onClick={analizet}>
                  🔍 Analizēt{atteli.length > 1 ? ` (${atteli.length} attēli)` : ""}
                </button>
              )}
              {lade && (
                <button style={{ ...s.btn, opacity: 0.6, cursor: "not-allowed" }} disabled>
                  ⏳ Analizē...
                </button>
              )}
              {rezultats && varPievienot && (
                <button style={{ ...s.btn, background: "linear-gradient(135deg,#1565c0,#0d47a1)" }} onClick={() => { setRezultats(""); }}>
                  + Pievienot attēlu un atkārtot
                </button>
              )}
              <button style={s.btnSm} onClick={jauns}>↩ Sākt no jauna</button>
            </div>

            {kļūda && <div style={{ marginTop: 10, color: "#ef5350", fontSize: 13 }}>{kļūda}</div>}
          </div>
        )}

        {/* Sākuma zona — nav neviena attēla */}
        {!irAtteli && (
          <div style={s.card}>
            <div style={{ fontSize: 13, color: "#81c784", marginBottom: 16 }}>
              Augšupielādē dzīvnieka foto — AI noteiks vecumu, dzimumu un sniegs selekcijas ieteikumu pēc Baumaņa principiem.
            </div>

            {/* Drag & drop zona */}
            <div
              onDragOver={e => { e.preventDefault(); setVelk(true) }}
              onDragLeave={() => setVelk(false)}
              onDrop={e => { e.preventDefault(); setVelk(false); pienemFailu(e.dataTransfer.files[0]) }}
              onClick={() => galerijRef.current.click()}
              style={{
                border: `2px dashed ${velk ? "#4caf50" : "#2d5a2d"}`,
                borderRadius: 12, padding: "40px 20px", textAlign: "center",
                cursor: "pointer", background: velk ? "#0a1f0a" : "#070d07",
                transition: "all 0.2s", marginBottom: 14,
              }}
            >
              <div style={{ fontSize: 44, marginBottom: 10 }}>📷</div>
              <div style={{ fontSize: 15, color: "#4caf50", fontWeight: 700, marginBottom: 4 }}>
                Velc attēlu šurp vai klikšķini
              </div>
              <div style={{ fontSize: 11, color: "#558b2f" }}>JPG · PNG · WEBP · HEIC</div>
            </div>

            {/* Mobilā kamera */}
            <button
              style={{ ...s.btn, width: "100%", marginBottom: 8 }}
              onClick={() => kameraRef.current.click()}
            >
              📷 Fotografēt tagad
            </button>

            {kļūda && <div style={{ marginTop: 8, color: "#ef5350", fontSize: 13 }}>{kļūda}</div>}
          </div>
        )}

        {/* AI analīzes rezultāts */}
        {rezultats && (
          <div style={{ ...s.card, borderColor: "#2e7d32" }}>
            <div style={{ fontSize: 12, color: "#4caf50", fontWeight: 700, marginBottom: 12, borderBottom: "1px solid #1e3a1e", paddingBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
              🤖 AI Selekcijas vērtējums
              {atteli.length > 1 && <span style={{ fontSize: 10, color: "#558b2f", fontWeight: 400 }}>({atteli.length} attēli)</span>}
            </div>
            <FormatetsRezultats teksts={rezultats} />
            <div style={{ marginTop: 16, paddingTop: 12, borderTop: "1px solid #1e3a1e", display: "flex", gap: 10, flexWrap: "wrap" }}>
              <button style={s.btn} onClick={jauns}>📷 Jauns dzīvnieks</button>
            </div>
          </div>
        )}

        <div style={{ fontSize: 11, color: "#2d5a2d", textAlign: "center", marginTop: 8 }}>
          AI vērtējums ir palīglīdzeklis — galīgo lēmumu pieņem mednieks.
        </div>
      </div>

      {/* Slēptie file inputi */}
      <input ref={kameraRef} type="file" accept="image/*" capture="environment"
        style={{ display: "none" }} onChange={e => { pienemFailu(e.target.files[0]); e.target.value = "" }} />
      <input ref={galerijRef} type="file" accept="image/*"
        style={{ display: "none" }} onChange={e => { pienemFailu(e.target.files[0]); e.target.value = "" }} />
    </div>
  )
}
