import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'
import { menessFaze, menessFazeEmoji } from '../utils/menessFaze'

// ── Krāsas ──────────────────────────────────────────────
const C = {
  camoDark:   '#3d4a2e',
  camoMid:    '#5a6b3a',
  camoLight:  '#7a8f52',
  camoText:   '#e8f0d8',
  camoMuted:  '#b8c89a',
  camoSubtle: '#7a8f52',
  camoBg:     '#4a5a32',
  camoBdr:    '#5a6b3a',
  orange:     '#e8720c',
  orangeBg:   '#fff3e8',
  orangeBdr:  '#f5c490',
  orangeTxt:  '#854f0b',
  greenBg:    '#f0f7ea',
  greenBdr:   '#b8c89a',
  surface1:   '#2e3a1f',
  surface2:   '#3a4828',
  border:     '#4a5a32',
}

// ── Sugu dati ────────────────────────────────────────────
const MEDIBAS_SUGAS = [
  { id: 'mežacūka',     emoji: '🐗', label: 'Cūka'    },
  { id: 'staltbriedis', emoji: '🦌', label: 'Briedis' },
  { id: 'stirna',       emoji: '🦌', label: 'Stirna'  },
  { id: 'alnis',        emoji: '🫎', label: 'Alnis'   },
  { id: 'vilks',        emoji: '🐺', label: 'Vilks'   },
  { id: 'lapsa',        emoji: '🦊', label: 'Lapsa'   },
  { id: 'zaķis',        emoji: '🐇', label: 'Zaķis'   },
  { id: 'putns',        emoji: '🦆', label: 'Putns'   },
]

const ZIVU_SUGAS = [
  { id: 'līdaka',    emoji: '🐟', label: 'Līdaka'   },
  { id: 'asaris',    emoji: '🐟', label: 'Asaris'   },
  { id: 'zandarts',  emoji: '🐟', label: 'Zandarts' },
  { id: 'karpis',    emoji: '🐟', label: 'Karpis'   },
  { id: 'līnis',     emoji: '🐟', label: 'Līnis'    },
  { id: 'lasis',     emoji: '🐟', label: 'Lasis'    },
  { id: 'taimiņš',   emoji: '🐟', label: 'Taimiņš'  },
  { id: 'forele',    emoji: '🐟', label: 'Forele'   },
]

// ── Ātrās jautājumu pogas ─────────────────────────────────
const JAUTAJUMI_MEDIBAS = [
  'Cik cūkas šogad?', 'Labākā mēness fāze?',
  'Cikos nomedīju visvairāk?', 'Kāds vējš man der?', 'Smagākais medījums?',
]
const JAUTAJUMI_MAKSKERE = [
  'Cik zivis šogad?', 'Kura zivs visbiežāk?',
  'Cikos ķeras labāk?', 'Pie kādas temp. labāk ķeras?', 'Lielākā nozveja?',
]

const shodiensFaze    = menessFaze(new Date())
const shodiensFazeEm  = menessFazeEmoji(shodiensFaze)

