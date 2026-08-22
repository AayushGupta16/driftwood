---
name: cardinal-campaign-workbench
status: complete
priority: high
created: 2026-08-21
target: dashboard redesign
blockedBy: []
blocks: []
---

# Plan: Campaign workbench

## Source of truth

[brief.md](./brief.md) · [visual-direction.md](./visual-direction.md) · [audit.md](./audit.md)

## Goal

Add a persisted campaign workspace that makes Driftwood's lead sequencing legible and editable while preserving the existing approval-first outbound model. The branches must build, test, and pass a browser end-to-end flow without touching live campaign settings.

## Phases

| # | Phase | Status |
|---|---|---|
| 1 | Campaign domain, preview persistence, and custom icon vocabulary | complete |
| 2 | Shared tabbed shell and campaign index | complete |
| 3 | Three-pane sequence builder and review flow | complete |
| 4 | Automated tests, responsive polish, and audit | complete |
| 5 | Campaign persistence models, API, revisions, and safe lifecycle | complete |
| 6 | Authenticated frontend integration and persisted browser verification | complete |
| 7 | Persisted audiences and Orange Slice lead discovery adapter | complete |
| 8 | Company asset library, blob-storage adapter, and agent consumption contract | complete |
| 9 | Real channel metrics and person-level reply/demo drilldowns | complete |
| 10 | Shared left-sidebar shell, consolidated migration, and cross-feature E2E | complete |
| 11 | Separate customer navigation from the Driftwood admin control room | complete |
| 12 | Keep internal overview destinations in the current workspace tab | complete |
| 13 | Engineering review documentation and disposable Neon E2E gate | complete |
| 14 | Rebuild the customer overview as a connected operating brief | complete |
| 15 | Intent hardening: safe mocks, permissions, channel readiness, asset assignment, and truthful states | complete |
| 16 | Reduce dashboard copy and reorder Overview around the customer check-in flow | complete |
| 17 | Hand saved audiences into campaign scheduling with explicit active-lead overlap confirmation | complete |

## File ownership

| File | Owner phase | Action |
|---|---|---|
| `landing/src/campaigns/model.ts` | 1 | create |
| `landing/src/campaigns/icons.tsx` | 1 | create |
| `landing/src/campaigns/CampaignShell.tsx` | 2 | create |
| `landing/src/campaigns/Campaigns.tsx` | 2 | create |
| `landing/src/campaigns/CampaignBuilder.tsx` | 3 | create |
| `landing/src/campaigns/campaigns.css` | 2/3 shared integrator: phase 3 | create |
| `landing/src/main.tsx` | 2 shared integrator | modify |
| `landing/src/Dashboard.tsx` | 2 | modify |
| `landing/src/campaigns/model.test.ts` | 4 | create |
| Browser-controlled desktop/mobile flow | 4 | execute against local Vite app |
| Backend campaign models, migration, data layer, schemas, router, tests | 5 | create/modify on backend branch |
| `landing/src/campaigns/api.ts` | 6 | create |
| Campaign index, builder, model, styles, mocks, and tests | 6 | replace preview persistence with API state |
| `landing/src/audiences/`, audience backend modules and tests | 7 | create |
| `landing/src/assets/`, company-asset backend modules and tests | 8 | create |
| `landing/src/analytics/`, dashboard-metrics backend modules and tests | 9 | create |
| `landing/src/dashboard/`, shared routes/exports, one Alembic migration, mocks | 10 shared integrator | create/modify |
| Admin navigation model, admin shell variant, internal routes, and impersonation entry | 11 | create/modify |

## Success criteria

