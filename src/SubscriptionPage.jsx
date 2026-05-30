import { useState } from 'react'
import { useSubscription } from './hooks/useSubscription'

const PLANS = [
  {
    id:       'free',
    nosaukums:'Bezmaksas',
    cena_men: 0,
    cena_gad: 0,
    krasa:    '#4a7a4a',
    border:   '#2d4a2d',
    ikona:    '🌱',
    apraksts: 'Pamata rīki bez maksas',
    funkcijas: [
      { label: 'Cirsmu novērtēšana',      ir: true  },
      { label: 'Kubikmetru kalkulators',   ir: true  },
      { label: 'Dastojuma uzmērīšana',     ir: true  },
      { label: 'Krautuves mērītājs (AI)',  ir: true  },
      { label: 'PDF lejupielāde',          ir: false },
      { label: 'Rēķinu arhīvs',            ir: false },
      { label: 'Sludinājumu publicēšana',  ir: false },
      { label: 'Izsoles publicēšana',      ir: false },
      { label: 'Pavadzīmju reģistrs',      ir: false },
    ],
  },
  {
    id:       'pro',
    nosaukums:'Pro',
    cena_men: 19,
    cena_gad: 159,
    krasa:    '#4caf50',
    border:   '#4caf50',
    ikona:    '🌲',
    apraksts: 'Meža speciālistiem',
    ieteicams: true,
    funkcijas: [
      { label: 'Cirsmu novērtēšana',      ir: true  },
      { label: 'Kubikmetru kalkulators',   ir: true  },
      { label: 'Dastojuma uzmērīšana',     ir: true  },
      { label: 'Krautuves mērītājs (AI)',  ir: true  },
      { label: 'PDF lejupielāde',          ir: true  },
      { label: 'Rēķinu arhīvs',            ir: true  },
      { label: 'Sludinājumu publicēšana',  ir: true  },
      { label: 'Izsoles publicēšana',      ir: false },
      { label: 'Pavadzīmju reģistrs',      ir: false },
    ],
  },
  {
    id:       'business',
    nosaukums:'Komercija',
    cena_men: 59,
    cena_gad: 490,
    krasa:    '#fbbf24',
    border:   '#fbbf24',
    ikona:    '🏢',
    apraksts: 'Uzņēmumiem un tirgotājiem',
    funkcijas: [
      { label: 'Cirsmu novērtēšana',      ir: true  },
      { label: 'Kubikmetru kalkulators',   ir: true  },
      { label: 'Dastojuma uzmērīšana',     ir: true  },
      { label: 'Krautuves mērītājs (AI)',  ir: true  },
      { label: 'PDF lejupielāde',          ir: true  },
      { label: 'Rēķinu arhīvs',            ir: true  },
      { label: 'Sludinājumu publicēšana',  ir: true  },
      { label: 'Izsoles publicēšana',      ir: true  },
      { label: 'Pavadzīmju reģistrs',      ir: true  },
    ],
  },
]

const VIENREIZIGI = [
  { nosaukums: 'PDF izdruka',            cena: '2.50 €',  apraksts: 'Viena dokumenta PDF' },
  { nosaukums: 'Sludinājums',            cena: '5.00 €',  apraksts: '30 dienas aktīvs' },
  { nosaukums: 'Izcelts sludinājums',    cena: '15.00 €', apraksts: 'Augšgalā 14 dienas' },
]