// ── Komponente ───────────────────────────────────────────
export default function DienasgramataPage() {
  const [user,         setUser]         = useState(null)
  const [aktivitate,   setAktivitate]   = useState('medibas')
  const [prognoze,     setPrognoze]     = useState('')
  const [prognozeLade, setPrognozeLade] = useState(true)
  const [ieraksti,     setIeraksti]     = useState([])

  // Forma
  const [teksts,    setTeksts]    = useState('')
  const [suga,      setSuga]      = useState('mežacūka')
  const [vejs,      setVejs]      = useState('')
  const [nokrisni,  setNokrisni]  = useState('')
  const [temp,      setTemp]      = useState('')
  const [nomedits,  setNomedits]  = useState(false)
  const [svars,     setSvars]     = useState('')
  const [dzimums,   setDzimums]   = useState('')
  const [skaits,    setSkaits]    = useState('')
  const [saglaba,   setSaglaba]   = useState(false)

  // GPS
  const [gpsStatus, setGpsStatus] = useState('idle')

  // AI jautājumi
  const [jautajums, setJautajums] = useState('')
  const [atbilde,   setAtbilde]   = useState('')
  const [jautaLade, setJautaLade] = useState(false)

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user)
      if (user) {
        ieladeIerakstus(user.id, 'medibas')
        ieladePrognozi(user.id, 'medibas')
      }
    })
  }, [])

  function mainAktivitati(jauna) {
    setAktivitate(jauna)
    setSuga(jauna === 'medibas' ? 'mežacūka' : 'līdaka')
    setNomedits(false)
    setSvars('')
    setSkaits('')
    setDzimums('')
    setAtbilde('')
    setJautajums('')
    if (user) {
      ieladeIerakstus(user.id, jauna)
      ieladePrognozi(user.id, jauna)
    }
  }

  // ── GPS ──
  function noteiktGps() {
    setGpsStatus('loading')
    navigator.geolocation?.getCurrentPosition(async (pos) => {
      try {
        const { latitude: lat, longitude: lng } = pos.coords
        const r = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}` +
          `&current=temperature_2m,winddirection_10m,weathercode&timezone=Europe/Riga`
        )
        const d = await r.json()
        const c = d.current
        setTemp(Math.round(c.temperature_2m).toString())
        setVejs(virziensNoGradiem(c.winddirection_10m))
        setNokrisni(laiksNoKoda(c.weathercode))
        setGpsStatus('done')
      } catch {
        setGpsStatus('error')
      }
    }, () => setGpsStatus('error'))
  }

  function virziensNoGradiem(g) {
    if (g >= 337.5 || g < 22.5)  return 'ziemeļu'
    if (g < 67.5)  return 'ziemeļaustrumu'
    if (g < 112.5) return 'austrumu'
    if (g < 157.5) return 'dienvidaustrumu'
    if (g < 202.5) return 'dienvidu'
    if (g < 247.5) return 'dienvidrietumu'
    if (g < 292.5) return 'rietumu'
    return 'ziemeļrietumu'
  }

  function laiksNoKoda(k) {
    if (k === 0)  return 'sauss'
    if (k <= 3)   return 'mākoņains'
    if (k <= 49)  return 'migla'
    if (k <= 67)  return 'lietus'
    if (k <= 77)  return 'sniegs'
    return 'lietus'
  }

  // ── Datu ielāde ──
  async function ieladeIerakstus(uid, akt) {
    const { data } = await supabase
      .from('medibu_dienasgramata')
      .select('*')
      .eq('user_id', uid)
      .eq('aktivitate', akt)
      .order('created_at', { ascending: false })
      .limit(40)
    setIeraksti(data || [])
  }

  async function ieladePrognozi(uid, akt) {
    setPrognozeLade(true)
    try {
      const r = await fetch('/api/dienasgramata-prognoze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: uid, menessFaze: shodiensFaze, aktivitate: akt }),
      })
      const d = await r.json()
      setPrognoze(d.prognoze || '')
    } catch {
      setPrognoze('Neizdevās ielādēt prognozi.')
    }
    setPrognozeLade(false)
  }

  // ── Saglabāšana ──
  async function saglabtIerakstu() {
    if (!teksts.trim() || !user) return
    setSaglaba(true)
    await supabase.from('medibu_dienasgramata').insert({
      user_id:        user.id,
      teksts:         teksts.trim(),
      meness_faze:    shodiensFaze,
      aktivitate,
      suga:           suga || null,
      nomedits,
      svars:          svars ? parseFloat(svars) : null,
      dzimums:        aktivitate === 'medibas' ? (dzimums || null) : null,
      nozveja_skaits: aktivitate === 'makskere' && skaits ? parseInt(skaits) : null,
      vejs:           vejs || null,
      temperatura:    temp ? parseFloat(temp) : null,
      nokrisni:       nokrisni || null,
    })
    setTeksts('')
    setNomedits(false)
    setSvars('')
    setSkaits('')
    setDzimums('')
    setSaglaba(false)
    ieladeIerakstus(user.id, aktivitate)
  }

  // ── AI jautājums ──
  async function uzdotJautajumu() {
    if (!jautajums.trim() || !user) return
    setJautaLade(true)
    setAtbilde('')
    try {
      const r = await fetch('/api/dienasgramata-jautajums', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, jautajums, aktivitate }),
      })
      const d = await r.json()
      setAtbilde(d.atbilde || '')
    } catch {
      setAtbilde('Neizdevās saņemt atbildi.')
    }
    setJautaLade(false)
  }

  const isMakskere = aktivitate === 'makskere'
  const sugasSaraksts = isMakskere ? ZIVU_SUGAS : MEDIBAS_SUGAS

  const gpsLabel = {
    idle:    'Noteikt laikapstākļus automātiski',
    loading: 'Nosaka atrašanās vietu...',
    done:    `${temp}°C · ${vejs} · ${nokrisni}`,
    error:   'GPS nav pieejams — aizpildi manuāli',
  }[gpsStatus]

  // ═══════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════
  return (
    <div style={{ maxWidth: 440, margin: '0 auto', padding: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>

      {/* AKTIVITĀTES TOGGLE */}
      <div style={{ display: 'flex', gap: 6 }}>
        {[{ id: 'medibas', nos: '🎯 Medības' }, { id: 'makskere', nos: '🎣 Makšķerēšana' }].map(a => (
          <button key={a.id} onClick={() => mainAktivitati(a.id)} style={{
            flex: 1, padding: '10px 8px', border: 'none', borderRadius: 8, cursor: 'pointer',
            fontSize: 13, fontWeight: 600,
            background: aktivitate === a.id ? C.orange : C.camoDark,
            color: aktivitate === a.id ? '#fff' : C.camoMuted,
          }}>{a.nos}</button>
        ))}
      </div>

      {/* HEADER */}
      <div style={{ background: C.camoDark, borderRadius: 12, padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 34, height: 34, background: C.orange, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>
            {isMakskere ? '🎣' : '🏹'}
          </div>
          <div>
            <div style={{ color: C.camoText, fontSize: 14, fontWeight: 500 }}>
              {isMakskere ? 'Makšķernieka dienasgrāmata' : 'Mednieka dienasgrāmata'}
            </div>
            <div style={{ color: C.camoMuted, fontSize: 11 }}>
              {new Date().toLocaleDateString('lv-LV', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' })}
            </div>
          </div>
        </div>
      </div>

      {/* AI PROGNOZE */}
      <div style={{ background: C.camoBg, border: `0.5px solid ${C.camoBdr}`, borderRadius: 12, padding: '14px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <span style={{ fontSize: 18 }}>{shodiensFazeEm}</span>
          <span style={{ color: C.orange, fontSize: 12, fontWeight: 500 }}>{shodiensFaze}</span>
        </div>
        <p style={{ color: C.camoText, fontSize: 13, lineHeight: 1.6, margin: 0 }}>
          {prognozeLade ? '⏳ Analizē...' : (prognoze || '—')}
        </p>
      </div>

      {/* JAUNS IERAKSTS */}
      <div style={{ background: C.surface2, border: `0.5px solid ${C.border}`, borderRadius: 12, padding: '14px 16px' }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: C.camoLight, marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          ✏️ Jauns ieraksts
        </div>

        {/* Sugu pogas */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 5, marginBottom: 10 }}>
          {sugasSaraksts.map(s => (
            <button key={s.id} onClick={() => setSuga(s.id)} style={{
              padding: '7px 4px', borderRadius: 8, cursor: 'pointer', fontSize: 10,
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
              background: suga === s.id ? C.orangeBg : C.surface1,
              border: `0.5px solid ${suga === s.id ? C.orange : C.border}`,
              color: suga === s.id ? C.orangeTxt : C.camoMuted,
              fontWeight: suga === s.id ? 600 : 400,
            }}>
              <span style={{ fontSize: 15 }}>{s.emoji}</span>
              <span>{s.label}</span>
            </button>
          ))}
        </div>

        {/* GPS poga */}
        <div onClick={gpsStatus !== 'loading' && gpsStatus !== 'done' ? noteiktGps : undefined}
          style={{
            display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px',
            background: gpsStatus === 'done' ? C.greenBg : C.orangeBg,
            border: `0.5px solid ${gpsStatus === 'done' ? C.greenBdr : C.orangeBdr}`,
            borderRadius: 8, marginBottom: 8,
            cursor: gpsStatus === 'loading' || gpsStatus === 'done' ? 'default' : 'pointer',
          }}>
          <span style={{ fontSize: 15 }}>📍</span>
          <span style={{ fontSize: 12, color: gpsStatus === 'done' ? C.camoDark : C.orangeTxt, flex: 1 }}>
            {gpsLabel}
          </span>
          {gpsStatus !== 'done' && (
            <span style={{ fontSize: 10, background: C.orange, color: '#fff', padding: '2px 7px', borderRadius: 10 }}>
              GPS
            </span>
          )}
        </div>

        {/* Teksts */}
        <textarea
          value={teksts}
          onChange={e => setTeksts(e.target.value)}
          placeholder={isMakskere
            ? 'Rīta migla uz ezera, 06:30 ķērās līdaka...'
            : 'Ziemeļu vējš, sniegs, 21:30 iznāca cūkas...'}
          rows={3}
          style={{ ...lauks, resize: 'vertical', marginBottom: 8 }}
        />

        {/* Apstākļi */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6, marginBottom: 8 }}>
          <div>
            <div style={etiketite}>Vējš</div>
            <select value={vejs} onChange={e => setVejs(e.target.value)} style={lauks}>
              <option value="">—</option>
              {['ziemeļu','dienvidu','rietumu','austrumu','bezvejš','ziemeļaustrumu','dienvidrietumu'].map(o => (
                <option key={o} value={o}>{o}</option>
              ))}
            </select>
          </div>
          <div>
            <div style={etiketite}>Laiks</div>
            <select value={nokrisni} onChange={e => setNokrisni(e.target.value)} style={lauks}>
              <option value="">—</option>
              {['sauss','mākoņains','lietus','sniegs','migla'].map(o => (
                <option key={o} value={o}>{o}</option>
              ))}
            </select>
          </div>
          <div>
            <div style={etiketite}>Temp °C</div>
            <input type="number" value={temp} onChange={e => setTemp(e.target.value)}
              placeholder="°C" style={lauks} />
          </div>
        </div>

        {/* Rezultāts */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px',
          background: C.greenBg, border: `0.5px solid ${C.greenBdr}`,
          borderRadius: 8, marginBottom: nomedits ? 8 : 10,
        }}>
          <label style={{ fontSize: 13, color: C.camoDark, display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontWeight: 500 }}>
            <input type="checkbox" checked={nomedits} onChange={e => setNomedits(e.target.checked)} style={{ width: 16, height: 16 }} />
            {isMakskere ? '✓ Noķēru!' : '✓ Nomedīju!'}
          </label>
        </div>

        {nomedits && (
          <div style={{ display: 'grid', gridTemplateColumns: isMakskere ? '1fr 1fr' : '1fr 1fr', gap: 6, marginBottom: 10 }}>
            {isMakskere ? <>
              <div>
                <div style={etiketite}>Skaits (gb.)</div>
                <input type="number" value={skaits} onChange={e => setSkaits(e.target.value)}
                  placeholder="3" style={lauks} />
              </div>
              <div>
                <div style={etiketite}>Svars (kg)</div>
                <input type="number" value={svars} onChange={e => setSvars(e.target.value)}
                  placeholder="2.4" style={lauks} />
              </div>
            </> : <>
              <div>
                <div style={etiketite}>Svars (kg)</div>
                <input type="number" value={svars} onChange={e => setSvars(e.target.value)}
                  placeholder="80" style={lauks} />
              </div>
              <div>
                <div style={etiketite}>Dzimums</div>
                <select value={dzimums} onChange={e => setDzimums(e.target.value)} style={lauks}>
                  <option value="">—</option>
                  <option value="tēviņš">Kuilis / tēviņš</option>
                  <option value="mātīte">Sivēnmāte / mātīte</option>
                  <option value="mazulis">Mazulis / teļš</option>
                </select>
              </div>
            </>}
          </div>
        )}

        <button onClick={saglabtIerakstu} disabled={saglaba || !teksts.trim()} style={{
          width: '100%', padding: 11,
          background: saglaba || !teksts.trim() ? C.camoMid : C.orange,
          color: '#fff', border: 'none', borderRadius: 8,
          fontSize: 14, fontWeight: 500,
          cursor: saglaba || !teksts.trim() ? 'default' : 'pointer',
        }}>
          {saglaba ? '⏳ Saglabā...' : '💾 Saglabāt ierakstu'}
        </button>
      </div>

      {/* AI JAUTĀJUMI */}
      <div style={{ background: C.surface2, border: `0.5px solid ${C.border}`, borderRadius: 12, padding: '14px 16px' }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: C.camoLight, marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          📊 Jautā saviem datiem
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 10 }}>
          {(isMakskere ? JAUTAJUMI_MAKSKERE : JAUTAJUMI_MEDIBAS).map(q => (
            <button key={q} onClick={() => setJautajums(q)} style={{
              padding: '4px 10px', background: C.greenBg,
              border: `0.5px solid ${C.greenBdr}`, borderRadius: 20,
              fontSize: 11, color: C.camoDark, cursor: 'pointer',
            }}>{q}</button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <input value={jautajums} onChange={e => setJautajums(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && uzdotJautajumu()}
            placeholder="Uzdod jautājumu par saviem datiem..."
            style={{ ...lauks, flex: 1 }} />
          <button onClick={uzdotJautajumu} disabled={jautaLade || !jautajums.trim()} style={{
            padding: '8px 14px', background: C.camoDark,
            color: C.camoText, border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 16,
          }}>🔍</button>
        </div>
        {atbilde && (
          <div style={{ marginTop: 10, padding: '10px 12px', background: C.greenBg, borderRadius: 8, borderLeft: `2px solid ${C.camoMid}`, fontSize: 13, color: C.camoDark, lineHeight: 1.6 }}>
            {jautaLade ? '⏳ Analizē...' : atbilde}
          </div>
        )}
      </div>

      {/* VĒSTURE */}
      <div style={{ background: C.surface2, border: `0.5px solid ${C.border}`, borderRadius: 12, padding: '14px 16px' }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: C.camoLight, marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          📖 Vēsture ({ieraksti.length})
        </div>
        {ieraksti.length === 0 && (
          <p style={{ color: C.camoMuted, fontSize: 13 }}>Vēl nav ierakstu. Pievieno pirmo!</p>
        )}
        {ieraksti.map((i, idx) => (
          <div key={i.id} style={{ paddingBottom: 10, marginBottom: 10, borderBottom: idx < ieraksti.length - 1 ? `0.5px solid ${C.border}` : 'none' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4, gap: 8 }}>
              <span style={{ fontSize: 11, color: C.camoSubtle }}>
                {new Date(i.created_at).toLocaleString('lv-LV', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </span>
              <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                {i.meness_faze && (
                  <span style={zime(C.greenBg, C.greenBdr, C.camoDark)}>
                    {menessFazeEmoji(i.meness_faze)} {i.meness_faze}
                  </span>
                )}
                {i.temperatura != null && (
                  <span style={zime(C.surface1, C.border, C.camoMuted)}>🌡️ {i.temperatura}°C</span>
                )}
                {i.vejs && (
                  <span style={zime(C.surface1, C.border, C.camoMuted)}>💨 {i.vejs}</span>
                )}
                {i.nomedits && (
                  <span style={zime(C.orangeBg, C.orangeBdr, C.orangeTxt)}>
                    ✓ {i.nozveja_skaits ? `${i.nozveja_skaits} gb.` : ''} {i.svars ? `${i.svars} kg` : 'nomedīts'}
                  </span>
                )}
              </div>
            </div>
            <p style={{ fontSize: 13, color: C.camoText, lineHeight: 1.5, margin: '0 0 2px' }}>{i.teksts}</p>
            {(i.suga || i.dzimums) && (
              <p style={{ fontSize: 11, color: C.camoMuted, margin: 0 }}>
                {[i.suga, i.dzimums].filter(Boolean).join(' · ')}
              </p>
            )}
          </div>
        ))}
      </div>

      {/* DROŠĪBA */}
      <div style={{ background: C.camoDark, borderRadius: 12, padding: '14px 16px' }}>
        <div style={{ color: C.camoText, fontSize: 11, fontWeight: 600, marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          🛡️ Drošība
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <a href="tel:112" style={{ ...avarsPogas, background: C.orange, color: '#fff', border: 'none' }}>
            📞 Zvanīt 112
          </a>
          <a href="https://www.112.lv/app" target="_blank" rel="noopener noreferrer"
            style={{ ...avarsPogas, background: C.orangeBg, color: C.orangeTxt, border: `0.5px solid ${C.orangeBdr}` }}>
            📲 112 Latvija app
          </a>
        </div>
      </div>

    </div>
  )
}

// ── Stili ────────────────────────────────────────────────
const lauks = {
  background: '#2e3a1f', border: '0.5px solid #4a5a32',
  borderRadius: 8, color: '#e8f0d8',
  padding: '7px 10px', fontSize: 13, width: '100%',
  boxSizing: 'border-box', outline: 'none',
}

const etiketite = {
  fontSize: 10, color: '#7a8f52', marginBottom: 2,
}

const avarsPogas = {
  flex: 1, padding: '10px 8px', borderRadius: 8,
  fontSize: 12, fontWeight: 500, cursor: 'pointer',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  gap: 5, textDecoration: 'none',
}

function zime(bg, bdr, clr) {
  return { fontSize: 10, padding: '2px 7px', borderRadius: 10, background: bg, color: clr, border: `0.5px solid ${bdr}` }
}
