# Brand theme directions — giving driftwood an identity

*2026-07-13, from Aayush's feedback: "there is no brand or theme that we really
have like all the other cool websites do." References he rates: browserbase.com,
agentmail.to, greypointindustries.ca, saved.gg (his own past project).
Companion to `DESIGN.md` (tokens) and `anti-slop-notes.md` (credibility rules).*

## What the reference sites share

Studied browserbase + agentmail + saved.gg (greypoint blocks fetches). The
common property is not a style — it's commitment:

1. **One ownable identity device, repeated everywhere.** Browserbase: the
   browser-window motif and grid — the product IS the brand mark. AgentMail:
   the inbox/mail metaphor personified ("give every agent its own inbox") in
   both copy and visuals. The device shows up in every section, not once.
2. **The theme is derived from the name/product metaphor**, not decoration
   applied afterward. That's why it feels inevitable rather than styled.
3. **Copy voice matches the visual voice.** Browserbase writes infrastructure
   declaratives; AgentMail writes agent-first personification. The words and
   the pixels are the same brand.
4. **A committed typographic stance** — not system-default everything. One
   display voice you'd recognize out of context.

Our current site is *tasteful default*: white, system sans, one blue accent,
serif-italic accent word, hairlines. Clean — and anonymous. Every rule in
anti-slop-notes is satisfied, but nothing is *ours*. That's the gap Aayush is
naming.

## What driftwood already owns (unused equity)

- The name: driftwood — sea, tide, weathered wood, things that arrive on shore.
- The logo: a ship's helm / compass.
- The palette name in DESIGN.md is literally **paper + tide**.
- The product story: agents that go out, do real work, and come back with
  something (a demo, a booked call). Expedition-shaped.

The nautical theme isn't a stretch; it's sitting there unclaimed.

## Direction A — The chart room (recommended)

Navigation charts + ship's log. Precise, instrumental, quietly maritime —
never pirate-kitsch.

Devices:
- **Chart grid**: the hairline rails grow faint coordinate ticks/graticule in
  the margins; section numbers rendered like chart soundings.
- **Compass rose** as the single decorative mark (we already have the helm);
  buoy-dot status markers (the green toast dot becomes a brand element).
- **Type**: a display serif with instrument character for headlines (the
  existing Georgia italic accent graduates into a real display voice);
  monospace for agent traces, styled as **ship's-log entries** ("Jul 9 —
  read superhuman.com. found the bug. built the demo.").
- **Copy voice**: log-entry cadence for proof sections; declaratives
  elsewhere. "Week one" already wants to be a logbook page.
- **The dashboard** frames as an instrument panel; the walkthrough artifacts
  become chart annotations.
- Palette stays paper + tide (deepen tide slightly; add one weathered-brass
  neutral for hairline accents).

Why it wins: derived from the name (rule 2), one device everywhere (rule 1),
log-voice copy (rule 3), ownable — no outbound/sales tool looks like this.
Compatible with every anti-slop rule (paper, hairlines, no gradients).

Risk to manage: literalism. No waves, no anchors, no rope borders. The
nautical layer is structural (grids, logs, instruments), never illustrative.

## Direction B — The boatyard / workshop

Artifacts pinned to paper: demos as "builds", rubber stamps (SENT · REPLIED ·
BOOKED), pencil annotations (the old landing's hand-drawn arrow was this),
masking-tape corners. Warm, crafty, human.

Wins: matches "the agent builds you a thing" better than any theme; stamps are
a great status language. Risk: twee/scrapbook if overdone; harder to keep
credible for a tool that touches your LinkedIn account.

## Direction C — The instrument panel (Browserbase-adjacent)

Full technical: mono labels, visible grid, terminal traces, status LEDs.
Wins: easiest to execute, familiar. Risk: least ownable — half the dev-tool
landscape lives here, and driftwood sells to founders, not developers. This
is the direction most likely to still feel like "someone else's site".

## Recommendation

**A, seasoned with B's stamps**: chart-room structure and type, log-entry
copy voice, rubber-stamp status marks (BOOKED across the thread foot). One
device per section, always the same family. Ship as `landing-draft-v6.html`
once Aayush picks; v5's structural fixes (centered hero, trimmed copy, no
pill, walkthrough) carry over unchanged — the theme layers onto that
skeleton.
