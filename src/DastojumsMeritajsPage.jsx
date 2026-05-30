/**
 * DastojumsMeritajsPage.jsx
 * Dastojuma uzmērīšanas mobilā app — Meža tirgus
 *
 * Plūsma:
 *  1. Cirsmas dati (kadastra nr, platība, bonitāte, sortimenta garumi pa sugām)
 *  2. Koku ievade (D, suga, kvalitāte, nogabals) — ātri, pa vienam
 *  3. Live kopsavilkums pēc katras ievades
 *  4. Gala rezultāts ar PDF
 */

import { useState, useMemo } from 'react';
import { apstraadaKokus, formatKopsavilkums, SUGAS } from './engines/dastojumsMeritajsEngine';

// ─── Konstantes ───────────────────────────────────────────────────────────────

const SUGAS_SARAKSTS = ['P','E','B','A','Ba','Bl','Oz','Os'];
const KVALITATES = [
  { val: 'resns', label: 'Resns (Q1)' },
  { val: 'vidējs', label: 'Vidējs (Q2)' },
  { val: 'tievs', label: 'Tievs (Q3)' },
  { val: 'malka', label: 'Malka' },
];
const DEFAULT_GARUMI = { P:5, E:5, B:4, A:4, Ba:2.5, Bl:4, Oz:5, Os:5 };

// ─── Palīg-komponentes ────────────────────────────────────────────────────────

function SugaToggle({ value, onChange }) {
  return (
    <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
      {SUGAS_SARAKSTS.map(s => (
        <button key={s} onClick={() => onChange(s)} style={{
          padding:'8px 14px', borderRadius:8, fontSize:14, fontWeight: value===s ? 500 : 400,
          border: value===s ? '2px solid #2d6a2d' : '1px solid rgba(0,0,0,0.15)',
          background: value===s ? '#e8f5e8' : 'var(--color-background-primary)',
          color: value===s ? '#1a4d1a' : 'var(--color-text-secondary)',
          cursor:'pointer',
        }}>
          {s}
        </button>
      ))}
    </div>
  );
}

function KvalToggle({ value, onChange }) {
  return (
    <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
      {KVALITATES.map(k => (
        <button key={k.val} onClick={() => onChange(k.val)} style={{
          padding:'8px 12px', borderRadius:8, fontSize:13, fontWeight: value===k.val ? 500 : 400,
          border: value===k.val ? '2px solid #2d6a2d' : '1px solid rgba(0,0,0,0.15)',
          background: value===k.val ? '#e8f5e8' : 'var(--color-background-primary)',
          color: value===k.val ? '#1a4d1a' : 'var(--color-text-secondary)',
          cursor:'pointer',
        }}>
          {k.label}
        </button>
      ))}
    </div>
  );
}

function StatCard({ label, value, unit, warn }) {
  return (
    <div style={{
      background:'var(--color-background-secondary)', borderRadius:8,
      padding:'10px 12px', display:'flex', flexDirection:'column', gap:2,
    }}>
      <span style={{ fontSize:11, color:'var(--color-text-tertiary)', textTransform:'uppercase', letterSpacing:'0.05em' }}>{label}</span>
      <span style={{ fontSize:20, fontWeight:500, color: warn ? 'var(--color-text-warning)' : 'var(--color-text-primary)', lineHeight:1.2 }}>
        {value} <span style={{ fontSize:12, fontWeight:400, color:'var(--color-text-secondary)' }}>{unit}</span>
      </span>
    </div>
  );
}

// ─── Galvenā komponente ───────────────────────────────────────────────────────

