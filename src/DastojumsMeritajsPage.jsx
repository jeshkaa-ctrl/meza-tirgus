import { useState, useMemo } from 'react';
import { sadaliKvalitates, SUGAS } from './engines/dastojumsMeritajsEngine';

// ─── Konstantes ───────────────────────────────────────────────────────────────
const SUGAS_SARAKSTS = ['P','E','B','A','Ba','Bl','Oz','Os'];
const KVALITATES = [
  { val: 'resns',  label: 'Resns (Q1)'  },
  { val: 'vidējs', label: 'Vidējs (Q2)' },
  { val: 'tievs',  label: 'Tievs (Q3)'  },
  { val: 'malka',  label: 'Malka'        },
];
const DEFAULT_GARUMI = { P:5, E:5, B:4, A:4, Ba:2.5, Bl:4, Oz:5, Os:5 };

// ─── Krāsas ───────────────────────────────────────────────────────────────────
const C = {
  bg:'#080f08', card:'#111f11', inner:'#1a2e1a', deep:'#0f1a0f',
  border:'#2d4a2d', text:'#e8f5e9', textSec:'#a8d8a8', textMut:'#7ab87a',
  textDim:'#557a55', accent:'#4caf50', accentDk:'#225522',
  warn:'#fbbf24', warnBg:'#1a1a08', error:'#e57373',
}
const inp = {
  background:C.deep, border:`1px solid ${C.border}`, color:C.text,
  borderRadius:6, padding:'8px 10px', fontSize:14,
  width:'100%', boxSizing:'border-box', outline:'none',
}

// ─── Palīgkomponentes ─────────────────────────────────────────────────────────
function Header({ title, subtitle, onBack, extra }) {
  return (
    <div style={{ background:'#1b3a1b', borderBottom:`2px solid ${C.accent}`, padding:'12px 16px', display:'flex', alignItems:'center', gap:10 }}>
      {onBack && <button onClick={onBack} style={{ background:'none', border:'none', color:C.accent, fontSize:22, cursor:'pointer', padding:'0 4px 0 0', lineHeight:1 }}>←</button>}
      <div style={{ flex:1 }}>
        <div style={{ color:C.accent, fontSize:16, fontWeight:700 }}>{title}</div>
        {subtitle && <div style={{ color:C.textMut, fontSize:11, marginTop:1 }}>{subtitle}</div>}
      </div>
      {extra}
    </div>
  );
}

function Karte({ children, style }) {
  return (
    <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:10, padding:'14px 16px', marginBottom:12, ...style }}>
      {children}
    </div>
  );
}

function SugaToggle({ value, onChange }) {
  return (
    <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
      {SUGAS_SARAKSTS.map(s => (
        <button key={s} onClick={() => onChange(s)} style={{
          padding:'9px 16px', borderRadius:8, fontSize:15, fontWeight:value===s?700:400,
          border:value===s?`2px solid ${C.accent}`:`1px solid ${C.border}`,
          background:value===s?C.accentDk:C.inner, color:value===s?'#fff':C.textSec,
          cursor:'pointer', minWidth:44,
        }}>{s}</button>
      ))}
    </div>
  );
}

function KvalToggle({ value, onChange }) {
  const kr = { resns:C.accent, vidējs:'#81c784', tievs:C.warn, malka:C.error };
  return (
    <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
      {KVALITATES.map(k => (
        <button key={k.val} onClick={() => onChange(k.val)} style={{
          padding:'9px 14px', borderRadius:8, fontSize:13, fontWeight:value===k.val?700:400,
          border:value===k.val?`2px solid ${kr[k.val]}`:`1px solid ${C.border}`,
          background:value===k.val?`${kr[k.val]}22`:C.inner, color:value===k.val?kr[k.val]:C.textSec,
          cursor:'pointer',
        }}>{k.label}</button>
      ))}
    </div>
  );
}

const labelSt = { fontSize:12, color:'#557a55', display:'block', marginBottom:5, fontWeight:500 };
const btnPrimary = {
  width:'100%', padding:'14px 0', borderRadius:10, border:'none',
  background:C.accentDk, color:'#fff', fontSize:16, fontWeight:600,
  cursor:'pointer', borderTop:`2px solid ${C.accent}`,
};

