# Ref study G — motion-as-signature & character/texture signatures

Date: 2026-07-13. Method: playwright visits to each site (1440x900, 3 scroll
depths, screenshots read), CSS harvested from inline styles + linked sheets and
regex-mined for easings/durations/keyframes; JS bundles grepped for spring
configs and shader charsets. Raw dumps in /tmp/ref-g/*-tokens.json (ephemeral;
key numbers reproduced below). Draft audited: landing-draft-v7.html.

---

## 0. Current draft v7 motion audit (what we already own)

- One curve everywhere: `cubic-bezier(0.16, 1, 0.3, 1)` (ease-out-expo family).
  Used for: hero window rise (0.65s, +24px→0), thread message stagger
  (0.45s, 110ms/item), dot-pop (0.35s, scale 0.3→1.35→1, 60ms stagger),
  stage swaps in the pinned scrub (0.45s opacity+transform), button hover
  (0.15s transform).
- Two pinned scroll-scrub sections (how-it-works rail; hand-drawn arrow draw).
- Global reduced-motion kill switch already present (0.01ms override).
- Verdict: we are already 70% of the way to a single-curve grammar — v7's
  problem is not the curve, it's that nothing about the motion says *water*,
  and idle states are dead (windows sit perfectly still).

---

## 1. Motion-as-signature sites

### raycast.com
- Palette of curves, but a clear primary: `cubic-bezier(.23,1,.32,1)`
  (easeOutQuint) — 21 uses, the house curve. Secondary
  `cubic-bezier(.4,0,.22,.96)` (11) for larger moves;
  `cubic-bezier(.34,1.56,.64,1)` (easeOutBack, real overshoot) reserved for
  exactly 3 playful pops. That reservation is the lesson: overshoot is a
  spice, rationed.
- Durations cluster hard: 0.15/0.2/0.3s for hover-tier, 0.4–0.6s entrance
  tier, hero fadeInUp 1s (once, on load).
- What moves: product windows, glows, marquee rows. What never moves: nav,
  body copy, headings (opacity only). Load = one hero fadeInUp; scroll =
  section fade-ups; hover = transform/opacity 0.2–0.3s.
- Signature feel comes from *consistent tiering*, not any single trick.

### linear.app + linear.app/now (release pages)
- Almost no easing exotica: plain `ease-out`, 0.18–0.4s. transition
  transform/opacity .4s is the workhorse. Motion is deliberately quiet.
- The /now release cards' real signature is TEXTURE, not motion: fine
  dot-and-hairline technical diagrams (dotted line-art, tiny square nodes)
  on near-black. Reads "engineering drawing", zero AI-slop smell.
- Lesson: restraint itself can be the signature when the texture carries
  the brand.

### family.co (the buttery-motion benchmark)
- CSS is ~10KB and contains ZERO keyframes/beziers — 100% of the motion is
  JS spring physics (framer-motion style) with inline styles. Mined from
  bundles, their real numbers:
  - Workhorse spring: `stiffness: 800, damping: 80, restDelta: 1e-4`
    (appears 7+ times) → damping ratio ≈ 1.41, i.e. OVERDAMPED: fast attack,
    zero visible bounce. "Buttery" ≠ bouncy.
  - Snappy variant: `stiffness: 2000, damping: 80` for small elements.
  - Bezier fallbacks: `[.19,1,.22,1]` (easeOutExpo — same family as our
    0.16,1,0.3,1) and `[.76,0,.24,1]` for symmetric moves.
- Everything interruptible/retargetable (springs, not keyframes): that's
  the real luxury feel — mid-flight redirect with no jump.
- What never moves: text blocks. Motion lives in the device/card demos.

### emilkowal.ski / vaul.emilkowal.ski / sonner.emilkowal.ski
- Personal site: nearly static; transitions 0.1–0.15s, standard material
  curve `cubic-bezier(.4,0,.2,1)`. The craft is typographic.
- Vaul + Sonner share THE Emil curve: `cubic-bezier(0.32, 0.72, 0, 1)` at
  0.4–0.5s — decisive start, extremely long soft landing, no overshoot.
  Sonner toasts: transform .4s + opacity .4s, stacked-card scale offsets.
  One curve, one duration, applied to one element class = whole brand.
- Strongest possible evidence that ONE curve + ONE duration on ONE element
  family is enough to be recognized.

### rauno.me
- One curve on the whole site: `cubic-bezier(.2, .8, .2, 1)` ("swift-out"),
  fades 0.25–0.5s. Interaction craft is in hover physics (photo tilt,
  cursor) not scroll. Again: single named curve, tiny palette.

## 2. Character/texture signatures

### agentmail.to (studied live)
- The rain is NOT DOM text — it's a WebGL fragment-shader canvas (parent
  class `shader`, 1374x1027 full hero bleed) drawing a digit charset
  ("0123456789", visually mostly 0/1) via a fillText glyph atlas, u_time
  driven slow fall. Dark gray glyphs (#2a2a2aish) on near-black, i.e.
  ~10-15% contrast: texture, never content.
- The rain CLUSTERS INTO SHAPES (envelope/cloud forms) — it's a shader
  masking glyph density by an image field, not uniform rain. That's why it
  reads designed rather than screensaver.
- Supporting texture kit, all static: dashed hairline section borders,
  corner-bracket ticks on buttons (`DOCS`), `[FAQ]` mono labels, plus/cross
  grid glyphs. Motion elsewhere is stock tailwind (0.15-0.3s) — the brand
  is 90% static texture, 10% one animated hero canvas.

### greypointindustries.ca
- Loads fine. Signature is 100% typographic/static: DIN-ish mono caps
  everything, cream background, letter-spaced labels, spec-sheet tables.
  Motion: one 44s logo marquee, clip-path 0.2s hovers. Nothing else.
- Lesson: terminal aesthetic works at ZERO animation cost; the grid and
  the type do the work. (godly.website terminal entries — e.g. agentmail
  itself is listed there — follow the same recipe: mono type + one animated
  field + static bracket/hairline furniture.)

---

## 3. Cross-site principles (what makes a signature)

1. One named curve, tiered durations (micro 0.15s / hover 0.25s /
   entrance 0.5-0.65s), applied to ONE element family (windows/cards).
2. Prose never translates. Headlines opacity-only. Nav static. (Every
   site above obeys this.)
3. Overshoot rationed (raycast: 3 uses in 345KB of CSS) or absent
   (family is overdamped!). Bounce everywhere = toy.
4. Texture signatures are ~90% static; at most one animated field per
   page, at background contrast (≤15%), density-masked so it forms shapes.
5. Springs (interruptible) are what "buttery" actually is; CSS `linear()`
   can fake them without a JS lib.

---

## 4. Plans for driftwood's signature

### Plan A — BUOYANCY motion grammar (prime candidate) — effort M
Everything settles like an object placed on water. One physics, page-wide.

Tokens (add to :root):
- `--ease-drift: cubic-bezier(0.16, 1, 0.3, 1)` — keep; for opacity, color,
  scrub stages, anything non-physical.
- `--ease-settle:` CSS spring via `linear()` ≈ stiffness 170/damping 15,
  ONE gentle ~3% overshoot then rest:
  `linear(0, 0.2178 2.1%, 0.5804 6.3%, 0.8768 11.3%, 1.0111 17.1%, 1.0355 20.2%, 1.0316 25%, 1.006 36.7%, 0.9992 48.2%, 1 100%)`
  fallback `cubic-bezier(0.33, 1.32, 0.55, 1)`. Used ONLY for transform on
  artifact windows + buttons (the raycast ration rule).
- Durations: entrance 650ms (keep), hover 240ms, micro 160ms.
- Entrance: keep rise (+24px→0) but switch its transform half to
  --ease-settle so windows visibly *land and settle*; opacity stays
  --ease-drift (no overshoot on opacity, ever).
- Idle bob: artifact windows only, `translateY` 0→-1.5px→0, 7s
  ease-in-out infinite, per-window phase `animation-delay: calc(var(--phase) * -1.75s)`
  so siblings are desynced (reads tide, not metronome). Max 3 bobbing
  elements in viewport; pause via IntersectionObserver when off-screen.
  Optional garnish: rotate(0.15deg) at the bob peak on the hero window only.
- Hover = "press into water": window/button translateY(2px→-2px) with
  --ease-settle 240ms + shadow softens (not grows). No scale.
- Never moves: headlines, prose, nav, waterline dividers, footer.
- Reduced-motion: existing kill switch covers entrances; add explicit
  `animation: none` on the bob (infinite animations survive 0.01ms hack as
  flicker risk); hovers degrade to shadow/color only.
- Anti-slop: no fade-on-every-section (unchanged from v7 — only windows
  enter), overshoot confined to transform on one element family, bob is
  sub-2px (felt, not seen).

### Plan B — Dot-matrix sea: the brand TEXTURE — effort M/L
Make the dot the brand atom; the 14x dot-grid viz becomes a chapter of a
page-wide system (linear /now's dotted-diagram move, driftwood-flavored).
- Hero: replace/underlay the three.js shaded sea with a dot-field sea —
  8px-grid dots on canvas, radius 0.5–1.75px and opacity 6–14% modulated by
  a 2-octave sine field drifting at ~0.02 cycles/s, tide blue #15557e.
  Density-mask it toward the hero window's waterline (agentmail's
  shape-clustering trick) so it reads as water under the artifact, not
  wallpaper. One animated field per page (principle 4) — the three.js sea
  and the dot sea don't both animate.
- Static echoes (zero animation): dot-grid rules replacing 2 of the sine
  dividers; footer sea = 3 rows of pre-rendered dots at falling density;
  dotted hairline diagrams inside artifact windows (linear style).
  Optional unicode route for mono contexts (email/docs): braille column
  glyphs `⡀⡄⡆⡇` — but canvas dots stay on-brand with the 14x grids.
- Reduced-motion: freeze field at t=0 (it's a texture; a static frame is
  fully legible). Prefers-reduced-data / no-JS: pre-rendered SVG.
- Anti-slop: dots are already in the product viz, so the texture is
  *derived from content*, not decoration; contrast capped ≤14%.

### Plan C — Wake accents: ripple hover + ASCII sea footer — effort S
The cheap, high-character package; compatible with A or B.
- Wake hover on artifact windows: a 1px border-radius-matched ring
  (pseudo-element, border 1px solid rgba(21,85,126,.25)) scales 1→1.06 and
  fades over 650ms --ease-drift ONCE on mouseenter — a single expanding
  wake line, not material-ripple. On the two CTAs only, same wake on click.
- ASCII sea in the footer: inside the existing tide-blue band, 2–3 rows of
  `~ ‾ ·` in ui-monospace at 20% white, JS swaps a phase-shifted string 8x/s
  (steps-style, deliberately low-fps so it reads terminal, not simulation).
  ~30 lines of JS. This is the only animated texture on the page.
- Reduced-motion: wake off (hover keeps shadow), footer sea static frame.
- Risk: ASCII in the footer is a borrowed agentmail gesture — ours must
  stay waveform (`~`), never rain, or it reads copied.

### Recommendation
A is the signature (it's motion the founder asked for, it's ownable, and
v7's single-curve discipline means it's an upgrade not a rewrite). Ship A,
then B's *static* echoes (footer dots + dotted diagrams) as the texture
layer — B's animated hero sea only if the three.js sea gets retired. C's
footer ASCII sea is the S-sized test balloon if we want character art
this week without touching the hero.
