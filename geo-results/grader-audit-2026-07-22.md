# GEO grader hand audit — 2026-07-22

Hand audit of the GEO answer grader ordered by Aayush ("make sure there
are no false positives or false negatives"). Sample: a fresh local run of
the live panel (gpt-5.6-terra / claude-opus-4.8 / gemini-3.6-flash, all
:online) over all 20 tier-1 queries + 10 sampled tier-2/3 = 90 answers,
full text retained. Every answer containing a driftwood mention (17) was
read end-to-end; all 73 no-mention answers were substring-checked.

## Findings against the vocab-scan grader

- **4 false positives, 0 false negatives.**
- All four FPs are one failure shape: opus/gemini answers saying
  "I wasn't able to find this product... possible matches: Driftwood AI
  (the consulting firm)" graded `named_us` because (a) the uncertainty
  vocab list lacked that phrasing ("wasn't able to find", "didn't turn
  up", "didn't return"), (b) an early mention sat near the word "SDR"
  (sales-context check), and (c) the any-`named_us`-wins per-mention
  priority let one mis-graded mention override later collision mentions.
  FP rows: n1 opus, n1 gemini, n2 opus, n4 opus.
- True tier-1 named_us in the sample: 7 of 60 answers (grader claimed 11
  of 60). With majority voting the FPs flipped n1/n2/n4 to false hits.
- All 73 absents clean (no driftwood substring at all) — the regex
  absent gate is safe.
- Engine signal underneath: terra names us reliably (6/6 true
  named_us Tier-1s it produced); gemini mixed; **opus-4.8's web search
  never surfaced driftwood.sh** — it lands on driftwood-ai.com + Drift
  every time. That's a real distribution gap, not a grader bug.

## Fix: context-rich LLM judge (backend/app/geo_grader.py)

Vocab lists can't enumerate how models hedge. Verdicts now come from an
LLM judge (deepseek-v4-flash, reasoning off, temperature 0, strict JSON)
whose prompt carries the full context: who driftwood.sh is, every known
lookalike (driftwood-ai.com consulting, driftwood.ai, Driftwood
Capital/Technology, Drift, the social app), and the rubric — grade what
the ASKING USER would take away. The regex stays as the absent gate and
for the objective fields (competitors, mention_rank, snippet).

## Validation

All 17 mention answers re-graded by the judge: **17/17 agreement with
the hand verdicts** — the 4 FPs corrected (→ named_collision/ambiguous),
all 7 genuine named_us kept, all prior true collisions/ambiguous kept.

Raw answers: local batch only (not committed; regenerate with the panel
via backend/app/probes.py). Judge lives in backend (canonical);
site/scripts/geo-answer-probe.py retains the legacy vocab grader for
offline use.
