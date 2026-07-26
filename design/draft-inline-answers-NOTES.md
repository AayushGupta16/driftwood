# Agents page + answering in place: integration notes

Companion to `draft-inline-answers.html`. Draft only; nothing here is applied.

Open the HTML directly — it is self-contained, no server needed. The black bar
at the top is draft chrome, not part of the design. The **proposed / today**
radio flips the card layout so you can compare; the two checkboxes let you feel
the mid-turn and not-picked-up states without a real agent.

Four changes, in the order they matter:

1. **Answering in place.** "Questions for you" stops being read-only: each
   question gets an answer field, `options` become real buttons, and one send
   button posts **a single message** covering everything you answered.
2. **A notification dot**, inside each card's top-right corner, on any agent
   with an open ask. No count on the dot. Order stays alphabetical and stable so
   a card never moves when its state changes — the dot is the only thing that
   varies. It keys off `needs_human` being non-empty, not the agent-authored
   state pill. Adds one token, `--alert: #b42318` (see (g)).
3. **The card reordered** to summary → your action → one quiet goal line, with
   goal detail moved into the dialog. Rows stretch so the footer controls line
   up.
4. **Goals and deadlines** as a real section in the dialog, with overdue
   surfaced and the blocked step mark fixed.

## Why one send and not one per card

This is the constraint the whole design hangs on.

`POST /api/v1/admin/agents/{id}/conversation` calls
`hub.send_message_create()`, which writes one frame to the gateway websocket
and returns whether the socket accepted it. That is the entire delivery
guarantee — a 200 does not mean a turn will run.

Picoclaw has no queue-for-next-turn. From the autosana reply-loss diagnosis
(2026-07-07): founder messages arriving while the main agent was mid-turn
"never spawned a turn at all — swallowed gateway-side."

So a reply box that sends per card would mean: answer 1 wakes a turn, answers 2
and 3 land during that turn and are lost, and the UI reports all three as sent.
Batching is not a nicety here, it is the only correct shape.

## Message format

One message, each question quoted above its answer:

```
Answering 2 of your 3 questions:

1. Should Flash keep the disappointed tag?
→ Use neutral

2. Approve the Comcast set for send.
→ Approved, send them all.

Still thinking about the other one.
```

Quoting is load-bearing **today**. As of `origin/main`, `NeedsHuman` has no
`id` field at all, so there is nothing to correlate an answer back to except the
question text — capped at 500 chars, so quoting is bounded.

This is exactly the gap the stable-id + open/close lifecycle work would close.
If asks get identities, the answer can name the id and the quote becomes a
courtesy rather than the mechanism. Build the quoting either way; it is what the
agent reads.

Partial answers name themselves ("Answering 2 of your 3") and say what is still
open, so the agent does not treat silence on question 3 as a decision.

## a) Frontend edits (`landing/src`)

1. **`components/useAgentChat.ts` — `send` needs an explicit-text variant.**
   Today it closes over `draft` state:
   ```ts
   const send = useCallback(async () => {
     const text = draft.trim();
     ...
   }, [base, draft, sending]);
   ```
   Add `sendText(text: string)` with the POST body, and reimplement `send` as
   `sendText(draft)`. The answers panel must not go through the composer's
   draft state — a half-typed chat message would be clobbered.

2. **`Agents.tsx` — pass `chat` into `AgentStatusPanel`.** `useAgentChat` is
   already mounted for the whole dialog (`AgentDetail`, the hook call above the
   tab switch), so no second fetch is needed; the panel signature changes from
   `{ agent }` to `{ agent, chat }`.

3. **`Agents.tsx` — the "Questions for you" section.** Answer state is a
   `Map<questionKey, string>` local to the panel. `options.map` changes from
   `<div>` to `<button aria-pressed>` writing `option.label` into that map;
   clicking the selected option clears it so a mis-click is undoable without
   reaching for the text field. A sticky footer holds the count and the single
   send button.

