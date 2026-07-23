import React, { Suspense } from "react"
import ReactDOM from "react-dom/client"
import App from "./App.jsx"
import ErrorBoundary from "./ErrorBoundary.jsx"
import SistemasPazinojumiPortal from "./SistemasPazinojumiPortal.jsx"
import "./index.css"
import { registerSW } from 'virtual:pwa-register'

// Pārbauda jaunu SW versiju ik stundu — lietotājs saņem update bez manuālas darbības
registerSW({
  onRegisteredSW(swUrl, r) {
    if (r) setInterval(() => r.update(), 60 * 60 * 1000)
  },
})

const Lade = () => (
  <div style={{ minHeight: '100vh', background: '#080f08', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16 }}>
    <div style={{ width: 36, height: 36, border: '3px solid #2d4a2d', borderTop: '3px solid #4caf50', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
    <style>{'@keyframes spin{to{transform:rotate(360deg)}}'}</style>
    <div style={{ color: '#4a7a4a', fontSize: 13, fontFamily: 'Inter, Arial, sans-serif' }}>Ielādē...</div>
  </div>
)

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ErrorBoundary>
      <SistemasPazinojumiPortal />
      <Suspense fallback={<Lade />}>
        <App />
      </Suspense>
    </ErrorBoundary>
  </React.StrictMode>
)