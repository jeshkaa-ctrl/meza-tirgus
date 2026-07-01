import React, { useState, useRef, useCallback } from "react"

const s = {
  app:    { minHeight: "100vh", background: "#050d05", color: "#e0ede0", fontFamily: "'Inter',sans-serif" },
  hdr:    { background: "rgba(10,25,10,0.95)", borderBottom: "1px solid #1e3a1e", backdropFilter: "blur(8px)", padding: "0 16px", height: 52, display: "flex", alignItems: "center", gap: 10, position: "sticky", top: 0, zIndex: 10 },
  back:   { background: "transparent", border: "none", color: "#4caf50", fontSize: 22, cursor: "pointer", padding: "0 4px", minWidth: 36, minHeight: 44 },
  title:  { margin: 0, color: "#4caf50", fontSize: 15, fontWeight: 700 },
  body:   { padding: "20px 16px", maxWidth: 720, margin: "0 auto" },
  card:   { background: "#0d1f0d", border: "1px solid #1e3a1e", borderRadius: 12, padding: 20, marginBottom: 16 },
  btn:    { background: "linear-gradient(135deg,#2e7d32,#1b5e20)", color: "white", border: "none", borderRadius: 8, padding: "12px 28px", fontSize: 14, fontWeight: 700, cursor: "pointer" },
  btnSm:  { background: "#1e3a1e", color: "#4caf50", border: "1px solid #2d5a2d", borderRadius: 6, padding: "8px 18px", fontSize: 13, cursor: "pointer" },
}

export default function SelekcijasKalkulators({ onBack }) {
  const [fails, setFails]         = useState(null)
  const [preview, setPreview]     = useState(null)
  const [lade, setLade]           = useState(false)
  const [rezultats, setRezultats] = useState("")
  const [kļūda, setKļūda]         = useState("")
  const [velk, setVelk]           = useState(false)
  const inputRef = useRef()

  const pienemFailu = useCallback((file) => {
    if (!file) return
    if (!file.type.startsWith("image/")) {
      setKļūda("Lūdzu augšupielādē attēlu (JPG, PNG, WEBP, HEIC).")
      return
    }
    setKļūda("")
    setRezultats("")
    setFails(file)
    const url = URL.createObjectURL(file)
    setPreview(url)
  }, [])

  const onDrop = useCallback((e) => {
    e.preventDefault()
    setVelk(false)
    pienemFailu(e.dataTransfer.files[0])
  }, [pienemFailu])

  const analizet = async () => {
    if (!fails) return
    setLade(true)
    setKļūda("")
    setRezultats("")
    try {
      const base64 = await new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve(reader.result.split(",")[1])
        reader.onerror = reject
        reader.readAsDataURL(fails)
      })
      const r = await fetch("/api/selektors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: base64, mimeType: fails.type }),
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
    setFails(null)
    setPreview(null)
    setRezultats("")
    setKļūda("")
    if (preview) URL.revokeObjectURL(preview)
  }

  const formatetTekstu = (txt) => {
    return txt.split("\n").map((rinda, i) => {
      const isEmpty = rinda.trim() === ""
      if (isEmpty) return <div key={i} style={{ height: 8 }} />
      const isBold = /^(🦌|📅|🏆|🎯|📝|🔭|⛔|✅|⚠️|•)/.test(rinda.trim())
      return (
        <div key={i} style={{
          marginBottom: 2,
          fontWeight: isBold ? 700 : 400,
          color: rinda.includes("⛔") ? "#ef5350"
            : rinda.includes("✅") || rinda.includes("🎯") ? "#4caf50"
            : rinda.includes("⚠️") ? "#ffb300"
            : "#e0ede0",
          fontSize: isBold ? 14 : 13,
          lineHeight: 1.6,
        }}>
          {rinda}
        </div>
      )
    })
  }

  return (
    <div style={s.app}>
      <div style={s.hdr}>
        <button style={s.back} onClick={onBack}>←</button>
        <h1 style={s.title}>🦌 Selektors</h1>
        <span style={{ fontSize: 11, color: "#558b2f", marginLeft: 4 }}>AI selekcijas palīgs</span>
      </div>

      <div style={s.body}>

        {/* Augšupielādes zona */}
        {!preview && (
          <div style={s.card}>
            <div style={{ fontSize: 13, color: "#81c784", marginBottom: 16 }}>
              Augšupielādē dzīvnieka foto — AI noteiks vecumu, dzimumu un sniegs selekcijas ieteikumu.
            </div>
            <div
              onDragOver={e => { e.preventDefault(); setVelk(true) }}
              onDragLeave={() => setVelk(false)}
              onDrop={onDrop}
              onClick={() => inputRef.current.click()}
              style={{
                border: `2px dashed ${velk ? "#4caf50" : "#2d5a2d"}`,
                borderRadius: 12,
                padding: "48px 24px",
                textAlign: "center",
                cursor: "pointer",
                background: velk ? "#0a1f0a" : "#070d07",
                transition: "all 0.2s",
              }}
            >
              <div style={{ fontSize: 48, marginBottom: 12 }}>📷</div>
              <div style={{ fontSize: 15, color: "#4caf50", fontWeight: 700, marginBottom: 6 }}>
                Velc attēlu šurp vai klikšķini
              </div>
              <div style={{ fontSize: 12, color: "#558b2f" }}>JPG · PNG · WEBP · HEIC</div>
            </div>
            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              style={{ display: "none" }}
              onChange={e => pienemFailu(e.target.files[0])}
            />
            {kļūda && <div style={{ marginTop: 12, color: "#ef5350", fontSize: 13 }}>{kļūda}</div>}
          </div>
        )}

        {/* Priekšskatījums + analīze */}
        {preview && (
          <>
            <div style={s.card}>
              <img
                src={preview}
                alt="Augšupielādētais attēls"
                style={{ width: "100%", maxHeight: 420, objectFit: "contain", borderRadius: 8, background: "#050d05" }}
              />
              <div style={{ display: "flex", gap: 10, marginTop: 14, flexWrap: "wrap" }}>
                {!rezultats && !lade && (
                  <button style={s.btn} onClick={analizet}>
                    🔍 Analizēt
                  </button>
                )}
                {lade && (
                  <button style={{ ...s.btn, opacity: 0.7, cursor: "not-allowed" }} disabled>
                    ⏳ Analizē...
                  </button>
                )}
                <button style={s.btnSm} onClick={jauns}>
                  ↩ Jauns attēls
                </button>
              </div>
              {kļūda && <div style={{ marginTop: 10, color: "#ef5350", fontSize: 13 }}>{kļūda}</div>}
            </div>

            {/* AI atbilde */}
            {rezultats && (
              <div style={{ ...s.card, borderColor: "#2e7d32" }}>
                <div style={{ fontSize: 13, color: "#4caf50", fontWeight: 700, marginBottom: 14, borderBottom: "1px solid #1e3a1e", paddingBottom: 10 }}>
                  🤖 AI Selekcijas vērtējums
                </div>
                <div style={{ lineHeight: 1.7 }}>
                  {formatetTekstu(rezultats)}
                </div>
                <div style={{ marginTop: 20, paddingTop: 14, borderTop: "1px solid #1e3a1e" }}>
                  <button style={s.btn} onClick={jauns}>
                    📷 Augšupielādēt jaunu attēlu
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        <div style={{ fontSize: 11, color: "#2d5a2d", textAlign: "center", marginTop: 8 }}>
          AI vērtējums ir palīglīdzeklis — galīgo lēmumu pieņem mednieks.
        </div>
      </div>
    </div>
  )
}
