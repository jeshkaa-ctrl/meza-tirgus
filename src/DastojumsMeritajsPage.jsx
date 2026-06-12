import { useState, useMemo } from 'react';
import { sadaliKvalitates, SUGAS } from './engines/dastojumsMeritajsEngine';
import { PAGASTI } from './pagastiKoordinates';
import { C as DS, F, R, spinnerCSS } from './ds';

// ─── Konstantes ───────────────────────────────────────────────────────────────
const SUGAS_SARAKSTS = ['P','E','B','A','Ba','Bl','Oz','Os'];
const KVALITATES = [
  { val: 'resns',  label: 'Resns (Q1)'  },
  { val: 'vidējs', label: 'Vidējs (Q2)' },
  { val: 'tievs',  label: 'Tievs (Q3)'  },
  { val: 'malka',  label: 'Malka'        },
];

// ─── Kadastra → atrašanās vieta ──────────────────────────────────────────────
// Novads pēc kadastra pirmajiem 2 cipariem (aptuveni)
const KADASTRS_NOVADS = {
  '01':'Rīgas novads','11':'Rīga','17':'Jūrmala',
  '34':'Aizkraukles novads','36':'Alūksnes novads','38':'Balvu novads',
  '40':'Bauskas novads','42':'Cēsu novads','44':'Daugavpils novads',
  '46':'Dobeles novads','50':'Gulbenes novads','54':'Jelgavas novads',
  '56':'Jēkabpils novads','49':'Krāslavas novads','62':'Kuldīgas novads',
  '66':'Limbažu novads','64':'Liepājas novads','68':'Ludzas novads',
  '70':'Madonas novads','74':'Ogres novads','76':'Preiļu novads',
  '78':'Rēzeknes novads','84':'Saldus novads','94':'Smiltenes novads',
  '90':'Talsu novads','92':'Tukuma novads','95':'Valkas novads',
  '96':'Valmieras novads','98':'Ventspils novads','80':'Ādažu novads',
};
// Novads → Virsmežniecība
const NOVADS_VMN = {
  'Kurzemes':  ['Talsu novads','Kuldīgas novads','Liepājas novads','Saldus novads','Ventspils novads'],
  'Zemgales':  ['Jelgavas novads','Bauskas novads','Dobeles novads','Jēkabpils novads','Aizkraukles novads'],
  'Rīgas':     ['Rīgas novads','Rīga','Jūrmala','Ādažu novads','Ogres novads','Tukuma novads'],
  'Vidzemes':  ['Valmieras novads','Cēsu novads','Limbažu novads','Madonas novads','Gulbenes novads','Alūksnes novads','Valkas novads','Smiltenes novads'],
  'Latgales':  ['Daugavpils novads','Rēzeknes novads','Ludzas novads','Preiļu novads','Krāslavas novads','Balvu novads'],
};

function iegutVirsmeznieciba(novads) {
  for (const [vmn, saraksts] of Object.entries(NOVADS_VMN)) {
    if (saraksts.some(n => novads.includes(n.replace(' novads','')))) return vmn + ' VMŅ';
  }
  return '';
}

function autoAizpilditNoKadastrs(kadastra) {
  const tirs = kadastra.replace(/\s/g, '');
  if (tirs.length < 4) return {};
  const p4 = tirs.slice(0, 4);
  const p2 = tirs.slice(0, 2);
  const pagastaInfo = PAGASTI[p4];
  const novads = KADASTRS_NOVADS[p2] || '';
  return {
    pagasts: pagastaInfo?.nos || '',
    novads,
    virsmezn: iegutVirsmeznieciba(novads),
  };
}

// ─── Krāsas ───────────────────────────────────────────────────────────────────
const C = {
  bg:'#080f08', card:'#111f11', inner:'#1a2e1a', deep:'#0f1a0f',
  border:'#2d4a2d', text:'#e8f5e9', textSec:'#a8d8a8', textMut:'#7ab87a',
  textDim:'#557a55', accent:'#4caf50', accentDk:'#225522',
  warn:'#fbbf24', warnBg:'#1a1a08', error:'#e57373',
}
const inp = {
  background:C.deep, border:`1px solid ${C.border}`, color:C.text,
  borderRadius:6, padding:'10px 10px', fontSize:16,
  width:'100%', boxSizing:'border-box', outline:'none', minHeight:44,
}

