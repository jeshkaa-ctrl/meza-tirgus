import { useState, useRef, useEffect } from "react";

// ─── Atskaites veidi ar kļūdas novērtējumu ────────────────────────────────────
const ATSKAITES_VEIDI = [
  {
    id: "lata_cm",
    nosaukums: "Lata ar cm atzīmēm",
    apraksts: "Mēraukla, geodēziskā lata vai baļķis ar krāsu atzīmēm ik 50cm/1m",
    ikona: "📏",
    kluda: "2–5%",
    kludaSkaitlis: 3,
    krasa: "#4ade80",
    ieteicams: true,
    prompt: `ATSKAITES OBJEKTS: Bildē ir redzama LATA vai BAĻĶIS ar METRA UN PUSMETRA ATZĪMĒM (krāsotas līnijas ik 50cm vai 1m).
Nolasi atzīmes tieši — AI uzdevums ir precīzi nolasīt kurai atzīmei atbilst krautuves augšmala.
Piemēram: ja krautuves augšmala sakrīt ar 3.5m atzīmi, augstums ir 3.5m.
Šī metode ir precīzākā — izmanto atzīmes tieši, nevis proporcijas.`,
  },
  {
    id: "balkis_zināms",
    nosaukums: "Meža lineāls",
    apraksts: "Pats atzīmēts baļķis vai dēlis — krāsa ik 50cm vai 1m. Papīrmalka, lata, dēlis — jebkas ar zināmu garumu.",
    ikona: "🖌️",
    kluda: "3–8%",
    kludaSkaitlis: 5,
    krasa: "#fbbf24",
    ieteicams: false,
    prompt: `ATSKAITES OBJEKTS: Bildē ir redzams PAŠGATAVOTS MEŽA LINEĀLS — baļķis, papīrmalka vai dēlis ar krāsu atzīmēm (līnijas ik 50cm vai 1m), kopgarums: {garums} m.
Meklē krāsotās atzīmes uz objekta un izmanto tās kā mērauklu augstuma/platuma noteikšanai.
Ja atzīmes skaidri redzamas — nolasi tieši kurai atzīmei atbilst krautuves augšmala.
Ja atzīmes nav skaidri redzamas — aprēķini proporcijas pret zināmo garumu.`,
  },
  {
    id: "bez_atskaites",
    nosaukums: "Bez atskaites",
    apraksts: "AI mēģina noteikt izmērus pēc konteksta (koki, ēnas, citas norādes bildē)",
    ikona: "🎯",
    kluda: "15–30%",
    kludaSkaitlis: 22,
    krasa: "#f87171",
    ieteicams: false,
    prompt: `NAV ATSKAITES OBJEKTA — mēģini noteikt izmērus pēc konteksta (apkārtējo objektu lielums, perspektīva, ēnas).
Norādi zemāku ticamību un plašāku kļūdas amplitūdu.`,
  },
];

const FOTO_SOLI = [
  {
    id: "prieksa",
    nosaukums: "Priekšpuse",
    obligats: true,
    norādījums: "Noliec atskaites objektu vertikāli pie krautuves",
    shema: "front",
  },
  {
    id: "sans",
    nosaukums: "Sāns",
    obligats: false,
    norādījums: "No sāna — redzams krautuves dziļums",
    shema: "side",
  },
];

