# Comparison page critique, 2026-07-21

Input to the comparison-page redesign pattern. Founder review pending. No page
was modified for this critique.

Scope: the five /alternatives pages (instantly, clay, apollo, artisan, 11x) and
/best-ai-sdr-tools. All line references are into each page's
`site/landing/public/<route>/index.html`. The founder's read was "a little too
sloppy" and "programmatically generated". This document makes that concrete.

The one-sentence diagnosis: the research under these pages is real and often
good, but it is poured into one rigid mold, so a reader who lands on a second
page recognizes the choreography, and the honesty moves stop reading as honesty
and start reading as a template slot. The secondary diagnosis: almost every
piece of information a buyer actually wants (prices, channels, who fits what)
is delivered as paragraphs, so the pages fail the 30-second skim test.

## The cross-page template-smell list

Verified by diff and grep across the five alternatives pages. Counts are pages
out of five unless noted.

1. The CSS block (lines 80 to 291) is byte-identical in all five files. A
   reader never sees this, but it means every layout fix is a five-file edit,
   and it is why the pages can only ever look identical.
2. The title formula is identical modulo the competitor name: "X alternatives
   in 2026: six honest options - driftwood" (5/5). Every list is exactly six
   items and driftwood is always item one. "Six honest options" five times in
   the sitewide footer's neighborhood is the single loudest programmatic tell:
   a fixed count plus a self-award of honesty, stamped five times.
3. The byline block is identical (5/5): "By the driftwood team - July 2026"
   plus "Updated July 2026. Pricing and features get a monthly fact-check."
   The fact-check line is good; the anonymous team byline is filler on all
   five (see voice findings).
4. The disclosure box is near-identical on instantly, clay, and 11x
   ("The disclosure, first. We build driftwood... Judge the page accordingly.
   To make it worth your time anyway, every entry says who should pick that
   tool, and the last section covers when X is the right choice, including
   over us."). Apollo (lines 314-315) and artisan (312-315) each add one
   page-specific sentence, and those two are the only disclosures that read
   written rather than merged.
5. The intro paragraph is one skeleton with a slot for the complaint count:
   "Most people/People searching for X alternatives [are unhappy about one of
   four things / usually mean one of three things / are in one of three
   situations]: A, B, C. Those are different problems with different answers,
   so this page starts with what X actually is and where it genuinely wins.
   [For the broader / If you want the whole] AI SDR category, we keep a
   separate ranked comparison." All five. This is exactly where a reader who
   has seen two pages feels they are reading the same page twice, because it
   is the first body paragraph both times.
6. The section-header spine is identical on all five: "What X is, and what it
   is genuinely good at" / "Where X falls short, and for whom" / "Six real
   alternatives" / "When X is the right choice" / "FAQ". The structure itself
   is sound; five identical instances of it are the problem.
7. The literal string "What it is genuinely good at:" opens a body paragraph
   on all five (instantly 350, clay 351, apollo 352, artisan 355, 11x 353).
8. The FAQ is four questions in the same four slots on all five: (1) "What
   does X cost in 2026?" (2) one product question, (3) "What is the closest
   direct alternative to X?" on three of five, (4) "Will [switching tools /
   an autonomous AI BDR / an autonomous AI SDR] fix a low reply rate?" on all
   five, every one resolving to the same Autosana stat. Slot 4 is verbatim-
   duplicated content between instantly and apollo (598-607 on apollo).
9. The driftwood entry is one skeleton five times: card plus "our tool" chip,
   "A human approves every send", "your own LinkedIn or email account, not a
   bot inbox", the Autosana stat, then "The honest fit: driftwood is early,
   and it trades volume for depth", then "Best for: founders and lean teams
   selling a product that demos well...". The artisan page (437-456) is the
   only one that does comparative work instead of restating the pitch.
10. The word "honest" appears four to six times per page in structural
    positions: title, "Six real alternatives" heading's neighbor sections,
    "The honest fit:", "The honest dividing line:" (3/5). Claimed honesty on
    a schedule reads as its opposite by page two.
11. The CTA card is byte-identical on all five plus /best-ai-sdr-tools:
    "See a demo built for your business / Twenty minutes. We will show you
    what your prospects would see."
12. "as of July 2026" appears 4 to 8 times per page (8 on instantly, 8 on
    11x). See credibility findings.
