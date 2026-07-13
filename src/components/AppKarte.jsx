// Vienas app karte sākumlapā

const TIPS_KRASA = {
  izmegina:  { bg: '#0d2010', border: '#2e7d32', teksts: '#66bb6a', nos: 'IZMĒĢINI' },
  lojalitate:{ bg: '#0d2010', border: '#2e7d32', teksts: '#66bb6a', nos: 'BEZMAKSAS' },
  menesis:   { bg: '#0d2010', border: '#388e3c', teksts: '#81c784', nos: 'AKTĪVS'   },
  gads:      { bg: '#0d2010', border: '#388e3c', teksts: '#81c784', nos: 'AKTĪVS'   },
  pro:       { bg: '#1a1200', border: '#f9a825', teksts: '#ffd54f', nos: 'PRO'       },
  aktīvs:    { bg: '#0d2010', border: '#388e3c', teksts: '#81c784', nos: 'AKTĪVS'   },
}

export default function AppKarte({
  ikona, nosaukums, apraksts, funkcijas = [],
  pieejams, abonements, diezDienas,
  onClick, cenaM, cenaG, bezmaksas,
  disabled,
}) {
  const badge = abonements ? TIPS_KRASA[abonements] || TIPS_KRASA['aktīvs'] : null

  return (
    <div
      onClick={disabled ? undefined : onClick}
      style={{
        background: disabled ? '#050c05' : '#0a140a',
        border: `1px solid ${pieejams ? '#2e7d32' : '#1a2a1a'}`,
        borderRadius: 14,
        padding: '16px 16px 14px',
        cursor: disabled ? 'default' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        transition: 'border-color 0.15s, transform 0.1s',
        position: 'relative',
        overflow: 'hidden',
      }}
      onMouseEnter={e => { if (!disabled) e.currentTarget.style.borderColor = '#4caf50' }}
      onMouseLeave={e => { if (!disabled) e.currentTarget.style.borderColor = pieejams ? '#2e7d32' : '#1a2a1a' }}
    >
      {/* Aktīvā statusa gaisma */}
      {pieejams && (
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: 2,
          background: 'linear-gradient(90deg, #2e7d32, #66bb6a, #2e7d32)',
        }} />
      )}

      {/* Galvene */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 8 }}>
        <div style={{ fontSize: 28, lineHeight: 1, flexShrink: 0 }}>{ikona}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 15, fontWeight: 700, color: '#ddeadd' }}>{nosaukums}</span>
            {badge && (
              <span style={{
                fontSize: 9, fontWeight: 800, letterSpacing: 0.5,
                color: badge.teksts, background: badge.bg,
                border: `1px solid ${badge.border}`,
                borderRadius: 4, padding: '1px 5px',
              }}>{badge.nos}</span>
            )}
            {!pieejams && !bezmaksas && (
              <span style={{ fontSize: 14, color: '#3a5a3a' }}>🔒</span>
            )}
          </div>
          {diezDienas && diezDienas <= 14 && (
            <div style={{ fontSize: 10, color: '#ff8f00', marginTop: 1 }}>
              ⏰ Beigsies pēc {diezDienas} d.
            </div>
          )}
        </div>
      </div>

      {/* Apraksts */}
      <div style={{ fontSize: 12, color: '#7aaa7a', lineHeight: 1.5, marginBottom: funkcijas.length ? 8 : 10 }}>
        {apraksts}
      </div>

      {/* Funkciju saraksts */}
      {funkcijas.length > 0 && (
        <ul style={{ margin: '0 0 10px', padding: 0, listStyle: 'none' }}>
          {funkcijas.map((f, i) => (
            <li key={i} style={{ fontSize: 11, color: '#5a8a5a', marginBottom: 2 }}>
              ✦ {f}
            </li>
          ))}
        </ul>
      )}

      {/* Apakšdaļa */}
      {bezmaksas ? (
        <div style={{
          fontSize: 11, color: '#4caf50', fontWeight: 600,
          background: '#050c05', borderRadius: 6, padding: '5px 10px', textAlign: 'center',
        }}>
          BEZMAKSAS — atvērt →
        </div>
      ) : pieejams ? (
        <div style={{
          fontSize: 11, color: '#4caf50', fontWeight: 600,
          background: '#050c05', borderRadius: 6, padding: '5px 10px', textAlign: 'center',
        }}>
          Atvērt →
        </div>
      ) : (
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          {cenaM && (
            <div style={{
              flex: 1, textAlign: 'center', background: '#050c05',
              borderRadius: 6, padding: '5px 8px',
              border: '1px solid #e8720c',
            }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#e8720c' }}>€{cenaM}</div>
              <div style={{ fontSize: 9, color: '#7a5a3a' }}>/mēnesis</div>
            </div>
          )}
          {cenaG && (
            <div style={{
              flex: 1, textAlign: 'center', background: '#050c05',
              borderRadius: 6, padding: '5px 8px',
              border: '1px solid #c47a00',
            }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#ffa726' }}>€{cenaG}</div>
              <div style={{ fontSize: 9, color: '#7a5a3a' }}>/gadā</div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
