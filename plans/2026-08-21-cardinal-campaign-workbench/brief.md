# Brief: Customer growth workspace

- Job: let a founder discover leads, assemble audiences, build and review outbound campaigns, manage company assets for agents, and understand channel outcomes in one workspace.
- Audience: approved Driftwood customers arriving from the dashboard.
- Primary action: move from Orange Slice lead discovery to a persisted audience and reviewed sequence without losing context.
- Success: discovery, audience membership, sequence order, company assets, and real contacted/opened/clicked/replied/booked outcomes are legible and drillable without leaving Driftwood.
- Marketing intent: false.
- Vibe: minimal, with the wildcard `operator canvas`.
- Inspiration: Cardinal's quiet operator shell, integrated lead panel, sequence canvas, and inline step metrics; Orange Slice powers server-side discovery rather than being visually embedded.
- Anti-reference: a dense CRM settings screen or a collection of equal-weight dashboard cards.
- Constraints: preserve Driftwood's existing tokens, typography, wordmark, safety language, review-first outbound model, tenant isolation, and existing Cardinal/Autosana settings.
- Delivery scope: persisted backend and authenticated frontend on the existing feature branches. Orange Slice credentials stay server-side; asset binaries use a storage adapter; metrics come from real workspace records or explicit zero-data states. None of these surfaces send outreach or mutate Cardinal/Autosana settings.
