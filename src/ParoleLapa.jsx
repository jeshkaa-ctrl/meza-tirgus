import { useState } from 'react'
import { C, F, R } from './ds'

export default function ParoleLapa({ onBack, mainitParoli }) {
  const [veca,    setVeca]    = useState('')
  const [jauna,   setJauna]   = useState('')
  const [atk,     setAtk]     = useState('')
  const [klude,   setKlude]   = useState('')
  const [veiksme, setVeiksme] = useState(false)
  const [lade,    setLade]    = useState(false)

  const inp = {
    background: C.bgInner, border: `1px solid ${C.greenBdr}`,
    borderRadius: R.md, padding: '10px 14px', color: C.text,
    fontSize: F.base, width: '100%', boxSizing: 'border-box',
    outline: 'none', fontFamily: F.family,
  }

  async function saglabat() {
    setKlude('')
    if (!jauna) return setKlude('Ievadi jauno paroli.')
    if (jauna.length < 6) return setKlude('Parolei jābūt vismaz 6 simboli.')
    if (jauna !== atk) return setKlude('Paroles nesakrīt.')
    setLade(true)
    try {
      await mainitParoli(jauna)
      setVeiksme(true)
      setTimeout(onBack, 2000)
    } catch (e) {
      setKlude(e.message || 'Kļūda. Mēģini vēlreiz.')
    } finally {
      setLade(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: C.bg, color: C.text, fontFamily: F.family }}>
      <header style={{
        background: C.glass, borderBottom: `1px solid ${C.greenBdr}`,
        backdropFilter: 'blur(8px)', position: 'sticky', top: 0, zIndex: 100,
        height: 52, display: 'flex', alignItems: 'center', padding: '0 20px', gap: 16,
      }}>
        <button onClick={onBack} style={{
          background: 'none', border: 'none', color: C.textMut,
          fontSize: F.sm, cursor: 'pointer', fontFamily: F.family, minHeight: 44,
        }}>← Atpakaļ</button>
        <span style={{ color: C.green, fontWeight: 700, fontSize: F.md }}>🔑 Mainīt paroli</span>
      </header>

      <main style={{ maxWidth: 420, margin: '60px auto', padding: '0 20px' }}>
        <div style={{
          background: C.bgCard, border: `1px solid ${C.greenBdr}`,
          borderRadius: R.xl, padding: 28,
        }}>
          {veiksme ? (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>✅</div>
              <div style={{ color: C.green, fontWeight: 700, fontSize: F.lg }}>Parole nomainīta!</div>
              <div style={{ color: C.textDim, fontSize: F.sm, marginTop: 8 }}>Atgriežamies atpakaļ...</div>
            </div>
          ) : (
            <>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <label style={{ fontSize: F.xs, color: C.textDim, display: 'block', marginBottom: 6 }}>Jaunā parole</label>
                  <input type="password" value={jauna} onChange={e => setJauna(e.target.value)}
                    placeholder="Vismaz 6 simboli" style={inp} />
                </div>
                <div>
                  <label style={{ fontSize: F.xs, color: C.textDim, display: 'block', marginBottom: 6 }}>Atkārtot jauno paroli</label>
                  <input type="password" value={atk} onChange={e => setAtk(e.target.value)}
                    placeholder="Vēlreiz" style={inp}
                    onKeyDown={e => e.key === 'Enter' && saglabat()} />
                </div>
              </div>

              {klude && (
                <div style={{
                  marginTop: 14, padding: '8px 12px', background: C.errorBg,
                  border: `1px solid ${C.errorBdr}`, borderRadius: R.md,
                  color: C.error, fontSize: F.sm,
                }}>{klude}</div>
              )}

              <button onClick={saglabat} disabled={lade} style={{
                width: '100%', marginTop: 20, padding: '12px 0',
                background: lade ? C.bgInner : C.greenDk,
                border: `1px solid ${lade ? C.greenBdr : C.green}`,
                borderRadius: R.md, color: lade ? C.textDim : C.text,
                fontSize: F.base, fontWeight: 600, cursor: lade ? 'default' : 'pointer',
                fontFamily: F.family,
              }}>
                {lade ? 'Saglabā...' : 'Saglabāt jauno paroli'}
              </button>
            </>
          )}
        </div>
      </main>
    </div>
  )
}
