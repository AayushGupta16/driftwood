import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
} from "react";
import {
  createAudience,
  deleteAudience,
  discoverAudienceLeads,
  getDiscoveryStatus,
  getAudience,
  listAudiences,
} from "./api";
import {
  EMPTY_FILTERS,
  filterAudiences,
  formatAudienceDate,
  stageLabel,
  toggleLead,
  type Audience,
  type AudienceFilters,
  type AudienceSummary,
  type DiscoveryResult,
  type DiscoveryProvider,
} from "./model";
import {
  ArrowIcon,
  AudienceIcon,
  BackIcon,
  CheckIcon,
  FilterIcon,
  PlusIcon,
  OrangeSliceIcon,
  SearchIcon,
  TrashIcon,
} from "./icons";
import { useWorkspacePermissions } from "../dashboard/workspace-permissions-context";
import { createCampaign } from "../campaigns/api";
import { withMockMode } from "../mock-mode";
import "./audiences.css";

type View = "library" | "builder";

function readableProvider(provider: string) {
  return provider.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export default function Audiences() {
  const { canWrite } = useWorkspacePermissions();
  const [view, setView] = useState<View>("library");
  const [audiences, setAudiences] = useState<AudienceSummary[]>([]);
  const [selectedAudience, setSelectedAudience] = useState<Audience | null>(null);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [filters, setFilters] = useState<AudienceFilters>(EMPTY_FILTERS);
  const [results, setResults] = useState<DiscoveryResult | null>(null);
  const [sourceProvider, setSourceProvider] = useState<"orange_slice" | "workspace">("orange_slice");
  const [providerStatuses, setProviderStatuses] = useState<DiscoveryProvider[]>([]);
  const [providerStatusLoading, setProviderStatusLoading] = useState(true);
  const [selectedRecords, setSelectedRecords] = useState<Set<string>>(new Set());
  const [discovering, setDiscovering] = useState(false);
  const [saving, setSaving] = useState(false);
  const [campaignPrompt, setCampaignPrompt] = useState<Audience | null>(null);
  const [campaignCreating, setCampaignCreating] = useState(false);
  const [campaignError, setCampaignError] = useState<string | null>(null);
  const campaignButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    let current = true;
    listAudiences()
      .then((rows) => {
        if (current) setAudiences(rows);
      })
      .catch((reason: unknown) => {
        if (current) {
          setLoadFailed(true);
          setError(reason instanceof Error ? reason.message : "Lead lists could not load.");
        }
      })
      .finally(() => {
        if (current) setLoading(false);
      });
    return () => {
      current = false;
    };
  }, []);

  useEffect(() => {
    let current = true;
    getDiscoveryStatus()
      .then((status) => {
        if (!current) return;
        setSourceProvider(status.defaultProvider);
        setProviderStatuses(status.providers);
      })
      .catch(() => {
        if (!current) return;
        setProviderStatuses([
          { provider: "orange_slice", label: "Orange Slice", configured: false },
          { provider: "workspace", label: "Workspace leads", configured: true },
        ]);
      })
      .finally(() => {
        if (current) setProviderStatusLoading(false);
      });
    return () => {
      current = false;
    };
  }, []);

  const filteredAudiences = useMemo(
    () => filterAudiences(audiences, query),
    [audiences, query],
  );

  function startBuilder() {
    setView("builder");
    setName("");
    setDescription("");
    setFilters(EMPTY_FILTERS);
    setResults(null);
    setSelectedRecords(new Set());
    setError(null);
  }

  const activeProvider = providerStatuses.find(
    (provider) => provider.provider === sourceProvider,
  );

  async function openAudience(id: string) {
    setDetailLoading(true);
    setError(null);
    try {
      setSelectedAudience(await getAudience(id));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "This lead list could not load.");
    } finally {
      setDetailLoading(false);
    }
  }

  async function runDiscovery(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setDiscovering(true);
    setError(null);
    try {
      const nextResults = await discoverAudienceLeads(filters, sourceProvider);
      setResults(nextResults);
      const available = new Set(nextResults.candidates.map((candidate) => candidate.providerRecordId));
      setSelectedRecords((current) => new Set([...current].filter((id) => available.has(id))));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Lead discovery could not run.");
    } finally {
      setDiscovering(false);
    }
  }

  async function saveAudience() {
    if (!name.trim() || selectedRecords.size === 0 || !results) return;
    setSaving(true);
    setError(null);
    try {
      const selected = results.candidates.filter((candidate) =>
        selectedRecords.has(candidate.providerRecordId),
      );
      const created = await createAudience({
        name: name.trim(),
        description: description.trim(),
        sourceProvider: results.provider,
        discoveryFilters: filters,
        leadIds: selected.flatMap((candidate) => candidate.leadId ? [candidate.leadId] : []),
        providerRecordIds: selected
          .filter((candidate) => candidate.leadId === null)
          .map((candidate) => candidate.providerRecordId),
      });
      setAudiences((current) => [created, ...current]);
      setSelectedAudience(created);
      setView("library");
      setCampaignError(null);
      setCampaignPrompt(created);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "The lead list could not be saved.");
    } finally {
      setSaving(false);
    }
  }

  async function startCampaign(audience: Audience) {
    if (!canWrite || campaignCreating) return;
    setCampaignCreating(true);
    setCampaignError(null);
    try {
      const campaign = await createCampaign({ audienceId: audience.id });
      window.location.href = withMockMode(
        `/dashboard/campaigns/${encodeURIComponent(campaign.id)}`,
      );
    } catch (reason) {
      setCampaignError(
        reason instanceof Error ? reason.message : "The campaign could not be created.",
      );
      setCampaignCreating(false);
    }
  }

  function closeCampaignPrompt() {
    if (campaignCreating) return;
    setCampaignPrompt(null);
    setCampaignError(null);
    requestAnimationFrame(() => campaignButtonRef.current?.focus());
  }

  async function removeAudience() {
    if (!selectedAudience) return;
    const shouldDelete = window.confirm(`Delete “${selectedAudience.name}”? This will not delete its leads.`);
    if (!shouldDelete) return;
    setError(null);
    try {
      await deleteAudience(selectedAudience.id);
      setAudiences((current) => current.filter((item) => item.id !== selectedAudience.id));
      setSelectedAudience(null);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "The lead list could not be deleted.");
    }
  }

  if (view === "builder") {
    return (
      <section className="audience-page audience-builder" aria-labelledby="audience-builder-heading">
        <button className="audience-back" type="button" onClick={() => setView("library")}>
          <BackIcon size={16} /> Back to lead lists
        </button>

        <header className="audience-heading audience-heading-builder">
          <div>
            <h1 id="audience-builder-heading">Build a lead list</h1>
          </div>
          <div className="audience-builder-fields">
            <label>
              <span>List name</span>
              <input value={name} onChange={(event) => setName(event.target.value)} placeholder="Qualified founders" maxLength={255} />
            </label>
            <label>
              <span>Description <small>Optional</small></span>
              <input value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Who belongs in this audience" maxLength={20000} />
            </label>
          </div>
        </header>

        {error && <div className="audience-error" role="alert">{error}</div>}

        <div className="audience-provider-picker">
          <span className="audience-provider-label">Source</span>
          <div role="radiogroup" aria-label="Lead discovery source" className="audience-provider-options">
            {(["orange_slice", "workspace"] as const).map((providerId) => {
              const status = providerStatuses.find((provider) => provider.provider === providerId);
              const selected = sourceProvider === providerId;
              return (
                <button
                  key={providerId}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  className={`audience-provider-option ${selected ? "is-selected" : ""}`}
                  onClick={() => {
                    setSourceProvider(providerId);
                    setResults(null);
                    setSelectedRecords(new Set());
                    setError(null);
                  }}
                >
                  <span className="audience-provider-icon">
                    {providerId === "orange_slice" ? <OrangeSliceIcon size={17} /> : <AudienceIcon size={17} />}
                  </span>
                  <strong>{status?.label ?? (providerId === "orange_slice" ? "Orange Slice" : "Workspace leads")}</strong>
                  <span className={`audience-provider-state ${status?.configured ? "is-connected" : ""}`}>
                    {providerStatusLoading ? "Checking" : status?.configured ? "Connected" : "Not connected"}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <form className="audience-discovery-form" onSubmit={runDiscovery}>
          <div className="audience-filter-title"><FilterIcon size={16} /><span>Discovery filters</span></div>
          <label className="audience-filter-search">
            <span>Result text <small>Optional</small></span>
            <div><SearchIcon size={16} /><input value={filters.query} onChange={(event) => setFilters({ ...filters, query: event.target.value })} placeholder="Name, title, or company text" /></div>
          </label>
          <label>
            <span>Seed domains</span>
            <input value={filters.company} onChange={(event) => setFilters({ ...filters, company: event.target.value })} placeholder="stripe.com, brex.com" />
          </label>
          <label>
            <span>Role</span>
            <input value={filters.title} onChange={(event) => setFilters({ ...filters, title: event.target.value })} placeholder="Founder, VP Sales…" />
          </label>
          <button className="audience-primary audience-find" type="submit" disabled={discovering || providerStatusLoading || !activeProvider?.configured}>
            {discovering ? "Searching…" : "Find leads"}
          </button>
        </form>

        <div className="audience-results" aria-live="polite" aria-busy={discovering}>
          <div className="audience-results-head">
            <div>
              <h2>Lead discovery</h2>
              <p>{results ? `${results.candidates.length} results from ${results.providerLabel}` : `${activeProvider?.label ?? "Lead source"} results appear here.`}</p>
            </div>
            {selectedRecords.size > 0 && <span className="audience-selection-count">{selectedRecords.size} selected</span>}
          </div>

          {discovering ? (
            <div className="audience-state"><span className="audience-spinner" aria-hidden="true" /><p>Searching the connected source…</p></div>
          ) : !results ? (
            <div className="audience-state"><SearchIcon size={23} /><h3>{activeProvider?.configured === false ? `${activeProvider.label} is not connected` : "Start a focused search"}</h3><p>{activeProvider?.configured === false ? "Choose Workspace leads or connect the server credential." : "Add a domain, role, or search term."}</p></div>
          ) : results.candidates.length === 0 ? (
            <div className="audience-state"><AudienceIcon size={24} /><h3>No matching leads</h3><p>Broaden a filter and run discovery again.</p></div>
          ) : (
            <div className="audience-table-wrap">
              <table className="audience-table">
                <thead><tr><th scope="col"><span className="audience-visually-hidden">Select</span></th><th scope="col">Person</th><th scope="col">Company</th><th scope="col">Contact</th><th scope="col">Stage</th></tr></thead>
                <tbody>
                  {results.candidates.map((candidate) => {
                    const selected = selectedRecords.has(candidate.providerRecordId);
                    return (
                      <tr key={`${candidate.providerRecordId}-${candidate.leadId}`} className={selected ? "is-selected" : ""}>
                        <td><label className="audience-check"><input type="checkbox" checked={selected} onChange={() => setSelectedRecords((current) => toggleLead(current, candidate.providerRecordId))} /><span aria-hidden="true">{selected && <CheckIcon size={14} />}</span><span className="audience-visually-hidden">Select {candidate.name}</span></label></td>
                        <td><strong>{candidate.name}</strong><span>{candidate.title}</span></td>
                        <td>{candidate.company}</td>
                        <td><span>{candidate.email}</span>{candidate.linkedinUrl && <a href={candidate.linkedinUrl} target="_blank" rel="noreferrer">LinkedIn</a>}</td>
                        <td><span className="audience-stage">{stageLabel(candidate.stage)}</span></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <footer className="audience-builder-footer">
          <p>{selectedRecords.size === 0 ? "Select at least one lead to save this audience." : `${selectedRecords.size} selected people will be added to this audience.`}</p>
          <button className="audience-primary" type="button" onClick={saveAudience} disabled={saving || !name.trim() || selectedRecords.size === 0}>
            <CheckIcon size={16} /> {saving ? "Saving…" : "Create audience"}
          </button>
        </footer>
      </section>
    );
  }

  return (
    <section className="audience-page" aria-labelledby="audiences-heading">
      <header className="audience-heading">
        <h1 id="audiences-heading">Lead lists</h1>
        {canWrite ? (
          <button className="audience-primary" type="button" onClick={startBuilder} data-testid="new-audience"><PlusIcon size={17} /> New audience</button>
        ) : (
          <span className="audience-read-only">Read-only access</span>
        )}
      </header>

      {error && !loadFailed && <div className="audience-error" role="alert">{error}</div>}

      <div className="audience-library-grid">
        <div className="audience-library">
          <label className="audience-library-search"><SearchIcon size={16} /><span className="audience-visually-hidden">Search lead lists</span><input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search lead lists" /></label>
          <div className="audience-list" aria-busy={loading} aria-live="polite">
            {loading ? (
              <div className="audience-state"><span className="audience-spinner" aria-hidden="true" /><p>Loading lead lists…</p></div>
            ) : loadFailed ? (
              <div className="audience-state" role="alert"><AudienceIcon size={24} /><h2>Lead lists are unavailable</h2><p>We could not load this workspace. Try again before creating or changing an audience.</p><button className="audience-secondary" type="button" onClick={() => window.location.reload()}>Try again</button></div>
            ) : filteredAudiences.length === 0 ? (
              <div className="audience-state"><AudienceIcon size={24} /><h2>{audiences.length === 0 ? "No lead lists yet" : "No lead lists match"}</h2><p>{audiences.length === 0 ? canWrite ? "Create an audience from your discovery source." : "An owner or admin can create the first audience." : "Try a broader search."}</p>{audiences.length === 0 && canWrite && <button className="audience-secondary" type="button" onClick={startBuilder}>Build the first audience</button>}</div>
            ) : filteredAudiences.map((audience) => (
              <button key={audience.id} className={`audience-list-row ${selectedAudience?.id === audience.id ? "is-active" : ""}`} type="button" onClick={() => openAudience(audience.id)}>
                <span className="audience-list-icon"><AudienceIcon size={18} /></span>
                <span className="audience-list-copy"><strong>{audience.name}</strong><span>{audience.description || "No description"}</span></span>
                <span className="audience-list-meta"><strong>{audience.memberCount}</strong><small>{audience.memberCount === 1 ? "lead" : "leads"}</small></span>
                <span className="audience-list-meta audience-source"><strong>{readableProvider(audience.sourceProvider)}</strong><small>source</small></span>
                <span className="audience-list-date"><small>Updated</small><span>{formatAudienceDate(audience.updatedAt)}</span></span>
                <ArrowIcon size={16} />
              </button>
            ))}
          </div>
        </div>

        <aside className={`audience-detail ${selectedAudience ? "has-audience" : ""}`} aria-label="Lead list details" aria-busy={detailLoading}>
          {detailLoading ? (
            <div className="audience-state"><span className="audience-spinner" aria-hidden="true" /><p>Loading audience…</p></div>
          ) : selectedAudience ? (
            <>
              <div className="audience-detail-head">
                <div><span>{readableProvider(selectedAudience.sourceProvider)}</span><h2>{selectedAudience.name}</h2><p>{selectedAudience.description || "No description added."}</p></div>
                {canWrite && (
                  <div className="audience-detail-actions">
                    <button ref={campaignButtonRef} className="audience-secondary audience-build-campaign" type="button" onClick={() => void startCampaign(selectedAudience)} disabled={campaignCreating} data-testid="build-audience-campaign">
                      {campaignCreating ? "Creating…" : "Build campaign"} <ArrowIcon size={15} />
                    </button>
                    <button className="audience-icon-button" type="button" onClick={removeAudience} aria-label={`Delete ${selectedAudience.name}`}><TrashIcon size={17} /></button>
                  </div>
                )}
              </div>
              <div className="audience-detail-count"><strong>{selectedAudience.memberCount}</strong><span>{selectedAudience.memberCount === 1 ? "person" : "people"} in this reusable list</span></div>
              <div className="audience-member-list">
                {selectedAudience.members.map((member) => (
                  <div className="audience-member" key={member.leadId}>
                    <span className="audience-member-avatar" aria-hidden="true">{member.name.slice(0, 1).toUpperCase()}</span>
                    <span><strong>{member.name}</strong><small>{member.title} · {member.company}</small></span>
                    {!member.contactable ? (
                      <span className="audience-member-muted">Unavailable</span>
                    ) : !member.outreachEligible ? (
                      <span className="audience-member-muted">Needs qualification</span>
                    ) : null}
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="audience-state audience-detail-empty"><AudienceIcon size={24} /><h2>Select a lead list</h2><p>Open an audience to review exactly who it contains.</p></div>
          )}
        </aside>
      </div>

      {campaignPrompt && (
        <AudienceCampaignPrompt
          audience={campaignPrompt}
          creating={campaignCreating}
          error={campaignError}
          onClose={closeCampaignPrompt}
          onCreate={() => void startCampaign(campaignPrompt)}
        />
      )}
    </section>
  );
}

function AudienceCampaignPrompt({
  audience,
  creating,
  error,
  onClose,
  onCreate,
}: {
  audience: Audience;
  creating: boolean;
  error: string | null;
  onClose: () => void;
  onCreate: () => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const returnFocusRef = useRef<HTMLElement | null>(
    typeof document !== "undefined" && document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null,
  );

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    const returnFocus = returnFocusRef.current;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    dialog.showModal();
    return () => {
      if (dialog.open) dialog.close();
      document.body.style.overflow = previousOverflow;
      if (returnFocus?.isConnected) returnFocus.focus();
    };
  }, []);

  return (
    <dialog
      ref={dialogRef}
      className="audience-campaign-dialog"
      aria-labelledby="audience-campaign-heading"
      onCancel={(event) => {
        event.preventDefault();
        if (!creating) onClose();
      }}
      onKeyDown={(event) => {
        if (event.key !== "Escape") return;
        event.preventDefault();
        if (!creating) onClose();
      }}
    >
      <span className="audience-campaign-kicker"><CheckIcon size={15} /> Audience saved</span>
      <h2 id="audience-campaign-heading">Build the campaign now?</h2>
      <p>{audience.name} · {audience.memberCount} {audience.memberCount === 1 ? "lead" : "leads"}</p>
      {error && <div className="audience-error" role="alert">{error}</div>}
      <div className="audience-campaign-actions">
        <button className="audience-secondary" type="button" onClick={onClose} disabled={creating} autoFocus>Not now</button>
        <button className="audience-primary" type="button" onClick={onCreate} disabled={creating}>
          {creating ? "Creating…" : "Set sequence & schedule"} <ArrowIcon size={15} />
        </button>
      </div>
    </dialog>
  );
}
