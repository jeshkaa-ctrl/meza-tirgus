import { useState, useEffect } from 'react'
import JautaParMezuWidget from './components/JautaParMezuWidget'
import PwaInstalModal from './PwaInstalModal'
import { C, F, R, S, spinnerCSS } from './ds'

const ADMIN_EMAIL = 'arsasmezi@inbox.lv'

const SADAJAS = (isAdmin) => [
  {
    title: "Cirsmu darbi",
    color: C.green,
    ikona: "🪓",
    riki: [
      { icon: "🌳", title: "Apsaimniekošanas plāns",   desc: "MAP laukā — nogabali, terēna dati, MK 384 PDF",                       page: "map-plans", badge: "JAUNS" },
      { icon: "🗺", title: "Īpašuma analīze",          desc: "Kadastra nr. → LVM GEO automātiska analīze, karte, vērtība",         page: "ipasums" },
      { icon: "🗺", title: "Cirsmas skice",           desc: "KML/SHP → skice, koordinātas, PDF VMD iesniegumam",                   page: "skice" },
      { icon: "🌲", title: "Cirsmas novērtēšana",     desc: "PDF no VMD → nogabalu analīze, cirsmas vērtība",                      page: "cirsma" },
      { icon: "📄", title: "VMD PDF analīze",         desc: "Nogabalu aktuālās informācijas analīze no VMD PDF",                   page: "standard" },
      { icon: "📊", title: "Dastojuma kalkulators",   desc: "Mežvērtes PDF → sortimentu apjomi, krautuves vērtība",                page: "dastojums_pdf" },
    ]
  },
  {
    title: "Mobilie rīki",
    color: '#42a5f5',
    ikona: "📱",
    riki: [
      { icon: "📐", title: "Kubikmetru kalkulators",  desc: "Tievgalis + garums → m³, sortimenti, PDF",                           page: "kubi",             badge: "MOBILAIS" },
      { icon: "📏", title: "Caurmēra mērījumi",       desc: "Ātra caurmēru ievade laukā, tūlītējs rezultāts",                     page: "caurmers_mobile",    badge: "MOBILAIS", miniApp: "/caurmers.html" },
      { icon: "🌲", title: "Cirsmas vērtēšana",       desc: "G mērījumi, Bitterlich, sortimenti reāllaikā",                       page: "cirsma_mobile",      badge: "MOBILAIS", miniApp: "/cirsma.html" },
      { icon: "🪵", title: "Dastojuma mērītājs",      desc: "Dastojuma rindu ievade, apjomi, pavadzīmes",                         page: "dastojums_meritajs", badge: "MOBILAIS" },
      { icon: "📦", title: "Krautuves mērītājs",      desc: "AI foto analīze → krājumu uzskaite un vērtēšana",                    page: "krautuves_meritajs", badge: "MOBILAIS", miniApp: "/krautuve.html" },
    ]
  },
  {
    title: "Bizness",
    color: '#ffb74d',
    ikona: "💼",
    riki: [
      { icon: "🪵", title: "Pavadzīmju reģistrs",      desc: "Foto → AI nolasīšana → Supabase datubāze. Personalizēts katram klientam.", page: "pavadzimes" },
      { icon: "🧾", title: "Rēķinu krātuve",          desc: "Rēķinu izveide, drukāšana, mēneša un gada pārskats",                 page: "rekini" },
      { icon: "🚛", title: "Loģistikas kalkulators",  desc: "Transporta izmaksas, piegādes maršruti",                             page: "logistika" },
      { icon: "🏭", title: "Manas iepirkuma vietas",   desc: "Reģistrē iepirkuma punktu un cenas — parādīsies loģistikas kalkulatorā", page: "pirceja_cenas" },
      { icon: "💳", title: "Abonements",              desc: "Pro un Komercija plāni — paplašinātas iespējas",                     page: "subscription" },
    ]
  },
  {
    title: "Medības",
    color: '#8d6e63',
    ikona: "🦌",
    riki: [
      { icon: "🏹", title: "Mednieka Rokasgrāmata", desc: "Sugas katalogs, Selektors, Jurists un CIC Kalkulators — viss vienā vietā", page: "mednieks", badge: "JAUNS" },
    ]
  },
  {
    title: "Sludinājumi",
    color: '#ce93d8',
    ikona: "📢",
    riki: [
      { icon: "📢", title: "Sludinājumi",             desc: "Meža īpašumu un cirsmu sludinājumi",                                 page: "sludinajumi" },
    ]
  },
  {
    title: "Veikals",
    color: '#66bb6a',
    ikona: "🛒",
    riki: [
      { icon: "🛒", title: "Meža Tirgus Veikals",     desc: "Aprīkojums mežstrādniekiem, medniekiem un meža īpašniekiem",         page: "veikals",    badge: "JAUNS" },
    ]
  },
  {
    title: "VMD & Analīze",
    color: '#4db6ac',
    ikona: "📄",
    riki: [
      { icon: "🌲", title: "Cirsmas novērtēšana PDF", desc: "VMD inventarizācijas PDF → nogabalu analīze, vērtība",               page: "standard" },
      { icon: "✂️", title: "PDF šķirotājs",           desc: "Sadala daudzīpašumu PDF pa kadastriem",                              page: "pdfSkirotajs" },
      { icon: "⚖️", title: "Meža likumi — AI čats",   desc: "Daudzfāzu saruna, VMD/DAP kontakti, kategorijas",                   page: "jautaparmezu", badge: "AI" },
      { icon: "💰", title: "Koksnes cenu kalkulators", desc: "Priede, egle, bērzs — sortimentu cenas un apjoma vērtības aprēķins", page: "cenas" },
    ]
  },
]

