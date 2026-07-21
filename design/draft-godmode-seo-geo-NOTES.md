# Godmode SEO/GEO metrics page — integration notes (rev 4)

Companion to `draft-godmode-seo-geo.html`, **rev 4 per founder direction
2026-07-21** (revs 2 and 3 landed the same day; their deltas are kept
below). The draft is a full-page static mock populated with the real
current data: both v2 querysets (100 queries each, real tier splits), the
2026-07-21 v1 baseline joined in by query string (39 probed misses, 161
pending), the real GEO competitor counts, the SEO domain leaderboard
aggregated from `seo-results/latest.json` `top_domains`, and the real GSC
pull (0 / 4 / 2.3 / 2026-07-21) — now a footnote, not a panel.

## Rev 4 delta (what changed from rev 3)

Founder direction, verbatim: "I just care about the number of views and
conversions each channel drives."

1. **Ground truth strip restructured into two channel blocks** — SEO
   left, GEO right — on the same 1fr / 1fr / 14px grid as the probe
   columns beneath, so each block sits directly over its channel's hero.
   Each block shows exactly two numbers:
   - **Views** — PostHog sessions attributed to the channel by referring
     domain (SEO: google, bing; GEO: chatgpt.com, chat.openai.com,
     perplexity.ai, claude.ai, gemini.google.com,
     copilot.microsoft.com). Currently 0 and 0.
   - **Demos booked** — `booking_confirmed` events, same referrer
     attribution. Currently 0 and 0.
   Every number keeps its vs-last-week delta slot. **Attribution rule
   (stated in tooltips): the session's referring domain decides the
   channel — anything from an AI-assistant domain is GEO, search-engine
   domains are SEO.** The heavy rev-3 treatment (2px ink top rule,
   stronger shadow, darker hairline) now sits on both channel cards; a
   slim header line above them carries the "Ground truth" label (left)
   and a subordinate all-channels total (right, faint:
   "all channels: 0 views · 0 demos · PostHog · Jul 21").
2. **GSC manual-pull card DELETED** from the SEO column. GSC survives
   only as a one-line footnote under the SEO Views stat —
   "GSC cross-check: 0 clicks · 4 impressions, manual pull" — whose
   tooltip carries the window (Jul 14–19, pulled Jul 21), avg position
   2.3, and the manual-pull caveat. The backlinks count that lived in
   the GSC card moves to its own small card in the SEO column
   ("Backlinks · 0 in registry · registry pending" tag).
3. Everything else from rev 3 stays: probe columns under the
   "Leading indicators" label, combined trend chart, tier tables, both
   leaderboards, backlinks card, footer stamp.

## Rev 3 delta (what changed from rev 2)

Founder direction, verbatim intent: "the ground truth should be at the
top, even above the rankings, since that is the true north star metric"
and "use PostHog as ground truth to see if we get any AI referrals."

