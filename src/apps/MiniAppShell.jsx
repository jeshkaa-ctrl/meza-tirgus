import { useState, useEffect } from 'react'
import { C, F, R } from '../ds'

export default function MiniAppShell({ nosaukums, ikona, bērtUrl, children }) {
  const [deferredPrompt, setDeferredPrompt] = useState(null)
  const [installets,     setInstallets]     = useState(false)
  const [showBanner,     setShowBanner]     = useState(false)

  useEffect(() => {
    if (window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone) {
      setInstallets(true)
      return
    }
    const handler = (e) => { e.preventDefault(); setDeferredPrompt(e); setShowBanner(true) }
    window.addEventListener('beforeinstallprompt', handler)
    // iOS — vienmēr rāda baneri
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent)
    if (isIOS) setShowBanner(true)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  async function installetApp() {
    if (deferredPrompt) {
      deferredPrompt.prompt()
      await deferredPrompt.userChoice
      setDeferredPrompt(null)
      setShowBanner(false)
    } else {
      // iOS — parāda instrukciju modāli
      alert('iPhone: Safari → ⬆️ Share → "Add to Home Screen" → Pievienot')
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: C.bg, color: C.text, fontFamily: F.family }}>

      {/* Install baneris */}
      {showBanner && !installets && (
        <div style={{
          background: `linear-gradient(135deg, ${C.greenDk}, #0d2a0d)`,
          borderBottom: `1px solid ${C.green}`,
          padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 12,
        }}>
          <span style={{ fontSize: 22, flexShrink: 0 }}>{ikona}</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ color: C.text, fontSize: F.sm, fontWeight: 700 }}>{nosaukums}</div>
            <div style={{ color: C.textMut, fontSize: F.xs }}>Saglabā uz sākumekrāna</div>
          </div>
          <button onClick={installetApp} style={{
            background: C.green, border: 'none', borderRadius: R.md,
            color: '#000', fontSize: F.xs, fontWeight: 700,
            padding: '7px 14px', cursor: 'pointer', fontFamily: F.family, flexShrink: 0,
          }}>📲 Instalēt</button>
          <button onClick={() => setShowBanner(false)} style={{
            background: 'none', border: 'none', color: C.textDim,
            fontSize: 18, cursor: 'pointer', flexShrink: 0,
          }}>×</button>
        </div>
      )}

      {/* Saturs */}
      {children}

      {/* Apakšas saite uz galveno app */}
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0,
        background: C.bgCard, borderTop: `1px solid ${C.greenBdr}`,
        padding: '8px 16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        zIndex: 50,
      }}>
        <span style={{ fontSize: F.xs, color: C.textDim }}>🌲 Meža tirgus</span>
        <span style={{ color: C.textDim, fontSize: F.xs }}>·</span>
        <a href={bērtUrl || '/'} style={{ fontSize: F.xs, color: C.green, textDecoration: 'none' }}>
          Visi rīki →
        </a>
      </div>
    </div>
  )
}
