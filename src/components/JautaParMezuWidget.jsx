import { useState } from 'react'
import { SISTEMA_PROMPTS } from '../mezaLikumiKnowledge'
import { C, F, R, S, spinnerCSS } from '../ds'
import { acmHeaders } from '../utils/acm'

const IETEIKUMI = [
  'Kad drīkst cirst mežu bez apliecinājuma?',
  'Cik metru aizsargjosla upei Gauja?',
  'Kā rīkoties ja atradu putnu ligzdu cirsmā?',
]

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
        headers: acmHeaders(),
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

  return (
    <div style={{
      background: C.bgCard, border: `2px solid ${C.green}33`,
      borderTop: `3px solid ${C.green}`, borderRadius: R.xl, padding: S.lg,
      fontFamily: F.family,
    }}>
      <style>{spinnerCSS}{`
        .jw-chip:hover { background: ${C.bgInner} !important; border-color: ${C.greenBdrLt} !important; }
        .jw-pilns:hover { background: ${C.bgInner} !important; }
      `}</style>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: S.md, flexWrap: 'wrap', gap: S.sm }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: S.sm }}>
          <span style={{ fontSize: 20 }}>⚖️</span>
          <span style={{ color: C.green, fontSize: F.md, fontWeight: F.weightBold }}>Meža likumi — AI konsultants</span>
          <span style={{
            background: `${C.green}22`, color: C.green, fontSize: '9px',
            padding: '2px 6px', borderRadius: R.full, fontWeight: F.weightBold, border: `1px solid ${C.green}44`,
          }}>AI</span>
        </div>
        {onPilnsSkats && (
          <button className="jw-pilns" onClick={onPilnsSkats} style={{
            background: 'transparent', border: `1px solid ${C.greenBdr}`,
            color: C.textMut, borderRadius: R.md, padding: '5px 12px',
            fontSize: F.xs, cursor: 'pointer', fontFamily: F.family,
          }}>
            Pilns čats →
          </button>
        )}
      </div>

      {/* Input */}
      <div style={{ display: 'flex', gap: S.sm, marginBottom: S.sm }}>
        <input
          value={jautajums}
          onChange={e => setJautajums(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') jautāt() }}
          placeholder="Uzdod jautājumu par meža likumiem..."
          style={{
            flex: 1, background: C.bg, border: `1px solid ${C.greenBdr}`,
            color: C.text, borderRadius: R.md, padding: '10px 14px',
            fontSize: F.base, outline: 'none', fontFamily: F.family, minHeight: 44,
          }}
        />
        <button
          onClick={() => jautāt()}
          disabled={!jautajums.trim() || lade}
          style={{
            padding: '10px 20px', borderRadius: R.md, border: 'none', flexShrink: 0,
            background: (jautajums.trim() && !lade) ? C.greenDk : C.bgInner,
            color: (jautajums.trim() && !lade) ? '#fff' : C.textFade,
            borderTop: `2px solid ${(jautajums.trim() && !lade) ? C.green : C.greenBdr}`,
            fontSize: F.base, fontWeight: F.weightBold, cursor: (jautajums.trim() && !lade) ? 'pointer' : 'not-allowed',
            minHeight: 44, fontFamily: F.family, transition: 'all 0.15s',
          }}
        >
          {lade ? '⏳' : '→'}
        </button>
      </div>

      {/* Ieteikumi */}
      {!atbilde && !lade && (
        <div style={{ display: 'flex', gap: S.sm, flexWrap: 'wrap' }}>
          {IETEIKUMI.map(q => (
            <button key={q} className="jw-chip" onClick={() => jautāt(q)} style={{
              background: C.bg, border: `1px solid ${C.greenBdr}`,
              color: C.textMut, borderRadius: R.full, padding: '5px 14px',
              fontSize: F.xs, cursor: 'pointer', fontFamily: F.family, transition: 'all 0.15s',
            }}>
              {q}
            </button>
          ))}
        </div>
      )}

      {/* Loading */}
      {lade && (
        <div style={{ display: 'flex', gap: 5, alignItems: 'center', padding: `${S.sm} 0` }}>
          {[0, 1, 2].map(i => (
            <div key={i} style={{
              width: 7, height: 7, borderRadius: '50%', background: C.green,
              animation: `mt-pulse 1.2s ease-in-out ${i * 0.2}s infinite`,
            }} />
          ))}
          <span style={{ color: C.textDim, fontSize: F.xs, marginLeft: S.sm }}>Analizē jautājumu...</span>
        </div>
      )}

      {/* Atbilde */}
      {atbilde && (
        <div style={{ marginTop: S.sm }} className="mt-fade">
          <div style={{ fontSize: F.xs, color: C.textDim, marginBottom: S.sm }}>
            Jautājums: <span style={{ color: C.textSec }}>{atbilde.jautajums}</span>
          </div>
          <div style={{
            background: C.bg, border: `1px solid ${C.greenBdr}`, borderRadius: R.md,
            padding: S.md, fontSize: F.sm, lineHeight: F.lineHeight, color: C.text,
            whiteSpace: 'pre-wrap', maxHeight: 240, overflowY: 'auto',
          }}>
            {atbilde.parsed?.atbilde || atbilde.teksts}
          </div>
          {atbilde.parsed?.avots && (
            <div style={{ fontSize: F.xs, color: C.textDim, marginTop: S.sm }}>
              📋 {atbilde.parsed.avots}
            </div>
          )}
          {onPilnsSkats && (
            <button className="jw-pilns" onClick={onPilnsSkats} style={{
              marginTop: S.sm, background: 'transparent', border: `1px solid ${C.greenBdr}`,
              color: C.green, borderRadius: R.md, padding: '7px 14px',
              fontSize: F.xs, cursor: 'pointer', fontFamily: F.family,
            }}>
              Turpināt pilnajā čatā →
            </button>
          )}
        </div>
      )}
    </div>
  )
}
