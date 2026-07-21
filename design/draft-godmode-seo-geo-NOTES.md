# Godmode SEO/GEO metrics page — integration notes

Companion to `draft-godmode-seo-geo.html`. The draft is a full-page static
mock populated with the real current data: both v2 querysets (100 queries
each, real tier splits), the 2026-07-21 v1 baseline results joined in by
query string (39 probed misses, 161 pending), the real competitor counts
from `geo-results/latest.json`, and the real GSC pull (0 / 4 / 2.3 /
2026-07-21). Everything is zero because everything IS zero; the page is
designed for that state (see "Zero-state design" below).

## Entry point (the actual code)

Two candidate "GodMode banner" spots exist in the code, and only one is
always visible:

- `landing/src/Dashboard.tsx` (~line 254): the logged-in header renders
  `{user.is_admin && <GodModeButton />}`. **This is the entry point**:
  add a sibling admin pill (`SEO / GEO`, styled like `GodModeButton`'s
  tide-outline pill in `GodMode.tsx`) behind the same `user.is_admin`
  flag, linking to the new route. The draft's header shows it.
- `ImpersonationBanner` (`landing/src/GodMode.tsx`) is the amber sticky
  banner, but it only renders while `user.impersonating` is true — it
  cannot be the sole affordance or the page is unreachable outside an
  impersonation session. If Aayush literally wants it in the banner too,
  add a small text link there as a second door; the header pill stays.

`is_admin` comes from `/auth/me` (see the `User` type in Dashboard.tsx),
which every dashboard page already fetches with the first-party cookie.

## Routing (the actual mechanism)

There is no router. `landing/src/main.tsx` switches on
`window.location.pathname` with `lazy()` code-splitting per page:

- Add `const SeoGeo = lazy(() => import('./SeoGeo.tsx'))` and a
  `path === '/dashboard/seo-geo' ? <SeoGeo /> : ...` branch.
- `isLanding` already excludes `path.startsWith('/dashboard/')`, so the
  new page gets no PostHog init and no hydration path — nothing to do.
- `vercel.json`'s SPA catch-all already rewrites the path to
  `index.html`, and the existing `/dashboard(.*)` headers rule already
  applies `X-Robots-Tag: noindex` + `X-Frame-Options: DENY`. Free.
- Page shell: follow Dashboard.tsx's `AuthState` pattern; fetch
  `/auth/me`, and render the logged-out card for non-admins (client-side
  gating controls the view only — the data exposure question is below).
- Width: use the wide-page convention (`max-w-7xl`, like Leads.tsx), not
  Dashboard's `max-w-5xl`. The draft is built at 1280.

## Where the JSON must live (the tradeoff, and the recommendation)

`site/geo-results/` and `site/seo-results/` are **outside** `landing/`,
which is the Vercel Root Directory — the deployed site cannot serve them
today. Two options:

