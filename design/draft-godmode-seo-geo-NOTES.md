# Godmode SEO/GEO metrics page — integration notes (rev 2)

Companion to `draft-godmode-seo-geo.html`, **rev 2 per founder feedback
2026-07-21**. The draft is a full-page static mock populated with the real
current data: both v2 querysets (100 queries each, real tier splits), the
2026-07-21 v1 baseline joined in by query string (39 probed misses, 161
pending), the real GEO competitor counts, the SEO domain leaderboard
aggregated from `seo-results/latest.json` `top_domains`, and the real GSC
pull (0 / 4 / 2.3 / 2026-07-21).

## Rev 2 deltas (what changed from rev 1)

1. **Layout**: two columns at the top — SEO left, GEO right — each with its
   band-colored tier-1 headline number. Below them, the per-tier
   breakdowns (the collapsible tier rows ARE the breakdown). Below that,
   ONE combined trend chart with both lines; the two separate chart cards
   are gone.
2. **Text pruned**: run-zero explainer strip, long captions, methodology
   paragraphs, and coverage footnotes deleted. At most one short caption
   per panel; every surviving nuance moved into `title` tooltips (see
   "Tooltip contract" below). The page reads as numbers.
3. **No run UI**: no play button, no run-count emphasis. Probes run
   automatically daily at midnight Pacific (see "Scheduling" below). The
   only run-related UI is the footer's "last updated Jul 21, 2026" stamp
   (its tooltip states the schedule).
4. **SEO domain leaderboard added** next to the kept GEO competitor
   leaderboard, same visual treatment, driftwood pinned at top.
5. **Tier dropdowns restyled** to dashboard-table density (Leads.tsx
   conventions): 12.5–13px rows, hairline `rgba(line,.6)` separators,
   `align-middle` dots in a fixed 34px column, sand hover, no per-row
   domain text (tooltips carry it), no proxy-note paragraph. Tier summary
   rows: caret + name + thin progress track + `hits / total` + faint
   "n probed". All tiers default collapsed so the breakdown row stays
   compact; native `<details>`.
6. **Admin-only unchanged**: same `user.is_admin` gate and header pill.

## Combined chart key

- One SVG, one set of axes (0–100% tier-1 hit rate), faint band-zone
  fills with right-edge band labels, y gridlines at band thresholds.
