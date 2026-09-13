import { useCallback, useEffect, useRef, useState, type RefObject } from "react";
import { EmailPreview } from "../EmailPreview";
import { fetchInWaves, useToast } from "../dashboard-shared";
import { analyticsWindow } from "../analytics/model";
import { withMockMode } from "../mock-mode";
import { announceDemosCountChanged } from "./nav-count";
import {
  PAGE_GUARD,
  REVIEW_CHUNK,
  SEND_CHUNK,
  approvalPolicy,
  decide,
  fetchQueuePage,
  fetchReviewsPage,
  fetchRepliedLeads,
  fetchSentPage,
  firstQueuePage,
  firstReviewsPage,
  firstSentPage,
  holdAllSends,
  landingDayFor,
  moveToTop,
  pinDemo,
  queueAction,
  unpinDemo,
  resumeAllSends,
  workspaceSettings,
  EMPTY_SENDERS,
} from "./staging-api";
import {
  EMPTY_QUEUE,
  EMPTY_SENT,
  EMPTY_STAGING,
  NOT_AVAILABLE,
  NO_LIMITS,
  dayChannelTitle,
  dayRemaining,
  emailCollapsed,
  daySentence,
  decisionsFor,
  groupQueueByDay,
  groupSentByDay,
  groupStagedDemos,
  laterSummary,
  plannedClock,
  queueHeadline,
  readyForYou,
  queueRows,
  runsThrough,
  splitQueueDays,
  threadHref,
  timestampLabel,
  videoSeconds,
  type DailyLimits,
  type QueueDay,
  type QueueRow,
  type QueueStat,
  type ReviewItem,
  type SendRow,
  type StagedDemo,
} from "./staging-model";
import "./demos-page.css";

/* /dashboard/demos — the customer's own page for the demos we make them.

   Three segments, and nothing on any of them describes our work. Staging is
   what waits on the customer. Queue is what is going out, in order, with the
   controls to cut it. Sent is what went out and what came back.

   Not here on purpose: "Coming", the list of names asked for through Send
   demos. Demo requests are stored per campaign today
   (GET /dashboard/campaigns/{id}/demo-requests) and no org-wide read exists,
   so listing them would mean walking every campaign. It lands when the
   backend serves one list for the workspace.

   Four writes wait on the backend too: the per-row queue controls and the
   staging pin. Each answers 404 until then, which the page reports beside the
   control that was pressed rather than as a failure. */

const SEGMENTS = [
  ["staging", "Staging"],
  ["queue", "Queue"],
  ["sent", "Sent"],
] as const;

type Segment = (typeof SEGMENTS)[number][0];

type Load<T> =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; data: T };

type StagingData = {
  items: ReviewItem[];
  stats: QueueStat[];
  /* False while later pages are still arriving: a count and a whole-list
     action must never quietly mean "the part that had loaded". */
  complete: boolean;
  loadingMore: boolean;
  totalPending: number;
};

type QueueData = { sends: SendRow[]; complete: boolean; loadingMore: boolean };
type SentData = { sends: SendRow[]; total: number };

/* Every control on the page that arms before it runs. One at a time, so
   arming any of them disarms the rest (ux-principles rule 9). */
type Armed =
  | { kind: "approve-all" }
  | { kind: "pause" }
  | { kind: "resume" }
  | { kind: "skip"; key: string }
  | { kind: "unstage"; key: string };

function sameArmed(a: Armed, b: Armed): boolean {
  if (a.kind !== b.kind) return false;
  return "key" in a && "key" in b ? a.key === b.key : true;
}

/* The clock lives out here: a component body may not read one, because a
   render has to give the same answer twice. */
function armStamp(): number {
  return Date.now();
}

function armedTooRecently(at: number): boolean {
  return armStamp() - at < ARM_GUARD_MS;
}

const ARM_MS = 5000;
/* A press inside this window of arming is a double-click, not a decision.
   Without it, two fast clicks walk straight through a two-press guard. */
const ARM_GUARD_MS = 400;
/* Days that stand open in the queue; everything past them collapses into one
   line, because a customer can have two months of sends queued. */
const OPEN_DAYS = 7;
const LATER_PAGE = 7;
const REPLY_WINDOW_DAYS = 90;
const LOAD_FAILED = "That did not load.";

/* What a queue row puts in the From cell: the sender it actually names. A
   pool placeholder ("picked when it sends") and a workspace's one obvious
   mailbox are not row values, so both leave the cell empty. */
function rowSender(row: QueueRow): string | null {
  return row.send.sending_account ?? null;
}

function segmentFromUrl(): Segment {
  const value = new URLSearchParams(window.location.search).get("seg");
  return value === "queue" || value === "sent" ? value : "staging";
}

/* Pages of a list, first page painted before the rest arrives. */
async function loadPaged<T>(
  first: () => Promise<{ rows: T[]; total: number }>,
  chunk: number,
  page: (offset: number) => Promise<{ rows: T[]; total: number }>,
  idOf: (row: T) => string,
  paint: (rows: T[], total: number, complete: boolean) => void,
  append: (rows: T[], complete: boolean) => void,
) {
  const head = await first();
  const pageCount =
    head.rows.length === 0
      ? 1
      : Math.min(Math.ceil(head.total / chunk), PAGE_GUARD);
  const done = pageCount <= 1 || head.rows.length >= head.total;
  paint(head.rows, head.total, done);
  if (done) return;
  const offsets: number[] = [];
  for (let i = 1; i < pageCount; i += 1) offsets.push(i * chunk);
  const pages = await fetchInWaves(offsets, page);
  const complete = pages.every((value) => value !== null);
  const seen = new Set(head.rows.map(idOf));
  const rest: T[] = [];
  for (const value of pages)
    if (value)
      for (const row of value.rows) {
        const id = idOf(row);
        if (seen.has(id)) continue;
        seen.add(id);
        rest.push(row);
      }
  append(rest, complete);
}