// ─── SVG shēmas ───────────────────────────────────────────────────────────────
function KrautuveShema({ tips, atskaitesId }) {
  const irAtzimes = atskaitesId === "lata_cm";
  if (tips === "front") return (
    <svg viewBox="0 0 190 95" width="190" height="95" style={{ display: "block", margin: "0 auto" }}>
      {/* Krautuve */}
      <rect x="40" y="10" width="130" height="70" rx="3" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="1.5" />
      {[0,1,2,3,4,5].map(i => (
        <ellipse key={i} cx={56 + i*20} cy={45} rx={8} ry={8} fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="1" />
      ))}
      {/* Atskaites objekts — kreisajā pusē */}
      <rect x="18" y="10" width="10" height="70" rx="2"
        fill={irAtzimes ? "rgba(74,222,128,0.2)" : "rgba(255,193,7,0.2)"}
        stroke={irAtzimes ? "#4ade80" : "#fbbf24"} strokeWidth="1.5" />
      {irAtzimes ? (
        // Atzīmes ik 1/3 (simulē 1m atzīmes)
        <>
          <line x1="14" y1="33" x2="28" y2="33" stroke="#4ade80" strokeWidth="1.5"/>
          <line x1="14" y1="57" x2="28" y2="57" stroke="#4ade80" strokeWidth="1.5"/>
          <line x1="16" y1="22" x2="26" y2="22" stroke="#4ade80" strokeWidth="0.8" strokeDasharray="1,1"/>
          <line x1="16" y1="45" x2="26" y2="45" stroke="#4ade80" strokeWidth="0.8" strokeDasharray="1,1"/>
          <line x1="16" y1="68" x2="26" y2="68" stroke="#4ade80" strokeWidth="0.8" strokeDasharray="1,1"/>
          <text x="10" y="13" fontSize="6" fill="#4ade80" textAnchor="middle">3m</text>
          <text x="10" y="36" fontSize="6" fill="#4ade80" textAnchor="middle">2m</text>
          <text x="10" y="60" fontSize="6" fill="#4ade80" textAnchor="middle">1m</text>
          <text x="10" y="84" fontSize="6" fill="#4ade80" textAnchor="middle">0</text>
        </>
      ) : (
        <text x="23" y="90" fontSize="7" fill="#fbbf24" textAnchor="middle">3m</text>
      )}
    </svg>
  );
  return (
    <svg viewBox="0 0 190 90" width="190" height="90" style={{ display: "block", margin: "0 auto" }}>
      <rect x="10" y="15" width="170" height="60" rx="3" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="1.5" />
      {[0,1,2,3,4,5,6,7].map(i => (
        <rect key={i} x={14 + i*21} y={22} width={15} height={36} rx={2} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
      ))}
      <line x1="185" y1="45" x2="180" y2="45" stroke="#4ade80" strokeWidth="2" />
      <polygon points="190,45 181,40 181,50" fill="#4ade80" />
      <text x="95" y="9" textAnchor="middle" fill="rgba(255,255,255,0.4)" fontSize="7">← garums →</text>
    </svg>
  );
}

// ─── Kļūdas indikators ────────────────────────────────────────────────────────
function KludaIndikators({ veids }) {
  const bars = [
    { id: "lata_cm",       fill: 1 },
    { id: "balkis_zināms", fill: 2 },
    { id: "bez_atskaites", fill: 3 },
  ];
  const aktBar = bars.findIndex(b => b.id === veids);
  return (
    <div style={{ display: "flex", gap: 3 }}>
      {bars.map((b, i) => (
        <div key={b.id} style={{
          flex: 1, height: 4, borderRadius: 2,
          background: i <= aktBar
            ? (aktBar === 0 ? "#4ade80" : aktBar === 1 ? "#fbbf24" : "#f87171")
            : "rgba(255,255,255,0.1)",
        }} />
      ))}
    </div>
  );
}

// ─── Validācijas badge ─────────────────────────────────────────────────────────
function ValidacijasBadge({ status, teksts }) {
  const cfg = {
    loading: { bg: "rgba(250,200,0,0.15)", border: "rgba(250,200,0,0.4)", color: "#fbbf24", icon: "⏳" },
    ok:      { bg: "rgba(74,222,128,0.15)", border: "rgba(74,222,128,0.4)", color: "#4ade80", icon: "✓" },
    retry:   { bg: "rgba(248,113,113,0.15)", border: "rgba(248,113,113,0.4)", color: "#f87171", icon: "↩" },
  };
  const c = cfg[status] || cfg.loading;
  return (
    <div style={{ background: c.bg, border: `1px solid ${c.border}`, borderRadius: 10, padding: "10px 14px", display: "flex", alignItems: "center", gap: 10, fontSize: 13, color: c.color }}>
      <span style={{ fontSize: 18 }}>{c.icon}</span><span>{teksts}</span>
    </div>
  );
}

