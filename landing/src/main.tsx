import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
// Pricing is parked for now; re-enable by restoring the route below.
// import Pricing from './Pricing.tsx'

// const page = window.location.pathname.replace(/\/+$/, '') === '/pricing' ? <Pricing /> : <App />
const page = <App />

createRoot(document.getElementById('root')!).render(
  <StrictMode>{page}</StrictMode>,
)
