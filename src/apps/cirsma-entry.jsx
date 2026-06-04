import React from 'react'
import ReactDOM from 'react-dom/client'
import MiniAppShell from './MiniAppShell'
import CirsmaNovertesanaMobile from '../CirsmaNovertesanaMobile'
import ErrorBoundary from '../ErrorBoundary'
import '../index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <MiniAppShell nosaukums="Cirsmu vērtēšana" ikona="🌲" bērtUrl="/">
        <CirsmaNovertesanaMobile onBack={() => window.location.href = '/'} />
      </MiniAppShell>
    </ErrorBoundary>
  </React.StrictMode>
)
