# Reference study — what great sites actually do, section by section

Studied 2026-07-13, full pages via playwright at 1440px, section by section:
Linear, Stripe, Vercel (`/tmp/ref-study-a.md`), Clay, Attio, Resend
(`/tmp/ref-study-b.md`), Raycast, Mintlify, Cursor (`/tmp/ref-study-c.md`).
Clay and Attio sell to driftwood's exact buyer. This file is the contract for
the landing rebuild; the tmp files hold the full per-site notes.

## Convergent principles (what 7+ of 9 share)

1. **Two-tone sentences replace headline/subhead.** One bold near-black
   phrase + a same-size gray continuation, both ending in periods. Stripe,
   Raycast, Attio, Clay all use this as the primary type device.
   ("Agents dig. You close." — Attio.)
2. **The accent is quarantined.** One color total; either buttons-only
   (Stripe purple) or text-links-only with black buttons (Cursor orange).
   All other color arrives *inside* product artifacts. Grayscale otherwise.
3. **Hairlines + whitespace are the structure.** 1px rules and 300-600px of
   air separate ideas; background color-blocks are reserved for at most ONE
   deliberate act-shift per page (Stripe's dark developer act). Mintlify runs
   full-height vertical hairlines framing the content column.
4. **Imagery = pixel-real artifacts, never illustration-of-concept.** Attio
   sells with fake-but-real CRM rows (OpenAI, Ramp, ICP score 94); Cursor's
   case section is a real Slack thread screenshot with chrome and avatars;
   Vercel shows customers' actual products. Real chrome (macOS traffic
   lights, timestamps, Send buttons) is what makes it believable.
5. **The metric is the headline, prose is subordinate.** Attio: "83% faster
   lead triage." AS the case-study headline. Clay interleaves metric tiles
   inside its logo wall ("3x REPLY RATE"). Cursor's quotes carry hard numbers
   from named people. Never a logo without a number.
6. **Word budgets are brutal.** H1 ≤ 12 words (Cursor's is 10 words at only
   ~34px). Section claim 3-6 words + one gray sentence. Bodies ≤ 30 words.
   Buttons 2-3 words, verb-first.
7. **Small hero, huge close.** Cursor's hero H1 is ~34px; its final CTA
   ("Try Cursor now.") is ~95px, the largest type on the page, with exactly
   one button. Confidence inversion.
8. **How-it-works = numbered chapters.** Linear's 1.0/2.0/3.0 mono-labeled
   chapters with hairlines between; Attio's workflow canvas with green
   "✓ Completed" pills.
9. **One coherent universe across all visuals.** Stripe's fictional Roastery
   recurs in every mock. For driftwood: the Superhuman story should be the
   SAME prospect in the thread, the demo still, and the dashboard shot.
10. **Numbers set in mono chips is craft, mono as a voice is costume.**
    Vercel/Mintlify/Raycast use monospace ONLY for tiny functional data
    (counters, FIG_01 labels, "● All systems normal"). As body/label font it
    reads AI; as data chips it reads instrument. Use sparingly or not at all.

## Application to driftwood, section by section

- **Nav**: wordmark + Log in + one filled pill. Nothing else. (Already true.)
- **Hero**: Cursor model. Two-tone H1 at ~32-36px, ≤12 words:
  "Ship a custom demo in every cold message." (black) "We build it and send
  it for you." (gray, same size). One button. The hero VISUAL is the real
  LinkedIn thread rendered as an actual LinkedIn window (chrome, avatars,
  timestamps, real copy, redaction bars) with the superhuman-demo video
  window overlapping it for z-depth (real still, play button, 0:19).
- **Proof strip** (replaces logo wall; we have one client): a single
  bordered grid interleaving the Autosana name with metric tiles, Clay
  style: "<1% → 14.3% replies" / "12h to a CTO reply" / "call booked".
- **Case study section**: Attio model. The metric IS the headline:
  "From under 1% replies to 14.3%." + one gray sentence ("Week one of
  running Autosana's outbound.") + the artifact. If the thread is already
  the hero visual, this section carries the demo video + the story in
  two sentences instead.
- **How it works**: Linear chapters wrapping the existing walkthrough
  animation: "1.0 Research / 2.0 Build / 3.0 Send" with hairlines.
- **Dashboard**: real screenshot in a macOS-chrome window, 1px border,
  minimal shadow, bleeding below the fold (Attio), one floating annotation
  chip ("Meeting booked · this week") instead of a caption.
- **Quote** (when we get a proper one from Yuvan): flat bordered card,
  quote-first, must contain a hard number, name + role. No photo cards,
  no sliders.
- **Final CTA**: the largest type on the page, "See what we'd send your
  prospects." + one button. Nothing under the button.
- **Global**: white page; near-black #191a1c; gray #66707c; hairlines
  #e8eaed; tide blue quarantined to buttons; system-neutral sans at
  weight 500-600, never 800; sentence case only; both headline lines end
  in periods; 300-600px air between ideas.

## Open choices (for Aayush)

1. Buttons: tide-blue filled (Stripe model) or black pills with blue
   reserved for text links (Cursor model)?
2. Mono chips for the 3 metrics (Mintlify number-chip style): yes, or
   zero mono anywhere?
3. One "act shift" section (e.g. the case study on a near-black band,
   Stripe-style) or a fully white page?
