import { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'
import { C, F, R, S } from './ds'
import BotsPardevejs from './BotsPardevejs'
import BotsBankieris from './BotsBankieris'
import BotsMakslinieks from './BotsMakslinieks'

// ── Selektora atziņu pārvaldības panelis ──
function AtzinasPanelis() {
  const [atzinas, setAtzinas]   = useState([])
  const [filtrs,  setFiltrs]    = useState('gaida')
  const [lade,    setLade]      = useState(true)

  useEffect(() => { ieladeAtzinas() }, [filtrs])

  async function ieladeAtzinas() {
    setLade(true)
    const { data } = await supabase
      .from('selektors_atzinas')
      .select('*')
      .eq('statuss', filtrs)
      .order('radita_datums', { ascending: false })
    setAtzinas(data || [])
    setLade(false)
  }

  async function mainStatus(id, jaunaisStatus) {
    await supabase.from('selektors_atzinas').update({
      statuss: jaunaisStatus,
      apstiprinata_datums: jaunaisStatus === 'apstiprina' ? new Date().toISOString() : null,
    }).eq('id', id)
    setAtzinas(prev => prev.filter(a => a.id !== id))
  }

  const filtriArr = [
    { id: 'gaida',      nos: '⏳ Gaida' },
    { id: 'apstiprina', nos: '✅ Apstiprinātas' },
    { id: 'noraida',    nos: '❌ Noraidītas' },
  ]

  return (
    <div>
      <div style={{ color: C.textMut, fontSize: F.xs, marginBottom: 16, lineHeight: 1.6 }}>
        Mednieku korekcijas un lauka atziņas no Selektora diskusijām.<br />
        Apstiprinātas atziņas tiek automātiski iekļautas nākotnes AI atbildēs.
      </div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        {filtriArr.map(f => (
          <button key={f.id} onClick={() => setFiltrs(f.id)} style={{
            padding: '8px 16px', borderRadius: 6, cursor: 'pointer', fontFamily: F.family,
            fontSize: F.xs, fontWeight: filtrs === f.id ? 700 : 400, border: 'none',
            background: filtrs === f.id ? C.green : C.bgCard,
            color: filtrs === f.id ? '#fff' : C.textMut,
            outline: filtrs === f.id ? 'none' : `1px solid ${C.greenBdr}`,
          }}>{f.nos}</button>
        ))}
      </div>

      {lade && <div style={{ textAlign: 'center', padding: 40, color: C.textDim }}>Ielādē...</div>}

      {!lade && atzinas.length === 0 && (
        <div style={{ textAlign: 'center', padding: 40, color: C.textDim }}>
          {filtrs === 'gaida' ? 'Nav jaunu atziņu — labs darbs!' : 'Nav ierakstu šajā kategorijā'}
        </div>
      )}

      {!lade && atzinas.map(a => (
        <div key={a.id} style={{
          background: C.bgCard, border: `1px solid ${C.greenBdr}`,
          borderRadius: 8, padding: 16, marginBottom: 12,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <span style={{ fontSize: F.xs, fontWeight: 700, color: C.green, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                {a.suga || 'nezinams'}
              </span>
              {a.mednieka_vards && (
                <span style={{ fontSize: F.xs, color: C.textDim }}>no: {a.mednieka_vards}</span>
              )}
            </div>
            <span style={{ fontSize: 11, color: C.textDim, flexShrink: 0 }}>
              {new Date(a.radita_datums).toLocaleDateString('lv-LV')}
            </span>
          </div>
          <div style={{ fontSize: F.sm, color: C.textSec, marginBottom: 4 }}>
            <strong style={{ color: C.textPri }}>Situācija:</strong> {a.situacija}
          </div>
          <div style={{ fontSize: F.sm, color: C.textSec, marginBottom: filtrs === 'gaida' ? 14 : 0, lineHeight: 1.6 }}>
            <strong style={{ color: C.textPri }}>Atziņa:</strong> {a.atzina}
          </div>
          {filtrs === 'gaida' && (
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => mainStatus(a.id, 'apstiprina')} style={{
                padding: '8px 20px', borderRadius: 6, border: 'none', cursor: 'pointer',
                background: '#1b5e20', color: '#fff', fontSize: F.xs, fontWeight: 700, fontFamily: F.family,
              }}>✅ Apstiprināt</button>
              <button onClick={() => mainStatus(a.id, 'noraida')} style={{
                padding: '8px 20px', borderRadius: 6, cursor: 'pointer', fontFamily: F.family,
                border: '1px solid #c62828', background: 'transparent', color: '#ef5350',
                fontSize: F.xs, fontWeight: 700,
              }}>❌ Noraidīt</button>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

// ── Sistēmas paziņojumu pārvaldības panelis ──
function PazinojumuAdminPanelis() {
  const [pazinojumi, setPazinojumi] = useState([])
  const [teksts,     setTeksts]     = useState('')
  const [tips,       setTips]       = useState('info')
  const [lade,       setLade]       = useState(true)
  const [saglaba,    setSaglaba]    = useState(false)

  useEffect(() => { ielade() }, [])

  async function ielade() {
    setLade(true)
    const { data } = await supabase
      .from('sistemas_pazinojumi')
      .select('*')
      .order('created_at', { ascending: false })
    setPazinojumi(data || [])
    setLade(false)
  }

  async function publicet() {
    if (!teksts.trim()) return
    setSaglaba(true)
    await supabase.from('sistemas_pazinojumi').insert({ teksts: teksts.trim(), tips })
    setTeksts('')
    await ielade()
    setSaglaba(false)
  }

  async function deaktivizet(id) {
    await supabase.from('sistemas_pazinojumi').update({ aktivs: false }).eq('id', id)
    setPazinojumi(prev => prev.map(p => p.id === id ? { ...p, aktivs: false } : p))
  }

  const TIPS_INFO = {
    'info':        { ikona: '🔵', krasa: '#42a5f5' },
    'brīdinājums': { ikona: '🟡', krasa: '#ffa726' },
    'kļūda':       { ikona: '🔴', krasa: '#ef5350' },
  }

  return (
    <div>
      {/* Jauna paziņojuma forma */}
      <div style={{
        background: C.bgCard, border: `1px solid ${C.greenBdr}`,
        borderRadius: 10, padding: 20, marginBottom: 24,
      }}>
        <div style={{ fontSize: F.sm, fontWeight: 700, color: C.text, marginBottom: 14 }}>
          Jauns paziņojums
        </div>
        <textarea
          value={teksts}
          onChange={e => setTeksts(e.target.value)}
          placeholder="Paziņojuma teksts..."
          rows={3}
          style={{
            width: '100%', background: C.bgInner,
            border: `1px solid ${C.greenBdr}`, borderRadius: 7,
            padding: '10px 12px', color: C.text, fontSize: F.sm,
            fontFamily: F.family, resize: 'vertical',
            outline: 'none', boxSizing: 'border-box',
          }}
        />
        <div style={{ display: 'flex', gap: 10, marginTop: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          {Object.entries(TIPS_INFO).map(([t, { ikona, krasa }]) => (
            <button key={t} onClick={() => setTips(t)} style={{
              padding: '6px 14px', borderRadius: 6, cursor: 'pointer',
              border: `1px solid ${tips === t ? krasa : C.greenBdr}`,
              background: tips === t ? C.bgInner : 'transparent',
              color: tips === t ? krasa : C.textDim,
              fontSize: F.xs, fontFamily: F.family,
              fontWeight: tips === t ? 700 : 400,
            }}>
              {ikona} {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
          <div style={{ flex: 1 }} />
          <button
            onClick={publicet}
            disabled={!teksts.trim() || saglaba}
            style={{
              padding: '8px 22px', borderRadius: 7, border: 'none',
              cursor: teksts.trim() && !saglaba ? 'pointer' : 'default',
              background: teksts.trim() && !saglaba ? C.green : C.bgInner,
              color: teksts.trim() && !saglaba ? '#fff' : C.textDim,
              fontSize: F.sm, fontWeight: 700, fontFamily: F.family,
            }}
          >
            {saglaba ? 'Saglabā...' : 'Publicēt'}
          </button>
        </div>
      </div>

      {/* Saraksts */}
      {lade && (
        <div style={{ textAlign: 'center', padding: 40, color: C.textDim }}>Ielādē...</div>
      )}
      {!lade && pazinojumi.length === 0 && (
        <div style={{ textAlign: 'center', padding: 40, color: C.textDim }}>Nav paziņojumu</div>
      )}
      {!lade && pazinojumi.map(p => {
        const tk = TIPS_INFO[p.tips] || TIPS_INFO['info']
        return (
          <div key={p.id} style={{
            background: C.bgCard, border: `1px solid ${p.aktivs ? C.greenBdr : '#222'}`,
            borderRadius: 8, padding: '12px 16px', marginBottom: 8,
            display: 'flex', alignItems: 'flex-start', gap: 12,
            opacity: p.aktivs ? 1 : 0.5,
          }}>
            <span style={{ fontSize: 16, flexShrink: 0, marginTop: 1 }}>{tk.ikona}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: F.sm, color: C.text, lineHeight: 1.5 }}>{p.teksts}</div>
              <div style={{ fontSize: 11, color: C.textDim, marginTop: 4, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <span style={{ color: tk.krasa }}>{p.tips}</span>
                <span>·</span>
                <span>{new Date(p.created_at).toLocaleDateString('lv-LV')}</span>
                <span>·</span>
                <span style={{ color: p.aktivs ? C.green : '#555' }}>
                  {p.aktivs ? '● aktīvs' : '○ neaktīvs'}
                </span>
              </div>
            </div>
            {p.aktivs && (
              <button onClick={() => deaktivizet(p.id)} style={{
                padding: '5px 12px', borderRadius: 6,
                border: `1px solid ${C.errorBdr}`, background: 'transparent',
                color: C.error, fontSize: F.xs, cursor: 'pointer',
                fontFamily: F.family, flexShrink: 0, fontWeight: 600,
              }}>Deaktivizēt</button>
            )}
          </div>
        )
      })}
    </div>
  )
}

// ── Ziņu/pieteikumu pārvaldības panelis ──
function ZinasAdminPanelis() {
  const [zinas,   setZinas]   = useState([])
  const [filtrs,  setFiltrs]  = useState('visi')
  const [lade,    setLade]    = useState(true)

  useEffect(() => { ielade() }, [filtrs])

  async function ielade() {
    setLade(true)
    let q = supabase
      .from('admin_zinas')
      .select('*')
      .order('created_at', { ascending: false })
    if (filtrs !== 'visi') q = q.eq('tips', filtrs)
    const { data } = await q
    setZinas(data || [])
    setLade(false)
  }

  async function mainStatusu(id, jaunaisStatus) {
    await supabase.from('admin_zinas').update({ statuss: jaunaisStatus }).eq('id', id)
    setZinas(prev => prev.map(z => z.id === id ? { ...z, statuss: jaunaisStatus } : z))
  }

  const STATUS_KRASA = { jauns: '#42a5f5', skatits: '#ffa726', atrisināts: '#4caf50' }
  const TIPS_IKONA   = { pieteikums: '🤖', zina: '💬', sudziba: '⚠️' }

  return (
    <div>
      <div style={{ color: C.textMut, fontSize: F.xs, marginBottom: 16, lineHeight: 1.6 }}>
        Ienākošie pieteikumi, ziņas un atbalsta pieprasījumi no lietotājiem.
      </div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        {[
          { id: 'visi',       nos: '📬 Visi' },
          { id: 'pieteikums', nos: '🤖 Pieteikumi' },
          { id: 'zina',       nos: '💬 Ziņas' },
          { id: 'sudziba',    nos: '⚠️ Sūdzības' },
        ].map(f => (
          <button key={f.id} onClick={() => setFiltrs(f.id)} style={{
            padding: '8px 16px', borderRadius: 6, cursor: 'pointer', fontFamily: F.family,
            fontSize: F.xs, fontWeight: filtrs === f.id ? 700 : 400, border: 'none',
            background: filtrs === f.id ? C.green : C.bgCard,
            color: filtrs === f.id ? '#fff' : C.textMut,
            outline: filtrs === f.id ? 'none' : `1px solid ${C.greenBdr}`,
          }}>{f.nos}</button>
        ))}
      </div>

      {lade && <div style={{ textAlign: 'center', padding: 40, color: C.textDim }}>Ielādē...</div>}

      {!lade && zinas.length === 0 && (
        <div style={{ textAlign: 'center', padding: 40, color: C.textDim }}>
          Nav ziņu šajā kategorijā
        </div>
      )}

      {!lade && zinas.map(z => (
        <div key={z.id} style={{
          background: C.bgCard, border: `1px solid ${C.greenBdr}`,
          borderRadius: 8, padding: 16, marginBottom: 12,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
              <span style={{ fontSize: F.xs, fontWeight: 700, color: C.green, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                {TIPS_IKONA[z.tips] || '📩'} {z.tips}
              </span>
              <span style={{ fontSize: F.xs, color: STATUS_KRASA[z.statuss] || C.textDim, background: `${STATUS_KRASA[z.statuss] || '#555'}22`, borderRadius: 4, padding: '1px 7px' }}>
                {z.statuss || 'jauns'}
              </span>
              {z.vards && <span style={{ fontSize: F.xs, color: C.textDim }}>no: {z.vards}</span>}
            </div>
            <span style={{ fontSize: 11, color: C.textDim, flexShrink: 0 }}>
              {new Date(z.created_at).toLocaleDateString('lv-LV')} {new Date(z.created_at).toLocaleTimeString('lv-LV', { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
          <div style={{ fontSize: F.sm, color: C.textDim, marginBottom: 8 }}>
            <span style={{ color: C.textPri }}>E-pasts:</span> {z.no_epasta}
          </div>
          <div style={{ fontSize: F.sm, color: C.textSec, lineHeight: 1.6, background: C.bgInner, borderRadius: 6, padding: '10px 12px', marginBottom: 12, whiteSpace: 'pre-wrap' }}>
            {z.saturs}
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {z.statuss !== 'skatits' && (
              <button onClick={() => mainStatusu(z.id, 'skatits')} style={{
                padding: '7px 18px', borderRadius: 6, border: `1px solid #42a5f5`,
                background: 'transparent', color: '#42a5f5', fontSize: F.xs, fontWeight: 700, cursor: 'pointer', fontFamily: F.family,
              }}>👁 Atzīmēt kā skatītu</button>
            )}
            {z.statuss !== 'atrisināts' && (
              <button onClick={() => mainStatusu(z.id, 'atrisināts')} style={{
                padding: '7px 18px', borderRadius: 6, border: 'none',
                background: '#1b5e20', color: '#fff', fontSize: F.xs, fontWeight: 700, cursor: 'pointer', fontFamily: F.family,
              }}>✅ Atrisināts</button>
            )}
            <a href={`mailto:${z.no_epasta}?subject=Re: Jūsu pieteikums — Meža Tirgus`} style={{
              padding: '7px 18px', borderRadius: 6, border: `1px solid ${C.greenBdr}`,
              color: C.textMut, fontSize: F.xs, fontWeight: 600, textDecoration: 'none', fontFamily: F.family, display: 'inline-flex', alignItems: 'center',
            }}>✉️ Atbildēt</a>
          </div>
        </div>
      ))}
    </div>
  )
}

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

export default function AdminDashboard({ onBack, onNavigate }) {
  const [cilne,      setCilne]      = useState('lietotaji')
  const [lietotaji,  setLietotaji]  = useState([])
  const [notikumi,   setNotikumi]   = useState([])
  const [kopsavilkums, setKopsavilkums] = useState(null)
  const [loading,    setLoading]    = useState(true)
  const [pinVal,     setPinVal]     = useState('')
  const [pinAtlasits,setPinAtlasits]= useState(false)
  const [pinErr,     setPinErr]     = useState(false)
  const [makslInitData, setMakslInitData] = useState(null)

  function parbauditPin() {
    if (pinVal === String.fromCharCode(50,53,48,57)) {
      setPinAtlasits(true); setPinErr(false)
    } else {
      setPinErr(true); setPinVal('')
    }
  }

  useEffect(() => {
    function onMessage(e) {
      if (e.data?.type === 'nodot_makslinieks') {
        setMakslInitData(e.data.data)
        setCilne('makslinieks')
        setPinAtlasits(true)
      }
    }
    window.addEventListener('message', onMessage)
    return () => window.removeEventListener('message', onMessage)
  }, [])

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
          { id: 'lietotaji',   label: '👥 Lietotāji' },
          { id: 'analytics',   label: '📊 Analītika' },
          { id: 'bots',        label: '🤖 Bots meklētājs' },
          { id: 'makslinieks', label: '🎨 Mākslinieks' },
          { id: 'pardevejs',   label: '📦 Pārdevējs' },
          { id: 'bankieris',   label: '💳 Banķieris' },
          { id: 'gramatvedis', label: '📊 Grāmatvedis' },
          { id: 'atzinas',    label: '🧠 Atziņas' },
          { id: 'pazinojumi', label: '📢 Paziņojumi' },
          { id: 'zinas',      label: '📬 Ziņas' },
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
        {/* ── GRĀMATVEDIS ── */}
        {cilne === 'gramatvedis' && (
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <div style={{ fontSize: 52, marginBottom: 12 }}>📊</div>
            <div style={{ color: C.text, fontWeight: 700, fontSize: 18, marginBottom: 8 }}>Grāmatvedis</div>
            <div style={{ color: C.textMut, fontSize: 13, marginBottom: 24, lineHeight: 1.6 }}>
              Darījumu uzskaite, PVN termiņi, Montonio auto-integrācija.
            </div>
            <button
              onClick={() => onNavigate?.('gramatvedis')}
              style={{
                padding: '12px 28px', borderRadius: 9,
                background: `linear-gradient(135deg,#2e7d32,#1b5e20)`,
                color: '#fff', border: 'none', fontSize: 14, fontWeight: 700, cursor: 'pointer',
              }}
            >
              Atvērt Grāmatvedi →
            </button>
          </div>
        )}

        {/* ── SELEKTORA ATZIŅAS ── */}
        {cilne === 'atzinas' && <AtzinasPanelis />}

        {/* ── SISTĒMAS PAZIŅOJUMI ── */}
        {cilne === 'pazinojumi' && <PazinojumuAdminPanelis />}

        {/* ── ZIŅAS / PIETEIKUMI ── */}
        {cilne === 'zinas' && <ZinasAdminPanelis />}

        {/* ── BOTI (meklētājs / mākslinieks / pārdevējs) ── */}
        {(cilne === 'bots' || cilne === 'makslinieks' || cilne === 'pardevejs' || cilne === 'bankieris') && (
          <div>
            {!pinAtlasits ? (
              <div style={{ maxWidth: 360, margin: '60px auto', textAlign: 'center' }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>
                  {cilne === 'bankieris' ? '💳' : cilne === 'pardevejs' ? '📦' : cilne === 'makslinieks' ? '🎨' : '🤖'}
                </div>
                <div style={{ color: C.text, fontWeight: 700, fontSize: 18, marginBottom: 6 }}>
                  {cilne === 'bankieris' ? 'Banķieris' : cilne === 'pardevejs' ? 'Pārdevējs' : cilne === 'makslinieks' ? 'Mākslinieks' : 'Bots meklētājs'}
                </div>
                <div style={{ color: C.textMut, fontSize: 13, marginBottom: 24, lineHeight: 1.6 }}>
                  {cilne === 'bankieris'
                    ? <>Automātiska pasūtīšana un e-pasta sūtīšana.<br/>CJdropshipping + manuālo pasūtījumu saraksts.</>
                    : cilne === 'pardevejs'
                    ? <>Apstrādā ienākošos pasūtījumus.<br/>Nosūta pie piegādātāja, izseko piegādi.</>
                    : cilne === 'makslinieks'
                    ? <>Tulko produktu latviski, ģenerē aprakstu,<br/>soc. tīklu saturu un attēla promptus.</>
                    : <>Meklē cenas Amazon, Alibaba, AliExpress.<br/>Aprēķina LV pārdošanas cenu un maržu.</>
                  }
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
            ) : cilne === 'bankieris' ? (
              <div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '8px 0' }}>
                  <button
                    onClick={() => { setPinAtlasits(false); setPinVal('') }}
                    style={{ padding: '6px 14px', background: 'none', color: '#8b949e', border: '1px solid #30363d', borderRadius: 6, fontSize: 12, cursor: 'pointer' }}
                  >🔒 Bloķēt</button>
                </div>
                <BotsBankieris />
              </div>
            ) : cilne === 'pardevejs' ? (
              <div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '8px 0' }}>
                  <button
                    onClick={() => { setPinAtlasits(false); setPinVal('') }}
                    style={{ padding: '6px 14px', background: 'none', color: '#8b949e', border: '1px solid #30363d', borderRadius: 6, fontSize: 12, cursor: 'pointer' }}
                  >🔒 Bloķēt</button>
                </div>
                <BotsPardevejs />
              </div>
            ) : cilne === 'makslinieks' ? (
              <div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '8px 0' }}>
                  <button
                    onClick={() => { setPinAtlasits(false); setPinVal('') }}
                    style={{ padding: '6px 14px', background: 'none', color: '#8b949e', border: '1px solid #30363d', borderRadius: 6, fontSize: 12, cursor: 'pointer' }}
                  >🔒 Bloķēt</button>
                </div>
                <BotsMakslinieks initialData={makslInitData} />
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