- [x] Campaigns are discoverable from the existing customer dashboard.
- [x] Campaign index supports status tabs, search, opening, and creating a draft.
- [x] Builder supports selecting, adding, editing, reordering, and deleting sequence steps.
- [x] Audience and contactable-lead enrollment state are visible alongside the sequence.
- [x] Review flow validates the campaign and freezes a persisted campaign version.
- [x] No campaign action can send outreach or mutate Cardinal or Autosana settings.
- [x] Desktop and 390px mobile layouts are usable with keyboard-visible focus.
- [x] Unit, lint, build, and browser-controlled checks pass.
- [x] Draft campaigns, steps, and selected leads persist through the authenticated API.
- [x] Active campaign versions are immutable; edits require a cloned draft revision.
- [x] Activation records enrollment state but does not queue or send outreach.
- [x] Campaign data is organization-scoped and mutations are audit logged.
- [x] Backend and frontend checks pass on their isolated feature branches.
- [x] Approved customers can discover leads through a server-side Orange Slice adapter and save selected people as a persisted audience.
- [x] Orange Slice credentials never reach the frontend, and the integration does not mutate Orange Slice organization settings.
- [x] Customers can upload image/video assets or add work links to an organization-scoped company library.
- [x] Agents have a tenant-scoped read contract for the assets associated with their company/workspace.
- [x] Metrics show defensible contacted, replied, and demos-booked totals by channel with exact-person drilldowns; untracked opens and clicks are explicitly unavailable.
- [x] Dashboard navigation uses a persistent left sidebar on desktop and an accessible drawer on mobile.
- [x] Leads expose reusable audience membership as a column and filter without changing the workspace ICP definition.
- [x] All feature slices pass focused tests, full frontend/backend checks, migrations from zero, and desktop/mobile browser E2E.
- [x] Customer navigation contains no Agents or Search visibility links.
- [x] Admins can enter a clearly separate panel with Agents and Search visibility navigation.
- [x] Admins can start impersonation from either the customer workspace or admin panel, and non-admin routes remain gated.
- [x] Overview links for leads, companies, and the review queue stay in the current tab; external resources retain explicit new-tab behavior.
- [x] Frontend, backend, database, backfill, rollout, and rollback contracts are documented for human and coding-agent review.
- [x] A disposable Neon child branch passes the real API journey, cleanup verification, migration downgrade/re-upgrade, and is deleted afterward.
- [x] Overview prioritizes the next real action, connects audience/campaign/asset/review readiness, and removes the legacy card wall.
- [x] Overview preserves channel connection controls, manual CSV imports, honest metrics, loading/error/empty states, and current-tab navigation.
- [x] Overview passes model tests, lint, build, desktop browser interaction QA, and the dashboard anti-slop audit.
- [x] Mock mode survives internal navigation and fails closed for unregistered API/auth requests.
- [x] Read-only members cannot mutate audiences, campaigns, assets, leads, companies, or review items, including direct campaign routes.
- [x] Campaign saves are serialized and optimistic-lock conflicts are surfaced instead of losing newer edits.
- [x] Campaign candidate search and analytics people drilldowns are paginated, with aggregate/detail fixtures reconciled.
- [x] Campaign activation requires qualified companies and per-step channel reachability without changing ICP state.
- [x] Overview leads with incomplete connections, today&rsquo;s sends, results, and quick-add actions; connected cards leave onboarding.
- [x] Customer page titles, action rows, card spacing, and utility disclosures use one compact visual system without repeated kickers or intros.
- [x] Asset dialogs are keyboard-modal and asset access can target all agents or an explicit selection.
- [x] Orange Slice materialization is bounded, rate-limited, provider-deduplicated, and never requests contact enrichment.
- [x] Unknown-company discoveries can remain in an audience for qualification, while review request, approval, and delivery all block them from outreach.
- [x] Impersonated review actions retain customer tenancy but attribute the decision and scheduled send to the real admin.
- [x] Audience membership stays non-exclusive, and saving an audience offers an immediate prefilled campaign handoff without reserving its leads.
- [x] Campaign activation and resume require confirmation for the exact selected leads already active in another campaign.

## Verification

