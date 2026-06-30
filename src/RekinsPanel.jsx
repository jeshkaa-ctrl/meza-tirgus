import React, { useState, useEffect } from "react"
import { getKlienti, saveKlients } from "./CaurmeraPanel"
import { supabase } from "./supabaseClient"

function RekinsPanel({ kadastrs, saimnieciba, platiba, onClose, user, onReg }) {

  // ── Sniedzējs ─────────────────────────────────────────────────────────────
  const [sniedzejs,        setSniedzejs]        = useState(() => JSON.parse(localStorage.getItem("rekins_sniedzejs") || "{}"))
  const [aktivaisProfilsId,setAktivaisProfilsId] = useState(null)
  const [profili,          setProfili]          = useState([])
  const [profilPiedav,     setProfilPiedav]     = useState([])
  const [showProfilPiedav, setShowProfilPiedav] = useState(false)
  const [saglLade,         setSaglLade]         = useState(false)
  const [isPro,            setIsPro]            = useState(false)
  const [maniKlienti,      setManiKlienti]      = useState([])

  // ── Saņēmējs ──────────────────────────────────────────────────────────────
  const [sanemejs,      setSanemejs]      = useState(() => {
    const p = JSON.parse(localStorage.getItem("rekins_sanemejs_pedejais") || "{}")
    return { nosaukums: saimnieciba || p.nosaukums || "", regNr: p.regNr || "", adrese: p.adrese || "", banka: p.banka || "", kods: p.kods || "", konts: p.konts || "" }
  })
  const [klientuPiedav, setKlientuPiedav] = useState([])
  const [showPiedav,    setShowPiedav]    = useState(false)

  // ── E-pasts ───────────────────────────────────────────────────────────────
  const [emailModal,      setEmailModal]      = useState(false)
  const [epastsVal,       setEpastsVal]       = useState('')
  const [saglabatEpastu,  setSaglabatEpastu]  = useState(true)
  const [papildusTeksts,  setPapildusTeksts]  = useState('')
  const [emailLade,       setEmailLade]       = useState(false)
  const [emailOk,         setEmailOk]         = useState(false)

  // ── Rēķins ────────────────────────────────────────────────────────────────
  const [rekinsNr,       setRekinsNr]       = useState(() => Number(localStorage.getItem("rekins_nr") || 0) + 1)
  const [datums,         setDatums]         = useState(new Date().toLocaleDateString("lv-LV"))
  const [apmaksaTermins, setApmaksaTermins] = useState(() => { const d = new Date(); d.setDate(d.getDate() + 10); return d.toLocaleDateString("lv-LV") })
  const [periods,        setPeriods]        = useState("")
  const [pvnRezims,      setPvnRezims]      = useState("bez")
  const [izrakstija,     setIzrakstija]     = useState(JSON.parse(localStorage.getItem("rekins_sniedzejs") || "{}").izrakstija || "")
  const [rindas,         setRindas]         = useState([
    { apraksts: kadastrs ? `Meža inventarizācija, kad.Nr. ${kadastrs}` : "", mervieniba: "ha", daudzums: platiba > 0 ? platiba.toFixed(2) : "", cena: "", summa: 0 }
  ])

  // ── Ielādēt klientus (visi lietotāji) ────────────────────────────────────
  useEffect(() => {
    if (!user?.id) return
    supabase.from('mani_klienti').select('*').eq('user_id', user.id).order('nosaukums')
      .then(({ data }) => setManiKlienti(data || []))
  }, [user?.id])

  // ── Ielādēt Pro statusu + sniedzēja profilus ──────────────────────────────
  useEffect(() => {
    if (!user?.id) return
    const adminOk = localStorage.getItem('mt_admin_ok') === '1'
    if (adminOk) { setIsPro(true); ielādetProfilus(); return }
    supabase.from('profiles').select('pro_lidmenis').eq('id', user.id).single()
      .then(({ data }) => {
        if (data?.pro_lidmenis) { setIsPro(true); ielādetProfilus() }
      })
  }, [user?.id])

  const ielādetProfilus = async () => {
    if (!user?.id) return
    const { data } = await supabase.from('sniedzeja_profili').select('*').eq('user_id', user.id).order('nosaukums')
    setProfili(data || [])
  }

  // ── Sniedzējs helpers ─────────────────────────────────────────────────────
  const saveSniedzejs = (jauns) => {
    const j = { ...sniedzejs, ...jauns }
    setSniedzejs(j)
    localStorage.setItem("rekins_sniedzejs", JSON.stringify(j))
  }

  const handleSniedzejsSearch = (val) => {
    if (!isPro || val.length < 1) { setProfilPiedav([]); setShowProfilPiedav(false); return }
    const atb = profili.filter(p => p.nosaukums.toLowerCase().includes(val.toLowerCase())).slice(0, 6)
    setProfilPiedav(atb)
    setShowProfilPiedav(atb.length > 0)
  }

  const izveletisProfils = (p) => {
    saveSniedzejs({ nosaukums: p.nosaukums || '', regNr: p.reg_nr || '', adrese: p.adrese || '', banka: p.banka || '', kods: p.kods || '', konts: p.konts || '' })
    setAktivaisProfilsId(p.id)
    setShowProfilPiedav(false)
    setProfilPiedav([])
  }

  const saglabatProfilu = async () => {
    if (!sniedzejs.nosaukums?.trim() || !user?.id) return
    setSaglLade(true)
    const dati = {
      user_id:   user.id,
      nosaukums: sniedzejs.nosaukums.trim(),
      reg_nr:    sniedzejs.regNr   || null,
      adrese:    sniedzejs.adrese  || null,
      banka:     sniedzejs.banka   || null,
      kods:      sniedzejs.kods    || null,
      konts:     sniedzejs.konts   || null,
    }
    if (aktivaisProfilsId) {
      await supabase.from('sniedzeja_profili').update(dati).eq('id', aktivaisProfilsId)
    } else {
      const { data } = await supabase.from('sniedzeja_profili').insert(dati).select('id').single()
      if (data?.id) setAktivaisProfilsId(data.id)
    }
    await ielādetProfilus()
    setSaglLade(false)
  }

  // ── Saņēmējs helpers ──────────────────────────────────────────────────────
  const handleNosaukums = (val) => {
    setSanemejs({ ...sanemejs, nosaukums: val })
    if (val.length < 1) { setKlientuPiedav([]); setShowPiedav(false); return }
    const atb = getKlienti().filter(k => k.nosaukums.toLowerCase().includes(val.toLowerCase())).slice(0, 6)
    setKlientuPiedav(atb)
    setShowPiedav(atb.length > 0)
  }
  const izveleties = (k) => {
    setSanemejs({ nosaukums: k.nosaukums || "", regNr: k.regNr || "", adrese: k.adrese || "", banka: k.banka || "", kods: k.kods || "", konts: k.konts || "" })
    setShowPiedav(false)
    setKlientuPiedav([])
  }

  // ── Rindas ────────────────────────────────────────────────────────────────
  const updateRinda = (i, field, val) => {
    const n = [...rindas]
    n[i] = { ...n[i], [field]: val }
    if (field === "daudzums" || field === "cena") {
      n[i].summa = (parseFloat(n[i].daudzums) || 0) * (parseFloat(n[i].cena) || 0)
    }
    setRindas(n)
  }
  const pievienotRindu = () => setRindas([...rindas, { apraksts: "", mervieniba: "ha", daudzums: "", cena: "", summa: 0 }])
  const dzestRindu     = (i) => setRindas(rindas.filter((_, j) => j !== i))

  const kopaa         = rindas.reduce((s, r) => s + (r.summa || 0), 0)
  const pvn           = pvnRezims === "pvn21" ? kopaa * 0.21 : 0
  const kopa_apmaksai = kopaa + pvn

  // ── Skaitļi vārdos ────────────────────────────────────────────────────────
  const skaitliVardos = (n) => {
    const v = Math.floor(n), c = Math.round((n - v) * 100)
    const vien = ["","viens","divi","trīs","četri","pieci","seši","septiņi","astoņi","deviņi","desmit","vienpadsmit","divpadsmit","trīspadsmit","četrpadsmit","piecpadsmit","sešpadsmit","septiņpadsmit","astoņpadsmit","deviņpadsmit"]
    const des  = ["","","divdesmit","trīsdesmit","četrdesmit","piecdesmit","sešdesmit","septiņdesmit","astoņdesmit","deviņdesmit"]
    const sim  = ["","simts","divi simti","trīs simti","četri simti","pieci simti","seši simti","septiņi simti","astoņi simti","deviņi simti"]
    let s = ""
    if (v >= 1000) s += (v >= 2000 ? vien[Math.floor(v / 1000)] + " " : "") + "tūkstoši "
    const h = Math.floor((v % 1000) / 100); if (h) s += sim[h] + " "
    if (v % 100 < 20) s += vien[v % 100] + " "
    else { const t = Math.floor((v % 100) / 10), o = v % 10; if (t) s += des[t] + " "; if (o) s += vien[o] + " " }
    return s.trim() + " euro " + (c > 0 ? `un ${c} centi` : "un 00 centi")
  }

  // ── E-pasta sūtīšana ──────────────────────────────────────────────────────
  const atvertEmailModal = async () => {
    if (!user?.id) { onReg?.(); return }
    // Meklēt e-pastu mani_klienti tabulā pēc klienta nosaukuma
    if (sanemejs.nosaukums) {
      const { data } = await supabase
        .from('mani_klienti')
        .select('epasts')
        .eq('user_id', user.id)
        .ilike('nosaukums', sanemejs.nosaukums)
        .maybeSingle()
      if (data?.epasts) setEpastsVal(data.epasts)
    }
    setEmailOk(false)
    setEmailModal(true)
  }

  const sūtitEmail = async () => {
    if (!epastsVal.trim()) return
    setEmailLade(true)
    try {
      // Saglabāt e-pastu klientam ja atzīmēts
      if (saglabatEpastu && sanemejs.nosaukums && user?.id) {
        const { data: esošais } = await supabase
          .from('mani_klienti')
          .select('id')
          .eq('user_id', user.id)
          .ilike('nosaukums', sanemejs.nosaukums)
          .maybeSingle()
        if (esošais?.id) {
          await supabase.from('mani_klienti').update({ epasts: epastsVal.trim() }).eq('id', esošais.id)
        } else {
          await supabase.from('mani_klienti').insert({
            user_id:   user.id,
            nosaukums: sanemejs.nosaukums,
            reg_nr:    sanemejs.regNr || null,
            adrese:    sanemejs.adrese || null,
            banka:     sanemejs.banka || null,
            kods:      sanemejs.kods || null,
            konts:     sanemejs.konts || null,
            epasts:    epastsVal.trim(),
          })
        }
      }

      const resp = await fetch('/api/rekins-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: epastsVal.trim(),
          rekins: {
            nr:             rekinsNr,
            gads:           new Date().getFullYear(),
            datums,
            periods,
            apmaksa_termins: apmaksaTermins,
            pvn_rezims:     pvnRezims,
            sniedzejs:      { ...sniedzejs },
            sanemejs:       { ...sanemejs },
            rindas:         [...rindas],
          },
          papildus_teksts: papildusTeksts || null,
        }),
      })
      const data = await resp.json()
      if (!resp.ok) throw new Error(data.error || 'Kļūda')
      setEmailOk(true)
      setTimeout(() => setEmailModal(false), 2000)
    } catch (e) {
      alert('Kļūda sūtot e-pastu: ' + e.message)
    } finally {
      setEmailLade(false)
    }
  }

  // ── Saglabāt & drukāt ─────────────────────────────────────────────────────
  const exportRekins = async () => {
    if (!user?.id) { onReg?.(); return }
    localStorage.setItem("rekins_nr", rekinsNr)
    saveKlients({ ...sanemejs })
    localStorage.setItem("rekins_sanemejs_pedejais", JSON.stringify(sanemejs))

    const { error } = await supabase.from('rekini').insert({
      user_id:         user.id,
      nr:              Number(rekinsNr),
      gads:            new Date().getFullYear(),
      datums,
      klients:         sanemejs.nosaukums || "—",
      summa:           parseFloat(kopa_apmaksai.toFixed(2)),
      pvn_rezims:      pvnRezims,
      sniedzejs:       { ...sniedzejs },
      sanemejs:        { ...sanemejs },
      rindas:          [...rindas],
      periods,
      apmaksa_termins: apmaksaTermins,
      izrakstija,
    })
    if (error) { alert('Kļūda saglabājot rēķinu: ' + error.message); return }

    // Admins — auto-ieraksts grāmatvedībā
    if (localStorage.getItem('mt_admin_ok') === '1' && kopa_apmaksai > 0) {
      const pvnSumma  = pvnRezims === 'pvn21' ? parseFloat(pvn.toFixed(2)) : 0
      const datumsISO = datums.split('.').reverse().join('-')
      supabase.from('gramatvedis_darijumi').insert({
        datums:        datumsISO,
        veids:         'ienemums',
        summa_eur:     parseFloat(kopa_apmaksai.toFixed(2)),
        pvn_eur:       pvnSumma,
        summa_bez_pvn: parseFloat(kopaa.toFixed(2)),
        kategorija:    'map_pakalpojums',
        apraksts:      `Rēķins Nr.${rekinsNr} — ${sanemejs.nosaukums || ''}`,
        avots:         'manuali',
        rekina_nr:     String(rekinsNr),
      }).then(() => {}).catch(() => {})
    }

    const gads = new Date().getFullYear()
    const html = `<html><head><meta charset="UTF-8">
<style>body{font-family:Arial;font-size:11px;padding:24px;max-width:850px;margin:0 auto}h2{text-align:center;font-size:13px;margin:4px 0}table{border-collapse:collapse;width:100%;margin:8px 0}th{background:#225522;color:white;padding:4px 8px;font-size:10px;text-align:left}td{border:1px solid #ccc;padding:3px 8px;font-size:10px}.info td{border:none;padding:2px 4px}.label{font-weight:bold}.total{font-weight:bold;background:#f0f8f0}</style>
</head><body>
<p style="text-align:right;font-size:11px">${datums} &nbsp;&nbsp;&nbsp; <b>Rēķins Nr. ${rekinsNr} - ${gads}</b></p>
<table class="info"><tbody><tr>
<td style="width:50%;vertical-align:top"><b>Pakalpojumu sniedzējs:</b><br/>${sniedzejs.nosaukums||"___________________"}<br/>Reģ.Nr. ${sniedzejs.regNr||"___________________"}<br/>${sniedzejs.adrese||"___________________"}<br/>Banka: ${sniedzejs.banka||"___________________"}<br/>Kods: ${sniedzejs.kods||"___________________"}<br/>Konts: ${sniedzejs.konts||"___________________"}</td>
<td style="vertical-align:top"><b>Pakalpojumu saņēmējs:</b><br/>${sanemejs.nosaukums||"___________________"}<br/>Reģ.Nr. ${sanemejs.regNr||"___________________"}<br/>${sanemejs.adrese||"___________________"}<br/>Banka: ${sanemejs.banka||"___________________"}<br/>Kods: ${sanemejs.kods||"___________________"}<br/>Konts: ${sanemejs.konts||"___________________"}</td>
</tr></tbody></table>
${periods ? `<p><b>Pakalpojumu sniegšanas periods:</b> ${periods}</p>` : ""}
<p><b>Apmaksāt:</b> Līdz ${apmaksaTermins}</p>
<table><thead><tr><th>Nr.</th><th>Pakalpojuma nosaukums</th><th>Mērv.</th><th>Daudzums</th><th>Cena</th><th>Summa, EUR</th></tr></thead>
<tbody>${rindas.map((r, i) => `<tr><td>${i+1}</td><td>${r.apraksts}</td><td>${r.mervieniba}</td><td>${r.daudzums}</td><td>${parseFloat(r.cena||0).toFixed(2)}</td><td>${(r.summa||0).toFixed(2)}</td></tr>`).join("")}</tbody>
<tfoot><tr class="total"><td colspan="5">Kopā</td><td>${kopaa.toFixed(2)}</td></tr>
${pvnRezims==="pvn21"?`<tr><td colspan="5">PVN 21%</td><td>${pvn.toFixed(2)}</td></tr><tr class="total"><td colspan="5">Kopā apmaksai</td><td>${kopa_apmaksai.toFixed(2)}</td></tr>`:""}
${pvnRezims==="reversais"?`<tr><td colspan="6" style="font-style:italic">Reversa PVN piemērošana saskaņā ar PVN likuma 142. pantu</td></tr>`:""}
</tfoot></table>
<p>Summa apmaksai vārdiem: <b>${skaitliVardos(kopa_apmaksai)}</b></p>
<div style="display:flex;justify-content:space-between;margin-top:30px;font-size:11px">
<div>Rēķinu izrakstīja: <b>${izrakstija||"___________________"}</b> ___________________________</div>
<div>${datums}</div></div>
<p style="font-size:9px;color:#888;margin-top:16px">Dokuments sagatavots elektroniski un derīgs bez paraksta.</p>
</body></html>`
    const win = window.open("", "_blank")
    win.document.write(html)
    win.document.close()
    win.print()
    alert("✅ Rēķins Nr. " + rekinsNr + " saglabāts!")
  }

  // ── Kopīgi stili ──────────────────────────────────────────────────────────
  const inp = { width: "100%", padding: "4px 6px", border: "1px solid #ccc", borderRadius: "3px", fontSize: "11px", color: "#111", background: "white", boxSizing: "border-box" }

  return (
    <div style={{ marginTop: "24px", padding: "20px", border: "2px solid #4caf50", borderRadius: "8px", background: "#f0f8f0" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
        <h2 style={{ color: "#225522", margin: 0 }}>🧾 Rēķina sagatave</h2>
        <button onClick={onClose} style={{ padding: "4px 12px", background: "#888", color: "white", border: "none", borderRadius: "4px", cursor: "pointer" }}>✕ Aizvērt</button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" }}>

        {/* ── SNIEDZĒJS ── */}
        <div style={{ padding: "12px", background: "#f0f8f0", borderRadius: "6px", border: "1px solid #225522" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "6px" }}>
            <b style={{ color: "#225522" }}>Pakalpojumu sniedzējs</b>
            {isPro && (
              <button
                onClick={saglabatProfilu}
                disabled={saglLade || !sniedzejs.nosaukums?.trim()}
                title={aktivaisProfilsId ? "Atjaunināt saglabāto profilu" : "Saglabāt kā jaunu profilu"}
                style={{ padding: "3px 8px", fontSize: "10px", background: aktivaisProfilsId ? "#1565c0" : "#225522", color: "white", border: "none", borderRadius: "3px", cursor: "pointer", opacity: !sniedzejs.nosaukums?.trim() ? 0.5 : 1 }}
              >
                {saglLade ? "⏳" : aktivaisProfilsId ? "💾 Atjaunināt" : "💾 Saglabāt profilu"}
              </button>
            )}
          </div>

          {/* Sniedzēja ātrās pogas */}
          {isPro && profili.length > 0 && (
            <div style={{ marginBottom: "8px", display: "flex", flexWrap: "wrap", gap: "4px" }}>
              {profili.map(p => (
                <button
                  key={p.id}
                  onClick={() => izveletisProfils(p)}
                  title={p.reg_nr || ''}
                  style={{
                    padding: "3px 8px", fontSize: "10px", borderRadius: "4px", cursor: "pointer",
                    background: aktivaisProfilsId === p.id ? "#14532d" : "#fff",
                    color:      aktivaisProfilsId === p.id ? "#fff"    : "#225522",
                    border:     "1px solid #225522", fontWeight: 600,
                    whiteSpace: "nowrap",
                  }}
                >
                  {p.nosaukums}
                </button>
              ))}
            </div>
          )}

          {/* Nosaukums ar autocomplete */}
          <div style={{ position: "relative", marginBottom: "6px" }}>
            <label style={{ fontSize: "10px", fontWeight: "bold" }}>Nosaukums:</label><br />
            <input
              value={sniedzejs.nosaukums || ""}
              onChange={e => { saveSniedzejs({ nosaukums: e.target.value }); setAktivaisProfilsId(null); handleSniedzejsSearch(e.target.value) }}
              onBlur={() => setTimeout(() => setShowProfilPiedav(false), 150)}
              onFocus={() => isPro && sniedzejs.nosaukums && handleSniedzejsSearch(sniedzejs.nosaukums)}
              placeholder="piem. SIA Meža Darbi"
              style={inp}
            />
            {isPro && showProfilPiedav && profilPiedav.length > 0 && (
              <div style={{ position: "absolute", top: "100%", left: 0, right: 0, background: "white", border: "1px solid #2e7d32", borderRadius: "4px", zIndex: 100, boxShadow: "0 4px 12px rgba(0,0,0,0.15)", maxHeight: "160px", overflowY: "auto" }}>
                {profilPiedav.map(p => (
                  <div key={p.id} onMouseDown={() => izveletisProfils(p)}
                    style={{ padding: "8px 10px", cursor: "pointer", borderBottom: "1px solid #f0f8f0", fontSize: "11px" }}
                    onMouseEnter={e => e.currentTarget.style.background = "#e8f5e9"}
                    onMouseLeave={e => e.currentTarget.style.background = "white"}
                  >
                    <div style={{ fontWeight: "bold", color: "#225522" }}>{p.nosaukums}</div>
                    {p.reg_nr && <div style={{ fontSize: "10px", color: "#888" }}>Reģ.Nr. {p.reg_nr}{p.adrese ? " · " + p.adrese : ""}</div>}
                  </div>
                ))}
              </div>
            )}
          </div>

          {[["regNr", "Reģ.Nr.", "piem. 40001234567"], ["adrese", "Adrese", "piem. Rīgas iela 1, Rīga"], ["banka", "Banka", "piem. Swedbank"], ["kods", "SWIFT kods", "piem. HABALV22"], ["konts", "Konts", "piem. LV12HABA1234567890"]].map(([k, l, ph]) => (
            <div key={k} style={{ marginTop: "6px" }}>
              <label style={{ fontSize: "10px", fontWeight: "bold" }}>{l}:</label><br />
              <input value={sniedzejs[k] || ""} onChange={e => saveSniedzejs({ [k]: e.target.value })} placeholder={ph} style={inp} />
            </div>
          ))}
          <div style={{ marginTop: "6px" }}>
            <label style={{ fontSize: "10px", fontWeight: "bold" }}>Rēķinu izrakstīja:</label><br />
            <input value={izrakstija} onChange={e => { setIzrakstija(e.target.value); saveSniedzejs({ izrakstija: e.target.value }) }} placeholder="piem. Jānis Bērziņš" style={inp} />
          </div>

          {isPro && aktivaisProfilsId && (
            <div style={{ marginTop: "8px", fontSize: "10px", color: "#2e7d32" }}>
              ✓ Profils ielādēts — izmaiņas saglabā ar "Atjaunināt"
            </div>
          )}
        </div>

        {/* ── SAŅĒMĒJS ── */}
        <div style={{ padding: "12px", background: "#e8f5e9", borderRadius: "6px", border: "1px solid #4caf50" }}>
          <b style={{ color: "#225522" }}>Pakalpojumu saņēmējs</b>

          {/* Klientu ātrās pogas */}
          {maniKlienti.length > 0 && (
            <div style={{ marginTop: "8px", display: "flex", flexWrap: "wrap", gap: "4px" }}>
              {maniKlienti.map(k => (
                <button
                  key={k.id}
                  onClick={() => setSanemejs({
                    nosaukums: k.nosaukums || '',
                    regNr:     k.reg_nr   || '',
                    adrese:    k.adrese   || '',
                    banka:     k.banka    || '',
                    kods:      k.kods     || '',
                    konts:     k.konts    || '',
                  })}
                  title={k.reg_nr || ''}
                  style={{
                    padding: "3px 8px", fontSize: "10px", borderRadius: "4px", cursor: "pointer",
                    background: sanemejs.nosaukums === k.nosaukums ? "#225522" : "#fff",
                    color:      sanemejs.nosaukums === k.nosaukums ? "#fff"    : "#225522",
                    border:     "1px solid #4caf50", fontWeight: 600,
                    whiteSpace: "nowrap",
                  }}
                >
                  {k.nosaukums}
                </button>
              ))}
            </div>
          )}

          <div style={{ marginTop: "6px", position: "relative" }}>
            <label style={{ fontSize: "10px", fontWeight: "bold" }}>Nosaukums:</label><br />
            <input
              value={sanemejs.nosaukums || ""}
              onChange={e => handleNosaukums(e.target.value)}
              onBlur={() => setTimeout(() => setShowPiedav(false), 150)}
              onFocus={() => sanemejs.nosaukums && handleNosaukums(sanemejs.nosaukums)}
              placeholder="Raksti klienta nosaukumu..."
              style={{ ...inp }}
            />
            {showPiedav && klientuPiedav.length > 0 && (
              <div style={{ position: "absolute", top: "100%", left: 0, right: 0, background: "white", border: "1px solid #f9a825", borderRadius: "4px", zIndex: 100, boxShadow: "0 4px 12px rgba(0,0,0,0.15)", maxHeight: "200px", overflowY: "auto" }}>
                {klientuPiedav.map((k, i) => (
                  <div key={i} onMouseDown={() => izveleties(k)}
                    style={{ padding: "8px 10px", cursor: "pointer", borderBottom: "1px solid #f5f5f5", fontSize: "11px" }}
                    onMouseEnter={e => e.currentTarget.style.background = "#fff8e1"}
                    onMouseLeave={e => e.currentTarget.style.background = "white"}
                  >
                    <div style={{ fontWeight: "bold", color: "#e65100" }}>{k.nosaukums}</div>
                    {k.regNr && <div style={{ fontSize: "10px", color: "#888" }}>Reģ.Nr. {k.regNr}{k.adrese ? " · " + k.adrese : ""}</div>}
                  </div>
                ))}
              </div>
            )}
          </div>
          {[["regNr", "Reģ.Nr.", "piem. 40009876543"], ["adrese", "Adrese", "piem. Meža iela 5, Jelgava"], ["banka", "Banka", "piem. SEB"], ["kods", "SWIFT kods", "piem. UNLALV2X"], ["konts", "Konts", "piem. LV34UNLA9876543210"]].map(([k, l, ph]) => (
            <div key={k} style={{ marginTop: "6px" }}>
              <label style={{ fontSize: "10px", fontWeight: "bold" }}>{l}:</label><br />
              <input value={sanemejs[k] || ""} onChange={e => setSanemejs({ ...sanemejs, [k]: e.target.value })} placeholder={ph} style={inp} />
            </div>
          ))}
        </div>
      </div>

      {/* ── METADATI ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "8px", marginBottom: "12px" }}>
        <div>
          <label style={{ fontSize: "10px", fontWeight: "bold" }}>Rēķina Nr.:</label><br />
          <input value={rekinsNr} onChange={e => setRekinsNr(e.target.value)} style={inp} />
        </div>
        <div>
          <label style={{ fontSize: "10px", fontWeight: "bold" }}>Datums:</label><br />
          <input value={datums} onChange={e => setDatums(e.target.value)} placeholder="dd.mm.yyyy" style={inp} />
        </div>
        <div>
          <label style={{ fontSize: "10px", fontWeight: "bold" }}>Apmaksas termiņš:</label><br />
          <input value={apmaksaTermins} onChange={e => setApmaksaTermins(e.target.value)} placeholder="dd.mm.yyyy" style={inp} />
        </div>
        <div>
          <label style={{ fontSize: "10px", fontWeight: "bold" }}>Periods:</label><br />
          <input value={periods} onChange={e => setPeriods(e.target.value)} placeholder="piem. 2026. gada jūnijs" style={inp} />
        </div>
      </div>

      {/* ── PVN ── */}
      <div style={{ marginBottom: "12px" }}>
        <label style={{ fontSize: "10px", fontWeight: "bold" }}>PVN režīms:</label><br />
        <select value={pvnRezims} onChange={e => setPvnRezims(e.target.value)} style={{ padding: "4px", border: "1px solid #ccc", borderRadius: "3px", fontSize: "11px" }}>
          <option value="bez">Bez PVN</option>
          <option value="pvn21">PVN 21%</option>
          <option value="reversais">Reversais PVN (142. pants)</option>
        </select>
      </div>

      {/* ── RINDAS ── */}
      <table border="1" cellPadding="4" style={{ fontSize: "11px", width: "100%", marginBottom: "8px" }}>
        <thead style={{ background: "#225522", color: "white" }}>
          <tr><th>Nr.</th><th>Pakalpojuma nosaukums</th><th>Mērv.</th><th>Daudzums</th><th>Cena €</th><th>Summa €</th><th></th></tr>
        </thead>
        <tbody>
          {rindas.map((r, i) => (
            <tr key={i}>
              <td>{i + 1}</td>
              <td><input value={r.apraksts} onChange={e => updateRinda(i, "apraksts", e.target.value)} placeholder="Pakalpojuma apraksts" style={{ width: "100%", border: "none", fontSize: "11px" }} /></td>
              <td><input value={r.mervieniba} onChange={e => updateRinda(i, "mervieniba", e.target.value)} style={{ width: "40px", border: "none", fontSize: "11px" }} /></td>
              <td><input type="number" value={r.daudzums} onChange={e => updateRinda(i, "daudzums", e.target.value)} placeholder="0" style={{ width: "60px", border: "none", fontSize: "11px" }} /></td>
              <td><input type="number" value={r.cena} onChange={e => updateRinda(i, "cena", e.target.value)} placeholder="0.00" style={{ width: "60px", border: "none", fontSize: "11px" }} /></td>
              <td style={{ textAlign: "right", background: "#1a3320", color: "#e8f5e9", fontWeight: "bold" }}>{(r.summa || 0).toFixed(2)}</td>
              <td><button onClick={() => dzestRindu(i)} style={{ background: "none", border: "none", color: "#c62828", cursor: "pointer" }}>✕</button></td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr style={{ background: "#1a3320", color: "#e8f5e9", fontWeight: "bold" }}>
            <td colSpan="5">Kopā</td><td style={{ textAlign: "right" }}>{kopaa.toFixed(2)}</td><td />
          </tr>
          {pvnRezims === "pvn21" && <>
            <tr style={{ background: "#112a11", color: "#c8e6c9" }}><td colSpan="5">PVN 21%</td><td style={{ textAlign: "right" }}>{pvn.toFixed(2)}</td><td /></tr>
            <tr style={{ background: "#225522", color: "#fff", fontWeight: "bold" }}><td colSpan="5">Kopā apmaksai</td><td style={{ textAlign: "right" }}>{kopa_apmaksai.toFixed(2)}</td><td /></tr>
          </>}
          {pvnRezims === "reversais" && <tr><td colSpan="7" style={{ fontStyle: "italic", fontSize: "10px" }}>Reversa PVN piemērošana saskaņā ar PVN likuma 142. pantu</td></tr>}
        </tfoot>
      </table>

      <button onClick={pievienotRindu} style={{ padding: "4px 12px", background: "#1565c0", color: "white", border: "none", borderRadius: "4px", cursor: "pointer", fontSize: "11px", marginBottom: "12px" }}>+ Pievienot rindu</button>

      <div style={{ padding: "8px", background: "#f0f8f0", borderRadius: "4px", marginBottom: "12px", fontSize: "11px" }}>
        <b>Summa vārdiem:</b> {skaitliVardos(kopa_apmaksai)}
      </div>

      <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "center" }}>
        {user
          ? <button onClick={exportRekins} style={{ padding: "8px 24px", background: "#225522", color: "white", border: "1px solid #4caf50", borderRadius: "6px", cursor: "pointer", fontSize: "13px", fontWeight: "bold" }}>🖨 Drukāt / Saglabāt PDF</button>
          : <button onClick={() => onReg?.()} style={{ padding: "8px 24px", background: "#888", color: "white", border: "none", borderRadius: "4px", cursor: "pointer", fontSize: "13px" }}>🔒 Reģistrējies lai drukātu PDF</button>
        }
        {user && (
          <button onClick={atvertEmailModal} style={{ padding: "8px 20px", background: "#1565c0", color: "white", border: "none", borderRadius: "6px", cursor: "pointer", fontSize: "13px", fontWeight: "bold" }}>
            📧 Sūtīt klientam
          </button>
        )}
      </div>

      {/* ── E-PASTA MODĀLS ── */}
      {emailModal && (
        <div style={{ position: "fixed", inset: 0, zIndex: 600, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}
          onClick={e => e.target === e.currentTarget && setEmailModal(false)}>
          <div style={{ background: "#fff", borderRadius: 12, padding: 28, width: "100%", maxWidth: 420, fontFamily: "Arial" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: "#111" }}>📧 Sūtīt rēķinu klientam</div>
              <button onClick={() => setEmailModal(false)} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "#888" }}>✕</button>
            </div>

            {emailOk ? (
              <div style={{ textAlign: "center", padding: "24px 0" }}>
                <div style={{ fontSize: 36, marginBottom: 10 }}>✅</div>
                <div style={{ color: "#225522", fontWeight: 700 }}>E-pasts veiksmīgi nosūtīts!</div>
              </div>
            ) : (
              <>
                <div style={{ marginBottom: 14 }}>
                  <label style={{ fontSize: 11, fontWeight: "bold", color: "#555", display: "block", marginBottom: 4 }}>KLIENTA E-PASTA ADRESE</label>
                  <input
                    type="email" autoFocus
                    value={epastsVal} onChange={e => setEpastsVal(e.target.value)}
                    placeholder="klients@uznemums.lv"
                    style={{ width: "100%", padding: "9px 12px", border: "1px solid #ccc", borderRadius: 7, fontSize: 14, boxSizing: "border-box" }}
                  />
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
                  <input type="checkbox" id="saglEp" checked={saglabatEpastu} onChange={e => setSaglabatEpastu(e.target.checked)} style={{ width: 16, height: 16, cursor: "pointer", accentColor: "#225522" }} />
                  <label htmlFor="saglEp" style={{ fontSize: 12, color: "#555", cursor: "pointer" }}>Saglabāt šo e-pastu klientam ({sanemejs.nosaukums || "—"})</label>
                </div>

                <div style={{ marginBottom: 18 }}>
                  <label style={{ fontSize: 11, fontWeight: "bold", color: "#555", display: "block", marginBottom: 4 }}>✏️ PAPILDUS TEKSTS (neobligāts)</label>
                  <textarea
                    value={papildusTeksts} onChange={e => setPapildusTeksts(e.target.value)}
                    rows={3} placeholder="Piem. informācija par darbu, termiņiem vai citiem nosacījumiem..."
                    style={{ width: "100%", padding: "8px 10px", border: "1px solid #ccc", borderRadius: 7, fontSize: 12, resize: "vertical", boxSizing: "border-box", fontFamily: "Arial" }}
                  />
                </div>

                <div style={{ background: "#f0f8f0", borderRadius: 8, padding: "10px 14px", marginBottom: 18, fontSize: 12, color: "#374151", lineHeight: 1.6 }}>
                  <b>Tēma:</b> Rēķins Nr. {rekinsNr} - {new Date().getFullYear()} — {sniedzejs.nosaukums || '—'}<br/>
                  <b>Saturs:</b> rēķina tabula, bankas rekvizīti, apmaksas termiņš{papildusTeksts ? ', papildus teksts' : ''}
                </div>

                <button
                  onClick={sūtitEmail}
                  disabled={emailLade || !epastsVal.trim()}
                  style={{ width: "100%", padding: "11px", borderRadius: 8, background: emailLade || !epastsVal.trim() ? "#ccc" : "#1565c0", color: "#fff", border: "none", fontSize: 14, fontWeight: 700, cursor: emailLade || !epastsVal.trim() ? "not-allowed" : "pointer" }}
                >
                  {emailLade ? "⏳ Sūta..." : "📧 Sūtīt e-pastu"}
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default RekinsPanel
