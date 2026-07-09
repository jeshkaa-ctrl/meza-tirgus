import { useState, useEffect } from 'react'
import { MOTO, ETIKAS_TEKSTI } from '../data/etika'
import { EtikasTeksts } from '../components/mednieks/EtikasTeksts'
import SugasKatalogs from '../components/mednieks/SugasKatalogs'
import JuristsChat from '../components/mednieks/JuristsChat'
import CICKalkulators from '../CICKalkulatorsPage'
import SelekcijasKalkulators from '../SelekcijasKalkulators'
import DienasgramataPage from './DienasgramataPage'

const TABS = [
  { id: 'sugas',        nos: '🦌 Sugas' },
  { id: 'selektors',   nos: '🎯 Selektors' },
  { id: 'jurists',     nos: '⚖️ Jurists' },
  { id: 'cic',         nos: '🏆 CIC' },
  { id: 'dienasgramata', nos: '📖 Dienasgrāmata' },
]

export default function MedniekaRokasgramataPage({ onBack, user, onReg, authLoading }) {
  const [aktiva, setAktiva] = useState('sugas')
  const [installPrompt, setInstallPrompt] = useState(null)
  const [varInstalet, setVarInstalet] = useState(false)
  const [showIosHint, setShowIosHint] = useState(false)

  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent)
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone

  useEffect(() => {
    if (isStandalone) return
    if (isIOS) { setVarInstalet(true); return }
    if (window.deferredInstallPrompt) {
      setInstallPrompt(window.deferredInstallPrompt)
      setVarInstalet(true)
    }
    const handler = (e) => { e.preventDefault(); setInstallPrompt(e); setVarInstalet(true) }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  async function instaletApp() {
    if (isIOS) { setShowIosHint(true); return }
    if (!installPrompt) return
    installPrompt.prompt()
    const { outcome } = await installPrompt.userChoice
    if (outcome === 'accepted') { setVarInstalet(false); setInstallPrompt(null) }
  }

  const etikaIndex = new Date().getDate() % ETIKAS_TEKSTI.vispareji.length
  const sākumaEtika = ETIKAS_TEKSTI.vispareji[etikaIndex]

  const s = {
    app:  { minHeight: '100vh', background: '#060d06', color: '#ddeadd', fontFamily: "'Inter',sans-serif" },
    hdr:  { background: 'rgba(6,13,6,0.97)', borderBottom: '1px solid #1a3a1a', backdropFilter: 'blur(8px)',
            padding: '0 16px', height: 52, display: 'flex', alignItems: 'center', gap: 10,
            position: 'sticky', top: 0, zIndex: 10 },
    back: { background: 'transparent', border: 'none', color: '#4caf50', fontSize: 22, cursor: 'pointer',
            padding: '0 4px', minWidth: 36, minHeight: 44 },
  }

  // Kamēr auth ielādējas — rāda spinneri, nevis gate
  if (authLoading) return (
    <div style={{ minHeight: '100vh', background: '#060d06', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
      <div style={{ width: 40, height: 40, border: '3px solid #1a3a1a', borderTop: '3px solid #4caf50', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
      <style>{'@keyframes spin{to{transform:rotate(360deg)}}'}</style>
      <div style={{ color: '#4a7a4a', fontSize: 14 }}>Ielādē...</div>
    </div>
  )

  // Gate — tikai reģistrētiem lietotājiem
  if (!user) return (
    <div style={{ minHeight: '100vh', background: '#060d06', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24, gap: 20 }}>
      <img src="/pwa-192x192.png" alt="Mednieka Rokasgrāmata" style={{ width: 96, height: 96, borderRadius: 20 }} />
      <div style={{ textAlign: 'center' }}>
        <div style={{ color: '#4caf50', fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Mednieka Rokasgrāmata</div>
        <div style={{ color: '#5a8a5a', fontSize: 14, lineHeight: 1.6, maxWidth: 300 }}>
          Pieejama tikai reģistrētiem lietotājiem. Reģistrācija ir bezmaksas.
        </div>
      </div>
      <button onClick={onReg} style={{
        background: '#e8720c', color: '#fff', border: 'none',
        borderRadius: 10, padding: '14px 32px', fontSize: 15,
        fontWeight: 700, cursor: 'pointer', width: '100%', maxWidth: 300,
      }}>Reģistrēties / Pieteikties</button>
      <button onClick={onBack} style={{
        background: 'transparent', color: '#5a8a5a', border: '1px solid #1a3a1a',
        borderRadius: 10, padding: '12px 32px', fontSize: 14,
        cursor: 'pointer', width: '100%', maxWidth: 300,
      }}>← Atpakaļ</button>
    </div>
  )

  return (
    <div style={s.app}>
      {/* Galvene */}
      <div style={s.hdr}>
        <button style={s.back} onClick={onBack}>←</button>
        <h1 style={{ margin: 0, color: '#4caf50', fontSize: 15, fontWeight: 700, flex: 1 }}>
          🏹 Mednieka Rokasgrāmata
        </h1>
        {varInstalet && (
          <button onClick={instaletApp} style={{
            background: '#e8720c', color: '#fff', border: 'none',
            borderRadius: 8, padding: '6px 12px', fontSize: 12,
            fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap',
          }}>
            📲 Instalēt
          </button>
        )}
      </div>

      {/* iOS instalēšanas instrukcija */}
      {showIosHint && (
        <div style={{ background: '#1a2510', border: '1px solid #e8720c', borderRadius: 12, margin: '8px 12px 0', padding: '12px 16px', position: 'relative' }}>
          <button onClick={() => setShowIosHint(false)} style={{ position: 'absolute', top: 8, right: 10, background: 'none', border: 'none', color: '#7a8f52', fontSize: 18, cursor: 'pointer' }}>×</button>
          <div style={{ color: '#e8720c', fontWeight: 700, fontSize: 13, marginBottom: 8 }}>📲 Kā instalēt iPhone/iPad:</div>
          <div style={{ color: '#b8c89a', fontSize: 13, lineHeight: 1.8 }}>
            1. Atver <strong style={{ color: '#e8f0d8' }}>Safari</strong> pārlūku<br />
            2. Nospied <strong style={{ color: '#e8f0d8' }}>□↑ (Share)</strong> pogu apakšā<br />
            3. Izvēlies <strong style={{ color: '#e8f0d8' }}>"Add to Home Screen"</strong><br />
            4. Nospied <strong style={{ color: '#e8f0d8' }}>Add</strong> — ikona parādās sākumekrānā!
          </div>
        </div>
      )}

      {/* Virsraksts un moto */}
      <div style={{ textAlign: 'center', padding: '24px 16px 16px', borderBottom: '1px solid #1a3a1a' }}>
        <p style={{ fontSize: '0.9rem', fontStyle: 'italic', color: '#6b9e61',
          maxWidth: 560, margin: '0 auto 10px', lineHeight: 1.7 }}>
          "{MOTO}"
        </p>
        <div style={{ fontSize: '0.75rem', color: '#4a7c3f', marginBottom: 12 }}>
          — Latvijas Mednieku ētikas kodekss
        </div>
        <div style={{ maxWidth: 560, margin: '0 auto' }}>
          <EtikasTeksts teksts={sākumaEtika} />
        </div>
      </div>

      {/* Tab navigācija */}
      <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid #1a3a1a', overflowX: 'auto' }}>
        {TABS.map(tab => (
          <button key={tab.id} onClick={() => setAktiva(tab.id)}
            style={{ flex: 1, minWidth: 80, padding: '12px 8px', fontSize: 13, cursor: 'pointer', border: 'none',
              background: aktiva === tab.id ? '#0d1a0d' : 'transparent',
              color: aktiva === tab.id ? '#4caf50' : '#5a8a5a',
              fontWeight: aktiva === tab.id ? 700 : 400,
              borderBottom: aktiva === tab.id ? '2px solid #4caf50' : '2px solid transparent' }}>
            {tab.nos}
          </button>
        ))}
      </div>

      {/* Saturs */}
      <div style={{ padding: 16, maxWidth: 900, margin: '0 auto' }}>
        {aktiva === 'sugas'          && <SugasKatalogs />}
        {aktiva === 'selektors'      && <SelekcijasKalkulators />}
        {aktiva === 'jurists'        && <JuristsChat />}
        {aktiva === 'cic'            && <CICKalkulators onBack={() => setAktiva('sugas')} />}
        {aktiva === 'dienasgramata'  && <DienasgramataPage />}
      </div>
    </div>
  )
}