- Frontend: 41 tests, ESLint, TypeScript, Vite client/SSR, and prerender all pass.
- Backend `make check`: Ruff, formatting, MyPy, and 850 non-DB tests pass (200 DB tests skipped by design).
- Backend `make check-db`: migrations apply from zero in disposable PostgreSQL 17 and all 200 DB tests pass.
- Disposable Neon E2E: upgraded an expiring production-shaped child branch to `a819c4e52f67`, created an audience, surfaced membership on Leads, activated a planning-only campaign, exposed a link asset to the correct relay-token agent, and drilled a booked demo to its exact lead. The test verified one pending step-run and zero review/scheduled-send rows, removed its `@test.invalid` fixture, downgraded to `cd2465658393`, re-upgraded to head, and deleted the branch.
- Live provider boundary: a server-side Orange Slice search returned people without requesting or exposing email/phone enrichment fields.
- Growth-workspace browser E2E: discovered three leads, selected two into a saved audience, filtered the lead database by audience, applied a one-person audience to a campaign, uploaded an image, saved a link, and opened the exact person behind a booked demo.
- Production Lighthouse: performance 98, accessibility 100, best practices 100, LCP 2.27s, CLS 0.057, and TBT 0ms.
- Admin control-room E2E: non-admin customer navigation omitted both internal tools; admin customer navigation exposed Admin panel and Impersonate user; the admin shell exposed only Agents and Search visibility; direct non-admin access rendered the denied state; the impersonation dialog opened and closed successfully.
- Admin production entry: dedicated `/admin.html` routing removes the dashboard lazy-load chain. Lighthouse scored performance 98, accessibility 100, best practices 100, LCP 2.11s, CLS 0, and TBT 0ms.
- Internal-navigation contract: overview entry links no longer declare `target="_blank"`; browser QA verifies the link targets `/dashboard/review`, declares no target, and clicking does not increase the tab count.
- Final mock browser gate: all customer routes render in the shared shell without Agents/Search visibility; a discovered lead saves into a new audience; a link saves into Assets; Review Queue keeps one tab; and console warning/error logs are empty.
- Persisted browser E2E at 1280×720: selected a real API-shaped lead, added a sequence step, observed Saving → Saved, reviewed the activation disclosure, and verified the frozen active version.
- Persisted browser E2E at 390×844: enrolled-lead panel, current step, frozen controls, and revision entry point verified; no console warnings or errors.
- Safety check: the campaign API never creates `review_items`, `scheduled_sends`, or `outbound_messages`; its DB test asserts all three remain empty after activation.
- Overview rebuild: 27 frontend tests, ESLint, TypeScript, client/SSR production builds, and `git diff --check` pass. A clean in-app browser session rendered the computed review priority, persisted campaign, funnel, readiness ledger, channels, and expandable CSV tools with no console warnings or errors. The priority link has no `target`, so it retains current-tab workspace navigation.
- Intent-hardening browser gate: mock state remained sticky across navigation; metric totals reconciled to 6 contacted, 2 replied, and 1 booked person; X replies rendered unavailable; disconnected email blocked activation; a direct read-only campaign-create route rendered the denied state; the asset assignment dialog trapped focus, closed on Escape, restored focus, and fit at 390×844 without document overflow. A clean QA tab emitted no console warnings or errors.
- Dashboard anti-slop audit: no emoji, icon-library dependency, viewport-locked shell, decorative gradient, or broad `transition: all` was introduced in the changed workspace surfaces.
- Audience scheduling E2E: a saved audience opened the keyboard-modal scheduling prompt, the resulting mock draft survived full navigation with the selected audience prefilled, a second campaign surfaced three exact active-lead conflicts, activation remained disabled until confirmation, and the confirmed planning-only activation completed. The 390&times;844 prompt had zero horizontal overflow.

## Overview rebuild extension

The first shell pass moved the dashboard into the left-sidebar workspace, but the overview interior still retained the old sequence of oversized connection cards and repetitive destination cards. Phase 14 replaces that interior with an asymmetric operating brief driven entirely by existing authenticated read APIs. It does not add a backend write, enqueue outreach, or alter provider settings.

