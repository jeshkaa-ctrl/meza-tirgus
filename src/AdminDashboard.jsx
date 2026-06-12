import { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'
import { C, F, R, S } from './ds'

const LAPU_NOSAUKUMI = {
  landing: '🏠 Sākumlapa', main: '🛠 Darba virsma', tirgus: '🌿 Tirgus',
  standard: '📄 VMD PDF analīze', cirsma: '🌲 Cirsmas novērtēšana',
  skice: '🗺 Cirsmas skice', dastojums_pdf: '📊 Dastojuma kalkulators',
  kubi: '📐 Kubikmetri', caurmers_mobile: '📏 Caurmēri',
  cirsma_mobile: '🌲 Cirsmas vērtēšana (mob)', dastojums_meritajs: '🪵 Dastojuma mērītājs',
  krautuves_meritajs: '📦 Krautuves mērītājs', pdfSkirotajs: '✂️ PDF šķirotājs',
  jautaparmezu: '⚖️ Meža likumi AI', sludinajumi: '📢 Sludinājumi',
  rekini: '🧾 Rēķini', logistika: '🚛 Loģistika', subscription: '💳 Abonements',
  pavadzimes: '🪵 Pavadzīmes', mobilie: '📱 Mobilā versija',
}

export default function AdminDashboard({ onBack }) {
  const [cilne,      setCilne]      = useState('lietotaji')
  const [lietotaji,  setLietotaji]  = useState([])
  const [notikumi,   setNotikumi]   = useState([])
  const [kopsavilkums, setKopsavilkums] = useState(null)
  const [loading,    setLoading]    = useState(true)
  const [pinVal,     setPinVal]     = useState('')
  const [pinAtlasits,setPinAtlasits]= useState(false)
  const [pinErr,     setPinErr]     = useState(false)

  function parbauditPin() {
    if (pinVal === String.fromCharCode(50,53,48,57)) {
      setPinAtlasits(true); setPinErr(false)
    } else {
      setPinErr(true); setPinVal('')
    }
  }

  useEffect(() => {
    Promise.all([
      ieladeLetotajus(),
      ieladeNotikumus(),
    ]).finally(() => setLoading(false))
  }, [])

  async function ieladeLetotajus() {
    const { data } = await supabase
      .from('profiles')
      .select('id, vards, uznemums, loma, novads, created_at')
      .order('created_at', { ascending: false })
    setLietotaji(data || [])
  }

  async function ieladeNotikumus() {
    try {
      // Lapas apmeklējumi
      const { data: events } = await supabase
        .from('app_events')
        .select('lapa, sesija_id, user_id, created_at')
        .order('created_at', { ascending: false })
        .limit(5000)

      if (!events) return

      // Unikālie sesiju ID
      const unikasSesijas = new Set(events.map(e => e.sesija_id)).size

      // Lapas popularitāte
      const lapuSkaits = {}
      events.forEach(e => {
        lapuSkaits[e.lapa] = (lapuSkaits[e.lapa] || 0) + 1
      })
      const populāras = Object.entries(lapuSkaits)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 15)

      setNotikumi(populāras)
      setKopsavilkums({ unikasSesijas, kopa: events.length })
    } catch {
      // app_events tabula vēl nav izveidota — ignorē kļūdu
    }
  }

  const iak = { background: C.bgInner, borderRadius: R.md, padding: '4px 8px', fontSize: F.xs, color: C.textDim }

  return (
    <div style={{ minHeight: '100vh', background: C.bg, color: C.text, fontFamily: F.family }}>

      {/* Header */}
      <header style={{
        background: C.glass, borderBottom: `1px solid ${C.greenBdr}`,
        backdropFilter: 'blur(8px)', position: 'sticky', top: 0, zIndex: 100,
        height: 52, display: 'flex', alignItems: 'center', padding: '0 20px', gap: 16,
      }}>
        <button onClick={onBack} style={{
          background: 'none', border: 'none', color: C.textMut,
          fontSize: F.sm, cursor: 'pointer', fontFamily: F.family, minHeight: 44,
        }}>← Atpakaļ</button>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 18 }}>🔐</span>
          <span style={{ color: C.green, fontWeight: 700, fontSize: F.md }}>Admin panelis</span>
        </div>
        {kopsavilkums && (
          <div style={{ display: 'flex', gap: 12, fontSize: F.xs, color: C.textDim }}>
            <span>👥 {lietotaji.length} lietotāji</span>
            <span>👁 {kopsavilkums.unikasSesijas} sesijas</span>
          </div>
        )}
      </header>

      {/* Cilnes */}
      <div style={{
        display: 'flex', borderBottom: `1px solid ${C.greenBdr}`,
        background: C.bgCard, padding: '0 20px',
      }}>
        {[
          { id: 'lietotaji', label: '👥 Lietotāji' },
          { id: 'analytics', label: '📊 Analītika' },
          { id: 'bots',      label: '🤖 Bots meklētājs' },
        ].map(c => (
          <button key={c.id} onClick={() => setCilne(c.id)} style={{
            background: 'none', border: 'none',
            borderBottom: cilne === c.id ? `2px solid ${C.green}` : '2px solid transparent',
            color: cilne === c.id ? C.green : C.textMut,
            padding: '12px 20px', fontSize: F.sm, fontWeight: cilne === c.id ? 700 : 400,
            cursor: 'pointer', fontFamily: F.family,
          }}>{c.label}</button>
        ))}
      </div>

      <main style={{ maxWidth: 900, margin: '0 auto', padding: '24px 20px 60px' }}>

        {loading && (
          <div style={{ textAlign: 'center', padding: 60, color: C.textDim }}>Ielādē...</div>
        )}

        {/* ── LIETOTĀJI ── */}
        {!loading && cilne === 'lietotaji' && (
          <div>
            <div style={{ color: C.textDim, fontSize: F.xs, marginBottom: 16 }}>
              Kopā: <strong style={{ color: C.textSec }}>{lietotaji.length}</strong> reģistrēti
            </div>

            {lietotaji.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 40, color: C.textDim }}>Nav reģistrētu lietotāju</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {lietotaji.map((l, i) => (
                  <div key={l.id} style={{
                    background: C.bgCard, border: `1px solid ${C.greenBdr}`,
                    borderRadius: R.md, padding: '10px 14px',
                    display: 'flex', alignItems: 'center', gap: 12,
                  }}>
                    <div style={{
                      width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
                      background: `linear-gradient(135deg, ${C.greenMd}, ${C.greenDk})`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: F.sm, fontWeight: 700, color: 'white',
                    }}>
                      {(l.vards || '?').charAt(0).toUpperCase()}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: F.base, fontWeight: 600, color: C.text }}>
                        {l.vards || '—'} {l.uznemums ? <span style={{ color: C.textDim, fontWeight: 400 }}>· {l.uznemums}</span> : ''}
                      </div>
                      <div style={{ fontSize: F.xs, color: C.textDim, marginTop: 2, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        {l.loma && <span>🏷 {l.loma}</span>}
                        {l.novads && <span>📍 {l.novads}</span>}
                        {l.created_at && <span>📅 {new Date(l.created_at).toLocaleDateString('lv-LV')}</span>}
                      </div>
                    </div>
                    <span style={{ ...iak }}># {i + 1}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── ANALĪTIKA ── */}
        {!loading && cilne === 'analytics' && (
          <div>

            {/* Kopsavilkums */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginBottom: 24 }}>
              {[
                { ikona: '👥', label: 'Reģistrētie',    value: lietotaji.length },
                { ikona: '👁', label: 'Unikālās sesijas', value: kopsavilkums?.unikasSesijas ?? '—' },
                { ikona: '📊', label: 'Kopā apmeklējumi', value: kopsavilkums?.kopa ?? '—' },
              ].map(s => (
                <div key={s.label} style={{
                  background: C.bgCard, border: `1px solid ${C.greenBdr}`,
                  borderRadius: R.lg, padding: '16px 20px', textAlign: 'center',
                }}>
                  <div style={{ fontSize: 28, marginBottom: 6 }}>{s.ikona}</div>
                  <div style={{ fontSize: 28, fontWeight: 700, color: C.green }}>{s.value}</div>
                  <div style={{ fontSize: F.xs, color: C.textDim, marginTop: 4 }}>{s.label}</div>
                </div>
              ))}
            </div>

            {/* Populārākās lapas */}
            {notikumi.length > 0 ? (
              <div>
                <div style={{ fontSize: F.xs, fontWeight: 700, color: C.textDim, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>
                  Populārākās funkcijas
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {notikumi.map(([lapa, skaits], i) => {
                    const max = notikumi[0]?.[1] || 1
                    const pct = Math.round((skaits / max) * 100)
                    return (
                      <div key={lapa} style={{
                        background: C.bgCard, border: `1px solid ${C.greenBdr}`,
                        borderRadius: R.md, padding: '10px 14px',
                        display: 'flex', alignItems: 'center', gap: 12,
                      }}>
                        <span style={{ ...iak, minWidth: 24, textAlign: 'center' }}>{i + 1}</span>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: F.sm, color: C.textSec, marginBottom: 4 }}>
                            {LAPU_NOSAUKUMI[lapa] || lapa}
                          </div>
                          <div style={{ height: 4, background: C.bgInner, borderRadius: 2, overflow: 'hidden' }}>
                            <div style={{ width: `${pct}%`, height: '100%', background: C.green, borderRadius: 2 }} />
                          </div>
                        </div>
                        <span style={{ fontSize: F.sm, fontWeight: 700, color: C.green, minWidth: 36, textAlign: 'right' }}>
                          {skaits}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>
            ) : (
              <div style={{
                background: C.bgCard, border: `1px dashed ${C.greenBdr}`,
                borderRadius: R.lg, padding: '32px 20px', textAlign: 'center',
              }}>
                <div style={{ fontSize: 32, marginBottom: 12 }}>📊</div>
                <div style={{ color: C.textSec, fontSize: F.base, marginBottom: 8 }}>Analītika vēl tiek vākta</div>
                <div style={{ color: C.textDim, fontSize: F.xs, lineHeight: 1.6, maxWidth: 400, margin: '0 auto' }}>
                  Izveido <code style={{ background: C.bgInner, padding: '1px 5px', borderRadius: 3 }}>app_events</code> tabulu
                  Supabase SQL redaktorā (skatīt zemāk) un dati parādīsies automātiski.
                </div>
                <div style={{
                  marginTop: 16, background: C.bgDeep, borderRadius: R.md,
                  padding: '12px 16px', textAlign: 'left', maxWidth: 500, margin: '16px auto 0',
                }}>
                  <div style={{ fontSize: F.xs, color: C.textDim, marginBottom: 8 }}>Supabase → SQL Editor:</div>
                  <pre style={{ fontSize: 11, color: C.textMut, margin: 0, whiteSpace: 'pre-wrap', fontFamily: 'monospace' }}>{`CREATE TABLE app_events (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  sesija_id text,
  user_id uuid,
  tips text NOT NULL,
  dati jsonb,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE app_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "visi_ieraksta" ON app_events
  FOR INSERT WITH CHECK (true);
CREATE POLICY "admin_lasa" ON app_events
  FOR SELECT USING (true);`}</pre>
                </div>
              </div>
            )}
          </div>
        )}
        {/* ── PRODUKTU BOTS ── */}
        {cilne === 'bots' && (
          <div>
            {!pinAtlasits ? (
              <div style={{ maxWidth: 360, margin: '60px auto', textAlign: 'center' }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>🤖</div>
                <div style={{ color: C.text, fontWeight: 700, fontSize: 18, marginBottom: 6 }}>
                  Bots meklētājs
                </div>
                <div style={{ color: C.textMut, fontSize: 13, marginBottom: 24, lineHeight: 1.6 }}>
                  Meklē cenas Amazon, Alibaba, AliExpress.<br/>Aprēķina LV pārdošanas cenu un maržu.
                </div>
                <input
                  autoFocus
                  type="password"
                  inputMode="numeric"
                  maxLength={6}
                  value={pinVal}
                  onChange={e => { setPinVal(e.target.value); setPinErr(false) }}
                  onKeyDown={e => e.key === 'Enter' && parbauditPin()}
                  placeholder="PIN kods"
                  style={{
                    width: '100%', background: '#0d1117',
                    border: `1px solid ${pinErr ? '#f85149' : '#30363d'}`,
                    borderRadius: 8, padding: '14px 16px', color: '#e6edf3',
                    fontSize: 22, textAlign: 'center', outline: 'none',
                    fontFamily: 'monospace', letterSpacing: 10, marginBottom: 8,
                  }}
                />
                {pinErr && (
                  <div style={{ color: '#f85149', fontSize: 12, marginBottom: 8 }}>Nepareizs PIN</div>
                )}
                <button onClick={parbauditPin} style={{
                  width: '100%', padding: 13, borderRadius: 8, border: 'none',
                  background: '#388bfd', color: 'white', fontWeight: 700, fontSize: 15, cursor: 'pointer',
                }}>
                  Atvērt botu →
                </button>
              </div>
            ) : (
              <div style={{ position: 'relative' }}>
                <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '8px 0', gap: 8 }}>
                  <button
                    onClick={() => window.open('/meza_tirgus_product_bot.html', '_blank', 'noopener')}
                    style={{ padding: '6px 14px', background: '#1c2d3f', color: '#388bfd', border: '1px solid #388bfd', borderRadius: 6, fontSize: 12, cursor: 'pointer' }}
                  >↗ Atvērt jaunā cilnē</button>
                  <button
                    onClick={() => { setPinAtlasits(false); setPinVal('') }}
                    style={{ padding: '6px 14px', background: 'none', color: '#8b949e', border: '1px solid #30363d', borderRadius: 6, fontSize: 12, cursor: 'pointer' }}
                  >🔒 Bloķēt</button>
                </div>
                <iframe
                  src="/meza_tirgus_product_bot.html"
                  style={{ width: '100%', height: 'calc(100vh - 160px)', border: 'none', borderRadius: 8 }}
                  title="Produktu izpētes bots"
                />
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  )
}
