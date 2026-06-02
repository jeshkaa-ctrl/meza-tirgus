import JautaParMezuWidget from './components/JautaParMezuWidget'
import { C, F, R, S, spinnerCSS } from './ds'

const ADMIN_EMAIL = 'jeshkaa@inbox.lv'

const SADAJAS = (isAdmin) => [
  {
    title: "Cirsmu darbi",
    color: C.green,
    ikona: "🪓",
    riki: [
      { icon: "🗺", title: "Cirsmas skice",           desc: "KML/SHP → skice, koordinātas, PDF VMD iesniegumam",                   page: "skice" },
      { icon: "🌲", title: "Cirsmas novērtēšana",     desc: "PDF no VMD → nogabalu analīze, cirsmas vērtība",                      page: "cirsma" },
      { icon: "📊", title: "Dastojuma kalkulators",   desc: "Mežvērtes PDF → sortimentu apjomi, krautuves vērtība",                page: "dastojums_pdf" },
    ]
  },
  {
    title: "Mobilie rīki",
    color: '#42a5f5',
    ikona: "📱",
    riki: [
      { icon: "📐", title: "Kubikmetru kalkulators",  desc: "Tievgalis + garums → m³, sortimenti, PDF",                           page: "kubi",             badge: "MOBILAIS" },
      { icon: "📏", title: "Caurmēra mērījumi",       desc: "Ātra caurmēru ievade laukā, tūlītējs rezultāts",                     page: "caurmers_mobile",  badge: "MOBILAIS" },
      { icon: "🌲", title: "Cirsmas vērtēšana",       desc: "G mērījumi, Bitterlich, sortimenti reāllaikā",                       page: "cirsma_mobile",    badge: "MOBILAIS" },
      { icon: "🪵", title: "Dastojuma mērītājs",      desc: "Dastojuma rindu ievade, apjomi, pavadzīmes",                         page: "dastojums_meritajs", badge: "MOBILAIS" },
      { icon: "📦", title: "Krautuves mērītājs",      desc: "AI foto analīze → krājumu uzskaite un vērtēšana",                    page: "krautuves_meritajs", badge: "MOBILAIS" },
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
      { icon: "💳", title: "Abonements",              desc: "Pro un Komercija plāni — paplašinātas iespējas",                     page: "subscription" },
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
    title: "VMD & Analīze",
    color: '#4db6ac',
    ikona: "📄",
    riki: [
      { icon: "🌲", title: "Cirsmas novērtēšana PDF", desc: "VMD inventarizācijas PDF → nogabalu analīze, vērtība",               page: "standard" },
      { icon: "✂️", title: "PDF šķirotājs",           desc: "Sadala daudzīpašumu PDF pa kadastriem",                              page: "pdfSkirotajs" },
      { icon: "⚖️", title: "Meža likumi — AI čats",   desc: "Daudzfāzu saruna, VMD/DAP kontakti, kategorijas",                   page: "jautaparmezu", badge: "AI" },
    ]
  },
]

export default function MainPage({ onNavigate, user, onReg, onIziet }) {
  const isAdmin = user?.epasts === ADMIN_EMAIL
  const sadajas = SADAJAS(isAdmin)

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
          <div className="mp-logo" onClick={() => onNavigate('landing')} style={{ display: 'flex', alignItems: 'center', gap: S.sm, cursor: 'pointer' }}>
            <div style={{
              width: 32, height: 32, background: `linear-gradient(135deg, ${C.greenMd}, ${C.greenDk})`,
              borderRadius: R.md, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 17,
            }}>🌲</div>
            <span style={{ fontSize: F.lg, fontWeight: F.weightBlack, color: C.green, letterSpacing: '-0.01em' }}>Meža tirgus</span>
          </div>

          <div className="mp-header-btns" style={{ display: 'flex', gap: S.sm, alignItems: 'center' }}>
            <a href="https://www.lvmgeo.lv/kartes" target="_blank" rel="noreferrer" style={{
              padding: '7px 14px', background: C.greenMd, color: 'white', borderRadius: R.md,
              textDecoration: 'none', fontSize: F.sm, fontWeight: F.weightBold,
            }}>🗺 LVM GEO</a>
            <a href="https://www.vmd.gov.lv" target="_blank" rel="noreferrer" style={{
              padding: '7px 14px', background: '#5d4037', color: 'white', borderRadius: R.md,
              textDecoration: 'none', fontSize: F.sm, fontWeight: F.weightBold,
            }}>🏛 VMD</a>
            <button onClick={() => onNavigate('kopiena')} style={{
              padding: '7px 14px', background: '#EDF5E8', color: '#3B6D11',
              border: '1px solid #A8D89A', borderRadius: R.md, fontSize: F.sm, cursor: 'pointer', fontWeight: 600,
            }}>🌿 Kopiena</button>
            <button onClick={() => onNavigate('jautaparmezu')} style={{
              padding: '7px 14px', background: 'transparent', color: C.textSec,
              border: `1px solid ${C.greenBdr}`, borderRadius: R.md, fontSize: F.sm, cursor: 'pointer',
            }}>⚖️ Meža likumi</button>
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
        </div>
      </header>

      <main style={{ maxWidth: 1100, margin: '0 auto', padding: `${S.xl} 20px 60px` }}>

        {/* MEŽA LIKUMI WIDGET */}
        <div style={{ marginBottom: S.xl }}>
          <JautaParMezuWidget onPilnsSkats={() => onNavigate('jautaparmezu')} />
        </div>

        {/* SADAĻAS */}
        <div className="mp-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: S.lg }}>
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
                  <div key={ri} className="mp-tile" onClick={() => onNavigate(r.page)} style={{
                    background: C.bgInner, border: `1px solid ${C.greenBdr}`,
                    borderRadius: R.md, padding: '10px 14px', cursor: 'pointer',
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
    </div>
  )
}