export default function MainPage({ onNavigate, user, onReg, onIziet }) {
  const isAdmin = user?.epasts === ADMIN_EMAIL
  const sadajas = SADAJAS(isAdmin)

  const [deferredPrompt,  setDeferredPrompt]  = useState(null)
  const [pwaModalOpen,    setPwaModalOpen]    = useState(false)
  const [pwaInstallets,   setPwaInstallets]   = useState(false)

  useEffect(() => {
    if (window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone) {
      setPwaInstallets(true)
      return
    }
    const handler = (e) => { e.preventDefault(); setDeferredPrompt(e) }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  function handleInstalletClick() {
    if (deferredPrompt) {
      deferredPrompt.prompt()
      deferredPrompt.userChoice.then(() => setDeferredPrompt(null))
    } else {
      setPwaModalOpen(true)
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: C.bg, color: C.text, fontFamily: F.family }}>
      <style>{spinnerCSS}{`
        .mp-card:hover { border-color: ${C.greenBdrLt} !important; }
        .mp-tile:hover { background: #22381a !important; transform: translateY(-1px); }
        .mp-tile { transition: all 0.15s; }
        .mp-logo:hover { opacity: 0.85; }
        @media (max-width: 600px) {
          .mp-grid { grid-template-columns: 1fr !important; }
          .mp-header-btns { display: none !important; }
          .mp-header-btns-mobile { display: flex !important; }
        }
      `}</style>

      {/* HEADER */}
      <header style={{
        background: C.glass, borderBottom: `1px solid ${C.greenBdr}`,
        backdropFilter: 'blur(8px)', position: 'sticky', top: 0, zIndex: 100,
      }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 20px', height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
            <button onClick={() => onNavigate('landing')} style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: C.textSec, fontSize: F.sm, padding: '6px 8px',
              borderRadius: R.md, fontFamily: F.family, minHeight: 44,
            }}>← Sākums</button>
            <button onClick={() => onNavigate('tirgus')} style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: C.textMut, fontSize: F.sm, padding: '6px 8px',
              borderRadius: R.md, opacity: 0.75, fontFamily: F.family, minHeight: 44,
            }}>Tirgus</button>
          </div>

          <div className="mp-logo" onClick={() => onNavigate('landing')} style={{ display: 'flex', alignItems: 'center', gap: S.sm, cursor: 'pointer' }}>
            <div style={{
              width: 32, height: 32, background: `linear-gradient(135deg, ${C.greenMd}, ${C.greenDk})`,
              borderRadius: R.md, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 17,
            }}>🌲</div>
            <span style={{ fontSize: F.lg, fontWeight: F.weightBlack, color: C.green, letterSpacing: '-0.01em' }}>Meža tirgus</span>
          </div>

          {/* Desktop nav */}
          <div className="mp-header-btns" style={{ display: 'flex', gap: S.sm, alignItems: 'center' }}>
            <a href="https://www.lvmgeo.lv/kartes" target="_blank" rel="noreferrer" style={{
              padding: '7px 14px', background: C.greenMd, color: 'white', borderRadius: R.md,
              textDecoration: 'none', fontSize: F.sm, fontWeight: F.weightBold,
            }}>🗺 LVM GEO</a>
            <a href="https://www.vmd.gov.lv" target="_blank" rel="noreferrer" style={{
              padding: '7px 14px', background: '#5d4037', color: 'white', borderRadius: R.md,
              textDecoration: 'none', fontSize: F.sm, fontWeight: F.weightBold,
            }}>🏛 VMD</a>
            <button onClick={() => onNavigate('tirgus')} style={{
              padding: '7px 14px', background: '#EDF5E8', color: '#3B6D11',
              border: '1px solid #A8D89A', borderRadius: R.md, fontSize: F.sm, cursor: 'pointer', fontWeight: 600,
            }}>🌿 Tirgus</button>
            <button onClick={() => onNavigate('jautaparmezu')} style={{
              padding: '7px 14px', background: 'transparent', color: C.textSec,
              border: `1px solid ${C.greenBdr}`, borderRadius: R.md, fontSize: F.sm, cursor: 'pointer',
            }}>⚖️ Meža likumi</button>
            <button
              title="Angļu valodas tulkojums tiek gatavots"
              style={{
                padding: '7px 10px', background: 'transparent', color: C.textDim,
                border: `1px solid ${C.greenBdr}33`, borderRadius: R.md, fontSize: '11px',
                cursor: 'not-allowed', opacity: 0.5,
              }}>🇱🇻 LV</button>
            {!pwaInstallets && (
              <button onClick={handleInstalletClick} style={{
                padding: '7px 14px', background: 'transparent', color: C.textMut,
                border: `1px solid ${C.greenBdr}`, borderRadius: R.md, fontSize: F.sm, cursor: 'pointer',
              }}>📲 Instalēt app</button>
            )}
            {isAdmin && (
              <button onClick={() => onNavigate('admin')} style={{
                padding: '7px 14px', background: `${C.green}22`, color: C.green,
                border: `1px solid ${C.green}`, borderRadius: R.md, fontSize: F.sm, cursor: 'pointer',
                fontWeight: 700,
              }}>🔐 Admin</button>
            )}
            {user
              ? <div style={{ display: 'flex', gap: S.sm, alignItems: 'center' }}>
                  <span style={{
                    color: C.textSec, fontSize: F.sm, padding: '7px 12px',
                    background: `${C.green}11`, borderRadius: R.md, border: `1px solid ${C.greenBdr}`,
                  }}>👤 {user.vards || user.epasts}</span>
                  <button onClick={onIziet} style={{
                    padding: '7px 14px', background: 'transparent', color: C.textMut,
                    border: `1px solid ${C.greenBdr}`, borderRadius: R.md, fontSize: F.sm, cursor: 'pointer',
                  }}>Iziet</button>
                </div>
              : <button onClick={onReg} style={{
                  padding: '7px 16px', background: C.greenDk, color: 'white',
                  border: `1px solid ${C.green}`, borderRadius: R.md, fontSize: F.sm,
                  cursor: 'pointer', fontWeight: F.weightBold,
                }}>Reģistrēties</button>
            }
          </div>

          {/* Mobilais — instalēt + login/logout */}
          <div className="mp-header-btns-mobile" style={{ display: 'none', gap: S.sm, alignItems: 'center' }}>
            {!pwaInstallets && (
              <button onClick={handleInstalletClick} style={{
                padding: '8px 12px', background: C.greenDk, color: C.textSec,
                border: `1px solid ${C.green}`, borderRadius: R.md, fontSize: F.sm,
                cursor: 'pointer', fontWeight: 600, minHeight: 44,
              }}>📲 Instalēt</button>
            )}
            {user
              ? <button onClick={onIziet} style={{
                  padding: '8px 14px', background: 'transparent', color: C.textMut,
                  border: `1px solid ${C.greenBdr}`, borderRadius: R.md, fontSize: F.sm,
                  cursor: 'pointer', minHeight: 44,
                }}>Iziet</button>
              : <button onClick={onReg} style={{
                  padding: '8px 16px', background: C.greenDk, color: 'white',
                  border: `1px solid ${C.green}`, borderRadius: R.md, fontSize: F.sm,
                  cursor: 'pointer', fontWeight: F.weightBold, minHeight: 44,
                }}>Pieslēgties</button>
            }
          </div>
        </div>
      </header>

      <main style={{ maxWidth: 1100, margin: '0 auto', padding: `${S.xl} 20px 60px` }}>

        {/* Onboarding — tikai jauniem lietotājiem (pirmo reizi) */}
        {!user && !localStorage.getItem('mt_onb') && (
          <div style={{
            background: `linear-gradient(135deg, ${C.greenDk}, #0d2a0d)`,
            border: `1px solid ${C.green}`, borderRadius: R.xl,
            padding: '16px 20px', marginBottom: S.lg,
            display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap',
          }}>
            <div style={{ flex: 1, minWidth: 200 }}>
              <div style={{ color: C.text, fontWeight: 700, fontSize: F.md, marginBottom: 4 }}>
                👋 Sveicināti Meža tirgū!
              </div>
              <div style={{ color: C.textMut, fontSize: F.sm }}>
                Sāc ar bezmaksas VMD PDF analīzi — augšupielādē inventarizācijas PDF un saņem cirsmas vērtējumu uzreiz.
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
              <button onClick={() => onNavigate('standard')} style={{
                padding: '9px 20px', background: C.green, color: C.bg,
                border: 'none', borderRadius: R.md, fontSize: F.sm,
                fontWeight: 700, cursor: 'pointer', fontFamily: F.family,
              }}>Izmēģini →</button>
              <button onClick={() => localStorage.setItem('mt_onb', '1')} style={{
                padding: '9px 12px', background: 'none', color: C.textDim,
                border: `1px solid ${C.greenBdr}`, borderRadius: R.md,
                fontSize: F.sm, cursor: 'pointer', fontFamily: F.family,
              }}>×</button>
            </div>
          </div>
        )}

        {/* MEŽA LIKUMI WIDGET */}
        <div style={{ marginBottom: S.xl }}>
          <JautaParMezuWidget onPilnsSkats={() => onNavigate('jautaparmezu')} />
        </div>

        {/* BEZMAKSAS RĪKS */}
        <div onClick={() => onNavigate('standard')} className="mp-tile" style={{
          background: `linear-gradient(135deg, #0d2a0d, #1a3a1a)`,
          border: `2px solid ${C.green}`,
          borderRadius: R.xl, padding: '18px 20px', marginBottom: S.lg,
          cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 16,
        }}>
          <div style={{
            width: 48, height: 48, background: `linear-gradient(135deg, ${C.greenMd}, ${C.greenDk})`,
            borderRadius: R.lg, display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 24, flexShrink: 0,
          }}>📄</div>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <span style={{ color: C.text, fontSize: F.md, fontWeight: F.weightBold }}>VMD PDF analīze</span>
              <span style={{
                background: C.green, color: C.bg,
                fontSize: '9px', fontWeight: F.weightBold,
                padding: '2px 7px', borderRadius: R.sm, letterSpacing: '0.05em',
              }}>BEZMAKSAS</span>
            </div>
            <div style={{ color: C.textMut, fontSize: F.sm }}>
              Augšupielādē VMD inventarizācijas PDF → nogabalu analīze, vērtība, sortimenti
            </div>
          </div>
          <span style={{ color: C.green, fontSize: 20, flexShrink: 0 }}>→</span>
        </div>

        {/* SADAĻAS */}
        <div className="mp-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(320px, 100%), 1fr))', gap: S.lg }}>
          {sadajas.map((s, si) => (
            <div key={si} className="mp-card" style={{
              background: C.bgCard, border: `1px solid ${s.color}33`,
              borderRadius: R.xl, padding: S.lg,
              borderTop: `3px solid ${s.color}`, transition: 'border-color 0.2s',
            }}>
              <div style={{
                color: s.color, fontSize: F.xs, fontWeight: F.weightBold,
                textTransform: 'uppercase', letterSpacing: '0.1em',
                marginBottom: S.md, paddingBottom: S.sm,
                borderBottom: `1px solid ${s.color}22`,
                display: 'flex', alignItems: 'center', gap: S.sm,
              }}>
                <span>{s.ikona}</span> {s.title}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: S.sm }}>
                {s.riki.map((r, ri) => (
                  <div key={ri} style={{
                    background: C.bgInner, border: `1px solid ${C.greenBdr}`,
                    borderRadius: R.md, overflow: 'hidden',
                  }}>
                    <div className="mp-tile" onClick={() => onNavigate(r.page)} style={{
                      padding: '10px 14px', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', gap: 12,
                    }}>
                      <span style={{ fontSize: 22, minWidth: 28, textAlign: 'center' }}>{r.icon}</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: S.sm, marginBottom: 2, flexWrap: 'wrap' }}>
                          <span style={{ color: C.text, fontSize: F.base, fontWeight: F.weightBold }}>{r.title}</span>
                          {r.badge && (
                            <span style={{
                              background: `${s.color}22`, color: s.color,
                              fontSize: '9px', padding: '1px 5px', borderRadius: R.sm, fontWeight: F.weightBold,
                            }}>{r.badge}</span>
                          )}
                        </div>
                        <div style={{ color: C.textDim, fontSize: F.xs, lineHeight: 1.4 }}>{r.desc}</div>
                      </div>
                      <span style={{ color: C.textFade, fontSize: 14, flexShrink: 0 }}>→</span>
                    </div>
                    {r.miniApp && (
                      <div style={{
                        borderTop: `1px solid ${C.greenBdr}33`,
                        padding: '6px 14px',
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      }}>
                        <span style={{ fontSize: F.xs, color: C.textDim }}>Pieejams kā atsevišķa aplikācija</span>
                        <a href={r.miniApp} target="_blank" rel="noreferrer"
                          onClick={e => e.stopPropagation()}
                          style={{
                            fontSize: F.xs, color: C.green, fontWeight: 700,
                            textDecoration: 'none', padding: '3px 10px',
                            border: `1px solid ${C.green}44`, borderRadius: R.sm,
                            background: `${C.green}11`,
                          }}>📲 Saglabāt telefonā</a>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* APAKŠA */}
        <div style={{
          marginTop: S.xl, padding: S.lg, background: C.bgInner,
          border: `1px dashed ${C.greenBdr}`, borderRadius: R.lg, textAlign: 'center',
        }}>
          <div style={{ color: C.textDim, fontSize: F.sm }}>💡 Padomi, jaunumi un platformas atjauninājumi parādīsies šeit</div>
        </div>
      </main>

      {pwaModalOpen && <PwaInstalModal onAizveret={() => setPwaModalOpen(false)} />}

    </div>
  )
}
