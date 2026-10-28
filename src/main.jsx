import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import { CLIENT } from './lib/constants'
import './index.css'

// Client branding: page title + colour/font tokens (see src/clients/).
document.title = CLIENT.brand.title
if (CLIENT.brand.favicon) document.querySelector('link[rel=icon]')?.setAttribute('href', CLIENT.brand.favicon)
for (const [name, value] of Object.entries(CLIENT.theme)) {
  document.documentElement.style.setProperty(name, value)
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>
)
