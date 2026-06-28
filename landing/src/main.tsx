import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import OgCard from './OgCard.tsx'
import Dashboard from './Dashboard.tsx'
import Leads from './Leads.tsx'
// Pricing is parked for now; re-enable by restoring the route below.
// import Pricing from './Pricing.tsx'

const path = window.location.pathname.replace(/\/+$/, '')
// const page = path === '/pricing' ? <Pricing /> : <App />
// /og renders the social card; screenshot it at 1200x630 to refresh public/og.png
const page =
  path === '/og' ? (
    <OgCard />
  ) : path === '/dashboard/leads' ? (
    <Leads />
  ) : path === '/dashboard' ? (
    <Dashboard />
  ) : (
    <App />
  )

createRoot(document.getElementById('root')!).render(
  <StrictMode>{page}</StrictMode>,
)