export default function DastojumsMeritajsPage({ onBack }) {
  const [faze, setFaze] = useState('setup'); // setup | merisana | rezultats

  // Cirsmas info
  const [kadastrs, setKadastrs] = useState('');
  const [platiba, setPlatiba] = useState('');
  const [bon, setBon] = useState(3);
  const [garumi, setGarumi] = useState({ ...DEFAULT_GARUMI });

  // Koku saraksts
  const [koki, setKoki] = useState([]);

  // Ievades forma
  const [d, setD] = useState('');
  const [suga, setSuga] = useState('E');
  const [kval, setKval] = useState('vidējs');
  const [nogabals, setNogabals] = useState('');
  const [skaits, setSkaits] = useState(1);

  // Aprēķins (memoizēts)
  const rezultats = useMemo(() => {
    if (koki.length === 0) return null;
    return apstraadaKokus(koki, garumi);
  }, [koki, garumi]);

  // ── Pievienot koku ────────────────────────────────────────────────────────
  function pievienotKoku() {
    const dNum = parseFloat(d);
    if (!dNum || dNum < 4 || dNum > 120) return;
    const jauns = {
      id: Date.now() + Math.random(),
      suga, d_cm: dNum, kvalitate: kval,
      bon: parseInt(bon), nogabals: nogabals || '—',
      skaits: parseInt(skaits) || 1,
    };
    setKoki(prev => [...prev, jauns]);
    setD('');
    setSkaits(1);
    // suga un kvalitāte paliek — ātrai sērijveida ievadei
  }

  function dzestKoku(id) {
    setKoki(prev => prev.filter(k => k.id !== id));
  }

  const ks = rezultats?.kopsavilkums;

  // ── FĀZE: Setup ───────────────────────────────────────────────────────────
  if (faze === 'setup') return (
    <div style={{ maxWidth:520, margin:'0 auto', padding:'1rem 1rem 3rem' }}>
      {onBack && <button onClick={onBack} style={{ background:'none', border:'none', color:'var(--color-text-tertiary)', fontSize:20, cursor:'pointer', padding:'0 0 8px', display:'block' }}>←</button>}
      <h2 style={{ fontSize:20, fontWeight:500, margin:'0 0 4px' }}>🌲 Dastojuma uzmērīšana</h2>
      <p style={{ fontSize:13, color:'var(--color-text-secondary)', margin:'0 0 1.5rem' }}>
        Cirsmas dati un sortimenta garumi
      </p>

      <div style={{ display:'flex', flexDirection:'column', gap:'1rem', marginBottom:'1.5rem' }}>
        <div>
          <label style={{ fontSize:13, color:'var(--color-text-secondary)', display:'block', marginBottom:6 }}>Kadastra nr. (nav obligāts)</label>
          <input value={kadastrs} onChange={e => setKadastrs(e.target.value)} placeholder="piem. 42820040063" style={{ width:'100%', boxSizing:'border-box' }} />
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
          <div>
            <label style={{ fontSize:13, color:'var(--color-text-secondary)', display:'block', marginBottom:6 }}>Platība (ha)</label>
            <input type="number" value={platiba} onChange={e => setPlatiba(e.target.value)} placeholder="piem. 3.5" style={{ width:'100%', boxSizing:'border-box' }} />
          </div>
          <div>
            <label style={{ fontSize:13, color:'var(--color-text-secondary)', display:'block', marginBottom:6 }}>Bonitāte (1–5)</label>
            <select value={bon} onChange={e => setBon(e.target.value)} style={{ width:'100%' }}>
              {[1,2,3,4,5].map(b => <option key={b} value={b}>{b}</option>)}
            </select>
          </div>
        </div>
      </div>

      <div style={{ marginBottom:'1.5rem' }}>
        <p style={{ fontSize:13, fontWeight:500, margin:'0 0 8px', color:'var(--color-text-primary)' }}>
          Sortimenta garumi (m) pa sugām
        </p>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
          {SUGAS_SARAKSTS.map(s => (
            <div key={s} style={{ display:'flex', alignItems:'center', gap:8 }}>
              <span style={{ fontSize:13, fontWeight:500, color:'var(--color-text-secondary)', width:28 }}>{s}</span>
              <input
                type="number" min="1" max="10" step="0.5"
                value={garumi[s] ?? 4}
                onChange={e => setGarumi(prev => ({ ...prev, [s]: parseFloat(e.target.value) }))}
                style={{ flex:1 }}
              />
              <span style={{ fontSize:12, color:'var(--color-text-tertiary)' }}>m</span>
            </div>
          ))}
        </div>
      </div>

      <button onClick={() => setFaze('merisana')} style={{
        width:'100%', padding:'14px 0', borderRadius:10,
        border:'none', background:'#2d6a2d', color:'#fff',
        fontSize:15, fontWeight:500, cursor:'pointer',
      }}>
        Sākt mērīšanu →
      </button>
    </div>
  );

  // ── FĀZE: Mērīšana ────────────────────────────────────────────────────────
  if (faze === 'merisana') return (
    <div style={{ maxWidth:520, margin:'0 auto', padding:'1rem 1rem 3rem' }}>

      {/* Live mini kopsavilkums */}
      {ks && (
        <div style={{
          background:'#e8f5e8', borderRadius:10, padding:'10px 14px',
          marginBottom:'1rem', display:'flex', gap:16, flexWrap:'wrap',
        }}>
          <div style={{ fontSize:13 }}>
            <span style={{ color:'#1a4d1a', fontWeight:500 }}>{koki.reduce((s,k)=>s+(k.skaits??1),0)}</span>
            <span style={{ color:'#4a7a4a', fontSize:12 }}> koki</span>
          </div>
          <div style={{ fontSize:13 }}>
            <span style={{ color:'#1a4d1a', fontWeight:500 }}>{ks.kopBruto}</span>
            <span style={{ color:'#4a7a4a', fontSize:12 }}> m³ bruto</span>
          </div>
          <div style={{ fontSize:13 }}>
            <span style={{ color:'#1a4d1a', fontWeight:500 }}>{ks.kopLikvida}</span>
            <span style={{ color:'#4a7a4a', fontSize:12 }}> m³ likvid</span>
          </div>
          {ks.otrsStavsSkaits > 0 && (
            <div style={{ fontSize:12, color:'#7a5a1a' }}>
              ⚠ 2. stāvs: {ks.otrsStavsSkaits} koki
            </div>
          )}
        </div>
      )}

      {/* Ievades forma */}
      <div style={{
        border:'1px solid rgba(0,0,0,0.1)', borderRadius:12,
        padding:'1rem', marginBottom:'1rem',
        background:'var(--color-background-primary)',
      }}>
        <div style={{ marginBottom:12 }}>
          <label style={{ fontSize:12, color:'var(--color-text-tertiary)', display:'block', marginBottom:4 }}>Suga</label>
          <SugaToggle value={suga} onChange={setSuga} />
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:12 }}>
          <div>
            <label style={{ fontSize:12, color:'var(--color-text-tertiary)', display:'block', marginBottom:4 }}>D1.3 (cm)</label>
            <input
              type="number" inputMode="decimal" min="4" max="120" step="1"
              value={d} onChange={e => setD(e.target.value)}
              placeholder="piem. 24"
              style={{ width:'100%', boxSizing:'border-box', fontSize:20, fontWeight:500 }}
              onKeyDown={e => { if (e.key === 'Enter') pievienotKoku(); }}
              autoFocus
            />
          </div>
          <div>
            <label style={{ fontSize:12, color:'var(--color-text-tertiary)', display:'block', marginBottom:4 }}>Skaits</label>
            <input
              type="number" min="1" max="50" step="1"
              value={skaits} onChange={e => setSkaits(e.target.value)}
              style={{ width:'100%', boxSizing:'border-box', fontSize:18 }}
            />
          </div>
        </div>

        <div style={{ marginBottom:12 }}>
          <label style={{ fontSize:12, color:'var(--color-text-tertiary)', display:'block', marginBottom:4 }}>Kvalitāte</label>
          <KvalToggle value={kval} onChange={setKval} />
        </div>

        <div style={{ marginBottom:12 }}>
          <label style={{ fontSize:12, color:'var(--color-text-tertiary)', display:'block', marginBottom:4 }}>Nogabals (pēc izvēles)</label>
          <input value={nogabals} onChange={e => setNogabals(e.target.value)} placeholder="piem. 1a" style={{ width:'100%', boxSizing:'border-box' }} />
        </div>

        <button
          onClick={pievienotKoku}
          disabled={!d || parseFloat(d) < 4}
          style={{
            width:'100%', padding:'12px 0', borderRadius:8,
            border:'none',
            background: d && parseFloat(d) >= 4 ? '#2d6a2d' : 'var(--color-background-secondary)',
            color: d && parseFloat(d) >= 4 ? '#fff' : 'var(--color-text-tertiary)',
            fontSize:15, fontWeight:500, cursor: d ? 'pointer' : 'not-allowed',
          }}
        >
          + Pievienot koku
        </button>
      </div>

      {/* Koku saraksts */}
      {koki.length > 0 && (
        <div style={{ marginBottom:'1rem' }}>
          <p style={{ fontSize:12, color:'var(--color-text-tertiary)', margin:'0 0 6px' }}>
            Ievadītie koki ({koki.length} ieraksti):
          </p>
          <div style={{ display:'flex', flexDirection:'column', gap:4, maxHeight:260, overflowY:'auto' }}>
            {[...koki].reverse().map((k, i) => {
              // Atrast aprēķināto koku
              const aprekKoks = rezultats?.koki.find(ak => ak.id === k.id);
              return (
                <div key={k.id} style={{
                  display:'flex', alignItems:'center', gap:8,
                  background: aprekKoks?.otrsStavs ? '#fffbea' : 'var(--color-background-secondary)',
                  borderRadius:7, padding:'7px 10px', fontSize:13,
                }}>
                  <span style={{ fontWeight:500, color:'var(--color-text-primary)', minWidth:20 }}>{k.suga}</span>
                  <span style={{ color:'var(--color-text-secondary)' }}>{k.d_cm}cm</span>
                  <span style={{ color:'var(--color-text-tertiary)', fontSize:11 }}>{k.kvalitate}</span>
                  {k.skaits > 1 && <span style={{ color:'var(--color-text-tertiary)', fontSize:11 }}>×{k.skaits}</span>}
                  {k.nogabals !== '—' && <span style={{ color:'var(--color-text-tertiary)', fontSize:11 }}>#{k.nogabals}</span>}
                  {aprekKoks?.otrsStavs && <span style={{ fontSize:11, color:'#7a5a1a' }}>2.stāvs</span>}
                  {aprekKoks && <span style={{ fontSize:11, color:'var(--color-text-tertiary)', marginLeft:'auto' }}>{aprekKoks.likvidV.toFixed(3)} m³</span>}
                  <button onClick={() => dzestKoku(k.id)} style={{
                    background:'none', border:'none', color:'var(--color-text-tertiary)',
                    cursor:'pointer', fontSize:16, padding:'0 2px', lineHeight:1,
                  }}>×</button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Navigācija */}
      <div style={{ display:'flex', gap:8 }}>
        <button onClick={() => setFaze('setup')} style={{
          flex:1, padding:'11px 0', borderRadius:8,
          border:'1px solid rgba(0,0,0,0.12)',
          background:'var(--color-background-primary)',
          color:'var(--color-text-secondary)', fontSize:13, cursor:'pointer',
        }}>
          ← Atpakaļ
        </button>
        <button
          onClick={() => setFaze('rezultats')}
          disabled={koki.length === 0}
          style={{
            flex:3, padding:'11px 0', borderRadius:8, border:'none',
            background: koki.length > 0 ? '#2d6a2d' : 'var(--color-background-secondary)',
            color: koki.length > 0 ? '#fff' : 'var(--color-text-tertiary)',
            fontSize:14, fontWeight:500, cursor: koki.length > 0 ? 'pointer' : 'not-allowed',
          }}
        >
          Rezultāts → ({koki.reduce((s,k)=>s+(k.skaits??1),0)} koki)
        </button>
      </div>
    </div>
  );

  // ── FĀZE: Rezultāts ───────────────────────────────────────────────────────
  if (faze === 'rezultats' && ks) {
    const sortLabels = {
      balkis:'Baļķis/Zāģbaļķis', snikbalkis:'Sīkbaļķis',
      finieris:'Finieris (B)', tara:'Tara (Ba)',
      papirmalka:'Papīrmalka', malka:'Malka',
    };

    return (
      <div style={{ maxWidth:520, margin:'0 auto', padding:'1rem 1rem 3rem' }}>
        <h2 style={{ fontSize:20, fontWeight:500, margin:'0 0 4px' }}>Dastojuma rezultāts</h2>
        {kadastrs && <p style={{ fontSize:12, color:'var(--color-text-tertiary)', margin:'0 0 1rem' }}>{kadastrs}{platiba ? ` · ${platiba} ha` : ''}</p>}

        {/* Galvenie rādītāji */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:8, marginBottom:'1rem' }}>
          <StatCard label="Kopā koki" value={ks.kopaSkaits} unit="gab." />
          <StatCard label="Kopējā krāja" value={ks.kopBruto} unit="m³" />
          <StatCard label="Likvidā krāja" value={ks.kopLikvida} unit="m³" />
          <StatCard label="Atliekas" value={`${ks.atliProcVid}%`} unit={`${ks.kopAtliekas} m³`} />
          <StatCard label="2. stāvs" value={ks.otrsStavsSkaits} unit="koki" warn={ks.otrsStavsSkaits > 0} />
        </div>

        {/* Sortimenti */}
        <div style={{
          border:'1px solid rgba(0,0,0,0.08)', borderRadius:10,
          padding:'1rem', marginBottom:'1rem',
          background:'var(--color-background-primary)',
        }}>
          <p style={{ fontSize:13, fontWeight:500, margin:'0 0 10px' }}>Sortimentu sadalījums</p>
          {Object.entries(ks.sortimenti)
            .filter(([, v]) => v > 0)
            .sort(([,a],[,b]) => b-a)
            .map(([sort, v]) => (
              <div key={sort} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'5px 0', borderBottom:'1px solid rgba(0,0,0,0.05)' }}>
                <span style={{ fontSize:13, color:'var(--color-text-secondary)' }}>{sortLabels[sort]}</span>
                <span style={{ fontSize:14, fontWeight:500, color:'var(--color-text-primary)' }}>{v} m³</span>
              </div>
            ))}
        </div>

        {/* Pa sugām */}
        <div style={{
          border:'1px solid rgba(0,0,0,0.08)', borderRadius:10,
          padding:'1rem', marginBottom:'1rem',
          background:'var(--color-background-primary)',
        }}>
          <p style={{ fontSize:13, fontWeight:500, margin:'0 0 10px' }}>Pa sugām</p>
          {Object.entries(ks.paSugam).map(([sg, d]) => (
            <div key={sg} style={{ padding:'6px 0', borderBottom:'1px solid rgba(0,0,0,0.05)' }}>
              <div style={{ display:'flex', justifyContent:'space-between', fontSize:13 }}>
                <span style={{ fontWeight:500 }}>{sg} — {SUGAS[sg]}</span>
                <span style={{ color:'var(--color-text-secondary)' }}>{d.skaits} koki</span>
              </div>
              <div style={{ display:'flex', gap:12, fontSize:12, color:'var(--color-text-tertiary)', marginTop:2 }}>
                <span>bruto {d.brutV} m³</span>
                <span>likvid {d.likvidV} m³</span>
                {d.otrsStavsSkaits > 0 && <span style={{ color:'#7a5a1a' }}>2.stāvs: {d.otrsStavsSkaits}</span>}
              </div>
            </div>
          ))}
        </div>

        {/* Pa nogabaliem */}
        {Object.keys(ks.paNogabaliem).length > 1 && (
          <div style={{
            border:'1px solid rgba(0,0,0,0.08)', borderRadius:10,
            padding:'1rem', marginBottom:'1rem',
            background:'var(--color-background-primary)',
          }}>
            <p style={{ fontSize:13, fontWeight:500, margin:'0 0 10px' }}>Pa nogabaliem</p>
            {Object.entries(ks.paNogabaliem).map(([n, d]) => (
              <div key={n} style={{ display:'flex', justifyContent:'space-between', padding:'4px 0', fontSize:13 }}>
                <span style={{ color:'var(--color-text-secondary)' }}>Nogabals {n}</span>
                <span>{d.skaits} koki · {d.likvidV} m³</span>
              </div>
            ))}
          </div>
        )}

        {/* Pogas */}
        <div style={{ display:'flex', gap:8 }}>
          <button onClick={() => setFaze('merisana')} style={{
            flex:1, padding:'12px 0', borderRadius:8,
            border:'1px solid rgba(0,0,0,0.12)',
            background:'var(--color-background-primary)',
            color:'var(--color-text-secondary)', fontSize:13, cursor:'pointer',
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
            flex:2, padding:'12px 0', borderRadius:8, border:'none',
            background:'#2d6a2d', color:'#fff',
            fontSize:14, fontWeight:500, cursor:'pointer',
          }}>
            💾 Saglabāt .txt
          </button>
        </div>
      </div>
    );
  }

  return null;
}
