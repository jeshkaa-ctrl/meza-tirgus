// Plāns iesaiņojums ap esošo JuristsPage loģiku — bez galvenes
import { useState, useRef } from 'react'
import { EtikasTeksts } from './EtikasTeksts'
import { ETIKAS_TEKSTI } from '../../data/etika'

function juristsEtika(q) {
  const t = (q || '').toLowerCase()
  if (/nelikumīg|sods|pārkāp/.test(t))        return ETIKAS_TEKSTI.jurists.nelikumigi
  if (/aizliegt|drīkst/.test(t))              return ETIKAS_TEKSTI.jurists.aizliegumi
  if (/droš|ieroc|glabā/.test(t))             return ETIKAS_TEKSTI.jurists.drosiba
  if (/sezon|termiņ|kad |līdz/.test(t))       return ETIKAS_TEKSTI.jurists.termini
  return ETIKAS_TEKSTI.jurists.vispareji
}

function FormatetsRezultats({ teksts }) {
  return (
    <div>
      {teksts.split('\n').map((r, i) => {
        const t = r.trim()
        if (!t) return <div key={i} style={{ height: 6 }} />
        if (t.startsWith('📋') || t.startsWith('⚖️') || t.startsWith('📌') || t.startsWith('💡') || t.startsWith('⚠️'))
          return <div key={i} style={{ fontSize: 13, fontWeight: 700, color: '#4a7c3f', marginTop: 10, marginBottom: 3 }}>{t}</div>
        if (t.startsWith('═'))
          return <div key={i} style={{ borderTop: '1px solid #2d4a2d', margin: '6px 0' }} />
        return <div key={i} style={{ fontSize: 13, lineHeight: 1.7, color: '#b0c8b0', marginBottom: 2 }}>{t}</div>
      })}
    </div>
  )
}

const PIEMERI = [
  'Vai drīkstu medīt naktī?', 'Kādi dokumenti vajadzīgi medībām?',
  'Kad beidzas aļņu sezona?', 'Kas ir nelikumīgas medības?',
  'Kāda ir minimālā iecirkņa platība?', 'Ko darīt ja nomedīta mežacūka?',
]

export default function JuristsChat() {
  const [jautajums, setJautajums] = useState('')
  const [atbilde, setAtbilde]     = useState('')
  const [lade, setLade]           = useState(false)
  const [kļūda, setKļūda]         = useState('')
  const inputRef = useRef()

  const jautat = async (teksts) => {
    const q = (teksts || jautajums).trim()
    if (!q) return
    setLade(true); setKļūda(''); setAtbilde('')
    try {
      const r = await fetch('/api/ai?action=jurists', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jautajums: q }),
      })
      const d = await r.json()
      if (!r.ok) throw new Error(d.error || 'Servera kļūda')
      setAtbilde(d.atbilde)
    } catch (e) { setKļūda('Kļūda: ' + e.message) }
    finally { setLade(false) }
  }

  const inp = { background: '#060d06', border: '1px solid #2d4a2d', borderRadius: 8,
    color: '#ddeadd', fontSize: 14, padding: '10px 12px', fontFamily: "'Inter',sans-serif" }

  return (
    <div>
      <textarea ref={inputRef} value={jautajums}
        onChange={e => setJautajums(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); jautat() } }}
        placeholder="Jautā par medību likumiem, sezonām, dokumentiem..."
        style={{ ...inp, width: '100%', minHeight: 80, resize: 'vertical', outline: 'none', boxSizing: 'border-box' }} />

      <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
        {!lade
          ? <button onClick={() => jautat()} disabled={!jautajums.trim()}
              style={{ background: '#2e7d32', color: '#fff', border: 'none', borderRadius: 8,
                padding: '11px 20px', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
              ⚖️ Jautāt
            </button>
          : <button disabled style={{ background: '#1a3a1a', color: '#81c784', border: '1px solid #2d4a2d',
              borderRadius: 8, padding: '11px 20px', fontSize: 14 }}>
              ⏳ Meklē...
            </button>
        }
        {atbilde && (
          <button onClick={() => { setJautajums(''); setAtbilde(''); inputRef.current?.focus() }}
            style={{ background: 'transparent', color: '#5a8a5a', border: '1px solid #2d4a2d',
              borderRadius: 8, padding: '11px 16px', fontSize: 12, cursor: 'pointer' }}>
            ↩ Jauns
          </button>
        )}
      </div>
      {kļūda && <div style={{ marginTop: 8, color: '#ef5350', fontSize: 13 }}>{kļūda}</div>}

      {/* Piemēri */}
      {!atbilde && !lade && (
        <div style={{ marginTop: 16 }}>
          <div style={{ fontSize: 11, color: '#5a8a5a', marginBottom: 8 }}>💡 Biežāk uzdotie:</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {PIEMERI.map((p, i) => (
              <button key={i} onClick={() => { setJautajums(p); jautat(p) }}
                style={{ background: '#0a140a', border: '1px solid #1a3a1a', borderRadius: 20,
                  padding: '5px 12px', fontSize: 12, color: '#81c784', cursor: 'pointer' }}>
                {p}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Atbilde */}
      {atbilde && (
        <div style={{ marginTop: 16, background: '#060d06', border: '1px solid #2d4a2d',
          borderRadius: 10, padding: 16 }}>
          <FormatetsRezultats teksts={atbilde} />
          <div style={{ marginTop: 12, fontSize: 11, color: '#3a5a3a' }}>
            ⚠️ Pārbaud aktuālos likumus: likumi.lv → "Medību likums"
          </div>
          <EtikasTeksts teksts={juristsEtika(jautajums)} />
        </div>
      )}
    </div>
  )
}
