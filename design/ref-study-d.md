# ref-study-d — landing v4 research (dashboard hero, conversation section, real social proof, de-AI-ing)

Date: 2026-07-13. Input for the v4 rebuild of `site/design/landing-draft-v3.html`.
Screenshots live in `/tmp/refshots/` (`<site>-full.png`, `<site>-s0..s5.png`, `corgi-spot*.png`, `default-spot*.png`) — regenerate with `/tmp/refshots/shoot.mjs` if gone.

## 0. Current state (v3) + the founder's complaints

v3 structure, top to bottom (see `v3-full.png`):
1. White hero: left-aligned two-tone headline ("Ship a custom demo in every cold message. / We build it and send it for you."), pill CTA + text link, then a LinkedIn-thread browser window (traffic lights + `linkedin.com/messaging` chrome) containing the Autosana→Superhuman thread with embedded demo video and "Call booked." footer.
2. Full-bleed BLACK band: "From under 1% replies to 14.3%." + 3 huge stats (<1% / 14.3% / 12h) — the band the founder hates.
3. "The agent does the whole job." + video.
4. "How Square would use driftwood" Gmail-mock carousel.
5. "Replies and booked calls, live." + the actual driftwood dashboard shot ("Welcome back, Yuvan." + LinkedIn-connected banner + metrics + pipeline funnel + lead-list card, with a floating "Meeting booked · this week" toast).
6. Big centered "See what we'd send your prospects." CTA.

Complaints: (a) dashboard shot should be the hero, not the LinkedIn window; (b) the dark stats band is ugly — move the LinkedIn conversation there; (c) social proof still not "real and proper"; (d) still faintly AI-generated.

Domain notes: getcorgi.com is a hijacked spam domain (redirects to an Indonesian gambling page), corgi.ai has an expired cert. The founder means **corgi.insure** (Corgi Insurance, YC S24, full-stack insurance carrier, $108M raised 1/2026). corgilabs.ai is an unrelated payments company — ignore.

---

## 1. corgi.insure — the strongest overall reference for (b), (c), (d)

Light warm-cream page, orange brand accent, visible hairline grid: sections sit inside a column grid whose vertical rules extend past the content (Stripe-style guides). Playful but precise.

**Hero.** Photographic sky background (real clouds), an illustrated corgi in a red superhero cape flying top-right, a sculpted hand holding a phone bottom-left. Centered headline "Business Insurance at the *Speed of Compute.*" — roman sans for line 1, ORANGE ITALIC SERIF for the accent phrase (two-voice typography done with style contrast, not gray-on-black). Small sub ("No confusion, no waiting... built for founders by founders"), single orange CTA. Below the fold edge: customer logo marquee (Bland, deel, Slash, Eragon, intryc, Origami, The Prompting Company, AthenaHQ...). NOT a product-shot hero — its value to us is voice + grid + proof density, not layout.

**The single-quote section (their answer to our dark band).** Right after the marquee: a dark rounded-corner card (inset card, not a full-bleed band) introducing the company ("Corgi is an AI-native, full-stack insurance platform...") with a photo of REAL PAPER policy documents tilted on the right. Then, on the cream background, a full-width centered pull quote in very large type: *"The minute I hit submit, documents come back, a Slack channel gets created, and the founding team messages me. It's beautiful."* — intryc logo above, avatar + name below. One customer, one moment, given an entire section. No stat digits anywhere near it. This is exactly the register the driftwood conversation section wants.

**Customer stories ("Built for *Founders* Who Ship").** Headline with italic-serif accent word, sub "Why startups get insured with Corgi.", a "Read customer stories" pill on the right. Then a horizontal row of large photo cards: CANDID REAL PHOTOS of each founder (speaking on stage with mic, event portrait, casual office shot) with the company name as huge faded watermark text behind them, and a white footer strip on each card: tiny avatar chip + "Isaiah N. Granet / Co-Founder CEO @ Bland", "Finn Mallery / Co-founder @ Origami", "Andrew Yan / CEO @ [company]", "Josh Sirota...". Below the photos: their quote paragraphs. Photos of real humans ≫ logos for early-stage credibility. Four customers total — presented like a magazine feature, so it reads "we know each of these people," not "wall of testimonials."

