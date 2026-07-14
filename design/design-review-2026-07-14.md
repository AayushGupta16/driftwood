# Design review — 2026-07-14

Requested by Aayush before sleep: responses to four thoughts + an overall
review against existing sites. Staged changes live on `redesign` (unmerged);
everything else here is proposal-only, tagged with effort (S/M/L).

---

## 1. Whitespace (agreed — staged a fix, cc9e8a4)

Measured at 1600×900 before the pass:

- Worst seam: compare → final CTA had **~550px of near-empty space**
  (96px strip + `clamp(5rem,9vw,7.5rem)` padding both sides of a short block).
- Pin transitions showed ~430px combined white: the week pin releases with
  its bottom ~220px empty, then the how pin enters with ~114px top margin.
- Page total: 6,823px.

Staged pass (on `redesign`, not merged): section padding
`clamp(3.5,7vw,6rem)` → `clamp(2.5,5vw,4.25rem)`, close-CTA padding trimmed,
pins tightened (week 145→130vh, how 165→155vh, compare 230→200vh), strips
96→80px with fuller masks (fades were wasting half the box). Page is now
**6,216px (−9%)** and every transition frame is denser. Also found and fixed
a real bug: the compare heading was pinning *underneath* the sticky header.

If it still feels airy after this, the remaining white is structural to
pinned sections — two proven patterns from the references:
- **Linq**: the pinned stage is full-bleed tall — cards overflow the viewport
  edge so no frame ever shows raw white. (M — our stage could grow to fill
  the pin.)
- **Browserbase**: artifacts sit on tinted panels, so "empty" space reads as
  designed canvas, not absence. We removed our blue washes earlier — a very
  light tint *behind the stage only* would be a scoped reintroduction. (S)

## 2. Video artifact for "builds them a custom demo" (agree in principle)

The honest inventory: driftwood's real sends have been **both** — a live
page (Joe's ordering page, notion-on-brex) and a video (the Autosana bug
demo that got the CTO reply). So a page isn't false, but the video is the
more distinctive artifact — nobody else's cold email contains a rendered,
branded, per-prospect video.

