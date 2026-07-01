import { useState } from 'react'
import { ZIDATAJI } from '../../data/zidataji'
import { SAUSZEMES_PUTNI } from '../../data/sauszemesPutni'
import { UDENSPUTNI } from '../../data/udensputni'
import { INVAZIVAS } from '../../data/invazivas'
import SugasKarte from './SugasKarte'

const KATEGORIJAS = [
  { id: 'zidataji',      nos: '🦌 Zīdītāji',       dati: ZIDATAJI },
  { id: 'sauszeme',      nos: '🐦 Sauszemes putni', dati: SAUSZEMES_PUTNI },
  { id: 'udensputni',    nos: '🦆 Ūdensputni',      dati: UDENSPUTNI },
  { id: 'invazivas',     nos: '⚠️ Invazīvie',       dati: INVAZIVAS },
]

const FILTRI = [
  { id: 'visi',          nos: 'Visi' },
  { id: 'limitets',      nos: 'Limitētie' },
  { id: 'nelimitets',    nos: 'Nelimitētie' },
  { id: 'aizsargajams',  nos: 'Aizsargājamie' },
  { id: 'invaziva',      nos: 'Invazīvie' },
]

export default function SugasKatalogs() {
  const [kat, setKat]       = useState('zidataji')
  const [filtrs, setFiltrs] = useState('visi')
  const [mekle, setMekle]   = useState('')

  const aktKat = KATEGORIJAS.find(k => k.id === kat)
  const sugas  = (aktKat?.dati || []).filter(s => {
    const filtrsOk = filtrs === 'visi' || s.tips === filtrs
    const mekleOk  = !mekle || s.nos.toLowerCase().includes(mekle.toLowerCase()) || s.lat.toLowerCase().includes(mekle.toLowerCase())
    return filtrsOk && mekleOk
  })

  return (
    <div>
      {/* Kategorijas */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
        {KATEGORIJAS.map(k => (
          <button key={k.id} onClick={() => { setKat(k.id); setFiltrs('visi') }}
            style={{ padding: '8px 14px', borderRadius: 20, fontSize: 13, cursor: 'pointer',
              background: kat === k.id ? '#2e7d32' : '#0a140a',
              color: kat === k.id ? '#fff' : '#81c784',
              border: `1px solid ${kat === k.id ? '#4caf50' : '#1a3a1a'}`,
              fontWeight: kat === k.id ? 700 : 400 }}>
            {k.nos}
          </button>
        ))}
      </div>

      {/* Filtri un meklēšana */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14, alignItems: 'center' }}>
        {FILTRI.filter(f => f.id === 'visi' || aktKat?.dati.some(s => s.tips === f.id)).map(f => (
          <button key={f.id} onClick={() => setFiltrs(f.id)}
            style={{ padding: '5px 12px', borderRadius: 12, fontSize: 11, cursor: 'pointer',
              background: filtrs === f.id ? '#1b5e20' : 'transparent',
              color: filtrs === f.id ? '#81c784' : '#5a8a5a',
              border: `1px solid ${filtrs === f.id ? '#2e7d32' : '#1a3a1a'}` }}>
            {f.nos}
          </button>
        ))}
        <input value={mekle} onChange={e => setMekle(e.target.value)}
          placeholder="Meklēt sugu..."
          style={{ marginLeft: 'auto', background: '#040c04', border: '1px solid #1a3a1a',
            borderRadius: 6, color: '#ddeadd', fontSize: 12, padding: '5px 10px',
            outline: 'none', width: 140 }} />
      </div>

      {/* Skaits */}
      <div style={{ fontSize: 11, color: '#3a5a3a', marginBottom: 10 }}>
        {sugas.length} suga{sugas.length !== 1 ? 's' : ''}
      </div>

      {/* Kartītes */}
      {sugas.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 40, color: '#3a5a3a', fontSize: 13 }}>
          Nav atrasta neviena suga
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 12 }}>
          {sugas.map(s => <SugasKarte key={s.id} suga={s} />)}
        </div>
      )}
    </div>
  )
}