// ─── Palīgkomponentes ─────────────────────────────────────────────────────────
function Header({ title, subtitle, onBack, extra }) {
  return (
    <div style={{
      background: DS.glass, borderBottom: `1px solid ${C.border}`,
      backdropFilter: 'blur(8px)', padding: '0 16px', height: 52,
      display: 'flex', alignItems: 'center', gap: 10,
      position: 'sticky', top: 0, zIndex: 10, fontFamily: F.family,
    }}>
      {onBack && <button onClick={onBack} style={{ background:'none', border:'none', color:C.accent, fontSize:22, cursor:'pointer', padding:'0 4px 0 0', lineHeight:1, minWidth:36, minHeight:44 }}>←</button>}
      <div style={{ flex:1 }}>
        <div style={{ color:C.accent, fontSize: F.md, fontWeight: F.weightBold }}>{title}</div>
        {subtitle && <div style={{ color:C.textDim, fontSize: F.xs, marginTop:1 }}>{subtitle}</div>}
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
          cursor:'pointer', minWidth:44, minHeight:44,
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
          cursor:'pointer', minHeight:44,
        }}>{k.label}</button>
      ))}
    </div>
  );
}

const labelSt = { fontSize:12, color:'#557a55', display:'block', marginBottom:5, fontWeight:500 };
const btnPrimary = {
  width:'100%', padding:'14px 0', borderRadius:10, border:'none',
  background:C.accentDk, color:'#fff', fontSize:16, fontWeight:600,
  cursor:'pointer', borderTop:`2px solid ${C.accent}`, minHeight:44,
};

