import { useState } from 'react'
import PavadzimesRegistrs from './PavadzimesRegistrs'
import RpAndrasPortals from './RpAndrasPortals'
import { C, F, R, S, btn, spinnerCSS } from './ds'

const ADMIN_EMAIL = 'arsasmezi@inbox.lv'

// ─── Publiskā info lapa ────────────────────────────────────────────────────────
function PubliskaInfoLapa({ onBack, onReg }) {
  return (
    <div style={{ minHeight: '100vh', background: C.bg, color: C.text, fontFamily: F.family }}>
      <style>{spinnerCSS}{`
        .dr-step:hover { border-color: ${C.greenBdrLt} !important; }
        .dr-cta:hover { background: ${C.greenMd} !important; }
      `}</style>

      {/* Header */}
      <div style={{
        background: C.glass, borderBottom: `1px solid ${C.greenBdr}`,
        backdropFilter: 'blur(8px)', padding: '0 20px', height: 52,
        display: 'flex', alignItems: 'center', gap: 12,
        position: 'sticky', top: 0, zIndex: 10,
      }}>
        <button onClick={onBack} style={{ background: 'none', border: 'none', color: C.green, fontSize: 22, cursor: 'pointer', minWidth: 36, minHeight: 44 }}>←</button>
        <div>
          <div style={{ color: C.green, fontSize: F.md, fontWeight: F.weightBold }}>🪵 Dastojumu reģistrs</div>
          <div style={{ color: C.textDim, fontSize: F.xs }}>Profesionāla pavadzīmju uzskaite mežizstrādātājiem</div>
        </div>
      </div>

      <div style={{ maxWidth: 720, margin: '0 auto', padding: `${S.xl} 20px 60px` }}>

        {/* Hero */}
        <div style={{
          background: `linear-gradient(135deg, ${C.bgInner}, ${C.bgCard})`,
          border: `1px solid ${C.greenBdr}`, borderRadius: R.xl,
          padding: S.xxl, marginBottom: S.xl, textAlign: 'center',
        }}>
          <div style={{ fontSize: 48, marginBottom: S.md }}>🪵</div>
          <h1 style={{ color: C.text, fontSize: F.h2, fontWeight: F.weightBlack, margin: `0 0 ${S.md}`, letterSpacing: '-0.02em' }}>
            Dastojumu reģistrs
          </h1>
          <p style={{ color: C.textMut, fontSize: F.md, lineHeight: 1.7, margin: `0 0 ${S.xl}`, maxWidth: 500, marginLeft: 'auto', marginRight: 'auto' }}>
            Automatizēta pavadzīmju reģistrācija mežizstrādes uzņēmumiem.
            Foto → AI nolasīšana → Supabase datubāze → mēneša pārskati.
          </p>
          <div style={{ display: 'flex', gap: S.sm, justifyContent: 'center', flexWrap: 'wrap' }}>
            {['AI OCR foto nolasīšana', 'Drošā Supabase krātuve', 'Excel eksports', 'Rēķinu ģenerēšana'].map(t => (
              <span key={t} style={{
                background: `${C.green}15`, color: C.textSec,
                border: `1px solid ${C.green}33`, borderRadius: R.full,
                padding: '4px 12px', fontSize: F.xs, fontWeight: F.weightMed,
              }}>✓ {t}</span>
            ))}
          </div>
        </div>

        {/* Kas tas ir */}
        <section style={{ marginBottom: S.xl }}>
          <h2 style={{ color: C.textSec, fontSize: F.h3, fontWeight: F.weightBold, margin: `0 0 ${S.md}` }}>Kas ir Dastojumu reģistrs?</h2>
          <p style={{ color: C.textMut, fontSize: F.base, lineHeight: 1.7, margin: `0 0 ${S.md}` }}>
            Sistēma ir izveidota mežizstrādes uzņēmumiem, kuriem nepieciešama precīza un automātiska
            pavadzīmju uzskaite. Katra piegāde tiek reģistrēta ar foto — AI nolasa piegādātāju, datumu,
            kubatūru, sortimentu un saglabā datubāzē.
          </p>
          <p style={{ color: C.textMut, fontSize: F.base, lineHeight: 1.7, margin: 0 }}>
            <strong style={{ color: C.textSec }}>Uzņēmuma vadītājs</strong> redz visu — visus šoferus,
            visas piegādes, var ģenerēt rēķinus un eksportēt datus. <strong style={{ color: C.textSec }}>Katrs klients</strong> redz
            tikai savus datus savā personalizētā skatā.
          </p>
        </section>

        {/* Kā darbojas */}
        <section style={{ marginBottom: S.xl }}>
          <h2 style={{ color: C.textSec, fontSize: F.h3, fontWeight: F.weightBold, margin: `0 0 ${S.md}` }}>Kā darbojas?</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: S.sm }}>
            {[
              { n: '1', ikona: '📞', title: 'Sazinies ar mums', desc: 'Apspriežam jūsu vajadzības — šoferus, piegādes vietas, sortimentus, klientu sarakstu.' },
              { n: '2', ikona: '⚙️', title: 'Personalizācija',  desc: 'Iestatām sistēmu tieši jūsu uzņēmumam — šoferu saraksts, piegādes vietas, klientu kategorijas.' },
              { n: '3', ikona: '📱', title: 'Šoferis skenē',    desc: 'Šoferis mobilā tālrunī fotografē pavadzīmi. AI automātiski nolasa visus datus un saglabā.' },
              { n: '4', ikona: '📊', title: 'Vadītājs pārvalda', desc: 'Mēneša pārskati, Excel eksports, rēķinu ģenerēšana — viss vienā vietā, reāllaikā.' },
            ].map(s => (
              <div key={s.n} className="dr-step" style={{
                background: C.bgCard, border: `1px solid ${C.greenBdr}`,
                borderRadius: R.lg, padding: S.lg,
                display: 'flex', gap: S.md, alignItems: 'flex-start',
                transition: 'border-color 0.15s',
              }}>
                <div style={{
                  width: 36, height: 36, background: C.greenDk,
                  borderRadius: '50%', display: 'flex', alignItems: 'center',
                  justifyContent: 'center', fontSize: F.sm, fontWeight: F.weightBold,
                  color: C.green, flexShrink: 0, border: `1px solid ${C.green}44`,
                }}>{s.n}</div>
                <div>
                  <div style={{ fontSize: F.base, fontWeight: F.weightBold, color: C.text, marginBottom: 4 }}>
                    {s.ikona} {s.title}
                  </div>
                  <div style={{ fontSize: F.sm, color: C.textMut, lineHeight: 1.6 }}>{s.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Ko saņem */}
        <section style={{ marginBottom: S.xl }}>
          <h2 style={{ color: C.textSec, fontSize: F.h3, fontWeight: F.weightBold, margin: `0 0 ${S.md}` }}>Ko saņem?</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: S.sm }}>
            {[
              { ikona: '🤖', title: 'AI OCR', desc: 'Automātiska pavadzīmju nolasīšana no foto — piegādātājs, datums, m³, sortiments' },
              { ikona: '🔒', title: 'Drošā krātuve', desc: 'Dati glabājas Supabase — droši, pieejami 24/7, nezūd' },
              { ikona: '📈', title: 'Mēneša pārskati', desc: 'Apkopojums pa šoferiem, sortimentiem, piegādes vietām' },
              { ikona: '📄', title: 'Excel eksports', desc: 'Visa perioda dati vienā failā grāmatvedībai' },
              { ikona: '🧾', title: 'Rēķini', desc: 'Automātiska rēķinu sagatavošana no pavadzīmju datiem' },
              { ikona: '👤', title: 'Klientu skati', desc: 'Katram klientam savs personalizēts reģistrs' },
            ].map(item => (
              <div key={item.title} style={{
                background: C.bgInner, border: `1px solid ${C.greenBdr}`,
                borderRadius: R.md, padding: S.md,
              }}>
                <div style={{ fontSize: 24, marginBottom: S.sm }}>{item.ikona}</div>
                <div style={{ fontSize: F.base, fontWeight: F.weightBold, color: C.textSec, marginBottom: 4 }}>{item.title}</div>
                <div style={{ fontSize: F.xs, color: C.textDim, lineHeight: 1.5 }}>{item.desc}</div>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <div style={{
          background: `linear-gradient(135deg, ${C.greenDk}, #1a3a1a)`,
          border: `1px solid ${C.green}44`, borderRadius: R.xl,
          padding: S.xxl, textAlign: 'center',
        }}>
          <div style={{ fontSize: 32, marginBottom: S.sm }}>📞</div>
          <h3 style={{ color: C.text, fontSize: F.h3, fontWeight: F.weightBold, margin: `0 0 ${S.sm}` }}>
            Interesē sistēma?
          </h3>
          <p style={{ color: C.textMut, fontSize: F.base, margin: `0 0 ${S.lg}`, lineHeight: 1.6 }}>
            Sazinies ar mums — apspriežam jūsu vajadzības, iestatām sistēmu un apmācam lietošanu.
            Katra sistēma tiek personalizēta tieši jūsu uzņēmumam.
          </p>
          <div style={{ display: 'flex', gap: S.sm, justifyContent: 'center', flexWrap: 'wrap' }}>
            <a href="mailto:mezatirgus.info@gmail.com" style={{
              ...btn.primary, textDecoration: 'none',
              background: C.green, color: C.bg,
            }}>
              ✉️ Raksti mums
            </a>
            {!onReg || <button onClick={onReg} style={{ ...btn.secondary }}>
              Reģistrēties platformā
            </button>}
          </div>
          <div style={{ color: C.textDim, fontSize: F.xs, marginTop: S.md }}>
            Sistēma pieejama ar individuālu pieejas atslēgu pēc vienošanās
          </div>
        </div>

      </div>
    </div>
  )
}

// ─── Galvenā gateway komponente ───────────────────────────────────────────────
export default function DastojumuRegistrsPage({ onBack, user, onReg }) {
  const [cilne, setCilne] = useState('registrs')

  const isAdmin  = user?.epasts === ADMIN_EMAIL
  const isClient = !!user  // Pagaidām visi ielogojušies lietotāji var redzēt reģistru
  // TODO: pēc klienta_iestatijumi tabulas — filtrēt pēc atļautajiem user_id

  // Nav ielogojies vai nav pieejas → publiskā info lapa
  if (!isClient) {
    return <PubliskaInfoLapa onBack={onBack} onReg={onReg} />
  }

  // Admin → rāda cilnes: Reģistrs + RP Andras
  if (isAdmin) {
    return (
      <div style={{ minHeight: '100vh', background: C.bg, color: C.text, fontFamily: F.family }}>
        <style>{spinnerCSS}</style>

        {/* Header ar cilnēm */}
        <div style={{
          background: C.glass, borderBottom: `1px solid ${C.greenBdr}`,
          backdropFilter: 'blur(8px)', position: 'sticky', top: 0, zIndex: 10,
        }}>
          <div style={{ padding: '0 20px', height: 52, display: 'flex', alignItems: 'center', gap: 12 }}>
            <button onClick={onBack} style={{ background: 'none', border: 'none', color: C.green, fontSize: 22, cursor: 'pointer', minWidth: 36, minHeight: 44 }}>←</button>
            <span style={{ color: C.green, fontSize: F.md, fontWeight: F.weightBold }}>🪵 Dastojumu reģistrs</span>
            <span style={{
              background: `${C.green}22`, color: C.green, fontSize: '9px',
              padding: '2px 7px', borderRadius: R.full, fontWeight: F.weightBold,
              border: `1px solid ${C.green}44`,
            }}>ADMIN</span>
          </div>
          {/* Cilnes */}
          <div style={{ display: 'flex', gap: 0, padding: '0 20px', borderTop: `1px solid ${C.greenBdr}22` }}>
            {[
              { id: 'registrs', label: '📋 Skenēšana & Reģistrs' },
              { id: 'rpandras', label: '📊 RP Andras — Vadība' },
            ].map(c => (
              <button key={c.id} onClick={() => setCilne(c.id)} style={{
                background: 'transparent', border: 'none',
                borderBottom: cilne === c.id ? `2px solid ${C.green}` : '2px solid transparent',
                color: cilne === c.id ? C.green : C.textDim,
                padding: '10px 16px', fontSize: F.sm, fontWeight: cilne === c.id ? F.weightBold : F.weightNormal,
                cursor: 'pointer', fontFamily: F.family, transition: 'all 0.15s',
                whiteSpace: 'nowrap',
              }}>{c.label}</button>
            ))}
          </div>
        </div>

        {/* Saturs */}
        <div>
          {cilne === 'registrs' && <PavadzimesRegistrs onBack={null} user={user} noHeader />}
          {cilne === 'rpandras' && <RpAndrasPortals onBack={null} noHeader />}
        </div>
      </div>
    )
  }

  // Parasts klients → tikai savs reģistrs
  return <PavadzimesRegistrs onBack={onBack} user={user} />
}
