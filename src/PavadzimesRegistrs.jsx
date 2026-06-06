import { useState, useRef, useCallback, useEffect } from "react";
import { supabase } from './supabaseClient';

const COLS = [
  { key: "datums",        label: "Datums",           auto: true  },
  { key: "pvz_nr",        label: "Pvz. Nr.",          auto: true  },
  { key: "no_kurienes",   label: "No kurienes",       auto: true  },
  { key: "cirt_apl_nr",   label: "Cirt. apl. Nr.",    auto: true  },
  { key: "sortiments",    label: "Sortiments",        auto: true  },
  { key: "suga",          label: "Koku suga",         auto: true  },
  { key: "piegade",       label: "Piegādes vieta",    auto: true  },
  { key: "kubi",          label: "m³ nosūtīti",       auto: true  },
  { key: "veids",         label: "Veids",             auto: false },
  { key: "klients",       label: "Klients",           auto: false },
  { key: "kubi_uzmeriti", label: "m³ uzmērīti",       auto: false },
  { key: "soferis",       label: "Šoferis",           auto: false },
  { key: "auto",          label: "Automašīna",        auto: false },
  { key: "km",            label: "km",                auto: false },
];

const SORTIMENT_CONTEXT = `
SORTIMENTI UN KOKU SUGAS (obligāti jānosaka abi):

Finieris (veneer) - koku suga: Bērzs (B). Pazīmes: "Finieris", diametri piem. 2.8, 3.2
Zāģbaļķi (log) - koku sugas: Priede (P), Egle (E), Ozols (Oz), Osis (Os), Bērzs (B-vecs)
Sīkbaļķi (small) - koku sugas: Priede (P), Egle (E), Ozols (Oz), Osis (Os)
Tara (tara) - koku sugas: Bērzs (B), Alksnis (A), Baltalksnis (Ba), Melnalksnis (Bl)
Papīrmalka (pulp) - koku sugas: Priede (P), Egle (E), Bērzs (B), Alksnis (A)
Malka (fire) - koku sugas: Baltalksnis (Ba), Melnalksnis (Bl), Melnā kārkls (M), Apse (G)
Šķelda (chips) - visas sugas

SUGU KODI: P=Priede, E=Egle, B=Bērzs, A=Alksnis, Ba=Baltalksnis, Bl=Melnalksnis, Oz=Ozols, Os=Osis, M=Melnā kārkls, G=Apse

PIEMĒRI:
- "Finieris 2.8 / 3.2" -> sortiments: "Finieris", suga: "B"
- "Zāģbaļķi P" -> sortiments: "Zāģbaļķi", suga: "P"
- "Papīrmalka" -> sortiments: "Papīrmalka", suga pēc konteksta
`;

// OCR — dinamisks ar klienta šoferiem un piegādes vietām
async function ocrPavadzime(base64, mediaType, soferi = [], piegadesVietas = []) {
  const soferiStr    = soferi.map(s => s.vards).join(", ") || "nav norādīts";
  const piegadesStr  = piegadesVietas.join(", ") || "nav norādīts";

  const response = await fetch("/api/anthropic/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-sonnet-4-6",
      max_tokens: 1000,
      messages: [{
        role: "user",
        content: [
          { type: "image", source: { type: "base64", media_type: mediaType, data: base64 } },
          {
            type: "text",
            text: `Nolasi šo Latvijas meža pavadzīmi. Atgriezni TIKAI JSON bez jebkāda teksta apkārt.

ŠOFERI - izvēlies tuvāko no saraksta: ${soferiStr}

PIEGĀDES VIETAS - tas ir SAŅĒMĒJS (nevis Nosūtītājs!). Meklē "Saņēmējs" lauku pavadzīmē - izvēlies tuvāko: ${piegadesStr}

${SORTIMENT_CONTEXT}

{"datums":"DD.MM.YYYY","pvz_nr":"pilns numurs pēc PAVADZĪME NR:","no_kurienes":"Izsniegšanas adrese lauks","piegade":"Saņēmējs lauks - no saraksta","kubi":"Nosūtītais daudzums - summē ja vairāki","sortiments":"no sortimentu saraksta","suga":"sugas kods P/E/B/A/Ba/Bl/Oz/Os/M/G","soferis":"Transporta līdzekļa vadītājs - no saraksta","cirt_apl_nr":"Ciršanas apliecinājuma Nr. lauks - tikai cipari"}

Ja nav salasāms - null. Kubi bez m3.`
          }
        ]
      }]
    })
  });
  const data = await response.json();
  const text = data.content?.find(b => b.type === "text")?.text || "{}";
  return JSON.parse(text.replace(/```json|```/g, "").trim());
}