// ─── GALVENĀ KOMPONENTE ───────────────────────────────────────────────────────
export default function DastojumsMeritajsPage({ onBack, user }) {
  const [faze, setFaze] = useState('setup');
  const bon = 3; // bonitāte nav vajadzīga — kalibrēts augstums kompensē

  // Cirsmas info — visi lauki izdrukam
  const [inf, setInf] = useState({
    kadastrs: '', nogabals: '', aNogabals: '', kvartals: '',
    saimnieciba: '', novads: '', pagasts: '', virsmezn: '', meznieciba: '',
    ipasnieks: '', uzmērīja: '', platiba: '', pievesana: '',
    izmantosana: 'Galvenā cirte - kailcirte',
  });
  const updInf = (k, v) => setInf(p => ({ ...p, [k]: v }));

  const handleKadastrs = (v) => {
    const auto = autoAizpilditNoKadastrs(v);
    setInf(p => ({
      ...p, kadastrs: v,
      novads:   p.novads   || auto.novads,
      pagasts:  p.pagasts  || auto.pagasts,
      virsmezn: p.virsmezn || auto.virsmezn,
    }));
  };

  const [koki,   setKoki]   = useState([]);
  const [d,      setD]      = useState('');
  const [suga,   setSuga]   = useState('E');
  const [kval,   setKval]   = useState('vidējs');
  const [ievNog, setIevNog] = useState('');
  const [skaits, setSkaits] = useState(1);

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
      bon, nogabals: ievNog || '—',
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
  if (faze === 'setup') {
    const row2 = { display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(160px, 1fr))', gap:10 };
    return (
    <div style={{ minHeight:'100vh', background:C.bg, color:C.text, fontFamily:'Arial,sans-serif' }}>
      <Header title="🌲 Dastojuma uzmērīšana" subtitle="Cirsmas dati pirms mērīšanas" onBack={onBack} />
      <div style={{ maxWidth:560, margin:'0 auto', padding:'16px 16px 60px' }}>

        {/* Nogabala identifikācija */}
        <Karte>
          <div style={{ fontSize:12, color:C.textDim, fontWeight:600, marginBottom:10, textTransform:'uppercase', letterSpacing:'0.05em' }}>Nogabala identifikācija</div>
          <div style={{ marginBottom:10 }}>
            <label style={labelSt}>Kadastra numurs</label>
            <input value={inf.kadastrs} onChange={e => handleKadastrs(e.target.value)}
              placeholder="piem. 70700130035" style={inp} maxLength={11} />
            {inf.novads && <div style={{ fontSize:11, color:C.accent, marginTop:3 }}>✓ {inf.novads}{inf.pagasts ? ` · ${inf.pagasts}` : ''}</div>}
          </div>
          <div style={row2}>
            <div>
              <label style={labelSt}>Nogabals</label>
              <input value={inf.nogabals} onChange={e => updInf('nogabals', e.target.value)}
                placeholder="piem. 8" style={inp} />
            </div>
            <div>
              <label style={labelSt}>A.Nogabals</label>
              <input value={inf.aNogabals} onChange={e => updInf('aNogabals', e.target.value)}
                placeholder="piem. 0" style={inp} />
            </div>
          </div>
          <div style={{ marginTop:10 }}>
            <label style={labelSt}>Kvartāls</label>
            <input value={inf.kvartals} onChange={e => updInf('kvartals', e.target.value)}
              placeholder="piem. 13" style={inp} />
          </div>
        </Karte>

        {/* Atrašanās vieta */}
        <Karte>
          <div style={{ fontSize:12, color:C.textDim, fontWeight:600, marginBottom:10, textTransform:'uppercase', letterSpacing:'0.05em' }}>Atrašanās vieta</div>
          <div style={row2}>
            <div>
              <label style={labelSt}>Novads {inf.novads && <span style={{ color:C.accent }}>●</span>}</label>
              <input value={inf.novads} onChange={e => updInf('novads', e.target.value)}
                placeholder="piem. Madonas novads" style={inf.novads ? {...inp, borderColor: C.accent} : inp} />
            </div>
            <div>
              <label style={labelSt}>Pagasts {inf.pagasts && <span style={{ color:C.accent }}>●</span>}</label>
              <input value={inf.pagasts} onChange={e => updInf('pagasts', e.target.value)}
                placeholder="piem. Laudonas pag." style={inf.pagasts ? {...inp, borderColor: C.accent} : inp} />
            </div>
          </div>
          <div style={{ ...row2, marginTop:10 }}>
            <div>
              <label style={labelSt}>Virsmežniecība {inf.virsmezn && <span style={{ color:C.accent }}>●</span>}</label>
              <input value={inf.virsmezn} onChange={e => updInf('virsmezn', e.target.value)}
                placeholder="piem. Vidzemes VMŅ" style={inf.virsmezn ? {...inp, borderColor: C.accent} : inp} />
            </div>
            <div>
              <label style={labelSt}>Mežniecība</label>
              <input value={inf.meznieciba} onChange={e => updInf('meznieciba', e.target.value)}
                placeholder="piem. Madonas" style={inp} />
            </div>
          </div>
        </Karte>

        {/* Saimniecība un dati */}
        <Karte>
          <div style={{ fontSize:12, color:C.textDim, fontWeight:600, marginBottom:10, textTransform:'uppercase', letterSpacing:'0.05em' }}>Saimniecība un mērījumi</div>
          <div style={{ marginBottom:10 }}>
            <label style={labelSt}>Saimniecības nosaukums</label>
            <input value={inf.saimnieciba} onChange={e => updInf('saimnieciba', e.target.value)}
              placeholder="piem. Vecainiešu saimniecība" style={inp} />
          </div>
          <div style={row2}>
            <div>
              <label style={labelSt}>Platība (ha)</label>
              <input type="number" value={inf.platiba} onChange={e => updInf('platiba', e.target.value)}
                placeholder="piem. 1.90" style={inp} />
            </div>
            <div>
              <label style={labelSt}>Pievešanas attālums (m)</label>
              <input type="number" value={inf.pievesana} onChange={e => updInf('pievesana', e.target.value)}
                placeholder="piem. 800" style={inp} />
            </div>
          </div>
          <div style={{ marginTop:10 }}>
            <label style={labelSt}>Meža izmantošanas veids</label>
            <select value={inf.izmantosana} onChange={e => updInf('izmantosana', e.target.value)} style={inp}>
              {['Galvenā cirte - kailcirte','Galvenā cirte - izlases cirte','Galvenā cirte - kailcirte pēc caurmēra','Kopšanas cirte','Sanitārā cirte'].map(v =>
                <option key={v}>{v}</option>)}
            </select>
          </div>
        </Karte>

        {/* Personas */}
        <Karte>
          <div style={{ fontSize:12, color:C.textDim, fontWeight:600, marginBottom:10, textTransform:'uppercase', letterSpacing:'0.05em' }}>Personas</div>
          <div style={row2}>
            <div>
              <label style={labelSt}>Īpašnieks</label>
              <input value={inf.ipasnieks} onChange={e => updInf('ipasnieks', e.target.value)}
                placeholder="vārds, uzvārds" style={inp} />
            </div>
            <div>
              <label style={labelSt}>Uzmērīja</label>
              <input value={inf.uzmērīja} onChange={e => updInf('uzmērīja', e.target.value)}
                placeholder={user?.vards || 'vārds, uzvārds'} style={inp} />
            </div>
          </div>
        </Karte>

        <button onClick={() => setFaze('merisana')} style={btnPrimary}>
          Sākt mērīšanu →
        </button>
      </div>
    </div>
  );}

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

          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(120px, 1fr))', gap:10, marginBottom:14 }}>
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
            <input value={ievNog} onChange={e => setIevNog(e.target.value)} placeholder="piem. 1a" style={inp} />
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
<h1 style="text-align:center;font-size:16px;margin:0 0 12px">CIRSMAS NOVĒRTĒJUMS</h1>
<table style="width:100%;border:none;font-size:10px;margin-bottom:12px"><tr>
<td style="border:none;width:50%">
<b>Saimniecība:</b> ${inf.saimnieciba || '—'}<br>
<b>Novads:</b> ${inf.novads || '—'}<br>
<b>Pagasts:</b> ${inf.pagasts || '—'}<br>
<b>Virsmežniecība:</b> ${inf.virsmezn || '—'}<br>
<b>Mežniecība:</b> ${inf.meznieciba || '—'}
</td>
<td style="border:none;width:50%">
<b>Īpašnieks:</b> ${inf.ipasnieks || '—'}<br>
<b>Kadastrs:</b> ${inf.kadastrs || '—'}<br>
<b>Kvartāls:</b> ${inf.kvartals || '—'} &nbsp;<b>Nogabals:</b> ${inf.nogabals || '—'} &nbsp;<b>A.Nog.:</b> ${inf.aNogabals || '0'}<br>
<b>Platība:</b> ${inf.platiba || '—'} ha &nbsp;<b>Pievešana:</b> ${inf.pievesana || '—'} m<br>
<b>Koku skaits:</b> ${kopa.skaits} gab. nogabalā<br>
<b>Meža izmantošanas veids:</b> ${inf.izmantosana || '—'}<br>
<b>Uzmērīja:</b> ${inf.uzmērīja || '—'} &nbsp;<b>Datums:</b> ${datums}
</td>
</tr></table>
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
  <div>Uzmērīja: ${inf.uzmērīja || '_________________________'}</div>
  <div>Novērtēja: _________________________</div>
</div>
</body></html>`;
      const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href = url; a.target = '_blank'; a.rel = 'noopener';
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 10000);
    };

    return (
      <div style={{ minHeight:'100vh', background:C.bg, color:C.text, fontFamily:'Arial,sans-serif' }}>
        <Header
          title="🌲 Dastojuma pārskats"
          subtitle={inf.kadastrs ? `${inf.kadastrs}${inf.platiba ? ` · ${inf.platiba} ha` : ''}` : datums}
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
