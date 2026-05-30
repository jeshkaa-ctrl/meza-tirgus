/**
 * Rāda "slēgts" ziņojumu ar pogu uz abonēšanas lapu.
 * onNavigate — App.jsx navigācijas funkcija (setPage)
 * compact    — mazāks variants (iekļaušanai pogā blakus)
 */
export function UpgradePrompt({ reason, onNavigate, compact = false }) {
  return (
    <div style={{
      border: '1px solid #2d4a2d',
      borderRadius: 10,
      padding: compact ? '10px 14px' : '20px 24px',
      background: '#111f11',
      textAlign: 'center',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: compact ? 8 : 12,
    }}>
      <div style={{ fontSize: compact ? 20 : 28 }}>🔒</div>
      <p style={{
        margin: 0,
        fontSize: compact ? 12 : 14,
        color: '#a8d8a8',
        lineHeight: 1.5,
      }}>
        {reason}
      </p>
      <button
        onClick={() => onNavigate?.('subscription')}
        style={{
          padding: compact ? '6px 16px' : '9px 24px',
          background: '#225522',
          color: 'white',
          border: '1px solid #4caf50',
          borderRadius: 6,
          cursor: 'pointer',
          fontSize: compact ? 12 : 13,
          fontWeight: 'bold',
        }}
      >
        Skatīt plānus →
      </button>
    </div>
  )
}