4. **Question key.** `need.id ?? need.question`. There is no `id` on the wire
   today, so this is the question text in practice; the fallback is there for
   when ids land.

5. **Render by `kind`** (shipped in `a3e4446`): `review` leads with the link as
   a button — the schema guarantees a url, and looking is the first thing you do;
   `decision` leads with its option buttons; `question` is just the field. The
   card's action label follows suit — "Needs your eyes" for a review, "Your
   action" otherwise.

## b) The thing the draft is lying about

**Answered questions do not disappear.** The draft splices them out locally.
In production `needs_human` is agent-authored and only changes when the agent
next calls `update_status`, while `AgentsView` re-polls
`/api/v1/admin/agents/dashboard` every 15s and replaces `payload` wholesale —
so anything removed locally reappears on the next poll.

Handle it explicitly rather than by accident: keep an "answered, waiting for
the agent to confirm" state per question, keyed the same way, and render those
cards collapsed with the answer you gave. Clear the local state when a status
update arrives that no longer contains that question. Without this the section
will visibly flicker answered questions back every 15 seconds.

## c) Delivery confirmation (phase 2, needs backend)

The draft shows this because it changes how much you can trust the feature, not
because it is free. Once this is how decisions get cleared, you will send and
walk away, and a swallowed message is silent.

The protocol is already proven from the steer-delivery work: after sending,
look for an `agent.turn.start` whose `summary` carries the sent text, within
~3 min; if none appears, the message is gone and needs a resend. That means a
new admin endpoint over `agent_events` — nothing exists for it today.

A cheaper first cut ships with phase 1 and needs no backend: the card already
carries `is_running`, so warn before sending into a live turn. That is the
"agent is mid-turn" checkbox in the draft.

## d) Deadlines — CORRECTED

An earlier version of these notes claimed `deadline_note` did not exist and that
the card silently dropped most deadlines. **Both were wrong**, written against a
backend tree two commits behind `origin/main`.

`a124a87` made `deadline` a real `date` and added `deadline_note` for
"anything to say ABOUT the deadline", and site `e07a53e` already aligned the
frontend. So overdue is now a date comparison rather than a regex over
"6:00pm PT (MISSED)", and there is nothing to fix here. The draft's fixture
follows the shipped shape: `deadline` a bare date, `deadline_note` the prose,
rendered as a second line under the due date.

**Deadlines now read as a countdown**, per your call: `due in 1d 21h` on the
card, `Due in 1 day and 21 hours — Jul 27` in the dialog (relative for urgency,
absolute for planning). Overdue reads `2h overdue` / `2 hours overdue — was due
Jul 25`. Past a week the hours are dropped as noise; inside a day the days are.
A done or cancelled goal keeps the plain date — a countdown on a finished goal
is meaningless.

One honest caveat: `deadline` is date-only, so the hours are measured to **23:59
of that day**, not to a time the agent gave. That is why several fixtures read
"…21h" at once — it is hours-until-end-of-day, not agent-supplied precision. If
you want the hours to mean something specific, the schema needs a time back on
the deadline, which `a124a87` deliberately removed to keep it a clean date.

Still open on goals: `blocked_on` is declared in the frontend `Goal` type and
never rendered, and `StatusGoal.progress` is not declared at all. Both are
agent-authored and both are things you would want on a blocked goal.

## e) The blocked step mark

`.agent-step-mark[data-status="blocked"]` differs from `todo` by one step of
grey (`#6a737d` vs `#9aa2ab`) and a `--color-sand` fill, at 14px. The draft
gives blocked a solid ink fill with a white dash, so it reads as heavier than
an empty todo ring at a glance. Still one accent — ink is not an accent.

## f) Is the Messages tab still needed?

Yes, and the reason is worth naming because it changes how the tab should be
framed once answering moves to Status.

