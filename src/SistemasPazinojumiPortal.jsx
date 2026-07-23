import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { supabase } from './supabaseClient'

const TIPS = {
  'info':        { ikona: '🔵', dot: '#42a5f5', fon: '#0d1b2a', brd: '#1e4976', txt: '#90caf9' },
  'brīdinājums': { ikona: '🟡', dot: '#ffa726', fon: '#1f1600', brd: '#6b4a00', txt: '#ffcc80' },
  'kļūda':       { ikona: '🔴', dot: '#ef5350', fon: '#1a0808', brd: '#5a1a1a', txt: '#ef9a9a' },
}

function PazinojumuSaturs({ pazinojumi, atverts, setAtverts }) {
  const paneRef = useRef(null)

  useEffect(() => {
    if (!atverts) return
    function onKlik(e) {
      if (paneRef.current && !paneRef.current.contains(e.target)) setAtverts(false)
    }
    document.addEventListener('mousedown', onKlik)
    return () => document.removeEventListener('mousedown', onKlik)
  }, [atverts])

  const irAktivi = pazinojumi.length > 0

  return (
    <div ref={paneRef} style={{ position: 'fixed', bottom: 20, right: 20, zIndex: 10000, fontFamily: "'Inter','Segoe UI',Arial,sans-serif" }}>

      {/* Zvans */}
      <button
        onClick={() => setAtverts(v => !v)}
        title="Sistēmas paziņojumi"
        style={{
          width: 44, height: 44, borderRadius: '50%',
          background: 'rgba(15,31,15,0.93)',
          border: `1px solid ${irAktivi ? '#ef5350' : '#2d4a2d'}`,
          cursor: 'pointer', display: 'flex', alignItems: 'center',
          justifyContent: 'center', fontSize: 20, position: 'relative',
          backdropFilter: 'blur(8px)', boxShadow: '0 2px 14px rgba(0,0,0,0.45)',
          outline: 'none', padding: 0,
        }}
      >
        🔔
        {irAktivi && (
          <span style={{
            position: 'absolute', top: 3, right: 3,
            width: 9, height: 9, borderRadius: '50%',
            background: '#ef5350',
            border: '2px solid rgba(15,31,15,0.93)',
          }} />
        )}
      </button>

      {/* Dropdown */}
      {atverts && (
        <div style={{
          position: 'absolute', bottom: 52, right: 0,
          width: 310, background: '#0f1f0f',
          border: '1px solid #2d4a2d', borderRadius: 10,
          boxShadow: '0 8px 32px rgba(0,0,0,0.55)',
          overflow: 'hidden',
        }}>
          <div style={{
            padding: '9px 14px', borderBottom: '1px solid #2d4a2d',
            fontSize: 11, fontWeight: 700, color: '#4caf50',
            letterSpacing: '0.06em', textTransform: 'uppercase',
          }}>
            📢 Sistēmas paziņojumi
          </div>

          {!irAktivi ? (
            <div style={{ padding: '20px 14px', textAlign: 'center', color: '#4a7a4a', fontSize: 13 }}>
              Nav aktīvu paziņojumu
            </div>
          ) : (
            <div style={{ maxHeight: 340, overflowY: 'auto' }}>
              {pazinojumi.map(p => {
                const k = TIPS[p.tips] || TIPS['info']
                return (
                  <div key={p.id} style={{
                    margin: 8, padding: '10px 12px',
                    background: k.fon, border: `1px solid ${k.brd}`,
                    borderRadius: 7,
                  }}>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                      <span style={{
                        display: 'inline-block', width: 7, height: 7,
                        borderRadius: '50%', background: k.dot,
                        marginTop: 6, flexShrink: 0,
                      }} />
                      <div style={{ fontSize: 13, color: k.txt, lineHeight: 1.55 }}>
                        {p.teksts}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function SistemasPazinojumiPortal() {
  const [pazinojumi, setPazinojumi] = useState([])
  const [atverts, setAtverts] = useState(false)

  async function ielade() {
    try {
      const { data } = await supabase
        .from('sistemas_pazinojumi')
        .select('id, teksts, tips, aktivs')
        .eq('aktivs', true)
        .order('created_at', { ascending: false })
      setPazinojumi(data || [])
    } catch { /* klusē — tabula varbūt vēl nav izveidota */ }
  }

  useEffect(() => {
    ielade()
    const id = setInterval(ielade, 5 * 60 * 1000)
    return () => clearInterval(id)
  }, [])

  return createPortal(
    <PazinojumuSaturs
      pazinojumi={pazinojumi}
      atverts={atverts}
      setAtverts={setAtverts}
    />,
    document.body
  )
}