## Intent-hardening extension

Phase 15 keeps the locked Workbench shell and corrects interaction contracts exposed by review. Its job is not visual restyling: explicit mock mode must remain isolated across every internal transition; read-only members must never see mutation affordances; data errors must not masquerade as empty libraries; campaign readiness must reflect required channel connections; asset dialogs must behave as keyboard-modal surfaces; and company assets must disclose and control which agents may retrieve them.

### Intent-hardening pre-emit verification

This is a component/system-state extension of the existing dashboard run, so the component-scope verification subset applies. The visual effect layer remains intentionally none: safety and state clarity are the visual priority.

```yaml
<design_plan>
  vibe_validity:
    anchor: "minimal"
    wildcard: "operator canvas"
    contradiction: false
    valid: true
  motion_personality:
    name: "Corporate"
    intensity: "1/3"
    override_logged: true
  button_contrast:
    eight_states_planned: ["default", "hover", "focus", "active", "disabled", "loading", "error", "success"]
    focus_ring_visible: true
    contrast_aa_pass: true
  honest_copy:
    fabricated_metrics: 0
    mock_aggregate_detail_reconciled: true
    errors_distinct_from_empty: true
    permissions_visible_in_copy: true
  effects_layer: "none; preserve the flat operational hierarchy"
</design_plan>
```

## Phase 16 · dashboard clarity pass

The customer overview now follows the order operators repeatedly ask for: finish channel setup, inspect today&rsquo;s sends, read results, then add more work. Setup cards render in one compact row and leave the primary flow once connected; connected-account controls remain available in a collapsed utility. Repeated kickers, explanatory intros, workflow teaching panels, and persistent campaign-system notices are removed across the customer workspace.

```yaml
<design_plan>
  page_job: "Show connection readiness, today's sends, results, and the fastest way to add work"
  macrostructure: "existing Workbench shell with a compact operating stack"
  vibe:
    anchor: "minimal"
    wildcard: "operator canvas"
    valid: true
  spatial_system:
    desktop: "setup row -> sending ledger -> results -> action rail -> campaigns -> collapsed utilities"
    mobile: "single column with setup and sending first"
  motion:
    personality: "Corporate"
    intensity: "1/3"
    easing: "cubic-bezier(0.2, 0, 0, 1)"
  interaction_states:
    button_states: ["default", "hover", "focus", "active", "disabled", "loading", "error", "success"]
  honest_copy:
    fabricated_metrics: 0
    sending_source: "authenticated dashboard summary and activity APIs"
    unavailable_states: "remain explicit rather than displaying a false zero"
  effects_layer: "none; added effects would compete with operational clarity"
  custom_icons: "existing outlined Driftwood SVG vocabulary; no icon package or emoji"
</design_plan>
```

## Phase 17 · audience handoff and overlap confirmation

Audience membership remains reusable and non-exclusive: saving a lead list never reserves a person or blocks another list. A saved audience prompts the operator to build a prefilled campaign. When that campaign becomes active, the backend checks the selected people against other active campaigns and requires a deliberate confirmation before allowing overlapping outreach.

```yaml
<design_plan>
  vibe_validity:
    anchor: "minimal"
    wildcard: "operator canvas"
    contradiction: false
    valid: true
  motion_personality:
    name: "Corporate"
    intensity: "1/3"
    override_logged: true
  button_contrast:
    eight_states_planned: ["default", "hover", "focus", "active", "disabled", "loading", "error", "success"]
    focus_ring_visible: true
    contrast_aa_pass: true
  honest_copy:
    fabricated_metrics: 0
    overlap_source: "organization-scoped active campaign enrollments"
    audience_claim: "membership does not imply scheduled outreach"
  effects_layer: "none; an atmospheric layer would compete with the safety decision"
</design_plan>
```

## Phase 18 · explicit discovery source and unified review queue

