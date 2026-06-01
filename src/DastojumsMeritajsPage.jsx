import { useState, useMemo } from 'react';
import { apstraadaKokus, formatKopsavilkums, SUGAS } from './engines/dastojumsMeritajsEngine';

const SUGAS_SARAKSTS = ['P','E','B','A','Ba','Bl','Oz','Os'];

const KVALITATES = [
  { val: 'resns',  label: 'Resns (Q1)'  },
  { val: 'vidējs', label: 'Vidējs (Q2)' },
  { val: 'tievs',  label: 'Tievs (Q3)'  },
  { val: 'malka',  label: 'Malka'        },
];

const DEFAULT_GARUMI = { P:5, E:5, B:4, A:4, Ba:2.5, Bl:4, Oz:5, Os:5 };

// ─── Krāsu paletes ────────────────────────────────────────────────────────────
const C = {
  bg:       '#080f08',
  card:     '#111f11',
  inner:    '#1a2e1a',
  deep:     '#0f1a0f',
  border:   '#2d4a2d',
  text:     '#e8f5e9',
  textSec:  '#a8d8a8',
  textMut:  '#7ab87a',
  textDim:  '#557a55',
  accent:   '#4caf50',
  accentDk: '#225522',
  warn:     '#fbbf24',
  warnBg:   '#1a1a08',
  error:    '#e57373',
}

const inp = {
  background: C.deep,
  border: `1px solid ${C.border}`,
  color: C.text,
  borderRadius: 6,
  padding: '8px 10px',
  fontSize: 14,
  width: '100%',
  boxSizing: 'border-box',
  outline: 'none',
}

// ─── Suga toggle ──────────────────────────────────────────────────────────────
function SugaToggle({ value, onChange }) {
  return (
    <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
      {SUGAS_SARAKSTS.map(s => (
        <button key={s} onClick={() => onChange(s)} style={{
          padding:'9px 16px',
          borderRadius: 8,
          fontSize: 15,
          fontWeight: value === s ? 700 : 400,
          border: value === s ? `2px solid ${C.accent}` : `1px solid ${C.border}`,
          background: value === s ? C.accentDk : C.inner,
          color: value === s ? '#fff' : C.textSec,
          cursor: 'pointer',
          minWidth: 44,
        }}>
          {s}
        </button>
      ))}
    </div>
  );
}

// ─── Kvalitāte toggle ────────────────────────────────────────────────────────
function KvalToggle({ value, onChange }) {
  const krasa = { resns: C.accent, vidējs: '#81c784', tievs: C.warn, malka: C.error };
  return (
    <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
      {KVALITATES.map(k => (
        <button key={k.val} onClick={() => onChange(k.val)} style={{
          padding:'9px 14px',
          borderRadius: 8,
          fontSize: 13,
          fontWeight: value === k.val ? 700 : 400,
          border: value === k.val ? `2px solid ${krasa[k.val]}` : `1px solid ${C.border}`,
          background: value === k.val ? `${krasa[k.val]}22` : C.inner,
          color: value === k.val ? krasa[k.val] : C.textSec,
          cursor: 'pointer',
        }}>
          {k.label}
        </button>
      ))}
    </div>
  );
}

// ─── StatCard ─────────────────────────────────────────────────────────────────
function StatCard({ label, value, unit, warn }) {
  return (
    <div style={{
      background: C.card,
      border: `1px solid ${C.border}`,
      borderRadius: 8,
      padding: '10px 12px',
    }}>
      <div style={{ fontSize:10, color: C.textDim, textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:4 }}>
        {label}
      </div>
      <div style={{ fontSize:20, fontWeight:600, color: warn ? C.warn : C.accent, lineHeight:1.1 }}>
        {value}
        <span style={{ fontSize:12, fontWeight:400, color: C.textMut, marginLeft:4 }}>{unit}</span>
      </div>
    </div>
  );
}

// ─── Header ar atpakaļ pogu ───────────────────────────────────────────────────
function Header({ title, subtitle, onBack, extra }) {
  return (
    <div style={{
      background: '#1b3a1b',
      borderBottom: `2px solid ${C.accent}`,
      padding: '12px 16px',
      display: 'flex',
      alignItems: 'center',
      gap: 10,
    }}>
      {onBack && (
        <button onClick={onBack} style={{
          background:'none', border:'none', color: C.accent,
          fontSize:22, cursor:'pointer', padding:'0 4px 0 0', lineHeight:1,
        }}>←</button>
      )}
      <div style={{ flex:1 }}>
        <div style={{ color: C.accent, fontSize:16, fontWeight:700 }}>{title}</div>
        {subtitle && <div style={{ color: C.textMut, fontSize:11, marginTop:1 }}>{subtitle}</div>}
      </div>
      {extra}
    </div>
  );
}

