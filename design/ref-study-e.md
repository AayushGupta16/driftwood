# Ref study E — "one cohesive brand/theme": saved.gg, browserbase, agentmail, greypoint

*2026-07-13. For landing v5/v6. Brief: Aayush's complaint about v4 — "there is no
brand or theme that we really have like all the other cool websites do." All four
references screenshotted at 1440x900 (full page + per-viewport) with Playwright and
read visually; type/color facts probed from computed styles on the live pages.
Screenshots in /tmp/shoot-e/. Companion to `brand-theme-directions.md` (the
carrier-constraints brief) and `anti-slop-notes.md` (the slop-tell list). Motion
notes are inferred from stills + known behavior — flagged where unverified.*

## Baseline: what v4 actually looks like (screenshotted first)

White page, black grotesque headlines, ONE device: serif-italic tide-blue word
inside the headline ("a working demo", "your"). Flat product screenshots on white,
gray hairline section splits, black pill CTAs. It is clean and credible and has
**zero recurring world**: no texture, no color field, no themed smallest-unit
(labels/dividers are generic), footer is a whisper. Aayush's read ("no brand") is
accurate. Worse: the serif-italic-accent-word is *itself* a documented slop tell
(anti-slop-notes.md), so v4's only identity carrier is a negative signal.

---

## 1. saved.gg — study this one hardest (his own taste)

