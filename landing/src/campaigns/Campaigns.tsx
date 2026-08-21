import { useEffect, useMemo, useState } from "react";
import CampaignShell from "./CampaignShell";
import { createCampaign, listCampaigns } from "./api";
import {
  formatUpdatedAt,
  type CampaignStatus,
  type CampaignSummary,
} from "./model";
import { ArrowIcon, CampaignIcon, PlusIcon, SearchIcon } from "./icons";
import { useWorkspacePermissions } from "../dashboard/workspace-permissions-context";
import { withMockMode } from "../mock-mode";

type CampaignTab = "all" | CampaignStatus;

const TABS: Array<{ id: CampaignTab; label: string }> = [
  { id: "all", label: "All" },
  { id: "active", label: "Active" },
  { id: "draft", label: "Drafts" },
  { id: "paused", label: "Paused" },
  { id: "completed", label: "Completed" },
];

function statusLabel(status: CampaignStatus): string {
  return status[0].toUpperCase() + status.slice(1);
}

function openCampaign(id: string) {
  window.location.href = withMockMode(`/dashboard/campaigns/${encodeURIComponent(id)}`);
}

function CampaignsWorkspace() {
  const { canWrite } = useWorkspacePermissions();
  const [campaigns, setCampaigns] = useState<CampaignSummary[]>([]);
  const [tab, setTab] = useState<CampaignTab>("all");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    let current = true;
    listCampaigns()
      .then((rows) => {
        if (current) setCampaigns(rows);
      })
      .catch((reason: unknown) => {
        if (current) {
          setLoadError(reason instanceof Error ? reason.message : "Campaigns could not load.");
        }
      })
      .finally(() => {
        if (current) setLoading(false);
      });
    return () => {
      current = false;
    };
  }, []);

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return campaigns.filter((campaign) => {
      if (tab !== "all" && campaign.status !== tab) return false;
      if (!normalized) return true;
      return [campaign.name, campaign.description, campaign.audience]
        .join(" ")
        .toLowerCase()
        .includes(normalized);
    });
  }, [campaigns, query, tab]);

  async function handleCreate() {
    setCreating(true);
    setActionError(null);
    try {
      const campaign = await createCampaign();
      openCampaign(campaign.id);
    } catch (reason) {
      setActionError(reason instanceof Error ? reason.message : "Campaign could not be created.");
      setCreating(false);
    }
  }

  return (
      <section className="campaign-index" aria-labelledby="campaigns-heading">
        <div className="campaign-index-heading">
          <div>
            <p className="campaign-kicker">Campaign workbench</p>
            <h1 id="campaigns-heading">Campaigns</h1>
            <p className="campaign-index-intro">
              Build a versioned sequence, choose real leads, and keep every send behind review.
            </p>
          </div>
          {canWrite ? (
            <button
              className="campaign-primary"
              type="button"
              onClick={handleCreate}
              disabled={creating}
              data-testid="new-campaign"
            >
              <PlusIcon size={17} />
              {creating ? "Creating…" : "New campaign"}
            </button>
          ) : <span className="campaign-read-only">Read-only access</span>}
        </div>

        {actionError && (
          <div className="campaign-inline-error" role="alert">
            <span>{actionError}</span>
            <button type="button" onClick={() => setActionError(null)}>Dismiss</button>
          </div>
        )}

        <div className="campaign-index-tools">
          <div className="campaign-status-tabs" role="tablist" aria-label="Campaign status">
            {TABS.map((item) => {
              const count = item.id === "all"
                ? campaigns.length
                : campaigns.filter((campaign) => campaign.status === item.id).length;
              return (
                <button
                  key={item.id}
                  type="button"
                  className={tab === item.id ? "is-active" : ""}
                  onClick={() => setTab(item.id)}
                  role="tab"
                  aria-selected={tab === item.id}
                >
                  {item.label}
                  <span>{count}</span>
                </button>
              );
            })}
          </div>
          <label className="campaign-search">
            <SearchIcon size={16} />
            <span className="sr-only">Search campaigns</span>
            <input
              type="search"
              placeholder="Search campaigns"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </label>
        </div>

        <div className="campaign-list" aria-live="polite" aria-busy={loading}>
          {loading ? (
            <div className="campaign-loading">
              <span aria-hidden="true" />
              <p>Loading campaigns…</p>
            </div>
          ) : loadError ? (
            <div className="campaign-empty" role="alert">
              <CampaignIcon size={24} />
              <h2>Campaigns are unavailable</h2>
              <p>{loadError}</p>
              <button className="campaign-secondary" type="button" onClick={() => window.location.reload()}>Try again</button>
            </div>
          ) : filtered.length === 0 ? (
            <div className="campaign-empty">
              <CampaignIcon size={24} />
              <h2>{campaigns.length === 0 ? "No campaigns yet" : "No campaigns match this view"}</h2>
              <p>{campaigns.length === 0 ? canWrite ? "Create a draft to build your first sequence." : "An owner or admin can create the first campaign." : "Clear the search or choose another status."}</p>
            </div>
          ) : (
            filtered.map((campaign) => (
              <button
                type="button"
                className="campaign-list-row"
                key={campaign.id}
                onClick={() => openCampaign(campaign.id)}
                data-testid={`campaign-row-${campaign.id}`}
              >
                <span className={`campaign-status campaign-status-${campaign.status}`}>
                  {statusLabel(campaign.status)}
                </span>
                <span className="campaign-list-copy">
                  <strong>{campaign.name}</strong>
                  <span>{campaign.description}</span>
                </span>
                <span className="campaign-list-audience">
                  <span>{campaign.audience}</span>
                  <small>{campaign.contactCount} selected leads</small>
                </span>
                <span className="campaign-list-sequence">
                  <strong>{campaign.stepCount}</strong>
                  <small>steps</small>
                </span>
                <span className="campaign-list-updated">
                  <small>Version {campaign.version} · Updated</small>
                  <span>{formatUpdatedAt(campaign.updatedAt)}</span>
                </span>
                <span className="campaign-list-open" aria-hidden="true">
                  <ArrowIcon size={17} />
                </span>
              </button>
            ))
          )}
        </div>
      </section>
  );
}

export default function Campaigns() {
  return (
    <CampaignShell active="campaigns">
      <CampaignsWorkspace />
    </CampaignShell>
  );
}
