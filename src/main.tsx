import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { init } from '@tma.js/sdk'
import './index.css'
import App from './App.tsx'

// Initialize Telegram Mini App SDK (safe when not in Telegram)
try {
  init()
} catch {
  // Ignore when running outside Telegram
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