**Product UI mid-page.** The quote-flow UI ("Financial details" form) is shown inside a chunky ORANGE rounded frame (thick colored mat around a white card), cropped, with a fake macOS cursor mid-drag and a Figma-multiplayer-style blue name-tag pill on a file being uploaded labeled "Important Document, Probably" — a joke inside the mock. Annotated, humanized product shots. Section beside it is plain text: bold claim + "Best for:" + CTA.

**Other.** Personality everywhere: corgi photos flopping into the policy grid, ASCII "0101" glitch art, honest FAQ copy ("Do I really need insurance before we have revenue?"). Footer tagline: "Corgi Provides the Insurance Built for Founders. Move fast. Break things. Stay covered, under one roof." Anti-AI feel comes from specificity + jokes + real photography.

**Motion:** marquee scroll on logos; gentle scroll fades on section entry; hover states on cards; the fake-cursor vignette implies motion even as a static. Nothing parallax-heavy.

## 2. monaco.com — investor-quote social proof, luxe restraint

"The first revenue engine for startups." Dark (near-black) page, serif display (Canela-ish) + tiny sans UI text, extreme whitespace.

**Above-the-fold social proof, before any product claim:** a 3-column row of NAMED INVESTOR QUOTES — "Garry Tan / Monaco Investor: 'Monaco solves go-to-market risk for founders without sales backgrounds.'" · "Peter Thiel / Founders Fund + Monaco Investor: 'No product sells itself — though Monaco comes close.'" · "Ryan Petersen / Founder, Flexport + Monaco Investor: 'Every founder needs to put their startup on Monaco before their competition.'" Name in serif, role in small gray caps, one-line quote. Directly under that: a full-width FOUNDER VIDEO (founder facing camera in a moody room, play button). Only then the H1.

Lesson for (c): when you can't show many customers, show a few UNIMPEACHABLE NAMES with one-liners and put them early. driftwood's equivalents: investors, the Autosana founder, the Superhuman CTO reply itself.

**Body:** black sections, left serif headline ("Time to value", "Agents working for you"), right side an accordion of 3 items where the ACTIVE item has a white vertical progress bar that fills as it auto-advances (scrolljacking-free scrollytelling). Almost no imagery. Feels expensive via type + restraint. Risk: at driftwood's stage a black site can read as vaporware — Monaco earns it with Thiel/Tan names.

## 3. mercury.com — the canonical product-shot + quote treatments

**Hero:** cinematic photo (desk + chair on a mountain ridge at dawn), centered white serif "Radically different banking", email field + CTA, and a tiny legal line at the bottom of the fold ("Mercury is a fintech company, not an FDIC-insured bank..."). The famous older Mercury hero (still the pattern to steal) was: headline left, DASHBOARD floating right, slightly overlapping the fold, on a dark backdrop.

**Product shots mid-page:** dashboard UI cut into CARDS — they crop the dashboard into 2–4 feature vignettes (a balance card, a transactions table, an approvals modal) each in its own rounded panel on the dark background, arranged in a grid, rather than repeating one giant screenshot. Each vignette pairs with a one-line caption. Lesson: crop the dashboard to the ONE region that proves the current sentence.

**Quotes, two registers:**
- Video-card quote: full-width dark card, photo of Karri Saarinen (Founder, Linear) right, quote overlaid left: "Unlike most financial institutions, Mercury is built on software..." + name/title. Play affordance.
- Naked centered pull quote on a LIGHT section: Paul Copplestone (Founder and CEO, Supabase) — quote in large type, name bold, title gray, NO card, NO border, just whitespace. The "no-chrome quote" reads most human.

**Stats:** "You're creating something to stand the test of time. So are we." then 4 stats in a LIGHT section, modest size (300K+ customers / 1 in 3 US venture-backed startups / $20B+ deposits / 4.9 App Store) with sentence-case labels, plus press/news cards (dark) with arrow buttons. Stats live low on the page, after the human proof — never as a shouting black band right after the hero.

**Motion:** sections fade+rise ~24px on first scroll-in (once), logo marquee, subtle parallax on the hero photo. Durations feel 400–600ms, ease-out.

## 4. cal.com — hero-card with embedded REAL product UI (best pattern for (a))

