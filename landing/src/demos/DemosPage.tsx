import { useCallback, useEffect, useRef, useState } from "react";
import { EmailPreview } from "../EmailPreview";
import { fetchInWaves, useToast } from "../dashboard-shared";
import { analyticsWindow } from "../analytics/model";
import { scheduleSentence } from "../settings/model";
import { withMockMode } from "../mock-mode";
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
  pinDemo,
  queueAction,
  resumeAllSends,
  senderPools,
  workspaceSettings,
  type QueueAction,
  type SenderPools,
} from "./staging-api";
import {
  EMPTY_QUEUE,
  EMPTY_SENT,
  EMPTY_STAGING,
  NOT_AVAILABLE,
  STAGING_AUTO,
  STAGING_BOUND,
  decisionsFor,
  groupSentByDay,
  groupStagedDemos,
  queueHeadline,
  readyForYou,
  queueRows,
  runsThrough,
  threadHref,
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

const ARM_MS = 5000;
const REPLY_WINDOW_DAYS = 90;
const LOAD_FAILED = "That did not load. Try again.";

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
void senderPools();

export default function DemosPage() {
  const toast = useToast();
  const [segment, setSegment] = useState<Segment>(segmentFromUrl);
  const [staging, setStaging] = useState<Load<StagingData>>({ status: "loading" });
  const [queue, setQueue] = useState<Load<QueueData>>({ status: "loading" });
  const [sent, setSent] = useState<Load<SentData>>({ status: "loading" });
  const [autoApproved, setAutoApproved] = useState<boolean | null>(null);
  const [scheduleLine, setScheduleLine] = useState<string | null>(null);
  const [senders, setSenders] = useState<SenderPools>({ email: [], linkedin: [] });
  const [replied, setReplied] = useState<ReadonlySet<string>>(new Set());

  /* Per-card and per-row work in flight, keyed the way the press was. */
  const [busy, setBusy] = useState<ReadonlySet<string>>(new Set());
  const [cardError, setCardError] = useState<{ key: string; message: string } | null>(null);
  const [changeFor, setChangeFor] = useState<{ key: string; text: string } | null>(null);
  const [armedSkip, setArmedSkip] = useState<string | null>(null);
  const [armedApproveAll, setArmedApproveAll] = useState(false);
  const [armedPause, setArmedPause] = useState(false);
  const [pinnable, setPinnable] = useState(true);
  const [pinned, setPinned] = useState<ReadonlySet<string>>(new Set());
  const [heldIds, setHeldIds] = useState<ReadonlySet<string>>(new Set());
  const [rowError, setRowError] = useState<{ id: string; message: string } | null>(null);
  const [bulkQueueError, setBulkQueueError] = useState<string | null>(null);

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
        if (live) setScheduleLine(scheduleSentence(page.send_schedule));
      },
      () => {},
    );
    senderPools().then(
      (pools) => {
        if (live) setSenders(pools);
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

  /* Armed buttons disarm themselves, so no stale confirm waits to be
     fat-fingered minutes later (ux-principles rule 9). */
  useEffect(() => {
    if (!armedSkip) return;
    const timer = window.setTimeout(() => setArmedSkip(null), ARM_MS);
    return () => window.clearTimeout(timer);
  }, [armedSkip]);

  useEffect(() => {
    if (!armedApproveAll) return;
    const timer = window.setTimeout(() => setArmedApproveAll(false), ARM_MS);
    return () => window.clearTimeout(timer);
  }, [armedApproveAll]);

  useEffect(() => {
    if (!armedPause) return;
    const timer = window.setTimeout(() => setArmedPause(false), ARM_MS);
    return () => window.clearTimeout(timer);
  }, [armedPause]);

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
    queue.status === "ready" ? queueRows(queue.data.sends, heldIds, senders) : [];
  const allHeld = rows.length > 0 && rows.every((row) => row.held);
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
      setChangeFor((prev) => (prev?.key === demo.key ? null : prev));
      setArmedSkip((prev) => (prev === demo.key ? null : prev));
      toast(done, "success");
      /* An approve becomes a scheduled send, so the queue moved too. */
      if (decision === "approve") void loadQueue(true);
    } catch (error) {
      setCardError({
        key: demo.key,
        message: error instanceof Error ? error.message : LOAD_FAILED,
      });
    } finally {
      markBusy(demo.key, false);
    }
  }

  async function approveAll() {
    if (staging.status !== "ready" || !staging.data.complete) return;
    if (!armedApproveAll) {
      setArmedApproveAll(true);
      return;
    }
    setArmedApproveAll(false);
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

  async function pin(demo: StagedDemo) {
    markBusy(demo.key, true);
    setCardError(null);
    const result = await pinDemo(demo.pinId);
    markBusy(demo.key, false);
    if (result.ok) {
      setPinned((prev) => new Set(prev).add(demo.key));
      toast("Pinned. It stays in staging.", "success");
      return;
    }
    /* No pin endpoint yet: drop the button rather than offer a dead one. */
    if (result.missing) setPinnable(false);
    else setCardError({ key: demo.key, message: result.message });
  }

  async function runQueueAction(send: SendRow, action: QueueAction) {
    markBusy(send.id, true);
    setRowError(null);
    const result = await queueAction(send.id, action);
    markBusy(send.id, false);
    if (!result.ok) {
      setRowError({ id: send.id, message: result.missing ? NOT_AVAILABLE : result.message });
      return;
    }
    if (action === "hold") setHeldIds((prev) => new Set(prev).add(send.id));
    if (action === "resume")
      setHeldIds((prev) => {
        const next = new Set(prev);
        next.delete(send.id);
        return next;
      });
    if (action === "pull") {
      setQueue((prev) =>
        prev.status === "ready"
          ? {
              status: "ready",
              data: { ...prev.data, sends: prev.data.sends.filter((row) => row.id !== send.id) },
            }
          : prev,
      );
      toast("Pulled back to staging.", "success");
      void loadStaging(true);
      return;
    }
    if (action === "send-next") {
      toast("Moved to the front of the queue.", "success");
      void loadQueue(true);
    }
  }

  async function pauseOrResumeAll() {
    if (!allHeld && !armedPause) {
      setArmedPause(true);
      return;
    }
    setArmedPause(false);
    markBusy("sends", true);
    setBulkQueueError(null);
    const result = allHeld ? await resumeAllSends() : await holdAllSends();
    markBusy("sends", false);
    if (!result.ok) {
      setBulkQueueError(result.missing ? NOT_AVAILABLE : result.message);
      return;
    }
    setHeldIds(allHeld ? new Set() : new Set(rows.map((row) => row.send.id)));
    toast(allHeld ? "Sends resumed." : "Sends held.", "success");
  }

  const stagingCount = staging.status === "ready" && staging.data.complete ? stagedDemos.length : null;
  const queueCount = queue.status === "ready" && queue.data.complete ? rows.length : null;
  const sentCount = sent.status === "ready" ? sent.data.total : null;
  const counts: Record<Segment, number | null> = {
    staging: stagingCount,
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
          <p className="dp-note">{STAGING_BOUND}</p>
          {autoApproved === true ? (
            <p className="dp-note">{STAGING_AUTO}</p>
          ) : (
            <>
              <div className="dp-bar">
                <div>
                  <h2>Ready for you</h2>
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
                      className={`dp-btn ${armedApproveAll ? "is-armed" : "is-primary"}`}
                      onClick={() => void approveAll()}
                      disabled={
                        busy.has("all") ||
                        staging.status !== "ready" ||
                        !staging.data.complete
                      }
                      title={
                        staging.status === "ready" && !staging.data.complete
                          ? "Available once the whole list loads"
                          : undefined
                      }
                    >
                      {busy.has("all")
                        ? "Approving"
                        : armedApproveAll
                          ? `Approve all ${stagedDemos.length}? Confirm`
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
                <ErrorState message={staging.message} onRetry={() => void loadStaging(true)} />
              ) : stagedDemos.length === 0 ? (
                <div className="dp-empty">
                  <p>{EMPTY_STAGING}</p>
                  <button type="button" className="dp-btn" onClick={() => switchSegment("queue")}>
                    See the queue
                  </button>
                </div>
              ) : (
                <div className="dp-cards">
                  {stagedDemos.map((demo) => (
                    <DemoCard
                      key={demo.key}
                      demo={demo}
                      busy={busy.has(demo.key)}
                      pinnable={pinnable}
                      pinned={pinned.has(demo.key)}
                      armedSkip={armedSkip === demo.key}
                      change={changeFor?.key === demo.key ? changeFor.text : null}
                      error={cardError?.key === demo.key ? cardError.message : null}
                      onApprove={() =>
                        void submitDecision(demo, "approve", undefined, "Approved. It joins the queue.")
                      }
                      onSkip={() => {
                        if (armedSkip !== demo.key) {
                          setArmedSkip(demo.key);
                          return;
                        }
                        setArmedSkip(null);
                        void submitDecision(demo, "deny", "Skipped in staging", "Skipped.");
                      }}
                      onOpenChange={() =>
                        setChangeFor((prev) =>
                          prev?.key === demo.key ? null : { key: demo.key, text: "" },
                        )
                      }
                      onChangeText={(text) => setChangeFor({ key: demo.key, text })}
                      onSendChange={() => {
                        const text = changeFor?.text.trim();
                        if (!text) return;
                        void submitDecision(demo, "deny", text, "Change sent. The next version comes back here.");
                      }}
                      onPin={() => void pin(demo)}
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
            <p className="dp-note is-flush">
              {queue.status === "ready"
                ? queueHeadline(runsThrough(staging.status === "ready" ? staging.data.stats : []), scheduleLine) ||
                  "Demos go out on your sending hours."
                : " "}
            </p>
            {rows.length > 0 && (
              <div className="dp-bar-actions">
                <button
                  type="button"
                  className={`dp-btn ${armedPause ? "is-armed" : ""}`}
                  onClick={() => void pauseOrResumeAll()}
                  disabled={busy.has("sends")}
                >
                  {busy.has("sends")
                    ? "Working"
                    : allHeld
                      ? "Resume all"
                      : armedPause
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
            <ErrorState message={queue.message} onRetry={() => void loadQueue(true)} />
          ) : rows.length === 0 ? (
            <div className="dp-empty">
              <p>{EMPTY_QUEUE}</p>
              <button type="button" className="dp-btn" onClick={() => switchSegment("staging")}>
                See staging
              </button>
            </div>
          ) : (
            <div className="dp-tablewrap">
              <table className="dp-table">
                <thead>
                  <tr>
                    <th scope="col">Contact</th>
                    <th scope="col">Company</th>
                    <th scope="col">Channel</th>
                    <th scope="col">Planned</th>
                    <th scope="col">From</th>
                    <th scope="col">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row.send.id}>
                      <td>{row.send.lead?.name ?? "Not named yet"}</td>
                      <td className="dp-muted">{row.send.lead?.company ?? ""}</td>
                      <td className="dp-muted">{row.channel}</td>
                      <td className="dp-num">
                        {row.held ? <span className="dp-held">Held</span> : row.planned}
                      </td>
                      <td className="dp-muted">{row.account}</td>
                      <td>
                        <div className="dp-rowacts">
                          <button
                            type="button"
                            className="dp-btn is-small"
                            disabled={busy.has(row.send.id)}
                            onClick={() => void runQueueAction(row.send, "send-next")}
                          >
                            Send next
                          </button>
                          <button
                            type="button"
                            className="dp-btn is-small"
                            disabled={busy.has(row.send.id)}
                            onClick={() =>
                              void runQueueAction(row.send, row.held ? "resume" : "hold")
                            }
                          >
                            {row.held ? "Resume" : "Hold"}
                          </button>
                          <button
                            type="button"
                            className="dp-btn is-small"
                            disabled={busy.has(row.send.id)}
                            onClick={() => void runQueueAction(row.send, "pull")}
                          >
                            Pull
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
          )}
        </>
      )}

      {segment === "sent" && (
        <>
          {sent.status === "loading" ? (
            <RowSkeletons />
          ) : sent.status === "error" ? (
            <ErrorState message={sent.message} onRetry={() => void loadSent(true)} />
          ) : sentDays.length === 0 ? (
            <div className="dp-empty">
              <p>{EMPTY_SENT}</p>
              <button type="button" className="dp-btn" onClick={() => switchSegment("queue")}>
                See the queue
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
  const role = [lead?.title, lead?.company].filter(Boolean).join(", ");
  return (
    <article className="dp-card" aria-label={demo.heading}>
      <div className="dp-card-top">
        <h3>{demo.heading}</h3>
        <span className="dp-age">{ageLabel(demo.createdAt)}</span>
      </div>
      {lead && (
        <p className="dp-lead">
          {lead.linkedin_url && lead.name ? (
            <a href={lead.linkedin_url} target="_blank" rel="noopener noreferrer">
              {lead.name}
            </a>
          ) : (
            lead.name
          )}
          {role && (lead.name ? `, ${role}` : role)}
        </p>
      )}

      {/* The bug the demo shows, then its evidence, then the email, then the
          video: the customer judges the claim before watching, and the clip
          sits under the copy it is attached to (design/review-queue.html). */}
      {demo.claim && <p className="dp-claim">{demo.claim}</p>}
      <Evidence demo={demo} />
      {demo.body && (
        <div className="dp-media">
          <EmailPreview subject={demo.subject} body={demo.body} />
        </div>
      )}
      {demo.videoSlug && <DemoVideo slug={demo.videoSlug} label={demo.heading} />}

      {demo.canDecide && (
        <>
          <div className="dp-actions">
            <button type="button" className="dp-btn is-primary" onClick={onApprove} disabled={busy}>
              {busy ? "Working" : "Approve"}
            </button>
            <button
              type="button"
              className={`dp-btn ${change !== null ? "is-on" : ""}`}
              onClick={onOpenChange}
              aria-expanded={change !== null}
              disabled={busy}
            >
              Ask for a change
            </button>
            <button
              type="button"
              className={`dp-btn ${armedSkip ? "is-armed" : ""}`}
              onClick={onSkip}
              disabled={busy}
            >
              {armedSkip ? "Skip this demo? Confirm" : "Skip"}
            </button>
            {pinnable && (
              <button
                type="button"
                className={`dp-btn ${pinned ? "is-on" : ""}`}
                onClick={onPin}
                disabled={busy || pinned}
                title={pinned ? "This demo stays in staging" : undefined}
              >
                {pinned ? "Pinned" : "Pin"}
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
                placeholder="What should change?"
              />
              <div className="dp-change-row">
                <button
                  type="button"
                  className="dp-btn is-primary"
                  onClick={onSendChange}
                  disabled={busy || change.trim().length === 0}
                  title={change.trim().length === 0 ? "Say what should change first" : undefined}
                >
                  Send
                </button>
                <button type="button" className="dp-btn" onClick={onOpenChange} disabled={busy}>
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

function Evidence({ demo }: { demo: StagedDemo }) {
  const evidence = demo.evidence;
  if (!evidence) return null;
  const steps = Array.isArray(evidence.repro_steps) ? evidence.repro_steps : [];
  if (!steps.length && !evidence.url && !evidence.device && !evidence.video_timestamp)
    return null;
  const href = evidence.url
    ? /^https?:\/\//i.test(evidence.url)
      ? evidence.url
      : `https://${evidence.url}`
    : null;
  return (
    <div className="dp-evidence">
      {steps.length > 0 && (
        <div className="dp-ev">
          <span>Steps</span>
          <ol>
            {steps.map((step, index) => (
              <li key={index}>{step}</li>
            ))}
          </ol>
        </div>
      )}
      {href && (
        <div className="dp-ev">
          <span>Where</span>
          <p>
            <a href={href} target="_blank" rel="noopener noreferrer">
              {evidence.url}
            </a>
          </p>
        </div>
      )}
      {evidence.device && (
        <div className="dp-ev">
          <span>Device</span>
          <p>{evidence.device}</p>
        </div>
      )}
      {evidence.video_timestamp && (
        <div className="dp-ev">
          <span>In video</span>
          <p>{evidence.video_timestamp}</p>
        </div>
      )}
    </div>
  );
}

/* The clip, with its length in the corner once the file reports one. The
   number is read off the video, never guessed. A clip that will not play says
   so and offers the tab that can, rather than leaving a dead player where the
   card's whole point should be (the demo library's idiom). */
function DemoVideo({ slug, label }: { slug: string; label: string }) {
  const ref = useRef<HTMLVideoElement>(null);
  const [duration, setDuration] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  const href = `/d/${slug}`;
  if (failed)
    return (
      <div className="dp-media dp-video-missing">
        <p>This demo will not play here.</p>
        <a className="dp-btn is-small" href={href} target="_blank" rel="noopener noreferrer">
          Open it in a new tab
        </a>
      </div>
    );
  return (
    <div className="dp-media">
      <div className="dp-video-shell">
        <video
          ref={ref}
          className="dp-video"
          controls
          playsInline
          preload="metadata"
          src={href}
          aria-label={`Demo for ${label}`}
          onError={() => setFailed(true)}
          onLoadedMetadata={() => {
            const seconds = ref.current?.duration;
            if (typeof seconds === "number" && Number.isFinite(seconds) && seconds > 0)
              setDuration(
                `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, "0")}`,
              );
          }}
        />
        {duration && <span className="dp-duration">{duration}</span>}
      </div>
    </div>
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
        <td className="dp-dayhead" colSpan={5}>
          {label}
        </td>
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
  return (
    <div className="dp-empty">
      <p role="alert">{message}</p>
      <button type="button" className="dp-btn" onClick={onRetry}>
        Try again
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
