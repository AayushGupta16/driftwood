# SEO match audit: search term = title = H1

2026-07-21. Proposal only, no code changed. Audits the five live pages
(driftwood.sh) against the Keyword Planner data in
`ads/research-keyword-volumes-2026-07-20.md` (all three rounds) and the copy
rules in `site/LISTINGS.md`. The principle under test: the words a searcher
types should be the words in the title tag and the H1, and FAQ questions
should be phrased the way people actually ask.

Two kinds of finding, kept separate throughout:

- **Mechanical**: the stat kit changed tonight. LISTINGS.md now requires
  "replies went from under 1% to over 14% in week one at Autosana (YC S25)"
  and retires the "14x / 14×" multiplier form everywhere going forward.
  Every live occurrence of the old form is listed below with file and line.
  These need no judgment, only careful sentence surgery.
- **Judgment (Aayush)**: query-language changes that trade brand voice for
  search match, anything touching the homepage, and any new FAQ copy. Marked
  explicitly. Homepage body copy is off limits per standing decision; the
  homepage title tag and meta description are in scope but flagged as his
  call.

All proposed copy follows the LISTINGS.md rules: no em dashes, no "personalized
video" or "personalized landing page" phrasing, stat never rounded or
unattributed, identities stay redacted.

## Summary of proposed deltas

- Mechanical: 14 line-level stat-form replacements across 5 files.
- Judgment calls for Aayush: 6 (homepage title, homepage meta description,
  homepage body stat conflict, Autosana stat-card number, one FAQ question
  rephrase, FAQ tail-question additions).
- Flag-only, no proposal: homepage H1 (body copy, off limits).

---

## 1. Homepage `/` (site/landing/index.html + src/App.tsx)

| Field | Current (verbatim) |
|---|---|
| Title (index.html:6) | `driftwood · ship a custom demo in every cold message` |
| H1 (App.tsx:568-571) | `Ship a custom demo in every cold message.` |
| Meta description (index.html:7-10) | `The agent researches each prospect, builds them a custom demo, and sends the message for you. Every message is human reviewed before it sends.` |

**Issue.** The title, H1, and meta description contain zero query language. No
searcher types "custom demo in every cold message"; they type "ai sdr"
(1K-10K/mo, the category head term), "ai sales agent" (1K-10K/mo), or "ai sdr
tool" (100-1K/mo, Low competition, $27-104 top-of-page, the clearest
commercial-intent term of round 1). The only places "AI SDR" appears on the
homepage today are the JSON-LD blocks (`alternateName: "Driftwood AI SDR"`,
lines 47 and 68), which search engines read but do not display or weight like
a title. The homepage is the site's strongest page and it is invisible for the
category's own name.

