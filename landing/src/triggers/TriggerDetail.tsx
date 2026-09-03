/* /dashboard/triggers/<id>: one trigger's facts, its recent postings and
   its run log (design/triggers.html state 2). Checks happen on the
   schedule; "Check now" queues one by hand and the page polls every 5 s
   until the newest run settles. Pause and Resume flip the schedule. A
   trigger still being built, or on a site that cannot be watched, is
   greyed out and cannot be checked. Enroll and dismiss controls come in a
   later slice. */

import { useCallback, useEffect, useState } from "react";
import { getTrigger, pauseTrigger, resumeTrigger, runTrigger, TriggerApiError } from "./api";
import TriggerForm from "./TriggerForm";
import {
  counterCell,
  formatDate,
  formatMoment,
  lastCheckFact,
  postedCell,
  postingLocation,
  postingStatusLabel,
  postingStatusTone,
  pullLabel,
  runIsOpen,
  runStateLabel,
  runTriggerLabel,
  scheduleLabel,
  spendCell,
  thenLine,
  triggerTitle,
  triggerView,
  viewLabel,
  viewNotice,
  whenLine,
  type Trigger,
  type TriggerDetail as TriggerDetailData,
  type TriggerPosting,
  type TriggerRun,
} from "./model";
import { TriggerIcon } from "../dashboard/icons";
import { useWorkspacePermissions } from "../dashboard/workspace-permissions-context";
import { prefetch, useToast } from "../dashboard-shared";
import { withMockMode } from "../mock-mode";
import "../audiences/audiences.css";
import "../campaigns/campaigns.css";
import "./triggers.css";

const POLL_MS = 5000;

/* The detail fetch starts at module eval off the URL, in parallel with
   WorkspacePage's /auth/me; the first load consumes it exactly once. */
const bootId =
  typeof window === "undefined"
    ? null
    : window.location.pathname.match(/^\/dashboard\/triggers\/([^/]+)/)?.[1] ?? null;
const initialDetail = bootId ? prefetch(() => getTrigger(decodeURIComponent(bootId))) : null;

function takeCreatedFlag(): boolean {
  if (typeof window === "undefined") return false;
  const url = new URL(window.location.href);
  if (url.searchParams.get("created") !== "1") return false;
  url.searchParams.delete("created");
  window.history.replaceState(null, "", `${url.pathname}${url.search}${url.hash}`);
  return true;
}

type State =
  | { status: "loading" }
  | { status: "error"; message: string; notFound: boolean }
  | { status: "ready"; detail: TriggerDetailData };

type Pending = "run" | "pause" | "resume" | null;

function StatusChip({ trigger }: { trigger: Trigger }) {
  const view = triggerView(trigger);
  return <span className={`campaign-status campaign-status-${view}`}>{viewLabel(view)}</span>;
}

function PostingRow({ posting }: { posting: TriggerPosting }) {
  const tone = postingStatusTone(posting.status);
  return (
    <tr>
      <td className="trigger-num">{postedCell(posting)}</td>
      <td>
        <strong>{posting.employerName}</strong>
        {posting.note && <span className="trigger-sub">{posting.note}</span>}
      </td>
      <td>{postingLocation(posting)}</td>
      <td>{posting.title}</td>
      <td className="trigger-num">{posting.payText ?? "Not listed"}</td>
      <td><span className={`trigger-chip${tone === "plain" ? "" : ` trigger-chip-${tone}`}`}>{postingStatusLabel(posting.status)}</span></td>
      <td>
        <span className="trigger-links">
          <a className="trigger-link" href={posting.sourceUrl} target="_blank" rel="noopener noreferrer">Open posting</a>
          {posting.demoUrl && <a className="trigger-link" href={posting.demoUrl} target="_blank" rel="noopener noreferrer">Open demo</a>}
        </span>
      </td>
    </tr>
  );
}

/* Seen and New prefer the pull counters (which update while a check
   runs) and fall back to the posting counts every row has; Pages,
   Filtered and Spend only exist on newer rows. */
