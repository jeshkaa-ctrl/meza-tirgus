import { useState } from 'react'
import { C, F, R, S } from './ds'

const CENAS = {
  P:  { log: 95,  small: 68, pulp: 52, fire: 38, chips: 16 },
  E:  { log: 88,  small: 62, pulp: 48, fire: 35, chips: 15 },
  B:  { log: 0,   small: 0,  pulp: 54, tara: 50, veneer: 138, fire: 40, chips: 17 },
  A:  { log: 78,  small: 55, pulp: 45, fire: 32, chips: 14 },
  Oz: { log: 145, small: 90, pulp: 60, fire: 55, chips: 20 },
  M:  { log: 72,  small: 50, pulp: 42, fire: 30, chips: 13 },
}

const SUGAS = [
  { id: 'P',  label: '🌲 Priede' },
  { id: 'E',  label: '🌲 Egle' },
  { id: 'B',  label: '🌳 Bērzs' },
  { id: 'A',  label: '🌳 Apse' },
  { id: 'Oz', label: '🌳 Ozols' },
  { id: 'M',  label: '🌳 Melnalksnis' },
]

const SORTIMENTI = {
  P:  [['log','Zāģbaļķi'],['small','Sīkbaļķi'],['pulp','Papīrmalka'],['fire','Malka'],['chips','Šķelda']],
  E:  [['log','Zāģbaļķi'],['small','Sīkbaļķi'],['pulp','Papīrmalka'],['fire','Malka'],['chips','Šķelda']],
  B:  [['veneer','Finieris'],['tara','Tara'],['pulp','Papīrmalka'],['fire','Malka'],['chips','Šķelda']],
  A:  [['log','Zāģbaļķi'],['small','Sīkbaļķi'],['pulp','Papīrmalka'],['fire','Malka']],
  Oz: [['log','Zāģbaļķi'],['small','Sīkbaļķi'],['pulp','Papīrmalka'],['fire','Malka']],
  M:  [['log','Zāģbaļķi'],['small','Sīkbaļķi'],['pulp','Papīrmalka'],['fire','Malka']],
}