Lead discovery names its source before the operator searches. Orange Slice is
the default provider, its server-side connection state is visible, and the
workspace lead index remains an explicit fallback instead of a silent one.
Review keeps every existing decision and send-control path, but moves from its
legacy phone-width card stack into the same full-width operating canvas as the
rest of the customer dashboard.

```yaml
<design_plan>
  page_job: "Find leads through a named provider and decide what is allowed to send"
  macrostructure: "82rem workspace canvas; compact page header -> status/tabs -> filters/actions -> dense decision rows"
  vibe:
    anchor: "minimal"
    wildcard: "operator canvas"
    valid: true
  spatial_system:
    audience: "provider selector above the existing focused filter and result table"
    review: "full-width queue with a compact runway strip and wider decision rows"
    mobile: "controls wrap; rows return to a single-column reading order"
  motion:
    personality: "Corporate"
    intensity: "1/3"
    easing: "cubic-bezier(0.2, 0, 0, 1)"
  interaction_states:
    provider: ["checking", "connected", "unavailable", "selected"]
    queue: ["loading", "ready", "empty", "error", "busy"]
    button_states: ["default", "hover", "focus", "active", "disabled", "loading", "error", "success"]
  honest_copy:
    silent_provider_fallbacks: 0
    fabricated_metrics: 0
    source_of_truth: "authenticated discovery-status, reviews, and scheduled-sends APIs"
  effects_layer: "none; operational state and copy are the visual hierarchy"
  custom_icons: "extend the existing outlined SVG vocabulary with an Orange Slice mark"
</design_plan>
```

## Phase 19 · Cardinal-style audience search workbench

The live Cardinal lead finder was inspected read-only. Its useful design DNA is
the persistent people table plus a docked Search/Details workbench, not its
brand palette. Driftwood adopts that anatomy while preserving explicit Orange
Slice status, reusable audience membership, permissions, and the existing
post-save campaign handoff.

```yaml
<design_plan>
  macrostructure_diversification:
    last_3: ["Workbench", "Workbench"]
    pick: "Workbench"
    differs_from_last_3: false
    diversification_rule_pass: true
    studied_dna_override: "user explicitly requested Cardinal audience-builder anatomy"
  vibe_validity:
    anchor: "minimal"
    wildcard: "operator canvas"
    contradiction: false
    valid: true
  dial_alignment:
    design_variance: 4
    visual_density: 9
    existing_direction_preserved: true
    macrostructure_within_pm_2: true
  motion_personality:
    name: "Corporate"
    intensity: "1/3"
    override_logged: true
  hero_math:
    applicable: false
    universal_4plus_ban_pass: true
  bento_density:
    applicable: false
  label_sweep:
    meta_labels_found: 0
    long_document_exception: false
    pass: true
  button_contrast:
    eight_states_planned: ["default", "hover", "focus", "active", "disabled", "loading", "error", "success"]
    focus_ring_visible: true
    contrast_aa_pass: true
  honest_copy:
    fabricated_metrics: 0
    provider_status_source: "authenticated discovery-status API"
    search_results_source: "selected Orange Slice or workspace provider"
  gsap_decision:
    intensity: "1/3"
    gsap_needed: false
    skills_route: "n/a"
  effects_layer: "none; dense data workbenches benefit from flat operational hierarchy"
</design_plan>
```

## Phase 20 · implicit Orange Slice search and CSV import

The wider Cardinal comparison clarifies that discovery and import are separate
jobs. Cardinal keeps its lead finder focused on search, then exposes CSV under
an Add contacts action in the contact library. Driftwood will use Orange Slice
implicitly for audience discovery and expose a compact CSV upload action in the
same workbench without presenting the lead database as a competing provider.

