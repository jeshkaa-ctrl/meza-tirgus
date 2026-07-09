import { ETIKAS_TEKSTI } from '../../data/etika'
import { EtikasTeksts } from './EtikasTeksts'

const TIPS_BADGE = {
  limitets:    { teksts: 'LIMITĒTS',    krasa: '#ff8f00', bg: '#1a1000' },
  nelimitets:  { teksts: 'NELIMITĒTS',  krasa: '#4caf50', bg: '#0a1a0a' },
  aizsargajams:{ teksts: 'AIZSARGĀJAMS',krasa: '#ef5350', bg: '#1a0a0a' },
  invaziva:    { teksts: 'INVAZĪVS',    krasa: '#ab47bc', bg: '#150a1a' },
}

export default function SugasKarte({ suga, onClick }) {
  const badge = TIPS_BADGE[suga.tips] || TIPS_BADGE.nelimitets
  const etikaText = ETIKAS_TEKSTI.sugas[suga.etikaKey] || ETIKAS_TEKSTI.sugas.nelimiteta

  return (
    <div onClick={() => onClick?.(suga)}
      style={{ background: '#0a140a', border: '1px solid #1a3a1a', borderRadius: 12,
        padding: 16, cursor: onClick ? 'pointer' : 'default',
        transition: 'border-color 0.15s' }}
      onMouseEnter={e => e.currentTarget.style.borderColor = '#4caf50'}
      onMouseLeave={e => e.currentTarget.style.borderColor = '#1a3a1a'}>

      {/* Bilde */}
      {suga.attels && (
        <div style={{ margin: '-16px -16px 12px', borderRadius: '12px 12px 0 0', overflow: 'hidden', height: 150, background: '#060d06' }}>
          <img src={suga.attels} alt={suga.nos}
            style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 30%', display: 'block' }}
            onError={e => { e.currentTarget.parentElement.style.display = 'none' }} />
        </div>
      )}

      {/* Galvene */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 10 }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 15, fontWeight: 700, color: '#ddeadd' }}>{suga.nos}</span>
            <span style={{ fontSize: 10, fontWeight: 700, color: badge.krasa,
              background: badge.bg, border: `1px solid ${badge.krasa}`,
              borderRadius: 4, padding: '1px 6px' }}>
              {badge.teksts}
            </span>
          </div>
          <div style={{ fontSize: 11, color: '#5a8a5a', fontStyle: 'italic' }}>{suga.lat}</div>
        </div>
      </div>

      {/* Sezona */}
      <div style={{ background: '#060d06', borderRadius: 6, padding: '8px 10px', marginBottom: 10 }}>
        <div style={{ fontSize: 10, color: '#5a8a5a', marginBottom: 2 }}>📅 SEZONA</div>
        <div style={{ fontSize: 12, color: suga.tips === 'aizsargajams' ? '#ef5350' : '#81c784' }}>
          {suga.sezona}
        </div>
        {suga.dokuments && suga.tips !== 'aizsargajams' && (
          <div style={{ fontSize: 11, color: '#5a8a5a', marginTop: 4 }}>📋 {suga.dokuments}</div>
        )}
        {suga.regestrecija && suga.regestrecija !== '—' && (
          <div style={{ fontSize: 11, color: '#ff8f00', marginTop: 4 }}>📱 {suga.regestrecija}</div>
        )}
      </div>

      {/* Info */}
      <div style={{ fontSize: 12, color: '#b0c8b0', lineHeight: 1.6, marginBottom: 8 }}>
        {suga.info}
      </div>

      {/* Ētikas teksts */}
      <EtikasTeksts teksts={etikaText} />
    </div>
  )
}
