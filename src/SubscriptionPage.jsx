import { useState } from 'react'
import { useSubscription } from './hooks/useSubscription'
import { supabase } from './supabaseClient'
import { C as DS, F, spinnerCSS } from './ds'

const BUSINESS_PLANS = [
  {
    id:         'business_sakuma',
    nosaukums:  'Sākuma',
    cena_men:   29,
    cena_gad:   290,
    krasa:      '#4caf50',
    border:     '#4caf50',
    ikona:      '🌲',
    apraksts:   'Līdz 50 pavadzīmēm/mēn.',
    pavadzimes: '50/mēn.',
    funkcijas: [
      { label: 'PDF dokumenti (bez kartes PDF)'    },
      { label: 'Rēķinu arhīvs'                     },
      { label: 'Loģistikas kalkulators'             },
      { label: 'Iepirkuma vietu reģistrācija'       },
      { label: '3 sludinājumi/mēn.'                 },
      { label: 'Pavadzīmju reģistrs (50/mēn.)'      },
    ],
  },
  {
    id:         'business_videjais',
    nosaukums:  'Vidējais',
    cena_men:   45,
    cena_gad:   450,
    krasa:      '#66bb6a',
    border:     '#66bb6a',
    ikona:      '🌳',
    apraksts:   'Līdz 150 pavadzīmēm/mēn.',
    pavadzimes: '150/mēn.',
    ieteicams:  true,
    funkcijas: [
      { label: 'PDF dokumenti (bez kartes PDF)'    },
      { label: 'Rēķinu arhīvs'                     },
      { label: 'Loģistikas kalkulators'             },
      { label: 'Iepirkuma vietu reģistrācija'       },
      { label: '3 sludinājumi/mēn.'                 },
      { label: 'Pavadzīmju reģistrs (150/mēn.)'     },
    ],
  },
  {
    id:         'business_neierobezots',
    nosaukums:  'Neierobežots',
    cena_men:   69,
    cena_gad:   690,
    krasa:      '#fbbf24',
    border:     '#fbbf24',
    ikona:      '🏢',
    apraksts:   'Neierobežotas pavadzīmes',
    pavadzimes: '♾ /mēn.',
    funkcijas: [
      { label: 'PDF dokumenti (bez kartes PDF)'    },
      { label: 'Rēķinu arhīvs'                     },
      { label: 'Loģistikas kalkulators'             },
      { label: 'Iepirkuma vietu reģistrācija'       },
      { label: '3 sludinājumi/mēn.'                 },
      { label: 'Pavadzīmju reģistrs (♾ /mēn.)'      },
    ],
  },
]

const VIENREIZIGI = [
  { nosaukums: 'Kartes PDF',           cena: '5.00 €',  apraksts: 'Meža plāns ar karti' },
  { nosaukums: 'Sludinājums',          cena: '5.00 €',  apraksts: '30 dienas aktīvs' },
  { nosaukums: 'Izcelts sludinājums',  cena: '15.00 €', apraksts: 'Augšgalā 14 dienas' },
]

const FREE_FUNKCIJAS = [
  'Cirsmu novērtēšana',
  'Kubikmetru kalkulators',
  'Dastojuma uzmērīšana',
  'Krautuves mērītājs (AI)',
  'Loģistikas kalkulators',
  'Cirsmas skice (bez PDF)',
  'Tirgus kopiena un sludinājumu skatīšana',
]

