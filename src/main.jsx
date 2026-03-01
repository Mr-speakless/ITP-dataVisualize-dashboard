import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
    <div className="text-3xl font-bold text-red-500">
      Tailwind v4 OK
    </div>
  </StrictMode>,
)
