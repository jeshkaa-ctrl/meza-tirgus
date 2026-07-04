import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'
import { menessFaze, menessFazeEmoji } from '../utils/menessFaze'

const shodiensFaze = menessFaze(new Date())
const fazeEmoji = menessFazeEmoji(shodiensFaze)

const ATRIE_JAUTAJUMI = [
  'Cik medījumus nomedīju šogad?',
  'Pie kādas mēness fāzes man veicies vislabāk?',
  'Kurā diennakts laikā visvairāk nomedīju?',
  'Kāds vējš man der visvairāk?',
  'Kāds ir mans smagākais medījums?',
]

const TUKSA_FORMA = {
  suga: '', nomedits: false, svars: '',
  dzimums: '', vejs: '', temperatura: '', nokrisni: '', vieta: '',
}

export default function DienasgramataPage() {
  const [prognoze, setPrognoze] = useState('')
  const [prognozeLade, setPrognozeLade] = useState(true)
  const [ieraksti, setIeraksti] = useState([])
  const [teksts, setTeksts] = useState('')
  const [forma, setForma] = useState(TUKSA_FORMA)
  const [saglaba, setSaglaba] = useState(false)
  const [jautajums, setJautajums] = useState('')
  const [atbilde, setAtbilde] = useState('')
  const [jautaLade, setJautaLade] = useState(false)

  useEffect(() => {
    ieladePrognozi()
    ieladeIerakstus()
  }, [])

  async function ieladePrognozi() {
    setPrognozeLade(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      const r = await fetch('/api/dienasgramata-prognoze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          menessFaze: shodiensFaze,
        }),
      })
      const d = await r.json()
      setPrognoze(d.prognoze || '')
    } catch {
      setPrognoze('Neizdevās ielādēt prognozi.')
    }
    setPrognozeLade(false)
  }

  async function ieladeIerakstus() {
    const { data: { user } } = await supabase.auth.getUser()
    const { data } = await supabase
      .from('medibu_dienasgramata')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50)
    setIeraksti(data || [])
  }

  async function saglabtIerakstu() {
    if (!teksts.trim()) return
    setSaglaba(true)
    const { data: { user } } = await supabase.auth.getUser()
    await supabase.from('medibu_dienasgramata').insert({
      user_id: user.id,
      teksts: teksts.trim(),
      meness_faze: shodiensFaze,
      suga: forma.suga || null,
      nomedits: forma.nomedits,
      svars: forma.svars ? parseFloat(forma.svars) : null,
      dzimums: forma.dzimums || null,
      vejs: forma.vejs || null,
      temperatura: forma.temperatura ? parseFloat(forma.temperatura) : null,
      nokrisni: forma.nokrisni || null,
      vieta: forma.vieta || null,
    })
    setTeksts('')
    setForma(TUKSA_FORMA)
    ieladeIerakstus()
    setSaglaba(false)
  }

  async function uzdotJautajumu() {
    if (!jautajums.trim()) return
    setJautaLade(true)
    setAtbilde('')
    const { data: { user } } = await supabase.auth.getUser()
    const r = await fetch('/api/dienasgramata-jautajums', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: user.id, jautajums }),
    })
    const d = await r.json()
    setAtbilde(d.atbilde || '')
    setJautaLade(false)
  }

  return (
    <div style={{ maxWidth: '700px', margin: '0 auto', padding: '20px' }}>

      {/* AI RĪTA PROGNOZE */}
      <div style={kartesStils('#1a2e1a', '#4a7c3f')}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
          <span style={{ fontSize: '1.6rem' }}>{fazeEmoji}</span>
          <h2 style={{ color: '#a8c5a0', margin: 0, fontSize: '1.05rem', fontWeight: 600 }}>
            Šodienas prognoze · {shodiensFaze}
          </h2>
        </div>
        <p style={{ color: '#e8f5e9', lineHeight: 1.65, margin: 0, fontSize: '0.95rem' }}>
          {prognozeLade ? '⏳ Analizē...' : (prognoze || '—')}
        </p>
      </div>

      {/* JAUNS IERAKSTS */}
      <div style={kartesStils('#1a2e1a', '#2d4a2d')}>
        <h3 style={{ color: '#a8c5a0', marginTop: 0, marginBottom: '14px' }}>Jauns ieraksts</h3>

        <textarea
          value={teksts}
          onChange={e => setTeksts(e.target.value)}
          placeholder="Ziemeļu vējš, sniegs, 21:30 iznāca cūkas..."
          rows={3}
          style={{ ...laukStils, resize: 'vertical', marginBottom: '12px' }}
        />

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '12px' }}>
          <select value={forma.suga} onChange={e => setForma({ ...forma, suga: e.target.value })} style={laukStils}>
            <option value="">Suga</option>
            <option value="mežacūka">Mežacūka</option>
            <option value="staltbriedis">Staltbriedis</option>
            <option value="stirna">Stirna</option>
            <option value="alnis">Alnis</option>
            <option value="vilks">Vilks</option>
            <option value="lapsa">Lapsa</option>
            <option value="bebrs">Bebrs</option>
            <option value="zaķis">Zaķis</option>
          </select>

          <select value={forma.vejs} onChange={e => setForma({ ...forma, vejs: e.target.value })} style={laukStils}>
            <option value="">Vējš</option>
            <option value="ziemeļu">Ziemeļu</option>
            <option value="dienvidu">Dienvidu</option>
            <option value="rietumu">Rietumu</option>
            <option value="austrumu">Austrumu</option>
            <option value="bezvejš">Bezvējš</option>
          </select>

          <select value={forma.nokrisni} onChange={e => setForma({ ...forma, nokrisni: e.target.value })} style={laukStils}>
            <option value="">Laiks</option>
            <option value="sauss">Sauss</option>
            <option value="lietus">Lietus</option>
            <option value="sniegs">Sniegs</option>
            <option value="migla">Migla</option>
          </select>

          <input
            type="number"
            value={forma.temperatura}
            onChange={e => setForma({ ...forma, temperatura: e.target.value })}
            placeholder="Temp °C"
            style={laukStils}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '12px', flexWrap: 'wrap' }}>
          <label style={{ color: '#a8c5a0', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={forma.nomedits}
              onChange={e => setForma({ ...forma, nomedits: e.target.checked })}
            />
            Nomedīju!
          </label>

          {forma.nomedits && <>
            <input
              type="number"
              value={forma.svars}
              onChange={e => setForma({ ...forma, svars: e.target.value })}
              placeholder="Svars kg"
              style={{ ...laukStils, width: '100px' }}
            />
            <select value={forma.dzimums} onChange={e => setForma({ ...forma, dzimums: e.target.value })} style={{ ...laukStils, flex: 1 }}>
              <option value="">Dzimums</option>
              <option value="tēviņš">Tēviņš / Kuilis</option>
              <option value="mātīte">Mātīte / Sivēnmāte</option>
              <option value="mazulis">Mazulis / Teļš</option>
            </select>
          </>}
        </div>

        <button
          onClick={saglabtIerakstu}
          disabled={saglaba || !teksts.trim()}
          style={pogasStils(!teksts.trim() || saglaba)}
        >
          {saglaba ? '⏳ Saglabā...' : 'Saglabāt ierakstu'}
        </button>
      </div>

      {/* AI JAUTĀJUMI */}
      <div style={kartesStils('#1a2e1a', '#2d4a2d')}>
        <h3 style={{ color: '#a8c5a0', marginTop: 0, marginBottom: '12px' }}>Jautā saviem datiem</h3>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '12px' }}>
          {ATRIE_JAUTAJUMI.map(q => (
            <button key={q} onClick={() => setJautajums(q)} style={atrasPogas}>
              {q}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <input
            value={jautajums}
            onChange={e => setJautajums(e.target.value)}
            placeholder="Uzdod jautājumu par saviem datiem..."
            style={{ ...laukStils, flex: 1 }}
            onKeyDown={e => e.key === 'Enter' && uzdotJautajumu()}
          />
          <button
            onClick={uzdotJautajumu}
            disabled={jautaLade || !jautajums.trim()}
            style={{ ...pogasStils(!jautajums.trim() || jautaLade), width: 'auto', padding: '8px 16px' }}
          >
            {jautaLade ? '⏳' : '→'}
          </button>
        </div>

        {atbilde && (
          <div style={{ marginTop: '12px', padding: '12px', background: '#0d1a0d', borderRadius: '8px', borderLeft: '3px solid #4a7c3f' }}>
            <p style={{ color: '#e8f5e9', margin: 0, lineHeight: 1.65, fontSize: '0.95rem' }}>{atbilde}</p>
          </div>
        )}
      </div>

      {/* IERAKSTU SARAKSTS */}
      <div>
        <h3 style={{ color: '#a8c5a0', marginBottom: '12px' }}>Ierakstu vēsture ({ieraksti.length})</h3>
        {ieraksti.length === 0 && (
          <p style={{ color: '#6b9e61', fontSize: '0.9rem' }}>Nav ierakstu vēl. Pievieno pirmo!</p>
        )}
        {ieraksti.map(i => (
          <div key={i.id} style={{ ...kartesStils('#1a2e1a', '#2d4a2d'), marginBottom: '8px', padding: '14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', flexWrap: 'wrap', gap: '4px' }}>
              <span style={{ color: '#6b9e61', fontSize: '0.8rem' }}>
                {new Date(i.created_at).toLocaleString('lv-LV')}
              </span>
              <span style={{ fontSize: '0.8rem', color: '#a8c5a0' }}>
                {menessFazeEmoji(i.meness_faze)} {i.meness_faze}
                {i.vejs && ` · ${i.vejs}`}
                {i.temperatura != null && ` · ${i.temperatura}°C`}
              </span>
            </div>
            <p style={{ color: '#e8f5e9', margin: '4px 0', fontSize: '0.95rem', lineHeight: 1.5 }}>{i.teksts}</p>
            {i.nomedits && (
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: '6px',
                background: '#0d3d0d', border: '1px solid #4a7c3f',
                borderRadius: '20px', padding: '3px 10px',
                marginTop: '6px', fontSize: '0.8rem', color: '#6bcb77',
              }}>
                ✓ Nomedīts
                {i.suga && ` · ${i.suga}`}
                {i.svars && ` · ${i.svars} kg`}
                {i.dzimums && ` · ${i.dzimums}`}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

function kartesStils(bg, border) {
  return {
    background: bg,
    border: `1px solid ${border}`,
    borderRadius: '12px',
    padding: '20px',
    marginBottom: '20px',
  }
}

const laukStils = {
  background: '#0d1a0d',
  border: '1px solid #2d4a2d',
  borderRadius: '8px',
  color: '#e8f5e9',
  padding: '8px 12px',
  fontSize: '0.9rem',
  width: '100%',
  boxSizing: 'border-box',
}

function pogasStils(disabled) {
  return {
    padding: '10px 20px',
    background: disabled ? '#2d4a2d' : '#4a7c3f',
    color: disabled ? '#6b9e61' : 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: disabled ? 'not-allowed' : 'pointer',
    fontSize: '0.9rem',
    width: '100%',
  }
}

const atrasPogas = {
  padding: '5px 10px',
  background: '#0d1a0d',
  border: '1px solid #2d4a2d',
  borderRadius: '20px',
  color: '#6b9e61',
  cursor: 'pointer',
  fontSize: '0.78rem',
}