13. Vendor blurbs recur across pages nearly verbatim. Amplemarket is "an
    all-in-one sales platform: contact data, engagement, deliverability
    tooling, and an AI copilot called Duo threaded through the workflow" on
    clay, apollo (as "the closest like-for-like swap"), artisan, 11x, and
    best-ai-sdr-tools. Apollo's "$49 per user per month billed annually",
    Instantly's "$47 a month with unlimited mailboxes and warmup included",
    and Clay's "waterfall enrichment across more than a hundred providers"
    blurbs behave the same way. A reader visiting two pages reads the same
    six capsule reviews reshuffled, which is most of what "programmatically
    generated" feels like from the outside.
14. All six pages share one OG image (og-5.png), so every share card is the
    same. Minor, but of a piece.

## Per-page findings

### /alternatives/instantly

The weakest of the five: it is the purest instance of the template with the
least page-specific material layered on.

Wall of prose. Lines 331-339 deliver the entire pricing model as one sentence
chain: "the sending plans are Growth at $47 a month (5,000 emails, 1,000
uploaded contacts), Hypergrowth at $97 a month (100,000 emails, 25,000
contacts), and Light Speed at $358 a month (500,000 emails, 100,000
contacts), with about 20 percent off billed annually." That is a three-row,
four-column table wearing a paragraph. It is then re-delivered as prose in
the FAQ (545-553), so the page carries the same pricing wall twice.

Skim test. Fails. The page's actual answer, "if sends are your constraint,
buy Instantly or Smartlead. If replies are your constraint, more sending will
not fix it" (537-540), is the last two sentences of a 1,483-word page, inside
a paragraph. Prices for the six alternatives exist only mid-sentence inside
entry paragraphs; there is no way to compare costs without reading all six.

Credibility. "Multiple 2026 reviews put realistic working totals at two to
four times the sending plan price" (366-367) and "Reviews and Reddit threads
through 2026 report bounces, outdated titles, and stale emails" (383-385)
cite a literature with no links and no names. Verified: the body contains
zero non-vendor external links. Eight "as of July 2026" stamps.

Voice. "Budget for the stack, not the sticker." (368) is a LinkedIn aphorism,
and its sibling appears on the apollo page, which converts it from a line
into a macro.

Good on this page: the "Warmup numbers are not inbox placement" segment
(390-398) is specific, useful, and vendor-neutral advice; "Volume is the
strategy" (400-408) is the page's real argument, plainly made; the
"When Instantly is the right choice" paragraph concedes "In those cases none
of the alternatives above will serve you better, and most will cost more"
(536-537), which is real.

### /alternatives/clay

Wall of prose, worst single instance in the family. Lines 339-349: "As of
July 2026 there is a free tier with 100 data credits and 500 actions a month
on tables capped at 200 rows, Launch at $185 a month ($167 billed annually)
with 2,500 data credits and 15,000 actions, Growth at $495 a month ($446
billed annually) with 6,000 data credits and 40,000 actions, and custom
Enterprise pricing." Four tiers, two meters, two billing modes, one sentence.
Repeated in the FAQ (540-548). This is the page where the pricing table is
most obviously owed, because the credits/actions split is genuinely hard to
hold in your head from prose.

Information design. The Unify entry (452-466) carries no price at all while
its neighbors do, so the entry list cannot be compared even by reading it
all. Inconsistent field coverage across entries is a template-with-holes
smell.

Voice. "buy Clay to build a motion, buy the others to run one" (534) is
chiasmus, punchy in exactly the way the copy-voice rule bans. "with the data
quality caveats that come at that price" (511-512) is limp hedging.

Credibility. "2026 reviews consistently describe weeks of ramp" (365-366),
"Unpredictable credit consumption is among the most common complaints in
2026 reviews, with several describing burning through hundreds of dollars"
(386-389): specific-sounding, unlinked, unfalsifiable on-page.

