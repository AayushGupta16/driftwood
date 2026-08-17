# Draft — X connect, chat PIN step

Draft: `draft-twitter-pin-step.html`. Status: **awaiting Aayush's sign-off.**

## The problem

`/twitter/finish` stamps `twitter_connected_at` off one signal: a non-empty
`auth_token` cookie on the saved profile. That proves **login**. It does not
prove **XChat is unlocked**.

So the current flow has a silent-failure path:

1. User clicks Connect X, logs in, closes the tab.
2. Cookie is there → card goes green, "You're connected! We'll take it from here."
3. The profile holds no chat encryption keys.
4. Every DM delivery navigates into Messages, X redirects the keyless session to
   `/i/chat/pin/recovery`, the cua loop hard-stops on the never-ack URL list, and
   `_require_done` raises `flagged`.

The card says connected, the sends never land, and nothing in the UI ever says
why. This is the same screen as the 08-14 incident — the safety layer now stops
dead there instead of clicking through, which is correct, but it converts a
data-loss bug into a permanent silent-failure bug.

The pending copy actively causes it. Today it reads:

> "Log in to X in the new tab — we'll pick it up automatically once you're back."

That tells the user login is the whole job and coming back is the finish line.

## Layer 1 — the copy (in this draft, no unknowns)

- **Idle**: set the two-step expectation before they start. "You'll log in *and
  unlock Messages with your chat PIN* … we never see either." ("either" is
  accurate — the PIN never transits a prompt, log, or model.)
- **Pending**: replace the one-liner with an ordered 3-step list, PIN as step 2,
  and one line of *why* it matters. Closing the tab is step 3 because the close
  is the confirmation trigger — the instruction has to land before it.
- **Connected**: unchanged.

## Layer 2 — the gate (needs one observation first)

Copy alone gets skipped. To make "Connected" honest, `/finish` should verify
chat is reachable, not just that a cookie exists.

**Proposed check.** In the existing read-only profile session
(`save_changes=False` — never write from a checker), navigate to `x.com/i/chat`
and read `page.url()`. If it contains `/i/chat/pin`, chat is locked.

This leans on the root cause already settled on 08-14: *X pushes every keyless
session onto `/i/chat/pin/recovery`.* It's a redirect URL, not a DOM selector,
so it doesn't violate the module's "assert on the transport layer" rule the way
a `data-testid` would.

`/finish` then has three outcomes instead of two:

| Profile state | Result |
| --- | --- |
| no `auth_token` | unchanged — connect stays as it was |
| `auth_token`, `/i/chat` redirects to `/pin` | **new** — `chat_locked`, keep the candidate, card shows state 3 |
| `auth_token`, `/i/chat` opens clean | Connected |

**Schema.** Add `users.twitter_chat_unlocked_at` (nullable timestamp) beside
`twitter_connected_at`, exposed on `/auth/me` as `twitter_chat_locked`. Without
a column the state is React-only and dies on refresh, and the self-heal
(`check_login` / `_adopt_candidate`) can't reach it. With it, the sends
dispatcher can also defer an X DM instead of burning a daily cap on a send
guaranteed to hard-stop.

Treat it as a **cache, not a truth** — keys can lapse and X can re-wall later.
The delivery-time hard-stop stays the real backstop.

**Cost.** This adds one page load to the confirm path, which today is
deliberately zero-navigation (no bot-wall surface). Contain it: run the probe
only on `/finish` and `_adopt_candidate`, never on the throttled `/auth/me`
self-heal poll.

## The open question

The gate rests on the redirect being reliable and prompt. We have observed it
exactly once (08-14, one run). Aayush's clean-slate re-auth produces precisely
the keyless-session state needed to confirm it — so the sequencing is:

1. Ship Layer 1 copy (no unknowns, and it makes the retest realistic).
2. Disconnect + re-auth. **Before** entering the PIN, check what `x.com/i/chat`
   does in the fresh profile: does it redirect to `/i/chat/pin/recovery`, how
   fast, and is the URL stable enough to assert on?
3. Build Layer 2 on the confirmed behavior.

If the redirect turns out to be unreliable, the fallback is to keep Layer 1 as
advisory copy and move the signal to delivery time: on the first `flagged`
hard-stop at a `/pin` URL, clear `twitter_chat_unlocked_at` and surface state 3
on the card retroactively. Worse (the user finds out after a failed send rather
than at connect time) but it needs no probe at all.
