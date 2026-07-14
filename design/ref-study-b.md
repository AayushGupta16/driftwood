# Reference design study: clay.com, attio.com, resend.com
Captured 2026-07-13, 1440x900 viewport, full-page + scroll screenshots. Screenshots in /tmp/ref-clay, /tmp/ref-attio, /tmp/ref-resend (bands/ = 900px crops of full-page shot at 1.5x). Note: Clay's cookie banner (Transcend-style, un-killable via DOM) occludes part of viewport shots; band crops from the full-page stitch are clean. Attio's serif-quote section and final CTA lazy-render — they're blank in the full-page stitch, captured via vp-14/vp-18 shots.

=====================================================================
## 1. CLAY.COM — "Build systems to grow revenue"
Overall: warm, illustrated, toy-like but rigorous. One continuous 3D "claymation world" bookends the page (hero landscape → footer ball pit). Page bg is warm cream (#f5f4f0-ish), sections are full-width rounded cards in candy pastels.

### Nav
White slim bar. Logo "clay" + blue asterisk mark. Left links: Product, Use Cases, Solutions, Resources, Company, Pricing. Right: search (⌘K), Log in, "Get a demo" (outlined pill), "Start free trial" (black filled pill). TWO CTAs in nav, primary is black not brand-colored.

### Hero
Full-bleed 3D illustrated scene: green hills, sky, trees, and a Rube Goldberg contraption (funnel dropping colored balls → pencil → seesaw → magnifying glass → squiggle ramp → bar-chart staircase → mailbox). This is a literal metaphor for "systems." Text sits ON the illustration's green field:
- Eyebrow: "LATEST LAUNCH: AUDIENCES IN CLAY →" small caps, yellow-green.
- Headline: "Build systems to grow revenue" — 5 words, 2 lines, ~72-80px, white, left-aligned, medium-weight grotesque.
- Right column (asymmetric 2-col): 15-word supporting paragraph "Infrastructure to get any data, run agentic workflows, and launch GTM plays." + "Start free trial →" white button.
- Composition: headline bottom-left, copy+CTA bottom-right. Sky/illustration takes top 60% of viewport.

### Social proof (directly after hero)
A single large white rounded card (radius ~24px) on cream bg containing:
- Intro line: "Trusted by more than 500,000+ leading GTM teams of all sizes. Inspired by our customers. Built with love." — words "customers" and "love" color-highlighted.
- Masonry/marquee grid of logo TILES (each logo in its own hairline-bordered white tile): Vanta, Perplexity, Notion, Google, HubSpot, Rippling, Workday, Uber, Canva, Okta, Verkada, ElevenLabs...
- KEY MOVE: metric tiles interleaved with logo tiles — "80%+ ENRICHMENT COVERAGE", "2x DEMOS FROM COLD EMAIL", "3x REPLY RATE", "+140% OUTBOUND PIPELINE", "+50%..." — and one expanded tile is a mini case: ANTHROP\C logo + "All inbound — QUALIFIED AND SCORED WITH CLAY" + 1-sentence quote. Logos never appear alone; numbers ride along.

### Tabbed use-case demo
- Centered H2 "GTM engineers build on Clay" ~48-56px + 2-line subhead.
- Pill tab row: Rep Productivity / TAM Sourcing / Automated Inbound / Lead Scoring (active) / Automated Outbound / CRM Enrichment / Launch Ads — active pill tinted purple.
- Demo panel: soft purple gradient rounded container; main product table screenshot (no browser chrome) with two floating annotation cards overlapping it ("Lead Score Formula" with chip-tokenized formula + "Generate Formula" button; "Sample Outputs" table + "✓ Output is correct. Save formula" confirmation). Screenshot-plus-floating-cards = explains the workflow without a video.

### "What do you want to build?" — AI prompt as CTA
Big centered question headline; below it a working-looking AI prompt input (white rounded textarea, placeholder "Find companies with 3+ open...", suggestion chips "Find people data / Find company data / Find jobs data", black circular → submit). The product's chat entry point embedded mid-landing-page.

### Four feature cards (DATA / AGENTS / ORCHESTRATION / EXECUTION)
Identical template, one card per screen, alternating pastel bg colors (periwinkle blue, peach, pale chartreuse, pink):
- Small colored pill tag in caps (DATA, AGENTS, ORCHESTRATION, EXECUTION).
- Headline 6-9 words, TWO-TONE: line 1 black, line 2 in the card's accent hue ("Get data from the most complete data marketplace" / "Create agents who mimic your best reps" / "Orchestrate workflows across tools in real time" / "Launch new plays as fast as you have ideas").
- Body: exactly ~3 short sentences (~30 words).
- CUSTOMER PROOF FOOTER inside every card: logo + one sentence with a hard number — "Mistral AI cut the time to map their TAM and score accounts from 2 months to 10 days." / "Vanta cut post-call follow-up time from 3 days to <1..." / "Lovable booked 50% more qualified meetings per rep..." / "Figma increased PLG conversion by automatically prospecting into self-serve accounts..."
- Dual CTA: filled pill in accent color ("Start free trial →") + outlined secondary ("Explore data marketplace" etc.).
- Right half: full-height 3D character illustration whose palette matches the card (blue magnifier creature, orange robot, green cube machine, pink catapult flinging envelopes).

### Fifth section (GTM INFRASTRUCTURE)
Same pattern but on cream, headline "Build systems that make reps more productive" (black + cyan), right-column copy, proof line ("Terrapinn generates +19% more revenue per rep and reduced acquisition cost by 90%..."), then a WIDE panoramic 3D scene where all four card characters appear together — narrative payoff.

### Customer video carousel
"Hear from the teams that grow with Clay" centered ~32px. Center card = real video interview footage (real photography — deliberate contrast with the illustrated world), flanked by peeking prev/next cards with pink/blue tints. Play button center.

### Community/content bento
"Learn more about GTM engineering": mixed-size cards — conference brand "SCULPT" in groovy custom type, livestream card with photo + title bar, community stories with real photos ("Sandra has built the Clay community in Lagos", "Where girls often choose between career or marriage, she carved her own path"). Eyebrows in colored caps (CONFERENCE / LIVESTREAM / COMMUNITY STORY), "Read story →" links.

### Final CTA + footer
- "Turn your growth ideas into reality today" centered, + "Start for free today. No credit card required." + black pill "Start free trial →" + outlined "Get a demo".
- CTA sits back INSIDE the 3D world: hills return, the hero's contraption resolves into a giant BALL PIT of thousands of colorful balls. Footer is a cream rounded panel floating on the ball pit (ball texture visible on both sides).
- Footer columns: USE CASES / PRODUCT / BLOG / RESOURCES / COMPANY + a CUSTOMERS column (OpenAI, Vanta, Verkada, Sendoso, Anthropic, Coverflex, Rippling, Case studies) — customers as first-class nav. "Jobs (We are hiring)" gets an orange highlight sticker. Bottom: "Born in Brooklyn ©2026 Clay Labs Inc.", 3 social icons.

### What makes Clay feel expensive
1. One coherent bespoke 3D world with narrative: hero contraption → per-section characters → reunion scene → ball-pit footer. Nothing is stock.
2. Proof discipline: every feature card carries a named customer + quantified outcome; even the logo wall carries metrics.
3. Systematic color: each section's tag, headline second line, button, and illustration share one hue; page never exceeds ~5 pastels on cream.
4. Copy economy: headlines 5-9 words, bodies capped ~30 words, proof lines 1 sentence.
5. Rounded-card sections (not full-bleed color bands) keep the cream page continuous — feels like objects on a table, not stacked stripes.

=====================================================================
## 2. ATTIO.COM — "Welcome to agentic revenue."
Overall: engineered minimalism. White page, hairline-rule grid everywhere, tiny type, enormous whitespace, hyper-real product UI as the only imagery. Flips to black for the technical back-half, returns to white for customers, ends black CTA+footer.

### Nav + announcement
Black announcement bar: "Orchestrate revenue agents with the new Workflows →". White nav: attio logo, Platform ▾ Resources ▾ Customers Pricing; right Sign in (ghost) + "Start for free" (black filled, small ~8px radius). Very few items.

### Hero
Centered. Outlined pill eyebrow "Lessons from GTM operators →". Headline "Welcome to agentic revenue." — 4 words + period, one line, ~64-72px tight grotesque. Subhead 17 words gray: "Attio is the AI CRM that builds pipeline, advances deals, and grows accounts around the clock." Two small buttons: "Talk to sales" (light gray) + "Start for free" (black). Below: giant real app screenshot in rounded window with mac traffic lights, 1px border, minimal shadow — fills rest of viewport and bleeds below fold. Screenshot content is a morning briefing: "Good morning, Alex" + AI input "How do I win my deal…" + meetings list w/ joined participants.

### Logo wall
Hairline-grid table: 5 cols x 3 rows, each logo in a bordered cell (parallel, turbopuffer, taskrabbit, granola, Listen, Wispr Flow, WORDSMITH, Modal, Obvious, passionfroot, Railway, Lightdash, AIUC, near, public). Monochrome except one (passionfroot orange). Cells have hover ↗. Reads as "spec sheet" not "collage."

### Platform scrollytelling (the big middle)
Section header device used THROUGHOUT the site: two-tone run-on headline, black phrase then gray continuation, e.g. "The intelligent system that never sleeps." + gray "Picks up leads at 2am. Catches renewals before they slip. Hands you the answer before you ask." Staccato punchy sentences, all ending in periods.
- Left rail sticky stage nav: Build pipeline / Convert leads / Run sales motions / Forecast revenue / Retain and expand (active = black, rest gray).
- Each stage: bold 3-5 word black lead + one gray sentence ("Your team, amplified." "Free your reps to sell." "Agents dig. You close." "Speed to lead, every time." "Run every motion, your way." "Catch changes to the deal." "Skip the review scramble." "Keep more. Grow more." "Spot the shift early." "The move's ready. You make the call.")
- Every claim is illustrated with pixel-perfect fake product UI containing REAL-SOUNDING data: CRM rows are actual hot startups (OpenAI, Harvey, Browserbase, Cursor, Notion, Granola, Ramp, Elevenlabs, Linear) with ICP scores 86-98; a fully-drafted outreach email ("Hi Maya, Congrats on the new VP Sales role... Quick call? — Daniel Fraser") with Send/Discard/Save draft; kanban deals with amounts/dates (Cortexa $54,000 Aug 28 2026); workflow canvas with trigger→web agent→custom agent→if→enroll-in-sequence nodes each stamped "✓ Completed"; an AI answer showing "2 tools used", "SQL query executed: 1452 rows in 6.2s" and the actual SQL; account-risk briefing citing Stripe invoice failures. The UI mocks ARE the copy.
- Note for driftwood: "Save, upsell, or renewal, agents draft the play for you to approve and run" — approval-gated agent framing, identical to driftwood's model.

### "Self-building" section
Centered pill "Self-building" + "Live from day one." black + gray "Connect your inbox and calendar. Attio learns your business and builds itself around it, before your first agent even gets to work." Single small button. Contact-record UI with AI-written summary, activity timeline.

### Dark technical block (page flips to near-black)
- Dome of fine vertical hairlines (radial texture) as a section transition.
- 5-col hairline-divided micro-feature row: icon + bold white micro-claim + ~9 gray words each ("It logs itself." / "Your tools finally talk." / "Gets to know you." / "Ask, and it's there." / "No agent left guessing.").
- "Signals" pill → "All of the signals, none of the noise." white + gray "Ready to act on." Accordion (Context / Agents + automations / Ecosystem) next to a wireframe vortex/funnel 3D line-render.
- "Connectivity" pill → "Your whole stack, connected." + integration icon row (Claude, Slack, Clay, Linear, Notion...).
- "SDK. API. MCP." white + gray "Build anything on Attio." + "View docs →". Dashed isometric blueprint diagrams. Dark section texture language: hairlines, dashed grids, dotted nodes — engineering-drawing aesthetic.

### Pull-quote interlude (white, full viewport)
On a faint dotted-paper grid: a giant EDITORIAL SERIF quote — the only serif on the site — 3 centered lines ~48-56px: “When I first opened Attio, I instantly got the feeling this was the next generation of CRM.” Attribution: bold "Margaret Shen" + gray "Head of Business Operations · Modal". No photo, no logo, no card — typography does all the work.

### Customer stories
Pill "Customer stories" → "Trusted by 30,000+ customers." black + gray "From first agent to enterprise scale." + "Read more →".
- Logo TAB BAR (granola active / Railway / Modal / taskrabbit) switching case studies.
- Case layout: left = eyebrow category ("ARTIFICIAL INTELLIGENCE") + stat-first headline "83% faster lead triage." black + gray "How Granola turns product signals into revenue at scale." Right = large REAL PHOTO (granola billboard in a city street). Stat is the headline; prose is subordinate.

### Scale stats
"Build to scale" pill → "Run at any scale." + gray "Production-grade for your team and agents." 4 stats each with a thin left border rule: 2.6M MCP calls/month, 400M API calls/week, 76k active customer agents, 15M emails synced/day. Background = huge exponential curve drawn in hairlines + blue line (chart as wallpaper).

### Changelog + newsletter
4-col changelog teasers (date / bold title / one gray line). Newsletter strip: "Stay ahead of GTM. Product updates in your inbox." + email input + black Subscribe. Comb-tooth hairline texture as divider.

### Final CTA + footer
Inset dark charcoal panel (rounded, margins from page edge) with fine vertical hairline texture: "Agentic revenue runs on Attio." 2 lines centered white ~56px. Buttons: "Talk to sales" (dark ghost) + "Start for free" (light gray filled). Footer continues black: large logo left, 5 link columns (Platform / Company / Import from [Salesforce, Hubspot, Pipedrive, Zoho, Excel, CSV] / Apps / Resources), "New" badges on fresh items, ↗ on external. © 2026 Attio Ltd.

### What makes Attio feel expensive
1. Hairline-rule grid system carried through light AND dark sections, logo walls, dividers, even background charts — one drafting-table language.
2. Fake data that isn't fake: real startup names as CRM rows, full email drafts, actual SQL, timestamped events. Zero lorem-ipsum energy; the demo UI is the proof.
3. Radical copy restraint: black 3-5 word claim + one gray sentence, everything ends with a period; two-tone black/gray headline device repeated identically ~10 times.
4. One serif moment: the testimonial is the only serif on the page, full-viewport, no decoration — contrast = emphasis.
5. Stat-led case studies ("83% faster lead triage." as the headline) + machine-scale stats with units (calls/week, emails synced/day).

=====================================================================
## 3. RESEND.COM — "Email for developers"
Overall: black, cinematic, product-render porn. Near-black bg (#0b0b0b) with subtle light sweeps; each feature section gets a bespoke 3D-rendered "app icon" totem and ONE accent color (orange → purple → green → cyan). Serif display bookends (hero + final CTA), sans everywhere else.

### Nav
Wordmark left; centered links Features/Company/Resources/Help/Docs/AI/Pricing (all dropdowns); right Log in + "Get started" white pill. Thin, dark, transparent.

### Hero
Left-aligned on darkness with a soft radial sheen: outlined pill "Announcing Remote MCP →"; headline "Email for developers" in light-weight EDITORIAL SERIF, 2 lines, ~64-72px, white — serif against a dev-tool dark theme reads confident/luxury; subhead 18 words gray 2 lines ("The best way to reach humans instead of spam folders. Deliver transactional and marketing emails at scale."); "Get started" white pill + "Documentation" ghost. No product shot in hero at all — pure type and atmosphere.

### Logo cloud
Rounded-top hairline panel; 2-line gray intro "Companies of all sizes trust Resend to deliver their most important emails."; 2 rows x 6 pure-white logos (Warner Bros., Max, Raycast, Mistral AI, Replit, Anghami, Gumroad, Decathlon, Supabase, Leap, Payload, Paper). Big-consumer + dev-cred mix.

### "Integrate this afternoon" (orange section)
- 3D metallic envelope app-icon render floats above headline.
- Headline two-tone: "Integrate" white + "this afternoon" orange-gradient. Time-to-value as the headline.
- 13 SDK tiles (Node.js active w/ orange icon, Serverless, Ruby, Python, PHP, CLI, Go, Rust, Java, Elixir, .NET, REST, SMTP).
- Code editor window: framework tab bar (Node.js/Next.js/Remix/Nuxt/Express/Hono/Redwood/Bun/Astro), copy button, line numbers, syntax-highlighted REAL runnable snippet (resend.emails.send({from:'onboarding@resend.dev'...})), footer links "View on GitHub / Download ZIP". Strings glow orange — the accent lives inside the code.

### "First-class developer experience"
Left-aligned light ~44px 2-line headline; 2-line gray sub with italicized "just works". 2-col bento: "Test mode" (terminal mock streaming HTTP 200 {"id": ...} responses) and "Modular webhooks" (event feed: purple "Clicked" pill, red "Bounced" pill, real-looking payload chips: from jackson@figma.com on Welcome, on agent Spark running on macOS). Cards: 1px hairline border, icon + bold title + ~20-word desc + "Learn more".

### "Write using a delightful editor" (purple) / "Go beyond editing" (green)
Same recipe: 3D icon totem, centered or left headline, 2 gray lines, then UI mocks in bento cards — email composer (From/To/Subject chips), audience card (ALL CONTACTS 1,034 / UNSUBSCRIBED 5 + green sparkline), deliverability card (98% Delivered 3,204 / Bounced 60) with green interior glow. Captions under cards: icon + bold title + 2-3 gray lines + Learn more.

### "Develop emails using React" (cyan)
3D react-atom icon; sub mentions react-email open-source library; "Get started" + "Check the docs →"; split window = file tree + JSX source LEFT, rendered email preview RIGHT ("Welcome to ACME, user!"). Code-to-result adjacency as proof.

### "Reach humans, not spam folders"
Raised dark panel, left headline; 3x3 grid of deliverability features (Proactive blocklist tracking / Faster time to inbox / Build confidence with BIMI / Managed dedicated IPs / Dynamic suppression list / IP and domain monitoring / Verify DNS records / Battle-tested infrastructure / Prevent spoofing with DMARC), each icon + title + 2-3 gray lines with underlined inline links to standards (DKIM, SPF, DMARC, CAN-SPAM Act, Spamhaus). Jargon-dense on purpose = credibility with the ICP.

### VIP testimonial spotlight
Vercel ▲ logo rendered as a lit object under a literal spotlight cone; single quote 3 centered white lines: "Resend is transforming email for developers. Simple interface, easy integrations, handy templates. What else could we ask for." + avatar + "Guillermo Rauch — CEO at Vercel". One famous person > a wall of quotes.

### Dashboard section "Everything in your control"
3D glass-sphere icon (green glow); 3 selector cards (Intuitive analytics active w/ green edge glow / Full visibility / Domain authentication); full dark dashboard screenshot — sidebar + Metrics page: DELIVERABILITY "Good" (Sent 29,486, Delivered 100%), REPUTATION "Good" (Bounced 1.85%, Complained 2 / 0.01%), ENGAGEMENT "Poor" (Opened 0%) — they ship a "Poor" grade in their own marketing shot (verisimilitude), + green area chart. Dark UI on dark page = no chrome needed, just a hairline border.

### Testimonial wall + final CTA
"Beyond expectations" + 1 gray sentence; horizontally scrolling cards (hairline borders): ~40-60-word quotes + avatar + name + title (VOA Hotels, Anyone, Mintlify). Then final CTA in the hero's SERIF: "Email reimagined. Available today." 2 lines centered + "Get started →" white pill + "Contact us →" ghost.

### Footer
Dark; left: street address, social icons, live status pill "● All systems operational" (green dot — an uptime widget as trust signal). 5 columns: Features / Resources (Changelog, Pricing, Security, SOC 2, GDPR, Brand) / Company (About, Blog, Careers, Clubs, Customers, Humans, Philosophy) / Help / Community (Events, Insiders, Open source, Wallpapers).

### What makes Resend feel expensive
1. Bespoke 3D icon totems per section — consistent render style (dark glass/metal + accent rim light), like collectible hardware.
2. Accent-color rotation per section (orange/purple/green/cyan) while everything else stays monochrome — sections feel distinct without layout changes.
3. Serif display bookends ("Email for developers" ... "Email reimagined. Available today.") wrapping an all-sans body.
4. Real artifacts as imagery: runnable code, real HTTP responses, real DNS/DKIM jargon, an honest "Poor" engagement grade.
5. Darkness + negative space: sections separated by nothing but ~400-600px of black and a subtle glow — no dividers needed.

=====================================================================
## Cross-site patterns relevant to driftwood.sh
- All three: logo/social-proof strip IMMEDIATELY after hero, before any feature.
- All three: headline ≤6 words; subhead 15-25 words; buttons 2-3 words; two CTAs (one filled, one ghost/outline).
- All three: two-tone headline device (Clay: black+accent hue; Attio: black+gray continuation; Resend: white+accent gradient).
- Clay + Attio (driftwood's audience): customer proof is NUMBERS-FIRST — "83% faster lead triage." as a headline, "2 months → 10 days" inside feature cards. Quotes are short and subordinate to metrics; the one exception is a single full-viewport serif pull quote (Attio) / single VIP quote (Resend).
- Product UI is always framed minimally: 1px border + big radius + tiny shadow (Attio window w/ traffic lights; Resend borderless dark-on-dark; Clay screenshot with floating annotation cards). Nobody uses heavy skeuomorphic browser chrome or big drop shadows.
- Realistic fake data is the load-bearing trust element everywhere (real startup names, full email drafts, SQL, HTTP responses). For driftwood's LinkedIn-thread case study this is the pattern to copy exactly: show the actual artifact.
- Section rhythm: one idea per viewport; 300-600px whitespace between; background shifts (Clay: pastel card colors; Attio: white→black→white→black; Resend: glow accents) mark chapter changes.
