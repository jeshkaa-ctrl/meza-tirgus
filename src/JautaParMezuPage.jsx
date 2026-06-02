import { useState, useRef, useEffect } from 'react'
import { SISTEMA_PROMPTS, KATEGORIJAS } from './mezaLikumiKnowledge'
import { C as DS, F, R, spinnerCSS } from './ds'

const C = {
  bg: DS.bg, card: DS.bgCard, inner: DS.bgInner, deep: DS.bgDeep,
  border: DS.greenBdr, text: DS.text, textSec: DS.textSec, textMut: DS.textMut,
  textDim: DS.textDim, accent: DS.green, accentDk: DS.greenDk,
  warn: DS.warn, info: DS.info, error: DS.error,
}

const inp = {
  background: C.deep, border: `1px solid ${C.border}`, color: C.text,
  borderRadius: R.md, padding: '10px 14px', fontSize: F.base,
  width: '100%', boxSizing: 'border-box', outline: 'none', resize: 'vertical',
  fontFamily: F.family,
}

// ─── Kontaktu karte ───────────────────────────────────────────────────────────
function KontaktuKarte({ kontakti }) {
  if (!kontakti?.length) return null
  return (
    <div style={{
      background: C.deep, border: `1px solid ${C.border}`,
      borderRadius: 8, padding: '10px 12px', marginTop: 10,
    }}>
      <div style={{ fontSize: 10, fontWeight: 700, color: C.textDim, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
        Konsultācijām un precizēšanai:
      </div>
      {kontakti.map((k, i) => (
        <div key={i} style={{ marginBottom: i < kontakti.length - 1 ? 12 : 0 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: C.accent }}>{k.iestade}</div>
          {k.par && <div style={{ fontSize: 11, color: C.textMut, marginTop: 1, marginBottom: 4 }}>{k.par}</div>}
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {k.talrunis && (
              <a href={`tel:${k.talrunis}`} style={{ fontSize: 12, color: C.info, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>
                📞 {k.talrunis}
              </a>
            )}
            {k.epasts && (
              <a href={`mailto:${k.epasts}`} style={{ fontSize: 12, color: C.info, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>
                ✉️ {k.epasts}
              </a>
            )}
            {k.www && (
              <a href={`https://${k.www}`} target="_blank" rel="noreferrer" style={{ fontSize: 12, color: C.info, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>
                🌐 {k.www}
              </a>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── Viena ziņa ───────────────────────────────────────────────────────────────
function Zina({ msg }) {
  const irLietotajs = msg.role === 'user'
  if (irLietotajs) return (
    <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
      <div style={{
        background: C.accentDk, color: C.text, borderRadius: '12px 12px 4px 12px',
        padding: '10px 14px', maxWidth: '75%', fontSize: 14, lineHeight: 1.5,
        border: `1px solid ${C.accent}33`,
      }}>
        {msg.teksts}
      </div>
    </div>
  )

  // AI atbilde
  const m = msg.parsed
  return (
    <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: 16 }}>
      <div style={{ maxWidth: '85%' }}>
        {/* Ikona */}
        <div style={{ fontSize: 20, marginBottom: 6 }}>🌲</div>

        <div style={{
          background: C.card, border: `1px solid ${C.border}`,
          borderRadius: '4px 12px 12px 12px', padding: '12px 14px',
        }}>
          {/* Nav atbildes brīdinājums */}
          {m?.nav_atbildes && (
            <div style={{ color: C.warn, marginBottom: 10, fontSize: 13, lineHeight: 1.5 }}>
              ⚠️ Precīzu atbildi uz šo jautājumu nevarēju atrast zināšanu bāzē.
              Lūdzu sazinieties ar atbildīgo iestādi tieši:
            </div>
          )}

          {/* Galvenā atbilde */}
          {!m?.nav_atbildes && m?.atbilde && (
            <div style={{ fontSize: 14, lineHeight: 1.7, color: C.text, whiteSpace: 'pre-wrap', marginBottom: m?.avots ? 8 : 0 }}>
              {m.atbilde}
            </div>
          )}

          {/* Ja nav JSON parsēšanas */}
          {!m && msg.teksts && (
            <div style={{ fontSize: 14, lineHeight: 1.7, color: C.text, whiteSpace: 'pre-wrap' }}>
              {msg.teksts}
            </div>
          )}

          {/* Avots */}
          {m?.avots && (
            <div style={{
              fontSize: 11, color: C.textDim,
              borderTop: `1px solid ${C.border}`,
              paddingTop: 6, marginTop: 6, marginBottom: 2,
            }}>
              📋 Avots: {m.avots}
            </div>
          )}

          {/* Kontakti */}
          <KontaktuKarte kontakti={m?.kontakti} />
        </div>
      </div>
    </div>
  )
}

// ─── GALVENĀ LAPA ─────────────────────────────────────────────────────────────
export default function JautaParMezuPage({ onBack }) {
  const [ziņas,     setZiņas]     = useState([])
  const [jautajums, setJautajums] = useState('')
  const [kategorija,setKategorija]= useState('')
  const [lade,      setLade]      = useState(false)
  const bottomRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [ziņas, lade])

  async function jautāt() {
    const j = jautajums.trim()
    if (!j || lade) return
    setJautajums('')
    setZiņas(prev => [...prev, { role: 'user', teksts: j }])
    setLade(true)
    try {
      const resp = await fetch('/api/anthropic/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-6',
          max_tokens: 1200,
          system: SISTEMA_PROMPTS + (kategorija ? `\n\nLietotāja jautājuma kategorija: ${kategorija}` : ''),
          messages: [{ role: 'user', content: j }],
        }),
      })
      const data = await resp.json()
      const teksts = data.content?.[0]?.text || 'Kļūda — lūdzu mēģini vēlreiz.'

      let parsed = null
      try {
        const clean = teksts.replace(/```json|```/g, '').trim()
        parsed = JSON.parse(clean)
      } catch {
        parsed = null
      }

      setZiņas(prev => [...prev, { role: 'ai', teksts, parsed }])
    } catch (e) {
      setZiņas(prev => [...prev, {
        role: 'ai',
        teksts: 'Savienojuma kļūda. Pārbaudi internetu un mēģini vēlreiz.',
        parsed: null,
      }])
    } finally {
      setLade(false)
    }
  }

  const pirmaJautajums = ziņas.length === 0

  return (
    <div style={{ minHeight: '100vh', background: C.bg, color: C.text, fontFamily: F.family, display: 'flex', flexDirection: 'column' }}>
      <style>{spinnerCSS}{`@keyframes pulse { 0%,80%,100%{opacity:0.2} 40%{opacity:1} }`}</style>

      {/* Header */}
      <div style={{
        background: DS.glass, borderBottom: `1px solid ${C.accent}44`,
        backdropFilter: 'blur(8px)', padding: '0 20px', height: 52,
        display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0,
        position: 'sticky', top: 0, zIndex: 10,
      }}>
        {onBack && <button onClick={onBack} style={{
          background: 'none', border: 'none', color: C.accent, fontSize: 22,
          cursor: 'pointer', padding: '0 4px 0 0', lineHeight: 1, minWidth: 36, minHeight: 44,
        }}>←</button>}
        <div style={{ flex: 1 }}>
          <div style={{ color: C.accent, fontSize: F.md, fontWeight: F.weightBold }}>⚖️ Meža likuma un tirgus konsultants</div>
          <div style={{ color: C.textDim, fontSize: F.xs }}>Latvijas meža likumdošana — AI konsultants</div>
        </div>
      </div>

      {/* Čata zona */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 16px 8px', maxWidth: 720, width: '100%', margin: '0 auto', boxSizing: 'border-box' }}>

        {/* Sākuma ekrāns */}
        {pirmaJautajums && (
          <div style={{ textAlign: 'center', paddingTop: 32, paddingBottom: 24 }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🌲</div>
            <h2 style={{ color: C.accent, fontSize: 20, fontWeight: 700, margin: '0 0 8px' }}>Jautā par Latvijas meža likumiem</h2>
            <p style={{ color: C.textMut, fontSize: 13, margin: '0 0 24px', lineHeight: 1.6 }}>
              Koku ciršana, meža atjaunošana, aizsargjoslas, mikroliegumi, dabas liegumi un citi jautājumi.
              <br />Atbildes balstītas uz MK noteikumiem un Meža likumu.
            </p>

            {/* Kategoriju pogas */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center', marginBottom: 24 }}>
              {KATEGORIJAS.map(k => (
                <button key={k.id} onClick={() => setKategorija(k.id === kategorija ? '' : k.id)} style={{
                  padding: '8px 14px', borderRadius: 20, fontSize: 12, cursor: 'pointer',
                  border: `1px solid ${kategorija === k.id ? C.accent : C.border}`,
                  background: kategorija === k.id ? C.accentDk : C.inner,
                  color: kategorija === k.id ? '#fff' : C.textSec,
                  fontWeight: kategorija === k.id ? 700 : 400,
                }}>
                  {k.ikona} {k.label}
                </button>
              ))}
            </div>

            {/* Ieteikti jautājumi */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxWidth: 480, margin: '0 auto' }}>
              {[
                'Kad drīkst cirst mežu bez apliecinājuma?',
                'Cik metru aizsargjosla jāatstāj pie upes?',
                'Kā rīkoties ja atradu putnu ligzdu cirsmā?',
                'Kādā laikā jāatjauno mežs pēc ciršanas?',
              ].map(q => (
                <button key={q} onClick={() => { setJautajums(q) }} style={{
                  padding: '10px 14px', borderRadius: 8, fontSize: 13, cursor: 'pointer', textAlign: 'left',
                  border: `1px solid ${C.border}`, background: C.inner, color: C.textSec,
                }}>
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Ziņas */}
        {ziņas.map((msg, i) => <Zina key={i} msg={msg} />)}

        {/* Loading */}
        {lade && (
          <div style={{ display: 'flex', gap: 6, padding: '8px 0', alignItems: 'center' }}>
            <div style={{ fontSize: 20 }}>🌲</div>
            <div style={{ display: 'flex', gap: 4 }}>
              {[0,1,2].map(i => (
                <div key={i} style={{
                  width: 7, height: 7, borderRadius: '50%', background: C.accent,
                  animation: `pulse 1.2s ease-in-out ${i * 0.2}s infinite`,
                }} />
              ))}
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Ievades josla */}
      <div style={{
        borderTop: `1px solid ${C.border}`, background: C.card,
        padding: '12px 16px', flexShrink: 0,
        maxWidth: 720, width: '100%', margin: '0 auto', boxSizing: 'border-box',
      }}>
        {!pirmaJautajums && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
            {KATEGORIJAS.slice(0, 4).map(k => (
              <button key={k.id} onClick={() => setKategorija(k.id === kategorija ? '' : k.id)} style={{
                padding: '4px 10px', borderRadius: 12, fontSize: 11, cursor: 'pointer',
                border: `1px solid ${kategorija === k.id ? C.accent : C.border}`,
                background: kategorija === k.id ? C.accentDk : C.deep,
                color: kategorija === k.id ? '#fff' : C.textDim,
              }}>
                {k.ikona} {k.label}
              </button>
            ))}
          </div>
        )}
        <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
          <textarea
            value={jautajums}
            onChange={e => setJautajums(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); jautāt() } }}
            placeholder="Uzdod jautājumu par meža likumiem..."
            rows={2}
            style={{ ...inp, flex: 1, minHeight: 44, maxHeight: 120 }}
          />
          <button onClick={jautāt} disabled={!jautajums.trim() || lade} style={{
            padding: '10px 18px', borderRadius: 8, border: 'none',
            background: jautajums.trim() && !lade ? C.accentDk : C.inner,
            color: jautajums.trim() && !lade ? '#fff' : C.textDim,
            fontSize: 14, fontWeight: 600, cursor: jautajums.trim() && !lade ? 'pointer' : 'not-allowed',
            flexShrink: 0, borderTop: `2px solid ${jautajums.trim() && !lade ? C.accent : C.border}`,
          }}>
            {lade ? '⏳' : '→'}
          </button>
        </div>
        <div style={{ fontSize: 10, color: C.textDim, marginTop: 6, textAlign: 'center' }}>
          Atbildes ir informatīvas. Svarīgos jautājumos konsultējies ar VMD vai DAP.
        </div>
      </div>
    </div>
  )
}