// ─── Galvenā komponente ────────────────────────────────────────────────────────
export default function KrautuvesMeritajsPage({ onBack }) {
  const [faze,       setFaze]      = useState("ievads");
  const [rezims,     setRezims]    = useState("krautuve");
  const [garums,     setGarums]    = useState("");
  const [atskaite,   setAtskaite]  = useState("3");
  const [atskVeids,  setAtskVeids] = useState("lata_cm");
  const [arSanu,     setArSanu]    = useState(false);
  const [soliIndex,  setSoliIndex] = useState(0);
  const [bildes,     setBildes]    = useState({});
  const [validacija, setValidacija]= useState(null);
  const [rezultats,  setRezultats] = useState(null);
  const [kluda,      setKluda]     = useState("");

  const videoRef  = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  const garumsNum   = parseFloat(garums)  || 0;
  const atskaiteNum = parseFloat(atskaite) || 3;
  const atskVeidsObj = ATSKAITES_VEIDI.find(v => v.id === atskVeids) || ATSKAITES_VEIDI[0];

  const aktSoli  = FOTO_SOLI.filter(s => s.obligats || (s.id === "sans" && arSanu));
  const aktSolis = aktSoli[soliIndex];

  // ─── Kamera ─────────────────────────────────────────────────────────────────
  async function startCamera() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) { videoRef.current.srcObject = stream; await videoRef.current.play(); }
    } catch (e) { setKluda("Kamera nav pieejama: " + e.message); }
  }
  function stopCamera() { streamRef.current?.getTracks().forEach(t => t.stop()); streamRef.current = null; }

  useEffect(() => {
    if (faze === "kamera") startCamera();
    else stopCamera();
    return () => stopCamera();
  }, [faze]);

  // ─── Bilde ──────────────────────────────────────────────────────────────────
  async function uznemtBildi() {
    if (!videoRef.current || !canvasRef.current) return;
    const v = videoRef.current, c = canvasRef.current;
    c.width = v.videoWidth || 1280; c.height = v.videoHeight || 720;
    c.getContext("2d").drawImage(v, 0, 0);
    const url = c.toDataURL("image/jpeg", 0.85);
    const b64 = url.split(",")[1];
    const jauna = { url, b64, mediaType: "image/jpeg" };
    setBildes(prev => ({ ...prev, [aktSolis.id]: jauna }));
    setValidacija({ status: "loading", teksts: "Pārbauda bild..." });
    await validateBilde(jauna, aktSolis);
  }

  async function validateBilde(bilde, solis) {
    try {
      const atskPrompt = atskVeids === "lata_cm"
        ? `vai redzama lata/baļķis ar metra/pusmetra atzīmēm UN visa krautuves priekšpuse`
        : atskVeids === "balkis_zināms"
        ? `vai redzams atskaites baļķis pilnā garumā UN visa krautuves priekšpuse`
        : `vai redzama visa krautuves priekšpuse`;
      const resp = await fetch("/api/anthropic/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-6",
          max_tokens: 120,
          messages: [{ role: "user", content: [
            { type: "image", source: { type: "base64", media_type: bilde.mediaType, data: bilde.b64 } },
            { type: "text", text: `Pārbaudi vai bildē ${solis.id === "prieksa" ? atskPrompt : "redzams krautuves garums no sāna"}. Atbildi TIKAI JSON: {"ok":true/false,"iemesls":"max 8 vārdi latviski"}` },
          ]}],
        }),
      });
      const data = await resp.json();
      const raw = data.content?.map(b => b.text || "").join("").replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(raw);
      setValidacija(parsed.ok ? { status: "ok", teksts: parsed.iemesls || "Labi!" } : { status: "retry", teksts: parsed.iemesls || "Mēģini vēlreiz" });
    } catch { setValidacija({ status: "ok", teksts: "Bilde saglabāta" }); }
  }

  function nakamais() {
    if (soliIndex < aktSoli.length - 1) { setSoliIndex(i => i + 1); setValidacija(null); }
    else { setFaze("analize"); runAnalyze(); }
  }
  function atkartot() { setBildes(prev => { const n = { ...prev }; delete n[aktSolis.id]; return n; }); setValidacija(null); }

  // ─── AI analīze ─────────────────────────────────────────────────────────────
  async function runAnalyze() {
    setKluda("");
    try {
      const imageBlocks = aktSoli.filter(s => bildes[s.id]).map(s => ({
        type: "image", source: { type: "base64", media_type: bildes[s.id].mediaType, data: bildes[s.id].b64 },
      }));
      const skatuSaraksts = aktSoli.filter(s => bildes[s.id]).map((s, i) => `Bilde ${i+1}: ${s.nosaukums}`).join(", ");
      const atskPromptText = atskVeidsObj.prompt.replace("{garums}", atskaiteNum);

      const prompt = `Tu esi meža loģistikas eksperts. Analizē bildes (${skatuSaraksts}) no ${rezims === "masina" ? "kravas mašīnas ar koksni" : "koka krautuves"}.

${atskPromptText}

Sortimenta garums (manuāli ievadīts, precīzs): ${garumsNum} m

Noteic:
1. Krautuves AUGSTUMU metros
2. Krautuves PLATUMU metros
3. TUKŠUMU % (gaiss starp baļķiem — apaļiem: 35-45%, malkai: 45-60%, zariem/skaldiem: 55-65%)
4. Materiāla veids

Aprēķini:
- pilnTilpums = augstums × platums × ${garumsNum}
- neto_m3 = pilnTilpums × (1 − tukšums/100)

Atbildi TIKAI JSON:
{"augstums_m":number,"platums_m":number,"tuksumsProc":number,"pilnTilpums_m3":number,"neto_m3":number,"materialVeids":"string","ticamiba":"augsta|videja|zema","komentars":"string max 12 vārdi"}`;

      const resp = await fetch("/api/anthropic/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-6", max_tokens: 400,
          messages: [{ role: "user", content: [...imageBlocks, { type: "text", text: prompt }] }],
        }),
      });
      const data = await resp.json();
      const raw = data.content?.map(b => b.text || "").join("").replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(raw);
      setRezultats({ ...parsed, garums: garumsNum, atskaite: atskaiteNum, atskVeids, rezims });
      setFaze("rezultats");
    } catch (e) { setKluda("Aprēķins neizdevās: " + e.message); setFaze("kamera"); }
  }

  function reset() {
    setFaze("ievads"); setSoliIndex(0);
    setBildes({}); setValidacija(null); setRezultats(null); setKluda("");
  }

  const darkBg = { background: "#0a1a0a", minHeight: "100dvh", color: "#fff" };

  // ── IEVADS ──────────────────────────────────────────────────────────────────
  if (faze === "ievads") return (
    <div style={{ ...darkBg, display: "flex", flexDirection: "column", padding: "1.5rem 1.25rem", paddingBottom: "3rem" }}>
      {onBack && (
        <button onClick={onBack} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.5)", fontSize: 22, cursor: "pointer", padding: "0 0 12px", textAlign: "left" }}>←</button>
      )}
      <h2 style={{ fontSize: 20, fontWeight: 500, margin: "0 0 4px", color: "#fff" }}>📸 Kubatūras mērītājs</h2>
      <p style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", margin: "0 0 1.5rem" }}>AI fotografē un aprēķina kubatūru</p>

      {/* Režīms */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: "1.5rem" }}>
        {[{ id:"krautuve", label:"Krautuve", sub:"Stacionāra kaudze", ikona:"🪵" },
          { id:"masina",   label:"Mašīna",   sub:"Kravas platforma",  ikona:"🚛" }
        ].map(r => (
          <button key={r.id} onClick={() => setRezims(r.id)} style={{
            padding: "0.9rem", borderRadius: 12,
            border: rezims === r.id ? "2px solid #4ade80" : "1px solid rgba(255,255,255,0.1)",
            background: rezims === r.id ? "rgba(74,222,128,0.08)" : "rgba(255,255,255,0.03)",
            color: rezims === r.id ? "#4ade80" : "rgba(255,255,255,0.55)",
            cursor: "pointer", textAlign: "left",
          }}>
            <div style={{ fontSize: 24, marginBottom: 3 }}>{r.ikona}</div>
            <div style={{ fontSize: 13, fontWeight: 500 }}>{r.label}</div>
            <div style={{ fontSize: 11, opacity: 0.55, marginTop: 1 }}>{r.sub}</div>
          </button>
        ))}
      </div>

      {/* Atskaites veida izvēle */}
      <div style={{ marginBottom: "1.5rem" }}>
        <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", marginBottom: 8, fontWeight: 500 }}>Atskaites objekts:</div>
        {ATSKAITES_VEIDI.map(v => (
          <button key={v.id} onClick={() => setAtskVeids(v.id)} style={{
            width: "100%", padding: "12px 14px", borderRadius: 10, cursor: "pointer",
            border: atskVeids === v.id ? `2px solid ${v.krasa}` : "1px solid rgba(255,255,255,0.08)",
            background: atskVeids === v.id ? `${v.krasa}11` : "rgba(255,255,255,0.03)",
            marginBottom: 6, textAlign: "left", display: "flex", alignItems: "center", gap: 12,
          }}>
            <span style={{ fontSize: 22, flexShrink: 0 }}>{v.ikona}</span>
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
                <span style={{ fontSize: 13, fontWeight: 500, color: atskVeids === v.id ? v.krasa : "rgba(255,255,255,0.8)" }}>
                  {v.nosaukums}
                </span>
                {v.ieteicams && <span style={{ fontSize: 9, background: "rgba(74,222,128,0.2)", color: "#4ade80", padding: "1px 6px", borderRadius: 4, fontWeight: 700 }}>IETEICAMS</span>}
              </div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginBottom: 4 }}>{v.apraksts}</div>
              {/* Kļūdas josla */}
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <KludaIndikators veids={v.id} />
                <span style={{ fontSize: 11, color: v.krasa, whiteSpace: "nowrap", fontWeight: 600 }}>±{v.kluda}</span>
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Garums + atskaites garums (ja nav "bez_atskaites") */}
      <div style={{ display: "grid", gridTemplateColumns: atskVeids !== "bez_atskaites" ? "1fr 1fr" : "1fr", gap: 10, marginBottom: "1.5rem" }}>
        <div>
          <label style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", display: "block", marginBottom: 6 }}>Sortimenta garums (m)</label>
          <input type="number" inputMode="decimal" min="0.5" max="30" step="0.5"
            placeholder="piem. 4.0" value={garums} onChange={e => setGarums(e.target.value)}
            style={{ width: "100%", boxSizing: "border-box", background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 10, color: "#fff", fontSize: 20, fontWeight: 500, padding: "12px 14px", outline: "none" }} />
          <p style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", margin: "4px 0 0" }}>Baļķi: 3/4/5/6m · Malka: 1/2/4m</p>
        </div>
        {atskVeids !== "bez_atskaites" && (
          <div>
            <label style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", display: "block", marginBottom: 6 }}>
              {atskVeids === "lata_cm" ? "Latas/baļķa garums (m)" : "Atskaites baļķa garums (m)"}
            </label>
            <input type="number" inputMode="decimal" min="0.5" max="10" step="0.5"
              value={atskaite} onChange={e => setAtskaite(e.target.value)}
              style={{ width: "100%", boxSizing: "border-box", background: `${atskVeidsObj.krasa}11`, border: `1px solid ${atskVeidsObj.krasa}44`, borderRadius: 10, color: atskVeidsObj.krasa, fontSize: 20, fontWeight: 500, padding: "12px 14px", outline: "none" }} />
            <p style={{ fontSize: 10, color: `${atskVeidsObj.krasa}88`, margin: "4px 0 0" }}>
              {atskVeids === "lata_cm" ? "Atzīmētā baļķa vai latas garums" : "Noliec šo baļķi pie krautuves"}
            </p>
          </div>
        )}
      </div>

      {/* Instrukcija */}
      {atskVeids === "lata_cm" && (
        <div style={{ marginBottom: "1.5rem", padding: "14px 16px", background: "rgba(74,222,128,0.05)", border: "1px solid rgba(74,222,128,0.2)", borderRadius: 12 }}>
          <div style={{ fontSize: 12, color: "#4ade80", fontWeight: 600, marginBottom: 8 }}>💡 Ko izmantot:</div>
          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.65)", lineHeight: 1.6 }}>
            ✓ Geodēziskā mērlata ar cm atzīmēm — vislabākā precizitāte<br/>
            ✓ <b style={{ color: "#fff" }}>Pašgatavots "meža lineāls"</b> — skatīt zemāk
          </div>
        </div>
      )}
      {atskVeids === "balkis_zināms" && (
        <div style={{ marginBottom: "1.5rem", padding: "14px 16px", background: "rgba(255,193,7,0.05)", border: "1px solid rgba(255,193,7,0.2)", borderRadius: 12 }}>
          <div style={{ fontSize: 12, color: "#fbbf24", fontWeight: 600, marginBottom: 8 }}>🖌️ Kā uztaisīt "Meža lineālu":</div>
          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.65)", lineHeight: 1.7 }}>
            Paņem jebkuru taisnu baļķi, papīrmalku, dēli vai latu ar <b style={{ color: "#fff" }}>zināmu garumu</b> un ar aerosola krāsu uzzīmē atzīmes:<br/>
            <span style={{ color: "#fbbf24" }}>——</span> Biezas līnijas pie <b style={{ color: "#fff" }}>1m, 2m, 3m</b><br/>
            <span style={{ color: "#fbbf24" }}>—</span> Plānākas pie <b style={{ color: "#fff" }}>0.5m, 1.5m, 2.5m</b><br/><br/>
            Labākās krāsas: <b style={{ color: "#fff" }}>balta, dzeltena, oranža</b> uz tumša koka.<br/>
            Baļķis ir izturīgs laukā, vienmēr pa rokai — vienreiz uztaisīts kalpo gadiem.
          </div>
        </div>
      )}
      {atskVeids === "bez_atskaites" && (
        <div style={{ marginBottom: "1.5rem", padding: "12px 16px", background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.3)", borderRadius: 12 }}>
          <div style={{ fontSize: 12, color: "#f87171", fontWeight: 600, marginBottom: 4 }}>⚠️ Bez atskaites objekta</div>
          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.55)" }}>
            AI minēs izmērus pēc konteksta. Gaidāmā kļūda: <b style={{ color: "#f87171" }}>±15–30%</b>. Nav ieteicams komerciāliem mērījumiem.
          </div>
        </div>
      )}

      {/* Sāna foto */}
      <div style={{ marginBottom: "1.5rem", padding: "12px 16px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12 }}>
        <label style={{ display: "flex", alignItems: "center", gap: 12, cursor: "pointer" }}>
          <input type="checkbox" checked={arSanu} onChange={e => setArSanu(e.target.checked)} style={{ width: 18, height: 18, accentColor: "#4ade80" }} />
          <div>
            <div style={{ fontSize: 13, color: "rgba(255,255,255,0.8)", fontWeight: 500 }}>Pievienot sāna foto</div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", marginTop: 1 }}>Neobligāts — palīdz ja garums nav precīzi zināms</div>
          </div>
        </label>
      </div>

      <button onClick={() => { setSoliIndex(0); setFaze("kamera"); }}
        disabled={!garumsNum || garumsNum <= 0}
        style={{
          padding: "16px 0", borderRadius: 14, border: "none",
          background: garumsNum > 0 ? "#4ade80" : "rgba(255,255,255,0.08)",
          color: garumsNum > 0 ? "#0a1a0a" : "rgba(255,255,255,0.25)",
          fontSize: 16, fontWeight: 600, cursor: garumsNum > 0 ? "pointer" : "not-allowed",
        }}>
        Sākt fotografēšanu →
      </button>
    </div>
  );

  // ── KAMERA ──────────────────────────────────────────────────────────────────
  if (faze === "kamera") {
    const bildaUznemta = !!bildes[aktSolis?.id];
    const validLoading = validacija?.status === "loading";

    return (
      <div style={{ ...darkBg, display: "flex", flexDirection: "column", position: "relative" }}>
        <canvas ref={canvasRef} style={{ display: "none" }} />
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, zIndex: 20, padding: "1rem 1.25rem", background: "linear-gradient(to bottom, rgba(10,26,10,0.95) 0%, transparent 100%)", display: "flex", alignItems: "center", gap: 12 }}>
          <button onClick={reset} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.6)", fontSize: 20, cursor: "pointer", padding: 0 }}>✕</button>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 500, color: "#fff" }}>
              {soliIndex + 1}/{aktSoli.length} — {aktSolis?.nosaukums}
            </div>
            <div style={{ fontSize: 11, color: atskVeidsObj.krasa }}>
              {atskVeidsObj.ikona} {atskVeidsObj.nosaukums} · ±{atskVeidsObj.kluda}
            </div>
          </div>
          <div style={{ display: "flex", gap: 5 }}>
            {aktSoli.map((s, i) => (
              <div key={s.id} style={{ width: 7, height: 7, borderRadius: "50%", background: bildes[s.id] ? "#4ade80" : i === soliIndex ? "rgba(255,255,255,0.8)" : "rgba(255,255,255,0.2)" }} />
            ))}
          </div>
        </div>

        <div style={{ position: "relative", flex: 1, background: "#000", minHeight: "55vh" }}>
          {bildaUznemta ? (
            <img src={bildes[aktSolis.id].url} alt="uzņemtā" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
          ) : (
            <video ref={videoRef} autoPlay playsInline muted style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
          )}
          {!bildaUznemta && (
            <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
              <div style={{ position: "absolute", top: "10%", left: "8%", right: "8%", bottom: "10%", border: "1.5px solid rgba(74,222,128,0.35)", borderRadius: 8 }} />
            </div>
          )}
        </div>

        <div style={{ background: "#0a1a0a", padding: "1.25rem 1.25rem 2rem", display: "flex", flexDirection: "column", gap: 12 }}>
          {!bildaUznemta && (
            <div style={{ textAlign: "center" }}>
              <KrautuveShema tips={aktSolis.shema} atskaitesId={atskVeids} />
              <div style={{ fontSize: 15, fontWeight: 500, color: "#fff", marginTop: 8 }}>{aktSolis.norādījums}</div>
              {aktSolis.id === "prieksa" && atskVeids !== "bez_atskaites" && (
                <div style={{ marginTop: 6, padding: "5px 12px", background: `${atskVeidsObj.krasa}15`, border: `1px solid ${atskVeidsObj.krasa}44`, borderRadius: 8, fontSize: 12, color: atskVeidsObj.krasa, display: "inline-block" }}>
                  {atskVeidsObj.ikona} {atskVeids === "lata_cm" ? `Lata ${atskaiteNum}m ar atzīmēm` : `Baļķis ${atskaiteNum}m`}
                </div>
              )}
            </div>
          )}
          {validacija && <ValidacijasBadge status={validacija.status} teksts={validacija.teksts} />}
          {!bildaUznemta ? (
            <button onClick={uznemtBildi} style={{ width: 70, height: 70, borderRadius: "50%", border: "3px solid #4ade80", background: "rgba(74,222,128,0.15)", alignSelf: "center", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <div style={{ width: 50, height: 50, borderRadius: "50%", background: "#4ade80" }} />
            </button>
          ) : (
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={atkartot} style={{ flex: 1, padding: "14px 0", borderRadius: 12, border: "1px solid rgba(255,255,255,0.15)", background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.7)", fontSize: 14, cursor: "pointer" }}>↩ Vēlreiz</button>
              <button onClick={nakamais} disabled={validLoading} style={{ flex: 2, padding: "14px 0", borderRadius: 12, border: "none", background: validLoading ? "rgba(74,222,128,0.3)" : "#4ade80", color: "#0a1a0a", fontSize: 14, fontWeight: 600, cursor: validLoading ? "not-allowed" : "pointer" }}>
                {validLoading ? "Pārbauda..." : soliIndex < aktSoli.length - 1 ? `Nākamais: ${aktSoli[soliIndex+1].nosaukums} →` : "Aprēķināt →"}
              </button>
            </div>
          )}
          {kluda && <div style={{ fontSize: 12, color: "#f87171", textAlign: "center" }}>{kluda}</div>}
        </div>
      </div>
    );
  }

  // ── ANALĪZE ─────────────────────────────────────────────────────────────────
  if (faze === "analize") return (
    <div style={{ ...darkBg, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 24, padding: "2rem" }}>
      <div style={{ width: 72, height: 72, borderRadius: "50%", border: "3px solid rgba(74,222,128,0.3)", borderTop: "3px solid #4ade80", animation: "spin 1s linear infinite" }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 18, fontWeight: 500, color: "#fff", marginBottom: 6 }}>AI aprēķina kubatūru</div>
        <div style={{ fontSize: 13, color: "rgba(255,255,255,0.4)" }}>
          {atskVeids === "lata_cm" ? `Nolasa atzīmes uz ${atskaiteNum}m latas...` : atskVeids === "balkis_zināms" ? `Aprēķina proporcijas pret ${atskaiteNum}m baļķi...` : "Analizē kontekstu bez atskaites..."}
        </div>
      </div>
    </div>
  );

  // ── REZULTĀTS ────────────────────────────────────────────────────────────────
  if (faze === "rezultats" && rezultats) {
    const ticKrasa = { augsta: "#4ade80", videja: "#fbbf24", zema: "#f87171" };
    const rezAtsk = ATSKAITES_VEIDI.find(v => v.id === rezultats.atskVeids) || ATSKAITES_VEIDI[0];

    return (
      <div style={{ ...darkBg, padding: "1.5rem 1.25rem 3rem", overflowY: "auto" }}>
        <div style={{ background: "rgba(74,222,128,0.08)", border: "1px solid rgba(74,222,128,0.25)", borderRadius: 16, padding: "1.5rem", textAlign: "center", marginBottom: "1.25rem" }}>
          <div style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", marginBottom: 4 }}>Neto kubatūra</div>
          <div style={{ fontSize: 52, fontWeight: 600, color: "#4ade80", lineHeight: 1 }}>{rezultats.neto_m3?.toFixed(2)}</div>
          <div style={{ fontSize: 18, color: "rgba(255,255,255,0.5)", marginBottom: 10 }}>m³</div>
          <div style={{ display: "flex", justifyContent: "center", gap: 8, flexWrap: "wrap" }}>
            <div style={{ padding: "4px 12px", borderRadius: 20, background: `${ticKrasa[rezultats.ticamiba]}22`, border: `1px solid ${ticKrasa[rezultats.ticamiba]}55`, fontSize: 12, color: ticKrasa[rezultats.ticamiba] }}>
              Ticamība: {rezultats.ticamiba}
            </div>
            <div style={{ padding: "4px 12px", borderRadius: 20, background: `${rezAtsk.krasa}15`, border: `1px solid ${rezAtsk.krasa}44`, fontSize: 12, color: rezAtsk.krasa }}>
              {rezAtsk.ikona} ±{rezAtsk.kluda}
            </div>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: "1.25rem" }}>
          {[
            { label: "Augstums", val: rezultats.augstums_m?.toFixed(2), unit: "m" },
            { label: "Platums",  val: rezultats.platums_m?.toFixed(2),  unit: "m" },
            { label: "Garums",   val: garumsNum.toFixed(1), unit: "m", sub: "manuāls" },
            { label: "Tukšums",  val: rezultats.tuksumsProc, unit: "%" },
            { label: "Bruto",    val: rezultats.pilnTilpums_m3?.toFixed(2), unit: "m³" },
            { label: "Neto",     val: rezultats.neto_m3?.toFixed(2), unit: "m³" },
          ].map(({ label, val, unit, sub }) => (
            <div key={label} style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 10, padding: "10px 8px", textAlign: "center" }}>
              <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", marginBottom: 3 }}>{label}</div>
              <div style={{ fontSize: 18, fontWeight: 500, color: "#fff" }}>{val}</div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)" }}>{sub || unit}</div>
            </div>
          ))}
        </div>

        {/* Korekcija */}
        <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, padding: "1rem", marginBottom: "1.25rem" }}>
          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", marginBottom: 10 }}>Manuāla korekcija:</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
            {[{ key: "augstums_m", label: "Augst. m", step: 0.1 }, { key: "platums_m", label: "Plat. m", step: 0.1 }, { key: "tuksumsProc", label: "Tukšums %", step: 1 }].map(({ key, label, step }) => (
              <div key={key}>
                <label style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", display: "block", marginBottom: 3 }}>{label}</label>
                <input type="number" step={step} value={rezultats[key]} onChange={e => {
                  const v = parseFloat(e.target.value) || 0;
                  const r = { ...rezultats, [key]: v };
                  r.pilnTilpums_m3 = r.augstums_m * r.platums_m * garumsNum;
                  r.neto_m3 = r.pilnTilpums_m3 * (1 - r.tuksumsProc / 100);
                  setRezultats(r);
                }} style={{ width: "100%", boxSizing: "border-box", background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, color: "#fff", fontSize: 15, padding: "8px 10px", outline: "none" }} />
              </div>
            ))}
          </div>
        </div>

        {rezultats.komentars && (
          <div style={{ borderLeft: "3px solid rgba(74,222,128,0.4)", padding: "8px 14px", marginBottom: "1.25rem", fontSize: 13, color: "rgba(255,255,255,0.5)" }}>{rezultats.komentars}</div>
        )}

        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={reset} style={{ flex: 1, padding: "14px 0", borderRadius: 12, border: "1px solid rgba(255,255,255,0.12)", background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.75)", fontSize: 14, cursor: "pointer" }}>🔄 Jauns</button>
          <button onClick={() => {
            const txt = `KUBATŪRAS MĒRĪJUMS\n${new Date().toLocaleString("lv-LV")}\nAtskaite: ${rezAtsk.nosaukums} (±${rezAtsk.kluda})\n\nAugstums: ${rezultats.augstums_m?.toFixed(2)} m\nPlatums: ${rezultats.platums_m?.toFixed(2)} m\nGarums: ${garumsNum} m\nTukšums: ${rezultats.tuksumsProc}%\n\nBruto: ${rezultats.pilnTilpums_m3?.toFixed(2)} m³\nNeto: ${rezultats.neto_m3?.toFixed(2)} m³\n\n${rezultats.komentars || ""}`;
            const a = Object.assign(document.createElement("a"), { href: URL.createObjectURL(new Blob([txt], { type: "text/plain" })), download: `kubatura_${new Date().toISOString().slice(0,10)}.txt` });
            a.click();
          }} style={{ flex: 1, padding: "14px 0", borderRadius: 12, border: "none", background: "#4ade80", color: "#0a1a0a", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>💾 Saglabāt</button>
        </div>
      </div>
    );
  }

  return null;
}
