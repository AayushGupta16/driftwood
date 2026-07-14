# Ref study G — structural / geometric signatures

Lane: sites whose identity is a rigorous card/panel/grid system. Founder ask: "sections that
are squares and they stack together well." All numbers below are measured live (playwright,
1440x900, 2026-07-13) — computed styles pulled from the DOM, not eyeballed.

## Where v7 stands (the gap this study addresses)

Screenshotted `landing-draft-v7.html` top to bottom. Current grammar:

- Page: pure white (`--bg: #ffffff`), no ground. Sections are typographic islands separated
  by large whitespace + a 28px sine-wave hairline divider (repeat-x SVG, #15557e @ 0.26-0.4).
- One window system: every artifact wears `--r-win: 12px`, 1px `#e9ebee` border,
  `--shadow-win: 0 1px 2px rgba(22,24,27,0.05), 0 24px 48px -24px rgba(22,24,27,0.18)`.
- Hero: three.js sea canvas + dark waterline band; footer: tide-blue band with white sine top.
- Diagnosis: the artifact windows are objects, but the SECTIONS are not. Nothing binds a
  section's headline + prose + window into one shape, so the page reads as content floating
  on nothing. Every reference site below solves exactly this, each a different way.

---

## 1. cal.com — whole-page hero card on a gray ground, drafting-table furniture

Measured:
- Page ground: body `#f4f4f4`. Not white. This single choice powers the whole system.
- Hero = ONE giant white card: **1176px wide at x=132** (132px inset each side @1440),
  **radius 12px**, top y=96 (sits below the nav pill), ~700px tall.
  Shadow: `rgba(36,36,36,0.7) 0 1px 5px -4px, rgba(36,36,36,0.05) 0 4px 8px` — barely-there,
  the gray ground does the separation, not the shadow.
- The same white 12px-radius card at the same 1176/x=132 rail recurs down the page (feature
  duo cards ~450h, FAQ card, etc.). Some content (big headlines, testimonial masonry, logo
  rows) sits directly on the gray ground between cards — cards are punctuation, not a cage.
- Feature grid: small white cards, 1px border, ~16px radius, ~16px gaps, 4-up.
- Signature furniture: full-width 1px hairlines at section boundaries + two vertical
  hairlines inset ~120px from each viewport edge running the entire page, with small "+"
  crosshair registration marks where they intersect. Blueprint / drafting-table vibe.
- Nav: floating white pill (rounded-full, shadow), hovers over everything on scroll.

Why it coheres: one ground color + one card color + one radius + ONE width rail, repeated
exactly. The crosshairs make the invisible grid visible, so even the empty gray reads as
designed. Card radius is small (12px) → sheets of paper, technical, calm.

## 2. clay.com — full-width rounded pastel section cards, docked stack

Measured:
- Body white. Hero full-bleed `rgb(3,93,68)` deep green (illustrated 3D scene).
- The system: a **1280px rail at x=80** (80px side margins @1440). Section-cards all
  **radius 48px**. Color varies per card, geometry never does:
  - flow-tab cards (413h each): sky `#3bd3fd`, chartreuse `#cbd810`, lavender `#a17bf9`,
    orange `#ff7714`, powder `#bedffe`, red `#fb4450`, pink `#ff70d2`
  - feature items (771h each): pale washes `#f0f8ff`, `#fff3ed`, `#fcfee2`, `#fff0fa`
- **Docking mechanic #1:** feature items have `border-radius: 48px 48px 0 0` — rounded top,
  square bottom — so each next card's rounded shoulders sit down onto the previous card's
  square base. The stack reads as sheets docked into each other, not floating separately.
  (They are `position: relative`, NOT sticky — it's a layout mechanic, no scroll-jack.)
- **Docking mechanic #2:** negative-margin emergence — a cream card (`#f4f3f0`, radius 48)
  with `margin-top: -228px` pulls up OVER the hero's bottom edge. The card surfaces out of
  the section above it.
- Gaps between cards on the rail: ~24px; section paddings 80px top.

Why it coheres: constant rail + constant radius + constant gap. Color is the only variable,
and it's one palette. The 48px radius is big enough to BE the brand.

## 3. linear.app — panel system on one continuous dark ground

Measured:
- Ground: `#08090a`, never changes for the whole page.
- Product frames: **1320px at x=60**, **radius 12px**, bg `#101112`,
  border `1px rgba(255,255,255,0.08)`, plus layered 1px "shine" strokes
  (`rgb(50,51,52)`, `rgb(56,59,63)`) and a grain overlay. Frames feel machined, not drawn.
- Architecture between frames: full-width 1px hairlines `rgba(255,255,255,0.08)` divide
  sections; feature trios separated by vertical hairlines (no boxes at all);
  **numbered index system** — "1.0 Intake", "2.1 Projects / 2.2 Documents / 2.3 Initiatives /
  2.4 Visual planning", "4.0 Diffs" — the page presents itself as one spec document.
- Split headline grammar: big left headline / right supporting paragraph, repeated per section.

Why it coheres: nothing changes but the content. Ground constant, hairline weight constant,
frame treatment constant; the numbering implies a single authored document. The product
panels are the only "cards" — everything else is lines — so the panels stay unambiguously
primary. (Most relevant lesson for keeping driftwood's artifact windows primary.)

## 4. rauno.me — labeled plates on a gray ground, instrument chrome

Observed (horizontal filmstrip site):
- Ground: light gray ~`#ececec`. Content = white rectangular plates (straight corners, no
  border, no shadow, no radius) — the gray ground alone separates them. Gaps ~24-32px.
- Convention: small gray caption label OUTSIDE each plate, top-left ("Devouring Details",
  "History of Software Design", "Projects") — museum wall-label grammar.
- Instrument chrome: ruler-tick pagination centered at top (a row of ticks + a small
  rectangle marking the current slide), "+" crosshair at plate centers, custom cursor.

Why it coheres: every plate treated identically; labels-outside is a strict convention; the
ticks/crosshairs speak in one instrument voice. Proof you don't need borders OR shadows OR
radius if the ground does the work.

## 5. berkeleygraphics.com — the page IS one object (document sheet)

Observed:
- Entire site is a fixed-width (~820px) white sheet centered on gray with a **1px solid
  black outline around the whole sheet** — a printed datasheet.
- Inside: labeled sections divided by dotted/dashed rules ("Office", "Frontpage Banner",
  "Projects"); color-calibration bars in the masthead; nav as a row of bordered buttons;
  projects in a strict 4-col grid of equal square 1px-bordered tiles.

Why it coheres: absolute grid discipline, everything bordered and flush. The most extreme
"sections that are squares" answer: make the whole page one square thing. Too stiff for
driftwood wholesale, but the "labeled section + rule" furniture is stealable.

## godly.website
Now redirects to "Recent" (modal over a masonry gallery). The gallery itself: three-column
masonry of white plates with tiny metadata captions beside each — same labeled-plates
grammar as rauno. Nothing structurally new; confirms the pattern.

---

## Cross-cutting mechanics (what actually makes a section read as an object)

1. **A ground that isn't white.** cal `#f4f4f4`, rauno `#ececec`, linear `#08090a`. Cards
   get object-hood from the ground, nearly free — borders/shadows are then optional garnish.
2. **One width rail, repeated exactly.** 1176@132 / 1280@80 / 1320@60. Never two rails.
3. **One radius, repeated exactly.** 12px = technical sheet (cal, linear); 48px = friendly
   tab (clay). The radius is a brand decision, not a per-card decision.
4. **Card gap << section padding.** Docked (0-24px, clay) or punctuated (~64px, cal). v7's
   current inter-section whitespace (~300-500px) would need to compress wherever cards touch.
5. **One furniture voice** to unify the leftovers: hairlines+crosshairs (cal), numbering
   (linear), outside-labels (rauno/godly), dashed rules (berkeley).

---

## Plans for driftwood

### Plan A — "Rafts on the water" (cal grammar, sea-tinted ground) — effort M
The literal answer to "sections that are squares and stack together well."

- **Ground:** page bg goes from `#ffffff` to a faint COOL sea tint — `#f2f5f8` (≈ #15557e
  at 3-4% over white). **FLAG / QUESTION FOR FOUNDER:** he rejected cream and dark mid-page
  bands; this is neither (cool, barely-there, uniform), but it needs explicit sign-off.
  Without a tint Plan A doesn't work — that's the load-bearing pixel.
- **Geometry:** each major section (#week-one, #how, #compare) becomes ONE white card:
  radius **16px** (deliberately > `--r-win:12px` so artifact windows always read as nested
  children), rail `min(1240px, 100% - 48px)` centered (~100px insets @1440, 24px gutters on
  mobile), internal padding ~4rem, **64-80px of ground showing between cards**.
- **Shadow:** tide-tinted, quieter than the window shadow:
  `0 1px 2px rgba(21,85,126,0.05), 0 16px 40px -24px rgba(21,85,126,0.16)` — the blue-cast
  shadow is the "floating on water" cue without saying it.
- **Hero:** stays full-bleed with the three.js sea — the sea becomes the page's opening
  ground and the tinted page reads as its continuation. First raft starts at #week-one.
  Close-CTA section sits directly on the ground (cal's move: not everything is a card).
- **Waterlines:** mid-page sine dividers RETIRED — the ground gap now divides. The wave
  survives in exactly two places: hero waterline and footer top. It becomes an event, not
  wallpaper.
- **Artifact windows:** untouched. White-on-white inside cards, same chrome — their border
  + shadow already carry them.
- **Mobile:** cards keep radius 16, 16-24px gutters, stack naturally. No JS.
- **Effort M:** one `.raft` wrapper class + bg var + delete mid-page dividers; retune the
  two pinned-scroll sections' paddings.

### Plan B — "Docked sheets, wave-cut seams" (clay grammar in tide washes) — effort M/L
The most branded option: the card seam and the waterline become the same mechanism.

- **Geometry:** sections become full-bleed-ish cards on the same rail, stacked FLUSH (no
  ground gap). Each card `border-radius: 24px 24px 0 0` — rounded shoulders docking onto
  the square base of the card above (clay's exact move, at half the radius for restraint).
- **Tint system:** alternate white / tide-wash, washes from ONE hue only:
  `#f4f8fb` and `#eaf1f7` (two steps of tide blue at ~3%/6%). No cream, no dark. Restraint
  rule: only 2 of 5 sections get a wash, so it never reads as stripes. Same founder
  sign-off question as Plan A applies.
- **The signature move:** the top edge of each wash card is cut by the existing 28px sine
  SVG via `mask-image` — a wave-cut shoulder. Divider and card merge into one object;
  the structure literally IS the tide. (CSS mask + the current data-URI wave, repeat-x.)
- **One overlap accent:** the week-one LinkedIn window pulls `margin-top: -48px` up over
  the hero's waterline — the first artifact surfaces out of the sea (clay's -228px move,
  scaled way down). Only this one; twice would be a gimmick.
- **Sea/footer:** hero unchanged; footer already reads as the deepest card in the stack —
  its existing white sine top edge now rhymes with every card seam above it.
- **Mobile:** identical stacking, radius drops to 16px, mask scales fine (repeat-x).
- **Effort M** (wrapper class + mask + tints); **L** if seams get parallax/scroll behavior
  — recommend NOT doing that (restraint, prefers-reduced-motion already in the file).
- **Risk:** closest to clay = most "designed"; if the founder wants quieter, A wins.

### Plan C — "Chart furniture" (cal crosshairs + linear numbering, zero tint) — effort S
The no-permission-needed option; compounds with A or B later.

- Keep the white page. Add the drafting system: two vertical 1px `var(--line)` hairlines
  inset 6vw running the full page height; every section boundary a full-width 1px hairline;
  "+" crosshair marks at the intersections. On a nautical brand these read as **chart
  registration marks** — grid rigor that's already ocean-flavored.
- Number the sections in the existing `.label` voice: "01 — week one", "02 — the agent",
  "03 — the sends", extending the 01/02/03 rail that already lives inside #how (linear's
  document-index move, already half-present in the draft).
- Waterlines: mid-page sines replaced by the hairlines; hero + footer waves stay (same
  two-events rule as Plan A).
- No new boxes anywhere → the artifact windows stay the ONLY boxed objects on the page,
  which keeps them primary by definition (linear's lesson).
- **Mobile:** rails at 16px insets; crosshairs `display:none` under 720px.
- **Effort S:** pure CSS furniture, zero layout moves, zero JS.
- **Risk:** it's a grid signature, not a card signature — quieter than the founder's
  "squares that stack" words. Honest framing: C alone may not satisfy the ask; C + A's
  ground is a strong combined answer.

### Recommendation
A is the closest literal answer to the founder's words with the least novelty risk; B is
the strongest brand fusion (wave-cut seams — structure = tide); C is nearly free and stacks
with either. In all three: section radius > window radius keeps artifact windows nested and
primary, and the sine wave gets scarcer, not louder.

Open question for the founder (blocking A and B): is a ~3% COOL tint (`#f2f5f8` family)
acceptable ground, given cream and dark bands were rejected? If no → Plan C, or Plan B with
white + a single wash.
