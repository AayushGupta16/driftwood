# Ref study G — page-wide 3D as a signature (2026-07-13)

Question: driftwood has a three.js sea under the hero and flat SVG squiggle dividers.
How do sites that weave 3D through the WHOLE page do it, and what's the right way to
extend our sea into a page-wide signature without breaking the white page / restraint /
artifact-window rules?

Method: loaded each site headless (playwright, 1440x900), counted canvases at 5 scroll
stops, logged position/size/visibility, measured rAF rate, screenshotted. Numbers below
are measured, not guessed.

Current v7 baseline (measured): ONE canvas `#sea` 1440x347 in the hero, three.js
low-poly plane, 30fps cap, reduced-motion + <52rem + load-failure all remove the canvas.
Dividers are a repeating 28px SVG sine. Footer is flat tide-blue with a wavy top edge.
Windows sit on/above the waterline in the hero — that overlap is already the best moment
on the page.

---

## Site-by-site

### 1. lusion.co — one fixed canvas, everything composited in GL
- Measured: 3 canvases — a fixed 1440x900 full-viewport `#canvas` (z auto, behind DOM),
  a 45x45 canvas inside the "Let's talk" button, and a 0x0 `#transition-overlay`
  (page-transition wipe). `document.body.scrollHeight == 900` → virtual scroll (wheel
  hijack; window.scrollTo does nothing). rAF ~120/s continuous.
- Where 3D lives: everywhere — hero is a physics pile of jack-shaped objects reacting to
  pointer; images/videos in later sections are GL textures drawn in the same scene.
- Tie to content: the objects ARE the portfolio ("we do real-time 3D"). Self-referential,
  works only for a studio.
- Perf strategy: one renderer, one loop, everything batched; custom engine (not three.js
  per their case study). They published the trick for keeping GL glued to native scroll
  without a fixed canvas: github.com/lusionltd/WebGL-Scroll-Sync — position the canvas
  absolute and re-offset it to scrollY every rAF, so if the browser scrolls between
  frames the canvas physically scrolls WITH the page (no swimming/lag). Keep this repo;
  it is the load-bearing technique for any plan below.
- Degrades: WebGL required for the real experience; reduced/failed → minimal static.
- Expensive because: physical motion (inertia, collisions), one coherent material world,
  GL and DOM never disagree. Gimmick risk they dodge: nothing spins idly; everything
  responds to input.

### 2. activetheory.net — full takeover, dark, virtual scroll
- Measured: ONE static 1440x900 canvas, scrollHeight 900 (virtual scroll), rAF ~90/s.
  Dark "portal" UI, loads to a dial (long preload).
- 3D everywhere, DOM nearly absent. It's a WebGL app, not a page.
- Verdict for us: the anti-pattern for a B2B product site — content unreachable until a
  93-step preload finishes. Study only for ambience-at-idle.

### 3. unseen.co — same architecture, plus an entry gate
- Measured: ONE `#gl` canvas 1440x900, scrollHeight 43 → fully virtual. Explicit
  "Enter / Enter without audio" gate before anything renders.
- Verdict: gates + audio + scroll-jack = everything the founder's restraint rule rejects.
  Confirms: the agencies' signature move (one fixed canvas, virtual scroll, DOM as thin
  overlay) buys total control but costs native scroll, SEO-ish content flow, and patience.

### 4. stripe.com — the counter-model: MANY small in-flow canvases, lazily mounted
- Measured (this is the goldmine):
  - At load: only 2 canvases exist (hero 1393x761 `hero-wave-animation__canvas`,
    plus one prebuilt carousel canvas far below).
  - By mid-page, canvases appear as you approach them → lazy instantiation:
    `agentic-graphic__background-canvas`, `issuing-graphic__background-canvas`,
    `globe__canvas` (three 447x728 product cards, each with its OWN canvas),
    `data-viz__canvas` 1234x519, `developers-wave-animation__canvas` 1232x460,
    `squeezy-carousel__canvas`.
  - And the detail that matters most for driftwood: **`divider-canvas` — 1264x20
    canvases used as section dividers.** Stripe literally renders its section rules as
    tiny animated canvases. Our SVG squiggle dividers have a direct upgrade path with
    precedent at the most conservative company in the study.
- Where 3D appears across scroll: hero (gradient mesh), product cards (globe etc.),
  data-viz wave, dividers — a rhythm of small moments, never a persistent background.
  All canvases are `static`/`relative` — in normal document flow, native scroll.
- Tie to content: globe = global payments; data wave = throughput; gradient = brand.
  Every canvas is an illustration of the claim next to it.
- Perf: per-component canvases mount on approach (IntersectionObserver pattern),
  off-screen ones are not in the DOM at all yet; each is small (20px-761px tall);
  page stays fully native-scroll. This is the "expensive feel with a budget" model.
- Degrades: components are self-contained; any one can fall back to a static image
  without the page noticing.
