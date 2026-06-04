import React from 'react'
import ReactDOM from 'react-dom/client'
import MiniAppShell from './MiniAppShell'
import KrautuvesMeritajsPage from '../KrautuvesMeritajsPage'
import ErrorBoundary from '../ErrorBoundary'
import '../index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <MiniAppShell nosaukums="Krautuves mērītājs" ikona="📦" bērtUrl="/">
        <KrautuvesMeritajsPage onBack={() => window.location.href = '/'} />
      </MiniAppShell>
    </ErrorBoundary>
  </React.StrictMode>
)
