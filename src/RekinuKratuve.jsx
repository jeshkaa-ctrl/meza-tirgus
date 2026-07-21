// SQL — Supabase (izpildīt vienu reizi):
// create table rekini (
//   id uuid primary key default gen_random_uuid(),
//   user_id uuid references auth.users(id) not null,
//   nr integer not null,
//   gads integer not null,
//   datums text not null,
//   klients text,
//   summa numeric(10,2),
//   pvn_rezims text default 'bez',
//   sniedzejs jsonb,
//   sanemejs jsonb,
//   rindas jsonb,
//   periods text,
//   apmaksa_termins text,
//   izrakstija text,
//   izveidots timestamptz default now()
// );
// alter table rekini enable row level security;
// create policy "user_own" on rekini for all
//   using (auth.uid() = user_id) with check (auth.uid() = user_id);

import React, { useState, useEffect } from "react"
import RekinsPanel from "./RekinsPanel"
import { supabase } from "./supabaseClient"
import { parbauditVaiMaksaPdf } from './utils/pdfPaymentCheck'
import { PdfMaksasGate } from './components/PdfMaksasGate'

function RekinuKratuve({ onBack, user, onReg }) {
  const [rekini,          setRekini]          = useState([])
  const [lade,            setLade]            = useState(false)
  const [kluda,           setKluda]           = useState('')
  const [filtrGads,       setFiltrGads]       = useState("")
  const [pdfLadeId,       setPdfLadeId]       = useState(null)
  const [pdfMaksa,        setPdfMaksa]        = useState(null)
  const [filtrKlients,    setFiltrKlients]    = useState("")
  const [showJaunsRekins, setShowJaunsRekins] = useState(false)

  const ielādet = async () => {
    if (!user?.id) return
    setLade(true)
    setKluda('')
    const { data, error } = await supabase
      .from('rekini')
      .select('*')
      .eq('user_id', user.id)
      .order('izveidots', { ascending: false })
    if (error) setKluda(error.message)
    else setRekini(data || [])
    setLade(false)
  }

  useEffect(() => { ielādet() }, [user?.id])

  const dzest = async (id) => {
    if (!window.confirm("Dzēst šo rēķinu?")) return
    await supabase.from('rekini').delete().eq('id', id)
    setRekini(p => p.filter(r => r.id !== id))
  }

  const lejupieladetPdf = async (r) => {
    setPdfLadeId(r.id)
    const maksa = await parbauditVaiMaksaPdf(user, 'rekins')
    if (!maksa.allowed) { setPdfLadeId(null); setPdfMaksa(maksa); return }
    try {
      const skaitliVardos = (n) => {
        const v = Math.floor(n), c = Math.round((n - v) * 100)
        const vien = ["","viens","divi","trīs","četri","pieci","seši","septiņi","astoņi","deviņi","desmit","vienpadsmit","divpadsmit","trīspadsmit","četrpadsmit","piecpadsmit","sešpadsmit","septiņpadsmit","astoņpadsmit","deviņpadsmit"]
        const des  = ["","","divdesmit","trīsdesmit","četrdesmit","piecdesmit","sešdesmit","septiņdesmit","astoņdesmit","deviņdesmit"]
        const sim  = ["","simts","divi simti","trīs simti","četri simti","pieci simti","seši simti","septiņi simti","astoņi simti","deviņi simti"]
        let s = ""
        if (v >= 1000) s += (v >= 2000 ? vien[Math.floor(v / 1000)] + " " : "") + "tūkstoši "
        const h = Math.floor((v % 1000) / 100)
        if (h) s += sim[h] + " "
        if (v % 100 < 20) s += vien[v % 100] + " "
        else { const t = Math.floor((v % 100) / 10), o = v % 10; if (t) s += des[t] + " "; if (o) s += vien[o] + " " }
        return s.trim() + " euro " + (c > 0 ? `un ${c} centi` : "un 00 centi")
      }
      const kopaa        = (r.rindas || []).reduce((s, l) => s + (l.summa || 0), 0)
      const pvn          = r.pvn_rezims === "pvn21" ? kopaa * 0.21 : 0
      const kopaApmaksai = kopaa + pvn

      const bodyHTML = `
<p style="text-align:right;font-size:11px;margin:0 0 8px">${r.datums} &nbsp;&nbsp;&nbsp; <b>Rēķins Nr. ${r.nr} - ${r.gads}</b></p>
<table style="border-collapse:collapse;width:100%;margin-bottom:8px"><tbody><tr>
<td style="width:50%;vertical-align:top;border:none;padding:2px 4px;font-size:10px"><b>Pakalpojumu sniedzējs:</b><br/>${r.sniedzejs?.nosaukums||"—"}<br/>Reģ.Nr. ${r.sniedzejs?.regNr||"—"}<br/>${r.sniedzejs?.adrese||"—"}<br/>Banka: ${r.sniedzejs?.banka||"—"}<br/>Kods: ${r.sniedzejs?.kods||"—"}<br/>Konts: ${r.sniedzejs?.konts||"—"}</td>
<td style="vertical-align:top;border:none;padding:2px 4px;font-size:10px"><b>Pakalpojumu saņēmējs:</b><br/>${r.sanemejs?.nosaukums||"—"}<br/>Reģ.Nr. ${r.sanemejs?.regNr||"—"}<br/>${r.sanemejs?.adrese||"—"}<br/>Banka: ${r.sanemejs?.banka||"—"}<br/>Kods: ${r.sanemejs?.kods||"—"}<br/>Konts: ${r.sanemejs?.konts||"—"}</td>
</tr></tbody></table>
${r.periods ? `<p style="font-size:10px;margin:4px 0"><b>Pakalpojumu sniegšanas periods:</b> ${r.periods}</p>` : ""}
<p style="font-size:10px;margin:4px 0"><b>Apmaksāt:</b> Līdz ${r.apmaksa_termins}</p>
<table style="border-collapse:collapse;width:100%;margin:8px 0;font-size:10px"><thead><tr>
<th style="background:#225522;color:white;padding:4px 8px;text-align:left">Nr.</th>
<th style="background:#225522;color:white;padding:4px 8px;text-align:left">Pakalpojuma nosaukums</th>
<th style="background:#225522;color:white;padding:4px 8px;text-align:left">Mērv.</th>
<th style="background:#225522;color:white;padding:4px 8px;text-align:left">Daudzums</th>
<th style="background:#225522;color:white;padding:4px 8px;text-align:left">Cena</th>
<th style="background:#225522;color:white;padding:4px 8px;text-align:left">Summa, EUR</th>
</tr></thead>
<tbody>${(r.rindas||[]).map((l,i) => `<tr><td style="border:1px solid #ccc;padding:3px 8px">${i+1}</td><td style="border:1px solid #ccc;padding:3px 8px">${l.apraksts}</td><td style="border:1px solid #ccc;padding:3px 8px">${l.mervieniba}</td><td style="border:1px solid #ccc;padding:3px 8px">${l.daudzums}</td><td style="border:1px solid #ccc;padding:3px 8px">${parseFloat(l.cena||0).toFixed(2)}</td><td style="border:1px solid #ccc;padding:3px 8px">${(l.summa||0).toFixed(2)}</td></tr>`).join("")}</tbody>
<tfoot>
<tr style="font-weight:bold;background:#f0f8f0"><td colspan="5" style="border:1px solid #ccc;padding:3px 8px">Kopā</td><td style="border:1px solid #ccc;padding:3px 8px">${kopaa.toFixed(2)}</td></tr>
${r.pvn_rezims==="pvn21"?`<tr><td colspan="5" style="border:1px solid #ccc;padding:3px 8px">PVN 21%</td><td style="border:1px solid #ccc;padding:3px 8px">${pvn.toFixed(2)}</td></tr><tr style="font-weight:bold;background:#f0f8f0"><td colspan="5" style="border:1px solid #ccc;padding:3px 8px">Kopā apmaksai</td><td style="border:1px solid #ccc;padding:3px 8px">${kopaApmaksai.toFixed(2)}</td></tr>`:""}
${r.pvn_rezims==="reversais"?`<tr><td colspan="6" style="border:1px solid #ccc;padding:3px 8px;font-style:italic">Reversa PVN piemērošana saskaņā ar PVN likuma 142. pantu</td></tr>`:""}
</tfoot></table>
<p style="font-size:10px;margin:8px 0">Summa apmaksai vārdiem: <b>${skaitliVardos(kopaApmaksai)}</b></p>
<div style="display:flex;justify-content:space-between;margin-top:30px;font-size:11px">
  <div>Rēķinu izrakstīja: <b>${r.izrakstija||"—"}</b> ___________________________</div>
  <div>${r.datums}</div>
</div>
<p style="font-size:9px;color:#888;margin-top:16px">Dokuments sagatavots elektroniski un derīgs bez paraksta.</p>
<div style="margin-top:20px;padding-top:10px;border-top:1px solid #e0e0e0;display:flex;align-items:center;gap:8px">
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="20" height="20" style="flex-shrink:0"><rect width="32" height="32" rx="6" fill="#0f1a0f"/><polygon points="16,4 24,22 8,22" fill="#2e7d32"/><polygon points="16,2 26,21 6,21" fill="#1b5e20" opacity="0.5"/><rect x="14" y="22" width="4" height="6" rx="1" fill="#1b5e20"/><circle cx="26" cy="6" r="3" fill="#4caf50"/></svg>
  <span style="font-size:9px;color:#aaa">Rēķins sagatavots platformā <b style="color:#225522">Meža Tirgus</b> — <span style="color:#225522">meza-tirgus.lv</span></span>
</div>`

      const { jsPDF: JSPDF } = await import('jspdf')
      const { default: html2canvas } = await import('html2canvas')

      const wrapper = document.createElement('div')
      wrapper.style.cssText = 'position:fixed;left:-9999px;top:0;width:794px;background:#fff;padding:40px 48px;box-sizing:border-box;font-family:Arial,sans-serif'
      wrapper.innerHTML = bodyHTML
      document.body.appendChild(wrapper)

      const canvas = await html2canvas(wrapper, { scale: 2, useCORS: true, backgroundColor: '#ffffff', logging: false })
      document.body.removeChild(wrapper)

      const pdf   = new JSPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
      const pW    = pdf.internal.pageSize.getWidth()
      const pH    = pdf.internal.pageSize.getHeight()
      const imgH  = (canvas.height * pW) / canvas.width
      const imgData = canvas.toDataURL('image/jpeg', 0.95)

      pdf.addImage(imgData, 'JPEG', 0, 0, pW, imgH)
      let remaining = imgH - pH
      while (remaining > 0) {
        pdf.addPage()
        pdf.addImage(imgData, 'JPEG', 0, -(imgH - remaining), pW, imgH)
        remaining -= pH
      }

      pdf.save(`Rekins_Nr${r.nr}-${r.gads}.pdf`)
    } finally {
      setPdfLadeId(null)
    }
  }

  const gadi       = [...new Set(rekini.map(r => r.gads))].sort((a, b) => b - a)
  const filtreti   = rekini.filter(r =>
    (!filtrGads    || r.gads === Number(filtrGads)) &&
    (!filtrKlients || (r.klients || "").toLowerCase().includes(filtrKlients.toLowerCase()))
  )

  const tagad      = new Date()
  const šisMenesis = tagad.getMonth() + 1
  const šisGads    = tagad.getFullYear()

  const menesaRekini = rekini.filter(r => {
    const d = r.datums?.split(".")
    return d && Number(d[1]) === šisMenesis && Number(d[2]) === šisGads
  })
  const gadaRekini = rekini.filter(r => r.gads === šisGads)

  const aprekina = (saraksts) => {
    const kopa     = saraksts.reduce((s, r) => s + parseFloat(r.summa || 0), 0)
    const pvnSumma = saraksts.reduce((s, r) => {
      const summa = parseFloat(r.summa || 0)
      return s + (r.pvn_rezims === "pvn21" ? summa - summa / 1.21 : 0)
    }, 0)
    return { bezPvn: kopa - pvnSumma, pvnSumma, kopa }
  }

  const menesaStats   = aprekina(menesaRekini)
  const gadaStats     = aprekina(gadaRekini)
  const filtretoStats = aprekina(filtreti)

  const kartina = (virsraksts, stats, krasa) => (
    <div style={{ background: "white", border: `2px solid ${krasa}`, borderRadius: "8px", padding: "14px 18px", minWidth: "180px", flex: "1" }}>
      <div style={{ fontSize: "11px", color: "#888", marginBottom: "6px", fontWeight: "bold" }}>{virsraksts}</div>
      <div style={{ fontSize: "18px", fontWeight: "bold", color: krasa }}>{stats.kopa.toFixed(2)} €</div>
      <div style={{ fontSize: "10px", color: "#555", marginTop: "4px" }}>Bez PVN: {stats.bezPvn.toFixed(2)} €</div>
      <div style={{ fontSize: "10px", color: "#c62828" }}>PVN: {stats.pvnSumma.toFixed(2)} €</div>
    </div>
  )

  return (
    <div style={{ minHeight: "100vh", background: "#080f08", color: "#e8f5e9", fontFamily: "Arial", padding: "0" }}>
      <PdfMaksasGate info={pdfMaksa} onClose={() => setPdfMaksa(null)} />
      <div style={{ background: "#1b3a1b", borderBottom: "2px solid #4caf50", padding: "12px 20px", display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
        <button onClick={onBack} style={{ padding: "6px 14px", background: "transparent", border: "none", color: "#4caf50", fontSize: "16px", cursor: "pointer" }}>← Atpakaļ</button>
        <h2 style={{ margin: 0, color: "#4caf50" }}>🧾 Rēķinu krātuve</h2>
        {user && <span style={{ fontSize: "12px", color: "#81c784" }}>👤 {user.vards || user.email}</span>}
        {user
          ? <button onClick={() => setShowJaunsRekins(true)} style={{ padding: "8px 20px", background: "#225522", color: "white", border: "1px solid #4caf50", borderRadius: "6px", cursor: "pointer", fontWeight: "bold" }}>+ Izveidot rēķinu</button>
          : <button onClick={() => onReg?.()} style={{ padding: "8px 20px", background: "#555", color: "white", border: "none", borderRadius: "6px", cursor: "pointer" }}>🔒 Pierakstīties</button>
        }
      </div>

      <div style={{ padding: "24px", maxWidth: "1000px", margin: "0 auto" }}>

        {!user && (
          <div style={{ padding: "40px", textAlign: "center", color: "#81c784", border: "2px dashed #2d4a2d", borderRadius: "8px" }}>
            Pierakstieties lai apskatītu un veidotu rēķinus.
          </div>
        )}

        {user && kluda && (
          <div style={{ padding: "10px 14px", borderRadius: "8px", background: "#3a0a0a", border: "1px solid #c62828", color: "#ef9a9a", fontSize: "12px", marginBottom: "16px" }}>
            ⚠️ {kluda} — <button onClick={ielādet} style={{ background: "none", border: "none", color: "#ef9a9a", cursor: "pointer", textDecoration: "underline", fontSize: "12px" }}>mēģināt vēlreiz</button>
          </div>
        )}

        {user && lade && (
          <div style={{ padding: "40px", textAlign: "center", color: "#81c784" }}>⏳ Ielādē...</div>
        )}

        {user && !lade && (
          <>
            {showJaunsRekins && (
              <RekinsPanel
                kadastrs="" saimnieciba="" platiba={0}
                onClose={() => { setShowJaunsRekins(false); ielādet() }}
                user={user} onReg={onReg}
              />
            )}

            {/* KARTIŅAS */}
            <div style={{ display: "flex", gap: "12px", marginBottom: "20px", flexWrap: "wrap" }}>
              {kartina(`📅 ${šisMenesis}. mēnesis (${menesaRekini.length} rēķini)`, menesaStats, "#1565c0")}
              {kartina(`📆 ${šisGads}. gads (${gadaRekini.length} rēķini)`, gadaStats, "#225522")}
              {kartina(`🔍 Filtrēts (${filtreti.length} rēķini)`, filtretoStats, "#4caf50")}
            </div>

            {/* FILTRI */}
            <div style={{ display: "flex", gap: "8px", marginBottom: "16px", flexWrap: "wrap", alignItems: "center" }}>
              <select value={filtrGads} onChange={e => setFiltrGads(e.target.value)} style={{ padding: "4px 8px", border: "1px solid #ccc", borderRadius: "4px" }}>
                <option value="">Visi gadi</option>
                {gadi.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
              <input value={filtrKlients} onChange={e => setFiltrKlients(e.target.value)} placeholder="Meklēt pēc klienta..." style={{ padding: "4px 8px", border: "1px solid #ccc", borderRadius: "4px", width: "200px" }} />
              {filtrKlients && <button onClick={() => setFiltrKlients("")} style={{ padding: "4px 10px", background: "#888", color: "white", border: "none", borderRadius: "4px", cursor: "pointer", fontSize: "11px" }}>✕ Notīrīt</button>}
            </div>

            {filtreti.length === 0
              ? <div style={{ padding: "40px", textAlign: "center", color: "#888", border: "2px dashed #2d4a2d", borderRadius: "8px" }}>Nav saglabātu rēķinu</div>
              : <table border="1" cellPadding="6" style={{ fontSize: "12px", width: "100%", borderCollapse: "collapse" }}>
                <thead style={{ background: "#225522", color: "white" }}>
                  <tr><th>Nr.</th><th>Datums</th><th>Klients</th><th>Periods</th><th>Bez PVN €</th><th>PVN €</th><th>Kopā €</th><th>Darbības</th></tr>
                </thead>
                <tbody>
                  {filtreti.map((r, i) => {
                    const kopa  = parseFloat(r.summa || 0)
                    const pvn   = r.pvn_rezims === "pvn21" ? kopa - kopa / 1.21 : 0
                    const bezPvn = kopa - pvn
                    return (
                      <tr key={r.id} style={{ background: i % 2 === 0 ? "white" : "#f0f8f0", color: "#111" }}>
                        <td><b>{r.nr} - {r.gads}</b></td>
                        <td>{r.datums}</td>
                        <td>
                          <span onClick={() => setFiltrKlients(r.klients)} style={{ cursor: "pointer", color: "#1565c0", textDecoration: "underline" }} title="Filtrēt pēc šī klienta">
                            {r.klients}
                          </span>
                        </td>
                        <td>{r.periods || "—"}</td>
                        <td style={{ textAlign: "right" }}>{bezPvn.toFixed(2)}</td>
                        <td style={{ textAlign: "right", color: pvn > 0 ? "#c62828" : "#888" }}>{pvn.toFixed(2)}</td>
                        <td style={{ textAlign: "right", fontWeight: "bold" }}>{kopa.toFixed(2)}</td>
                        <td>
                          <button onClick={() => lejupieladetPdf(r)} disabled={pdfLadeId === r.id} style={{ padding: "3px 10px", background: pdfLadeId === r.id ? "#555" : "#225522", color: "white", border: "none", borderRadius: "3px", cursor: pdfLadeId === r.id ? "not-allowed" : "pointer", marginRight: "4px" }}>{pdfLadeId === r.id ? "⏳..." : "⬇️ PDF"}</button>
                          <button onClick={() => dzest(r.id)} style={{ padding: "3px 10px", background: "#c62828", color: "white", border: "none", borderRadius: "3px", cursor: "pointer" }}>✕</button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
                <tfoot>
                  <tr style={{ background: "#f5f5f5" }}>
                    <td colSpan="4" style={{ textAlign: "right", fontSize: "11px" }}>Kopā bez PVN:</td>
                    <td style={{ textAlign: "right", fontWeight: "bold" }}>{filtretoStats.bezPvn.toFixed(2)}</td>
                    <td colSpan="3" />
                  </tr>
                  <tr style={{ background: "#f5f5f5" }}>
                    <td colSpan="4" style={{ textAlign: "right", fontSize: "11px", color: "#c62828" }}>Kopā PVN:</td>
                    <td />
                    <td style={{ textAlign: "right", fontWeight: "bold", color: "#c62828" }}>{filtretoStats.pvnSumma.toFixed(2)}</td>
                    <td colSpan="2" />
                  </tr>
                  <tr style={{ background: "#e8f5e9" }}>
                    <td colSpan="4" style={{ textAlign: "right", fontWeight: "bold" }}>Kopā apmaksai:</td>
                    <td colSpan="2" />
                    <td style={{ textAlign: "right", fontWeight: "bold", color: "#225522", fontSize: "13px" }}>{filtretoStats.kopa.toFixed(2)} €</td>
                    <td />
                  </tr>
                </tfoot>
              </table>
            }
          </>
        )}
      </div>
    </div>
  )
}

export default RekinuKratuve