// ─── Sekcijas kartīte ─────────────────────────────────────────────────────────
function Karte({ children, style }) {
  return (
    <div style={{
      background: C.card,
      border: `1px solid ${C.border}`,
      borderRadius: 10,
      padding: '14px 16px',
      marginBottom: 12,
      ...style,
    }}>
      {children}
    </div>
  );
}

// ─── Galvenā komponente ───────────────────────────────────────────────────────
export default function DastojumsMeritajsPage({ onBack }) {
  const [faze,     setFaze]     = useState('setup');
  const [kadastrs, setKadastrs] = useState('');
  const [platiba,  setPlatiba]  = useState('');
  const [bon,      setBon]      = useState(3);
  const [garumi,   setGarumi]   = useState({ ...DEFAULT_GARUMI });

  const [koki,     setKoki]     = useState([]);
  const [d,        setD]        = useState('');
  const [suga,     setSuga]     = useState('E');
  const [kval,     setKval]     = useState('vidējs');
  const [nogabals, setNogabals] = useState('');
  const [skaits,   setSkaits]   = useState(1);

  const rezultats = useMemo(() => {
    if (koki.length === 0) return null;
    return apstraadaKokus(koki, garumi);
  }, [koki, garumi]);

  function pievienotKoku() {
    const dNum = parseFloat(d);
    if (!dNum || dNum < 4 || dNum > 120) return;
    setKoki(prev => [...prev, {
      id: Date.now() + Math.random(),
      suga, d_cm: dNum, kvalitate: kval,
      bon: parseInt(bon), nogabals: nogabals || '—',
      skaits: parseInt(skaits) || 1,
    }]);
    setD('');
    setSkaits(1);
  }

  function dzestKoku(id) { setKoki(prev => prev.filter(k => k.id !== id)); }

  const ks          = rezultats?.kopsavilkums;
  const kopiSkaits  = koki.reduce((s, k) => s + (k.skaits ?? 1), 0);
  const dLabi       = d && parseFloat(d) >= 4;

  const labelSt = { fontSize:12, color: C.textDim, display:'block', marginBottom:5, fontWeight:500 };

  // ── SETUP ─────────────────────────────────────────────────────────────────
  if (faze === 'setup') return (
    <div style={{ minHeight:'100vh', background: C.bg, color: C.text, fontFamily:'Arial,sans-serif' }}>
      <Header
        title="🌲 Dastojuma uzmērīšana"
        subtitle="Cirsmas dati un sortimenta garumi"
        onBack={onBack}
      />

      <div style={{ maxWidth:540, margin:'0 auto', padding:'16px 16px 60px' }}>

        <Karte>
          <div style={{ marginBottom:12 }}>
            <label style={labelSt}>Kadastra nr. (nav obligāts)</label>
            <input value={kadastrs} onChange={e => setKadastrs(e.target.value)}
              placeholder="piem. 42820040063" style={inp} />
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
            <div>
              <label style={labelSt}>Platība (ha)</label>
              <input type="number" value={platiba} onChange={e => setPlatiba(e.target.value)}
                placeholder="piem. 3.5" style={inp} />
            </div>
            <div>
              <label style={labelSt}>Bonitāte (1–5)</label>
              <select value={bon} onChange={e => setBon(e.target.value)} style={inp}>
                {[1,2,3,4,5].map(b => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>
          </div>
        </Karte>

        <Karte>
          <div style={{ fontSize:13, fontWeight:600, color: C.textSec, marginBottom:10 }}>
            Sortimenta garumi (m) pa sugām
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
            {SUGAS_SARAKSTS.map(s => (
              <div key={s} style={{ display:'flex', alignItems:'center', gap:8 }}>
                <span style={{ fontSize:14, fontWeight:700, color: C.accent, width:28, textAlign:'center' }}>{s}</span>
                <input type="number" min="1" max="10" step="0.5"
                  value={garumi[s] ?? 4}
                  onChange={e => setGarumi(prev => ({ ...prev, [s]: parseFloat(e.target.value) }))}
                  style={{ ...inp, flex:1, width:'auto', textAlign:'center', fontSize:15, fontWeight:600 }} />
                <span style={{ fontSize:12, color: C.textDim, width:14 }}>m</span>
              </div>
            ))}
          </div>
        </Karte>

        <button onClick={() => setFaze('merisana')} style={{
          width:'100%', padding:'14px 0', borderRadius:10, border:'none',
          background: C.accentDk, color:'#fff', fontSize:16, fontWeight:600, cursor:'pointer',
          borderTop: `2px solid ${C.accent}`,
        }}>
          Sākt mērīšanu →
        </button>
      </div>
    </div>
  );

  // ── MĒRĪŠANA ──────────────────────────────────────────────────────────────
  if (faze === 'merisana') return (
    <div style={{ minHeight:'100vh', background: C.bg, color: C.text, fontFamily:'Arial,sans-serif' }}>
      <Header
        title="🌲 Koku ievade"
        subtitle={kopiSkaits > 0 ? `${kopiSkaits} koki ievadīti` : 'Sāc ievadīt kokus'}
        onBack={() => setFaze('setup')}
        extra={
          ks && (
            <div style={{
              background: '#0a2a0a', border: `1px solid ${C.border}`,
              borderRadius: 8, padding:'6px 12px', fontSize:12, color: C.accent,
              display:'flex', gap:12,
            }}>
              <span><b>{ks.kopBruto}</b> m³</span>
              <span style={{ color: C.textDim }}>|</span>
              <span style={{ color: '#81c784' }}><b>{ks.kopLikvida}</b> likvid</span>
              {ks.otrsStavsSkaits > 0 && <span style={{ color: C.warn }}>⚠ {ks.otrsStavsSkaits}</span>}
            </div>
          )
        }
      />

      <div style={{ maxWidth:540, margin:'0 auto', padding:'16px 16px 80px' }}>

        {/* Ievades forma */}
        <Karte>
          <div style={{ marginBottom:14 }}>
            <label style={labelSt}>Suga</label>
            <SugaToggle value={suga} onChange={setSuga} />
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:14 }}>
            <div>
              <label style={labelSt}>D 1.3 (cm)</label>
              <input
                type="number" inputMode="decimal" min="4" max="120" step="1"
                value={d} onChange={e => setD(e.target.value)}
                placeholder="piem. 24"
                onKeyDown={e => { if (e.key === 'Enter') pievienotKoku(); }}
                autoFocus
                style={{
                  ...inp,
                  fontSize: 28,
                  fontWeight: 700,
                  textAlign: 'center',
                  color: dLabi ? C.accent : C.text,
                  border: `2px solid ${dLabi ? C.accent : C.border}`,
                  padding: '10px',
                }}
              />
            </div>
            <div>
              <label style={labelSt}>Skaits</label>
              <input
                type="number" min="1" max="50" step="1"
                value={skaits} onChange={e => setSkaits(e.target.value)}
                style={{
                  ...inp,
                  fontSize: 28,
                  fontWeight: 700,
                  textAlign: 'center',
                  padding: '10px',
                }}
              />
            </div>
          </div>

          <div style={{ marginBottom:14 }}>
            <label style={labelSt}>Kvalitāte</label>
            <KvalToggle value={kval} onChange={setKval} />
          </div>

          <div style={{ marginBottom:14 }}>
            <label style={labelSt}>Nogabals (pēc izvēles)</label>
            <input value={nogabals} onChange={e => setNogabals(e.target.value)}
              placeholder="piem. 1a" style={inp} />
          </div>

          <button onClick={pievienotKoku} disabled={!dLabi} style={{
            width:'100%', padding:'14px 0', borderRadius:8, border:'none',
            background: dLabi ? C.accentDk : C.inner,
            color: dLabi ? '#fff' : C.textDim,
            fontSize:16, fontWeight:600,
            cursor: dLabi ? 'pointer' : 'not-allowed',
            borderTop: dLabi ? `2px solid ${C.accent}` : `1px solid ${C.border}`,
            transition: 'all 0.15s',
          }}>
            + Pievienot koku
          </button>
        </Karte>

        {/* Koku saraksts */}
        {koki.length > 0 && (
          <Karte>
            <div style={{ fontSize:12, color: C.textDim, marginBottom:8, fontWeight:500 }}>
              Ievadītie koki ({koki.length} ieraksti):
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:4, maxHeight:280, overflowY:'auto' }}>
              {[...koki].reverse().map(k => {
                const aprekKoks = rezultats?.koki.find(ak => ak.id === k.id);
                const ir2stavs = aprekKoks?.otrsStavs;
                return (
                  <div key={k.id} style={{
                    display:'flex', alignItems:'center', gap:8,
                    background: ir2stavs ? C.warnBg : C.inner,
                    border: `1px solid ${ir2stavs ? '#4a3a08' : C.border}`,
                    borderRadius: 7,
                    padding: '8px 10px',
                    fontSize: 13,
                  }}>
                    <span style={{ fontWeight:700, color: C.accent, minWidth:24 }}>{k.suga}</span>
                    <span style={{ fontWeight:600, color: C.text, minWidth:36 }}>{k.d_cm}cm</span>
                    <span style={{ color: C.textDim, fontSize:11 }}>{k.kvalitate}</span>
                    {k.skaits > 1 && (
                      <span style={{ color: C.textSec, fontSize:12, background: '#0a2a0a', padding:'1px 6px', borderRadius:4 }}>×{k.skaits}</span>
                    )}
                    {k.nogabals !== '—' && (
                      <span style={{ color: C.textDim, fontSize:11 }}>#{k.nogabals}</span>
                    )}
                    {ir2stavs && (
                      <span style={{ fontSize:11, color: C.warn, fontWeight:600 }}>2.stāvs</span>
                    )}
                    {aprekKoks && (
                      <span style={{ fontSize:12, color: C.textSec, marginLeft:'auto', fontWeight:600 }}>
                        {aprekKoks.likvidV.toFixed(3)} m³
                      </span>
                    )}
                    <button onClick={() => dzestKoku(k.id)} style={{
                      background:'none', border:'none', color: C.error,
                      cursor:'pointer', fontSize:18, padding:'0 2px', lineHeight:1,
                    }}>×</button>
                  </div>
                );
              })}
            </div>
          </Karte>
        )}

        {/* Navigācija apakšā */}
        <div style={{ display:'flex', gap:8 }}>
          <button onClick={() => setFaze('setup')} style={{
            flex:1, padding:'12px 0', borderRadius:8,
            border: `1px solid ${C.border}`,
            background: C.inner, color: C.textSec,
            fontSize:13, cursor:'pointer',
          }}>
            ← Atpakaļ
          </button>
          <button onClick={() => setFaze('rezultats')} disabled={koki.length === 0} style={{
            flex:3, padding:'12px 0', borderRadius:8, border:'none',
            background: koki.length > 0 ? C.accentDk : C.inner,
            color: koki.length > 0 ? '#fff' : C.textDim,
            fontSize:14, fontWeight:600,
            cursor: koki.length > 0 ? 'pointer' : 'not-allowed',
            borderTop: koki.length > 0 ? `2px solid ${C.accent}` : `1px solid ${C.border}`,
          }}>
            Rezultāts → ({kopiSkaits} koki)
          </button>
        </div>
      </div>
    </div>
  );

  // ── REZULTĀTS ─────────────────────────────────────────────────────────────
  if (faze === 'rezultats' && ks) {
    const sortLabels = {
      balkis:    'Baļķis / Zāģbaļķis',
      snikbalkis:'Sīkbaļķis',
      finieris:  'Finieris (B)',
      tara:      'Tara (Ba 2.5m)',
      papirmalka:'Papīrmalka',
      malka:     'Malka',
    };
    const sortKrasa = {
      balkis:'#4caf50', snikbalkis:'#81c784', finieris:'#42a5f5',
      tara:'#ce93d8', papirmalka:'#ffb74d', malka:'#e57373',
    };

    return (
      <div style={{ minHeight:'100vh', background: C.bg, color: C.text, fontFamily:'Arial,sans-serif' }}>
        <Header
          title="🌲 Dastojuma rezultāts"
          subtitle={kadastrs ? `${kadastrs}${platiba ? ` · ${platiba} ha` : ''}` : undefined}
          onBack={() => setFaze('merisana')}
        />

        <div style={{ maxWidth:540, margin:'0 auto', padding:'16px 16px 80px' }}>

          {/* Galvenie rādītāji */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:8, marginBottom:12 }}>
            <StatCard label="Koki"         value={ks.kopaSkaits}  unit="gab." />
            <StatCard label="Kopējā krāja" value={ks.kopBruto}    unit="m³" />
            <StatCard label="Likvidā krāja"value={ks.kopLikvida}  unit="m³" />
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:12 }}>
            <StatCard label="Atliekas"    value={`${ks.atliProcVid}%`} unit={`${ks.kopAtliekas} m³`} />
            <StatCard label="2. stāvs"    value={ks.otrsStavsSkaits}    unit="koki" warn={ks.otrsStavsSkaits > 0} />
          </div>

          {/* Sortimenti */}
          <Karte>
            <div style={{ fontSize:13, fontWeight:700, color: C.textSec, marginBottom:10 }}>
              Sortimentu sadalījums
            </div>
            {Object.entries(ks.sortimenti)
              .filter(([, v]) => v > 0)
              .sort(([,a],[,b]) => b - a)
              .map(([sort, v]) => (
                <div key={sort} style={{
                  display:'flex', justifyContent:'space-between', alignItems:'center',
                  padding:'8px 0',
                  borderBottom: `1px solid ${C.border}`,
                }}>
                  <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                    <div style={{ width:10, height:10, borderRadius:'50%', background: sortKrasa[sort] || C.accent }} />
                    <span style={{ fontSize:13, color: C.textSec }}>{sortLabels[sort]}</span>
                  </div>
                  <span style={{ fontSize:15, fontWeight:700, color: sortKrasa[sort] || C.text }}>
                    {v} m³
                  </span>
                </div>
              ))}
          </Karte>

          {/* Pa sugām */}
          <Karte>
            <div style={{ fontSize:13, fontWeight:700, color: C.textSec, marginBottom:10 }}>
              Pa sugām
            </div>
            {Object.entries(ks.paSugam).map(([sg, dat]) => (
              <div key={sg} style={{ padding:'8px 0', borderBottom: `1px solid ${C.border}` }}>
                <div style={{ display:'flex', justifyContent:'space-between', fontSize:13 }}>
                  <span style={{ fontWeight:700, color: C.accent }}>{sg}</span>
                  <span style={{ color: C.text }}>{SUGAS[sg]}</span>
                  <span style={{ color: C.textSec }}>{dat.skaits} koki</span>
                </div>
                <div style={{ display:'flex', gap:16, fontSize:12, color: C.textDim, marginTop:3 }}>
                  <span>bruto <b style={{ color: C.textSec }}>{dat.brutV}</b> m³</span>
                  <span>likvid <b style={{ color: C.accent }}>{dat.likvidV}</b> m³</span>
                  {dat.otrsStavsSkaits > 0 && (
                    <span style={{ color: C.warn }}>2.stāvs: {dat.otrsStavsSkaits}</span>
                  )}
                </div>
              </div>
            ))}
          </Karte>

          {/* Pa nogabaliem */}
          {Object.keys(ks.paNogabaliem).length > 1 && (
            <Karte>
              <div style={{ fontSize:13, fontWeight:700, color: C.textSec, marginBottom:10 }}>
                Pa nogabaliem
              </div>
              {Object.entries(ks.paNogabaliem).map(([n, dat]) => (
                <div key={n} style={{
                  display:'flex', justifyContent:'space-between',
                  padding:'7px 0', borderBottom: `1px solid ${C.border}`,
                  fontSize:13,
                }}>
                  <span style={{ color: C.textSec }}>Nogabals <b style={{ color: C.text }}>{n}</b></span>
                  <span style={{ color: C.accent, fontWeight:600 }}>
                    {dat.skaits} koki · {dat.likvidV} m³
                  </span>
                </div>
              ))}
            </Karte>
          )}

          {/* Pogas */}
          <div style={{ display:'flex', gap:8 }}>
            <button onClick={() => setFaze('merisana')} style={{
              flex:1, padding:'13px 0', borderRadius:8,
              border: `1px solid ${C.border}`,
              background: C.inner, color: C.textSec,
              fontSize:13, cursor:'pointer',
            }}>
              ← Turpināt
            </button>
            <button onClick={() => {
              const txt = formatKopsavilkums(ks, { kadastrs, platiba });
              const a = Object.assign(document.createElement('a'), {
                href: URL.createObjectURL(new Blob([txt], { type:'text/plain' })),
                download: `dastojums_${new Date().toISOString().slice(0,10)}.txt`,
              });
              a.click();
            }} style={{
              flex:2, padding:'13px 0', borderRadius:8, border:'none',
              background: C.accentDk, color:'#fff',
              fontSize:14, fontWeight:600, cursor:'pointer',
              borderTop: `2px solid ${C.accent}`,
            }}>
              💾 Saglabāt .txt
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
