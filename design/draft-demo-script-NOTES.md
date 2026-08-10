# draft-demo-script — auditing the script, not the builds

Draft v2, 2026-08-09. Supersedes draft v1 (`draft-demo-builds.html`, deleted).

v1 was a per-build review surface: every shot of every chain, with a comment
box on each. Aayush's correction: **"I should only be able to see the
generalized form of the script and what the agent fills in. I don't really care
about each individual use of that script, since ideally it will be used
hundreds of times in very quick succession."** He is right, and it is the
better product — a surface that needs a human per build is a surface that caps
the pipeline at however many videos he has patience for, which defeats the
whole point of building it.

## The unit of audit is the TEMPLATE

Two things on the page, and nothing else:

1. **What the agent fills** — the six-field prospect record. That is the entire
   per-prospect surface. If those six fields are right the demo is right, so
   they are the only thing that varies and the only thing worth checking.
2. **The eleven shots in generalized form** — each prompt template with its
   slots marked, plus the beat and the grammar it has to hit. Five of the
   eleven have no slots at all; they are B-Pin's own and identical forever.

A comment goes against the SCRIPT, not a build. "s02 should not say premium,
half these chains are value retail" is a manifest edit that improves every
future demo — which is the only kind of feedback that compounds.

## Spot-check, not a review queue

A sample strip at the bottom: a few named chains plus "3 random from the last
100". Enough to catch quality drift without implying every build is inspected.
Deliberately not a list of all builds, and deliberately not gated.

## This dissolves the approval question from v1

v1's notes asked whether approving a build should gate the emails that link it.
With no per-build review there is no per-build approval, so the question goes
away. The send gate stays exactly where it already is — the 105 drafts sit on
`/dashboard/review` and nothing sends until Aayush releases that batch. The
demo pipeline publishes to a stable slug; the email review queue is the only
thing standing between a draft and a send. One gate, where it already was.

## Minimal delta

New route `/dashboard/script` behind `ApprovedUserDep`. It reads
`backend/demo_pipeline/shots.json` and renders it — the manifest IS the page,
so the page cannot drift from what the pipeline actually runs.

Backend needed is small, and much smaller than v1:

- `GET /demo-script` — serve the manifest
- `POST /demo-script/comment` — body plus optional shot id; posts a founder
  message to the owning agent naming the shot, so the existing wake path does
  the work
- `GET /demo-builds?limit=n` — the spot-check strip only

No `demo_builds` / `demo_shots` / `demo_comments` tables are needed for v2. The
orchestrator's `BuildResult.as_dict()` still wants persisting somewhere for the
spot-check strip and for cost accounting, but that is one table, not three.