// ─── GALVENĀ KOMPONENTE ───────────────────────────────────────────────────────
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

  // Fāze 2b — augstumi
  const [sugaH, setSugaH] = useState({});

  // Uzmērītās sugas (unikālas)
  const uzmSugas = useMemo(() =>
    [...new Set(koki.map(k => k.suga))].filter(s => SUGAS_SARAKSTS.includes(s)),
    [koki]
  );

  // Rezultāts
  const rezultats = useMemo(() => {
    if (koki.length === 0 || Object.keys(sugaH).length === 0) return null;
    return sadaliKvalitates(koki, sugaH);
  }, [koki, sugaH]);

  function pievienotKoku() {
    const dNum = parseFloat(d);
    if (!dNum || dNum < 4 || dNum > 120) return;
    setKoki(prev => [...prev, {
      id: Date.now() + Math.random(),
      suga, d_cm: dNum, kvalitate: kval,
      bon: parseInt(bon), nogabals: nogabals || '—',
      skaits: parseInt(skaits) || 1,
    }]);
    setD(''); setSkaits(1);
  }

  function dzestKoku(id) { setKoki(prev => prev.filter(k => k.id !== id)); }

  const kopaSkaits = koki.reduce((s, k) => s + (k.skaits ?? 1), 0);
  const dLabi = d && parseFloat(d) >= 4;

  // ═══════════════════════════════════════════════════════════════════════════
  // FĀZE 1 — SETUP
  // ═══════════════════════════════════════════════════════════════════════════
  if (faze === 'setup') return (
    <div style={{ minHeight:'100vh', background:C.bg, color:C.text, fontFamily:'Arial,sans-serif' }}>
      <Header title="🌲 Dastojuma uzmērīšana" subtitle="Cirsmas pamatdati" onBack={onBack} />
      <div style={{ maxWidth:540, margin:'0 auto', padding:'16px 16px 60px' }}>

        <Karte>
          <div style={{ marginBottom:12 }}>
            <label style={labelSt}>Kadastra nr. (nav obligāts)</label>
            <input value={kadastrs} onChange={e => setKadastrs(e.target.value)} placeholder="piem. 42820040063" style={inp} />
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
            <div>
              <label style={labelSt}>Platība (ha)</label>
              <input type="number" value={platiba} onChange={e => setPlatiba(e.target.value)} placeholder="piem. 3.5" style={inp} />
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
          <div style={{ fontSize:13, fontWeight:600, color:C.textSec, marginBottom:10 }}>
            Sortimenta garumi (m) pa sugām
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
            {SUGAS_SARAKSTS.map(s => (
              <div key={s} style={{ display:'flex', alignItems:'center', gap:8 }}>
                <span style={{ fontSize:14, fontWeight:700, color:C.accent, width:28, textAlign:'center' }}>{s}</span>
                <input type="number" min="1" max="10" step="0.5"
                  value={garumi[s] ?? 4}
                  onChange={e => setGarumi(prev => ({ ...prev, [s]: parseFloat(e.target.value) }))}
                  style={{ ...inp, flex:1, width:'auto', textAlign:'center', fontSize:15, fontWeight:600 }} />
                <span style={{ fontSize:12, color:C.textDim, width:14 }}>m</span>
              </div>
            ))}
          </div>
        </Karte>

        <button onClick={() => setFaze('merisana')} style={btnPrimary}>
          Sākt mērīšanu →
        </button>
      </div>
    </div>
  );

  // ═══════════════════════════════════════════════════════════════════════════
  // FĀZE 2 — MĒRĪŠANA
  // ═══════════════════════════════════════════════════════════════════════════
  if (faze === 'merisana') return (
    <div style={{ minHeight:'100vh', background:C.bg, color:C.text, fontFamily:'Arial,sans-serif' }}>
      <Header
        title="🌲 Koku ievade"
        subtitle={kopaSkaits > 0 ? `${kopaSkaits} koki ievadīti` : 'Ievadi pirmo koku'}
        onBack={() => setFaze('setup')}
        extra={kopaSkaits > 0 && (
          <div style={{ background:'#0a2a0a', border:`1px solid ${C.border}`, borderRadius:8, padding:'5px 10px', fontSize:12, color:C.accent }}>
            {kopaSkaits} koki
          </div>
        )}
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
                  ...inp, fontSize:28, fontWeight:700, textAlign:'center', padding:'10px',
                  color:dLabi?C.accent:C.text, border:`2px solid ${dLabi?C.accent:C.border}`,
                }}
              />
            </div>
            <div>
              <label style={labelSt}>Skaits</label>
              <input
                type="number" min="1" max="50" step="1"
                value={skaits} onChange={e => setSkaits(e.target.value)}
                style={{ ...inp, fontSize:28, fontWeight:700, textAlign:'center', padding:'10px' }}
              />
            </div>
          </div>

          <div style={{ marginBottom:14 }}>
            <label style={labelSt}>Kvalitāte</label>
            <KvalToggle value={kval} onChange={setKval} />
          </div>

          <div style={{ marginBottom:14 }}>
            <label style={labelSt}>Nogabals (pēc izvēles)</label>
            <input value={nogabals} onChange={e => setNogabals(e.target.value)} placeholder="piem. 1a" style={inp} />
          </div>

          <button onClick={pievienotKoku} disabled={!dLabi} style={{
            ...btnPrimary,
            background:dLabi?C.accentDk:C.inner,
            color:dLabi?'#fff':C.textDim,
            borderTop:dLabi?`2px solid ${C.accent}`:`1px solid ${C.border}`,
            cursor:dLabi?'pointer':'not-allowed',
          }}>
            + Pievienot koku
          </button>
        </Karte>

        {/* Koku saraksts */}
        {koki.length > 0 && (
          <Karte>
            <div style={{ fontSize:12, color:C.textDim, marginBottom:8, fontWeight:500 }}>
              Ievadītie koki ({koki.length} ieraksti):
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:4, maxHeight:300, overflowY:'auto' }}>
              {[...koki].reverse().map(k => (
                <div key={k.id} style={{
                  display:'flex', alignItems:'center', gap:8,
                  background:C.inner, border:`1px solid ${C.border}`,
                  borderRadius:7, padding:'8px 10px', fontSize:13,
                }}>
                  <span style={{ fontWeight:700, color:C.accent, minWidth:24 }}>{k.suga}</span>
                  <span style={{ fontWeight:600, color:C.text, minWidth:36 }}>{k.d_cm}cm</span>
                  <span style={{ color:C.textDim, fontSize:11 }}>{k.kvalitate}</span>
                  {k.skaits > 1 && <span style={{ color:C.textSec, fontSize:12, background:'#0a2a0a', padding:'1px 6px', borderRadius:4 }}>×{k.skaits}</span>}
                  {k.nogabals !== '—' && <span style={{ color:C.textDim, fontSize:11 }}>#{k.nogabals}</span>}
                  <span style={{ marginLeft:'auto' }} />
                  <button onClick={() => dzestKoku(k.id)} style={{ background:'none', border:'none', color:C.error, cursor:'pointer', fontSize:18, padding:'0 2px', lineHeight:1 }}>×</button>
                </div>
              ))}
            </div>
          </Karte>
        )}

        <button
          onClick={() => { setSugaH({}); setFaze('augstumi'); }}
          disabled={koki.length === 0}
          style={{
            ...btnPrimary,
            background:koki.length>0?C.accentDk:C.inner,
            color:koki.length>0?'#fff':C.textDim,
            borderTop:koki.length>0?`2px solid ${C.accent}`:`1px solid ${C.border}`,
            cursor:koki.length>0?'pointer':'not-allowed',
          }}
        >
          Beigt mērīšanu → ({kopaSkaits} koki)
        </button>
      </div>
    </div>
  );

  // ═══════════════════════════════════════════════════════════════════════════
  // FĀZE 2b — AUGSTUMI
  // ═══════════════════════════════════════════════════════════════════════════
  if (faze === 'augstumi') {
    const visiIevaditi = uzmSugas.every(s => sugaH[s] && parseFloat(sugaH[s]) > 0);
    return (
      <div style={{ minHeight:'100vh', background:C.bg, color:C.text, fontFamily:'Arial,sans-serif' }}>
        <Header
          title="📏 Vidējie augstumi"
          subtitle="Ievadi uzmērīto sugu vidējos augstumus"
          onBack={() => setFaze('merisana')}
        />
        <div style={{ maxWidth:540, margin:'0 auto', padding:'16px 16px 60px' }}>

          <div style={{ fontSize:13, color:C.textSec, padding:'10px 14px', background:'#0a2a0a', border:`1px solid ${C.border}`, borderRadius:8, marginBottom:16 }}>
            Izmēri vidējo augstumu katrai sugai laukā ar augstumamēru vai Bitterlich metodi.
          </div>

          <Karte>
            {uzmSugas.map(s => {
              const kokuSkaits = koki.filter(k => k.suga === s).reduce((sum, k) => sum + (k.skaits ?? 1), 0);
              return (
                <div key={s} style={{ display:'flex', alignItems:'center', gap:12, marginBottom:14 }}>
                  <div style={{ minWidth:48 }}>
                    <div style={{ fontSize:18, fontWeight:700, color:C.accent }}>{s}</div>
                    <div style={{ fontSize:10, color:C.textDim }}>{kokuSkaits} koki</div>
                  </div>
                  <div style={{ flex:1 }}>
                    <input
                      type="number" inputMode="decimal" min="2" max="50" step="0.5"
                      placeholder="piem. 22.5"
                      value={sugaH[s] || ''}
                      onChange={e => setSugaH(prev => ({ ...prev, [s]: e.target.value }))}
                      style={{
                        ...inp, fontSize:22, fontWeight:600, textAlign:'center',
                        color: sugaH[s] ? C.accent : C.text,
                        border:`2px solid ${sugaH[s] ? C.accent : C.border}`,
                      }}
                    />
                  </div>
                  <div style={{ fontSize:13, color:C.textDim, minWidth:16 }}>m</div>
                </div>
              );
            })}
          </Karte>

          <button
            onClick={() => setFaze('rezultats')}
            disabled={!visiIevaditi}
            style={{
              ...btnPrimary,
              background:visiIevaditi?C.accentDk:C.inner,
              color:visiIevaditi?'#fff':C.textDim,
              borderTop:visiIevaditi?`2px solid ${C.accent}`:`1px solid ${C.border}`,
              cursor:visiIevaditi?'pointer':'not-allowed',
            }}
          >
            Aprēķināt →
          </button>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // FĀZE 3 — REZULTĀTS (VMD standarta tabula)
  // ═══════════════════════════════════════════════════════════════════════════
  if (faze === 'rezultats' && rezultats) {
    const { paSugam, kopa } = rezultats;
    const datums = new Date().toLocaleDateString('lv-LV');

    const th = {
      background:'#1b4a1b', color:C.textSec, padding:'6px 8px',
      fontSize:10, fontWeight:700, textAlign:'right', whiteSpace:'nowrap',
      border:`1px solid ${C.border}`,
    };
    const tdSt = (bold, color) => ({
      padding:'6px 8px', fontSize:12, textAlign:'right',
      color: color || (bold ? C.text : C.textSec),
      fontWeight: bold ? 700 : 400,
      border:`1px solid ${C.border}`,
      background: bold ? '#0a2a0a' : C.card,
    });

    const eksportPDF = () => {
      const sugasRindas = Object.entries(paSugam).map(([sg, d]) => `
        <tr>
          <td>${sg} — ${SUGAS[sg] || sg}</td>
          <td class="r">${d.skaits}</td>
          <td class="r">${d.brutV}</td>
          <td class="r">${d.lietkoksneV}</td>
          <td class="r">${d.resnaV}</td>
          <td class="r">${d.vidaV}</td>
          <td class="r">${d.tievaV}</td>
          <td class="r">0</td>
          <td class="r">${d.malkaV}</td>
          <td class="r">${d.atliV}</td>
          <td class="r">${d.pardosanaiV}</td>
          <td class="r">${d.videjaKoks}</td>
        </tr>`).join('');

      const html = `<html><head><meta charset="UTF-8"><style>
body{font-family:Arial,sans-serif;font-size:11px;padding:20px;color:#111}
h2{color:#225522;margin:0 0 4px}
p{margin:2px 0;font-size:10px;color:#555}
table{border-collapse:collapse;width:100%;margin-top:14px;font-size:10px}
th{background:#225522;color:white;padding:5px 6px;text-align:right;white-space:nowrap}
th:first-child{text-align:left}
td{border:1px solid #ccc;padding:4px 6px}
td.r{text-align:right}
.kopas td{background:#e8f5e9;font-weight:bold}
.kopas td:first-child{text-align:left}
.zem{margin-top:16px;font-size:11px}
.paraksts{display:flex;gap:60px;margin-top:28px;font-size:11px}
</style></head><body>
<h2>🌲 MEŽA TIRGUS — Dastojuma uzmērīšanas pārskats</h2>
<p>Kadastra nr.: <b>${kadastrs || '—'}</b> &nbsp;|&nbsp; Platība: <b>${platiba || '—'} ha</b> &nbsp;|&nbsp; Datums: <b>${datums}</b></p>
<table>
  <thead><tr>
    <th style="text-align:left">Suga</th>
    <th>Koku skaits</th><th>Stumbra krāja m³</th>
    <th>Lietkoksne Kopā</th><th>Resnā</th><th>Vidējā</th><th>Tievā</th>
    <th>P.malka</th><th>Malka</th><th>Atlikumi</th>
    <th>Paredzēts pārdošanai</th><th>Vidējais koks m³</th>
  </tr></thead>
  <tbody>${sugasRindas}</tbody>
  <tfoot><tr class="kopas">
    <td>Kopā:</td>
    <td class="r">${kopa.skaits}</td><td class="r">${kopa.brutV}</td>
    <td class="r">${kopa.lietkoksneV}</td><td class="r">${kopa.resnaV}</td>
    <td class="r">${kopa.vidaV}</td><td class="r">${kopa.tievaV}</td>
    <td class="r">0</td><td class="r">${kopa.malkaV}</td><td class="r">${kopa.atliV}</td>
    <td class="r">${kopa.pardosanaiV}</td><td class="r">${kopa.videjaKoks}</td>
  </tr></tfoot>
</table>
<div class="zem">
  <p>Cirsmas krāja, m³: <b>${kopa.brutV}</b></p>
  <p>Cirsmas vērtība, €: _______________________</p>
</div>
<div class="paraksts">
  <div>Uzmērīja: _________________________</div>
  <div>Novērtēja: _________________________</div>
</div>
</body></html>`;
      const win = window.open('', '_blank');
      win.document.write(html);
      win.document.close();
      win.print();
    };

    return (
      <div style={{ minHeight:'100vh', background:C.bg, color:C.text, fontFamily:'Arial,sans-serif' }}>
        <Header
          title="🌲 Dastojuma pārskats"
          subtitle={kadastrs ? `${kadastrs}${platiba ? ` · ${platiba} ha` : ''}` : datums}
          onBack={() => setFaze('augstumi')}
        />
        <div style={{ maxWidth:'100%', padding:'16px 12px 80px', overflowX:'auto' }}>

          {/* VMD tabula */}
          <div style={{ overflowX:'auto', marginBottom:16 }}>
            <table style={{ borderCollapse:'collapse', minWidth:860, width:'100%' }}>
              <thead>
                <tr>
                  <th style={{ ...th, textAlign:'left' }}>Suga</th>
                  <th style={th}>Koku skaits</th>
                  <th style={th}>Stumbra krāja m³</th>
                  <th style={{ ...th, background:'#1a5a1a' }}>Lietkoksne Kopā</th>
                  <th style={th}>Resnā</th>
                  <th style={th}>Vidējā</th>
                  <th style={th}>Tievā</th>
                  <th style={{ ...th, color:C.textDim }}>P.malka</th>
                  <th style={th}>Malka</th>
                  <th style={{ ...th, color:'#e57373' }}>Atlikumi</th>
                  <th style={{ ...th, background:'#1a5a1a' }}>Paredzēts pārdošanai</th>
                  <th style={th}>Vid. koks m³</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(paSugam).map(([sg, d]) => (
                  <tr key={sg}>
                    <td style={{ ...tdSt(false), textAlign:'left', color:C.accent, fontWeight:700 }}>
                      {sg} <span style={{ color:C.textDim, fontWeight:400, fontSize:11 }}>— {SUGAS[sg] || sg}</span>
                    </td>
                    <td style={tdSt(false)}>{d.skaits}</td>
                    <td style={tdSt(false)}>{d.brutV}</td>
                    <td style={{ ...tdSt(false), color:C.accent, background:'#0a1f0a' }}>{d.lietkoksneV}</td>
                    <td style={tdSt(false)}>{d.resnaV}</td>
                    <td style={tdSt(false)}>{d.vidaV}</td>
                    <td style={tdSt(false)}>{d.tievaV}</td>
                    <td style={{ ...tdSt(false), color:C.textDim }}>0</td>
                    <td style={tdSt(false)}>{d.malkaV}</td>
                    <td style={{ ...tdSt(false), color:'#e57373' }}>{d.atliV}</td>
                    <td style={{ ...tdSt(false), color:C.accent, background:'#0a1f0a' }}>{d.pardosanaiV}</td>
                    <td style={tdSt(false)}>{d.videjaKoks}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td style={{ ...tdSt(true), textAlign:'left', color:C.accent }}>Kopā:</td>
                  <td style={tdSt(true)}>{kopa.skaits}</td>
                  <td style={tdSt(true)}>{kopa.brutV}</td>
                  <td style={{ ...tdSt(true), color:C.accent, background:'#0a2a0a' }}>{kopa.lietkoksneV}</td>
                  <td style={tdSt(true)}>{kopa.resnaV}</td>
                  <td style={tdSt(true)}>{kopa.vidaV}</td>
                  <td style={tdSt(true)}>{kopa.tievaV}</td>
                  <td style={{ ...tdSt(true), color:C.textDim }}>0</td>
                  <td style={tdSt(true)}>{kopa.malkaV}</td>
                  <td style={{ ...tdSt(true), color:'#e57373' }}>{kopa.atliV}</td>
                  <td style={{ ...tdSt(true), color:C.accent, background:'#0a2a0a' }}>{kopa.pardosanaiV}</td>
                  <td style={tdSt(true)}>{kopa.videjaKoks}</td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Kopsummas */}
          <Karte style={{ marginBottom:12 }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
              <span style={{ fontSize:13, color:C.textSec }}>Cirsmas krāja, m³:</span>
              <span style={{ fontSize:18, fontWeight:700, color:C.accent }}>{kopa.brutV} m³</span>
            </div>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <span style={{ fontSize:13, color:C.textSec }}>Cirsmas vērtība, €:</span>
              <span style={{ fontSize:14, color:C.textDim }}>_____________________</span>
            </div>
          </Karte>

          {/* Paraksti */}
          <Karte>
            <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
              <div style={{ fontSize:13, color:C.textSec }}>
                Uzmērīja: <span style={{ borderBottom:`1px solid ${C.border}`, display:'inline-block', width:200, marginLeft:8 }}> </span>
              </div>
              <div style={{ fontSize:13, color:C.textSec }}>
                Novērtēja: <span style={{ borderBottom:`1px solid ${C.border}`, display:'inline-block', width:196, marginLeft:8 }}> </span>
              </div>
            </div>
          </Karte>

          {/* Pogas */}
          <div style={{ display:'flex', gap:8 }}>
            <button onClick={() => setFaze('merisana')} style={{
              flex:1, padding:'13px 0', borderRadius:8,
              border:`1px solid ${C.border}`, background:C.inner, color:C.textSec,
              fontSize:13, cursor:'pointer',
            }}>
              ← Turpināt
            </button>
            <button onClick={eksportPDF} style={{ ...btnPrimary, flex:2, borderRadius:8 }}>
              🖨 Drukāt / PDF
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
