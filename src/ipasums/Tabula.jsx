import { useState, useMemo } from 'react'
import { C as DS, F } from '../ds'
import { SORT_NOS } from './constants'

const DEFAULT_CENAS = { log:93, small:65, veneer:130, tara:48, stara:65, gulsnis:80, pulp:50, fire:38, chips:15 }
const SORT_KEYS = ['log','small','veneer','tara','stara','gulsnis','pulp','fire','chips']

function calcSortVert(sortimenti, cenas) {
  return Math.round(
    SORT_KEYS.reduce((s, k) => s + (sortimenti?.[k] || 0) * (cenas[k] || 0), 0)
  )
}

export default function IpasumTabula({ editData, updateRinda, kopPlatiba, kopKubatura }) {
  const [editMode,  setEditMode]  = useState(false)
  const [cenas,     setCenas]     = useState({ ...DEFAULT_CENAS })

  const C = { inner: DS.bgInner, bg: DS.bg, border: DS.greenBdr, text: DS.text, sec: DS.textSec, dim: DS.textDim, green: DS.green }

  const rows = useMemo(() =>
    editData.map(n => ({ ...n, sortVert: calcSortVert(n.sortimenti, cenas) })),
    [editData, cenas]
  )

  const kopSortVert = rows.reduce((s, n) => s + n.sortVert, 0)

  return (
    <div style={{ padding: '12px 8px 80px', overflowX: 'auto' }}>

      {/* Pogu josla */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 8px 12px', flexWrap: 'wrap', gap: 8 }}>
        <div style={{ fontSize: 12, color: C.dim }}>
          {editMode ? '✏️ Rediģēšanas režīms' : '📋 Tikai skats'}
        </div>
        <button onClick={() => setEditMode(e => !e)} style={{
          padding: '8px 18px', borderRadius: 8, cursor: 'pointer', fontFamily: F.family,
          background: editMode ? DS.greenDk : 'transparent',
          color: editMode ? '#fff' : C.green,
          border: `1px solid ${C.green}`,
          fontSize: 13, fontWeight: 600, minHeight: 36,
        }}>
          {editMode ? '✓ Pabeigt labošanu' : '✏️ Labot inventarizācijas datus'}
        </button>
      </div>

      {/* Sortimentu cenu panelis — redzams vienmēr, edit mode paplašinās */}
      <div style={{ background: DS.bgInner, border: `1px solid ${C.border}`, borderRadius: 10, padding: '10px 14px', marginBottom: 14, marginLeft: 8, marginRight: 8 }}>
        <div style={{ fontSize: 11, color: C.dim, marginBottom: editMode ? 10 : 0, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>💰 Sortimentu cenas (€/m³)</span>
          {editMode && (
            <button onClick={() => setCenas({ ...DEFAULT_CENAS })} style={{ background: 'none', border: `1px solid ${C.border}`, color: C.dim, borderRadius: 6, padding: '2px 10px', fontSize: 10, cursor: 'pointer', fontFamily: F.family }}>
              Atiestatīt
            </button>
          )}
        </div>
        {editMode ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))', gap: 8, marginTop: 4 }}>
            {SORT_KEYS.map(k => (
              <div key={k}>
                <div style={{ fontSize: 10, color: C.dim, marginBottom: 3 }}>{SORT_NOS[k]}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <input type="number" value={cenas[k]} min={0}
                    onChange={e => setCenas(prev => ({ ...prev, [k]: parseFloat(e.target.value) || 0 }))}
                    style={{ background: DS.bgDeep, border: `1px solid ${C.border}`, color: C.text, width: '100%', fontSize: 13, fontFamily: F.family, borderRadius: 4, padding: '5px 8px', textAlign: 'right' }} />
                  <span style={{ fontSize: 10, color: C.dim, flexShrink: 0 }}>€</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginTop: 6 }}>
            {SORT_KEYS.map(k => (
              <span key={k} style={{ fontSize: 12, color: C.sec }}>
                {SORT_NOS[k]}: <b style={{ color: C.text }}>{cenas[k]}€</b>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Tabula */}
      <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 780, fontSize: 13 }}>
        <thead>
          <tr style={{ background: '#1b4a1b' }}>
            {[
              { h: 'Nog.',      mw: 55,  right: false },
              { h: 'Suga',      mw: 90,  right: false },
              { h: 'Vec.',      mw: 55,  right: true  },
              { h: 'Bon.',      mw: 50,  right: true  },
              { h: 'ha',        mw: 55,  right: true  },
              { h: 'H m',       mw: 45,  right: true  },
              { h: 'G m²/ha',   mw: 65,  right: true  },
              { h: 'Kubatūra',  mw: 80,  right: true  },
              { h: 'Lēmums',    mw: 130, right: false },
              { h: 'Vērtība €', mw: 90,  right: true  },
            ].map(({ h, mw, right }, i) => (
              <th key={i} style={{
                padding: '8px 10px', textAlign: right ? 'right' : 'left',
                color: C.sec, fontWeight: 700, fontSize: 11, whiteSpace: 'nowrap',
                border: `1px solid ${C.border}`, minWidth: mw,
              }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((n, i) => (
            <tr key={n.id} style={{ background: i % 2 === 0 ? C.inner : C.bg }}>

              <td style={{ padding: '8px 10px', border: `1px solid ${C.border}`, color: C.dim, fontWeight: 600, whiteSpace: 'nowrap' }}>{n.nr_text}</td>
              <td style={{ padding: '8px 10px', border: `1px solid ${C.border}`, color: n.sugaKrasa, fontWeight: 700 }}>{n.sugaNos}</td>

              {/* Vecums */}
              <td style={{ padding: editMode ? '4px 6px' : '8px 10px', border: `1px solid ${C.border}`, textAlign: 'right' }}>
                {editMode
                  ? <input type="number" value={n.vecums || ''}
                      onChange={e => updateRinda(i, 'vecums', e.target.value)}
                      style={{ background: DS.bgDeep, border: `1px solid ${C.border}`, color: C.text, width: 56, textAlign: 'right', fontSize: 13, fontFamily: F.family, borderRadius: 4, padding: '4px 6px' }} />
                  : <span style={{ color: n.vecums > 0 ? C.text : C.dim, fontWeight: 600, fontSize: 14 }}>{n.vecums > 0 ? n.vecums : '—'}</span>
                }
              </td>

              {/* Bonitāte */}
              <td style={{ padding: editMode ? '4px 6px' : '8px 10px', border: `1px solid ${C.border}`, textAlign: 'right' }}>
                {editMode
                  ? <select value={n.bon} onChange={e => updateRinda(i, 'bon', e.target.value)}
                      style={{ background: DS.bgDeep, border: `1px solid ${C.border}`, color: C.sec, fontSize: 13, cursor: 'pointer', fontFamily: F.family, borderRadius: 4, padding: '4px' }}>
                      {['Ia','I','II','III','IV','V'].map(b => (
                        <option key={b} value={b} style={{ background: '#111f11' }}>{b}</option>
                      ))}
                    </select>
                  : <span style={{ color: C.sec, fontWeight: 600, fontSize: 14 }}>{n.bon || '—'}</span>
                }
              </td>

              {/* Platība */}
              <td style={{ padding: editMode ? '4px 6px' : '8px 10px', border: `1px solid ${C.border}`, textAlign: 'right' }}>
                {editMode
                  ? <input type="number" step="0.01" value={n.platiba.toFixed(2)}
                      onChange={e => updateRinda(i, 'platiba', e.target.value)}
                      style={{ background: DS.bgDeep, border: `1px solid ${C.border}`, color: C.text, width: 64, textAlign: 'right', fontSize: 13, fontFamily: F.family, borderRadius: 4, padding: '4px 6px' }} />
                  : <span style={{ color: C.text, fontSize: 14 }}>{n.platiba.toFixed(2)}</span>
                }
              </td>

              <td style={{ padding: '8px 10px', border: `1px solid ${C.border}`, textAlign: 'right', color: C.sec, fontSize: 14 }}>{n.h || '—'}</td>
              <td style={{ padding: '8px 10px', border: `1px solid ${C.border}`, textAlign: 'right', color: C.sec, fontSize: 14 }}>{n.g || '—'}</td>

              <td style={{ padding: '8px 10px', border: `1px solid ${C.border}`, textAlign: 'right', fontWeight: n.kubatura > 0 ? 700 : 400, color: n.kubatura > 0 ? C.text : C.dim, fontSize: 14 }}>
                {n.kubatura > 0 ? n.kubatura.toLocaleString() : '—'}
              </td>

              <td style={{ padding: '8px 10px', border: `1px solid ${C.border}`, color: C.dim, fontSize: 11, whiteSpace: 'nowrap' }}>{n.lemums || '—'}</td>

              <td style={{ padding: '8px 10px', border: `1px solid ${C.border}`, textAlign: 'right', fontWeight: n.sortVert > 0 ? 700 : 400, color: n.sortVert > 0 ? '#4ade80' : C.dim, fontSize: 14 }}>
                {n.sortVert > 0 ? `${n.sortVert.toLocaleString()} €` : '—'}
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr style={{ background: '#0a2a0a' }}>
            <td colSpan={4} style={{ padding: '8px 10px', border: `1px solid ${C.border}`, fontWeight: 700, color: C.green, fontSize: 13 }}>Kopā</td>
            <td style={{ padding: '8px 10px', border: `1px solid ${C.border}`, textAlign: 'right', fontWeight: 700, color: C.text, fontSize: 14 }}>{kopPlatiba.toFixed(2)}</td>
            <td colSpan={2} style={{ border: `1px solid ${C.border}` }} />
            <td style={{ padding: '8px 10px', border: `1px solid ${C.border}`, textAlign: 'right', fontWeight: 700, color: C.text, fontSize: 14 }}>{kopKubatura.toFixed(0)}</td>
            <td style={{ border: `1px solid ${C.border}` }} />
            <td style={{ padding: '8px 10px', border: `1px solid ${C.border}`, textAlign: 'right', fontWeight: 700, color: '#4ade80', fontSize: 14 }}>{kopSortVert.toLocaleString()} €</td>
          </tr>
        </tfoot>
      </table>

      <div style={{ fontSize: 10, color: C.dim, padding: '8px 8px 0' }}>
        * Kubatūra pēc MK 228 · Vērtība = sortimentu apjomi × aktuālās tirgus cenas
      </div>
    </div>
  )
}
