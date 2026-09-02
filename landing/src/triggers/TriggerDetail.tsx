/* /dashboard/triggers/<id>: one trigger's facts, its recent postings and
   its run log (design/triggers.html state 2). Run now queues a sweep and
   the page polls every 5 s until the newest run settles; Pause and Resume
   flip the schedule. Enroll and dismiss controls come in a later slice. */

import { useCallback, useEffect, useState } from "react";
import { getTrigger, pauseTrigger, resumeTrigger, runTrigger, TriggerApiError } from "./api";
import {
  cadenceLabel,
  formatDate,
  formatDay,
  formatMoment,
  postingLocation,
  postingStatusLabel,
  postingStatusTone,
  runIsOpen,
  runStateLabel,
  watchLine,
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
  return (
    <span className={`campaign-status campaign-status-${trigger.status}`}>
      {trigger.status === "paused" ? "Paused" : "Active"}
    </span>
  );
}

function lastRunFact(trigger: Trigger): string {
  const moment = formatMoment(trigger.lastRunAt);
  if (!moment) return "Has not run yet";
  if (trigger.lastRunState === "failed") return `${moment}, failed`;
  if (runIsOpen(trigger.lastRunState)) return `${moment}, running`;
  return moment;
}

function PostingRow({ posting }: { posting: TriggerPosting }) {
  const tone = postingStatusTone(posting.status);
  return (
    <tr>
      <td className="trigger-num">{formatDay(posting.postedAt) ?? formatDay(posting.createdAt) ?? "Unknown"}</td>
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

function RunRow({ run }: { run: TriggerRun }) {
  return (
    <tr>
      <td className="trigger-num">
        {formatMoment(run.startedAt ?? run.createdAt) ?? "Unknown"}
        <span className="trigger-sub">{run.triggeredBy === "manual" ? "Run now" : "Scheduled"}</span>
      </td>
      <td>{runStateLabel(run.state)}</td>
      <td className="trigger-num">{run.postingsSeen.toLocaleString()}</td>
      <td className="trigger-num">{run.postingsNew.toLocaleString()}</td>
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

export default function TriggerDetail({ triggerId }: { triggerId: string }) {
  const { canWrite } = useWorkspacePermissions();
  const toast = useToast();
  const [state, setState] = useState<State>({ status: "loading" });
  const [pending, setPending] = useState<Pending>(null);
  const [actionError, setActionError] = useState<string | null>(null);

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
    if (takeCreatedFlag()) toast("Trigger created. Press Run now to fetch postings.", "success");
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
  const runBusy = pending === "run" || openRun;

  return (
    <section className="audience-page" aria-labelledby="trigger-heading" aria-busy={state.status === "loading"}>
      <a className="trigger-back" href={withMockMode("/dashboard/triggers")}><BackChevron />Triggers</a>
      <header className="audience-heading">
        <div className="trigger-title-row">
          {trigger ? (
            <>
              <h1 id="trigger-heading">{trigger.name}</h1>
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
              onClick={() => void act(trigger.status === "paused" ? "resume" : "pause")}
              disabled={pending !== null}
              title={pending && pending !== "pause" && pending !== "resume" ? "Wait for the current action to finish" : undefined}
            >
              {pending === "pause" ? "Pausing…" : pending === "resume" ? "Resuming…" : trigger.status === "paused" ? "Resume" : "Pause"}
            </button>
            <button
              className="audience-primary"
              type="button"
              onClick={() => void act("run")}
              disabled={runBusy || pending !== null}
              title={openRun ? "A run is in progress. This page refreshes every few seconds." : pending ? "Wait for the current action to finish" : undefined}
              data-testid="run-now"
            >
              {runBusy ? "Running…" : "Run now"}
            </button>
          </div>
        ) : !canWrite && trigger ? (
          <span className="audience-read-only">Read-only access</span>
        ) : null}
      </header>
      {trigger ? (
        <p className="trigger-lede">{watchLine(trigger.filters, trigger.sourceKind)}</p>
      ) : (
        <p className="trigger-lede" aria-hidden="true"><span className="campaign-skel campaign-skel-line-wide" /></p>
      )}

      {actionError && (
        <div className="campaign-inline-error" role="alert">
          <span>{actionError}</span>
          <button type="button" onClick={() => setActionError(null)}>Dismiss</button>
        </div>
      )}

      <div className="trigger-facts">
        <div className="trigger-fact">
          <small>Cadence</small>
          {trigger ? <strong>{cadenceLabel(trigger.cadence, trigger.fireHour)}</strong> : <span className="campaign-skel campaign-skel-line" aria-hidden="true" />}
        </div>
        <div className="trigger-fact">
          <small>Feeds</small>
          {trigger ? (
            <strong>
              {trigger.campaignId && trigger.campaignName
                ? <a href={withMockMode(`/dashboard/campaigns/${encodeURIComponent(trigger.campaignId)}`)}>{trigger.campaignName}</a>
                : "No campaign chosen yet"}
            </strong>
          ) : <span className="campaign-skel campaign-skel-line" aria-hidden="true" />}
        </div>
        <div className="trigger-fact">
          <small>Last run</small>
          {trigger ? <strong>{lastRunFact(trigger)}</strong> : <span className="campaign-skel campaign-skel-line" aria-hidden="true" />}
        </div>
        <div className="trigger-fact">
          <small>Watching since</small>
          {trigger ? <strong>{formatDate(trigger.createdAt) ?? "Recently"}</strong> : <span className="campaign-skel campaign-skel-line" aria-hidden="true" />}
        </div>
      </div>

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
            <p className="trigger-table-empty">{canWrite ? "Nothing found yet. Press Run now to fetch postings." : "Nothing found yet."}</p>
          ) : (
            <div className="trigger-table-wrap">
              <table className="trigger-table trigger-table-postings">
                <thead>
                  <tr>
                    <th scope="col">Posted</th>
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
            <p className="trigger-table-empty">No runs yet.</p>
          ) : (
            <div className="trigger-table-wrap">
              <table className="trigger-table trigger-table-runs">
                <thead>
                  <tr>
                    <th scope="col">Date</th>
                    <th scope="col">State</th>
                    <th scope="col">Postings seen</th>
                    <th scope="col">New</th>
                    <th scope="col">Errors</th>
                  </tr>
                </thead>
                <tbody>
                  {detail
                    ? detail.runs.map((run) => <RunRow key={run.id} run={run} />)
                    : <SkeletonRows columns={5} rows={3} />}
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
