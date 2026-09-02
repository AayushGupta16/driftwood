/* /dashboard/triggers: the list of standing watches and the new-trigger
   form (design/triggers.html states 1, 1b, 3 and 4). Every card reads as
   one sentence: when something new appears on a site, then the agent
   acts. Writers get "New trigger", members the read-only chip (the backend
   enforces the same with a 403). */

import { useEffect, useState } from "react";
import { listTriggers } from "./api";
import TriggerForm from "./TriggerForm";
import {
  countsLine,
  formatDay,
  scheduleLabel,
  thenLine,
  triggerView,
  viewLabel,
  viewNotice,
  whenLine,
  type Trigger,
} from "./model";
import { TriggerIcon } from "../dashboard/icons";
import { PlusIcon } from "../audiences/icons";
import { useWorkspacePermissions } from "../dashboard/workspace-permissions-context";
import { prefetch } from "../dashboard-shared";
import { withMockMode } from "../mock-mode";
import "../audiences/audiences.css";
import "../campaigns/campaigns.css";
import "./triggers.css";

/* The list fetch starts at module eval, in parallel with WorkspacePage's
   /auth/me (see prefetch() in dashboard-shared). */
const initialList = prefetch(() => listTriggers());

type ListState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; triggers: Trigger[] };

function describeFailure(reason: unknown): string {
  return reason instanceof Error && reason.message
    ? reason.message
    : "The request never made it. Check your connection.";
}

function startsOnNewForm(): boolean {
  if (typeof window === "undefined") return false;
  return new URLSearchParams(window.location.search).get("new") === "1";
}

function dropNewParam() {
  if (typeof window === "undefined") return;
  const url = new URL(window.location.href);
  if (!url.searchParams.has("new")) return;
  url.searchParams.delete("new");
  window.history.replaceState(null, "", `${url.pathname}${url.search}${url.hash}`);
}

function lastCheckLine(trigger: Trigger): string {
  const day = formatDay(trigger.lastRunAt);
  if (!day) return "Has not checked yet.";
  const line = countsLine(trigger.counts);
  const head = trigger.lastRunState === "failed" ? `Last check ${day} failed` : `Last check ${day}`;
  return line ? `${head} · ${line}` : head;
}

function TriggerCard({ trigger }: { trigger: Trigger }) {
  const view = triggerView(trigger);
  const notice = viewNotice(view);
  const mark = (trigger.sourceHost ?? trigger.name).charAt(0).toUpperCase();
  return (
    <a
      className={`trigger-card${notice ? " trigger-card-muted" : ""}`}
      href={withMockMode(`/dashboard/triggers/${encodeURIComponent(trigger.id)}`)}
      data-testid={`trigger-card-${trigger.id}`}
    >
      <span className="trigger-mark" aria-hidden="true">{mark}</span>
      <div>
        <h2>{trigger.name}</h2>
        <p className="trigger-when"><b>When</b> {whenLine(trigger)},</p>
        <p className="trigger-then"><b>then</b> {thenLine(trigger.actions, trigger.campaignName)}.</p>
        <p className="trigger-meta">{scheduleLabel(trigger.schedule)}</p>
        <p className="trigger-lastrun">{notice ?? lastCheckLine(trigger)}</p>
      </div>
      <span className={`campaign-status campaign-status-${view}`}>{viewLabel(view)}</span>
    </a>
  );
}

function CardSkeletons() {
  return (
    <div className="trigger-list" role="status" aria-label="Loading triggers">
      {[0, 1, 2].map((index) => (
        <div className="trigger-card trigger-card-skeleton" key={index} aria-hidden="true">
          <span className="campaign-skel campaign-skel-icon" />
          <div>
            <span className="campaign-skel campaign-skel-heading" />
            <span className="campaign-skel campaign-skel-line-wide" />
            <span className="campaign-skel campaign-skel-line" />
          </div>
          <span className="campaign-skel campaign-skel-chip" />
        </div>
      ))}
    </div>
  );
}

export default function Triggers() {
  const { canWrite } = useWorkspacePermissions();
  const [state, setState] = useState<ListState>({ status: "loading" });
  const [showForm, setShowForm] = useState(() => startsOnNewForm());

  useEffect(() => {
    let current = true;
    (initialList.take() ?? listTriggers())
      .then((triggers) => {
        if (current) setState({ status: "ready", triggers });
      })
      .catch((reason: unknown) => {
        if (current) setState({ status: "error", message: describeFailure(reason) });
      });
    return () => {
      current = false;
    };
  }, []);

  function retry() {
    setState({ status: "loading" });
    listTriggers()
      .then((triggers) => setState({ status: "ready", triggers }))
      .catch((reason: unknown) => setState({ status: "error", message: describeFailure(reason) }));
  }

  function openForm() {
    setShowForm(true);
  }

  function closeForm() {
    dropNewParam();
    setShowForm(false);
  }

  if (showForm && canWrite) {
    return (
      <section className="audience-page" aria-labelledby="triggers-heading">
        <a className="trigger-back" href={withMockMode("/dashboard/triggers")} onClick={(event) => { event.preventDefault(); closeForm(); }}>
          <BackChevron />Triggers
        </a>
        <TriggerForm mode="create" onCancel={closeForm} />
      </section>
    );
  }

  const triggers = state.status === "ready" ? state.triggers : [];
  const activeCount = triggers.filter((trigger) => triggerView(trigger) === "active").length;

  return (
    <section className="audience-page" aria-labelledby="triggers-heading">
      <header className="audience-heading">
        <div className="trigger-title-row">
          <h1 id="triggers-heading">Triggers</h1>
          {state.status === "ready" && triggers.length > 0 && (
            <span className="audience-selection-count">{activeCount.toLocaleString()} active</span>
          )}
        </div>
        {canWrite ? (
          <button className="audience-primary" type="button" onClick={openForm} data-testid="new-trigger"><PlusIcon size={17} /> New trigger</button>
        ) : (
          <span className="audience-read-only">Read-only access</span>
        )}
      </header>
      <p className="trigger-lede">A trigger is a standing watch on a site. When something new appears, your agent acts on it, and every message waits in your Review queue.</p>

      <div aria-live="polite" aria-busy={state.status === "loading"}>
        {state.status === "loading" ? (
          <CardSkeletons />
        ) : state.status === "error" ? (
          <div className="audience-state trigger-empty" role="alert">
            <TriggerIcon size={24} />
            <h2>Triggers are unavailable</h2>
            <p>{state.message}</p>
            <button className="audience-secondary" type="button" onClick={retry}>Try again</button>
          </div>
        ) : triggers.length === 0 ? (
          <div className="audience-state trigger-empty">
            <TriggerIcon size={24} />
            <h2>No triggers yet</h2>
            <p>
              {canWrite
                ? "Paste a site and say what counts as new. Your agent watches it and acts on each new posting. Create your first trigger."
                : "Paste a site and say what counts as new. Your agent watches it and acts on each new posting. An owner or admin can create the first trigger."}
            </p>
            {canWrite && (
              <div className="audience-state-actions">
                <button className="audience-secondary" type="button" onClick={openForm}>New trigger</button>
              </div>
            )}
          </div>
        ) : (
          <div className="trigger-list">
            {triggers.map((trigger) => <TriggerCard key={trigger.id} trigger={trigger} />)}
          </div>
        )}
      </div>
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