function exportCSV(records) {
  const headers = COLS.map(c => c.label).join(";");
  const rows = records.map(r => COLS.map(c => `"${(r[c.key] ?? "").toString().replace(/"/g, '""')}"`).join(";"));
  const csv = [headers, ...rows].join("\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = `pavadzimes_${new Date().toISOString().slice(0,10)}.csv`; a.click();
  URL.revokeObjectURL(url);
}

const SUGAS = { P:"Priede", E:"Egle", B:"Bērzs", A:"Alksnis", Ba:"Baltalksnis", Bl:"Melnalksnis", Oz:"Ozols", Os:"Osis", M:"Melnā kārkls", G:"Apse" };
export default function PavadzimesRegistrs({ onBack, user, noHeader }) {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [saving, setSaving] = useState(false);
  const [preview, setPreview] = useState(null);
  const [extracted, setExtracted] = useState(null);
  const [verifyMode, setVerifyMode] = useState(false);
  const [verifyData, setVerifyData] = useState(null);
  const [editRow, setEditRow] = useState(null);
  const [error, setError] = useState(null);
  const [tab, setTab] = useState("scan");
  const [solis, setSolis] = useState(1);
  const [izveletsSoferis, setIzveletsSoferis] = useState(null);
  const [izveletaAuto, setIzveletaAuto] = useState("");
  const [izveletiVeids, setIzveletiVeids] = useState("");
  const [izveletiKlients, setIzveletiKlients] = useState("");
  const [jaunaPiegade, setJaunaPiegade] = useState("");
  const [iestatijumi, setIestatijumi] = useState(null); // null = ielādē, {} = nav, {...} = ir
  const fileRef = useRef();

  // Ielādē klienta iestatījumus no Supabase
  useEffect(() => {
    if (!user?.id) { setIestatijumi({}); return; }
    supabase.from("klienta_iestatijumi")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => setIestatijumi(data || {}));
  }, [user?.id]);

  useEffect(() => { loadFromSupabase(); }, []);

  const loadFromSupabase = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.from("pavadzimes").select("*").eq("user_id", user?.id).order("id", { ascending: false });
      if (error) throw error;
      setRecords(data || []);
    } catch (err) { setError("Kļūda ielādējot: " + err.message); }
    finally { setLoading(false); }
  };

  const handleFile = useCallback(async (file) => {
    if (!file) return;
    setError(null);
    const reader = new FileReader();
    reader.onload = async (e) => {
      const dataUrl = e.target.result;
      setPreview(dataUrl); setScanning(true); setExtracted(null);
      try {
        const result = await ocrPavadzime(
          dataUrl.split(",")[1],
          file.type || "image/jpeg",
          iestatijumi?.soferi || [],
          iestatijumi?.piegades_vietas || []
        );
        setExtracted(result);
      } catch (err) { setError("OCR kļūda: " + err.message); }
      finally { setScanning(false); }
    };
    reader.readAsDataURL(file);
  }, []);

  const openVerify = () => {
    if (!extracted) return;
    const base = COLS.reduce((a,c) => ({...a,[c.key]:""}),{});
    setVerifyData({
      ...base,
      ...extracted,
      soferis: izveletsSoferis?.vards || extracted.soferis || "",
      auto: izveletaAuto || "",
      veids: izveletiVeids || "",
      klients: izveletiKlients || "",
      km: "",
    });
    setVerifyMode(true);
  };

  const validateAndSave = async () => {
    const missing = ["datums","pvz_nr","kubi","soferis","km"].filter(k => !verifyData[k]);
    if (missing.length > 0) { setError("Aizpildi: " + missing.join(", ")); return; }
    if (isNaN(parseFloat(verifyData.km))) { setError("km jābūt skaitlim"); return; }
setSaving(true); setError(null);
    try {
      const row = {...verifyData, user_id: user?.id}; delete row.id;
      const { data, error } = await supabase.from("pavadzimes").insert([row]).select().single();
      if (error) throw error;
      setRecords(prev => [data, ...prev]);
      setPreview(null); setExtracted(null); setVerifyData(null); setVerifyMode(false);
      setSolis(1); setIzveletsSoferis(null); setIzveletaAuto(""); setIzveletiVeids(""); setIzveletiKlients("");
      setTab("registrs");
    } catch (err) { setError("Kļūda saglabājot: " + err.message); }
    finally { setSaving(false); }
  };

  const updateRecord = async (id, key, val) => {
    setRecords(prev => prev.map(r => r.id === id ? {...r,[key]:val} : r));
    const { error } = await supabase.from("pavadzimes").update({[key]:val}).eq("id",id);
    if (error) { setError("Kļūda: " + error.message); loadFromSupabase(); }
  };

  const deleteRecord = async (id) => {
    if (!window.confirm("Dzēst?")) return;
    setRecords(prev => prev.filter(r => r.id !== id));
    await supabase.from("pavadzimes").delete().eq("id",id);
  };

  const totalKubi = records.reduce((s,r) => s + (parseFloat(r.kubi)||0), 0);
  const soferi       = iestatijumi?.soferi        || [];
  const piegadesVietas = iestatijumi?.piegades_vietas || [];
  const klienti      = iestatijumi?.klienti       || [];
  const iestatijumiGatavi = iestatijumi !== null && (soferi.length > 0 || piegadesVietas.length > 0);

  const btn = (label, onClick, style={}) => (
    <button onClick={onClick} style={{fontFamily:"inherit",cursor:"pointer",...style}}>{label}</button>
  );

  return (
    <div style={{height:"100vh",display:"flex",flexDirection:"column",background:"#0a0f0a",color:"#e8f5e9",fontFamily:"Arial,sans-serif"}}>

      {/* HEADER — slēpts ja noHeader */}
      {!noHeader && (
      <div style={{background:"#1b3a1b",borderBottom:"1px solid #2d5a2d",padding:"0 20px",height:52,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <div style={{display:"flex",alignItems:"center",gap:12}}>
          {onBack && btn("←", onBack, {background:"transparent",border:"none",color:"#4caf50",fontSize:22,minWidth:36,minHeight:44})}
          <span style={{fontSize:15,fontWeight:700,color:"#4caf50"}}>🪵 Pavadzīmju reģistrs</span>
        </div>
        <div style={{fontSize:12,color:"#4a7a4a"}}>{loading?"Ielādē...":`${records.length} pvz. | ${totalKubi.toFixed(3)} m³`}</div>
        <div style={{display:"flex",gap:8}}>
          {btn("↻", loadFromSupabase, {background:"transparent",border:"1px solid #2d5a2d",borderRadius:8,padding:"6px 12px",color:"#81c784",fontSize:12})}
          {btn("⬇ CSV", ()=>exportCSV(records), {background:"#2d5a2d",border:"1px solid #4caf50",borderRadius:8,padding:"6px 14px",color:"#4caf50",fontSize:12})}
        </div>
      </div>
      )}
      {/* Action bar kad noHeader */}
      {noHeader && (
        <div style={{padding:"8px 20px",display:"flex",gap:8,justifyContent:"space-between",alignItems:"center",borderBottom:"1px solid #2d5a2d"}}>
          <div style={{fontSize:12,color:"#4a7a4a"}}>{loading?"Ielādē...":`${records.length} pvz. | ${totalKubi.toFixed(3)} m³`}</div>
          <div style={{display:"flex",gap:8}}>
            {btn("↻", loadFromSupabase, {background:"transparent",border:"1px solid #2d5a2d",borderRadius:8,padding:"6px 12px",color:"#81c784",fontSize:12})}
            {btn("⬇ CSV", ()=>exportCSV(records), {background:"#2d5a2d",border:"1px solid #4caf50",borderRadius:8,padding:"6px 14px",color:"#4caf50",fontSize:12})}
          </div>
        </div>
      )}

      {/* TABS */}
      <div style={{display:"flex",borderBottom:"1px solid #2d5a2d"}}>
        {[["scan","📷 Skenēt"],["registrs","📋 Reģistrs"]].map(([key,label])=>(
          <button key={key} onClick={()=>setTab(key)} style={{flex:1,padding:"12px",background:tab===key?"#1b3a1b":"transparent",border:"none",borderBottom:tab===key?"2px solid #4caf50":"2px solid transparent",color:tab===key?"#4caf50":"#81c784",fontSize:14,cursor:"pointer",fontFamily:"inherit",fontWeight:tab===key?700:400}}>{label}</button>
        ))}
      </div>

      {/* ERROR */}
      {error && (
        <div style={{background:"#3e1f1f",border:"1px solid #c62828",padding:"10px 20px",fontSize:12,color:"#ff6b6b",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <span>{error}</span>
          {btn("✕", ()=>setError(null), {background:"none",border:"none",color:"#ff6b6b",fontSize:16})}
        </div>
      )}

      {/* MAIN */}
      <div style={{flex:1,overflow:"auto",padding:"20px"}}>

        {/* Iestatījumi nav konfigurēti */}
        {iestatijumi !== null && !iestatijumiGatavi && tab === "scan" && (
          <div style={{maxWidth:500,margin:"40px auto",textAlign:"center",padding:"40px 24px",background:"#141f14",border:"2px dashed #2d5a2d",borderRadius:16}}>
            <div style={{fontSize:48,marginBottom:16}}>⚙️</div>
            <div style={{fontSize:16,fontWeight:700,color:"#4caf50",marginBottom:8}}>Reģistrs nav konfigurēts</div>
            <div style={{fontSize:13,color:"#81c784",lineHeight:1.7,marginBottom:20}}>
              Šis pavadzīmju reģistrs tiek personalizēts katram klientam.<br/>
              Sazinieties ar mums lai iestatītu šoferus, piegādes vietas un uzņēmuma profilu.
            </div>
            <a href="mailto:jeshkaa@inbox.lv" style={{display:"inline-block",background:"#225522",border:"1px solid #4caf50",borderRadius:8,padding:"12px 24px",color:"#4caf50",fontSize:14,fontWeight:700,textDecoration:"none"}}>
              ✉️ Sazināties — jeshkaa@inbox.lv
            </a>
          </div>
        )}

        {tab==="scan" && iestatijumiGatavi && (
          <div>

            {/* SOLIS 1 — Šoferis */}
            {solis===1 && (
              <div style={{maxWidth:500,margin:"0 auto"}}>
                <div style={{fontSize:16,fontWeight:700,color:"#4caf50",marginBottom:20,textAlign:"center"}}>
                  👤 Izvēlies šoferi
                </div>
                <div style={{display:"flex",flexDirection:"column",gap:10,marginBottom:24}}>
                  {soferi.map((s,i)=>(
                    <div key={i} onClick={()=>{setIzveletsSoferis(s);setIzveletaAuto(s.auto)}}
                      style={{background:izveletsSoferis?.vards===s.vards?"#1e3a1e":"#141f14",border:`2px solid ${izveletsSoferis?.vards===s.vards?"#4caf50":"#2d5a2d"}`,borderRadius:10,padding:"14px 18px",cursor:"pointer",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                      <span style={{color:"#e8f5e9",fontSize:15,fontWeight:600}}>{s.vards}</span>
                      <span style={{color:"#4caf50",fontSize:13,background:"#0f2b0f",padding:"4px 12px",borderRadius:6}}>{s.auto}</span>
                    </div>
                  ))}
                </div>

                {izveletsSoferis && (
                  <div>
                    <div style={{marginBottom:16}}>
                      <label style={{fontSize:12,color:"#81c784",display:"block",marginBottom:6}}>Automašīna (var mainīt):</label>
                      <input value={izveletaAuto} onChange={e=>setIzveletaAuto(e.target.value)}
                        style={{width:"100%",background:"#0f1a0f",border:"1px solid #2d5a2d",borderRadius:8,padding:"10px 14px",color:"#e8f5e9",fontSize:14,fontFamily:"inherit",boxSizing:"border-box"}}/>
                    </div>

                    <div style={{marginBottom:20}}>
                      <label style={{fontSize:12,color:"#81c784",display:"block",marginBottom:8}}>Kravas veids:</label>
                      <div style={{display:"flex",gap:10}}>
                        {["Sava krautuve","Pakalpojums"].map(v=>(
                          <div key={v} onClick={()=>setIzveletiVeids(v)}
                            style={{flex:1,background:izveletiVeids===v?"#1e3a1e":"#141f14",border:`2px solid ${izveletiVeids===v?"#4caf50":"#2d5a2d"}`,borderRadius:10,padding:"12px",cursor:"pointer",textAlign:"center",color:izveletiVeids===v?"#4caf50":"#81c784",fontSize:14,fontWeight:izveletiVeids===v?700:400}}>
                            {v==="Sava krautuve"?"🌲 Sava krautuve":"🤝 Pakalpojums"}
                          </div>
                        ))}
                      </div>
                    </div>

                    {izveletiVeids==="Pakalpojums" && (
                      <div style={{marginBottom:20}}>
                        <label style={{fontSize:12,color:"#81c784",display:"block",marginBottom:6}}>Klients:</label>
                        {klienti.length>0 && (
                          <select onChange={e=>{if(e.target.value)setIzveletiKlients(e.target.value)}}
                            style={{width:"100%",background:"#0f1a0f",border:"1px solid #2d5a2d",borderRadius:8,padding:"10px 14px",color:"#e8f5e9",fontSize:14,fontFamily:"inherit",boxSizing:"border-box",marginBottom:8}}>
                            <option value="">— izvēlies no saraksta —</option>
                            {klienti.map((k,i)=><option key={i} value={k}>{k}</option>)}
                          </select>
                        )}
                        <input value={izveletiKlients} onChange={e=>setIzveletiKlients(e.target.value)}
                          placeholder="Vai ievadi jaunu klientu..."
                          style={{width:"100%",background:"#0f1a0f",border:"1px solid #2d5a2d",borderRadius:8,padding:"10px 14px",color:"#e8f5e9",fontSize:14,fontFamily:"inherit",boxSizing:"border-box"}}/>
                      </div>
                    )}

                    <button
                      onClick={()=>{
                        if(!izveletiVeids){setError("⚠️ Izvēlies kravas veidu!");return}
                        if(izveletiVeids==="Pakalpojums"&&!izveletiKlients){setError("⚠️ Ievadi klienta nosaukumu!");return}
                        setError(null); setSolis(2);
                      }}
                      style={{width:"100%",background:"#2d5a2d",border:"1px solid #4caf50",borderRadius:10,padding:"14px",color:"#4caf50",fontSize:15,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>
                      Turpināt → Fotografēt pavadzīmi
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* SOLIS 2 — Foto */}
            {solis===2 && (
              <div>
                {/* Šofera info josla */}
                <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:16,padding:"10px 14px",background:"#0f1a0f",borderRadius:8,border:"1px solid #1e3a1e",flexWrap:"wrap"}}>
                  <span style={{fontSize:13,color:"#81c784",fontWeight:600}}>{izveletsSoferis?.vards}</span>
                  <span style={{fontSize:12,color:"#4caf50",background:"#0f2b0f",padding:"2px 10px",borderRadius:5}}>{izveletaAuto}</span>
                  <span style={{fontSize:12,color:"#ffb74d",marginLeft:"auto"}}>{izveletiVeids==="Pakalpojums"?`🤝 ${izveletiKlients}`:"🌲 Sava krautuve"}</span>
                  <button onClick={()=>{setSolis(1);setPreview(null);setExtracted(null);setVerifyMode(false);}} style={{background:"transparent",border:"none",color:"#4a7a4a",cursor:"pointer",fontSize:12}}>✎ Mainīt</button>
                </div>

                {!preview && !verifyMode && (
                  <div onDragOver={e=>e.preventDefault()} onDrop={e=>{e.preventDefault();handleFile(e.dataTransfer.files[0])}} onClick={()=>fileRef.current.click()}
                    style={{border:"2px dashed #2d5a2d",borderRadius:16,padding:"48px 24px",textAlign:"center",cursor:"pointer",background:"#141f14"}}>
                    <div style={{fontSize:48,marginBottom:12}}>📷</div>
                    <div style={{fontSize:16,fontWeight:700,color:"#4caf50",marginBottom:6}}>Fotografē pavadzīmi</div>
                    <div style={{fontSize:13,color:"#81c784"}}>Uzspied vai ievelc attēlu šeit</div>
                    <input ref={fileRef} type="file" accept="image/*" onChange={e=>handleFile(e.target.files[0])} style={{display:"none"}}/>
                  </div>
                )}

                {preview && !verifyMode && (
                  <div style={{textAlign:"center",marginBottom:20}}>
                    <img src={preview} style={{maxWidth:"100%",maxHeight:400,borderRadius:8}} alt="preview"/>
                  </div>
                )}

                {scanning && (
                  <div style={{textAlign:"center",padding:"40px 20px"}}>
                    <div style={{fontSize:32,marginBottom:12,animation:"spin 1s linear infinite"}}>⚙️</div>
                    <div style={{fontSize:14,color:"#81c784"}}>Nolasa pavadzīmi...</div>
                  </div>
                )}

                {extracted && !scanning && !verifyMode && (
                  <div style={{background:"#141f14",border:"1px solid #2d5a2d",borderRadius:12,padding:20}}>
                    <div style={{fontSize:14,fontWeight:700,color:"#4caf50",marginBottom:8}}>✓ Nolasītie dati</div>

                    {(extracted.sortiments || extracted.suga) && (
                      <div style={{background:"#0f2b0f",border:"1px solid #4caf50",borderRadius:8,padding:"10px 14px",marginBottom:16,display:"flex",gap:24,flexWrap:"wrap"}}>
                        <div><span style={{fontSize:11,color:"#7ab87a"}}>Sortiments: </span><span style={{fontSize:15,fontWeight:700,color:"#4caf50"}}>{extracted.sortiments||"—"}</span></div>
                        <div><span style={{fontSize:11,color:"#7ab87a"}}>Koku suga: </span><span style={{fontSize:15,fontWeight:700,color:"#ffb74d"}}>{extracted.suga?`${extracted.suga} — ${SUGAS[extracted.suga]||extracted.suga}`:"—"}</span></div>
                      </div>
                    )}

                    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit, minmax(160px, 1fr))",gap:12,marginBottom:20}}>
                      {COLS.filter(c=>c.auto).map(col=>(
                        <div key={col.key} style={{display:"flex",flexDirection:"column",gap:4}}>
                          <label style={{fontSize:11,color:"#81c784"}}>{col.label} ●</label>
                          <input type="text" value={extracted[col.key]??""} onChange={e=>setExtracted({...extracted,[col.key]:e.target.value})}
                            style={{background:"#0f1a0f",border:"1px solid #2d5a2d",borderRadius:6,padding:"8px 10px",color:"#e8f5e9",fontSize:16,fontFamily:"inherit",boxSizing:"border-box",minHeight:44}}/>
                        </div>
                      ))}
                    </div>
                    <div style={{display:"flex",gap:10}}>
                      {btn("✓ Atvērt pārbaudi", openVerify, {flex:1,background:"#2d5a2d",border:"1px solid #4caf50",borderRadius:8,padding:"10px",color:"#4caf50",fontSize:14,fontWeight:700})}
                      {btn("✗ Atcelt", ()=>{setPreview(null);setExtracted(null);}, {flex:1,background:"transparent",border:"1px solid #2d5a2d",borderRadius:8,padding:"10px",color:"#81c784",fontSize:14})}
                    </div>
                  </div>
                )}

                {verifyMode && verifyData && (
                  <div style={{background:"#141f14",border:"2px solid #4caf50",borderRadius:12,padding:24,maxWidth:900,margin:"0 auto"}}>
                    <div style={{fontSize:16,fontWeight:700,color:"#4caf50",marginBottom:20,textAlign:"center"}}>✓ Pārbaudi visus laukus</div>
                    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit, minmax(200px, 1fr))",gap:16,marginBottom:20}}>
                      {COLS.map(col=>(
                        <div key={col.key} style={{display:"flex",flexDirection:"column",gap:4}}>
                          <label style={{fontSize:11,color:col.auto?"#81c784":"#ffb74d",fontWeight:700}}>
                            {col.label}{col.auto?" ●":" ○"}
                            {["datums","pvz_nr","kubi","soferis","km"].includes(col.key)&&<span style={{color:"#ff6b6b"}}> *</span>}
                          </label>
                          {col.key==="veids"
                            ? <select value={verifyData[col.key]??""} onChange={e=>setVerifyData(p=>({...p,[col.key]:e.target.value}))}
                                style={{background:"#0f1a0f",border:"1px solid #2d5a2d",borderRadius:6,padding:"8px 10px",color:"#e8f5e9",fontSize:16,fontFamily:"inherit",minHeight:44}}>
                                <option value="">— izvēlies —</option>
                                <option value="Sava krautuve">🌲 Sava krautuve</option>
                                <option value="Pakalpojums">🤝 Pakalpojums</option>
                              </select>
                            : col.key==="suga"
                            ? <select value={verifyData[col.key]??""} onChange={e=>setVerifyData(p=>({...p,[col.key]:e.target.value}))}
                                style={{background:"#0f1a0f",border:"1px solid #2d5a2d",borderRadius:6,padding:"8px 10px",color:"#e8f5e9",fontSize:16,fontFamily:"inherit",minHeight:44}}>
                                <option value="">— izvēlies —</option>
                                {Object.entries(SUGAS).map(([k,v])=><option key={k} value={k}>{k} — {v}</option>)}
                              </select>
                            : col.key==="piegade"
                            ? <div style={{display:"flex",flexDirection:"column",gap:4}}>
                                <select value={verifyData[col.key]??""} onChange={e=>setVerifyData(p=>({...p,[col.key]:e.target.value}))}
                                  style={{background:"#0f1a0f",border:"1px solid #2d5a2d",borderRadius:6,padding:"8px 10px",color:"#e8f5e9",fontSize:16,fontFamily:"inherit",minHeight:44}}>
                                  <option value="">— izvēlies —</option>
                                  {piegadesVietas.map((v,i)=><option key={i} value={v}>{v}</option>)}
                                </select>
                                <input value={jaunaPiegade} onChange={e=>setJaunaPiegade(e.target.value)} onBlur={e=>{if(e.target.value){setVerifyData(p=>({...p,piegade:e.target.value}));setJaunaPiegade("")}}}
                                  placeholder="Vai ievadi jaunu piegādes vietu..."
                                  style={{background:"#0f1a0f",border:"1px solid #2d5a2d",borderRadius:6,padding:"8px 10px",color:"#e8f5e9",fontSize:16,fontFamily:"inherit",minHeight:44,boxSizing:"border-box",width:"100%"}}/>
                              </div>
                            : <input type={["kubi","km","kubi_uzmeriti"].includes(col.key)?"number":"text"}
                                value={verifyData[col.key]??""} onChange={e=>setVerifyData(p=>({...p,[col.key]:e.target.value}))}
                                style={{background:"#0f1a0f",border:["datums","pvz_nr","kubi","soferis","km"].includes(col.key)&&!verifyData[col.key]?"2px solid #ff6b6b":"1px solid #2d5a2d",borderRadius:6,padding:"8px 10px",color:"#e8f5e9",fontSize:16,fontFamily:"inherit",minHeight:44,boxSizing:"border-box",width:"100%"}}/>
                          }
                        </div>
                      ))}
                    </div>
                    <div style={{display:"flex",gap:10}}>
                      {btn(saving?"⏳ Saglabā...":"✓ Saglabāt Supabase", validateAndSave, {flex:1,background:saving?"#1a3a1a":"#2d5a2d",border:"1px solid #4caf50",borderRadius:8,padding:"12px",color:"#4caf50",fontSize:14,fontWeight:700,cursor:saving?"wait":"pointer"})}
                      {btn("← Atpakaļ", ()=>{setVerifyMode(false);setVerifyData(null);setError(null);}, {flex:1,background:"transparent",border:"1px solid #2d5a2d",borderRadius:8,padding:"12px",color:"#81c784",fontSize:14})}
                    </div>
                    <div style={{marginTop:16,fontSize:11,color:"#4a7a4a",textAlign:"center"}}>● = OCR | ○ = Manuāli | <span style={{color:"#ff6b6b"}}>*</span> = Obligāts</div>
                  </div>
                )}
              </div>
            )}

          </div>
        )} {/* tab==="scan" && iestatijumiGatavi */}

        {tab==="registrs" && (
          <div>
            {loading
              ? <div style={{textAlign:"center",padding:"60px 20px",color:"#4a7a4a"}}><div style={{fontSize:32,animation:"spin 1s linear infinite"}}>⚙️</div><div style={{marginTop:12}}>Ielādē...</div></div>
              : records.length===0
              ? <div style={{textAlign:"center",padding:"60px 20px",color:"#4a7a4a"}}><div style={{fontSize:48}}>📋</div><div style={{marginTop:12}}>Reģistrs tukšs!</div></div>
              : <div>
                  <div style={{overflowX:"auto"}}>
                    <table style={{width:"100%",borderCollapse:"collapse",marginBottom:20}}>
                      <thead>
                        <tr style={{background:"#1b3a1b",borderBottom:"2px solid #2d5a2d"}}>
                          {COLS.map(col=>(
                            <th key={col.key} style={{padding:"10px 8px",textAlign:"left",fontSize:11,fontWeight:700,color:col.auto?"#4caf50":"#ffb74d",borderRight:"1px solid #2d5a2d",minWidth:col.key==="sortiments"||col.key==="no_kurienes"?120:80,whiteSpace:"nowrap"}}>
                              {col.label}{col.auto&&" ●"}
                            </th>
                          ))}
                          <th style={{padding:"10px 8px",width:60,color:"#81c784",fontSize:11}}>✕</th>
                        </tr>
                      </thead>
                      <tbody>
                        {records.map((rec,i)=>(
                          <tr key={rec.id} style={{borderBottom:"1px solid #2d5a2d",background:i%2===0?"#0f1a0f":"transparent"}}>
                            {COLS.map(col=>(
                              <td key={col.key} style={{padding:"8px",fontSize:11,borderRight:"1px solid #2d5a2d",color:col.auto?"#e8f5e9":"#ffb74d"}}>
                                {editRow===rec.id
                                  ? <input type={["kubi","km"].includes(col.key)?"number":"text"} value={rec[col.key]??""} onChange={e=>updateRecord(rec.id,col.key,e.target.value)}
                                      style={{background:"#0f1a0f",border:"1px solid #2d5a2d",borderRadius:4,padding:"4px 6px",color:"#e8f5e9",fontSize:11,fontFamily:"inherit",width:"100%"}}/>
                                  : <span>{col.key==="suga"&&rec[col.key]?`${rec[col.key]} (${SUGAS[rec[col.key]]||rec[col.key]})`:rec[col.key]||"—"}</span>
                                }
                              </td>
                            ))}
                            <td style={{padding:"8px",textAlign:"center"}}>
                              {btn(editRow===rec.id?"✓":"✎", ()=>setEditRow(editRow===rec.id?null:rec.id), {background:"transparent",border:"none",color:editRow===rec.id?"#4caf50":"#4a7a4a",fontSize:12})}
                              {btn("✕", ()=>deleteRecord(rec.id), {background:"transparent",border:"none",color:"#c62828",fontSize:12,marginLeft:6})}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div style={{background:"#1b3a1b",border:"1px solid #2d5a2d",borderRadius:8,padding:16,display:"flex",justifyContent:"space-between",fontSize:13,fontWeight:700}}>
                    <div style={{color:"#81c784"}}>KOPĀ: {records.length} pavadzīmes</div>
                    <div style={{color:"#4caf50"}}>{totalKubi.toFixed(3)} m³</div>
                  </div>
                </div>
            }
          </div>
        )}
      </div>

      <div style={{background:"#1b3a1b",borderTop:"1px solid #2d5a2d",padding:"10px 20px",fontSize:11,color:"#4a7a4a",display:"flex",gap:20,justifyContent:"center"}}>
        <span>● Auto no OCR</span><span>○ Manuāli</span><span>☁ Supabase</span>
      </div>
      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
