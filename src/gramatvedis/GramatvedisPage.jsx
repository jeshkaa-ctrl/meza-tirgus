// SQL — Supabase (izpildīt vienu reizi):
// create table gramatvedis_darijumi (
//   id uuid primary key default gen_random_uuid(),
//   datums date not null,
//   veids text not null check (veids in ('ienemums','izdevums')),
//   summa_eur numeric(10,2) not null,
//   pvn_eur numeric(10,2) default 0,
//   summa_bez_pvn numeric(10,2) default 0,
//   kategorija text not null,
//   apraksts text,
//   dokuments_url text,
//   avots text default 'manuali',
//   rekina_nr text,
//   izveidots timestamptz default now()
// );
// alter table gramatvedis_darijumi enable row level security;
// create policy "admin_all" on gramatvedis_darijumi for all using (true) with check (true);

import { useState, useEffect, useMemo } from 'react'
import { supabase } from '../supabaseClient'
import { C as DS, F } from '../ds'

// ── Kategorijas ────────────────────────────────────────────────────────────────

const KAT_I = {
  abonements_menesis:  'Abonements — mēneša',
  abonements_gads:     'Abonements — gada',
  dropshipping_prece:  'Dropshipping prece',
  map_pakalpojums:     'MAP pakalpojums',
  komisija:            'Komisija',
  cits:                'Cits ieņēmums',
}
const KAT_IZD = {
  vercel:               'Vercel',
  supabase:             'Supabase',
  openai:               'OpenAI',
  heygenai:             'HeyGen AI',
  resend:               'Resend',
  cjdropshipping_prece: 'CJ prece',
  marketings:           'Mārketings',
  gramatvedis:          'Grāmatvedis',
  banka:                'Banka',
  cits:                 'Cits izdevums',
}
const AVOTI = {
  montonio:       'Montonio',
  manuali:        'Manuāli',
  cjdropshipping: 'CJDropshipping',
}

// ── Palīgi ─────────────────────────────────────────────────────────────────────

const eur   = v => `€ ${(+v || 0).toFixed(2)}`
const MEN   = ['Janvāris','Februāris','Marts','Aprīlis','Maijs','Jūnijs',
               'Jūlijs','Augusts','Septembris','Oktobris','Novembris','Decembris']
const MEN_S = ['janv.','febr.','marts','apr.','maijs','jūn.',
               'jūl.','aug.','sept.','okt.','nov.','dec.']
const today     = () => new Date().toISOString().slice(0, 10)
const thisMon   = () => new Date().toISOString().slice(0, 7)
const katNos    = (veids, kat) => (veids === 'ienemums' ? KAT_I : KAT_IZD)[kat] || kat

// Termini — dinamiski pēc šodienas datuma
function aprēķināt_terminus() {
  const now   = new Date()
  const month = now.getMonth() + 1  // 1-12
  const day   = now.getDate()
  const year  = now.getFullYear()
  const list  = []

  // PVN deklarācija — katru mēnesi līdz 20.
  const pvnDL = 20 - day
  if (pvnDL >= 0) {
    list.push({
      color:   pvnDL <= 3 ? '#ef5350' : pvnDL <= 7 ? '#ffa726' : '#66bb6a',
      dot:     pvnDL <= 3 ? '🔴' : pvnDL <= 7 ? '🟡' : '🟢',
      teksts:  `PVN deklarācija — līdz 20. ${MEN_S[month - 1]} (pēc ${pvnDL} dienām)`,
    })
  } else {
    list.push({ color: '#66bb6a', dot: '🟢', teksts: `PVN deklarācija — iesniegta ${MEN_S[month - 1]}` })
  }

  // Gada pārskats — 30. aprīlis
  if (month < 4 || (month === 4 && day <= 30)) {
    const target = new Date(year, 3, 30)
    const diff   = Math.ceil((target - now) / 86400000)
    list.push({
      color:  diff <= 14 ? '#ef5350' : diff <= 30 ? '#ffa726' : '#66bb6a',
      dot:    diff <= 14 ? '🔴' : diff <= 30 ? '🟡' : '🟢',
      teksts: `Gada pārskats — līdz 30. aprīlim (pēc ${diff} dienām)`,
    })
  }

  // UIN avansa maksājums — 15. janvāris, aprīlis, jūlijs, oktobris
  const uinMen = [1, 4, 7, 10]
  const nākošsUin = uinMen.find(m => m > month || (m === month && day <= 15))
  if (nākošsUin) {
    const target = new Date(year, nākošsUin - 1, 15)
    const diff   = Math.ceil((target - now) / 86400000)
    list.push({
      color:  diff <= 7 ? '#ffa726' : '#557a55',
      dot:    diff <= 7 ? '🟡' : '⬜',
      teksts: `UIN avansa maksājums — 15. ${MEN_S[nākošsUin - 1]}`,
    })
  }

  if (list.length === 0 || list.every(t => t.dot === '🟢')) {
    list.push({ color: '#66bb6a', dot: '🟢', teksts: 'Visi termiņi kārtībā' })
  }

  return list
}