```yaml
<design_plan>
  macrostructure_diversification:
    last_3: ["Workbench", "Workbench"]
    pick: "Workbench"
    differs_from_last_3: false
    diversification_rule_pass: true
    studied_dna_override: "continuation of the user-requested Cardinal workflow study"
  vibe_validity:
    anchor: "minimal"
    wildcard: "operator canvas"
    contradiction: false
    valid: true
  dial_alignment:
    design_variance: 4
    visual_density: 8
    existing_direction_preserved: true
    macrostructure_within_pm_2: true
  motion_personality:
    name: "Corporate"
    intensity: "1/3"
    override_logged: true
  hero_math:
    applicable: false
    universal_4plus_ban_pass: true
  bento_density:
    applicable: false
  label_sweep:
    meta_labels_found: 0
    long_document_exception: false
    pass: true
  button_contrast:
    eight_states_planned: ["default", "hover", "focus", "active", "disabled", "loading", "error", "success"]
    focus_ring_visible: true
    contrast_aa_pass: true
  honest_copy:
    fabricated_metrics: 0
    discovery_source: "authenticated Orange Slice provider status and search API"
    import_source: "existing authenticated CSV lead import endpoint"
  gsap_decision:
    intensity: "1/3"
    gsap_needed: false
    skills_route: "n/a"
  effects_layer: "none; import and search state supply the hierarchy"
</design_plan>
```

### Overview page-purpose and pre-emit verification

This is an extension of the existing Workbench run rather than a new standalone page run. It keeps the logged minimal/operator-canvas direction and introduces a distinct internal anatomy: priority brief, pipeline ledger, outbound path, activity, compact channel controls, and an optional manual-import drawer.

```yaml
<design_plan>
  page_purpose:
    job: "Show the customer what moved, what is blocked, and what to do next"
    audience: "Approved Driftwood workspace members"
    primary_action: "Resolve the highest-priority real workflow state"
    success: "A customer can orient and enter the right audience, campaign, review, metric, or asset surface in one decision"
    marketing_intent: false
  macrostructure: "existing Workbench shell with an asymmetric operating-brief interior"
  vibe:
    anchor: "minimal"
    wildcard: "operator canvas"
    valid: true
  spatial_system:
    desktop: "priority brief + 8/4 pipeline and attention split + lifecycle ledger"
    mobile: "single flow with the priority action before metrics and controls"
    card_rule: "bounded panels only for operational grouping; no equal-card destination wall"
  motion:
    personality: "Corporate"
    intensity: "1/3"
    easing: "cubic-bezier(0.2, 0, 0, 1)"
  interaction_states:
    button_states: ["default", "hover", "focus", "active", "disabled", "loading", "error", "success"]
    network_states: ["loading", "ready", "partial error", "empty"]
  honest_copy:
    fabricated_metrics: 0
    data_sources: ["dashboard summary", "dashboard activity", "saved audiences", "campaign summaries", "company assets"]
  effects_layer: "none; the existing flat paper/surface hierarchy remains functional"
  custom_icons: "existing Driftwood outlined SVG vocabulary; no icon dependency or emoji"
  gsap_decision:
    needed: false
    reason: "Corporate motion at 1/3 needs only existing CSS state transitions"
</design_plan>
```

## Risks

| Risk | Mitigation |
|---|---|
| An active campaign is mistaken for a live sending surface | Persistent approval-path banner and explicit no-send copy in activation review |
| Builder UI outruns the backend model | Typed snake-case API adapter with shared lifecycle and validation tests |
| Dense canvas becomes unusable on mobile | Switchable Flow, leads, and editor panels under 760px |
| Editing loses work | Debounced authenticated autosave with explicit saving, saved, and error states |
| Activation is mistaken for authorization to send | Activation only freezes a campaign version and initializes enrollment ledgers; it never creates review items, scheduled sends, or outbound messages |
| Active edits make execution nondeterministic | Active versions are immutable; a revision clones them into a new draft version |
| Lead selection crosses workspace boundaries | Available and enrollable leads come only from the existing organization-scoped `contactable_leads` query |

## Persistence extension contract

The persistence branch replaces the preview store with four database tables:

- `campaigns` owns immutable versions in a campaign series and carries lifecycle state.
- `campaign_steps` stores the ordered sequence definition for one version.
- `campaign_enrollments` binds contactable leads to that exact version.
- `campaign_step_runs` is the future execution ledger. Activation initializes the first pending run, but does not create review items or sends.

