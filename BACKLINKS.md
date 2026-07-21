# BACKLINKS.md — canonical backlink registry (updated 2026-07-21)

Canonical registry of every backlink AND unlinked brand mention for
driftwood.sh. Companion docs: SEO.md (authority engine + press playbook
own the strategy and rationale), LISTINGS.md (canonical blurbs + listing
status). This file is the ledger, not the strategy. RULE: update this
file in the same commit as any acquisition (a link lands, a listing goes
live, a mention appears). Discovery: GSC Links report reconciled monthly
(fold anything new into the main table); manual logging on every
acquisition the moment it happens.

Column definitions:
- URL/source: the page that links to (or mentions) us.
- Date acquired: date the link/mention went live, or discovery date via
  GSC if we missed the landing (note which).
- Acquisition path: how we got it (self-serve listing, pitch, press
  request, cross-link ask, organic/unsolicited, marketplace).
- Link type: dofollow / nofollow / unlinked mention / pending.
  Pending = link promised or in-flight but not yet live/confirmed.
- Target page: which driftwood.sh URL the link points at.
- Notes: verification state, anchor text, anything load-bearing.

## Links

| URL/source | Date acquired | Acquisition path | Link type | Target page | Notes |
|---|---|---|---|---|---|
| linkedin.com/company/driftwood-ai-inc | pre-2026-07-15 (exact date not logged) | self-serve company page | nofollow (assumed, unverified) | https://driftwood.sh | Live per LISTINGS.md; LinkedIn outbound links are nofollow as a rule. Schema sameAs points here (d8ecfa4). |
| crunchbase.com/organization/driftwood-driftwood-sh | 2026-07-20 | self-serve listing (medium no-social-proof blurb per LISTINGS.md) | nofollow (verified on-page) | https://driftwood.sh | On-page link VERIFIED 2026-07-21 via logged-in browser session: anchor "driftwood.sh" → https://driftwood.sh, rel="nofollow noopener noreferrer". Name pairing "driftwood (driftwood.sh)" and medium no-social-proof blurb match LISTINGS.md verbatim; logo, tagline, categories (AI / Lead Generation / Sales Automation), founder Aayush Gupta, SF location, founded 2026, contact email all present. Bonus: profile also links linkedin.com/company/driftwood-ai-inc (nofollow). |
| g2.com (profile URL pending) | 2026-07-20 (approved) | self-serve listing (instant approval) | pending | https://driftwood.sh | Categories being assigned; profile link arriving by email; Aayush = profile admin. Yuvan review invite sent (yuvan@autosana.ai). Fill in URL + link type when the email lands. |

## Press-platform pilot log (60-90 days; Source of Sources + Qwoted)

Per SEO.md press playbook. ALL published acceptance rates for these
platforms were refuted in the 2026-07-21 research pass — this log exists
to build our own base rate. Log EVERY response sent, not just wins.
Responses are drafts until Aayush approves (standing gate).

| Platform | Request date | Outlet | DR | Response sent (y/n, date, Aayush-approved) | Outcome | Link type |
|---|---|---|---|---|---|---|
| | | | | | | |

## Unlinked mentions

Brand mentions without links — they matter for AI visibility (rationale
in SEO.md/GEO.md, not repeated here). Log them like links; a mention is
also a warm target for a link ask.

| URL/source | Date found | Context (quote/anchor) | Name pairing correct (driftwood (driftwood.sh))? | Follow-up |
|---|---|---|---|---|
| Google AI Overview, query "driftwood ai sdr" | 2026-07-21 | Overview describes driftwood (demo-led outbound), cites our /faq + a r/SaaSMarketing thread; screenshot from Aayush | Overview says "Driftwood AI" (collision-adjacent) and mislabeled us autonomous (FAQ recut same day) | Track whether the overview picks up the assisted phrasing after recrawl |
| reddit.com r/SaaSMarketing, "has anyone actually gotten meetings from ai sdr" (2026-06-01) | 2026-07-21 | Co-cited by the Google AI Overview above; thread content unread | unknown | Investigation owed: is driftwood named in-thread, by whom, sentiment |

## Pending / target pipeline

Seeded from SEO.md authority engine + LISTINGS.md. Move rows up to the
Links table when they go live (same commit).

| Target | Status | Path | Blocker/trigger | Notes |
|---|---|---|---|---|
| Autosana site cross-link | drafted, Aayush sends | cross-link ask (bundled with Yuvan on-record + G2 review ask) | Aayush's send | Customer-zero story; disclose the relationship. |
| a16z speedrun directory | drafted, Aayush sends | portfolio directory ask | Aayush's send | A001. |
| 4 listicle pitches | drafted, Aayush sends | pitch (pool-membership play) | send AFTER /cold-outbound-benchmarks is live | Drafts in outreach-drafts-2026-07-21.md. |
| UMD Innovation Gateway "Founder Stories" | press queue | pitch (innovate.umd.edu/founder-stories) | Aayush's send | Verified dofollow .edu, indexable links to founder sites. Pitch SEPARATELY from OMC. |
| UMD OMC "Pitch Your Story" | press queue | Asana form / omc@umd.edu | Aayush's send | Channels: Terp magazine + alumni newsletter. Dingman Center scope unverified. |
| Zapier marketplace listing | product roadmap | integration marketplace | build light REST triggers/actions | First of three; each listing = link + /integrations/<name> page target. |
| Attio marketplace listing | product roadmap | integration marketplace | after Zapier | ICP-native. |
| HubSpot App Marketplace listing | product roadmap | integration marketplace | after Attio | Skip Salesforce AppExchange (standing call). |
| Product Hunt | later, Aayush's timing | self-serve launch | Aayush's timing | Category: AI SDR. |
| TAAFT | SKIPPED (do not pursue) | — | — | Fee-gated; never-paid-backlinks rule. Logged so nobody re-opens it. |