function RunRow({ run }: { run: TriggerRun }) {
  return (
    <tr>
      <td className="trigger-num">
        {formatMoment(run.startedAt ?? run.createdAt) ?? "Unknown"}
        <span className="trigger-sub">{runTriggerLabel(run.triggeredBy)}</span>
      </td>
      <td>{runStateLabel(run.state)}</td>
      <td className="trigger-num">{counterCell(run.pagesFetched)}</td>
      <td className="trigger-num">{counterCell(run.idsSeen ?? run.postingsSeen)}</td>
      <td className="trigger-num">{counterCell(run.idsNew ?? run.postingsNew)}</td>
      <td className="trigger-num">{counterCell(run.idsFiltered)}</td>
      <td className="trigger-num">{spendCell(run)}</td>
      <td className={run.error ? "trigger-error-cell" : "trigger-error-none"}>{run.error ?? "None"}</td>
    </tr>
  );
}

function SkeletonRows({ columns, rows }: { columns: number; rows: number }) {
  return (
    <>
      {Array.from({ length: rows }, (_, row) => (
        <tr className="trigger-table-skeleton" key={row} aria-hidden="true">
          {Array.from({ length: columns }, (_, column) => (
            <td key={column}><span className="campaign-skel campaign-skel-line" /></td>
          ))}
        </tr>
      ))}
    </>
  );
}

function FactSkeleton() {
  return <span className="campaign-skel campaign-skel-line" aria-hidden="true" />;
}

