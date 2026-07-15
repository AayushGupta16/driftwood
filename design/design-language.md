# driftwood design language

The source of truth for how driftwood looks, moves, and talks — landing page
AND dashboard. If a change disagrees with this file, either the change is
wrong or this file gets updated in the same commit. Never let them drift.

## 1. Tokens

Defined twice, deliberately in sync: `landing/src/index.css` `:root` vars
(landing scope) and the Tailwind `@theme` block (dashboard). If you touch a
value, change both.

| Token | Value | Use |
|---|---|---|
| ink | `#16181b` | headings, primary text |
| gray | `#6a737d` | body/support text |
| gray-light | `#9aa2ab` | labels, deemphasized |
| line | `#e9ebee` | all hairline borders |
| tide (accent) | `#15557e` | THE accent. Links-as-actions, primary buttons, voice italics, water |
| tide-deep | `#0d3c5b` | hover state of tide |
| tide-wash | `#eaf1f7` | tinted chips/fills |
| wash-a / wash-b | `#f4f8fb` / `#eaf1f7` | section sheet tints (sparingly) |
| ground | `#ffffff` | page background. White. Not off-white, not gradient |

One accent. If a design wants a second accent color, the design is wrong.
(Exception: in-artifact brand colors — Brex orange inside a Brex demo — live
inside their artifact window and never leak into page chrome.)

## 2. Type

- **Body/UI**: Public Sans, weights 400–700. No mono for labels (mono reads
  "AI-generated" — it's banned from chrome; IBM Plex Mono survives only for
  functional bits inside the review queue).
- **Wordmark**: Source Serif 4, weight 600, next to the HelmMark tile.
  Everywhere: header, footer, dashboard, OG image.
- **Voice accent**: Georgia italic in tide blue, `em.voice`. One phrase per
  heading, the phrase that carries the meaning ("*AI slop*", "*whole job*").
  Never two voice phrases in the same block.
- Headings share one scale: `clamp(2rem, 1.2rem + 2.8vw, 3.2rem)`, weight
  600, tracking −0.014em. H1 caps at 12 words.