1. **Ground truth strip** — new full-width row directly under the h1,
   above the two probe columns: four compact stat cards.
   - **AI-referred sessions** (PostHog; `$referring_domain` in
     chatgpt.com · chat.openai.com · perplexity.ai · claude.ai ·
     gemini.google.com · copilot.microsoft.com) — currently 0.
   - **Organic sessions** (PostHog; google / bing referrers) —
     currently 0.
   - **Demos booked** (`booking_confirmed` events; split total /
     AI-attributed / organic-attributed by referring domain) —
     currently 0, sub-line "0 AI · 0 organic".
   - **GSC clicks · impressions** (0 / 4; keeps the `manual pull` tag).
   Each card carries a small trend-arrow placeholder plus a
   "vs last week" microcopy slot (±0 for the PostHog cards, which have a
   real zero prior week; en-dash empty value for GSC's first pull).
2. **Heavier treatment** — the strip is the north star, so it out-weighs
   everything below: 2px ink top rule, the stronger `--shadow-win`,
   slightly darker hairline (#d9dee3), ink-weight label. Numbers stay
   compact (40px) per "compact stat cards"; the card mass + top position
   carry the hierarchy.
3. **Probe columns reframed** — unchanged internally, moved below the
   strip under a tiny uppercase "Leading indicators · probe hit rates"
   label (tooltip: they predict the ground truth; levers, not the goal).
4. Everything else from rev 2 is preserved unchanged.

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
- **Later (not now)**: demos booked could chart as a third line on the
  same axes — the ground-truth series over the leading-indicator lines.
  Deliberately deferred; two lines until there is a nonzero series.

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

## PostHog ground-truth plumbing (rev 4)

The **same daily-midnight backend job** that runs the probes additionally
queries PostHog's query API — HogQL over `events` — and stores the
ground-truth numbers **alongside the probe run**, so the page reads ONE
payload. No client-side PostHog calls, no second fetch path.

**Per-channel views + demos are the FOUR topline numbers the daily job
must produce**: `seo.views`, `seo.demos`, `geo.views`, `geo.demos`.

- Credentials: server-side, already at `~/.driftwood-posthog-creds` per
  repo convention; project **513226**; query the events API directly
  (the proven path — same as the traffic checks).
- **Views, both channels**: ONE HogQL referrer split over sessions,
  bucketed by `$referring_domain`:
  - **SEO bucket** — search-engine referrers: google, bing.
  - **GEO bucket** — AI-assistant referrers: chatgpt.com,
    chat.openai.com, perplexity.ai, claude.ai, gemini.google.com,
    copilot.microsoft.com.
  Attribution rule: the referrer domain decides the channel — anything
  from an AI-assistant domain is GEO, search-engine domains are SEO.
  Referrers outside both lists count toward neither channel (they appear
  only in the subordinate all-channels total).
- **Demos, both channels**: `booking_confirmed` events attributed by the
  session's referring domain into the same two buckets.
- The job computes the current and prior week in the same pass and
  writes the vs-last-week deltas server-side (one per topline number);
  the page never computes windows, it renders the stored numbers.
- The all-channels total in the strip header (views + demos across all
  referrers) comes from the same pass; it is subordinate display, not a
  fifth tracked metric.

Flags:

- **"Sessions" here = PostHog event-derived sessions**, and posthog-js
  drops headless/bot traffic client-side — so these counts are
  human-biased by design. For a ground-truth metric that is a feature,
  not a bug: the strip answers "did humans come", not "did anything
  fetch the page".
- **GSC is demoted to a cross-check field in the payload, not a panel**:
  the payload carries a small `gsc` block (clicks, impressions, window,
  pulled-at) that renders only as the one-line footnote under the SEO
  Views stat. Values stay hand-edited constants (manual pull) until the
  GSC API credential exists.

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

- Ground-truth label (rev 4): north-star framing (views + demos per
  channel) + event-derived sessions + human-biased-by-design flag + the
  attribution rule (referrer domain decides the channel).
- Channel-block labels and stats (rev 4): SEO/GEO labels and both Views
  stats restate the attribution rule with the exact referrer lists;
  Demos stats state the booking_confirmed referrer attribution; delta
  slots state their window ("week over week"); the all-channels total
  states it is combined and subordinate.
- GSC footnote under SEO Views (rev 4): window + avg position +
  manual-pull caveat.
- Leading-indicators label (rev 3): probes predict the ground truth;
  levers, not the goal.
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
- Backlinks card: registry pointer (BACKLINKS.md), 0 until it lands.
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
- [ ] **Backend: PostHog ground-truth queries** in the same nightly job
      (HogQL per "PostHog ground-truth plumbing") producing the four
      topline numbers — seo.views, seo.demos, geo.views, geo.demos —
      plus WoW deltas and the all-channels total, written into the same
      published payload; `gsc` rides along as a cross-check field.
- [ ] Ground-truth strip in `SeoGeo.tsx` renders the two channel blocks
      (Views + Demos booked each, deltas, subordinate total); the GSC
      footnote values stay hand-edited constants until the GSC API
      credential exists.
- [ ] SEO domain-leaderboard aggregation (client-side from latest.json
      per the mapping above); GEO competitor aggregation as in rev 1.
- [ ] Non-admin view: reuse the logged-out card pattern.
- [ ] Verify `X-Robots-Tag: noindex` on `/dashboard-metrics/...` in prod;
      confirm the SPA catch-all doesn't shadow the static JSON
      (filesystem wins on Vercel).
- [ ] Commit to main; Vercel deploys from the push. QA with scrolled
      screenshots; don't poll prod URLs.
- [ ] Later hooks: GSC API pull replacing the hand-edited footnote
      values (SEO), BACKLINKS.md registry feeding the backlinks count,
      demos booked as a third line on the combined chart. (The rev-1
      "PostHog AI-referrer panel" hook is superseded — rev 3 pulled it
      forward into the ground-truth strip; rev 4 split it per channel.)
