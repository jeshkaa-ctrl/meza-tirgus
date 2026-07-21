import { useState, useEffect, useRef } from 'react'
import { supabase } from '../supabaseClient'

export function PdfMaksasGate({ info, onClose, onReg }) {
  const [lade, setLade]           = useState(false)
  const [klude, setKlude]         = useState(null)
  const [gaidaLogin, setGaidaLogin] = useState(false)

  const saktMaksajumuRef = useRef(null)

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

  const isMap = info.price === 5.00

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
        body:    JSON.stringify({
          type:       'pdf',
          grandTotal: info.price,
          pdfTips:    info.pdfTips,
          userId:     user.id,
        }),
      })

      const data = await resp.json()
      if (!resp.ok || !data.paymentUrl) {
        setKlude(data.error || 'Radās kļūda. Mēģiniet vēlreiz.')
        setLade(false)
        return
      }

      // Saglabā merchantReference sessionStorage — vajadzīgs MaksajumsPaldies polling
      sessionStorage.setItem('mt_pdf_payment', JSON.stringify({
        merchantRef: data.merchantReference,
        pdfTips:     info.pdfTips,
      }))

      window.location.href = data.paymentUrl
    } catch (e) {
      setKlude('Savienojuma kļūda. Pārbaudiet internetu.')
      setLade(false)
    }
  }

  saktMaksajumuRef.current = saktMaksajumu

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: 'rgba(0,0,0,0.75)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 20,
    }}>
      <div style={{
        background: '#0f1a0f',
        border: '1px solid #4caf50',
        borderRadius: 16,
        padding: '28px 24px',
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
              ? <><span style={{ width: 16, height: 16, border: '2px solid #4caf5055', borderTop: '2px solid #4caf50', borderRadius: '50%', animation: 'spin 0.8s linear infinite', display: 'inline-block' }} />Savieno...</>
              : `💳 Maksāt €${info.price.toFixed(2)} →`
            }
          </button>
        </div>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    </div>
  )
}