API lifecycle:

- Drafts may update metadata, replace steps, and replace selected leads atomically.
- `draft -> active` validates the definition, freezes the version, and initializes enrollment state.
- `active -> paused -> active` controls campaign readiness only; it does not dispatch work.
- Editing an active or paused version requires creating a revision with the same series id and the next version number.
- Future execution may turn a due step run into a `review_item`; only the existing approval path may create a `scheduled_send` and later an `outbound_message`.

No endpoint in this extension talks to Cardinal, modifies Autosana, or sends outreach.

## Growth workspace extension contract

- `audiences` and `audience_members` persist a workspace-owned snapshot of selected people. Discovery is read-only and routed through a backend Orange Slice provider using centrally configured `ORANGESLICE_API_KEY`; the browser never receives that credential.
- Orange Slice is not iframe-embedded. A native Driftwood lead-list UI calls a narrow search contract so tenant policy, failure states, pagination, and saved membership remain under our control.
- `company_assets` stores tenant/company ownership, media metadata, optional source links, and opaque blob keys. A storage adapter handles upload/delete/read URLs; the agent-facing query returns only assets visible to the authenticated workspace.
- Metrics aggregate existing outbound, reply, and meeting records. Missing event coverage must show zero or an explicit unavailable definition, never an invented conversion.
- Shared exports, router registration, routes, mocks, and one consolidated migration are integrated centrally after the three isolated feature slices finish.

## Admin control-room extension contract

- The customer shell contains only customer work: overview, audiences, campaigns, metrics, leads, companies, assets, and review.
- Agents and SEO/GEO remain admin-gated internal tools and move into an explicit admin shell under `/dashboard/admin`.
- Admins see entry points for both the admin panel and impersonation; impersonated sessions keep the existing exit banner.
- Legacy internal URLs remain compatible, but all new in-app links use the admin namespace.
- This is an information-architecture extension of the existing Workbench run. It preserves the locked minimal/operator-canvas direction, Corporate motion at 1/3, native scrolling, custom SVG icons, and no visual-effect layer.

### Admin page-purpose and pre-emit verification

```yaml
page_purpose:
  job: "Navigate and display internal operational data"
  audience: "Authenticated Driftwood admins"
  primary_action: "Move between agent operations, search visibility, and user impersonation"
  success: "No internal tool appears in customer navigation; admins retain fast access"
  marketing_intent: false
design_plan:
  macrostructure: "existing Workbench shell with an explicit admin mode"
  vibe_validity:
    anchor: "minimal"
    wildcard: "operator canvas"
    contradiction: false
    valid: true
  motion_personality:
    name: "Corporate"
    intensity: "1/3"
    override_logged: true
  button_contrast:
    states: ["default", "hover", "focus", "active", "disabled", "loading", "error", "success"]
    focus_ring_visible: true
    contrast_aa_pass: true
  honest_copy:
    fabricated_metrics: 0
    placeholders_required: 0
```

## Growth workspace pre-emit verification

This is an extension of the same product/workbench design run, not a new standalone page run, so the existing Workbench macrostructure and `.perfect-ui/log.json` entry remain the diversification record.

```yaml
<design_plan>
  macrostructure: "existing Workbench expanded with persistent left-sidebar app shell"
  vibe:
    anchor: "minimal"
    wildcard: "operator canvas"
    valid: true
  spatial_system:
    desktop: "15rem fixed sidebar + fluid work surface"
    mobile: "compact masthead + modal navigation drawer"
    page_modes: ["lead data grid", "asset library", "metric funnel + people drilldown", "campaign canvas"]
  motion:
    personality: "Corporate"
    intensity: "1/3"
    easing: "cubic-bezier(0.2, 0, 0, 1)"
  interaction_states:
    button_states: ["default", "hover", "focus", "active", "disabled", "loading", "error", "success"]
    network_states: ["loading", "saving", "saved", "error", "empty"]
  honest_copy:
    fabricated_metrics: 0
    discovery_source: "Orange Slice through server-side adapter"
    metric_source: "organization-scoped outbound/reply/meeting records"
  effects_layer: "none"
  custom_icons: "reuse and extend Driftwood's outlined SVG vocabulary; no icon package or emoji"
</design_plan>
```

