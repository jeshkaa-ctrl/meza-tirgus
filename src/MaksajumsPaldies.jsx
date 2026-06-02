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
    // Nolasa URL parametrus
    const params = new URLSearchParams(window.location.search)
    const plan = params.get('plan') || ''
    const payment = params.get('payment')

    setPlanId(plan)

    if (payment !== 'success') {
      setStatuss('klude')
      return
    }

    // Pārbauda vai Supabase jau atjaunināts (webhook var kavēties 1-5s)
    let attempts = 0
    const MAX = 8

    const check = async () => {
      attempts++
      setMēģinajumi(attempts)

      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) { setStatuss('aktivs'); return } // nav ielogojies — rāda panākumu

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

      if (attempts < MAX) {
        setTimeout(check, 1500)
      } else {
        // Webhook varētu kavēties — rādam panākumu jebkurā gadījumā
        setStatuss('aktivs')
      }
    }

    setTimeout(check, 1000) // Pirmā pārbaude pēc 1s
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

        {statuss === 'aktivs' && (
          <>
            <div style={{ fontSize: 56, marginBottom: S.md }}>✅</div>
            <h2 style={{ color: C.green, fontSize: F.h2, fontWeight: F.weightBlack, margin: `0 0 ${S.sm}` }}>
              Paldies par maksājumu!
            </h2>
            {planId && (
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
            <p style={{ color: C.textMut, fontSize: F.sm, lineHeight: 1.6, margin: `0 0 ${S.xl}` }}>
              Jūsu abonements ir aktivizēts. Ja plāns nav redzams uzreiz —
              izejiet un ielogojieties vēlreiz.
            </p>
            <button onClick={onTurpina} style={{ ...btn.primary, justifyContent: 'center', width: '100%' }}>
              Turpināt uz Meža tirgu →
            </button>
          </>
        )}

        {statuss === 'klude' && (
          <>
            <div style={{ fontSize: 56, marginBottom: S.md }}>⚠️</div>
            <h2 style={{ color: C.warn, fontSize: F.h3, fontWeight: F.weightBold, margin: `0 0 ${S.sm}` }}>
              Maksājums nav pabeigts
            </h2>
            <p style={{ color: C.textMut, fontSize: F.sm, lineHeight: 1.6, margin: `0 0 ${S.xl}` }}>
              Ja nauda tika norakstīta — sazinieties ar mums:{' '}
              <a href="mailto:jeshkaa@inbox.lv" style={{ color: C.green }}>jeshkaa@inbox.lv</a>
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
