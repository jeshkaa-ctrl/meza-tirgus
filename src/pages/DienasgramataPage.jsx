import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'
import { menessFaze, menessFazeEmoji } from '../utils/menessFaze'

const shodiensFaze = menessFaze(new Date())
const fazeEmoji = menessFazeEmoji(shodiensFaze)

const MEDIBAS_SUGAS = [
  'mežacūka', 'staltbriedis', 'stirna', 'alnis',
  'vilks', 'lapsa', 'bebrs', 'zaķis', 'jenotsunis',
]

const ZIVU_SUGAS = [
  'līdaka', 'asaris', 'zandarts', 'karpis', 'līnis',
  'plaudis', 'vimbis', 'lasis', 'taimiņš', 'forele',
  'zutis', 'raudis', 'sapals',
]

const ATRIE_JAUTAJUMI_MEDIBAS = [
  'Cik medījumus nomedīju šogad?',
  'Pie kādas mēness fāzes man veicies vislabāk?',
  'Kurā diennakts laikā visvairāk nomedīju?',
  'Kāds vējš man der visvairāk?',
  'Pie kādas temperatūras man veicies labāk?',
]

const ATRIE_JAUTAJUMI_MAKSKERE = [
  'Cik zivis noķēru šogad?',
  'Kuru zivi ķeru visbiežāk?',
  'Kurā diennakts laikā veicies vislabāk?',
  'Pie kādas temperatūras labāk ķeras?',
  'Pie kāda laika man veicies labāk — saulains vai mākoņains?',
]

const TUKSA_FORMA = {
  suga: '', nomedits: false, svars: '',
  dzimums: '', vejs: '', temperatura: '',
  nokrisni: '', vieta: '', nozveja_skaits: '',
}

