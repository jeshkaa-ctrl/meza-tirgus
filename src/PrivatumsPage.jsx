import { C, F, R, S } from './ds'

export default function PrivatumsPage({ onBack }) {
  return (
    <div style={{ minHeight: '100vh', background: C.bg, color: C.text, fontFamily: F.family }}>
      <header style={{
        background: C.glass, borderBottom: `1px solid ${C.greenBdr}`,
        backdropFilter: 'blur(8px)', position: 'sticky', top: 0, zIndex: 100,
        height: 52, display: 'flex', alignItems: 'center', padding: '0 20px', gap: 16,
      }}>
        <button onClick={onBack} style={{
          background: 'none', border: 'none', color: C.textMut,
          fontSize: F.sm, cursor: 'pointer', fontFamily: F.family, minHeight: 44,
        }}>← Atpakaļ</button>
        <span style={{ color: C.green, fontWeight: 700, fontSize: F.md }}>Privātuma politika</span>
      </header>

      <main style={{ maxWidth: 720, margin: '0 auto', padding: '32px 20px 80px', lineHeight: 1.8 }}>
        <p style={{ color: C.textDim, fontSize: F.xs, marginBottom: 32 }}>
          Spēkā no: 2025. gada 1. janvāra &nbsp;·&nbsp; Pēdējās izmaiņas: 2026. gada 1. jūnijā
        </p>

        {[
          {
            virsraksts: '1. Pārzinis',
            teksts: 'Meža tirgus platformas pārzinis ir Arturs Skrebelis (mezatirgus.info@gmail.com). Platforma pieejama vietnē meza-tirgus.lv.',
          },
          {
            virsraksts: '2. Kādi dati tiek vākti',
            teksts: 'Reģistrējoties — e-pasta adrese, vārds, uzņēmums, novads, tālrunis (pēc izvēles). Lietojot platformu — augšupielādēti PDF faili (apstrādāti lokāli, netiek glabāti serverī), aktivitātes žurnāls (apmeklētās lapas, sesijas ID bez personas identifikācijas).',
          },
          {
            virsraksts: '3. Kāpēc dati tiek apstrādāti',
            teksts: 'Konta pārvaldībai un autentifikācijai (tiesiskais pamats: līgums). Platformas funkciju nodrošināšanai — AI aprēķini, PDF analīze, sludinājumi (tiesiskais pamats: līgums). Platformas uzlabošanai — anonimizēta statistika (tiesiskais pamats: leģitīmās intereses).',
          },
          {
            virsraksts: '4. Datu glabāšana',
            teksts: 'Profila dati glabājas Supabase datubāzē (EU reģions). PDF faili netiek augšupielādēti serverī — apstrāde notiek tikai jūsu pārlūkprogrammā. AI vaicājumi tiek nosūtīti Anthropic API apstrādei saskaņā ar viņu privātuma politiku.',
          },
          {
            virsraksts: '5. Datu nodošana trešajām pusēm',
            teksts: 'Supabase (datubāze, auth) — datu apstrādātājs ES/EEZ. Anthropic (AI) — tikai AI čata teksts, bez personas datiem. Montonio (maksājumi) — tikai maksājuma dati. Dati netiek pārdoti vai nodoti citiem mērķiem.',
          },
          {
            virsraksts: '6. Jūsu tiesības',
            teksts: 'Jums ir tiesības: piekļūt saviem datiem, labot neprecīzus datus, dzēst savu kontu un datus, ierobežot apstrādi, iesniegt sūdzību Datu valsts inspekcijā (dvi.gov.lv). Pieprasījumus sūtiet uz mezatirgus.info@gmail.com.',
          },
          {
            virsraksts: '7. Sīkdatnes',
            teksts: 'Platforma izmanto tikai tehniski nepieciešamās sīkdatnes autentifikācijas sesijas uzturēšanai (localStorage). Mārketinga vai izsekošanas sīkdatnes netiek izmantotas.',
          },
          {
            virsraksts: '8. Kontakti',
            teksts: 'Jautājumu gadījumā sazinieties: mezatirgus.info@gmail.com',
          },
        ].map((s, i) => (
          <section key={i} style={{ marginBottom: 28 }}>
            <h2 style={{ color: C.green, fontSize: F.md, fontWeight: 700, marginBottom: 8 }}>{s.virsraksts}</h2>
            <p style={{ color: C.textSec, fontSize: F.base, margin: 0 }}>{s.teksts}</p>
          </section>
        ))}
      </main>
    </div>
  )
}
