export default function EtikasTeksts({ teksts, style }) {
  if (!teksts) return null
  return (
    <div style={{
      borderTop: "1px solid #1a3a1a",
      marginTop: 16,
      paddingTop: 12,
      display: "flex",
      gap: 8,
      alignItems: "flex-start",
      ...style,
    }}>
      <span style={{ fontSize: 14, marginTop: 1 }}>🏹</span>
      <div>
        <div style={{ fontSize: 12, color: "#81c784", fontStyle: "italic", lineHeight: 1.6 }}>
          "{teksts}"
        </div>
        <div style={{ fontSize: 10, color: "#3a5a3a", marginTop: 3 }}>
          — Latvijas Mednieku ētikas kodekss
        </div>
      </div>
    </div>
  )
}