export default function DienasgramataPage() {
  const [aktivitate, setAktivitate] = useState('medibas')
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

  // Notīra formu mainot aktivitāti
  function mainAktivitati(jauna) {
    setAktivitate(jauna)
    setForma(TUKSA_FORMA)
    setAtbilde('')
    setJautajums('')
  }

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
          aktivitate,
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
      .limit(60)
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
      aktivitate,
      suga: forma.suga || null,
      nomedits: forma.nomedits,
      svars: forma.svars ? parseFloat(forma.svars) : null,
      dzimums: aktivitate === 'medibas' ? (forma.dzimums || null) : null,
      nozveja_skaits: aktivitate === 'makskere' && forma.nozveja_skaits
        ? parseInt(forma.nozveja_skaits) : null,
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
      body: JSON.stringify({ userId: user.id, jautajums, aktivitate }),
    })
    const d = await r.json()
    setAtbilde(d.atbilde || '')
    setJautaLade(false)
  }

  const isMakskere = aktivitate === 'makskere'
  const atriePogaJautajumi = isMakskere ? ATRIE_JAUTAJUMI_MAKSKERE : ATRIE_JAUTAJUMI_MEDIBAS
  const filtretieIeraksti = ieraksti.filter(i =>
    (i.aktivitate || 'medibas') === aktivitate
  )

  return (
    <div style={{ maxWidth: '700px', margin: '0 auto', padding: '20px' }}>

      {/* AKTIVITĀTES TOGGLE */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
        {[
          { id: 'medibas',  nos: '🎯 Medības' },
          { id: 'makskere', nos: '🎣 Makšķerēšana' },
        ].map(a => (
          <button key={a.id} onClick={() => mainAktivitati(a.id)}
            style={{
              flex: 1, padding: '10px', border: 'none', borderRadius: '8px',
              cursor: 'pointer', fontSize: '0.95rem', fontWeight: 600,
              background: aktivitate === a.id ? '#4a7c3f' : '#1a2e1a',
              color: aktivitate === a.id ? 'white' : '#6b9e61',
              border: `1px solid ${aktivitate === a.id ? '#4a7c3f' : '#2d4a2d'}`,
            }}>
            {a.nos}
          </button>
        ))}
      </div>

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
        <h3 style={{ color: '#a8c5a0', marginTop: 0, marginBottom: '14px' }}>
          {isMakskere ? 'Jauns makšķerēšanas ieraksts' : 'Jauns medību ieraksts'}
        </h3>

        <textarea
          value={teksts}
          onChange={e => setTeksts(e.target.value)}
          placeholder={isMakskere
            ? 'Rīta klusums uz ezera, ūdens dzidrs, 06:30 trāpīja līdaka...'
            : 'Ziemeļu vējš, sniegs, 21:30 iznāca cūkas...'}
          rows={3}
          style={{ ...laukStils, resize: 'vertical', marginBottom: '12px' }}
        />

        {/* LAIKA APSTĀKĻI — abi tipi */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '12px' }}>
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
            <option value="makonains">Mākoņains</option>
          </select>

          <input
            type="number"
            value={forma.temperatura}
            onChange={e => setForma({ ...forma, temperatura: e.target.value })}
            placeholder="Temp °C"
            style={laukStils}
          />

          <input
            value={forma.vieta}
            onChange={e => setForma({ ...forma, vieta: e.target.value })}
            placeholder={isMakskere ? 'Ūdenstilpe / vieta' : 'Medību vieta'}
            style={laukStils}
          />
        </div>

        {/* SUGA */}
        <div style={{ marginBottom: '12px' }}>
          <select value={forma.suga} onChange={e => setForma({ ...forma, suga: e.target.value })} style={laukStils}>
            <option value="">{isMakskere ? 'Zivs suga' : 'Medījuma suga'}</option>
            {(isMakskere ? ZIVU_SUGAS : MEDIBAS_SUGAS).map(s => (
              <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
            ))}
          </select>
        </div>

        {/* REZULTĀTS */}
        {isMakskere ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px', flexWrap: 'wrap' }}>
            <label style={{ color: '#a8c5a0', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
              <input type="checkbox" checked={forma.nomedits}
                onChange={e => setForma({ ...forma, nomedits: e.target.checked })} />
              Noķēru!
            </label>
            {forma.nomedits && <>
              <input type="number" value={forma.nozveja_skaits}
                onChange={e => setForma({ ...forma, nozveja_skaits: e.target.value })}
                placeholder="Skaits" style={{ ...laukStils, width: '90px' }} />
              <input type="number" value={forma.svars}
                onChange={e => setForma({ ...forma, svars: e.target.value })}
                placeholder="Svars kg" style={{ ...laukStils, width: '100px' }} />
            </>}
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px', flexWrap: 'wrap' }}>
            <label style={{ color: '#a8c5a0', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
              <input type="checkbox" checked={forma.nomedits}
                onChange={e => setForma({ ...forma, nomedits: e.target.checked })} />
              Nomedīju!
            </label>
            {forma.nomedits && <>
              <input type="number" value={forma.svars}
                onChange={e => setForma({ ...forma, svars: e.target.value })}
                placeholder="Svars kg" style={{ ...laukStils, width: '100px' }} />
              <select value={forma.dzimums}
                onChange={e => setForma({ ...forma, dzimums: e.target.value })}
                style={{ ...laukStils, flex: 1 }}>
                <option value="">Dzimums</option>
                <option value="tēviņš">Tēviņš / Kuilis</option>
                <option value="mātīte">Mātīte / Sivēnmāte</option>
                <option value="mazulis">Mazulis / Teļš</option>
              </select>
            </>}
          </div>
        )}

        <button onClick={saglabtIerakstu} disabled={saglaba || !teksts.trim()}
          style={pogasStils(!teksts.trim() || saglaba)}>
          {saglaba ? '⏳ Saglabā...' : 'Saglabāt ierakstu'}
        </button>
      </div>

      {/* AI JAUTĀJUMI */}
      <div style={kartesStils('#1a2e1a', '#2d4a2d')}>
        <h3 style={{ color: '#a8c5a0', marginTop: 0, marginBottom: '12px' }}>Jautā saviem datiem</h3>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '12px' }}>
          {atriePogaJautajumi.map(q => (
            <button key={q} onClick={() => setJautajums(q)} style={atrasPogas}>{q}</button>
          ))}
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <input value={jautajums} onChange={e => setJautajums(e.target.value)}
            placeholder="Uzdod jautājumu par saviem datiem..."
            style={{ ...laukStils, flex: 1 }}
            onKeyDown={e => e.key === 'Enter' && uzdotJautajumu()} />
          <button onClick={uzdotJautajumu} disabled={jautaLade || !jautajums.trim()}
            style={{ ...pogasStils(!jautajums.trim() || jautaLade), width: 'auto', padding: '8px 16px' }}>
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
        <h3 style={{ color: '#a8c5a0', marginBottom: '12px' }}>
          {isMakskere ? 'Makšķerēšanas' : 'Medību'} vēsture ({filtretieIeraksti.length})
        </h3>
        {filtretieIeraksti.length === 0 && (
          <p style={{ color: '#6b9e61', fontSize: '0.9rem' }}>Nav ierakstu vēl. Pievieno pirmo!</p>
        )}
        {filtretieIeraksti.map(i => (
          <div key={i.id} style={{ ...kartesStils('#1a2e1a', '#2d4a2d'), marginBottom: '8px', padding: '14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', flexWrap: 'wrap', gap: '4px' }}>
              <span style={{ color: '#6b9e61', fontSize: '0.8rem' }}>
                {new Date(i.created_at).toLocaleString('lv-LV')}
              </span>
              <span style={{ fontSize: '0.8rem', color: '#a8c5a0' }}>
                {menessFazeEmoji(i.meness_faze)} {i.meness_faze}
                {i.temperatura != null && ` · ${i.temperatura}°C`}
                {i.vejs && ` · ${i.vejs}`}
                {i.nokrisni && ` · ${i.nokrisni}`}
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
                {isMakskere ? '✓ Noķēru' : '✓ Nomedīts'}
                {i.suga && ` · ${i.suga}`}
                {i.nozveja_skaits && ` · ${i.nozveja_skaits} gb.`}
                {i.svars && ` · ${i.svars} kg`}
                {i.dzimums && ` · ${i.dzimums}`}
              </div>
            )}
            {i.vieta && (
              <div style={{ marginTop: '4px', fontSize: '0.78rem', color: '#4a7c3f' }}>
                📍 {i.vieta}
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