## Persistence pre-emit verification

```yaml
<design_plan>
  macrostructure: "existing three-pane Workbench; no new page archetype"
  vibe:
    anchor: "minimal"
    wildcard: "operator canvas"
    valid: true
  motion:
    personality: "Corporate"
    intensity: "1/3"
    easing: "cubic-bezier(0.2, 0, 0, 1)"
  interaction_states:
    button_states: ["default", "hover", "focus", "active", "disabled", "loading", "error", "success"]
    network_states: ["loading", "saving", "saved", "error", "empty"]
  honest_copy:
    fabricated_metrics: 0
    data_source: "authenticated campaign and contactable-lead APIs"
    activation_disclosure: "freezes the version; does not queue or send outreach"
  effects_layer: "none"
  custom_icons: "reuse the existing outlined campaign SVG vocabulary"
</design_plan>
```

## Pre-emit verification

```yaml
<design_plan>
  macrostructure_diversification:
    last_3: ["Workbench"]
    pick: "Workbench"
    differs_from_last_3: false
    override_logged: true
    diversification_rule_pass: true
  vibe_validity:
    anchor: "minimal"
    wildcard: "operator canvas"
    contradiction: false
    valid: true
  dial_alignment:
    design_variance: 5
    visual_density: 9
    workbench_default_diff: [1, 2]
    macrostructure_within_pm_2: true
  motion_personality:
    name: "Corporate"
    vibe_default_match: false
    override_logged: true
  hero_math:
    applicable: false
    universal_4plus_ban_pass: true
  bento_density:
    applicable: false
  label_sweep:
    meta_labels_found: 0
    long_document_exception: false
    pass: true
  button_contrast:
    eight_states_planned: ["default", "hover", "focus", "active", "disabled", "loading", "error", "success"]
    focus_ring_visible: true
    contrast_aa_pass: true
  honest_copy:
    fabricated_metrics: 0
    fixture_data_label: "Mock data is limited to the explicit ?mock=1 QA mode"
    placeholders_required: 0
  gsap_decision:
    intensity: "1/3"
    gsap_needed: false
    skills_route: "n/a"
</design_plan>
```

## Phase 21 · feedback reconciliation

This pass keeps the existing Workbench direction and changes only the operating surfaces named in product feedback: account visibility and email volume on Overview, audience-only campaign enrollment, centered impersonation status, and audio assets.

```yaml
<design_plan>
  macrostructure: "existing Workbench shell; no new page archetype"
  vibe_validity:
    anchor: "minimal"
    wildcard: "operator canvas"
    contradiction: false
    valid: true
  motion_personality:
    name: "Corporate"
    intensity: "1/3"
    override_logged: true
  button_contrast:
    eight_states_planned: ["default", "hover", "focus", "active", "disabled", "loading", "error", "success"]
    focus_ring_visible: true
    contrast_aa_pass: true
  honest_copy:
    fabricated_metrics: 0
    data_sources: ["authenticated connection state", "outbound-message ledger", "saved audience membership", "validated asset MIME type"]
    unavailable_value: "Not connected"
  effects_layer: "none"
  custom_icons: "extend the existing outlined Driftwood SVG vocabulary for audio"
</design_plan>
```

### Phase 21 verification

- Browser QA passed at 1440×1000 and 390×844 for Overview, Campaign Builder, and Assets.
- Account state, email volume, audience membership, and audio formats all render from explicit API or mock fields; no metric was fabricated.
- The generic-dashboard anti-slop audit found no new icon-library imports, viewport-locked shells, decorative gradients, generic easing, or broad `transition: all`.