export default function SubscriptionPage({ onBack, onNavigate, user }) {
  const { plan: tagadejais, loading } = useSubscription()
  const [ciklsGads, setCiklsGads] = useState(false)
  const [maksajums, setMaksajums] = useState({ loading: false, klude: '' })

  const saktMaksajumu = async (planId, billingCycle) => {
    if (!user) {
      setMaksajums({ loading: false, klude: 'Lūdzu ielogojies pirms maksāšanas' })
      return
    }
    setMaksajums({ loading: true, klude: '' })
    try {
      const { data, error } = await supabase.functions.invoke('create-payment', {
        body: { userId: user.id, planId, billingCycle },
      })
      if (error || !data?.paymentUrl) throw new Error(error?.message || 'Nav paymentUrl')
      window.location.href = data.paymentUrl
    } catch (e) {
      setMaksajums({ loading: false, klude: `Kļūda: ${e.message}` })
    }
  }

  const isBizness = ['business', 'business_sakuma', 'business_videjais', 'business_neierobezots'].includes(tagadejais)

  return (
    <div style={{ minHeight: '100vh', background: DS.bg, color: DS.text, fontFamily: F.family }}>
      <style>{spinnerCSS}</style>

      {/* Header */}
      <div style={{
        background: DS.glass, borderBottom: `1px solid ${DS.greenBdr}`,
        backdropFilter: 'blur(8px)', padding: '0 20px', height: 52,
        display: 'flex', alignItems: 'center', gap: 12,
        position: 'sticky', top: 0, zIndex: 10,
      }}>
        <button onClick={onBack} style={{ background: 'transparent', border: 'none', color: DS.green, fontSize: 22, cursor: 'pointer', minWidth: 36, minHeight: 44 }}>←</button>
        <div>
          <div style={{ color: DS.green, fontSize: F.md, fontWeight: F.weightBold }}>💳 Meža tirgus — Plāni</div>
          <div style={{ color: DS.textDim, fontSize: F.xs }}>Izvēlies piemēroto abonementu</div>
        </div>
      </div>

      <div style={{ maxWidth: 1000, margin: '0 auto', padding: '28px 20px 60px' }}>

        {/* Tagadējais plāns */}
        {!loading && (
          <div style={{ marginBottom: 28, padding: '12px 18px', background: '#111f11', border: '1px solid #2d4a2d', borderRadius: 10, display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 20 }}>📋</span>
            <div>
              <div style={{ fontSize: 13, color: '#7ab87a' }}>Tavs pašreizējais plāns</div>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#4caf50' }}>
                {isBizness
                  ? (BUSINESS_PLANS.find(p => p.id === tagadejais)?.nosaukums || 'Bizness') + ' (Biznesa plāns)'
                  : 'Bezmaksas'}
              </div>
            </div>
          </div>
        )}

        {/* ── BEZMAKSAS ─────────────────────────────────────────── */}
        <div style={{ background: '#111f11', border: '1px solid #2d4a2d', borderRadius: 12, padding: '20px 24px', marginBottom: 32 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, flexWrap: 'wrap', gap: 8 }}>
            <div>
              <div style={{ fontSize: 18, fontWeight: 800, color: '#4caf50' }}>🌱 Bezmaksas</div>
              <div style={{ fontSize: 12, color: '#4a7a4a', marginTop: 2 }}>Reģistrācija — visi pamata rīki bez maksas</div>
            </div>
            <div style={{ fontSize: 28, fontWeight: 800, color: '#e8f5e9' }}>€0</div>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px 28px' }}>
            {FREE_FUNKCIJAS.map(f => (
              <div key={f} style={{ fontSize: 13, color: '#a8d8a8', display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ color: '#4caf50', fontSize: 12 }}>✓</span>{f}
              </div>
            ))}
          </div>
        </div>

        {/* ── BIZNESA PLĀNI ─────────────────────────────────────── */}
        <div style={{ marginBottom: 16 }}>
          <h3 style={{ color: '#4caf50', fontSize: 16, fontWeight: 800, margin: '0 0 6px' }}>🏢 Biznesa plāni</h3>
          <p style={{ color: '#7ab87a', fontSize: 13, margin: '0 0 16px' }}>
            Iekļauts visos plānos: visi bezmaksas rīki + PDF dokumenti (bez kartes) + rēķinu arhīvs + loģistikas kalkulators + iepirkuma vietu reģistrācija + 3 sludinājumi/mēn.
          </p>
        </div>

        {/* Cikla toggle */}
        <div style={{ display: 'flex', gap: 0, marginBottom: 20, background: '#111f11', borderRadius: 8, padding: 4, width: 'fit-content' }}>
          {[{ val: false, label: 'Mēnesī' }, { val: true, label: 'Gadā (ietaupa 2 mēn.)' }].map(({ val, label }) => (
            <button key={label} onClick={() => setCiklsGads(val)} style={{
              padding: '7px 20px', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 500,
              background: ciklsGads === val ? '#225522' : 'transparent',
              color: ciklsGads === val ? 'white' : '#7ab87a',
            }}>
              {label}
            </button>
          ))}
        </div>

        {/* 3 Biznesa kartiņas */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16, marginBottom: 40 }}>
          {BUSINESS_PLANS.map(p => {
            const aktīvs  = tagadejais === p.id
            const cena    = ciklsGads ? p.cena_gad : p.cena_men
            const periods = ciklsGads ? '/gadā' : '/mēn.'

            return (
              <div key={p.id} style={{
                background: '#111f11',
                border: `2px solid ${aktīvs ? p.border : p.ieteicams ? p.border + '66' : '#2d4a2d'}`,
                borderRadius: 12,
                padding: '20px 20px 24px',
                position: 'relative',
                boxShadow: aktīvs ? `0 0 20px ${p.border}22` : 'none',
              }}>
                {p.ieteicams && !aktīvs && (
                  <div style={{ position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)', background: p.krasa, color: 'white', fontSize: 11, fontWeight: 700, padding: '3px 12px', borderRadius: 10, whiteSpace: 'nowrap' }}>
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
                <div style={{ fontSize: 12, color: '#7ab87a', marginBottom: 8 }}>{p.apraksts}</div>
                <div style={{ fontSize: 11, color: '#4caf50', background: 'rgba(76,175,80,0.1)', borderRadius: 6, padding: '3px 8px', display: 'inline-block', marginBottom: 16 }}>
                  📄 {p.pavadzimes} pavadzīmes
                </div>

                <div style={{ marginBottom: 20 }}>
                  <span style={{ fontSize: 32, fontWeight: 700, color: '#e8f5e9' }}>€{cena}</span>
                  <span style={{ fontSize: 13, color: '#7ab87a', marginLeft: 4 }}>{periods}</span>
                  {ciklsGads && (
                    <div style={{ fontSize: 11, color: '#4caf50', marginTop: 2 }}>
                      ~€{(p.cena_gad / 12).toFixed(0)}/mēn. — ietaupa €{p.cena_men * 12 - p.cena_gad} gadā
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
                  {p.funkcijas.map(f => (
                    <div key={f.label} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13 }}>
                      <span style={{ fontSize: 14, color: '#4caf50', flexShrink: 0 }}>✓</span>
                      <span style={{ color: '#a8d8a8' }}>{f.label}</span>
                    </div>
                  ))}
                </div>

                <button
                  disabled={aktīvs || maksajums.loading}
                  onClick={() => saktMaksajumu(p.id, ciklsGads ? 'yearly' : 'monthly')}
                  style={{
                    width: '100%', padding: '12px 0', borderRadius: 8, border: 'none',
                    background: aktīvs
                      ? '#1a2e1a'
                      : maksajums.loading
                      ? '#1a3a1a'
                      : p.id === 'business_neierobezots'
                      ? '#7a6000'
                      : '#225522',
                    color: aktīvs ? '#4a7a4a' : 'white',
                    fontSize: 14, fontWeight: 600,
                    cursor: aktīvs ? 'default' : 'pointer',
                    opacity: maksajums.loading ? 0.7 : 1,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  }}
                >
                  {aktīvs
                    ? '✓ Aktīvs plāns'
                    : maksajums.loading
                    ? '⏳ Novirza uz banku...'
                    : `🏦 Abonēt — €${cena}${ciklsGads ? '/gadā' : '/mēn.'}`
                  }
                </button>

                {!aktīvs && (
                  <div style={{ marginTop: 10, textAlign: 'center' }}>
                    <div style={{ fontSize: 10, color: '#3a5a3a', marginBottom: 4 }}>Pieejamas bankas:</div>
                    <div style={{ display: 'flex', gap: 6, justifyContent: 'center', flexWrap: 'wrap' }}>
                      {['Swedbank', 'SEB', 'Citadele', 'Luminor'].map(b => (
                        <span key={b} style={{
                          fontSize: 10, color: '#4a7a4a', background: '#0f2b0f',
                          border: '1px solid #1e3a1e', borderRadius: 4, padding: '2px 6px',
                        }}>{b}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Kļūdas ziņojums */}
        {maksajums.klude && (
          <div style={{ background: DS.errorBg, border: `1px solid ${DS.error}44`, borderRadius: 8, padding: '10px 16px', marginBottom: 16, color: DS.error, fontSize: 13 }}>
            ⚠ {maksajums.klude}
          </div>
        )}

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
            ⏳ Vienreizējie maksājumi — drīzumā ar Montonio integrāciju
          </p>
        </div>

      </div>
    </div>
  )
}
