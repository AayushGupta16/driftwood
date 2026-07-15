/* eslint-disable react-refresh/only-export-components -- entry file, never hot-refreshed */
import './mock'
import { StrictMode, Suspense, lazy } from 'react'
import { createRoot } from 'react-dom/client'
import { Analytics } from '@vercel/analytics/react'
import './index.css'
import App from './App.tsx'
// dashboard pages are code-split: landing visitors only download the landing
const OgCard = lazy(() => import('./OgCard.tsx'))
const Dashboard = lazy(() => import('./Dashboard.tsx'))
const Leads = lazy(() => import('./Leads.tsx'))
const Companies = lazy(() => import('./Companies.tsx'))
const Review = lazy(() => import('./Review.tsx'))
// Pricing is parked for now; re-enable by restoring the route below.
// const Pricing = lazy(() => import('./Pricing.tsx'))

const path = window.location.pathname.replace(/\/+$/, '')
// const page = path === '/pricing' ? <Pricing /> : <App />
// /og renders the social card; screenshot it at 1200x630 (dpr 2) to refresh public/og-5.png
const page =
  path === '/og' ? (
    <OgCard />
  ) : path === '/dashboard/leads' ? (
    <Leads />
  ) : path === '/dashboard/companies' ? (
    <Companies />
  ) : path === '/dashboard/review' ? (
    <Review />
  ) : path === '/dashboard' ? (
    <Dashboard />
  ) : (
    <App />
  )

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Suspense fallback={null}>{page}</Suspense>
    <Analytics />
  </StrictMode>,
)
