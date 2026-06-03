import { useEffect, useState } from 'react'
import { C, F, R } from './ds'

function platforma() {
  const ua = navigator.userAgent
  if (/iPad|iPhone|iPod/.test(ua) && !window.MSStream) return 'ios'
  if (/Android/.test(ua)) return 'android'
  return 'desktop'
}

const SOLI_IOS = [
  { n: 1, ikona: '⬆️', teksts: 'Safari pārlūkā pieskar Share pogu (apakšā, vidū)' },
  { n: 2, ikona: '📋', teksts: 'Ritini uz leju un izvēlies "Add to Home Screen"' },
  { n: 3, ikona: '✅', teksts: 'Pieskar "Add" — app parādīsies uz sākumekrāna' },
]

const SOLI_ANDROID = [
  { n: 1, ikona: '⋮',  teksts: 'Chrome — pieskar trīs punktus (augšā labajā stūrī)' },
  { n: 2, ikona: '📲', teksts: 'Izvēlies "Add to Home screen" vai "Instalēt lietotni"' },
  { n: 3, ikona: '✅', teksts: 'Pieskar "Instalēt" — app parādīsies uz sākumekrāna' },
]

const SOLI_DESKTOP = [
  { n: 1, ikona: '💻', teksts: 'Chrome vai Edge — adreses joslas labajā pusē ir instalēšanas ikona (⊕)' },
  { n: 2, ikona: '📲', teksts: 'Vai atver izvēlni (⋮) un izvēlies "Instalēt Meža tirgus"' },
  { n: 3, ikona: '✅', teksts: 'Pieskar "Instalēt" — app atvērsies atsevišķā logā' },
]

export default function PwaInstalModal({ onAizveret }) {
  const [plat] = useState(platforma)

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onAizveret() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onAizveret])

  const soli = plat === 'ios' ? SOLI_IOS : plat === 'android' ? SOLI_ANDROID : SOLI_DESKTOP
  const platLabel = plat === 'ios' ? 'iPhone / iPad' : plat === 'android' ? 'Android' : 'Dators'
  const platIkona = plat === 'ios' ? '🍎' : plat === 'android' ? '🤖' : '💻'

  return (
    <div
      onClick={onAizveret}
      style={{
        position: 'fixed', inset: 0, zIndex: 2000,
        background: C.overlay, display: 'flex',
        alignItems: 'flex-end', justifyContent: 'center',
        padding: '0 0 env(safe-area-inset-bottom)',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: C.bgCard, borderTop: `2px solid ${C.green}`,
          borderRadius: `${R.xl} ${R.xl} 0 0`,
          width: '100%', maxWidth: 480,
          padding: '24px 24px 32px',
          fontFamily: F.family,
          boxShadow: '0 -8px 40px rgba(0,0,0,0.6)',
          animation: 'pwaSlideUp 0.25s ease-out',
        }}
      >
        <style>{`@keyframes pwaSlideUp { from { transform: translateY(100%) } to { transform: translateY(0) } }`}</style>

        {/* Vilkšanas rokturis */}
        <div style={{ width: 40, height: 4, background: C.greenBdrLt, borderRadius: 2, margin: '0 auto 20px' }} />

        {/* Virsraksts */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
          <div style={{
            width: 40, height: 40, background: `linear-gradient(135deg, ${C.greenMd}, ${C.greenDk})`,
            borderRadius: R.md, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20,
          }}>🌲</div>
          <div>
            <div style={{ fontSize: F.lg, fontWeight: 700, color: C.text }}>Instalēt Meža tirgus</div>
            <div style={{ fontSize: F.xs, color: C.textDim }}>
              {platIkona} {platLabel} — soļi
            </div>
          </div>
          <button onClick={onAizveret} style={{
            marginLeft: 'auto', background: 'none', border: 'none',
            color: C.textMut, fontSize: 22, cursor: 'pointer', lineHeight: 1,
            padding: 4, minWidth: 36, minHeight: 36,
          }}>×</button>
        </div>

        {/* Ieguvumi */}
        <div style={{
          background: C.bgInner, borderRadius: R.md, padding: '10px 14px',
          marginBottom: 20, display: 'flex', gap: 16, flexWrap: 'wrap',
        }}>
          {['⚡ Darbojas bez interneta', '🔔 Paziņojumi', '📱 Pilnekrāna skats'].map(t => (
            <span key={t} style={{ fontSize: F.xs, color: C.textMut }}>{t}</span>
          ))}
        </div>

        {/* Soļi */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {soli.map((s, i) => (
            <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
              <div style={{
                width: 28, height: 28, background: C.greenDk, borderRadius: '50%',
                border: `1px solid ${C.green}`, display: 'flex', alignItems: 'center',
                justifyContent: 'center', fontSize: 13, fontWeight: 700, color: C.green, flexShrink: 0,
              }}>{s.n}</div>
              <div style={{ paddingTop: 4 }}>
                <span style={{ fontSize: 16, marginRight: 6 }}>{s.ikona}</span>
                <span style={{ fontSize: F.base, color: C.textSec, lineHeight: 1.5 }}>{s.teksts}</span>
              </div>
            </div>
          ))}
        </div>

        {plat === 'ios' && (
          <div style={{
            marginTop: 16, padding: '10px 14px', background: `${C.info}11`,
            border: `1px solid ${C.info}33`, borderRadius: R.md,
            fontSize: F.xs, color: C.info, lineHeight: 1.5,
          }}>
            ℹ️ iPhone lietotājiem jāizmanto <strong>Safari</strong> pārlūks — Chrome instalēšanu neatbalsta.
          </div>
        )}

        <button onClick={onAizveret} style={{
          width: '100%', marginTop: 20,
          padding: '13px 0', background: C.greenDk,
          border: `1px solid ${C.green}`, borderRadius: R.md,
          color: C.text, fontSize: F.base, fontWeight: 600,
          cursor: 'pointer', fontFamily: F.family,
        }}>Sapratu</button>
      </div>
    </div>
  )
}