- No em dashes in site copy. (Sole exception: the slop parody card — slop
  uses em dashes, that's the joke.)

## 3. Surfaces

- **Windows** (`.app-window`, `.artifact`, `.email`, `.thread`): white,
  1px `line` border, radius `--r-win` (12px), shadow `--shadow-win`.
  Artifacts are pixel-real: real chrome, real screenshots, no illustration.
- **The hero fits the fold**: hero height comes from the viewport
  (clamped 38–64rem), never from the dashboard screenshot — the window
  crops from its bottom edge and the waterline lands at the fold. The
  stacked (phone) hero centers headline / sub / CTA on the page axis.
- **Buttons**: pills (`border-radius: 999px`). Primary action = tide
  background, white text, hover tide-deep. There are no black buttons.
  Secondary = outlined/ghost. This applies to the dashboard too.
- **Labels** (`.compare-label`, `.artifact-bar`, `.label`): 0.85rem,
  **gray** (not gray-light — labels carry real information and gray-light
  on white is ~2.7:1, under the 4.5:1 AA floor at this size), sentence
  case, no pills, no uppercase, no mono. Gray-light survives only for
  truly decorative deemphasis.
- **Redaction language**: identity we withhold = `.redact` gray bar
  (`#d4d9de`, 2px radius). Used consistently: names, companies, addresses.

## 4. The water

The signature. ASCII character sea on 2D canvas — never rendered 3D.

- Grid: `CELL_W 8`, `CELL_H 10.5`, chars `[' ', '·', '-', '~', '≈', '≋']` by
  wave height, ~15fps (terminal cadence), tide-blue rgba by depth.
- Placement: hero (bottom 62%, top-masked) + thin strips at section seams.
  Sheets dock onto water with filled-sine wave shoulders.
- Scenery is earned, not decorated: the driftwood log (brown, west→east)
  with its gull captain, one free-swimming gull, ships (never on
  phone-width strips — the sail blurs into a blob), islands (static while
  water moves), terracotta buoys bobbing on station, the odd fish arcing
  clear of the swell, and the proof island's palm. The log's lane clamps
  above the proof island (never runs aground, never hides behind it); the
  free swimmer may paddle behind it. Wide strips may hold two scenes.
- **Scenery palette is cold-coast, not tropical** (2026-07-14, after "the
  island doesn't match the site's tone" feedback): sand is bleached greige
  (`141,130,109` wet ▒ / `170,160,140` dry █), the palm is sea-glass
  (`101,125,106`), birds are gulls (`158,166,172` gray, never duck-yellow),
  and ONE terracotta (`178,94,66`) covers every warm pop — crab, buoys,
  coconut, beaks. The rule: tide blue + one bleached-neutral family + one
  terracotta accent. No golds, no tropical greens, no reds. The brand is
  driftwood — weathered and desaturated, not a postcard.
  A crab skitters sideways along the proof island's beach (v2 sprite,
  re-added 2026-07-14 on Aayush's ask: ∩ pincers + low ▄▄ body + ʌ leg
  ticks + lateral scuttle — v1's bare block read as a red staple; the
  round claws and sideways motion are what sell the shape).
- The proof island: drawn BY the sea from the `.hero-proof` rect — dithered
  `▒` beach, faint `█` interior, surf piling at the coast. Never a CSS shape.
  It lives on phones too: the stacked hero moves the proof below the window,
  onto the water. Only reduced-motion goes without it.
- Canvases self-heal: every frame checks CSS size vs sized-for size
  (layout can grow after images/fonts load; a stale buffer stretches).

## 5. Motion

- Easing: `--ease-settle` (spring, ~3% overshoot) for transforms; things
  land-and-settle, then idle-bob 1–2px desynced. Buttons 240ms.
- Scroll-scrubs are 1:1 and reversible, only on `min-width: 52rem` AND
  `pointer: fine`. Phones get: the compact pinned how-deck (fits one
  screen), and un-pinned scroll-linked choreography for everything taller
  than a viewport. `prefers-reduced-motion` gets a fully static page.
- Pins measure the pin element, not `innerHeight` (iOS toolbar collapse).
  Pin heights in `svh` on mobile.
- One choreography per pin. If a pin has two payoffs, cut one.

## 6. Copy & universe

- One universe per page: real artifacts from the same story (currently the
  Brex ask → build → review → the anonymized-CTO thread). No fictional
  examples mixed with real ones in the same flow.
- Agent voice in artifacts is lowercase, concrete, short. Marketing voice
  is sentence case, plain verbs, no "supercharge/unlock/effortless".
- Numbers stated as observed fact with attribution ("week one at Autosana"),
  never rounded up.
- Real people/companies only with consent; otherwise redaction bars, and
  scrub the asset filename too.

## 7. Process

- UI changes go through the staging branch (`redesign`-style) with tagged,
  minimal deltas; Aayush reviews on the Vercel preview before prod.
- QA any visibility-gated animation with scrolled screenshots (fullPage
  renders them blank). QA mobile with WebKit + iPhone descriptor, not
  chromium-mobile emulation.
- Baked assets (hero, review-queue, slack-trace, OG) are screenshots of the
  mocked dashboard (`?mock=1`). If the mock or dashboard styling changes,
  RE-SHOOT them in the same commit — a stale bake is a style bug (see the
  black "View all leads" that outlived the button restyle).
- Baked assets ship as WebP (`cwebp -q 85 -m 6 -sharp_yuv`, keep ~2× display
  size for retina); only the OG card stays PNG (link-preview compatibility).
  Below-the-fold `<img>`s get `loading="lazy" decoding="async"`; the hero
  window image gets `fetchPriority="high"`.
- When adding a token/pattern, add it here; when deviating, say why in the
  commit message.
