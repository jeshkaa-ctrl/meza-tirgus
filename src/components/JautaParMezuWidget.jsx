import { useState } from 'react'
import { SISTEMA_PROMPTS } from '../mezaLikumiKnowledge'

const C = {
  bg: '#0f1a0f', card: '#111f11', border: '#2d4a2d',
  text: '#e8f5e9', textSec: '#a8d8a8', textMut: '#7ab87a', textDim: '#557a55',
  accent: '#4caf50', accentDk: '#225522', inner: '#1a2e1a', deep: '#080f08',
}

export default function JautaParMezuWidget({ onPilnsSkats }) {
  const [jautajums, setJautajums] = useState('')
  const [atbilde, setAtbilde]     = useState(null)
  const [lade, setLade]           = useState(false)

  async function jautāt(teksts) {
    const j = (teksts ?? jautajums).trim()
    if (!j || lade) return
    setJautajums('')
    setAtbilde(null)
    setLade(true)
    try {
      const resp = await fetch('/api/anthropic/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-6',
          max_tokens: 900,
          system: SISTEMA_PROMPTS,
          messages: [{ role: 'user', content: j }],
        }),
      })
      const data = await resp.json()
      const raw = data.content?.[0]?.text || ''
      let parsed = null
      try { parsed = JSON.parse(raw.replace(/```json|```/g, '').trim()) } catch {}
      setAtbilde({ jautajums: j, teksts: raw, parsed })
    } catch {
      setAtbilde({ jautajums: j, teksts: 'Savienojuma kļūda. Mēģini vēlreiz.', parsed: null })
    } finally {
      setLade(false)
    }
  }

  const ieteikumi = [
    'Kad drīkst cirst mežu bez apliecinājuma?',
    'Cik metru aizsargjosla jāatstāj pie upes?',
    'Kā rīkoties ja atradu putnu ligzdu cirsmā?',
  ]

  return (
    <div style={{
      background: C.card, border: '2px solid #4caf5044',
      borderTop: '3px solid #4caf50', borderRadius: '12px', padding: '18px 20px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '20px' }}>⚖️</span>
          <span style={{ color: C.accent, fontSize: '16px', fontWeight: 800 }}>Meža likumi — AI konsultants</span>
          <span style={{ background: '#2d4a2d', color: C.accent, fontSize: '9px', padding: '2px 6px', borderRadius: '4px', fontWeight: 700 }}>AI</span>
        </div>
        {onPilnsSkats && (
          <button onClick={onPilnsSkats} style={{
            background: 'none', border: `1px solid ${C.border}`, color: C.textMut,
            borderRadius: '6px', padding: '4px 10px', fontSize: '11px', cursor: 'pointer',
          }}>
            Pilns čats →
          </button>
        )}
      </div>

      <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
        <input
          value={jautajums}
          onChange={e => setJautajums(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') jautāt() }}
          placeholder="Uzdod jautājumu par meža likumiem..."
          style={{
            flex: 1, background: C.bg, border: `1px solid ${C.border}`,
            color: C.text, borderRadius: '8px', padding: '10px 14px',
            fontSize: '14px', outline: 'none',
          }}
        />
        <button
          onClick={() => jautāt()}
          disabled={!jautajums.trim() || lade}
          style={{
            padding: '10px 18px', borderRadius: '8px', border: 'none', flexShrink: 0,
            background: jautajums.trim() && !lade ? C.accentDk : C.inner,
            color: jautajums.trim() && !lade ? '#fff' : C.textDim,
            borderTop: `2px solid ${jautajums.trim() && !lade ? C.accent : C.border}`,
            fontSize: '14px', fontWeight: 600,
            cursor: jautajums.trim() && !lade ? 'pointer' : 'not-allowed',
          }}
        >
          {lade ? '⏳' : '→'}
        </button>
      </div>

      {!atbilde && !lade && (
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {ieteikumi.map(q => (
            <button key={q} onClick={() => jautāt(q)} style={{
              background: C.bg, border: `1px solid ${C.border}`, color: C.textMut,
              borderRadius: '20px', padding: '5px 12px', fontSize: '11px', cursor: 'pointer',
            }}>
              {q}
            </button>
          ))}
        </div>
      )}

      {lade && (
        <div style={{ display: 'flex', gap: 5, alignItems: 'center', padding: '8px 0' }}>
          {[0, 1, 2].map(i => (
            <div key={i} style={{
              width: 7, height: 7, borderRadius: '50%', background: C.accent,
              animation: `jautaPulse 1.2s ease-in-out ${i * 0.2}s infinite`,
            }} />
          ))}
          <style>{`@keyframes jautaPulse{0%,80%,100%{opacity:0.2}40%{opacity:1}}`}</style>
        </div>
      )}

      {atbilde && (
        <div style={{ marginTop: '10px' }}>
          <div style={{ fontSize: '11px', color: C.textDim, marginBottom: '6px' }}>
            Jautājums: <span style={{ color: C.textSec }}>{atbilde.jautajums}</span>
          </div>
          <div style={{
            background: C.bg, border: `1px solid ${C.border}`, borderRadius: '8px',
            padding: '12px 14px', fontSize: '13px', lineHeight: 1.7, color: C.text,
            whiteSpace: 'pre-wrap', maxHeight: '220px', overflowY: 'auto',
          }}>
            {atbilde.parsed?.atbilde || atbilde.teksts}
          </div>
          {atbilde.parsed?.avots && (
            <div style={{ fontSize: '10px', color: C.textDim, marginTop: '5px' }}>
              📋 {atbilde.parsed.avots}
            </div>
          )}
          {onPilnsSkats && (
            <button onClick={onPilnsSkats} style={{
              marginTop: '8px', background: 'none', border: `1px solid ${C.border}`,
              color: C.accent, borderRadius: '6px', padding: '5px 12px',
              fontSize: '11px', cursor: 'pointer',
            }}>
              Turpināt sarunu pilnajā čatā →
            </button>
          )}
        </div>
      )}
    </div>
  )
}
