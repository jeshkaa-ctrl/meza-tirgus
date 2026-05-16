export default function MainPage({ onNavigate, user, onReg, onIziet }) {

  const sadajas = [
    {
      title: "Cirsmu darbi",
      color: "#4caf50",
      riki: [
    { icon: "🗺", title: "Cirsmas skice", desc: "KML/SHP → skice ar koordinātām, PDF VMD iesniegumam. Iekļauj: 📏 Caurmēra mērījumi · 🌲 Dastojuma mērījumi · ⬇ SHP · 🧾 Rēķins", page: "skice" },
        { icon: "🌲", title: "Cirsmas novērtēšana", desc: "PDF no VMD → nogabalu analīze, cirsmas vērtība, ieteikumi", page: "cirsma" },
        { icon: "📊", title: "Dastojuma kalkulators", desc: "Mežvērtes PDF → sortimentu apjomi, krautuves vērtība", page: "dastojums_pdf" },
      ]
    },
    {
      title: "Mobilie rīki",
      color: "#42a5f5",
      riki: [
        { icon: "📐", title: "Kubikmetru kalkulators", desc: "Nogriežņu tievgalis + garums → m³, sortimenti, PDF", page: "kubi", badge: "MOBILAIS" },
        { icon: "📏", title: "Caurmēra mērījumi", desc: "Ātra caurmēru ievade laukā, tūlītējs rezultāts", page: "caurmers_mobile", badge: "MOBILAIS" },
        { icon: "🌲", title: "Cirsmas vērtēšana", desc: "G mērījumi, Bitterlich, sortimentu aprēķini reāllaikā", page: "cirsma_mobile", badge: "MOBILAIS" },
        { icon: "📋", title: "Pavadzīmju reģistrs", desc: "Foto → OCR → automātiska reģistrācija", page: "pavadzimes" },
      ]
    },
    {
      title: "Bizness",
      color: "#ffb74d",
      riki: [
        { icon: "🧾", title: "Rēķinu krātuve", desc: "Rēķinu izveide, drukāšana, mēneša un gada pārskats", page: "rekini" },
        { icon: "🌲", title: "RP Andras portāls", desc: "Vadības panelis — algas, rēķini, Excel", page: "rpandras" },
      ]
    },
    {
      title: "Sludinājumi & Izsoles",
      color: "#ce93d8",
      riki: [
        { icon: "📢", title: "Sludinājumi", desc: "Meža īpašumu un cirsmu sludinājumi", page: "sludinajumi" },
      ]
    },
    {
      title: "VMD & Analīze",
      color: "#4db6ac",
      riki: [
        { icon: "📄", title: "VMD PDF analīze", desc: "Meža inventarizācijas PDF → nogabalu analīze, vērtība", page: "vmd_pdf" },
        { icon: "✂️", title: "PDF šķirotājs", desc: "Sadala daudzīpašumu PDF pa kadastriem atsevišķos dokumentos", page: "pdfSkirotajs" },
      ]
    },
  ]

  return (
    <div style={{ minHeight: "100vh", background: "#080f08", color: "#e8f5e9", fontFamily: "Arial, sans-serif" }}>

      {/* HEADER */}
      <div style={{ background: "#1b3a1b", borderBottom: "2px solid #4caf50", padding: "10px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "8px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <span style={{ fontSize: "24px" }}>🌲</span>
          <span style={{ color: "#4caf50", fontSize: "18px", fontWeight: 800 }}>Meža tirgus</span>
        </div>
        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          <a href="https://www.lvmgeo.lv/kartes" target="_blank" rel="noreferrer" style={{ padding: "6px 12px", background: "#2e7d32", color: "white", borderRadius: "6px", textDecoration: "none", fontSize: "12px", fontWeight: "bold" }}>🗺 LVM GEO</a>
          <a href="https://www.vmd.gov.lv" target="_blank" rel="noreferrer" style={{ padding: "6px 12px", background: "#5d4037", color: "white", borderRadius: "6px", textDecoration: "none", fontSize: "12px", fontWeight: "bold" }}>🏛 VMD</a>
          {user
            ? <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                <span style={{ color: "#81c784", fontSize: "13px", padding: "6px 10px", background: "rgba(255,255,255,0.05)", borderRadius: "6px", border: "1px solid #2d5a2d" }}>👤 {user.vards}</span>
                <button onClick={onIziet} style={{ padding: "6px 12px", background: "transparent", color: "#81c784", border: "1px solid #2d5a2d", borderRadius: "6px", fontSize: "12px", cursor: "pointer" }}>Iziet</button>
              </div>
            : <button onClick={onReg} style={{ padding: "6px 14px", background: "#225522", color: "white", border: "1px solid #4caf50", borderRadius: "6px", fontSize: "12px", cursor: "pointer", fontWeight: "bold" }}>Reģistrēties</button>
          }
        </div>
      </div>

      {/* SADAĻAS */}
      <div style={{ padding: "16px 20px", maxWidth: "1100px", margin: "0 auto" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "16px" }}>
          {sadajas.map((s, si) => (
            <div key={si} style={{ background: "#111f11", border: `1px solid ${s.color}33`, borderRadius: "12px", padding: "14px", borderTop: `3px solid ${s.color}` }}>
              <div style={{ color: s.color, fontSize: "12px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "10px", paddingBottom: "6px", borderBottom: `1px solid ${s.color}22` }}>
                {s.title}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                {s.riki.map((r, ri) => (
                  <div key={ri} onClick={() => onNavigate(r.page)}
                    style={{ background: "#1a2e1a", border: "1px solid #2d4a2d", borderRadius: "8px", padding: "10px 12px", cursor: "pointer", display: "flex", alignItems: "center", gap: "10px" }}
                    onMouseEnter={e => e.currentTarget.style.background = "#22381a"}
                    onMouseLeave={e => e.currentTarget.style.background = "#1a2e1a"}
                  >
                    <span style={{ fontSize: "20px", minWidth: "26px", textAlign: "center" }}>{r.icon}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "2px" }}>
                        <span style={{ color: "#ffffff", fontSize: "13px", fontWeight: 700 }}>{r.title}</span>
                        {r.badge && <span style={{ background: "#2d4a2d", color: "#4caf50", fontSize: "9px", padding: "1px 5px", borderRadius: "3px", fontWeight: 700 }}>{r.badge}</span>}
                      </div>
                      <div style={{ color: "#7ab87a", fontSize: "11px", lineHeight: 1.3 }}>{r.desc}</div>
                    </div>
                    <span style={{ color: "#4a7a4a", fontSize: "14px" }}>→</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* APAKŠA — vieta reklāmām / padomiem */}
        <div style={{ marginTop: "24px", padding: "16px", background: "#0f1a0f", border: "1px dashed #2d4a2d", borderRadius: "12px", textAlign: "center" }}>
          <div style={{ color: "#4a7a4a", fontSize: "12px", marginBottom: "8px" }}>💡 Padomi & jaunumi</div>
          <div style={{ color: "#2d4a2d", fontSize: "11px" }}>Šeit parādīsies padomi, jaunumi un reklāmas</div>
        </div>
      </div>
    </div>
  )
}