Options for step 02, in order of my recommendation:
- **(a) Muted 6–8s loop (M).** Render a real Brex demo video through the
  remotion pipeline (it's live on the fleet), drop it in the artifact window
  as `<video muted loop playsinline>`. Standard, robust, mobile-safe.
- **(b) Scroll-scrubbed video (L).** The pin already owns the scroll; the
  video scrubs frame-by-frame with it. This would be a signature move (very
  few sites do it well — Apple product pages) and fits the scroll-jack
  identity. Costs: keyframe-dense encoding, careful mobile/reduced-motion
  fallbacks, real QA time.
- **(c) Still + play affordance (S).** Cheapest, weakest — a still is what
  we have today, just reframed.

Suggested path: (a) now, consider (b) when there's a week to spend on it.
Until a Brex video exists, the current notion-on-brex page stays honest —
it IS what the agent built for the ask shown in step 01.

## 3. "Driftwood created this demo" attribution (agree — the gap is real)

Current evidence that we built the video in the thread: the small
"· sent by driftwood" timestamp and nothing else. After the Superhuman
anonymization ("found a bug on ██") the connection got weaker.

Two shapes for the fix:
- **(a) Persistent caption + hand-drawn arrow on the clip (S) — recommended
  first.** A short accent arrow (same language as the compare arrow) from a
  caption in the left column to the video clip: *"driftwood built this
  demo"* in the voice italic. Always legible, works on mobile where pins
  are off, no new choreography.
- **(b) Scroll-choreographed version (M) — his instinct.** After the dot
  grids finish filling (p > 0.86), the arrow draws itself and the caption
  fades in — a second payoff in the same pin. Riskier: the week pin already
  has one payoff (the dots), and stacking two can crowd the beat. If we do
  this, the caption must also have a static fallback.

Either way the copy matters more than the arrow: "driftwood built this
demo" (or "our agent built and sent this") placed AT the clip closes the
loop the section currently leaves open.

## 4. "Don't send out AI slop" / Joe's Pizza context (agree — weakest section now)

The rebuild contract said **one universe**. The page now runs a single true
story — Brex ask → built artifact → review queue → results at Autosana —
and then the compare section jumps to Square × Joe's Pizza with zero setup.
It's a leftover of the old site where Joe's was the worked example
throughout. Options:

- **(a) Re-universe the compare (M) — recommended.** Left: the generic slop
  email TO Brex ("Hey team, big fan of what you're building in spend
  management…"). Right: the real driftwood message with the notion-on-brex
  artifact — we already have both; the right card is literally the review-
  queue message. The page becomes one continuous story and the headline
  ("Don't send out AI slop." — still the best line on the page) stays.
  Cost: loses the Joe's order card, which is concrete and relatable.
- **(b) One framing line (S).** Keep Joe's, add a setup line: "Works for
  any business — here's a pizza shop in NYC." Cheap, but the universe still
  splits.
- **(c) Cut the section (S), move the headline** to sit above the final
  CTA as the kicker. Keeps the line, kills the stale example, shortens the
  page. Strongest pacing, biggest loss of content.

My vote is (a); this is a call only you should make since it's your
favorite section.

---

## Overall review vs. existing sites

### What works (keep, defend)

- **Real, sequential artifacts.** Linq and Spur show generic product shots;
  our three stage cards are a real Slack trace, a real built artifact, and
  a real review queue that tell one story in order. No reference site we
  studied has an artifact chain this honest. This is the site's biggest
  asset after the sea.
- **The signature.** ASCII sea + duck/log/ships is owned — the equivalent of
  Stripe's globe at 1/1000 the cost. It's restrained enough (low-contrast
  glyphs) that it never fights content. The duck is a personality bet, and
  the right one for a founder-led product at this stage.
- **Proof shape.** Metric-as-headline (14×), a named founder with a real
  photo, a thread with a diegetic payoff ("Call booked · Jul 12" inside the
  window). Ref-study-d's finding was that early-stage B2B fakes proof with
  logo walls; we don't.
- **Type discipline.** Public Sans + Source Serif wordmark + Georgia voice
  italics, accent quarantined to one blue. Heading scale unified. This is
  what separates it from AI-slop sites — hold the line here.
- **Scroll choreography.** Three pinned scrubs is ambitious (Linq does one).
  The dots payoff and the card crossfade both land.

### What doesn't (ranked)

1. **Pacing between beats** — addressed by the staged pass; structural
   options above if still airy (Linq full-bleed stage / Browserbase tinted
   panels).
2. **Compare section universe break** — thought #4, options above.
3. **Attribution gap on the video** — thought #3, small fix, high value.
4. **Hero orients slowly.** "Ship a custom demo in every cold message." is
   a strong claim but assumes the reader infers the category (AI outbound
   agent). Browserbase orients in one screen: plain-verb headline + four
   concrete use-case cards. Our subtext does the job on read #2. Cheap
   watch-item: the hero could carry one more concrete phrase (e.g. under
   the CTA), not a redesign.
5. **Mobile is functional, not choreographed.** Pins correctly collapse to
   static stacks, but the dot grids light all-at-once (payoff lost) and
   section rhythm depends entirely on padding. Acceptable for launch;
   worth a dedicated pass later.

### Comparative note

Linq's page is 8,812px, Browserbase 7,647px, ours 6,216px after the pass —
we are not long, we were *unevenly dense*. Length is not the issue;
distribution was. The staged pass moves us toward the reference sites'
constant-density feel without touching any content.

---

*Staged, unmerged: cc9e8a4 (whitespace pass). Everything else awaits your
call — the S items ((3a), (4b)) are same-day; (2a) needs a remotion render
for Brex; (4a) is a section rebuild.*
