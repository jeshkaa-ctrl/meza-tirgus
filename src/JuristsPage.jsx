import React, { useState, useRef } from "react"
import { acmHeaders } from "./utils/acm"
import EtikasTeksts from "./EtikasTeksts"
import { ETIKAS_TEKSTI } from "./data/etika"

function juristsEtika(jautajums) {
  const q = (jautajums || "").toLowerCase()
  if (/nelikumīg|sods|bargs|noziegum|pārkāp/.test(q)) return ETIKAS_TEKSTI.jurists.nelikumigi
  if (/aizliegt|drīkst|drīkstē/.test(q))               return ETIKAS_TEKSTI.jurists.aizliegumi
  if (/droš|ieroc|glabā|šauj/.test(q))                  return ETIKAS_TEKSTI.jurists.drosiba
  if (/sezon|termiņ|datums|kad |līdz|no /.test(q))      return ETIKAS_TEKSTI.jurists.termini
  return ETIKAS_TEKSTI.jurists.vispareji
}

const s = {
  app:    { minHeight: "100vh", background: "#050a14", color: "#e0e8f0", fontFamily: "'Inter',sans-serif" },
  hdr:    { background: "rgba(5,15,30,0.97)", borderBottom: "1px solid #1a2d4a", backdropFilter: "blur(8px)", padding: "0 16px", height: 52, display: "flex", alignItems: "center", gap: 10, position: "sticky", top: 0, zIndex: 10 },
  back:   { background: "transparent", border: "none", color: "#42a5f5", fontSize: 22, cursor: "pointer", padding: "0 4px", minWidth: 36, minHeight: 44 },
  title:  { margin: 0, color: "#42a5f5", fontSize: 15, fontWeight: 700 },
  body:   { padding: "16px", maxWidth: 720, margin: "0 auto" },
  card:   { background: "#070f1a", border: "1px solid #1a2d4a", borderRadius: 12, padding: 16, marginBottom: 14 },
  btn:    { background: "linear-gradient(135deg,#1565c0,#0d47a1)", color: "white", border: "none", borderRadius: 8, padding: "13px 24px", fontSize: 14, fontWeight: 700, cursor: "pointer", minHeight: 48 },
  btnSm:  { background: "#0d1f33", color: "#42a5f5", border: "1px solid #1a3a5c", borderRadius: 6, padding: "7px 14px", fontSize: 12, cursor: "pointer", minHeight: 36 },
  chip:   { background: "#0a1a2e", border: "1px solid #1a3a5c", borderRadius: 20, padding: "6px 14px", fontSize: 12, color: "#90caf9", cursor: "pointer", whiteSpace: "nowrap" },
}

const PIEMERI = [
  "Vai drīkstu medīt naktī?",
  "Kas ir nelikumīgas medības?",
  "Kādi dokumenti vajadzīgi medībām?",
  "Kad beidzas aļņu sezona?",
  "Vai drīkstu medīt svētdienā?",
  "Kāda ir minimālā medību iecirkņa platība?",
  "Ko darīt ja nomedīta mežacūka?",
  "Vai ārzemnieks drīkst medīt Latvijā?",
]

function FormatetsRezultats({ teksts }) {
  const rindas = teksts.split("\n")
  const elementi = []

  rindas.forEach((r, i) => {
    const t = r.trim()
    if (t === "") { elementi.push(<div key={i} style={{ height: 6 }} />); return }

    if (t.startsWith("📋") || t.startsWith("⚖️") || t.startsWith("📌") || t.startsWith("💡") || t.startsWith("⚠️")) {
      elementi.push(
        <div key={i} style={{ fontSize: 13, fontWeight: 700, color: "#42a5f5", marginTop: 12, marginBottom: 4, borderBottom: "1px solid #1a2d4a", paddingBottom: 4 }}>
          {t}
        </div>
      )
      return
    }

    if (t.startsWith("═")) { elementi.push(<div key={i} style={{ borderTop: "1px solid #1a2d4a", margin: "8px 0" }} />); return }

    elementi.push(
      <div key={i} style={{ fontSize: 13, lineHeight: 1.7, color: "#b3d4f5", marginBottom: 2, paddingLeft: t.startsWith("-") || t.startsWith("✦") || t.startsWith("•") ? 10 : 0 }}>
        {t}
      </div>
    )
  })

  return <div>{elementi}</div>
}

