import { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'
import { C, F, R, S } from './ds'
import { NOVADI } from './novadi'

const SORT_OPCIJAS = [
  { id: 'balki_P',    label: 'Baļķis Priede' },
  { id: 'balki_E',    label: 'Baļķis Egle' },
  { id: 'balki_M',    label: 'Baļķis Melnalksnis' },
  { id: 'sikbalki',   label: 'Sīkbaļķis' },
  { id: 'finieris',   label: 'Finieris Bērzs' },
  { id: 'zagbalki',   label: 'Zāģbaļķis' },
  { id: 'tara',       label: 'Tara' },
  { id: 'papirmalka', label: 'Papīrmalka' },
  { id: 'malka',      label: 'Malka' },
  { id: 'skelda',     label: 'Šķelda' },
]

const tukšaVieta = () => ({
  nosaukums: '', adrese: '', novads: '', lat: '', lng: '',
  talrunis: '', epasts: '', apraksts: '',
  cena_balki_p: '', cena_balki_e: '', cena_balki_m: '',
  cena_sikbalki: '', cena_finieris: '', cena_zagbalki: '',
  cena_tara: '', cena_papirmalka: '', cena_malka: '', cena_skelda: '',
  pienem: [],
})

const CENU_KOLS = {
  balki_P: 'cena_balki_p', balki_E: 'cena_balki_e', balki_M: 'cena_balki_m',
  sikbalki: 'cena_sikbalki', finieris: 'cena_finieris', zagbalki: 'cena_zagbalki',
  tara: 'cena_tara', papirmalka: 'cena_papirmalka', malka: 'cena_malka', skelda: 'cena_skelda',
}

const inp = {
  background: C.bgInner, border: `1px solid ${C.greenBdr}`,
  borderRadius: R.md, padding: '9px 12px', color: C.text,
  fontSize: F.sm, fontFamily: F.family, outline: 'none',
  width: '100%', boxSizing: 'border-box',
}

export default function PircejuCenas({ onBack, user }) {
  const [vietas,    setVietas]    = useState([])
  const [loading,   setLoading]   = useState(true)
  const [showForma, setShowForma] = useState(false)
  const [redigets,  setRedigets]  = useState(null) // null = jauna, id = esošā
  const [forma,     setForma]     = useState(tukšaVieta())
  const [saglabā,   setSaglabā]   = useState(false)
  const [klude,     setKlude]     = useState('')

  useEffect(() => { ieladeVietas() }, [user?.id])

  async function ieladeVietas() {
    if (!user?.id) return
    setLoading(true)
    const { data } = await supabase
      .from('pirceja_vietas')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
    setVietas(data || [])
    setLoading(false)
  }

  function atvertFormu(vieta = null) {
    if (vieta) {
      setForma({
        nosaukums: vieta.nosaukums || '', adrese: vieta.adrese || '',
        novads: vieta.novads || '', lat: vieta.lat || '', lng: vieta.lng || '',
        talrunis: vieta.talrunis || '', epasts: vieta.epasts || '',
        apraksts: vieta.apraksts || '',
        cena_balki_p: vieta.cena_balki_p || '', cena_balki_e: vieta.cena_balki_e || '',
        cena_balki_m: vieta.cena_balki_m || '', cena_sikbalki: vieta.cena_sikbalki || '',
        cena_finieris: vieta.cena_finieris || '', cena_zagbalki: vieta.cena_zagbalki || '',
        cena_tara: vieta.cena_tara || '', cena_papirmalka: vieta.cena_papirmalka || '',
        cena_malka: vieta.cena_malka || '', cena_skelda: vieta.cena_skelda || '',
        pienem: vieta.pienem || [],
      })
      setRedigets(vieta.id)
    } else {
      setForma(tukšaVieta())
      setRedigets(null)
    }
    setKlude('')
    setShowForma(true)
  }

  function toggleSort(id) {
    setForma(p => ({
      ...p,
      pienem: p.pienem.includes(id) ? p.pienem.filter(s => s !== id) : [...p.pienem, id],
    }))
  }

  async function saglabatVietu() {
    setKlude('')
    if (!forma.nosaukums.trim()) return setKlude('Ievadi nosaukumu!')
    if (forma.pienem.length === 0) return setKlude('Izvēlies vismaz vienu sortimentu!')
    setSaglabā(true)

    const dati = {
      user_id:       user.id,
      nosaukums:     forma.nosaukums.trim(),
      adrese:        forma.adrese.trim(),
      novads:        forma.novads,
      lat:           parseFloat(forma.lat) || null,
      lng:           parseFloat(forma.lng) || null,
      talrunis:      forma.talrunis.trim(),
      epasts:        forma.epasts.trim(),
      apraksts:      forma.apraksts.trim(),
      pienem:        forma.pienem,
      aktiva:        true,
    }
    // Cenas
    forma.pienem.forEach(s => {
      const kol = CENU_KOLS[s]
      if (kol) dati[kol] = parseFloat(forma[kol]) || null
    })

    try {
      if (redigets) {
        await supabase.from('pirceja_vietas').update(dati).eq('id', redigets)
      } else {
        await supabase.from('pirceja_vietas').insert(dati)
      }
      setShowForma(false)
      await ieladeVietas()
    } catch (e) {
      setKlude(e.message || 'Kļūda saglabājot')
    } finally {
      setSaglabā(false)
    }
  }

  async function nomainitStatusu(id, aktiva) {
    await supabase.from('pirceja_vietas').update({ aktiva: !aktiva }).eq('id', id)
    setVietas(p => p.map(v => v.id === id ? { ...v, aktiva: !aktiva } : v))
  }

  async function dzestVietu(id) {
    if (!window.confirm('Dzēst šo iepirkuma vietu?')) return
    await supabase.from('pirceja_vietas').delete().eq('id', id)
    setVietas(p => p.filter(v => v.id !== id))
  }

  return (
    <div style={{ minHeight: '100vh', background: C.bg, color: C.text, fontFamily: F.family }}>
      <header style={{
        background: C.glass, borderBottom: `1px solid ${C.greenBdr}`,
        backdropFilter: 'blur(8px)', position: 'sticky', top: 0, zIndex: 100,
        height: 52, display: 'flex', alignItems: 'center', padding: '0 20px', gap: 16,
      }}>
        <button onClick={onBack} style={{ background: 'none', border: 'none', color: C.textMut, fontSize: F.sm, cursor: 'pointer', fontFamily: F.family, minHeight: 44 }}>← Atpakaļ</button>
        <span style={{ flex: 1, color: C.green, fontWeight: 700, fontSize: F.md }}>🏭 Manas iepirkuma vietas</span>
        <button onClick={() => atvertFormu()} style={{
          background: C.greenDk, border: `1px solid ${C.green}`, borderRadius: R.md,
          color: C.text, fontSize: F.sm, fontWeight: 700, padding: '7px 16px', cursor: 'pointer',
        }}>+ Pievienot vietu</button>
      </header>

      <main style={{ maxWidth: 700, margin: '0 auto', padding: '24px 20px 80px' }}>
        <div style={{
          background: `${C.info}11`, border: `1px solid ${C.info}33`,
          borderRadius: R.lg, padding: '12px 16px', marginBottom: 24, fontSize: F.sm, color: C.info,
        }}>
          ℹ️ Šeit reģistrētās iepirkuma vietas un cenas tiks automātiski rādītas Loģistikas kalkulatorā visiem Meža tirgus lietotājiem.
        </div>

        {loading && <div style={{ textAlign: 'center', padding: 40, color: C.textDim }}>Ielādē...</div>}

        {!loading && vietas.length === 0 && (
          <div style={{ textAlign: 'center', padding: '48px 20px', color: C.textDim }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🏭</div>
            <div style={{ fontSize: F.base, color: C.textSec, marginBottom: 8 }}>Nav reģistrētu iepirkuma vietu</div>
            <div style={{ fontSize: F.sm }}>Pievienojiet savu rūpnīcu vai iepirkuma punktu</div>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {vietas.map(v => (
            <div key={v.id} style={{
              background: C.bgCard, border: `1px solid ${v.aktiva ? C.greenBdr : C.bgInner}`,
              borderRadius: R.lg, padding: '14px 16px', opacity: v.aktiva ? 1 : 0.6,
            }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span style={{ fontWeight: 700, color: C.text, fontSize: F.base }}>{v.nosaukums}</span>
                    <span style={{
                      fontSize: F.xs, padding: '1px 7px', borderRadius: R.sm, fontWeight: 700,
                      background: v.aktiva ? `${C.green}22` : `${C.textDim}22`,
                      color: v.aktiva ? C.green : C.textDim,
                    }}>{v.aktiva ? 'Aktīva' : 'Neaktīva'}</span>
                  </div>
                  {v.novads && <div style={{ fontSize: F.xs, color: C.textDim, marginBottom: 6 }}>📍 {v.novads}{v.adrese ? ` — ${v.adrese}` : ''}</div>}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                    {(v.pienem || []).map(s => {
                      const cenaKol = CENU_KOLS[s]
                      const cena = cenaKol ? v[cenaKol] : null
                      const label = SORT_OPCIJAS.find(o => o.id === s)?.label || s
                      return (
                        <span key={s} style={{
                          background: C.bgInner, border: `1px solid ${C.greenBdr}`,
                          borderRadius: R.sm, padding: '3px 8px', fontSize: F.xs, color: C.textSec,
                        }}>
                          {label}{cena ? <span style={{ color: C.green, fontWeight: 700 }}> {cena}€</span> : ''}
                        </span>
                      )
                    })}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                  <button onClick={() => atvertFormu(v)} style={{
                    background: C.bgInner, border: `1px solid ${C.greenBdr}`, borderRadius: R.md,
                    color: C.textMut, fontSize: F.xs, padding: '5px 10px', cursor: 'pointer',
                  }}>Labot</button>
                  <button onClick={() => nomainitStatusu(v.id, v.aktiva)} style={{
                    background: C.bgInner, border: `1px solid ${C.greenBdr}`, borderRadius: R.md,
                    color: C.textMut, fontSize: F.xs, padding: '5px 10px', cursor: 'pointer',
                  }}>{v.aktiva ? 'Paslēpt' : 'Aktivēt'}</button>
                  <button onClick={() => dzestVietu(v.id)} style={{
                    background: `${C.error}11`, border: `1px solid ${C.errorBdr}`, borderRadius: R.md,
                    color: C.error, fontSize: F.xs, padding: '5px 10px', cursor: 'pointer',
                  }}>✕</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* FORMA — modālis */}
      {showForma && (
        <div onClick={() => setShowForma(false)} style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', zIndex: 2000,
          display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
        }}>
          <div onClick={e => e.stopPropagation()} style={{
            background: C.bgCard, borderRadius: `${R.xl} ${R.xl} 0 0`,
            width: '100%', maxWidth: 600, maxHeight: '92vh', overflowY: 'auto',
            padding: '24px 24px 40px', fontFamily: F.family,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: 20 }}>
              <span style={{ flex: 1, fontWeight: 700, color: C.green, fontSize: F.md }}>
                {redigets ? 'Labot iepirkuma vietu' : 'Jauna iepirkuma vieta'}
              </span>
              <button onClick={() => setShowForma(false)} style={{ background: 'none', border: 'none', color: C.textMut, fontSize: 22, cursor: 'pointer' }}>×</button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

              {/* Nosaukums */}
              <div>
                <label style={{ fontSize: F.xs, color: C.textDim, display: 'block', marginBottom: 5 }}>Nosaukums *</label>
                <input value={forma.nosaukums} onChange={e => setForma(p=>({...p, nosaukums: e.target.value}))}
                  placeholder="Uzņēmuma nosaukums vai iepirkuma punkts" style={inp} />
              </div>

              {/* Novads + adrese */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label style={{ fontSize: F.xs, color: C.textDim, display: 'block', marginBottom: 5 }}>Novads</label>
                  <select value={forma.novads} onChange={e => setForma(p=>({...p, novads: e.target.value}))}
                    style={{ ...inp }}>
                    <option value="">— izvēlies —</option>
                    {NOVADI.map(n => <option key={n}>{n}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: F.xs, color: C.textDim, display: 'block', marginBottom: 5 }}>Adrese</label>
                  <input value={forma.adrese} onChange={e => setForma(p=>({...p, adrese: e.target.value}))}
                    placeholder="Iela, pilsēta" style={inp} />
                </div>
              </div>

              {/* Koordinātas */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label style={{ fontSize: F.xs, color: C.textDim, display: 'block', marginBottom: 5 }}>Platums (lat)</label>
                  <input type="number" step="0.0001" value={forma.lat} onChange={e => setForma(p=>({...p, lat: e.target.value}))}
                    placeholder="56.9496" style={inp} />
                </div>
                <div>
                  <label style={{ fontSize: F.xs, color: C.textDim, display: 'block', marginBottom: 5 }}>Garums (lng)</label>
                  <input type="number" step="0.0001" value={forma.lng} onChange={e => setForma(p=>({...p, lng: e.target.value}))}
                    placeholder="24.1052" style={inp} />
                </div>
              </div>
              <div style={{ fontSize: F.xs, color: C.textDim }}>
                💡 Koordinātas atrod Google Maps → labais klikšķis uz vietas → kopē koordinātas
              </div>

              {/* Kontakti */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label style={{ fontSize: F.xs, color: C.textDim, display: 'block', marginBottom: 5 }}>Tālrunis</label>
                  <input value={forma.talrunis} onChange={e => setForma(p=>({...p, talrunis: e.target.value}))}
                    placeholder="+371 2X XXX XXX" style={inp} />
                </div>
                <div>
                  <label style={{ fontSize: F.xs, color: C.textDim, display: 'block', marginBottom: 5 }}>E-pasts</label>
                  <input type="email" value={forma.epasts} onChange={e => setForma(p=>({...p, epasts: e.target.value}))}
                    placeholder="iepirkumi@firma.lv" style={inp} />
                </div>
              </div>

              {/* Pieņemamie sortimenti */}
              <div>
                <label style={{ fontSize: F.xs, color: C.textDim, display: 'block', marginBottom: 8 }}>Pieņemamie sortimenti *</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {SORT_OPCIJAS.map(s => (
                    <button key={s.id} onClick={() => toggleSort(s.id)} style={{
                      padding: '6px 12px', borderRadius: R.md, cursor: 'pointer',
                      background: forma.pienem.includes(s.id) ? C.greenDk : C.bgInner,
                      border: `1px solid ${forma.pienem.includes(s.id) ? C.green : C.greenBdr}`,
                      color: forma.pienem.includes(s.id) ? C.text : C.textMut,
                      fontSize: F.xs, fontFamily: F.family,
                    }}>{s.label}</button>
                  ))}
                </div>
              </div>

              {/* Cenas izvēlētajiem sortimentiem */}
              {forma.pienem.length > 0 && (
                <div>
                  <label style={{ fontSize: F.xs, color: C.textDim, display: 'block', marginBottom: 8 }}>
                    Iepirkuma cenas (€/m³)
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                    {forma.pienem.map(s => {
                      const kol = CENU_KOLS[s]
                      const label = SORT_OPCIJAS.find(o => o.id === s)?.label || s
                      return (
                        <div key={s}>
                          <label style={{ fontSize: F.xs, color: C.textDim, display: 'block', marginBottom: 4 }}>{label}</label>
                          <input type="number" value={forma[kol] || ''} onChange={e => setForma(p=>({...p, [kol]: e.target.value}))}
                            placeholder="€/m³" style={inp} />
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Apraksts */}
              <div>
                <label style={{ fontSize: F.xs, color: C.textDim, display: 'block', marginBottom: 5 }}>Papildu informācija (neobligāti)</label>
                <textarea value={forma.apraksts} onChange={e => setForma(p=>({...p, apraksts: e.target.value}))}
                  placeholder="Pieņemšanas laiki, prasības, papildu sortimenti..." rows={2}
                  style={{ ...inp, resize: 'vertical' }} />
              </div>

              {klude && (
                <div style={{ background: C.errorBg, border: `1px solid ${C.errorBdr}`, borderRadius: R.md, padding: '8px 12px', color: C.error, fontSize: F.sm }}>
                  {klude}
                </div>
              )}

              <button onClick={saglabatVietu} disabled={saglabā} style={{
                padding: '13px 0', background: saglabā ? C.bgInner : C.greenDk,
                border: `1px solid ${saglabā ? C.greenBdr : C.green}`,
                borderRadius: R.md, color: saglabā ? C.textDim : C.text,
                fontSize: F.base, fontWeight: 700, cursor: saglabā ? 'default' : 'pointer',
                fontFamily: F.family, width: '100%',
              }}>
                {saglabā ? 'Saglabā...' : redigets ? 'Saglabāt izmaiņas' : 'Pievienot iepirkuma vietu'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
