import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import OgCard from './OgCard.tsx'
// Pricing is parked for now; re-enable by restoring the route below.
// import Pricing from './Pricing.tsx'

// const page = window.location.pathname.replace(/\/+$/, '') === '/pricing' ? <Pricing /> : <App />
// /og renders the social card; screenshot it at 1200x630 to refresh public/og.png
const page = window.location.pathname.replace(/\/+$/, '') === '/og' ? <OgCard /> : <App />

createRoot(document.getElementById('root')!).render(
  <StrictMode>{page}</StrictMode>,
)