**The questions panel closes loops the agent opened. Messages is where you open
loops yourself.** Answering is bounded and reactive — you can only respond to
what the agent thought to ask. Everything else you do with an agent is
unprompted: redirect it, correct a wrong assumption, add context it did not
know to ask for, change what matters this week. There is no `needs_human` entry
for "stop doing that, do this instead."

It also stays the only place that holds:

- **The record.** It is the founder channel, mirrored to Slack — where you go
  to see what you told it last week.
- **Follow-up.** An answer is often not terminal; the agent replies and you
  refine. A question, once answered, is gone from the panel.
- **The agent's reasoning in prose**, which the structured status flattens away.

The draft keeps the plain "Message Oruk" placeholder and adds one line under
the tab noting that answers sent from Status land here too, so the two surfaces
read as one conversation rather than two inboxes.

## g) The `--alert` token

The notification dot needs a colour that is not the accent, and
`design-language.md` line 25 says a second accent colour means the design is
wrong. Agreed exception: `--alert: #b42318`, used at 8px as a notification dot
and nowhere else — it is a state marker, not an accent competing for the eye.
Per `site/CLAUDE.md` the doc has to be amended in the same commit or the change
does not land. Suggested wording for section 1:

> One accent. If a design wants a second accent color, the design is wrong.
> `--alert` is not an accent: it marks "this needs you" as a dot, at most 8px,
> never as a fill, border, text colour, or button.

Motion: the dot pulses on a 2.4s cycle and is disabled under
`prefers-reduced-motion`.

## h) Overlap with the update_status work

That workstream owns the contract; this draft owns the surface. Keep the line
clean:

- **Theirs:** `update_status` semantics (replace for descriptions, lifecycle for
  requests), stable ask ids and explicit open/close, the required-url rule
  (shipped), status read-back, and a possible `copy_review` kind.
- **This draft:** the agents page and the dialog that renders it.

One genuine collision to settle before either side builds: their stated goal
includes "answer an ask from the dashboard instead of in Slack", which is this
draft's whole first section. Their ids and lifecycle make it correct; this is
what it looks like. They should meet, not be built twice.

Their lifecycle work also deletes two things listed above as problems: the
quoting workaround in **Message format**, and the 15-second flicker in **(b)**.
It additionally unlocks something this draft cannot show today — "asked 3 days
ago, still open" — which belongs on the question card as soon as asks have
an opened-at.

## Open questions for you

- **The option label appears in the text field once you pick it.** That is
  deliberate — what you see is exactly what gets sent, and you can edit it. But
  it reads as duplication. The alternative is an empty field with an
  "add a note" placeholder, at the cost of the message no longer being fully
  visible before you send it. Which do you want?
- **Should the send bar also appear on the card itself?** Right now answering
  requires opening the dialog. The card shows only the first question
  (`needs_human[0]`), so an inline answer there would hide the fact that there
  are three.
- **Should sending switch you to the Messages tab?** It puts the sent message
  in context, but it also throws away where you were in the question list.

## i) One ask, two surfaces

Asks should be spoken naturally in the channel AND registered structurally, so
you can answer in whichever place you are. Right now those are independent:
`needs_human` and what the agent says in Slack have no relationship, so an agent
can ask in the channel without registering it (no dot, no card) or register one
it never mentioned (a dot for something you were never told about).

Two consequences worth building around:

1. **The instruction belongs in the `needs_human` field description, not
   AGENT.md** — same reasoning as the rest of the status contract. Something
   like: "every ask you make in the channel belongs here too; this is the same
   ask, not a second one."
2. **Resolution has to be surface-agnostic.** If you answer in Slack and the
   structured ask stays open, the dot lingers over something already handled —
   which is worse than no dot, because it teaches you to ignore it. So the reply
   path has to close asks the same way the dashboard does.

That second point makes the stable-id + open/close lifecycle a prerequisite
rather than a nice-to-have, and it belongs with whoever owns that work (see (h)).
The surface side is already built for it: answering clears the dot immediately
and, if the send is not picked up, puts it back.
