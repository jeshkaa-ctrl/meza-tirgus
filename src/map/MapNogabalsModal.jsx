import { useState, useEffect, useMemo } from 'react'
import { C as DS } from '../ds'
import {
  KATEGORIJAS, MEZA_TIPI, BOJAJUMA_VEIDI, SUGAS_OPCIJAS, aprēķināt,
} from './landCategoryEngine'

// ── Palīgkomponenti ───────────────────────────────────────────────────────────

function Lauks({ label, children }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ fontSize: 11, color: DS.textMut, marginBottom: 4, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>
        {label}
      </div>
      {children}
    </div>
  )
}

function Ievade({ value, onChange, type = 'text', placeholder, min, max, step, style }) {
  return (
    <input
      type={type}
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      min={min}
      max={max}
      step={step}
      style={{
        width: '100%', boxSizing: 'border-box',
        padding: '10px 12px', borderRadius: 8,
        background: DS.bgInner, border: `1px solid ${DS.greenBdr}`,
        color: DS.text, fontSize: 15,
        outline: 'none',
        ...style,
      }}
    />
  )
}

function Izvelne({ value, onChange, children }) {
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      style={{
        width: '100%', boxSizing: 'border-box',
        padding: '10px 12px', borderRadius: 8,
        background: DS.bgInner, border: `1px solid ${DS.greenBdr}`,
        color: DS.text, fontSize: 15,
        outline: 'none', appearance: 'none',
      }}
    >
      {children}
    </select>
  )
}

// ── Kategorijas pogas ─────────────────────────────────────────────────────────

const GRUPU_KARTIBA = ['mezs', 'cita', 'infra']
const GRUPU_NOS = { mezs: 'Mežs', cita: 'Cita meža zeme', infra: 'Infrastruktūra' }

function KategorijasPoga({ kods, kat, selected, onClick }) {
  return (
    <button
      onClick={() => onClick(kods)}
      style={{
        padding: '7px 10px', borderRadius: 7, fontSize: 13, cursor: 'pointer',
        background: selected ? `${DS.green}22` : DS.bgInner,
        border: `1px solid ${selected ? DS.green : DS.greenBdr}`,
        color: selected ? DS.green : DS.textMut,
        fontWeight: selected ? 700 : 400,
        display: 'flex', alignItems: 'center', gap: 5,
      }}
    >
      <span style={{ fontSize: 16 }}>{kat.ikona}</span>
      <span>{kods}</span>
    </button>
  )
}

// ── Lēmuma krāsa ─────────────────────────────────────────────────────────────

function lēmumKrasa(lēmums) {
  if (!lēmums || lēmums === '—') return DS.textDim
  const l = lēmums.toLowerCase()
  if (l.includes('sanitārā') || l.includes('aizliegta')) return '#c62828'
  if (l.includes('kailcirte') || l.includes('galvenā cirte'))  return DS.green
  if (l.includes('kopšanas'))  return DS.warn
  if (l.includes('atjaunošana')) return DS.info
  return DS.textSec
}

// ── Galvenais komponents ──────────────────────────────────────────────────────