**A. Copy artifacts into `landing/public/` (recommended).**
Static, no backend work, and it is literally the pattern GEO.md's
dashboard spec names ("the probe commits the artifact and the deployed
site serves it"). Tradeoff: files under `public/` are world-readable to
anyone who guesses the URL — that means our query set, tier framing, and
scorecard are exposed. Assessment: the SERP results themselves are
public information; the strategy framing (tiers, "must-win" labels) is
the only mildly sensitive part. Mitigations, both cheap:
  - Put them under `landing/public/dashboard-metrics/{geo,seo}/` — the
    existing `/dashboard(.*)` header rule in vercel.json pattern-matches
    this path, so the JSON inherits `X-Robots-Tag: noindex` with zero
    config changes (verify the header on prod once live).
  - Never link the path from any public page, sitemap, or llms.txt.
If that still feels too exposed later, rename to an unguessable path
segment (e.g. `/dashboard-metrics-<random>/`); the page is the only
consumer.

**B. Backend-authed endpoint.** Serve via the Cloud Run backend as
`/api/v1/admin/metrics/*` gated like the existing `/api/v1/admin/users`
(admin session cookie). Real auth, but it needs backend routes plus a
way to get git-committed artifacts into the backend (GCS or DB), which
abandons the commit-is-the-pipeline pattern. Not worth it for a page
whose data is derived from public SERPs. Revisit only if the artifacts
start carrying anything sensitive.

**Recommendation: A**, exactly as scoped above.

Files the page fetches (all same-origin, CSP `connect-src 'self'` is
already satisfied):

- `/dashboard-metrics/geo/latest.json` + `/dashboard-metrics/geo/queryset-v2.json`
- `/dashboard-metrics/seo/latest.json` + `/dashboard-metrics/seo/queryset-v2.json`
- `/dashboard-metrics/{geo,seo}/history.json` (new, for the trend line)
- `/dashboard-metrics/backlinks.json` (later, BACKLINKS.md-derived)

The page joins queryset x latest client-side by exact query string —
the same join this draft's generator used; it matched 24/24 and 15/15
on the real data. v1 is a strict subset of v2 by intent, so pending
rows fall out naturally.

## Probe-skill change needed

Both skills (`.claude/skills/geo-probe`, `.claude/skills/seo-probe`)
currently write `site/<channel>-results/latest.json` + a dated **.md**
(human notes) and commit. Add, per run:

1. Copy `latest.json` (and `queryset-vN.json` when it changes) into
   `landing/public/dashboard-metrics/<channel>/`.
2. Append one row to `history.json` there:
   `{date, set_version, runner, tier1_hits, tier1_total, per_tier,
   total_hits, total}` — the dated files are markdown, so the trend
   needs this machine-readable ledger. Seed it with run zero.
3. Recommend the v2 runs also add `runner` and per-tier rollups to
   `latest.json` itself (GEO.md: "every result file records its tool";
   the current v1 file doesn't).
4. Same commit as the results (deploying is part of the run — pushing
   to main is what publishes the dashboard data).

## Zero-state design (what makes 0 a starting line)

- The "run zero" strip under the title says outright: first baselines,
  0 across the board, expected for a week-old domain, weekly runs
  resume now the page exists (probes were paused for it).
- The hero shows the full grading band scale (below min / bare min /
  fine / great / amazing) with a marker at 0 and a concrete next
  milestone ("4 tier-1 hits reaches 20%, bare minimum" GEO; 3 for SEO).
- The trend chart draws the five bands as faint horizontal target zones
  with labels, six weekly x-ticks, and the single run-zero point — an
  axis waiting for dots, not an empty chart.
- Unprobed v2 queries are **pending** (hollow dot), never counted as
  misses; tier headers show "0 / 20 hits · 8 probed".
- The competitor leaderboard pins a tide-colored "driftwood 0" row
  above the gray field — the number to move.

## Data-honesty calls baked into the copy

- Hit-rate denominators are the v2 set (0/20, 0/40... "all tiers
  0/100") with a footnote that the v1 baseline covered 24 (GEO) / 15
  (SEO) of the 100.
- SEO table carries the "WebSearch proxy, not literal Google ranks"
  disclaimer; GSC card is labeled ground truth with the manual-pull tag
  and the OAuth-owed note.
- Footer strip: last run date, set version (v1 baseline, v2 loaded),
  runner tool per channel, the /geo-probe + /seo-probe rerun note, and
  "results are only comparable within one runner tool".
- GSC card includes `queries_visible: 0` (it's in the artifact) and the
  interpretation line from seo-results/2026-07-21.md.

## Design-language notes and tensions

- **Band colors are five functional status colors** (muted red, orange,
  olive, green, deep green — softened toward the weathered-coast
  palette rather than raw Tailwind red-600 etc.). The design language
  says one accent; the dashboard already carries functional non-accent
  colors (ok-green, error-red, the amber god-mode banner), and the
  bands are status semantics of the same kind. This is the page's one
  real tension — if it reads as too much color, the fallback is: band
  color on the headline number + chip only, scale and chart zones gray.
- The precedent file (`dashboard-additions-draft-v2.html`) predates the
  token unification: cream paper, mono microlabels, Nasalization
  wordmark. This draft matches its FORMAT conventions (single static
  page, amber `newtag` chips on deltas) but uses the current tokens
  from `landing/src/index.css` `@theme` + design-language.md: white
  ground, Public Sans, Source Serif 4 wordmark, sentence-case labels,
  pill buttons, 12px card radius, shadow-win.
- Tide is reserved for "us"/actions: the trend point, the driftwood
  leaderboard row, the active nav pill. Competitors are gray.
- No em dashes in page copy; en dashes appear only as empty-value
  placeholders inside data cells.
- The Google Fonts `<link>` is draft-preview scaffolding only; the app
  self-hosts these fonts already (CSP `font-src 'self'` stays).
- Labels use the dashboard's existing `SectionLabel` treatment
  (0.85rem ink-faint) for consistency with Dashboard.tsx, noting the
  design-language file itself prefers gray for info-carrying labels —
  existing tension in the codebase, not introduced here.

## Build checklist

- [ ] `landing/src/SeoGeo.tsx` — port the draft to Tailwind classes;
      native `<details>` for tiers; inline SVG trend (no chart lib).
- [ ] Route branch in `landing/src/main.tsx` (`/dashboard/seo-geo`).
- [ ] Admin pill next to `GodModeButton` in Dashboard.tsx header
      (+ optional link inside `ImpersonationBanner` if Aayush wants the
      literal banner too).
- [ ] `mkdir landing/public/dashboard-metrics/{geo,seo}`; seed with
      current latest.json + queryset-v2.json + run-zero history.json.
- [ ] Edit both probe skills: dual-write + history append (same commit).
- [ ] Non-admin view: reuse the logged-out card pattern.
- [ ] Verify `X-Robots-Tag: noindex` on `/dashboard-metrics/...` in
      prod (inherited from the `/dashboard(.*)` rule); confirm the SPA
      catch-all doesn't shadow the static JSON (filesystem wins on
      Vercel — same mechanism the prerendered pages rely on).
- [ ] Commit to main; Vercel deploys from the push (never
      `vercel --prod` from the tree). QA with scrolled screenshots per
      the design-language process; don't poll prod URLs.
- [ ] Later hooks already spec'd in GEO.md/SEO.md: PostHog AI-referrer
      panel (GEO), GSC API pull replacing the manual tag (SEO),
      BACKLINKS.md registry feeding the backlinks card.