- **SEO = solid tide (#15557e) line, filled tide dot markers.**
- **GEO = dashed ink (#16181b, 5 3 dash) line, hollow white-filled
  ink-stroked ring markers.**
- Double-encoded (color+fill AND line style) so coincident values stay
  readable: at run zero both are 0%, drawn as the SEO dot inside the GEO
  ring with a single "run zero · both 0%" label.
- Legend chips in the card header are mini inline SVG swatches (line +
  marker), labeled SEO / GEO.
- No second accent color: tide is the accent, ink is a text token — the
  GEO line reads as neutral data, per design-language "one accent".
- X axis is daily (probes run nightly), labeled every 4 days.
- A line never mixes runner tools; switching runners starts a new line
  (stated in the chart eyebrow's tooltip, not in copy).

## Scheduling (replaces the rev-1 probe-skill/manual-run section)

Probes are **backend-run, daily at midnight Pacific**. The backend probe
system already exists — `POST /api/v1/admin/probes/{kind}/run` — and the
backend has an in-app scheduler pattern to hang this on. **The scheduler
entry itself is new backend work**: a daily 00:00 America/Los_Angeles job
that fires the run endpoint for both kinds (`seo`, `geo`).

The scheduled run must also publish what the page reads:

- refresh the latest results the page fetches (the rev-1 data-location
  plan below still applies: artifacts under
  `landing/public/dashboard-metrics/{geo,seo}/`), and
- append one row per run to `history.json`
  (`{date, set_version, runner, tier1_hits, tier1_total, per_tier,
  total_hits, total}`) — the combined trend chart draws from these two
  ledgers (one per channel).

The `/geo-probe` and `/seo-probe` skills remain as manual/dev tools, but
the page carries no rerun affordance and no mention of them; cadence is
the scheduler's job. The footer stamp renders `history.json`'s last date.

## SEO domain leaderboard — data mapping

Source: `site/seo-results/latest.json` → `per_query[].top_domains`
(top-3 domains per probed keyword).

- Count appearances per domain across all probed queries (15 in the
  current artifact → 45 domain slots, 36 unique domains).
- Sort by count desc, first-appearance order as tiebreak.
- Show domains with count ≥ 2 (currently: salesforge.ai 3; instantly.ai,
  woodpecker.co, copyhackers.com, artisan.co, salesforce.com, aisdr.com,
  callboxinc.com at 2). Collapse the tail into one line:
  "28 more domains appeared once".
- Pin `driftwood.sh` at top in tide with count 0 (hit rows would count it
  like any domain once it appears).
- Bar widths relative to the max count. Same `.lb` component as the GEO
  competitor leaderboard (which keeps its rev-1 mapping: vendor
  appearance counts from `geo-results/latest.json` `competitors`, fixed
  16-vendor watch list, only vendors that appeared are listed).
- Subdomains are distinct on purpose (hubspot.com vs
  community.hubspot.com) — the artifact records literal domains.

## Tooltip contract (where the pruned prose went)

- SEO hero eyebrow: WebSearch-proxy disclaimer + v1-covered-15-of-100 +
  pending-not-miss rule.
- GEO hero eyebrow: runner tool + v1-covered-24-of-100 + pending rule.
- Band scales: band thresholds + next-milestone line (3 resp. 4 tier-1
  hits reaches 20%).
- Tier summaries: full tier description from the queryset + probed /
  pending counts.
- Table rows: `miss · top: <domains>` / `pending first run` /
  `hit · position N`.
- Chart eyebrow: one-line-per-channel + never-mix-runners rule.
- Leaderboard eyebrows: aggregation basis (top-3 across 15 SERPs; 24
  probed answers + watch-list note).
- GSC card: manual-pull caveat + interpretation + backlinks-registry
  pointer (BACKLINKS.md).
- Footer stamp: "probes run automatically every day at midnight Pacific".

Tooltips are `title` attrs in the draft; the React port can keep `title`
or use the dashboard's tooltip component if one lands — no new dependency
for this page.

## Entry point (unchanged from rev 1)

- `landing/src/Dashboard.tsx` (~line 254): the logged-in header renders
  `{user.is_admin && <GodModeButton />}` — add a sibling admin pill
  (`SEO / GEO`, tide-outline like `GodModeButton`) behind the same
  `user.is_admin` flag, linking to the new route.
- `is_admin` comes from `/auth/me`, which every dashboard page already
  fetches with the first-party cookie.

## Routing (unchanged from rev 1)

- No router: add a `lazy()` `SeoGeo.tsx` branch on
  `window.location.pathname === '/dashboard/seo-geo'` in
  `landing/src/main.tsx`.
- `isLanding` already excludes `/dashboard/*` (no PostHog init, no
  hydration); vercel.json's SPA catch-all + the `/dashboard(.*)` header
  rule (`X-Robots-Tag: noindex`, `X-Frame-Options: DENY`) apply for free.
- Page shell: Dashboard.tsx `AuthState` pattern; non-admins get the
  logged-out card. Wide-page width (`max-w-7xl`); draft is built at 1280.

## Where the JSON lives (unchanged from rev 1 — option A)

Copy artifacts into `landing/public/dashboard-metrics/{geo,seo}/`
(inherits the `/dashboard(.*)` noindex header; never linked publicly;
data is derived from public SERPs — the strategy framing is the only
mildly sensitive part, and an unguessable path segment is the escape
hatch if needed). The scheduled run owns keeping these fresh, plus
`history.json` per channel. The page joins queryset × latest client-side
by exact query string; v1 is a strict subset of v2, so pending rows fall
out naturally (verified 24/24 and 15/15 on the real data).

## Zero-state design (rev 2 form)

- Everything is zero because everything IS zero; no explainer strip —
  the band scale with its marker at 0 and the tooltip milestones carry
  the "starting line" framing.
- Unprobed v2 queries are pending (hollow dot), never misses; tier rows
  show "0 / 20" with "8 probed" beside.
- Both leaderboards pin a tide "driftwood 0" row over the gray field.
- The combined chart draws the five band zones and the single run-zero
  point — an axis waiting for dots.

## Design-language notes (carried from rev 1)

- Band colors are five functional status colors (like ok-green /
  error-red already in the dashboard), not accents; if the page ever
  reads as too much color, fallback is band color on headline number +
  chip only.
- Tide reserved for "us": SEO trend line, pinned leaderboard rows,
  active nav pill, tier progress fills.
- No em dashes in page copy; en dashes only as empty-value placeholders.
- Google Fonts `<link>` is draft-preview scaffolding; the app self-hosts
  (CSP `font-src 'self'` stays). The `data:` favicon link is likewise
  draft-only (the app has its own).
- Tables follow Leads.tsx conventions (13px, hairline rows, align-middle,
  ink-faint microcolumns) so the dropdowns match the dashboard's tables.

## Build checklist

- [ ] `landing/src/SeoGeo.tsx` — port the draft to Tailwind; native
      `<details>` tiers; inline SVG combined chart (no chart lib).
- [ ] Route branch in `landing/src/main.tsx` (`/dashboard/seo-geo`).
- [ ] Admin pill next to `GodModeButton` in Dashboard.tsx header.
- [ ] **Backend: scheduler entry** — daily 00:00 PT job firing
      `POST /api/v1/admin/probes/{kind}/run` for `seo` + `geo` (in-app
      scheduler pattern; endpoint exists, the entry is new).
- [ ] Run pipeline publishes artifacts + appends
      `dashboard-metrics/{geo,seo}/history.json`; seed history with run
      zero.
- [ ] SEO domain-leaderboard aggregation (client-side from latest.json
      per the mapping above); GEO competitor aggregation as in rev 1.
- [ ] Non-admin view: reuse the logged-out card pattern.
- [ ] Verify `X-Robots-Tag: noindex` on `/dashboard-metrics/...` in prod;
      confirm the SPA catch-all doesn't shadow the static JSON
      (filesystem wins on Vercel).
- [ ] Commit to main; Vercel deploys from the push. QA with scrolled
      screenshots; don't poll prod URLs.
- [ ] Later hooks (unchanged): PostHog AI-referrer panel (GEO), GSC API
      pull replacing the manual tag (SEO), BACKLINKS.md registry feeding
      the backlinks count.
