import { useEffect, useState } from 'react'
import { supabase } from './supabaseClient'
import { C, F, R, S, btn, spinnerCSS } from './ds'

const PLAN_NOSAUKUMI = {
  pro:      'Pro',
  business: 'Komercija',
  pdf:      'PDF lejupielāde',
  listing:  'Sludinājums',
}

export default function MaksajumsPaldies({ onTurpina }) {
  const [statuss, setStatuss] = useState('gaida') // gaida | aktivs | klude
  const [planId, setPlanId]   = useState('')
  const [mēģinajumi, setMēģinajumi] = useState(0)

  useEffect(() => {
    const params  = new URLSearchParams(window.location.search)
    const plan    = params.get('plan') || ''
    const type    = params.get('type') || ''
    const payment = params.get('payment')

    setPlanId(plan)

    if (payment !== 'success') {
      setStatuss('klude')
      return
    }

    // PDF vienreizējs maksājums — polē pdf_payments
    if (type === 'pdf') {
      const pdfInfo = (() => {
        try { return JSON.parse(sessionStorage.getItem('mt_pdf_payment') || 'null') } catch { return null }
      })()
      if (!pdfInfo?.merchantRef) { setStatuss('aktivs'); return }

      let attempts = 0
      const MAX = 8
      const checkPdf = async () => {
        attempts++
        setMēģinajumi(attempts)
        try {
          const { data } = await supabase
            .from('pdf_payments')
            .select('apmaksats')
            .eq('merchant_ref', pdfInfo.merchantRef)
            .maybeSingle()
          if (data?.apmaksats) {
            // Viesa gadījumā NEIZDZĒŠAM sessionStorage — rīks to izmantos PDF ģenerēšanai
            if (!pdfInfo.isGuest) sessionStorage.removeItem('mt_pdf_payment')
            setStatuss('aktivs')
            return
          }
        } catch {}
        if (attempts < MAX) setTimeout(checkPdf, 1500)
        else setStatuss('aktivs') // Webhook kavējas — lietotājs mēģinās vēlreiz
      }
      setTimeout(checkPdf, 1500)
      return
    }

    // Abonements — polē subscriptions
    let attempts = 0
    const MAX = 8

    const check = async () => {
      attempts++
      setMēģinajumi(attempts)
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) { setStatuss('aktivs'); return }

        const { data } = await supabase
          .from('subscriptions')
          .select('plan_id, status, current_period_end')
          .eq('user_id', user.id)
          .single()

        if (data?.plan_id === plan && data?.status === 'active') {
          setStatuss('aktivs')
          return
        }
      } catch {}

      if (attempts < MAX) setTimeout(check, 1500)
      else setStatuss('aktivs')
    }

    setTimeout(check, 1000)
  }, [])

  // Notīra URL parametrus
  useEffect(() => {
    if (statuss === 'aktivs') {
      window.history.replaceState({}, '', window.location.pathname)
    }
  }, [statuss])

  return (
    <div style={{
      minHeight: '100vh', background: C.bg, color: C.text,
      fontFamily: F.family, display: 'flex', alignItems: 'center',
      justifyContent: 'center', padding: S.xl,
    }}>
      <style>{spinnerCSS}</style>

      <div style={{
        maxWidth: 480, width: '100%', textAlign: 'center',
        background: C.bgCard, border: `1px solid ${C.greenBdr}`,
        borderRadius: R.xl, padding: S.xxl,
      }}>

        {statuss === 'gaida' && (
          <>
            <div style={{ marginBottom: S.lg }}>
              <div style={{
                width: 48, height: 48, border: `3px solid ${C.greenBdr}`,
                borderTop: `3px solid ${C.green}`, borderRadius: '50%',
                animation: 'mt-spin 0.8s linear infinite',
                margin: '0 auto',
              }} />
            </div>
            <h2 style={{ color: C.textSec, fontSize: F.h3, fontWeight: F.weightBold, margin: `0 0 ${S.sm}` }}>
              Maksājums tiek apstrādāts...
            </h2>
            <p style={{ color: C.textDim, fontSize: F.sm, margin: 0 }}>
              Pārbaudām maksājuma statusu ({mēģinajumi}/{8})
            </p>
          </>
        )}

        {statuss === 'aktivs' && (() => {
          const params    = new URLSearchParams(window.location.search)
          const isPdf     = params.get('type') === 'pdf'
          const guestInfo = (() => {
            try { return JSON.parse(sessionStorage.getItem('mt_pdf_payment') || 'null') } catch { return null }
          })()
          const isGuest = guestInfo?.isGuest
          return (
            <>
              <div style={{ fontSize: 56, marginBottom: S.md }}>✅</div>
              <h2 style={{ color: C.green, fontSize: F.h2, fontWeight: F.weightBlack, margin: `0 0 ${S.sm}` }}>
                Paldies par maksājumu!
              </h2>
              {isPdf ? (
                <div style={{
                  background: `${C.green}15`, border: `1px solid ${C.green}44`,
                  borderRadius: R.lg, padding: S.md, margin: `${S.md} 0`,
                }}>
                  <div style={{ color: C.green, fontSize: F.base, fontWeight: F.weightBold, marginBottom: 6 }}>
                    📄 PDF maksājums apstiprināts
                  </div>
                  <div style={{ color: C.textDim, fontSize: F.sm, lineHeight: 1.6 }}>
                    Atgriezieties uz rīku un klikšķiniet PDF pogu — dokuments tiks ģenerēts uzreiz.
                    Šis atļaujas kods derīgs 24 stundas.
                  </div>
                  {isGuest && (
                    <div style={{ color: C.textDim, fontSize: F.sm, marginTop: 8, lineHeight: 1.6 }}>
                      ✉️ Apstiprinājums nosūtīts uz {guestInfo.guestEmail}
                    </div>
                  )}
                </div>
              ) : planId && (
                <div style={{
                  background: `${C.green}15`, border: `1px solid ${C.green}44`,
                  borderRadius: R.lg, padding: S.md, margin: `${S.md} 0`,
                }}>
                  <div style={{ color: C.textDim, fontSize: F.xs, marginBottom: 4 }}>Aktivizētais plāns</div>
                  <div style={{ color: C.green, fontSize: F.lg, fontWeight: F.weightBold }}>
                    🌲 {PLAN_NOSAUKUMI[planId] || planId}
                  </div>
                </div>
              )}
              {!isPdf && (
                <p style={{ color: C.textMut, fontSize: F.sm, lineHeight: 1.6, margin: `0 0 ${S.xl}` }}>
                  Jūsu abonements ir aktivizēts. Ja plāns nav redzams uzreiz —
                  izejiet un ielogojieties vēlreiz.
                </p>
              )}
              <button onClick={onTurpina} style={{ ...btn.primary, justifyContent: 'center', width: '100%' }}>
                {isPdf ? 'Atgriezties uz rīku →' : 'Turpināt uz Meža tirgu →'}
              </button>
            </>
          )
        })()}

        {statuss === 'klude' && (
          <>
            <div style={{ fontSize: 56, marginBottom: S.md }}>⚠️</div>
            <h2 style={{ color: C.warn, fontSize: F.h3, fontWeight: F.weightBold, margin: `0 0 ${S.sm}` }}>
              Maksājums nav pabeigts
            </h2>
            <p style={{ color: C.textMut, fontSize: F.sm, lineHeight: 1.6, margin: `0 0 ${S.xl}` }}>
              Ja nauda tika norakstīta — sazinieties ar mums:{' '}
              <a href="mailto:mezatirgus.info@gmail.com" style={{ color: C.green }}>mezatirgus.info@gmail.com</a>
            </p>
            <button onClick={onTurpina} style={{ ...btn.secondary, justifyContent: 'center', width: '100%' }}>
              Atpakaļ
            </button>
          </>
        )}
      </div>
    </div>
  )
}