// ── Kartiņa ───────────────────────────────────────────────────────────────────

function StatKartiņa({ virsraksts, summa, krasa, ikona, apaksa }) {
  return (
    <div style={{
      flex: 1, minWidth: 160,
      background: DS.bgCard,
      border: `1px solid ${krasa}44`,
      borderRadius: 12,
      padding: '14px 18px',
    }}>
      <div style={{ fontSize: 11, color: DS.textDim, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>
        {ikona} {virsraksts}
      </div>
      <div style={{ fontSize: 26, fontWeight: 800, color: krasa, letterSpacing: -0.5 }}>
        {eur(summa)}
      </div>
      {apaksa && (
        <div style={{ fontSize: 11, color: DS.textDim, marginTop: 4 }}>{apaksa}</div>
      )}
    </div>
  )
}

// ── PievienotModal ─────────────────────────────────────────────────────────────

function PievienotModal({ onSaglabat, onAizvērt, saglLade }) {
  const [f, setF] = useState({
    veids:    'ienemums',
    datums:   today(),
    summa:    '',
    pvnIr:    true,
    kategorija: '',
    apraksts: '',
    avots:    'manuali',
    rekina_nr: '',
  })
  const [fails, setFails] = useState(null)

  const set = (k, v) => setF(p => ({ ...p, [k]: v }))

  const summaNum    = parseFloat(f.summa) || 0
  const pvnEur      = f.pvnIr ? +(summaNum / 1.21 * 0.21).toFixed(2) : 0
  const summaBezPvn = f.pvnIr ? +(summaNum / 1.21).toFixed(2) : summaNum

  const katOptions = f.veids === 'ienemums' ? KAT_I : KAT_IZD

  const inp = {
    padding: '9px 12px', borderRadius: 7,
    background: DS.bgDeep, border: `1px solid ${DS.greenBdr}`,
    color: DS.text, fontSize: 13, outline: 'none',
    width: '100%', boxSizing: 'border-box', fontFamily: F.family,
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 500,
      background: 'rgba(0,0,0,0.72)', display: 'flex',
      alignItems: 'center', justifyContent: 'center', padding: 16,
    }}
      onClick={e => e.target === e.currentTarget && onAizvērt()}
    >
      <div style={{
        background: DS.bgCard, border: `1px solid ${DS.greenBdr}`,
        borderRadius: 14, padding: 24, width: '100%', maxWidth: 440,
        maxHeight: '90vh', overflowY: 'auto', fontFamily: F.family,
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: DS.text }}>+ Jauns darījums</div>
          <button onClick={onAizvērt} style={{ background: 'none', border: 'none', color: DS.textDim, fontSize: 20, cursor: 'pointer' }}>✕</button>
        </div>

        {/* Veids toggle */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          {['ienemums', 'izdevums'].map(v => (
            <button key={v} onClick={() => { set('veids', v); set('kategorija', '') }} style={{
              flex: 1, padding: '9px 0', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer',
              background: f.veids === v ? (v === 'ienemums' ? '#1b3a1b' : '#3a1010') : DS.bgDeep,
              border: `1px solid ${f.veids === v ? (v === 'ienemums' ? DS.green : DS.error) : DS.greenBdr}`,
              color: f.veids === v ? (v === 'ienemums' ? DS.green : DS.error) : DS.textDim,
            }}>
              {v === 'ienemums' ? '↑ Ieņēmums' : '↓ Izdevums'}
            </button>
          ))}
        </div>

        {/* Datums + Rēķina nr. */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
          <div>
            <label style={{ fontSize: 11, color: DS.textDim, display: 'block', marginBottom: 4 }}>DATUMS</label>
            <input type="date" value={f.datums} onChange={e => set('datums', e.target.value)} style={inp} />
          </div>
          <div>
            <label style={{ fontSize: 11, color: DS.textDim, display: 'block', marginBottom: 4 }}>RĒĶINA NR.</label>
            <input value={f.rekina_nr} onChange={e => set('rekina_nr', e.target.value)} placeholder="piem. RK-2026-001" style={inp} />
          </div>
        </div>

        {/* Summa + PVN */}
        <div style={{ marginBottom: 12 }}>
          <label style={{ fontSize: 11, color: DS.textDim, display: 'block', marginBottom: 4 }}>SUMMA AR PVN (€)</label>
          <input
            type="number" step="0.01" min="0"
            value={f.summa} onChange={e => set('summa', e.target.value)}
            placeholder="0.00" style={{ ...inp, fontSize: 18, fontWeight: 700 }}
          />
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
            <input type="checkbox" id="pvnIr" checked={f.pvnIr} onChange={e => set('pvnIr', e.target.checked)}
              style={{ width: 16, height: 16, cursor: 'pointer', accentColor: DS.green }} />
            <label htmlFor="pvnIr" style={{ fontSize: 12, color: DS.textMut, cursor: 'pointer' }}>Darījumam ir PVN 21%</label>
          </div>
          {summaNum > 0 && (
            <div style={{ marginTop: 8, padding: '7px 10px', background: DS.bgDeep, borderRadius: 6, fontSize: 11, color: DS.textDim }}>
              Bez PVN: <b style={{ color: DS.textSec }}>{eur(summaBezPvn)}</b>
              {f.pvnIr && <> · PVN: <b style={{ color: DS.textSec }}>{eur(pvnEur)}</b></>}
            </div>
          )}
        </div>

        {/* Kategorija */}
        <div style={{ marginBottom: 12 }}>
          <label style={{ fontSize: 11, color: DS.textDim, display: 'block', marginBottom: 4 }}>KATEGORIJA</label>
          <select value={f.kategorija} onChange={e => set('kategorija', e.target.value)} style={{ ...inp, cursor: 'pointer' }}>
            <option value="">— izvēlēties —</option>
            {Object.entries(katOptions).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </div>

        {/* Apraksts */}
        <div style={{ marginBottom: 12 }}>
          <label style={{ fontSize: 11, color: DS.textDim, display: 'block', marginBottom: 4 }}>APRAKSTS</label>
          <textarea
            value={f.apraksts} onChange={e => set('apraksts', e.target.value)}
            rows={2} placeholder="Brīvs teksts..."
            style={{ ...inp, resize: 'vertical', minHeight: 56 }}
          />
        </div>

        {/* Avots + Dokuments */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
          <div>
            <label style={{ fontSize: 11, color: DS.textDim, display: 'block', marginBottom: 4 }}>AVOTS</label>
            <select value={f.avots} onChange={e => set('avots', e.target.value)} style={{ ...inp, cursor: 'pointer' }}>
              {Object.entries(AVOTI).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize: 11, color: DS.textDim, display: 'block', marginBottom: 4 }}>DOKUMENTS (rēķins/čeks)</label>
            <label style={{
              ...inp, display: 'flex', alignItems: 'center', gap: 6,
              cursor: 'pointer', color: DS.textMut, padding: '8px 10px',
            }}>
              <input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={e => setFails(e.target.files?.[0])} style={{ display: 'none' }} />
              📎 {fails ? fails.name.slice(0, 16) + (fails.name.length > 16 ? '…' : '') : 'Izvēlēties'}
            </label>
          </div>
        </div>

        <button
          onClick={() => onSaglabat(f, { pvnEur, summaBezPvn, fails })}
          disabled={saglLade || !f.summa || !f.kategorija || !f.datums}
          style={{
            width: '100%', padding: '12px', borderRadius: 9,
            background: saglLade || !f.summa || !f.kategorija
              ? DS.greenBdr
              : f.veids === 'ienemums'
                ? `linear-gradient(135deg,${DS.green},${DS.greenDk})`
                : 'linear-gradient(135deg,#c62828,#7f1010)',
            color: '#fff', border: 'none', fontSize: 14, fontWeight: 700,
            cursor: saglLade || !f.summa || !f.kategorija ? 'not-allowed' : 'pointer',
          }}
        >
          {saglLade ? '⏳ Saglabā...' : f.veids === 'ienemums' ? '↑ Ierakstīt ieņēmumu' : '↓ Ierakstīt izdevumu'}
        </button>
      </div>
    </div>
  )
}

// ── Galvenais komponents ───────────────────────────────────────────────────────

export default function GramatvedisPage({ onBack }) {
  const [darijumi,  setDarijumi]  = useState([])
  const [lade,      setLade]      = useState(true)
  const [kluda,     setKluda]     = useState('')
  const [modal,     setModal]     = useState(false)
  const [saglLade,  setSaglLade]  = useState(false)
  const [filtrs,    setFiltrs]    = useState({
    menesis:    thisMon(),
    kategorija: '',
    veids:      '',
  })

  const termini = useMemo(aprēķināt_terminus, [])

  // Ielādēt darījumus
  const ielādet = async () => {
    setLade(true)
    setKluda('')
    try {
      const pirms13 = new Date()
      pirms13.setMonth(pirms13.getMonth() - 12)
      const { data, error } = await supabase
        .from('gramatvedis_darijumi')
        .select('*')
        .gte('datums', pirms13.toISOString().slice(0, 10))
        .order('datums', { ascending: false })
        .order('izveidots', { ascending: false })
      if (error) throw error
      setDarijumi(data || [])
    } catch (e) {
      setKluda(e.message)
    } finally {
      setLade(false)
    }
  }

  useEffect(() => { ielādet() }, [])

  // Saglabāt darījumu
  const saglabat = async (f, { pvnEur, summaBezPvn, fails }) => {
    setSaglLade(true)
    try {
      let dokUrl = null
      if (fails) {
        const ext  = fails.name.split('.').pop()
        const path = `${Date.now()}.${ext}`
        const { data: up, error: upErr } = await supabase.storage
          .from('gramatvedis')
          .upload(path, fails, { contentType: fails.type })
        if (upErr) throw upErr
        dokUrl = supabase.storage.from('gramatvedis').getPublicUrl(up.path).data.publicUrl
      }

      const { error } = await supabase.from('gramatvedis_darijumi').insert({
        datums:        f.datums,
        veids:         f.veids,
        summa_eur:     parseFloat(f.summa),
        pvn_eur:       pvnEur,
        summa_bez_pvn: summaBezPvn,
        kategorija:    f.kategorija,
        apraksts:      f.apraksts,
        avots:         f.avots,
        rekina_nr:     f.rekina_nr || null,
        dokuments_url: dokUrl,
      })
      if (error) throw error
      setModal(false)
      await ielādet()
    } catch (e) {
      alert('Kļūda: ' + e.message)
    } finally {
      setSaglLade(false)
    }
  }

  // Dzēst darījumu
  const dzest = async (id) => {
    if (!confirm('Dzēst darījumu?')) return
    await supabase.from('gramatvedis_darijumi').delete().eq('id', id)
    setDarijumi(p => p.filter(d => d.id !== id))
  }

  // Statistika
  const curMon = thisMon()
  const prevMon = (() => {
    const d = new Date(); d.setMonth(d.getMonth() - 1); return d.toISOString().slice(0, 7)
  })()

  const curMonD  = darijumi.filter(d => d.datums.startsWith(curMon))
  const prevMonD = darijumi.filter(d => d.datums.startsWith(prevMon))
  const gadaD    = darijumi

  const sumI   = arr => arr.filter(d => d.veids === 'ienemums').reduce((s, d) => s + +d.summa_eur, 0)
  const sumIzd = arr => arr.filter(d => d.veids === 'izdevums').reduce((s, d) => s + +d.summa_eur, 0)

  const menI    = sumI(curMonD),    menIzd   = sumIzd(curMonD),   menPelna  = menI - menIzd
  const prevI   = sumI(prevMonD),   prevIzd  = sumIzd(prevMonD),  prevPelna = prevI - prevIzd
  const gadaI   = sumI(gadaD),      gadaIzd  = sumIzd(gadaD),     gadaPelna = gadaI - gadaIzd

  const delta = (cur, prev) => {
    if (!prev) return null
    const d = cur - prev
    return `${d >= 0 ? '+' : ''}${eur(d)} vs. iepr. mēn.`
  }

  // Filtrētie darījumi
  const filtreti = darijumi.filter(d => {
    if (filtrs.menesis    && !d.datums.startsWith(filtrs.menesis))    return false
    if (filtrs.kategorija && d.kategorija !== filtrs.kategorija)       return false
    if (filtrs.veids      && d.veids !== filtrs.veids)                 return false
    return true
  })

  // Mēnešu opcijas filtrā
  const menesisOpcijas = [...new Set(darijumi.map(d => d.datums.slice(0, 7)))].sort().reverse()

  // ── Stili ─────────────────────────────────────────────────────────────────────
  const sel = {
    padding: '7px 10px', borderRadius: 7, fontSize: 12,
    background: DS.bgDeep, border: `1px solid ${DS.greenBdr}`,
    color: DS.text, outline: 'none', fontFamily: F.family, cursor: 'pointer',
  }

  return (
    <div style={{ minHeight: '100vh', background: DS.bg, color: DS.text, fontFamily: F.family }}>

      {/* Header */}
      <div style={{
        background: DS.glass, borderBottom: `1px solid ${DS.greenBdr}`,
        backdropFilter: 'blur(8px)', padding: '0 16px', height: 52,
        display: 'flex', alignItems: 'center', gap: 10,
        position: 'sticky', top: 0, zIndex: 50,
      }}>
        {onBack && (
          <button onClick={onBack} style={{ background: 'none', border: 'none', color: DS.green, fontSize: 22, cursor: 'pointer', minWidth: 36, minHeight: 44 }}>←</button>
        )}
        <div style={{ color: DS.green, fontSize: F.md, fontWeight: 700 }}>📊 Grāmatvedis</div>
        <div style={{ flex: 1 }} />
        <div style={{ fontSize: 11, color: DS.textDim }}>
          {new Date().toLocaleDateString('lv-LV', { year: 'numeric', month: 'long' })}
        </div>
      </div>

      <div style={{ maxWidth: 960, margin: '0 auto', padding: '20px 16px 80px' }}>

        {/* Kļūda */}
        {kluda && (
          <div style={{ padding: '10px 14px', borderRadius: 8, background: DS.errorBg, border: `1px solid ${DS.errorBdr}`, color: DS.error, fontSize: 12, marginBottom: 16 }}>
            ⚠️ {kluda} — <button onClick={ielādet} style={{ background: 'none', border: 'none', color: DS.error, cursor: 'pointer', textDecoration: 'underline', fontSize: 12 }}>mēģināt vēlreiz</button>
          </div>
        )}

        {/* ── Kopsavilkums ─────────────────────────────────────────────────────── */}
        <div style={{ marginBottom: 6 }}>
          <div style={{ fontSize: 11, color: DS.textDim, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 }}>
            {MEN[new Date().getMonth()]} {new Date().getFullYear()} — kopsavilkums
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <StatKartiņa virsraksts="Ieņēmumi" summa={menI}   krasa={DS.green} ikona="↑"
              apaksa={delta(menI, prevI)} />
            <StatKartiņa virsraksts="Izdevumi"  summa={menIzd} krasa={DS.error} ikona="↓"
              apaksa={delta(menIzd, prevIzd)} />
            <StatKartiņa virsraksts="Peļņa"     summa={menPelna} ikona="="
              krasa={menPelna >= 0 ? DS.info : DS.error}
              apaksa={delta(menPelna, prevPelna)} />
          </div>
        </div>

        {/* Gada stats */}
        <div style={{
          background: DS.bgCard, border: `1px solid ${DS.greenBdr}`,
          borderRadius: 10, padding: '10px 16px', marginBottom: 16,
          display: 'flex', gap: 24, flexWrap: 'wrap',
        }}>
          <div style={{ fontSize: 11, color: DS.textDim, alignSelf: 'center', minWidth: 80 }}>Gads (12 mēn.):</div>
          {[
            { nos: 'Ieņēmumi',  val: gadaI,    c: DS.green },
            { nos: 'Izdevumi',  val: gadaIzd,  c: DS.error },
            { nos: 'Peļņa',     val: gadaPelna, c: gadaPelna >= 0 ? DS.info : DS.error },
          ].map(x => (
            <div key={x.nos} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 11, color: DS.textDim }}>{x.nos}</span>
              <span style={{ fontSize: 15, fontWeight: 700, color: x.c }}>{eur(x.val)}</span>
            </div>
          ))}
        </div>

        {/* Termiņi */}
        <div style={{
          background: DS.bgCard, border: `1px solid ${DS.greenBdr}`,
          borderRadius: 10, padding: '10px 14px', marginBottom: 24,
        }}>
          <div style={{ fontSize: 11, color: DS.textDim, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>
            Nākamie termiņi
          </div>
          {termini.map((t, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0', fontSize: 12, color: t.color }}>
              <span>{t.dot}</span>
              <span>{t.teksts}</span>
            </div>
          ))}
        </div>

        {/* ── Darījumi ─────────────────────────────────────────────────────────── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12, flexWrap: 'wrap' }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: DS.text, flex: 1 }}>Darījumi</div>

          {/* Filtri */}
          <select value={filtrs.menesis} onChange={e => setFiltrs(p => ({ ...p, menesis: e.target.value }))} style={sel}>
            <option value="">Visi mēneši</option>
            {menesisOpcijas.map(m => (
              <option key={m} value={m}>{MEN[parseInt(m.slice(5, 7)) - 1]} {m.slice(0, 4)}</option>
            ))}
          </select>

          <select value={filtrs.veids} onChange={e => setFiltrs(p => ({ ...p, veids: e.target.value }))} style={sel}>
            <option value="">Visi veidi</option>
            <option value="ienemums">↑ Ieņēmumi</option>
            <option value="izdevums">↓ Izdevumi</option>
          </select>

          <select value={filtrs.kategorija} onChange={e => setFiltrs(p => ({ ...p, kategorija: e.target.value }))} style={sel}>
            <option value="">Visas kategorijas</option>
            <optgroup label="Ieņēmumi">
              {Object.entries(KAT_I).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </optgroup>
            <optgroup label="Izdevumi">
              {Object.entries(KAT_IZD).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </optgroup>
          </select>

          <button
            onClick={() => setModal(true)}
            style={{
              padding: '8px 16px', borderRadius: 8,
              background: `linear-gradient(135deg,${DS.green},${DS.greenDk})`,
              color: '#fff', border: 'none', fontSize: 13, fontWeight: 700, cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            + Pievienot
          </button>
        </div>

        {/* Tabula */}
        {lade ? (
          <div style={{ padding: '40px 0', textAlign: 'center', color: DS.textDim, fontSize: 13 }}>⏳ Ielādē...</div>
        ) : filtreti.length === 0 ? (
          <div style={{
            padding: '40px 0', textAlign: 'center', color: DS.textDim, fontSize: 13,
            background: DS.bgCard, borderRadius: 10, border: `1px solid ${DS.greenBdr}`,
          }}>
            Nav darījumu šim periodam.<br />
            <button onClick={() => setModal(true)} style={{ marginTop: 12, padding: '8px 16px', borderRadius: 7, background: DS.greenDk, border: `1px solid ${DS.green}`, color: DS.green, fontSize: 12, cursor: 'pointer' }}>
              + Pievienot pirmo darījumu
            </button>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: DS.bgInner }}>
                  {['Datums', 'Apraksts', 'Kategorija', 'Avots', 'PVN', 'Summa', ''].map(h => (
                    <th key={h} style={{ padding: '8px 10px', textAlign: 'left', fontSize: 10, color: DS.textDim, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, whiteSpace: 'nowrap', borderBottom: `1px solid ${DS.greenBdr}` }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtreti.map((d, i) => {
                  const ir_i = d.veids === 'ienemums'
                  return (
                    <tr key={d.id} style={{ background: i % 2 === 0 ? DS.bgCard : DS.bgInner, borderBottom: `1px solid ${DS.greenBdr}22` }}>
                      <td style={{ padding: '9px 10px', color: DS.textDim, whiteSpace: 'nowrap', fontSize: 12 }}>
                        {d.datums}
                      </td>
                      <td style={{ padding: '9px 10px', color: DS.text, maxWidth: 200 }}>
                        <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {d.apraksts || '—'}
                        </div>
                        {d.rekina_nr && <div style={{ fontSize: 10, color: DS.textDim }}>#{d.rekina_nr}</div>}
                      </td>
                      <td style={{ padding: '9px 10px', color: DS.textMut, whiteSpace: 'nowrap', fontSize: 12 }}>
                        {katNos(d.veids, d.kategorija)}
                      </td>
                      <td style={{ padding: '9px 10px', fontSize: 11, color: DS.textDim, whiteSpace: 'nowrap' }}>
                        {AVOTI[d.avots] || d.avots}
                      </td>
                      <td style={{ padding: '9px 10px', fontSize: 12, color: DS.textDim, textAlign: 'right', whiteSpace: 'nowrap' }}>
                        {+d.pvn_eur > 0 ? eur(d.pvn_eur) : '—'}
                      </td>
                      <td style={{ padding: '9px 10px', fontWeight: 700, textAlign: 'right', whiteSpace: 'nowrap' }}>
                        <span style={{ color: ir_i ? DS.green : DS.error }}>
                          {ir_i ? '+' : '−'} {eur(d.summa_eur)}
                        </span>
                      </td>
                      <td style={{ padding: '9px 10px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                        {d.dokuments_url && (
                          <a href={d.dokuments_url} target="_blank" rel="noreferrer"
                            style={{ color: DS.textDim, fontSize: 12, marginRight: 8, textDecoration: 'none' }}
                            title="Dokuments">📎</a>
                        )}
                        <button
                          onClick={() => dzest(d.id)}
                          style={{ background: 'none', border: 'none', color: DS.textFade, cursor: 'pointer', fontSize: 13, padding: '2px 4px' }}
                          title="Dzēst"
                        >🗑</button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
              <tfoot>
                <tr style={{ background: DS.bgInner, borderTop: `1px solid ${DS.greenBdr}` }}>
                  <td colSpan={5} style={{ padding: '8px 10px', fontSize: 11, color: DS.textDim, fontWeight: 600 }}>
                    Kopā {filtreti.length} darījumi
                  </td>
                  <td style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 700 }}>
                    {(() => {
                      const neto = sumI(filtreti) - sumIzd(filtreti)
                      return <span style={{ color: neto >= 0 ? DS.green : DS.error }}>{neto >= 0 ? '+' : ''}{eur(neto)}</span>
                    })()}
                  </td>
                  <td />
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>

      {/* Pievienot modal */}
      {modal && (
        <PievienotModal
          onSaglabat={saglabat}
          onAizvērt={() => setModal(false)}
          saglLade={saglLade}
        />
      )}
    </div>
  )
}