**Proposal (JUDGMENT, Aayush's call).** Smallest delta that injects the head
term while keeping his phrase intact:

- Title: `driftwood · the AI SDR that ships a custom demo in every cold message`
- Meta description: `driftwood is an AI SDR for cold outbound. The agent researches each prospect, builds them a custom demo, and sends the message for you. Every message is human reviewed before it sends.`
- If the title changes, `og:title` (line 24) and `og:image:alt` (line 36)
  mirror it and should change with it; same for `og:description` (lines 25-28).

The title variant is one inserted clause; the meta variant is one prefixed
sentence. Both keep "custom demo" (his homepage word) rather than swapping to
the listings-kit "working demo", to keep the delta minimal; unifying on
"working demo" sitewide is a separate call he can make.

**Keywords justifying it:** "ai sdr" 1K-10K Medium; "ai sdr tool" 100-1K Low
$26.53-103.69; "ai sales agent" 1K-10K Medium. ("ai bdr" is dying, -90% YoY;
do not use it anywhere.)

**Risk note:** the homepage title carries brand voice; changing it trades
brand for query match, and the title is what shows in every share card and
SERP. Flag for Aayush; do not ship without his yes.

**H1 (FLAG ONLY, no proposal).** The H1 has the same zero-query-language issue
as the title, but it is homepage body copy and body copy is off limits per the
standing decision. Recorded here so the gap is on the books, not proposed.

**Old-stat conflict (JUDGMENT, Aayush's call).** `src/App.tsx:615` reads
`Same leads, <b>14&times;</b> the replies. Week one at Autosana.` This is the
old multiplier form, which the kit retires everywhere going forward, but it
sits in homepage body copy, which is off limits. The two standing rules
collide; only Aayush can resolve which wins. Proposed replacement if he
approves: `Same leads. Replies went from under 1% to over 14% in week one at Autosana.`

---

## 2. `/faq` (site/landing/public/faq/index.html)

| Field | Current (verbatim) |
|---|---|
| Title (line 6) | `driftwood FAQ: the AI SDR that ships working demos` |
| H1 (line 237) | `Frequently asked questions` |
| Meta description (line 7) | `Answers about driftwood, the AI SDR that ships a working demo of your product in every cold message: human review, sending from your own account, and results so far.` |

**Title, H1, meta: no change proposed.** The title and meta already lead with
"AI SDR", the head term. "Frequently asked questions" as H1 is generic but
standard for the page type and matches no better alternative in the data.

**Question wording vs the round-3 question tail.** The ten current questions
are product FAQs (what is it, does it send by itself, what does it cost).
That is the right job for this page and most of them read the way a prospect
would ask; no rewording needed for eight of them. Two findings:

1. **"How is driftwood different from AI SDR tools like 11x or Artisan?"**
   already matches real query language ("ai sdr tools", plus comparison-query
   demand shown by "instantly ai vs lemlist" at 10-100/mo). Keep verbatim.
2. **"What results has it gotten?"** is internal phrasing; searchers ask in
   reply-rate and benchmark vocabulary ("cold email benchmarks" 10-100/mo,
   "average cold email open rate" 10-100/mo). Proposed rephrase (JUDGMENT,
   small): `What reply rates has driftwood gotten?` Risk: nearly zero, but it
   is a wording change to a live page Aayush approved, so it is his call.

**Old stat, mechanical fix required in two places:**

- Line 192 (FAQPage JSON-LD answer) and line 275 (visible answer), currently:
  `In week one at Autosana (YC S25), driftwood got 14× the replies of prior founder-led outbound on the same lead list, where the founders' self-reported reply rate was under 1%. ...`
- Proposed replacement (both places, keeping the second and third sentences
  as they are): `Replies went from under 1% to over 14% in week one at Autosana (YC S25), on the same lead list as prior founder-led outbound; under 1% is the founders' self-reported rate. One CTO who had ignored 4.5 months of outreach replied in about 12 hours and booked a call. That is one company's observed result, not a promise.`
- Note the JSON-LD and the visible copy must stay identical; FAQPage markup
  that disagrees with the page is a rich-result risk, and AI engines read the
  JSON-LD directly (GEO surface).

**Candidate new questions from the round-3 tail (JUDGMENT, draft-first).**
Round 3's read says the question tail becomes H2s/FAQs, not standalone pages,
and it is what founders ask AI engines. The literal phrasings with any signal:

| Tail phrase | Planner volume | Candidate FAQ question |
|---|---|---|
| do cold emails still work | 0-10 (Planner is blind to question tail) | `Do cold emails still work?` |
| when to hire an sdr | 0-10 (same caveat) | `When should a startup hire an SDR?` |
| cold email benchmarks / average cold email open rate | 10-100 each | feeds the results answer above, or a future benchmarks page |

These require new answer copy, which the copy rules say goes draft-first with
Aayush's direction, and round 3 slated the same phrases for the planned
/founder-led-sales and benchmarks pages, so placing them here first could
cannibalize those. Explicitly his call: add two questions to /faq now, or hold
them for the new pages. No copy drafted here on purpose.

---

## 3. `/customers/autosana` (site/landing/public/customers/autosana/index.html)

| Field | Current (verbatim) |
|---|---|
| Title (line 6) | `Autosana got 14x the replies in week one · driftwood` |
| H1 (line 367) | `Autosana got 14× the replies in week one` (voice em on "14× the replies") |
| Meta description (line 7) | `Autosana (YC S25) ran founder-led cold outbound at a reply rate under 1%. In week one with driftwood, the same lead list returned 14x the replies, including a CTO who had gone quiet for 4.5 months.` |

**Query-language read.** A customer story is a proof page, not a query-capture
page; nobody searches "autosana replies". No query-language delta is proposed
beyond the stat form. The keyword data offers nothing better for this page and
forcing "ai sdr case study" into it would be vocabulary the data does not
support.

**Old stat: this page is the epicenter, 9 occurrences, all the same mechanical
kit change (the stat-card number is the one judgment item):**

| Line | Surface | Current | Proposed |
|---|---|---|---|
| 6 | title | `Autosana got 14x the replies in week one · driftwood` | `Autosana went from under 1% to over 14% replies in week one · driftwood` |
| 7 | meta description | (above) | `Autosana (YC S25) ran founder-led cold outbound at a reply rate under 1%. In week one with driftwood, replies on the same lead list went to over 14%, including a CTO who had gone quiet for 4.5 months.` |
| 12 | og:title | mirrors title | mirrors new title |
| 13 | og:description | mirrors meta | mirrors new meta |
| 29 | JSON-LD headline | `Autosana got 14x the replies in week one` | `Autosana went from under 1% to over 14% replies in week one` |
| 30 | JSON-LD description | old form | mirrors new meta, first two sentences |
| 367 | H1 | `Autosana got <em>14× the replies</em> in week one` | `Autosana went from <em>under 1% to over 14%</em> replies in week one` |
| 435 | body | `In week one, the same lead list that had returned under 1% produced 14× the replies. Same leads, same founder's account. Different messages.` | `In week one, replies on the same lead list went from under 1% to over 14%. Same leads, same founder's account. Different messages.` |
| 438 | stat card `.num` | `14×` (sub: "the replies, week one, same lead list") | JUDGMENT: `over 14%` with sub `replies in week one, up from under 1%, same lead list`; this is a designed element, so it goes through the draft-first rule in design/ before shipping |

Note on the title: the strict verbatim kit form ("replies went from under 1%
to over 14% in week one at Autosana (YC S25)") is 72+ characters before the
brand suffix and will truncate in SERPs; the proposed title keeps the numbers
and the week-one frame in front. If Aayush wants the strict form in the title
despite truncation, that is his call; everywhere else the verbatim form fits.

**Risk note:** low; the page's whole reason to exist is the stat, and the kit
change is already decided. The only judgment is the stat-card visual.

---

## 4. `/demo-led-outbound` (site/landing/public/demo-led-outbound/index.html)

| Field | Current (verbatim) |
|---|---|
| Title (line 6) | `Demo-led outbound: definition and how it works · driftwood` |
| H1 (line 273) | `Demo-led outbound` |
| Meta description (line 7) | `Demo-led outbound: cold outreach where every message carries a working demo of your product, built for the prospect receiving it. Definition and how it runs.` |

**Query-language read: deliberate exception, no title/H1 change proposed.**
"Demo-led outbound" has effectively zero search volume; round 2 says so
directly ("ai for cold outbound: 0-10/mo. Insider phrasing, zero volume, same
lesson as demo-led outbound. Do not build pages or ads on it."). But this page
is the term-coining and GEO play, not a query-capture page: it exists so that
AI engines and eventually the market attach the term to driftwood. Renaming
its H1 to a volume term would defeat the page. The meta description already
bridges to real vocabulary with "cold outreach" in the first sentence, which
is the right amount of bridging. Recorded as a known, intentional violation of
the match principle.

**Old stat, mechanical fix, one occurrence:**

- Line 307, currently: `In week one at Autosana (YC S25), demo-led outbound run by driftwood got 14× the replies on the same lead list as their prior founder-led outbound, which had a self-reported reply rate under 1%. ...`
- Proposed: `In week one at Autosana (YC S25), demo-led outbound run by driftwood took replies on the same lead list from under 1%, the founders' self-reported rate, to over 14%. One reply came from a CTO who had ignored 4.5 months of prior outreach and answered in about 12 hours. That message opened with a real bug driftwood's agent had found on his site, next to a 19-second demo video.`
  (Second and third sentences unchanged.)

**Risk note:** none beyond getting the sentence right; the H2 above it ("Does
it work?") is fine and, incidentally, is exactly the question-tail register
round 3 recommends.

---

## 5. `/best-ai-sdr-tools` (site/landing/public/best-ai-sdr-tools/index.html)

| Field | Current (verbatim) |
|---|---|
| Title (line 6) | `The best AI SDR tools in 2026, ranked · driftwood` |
| H1 (line 257) | `The best AI SDR tools in 2026, ranked` (voice em on "ranked") |
| Meta description (line 7) | `A ranked comparison of AI SDR tools in 2026: autonomous agents, signal-driven platforms, and copilots. Written by the driftwood team, with an honest note on when to pick a competitor over us.` |

**Query-language read: already the best-matched page on the site. No change
proposed.** Title equals H1 equals the query pattern. "ai sdr tool" is
100-1K/mo at Low competition ($26.53-103.69 top-of-page), "ai sdr" 1K-10K, and
"best cold email software" / "best cold email platform" style best-of queries
show the modifier pattern is real. "instantly ai vs lemlist" (10-100/mo)
confirms comparison demand, which this page serves. The "ranked" flourish in
the H1 is brand voice on top of a full query match, which is the right order.
The monthly-refresh obligation on this page (GEO plan) stands; "Updated July
2026" is current this month.

**Old stat, mechanical fix, one occurrence:**

- Line 323 (driftwood entry), currently: `In week one at Autosana (YC S25), that approach got 14× the replies on the same lead list, against a baseline the team self-reported at under 1%.`
- Proposed: `In week one at Autosana (YC S25), that approach took replies on the same lead list from under 1%, the team's self-reported baseline, to over 14%.`

**Risk note:** none; single sentence inside the entry card.

---

## 6. `llms.txt` (site/landing/public/llms.txt), stat only

Not a title/H1 surface, but it is the GEO answer sheet and carries the old
form twice. Mechanical:

- Line 13: `... In week one at Autosana (YC S25), driftwood got 14× the replies on the same lead list, including a CTO who had ignored four months of prior outreach and replied within about 12 hours to book a call.`
  Proposed: `... In week one at Autosana (YC S25), replies on the same lead list went from under 1% to over 14%, including a CTO who had ignored four months of prior outreach and replied within about 12 hours to book a call.`
- Line 22: `- Customer story, Autosana (YC S25), 14× the replies in week one: https://driftwood.sh/customers/autosana`
  Proposed: `- Customer story, Autosana (YC S25), replies from under 1% to over 14% in week one: https://driftwood.sh/customers/autosana`

Observation, no delta proposed: line 13 also contains em dashes. The
LISTINGS.md em-dash ban is written for listing blurbs; whether it extends to
llms.txt is Aayush's call and out of this audit's scope.

---

## Complete old-stat occurrence list (14x / 14× / 14&times;)

All paths relative to `site/landing/`.

| # | File:line | Surface | Category |
|---|---|---|---|
| 1 | public/customers/autosana/index.html:6 | title | mechanical |
| 2 | public/customers/autosana/index.html:7 | meta description | mechanical |
| 3 | public/customers/autosana/index.html:12 | og:title | mechanical |
| 4 | public/customers/autosana/index.html:13 | og:description | mechanical |
| 5 | public/customers/autosana/index.html:29 | JSON-LD headline | mechanical |
| 6 | public/customers/autosana/index.html:30 | JSON-LD description | mechanical |
| 7 | public/customers/autosana/index.html:367 | H1 | mechanical |
| 8 | public/customers/autosana/index.html:435 | body copy | mechanical |
| 9 | public/customers/autosana/index.html:438 | stat card number | judgment (designed element, draft-first) |
| 10 | public/demo-led-outbound/index.html:307 | body copy | mechanical |
| 11 | public/faq/index.html:192 | FAQPage JSON-LD | mechanical |
| 12 | public/faq/index.html:275 | visible FAQ answer | mechanical |
| 13 | public/best-ai-sdr-tools/index.html:323 | driftwood entry copy | mechanical |
| 14 | public/llms.txt:13 | GEO summary paragraph | mechanical |
| 15 | public/llms.txt:22 | GEO link line | mechanical |
| 16 | src/App.tsx:615 | homepage body copy | judgment (off-limits body vs kit rule; Aayush resolves) |

---

## Priorities

1. **Autosana page stat sweep (9 occurrences).** The proof page violates the
   new stat kit in its most-shared surfaces: title, og tags, JSON-LD, H1.
   Every share card generated tonight onward carries the retired form until
   this ships. Almost entirely mechanical.
2. **Homepage title tag and meta description: add "AI SDR".** The 1K-10K head
   term appears nowhere the SERP shows. These are the only two homepage
   surfaces in scope without touching body copy, and both deltas are one
   clause. Judgment: needs Aayush's yes on the voice trade.
3. **FAQ: fix the stat inside the FAQPage JSON-LD (line 192) and decide on the
   two tail questions.** The JSON-LD is what AI engines quote (GEO surface),
   so the old stat there propagates into generated answers; the round-3
   question tail ("do cold emails still work", "when to hire an sdr") is what
   founders ask those engines, and the FAQ is the cheapest place to hold those
   phrasings until the dedicated pages exist. Stat fix mechanical; questions
   are Aayush's call.
