export const EtikasTeksts = ({ teksts }) => {
  if (!teksts) return null
  return (
    <div style={{ borderLeft: '3px solid #4a7c3f', paddingLeft: '12px', margin: '12px 0', opacity: 0.85 }}>
      <p style={{ fontSize: '0.85rem', fontStyle: 'italic', color: '#a8c5a0', margin: 0 }}>
        🏹 "{teksts}"
      </p>
      <span style={{ fontSize: '0.75rem', color: '#6b9e61' }}>
        — Latvijas Mednieku ētikas kodekss
      </span>
    </div>
  )
}