- Expensive because: restraint + rhythm. Gimmick risk dodged: no canvas is decorative;
  each earns its section.

### 5. vercel.com/ship — many tiny 2D canvases as one texture system
- Measured: six 229x212 canvases in a grid, `[image-rendering:pixelated]`, compact page
  (scrollHeight 900), native flow. Dot-matrix/LED type rendered per-canvas ("Sydney,
  07.30" etc.).
- Not page-wide 3D — but the lesson is identity-through-one-rendering-system: every
  canvas uses the same pixel-LED language, so six small canvases read as ONE signature.
  Cheap per-canvas, unmistakable in aggregate.

### 6. chartogne-taillet.com (Immersive Garden) — the canonical "scroll = voyage"
- Measured: ONE fixed 1440x900 canvas at z:0, scrollHeight 0 → virtual scroll; DOM text
  floats above. (Age gate at entry.)
- The experience behind the gate: scrolling travels the camera across a hand-drawn 3D
  map of the vineyard's terroir; sections are places on the map; text panels fade in as
  you arrive. Scroll isn't "down a page," it's "across a landscape."
- Tie to content: the land IS the product (champagne terroir). The voyage framing is
  total: navigation = geography.
- Verdict: the purest expression of the founder's "page as voyage" idea — and evidence
  that it demands full commitment (virtual scroll, one canvas, DOM subordinated).
  Half-voyages read as broken.

### 7. igloo.inc (Abeto, Awwwards SOTY 2024) — the descent/underwater close, done at 10/10
- Measured headless: 0 canvases (WebGL gate refused the headless GL context → their
  no-WebGL path shows a static fallback; itself a data point — they hard-gate).
- From their public case study (awwwards.com/igloo-inc-case-study.html,
  webgpu.com/showcase/igloo-inc-procedural-crystals): built entirely in WebGL
  (three.js + three-mesh-bvh + Svelte + GSAP); scroll rotates/descends through an
  iceberg — above water → below the waterline, where the portfolio companies sit in ice;
  compressed KTX2 textures, request-idle loading, prefers-reduced-motion fallbacks,
  LCP ~1s claimed despite the load.
- Tie to content: "one shard above the surface, the mass beneath" = holding company
  metaphor. The above/below-waterline transition is the single most-cited scroll moment
  of 2024-25 — and it is exactly the physics our brand already owns.
- Expensive because: ONE metaphor, executed end-to-end; the waterline crossing is
  earned by everything before it.

---

## Cross-site conclusions

1. Two viable architectures, no third:
   a) **One fixed/absolute canvas + choreographed camera** (lusion, chartogne, igloo,
      activetheory, unseen) — maximal signature, but every example either hijacks
      scroll or subordinates the DOM. Agencies and brand-monoliths only.
   b) **Many small in-flow canvases, lazily mounted, one shared visual language**
      (stripe, vercel/ship) — native scroll, DOM stays king, each canvas pausable/
      droppable. The only pattern in the study compatible with "white page, restraint,
      don't fight the artifact windows."