/* Kicks the first reads off at chunk eval, beside /auth/me. The sidebar's
   Demos count shares these promises, so opening the page adds no request. */
void firstReviewsPage();
void firstQueuePage();
void firstSentPage();
void approvalPolicy();
void workspaceSettings();

export default function DemosPage() {
  const toast = useToast();
  const [segment, setSegment] = useState<Segment>(segmentFromUrl);
  const [staging, setStaging] = useState<Load<StagingData>>({ status: "loading" });
  const [queue, setQueue] = useState<Load<QueueData>>({ status: "loading" });
  const [sent, setSent] = useState<Load<SentData>>({ status: "loading" });
  const [autoApproved, setAutoApproved] = useState<boolean | null>(null);
  const [replied, setReplied] = useState<ReadonlySet<string>>(new Set());

  /* Per-card and per-row work in flight, keyed the way the press was. */
  const [busy, setBusy] = useState<ReadonlySet<string>>(new Set());
  const [cardError, setCardError] = useState<{ key: string; message: string } | null>(null);
  /* The open change box, and the drafts behind it. A draft outlives closing
     the box: a mis-press must not throw away what the customer typed. */
  const [changeOpen, setChangeOpen] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [armed, setArmed] = useState<{ at: number; what: Armed } | null>(null);
  const [pinnable, setPinnable] = useState(true);
  const [pinned, setPinned] = useState<ReadonlySet<string>>(new Set());
  const [heldIds, setHeldIds] = useState<ReadonlySet<string>>(new Set());
  const [rowError, setRowError] = useState<{ id: string; message: string } | null>(null);
  const [bulkQueueError, setBulkQueueError] = useState<string | null>(null);
  const [laterOpen, setLaterOpen] = useState(false);
  const [laterShown, setLaterShown] = useState(LATER_PAGE);
  /* The org's own daily sending limits, which is what makes a day "full".
     Null until settings land, and null per channel on a backend that does
     not report one, in which case a day header shows bare counts. */
  const [limits, setLimits] = useState<DailyLimits>(NO_LIMITS);

  const loadStaging = useCallback(async (fresh: boolean) => {
    try {
      let stats: QueueStat[] = [];
      await loadPaged<ReviewItem>(
        async () => {
          const page = await (fresh ? fetchReviewsPage(0) : firstReviewsPage());
          stats = page.queue_stats ?? [];
          return { rows: page.pending, total: page.total_pending };
        },
        REVIEW_CHUNK,
        async (offset) => {
          const page = await fetchReviewsPage(offset);
          return { rows: page.pending, total: page.total_pending };
        },
        (item) => item.id,
        (rows, total, complete) =>
          setStaging({
            status: "ready",
            data: { items: rows, stats, complete, loadingMore: !complete, totalPending: total },
          }),
        (rows, complete) =>
          setStaging((prev) =>
            prev.status === "ready"
              ? {
                  status: "ready",
                  data: {
                    ...prev.data,
                    items: [...prev.data.items, ...rows],
                    complete,
                    loadingMore: false,
                  },
                }
              : prev,
          ),
      );
    } catch {
      setStaging((prev) =>
        prev.status === "ready" ? prev : { status: "error", message: LOAD_FAILED },
      );
    }
  }, []);

  const loadQueue = useCallback(async (fresh: boolean) => {
    try {
      await loadPaged<SendRow>(
        async () => {
          const page = await (fresh ? fetchQueuePage(0) : firstQueuePage());
          return { rows: page.sends, total: page.total };
        },
        SEND_CHUNK,
        async (offset) => {
          const page = await fetchQueuePage(offset);
          return { rows: page.sends, total: page.total };
        },
        (send) => send.id,
        (rows, _total, complete) =>
          setQueue({ status: "ready", data: { sends: rows, complete, loadingMore: !complete } }),
        (rows, complete) =>
          setQueue((prev) =>
            prev.status === "ready"
              ? {
                  status: "ready",
                  data: { sends: [...prev.data.sends, ...rows], complete, loadingMore: false },
                }
              : prev,
          ),
      );
    } catch {
      setQueue((prev) =>
        prev.status === "ready" ? prev : { status: "error", message: LOAD_FAILED },
      );
    }
  }, []);

  const loadSent = useCallback(async (fresh: boolean) => {
    try {
      const page = await (fresh ? fetchSentPage() : firstSentPage());
      setSent({ status: "ready", data: { sends: page.sends, total: page.total } });
    } catch {
      setSent({ status: "error", message: LOAD_FAILED });
    }
  }, []);

  useEffect(() => {
    void (async () => {
      await Promise.all([loadStaging(false), loadQueue(false), loadSent(false)]);
    })();
  }, [loadStaging, loadQueue, loadSent]);

  useEffect(() => {
    let live = true;
    approvalPolicy().then(
      (policy) => {
        if (live) setAutoApproved(policy.mode === "auto");
      },
      () => {
        /* The mode is unknown, so the page shows the cards it was given. */
        if (live) setAutoApproved(false);
      },
    );
    workspaceSettings().then(
      (page) => {
        if (!live) return;
        setLimits({
          email: page.daily_caps?.email ?? null,
          message: page.daily_caps?.message ?? null,
        });
      },
      () => {},
    );
    fetchRepliedLeads(analyticsWindow(REPLY_WINDOW_DAYS)).then(
      (ids) => {
        if (live) setReplied(ids);
      },
      () => {},
    );
    return () => {
      live = false;
    };
  }, []);

  /* An armed button disarms itself after a beat, so no stale confirm waits to
     be fat-fingered minutes later, and Escape disarms it on purpose: waiting
     out a timer is not an exit anyone should have to take. */
  useEffect(() => {
    if (!armed) return;
    const timer = window.setTimeout(() => setArmed(null), ARM_MS);
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setArmed(null);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("keydown", onKey);
    };
  }, [armed]);

  function switchSegment(next: Segment) {
    setSegment(next);
    const params = new URLSearchParams(window.location.search);
    if (next === "staging") params.delete("seg");
    else params.set("seg", next);
    const query = params.toString();
    window.history.replaceState(
      null,
      "",
      window.location.pathname + (query ? `?${query}` : "") + window.location.hash,
    );
  }

  function isArmed(what: Armed): boolean {
    return armed !== null && sameArmed(armed.what, what);
  }

  /* First press arms, second runs. Arming anything disarms whatever else was
     armed, and a press inside the guard window is swallowed as a double
     click. */
  function armOrRun(what: Armed, run: () => void) {
    const current = armed;
    if (!current || !sameArmed(current.what, what)) {
      setArmed({ at: armStamp(), what });
      return;
    }
    if (armedTooRecently(current.at)) return;
    setArmed(null);
    run();
  }

  function markBusy(key: string, on: boolean) {
    setBusy((prev) => {
      const next = new Set(prev);
      if (on) next.add(key);
      else next.delete(key);
      return next;
    });
  }

  /* Cards are built from every pending item of a demo, then narrowed to the
     demos that are actually waiting on this viewer. The bug_validation item
     always belongs to Driftwood, so a demo with no customer-decidable item is
     still in our own gate and never reaches their page. */
  const stagedDemos: StagedDemo[] =
    staging.status === "ready" ? readyForYou(groupStagedDemos(staging.data.items)) : [];

  const rows =
    /* The account pools are no longer read here: the From cell comes from the
       row, so the page does not ask the accounts endpoint at all. */
    queue.status === "ready" ? queueRows(queue.data.sends, heldIds, EMPTY_SENDERS) : [];
  const allHeld = rows.length > 0 && rows.every((row) => row.held);
  const queueDays = groupQueueByDay(rows, limits);
  const { shown: openDays, later: laterDays } = splitQueueDays(queueDays, OPEN_DAYS);
  /* The row that already sends first. Moving it to the top does nothing, so
     its control says so instead of pretending (ux-principles rule 8). */
  const firstQueuedId = queueDays[0]?.rows[0]?.send.id ?? null;
  /* The days actually on screen: the open ones, plus the later ones only
     while they are expanded and paged in. */
  const visibleDays = laterOpen
    ? [...openDays, ...laterDays.slice(0, laterShown)]
    : openDays;
  /* The From column exists only if a row in view would fill it. Read from the
     rows, not from the account list: a workspace with three mailboxes whose
     rows name none of them still has nothing to put in the column, and a
     header over empty cells is worse than no column. */
  const showAccount = visibleDays.some((day) => day.rows.some((row) => rowSender(row) !== null));
  const sentDays = sent.status === "ready" ? groupSentByDay(sent.data.sends) : [];

  /* One decide POST per press: every pending item of the demo, together. */
  async function submitDecision(
    demo: StagedDemo,
    decision: "approve" | "deny",
    reason: string | undefined,
    done: string,
  ) {
    markBusy(demo.key, true);
    setCardError(null);
    try {
      await decide(decisionsFor(demo, decision, reason), demo.policyVersion);
      setStaging((prev) =>
        prev.status === "ready"
          ? {
              status: "ready",
              data: {
                ...prev.data,
                items: prev.data.items.filter((item) => !demo.itemIds.includes(item.id)),
              },
            }
          : prev,
      );
      setChangeOpen((prev) => (prev === demo.key ? null : prev));
      setDrafts((prev) => {
        if (!(demo.key in prev)) return prev;
        const next = { ...prev };
        delete next[demo.key];
        return next;
      });
      setArmed((prev) =>
        prev && "key" in prev.what && prev.what.key === demo.key ? null : prev,
      );
      announceDemosCountChanged();
      if (decision !== "approve") {
        toast(done, "success");
      } else {
        /* An approved demo joins the END of the queue, so the customer is
           told which day that is rather than left to go and count. */
        const leadId = demo.lead?.lead_id ?? null;
        void (async () => {
          const day = leadId ? await landingDayFor(leadId).catch(() => null) : null;
          toast(day ? `Queued for ${daySentence(day)}.` : done, "success");
        })();
        void loadQueue(true);
      }
    } catch (error) {
      setCardError({
        key: demo.key,
        message: error instanceof Error ? error.message : LOAD_FAILED,
      });
    } finally {
      markBusy(demo.key, false);
    }
  }

  async function runApproveAll() {
    const decidable = stagedDemos;
    if (decidable.length === 0) return;
    markBusy("all", true);
    setCardError(null);
    try {
      const decisions = decidable.flatMap((demo) => decisionsFor(demo, "approve"));
      await decide(decisions, decidable[0].policyVersion);
      const ids = new Set(decidable.flatMap((demo) => demo.itemIds));
      setStaging((prev) =>
        prev.status === "ready"
          ? {
              status: "ready",
              data: { ...prev.data, items: prev.data.items.filter((item) => !ids.has(item.id)) },
            }
          : prev,
      );
      toast(
        `${decidable.length} ${decidable.length === 1 ? "demo" : "demos"} approved.`,
        "success",
      );
      announceDemosCountChanged();
      void loadQueue(true);
    } catch (error) {
      setCardError({
        key: "all",
        message: error instanceof Error ? error.message : LOAD_FAILED,
      });
    } finally {
      markBusy("all", false);
    }
  }

  /* Pin and its inverse. Pinning keeps a demo past the 3-day expiry, and
     unpinning lets it expire again: a state the customer can enter and not
     leave is the bug this pair exists to close. */
  async function togglePin(demo: StagedDemo) {
    const isPinned = pinned.has(demo.key);
    markBusy(demo.key, true);
    setCardError(null);
    const result = isPinned ? await unpinDemo(demo.pinId) : await pinDemo(demo.pinId);
    markBusy(demo.key, false);
    if (result.ok) {
      setPinned((prev) => {
        const next = new Set(prev);
        if (isPinned) next.delete(demo.key);
        else next.add(demo.key);
        return next;
      });
      toast(isPinned ? "Unpinned." : "Pinned.", "success");
      return;
    }
    /* Nothing serves pinning yet. Hide the control rather than offer a dead
       one, but never while a demo is pinned: that would strip the only way
       back out of the state. */
    if (result.missing && !isPinned) setPinnable(false);
    else setCardError({ key: demo.key, message: result.missing ? NOT_AVAILABLE : result.message });
  }

  /* Move to top puts the demo in the first slot of today. Today is bounded by
     the day's sending limit, so the last row of today moves to tomorrow, and
     the backend cascades that forward when tomorrow is full too. The toast
     names what moved, because a send that changed day without being mentioned
     is a change made behind the customer's back. */
  async function moveRowToTop(send: SendRow) {
    markBusy(send.id, true);
    setRowError(null);
    const result = await moveToTop(send.id);
    markBusy(send.id, false);
    if (!result.ok) {
      setRowError({ id: send.id, message: result.missing ? NOT_AVAILABLE : result.message });
      return;
    }
    const moved = result.result?.displaced?.[0];
    const who = moved?.company || moved?.name;
    toast(
      who && moved?.projected_date
        ? `${who} moved to ${daySentence(moved.projected_date)} to make room.`
        : "Moved to the top of today.",
      "success",
    );
    void loadQueue(true);
  }

  /* Unstage takes the demo out of the queue and back to Staging as a card,
     un-approved, which is the only way back once something is approved. It
     un-approves work the customer already decided, so it arms first. */
  async function unstageRow(send: SendRow) {
    markBusy(send.id, true);
    setRowError(null);
    const result = await queueAction(send.id, "unstage");
    markBusy(send.id, false);
    if (!result.ok) {
      setRowError({ id: send.id, message: result.missing ? NOT_AVAILABLE : result.message });
      return;
    }
    setQueue((prev) =>
      prev.status === "ready"
        ? {
            status: "ready",
            data: { ...prev.data, sends: prev.data.sends.filter((row) => row.id !== send.id) },
          }
        : prev,
    );
    toast("Back in Staging.", "success");
    announceDemosCountChanged();
    void loadStaging(true);
  }

  async function runPauseOrResumeAll() {
    markBusy("sends", true);
    setBulkQueueError(null);
    const result = allHeld ? await resumeAllSends() : await holdAllSends();
    markBusy("sends", false);
    if (!result.ok) {
      setBulkQueueError(result.missing ? NOT_AVAILABLE : result.message);
      return;
    }
    setHeldIds(allHeld ? new Set() : new Set(rows.map((row) => row.send.id)));
    toast(allHeld ? "Sends resumed." : "Sends paused.", "success");
  }

  const stagingCount = staging.status === "ready" && staging.data.complete ? stagedDemos.length : null;
  const queueCount = queue.status === "ready" && queue.data.complete ? rows.length : null;
  /* The count is what the segment lists, not what the ledger holds: the
     ledger also carries connection requests, which are not demos and are not
     on this page, so `total` would name rows the reader cannot find. */
  const sentCount = sent.status === "ready" ? sentDays.reduce((n, day) => n + day.rows.length, 0) : null;
  const counts: Record<Segment, number | null> = {
    /* Nothing waits on a customer whose demos Driftwood approves, so the
       segment carries no number rather than a zero that reads as "empty". */
    staging: autoApproved === true ? null : stagingCount,
    queue: queueCount,
    sent: sentCount,
  };

  return (
    <section className="demos-page" aria-labelledby="demos-heading">
      <div className="dp-head">
        <h1 id="demos-heading">Demos</h1>
      </div>

      <div className="dp-segments">
        {SEGMENTS.map(([id, label]) => (
          <button
            key={id}
            type="button"
            aria-pressed={segment === id}
            onClick={() => switchSegment(id)}
          >
            {label}
            {counts[id] !== null && (
              <span className="dp-count">{counts[id]!.toLocaleString()}</span>
            )}
          </button>
        ))}
      </div>

      {segment === "staging" && (
        <>
          {autoApproved === true ? (
            /* Driftwood approves here, so nothing waits on this customer. The
               empty state says that in four words; a paragraph about who
               approves said it in eleven and changed nothing. */
            <div className="dp-empty">
              <p>{EMPTY_STAGING}</p>
              <button type="button" className="dp-btn" onClick={() => switchSegment("queue")}>
                See Queue
              </button>
            </div>
          ) : (
            <>
              <div className="dp-bar is-bare">
                <div>
                  {staging.status === "ready" && !staging.data.complete && (
                    <p className="dp-quiet" role="status">
                      Loading the rest.
                    </p>
                  )}
                </div>
                {stagedDemos.length > 1 && (
                  <div className="dp-bar-actions">
                    <button
                      type="button"
                      className={`dp-btn ${isArmed({ kind: "approve-all" }) ? "is-armed" : "is-primary"}`}
                      onClick={() =>
                        armOrRun({ kind: "approve-all" }, () => void runApproveAll())
                      }
                      disabled={
                        busy.has("all") ||
                        staging.status !== "ready" ||
                        !staging.data.complete
                      }
                      title={
                        busy.has("all")
                          ? "Approving these demos now"
                          : staging.status === "ready" && !staging.data.complete
                            ? "Available once the whole list loads"
                            : undefined
                      }
                    >
                      {busy.has("all")
                        ? "Approving"
                        : isArmed({ kind: "approve-all" })
                          ? `Approve all ${stagedDemos.length.toLocaleString()}? Confirm`
                          : "Approve all"}
                    </button>
                  </div>
                )}
              </div>
              {cardError?.key === "all" && (
                <p className="dp-error" role="alert">
                  {cardError.message}
                </p>
              )}
              {staging.status === "loading" ? (
                <CardSkeletons />
              ) : staging.status === "error" ? (
                <ErrorState
                  message={staging.message}
                  onRetry={() => {
                    setStaging({ status: "loading" });
                    void loadStaging(true);
                  }}
                />
              ) : stagedDemos.length === 0 ? (
                <div className="dp-empty">
                  <p>{EMPTY_STAGING}</p>
                  <button type="button" className="dp-btn" onClick={() => switchSegment("queue")}>
                    See Queue
                  </button>
                </div>
              ) : (
                <div className="dp-cards">
                  {stagedDemos.map((demo) => (
                    <DemoCard
                      key={demo.key}
                      demo={demo}
                      busy={busy.has(demo.key)}
                      pinnable={pinnable || pinned.has(demo.key)}
                      pinned={pinned.has(demo.key)}
                      armedSkip={isArmed({ kind: "skip", key: demo.key })}
                      change={changeOpen === demo.key ? (drafts[demo.key] ?? "") : null}
                      error={cardError?.key === demo.key ? cardError.message : null}
                      onApprove={() => void submitDecision(demo, "approve", undefined, "Approved.")}
                      onSkip={() =>
                        armOrRun({ kind: "skip", key: demo.key }, () =>
                          void submitDecision(demo, "deny", "Skipped in Staging", "Skipped."),
                        )
                      }
                      onOpenChange={() =>
                        setChangeOpen((prev) => (prev === demo.key ? null : demo.key))
                      }
                      onChangeText={(text) =>
                        setDrafts((prev) => ({ ...prev, [demo.key]: text }))
                      }
                      onSendChange={() => {
                        const text = (drafts[demo.key] ?? "").trim();
                        if (!text) return;
                        void submitDecision(demo, "deny", text, "Change sent.");
                      }}
                      onPin={() => void togglePin(demo)}
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </>
      )}

      {segment === "queue" && (
        <>
          <div className="dp-bar">
            {queue.status === "ready" ? (
              <p className="dp-note is-flush">
                {queueHeadline(runsThrough(staging.status === "ready" ? staging.data.stats : []))}
              </p>
            ) : (
              /* A line of nothing reads as "there is nothing to say"; this
                 reads as "it is coming", and holds the same height. */
              <p className="dp-note is-flush" role="status" aria-label="Loading the queue">
                <span className="dp-skel dp-skel-headline dp-skel-pulse" />
              </p>
            )}
            {rows.length > 0 && (
              <div className="dp-bar-actions">
                <button
                  type="button"
                  className={`dp-btn ${
                    isArmed({ kind: allHeld ? "resume" : "pause" }) ? "is-armed" : ""
                  }`}
                  onClick={() =>
                    armOrRun({ kind: allHeld ? "resume" : "pause" }, () =>
                      void runPauseOrResumeAll(),
                    )
                  }
                  disabled={busy.has("sends")}
                  title={busy.has("sends") ? "Working on your sends now" : undefined}
                >
                  {busy.has("sends")
                    ? "Working"
                    : allHeld
                      ? isArmed({ kind: "resume" })
                        ? "Resume all sends? Confirm"
                        : "Resume all"
                      : isArmed({ kind: "pause" })
                        ? "Pause all sends? Confirm"
                        : "Pause all sends"}
                </button>
              </div>
            )}
          </div>
          {bulkQueueError && (
            <p className="dp-error" role="alert">
              {bulkQueueError}
            </p>
          )}
          {queue.status === "loading" ? (
            <RowSkeletons />
          ) : queue.status === "error" ? (
            <ErrorState
              message={queue.message}
              onRetry={() => {
                setQueue({ status: "loading" });
                void loadQueue(true);
              }}
            />
          ) : rows.length === 0 ? (
            <div className="dp-empty">
              <p>{EMPTY_QUEUE}</p>
              <button type="button" className="dp-btn" onClick={() => switchSegment("staging")}>
                See Staging
              </button>
            </div>
          ) : (
            <>
              {openDays.map((day) => (
                <QueueDayBlock
                  key={day.day}
                  day={day}
                  busy={busy}
                  rowError={rowError}
                  armedUnstage={(id) => isArmed({ kind: "unstage", key: id })}
                  showAccount={showAccount}
                  firstInQueue={firstQueuedId}
                  onMoveToTop={(send) => void moveRowToTop(send)}
                  onUnstage={(send) =>
                    armOrRun({ kind: "unstage", key: send.id }, () => void unstageRow(send))
                  }
                />
              ))}
              {laterDays.length > 0 && (
                <div className="dp-later">
                  <button
                    type="button"
                    className="dp-later-toggle"
                    aria-expanded={laterOpen}
                    onClick={() => setLaterOpen((open) => !open)}
                  >
                    <span className="dp-caret" aria-hidden="true">
                      {laterOpen ? "\u2013" : "+"}
                    </span>
                    {laterSummary(laterDays)}
                  </button>
                  {laterOpen && (
                    <>
                      {laterDays.slice(0, laterShown).map((day) => (
                        <QueueDayBlock
                          key={day.day}
                          day={day}
                          busy={busy}
                          rowError={rowError}
                          armedUnstage={(id) => isArmed({ kind: "unstage", key: id })}
                          showAccount={showAccount}
                          firstInQueue={firstQueuedId}
                  onMoveToTop={(send) => void moveRowToTop(send)}
                          onUnstage={(send) =>
                            armOrRun({ kind: "unstage", key: send.id }, () => void unstageRow(send))
                          }
                        />
                      ))}
                      {laterShown < laterDays.length && (
                        <button
                          type="button"
                          className="dp-btn"
                          onClick={() => setLaterShown((shown) => shown + LATER_PAGE)}
                        >
                          Show {Math.min(LATER_PAGE, laterDays.length - laterShown).toLocaleString()} more
                          days
                        </button>
                      )}
                    </>
                  )}
                </div>
              )}
              {queue.status === "ready" && !queue.data.complete && (
                <p className="dp-quiet" role="status">
                  Loading the rest.
                </p>
              )}
            </>
          )}
        </>
      )}
      {segment === "sent" && (
        <>
          {sent.status === "loading" ? (
            <RowSkeletons />
          ) : sent.status === "error" ? (
            <ErrorState
              message={sent.message}
              onRetry={() => {
                setSent({ status: "loading" });
                void loadSent(true);
              }}
            />
          ) : sentDays.length === 0 ? (
            <div className="dp-empty">
              <p>{EMPTY_SENT}</p>
              <button type="button" className="dp-btn" onClick={() => switchSegment("queue")}>
                See Queue
              </button>
            </div>
          ) : (
            <div className="dp-tablewrap dp-rows">
              <table className="dp-table">
                <thead>
                  <tr>
                    <th scope="col">Contact</th>
                    <th scope="col">Company</th>
                    <th scope="col">Channel</th>
                    <th scope="col">
                      <span className="sr-only">Reply</span>
                    </th>
                    <th scope="col">
                      <span className="sr-only">Thread</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {sentDays.map((day) => (
                    <SentDayRows key={day.day} label={day.label} rows={day.rows} replied={replied} />
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <p className="dp-quiet">
            <a href={withMockMode("/dashboard/demos/library")}>All demo videos</a>
          </p>
        </>
      )}
    </section>
  );
}

/* ---------- one demo ---------- */

function DemoCard({
  demo,
  busy,
  pinnable,
  pinned,
  armedSkip,
  change,
  error,
  onApprove,
  onSkip,
  onOpenChange,
  onChangeText,
  onSendChange,
  onPin,
}: {
  demo: StagedDemo;
  busy: boolean;
  pinnable: boolean;
  pinned: boolean;
  armedSkip: boolean;
  change: string | null;
  error: string | null;
  onApprove: () => void;
  onSkip: () => void;
  onOpenChange: () => void;
  onChangeText: (text: string) => void;
  onSendChange: () => void;
  onPin: () => void;
}) {
  const lead = demo.lead;
  const videoRef = useRef<HTMLVideoElement>(null);
  /* A clip that will not play has no moment to jump to, so the timestamp
     link goes with it rather than becoming a dead click. */
  const [videoFailed, setVideoFailed] = useState(false);

  /* The timestamp link drives the clip on this card: jump there, play, and
     bring the player into view, since it sits under the email. */
  function seekVideo(seconds: number) {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = seconds;
    video.scrollIntoView({ block: "center", behavior: "smooth" });
    void video.play().catch(() => {
      /* Autoplay can be refused; the frame is already at the right moment. */
    });
  }

  return (
    <article className="dp-card" aria-label={demo.heading}>
      <div className="dp-card-top">
        <h3>
          {lead?.linkedin_url ? (
            <a href={lead.linkedin_url} target="_blank" rel="noopener noreferrer">
              {demo.heading}
            </a>
          ) : (
            demo.heading
          )}
        </h3>
        <span className="dp-age">{ageLabel(demo.createdAt)}</span>
      </div>
      {/* The heading already carries the name and the company. The line under
          it used to repeat both to add a job title, so it carries the title
          alone now, and the profile link rides on the heading. */}
      {lead?.title && <p className="dp-lead">{lead.title}</p>}

      {/* The clip leads. It is what the demo IS, and it used to sit under a
          full email, three screens down. Then the bug in one line, then the
          email collapsed to the part that differs per demo. */}
      {demo.videoSlug && (
        <DemoVideo
          ref={videoRef}
          slug={demo.videoSlug}
          label={demo.heading}
          onFailed={() => setVideoFailed(true)}
        />
      )}
      {demo.claim && <p className="dp-claim">{demo.claim}</p>}
      <BugLine demo={demo} playable={Boolean(demo.videoSlug) && !videoFailed} onSeek={seekVideo} />
      {demo.body && <EmailBlock subject={demo.subject} body={demo.body} />}

      {demo.canDecide && (
        <>
          <div className="dp-actions">
            <button
              type="button"
              className="dp-btn is-primary"
              onClick={onApprove}
              disabled={busy}
              title={busy ? "Working on this demo now" : undefined}
            >
              {busy ? "Working" : "Approve"}
            </button>
            <button
              type="button"
              className={`dp-btn ${change !== null ? "is-on" : ""}`}
              onClick={onOpenChange}
              aria-expanded={change !== null}
              disabled={busy}
              title={busy ? "Working on this demo now" : undefined}
            >
              Ask for a change
            </button>
            <button
              type="button"
              className={`dp-btn ${armedSkip ? "is-armed" : ""}`}
              onClick={onSkip}
              disabled={busy}
              title={busy ? "Working on this demo now" : undefined}
            >
              {busy ? "Working" : armedSkip ? "Skip? Confirm" : "Skip"}
            </button>
            {pinnable && (
              <button
                type="button"
                className={`dp-btn ${pinned ? "is-on" : ""}`}
                onClick={onPin}
                aria-pressed={pinned}
                disabled={busy}
                title={busy ? "Working on this demo now" : undefined}
              >
                {busy ? "Working" : pinned ? "Unpin" : "Pin"}
              </button>
            )}
          </div>
          {change !== null && (
            <div className="dp-change">
              <label className="dp-label" htmlFor={`change-${demo.key}`}>
                What should change?
              </label>
              <textarea
                id={`change-${demo.key}`}
                value={change}
                onChange={(event) => onChangeText(event.target.value)}
              />
              <div className="dp-change-row">
                <button
                  type="button"
                  className="dp-btn is-primary"
                  onClick={onSendChange}
                  disabled={busy || change.trim().length === 0}
                  title={
                    busy
                      ? "Sending your note now"
                      : change.trim().length === 0
                        ? "Say what should change first"
                        : undefined
                  }
                >
                  {busy ? "Sending" : "Send"}
                </button>
                <button
                  type="button"
                  className="dp-btn"
                  onClick={onOpenChange}
                  disabled={busy}
                  title={busy ? "Sending your note now" : undefined}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </>
      )}
      {error && (
        <p className="dp-error" role="alert">
          {error}
        </p>
      )}
    </article>
  );
}

/* The email, collapsed to its subject, its greeting and the personal line.
   The rest is the same template on every demo, so it waits behind a press.
   Twenty of these a day is the job; a full email each was four screens. */
function EmailBlock({ subject, body }: { subject: string | null; body: string }) {
  const [open, setOpen] = useState(false);
  const { first, personal } = emailCollapsed(body);
  return (
    <div className="dp-email">
      {open ? (
        <EmailPreview subject={subject} body={body} />
      ) : (
        <div className="dp-email-shut">
          {subject && (
            <p className="dp-email-subject">
              <span>Subject</span>
              <strong>{subject}</strong>
            </p>
          )}
          <div className="dp-email-peek">
            {first && <p>{first}</p>}
            {personal && <p className="dp-email-personal">{personal}</p>}
          </div>
        </div>
      )}
      <button
        type="button"
        className="dp-seek is-quiet"
        aria-expanded={open}
        onClick={() => setOpen((was) => !was)}
      >
        {open ? "Hide email" : "Show email"}
      </button>
    </div>
  );
}

/* One line for where the bug shows, and the steps behind a disclosure. The
   device is gone from the card: it does not help anyone decide whether to
   send this demo, and it cost a whole row above the clip. */
function BugLine({
  demo,
  playable,
  onSeek,
}: {
  demo: StagedDemo;
  playable: boolean;
  onSeek: (seconds: number) => void;
}) {
  const [stepsOpen, setStepsOpen] = useState(false);
  const evidence = demo.evidence;
  const steps = Array.isArray(evidence?.repro_steps) ? evidence.repro_steps : [];
  const seconds = videoSeconds(evidence?.video_timestamp);
  const href = evidence?.url
    ? /^https?:\/\//i.test(evidence.url)
      ? evidence.url
      : `https://${evidence.url}`
    : null;
  const hasSteps = steps.length > 0 || Boolean(href);
  const canSeek = seconds !== null && playable;
  if (!canSeek && !hasSteps) return null;
  return (
    <div className="dp-bugline">
      <p>
        {canSeek && (
          <button type="button" className="dp-seek" onClick={() => onSeek(seconds)}>
            Bug visible at {timestampLabel(seconds)}
          </button>
        )}
        {hasSteps && (
          <button
            type="button"
            className="dp-seek is-quiet"
            aria-expanded={stepsOpen}
            onClick={() => setStepsOpen((open) => !open)}
          >
            {stepsOpen ? "Hide steps" : "Show steps"}
          </button>
        )}
      </p>
      {stepsOpen && hasSteps && (
        <div className="dp-steps">
          {steps.length > 0 && (
            <ol>
              {steps.map((step, index) => (
                <li key={index}>{step}</li>
              ))}
            </ol>
          )}
          {href && (
            <p>
              <a href={href} target="_blank" rel="noopener noreferrer">
                {evidence?.url}
              </a>
            </p>
          )}
        </div>
      )}
    </div>
  );
}

/* The clip: a real thumbnail with its length in the corner, which is the
   first frame the file itself reports. A clip that genuinely will not render
   keeps the same frame, a play mark and a way out to a tab, rather than
   turning the card's biggest element into an error message. */
function DemoVideo({
  ref,
  slug,
  label,
  onFailed,
}: {
  ref: RefObject<HTMLVideoElement | null>;
  slug: string;
  label: string;
  onFailed: () => void;
}) {
  const [duration, setDuration] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  const href = `/d/${slug}`;
  return (
    <div className="dp-video-shell">
      {failed ? (
        <a
          className="dp-video dp-video-dead"
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Open the demo for ${label} in a new tab`}
        >
          <span className="dp-play" aria-hidden="true" />
          <span className="dp-video-out">Opens in a new tab</span>
        </a>
      ) : (
        <video
          ref={ref}
          className="dp-video"
          controls
          playsInline
          preload="metadata"
          src={href}
          aria-label={`Demo for ${label}`}
          onError={() => {
            setFailed(true);
            onFailed();
          }}
          onLoadedMetadata={() => {
            const seconds = ref.current?.duration;
            if (typeof seconds === "number" && Number.isFinite(seconds) && seconds > 0)
              setDuration(timestampLabel(seconds));
          }}
        />
      )}
      {duration && <span className="dp-duration">{duration}</span>}
    </div>
  );
}

/* ---------- one day of the queue ---------- */

function QueueDayBlock({
  day,
  busy,
  rowError,
  armedUnstage,
  showAccount,
  firstInQueue,
  onMoveToTop,
  onUnstage,
}: {
  day: QueueDay;
  busy: ReadonlySet<string>;
  rowError: { id: string; message: string } | null;
  armedUnstage: (sendId: string) => boolean;
  showAccount: boolean;
  firstInQueue: string | null;
  onMoveToTop: (send: SendRow) => void;
  onUnstage: (send: SendRow) => void;
}) {
  const left = dayRemaining(day);
  return (
    <section className="dp-day" aria-label={day.label}>
      <div className="dp-day-head">
        <h3>{day.label}</h3>
        {day.full ? (
          <span className="dp-chip" title={dayChannelTitle(day)}>
            Full
          </span>
        ) : (
          left !== null && (
            <span className="dp-day-load" title={dayChannelTitle(day)}>
              {left.toLocaleString()} left
            </span>
          )
        )}
      </div>
      <div className="dp-tablewrap">
        <table className="dp-table">
          <thead>
            <tr>
              <th scope="col">Who</th>
              <th scope="col">
                <span className="sr-only">Channel</span>
              </th>
              <th scope="col">Planned</th>
              {showAccount && <th scope="col">From</th>}
              <th scope="col">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {day.rows.map((row) => (
              <tr key={row.send.id}>
                <td>
                  {row.send.lead?.name ?? "Not named yet"}
                  {row.send.lead?.company && (
                    <span className="dp-muted">, {row.send.lead.company}</span>
                  )}
                </td>
                <td>
                  <ChannelGlyph channel={row.channel} />
                </td>
                <td className="dp-num">
                  {row.held ? (
                    <span className="dp-chip">Paused</span>
                  ) : (
                    plannedClock(row.send, row.held)
                  )}
                </td>
                {showAccount && <td className="dp-muted">{rowSender(row) ?? ""}</td>}
                <td>
                  <div className="dp-rowacts">
                    <button
                      type="button"
                      className="dp-btn is-small"
                      disabled={busy.has(row.send.id) || row.send.id === firstInQueue}
                      onClick={() => onMoveToTop(row.send)}
                      title={
                        busy.has(row.send.id)
                          ? "Moving this demo now"
                          : row.send.id === firstInQueue
                            ? "This one already sends first"
                            : undefined
                      }
                    >
                      {busy.has(row.send.id) ? "Working" : "Move to top"}
                    </button>
                    <button
                      type="button"
                      className={`dp-btn is-small ${armedUnstage(row.send.id) ? "is-armed" : ""}`}
                      disabled={busy.has(row.send.id)}
                      onClick={() => onUnstage(row.send)}
                      title={busy.has(row.send.id) ? "Taking this demo out now" : undefined}
                    >
                      {busy.has(row.send.id)
                        ? "Working"
                        : armedUnstage(row.send.id)
                          ? "Unstage? Confirm"
                          : "Unstage"}
                    </button>
                  </div>
                  {rowError?.id === row.send.id && (
                    <p className="dp-rowerr" role="alert">
                      {rowError.message}
                    </p>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

/* The channel, as a mark rather than a word: the column repeats itself down
   forty days, and "Email" written out nine hundred times is not information.
   The label rides on aria-label, so a reader still hears it. */
function ChannelGlyph({ channel }: { channel: string }) {
  const email = channel === "Email";
  return (
    <span className="dp-glyph" role="img" aria-label={channel}>
      {email ? (
        <svg viewBox="0 0 16 16" width="15" height="15" fill="none" aria-hidden="true">
          <rect x="1.5" y="3.5" width="13" height="9" rx="1.6" stroke="currentColor" strokeWidth="1.3" />
          <path d="M2.5 5 8 8.8 13.5 5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
        </svg>
      ) : (
        <svg viewBox="0 0 16 16" width="15" height="15" aria-hidden="true">
          <rect x="1.2" y="1.2" width="13.6" height="13.6" rx="2.6" fill="currentColor" opacity=".14" />
          <path
            d="M4.6 6.4v5m0-7.1v.02M7.4 11.4v-5m0 1.6c.5-1 1.4-1.6 2.4-1.6 1.2 0 1.9.8 1.9 2.2v2.8"
            stroke="currentColor"
            strokeWidth="1.35"
            strokeLinecap="round"
            fill="none"
          />
        </svg>
      )}
    </span>
  );
}

/* ---------- Sent ---------- */

function SentDayRows({
  label,
  rows,
  replied,
}: {
  label: string;
  rows: SendRow[];
  replied: ReadonlySet<string>;
}) {
  return (
    <>
      <tr>
        <th className="dp-dayhead" colSpan={5} scope="rowgroup">
          {label}
        </th>
      </tr>
      {rows.map((send) => {
        const href = threadHref(send);
        const answered = Boolean(send.lead && replied.has(send.lead.lead_id));
        return (
          <tr key={send.id}>
            <td>{send.lead?.name ?? "Not named yet"}</td>
            <td className="dp-muted">{send.lead?.company ?? ""}</td>
            <td className="dp-muted">{send.kind === "email" ? "Email" : "LinkedIn"}</td>
            <td>{answered && <span className="dp-badge">Replied</span>}</td>
            <td>{href && <a href={withMockMode(href)}>See the thread</a>}</td>
          </tr>
        );
      })}
    </>
  );
}

/* ---------- loading, error ---------- */

function CardSkeletons() {
  return (
    <div className="dp-cards" role="status" aria-label="Loading demos">
      {[0, 1].map((index) => (
        <div key={index} className="dp-skel-card dp-skel-pulse">
          <div className="dp-skel dp-skel-title" />
          <div className="dp-skel dp-skel-sub" />
          <div className="dp-skel dp-skel-email" />
          <div className="dp-skel dp-skel-video" />
          <div className="dp-skel dp-skel-pill" />
        </div>
      ))}
    </div>
  );
}

function RowSkeletons() {
  return (
    <div className="dp-tablewrap dp-rows dp-skel-pulse" role="status" aria-label="Loading rows">
      {Array.from({ length: 6 }, (_, index) => (
        <div key={index} className="dp-skel-row">
          <div className="dp-skel dp-skel-cell is-wide" />
          <div className="dp-skel dp-skel-cell" />
          <div className="dp-skel dp-skel-cell is-narrow" />
          <div className="dp-skel dp-skel-cell" />
        </div>
      ))}
    </div>
  );
}

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  const [tried, setTried] = useState(false);
  return (
    <div className="dp-empty">
      <p role="alert">{message}</p>
      <button
        type="button"
        className="dp-btn"
        disabled={tried}
        title={tried ? "Loading it again now" : undefined}
        onClick={() => {
          setTried(true);
          onRetry();
        }}
      >
        {tried ? "Loading" : "Try again"}
      </button>
    </div>
  );
}

/* "3h" / "2d" — how long this demo has been waiting, which is also how close
   it is to expiring. */
function ageLabel(iso: string): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "";
  const seconds = Math.max(0, Math.round((Date.now() - then) / 1000));
  if (seconds < 3600) return `${Math.max(1, Math.round(seconds / 60))}m`;
  if (seconds < 86400) return `${Math.round(seconds / 3600)}h`;
  return `${Math.round(seconds / 86400)}d`;
}