export default function MapNogabalsModal({ nogabals, onSave, onClose }) {
  // Inicializē formu no LVM GEO datiem vai tukšu
  const [d, setD] = useState(() => ({
    kategorija: nogabals?.kategorija || 'MA',
    platiba:    String(nogabals?.platiba    || ''),
    suga:       nogabals?.suga             || 'P',
    vecums:     String(nogabals?.vecums    || ''),
    h:          String(nogabals?.h         || ''),
    g:          String(nogabals?.g         || ''),
    d_:         String(nogabals?.d         || ''),
    bieziba:    String(nogabals?.bieziba   || '1.0'),
    mezaTips:   nogabals?.mezaTips         || '',
    bonitate:   nogabals?.bonitate || nogabals?.bon || '',
    bojajumsVeids: nogabals?.bojajumsVeids || '',
    bojajumsProc:  String(nogabals?.bojajumsProc || ''),
    izcGads:    String(nogabals?.izcGads   || ''),
    izcAtjaunots: nogabals?.izcAtjaunots   || false,
    piezimes:   nogabals?.piezimes         || '',
  }))

  function upd(lauks, val) { setD(prev => ({ ...prev, [lauks]: val })) }

  const kat = KATEGORIJAS[d.kategorija] || KATEGORIJAS.MA

  const rez = useMemo(() => aprēķināt({
    ...d, platiba: parseFloat(d.platiba) || 0,
    vecums: parseFloat(d.vecums) || 0,
    h: parseFloat(d.h) || 0, g: parseFloat(d.g) || 0,
    d: parseFloat(d.d_) || 0,
  }), [d])

  function saglabat() {
    const saved = {
      ...nogabals,
      ...d,
      platiba:     parseFloat(d.platiba)    || 0,
      vecums:      parseFloat(d.vecums)     || 0,
      h:           parseFloat(d.h)          || 0,
      g:           parseFloat(d.g)          || 0,
      d:           parseFloat(d.d_)         || 0,
      bieziba:     parseFloat(d.bieziba)    || 1.0,
      bojajumsProc:parseFloat(d.bojajumsProc) || 0,
      izcGads:     parseInt(d.izcGads)      || null,
      // no aprēķina
      kraja:   rez.kraja,
      krajaHa: rez.krajaHa,
      lēmums:  rez.lēmums,
      bonitate:rez.bonitate !== '—' ? rez.bonitate : (d.bonitate || ''),
      izcApjoms: rez.izcApjoms,
      mapManuali: true,
    }
    onSave(saved)
  }

  // Grupētas kategorijas
  const grupas = GRUPU_KARTIBA.map(g => ({
    grupa: g,
    nos: GRUPU_NOS[g],
    kategorijas: Object.entries(KATEGORIJAS).filter(([, k]) => k.grupa === g),
  }))

  return (
    <>
      {/* Pārklājums */}
      <div
        onClick={onClose}
        style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 3000 }}
      />

      {/* Modāls — bottom sheet */}
      <div style={{
        position: 'fixed', left: 0, right: 0, bottom: 0,
        maxHeight: '92vh', overflowY: 'auto',
        background: DS.bgCard,
        borderRadius: '18px 18px 0 0',
        border: `1px solid ${DS.greenBdr}`,
        zIndex: 3001,
        padding: '0 0 32px',
        boxShadow: '0 -8px 40px rgba(0,0,0,0.5)',
      }}>
        {/* Virsraksts */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '16px 18px 12px',
          borderBottom: `1px solid ${DS.greenBdr}`,
          position: 'sticky', top: 0, background: DS.bgCard, zIndex: 1,
        }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: DS.text }}>
              {nogabals?.nr_text ? `Nogabals ${nogabals.nr_text}` : 'Jauns nogabals'}
            </div>
            <div style={{ fontSize: 12, color: DS.textMut, marginTop: 2 }}>
              {d.platiba ? `${d.platiba} ha` : 'platība nav norādīta'}
            </div>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: DS.textMut, fontSize: 22, cursor: 'pointer', padding: '0 4px' }}
          >✕</button>
        </div>

        <div style={{ padding: '16px 18px' }}>

          {/* Kategorija */}
          <Lauks label="Zemes kategorija">
            {grupas.map(({ grupa, nos, kategorijas }) => (
              <div key={grupa} style={{ marginBottom: 8 }}>
                <div style={{ fontSize: 11, color: DS.textDim, marginBottom: 5 }}>{nos}</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {kategorijas.map(([kods, k]) => (
                    <KategorijasPoga
                      key={kods} kods={kods} kat={k}
                      selected={d.kategorija === kods}
                      onClick={kods => upd('kategorija', kods)}
                    />
                  ))}
                </div>
              </div>
            ))}
          </Lauks>

          {/* Platība */}
          <Lauks label="Platība (ha)">
            <Ievade
              type="number" value={d.platiba} onChange={v => upd('platiba', v)}
              placeholder="0.00" min={0.01} step={0.01}
            />
          </Lauks>

          {/* MA — mežaudze */}
          {d.kategorija === 'MA' && (<>
            <div style={{
              display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14,
            }}>
              <Lauks label="Valdošā suga">
                <Izvelne value={d.suga} onChange={v => upd('suga', v)}>
                  {SUGAS_OPCIJAS.map(s => (
                    <option key={s.kods} value={s.kods}>{s.kods} — {s.nos}</option>
                  ))}
                </Izvelne>
              </Lauks>
              <Lauks label="Vecums (gadi)">
                <Ievade type="number" value={d.vecums} onChange={v => upd('vecums', v)} placeholder="—" min={1} />
              </Lauks>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 14 }}>
              <Lauks label="H augst. (m)">
                <Ievade type="number" value={d.h} onChange={v => upd('h', v)} placeholder="—" min={1} step={0.5} />
              </Lauks>
              <Lauks label="D caurmērs (cm)">
                <Ievade type="number" value={d.d_} onChange={v => upd('d_', v)} placeholder="—" min={1} />
              </Lauks>
              <Lauks label="G (m²/ha)">
                <Ievade type="number" value={d.g} onChange={v => upd('g', v)} placeholder="—" min={0} step={0.5} />
              </Lauks>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
              <Lauks label="Biezība (0.1–1.0)">
                <Ievade type="number" value={d.bieziba} onChange={v => upd('bieziba', v)} placeholder="1.0" min={0.1} max={1.0} step={0.1} />
              </Lauks>
              <Lauks label="Meža tips">
                <Izvelne value={d.mezaTips} onChange={v => upd('mezaTips', v)}>
                  <option value="">— nav norādīts —</option>
                  {MEZA_TIPI.map(t => (
                    <option key={t.kods} value={t.kods}>{t.nos}</option>
                  ))}
                </Izvelne>
              </Lauks>
            </div>
          </>)}

          {/* IzA — iznīkusi audze */}
          {d.kategorija === 'IzA' && (<>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
              <Lauks label="Bojājuma veids">
                <Izvelne value={d.bojajumsVeids} onChange={v => upd('bojajumsVeids', v)}>
                  <option value="">— izvēlies —</option>
                  {BOJAJUMA_VEIDI.map(b => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </Izvelne>
              </Lauks>
              <Lauks label="Bojājums (%)">
                <Ievade type="number" value={d.bojajumsProc} onChange={v => upd('bojajumsProc', v)} placeholder="0–100" min={0} max={100} />
              </Lauks>
            </div>
          </>)}

          {/* Izc — izcirtums */}
          {d.kategorija === 'Izc' && (<>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
              <Lauks label="Ciršanas gads">
                <Ievade type="number" value={d.izcGads} onChange={v => upd('izcGads', v)} placeholder="2024" min={1980} max={2030} />
              </Lauks>
              <Lauks label="Atjaunošana">
                <button
                  onClick={() => upd('izcAtjaunots', !d.izcAtjaunots)}
                  style={{
                    width: '100%', padding: '10px 12px', borderRadius: 8, fontSize: 14, cursor: 'pointer',
                    background: d.izcAtjaunots ? `${DS.green}22` : DS.bgInner,
                    border: `1px solid ${d.izcAtjaunots ? DS.green : DS.greenBdr}`,
                    color: d.izcAtjaunots ? DS.green : DS.textMut,
                    fontWeight: d.izcAtjaunots ? 700 : 400,
                  }}
                >
                  {d.izcAtjaunots ? '✓ Atjaunots' : 'Nav atjaunots'}
                </button>
              </Lauks>
            </div>
          </>)}

          {/* Piezīmes — visiem */}
          <Lauks label="Piezīmes">
            <textarea
              value={d.piezimes}
              onChange={e => upd('piezimes', e.target.value)}
              placeholder="Papildinformācija, novērojumi..."
              rows={2}
              style={{
                width: '100%', boxSizing: 'border-box',
                padding: '10px 12px', borderRadius: 8,
                background: DS.bgInner, border: `1px solid ${DS.greenBdr}`,
                color: DS.text, fontSize: 14,
                outline: 'none', resize: 'vertical',
              }}
            />
          </Lauks>

          {/* Aprēķina rezultāts */}
          {(kat.kraja || d.kategorija === 'Izc') && (
            <div style={{
              background: DS.bgInner, borderRadius: 10,
              border: `1px solid ${DS.greenBdr}`,
              padding: '12px 14px', marginBottom: 16,
            }}>
              <div style={{ fontSize: 11, color: DS.textDim, marginBottom: 8, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                Aprēķina rezultāts
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {kat.kraja && (<>
                  <Skaitlis label="Bonitāte" val={rez.bonitate} />
                  <Skaitlis label="Krāja/ha (m³)" val={rez.krajaHa || '—'} />
                  <Skaitlis label="Kopējā krāja" val={rez.kraja ? `${rez.kraja} m³` : '—'} />
                  {rez.izcApjoms > 0 && (
                    <Skaitlis label="Izcērtamais" val={`${rez.izcApjoms} m³`} green />
                  )}
                </>)}
              </div>
              {rez.lēmums !== '—' && (
                <div style={{
                  marginTop: 8, padding: '8px 10px', borderRadius: 7,
                  background: DS.bg, fontSize: 13, fontWeight: 600,
                  color: lēmumKrasa(rez.lēmums),
                }}>
                  {rez.lēmums}
                </div>
              )}
            </div>
          )}

          {/* Pogas */}
          <div style={{ display: 'flex', gap: 10 }}>
            <button
              onClick={onClose}
              style={{
                flex: 1, padding: '13px', borderRadius: 10, fontSize: 15, cursor: 'pointer',
                background: 'none', border: `1px solid ${DS.greenBdr}`, color: DS.textMut,
              }}
            >
              Atcelt
            </button>
            <button
              onClick={saglabat}
              style={{
                flex: 2, padding: '13px', borderRadius: 10, fontSize: 15, cursor: 'pointer',
                background: DS.greenMd, border: 'none', color: '#fff', fontWeight: 700,
              }}
            >
              ✓ Saglabāt nogabalu
            </button>
          </div>
        </div>
      </div>
    </>
  )
}

function Skaitlis({ label, val, green }) {
  return (
    <div>
      <div style={{ fontSize: 11, color: DS.textDim }}>{label}</div>
      <div style={{ fontSize: 15, fontWeight: 700, color: green ? DS.green : DS.text }}>{val}</div>
    </div>
  )
}
