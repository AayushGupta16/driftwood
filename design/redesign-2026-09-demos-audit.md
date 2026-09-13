# Demos page: interaction audit, 2026-09-12

Audited `/dashboard/demos` (Staging, Queue, Sent, the day headers, the Later
collapse, the demo card and its disclosure) against every rule in
`ux-principles.md`. Rule numbers below are that file's. One row per finding,
all of them found and fixed on `feat/demos-staging-queue` unless the last
column says otherwise.

The trigger was Aayush finding that Pin had no Unpin. That turned out to be a
class, not an instance: five states on the page could be entered and not left.

## States, and the way out of each

| State | Entered by | Exit |
|---|---|---|
| Pinned demo | Pin | Unpin, on the same button |
| Armed control | first press | second press, Escape, or 5s |
| Change box open | Ask for a change | the same button, or Cancel |
| Change draft | typing | survives closing; cleared when sent |
| Steps shown | Show steps | Hide steps |
| Later expanded | the Later row | the same row |
| Paused queue | Pause all sends | Resume all |
| Clip failed | the clip 404s | Open it in a new tab |
| List errored | a failed fetch | Try again |
| Segment | a segment button | the other two, and the URL |

## Findings

| # | Rule | What was wrong | What changed |
|---|---|---|---|
| 1 | 1 (inverse) | Pin had no Unpin. A pinned demo was a state with no way out. | Pin is a toggle with `aria-pressed`, posting to `reviews/{id}/unpin`. |
| 2 | 1, 8 | Once pinned, the button was disabled and read "Pinned", so the only control that could undo it was dead. | The button stays live and reads Unpin. |
| 3 | 1 | A 404 from the pin route hid the control for every card, including pinned ones, which would have stranded a pinned demo. | The control hides only while nothing is pinned. |
| 4 | 9 | Skip, Approve all and Pause all armed independently, so two could sit armed at once. | One armed state for the page; arming any control disarms the rest. |
| 5 | 9 | An armed control could only be cancelled by waiting 5s. | Escape disarms. |
| 6 | 9 | Two fast clicks walked straight through the two-press guard. | A press inside 400ms of arming is read as a double click and swallowed. |
| 7 | 9 | Unstage ran on one press, though it un-approves work the customer already decided. | Unstage arms then confirms. |
| 8 | 9 | Resume all ran on one press while releasing the whole queue. | Resume all arms then confirms. |
| 9 | 6 | Closing the change box threw away what had been typed. | Drafts are kept per demo and survive closing; cleared on send. |
| 10 | 6 | Skip, Pin, Send, Move to top and Unstage showed no busy state in flight. | Each swaps to a busy label while disabled. |
| 11 | 6, 7 | Try again refetched without returning to the loading render, so a failed list looked identical after the press. | The list goes back to loading and the button reports its own press. |
| 12 | 8 | Controls disabled only while in flight carried no title. | Every disabled state says why. |
| 13 | 1, 14 | The queue's header line rendered a single space while loading: a blank that reads as "nothing to say". | A skeleton of the same height, with `role="status"`. |
| 14 | 12 | "Held" on a row versus "Pause all sends" above it: two words for one state. | Paused everywhere. |
| 15 | 12 | "Nothing scheduled" as the Queue's empty state introduced a third word for queued. | "Nothing queued yet." |
| 16 | 12 | Toasts and titles said "staging" and "the queue" where the tabs are named Staging and Queue. | Segment names are capital wherever copy names the place. |
| 17 | 12 | "Moved to the front of today" against a button reading Move to top. | "Moved to the top of today." |
| 18 | 13 | The armed Approve all printed a raw number. | `toLocaleString`, like every other count on the page. |
| 19 | 15 | The Sent day heading was a styled `td`, so it was announced as a cell rather than as the group it names. | A `th` with `scope="rowgroup"`. |
| 20 | 15 | The Later row announced its state through `aria-expanded` only; on screen it looked the same open or shut. | A caret shows the state. |
| 21 | 13 | "Show more days" did not say how many it would open. | "Show 7 more days", from the real remainder. |
| 22 | 7 | A dead clip left the "Bug visible at 0:08" link pointing at a player that could not seek: a dead click. | The link is dropped when the clip fails. |
| 23 | 2 | Pin, unpin and the queue controls have no route on `origin/main` today. | Not a frontend fix. Each answers 404, the page says "Not available yet." beside the control and re-enables it. Names the backend owes: `reviews/{id}/pin`, `reviews/{id}/unpin`, `sends/{id}/send-next`, `sends/{id}/pull`, `sends/hold-all`, `sends/resume-all`. |

## Second pass: too much text (2026-09-13)

Aayush, third time across the product: "there's way too much text on the
screen". Now rule 19 in `ux-principles.md`.

| # | Rule | What was wrong | What changed |
|---|---|---|---|
| 24 | 19 | "Staging holds up to 30. Anything older than 3 days expires unless you pin it." described our mechanism, and no workspace has the expiry switched on. | Deleted. It comes back, in one line, for a workspace that really carries the flag. |
| 25 | 19 | "Driftwood approves demos. Yours go straight to the queue." | Deleted; the empty state already says nothing is waiting. |
| 26 | 19 | The Queue header carried the whole sending window, which is a setting. | "Runs through Thu Sep 17." |
| 27 | 19 | Day headers did per-channel arithmetic on screen: "Today · 8 of 20 emails · 3 of 25 LinkedIn". | "Today · 8 left", or a Full chip. The split moved to a title. |
| 28 | 19 | Every queue row named a sending account, on forty days of rows. | The cell shows only where a channel has more than one account. |
| 29 | 19 | The channel was spelled out on every row. | A mark, with the word on `aria-label`. |
| 30 | 19 | The card's contact line repeated the name and company already in its heading. | The line carries the job title; the heading carries the profile link. |
| 31 | 19 | "Ready for you" labelled a list of demo cards under a tab named Staging. | Deleted. |
| 32 | 19 | The change box's placeholder repeated its own label. | Deleted. |
| 33 | 19 | Toasts explained our process: "Pinned. It stays in Staging.", "Change sent. The next version comes back here." | "Pinned.", "Change sent." |
| 34 | 19 | "That did not load. Try again." repeated the button under it. | "That did not load." |
| 35 | 19 | Tooltips added in the first pass restated their own buttons. | Titles survive only where a control is disabled, which rule 8 asks for. |
| 36 | 19 | "This demo will not play here." | "Cannot play here." |

Kept, though it was on the list to consider: the demo age ("1d") on each card,
the "Loading the rest." line, and "Ask for a change" at full length. The age is
two characters and answers how long a demo has waited; the loading line changes
whether you wait; and "Change" alone does not say who changes what.