Good on this page: "It assumes an operator you may not have" (372-379) is the
best-written concession segment in the family, concrete and flat ("Clay tends
to become an expensive spreadsheet that nobody maintains"). The March 2026
repricing detail (data credits vs actions) is real research and correctly
scoped with "the metering model itself has not changed" (389-390).

### /alternatives/apollo

The most honest page and the most templated intro at the same time.

Credibility, positive. The disclosure adds "Fair warning: for most readers of
this page, the answer is to keep Apollo." (314-315), and the closing section
opens "More often than any other tool we cover, Apollo is the right choice."
(550). These two sentences buy more trust than every "honest" in the titles
combined. SEO.md records Apollo pricing as primary-sourced from
apollo.io/pricing; that work is invisible on the page because nothing is
cited, which wastes it.

Wall of prose. Lines 341-349 pack three tiers, a seat minimum, a billing
caveat, and three credit-pool numbers into one paragraph, then the FAQ
(566-574) repeats all of it. The credit pools (30,000 / 48,000 / 72,000 per
seat per year) are a table row per tier, delivered twice as sentences.

Template smell. The intro (318-327) is the same four-things skeleton as
instantly's, down to "so this page starts with what Apollo actually is and
where it genuinely wins." Slot-4 FAQ (598-607) is near-verbatim identical to
instantly's slot-4 FAQ.

Voice. "Budget for how you actually prospect, not the sticker." (384) is the
instantly aphorism recompiled. "it is hard to argue with" (358) is filler.
"Everything included, nothing best-in-class" (401) is a headline-shaped h3,
borderline but survivable.

Good on this page: five falls-short segments, the most of any page, and each
is specific. "Deliverability is your problem, not Apollo's" (388-398)
identifies the workflow that burns domains (export straight into a sequence)
rather than waving at "deliverability issues". "Teams tend to outgrow Apollo
one piece at a time, which is exactly how the alternatives below are
organized" (406-408) is genuine information architecture stated in prose;
the redesign should make the entry list literally reflect it (which piece
each alternative replaces).

### /alternatives/artisan

The most written of the five and the owner of the best driftwood entry.

Good on this page, first. The disclosure varies with substance: "Artisan is
also our closest competitor in philosophy, which is exactly why we have tried
to be fair to it" (312-313). The driftwood entry (437-456) does real
comparative work: "They split on three defaults. Ava is autonomous by
default; driftwood has a human approve every send... Ava manages the sending
layer and answers replies for you; driftwood sends from your own LinkedIn or
email account... where Ava personalizes messages at volume, driftwood runs
demo-led outbound." This is the model driftwood entry: a comparison, not a
pitch with a confession stapled on. "Reply quality drops on narrow ICPs"
(379-390) and "Booked meetings are not qualified pipeline" (392-401) are the
sharpest concessions in the family; the observation that "An autonomous agent
graded on meetings booked will optimize for the meeting" is a founder
explaining plainly to a founder, exactly the standard.

Wall of prose. Longest body in the family (about 1,900 words). The Artisan
pricing story is the most table-shaped in the family and gets none: free
tier, ~$250 entry, ~$600 mid, then quote-based Team (~2,500 leads/month),
Scale (~6,000), Enterprise, spread across lines 336-352, 404-413, and again
in the FAQ (578-587). Three prose deliveries of one four-row table. The
closing paragraph (559-573) is a three-branch decision tree in a single
paragraph: "delegate the motion to an agent, buy Artisan or 11x. Keep humans
running it, buy Amplemarket, Apollo, Instantly, or Clay. Run an agent with a
human hand on every send... that is what driftwood is for." That is the most
valuable content on the page, buried in the last wall, wanting to be a short
structured list near the top.

Voice. "you can test the whole premise for the cost of a dinner out"
(566-567) is LinkedIn-y. "driftwood is for founders who want proof in every
message and a hand on every send" (454-455) has slogan cadence. "None of
that is disqualifying" (410) is limp.

Credibility. "Artisan's reviews are unusually polarized: clusters of
five-star and one-star ratings with little in between" (382-384) is a strong,
checkable claim delivered with no link to the review distribution it
describes. "on Reddit and in review roundups" (384-385) again cites a
literature without naming it.

### /alternatives/11x

The best-researched page and the exemplar candidate (see verdict at the end).

Good on this page. It is the only page whose claims come with names:
TechCrunch March 2025 (376-391), Vendr's median contract value of about
$55,050 with a range (346-348), Benchmark and Andreessen Horowitz (339-340),
the Opkit acquisition (337). The epistemics are labeled: "All of that is
reported rather than published, so treat it as directional" (350) and "Treat
all of that as reported rather than official" (565-566). "None of that
settles what the product does today. It does mean you should reference-check
current customers rather than trusting logos, which is fair diligence for any
vendor on this page" (387-389) is the family's credibility high-water mark.
The apollo entry grounds price comparison concretely: "Against a reported
$50,000-plus first year with 11x, a few Apollo seats plus a rep's time is the
budget it competes on" (510-511). A unique FAQ question exists ("What
happened with 11x in 2025?").

Where it still fails. TechCrunch and Vendr are named but not hyperlinked, so
even the best sourcing is unverifiable in one click. The 2025 saga is
delivered twice at full length, once as a body segment (376-391) and once as
a near-verbatim FAQ answer (571-581); the second telling adds nothing. The
saga itself is a timeline (March 2025 report, company response, May 2025 CEO
change) delivered as two dense paragraphs; a short dated timeline artifact
would be both more scannable and more credible. Eight "as of July 2026"
stamps, tied for most. And the driftwood entry (425-444) is the most
boilerplate of the five: one contrastive opening sentence, then the standard
block verbatim.

Voice. "Autonomy means giving up the pen" (394) is a metaphor-headline; the
segment under it is fine.

### /best-ai-sdr-tools (the older sibling)

This page has drifted below the family standard rather than above it.

Consistency debt. No FAQ and no FAQPage or Article schema. The updated line
(259) lacks the monthly fact-check sentence the five newer pages carry. Both
CTAs (250, 505) link out to cal.com directly instead of /#book, bypassing the
inline booking that shipped 2026-07-21 and the booking_confirmed event.

Skim test, worst in family on cost. Seven of ten entries carry no price at
all. "What does each cost" is unanswerable on the page that ranks ten tools.

Credibility. It is titled "ranked" with a voice italic on "ranked" (257) and
driftwood at 1, but there is no stated basis for the order anywhere. The
disclosure covers the bias ("we ranked it first. Judge this list
accordingly", 262-263) but never says what the ranking is a ranking of. An
honest ranking needs one sentence of criteria more than it needs another
disclosure.

Good on this page: the three-motions taxonomy (275-307) is the best piece of
category information design in the whole family, it is skimmable, and it is
what the alternatives pages implicitly rely on. "How to choose" (489-500) has
the right content in the wrong shape (decision tree as paragraph).

## Information design: the 30-second skim test, summarized

A skimmer arriving on any of these pages wants two things: which tool is for
me, and what does each cost. Today:

- The which-tool answer exists on every page but always as the final
  sentences of the final prose section ("The honest dividing line..."). It
  should be a visible artifact near the top: complaint to answer mapping,
  derived from the intro enumeration that already exists.
- The cost answer exists only inside sentences. No page has a single table.
  The subject tool's tiers want a small pricing table; the six alternatives
  want one comparison table with price, channel, autonomy, and best-for
  columns. The "Best for:" lines prove the per-entry fields already exist.
- The intro promises structure ("this page starts with what X actually is")
  but provides no table of contents or jump links, on pages of 1,500 to
  1,900 words.
- The FAQ mostly re-answers the body verbatim, adding length without adding
  scannability. FAQ answers should compress and point, not repeat.

## Credibility surface, summarized

- Zero non-vendor external links in any alternatives-page body (verified by
  grep). Every "2026 reviews say", roughly three to five instances per page,
  is an unlinked appeal to a literature. This is the precise mechanism by
  which real research reads as generated: a model asserts a corpus it does
  not cite. The fix is links or cuts, no third option.
- "as of July 2026" pulls its weight the first time it is attached to a
  price. At 4 to 8 instances per page it reads as a mail-merge variable. The
  "monthly fact-check" line already carries the freshness promise; keep one
  stamp per section at most.
- The driftwood concession ("driftwood is early, and it trades volume for
  depth") is honest once and a template slot five times. Same for the
  Autosana stat, which appears two to three times per page; repetition
  dilutes the one number the site is built on.
- The apollo and artisan disclosures show what the surface should be:
  page-specific admissions. The other three disclosures are the same
  paragraph with the name swapped.

## Ranked fix list (highest reader impact first)

1. Put the answer at the top. Each page gets a scannable verdict artifact
   near the head: the complaint list from the intro mapped to the tool that
   answers it. The content already exists in the closing "dividing line"
   paragraphs; this is a relocation and a reformat, not new research.
2. Tables for pricing. One small table for the subject tool's tiers (kills
   the worst prose walls: clay 339-349, apollo 341-349, artisan's triple
   delivery), and one six-row comparison table for the alternatives list
   (price, channel, autonomy, best-for). FAQ pricing answers shrink to one
   sentence plus the table.
3. Link the sources. Every "2026 reviews" claim gets a link (G2, Reddit
   thread, the TechCrunch piece, Vendr) or gets cut. Hyperlink TechCrunch
   and Vendr on the 11x page. This is the single cheapest credibility fix
   because the research was apparently done and then hidden.
4. One Autosana stat per page, and rewrite four driftwood entries to do
   page-specific comparative work on the artisan-entry model (named
   contrasts with the subject tool, not the standing pitch). Retire the
   duplicated slot-4 FAQ or make it page-specific.
5. Break the visible skeleton: write each intro fresh (the "one of
   three/four things" formula is the first thing a two-page reader
   recognizes), retire "six honest options" from the title formula, stop
   forcing exactly six entries, and vary the disclosure per page the way
   apollo and artisan already do. Section headers can keep the shared spine
   if the paragraphs under them stop opening identically ("What it is
   genuinely good at:" x5).
6. De-tic the voice: cut the aphorism pairs ("not the sticker" x2), the
   chiasmus closers, "cost of a dinner out", and reduce "honest/honestly" to
   at most one structural use per page. Replace with flat statements; the
   apollo "fair warning" sentence is the register to aim for.
7. Cut "as of July 2026" to first-mention-per-section; the fact-check line
   carries the rest.
8. Reshape the closing decision trees (instantly 537-540, apollo 556-561,
   artisan 569-573, best-ai-sdr-tools 489-500) into short structured lists,
   even if they also survive in prose.
9. Bring /best-ai-sdr-tools up to family standard: FAQ plus schema, monthly
   fact-check line, /#book CTAs, per-entry pricing, and one sentence stating
   the ranking basis. On the 11x page, render the 2025 saga once, as a dated
   timeline, and let the FAQ answer point to it.
10. Plumbing: extract the shared 212-line CSS block to one stylesheet the
    static pages link (or consciously accept the duplication and note it in
    the page-checklist), and consider per-page OG images. Reader-invisible,
    but it is the mechanism that keeps producing identical pages.

## Keep list (the redesign must not throw these away)

- The disclosure box as an institution, upgraded to page-specific: apollo's
  "Fair warning: for most readers of this page, the answer is to keep
  Apollo" and artisan's "closest competitor in philosophy" are the standard.
- "When X is the right choice, including over us" sections. The content is
  the moat; only the shape changes.
- The "Where X falls short, and for whom" research. The concessions are real
  and specific (instantly's warmup-vs-placement, clay's expensive
  spreadsheet, apollo's export-to-sequence domain burn, artisan's
  booked-meetings-vs-pipeline, 11x's full saga). They need sources attached,
  not rewriting.
- The "Best for:" line on every entry. It is the one existing skim artifact
  and the seed of the comparison table.
- 11x's epistemic labeling ("reported rather than official", "reference-
  check current customers rather than trusting logos") and its named
  sources.
- The monthly fact-check promise and the real fact-checking behind it
  (apollo pricing primary-sourced; SEO.md rotation).
- The stat discipline: verbatim Autosana stat per LISTINGS.md, no em dashes,
  numbers never rounded up. Once per page.
- The three-motions taxonomy on /best-ai-sdr-tools.
- The quiet page furniture that already follows the design language:
  numbered hairline entries, the driftwood card treatment, tide-accent
  links, the wave footer, no em dashes anywhere in the copy (verified).

## Exemplar verdict

/alternatives/11x is the closest to good and the redesign exemplar candidate:
it is the only page where the claims have named, checkable sources, the only
one with a genuinely page-specific FAQ question, and its falls-short sections
could not have been generated from a template because the underlying material
(the 2025 reporting, the Vendr numbers) is particular to 11x. Its remaining
faults, unlinked sources, a boilerplate driftwood entry, the double-told
saga, and the stamp count, are all covered by the ranked fixes. Steal from
its siblings when applying the pattern: apollo's fair-warning honesty and
artisan's comparative driftwood entry are the two moves the exemplar itself
is missing.