2. The signature does NOT come from canvas size or count — it comes from ONE rendering
   language repeated (stripe's gradient family, vercel's LED pixels, igloo's ice). We
   already have the language: the low-poly tide-blue sea. It appears once. Repetition
   is the missing ingredient.
3. Performance playbook that every good site shares: lazy-mount on approach, pause
   off-screen (or don't exist off-screen), cap DPR, cap fps for ambient motion (we
   already do 30fps), reduced-motion → static, WebGL-fail → static. Stripe mounts
   canvases only near the viewport; igloo hard-gates and ships a static fallback.
4. Expensive vs gimmicky, distilled: expensive = the 3D restates the section's claim in
   physics (globe=global, descent=beneath-the-surface, waterline=voyage); slow, damped,
   input-aware motion; GL pinned to scroll with zero lag (lusion's scroll-sync).
   Gimmicky = persistent background noise, idle spinning, 3D that would survive a
   copy swap unchanged.

---

## Plans for driftwood (existing sea → page-wide signature)

The brand story that makes all three plans cohere: **the page is one body of water.
The hero shows its surface; every section boundary is the same waterline crossed again;
the footer is beneath it.** Scroll = the voyage from surface to depth.

### Plan A — "The sea resurfaces" (Stripe pattern) — effort S/M  ★ recommended first step
- What renders where: keep hero sea exactly as-is. Replace each 28px SVG squiggle
  divider with a **live waterline strip**: a ~100-140px-tall, full-width, in-flow canvas
  rendering the SAME sea (same geometry/material module, camera at a grazing angle so
  the swell silhouette reads as the divider line against white above and white below).
  Footer: raise the sea once more as the footer's top edge, then the footer's tide-blue
  block gets a barely-moving caustic light texture (same shader family, near-static) —
  "the sea seen from below."
- Scroll behavior: native, untouched. Each strip's wave phase is seeded from its
  document Y so the water reads as one continuous body (the crest positions line up
  with where the hero sea "went"). Optional single nicety: strip amplitude eases up
  slightly as it enters the viewport (IO ratio), like a swell arriving.
- Canvas strategy: one shared three.js module; either N small canvases each with a
  cheap renderer (Stripe's model — fine at 3-4 strips, only ~1 visible at a time) or
  one renderer + `preserveDrawingBuffer` blits. Simpler = per-strip canvas + IO
  start/stop: **render only while intersecting**. Net GPU cost ≈ today's hero alone.
- Fallback: exactly today's SVG squiggle (keep it in the DOM under the canvas; canvas
  covers it when live). Reduced-motion/mobile/WebGL-fail = current v7, pixel-identical.
- Why it wins: zero risk to windows/copy/scroll; turns our one 3D moment into a
  page-rhythm; direct precedent (stripe's divider-canvas).

### Plan B — "One waterline that travels" (single roaming canvas) — effort M
- The signature move: there is only ONE waterline on the whole page, and it moves.
  A single 100vw x ~200px canvas, positioned absolute and re-pinned every rAF (lusion
  scroll-sync technique) to the nearest "anchor": hero base → divider 1 → divider 2 →
  footer top. Between anchors it eases, so scrolling feels like the same swell
  accompanying you down the page — the sea you met in the hero keeps reappearing,
  because it literally is the same canvas, never unmounting, never duplicated.
- Buoyancy tie-in (the founder's "windows floating" idea, restrained): only the
  artifact window nearest the live waterline gets translateY = the same sine stack the
  sea uses, sampled in JS at the window's x (amplitude 2-3px, no GPU readback). Windows
  far from water sit perfectly still — buoyancy becomes information ("this artifact is
  on the water right now"), not decoration.
- Close section: at the final anchor the band eases taller (to ~60vh) and the camera
  dips just under the surface — white page above the waterline, tide-blue below with
  faint god-rays; the "See what we'd send your prospects" block sits half-submerged;
  footer below is fully underwater (its existing blue = depth). One moment of drama,
  earned, at the exact point the page asks for the demo.
- Scroll: native. One canvas, one renderer, renders only when an anchor is within
  ~1.5 viewports; 30fps cap kept; DPR capped at 2 (already done).
- Fallback: SVG squiggles + flat footer (current v7). The canvas is additive.
- Risk to manage: the re-pinning must be rock-solid (use lusion's absolute+offset
  trick, never `position:fixed` + translate, or the water swims against the page).

### Plan C — "The descent" (igloo-grade voyage: surface → depth) — effort L
- The full metaphor: the page is a vertical column of ocean. One fixed z:0 canvas
  behind everything, white DOM sections floating above it like the artifact windows
  float in the hero. Scroll maps to depth: hero = at the surface (current scene);
  mid-page = the waterline sits between sections, visible in the designed white gaps
  (canvas is fully white/fogged-out behind text blocks — the white page RULE is kept by
  fog, not absence); the "AI slop vs driftwood" comparison happens right at the
  waterline (slop email half-sunk on the left is a joke that writes itself — optional);
  final section crosses below: background shades to tide blue via the canvas, faint
  particles + light shafts, footer = looking up at the underside of the waves
  (inverted sea mesh overhead, sun-glint through it).
- Scroll: NATIVE (this is where we deviate from igloo/chartogne — no virtual scroll).
  Camera y = -scrollY * k with damping; section DOM stays ordinary. Windows get the
  Plan-B buoyancy near the waterline only.
- Canvas: one; render-on-demand (skip frames when the visible band is pure fog-white
  and no motion would be visible — most of mid-page costs ~0); 30fps ambient cap.
- Fallback tiers: (1) full experience desktop; (2) reduced-motion → static gradient
  waterline + current SVGs; (3) WebGL fail → v7. Mobile ships tier 2 by default.
- Risk: this is the plan that can tip into "decorative noise" — it lives or dies on
  the fog discipline (mid-page must look 95% like today's white page). Only attempt
  after Plan A proves the divider language; A upgrades into C (same sea module).

### Recommendation
Ship A (S/M, pure upside, Stripe-sanctioned), then graduate to B (M) — B is the
distinctive one: "the site with the one waterline that follows you down." Hold C (L)
until there's a week to spend on fog discipline and an underwater footer we'd defend
to the founder's restraint bar. All three reuse the existing sea module, keep native
scroll, keep the white page, and never animate an artifact window more than 3px.

Sources: measured audits (this file's numbers) + lusion WebGL-Scroll-Sync
(github.com/lusionltd/WebGL-Scroll-Sync), Awwwards case studies for Lusion
(awwwards.com/case-study-for-lusion-by-lusion-winner-of-site-of-the-month-may.html)
and Igloo Inc (awwwards.com/igloo-inc-case-study.html), webgpu.com Igloo write-up.