export default function TriggerDetail({ triggerId }: { triggerId: string }) {
  const { canWrite } = useWorkspacePermissions();
  const toast = useToast();
  const [state, setState] = useState<State>({ status: "loading" });
  const [pending, setPending] = useState<Pending>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);

  const load = useCallback(async (initial?: Promise<TriggerDetailData> | null) => {
    try {
      setState({ status: "ready", detail: await (initial ?? getTrigger(triggerId)) });
    } catch (reason) {
      setState((prev) => {
        // A poll that fails keeps the page it already painted.
        if (prev.status === "ready") return prev;
        const notFound = reason instanceof TriggerApiError && reason.status === 404;
        return {
          status: "error",
          notFound,
          message: notFound
            ? "This trigger does not exist, or it belongs to another workspace."
            : reason instanceof Error && reason.message
              ? reason.message
              : "The request never made it. Check your connection.",
        };
      });
    }
  }, [triggerId]);

  useEffect(() => {
    void load(initialDetail?.take());
  }, [load]);

  /* The list page hands off here right after a create; the toast belongs on
     the page the customer lands on. */
  useEffect(() => {
    if (takeCreatedFlag()) toast("Trigger created.", "success");
  }, [toast]);

  const openRun = state.status === "ready" && runIsOpen(state.detail.runs[0]?.state);

  /* Poll while a run is queued or running (ux-principles rule 4): state
     lives server-side, so a tab switch or reload picks up where it was. */
  useEffect(() => {
    if (!openRun) return;
    const timer = window.setTimeout(() => void load(), POLL_MS);
    return () => window.clearTimeout(timer);
  }, [openRun, state, load]);

  async function act(kind: NonNullable<Pending>) {
    if (pending || state.status !== "ready") return;
    setPending(kind);
    setActionError(null);
    try {
      if (kind === "run") {
        await runTrigger(triggerId);
        await load();
      } else {
        const trigger = kind === "pause" ? await pauseTrigger(triggerId) : await resumeTrigger(triggerId);
        setState((prev) => (prev.status === "ready" ? { status: "ready", detail: { ...prev.detail, trigger } } : prev));
        toast(kind === "pause" ? "Trigger paused." : "Trigger resumed.", "success");
      }
    } catch (reason) {
      if (kind === "run" && reason instanceof TriggerApiError && reason.code === "run_in_progress") {
        // Someone (or the schedule) got there first: show that run.
        await load();
      }
      setActionError(reason instanceof Error && reason.message ? reason.message : "Something went wrong. Try again.");
    } finally {
      setPending(null);
    }
  }

  if (state.status === "error") {
    return (
      <section className="audience-page" aria-labelledby="trigger-heading">
        <a className="trigger-back" href={withMockMode("/dashboard/triggers")}><BackChevron />Triggers</a>
        <div className="audience-state trigger-empty" role="alert">
          <TriggerIcon size={24} />
          <h2 id="trigger-heading">{state.notFound ? "Trigger not found" : "This trigger is unavailable"}</h2>
          <p>{state.message}</p>
          {state.notFound ? (
            <a className="audience-secondary" href={withMockMode("/dashboard/triggers")}>Back to triggers</a>
          ) : (
            <button className="audience-secondary" type="button" onClick={() => { setState({ status: "loading" }); void load(); }}>Try again</button>
          )}
        </div>
      </section>
    );
  }

  const detail = state.status === "ready" ? state.detail : null;
  const trigger = detail?.trigger ?? null;
  const title = trigger ? triggerTitle(trigger) : null;

  /* Edit swaps the page for the form, prefilled; saving lands back here
     with the row the backend returned. */
  if (editing && trigger && canWrite) {
    return (
      <section className="audience-page" aria-labelledby="triggers-heading">
        <a className="trigger-back" href={withMockMode(`/dashboard/triggers/${encodeURIComponent(triggerId)}`)} onClick={(event) => { event.preventDefault(); setEditing(false); }}>
          <BackChevron />{title}
        </a>
        <TriggerForm
          mode="edit"
          trigger={trigger}
          onCancel={() => setEditing(false)}
          onSaved={(saved) => {
            setState((prev) => (prev.status === "ready" ? { status: "ready", detail: { ...prev.detail, trigger: saved } } : prev));
            setEditing(false);
            toast("Trigger saved.", "success");
          }}
        />
      </section>
    );
  }

  const view = trigger ? triggerView(trigger) : null;
  const notice = view ? viewNotice(view) : null;
  const muted = notice ? " is-muted" : "";
  const runBusy = pending === "run" || openRun;
  const pauseTitle = notice
    ? "Available once the site can be watched"
    : pending && pending !== "pause" && pending !== "resume"
      ? "Wait for the current action to finish"
      : undefined;

  return (
    <section className="audience-page" aria-labelledby="trigger-heading" aria-busy={state.status === "loading"}>
      <a className="trigger-back" href={withMockMode("/dashboard/triggers")}><BackChevron />Triggers</a>
      <header className="audience-heading">
        <div className="trigger-title-row">
          {trigger ? (
            <>
              <h1 id="trigger-heading">{title}</h1>
              <StatusChip trigger={trigger} />
            </>
          ) : (
            <>
              <h1 id="trigger-heading" className="audience-visually-hidden">Trigger</h1>
              <span className="campaign-skel campaign-skel-title" aria-hidden="true" />
            </>
          )}
        </div>
        {canWrite && trigger ? (
          <div className="trigger-heading-actions">
            <button
              className="audience-secondary"
              type="button"
              onClick={() => setEditing(true)}
              disabled={pending !== null}
              title={pending ? "Wait for the current action to finish" : undefined}
              data-testid="edit-trigger"
            >
              Edit
            </button>
            <button
              className="audience-secondary"
              type="button"
              onClick={() => void act(trigger.status === "paused" ? "resume" : "pause")}
              disabled={pending !== null || notice !== null}
              title={pauseTitle}
            >
              {pending === "pause" ? "Pausing…" : pending === "resume" ? "Resuming…" : trigger.status === "paused" ? "Resume" : "Pause"}
            </button>
          </div>
        ) : !canWrite && trigger ? (
          <span className="audience-read-only">Read-only access</span>
        ) : null}
      </header>
      {trigger ? (
        <p className={`trigger-lede trigger-sentence${muted}`}>
          <b>When</b> {whenLine(trigger)}, <b>then</b> {thenLine(trigger.actions, trigger.campaignName)}.
        </p>
      ) : (
        <p className="trigger-lede" aria-hidden="true"><span className="campaign-skel campaign-skel-line-wide" /></p>
      )}

      {actionError && (
        <div className="campaign-inline-error" role="alert">
          <span>{actionError}</span>
          <button type="button" onClick={() => setActionError(null)}>Dismiss</button>
        </div>
      )}

      <div className={`trigger-facts${muted}`}>
        <div className="trigger-fact">
          <small>Schedule</small>
          {trigger ? <strong>{scheduleLabel(trigger.schedule)}</strong> : <FactSkeleton />}
        </div>
        <div className="trigger-fact">
          <small>Source</small>
          {trigger ? <strong>{pullLabel(trigger.pull) ?? trigger.sourceHost ?? "—"}</strong> : <FactSkeleton />}
        </div>
        <div className="trigger-fact">
          <small>Feeds</small>
          {trigger ? (
            <strong>
              {trigger.campaignId && trigger.campaignName
                ? <a href={withMockMode(`/dashboard/campaigns/${encodeURIComponent(trigger.campaignId)}`)}>{trigger.campaignName}</a>
                : "No campaign chosen yet"}
            </strong>
          ) : <FactSkeleton />}
        </div>
        <div className="trigger-fact">
          <small>Last check</small>
          {trigger ? <strong>{lastCheckFact(trigger, detail?.runs[0])}</strong> : <FactSkeleton />}
        </div>
        <div className="trigger-fact">
          <small>Watching since</small>
          {trigger ? <strong>{formatDate(trigger.createdAt) ?? "Recently"}</strong> : <FactSkeleton />}
        </div>
      </div>

      {trigger && notice ? (
        <p className="trigger-notice" role="status">{notice}</p>
      ) : trigger && canWrite ? (
        <p className="trigger-check-row">
          <button
            className="trigger-check-now"
            type="button"
            onClick={() => void act("run")}
            disabled={runBusy || pending !== null}
            title={openRun ? "A check is in progress. This page refreshes every few seconds." : pending ? "Wait for the current action to finish" : "Check the site now instead of waiting for the schedule"}
            data-testid="check-now"
          >
            {runBusy ? "Checking…" : "Check now"}
          </button>
        </p>
      ) : null}

      <section className="trigger-section" aria-labelledby="trigger-postings">
        <div className="trigger-section-head">
          <h2 id="trigger-postings">Recent postings</h2>
          {detail && detail.postings.length > 0 && (
            <span>
              {detail.trigger.counts.postings > detail.postings.length
                ? `${detail.postings.length.toLocaleString()} of ${detail.trigger.counts.postings.toLocaleString()} postings`
                : `${detail.postings.length.toLocaleString()} ${detail.postings.length === 1 ? "posting" : "postings"}`}
            </span>
          )}
        </div>
        <div className="trigger-table-card" aria-live="polite">
          {detail && detail.postings.length === 0 ? (
            <p className="trigger-table-empty">
              {canWrite && !notice ? "Nothing found yet. The next check runs on schedule, or press Check now." : "Nothing found yet."}
            </p>
          ) : (
            <div className="trigger-table-wrap">
              <table className="trigger-table trigger-table-postings">
                <thead>
                  <tr>
                    <th scope="col">Posted <span className="trigger-th-note">newest first</span></th>
                    <th scope="col">Agency</th>
                    <th scope="col">Location</th>
                    <th scope="col">Job title</th>
                    <th scope="col">Pay</th>
                    <th scope="col">Status</th>
                    <th scope="col">Links</th>
                  </tr>
                </thead>
                <tbody>
                  {detail
                    ? detail.postings.map((posting) => <PostingRow key={posting.id} posting={posting} />)
                    : <SkeletonRows columns={7} rows={5} />}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>

      <section className="trigger-section" aria-labelledby="trigger-runs">
        <div className="trigger-section-head">
          <h2 id="trigger-runs">Runs</h2>
          {detail && detail.runs.length > 0 && <span>Last {detail.runs.length.toLocaleString()}</span>}
        </div>
        <div className="trigger-table-card" aria-live="polite">
          {detail && detail.runs.length === 0 ? (
            <p className="trigger-table-empty">No checks yet.</p>
          ) : (
            <div className="trigger-table-wrap">
              <table className="trigger-table trigger-table-runs">
                <thead>
                  <tr>
                    <th scope="col">Date</th>
                    <th scope="col">State</th>
                    <th scope="col">Pages</th>
                    <th scope="col">Seen</th>
                    <th scope="col">New</th>
                    <th scope="col">Filtered</th>
                    <th scope="col">Spend</th>
                    <th scope="col">Errors</th>
                  </tr>
                </thead>
                <tbody>
                  {detail
                    ? detail.runs.map((run) => <RunRow key={run.id} run={run} />)
                    : <SkeletonRows columns={8} rows={3} />}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>
      {state.status === "loading" && <p className="audience-visually-hidden" role="status">Loading trigger…</p>}
    </section>
  );
}

function BackChevron() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M15 5l-7 7 7 7" />
    </svg>
  );
}
