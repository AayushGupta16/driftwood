/* /dashboard/triggers: the standing watches, and the box that creates one.
   A row is the trigger's name, the line the agent wrote back about what it
   watches, one gray meta line and the status chip — the same row grammar
   Campaigns uses. Writers get "New trigger", members the read-only chip
   (the backend enforces the same with a 403). */

import { useEffect, useState } from "react";
import { listTriggers } from "./api";
import TriggerForm from "./TriggerForm";
import {
  lastCheckLine,
  metaLine,
  readbackLine,
  triggerTitle,
  triggerView,
  viewLabel,
  type Trigger,
} from "./model";
import { TriggerIcon } from "../dashboard/icons";
import { ArrowIcon, PlusIcon } from "../campaigns/icons";
import { useWorkspacePermissions } from "../dashboard/workspace-permissions-context";
import { prefetch } from "../dashboard-shared";
import { withMockMode } from "../mock-mode";
import "../audiences/audiences.css";
import "../campaigns/campaigns.css";
import "./triggers.css";

/* The list fetch starts at module eval, in parallel with WorkspacePage's
   /auth/me (see prefetch() in dashboard-shared). */
const initialList = prefetch(() => listTriggers());

const NEW_PATH = "/dashboard/triggers/new";
const LIST_PATH = "/dashboard/triggers";

type ListState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; triggers: Trigger[] };

function describeFailure(reason: unknown): string {
  return reason instanceof Error && reason.message
    ? reason.message
    : "Check your connection and try again.";
}

/* The box has its own address, so it can be linked, refreshed and backed
   out of; ?new=1 still opens it for anything that kept the old link. */
function startsOnNewForm(): boolean {
  if (typeof window === "undefined") return false;
  if (window.location.pathname.replace(/\/+$/, "") === NEW_PATH) return true;
  return new URLSearchParams(window.location.search).get("new") === "1";
}

function TriggerRow({ trigger }: { trigger: Trigger }) {
  const view = triggerView(trigger);
  const readback = readbackLine(trigger);
  /* A trigger the agent is still working on has no schedule it chose and
     no check to report, so the row says neither. */
  const running = view === "active" || view === "paused";
  return (
    <a
      className={`campaign-list-row trigger-row${running ? "" : " trigger-row-muted"}`}
      href={withMockMode(`/dashboard/triggers/${encodeURIComponent(trigger.id)}`)}
      data-testid={`trigger-row-${trigger.id}`}
    >
      <span className={`campaign-status campaign-status-${view}`}>{viewLabel(view)}</span>
      <span className="campaign-list-copy">
        <strong>{triggerTitle(trigger)}</strong>
        {readback && <span>{readback}</span>}
        {running && <small>{metaLine(trigger)}</small>}
      </span>
      <span className="campaign-list-updated">
        {running && <span>{lastCheckLine(trigger)}</span>}
      </span>
      <span className="campaign-list-open" aria-hidden="true">
        <ArrowIcon size={17} />
      </span>
    </a>
  );
}

function RowSkeletons() {
  return (
    <>
      <p className="audience-visually-hidden" role="status">Loading triggers…</p>
      {[0, 1, 2].map((index) => (
        <div className="campaign-list-row trigger-row campaign-list-skeleton" key={index} aria-hidden="true">
          <span className="campaign-skel campaign-skel-chip" />
          <span className="campaign-list-copy">
            <span className="campaign-skel campaign-skel-line-wide" />
            <span className="campaign-skel campaign-skel-line" />
          </span>
          <span className="campaign-list-updated">
            <span className="campaign-skel campaign-skel-line" />
          </span>
          <span />
        </div>
      ))}
    </>
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

  /* Back and forward move between the list and the box, since each has an
     address now. */
  useEffect(() => {
    const onPop = () => setShowForm(startsOnNewForm());
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  function retry() {
    setState({ status: "loading" });
    listTriggers()
      .then((triggers) => setState({ status: "ready", triggers }))
      .catch((reason: unknown) => setState({ status: "error", message: describeFailure(reason) }));
  }

  function openForm() {
    if (typeof window !== "undefined" && window.location.pathname.replace(/\/+$/, "") !== NEW_PATH) {
      window.history.pushState(null, "", withMockMode(NEW_PATH));
    }
    setShowForm(true);
  }

  function closeForm() {
    if (typeof window !== "undefined") window.history.replaceState(null, "", withMockMode(LIST_PATH));
    setShowForm(false);
  }

  if (showForm && canWrite) {
    return (
      <section className="audience-page" aria-labelledby="triggers-heading">
        <a className="trigger-back" href={withMockMode(LIST_PATH)} onClick={(event) => { event.preventDefault(); closeForm(); }}>
          <BackChevron />Triggers
        </a>
        <TriggerForm mode="create" onCancel={closeForm} />
      </section>
    );
  }

  const triggers = state.status === "ready" ? state.triggers : [];

  return (
    <section className="audience-page" aria-labelledby="triggers-heading">
      <header className="audience-heading">
        <div className="trigger-title-row">
          <h1 id="triggers-heading">Triggers</h1>
        </div>
        {canWrite ? (
          <button className="audience-primary" type="button" onClick={openForm} data-testid="new-trigger"><PlusIcon size={17} /> New trigger</button>
        ) : (
          <span className="audience-read-only">Read-only access</span>
        )}
      </header>

      <div className="trigger-list campaign-list" aria-live="polite" aria-busy={state.status === "loading"}>
        {state.status === "loading" ? (
          <RowSkeletons />
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
                ? "Tell your agent what to watch. It checks every night and acts on anything new."
                : "An owner or admin can add the first one."}
            </p>
            {canWrite && (
              <div className="audience-state-actions">
                <button className="audience-secondary" type="button" onClick={openForm}>New trigger</button>
              </div>
            )}
          </div>
        ) : (
          triggers.map((trigger) => <TriggerRow key={trigger.id} trigger={trigger} />)
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