export default function SubscriptionPage({ onBack, onNavigate }) {
  const { plan: tagadejais, loading } = useSubscription()
  const [ciklsGads, setCiklsGads] = useState(false)

  return (
    <div style={{ minHeight: '100vh', background: '#080f08', color: '#e8f5e9', fontFamily: 'Arial, sans-serif' }}>

      {/* Header */}
      <div style={{ background: '#1b3a1b', borderBottom: '2px solid #4caf50', padding: '12px 20px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <button onClick={onBack} style={{ background: 'transparent', border: 'none', color: '#4caf50', fontSize: 20, cursor: 'pointer' }}>←</button>
        <div>
          <h1 style={{ margin: 0, color: '#4caf50', fontSize: 18, fontWeight: 700 }}>🌲 Meža tirgus — Plāni</h1>
          <div style={{ color: '#81c784', fontSize: 11, marginTop: 2 }}>Izvēlies piemēroto abonementu</div>
        </div>
      </div>

      <div style={{ maxWidth: 960, margin: '0 auto', padding: '28px 20px 60px' }}>

        {/* Tagadējais plāns */}
        {!loading && (
          <div style={{ marginBottom: 24, padding: '12px 18px', background: '#111f11', border: '1px solid #2d4a2d', borderRadius: 10, display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 20 }}>📋</span>
            <div>
              <div style={{ fontSize: 13, color: '#7ab87a' }}>Tavs pašreizējais plāns</div>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#4caf50' }}>
                {PLANS.find(p => p.id === tagadejais)?.nosaukums || 'Bezmaksas'}
              </div>
            </div>
          </div>
        )}

        {/* Cikla toggle */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 0, marginBottom: 28, background: '#111f11', borderRadius: 8, padding: 4, width: 'fit-content', margin: '0 auto 28px' }}>
          {[{ val: false, label: 'Mēnesī' }, { val: true, label: 'Gadā (ietaupa ~30%)' }].map(({ val, label }) => (
            <button key={label} onClick={() => setCiklsGads(val)} style={{
              padding: '7px 20px', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 500,
              background: ciklsGads === val ? '#225522' : 'transparent',
              color: ciklsGads === val ? 'white' : '#7ab87a',
            }}>
              {label}
            </button>
          ))}
        </div>

        {/* Plāni */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16, marginBottom: 40 }}>
          {PLANS.map(p => {
            const aktīvs  = tagadejais === p.id
            const cena    = ciklsGads ? p.cena_gad : p.cena_men
            const periods = ciklsGads ? '/gadā' : '/mēn.'

            return (
              <div key={p.id} style={{
                background: '#111f11',
                border: `2px solid ${aktīvs ? p.border : '#2d4a2d'}`,
                borderRadius: 12,
                padding: '20px 20px 24px',
                position: 'relative',
                boxShadow: aktīvs ? `0 0 20px ${p.border}22` : 'none',
              }}>
                {p.ieteicams && !aktīvs && (
                  <div style={{ position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)', background: '#4caf50', color: 'white', fontSize: 11, fontWeight: 700, padding: '3px 12px', borderRadius: 10 }}>
                    POPULĀRĀKAIS
                  </div>
                )}
                {aktīvs && (
                  <div style={{ position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)', background: p.krasa, color: '#0f1a0f', fontSize: 11, fontWeight: 700, padding: '3px 12px', borderRadius: 10 }}>
                    ✓ TAVS PLĀNS
                  </div>
                )}

                <div style={{ fontSize: 28, marginBottom: 8 }}>{p.ikona}</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: p.krasa, marginBottom: 4 }}>{p.nosaukums}</div>
                <div style={{ fontSize: 12, color: '#7ab87a', marginBottom: 16 }}>{p.apraksts}</div>

                <div style={{ marginBottom: 20 }}>
                  {cena === 0 ? (
                    <span style={{ fontSize: 32, fontWeight: 700, color: '#e8f5e9' }}>Bezmaksas</span>
                  ) : (
                    <>
                      <span style={{ fontSize: 32, fontWeight: 700, color: '#e8f5e9' }}>€{cena}</span>
                      <span style={{ fontSize: 13, color: '#7ab87a', marginLeft: 4 }}>{periods}</span>
                    </>
                  )}
                  {ciklsGads && p.cena_gad > 0 && (
                    <div style={{ fontSize: 11, color: '#4caf50', marginTop: 2 }}>
                      ~€{(p.cena_gad / 12).toFixed(2)}/mēn. — ietaupa €{(p.cena_men * 12 - p.cena_gad)} gadā
                    </div>
                  )}
                </div>

                {/* Funkcijas */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
                  {p.funkcijas.map(f => (
                    <div key={f.label} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13 }}>
                      <span style={{ fontSize: 14, color: f.ir ? '#4caf50' : '#3a4a3a', flexShrink: 0 }}>
                        {f.ir ? '✓' : '✗'}
                      </span>
                      <span style={{ color: f.ir ? '#a8d8a8' : '#3a4a3a' }}>{f.label}</span>
                    </div>
                  ))}
                </div>

                <button
                  disabled={aktīvs}
                  onClick={() => {/* Drīzumā — Stripe */}}
                  style={{
                    width: '100%', padding: '11px 0', borderRadius: 8, border: 'none',
                    background: aktīvs ? '#1a2e1a' : p.id === 'free' ? '#2d4a2d' : p.id === 'pro' ? '#225522' : '#7a6000',
                    color: aktīvs ? '#4a7a4a' : 'white',
                    fontSize: 14, fontWeight: aktīvs ? 400 : 600,
                    cursor: aktīvs ? 'default' : 'pointer',
                  }}
                >
                  {aktīvs
                    ? '✓ Aktīvs plāns'
                    : p.id === 'free'
                    ? 'Bezmaksas'
                    : '⏳ Drīzumā — Stripe maksājums'}
                </button>
              </div>
            )
          })}
        </div>

        {/* Pay-as-you-go */}
        <div style={{ background: '#111f11', border: '1px solid #2d4a2d', borderRadius: 12, padding: '20px 24px' }}>
          <h3 style={{ color: '#4caf50', margin: '0 0 4px', fontSize: 16 }}>💳 Bez abonēšanas</h3>
          <p style={{ color: '#7ab87a', fontSize: 13, margin: '0 0 16px' }}>Maksā tikai par ko vajag — bez ikmēneša saistībām</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 10 }}>
            {VIENREIZIGI.map(v => (
              <div key={v.nosaukums} style={{ background: '#1a2e1a', border: '1px solid #2d4a2d', borderRadius: 8, padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#e8f5e9' }}>{v.nosaukums}</div>
                  <div style={{ fontSize: 11, color: '#7ab87a', marginTop: 2 }}>{v.apraksts}</div>
                </div>
                <div style={{ fontSize: 16, fontWeight: 700, color: '#4caf50', whiteSpace: 'nowrap' }}>{v.cena}</div>
              </div>
            ))}
          </div>
          <p style={{ fontSize: 11, color: '#4a7a4a', margin: '14px 0 0', textAlign: 'center' }}>
            ⏳ Vienreizējie maksājumi — drīzumā ar Stripe integrāciju
          </p>
        </div>

      </div>
    </div>
  )
}
