# Redesign audit: Driftwood dashboard

## Current state

- Vibe: quiet, trustworthy customer dashboard built from discrete cards.
- Palette: white ground, cool gray ink scale, tide-blue accent.
- Typography: Public Sans UI with Source Serif 4 in the wordmark.
- Layout: account status, result/pipeline card, lists card, then links to leads, companies, and review.
- Motion: CSS-only utility transitions.
- Icons: custom inline SVG.

## Keep

1. Tide-blue single-accent system and visible focus rings.
2. Existing approval queue and safe-send language.
3. Public Sans UI, Source Serif wordmark, hairline borders, and restrained shadows.

## Remove or reduce

1. Home-page card wall as the only organizing principle.
2. Repeated page-specific headers that make the dashboard feel like separate tools.
3. Links that open operational pages in new tabs by default.
4. Sequence information spread between leads, review, and queued-send pages.
5. Large empty areas that do not help the operator understand next action.

## Phase 14 overview finding

The shared shell is complete, but the overview interior still exhibits the pre-redesign information architecture: channel setup dominates the first viewport, four repeated destination cards duplicate the sidebar, and the new audience/campaign/asset lifecycle is not summarized. Preserve all underlying controls and real summary data, but move them into a priority-led operating brief. Keep manual CSV import available as a secondary expandable tool instead of making it the page's main structure.

## Phase 14 final audit

- Result: pass for the generic dashboard rule set; no Tier 1 or Tier 2 findings introduced.
- Macrostructure: the customer shell remains the logged Workbench run, while the overview interior now uses an asymmetric operating brief instead of a destination-card wall.
- Honest data: priority, funnel, readiness, campaigns, and activity use authenticated APIs. The named records and counts visible under `?mock=1` are explicit QA fixtures, not production claims.
- Typography and color: existing Public Sans, IBM Plex Mono, paper/surface/ink/tide tokens, and the single tide accent remain intact.
- Icons and effects: no icon package, emoji icon, 3D layer, glow, glassmorphism, or decorative effect was added.
- Motion: CSS state transitions retain the Corporate 1/3 timing and reduced-motion fallback; there is no scroll or animation library.
- Accessibility: the view retains semantic regions and headings, descriptive current-tab links, visible focus rings, labeled loading/error states, and a native keyboard-operable details disclosure.
- Responsive behavior: the 8/4 and 3/2 desktop splits collapse to one column; the four-step ledger becomes two columns and then a single flow; campaign metadata and import controls reduce without horizontal overflow.

## Phase 15 review findings

- Explicit `?mock=1` was a page-load switch rather than a sticky QA boundary. Queryless internal links and campaign history replacement could reload without the mock interceptor and reach live APIs.
- Mock channel totals did not reconcile with their exact-person drilldowns, even while the UI claimed every observed outcome was attributed.
- Campaign copy/readiness validation did not include the workspace's connected channels, so an email sequence could present as ready while email was disconnected.
- Asset composers visually resembled modals but left focus on the background trigger and handled Escape only when focus happened to be inside the dialog.
- Audience, asset, and campaign load errors left empty arrays behind, causing outage and empty-library messages to render together.
- Read-only membership was enforced on legacy leads, companies, and review surfaces, but the new campaign, audience, asset, and sidebar creation affordances did not yet share that permission model.
- Company assets were workspace-scoped but did not expose agent assignment, leaving customers unable to inspect or restrict which agents could retrieve an asset.

Keep the current palette, typography, custom icons, sidebar anatomy, native scrolling, and Corporate 1/3 motion. Replace ambiguous or unsafe states, not the established visual language.

## Phase 15 final audit

- Result: the review findings are resolved without changing the established Workbench visual direction.
- Safety: mock mode is sticky and fail-closed, member permissions cover direct routes, campaign activation checks connected channels and qualified-company eligibility, and campaign autosave uses serialized optimistic locking.
- Truthfulness: aggregate metrics reconcile with exact-person drilldowns; unsupported X replies, opens, and clicks remain unavailable instead of appearing as zero.
- Scale: campaign candidates and analytics people use paginated contracts rather than unbounded workspace payloads.
- Assets: upload reads are capped, spooled, streamed, and file-identified; deletion is tombstone-first with retry state and no storage I/O under a database lock; paused agents are gated; and customers can choose all-agent or selected-agent access.
- Audience/ICP boundary: newly discovered unknown-company leads remain visible in reusable lists with a “Needs qualification” state, while only explicitly qualified members enter campaigns or any review/send path.
- Accessibility: native asset dialogs move focus inside, close on Escape, restore the trigger, expose visible focus, and remain contained at 390px width.
- States: load failures no longer co-render empty-library copy, and disconnected channels/read-only access use explicit blocking copy.
- Visual integrity: the final scan found no emoji, icon dependency, decorative gradient, viewport-locked shell, or broad `transition: all` in the changed dashboard surfaces.

## Scope

Reposition the customer dashboard as a growth workspace while preserving Driftwood's visual identity. The paired feature branches introduce a campaign-centered shell, saved audiences, server-side Orange Slice discovery, organization-scoped assets, honest channel analytics, persisted versioned campaign definitions, and an inert execution ledger without changing backend delivery behavior.

## Persistence audit

- Draft metadata, ordered steps, and selected contactable leads save through the authenticated API.
- Active versions are read-only; the next edit clones a new draft revision in the same series.
- Activation initializes `ready` enrollments and one `pending` first-step ledger row per lead.
- No campaign route creates a review item, scheduled send, outbound message, provider request, or lead-stage change.
- All writes use the workspace write gate, organization scoping, trigger-filled `org_id`, and append-only audit events.
- The frontend exposes loading, saving, saved, error, empty, frozen, and action-in-progress states.

## Audience and ICP boundary

- An audience is a reusable, organization-scoped snapshot of selected leads; one lead may belong to multiple audiences.
- The Leads table exposes those memberships as a dedicated column, includes them in search, and can filter by audience.
- Saving or refreshing an audience does not rewrite the workspace ICP. ICP remains the qualification definition; audiences remain outreach segments.
- Provider discovery is ephemeral. Only selected results are materialized into company, lead, and audience-member records.

## Assets and analytics boundary

- Image/video uploads use an injectable private-blob adapter; link assets and metadata are organization scoped and soft deletable.
- Agent reads use a tenant-scoped relay-token contract and authenticated content endpoint.
- Contacted, replied, and booked counts derive from existing workspace events. Open/click are rendered unavailable because the current event model cannot support them defensibly.

## Admin navigation boundary

- Search visibility and agent fleet operations are Driftwood-internal surfaces, not customer workspace features.
- Customer navigation should not advertise or imply access to either tool.
- Admins need one explicit control-room namespace containing Agents and Search visibility, plus a direct impersonation action.
- Existing admin-only frontend and backend authorization checks remain the access boundary; the shell separation is information architecture, not a replacement for authorization.