**Hero:** whole hero sits inside one big white rounded-rect CARD on a light-gray page (the card edge visible on all sides ≈ 16–20px margin). Left column: version-release pill ("Cal.com launches v6.6 ›"), H1 "The better way to schedule your meetings", gray sub, two stacked CTAs (black "Sign up with Google", secondary "Sign up with email"), "No credit card required" microcopy. Right column: the ACTUAL booking UI — profile card + calendar month view — cropped and BLEEDING OFF the card's right edge (implies the product is bigger than the viewport). Under the product shot: Trustpilot/Product Hunt/G2 star rows. Below the hero card: "Trusted by fast-growing companies around the world" + gray logo row (Deel wordmark-adjacent, PlanetScale, Coinbase, Storyblok, AngelList...).

**Product sections:** flat white cards, 1px gray hairline borders, real UI screenshots (availability editor, event-type list, app-store integrations) — no fake gloss, no perspective tilt. Screenshot quality IS the design.

**Social proof:** "Don't just take our word for it" single highlighted quote band, then a "See why our users love Cal.com" TWEET WALL: real tweet cards (avatar, handle, timestamp, imperfect punctuation, inline @mentions/links rendered blue). The artifacts of real platforms (handles, timestamps, typos) are what make it feel real — same trick as driftwood's LinkedIn thread, but they let the platform chrome be subtle (cards look like tweets, not a fake browser).

## 5. default.com — dark product-led GTM site (closest category neighbor)

Dark charcoal, hairline-bordered sections (visible 1px column rules), Inter-ish sans.

**Hero:** banner ("We set aside $1.5M to buy out legacy go-to-market contracts — Claim buyout ›" — a growth-hack banner with a number, very founder-brained), H1 "Replace your legacy go-to-market stack" LEFT, one-para sub RIGHT (two-column hero text), CTA. Below: dimmed customer logo row (Coartha, Decagon, Owner, Listen, Profound...), then the PRODUCT — a dark dashboard in a rounded window frame filling the fold bottom, top-cropped by the fold. Product UI is dark-on-dark: window blends with the page, only a soft border + glow separates it.

**Body:** every feature = a UI vignette in a bordered panel (workflow graph with animated beads, "Ask Anything" agent input, version-history popover, audit-log cards) + short kicker/caption. Screenshots animate in with fade+rise, staggered; some have looping micro-animations (nodes pulsing) that make the mock feel alive.

**Social proof:** eyebrow "What our customers say", huge headline **"The world's best revenue leaders are building their orgs on Default"**, a dimmed logo marquee, then a 2×3 grid of quote cards — flat dark cards, 1px border, quote up top, avatar + name + role+company bottom (Mack Caruso — Director of Revenue Operations, Bland AI; Sarah Madden — Head of Revenue Operations, FERMAT; Austin Hughes — CEO, Unify; etc.). Titles are specific (RevOps directors, not "customer"), which sells B2B credibility. Closing section repeats integration icons + CTA.

## 6. baseten.co — editorial grid + logo-led quote cards

Light page, black text, GREEN accent, blueprint personality: dashed hairline rules everywhere, isometric line-art diagrams of infra with tiny mono labels ("2403 REQUEST/M", "66 TPS", "YOUR CLOUD ✓"), mono ALL-CAPS button labels ("GET STARTED", "LEARN MORE ›").

**Hero:** left-aligned massive "Inference is everything", short sub, two CTAs ("Talk to an engineer" as secondary — good B2B copy), isometric diagram right, then a two-row LOGO WALL in bordered cells (Abridge, Clay, Cursor, Decagon, Descript, ElevenLabs, Gamma, Harvey, Lovable, Notion, OpenEvidence, parallel, poolside, World Labs) — cells, not floating grays, so the wall feels architectural.

**Customer quotes:** "What our customers are saying" as a big left headline WITH a "SEE ALL ›" button, then a STAGGERED/masonry arrangement of white cards separated by dashed rules (not a uniform 3-col band): each card = big company LOGO on top (OpenEvidence, ClickUp, Writer), quote with concrete numbers in it ("160 millisecond latency is crazy", "sub-300ms transcription with no unpredictable latency spikes"), then small avatar photo + mono-caps name/title. Numbers live INSIDE the quotes, spoken by customers — infinitely more credible than a stats band. Offset card tops (columns start at different y) kill the "template band" look.

## 7. doss.com — dark illustration hero + vertical customer stories (weakest fit, one good idea)

