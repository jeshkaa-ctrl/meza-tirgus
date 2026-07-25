import { useState, useEffect, useRef } from 'react'
import { supabase } from '../supabaseClient'

export function PdfMaksasGate({ info, onClose, onReg }) {
  const [lade,       setLade]       = useState(false)
  const [klude,      setKlude]      = useState(null)
  const [gaidaLogin, setGaidaLogin] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(null)   // null=pārbauda, true, false
  const [guestFaze,  setGuestFaze]  = useState(null)   // null | 'email'
  const [guestEmail, setGuestEmail] = useState('')
  const saktMaksajumuRef = useRef(null)

  // Pārbaudām autentifikācijas statusu uz montāžas
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsLoggedIn(!!session?.user)
    })
  }, [])

  // Auto-retry pēc SIGNED_IN (esošā loģika, nemainīta)
  useEffect(() => {
    if (!gaidaLogin) return
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN') {
        setGaidaLogin(false)
        setKlude(null)
        saktMaksajumuRef.current?.()
      }
    })
    return () => subscription.unsubscribe()
  }, [gaidaLogin])

  if (!info) return null

  // MAP PDF (5€) — TIKAI ar reģistrāciju, bez viesa opcijas
  const isMap = info.price === 5.00

  // Vai rādīt divas opcijas? (ne-MAP + lietotājs nav ielogojies)
  const divuPogasRezims = !isMap && isLoggedIn === false

  // ── Reģistrēta lietotāja plūsma (nemainīta) ─────────────────────────────────
  const saktMaksajumu = async () => {
    setLade(true)
    setKlude(null)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setKlude('Pierakstieties — maksājums turpināsies automātiski pēc pieteikšanās.')
        setGaidaLogin(true)
        onReg?.()
        setLade(false)
        return
      }
      const resp = await fetch('/api/montonio', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ type: 'pdf', grandTotal: info.price, pdfTips: info.pdfTips, userId: user.id }),
      })
      const data = await resp.json()
      if (!resp.ok || !data.paymentUrl) {
        setKlude(data.error || 'Radās kļūda. Mēģiniet vēlreiz.')
        setLade(false)
        return
      }
      sessionStorage.setItem('mt_pdf_payment', JSON.stringify({
        merchantRef: data.merchantReference,
        pdfTips:     info.pdfTips,
      }))
      window.location.href = data.paymentUrl
    } catch {
      setKlude('Savienojuma kļūda. Pārbaudiet internetu.')
      setLade(false)
    }
  }

  // ── Viesa plūsma (jauna) ─────────────────────────────────────────────────────
  const saktGuestMaksajumu = async () => {
    const em = guestEmail.trim()
    if (!em || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em)) {
      setKlude('Lūdzu ievadiet derīgu e-pasta adresi.')
      return
    }
    setLade(true)
    setKlude(null)
    try {
      const resp = await fetch('/api/montonio', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ type: 'pdf_guest', grandTotal: info.price, pdfTips: info.pdfTips, guestEmail: em }),
      })
      const data = await resp.json()
      if (!resp.ok || !data.paymentUrl) {
        setKlude(data.error || 'Radās kļūda. Mēģiniet vēlreiz.')
        setLade(false)
        return
      }
      sessionStorage.setItem('mt_pdf_payment', JSON.stringify({
        merchantRef: data.merchantReference,
        pdfTips:     info.pdfTips,
        isGuest:     true,
        guestEmail:  em,
      }))
      window.location.href = data.paymentUrl
    } catch {
      setKlude('Savienojuma kļūda. Pārbaudiet internetu.')
      setLade(false)
    }
  }

  saktMaksajumuRef.current = saktMaksajumu

  const spinStyle = {
    width: 15, height: 15, border: '2px solid #4caf5055',
    borderTop: '2px solid #4caf50', borderRadius: '50%',
    animation: 'spin 0.8s linear infinite', display: 'inline-block',
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: 'rgba(0,0,0,0.75)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 20,
    }}>
      <div style={{
        background: '#0f1a0f', border: '1px solid #4caf50',
        borderRadius: 16, padding: '28px 24px',
        maxWidth: 420, width: '100%',
        boxShadow: '0 8px 40px rgba(0,0,0,0.6)',
      }}>
        <div style={{ fontSize: 28, marginBottom: 8 }}>💳</div>
        <div style={{ color: '#e8f5e9', fontSize: 18, fontWeight: 800, marginBottom: 4 }}>
          Maksājums nepieciešams
        </div>
        <div style={{ color: '#4caf50', fontSize: 32, fontWeight: 800, marginBottom: 12 }}>
          €{info.price.toFixed(2)}
        </div>
        <div style={{ color: '#7ab87a', fontSize: 14, lineHeight: 1.6, marginBottom: 20 }}>
          {isMap
            ? 'Meža apsaimniekošanas plāna PDF (ar karti) tiek iekasēts atsevišķi — €5.00 par dokumentu.'
            : 'PDF lejupielādei nepieciešams aktīvs Biznesa abonements (no €29/mēn.) vai vienreizējs maksājums €2.50.'
          }
        </div>

        {klude && (
          <div style={{
            background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
            borderRadius: 8, padding: '10px 14px', marginBottom: 16,
            color: '#fca5a5', fontSize: 13,
          }}>
            ⚠️ {klude}
          </div>
        )}

        {/* ── E-pasta ievades forma (viesa režīms) ────────────────────────── */}
        {guestFaze === 'email' && (
          <div style={{ marginBottom: 4 }}>
            <div style={{ color: '#7ab87a', fontSize: 13, marginBottom: 10, lineHeight: 1.5 }}>
              ✉️ Ievadiet e-pastu — apstiprinājums un PDF atgriešanās saite tiks nosūtīta pēc maksājuma.
            </div>
            <input
              type="email"
              value={guestEmail}
              onChange={e => { setGuestEmail(e.target.value); setKlude(null) }}
              onKeyDown={e => e.key === 'Enter' && !lade && saktGuestMaksajumu()}
              placeholder="jusu@epasts.lv"
              autoFocus
              style={{
                width: '100%', padding: '11px 14px', marginBottom: 12,
                background: '#0a120a', border: '1px solid #4caf5088',
                borderRadius: 8, color: '#e8f5e9', fontSize: 14,
                boxSizing: 'border-box', outline: 'none', fontFamily: 'inherit',
              }}
            />
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={() => { setGuestFaze(null); setKlude(null) }}
                disabled={lade}
                style={{
                  flex: 1, padding: '11px 0',
                  background: '#1a2e1a', border: '1px solid #4caf50',
                  borderRadius: 8, color: '#4caf50',
                  fontSize: 13, fontWeight: 600, cursor: lade ? 'not-allowed' : 'pointer',
                }}
              >
                ← Atpakaļ
              </button>
              <button
                onClick={saktGuestMaksajumu}
                disabled={lade}
                style={{
                  flex: 2, padding: '11px 0',
                  background: lade ? '#1a3a1a' : 'linear-gradient(135deg,#4caf50,#2e7d32)',
                  border: 'none', borderRadius: 8, color: 'white',
                  fontSize: 13, fontWeight: 700,
                  cursor: lade ? 'not-allowed' : 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                }}
              >
                {lade ? <><span style={spinStyle} />Savieno...</> : 'Turpināt uz maksājumu →'}
              </button>
            </div>
          </div>
        )}

        {/* ── Galvenās pogas ───────────────────────────────────────────────── */}
        {guestFaze === null && (
          divuPogasRezims ? (
            // Divas opcijas — nereģistrēts lietotājs, ne-MAP PDF
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={onClose}
                  disabled={lade}
                  style={{
                    flex: 1, padding: '12px 0',
                    background: '#1a2e1a', border: '1px solid #4caf50',
                    borderRadius: 8, color: '#4caf50',
                    fontSize: 13, fontWeight: 600, cursor: lade ? 'not-allowed' : 'pointer',
                  }}
                >
                  Atcelt
                </button>
                <button
                  onClick={saktMaksajumu}
                  disabled={lade}
                  style={{
                    flex: 2, padding: '12px 0',
                    background: lade ? '#1a3a1a' : 'linear-gradient(135deg,#4caf50,#2e7d32)',
                    border: 'none', borderRadius: 8, color: 'white',
                    fontSize: 13, fontWeight: 700,
                    cursor: lade ? 'not-allowed' : 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  }}
                >
                  {lade ? <><span style={spinStyle} />Savieno...</> : '📝 Reģistrēties un maksāt'}
                </button>
              </div>
              <button
                onClick={() => { setGuestFaze('email'); setKlude(null) }}
                disabled={lade}
                style={{
                  width: '100%', padding: '11px 0',
                  background: 'transparent', border: '1px solid #4caf5044',
                  borderRadius: 8, color: '#7ab87a',
                  fontSize: 13, fontWeight: 600,
                  cursor: lade ? 'not-allowed' : 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                }}
              >
                ✉️ Maksāt bez reģistrācijas
              </button>
            </div>
          ) : (
            // Viena poga — reģistrēts lietotājs vai MAP PDF
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={onClose}
                disabled={lade}
                style={{
                  flex: 1, padding: '12px 0',
                  background: '#1a2e1a', border: '1px solid #4caf50',
                  borderRadius: 8, color: '#4caf50',
                  fontSize: 14, fontWeight: 600, cursor: lade ? 'not-allowed' : 'pointer',
                  opacity: lade ? 0.6 : 1,
                }}
              >
                Atcelt
              </button>
              <button
                onClick={saktMaksajumu}
                disabled={lade}
                style={{
                  flex: 2, padding: '12px 0',
                  background: lade ? '#1a3a1a' : 'linear-gradient(135deg,#4caf50,#2e7d32)',
                  border: 'none', borderRadius: 8, color: 'white',
                  fontSize: 14, fontWeight: 700, cursor: lade ? 'not-allowed' : 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                }}
              >
                {lade
                  ? <><span style={{ ...spinStyle, width: 16, height: 16 }} />Savieno...</>
                  : `💳 Maksāt €${info.price.toFixed(2)} →`
                }
              </button>
            </div>
          )
        )}

        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    </div>
  )
}