export default function CenuKalkulators({ onBack }) {
  const [suga,    setSuga]    = useState('P')
  const [apjoms,  setApjoms]  = useState('')
  const [sort,    setSort]    = useState('log')
  const [cenas,   setCenas]   = useState({ ...CENAS.P })

  const apjNum  = parseFloat(apjoms) || 0
  const cenaSug = CENAS[suga] || {}
  const priceSt = cenas[sort] || cenaSug[sort] || 0
  const vertiba = apjNum * priceSt

  const handleSuga = (s) => {
    setSuga(s)
    setCenas({ ...CENAS[s] })
    setSort(SORTIMENTI[s]?.[0]?.[0] || 'log')
  }

  const inp = {
    background: C.bgInner, border: `1px solid ${C.greenBdr}`,
    borderRadius: R.md, padding: '10px 14px', color: C.text,
    fontSize: F.base, fontFamily: F.family, outline: 'none',
  }

  return (
    <div style={{ minHeight: '100vh', background: C.bg, color: C.text, fontFamily: F.family }}>
      <header style={{
        background: C.glass, borderBottom: `1px solid ${C.greenBdr}`,
        backdropFilter: 'blur(8px)', position: 'sticky', top: 0, zIndex: 100,
        height: 52, display: 'flex', alignItems: 'center', padding: '0 20px', gap: 16,
      }}>
        {onBack && <button onClick={onBack} style={{
          background: 'none', border: 'none', color: C.textMut,
          fontSize: F.sm, cursor: 'pointer', fontFamily: F.family, minHeight: 44,
        }}>← Atpakaļ</button>}
        <span style={{ color: C.green, fontWeight: 700, fontSize: F.md }}>💰 Koksnes cenu kalkulators</span>
      </header>

      <main style={{ maxWidth: 600, margin: '0 auto', padding: '32px 20px 80px' }}>
        <p style={{ color: C.textMut, fontSize: F.sm, marginBottom: 28, lineHeight: 1.6 }}>
          Aptuvens koksnes vērtības aprēķins pēc aktuālajām Latvijas tirgus cenām (2026). Cenas var mainīt manuāli.
        </p>

        {/* Suga */}
        <div style={{ marginBottom: 20 }}>
          <label style={{ fontSize: F.xs, color: C.textDim, fontWeight: 700, display: 'block', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Koku suga</label>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {SUGAS.map(s => (
              <button key={s.id} onClick={() => handleSuga(s.id)} style={{
                padding: '8px 16px', borderRadius: R.md, cursor: 'pointer',
                background: suga === s.id ? C.greenDk : C.bgInner,
                border: `1px solid ${suga === s.id ? C.green : C.greenBdr}`,
                color: suga === s.id ? C.text : C.textMut,
                fontWeight: suga === s.id ? 700 : 400,
                fontSize: F.sm, fontFamily: F.family,
              }}>{s.label}</button>
            ))}
          </div>
        </div>

        {/* Sortiments */}
        <div style={{ marginBottom: 20 }}>
          <label style={{ fontSize: F.xs, color: C.textDim, fontWeight: 700, display: 'block', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Sortiments</label>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {(SORTIMENTI[suga] || []).map(([id, label]) => (
              <button key={id} onClick={() => setSort(id)} style={{
                padding: '8px 16px', borderRadius: R.md, cursor: 'pointer',
                background: sort === id ? C.greenDk : C.bgInner,
                border: `1px solid ${sort === id ? C.green : C.greenBdr}`,
                color: sort === id ? C.text : C.textMut,
                fontWeight: sort === id ? 700 : 400,
                fontSize: F.sm, fontFamily: F.family,
              }}>{label}</button>
            ))}
          </div>
        </div>

        {/* Apjoms + cena */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
          <div>
            <label style={{ fontSize: F.xs, color: C.textDim, fontWeight: 700, display: 'block', marginBottom: 6 }}>Apjoms (m³)</label>
            <input type="number" value={apjoms} onChange={e => setApjoms(e.target.value)}
              placeholder="piemēram: 50" style={{ ...inp, width: '100%', boxSizing: 'border-box' }} />
          </div>
          <div>
            <label style={{ fontSize: F.xs, color: C.textDim, fontWeight: 700, display: 'block', marginBottom: 6 }}>Cena (€/m³)</label>
            <input type="number" value={cenas[sort] || ''} onChange={e => setCenas(p => ({ ...p, [sort]: Number(e.target.value) }))}
              style={{ ...inp, width: '100%', boxSizing: 'border-box' }} />
          </div>
        </div>

        {/* Rezultāts */}
        {apjNum > 0 && (
          <div style={{
            background: `linear-gradient(135deg, ${C.greenDk}, #0d2a0d)`,
            border: `2px solid ${C.green}`, borderRadius: R.xl,
            padding: '24px 28px', textAlign: 'center', marginBottom: 28,
          }}>
            <div style={{ color: C.textMut, fontSize: F.sm, marginBottom: 8 }}>
              {apjNum} m³ × {priceSt} €/m³
            </div>
            <div style={{ color: C.green, fontSize: 40, fontWeight: 800, letterSpacing: '-0.02em' }}>
              {vertiba.toFixed(0)} €
            </div>
            <div style={{ color: C.textDim, fontSize: F.xs, marginTop: 6 }}>
              Aptuvena krautuves vērtība bez izstrādes izmaksām
            </div>
          </div>
        )}

        {/* Cenu tabula */}
        <div>
          <div style={{ fontSize: F.xs, fontWeight: 700, color: C.textDim, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>
            Aktuālās cenas — {SUGAS.find(s=>s.id===suga)?.label}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {(SORTIMENTI[suga] || []).map(([id, label]) => (
              <div key={id} style={{
                background: sort === id ? C.bgInner : C.bgCard,
                border: `1px solid ${sort === id ? C.green : C.greenBdr}`,
                borderRadius: R.md, padding: '10px 16px',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                cursor: 'pointer',
              }} onClick={() => setSort(id)}>
                <span style={{ color: C.textSec, fontSize: F.sm }}>{label}</span>
                <span style={{ color: C.green, fontWeight: 700, fontSize: F.base }}>{cenas[id] || cenaSug[id] || '—'} €/m³</span>
              </div>
            ))}
          </div>
          <div style={{ fontSize: F.xs, color: C.textDim, marginTop: 12, lineHeight: 1.5 }}>
            * Cenas ir indikatīvas un var atšķirties atkarībā no reģiona, kvalitātes un pircēja.
            Avots: tirgus dati 2026. gads.
          </div>
        </div>
      </main>
    </div>
  )
}
