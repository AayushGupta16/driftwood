/* eslint-disable react-refresh/only-export-components -- entry file, never hot-refreshed */
import './mock'
import { StrictMode, Suspense, lazy } from 'react'
import { createRoot, hydrateRoot } from 'react-dom/client'
import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/react'
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

const isLanding = !(path === '/og' || path === '/dashboard' || path.startsWith('/dashboard/'))
const root = document.getElementById('root')!
const tree = (
  <StrictMode>
    <Suspense fallback={null}>{page}</Suspense>
    <Analytics />
    <SpeedInsights />
  </StrictMode>
)

// prod index.html ships with the landing prerendered into #root (AI crawlers
// don't run JS — scripts/prerender.mjs puts the real content in the HTML).
// The landing hydrates it; app pages clear it and mount fresh. Dev serves an
// empty #root and falls through to a plain client render.
if (isLanding && root.firstElementChild) {
  hydrateRoot(root, tree)
} else {
  if (root.firstElementChild) root.innerHTML = ''
  createRoot(root).render(tree)
}
