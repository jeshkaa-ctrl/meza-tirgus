import { Component } from 'react'

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { kludaNotika: false, kluda: null }
  }

  static getDerivedStateFromError(kluda) {
    return { kludaNotika: true, kluda }
  }

  componentDidCatch(kluda, info) {
    console.error('[ErrorBoundary]', kluda, info.componentStack)
  }

  render() {
    if (this.state.kludaNotika) {
      return (
        <div style={{
          minHeight: '100vh', background: '#080f08',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: "'Inter', Arial, sans-serif", padding: 24,
        }}>
          <div style={{
            maxWidth: 480, textAlign: 'center',
            background: '#111f11', border: '1px solid #5a1a1a',
            borderRadius: 12, padding: '32px 24px',
          }}>
            <div style={{ fontSize: 40, marginBottom: 16 }}>🌲</div>
            <h2 style={{ color: '#ef5350', margin: '0 0 12px', fontSize: 20 }}>
              Kaut kas nogāja greizi
            </h2>
            <p style={{ color: '#7ab87a', fontSize: 14, lineHeight: 1.6, margin: '0 0 24px' }}>
              Radās neparedzēta kļūda. Mēģini atsvaidzināt lapu —
              parasti tas palīdz.
            </p>
            {this.state.kluda?.message && (
              <div style={{
                background: '#0a0a0a', borderRadius: 6, padding: '8px 12px',
                fontSize: 11, color: '#557a55', marginBottom: 20,
                fontFamily: 'monospace', textAlign: 'left', wordBreak: 'break-all',
              }}>
                {this.state.kluda.message}
              </div>
            )}
            <button
              onClick={() => window.location.reload()}
              style={{
                padding: '10px 28px', background: '#225522',
                border: '1px solid #4caf50', borderRadius: 8,
                color: '#e8f5e9', fontSize: 14, cursor: 'pointer',
                fontFamily: "'Inter', Arial, sans-serif",
              }}
            >
              Atsvaidzināt lapu
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
