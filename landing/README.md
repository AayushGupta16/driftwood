# Driftwood site and customer dashboard

React 19, TypeScript, and Vite power the marketing site and the authenticated
customer dashboard deployed on Vercel. The FastAPI/Neon control plane lives in
the separate `AayushGupta16/driftwood-backend` repository.

## Local development

```bash
npm install
npm run dev
```

The dashboard can run against deterministic browser-only fixtures without a
login or external write:

```text
http://127.0.0.1:4174/dashboard?mock=1
```

`?mock=1` intercepts the dashboard API in `src/mock.ts`. It does not call
Orange Slice, Neon, GCS, Cardinal, Autosana, or any outreach provider. Never
use mock mode as evidence that a backend migration works; use the isolated
Neon procedure in the backend review guide for that.

## Dashboard architecture

- `dashboard.html` is the lean customer-dashboard entry document.
- `admin.html` and `src/admin-main.tsx` are the separate internal admin entry,
  avoiding the customer bundle's route chain for Agents and Search visibility.
- `src/dashboard/AppShell.tsx` owns the responsive left sidebar, mobile focus
  trap, identity footer, and customer/admin navigation modes.
- `src/dashboard/WorkspacePage.tsx` owns auth/workspace resolution for the new
  customer pages.
- `src/audiences/` is the lead discovery and reusable audience library.
- `src/campaigns/` is the persisted, versioned sequence builder.
- `src/assets/` is the private image/video/link library.
- `src/analytics/` is the channel funnel and exact-person drilldown.
- Existing Leads, Companies, Review, Agents, and Search visibility pages are
  wrapped in the same shell without changing their backend contracts beyond
  the documented lead-audience field.

The route table is explicit in `src/main.tsx`. Customer navigation contains
Overview, Audiences, Campaigns, Metrics, All leads, Companies, Assets, and
Review queue. Agents and Search visibility exist only in the admin shell.
Internal dashboard destinations stay in the current browser tab; external
evidence, LinkedIn profiles, and asset URLs may open separately.

## Backend contracts

Vercel proxies `/api/*` and auth/provider paths to the backend so the signed
session cookie remains first-party. The new UI uses:

| UI | Backend contract |
| --- | --- |
| Audiences | `/api/v1/dashboard/audiences*` |
| Campaigns | `/api/v1/dashboard/campaigns*` |
| Assets | `/api/v1/dashboard/assets*` |
| Metrics | `/api/v1/dashboard/channel-metrics` |
| Leads | existing `/api/v1/dashboard/leads`, now including `audiences` |

The campaign activation dialog is intentionally explicit: activation freezes a
version and initializes planning ledgers, but does not queue or send outreach.
Open/click metrics render as unavailable because the current backend has no
defensible event source for them.

## Quality gate

```bash
npm test
npm run lint
npm run build
```

Browser QA covers desktop and mobile navigation, audiences, lead filtering,
campaign editing/activation, assets, metric drilldowns, admin gating, and the
same-tab review-queue transition. The full implementation rationale, visual
decisions, risks, and recorded evidence are in
`../plans/2026-08-21-cardinal-campaign-workbench/plan.md`.
