# Anti-slop and implementation audit

## Scope

- Surface: generic product dashboard and campaign workbench.
- Marketing intent: false; universal product-UI rules apply.
- Reference influence: Cardinal's information architecture and sequencing ergonomics, not its branding or exact styling.

## Passed checks

- Driftwood's Public Sans / Source Serif typography and tide-blue token system are preserved.
- Icons are hand-built outlined SVGs; no icon package, emoji, or external artwork was added.
- No gradients, shader effects, excessive cards, oversized marketing copy, or full-screen snap sections.
- Sequence information is arranged as an operator workbench: contact rail, sequence canvas, and focused editor.
- Motion is limited to short CSS feedback transitions and includes `prefers-reduced-motion` overrides.
- Scrolling is native; mobile uses explicit Leads / Sequence / Editor panel switching.
- Campaign counts and lead state come from API responses; no fabricated performance metrics remain.
- Audience memberships appear directly in the lead database and remain distinct from ICP qualification.
- Open and click metrics render as unavailable rather than fabricated zeroes.
- Saving, frozen-version, and no-send behavior are stated persistently and again at activation.
- Contact rows are semantic checkbox controls in drafts and visibly locked enrollment rows in frozen versions.
- Dialogs are named, modal, focus their close action, and close with Escape.
- Customer and admin navigation are separate typed models rather than conditionally hiding internal rows after render.
- Admin chrome uses the existing custom outlined SVG vocabulary; no new icon dependency, emoji control, gradient, or decorative effect was introduced.
- The admin shell keeps one operational hierarchy: internal tool navigation, customer-workspace return, impersonation, then identity/logout.
- Internal workspace links reuse the current tab consistently; only external profiles, evidence, assets, and provider surfaces request a separate tab.
- Audience discovery now uses the studied table-and-docked-workbench anatomy without copying Cardinal's brand, type, color, code, or copy.
- Orange Slice remains explicit and visible as the selected discovery source; Workspace is presented as the alternate source instead of being hidden behind helper text.
- Search and Details are proper named tab panels. The query and filter controls have programmatic labels, visible focus states, and responsive keyboard-reachable controls.
- The audience builder keeps one persistent primary action, avoids nested cards, and uses no decorative imagery, gradients, or effect layer.

## Verification evidence

- Unit: 41/41 frontend tests pass.
- Static: ESLint and `git diff --check` pass.
- Build: TypeScript, Vite client/SSR, and prerender pass.
- Desktop E2E: a lead was selected, a LinkedIn sequence step was added, debounced autosave reached Saved, the activation disclosure was reviewed, and the active version rendered frozen.
- Mobile E2E: 390×844 rendering visually checked; the enrolled-lead panel shows the current step and the revision entry point remains reachable.
- Browser console: no warnings or errors during the persisted flow.
- Growth workspace E2E: saved a two-person discovered audience, filtered leads by audience, applied an audience to campaign enrollment, uploaded an image, saved a link asset, changed analytics channel, and drilled into a booked person.
- Backend: `make check` passed 818 tests; `make check-db` migrated PostgreSQL 17 from zero and passed all 197 DB tests.
- Accessibility and performance: Lighthouse scored 100 accessibility, 100 best practices, and 98 performance (LCP 2.27s, CLS 0.057, TBT 0ms). The mobile drawer traps focus, closes with Escape, restores focus, and makes its hidden navigation inert.
- Admin panel browser QA covered customer, admin, denied, canonical SEO/GEO, and impersonation-dialog states.
- Admin entry Lighthouse: 98 performance, 100 accessibility, 100 best practices, LCP 2.11s, CLS 0, and TBT 0ms.
- Cardinal-style audience builder: the local mock flow returned three Orange Slice leads, selected and saved one person, and reached the existing schedule/campaign handoff without touching live data.
- Cardinal-style responsive pass: desktop keeps the result table beside the search workbench; at 390×844, discovery controls move ahead of the horizontally contained result table with no page overflow.

## Safety boundary

The frontend calls only Driftwood's same-origin dashboard APIs. Orange Slice credentials remain backend-only and discovery is read-only; the integration neither embeds a privileged session nor mutates provider settings. The backend campaign data layer imports no outbound delivery path; activation is covered by a DB assertion that `review_items`, `scheduled_sends`, and `outbound_messages` remain empty. No new code calls Cardinal or changes Autosana settings. The `?mock=1` fixture is a local browser QA aid only.