Dark hero "DOSS Operations Cloud is the ERP evolved" + blue isometric 3D stack; product table-UI screenshot right below the fold; then light gray sections on a visible grid. "Trusted by apparel leaders" — customer-story CARDS with real warehouse/team PHOTOS + a short story + logo, in a vertical rail. Serif accents on section titles ("More value, no ERP tax"). Very long page (13k px), watermark background wordmarks. Takeaway: real-workplace photography as proof, and light/dark section alternation done by keeping ONE background family (dark → light gray → dark) rather than slapping a black band into a white page.

## 8. tako.so — not a comparable

Web3 "composable social network" protocol; mascot branding, scalloped section dividers, investors band (SevenX, Mask, OKX Ventures...) + ecosystem-partner logo cloud. Not a B2B SaaS reference; skip for v4. (Only reusable idea: "Investors" as a labeled row when customer logos are thin.)

---

## Answers to the founder's 4 complaints

### (a) Dashboard as hero
Pattern to copy: **cal.com hero-card** (product UI cropped + bleeding off the right edge of a rounded hero card) crossed with **default.com** (dashboard window bottom-cropped by the fold so it clearly continues below).
Recipe for v4:
- Keep headline left / product right (or headline top, dashboard below at ~60% visible, cut by the fold — the crop is what says "real app, not brochure").
- Use the REAL dashboard ("Welcome back, Yuvan." + LinkedIn-connected banner + meetings-booked metric + pipeline funnel) exactly as it exists in v3's section 5 — traffic-light window chrome or a bare rounded panel with 1px border + soft wide shadow (shadow blur large, y-offset small, low opacity; no perspective tilt, no glossy mockup).
- One live-feeling annotation maximum, e.g. the existing "Meeting booked · this week" toast, floated half-off the window corner (cal.com puts stars there; corgi puts a fake cursor — an artifact that implies a running app).
- Keep the numbers inside the dashboard REAL and consistent with the story (1 meeting, 2.9% reply → don't inflate; internal consistency is an anti-AI tell in our favor).
- Under the hero: one-line proof strip, not stats: "Runs outbound for Autosana + [n] design partners" or logo/wordmark row if permissible.

### (b) Kill the dark stats band; LinkedIn thread lives there
Pattern to copy: **corgi.insure's single-quote section** + **mercury's no-chrome pull quote**.
Recipe for v4:
- Same white/cream background as the rest of the page (a full-bleed black band mid-white-page is the template tell; corgi's only dark moment is an inset rounded card, and doss alternates within one palette family).
- Section = eyebrow ("Week one, Autosana") + one narrative headline ("From under 1% replies to 14.3% in week one.") + the LinkedIn thread window moved down here from the v3 hero, ~720px wide, centered or offset with the story text beside it.
- Demote the three stats to a small inline row (baseten-style: numbers inside the story, sentence-case labels, normal weight) or delete <1%/12h and keep only "14.3% reply rate · 1 call booked" as a caption under the thread. Mercury holds stats until late-page and keeps them light; nobody studied uses a black stat band.
- Keep the receipts: "Real thread, only the name redacted", timestamps, "4 months, no reply" divider — these artifacts ARE the proof (cal.com tweet-wall logic).

### (c) Social proof that feels real at n≈1 customer
The studied moves, in order of power for driftwood:
1. **One customer, full feature** (corgi): give Autosana a named mini-case-study — real candid photo of Yuvan (or Autosana logo + avatar), his words as a large pull quote, role + company spelled out. One deeply-told story > any wall.
2. **The reply as proof** (cal.com tweets): the Superhuman CTO's reply IS the testimonial — style it as the platform artifact it is, with timestamp ("Jul 10 · 12 hours later") and imperfect casing ("send me a blurb + demos... - best").
3. **Named adjacent authority** (monaco): if any investor/known founder will give one line, run 2–3 name+role+one-liner columns near the top. Roles must be specific (default.com's "Director of Revenue Operations, Bland AI" pattern).
4. **Quotes carry the numbers** (baseten): put metrics in the customer's mouth, not in bands.
5. Never: generic 3-col testimonial band with stock avatars, star ratings without a platform, "Trusted by 100+ companies" without names.

### (d) De-AI-ing the page
What separates these sites from template output:
- **Two-voice headlines via style, not gray**: corgi/doss use an italic-serif accent phrase in the brand color; v3's gray second sentence is the common AI-output pattern — replace it.
- **Visible structure**: hairline column rules extending past sections (corgi, baseten, default) — a deliberate grid reads designed.
- **Artifacts of a real, running business**: fake cursor + multiplayer name-tag (corgi), release-version pill (cal.com), "$1.5M buyout" banner (default), legal footnote (mercury), timestamps/redactions (driftwood already has these — lean in).
- **Copy with jokes and specifics**: "Important Document, Probably", "Move fast. Break things. Stay covered.", "Talk to an engineer" instead of "Book a demo" as the secondary CTA. One or two dry jokes in mock UI or microcopy.
- **Real photography** somewhere (corgi's paper documents + candid founder photos, mercury's landscape, doss's warehouses) — an all-vector/all-screenshot page is another tell.
- **Asymmetric composition**: baseten's offset quote-card tops, corgi's overlapping photos; avoid every section being centered-headline-then-centered-content.
- **One accent color used bravely** (corgi orange, baseten green) vs. v3's blue-only-in-links.
- **Delete section-fade-on-every-block** (see motion rules — it's called out by the impeccable reference as "the saturated AI default").

---

## Motion rules for v4 (from /tmp/impeccable/.claude/skills/impeccable/reference/animate.md)

1. **One hero moment.** Brand register: "one well-rehearsed entrance beats scattered micro-interactions." Spend the whole budget on a single signature: the dashboard hero settling in (e.g. window rises 24px + fades in 500–700ms, its toast pops 150ms later).
2. **Whole-section fade-on-scroll is the AI tell.** "The saturated AI default is fade-and-rise reveals on every scrolled section; that's a tell, not a choreography." Reserve scroll-triggered motion for moments that earn it — the LinkedIn thread's messages, the hero. Everything else just exists.
3. **Sibling stagger only for real lists.** Stagger message bubbles in the thread (`animation-delay: calc(var(--i) * 50ms)`), cap total ≤500ms. Do NOT stagger sections.
4. **100/300/500 rule.** 100–150ms button/hover feedback; 200–300ms state changes (accordion, nav); 300–500ms layout; 500–800ms only for the one entrance. Nothing above 800ms.
5. **Ease-out curves, never bounce.** `cubic-bezier(0.16, 1, 0.3, 1)` (expo) or `(0.22, 1, 0.36, 1)` (quint). Bounce/elastic "feel dated and draw attention to the animation itself." Exits ~75% of entrance duration.
6. **Animate transform + opacity; layout properties never.** No `height`/`top`/`margin` animation; FLIP or `grid-template-rows` if something must reflow. Blur/glow OK only in small bounded areas (e.g. behind the hero window).
7. **IntersectionObserver, fire once, unobserve.** No scroll listeners; no re-triggering on scroll-up (our shoot script proved default.com's re-triggering sections produce blank frames — fire-once also photographs better).
8. **`prefers-reduced-motion` is mandatory.** Global media query forcing durations to 0.01ms; the page must read perfectly static.
9. **Micro-feedback on the few interactive elements.** CTA hover: 1.02 scale or shadow lift at ~150ms; card hover on the customer story: shadow + 2px rise. That's the full feedback layer for a landing page.
10. **Purpose test.** Every animation needs a reason (state, feedback, hierarchy). Candidate earners in v4: hero dashboard entrance (hierarchy), thread messages appearing in order (narrative — it re-enacts the reply arriving), "Meeting booked" toast pop (the payoff moment), logo marquee only if logos exist (avoid if n=1 customer — an empty marquee is a fake-proof tell).

## Priority checklist for the v4 build

1. Hero: headline + real dashboard window cropped by the fold (cal.com/default pattern), one toast annotation, soft wide shadow, no tilt.
2. Replace black stats band with a light "Week one at Autosana" narrative section containing the LinkedIn thread window + stats-as-caption.
3. Autosana = named mini-case (photo/avatar + pull quote, corgi register); Superhuman CTO reply styled as platform artifact; investor one-liners if obtainable (monaco).
4. Add: italic-serif accent phrase in headline, hairline grid rules, one dry joke in mock UI, one piece of real photography, release/changelog pill in nav.
5. Motion: one hero entrance + staggered thread bubbles + toast pop; delete all other scroll fades; ease-out expo; reduced-motion query.
