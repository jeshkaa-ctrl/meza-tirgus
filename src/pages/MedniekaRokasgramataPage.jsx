import { useState, useEffect } from 'react'
import { MOTO, ETIKAS_TEKSTI } from '../data/etika'
import { EtikasTeksts } from '../components/mednieks/EtikasTeksts'
import SugasKatalogs from '../components/mednieks/SugasKatalogs'
import JuristsChat from '../components/mednieks/JuristsChat'
import CICKalkulators from '../components/mednieks/CICKalkulators'
import SelekcijasKalkulators from '../SelekcijasKalkulators'
import DienasgramataPage from './DienasgramataPage'

const TABS = [
  { id: 'sugas',        nos: '🦌 Sugas' },
  { id: 'selektors',   nos: '🎯 Selektors' },
  { id: 'jurists',     nos: '⚖️ Jurists' },
  { id: 'cic',         nos: '🏆 CIC' },
  { id: 'dienasgramata', nos: '📖 Dienasgrāmata' },
]

export default function MedniekaRokasgramataPage({ onBack }) {
  const [aktiva, setAktiva] = useState('sugas')
  const [installPrompt, setInstallPrompt] = useState(null)
  const [vaрInstalet, setVarInstalet] = useState(false)

  useEffect(() => {
    if (window.matchMedia('(display-mode: standalone)').matches) return
    const handler = (e) => { e.preventDefault(); setInstallPrompt(e); setVarInstalet(true) }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  async function instaletApp() {
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
        {aktiva === 'cic'            && <CICKalkulators />}
        {aktiva === 'dienasgramata'  && <DienasgramataPage />}
      </div>
    </div>
  )
}
