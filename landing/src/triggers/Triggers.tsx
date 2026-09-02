/* /dashboard/triggers: the list of standing watches and the new-trigger
   form (design/triggers.html states 1, 1b, 3 and 4). Rendered inside
   WorkspacePage; writers get "New trigger", members the read-only chip
   (the backend enforces the same with a 403). */

import { useEffect, useState, type FormEvent } from "react";
import { createTrigger, listTriggers } from "./api";
import {
  cadenceLabel,
  countsLine,
  fireHourLabel,
  formatDay,
  sourceLabel,
  splitList,
  watchLine,
  type Trigger,
  type TriggerCadence,
  type TriggerSourceKind,
} from "./model";
import { listCampaigns } from "../campaigns/api";
import type { CampaignSummary } from "../campaigns/model";
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

const FIRE_HOURS = Array.from({ length: 24 }, (_, hour) => hour);

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

function lastRunLine(trigger: Trigger): string {
  const day = formatDay(trigger.lastRunAt);
  if (!day) return "Has not run yet.";
  const line = countsLine(trigger.counts);
  const head = trigger.lastRunState === "failed" ? `Last run ${day} failed` : `Last run ${day}`;
  return line ? `${head} · ${line}` : head;
}

function TriggerCard({ trigger }: { trigger: Trigger }) {
  const label = sourceLabel(trigger.sourceKind);
  return (
    <a className="trigger-card" href={withMockMode(`/dashboard/triggers/${encodeURIComponent(trigger.id)}`)} data-testid={`trigger-card-${trigger.id}`}>
      <span className="trigger-mark" aria-hidden="true">{label[0]?.toUpperCase()}</span>
      <div>
        <h2>{trigger.name}</h2>
        <p className="trigger-watch">{watchLine(trigger.filters, trigger.sourceKind)}</p>
        <p className="trigger-meta">
          {cadenceLabel(trigger.cadence, trigger.fireHour)}
          {" · "}
          {trigger.campaignName ? <>Feeds <b>{trigger.campaignName}</b></> : "No campaign chosen yet"}
        </p>
        <p className="trigger-lastrun">{lastRunLine(trigger)}</p>
      </div>
      <span className={`campaign-status campaign-status-${trigger.status}`}>
        {trigger.status === "paused" ? "Paused" : "Active"}
      </span>
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

function NewTriggerForm({ onCancel }: { onCancel: () => void }) {
  const [sourceKind, setSourceKind] = useState<TriggerSourceKind>("mycnajobs");
  const [url, setUrl] = useState("");
  const [keywords, setKeywords] = useState("");
  const [locations, setLocations] = useState("");
  const [cadence, setCadence] = useState<TriggerCadence>("daily");
  const [fireHour, setFireHour] = useState(6);
  const [campaignId, setCampaignId] = useState<string>("");
  const [campaigns, setCampaigns] = useState<CampaignSummary[] | null>(null);
  const [campaignsFailed, setCampaignsFailed] = useState(false);
  const [creating, setCreating] = useState(false);
  const [urlError, setUrlError] = useState<string | null>(null);
  const [createError, setCreateError] = useState<string | null>(null);

  useEffect(() => {
    let current = true;
    listCampaigns()
      .then((rows) => {
        if (current) setCampaigns(rows);
      })
      .catch(() => {
        if (current) {
          setCampaigns([]);
          setCampaignsFailed(true);
        }
      });
    return () => {
      current = false;
    };
  }, []);

  function triggerName(): string {
    if (sourceKind !== "custom_url") return sourceLabel(sourceKind);
    try {
      return new URL(url.trim()).hostname.replace(/^www\./, "") || sourceLabel(sourceKind);
    } catch {
      return sourceLabel(sourceKind);
    }
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (creating) return;
    setUrlError(null);
    setCreateError(null);
    const cleanUrl = url.trim();
    if (sourceKind === "custom_url" && !/^https?:\/\/\S+\.\S+/i.test(cleanUrl)) {
      setUrlError("Paste the full address of the page that lists postings, starting with https://");
      return;
    }
    setCreating(true);
    try {
      const trigger = await createTrigger({
        name: triggerName(),
        sourceKind,
        keywords: splitList(keywords, "keywords"),
        locations: splitList(locations, "locations"),
        url: sourceKind === "custom_url" ? cleanUrl : null,
        cadence,
        fireHour,
        campaignId: campaignId || null,
      });
      /* Navigation is a full page load, so the detail page raises the
         "Trigger created" toast itself off this flag. */
      window.location.href = withMockMode(`/dashboard/triggers/${encodeURIComponent(trigger.id)}?created=1`);
    } catch (reason) {
      setCreateError(reason instanceof Error && reason.message ? reason.message : "The trigger could not be created. Try again.");
      setCreating(false);
    }
  }

  return (
    <>
      <header className="audience-heading">
        <div className="trigger-title-row"><h1 id="triggers-heading">New trigger</h1></div>
      </header>
      <p className="trigger-lede">A trigger watches one job board for new postings and turns each one into a company in your pipeline.</p>

      <form className="trigger-form" onSubmit={handleSubmit} noValidate>
        <div className="trigger-fieldset" role="group" aria-labelledby="trigger-source">
          <h2 className="trigger-legend" id="trigger-source">Source</h2>
          <p className="trigger-help">The site we check for new postings.</p>
          <div className="trigger-radio-cards">
            <label className={`trigger-radio-card ${sourceKind === "mycnajobs" ? "is-selected" : ""}`}>
              <input type="radio" name="source" value="mycnajobs" checked={sourceKind === "mycnajobs"} onChange={() => setSourceKind("mycnajobs")} />
              <div><strong>myCNAjobs</strong><small>Job board for CNAs and caregivers. No account needed.</small></div>
            </label>
            <label className="trigger-radio-card is-disabled" title="Indeed is coming later">
              <input type="radio" name="source" value="indeed" disabled />
              <div><strong>Indeed</strong><small>Coming later.</small></div>
            </label>
            <label className={`trigger-radio-card ${sourceKind === "custom_url" ? "is-selected" : ""}`}>
              <input type="radio" name="source" value="custom_url" checked={sourceKind === "custom_url"} onChange={() => setSourceKind("custom_url")} />
              <div>
                <strong>Another site</strong>
                <small>Paste the address of the page that lists postings.</small>
                <input
                  className="trigger-input"
                  type="url"
                  placeholder="https://"
                  aria-label="Site address"
                  value={url}
                  onChange={(event) => setUrl(event.target.value)}
                  onFocus={() => setSourceKind("custom_url")}
                  aria-invalid={urlError ? true : undefined}
                />
                {urlError && <p className="trigger-field-error" role="alert">{urlError}</p>}
              </div>
            </label>
          </div>
        </div>

        <div className="trigger-fieldset" role="group" aria-labelledby="trigger-watch">
          <h2 className="trigger-legend" id="trigger-watch">What to watch</h2>
          <p className="trigger-help">Words a posting should contain, and where to look. Leave locations empty to watch everywhere.</p>
          <div className="trigger-input-grid">
            <div>
              <label className="trigger-label" htmlFor="trigger-keywords">Keywords</label>
              <input className="trigger-input" id="trigger-keywords" type="text" value={keywords} onChange={(event) => setKeywords(event.target.value)} placeholder="caregiver, CNA, home health aide" />
              <p className="trigger-hint">Separate keywords with commas.</p>
            </div>
            <div>
              <label className="trigger-label" htmlFor="trigger-locations">Locations</label>
              <input className="trigger-input" id="trigger-locations" type="text" value={locations} onChange={(event) => setLocations(event.target.value)} placeholder="Atlanta, GA; Phoenix, AZ" />
              <p className="trigger-hint">Separate locations with semicolons, so a city can keep its state.</p>
            </div>
          </div>
        </div>

        <div className="trigger-fieldset" role="group" aria-labelledby="trigger-cadence">
          <h2 className="trigger-legend" id="trigger-cadence">Cadence</h2>
          <p className="trigger-help">How often we check the site, and at what hour Pacific time.</p>
          <div className="trigger-cadence-row">
            <div className="trigger-seg" role="radiogroup" aria-label="Cadence">
              <label className={cadence === "daily" ? "is-selected" : ""}>
                <input type="radio" name="cadence" value="daily" checked={cadence === "daily"} onChange={() => setCadence("daily")} />
                Every morning
              </label>
              <label className={cadence === "weekly" ? "is-selected" : ""}>
                <input type="radio" name="cadence" value="weekly" checked={cadence === "weekly"} onChange={() => setCadence("weekly")} />
                Weekly
              </label>
            </div>
            <label>
              <span className="audience-visually-hidden">Hour</span>
              <select className="trigger-select" value={fireHour} onChange={(event) => setFireHour(Number(event.target.value))} aria-label="Hour, Pacific time">
                {FIRE_HOURS.map((hour) => <option key={hour} value={hour}>{fireHourLabel(hour)} PT</option>)}
              </select>
            </label>
          </div>
        </div>

        <div className="trigger-fieldset" role="group" aria-labelledby="trigger-campaign">
          <h2 className="trigger-legend" id="trigger-campaign">Campaign</h2>
          <p className="trigger-help">The campaign new companies from this trigger feed. You can choose one later.</p>
          <select className="trigger-select" value={campaignId} onChange={(event) => setCampaignId(event.target.value)} aria-label="Campaign" disabled={campaigns === null}>
            <option value="">{campaigns === null ? "Loading campaigns…" : "No campaign yet"}</option>
            {(campaigns ?? []).map((campaign) => <option key={campaign.id} value={campaign.id}>{campaign.name}</option>)}
          </select>
          {campaignsFailed && <p className="trigger-hint" role="status">Campaigns could not load. You can pick one after the trigger exists.</p>}
        </div>

        <div className="trigger-fieldset" role="group" aria-labelledby="trigger-sends">
          <h2 className="trigger-legend" id="trigger-sends">Before anything sends</h2>
          <p className="trigger-fixed">Every message waits in your Review queue. Nothing goes out on its own.</p>
        </div>

        {createError && (
          <div className="campaign-inline-error trigger-form-error" role="alert">
            <span>{createError}</span>
            <button type="button" onClick={() => setCreateError(null)}>Dismiss</button>
          </div>
        )}

        <div className="trigger-form-actions">
          <button className="audience-primary" type="submit" disabled={creating} data-testid="create-trigger">
            {creating ? "Creating…" : "Create trigger"}
          </button>
          <button className="campaign-quiet-button" type="button" onClick={onCancel} disabled={creating}>Cancel</button>
        </div>
      </form>
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
        <NewTriggerForm onCancel={closeForm} />
      </section>
    );
  }

  const triggers = state.status === "ready" ? state.triggers : [];
  const activeCount = triggers.filter((trigger) => trigger.status === "active").length;

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
      <p className="trigger-lede">A trigger is a standing watch on a job board. Each new posting it finds becomes a company in your pipeline, and every message waits in your Review queue.</p>

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
                ? "A trigger watches a job board for new postings and turns each one into a company in your pipeline. Create your first trigger."
                : "A trigger watches a job board for new postings and turns each one into a company in your pipeline. An owner or admin can create the first trigger."}
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
