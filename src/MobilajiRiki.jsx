export default function MobilajiRiki({ onBack, onNavigate }) {

  const riki = [
    {
      icon: "📐",
      title: "Kubikmetru kalkulators",
      desc: "Nogriežņu tievgalis + garums → m³, sortimenti, PDF izdruka",
      badge: "MOBILAIS",
      page: "kubi",
      color: "#4caf50"
    },
    {
      icon: "📏",
      title: "Caurmēra mērījumi",
      desc: "Ātra caurmēru ievade laukā, viens pirksts, tūlītējs rezultāts",
      badge: "MOBILAIS",
      page: "caurmers_mobile",
      color: "#4caf50"
    },
    {
      icon: "🌲",
      title: "Cirsmas vērtēšana",
      desc: "Laukā — G mērījumi, Bitterlich, sortimentu aprēķini reāllaikā",
      badge: "MOBILAIS",
      page: "cirsma_mobile",
      color: "#4caf50"
    },
    {
      icon: "📋",
      title: "Pavadzīmju reģistrs",
      desc: "Foto → OCR → automātiska reģistrācija",
      badge: null,
      page: "pavadzimes",
      color: "#4caf50"
    },
    {
      icon: "📄",
      title: "Dastojuma kalkulators",
      desc: "Mežvērtes PDF → sortimentu apjomi, krautuves vērtība, izdruka",
      badge: null,
      page: "dastojums_pdf",
      color: "#4caf50"
    },
    {
      icon: "📸",
      title: "Krautuves mērītājs",
      desc: "3 bildes + garums → AI aprēķina kubatūru. Strādā ar krautuvi un mašīnu.",
      badge: "AI",
      page: "krautuves_meritajs",
      color: "#4caf50"
    },
  ]

  return (
    <div style={{ minHeight: "100vh", background: "#080f08", color: "#e8f5e9", fontFamily: "Arial, sans-serif" }}>

      {/* HEADER */}
      <div style={{ background: "#1b3a1b", borderBottom: "2px solid #4caf50", padding: "12px 20px", display: "flex", alignItems: "center", gap: "12px" }}>
        <button onClick={onBack} style={{ background: "transparent", border: "none", color: "#4caf50", fontSize: "20px", cursor: "pointer" }}>←</button>
        <div>
          <h1 style={{ margin: 0, color: "#4caf50", fontSize: "18px", fontWeight: 700 }}>📱 Laukā & birojā</h1>
          <div style={{ color: "#81c784", fontSize: "11px", marginTop: "2px" }}>Mobilie rīki un aplikācijas</div>
        </div>
      </div>

      {/* RĪKI */}
      <div style={{ padding: "16px", maxWidth: "600px", margin: "0 auto" }}>
        <div style={{ marginBottom: "12px", fontSize: "12px", color: "#4a7a4a" }}>
          Visi rīki darbojas arī bez interneta — dati tiek saglabāti ierīcē automātiski.
        </div>

        {riki.map((r, i) => (
          <div key={i} onClick={() => onNavigate(r.page)}
            style={{ background: "#141f14", border: "1px solid #2d5a2d", borderRadius: "12px", padding: "16px", marginBottom: "10px", cursor: "pointer", display: "flex", alignItems: "center", gap: "14px" }}
            onMouseEnter={e => e.currentTarget.style.background = "#1a2e1a"}
            onMouseLeave={e => e.currentTarget.style.background = "#141f14"}
          >
            <div style={{ fontSize: "36px", minWidth: "44px", textAlign: "center" }}>{r.icon}</div>
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                <span style={{ color: "#ffffff", fontSize: "15px", fontWeight: 700 }}>{r.title}</span>
                {r.badge && (
                  <span style={{ background: "#2d4a2d", color: "#4caf50", fontSize: "9px", padding: "2px 6px", borderRadius: "4px", fontWeight: 700 }}>{r.badge}</span>
                )}
              </div>
              <div style={{ color: "#81c784", fontSize: "12px", lineHeight: 1.4 }}>{r.desc}</div>
            </div>
            <div style={{ color: "#4caf50", fontSize: "20px" }}>→</div>
          </div>
        ))}

        {/* DRĪZUMĀ */}
        <div style={{ marginTop: "20px", padding: "14px", background: "#0f1a0f", border: "1px dashed #2d4a2d", borderRadius: "12px" }}>
          <div style={{ color: "#4a7a4a", fontSize: "12px", fontWeight: 700, marginBottom: "10px" }}>🔧 Drīzumā</div>
          {[
            { icon: "🌲", title: "Dastošanas app", desc: "Dastojums → kubi → sortimenti" },
          ].map((r, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: "12px", padding: "10px 0", borderBottom: i === 0 ? "0.5px solid #1a3a1a" : "none", opacity: 0.5 }}>
              <div style={{ fontSize: "28px", minWidth: "36px", textAlign: "center" }}>{r.icon}</div>
              <div>
                <div style={{ color: "#888", fontSize: "13px", fontWeight: 700 }}>{r.title}</div>
                <div style={{ color: "#555", fontSize: "11px" }}>{r.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
