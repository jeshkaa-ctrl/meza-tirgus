import { useState } from 'react'
import { supabase } from './supabaseClient'

export default function ProfilsPage({ user, onBack, mainitParoli, iziet }) {
  const [jauna,    setJauna]    = useState('')
  const [apstipri, setApstipri] = useState('')
  const [statuss,  setStatuss]  = useState('')
  const [lade,     setLade]     = useState(false)
  const [radata,   setRadata]   = useState(false)

  const [aSaturs,  setASaturs]  = useState('')
  const [aTips,    setATips]    = useState('zina')
  const [aLade,    setALade]    = useState(false)
  const [aStatuss, setAStatuss] = useState(null)

  async function nosutitAtbalstu() {
    if (!aSaturs.trim()) return
    setALade(true); setAStatuss(null)
    try {
      const { error } = await supabase.from('admin_zinas').insert({
        no_epasta: user.epasts,
        vards:     user.vards || null,
        saturs:    aSaturs.trim(),
        tips:      aTips,
      })
      if (error) throw error
      await fetch('/api/email', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'contact', to: 'mezatirgus.info@gmail.com',
          no_epasta: user.epasts, vards: user.vards || null,
          saturs: aSaturs.trim(), tips: aTips,
        }),
      })
      setAStatuss('ok'); setASaturs('')
    } catch { setAStatuss('kluda') }
    setALade(false)
  }

  const iniciāļi = (user.vards || user.epasts || '?')
    .split(' ').map(v => v[0]).join('').toUpperCase().slice(0, 2)

  async function mainit() {
    if (!jauna) return setStatuss('❌ Ievadi jauno paroli')
    if (jauna.length < 6) return setStatuss('❌ Parolei jābūt vismaz 6 simboli')
    if (jauna !== apstipri) return setStatuss('❌ Paroles nesakrīt')
    setLade(true)
    setStatuss('')
    try {
      await mainitParoli(jauna)
      setStatuss('✅ Parole veiksmīgi mainīta!')
      setJauna('')
      setApstipri('')
    } catch (e) {
      setStatuss('❌ ' + e.message)
    }
    setLade(false)
  }

  return (
    <div style={{ minHeight: '100vh', background: '#060d06', color: '#ddeadd', fontFamily: "'Inter', sans-serif" }}>

      {/* Galvene */}
      <div style={{ background: 'rgba(6,13,6,0.97)', borderBottom: '1px solid #1a3a1a', padding: '0 16px', height: 52, display: 'flex', alignItems: 'center', gap: 10, position: 'sticky', top: 0, zIndex: 10 }}>
        <button onClick={onBack} style={{ background: 'transparent', border: 'none', color: '#4caf50', fontSize: 22, cursor: 'pointer', padding: '0 4px', minWidth: 36, minHeight: 44 }}>←</button>
        <h1 style={{ margin: 0, color: '#4caf50', fontSize: 15, fontWeight: 700 }}>👤 Mans profils</h1>
      </div>

      <div style={{ maxWidth: 480, margin: '0 auto', padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>

        {/* Avatar + vārds */}
        <div style={{ background: '#0a140a', border: '1px solid #1a3a1a', borderRadius: 14, padding: 24, display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'linear-gradient(135deg,#2e7d32,#1b5e20)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, fontWeight: 700, color: '#fff', flexShrink: 0 }}>
            {iniciāļi}
          </div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#ddeadd' }}>{user.vards || '—'}</div>
            <div style={{ fontSize: 13, color: '#5a8a5a', marginTop: 2 }}>{user.epasts}</div>
            <div style={{ fontSize: 11, color: '#2e7d32', marginTop: 4, background: '#0d2a0d', padding: '2px 8px', borderRadius: 10, display: 'inline-block' }}>
              {user.tips === 'uznemums' ? '🏢 Uzņēmums' : '👤 Privātpersona'}
            </div>
          </div>
        </div>

        {/* Reģistrācijas dati */}
        <div style={{ background: '#0a140a', border: '1px solid #1a3a1a', borderRadius: 14, padding: 20 }}>
          <div style={{ fontSize: 11, color: '#4caf50', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 14 }}>Reģistrācijas dati</div>
          {[
            { nos: 'E-pasts', val: user.epasts },
            { nos: 'Vārds', val: user.vards || '—' },
            { nos: 'Tālrunis', val: user.talrunis || '—' },
            { nos: 'Uzņēmums', val: user.uznemums || '—' },
            { nos: 'Novads', val: user.bazesNovads || '—' },
          ].map(r => (
            <div key={r.nos} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #0d1a0d' }}>
              <span style={{ fontSize: 13, color: '#5a8a5a' }}>{r.nos}</span>
              <span style={{ fontSize: 13, color: '#ddeadd', textAlign: 'right', maxWidth: '60%', wordBreak: 'break-word' }}>{r.val}</span>
            </div>
          ))}
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0' }}>
            <span style={{ fontSize: 13, color: '#5a8a5a' }}>Parole</span>
            <span style={{ fontSize: 13, color: '#2e5e2e', fontStyle: 'italic' }}>••••••••&nbsp;
              <button onClick={() => setRadata(r => !r)} style={{ background: 'none', border: 'none', color: '#4caf50', fontSize: 11, cursor: 'pointer', padding: 0 }}>
                {radata ? 'paslēpt' : 'mainīt ↓'}
              </button>
            </span>
          </div>
        </div>

        {/* Paroles maiņa */}
        {radata && (
          <div style={{ background: '#0a140a', border: '1px solid #2e7d32', borderRadius: 14, padding: 20 }}>
            <div style={{ fontSize: 11, color: '#4caf50', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 14 }}>Mainīt paroli</div>
            <div style={{ fontSize: 12, color: '#5a8a5a', marginBottom: 12, lineHeight: 1.5 }}>
              Drošības dēļ paroles netiek glabātas atklātā tekstā. Vari iestatīt jaunu paroli.
            </div>
            <div style={{ marginBottom: 10 }}>
              <div style={{ fontSize: 11, color: '#81c784', marginBottom: 4 }}>Jaunā parole</div>
              <input
                type="password" value={jauna} onChange={e => setJauna(e.target.value)}
                placeholder="vismaz 6 simboli"
                style={{ width: '100%', background: '#040c04', border: '1px solid #1a3a1a', borderRadius: 8, color: '#ddeadd', fontSize: 14, padding: '10px 12px', outline: 'none', boxSizing: 'border-box' }}
              />
            </div>
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 11, color: '#81c784', marginBottom: 4 }}>Apstiprini paroli</div>
              <input
                type="password" value={apstipri} onChange={e => setApstipri(e.target.value)}
                placeholder="atkārtoti ievadi paroli"
                style={{ width: '100%', background: '#040c04', border: '1px solid #1a3a1a', borderRadius: 8, color: '#ddeadd', fontSize: 14, padding: '10px 12px', outline: 'none', boxSizing: 'border-box' }}
              />
            </div>
            {statuss && (
              <div style={{ fontSize: 13, color: statuss.startsWith('✅') ? '#4caf50' : '#ef5350', marginBottom: 10 }}>{statuss}</div>
            )}
            <button onClick={mainit} disabled={lade} style={{
              width: '100%', padding: 12, background: lade ? '#1a3a1a' : '#2e7d32',
              color: '#fff', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 700, cursor: 'pointer',
            }}>
              {lade ? 'Saglabā...' : '🔑 Saglabāt jauno paroli'}
            </button>
          </div>
        )}

        {/* Sazināties ar atbalstu */}
        <div style={{ background: '#0a140a', border: '1px solid #1a3a1a', borderRadius: 14, padding: 20 }}>
          <div style={{ fontSize: 11, color: '#4caf50', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 14 }}>✉️ Sazināties ar atbalstu</div>
          {aStatuss === 'ok' ? (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>✅</div>
              <div style={{ color: '#81c784', fontSize: 14, fontWeight: 700, marginBottom: 4 }}>Ziņa nosūtīta!</div>
              <div style={{ color: '#5a8a5a', fontSize: 12 }}>Atbildēsim uz {user.epasts} drīzumā.</div>
              <button onClick={() => setAStatuss(null)} style={{ marginTop: 12, padding: '7px 18px', background: 'transparent', border: '1px solid #2e7d32', borderRadius: 7, color: '#4caf50', fontSize: 12, cursor: 'pointer' }}>Sūtīt vēl</button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', gap: 8 }}>
                {[
                  { id: 'zina',    nos: '💬 Ziņa' },
                  { id: 'sudziba', nos: '⚠️ Sūdzība' },
                ].map(t => (
                  <button key={t.id} onClick={() => setATips(t.id)} style={{
                    padding: '7px 16px', borderRadius: 6, cursor: 'pointer', border: 'none',
                    background: aTips === t.id ? '#2e7d32' : '#0d1a0d',
                    color: aTips === t.id ? '#fff' : '#5a8a5a',
                    fontSize: 12, fontWeight: aTips === t.id ? 700 : 400,
                    outline: aTips === t.id ? 'none' : '1px solid #1a3a1a',
                  }}>{t.nos}</button>
                ))}
              </div>
              <textarea value={aSaturs} onChange={e => { setASaturs(e.target.value); setAStatuss(null) }} rows={4}
                placeholder="Aprakstiet jautājumu vai problēmu..."
                style={{ width: '100%', background: '#040c04', border: `1px solid ${aStatuss === 'kluda' ? '#ef5350' : '#1a3a1a'}`, borderRadius: 8, color: '#ddeadd', fontSize: 13, padding: '10px 12px', outline: 'none', boxSizing: 'border-box', fontFamily: "'Inter',sans-serif", resize: 'vertical', lineHeight: 1.6 }} />
              {aStatuss === 'kluda' && (
                <div style={{ color: '#ef5350', fontSize: 12 }}>⚠️ Kļūda nosūtot. Mēģiniet vēlreiz.</div>
              )}
              <button onClick={nosutitAtbalstu} disabled={aLade || !aSaturs.trim()} style={{
                width: '100%', padding: 12, background: aLade || !aSaturs.trim() ? '#1a3a1a' : '#2e7d32',
                color: '#fff', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 700, cursor: aLade || !aSaturs.trim() ? 'default' : 'pointer',
              }}>
                {aLade ? 'Sūta...' : '📤 Nosūtīt'}
              </button>
            </div>
          )}
        </div>

        {/* Iziet */}
        <button onClick={iziet} style={{
          width: '100%', padding: 13, background: 'transparent',
          color: '#ef5350', border: '1px solid #4a1010', borderRadius: 10,
          fontSize: 14, fontWeight: 600, cursor: 'pointer',
        }}>
          Izrakstīties no konta
        </button>

      </div>
    </div>
  )
}