**The one motif: the logo IS the theme.** The mark is a tangram-style "S" in three
flat colors (cobalt ~#4B63E8, pink ~#F5568C, amber ~#FFB13D). Everything on the
page is that mark restated at different frequencies:

- **Hero backdrop**: the three logo colors blurred into a soft aurora/mesh gradient
  (magenta→violet→indigo→amber), white 128px headline on top. It reads as "the
  logo, defocused."
- **Text highlights**: key words in body sentences get flat highlighter marks —
  "automatically" (green), "edited" (blue), "any content" (amber) — same hue family
  as the mark. The highlight is also *what the product does* (clips highlights):
  motif enacts product.
- **Platform pills**: YouTube red / Twitch purple / Kick green / Upload gray —
  brand colors of others, but presented as the same flat-pill unit.
- **Behind every product screenshot**: each dark-UI screenshot sits in a rounded
  card whose backdrop is the same aurora gradient, glowing at the card edges. The
  gradient never appears *on* UI — only behind it.
- **Final CTA**: the logo mark, large, on a faint blueprint grid inside a white
  card — "Try Saved Now." The encore is the mark itself.
- **Footer**: quiet, plain, light. The theme bows out before legal links.

**Palette mechanics**: white base + near-black ink + the 3-hue logo family. Color
lives in exactly three places: gradient fields behind screenshots, highlighter
marks on single words, small pills. Sections alternate white / light-gray; the
color never floods a section.

**Type**: ONE custom sans for everything (probed: single Next.js localFont
"__standard" — no second family, zero mono on the page). Identity comes from
extreme range inside the one family: hero at 128px weight 400, sub-copy at weight
100, buttons 600. Total commitment to one voice.

**Texture execution**: blurred gradient (CSS/canvas, trivially cheap), flat
geometric mark, real video thumbnails as a wall of texture (a strip of actual
stream clips right under the hero — real content as decoration). Quality cue:
gradients are desaturated-at-the-edges and grain-free, screenshots are pixel-sharp
dark UI.

**Coexistence with product shots**: the load-bearing trick — **screenshots are
dark, theme is a light-field *behind* them.** Figure/ground never competes.
Color = ground; product = figure.

**Motion**: gradient likely drifts; clip strip likely marquees (unverified from
stills).

**Cohesion verdict**: logo→gradient→highlight→pill = one color system restated at
four scales; one font at extreme weight range; color only ever behind or under, never
on.

---

## 2. browserbase.com

**The one motif: the wild web as dithered terrain, drawn on engineering paper.**
Two-layer world: (a) pixel-glitch/dithered landscape art (mountains in
black/orange/green, an old CRT computer melting into glitch), (b) a visible
engineering grid — thin vertical/horizontal hairlines framing every section like
graph paper.

Where it recurs:
- **Hero**: grainy periwinkle sky + dithered mountain range; orange headline text.
- **Mid-page**: glitch-art CRT computer beside "Use the whole web like it's an API."
- **Late-page**: second dithered mountain (green) beside "Don't use the web. Scale it."
- **Everywhere**: the hairline grid + mono eyebrow labels ("TRY FOR FREE ▶",
  "WEEKLY SDK DOWNLOADS") carry the theme through sections that have no art at all.
- **Footer**: full-bleed orange block with a giant white "B" mark — the loudest
  brand moment is the LAST thing you see.

**Palette mechanics**: paper-white base + black ink + ONE hot accent (vermilion
orange, from the logo square) + a pastel tint family (pink, periwinkle, light
blue, cream) used for stat cards and demo-panel grounds. Orange has a job:
headline emphasis spans, alert moments in illustrations, the footer. Highlighter
marks again: yellow behind one H2, pink behind another ("Don't use the web.
Scale it.") — same device as saved.gg.

**Type** (probed): three families, strict roles — **GT Planar** (display, wt 500,
tight tracking), **Plain** (body), **GT Standard Mono** (92 mono elements: labels,
eyebrows, stat captions, code strings). Mono = the machine's voice; sans = the
company's voice.

**Texture execution**: dithering/pixelation — a *generator*, not an illustration
style you must redraw. Any image can be re-emitted as on-brand art at any size.
Quality cues: consistent 1-bit-style dither density, limited palette per artwork,
art always cropped by the grid (never floating free).

**Coexistence with product shots**: brilliant dodge — **there are no real
screenshots.** Every demo is a schematic wireframe illustration (pale blue-gray
fake UIs, mono labels, cursors, one orange accent element). The "product shots"
are drawn *in the theme's own palette*, so theme and proof are the same material.
Costs illustration effort; buys total cohesion.

**Motion**: dither art is known to animate subtly on the live site; grid is
static (partially unverified).

**Cohesion verdict**: art system (dither generator) + grid + mono labels + one hot
orange; theme carried by infrastructure (grid/labels) on quiet sections and art on
loud ones; footer as brand encore.

---

## 3. agentmail.to

**The one motif: the terminal habitat where agents live.** The entire page is the
inside of a machine — and the product (email API for agents) natively belongs there.

Where it recurs:
- **Hero backdrop**: cascading ASCII rain of 0s/1s (emails-as-data) across the
  near-black field; right side is a real code card (Python/TS/cURL/CLI tabs) plus a
  **Live Inbox widget that actually provisions a real inbox for the visitor** — the
  hero art is the product working.
- **Smallest units, everywhere**: `[ What we offer ]`, `[ By the numbers ]`,
  `[ FAQ ]` bracket-notation eyebrows; dashed TUI borders; corner-bracket button
  frames (the DOCS button has literal corner marks); selection-handle dots on card
  corners. Every section inherits the theme through these units even with no art.
- **Stats**: giant mono numerals ("100M+", "Always On") + dot-matrix world map +
  halftone-dot texture panels — same dot/character texture family as the rain.
- **Footer**: the wordmark AGENTMAIL rendered as giant ASCII art, plus a live
  status line "● ALL SYSTEMS ONLINE" — encore + theme + proof in one.

**Palette mechanics**: near-black base (probed lab(2.5...) ≈ #060607), white
headlines, gray body. Chromatic color has ONLY semantic jobs: code-syntax
blue/green/orange in snippets, **green = alive** (live inbox address, "Account
verified" check, systems-online dot), YC orange chip. No decorative color anywhere.

**Type** (probed): **Inter** (600) for display/body + **Geist Mono** (143 mono
elements) for CTAs, labels, stats, code. Same two-voice split as browserbase:
mono is the machine talking.

**Texture execution**: ASCII/character art — pure text/canvas, effectively free,
infinitely re-emittable (hero rain, section transitions, footer wordmark are the
same generator at three volumes). Quality cues: rain density is low-contrast
(#111-on-#060), never behind body text blocks.

**Coexistence with product shots**: product UI cards are dark-on-dark with hairline
borders — the same material as the page, so there is no "screenshot vs theme" seam
at all. Diagram panels (agent flow: Browser → AgentMail → OTP filled) are drawn as
dark TUI cards too.

**Motion**: rain almost certainly animates; live inbox updates in real time
(the widget is interactive proof). (Animation unverified from stills.)

**Cohesion verdict**: one habitat (terminal) that the product genuinely lives in;
theme carried by border/label/texture primitives; color restricted to semantic
green; footer ASCII encore.

---

## 4. greypointindustries.ca

**The one motif: the classified defence spec-sheet.** No illustration system at
all — cohesion comes from total typographic + photographic commitment.

Where it recurs:
- **Hero**: bone-white paper (#f0efea-ish), giant ALL-CAPS mono headline
  ("MANUFACTURING THE FUTURE OF AUTONOMOUS SYSTEMS"), mono body, black slab CTA
  ("REQUEST BRIEFING" — vocabulary is part of the theme), line-art maple-crest logo.
- **Product sections**: hard cut to black; grainy B&W thermal/IR-style footage of
  the drone; product name "ARROW" with the tiny crest mark beside it; then a
  **spec table** (Deployment Method / Range / Speed / Target / Max Height AGL) —
  the spec sheet is the product proof.
- **Manifesto**: white caps over full-bleed B&W soldiers photo ("RESHORING OUR
  MANUFACTURING. REARMING THE WEST.").
- **Close**: earth-from-orbit B&W photo, contact form in TUI-style boxes,
  red SUBMIT.

**Palette mechanics**: bone white + black + grayscale photography + **red reserved
exclusively for the commit action** (SUBMIT / JOIN US) + YC orange chip. Two
neutrals, one signal. The page's arc is light→dark→light-on-dark — a narrative
palette, not per-section variety.

**Type** (probed): **JetBrains Mono** display (75-92px, caps, wide tracking) +
**Space Mono** body/labels (12.9px, tracked). 184 mono elements — the whole site
is mono. One voice, zero exceptions.

**Texture execution**: photography only (real footage, grain/thermal grading) +
mono type. No SVG/canvas art. Quality cue: the photos look like real program
footage, not stock — the theme collapses instantly if the photography is fake.

**Coexistence with product shots**: the "screenshots" ARE the theme (footage +
spec tables). Nothing to reconcile.

**Motion**: hero/section backgrounds are likely video loops (unverified).

**Cohesion verdict**: pure costume (genre: defence dossier) held together by 100%
commitment — one mono family system, caps, B&W photo grade, red-only-on-commit;
proves costume works ONLY when nothing on the page breaks character and the
artifacts (specs, footage) are real.

---

## The general mechanics of "one cohesive theme" (extracted)

1. **One world, named in one sentence.** Saved: "the logo, everywhere, at
   different blur levels." Browserbase: "the wild web as terrain on engineering
   paper." AgentMail: "the terminal agents live in." Greypoint: "a defence
   dossier." If the world can't be stated in a sentence, there is no theme.
2. **The motif is the product's habitat or its action — or it's a costume that
   never breaks.** Browserbase's terrain = the web its agents traverse; agentmail's
   terminal = where its product runs; saved's highlight-marks = what the product
   does. Greypoint is the only pure costume and survives via total commitment +
   real artifacts. The failed driftwood admiralty draft was a costume *with
   breaks* (theme on top, generic product beneath) — that's the exact gap that
   reads as AI-decorative.
3. **A smallest unit carries the theme through quiet sections.** Eyebrow labels
   (`[ FAQ ]`, mono caps captions), border/corner treatments, hairline grids. Art
   appears 2-3 times; the smallest unit appears 20 times. This is what v4 lacks
   most — its labels/dividers/captions are from no world at all.
4. **Palette = 1 base + ink + ONE accent with a JOB** (browserbase orange =
   emphasis+footer; greypoint red = commit; agentmail green = alive) — plus at most
   one tint family for grounds. Color lives behind/under/beside product, never on it.
5. **Type: at most 2 families with strict roles** (sans = company voice, mono =
   machine voice: browserbase, agentmail) **or 1 family at extreme range** (saved:
   wt 100↔700, 16px↔128px; greypoint: mono everywhere). Never three peers.
6. **Screenshot coexistence, three proven strategies**: (a) dark product on
   light color field behind it (saved); (b) redraw demos as schematic
   illustrations in theme palette (browserbase); (c) make page and product the
   same dark material (agentmail). Never: full-color screenshot floating on top of
   busy art.
7. **The footer is the encore.** Browserbase (orange field + giant B), agentmail
   (ASCII wordmark + status line), saved (logo-mark CTA card). The brand's loudest
   moment comes last, where it can't interfere with selling. v4's footer is a
   missed free win.
8. **Texture comes from a generator, not an artist**: gradient blur (saved),
   dither (browserbase), ASCII/dots (agentmail), photo grade (greypoint). Cheap to
   re-emit at any size/section = the theme can recur without new art each time.
9. **Motion, where present, is the texture breathing** (rain falls, dither
   shimmers, gradient drifts) — not entrance animations. Motion belongs to the
   world, not to the scroll.

Note on the anti-slop list: these sites *use* "banned" moves (dark theme, mono,
all-caps, gradient hero) and don't read as slop. The difference is jobs +
commitment + real artifacts: every themed element has a role, nothing breaks
character, and the proof (live inbox, spec tables, real clips) is genuine. Slop
is theme *instead of* product; these are theme *around* real product.

---

## Three brand-theme proposals for driftwood

Shared constraints honored: tide blue #15557e stays the accent; helm mark stays;
real Autosana artifacts stay the proof; sea-chart contours only ever as quiet
ground (the hero-contour version is dead); serif-italic accent word retired
(slop tell). Each proposal is one world — pick one, don't blend.

### Proposal A — "The waterline"

- **Motif**: a single horizontal waterline — one tide-blue line with a barely
  perceptible sine swell — as the page's structural spine. Not art; it IS the
  layout's divider system. Things the agent produces *surface* above it.
- **Where it appears**: (1) Hero: headline above the line, dashboard screenshot
  breaking upward through it (clip-path reveal). (2) Every section divider is the
  same line (replaces v4's anonymous gray hairlines) — the 20-times smallest unit,
  per mechanic #3. (3) One accent moment: the Superhuman reply toast sits exactly
  on the line — the payoff literally surfaces. (4) Footer: the line thickens into
  a full tide-blue field with the helm mark large in white — the browserbase
  orange-footer encore (mechanic #7).
- **Palette**: paper white + ink + #15557e only; one derived tint (mist
  ~#eaf1f6) as the ground behind screenshots — saved.gg's color-behind-product
  rule (mechanic #6a). Green stays semantic-only for "call booked."
- **Type**: keep the current grotesque, but commit to saved.gg's move — extreme
  weight/size range inside the one family (hero much bigger + a wt-300 sub-voice);
  no new families, no mono.
- **Texture execution**: one SVG path + CSS; the swell drifts at ~60s loop
  (motion = texture breathing, mechanic #9). Zero images.
- **Why it won't read AI-decorative**: the line is load-bearing layout (divider,
  baseline, toast-anchor), not ornament around the product; there is no "art"
  anywhere for the theme to clash with screenshots. Grounded in: saved.gg
  (figure/ground + one-family type), browserbase (footer encore, infrastructure-
  as-theme), agentmail (semantic green).

### Proposal B — "Charted water" (contours demoted to paper)

- **Motif**: sea-chart depth contours return — but at browserbase-grid volume:
  3-4% opacity ink linework that reads as the *paper the page is printed on*,
  never a picture. Plus a themed smallest unit: chart-notation section markers
  ("01 — research", "02 — build", "03 — send") with a tiny tick/degree glyph,
  replacing generic eyebrows.
- **Where it appears**: (1) Hero: contours fade in from one corner and pass
  *under* the screenshot card (screenshot on a solid white card, always opaque —
  the coexistence rule, mechanic #6). (2) Quiet sections (quote, stats) get one
  contour cluster each, cropped by the section edge like browserbase crops art
  with its grid. (3) Footer: the only high-contrast use — white contour lines on a
  full #15557e field with the helm mark; the chart is finally legible at the
  encore. (4) The helm mark itself gains a chart-cross registration tick, echoed
  as the list-bullet glyph.
- **Palette**: white + ink + tide blue; contour ink is gray-blue (#15557e at
  4-6%); no other hues. Booked/replied = green, semantic only.
- **Type**: current sans, two strict roles (display + body); small caps-free
  tracked labels for the chart notation — restraint per the v1 post-mortem (no
  mono, no all-caps).
- **Texture execution**: one generated SVG (noise field → marching-squares →
  3-4 smoothed paths — 30 lines of build-time JS, or hand-drawn once); static, or
  60s parallax drift. Cheap to re-emit per section per mechanic #8.
- **Why it won't read AI-decorative**: the admiralty draft failed because contours
  were the FIGURE (hero art on top of a generic page). Here they are GROUND —
  browserbase proves ground-level geometry (its ever-present hairline grid) reads
  as engineering rigor, not decoration; the figure stays the real Autosana
  artifacts. Grounded in: browserbase (grid-as-theme, art cropped by structure,
  footer encore), agentmail (smallest-unit labels), saved.gg (color never on the
  product).

### Proposal C — "The ship's log" (product-as-world; most product-true)

- **Motif**: every visual on the page is an artifact the agent actually produced —
  thread card, demo window, dashboard — in ONE standardized window chrome, each
  stamped with the helm mark as the agent's avatar (agentmail's inbox-everywhere /
  greypoint's crest-beside-product-name move). The one nautical whisper: a
  four-point voyage line under each artifact — `researched → built → sent →
  replied` as four dots on a route line, filled to show how far that artifact got.
- **Where it appears**: (1) Hero: the dashboard already there, now with the
  voyage line as the section's organizing spine. (2) Section dividers: the route
  line replaces hairlines, one more dot filled per section — the page itself
  travels the pipeline (the Autosana story maps 1:1). (3) Accent moment: at the
  reply section, the fourth dot fills in green — the only chromatic event on the
  page. (4) Footer: full tide-blue field, helm large, the complete route line
  with all dots lit + "call booked."
- **Palette**: white + ink + #15557e; green exclusively = replied/booked
  (agentmail's green=alive, greypoint's red=commit — one accent, one job).
- **Type**: current sans; artifacts keep the lowercase agent voice ("hey joe, i
  made you a demo"), page keeps short declaratives — the two-register voice from
  brand-theme-directions.md, which is itself a cohesion carrier (mechanic #2).
- **Texture execution**: pure HTML/CSS components (window chrome tokens + a
  flex/SVG dot-line). Zero background art, zero images beyond real screenshots.
- **Why it won't read AI-decorative**: nothing is decoration — the recurring
  device is a *progress indicator of what the product actually does*, so every
  repetition restates the pitch; it is browserbase's "the device is the product"
  logic executed with agentmail's semantic color discipline, and it's fully inside
  the post-admiralty carrier bans (no fonts, no palette expansion, no art).
  Continuous with the direction already sketched in brand-theme-directions.md.

### Recommendation ordering

C is the safest and most product-true (pure mechanic #2); A adds the most *feel*
per unit of risk and pairs naturally with C (the waterline and the voyage line
can be the same line); B is the only one that delivers "cool website" texture but
needs the discipline of a 4%-opacity cap and one high-contrast footer moment to
stay on the right side of its own history. A+C combined, with B's footer-contour
encore, is a coherent single world: **"what the agent shipped, surfacing."**