export default function JuristsPage({ onBack }) {
  const [jautajums, setJautajums] = useState("")
  const [atbilde, setAtbilde]     = useState("")
  const [lade, setLade]           = useState(false)
  const [kļūda, setKļūda]         = useState("")
  const inputRef = useRef()

  const jautat = async (teksts) => {
    const q = (teksts || jautajums).trim()
    if (!q) return
    setLade(true); setKļūda(""); setAtbilde("")
    try {
      const r = await fetch("/api/ai?action=jurists", {
        method: "POST",
        headers: acmHeaders(),
        body: JSON.stringify({ jautajums: q }),
      })
      const d = await r.json()
      if (!r.ok) throw new Error(d.error || "Servera kļūda")
      setAtbilde(d.atbilde)
    } catch (e) { setKļūda("Kļūda: " + e.message) }
    finally { setLade(false) }
  }

  const piemerJautajums = (t) => { setJautajums(t); setAtbilde(""); jautat(t) }
  const jauns = () => { setJautajums(""); setAtbilde(""); setKļūda(""); inputRef.current?.focus() }

  return (
    <div style={s.app}>
      <div style={s.hdr}>
        <button style={s.back} onClick={onBack}>←</button>
        <h1 style={s.title}>⚖️ Mednieka Jurists</h1>
        <span style={{ fontSize: 11, color: "#1565c0", marginLeft: 4 }}>Medību likumdošana</span>
      </div>

      <div style={s.body}>

        {/* Ievade */}
        <div style={s.card}>
          <div style={{ fontSize: 13, color: "#90caf9", marginBottom: 12 }}>
            Jautā par medību likumiem, sezonām, dokumentiem vai jebko citu saistītu ar medību tiesībām Latvijā.
          </div>

          <textarea
            ref={inputRef}
            value={jautajums}
            onChange={e => setJautajums(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); jautat() } }}
            placeholder="Piemēram: Vai drīkstu medīt naktī ar nakts redzamības tēmēkli?"
            style={{ width: "100%", minHeight: 72, background: "#040c18", border: "1px solid #1a3a5c",
              borderRadius: 8, color: "#e0e8f0", fontSize: 14, padding: "10px 12px",
              resize: "vertical", outline: "none", fontFamily: "'Inter',sans-serif", boxSizing: "border-box" }}
          />

          <div style={{ display: "flex", gap: 10, marginTop: 10, flexWrap: "wrap" }}>
            {!lade && (
              <button style={s.btn} onClick={() => jautat()} disabled={!jautajums.trim()}>
                ⚖️ Jautāt
              </button>
            )}
            {lade && (
              <button style={{ ...s.btn, opacity: 0.6, cursor: "not-allowed" }} disabled>
                ⏳ Meklē likumus...
              </button>
            )}
            {atbilde && <button style={s.btnSm} onClick={jauns}>↩ Jauns jautājums</button>}
          </div>
          {kļūda && <div style={{ marginTop: 10, color: "#ef5350", fontSize: 13 }}>{kļūda}</div>}
        </div>

        {/* Piemēru jautājumi */}
        {!atbilde && !lade && (
          <div style={s.card}>
            <div style={{ fontSize: 12, color: "#42a5f5", fontWeight: 700, marginBottom: 10 }}>
              💡 Biežāk uzdotie jautājumi
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {PIEMERI.map((p, i) => (
                <button key={i} style={s.chip} onClick={() => piemerJautajums(p)}>{p}</button>
              ))}
            </div>
          </div>
        )}

        {/* Atbilde */}
        {atbilde && (
          <div style={{ ...s.card, borderColor: "#1565c0" }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#42a5f5", marginBottom: 12, borderBottom: "1px solid #1a2d4a", paddingBottom: 8 }}>
              ⚖️ Juridiskā atbilde
            </div>
            <FormatetsRezultats teksts={atbilde} />
            <div style={{ marginTop: 16, paddingTop: 12, borderTop: "1px solid #1a2d4a", fontSize: 11, color: "#3a5a7a" }}>
              ⚠️ Vienmēr pārbaudi aktuālos likumus: likumi.lv → "Medību likums" vai "Medību noteikumi"
            </div>
            <EtikasTeksts teksts={juristsEtika(jautajums)} style={{ borderTopColor: "#1a2d4a" }} />
          </div>
        )}

      </div>
    </div>
  )
}
