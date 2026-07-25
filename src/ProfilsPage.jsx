import { useState } from 'react'
import { supabase } from './supabaseClient'
import { NOVADI } from './novadi'
import { DARBIBAS_VEIDI } from './RegModal'

const S = { bg: '#060d06', card: '#0a140a', bdr: '#1a3a1a', green: '#4caf50', text: '#ddeadd', muted: '#5a8a5a', dim: '#3a5a3a', err: '#ef5350' }
const inp = { width: '100%', background: '#040c04', border: `1px solid ${S.bdr}`, borderRadius: 8, color: S.text, fontSize: 13, padding: '10px 12px', outline: 'none', boxSizing: 'border-box', fontFamily: "'Inter',sans-serif" }

export default function ProfilsPage({ user, onBack, mainitParoli, iziet, atjaunotProfilu, mainitEpastu }) {
  // Paroles maiņa
  const [jauna,    setJauna]    = useState('')
  const [apstipri, setApstipri] = useState('')
  const [parStatuss, setParStatuss] = useState('')
  const [parLade,  setParLade]  = useState(false)
  const [radata,   setRadata]   = useState(false)

  // Profila rediģēšana
  const [redRezims, setRedRezims] = useState(false)
  const [rVards,    setRVards]    = useState(user?.vards        || '')
  const [rUznemums, setRUznemums] = useState(user?.uznemums     || '')
  const [rDarbiba,  setRDarbiba]  = useState(user?.darbiba      || DARBIBAS_VEIDI[0])
  const [rTalrunis, setRTalrunis] = useState(user?.talrunis     || '')
  const [rNovads,   setRNovads]   = useState(user?.bazesNovads  || '')
  const [rPapNovadi, setRPapNovadi] = useState(user?.papilduNovadi || [])
  const [rTips,     setRTips]     = useState(user?.tips         || 'privatpersona')
  const [novadsIevade, setNovadsIevade] = useState('')
  const [novadsPiedavajumi, setNovadsPiedavajumi] = useState([])
  const [redLade,   setRedLade]   = useState(false)
  const [redStatuss, setRedStatuss] = useState(null) // null | 'ok' | 'kluda'

  // E-pasta maiņa
  const [epastsRezims, setEpastsRezims] = useState(false)
  const [jaunaisEpasts, setJaunaisEpasts] = useState('')
  const [epastsLade,    setEpastsLade]    = useState(false)
  const [epastsStatuss, setEpastsStatuss] = useState(null) // null | {ok, epasts} | 'kluda'

  // Atbalsts
  const [aSaturs,  setASaturs]  = useState('')
  const [aTips,    setATips]    = useState('zina')
  const [aLade,    setALade]    = useState(false)
  const [aStatuss, setAStatuss] = useState(null)

  const iniciāļi = (user?.vards || user?.epasts || '?')
    .split(' ').map(v => v[0]).join('').toUpperCase().slice(0, 2)

  // ── Paroles maiņa ──
  async function mainit() {
    if (!jauna) return setParStatuss('❌ Ievadi jauno paroli')
    if (jauna.length < 6) return setParStatuss('❌ Parolei jābūt vismaz 6 simboli')
    if (jauna !== apstipri) return setParStatuss('❌ Paroles nesakrīt')
    setParLade(true); setParStatuss('')
    try {
      await mainitParoli(jauna)
      setParStatuss('✅ Parole veiksmīgi mainīta!')
      setJauna(''); setApstipri('')
    } catch (e) { setParStatuss('❌ ' + e.message) }
    setParLade(false)
  }

  // ── Profila saglabāšana ──
  async function saglabtProfilu() {
    setRedLade(true); setRedStatuss(null)
    try {
      const dati = {
        vards:         rVards.trim(),
        uznemums:      rTips === 'uznemums' ? rUznemums.trim() : '',
        darbiba:       rTips === 'uznemums' ? rDarbiba : '',
        talrunis:      rTips === 'uznemums' ? rTalrunis.trim() : '',
        bazesNovads:   rTips === 'uznemums' ? rNovads : '',
        papilduNovadi: rTips === 'uznemums' ? rPapNovadi : [],
        tips:          rTips,
      }
      await atjaunotProfilu(dati)
      setRedStatuss('ok')
      setRedRezims(false)
    } catch { setRedStatuss('kluda') }
    setRedLade(false)
  }

  function atsauktRedigešanu() {
    setRVards(user?.vards || ''); setRUznemums(user?.uznemums || '')
    setRDarbiba(user?.darbiba || DARBIBAS_VEIDI[0]); setRTalrunis(user?.talrunis || '')
    setRNovads(user?.bazesNovads || ''); setRPapNovadi(user?.papilduNovadi || [])
    setRTips(user?.tips || 'privatpersona')
    setRedRezims(false); setRedStatuss(null)
  }

  // ── Novadu autocomplete ──
  function novadsMainit(val) {
    setNovadsIevade(val)
    if (val.length < 1) { setNovadsPiedavajumi([]); return }
    setNovadsPiedavajumi(NOVADI.filter(n => n.toLowerCase().startsWith(val.toLowerCase())).slice(0, 5))
  }
  function pievienotNovadu(n) {
    if (!rPapNovadi.includes(n) && n !== rNovads) setRPapNovadi(prev => [...prev, n])
    setNovadsIevade(''); setNovadsPiedavajumi([])
  }

  // ── E-pasta maiņa ──
  async function saglabtEpastu() {
    if (!jaunaisEpasts.includes('@')) return setEpastsStatuss('kluda_format')
    if (jaunaisEpasts === user?.epasts) return setEpastsStatuss('kluda_same')
    setEpastsLade(true); setEpastsStatuss(null)
    try {
      await mainitEpastu(jaunaisEpasts.trim())
      setEpastsStatuss({ ok: true, epasts: jaunaisEpasts.trim() })
      setJaunaisEpasts('')
    } catch (e) { setEpastsStatuss('kluda') }
    setEpastsLade(false)
  }

  // ── Atbalsts ──
  async function nosutitAtbalstu() {
    if (!aSaturs.trim()) return
    setALade(true); setAStatuss(null)
    try {
      const { error } = await supabase.from('admin_zinas').insert({
        no_epasta: user?.epasts, vards: user?.vards || null,
        saturs: aSaturs.trim(), tips: aTips,
      })
      if (error) throw error
      await fetch('/api/email', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'contact', to: 'mezatirgus.info@gmail.com',
          no_epasta: user?.epasts, vards: user?.vards || null,
          saturs: aSaturs.trim(), tips: aTips }),
      })
      setAStatuss('ok'); setASaturs('')
    } catch { setAStatuss('kluda') }
    setALade(false)
  }

  const karte = { background: S.card, border: `1px solid ${S.bdr}`, borderRadius: 14, padding: 20 }
  const etiķete = { fontSize: 11, color: '#81c784', fontWeight: 700, marginBottom: 5, display: 'block', textTransform: 'uppercase', letterSpacing: '0.06em' }

  return (
    <div style={{ minHeight: '100vh', background: S.bg, color: S.text, fontFamily: "'Inter', sans-serif" }}>

      {/* Galvene */}
      <div style={{ background: 'rgba(6,13,6,0.97)', borderBottom: `1px solid ${S.bdr}`, padding: '0 16px', height: 52, display: 'flex', alignItems: 'center', gap: 10, position: 'sticky', top: 0, zIndex: 10 }}>
        <button onClick={onBack} style={{ background: 'transparent', border: 'none', color: S.green, fontSize: 22, cursor: 'pointer', padding: '0 4px', minWidth: 36, minHeight: 44 }}>←</button>
        <h1 style={{ margin: 0, color: S.green, fontSize: 15, fontWeight: 700 }}>👤 Mans profils</h1>
      </div>

      <div style={{ maxWidth: 480, margin: '0 auto', padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>

        {/* ── Avatar + vārds ── */}
        <div style={{ ...karte, display: 'flex', alignItems: 'center', gap: 16, padding: 24 }}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'linear-gradient(135deg,#2e7d32,#1b5e20)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, fontWeight: 700, color: '#fff', flexShrink: 0 }}>
            {iniciāļi}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: S.text }}>{user?.vards || '—'}</div>
            <div style={{ fontSize: 13, color: S.muted, marginTop: 2 }}>{user?.epasts}</div>
            <div style={{ fontSize: 11, color: S.green, marginTop: 4, background: '#0d2a0d', padding: '2px 8px', borderRadius: 10, display: 'inline-block' }}>
              {user?.tips === 'uznemums' ? '🏢 Uzņēmums' : '👤 Privātpersona'}
            </div>
          </div>
        </div>

        {/* ── Profila dati / rediģēšana ── */}
        <div style={karte}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div style={{ fontSize: 11, color: S.green, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Profila dati</div>
            {!redRezims && (
              <button onClick={() => { setRedRezims(true); setRedStatuss(null) }} style={{ background: 'none', border: `1px solid ${S.bdr}`, borderRadius: 6, color: S.muted, fontSize: 11, padding: '5px 12px', cursor: 'pointer' }}>
                ✏️ Rediģēt
              </button>
            )}
          </div>

          {!redRezims ? (
            /* Statiskais skats */
            <div>
              {redStatuss === 'ok' && (
                <div style={{ fontSize: 12, color: S.green, marginBottom: 12 }}>✅ Profils saglabāts!</div>
              )}
              {[
                { nos: 'Vārds',          val: user?.vards || '—' },
                { nos: 'Uzņēmums',       val: user?.uznemums || '—',     tikai: 'uznemums' },
                { nos: 'Darbības veids', val: user?.darbiba || '—',      tikai: 'uznemums' },
                { nos: 'Tālrunis',       val: user?.talrunis || '—',     tikai: 'uznemums' },
                { nos: 'Bāzes novads',   val: user?.bazesNovads || '—',  tikai: 'uznemums' },
                { nos: 'Papildu novadi', val: (user?.papilduNovadi || []).join(', ') || '—', tikai: 'uznemums' },
              ].filter(r => !r.tikai || user?.tips === r.tikai).map(r => (
                <div key={r.nos} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: `1px solid #0d1a0d` }}>
                  <span style={{ fontSize: 13, color: S.muted }}>{r.nos}</span>
                  <span style={{ fontSize: 13, color: S.text, textAlign: 'right', maxWidth: '60%', wordBreak: 'break-word' }}>{r.val}</span>
                </div>
              ))}
            </div>
          ) : (
            /* Rediģēšanas forma */
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

              {/* Tips */}
              <div>
                <span style={etiķete}>Konta tips</span>
                <div style={{ display: 'flex', gap: 8 }}>
                  {[['privatpersona','👤 Privātpersona'],['uznemums','🏢 Uzņēmums']].map(([id,nos]) => (
                    <button key={id} onClick={() => setRTips(id)} style={{
                      flex: 1, padding: '8px', borderRadius: 6, cursor: 'pointer', border: 'none',
                      background: rTips === id ? '#1b5e20' : '#040c04',
                      color: rTips === id ? '#fff' : S.muted,
                      fontSize: 12, fontWeight: rTips === id ? 700 : 400,
                      outline: rTips === id ? 'none' : `1px solid ${S.bdr}`,
                    }}>{nos}</button>
                  ))}
                </div>
              </div>

              {/* Vārds */}
              <div>
                <span style={etiķete}>Vārds, uzvārds</span>
                <input value={rVards} onChange={e => setRVards(e.target.value)} style={inp} placeholder="Vārds Uzvārds" />
              </div>

              {rTips === 'uznemums' && <>
                <div>
                  <span style={etiķete}>Uzņēmuma nosaukums</span>
                  <input value={rUznemums} onChange={e => setRUznemums(e.target.value)} style={inp} placeholder="SIA Piemērs" />
                </div>
                <div>
                  <span style={etiķete}>Darbības veids</span>
                  <select value={rDarbiba} onChange={e => setRDarbiba(e.target.value)}
                    style={{ ...inp, appearance: 'none' }}>
                    {DARBIBAS_VEIDI.map(d => <option key={d}>{d}</option>)}
                  </select>
                </div>
                <div>
                  <span style={etiķete}>Tālrunis</span>
                  <input type="tel" value={rTalrunis} onChange={e => setRTalrunis(e.target.value)} style={inp} placeholder="+371 2X XXX XXX" />
                </div>
                <div>
                  <span style={etiķete}>Bāzes novads</span>
                  <select value={rNovads} onChange={e => setRNovads(e.target.value)}
                    style={{ ...inp, appearance: 'none' }}>
                    <option value="">— izvēlies —</option>
                    {NOVADI.map(n => <option key={n}>{n}</option>)}
                  </select>
                </div>
                <div>
                  <span style={etiķete}>Papildu darbības novadi</span>
                  <div style={{ position: 'relative' }}>
                    <input value={novadsIevade} onChange={e => novadsMainit(e.target.value)}
                      onBlur={() => setTimeout(() => setNovadsPiedavajumi([]), 150)}
                      placeholder="Raksti novada nosaukumu..." style={inp} />
                    {novadsPiedavajumi.length > 0 && (
                      <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: '#0d1a0d', border: `1px solid ${S.bdr}`, borderRadius: 6, zIndex: 10, boxShadow: '0 4px 12px rgba(0,0,0,0.4)' }}>
                        {novadsPiedavajumi.map(n => (
                          <div key={n} onMouseDown={() => pievienotNovadu(n)}
                            style={{ padding: '8px 12px', cursor: 'pointer', fontSize: 13, color: S.text, borderBottom: `1px solid ${S.bdr}` }}
                            onMouseEnter={e => e.target.style.background = '#1a3a1a'}
                            onMouseLeave={e => e.target.style.background = 'transparent'}>
                            {n}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  {rPapNovadi.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 8 }}>
                      {rPapNovadi.map(n => (
                        <span key={n} style={{ background: '#0d2a0d', border: `1px solid ${S.bdr}`, borderRadius: 4, padding: '3px 8px', fontSize: 11, display: 'flex', alignItems: 'center', gap: 4, color: S.text }}>
                          {n}
                          <button onClick={() => setRPapNovadi(prev => prev.filter(x => x !== n))}
                            style={{ background: 'none', border: 'none', color: S.err, cursor: 'pointer', fontWeight: 700, padding: 0, fontSize: 12 }}>×</button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </>}

              {redStatuss === 'kluda' && (
                <div style={{ color: S.err, fontSize: 12 }}>⚠️ Kļūda saglabājot. Mēģiniet vēlreiz.</div>
              )}
              <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                <button onClick={saglabtProfilu} disabled={redLade} style={{
                  flex: 1, padding: 12, background: redLade ? '#1a3a1a' : '#2e7d32',
                  color: '#fff', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 700, cursor: redLade ? 'default' : 'pointer',
                }}>{redLade ? 'Saglabā...' : '💾 Saglabāt izmaiņas'}</button>
                <button onClick={atsauktRedigešanu} style={{
                  padding: '12px 18px', background: 'transparent', border: `1px solid ${S.bdr}`,
                  borderRadius: 8, color: S.muted, fontSize: 13, cursor: 'pointer',
                }}>Atcelt</button>
              </div>
            </div>
          )}
        </div>

        {/* ── E-pasta maiņa ── */}
        <div style={karte}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: epastsRezims ? 14 : 0 }}>
            <div style={{ fontSize: 11, color: S.green, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>E-pasta adrese</div>
            {!epastsRezims ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 13, color: S.text }}>{user?.epasts}</span>
                <button onClick={() => { setEpastsRezims(true); setEpastsStatuss(null) }} style={{ background: 'none', border: `1px solid ${S.bdr}`, borderRadius: 6, color: S.muted, fontSize: 11, padding: '5px 12px', cursor: 'pointer' }}>
                  ✏️ Mainīt
                </button>
              </div>
            ) : epastsStatuss?.ok ? (
              <div style={{ width: '100%' }}>
                <div style={{ textAlign: 'center', padding: '12px 0' }}>
                  <div style={{ fontSize: 28, marginBottom: 8 }}>✉️</div>
                  <div style={{ color: '#81c784', fontSize: 14, fontWeight: 700, marginBottom: 4 }}>Apstiprinājums nosūtīts!</div>
                  <div style={{ color: S.muted, fontSize: 12, lineHeight: 1.5 }}>
                    Pārbaudiet <strong style={{ color: S.text }}>{epastsStatuss.epasts}</strong> iesūtni<br />
                    un klikšķiniet uz apstiprinājuma saites.<br />
                    Maiņa stāsies spēkā pēc apstiprināšanas.
                  </div>
                  <button onClick={() => { setEpastsRezims(false); setEpastsStatuss(null) }} style={{ marginTop: 12, padding: '7px 18px', background: 'transparent', border: `1px solid ${S.bdr}`, borderRadius: 7, color: S.muted, fontSize: 12, cursor: 'pointer' }}>Aizvērt</button>
                </div>
              </div>
            ) : (
              <div style={{ width: '100%' }}>
                <div style={{ fontSize: 12, color: S.muted, lineHeight: 1.5, marginBottom: 10 }}>
                  Uz jauno e-pastu tiks nosūtīts apstiprinājums. Maiņa stāsies spēkā pēc klikšķa uz saites. Vecais e-pasts paliek aktīvs līdz apstiprinājumam.
                </div>
                <div style={{ marginBottom: 10 }}>
                  <span style={etiķete}>Jaunais e-pasts</span>
                  <input type="email" value={jaunaisEpasts} onChange={e => { setJaunaisEpasts(e.target.value); setEpastsStatuss(null) }}
                    placeholder="jauns@epasts.lv"
                    style={{ ...inp, border: `1px solid ${epastsStatuss?.startsWith?.('kluda') ? S.err : S.bdr}` }} />
                </div>
                {epastsStatuss === 'kluda_format' && <div style={{ color: S.err, fontSize: 12, marginBottom: 8 }}>⚠️ Nepareizs e-pasta formāts.</div>}
                {epastsStatuss === 'kluda_same'   && <div style={{ color: S.err, fontSize: 12, marginBottom: 8 }}>⚠️ Jaunais e-pasts sakrīt ar pašreizējo.</div>}
                {epastsStatuss === 'kluda'         && <div style={{ color: S.err, fontSize: 12, marginBottom: 8 }}>⚠️ Kļūda. Mēģiniet vēlreiz.</div>}
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={saglabtEpastu} disabled={epastsLade || !jaunaisEpasts} style={{
                    flex: 1, padding: 11, background: epastsLade || !jaunaisEpasts ? '#1a3a1a' : '#2e7d32',
                    color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: epastsLade || !jaunaisEpasts ? 'default' : 'pointer',
                  }}>{epastsLade ? 'Sūta...' : '📤 Nosūtīt apstiprinājumu'}</button>
                  <button onClick={() => { setEpastsRezims(false); setJaunaisEpasts(''); setEpastsStatuss(null) }} style={{
                    padding: '11px 16px', background: 'transparent', border: `1px solid ${S.bdr}`,
                    borderRadius: 8, color: S.muted, fontSize: 12, cursor: 'pointer',
                  }}>Atcelt</button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── Paroles maiņa ── */}
        <div style={karte}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontSize: 11, color: S.green, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Parole</div>
            <button onClick={() => setRadata(r => !r)} style={{ background: 'none', border: `1px solid ${S.bdr}`, borderRadius: 6, color: S.muted, fontSize: 11, padding: '5px 12px', cursor: 'pointer' }}>
              {radata ? 'Paslēpt' : '🔑 Mainīt paroli'}
            </button>
          </div>
          {radata && (
            <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ fontSize: 12, color: S.muted, lineHeight: 1.5 }}>
                Paroles netiek glabātas atklātā tekstā. Ievadi jauno paroli.
              </div>
              <div>
                <span style={etiķete}>Jaunā parole</span>
                <input type="password" value={jauna} onChange={e => setJauna(e.target.value)}
                  placeholder="vismaz 6 simboli" style={inp} />
              </div>
              <div>
                <span style={etiķete}>Apstiprini paroli</span>
                <input type="password" value={apstipri} onChange={e => setApstipri(e.target.value)}
                  placeholder="atkārtoti ievadi paroli" style={inp} />
              </div>
              {parStatuss && (
                <div style={{ fontSize: 13, color: parStatuss.startsWith('✅') ? S.green : S.err }}>{parStatuss}</div>
              )}
              <button onClick={mainit} disabled={parLade} style={{
                width: '100%', padding: 12, background: parLade ? '#1a3a1a' : '#2e7d32',
                color: '#fff', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 700, cursor: 'pointer',
              }}>{parLade ? 'Saglabā...' : '🔑 Saglabāt jauno paroli'}</button>
            </div>
          )}
        </div>

        {/* ── Sazināties ar atbalstu ── */}
        <div style={karte}>
          <div style={{ fontSize: 11, color: S.green, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 14 }}>✉️ Sazināties ar atbalstu</div>
          {aStatuss === 'ok' ? (
            <div style={{ textAlign: 'center', padding: '16px 0' }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>✅</div>
              <div style={{ color: '#81c784', fontSize: 14, fontWeight: 700, marginBottom: 4 }}>Ziņa nosūtīta!</div>
              <div style={{ color: S.muted, fontSize: 12 }}>Atbildēsim uz {user?.epasts} drīzumā.</div>
              <button onClick={() => setAStatuss(null)} style={{ marginTop: 12, padding: '7px 18px', background: 'transparent', border: `1px solid ${S.bdr}`, borderRadius: 7, color: S.muted, fontSize: 12, cursor: 'pointer' }}>Sūtīt vēl</button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', gap: 8 }}>
                {[['zina','💬 Ziņa'],['sudziba','⚠️ Sūdzība']].map(([id,nos]) => (
                  <button key={id} onClick={() => setATips(id)} style={{
                    padding: '7px 16px', borderRadius: 6, cursor: 'pointer', border: 'none',
                    background: aTips === id ? '#2e7d32' : '#0d1a0d',
                    color: aTips === id ? '#fff' : S.muted,
                    fontSize: 12, fontWeight: aTips === id ? 700 : 400,
                    outline: aTips === id ? 'none' : `1px solid ${S.bdr}`,
                  }}>{nos}</button>
                ))}
              </div>
              <textarea value={aSaturs} onChange={e => { setASaturs(e.target.value); setAStatuss(null) }} rows={4}
                placeholder="Aprakstiet jautājumu vai problēmu..."
                style={{ ...inp, border: `1px solid ${aStatuss === 'kluda' ? S.err : S.bdr}`, resize: 'vertical', lineHeight: 1.6 }} />
              {aStatuss === 'kluda' && <div style={{ color: S.err, fontSize: 12 }}>⚠️ Kļūda nosūtot. Mēģiniet vēlreiz.</div>}
              <button onClick={nosutitAtbalstu} disabled={aLade || !aSaturs.trim()} style={{
                width: '100%', padding: 12, background: aLade || !aSaturs.trim() ? '#1a3a1a' : '#2e7d32',
                color: '#fff', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 700, cursor: aLade || !aSaturs.trim() ? 'default' : 'pointer',
              }}>{aLade ? 'Sūta...' : '📤 Nosūtīt'}</button>
            </div>
          )}
        </div>

        {/* ── Iziet ── */}
        <button onClick={iziet} style={{
          width: '100%', padding: 13, background: 'transparent',
          color: S.err, border: '1px solid #4a1010', borderRadius: 10,
          fontSize: 14, fontWeight: 600, cursor: 'pointer',
        }}>
          Izrakstīties no konta
        </button>

      </div>
    </div>
  )
}
