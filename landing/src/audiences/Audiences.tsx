import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";
import {
  createAudience,
  deleteAudience,
  discoverAudienceLeads,
  getDiscoveryStatus,
  getAudience,
  listAudiences,
  uploadLeadList,
} from "./api";
import {
  EMPTY_FILTERS,
  filterAudiences,
  formatAudienceDate,
  providerLabel,
  summarizeLeadImport,
  stageLabel,
  toggleLead,
  type Audience,
  type AudienceFilters,
  type AudienceSummary,
  type DiscoveryResult,
  type DiscoveryProvider,
  type LeadImportNotice,
} from "./model";
import {
  ArrowIcon,
  AudienceIcon,
  BackIcon,
  CheckIcon,
  PlusIcon,
  OrangeSliceIcon,
  SearchIcon,
  TrashIcon,
  UploadIcon,
} from "./icons";
import { useWorkspacePermissions } from "../dashboard/workspace-permissions-context";
import { createCampaign } from "../campaigns/api";
import { withMockMode } from "../mock-mode";
import "./audiences.css";

type View = "library" | "builder";
type BuilderTab = "search" | "details";

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
  const [builderTab, setBuilderTab] = useState<BuilderTab>("search");
  const [resultQuery, setResultQuery] = useState("");
  const [providerStatuses, setProviderStatuses] = useState<DiscoveryProvider[]>([]);
  const [providerStatusLoading, setProviderStatusLoading] = useState(true);
  const [importing, setImporting] = useState(false);
  const [importName, setImportName] = useState("");
  const [importNotice, setImportNotice] = useState<LeadImportNotice | null>(null);
  const [selectedRecords, setSelectedRecords] = useState<Set<string>>(new Set());
  const [discovering, setDiscovering] = useState(false);
  const [saving, setSaving] = useState(false);
  const [campaignPrompt, setCampaignPrompt] = useState<Audience | null>(null);
  const [campaignCreating, setCampaignCreating] = useState(false);
  const [campaignError, setCampaignError] = useState<string | null>(null);
  const campaignButtonRef = useRef<HTMLButtonElement>(null);
  const uploadInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let current = true;
    listAudiences()
      .then((rows) => {
        if (current) setAudiences(rows);
      })
      .catch((reason: unknown) => {
        if (current) {
          setLoadFailed(true);
          setError(reason instanceof Error ? reason.message : "Audiences could not load.");
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
    setBuilderTab("search");
    setResultQuery("");
    setImportNotice(null);
    setSelectedRecords(new Set());
    setError(null);
  }

  const activeProvider = providerStatuses.find(
    (provider) => provider.provider === "orange_slice",
  );
  const visibleCandidates = useMemo(() => {
    if (!results) return [];
    const normalized = resultQuery.trim().toLowerCase();
    if (!normalized) return results.candidates;
    return results.candidates.filter((candidate) =>
      [candidate.name, candidate.title, candidate.company]
        .join(" ")
        .toLowerCase()
        .includes(normalized),
    );
  }, [resultQuery, results]);

  async function openAudience(id: string) {
    setDetailLoading(true);
    setError(null);
    try {
      setSelectedAudience(await getAudience(id));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "This audience could not load.");
    } finally {
      setDetailLoading(false);
    }
  }

  async function runDiscovery(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setDiscovering(true);
    setError(null);
    try {
      const nextResults = await discoverAudienceLeads(filters, "orange_slice");
      setResults(nextResults);
      const available = new Set(nextResults.candidates.map((candidate) => candidate.providerRecordId));
      setSelectedRecords((current) => new Set([...current].filter((id) => available.has(id))));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Lead discovery could not run.");
    } finally {
      setDiscovering(false);
    }
  }

  async function handleLeadUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file || importing) return;
    setImporting(true);
    setImportNotice(null);
    try {
      const result = await uploadLeadList(file, importName);
      setImportNotice(summarizeLeadImport(result));
      const audience = result.audience;
      if (audience) {
        // The upload created or refreshed an audience: land the reader on the
        // library with that audience open, so the import visibly changes the
        // page it happened on.
        setView("library");
        void openAudience(audience.id);
        try {
          setAudiences(await listAudiences());
        } catch {
          // The import itself succeeded; a failed library refresh must not
          // repaint the outcome as an error.
        }
      }
    } catch (reason) {
      setImportNotice({
        kind: "error",
        message: reason instanceof Error ? reason.message : "The CSV could not be imported.",
      });
    } finally {
      setImporting(false);
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
      setError(reason instanceof Error ? reason.message : "The audience could not be saved.");
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
      setError(reason instanceof Error ? reason.message : "The audience could not be deleted.");
    }
  }

  if (view === "builder") {
    const hasSearchFilter = Object.values(filters).some((value) => value.trim());
    const allVisibleSelected =
      visibleCandidates.length > 0 &&
      visibleCandidates.every((candidate) => selectedRecords.has(candidate.providerRecordId));
    return (
      <section className="audience-builder-workbench" aria-labelledby="audience-builder-heading">
        <div className="audience-builder-canvas">
          <header className="audience-builder-bar">
            <button className="audience-builder-back" type="button" onClick={() => setView("library")} aria-label="Back to audiences">
              <BackIcon size={16} />
            </button>
            <div>
              <h1 id="audience-builder-heading">{name.trim() || "Untitled audience"}</h1>
              <span>{results ? `${results.candidates.length} results` : "New audience"}</span>
            </div>
            <label className="audience-result-search">
              <SearchIcon size={15} />
              <span className="audience-visually-hidden">Search results</span>
              <input type="search" value={resultQuery} onChange={(event) => setResultQuery(event.target.value)} placeholder="Search by name, title, or company" disabled={!results} />
            </label>
            {selectedRecords.size > 0 && <span className="audience-selection-count">{selectedRecords.size} selected</span>}
          </header>

          <div className="audience-results audience-results-canvas" aria-live="polite" aria-busy={discovering}>
            {discovering ? (
              <div className="audience-table-loading" aria-label="Searching for leads">
                {Array.from({ length: 9 }, (_, index) => <span key={index} />)}
              </div>
            ) : !results ? (
              <div className="audience-state audience-builder-empty"><SearchIcon size={23} /><h2>{activeProvider?.configured === false ? "Lead search is unavailable" : "Find people for this audience"}</h2><p>{activeProvider?.configured === false ? "Upload a CSV or ask an admin to connect Orange Slice." : "Describe who you're looking for in the panel."}</p></div>
            ) : results.candidates.length === 0 ? (
              <div className="audience-state audience-builder-empty"><AudienceIcon size={24} /><h2>No matching leads</h2><p>Adjust a criterion and search again.</p></div>
            ) : visibleCandidates.length === 0 ? (
              <div className="audience-state audience-builder-empty"><SearchIcon size={23} /><h2>No results match</h2><p>Clear the table search to see all discovered people.</p></div>
            ) : (
              <div className="audience-table-wrap">
                <table className="audience-table">
                  <thead><tr><th scope="col"><label className="audience-check"><input type="checkbox" checked={allVisibleSelected} onChange={() => setSelectedRecords((current) => {
                    const next = new Set(current);
                    for (const candidate of visibleCandidates) {
                      if (allVisibleSelected) next.delete(candidate.providerRecordId);
                      else next.add(candidate.providerRecordId);
                    }
                    return next;
                  })} aria-label="Select all visible leads" /><span aria-hidden="true">{allVisibleSelected && <CheckIcon size={14} />}</span></label></th><th scope="col">Name</th><th scope="col">Company</th><th scope="col">Job title</th><th scope="col">Contact</th><th scope="col">Stage</th></tr></thead>
                  <tbody>
                    {visibleCandidates.map((candidate) => {
                      const selected = selectedRecords.has(candidate.providerRecordId);
                      return (
                        <tr key={`${candidate.providerRecordId}-${candidate.leadId}`} className={selected ? "is-selected" : ""}>
                          <td><label className="audience-check"><input type="checkbox" checked={selected} onChange={() => setSelectedRecords((current) => toggleLead(current, candidate.providerRecordId))} /><span aria-hidden="true">{selected && <CheckIcon size={14} />}</span><span className="audience-visually-hidden">Select {candidate.name}</span></label></td>
                          <td><strong>{candidate.name}</strong></td>
                          <td>{candidate.company}</td>
                          <td>{candidate.title}</td>
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
        </div>

        <aside className="audience-search-panel" aria-label="Audience builder">
          <div className="audience-panel-tabs" role="tablist" aria-label="Audience controls">
            <button id="audience-search-tab" type="button" role="tab" aria-controls="audience-search-panel" aria-selected={builderTab === "search"} className={builderTab === "search" ? "is-active" : ""} onClick={() => setBuilderTab("search")}>Search</button>
            <button id="audience-details-tab" type="button" role="tab" aria-controls="audience-details-panel" aria-selected={builderTab === "details"} className={builderTab === "details" ? "is-active" : ""} onClick={() => setBuilderTab("details")}>Details</button>
          </div>

          {error && <div className="audience-error audience-panel-error" role="alert">{error}</div>}

          {builderTab === "search" ? (
            <form id="audience-search-panel" className="audience-search-form" role="tabpanel" aria-labelledby="audience-search-tab" onSubmit={runDiscovery}>
              <div className="audience-search-panel-head">
                <div className="audience-search-title">
                  <AudienceIcon size={18} />
                  <div><h2>Find people</h2><small className={activeProvider?.configured ? "is-connected" : ""}><OrangeSliceIcon size={12} /> {providerStatusLoading ? "Checking Orange Slice" : activeProvider?.configured ? "Orange Slice connected" : "Orange Slice offline"}</small></div>
                </div>
                <input
                  className="audience-upload-name"
                  type="text"
                  value={importName}
                  onChange={(e) => setImportName(e.target.value)}
                  placeholder="Audience name (optional)"
                  aria-label="Audience name for CSV upload"
                  disabled={importing}
                />
                <button className="audience-upload-button" type="button" onClick={() => uploadInputRef.current?.click()} disabled={importing}>
                  <UploadIcon size={14} /> {importing ? "Importing…" : "Upload CSV"}
                </button>
                <input ref={uploadInputRef} hidden type="file" accept=".csv,text/csv" onChange={handleLeadUpload} disabled={importing} />
              </div>

              {importNotice && <ImportNoticeCard notice={importNotice} />}

              <div className="audience-query-box">
                <SearchIcon size={17} />
                <input aria-label="Describe who you're looking for" value={filters.prompt} onChange={(event) => setFilters({ ...filters, prompt: event.target.value })} placeholder="Describe who you're looking for" />
                <button type="submit" aria-label="Run lead search" disabled={discovering || providerStatusLoading || !activeProvider?.configured || !hasSearchFilter}><ArrowIcon size={15} /></button>
              </div>

              <div className="audience-search-examples" aria-label="Example searches">
                <button type="button" onClick={() => setFilters({ ...EMPTY_FILTERS, prompt: "Founders at seed-stage B2B SaaS companies in the US" })}><SearchIcon size={13} /> Founders at seed-stage B2B SaaS companies in the US</button>
                <button type="button" onClick={() => setFilters({ ...EMPTY_FILTERS, prompt: "QA leaders at Series A consumer software companies" })}><SearchIcon size={13} /> QA leaders at Series A consumer software companies</button>
              </div>

              <div className="audience-panel-search-action">
                <button className="audience-secondary" type="submit" disabled={discovering || providerStatusLoading || !activeProvider?.configured || !hasSearchFilter}>{discovering ? "Searching…" : results ? "Update search" : "Find leads"}</button>
              </div>
            </form>
          ) : (
            <div id="audience-details-panel" className="audience-list-details-panel" role="tabpanel" aria-labelledby="audience-details-tab">
              <h2>Audience details</h2>
              <label><span>Audience name</span><input autoFocus value={name} onChange={(event) => setName(event.target.value)} placeholder="Qualified founders" maxLength={255} /></label>
              <label><span>Description <small>Optional</small></span><textarea value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Who belongs in this audience" maxLength={20000} rows={4} /></label>
              <dl><div><dt>Source</dt><dd>{results?.providerLabel ?? "Orange Slice"}</dd></div><div><dt>Selected</dt><dd>{selectedRecords.size}</dd></div><div><dt>Results</dt><dd>{results?.candidates.length ?? 0}</dd></div></dl>
            </div>
          )}

          <footer className="audience-panel-footer">
            <button className="audience-primary" type="button" onClick={saveAudience} disabled={saving || !name.trim() || selectedRecords.size === 0}>
              <CheckIcon size={16} /> {saving ? "Saving…" : selectedRecords.size > 0 ? `Save ${selectedRecords.size} to audience` : "Save to audience"}
            </button>
          </footer>
        </aside>
      </section>
    );
  }

  return (
    <section className="audience-page" aria-labelledby="audiences-heading">
      <header className="audience-heading">
        <h1 id="audiences-heading">Audiences</h1>
        {canWrite ? (
          <button className="audience-primary" type="button" onClick={startBuilder} data-testid="new-audience"><PlusIcon size={17} /> New audience</button>
        ) : (
          <span className="audience-read-only">Read-only access</span>
        )}
      </header>

      {importNotice && <ImportNoticeCard notice={importNotice} banner />}

      {error && !loadFailed && <div className="audience-error" role="alert">{error}</div>}

      <div className="audience-library-grid">
        <div className="audience-library">
          <label className="audience-library-search"><SearchIcon size={16} /><span className="audience-visually-hidden">Search audiences</span><input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search audiences" /></label>
          <div className="audience-list" aria-busy={loading} aria-live="polite">
            {loading ? (
              <div className="audience-state"><span className="audience-spinner" aria-hidden="true" /><p>Loading audiences…</p></div>
            ) : loadFailed ? (
              <div className="audience-state" role="alert"><AudienceIcon size={24} /><h2>Audiences are unavailable</h2><p>We could not load this workspace. Try again before creating or changing an audience.</p><button className="audience-secondary" type="button" onClick={() => window.location.reload()}>Try again</button></div>
            ) : filteredAudiences.length === 0 ? (
              <div className="audience-state"><AudienceIcon size={24} /><h2>{audiences.length === 0 ? "No audiences yet" : "No audiences match"}</h2><p>{audiences.length === 0 ? canWrite ? "Create an audience from your discovery source." : "An owner or admin can create the first audience." : "Try a broader search."}</p>{audiences.length === 0 && canWrite && <button className="audience-secondary" type="button" onClick={startBuilder}>Build the first audience</button>}</div>
            ) : filteredAudiences.map((audience) => (
              <button key={audience.id} className={`audience-list-row ${selectedAudience?.id === audience.id ? "is-active" : ""}`} type="button" onClick={() => openAudience(audience.id)}>
                <span className="audience-list-icon"><AudienceIcon size={18} /></span>
                <span className="audience-list-copy"><strong>{audience.name}</strong><span>{audience.description || "No description"}</span></span>
                <span className="audience-list-meta"><strong>{audience.memberCount}</strong><small>{audience.memberCount === 1 ? "lead" : "leads"}</small></span>
                <span className="audience-list-meta audience-source"><strong>{providerLabel(audience.sourceProvider)}</strong><small>source</small></span>
                <span className="audience-list-date"><small>Updated</small><span>{formatAudienceDate(audience.updatedAt)}</span></span>
                <ArrowIcon size={16} />
              </button>
            ))}
          </div>
        </div>

        <aside className={`audience-detail ${selectedAudience ? "has-audience" : ""}`} aria-label="Audience details" aria-busy={detailLoading}>
          {detailLoading ? (
            <div className="audience-state"><span className="audience-spinner" aria-hidden="true" /><p>Loading audience…</p></div>
          ) : selectedAudience ? (
            <>
              <div className="audience-detail-head">
                <div><span>{providerLabel(selectedAudience.sourceProvider)}</span><h2>{selectedAudience.name}</h2><p>{selectedAudience.description || "No description added."}</p></div>
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
            <div className="audience-state audience-detail-empty"><AudienceIcon size={24} /><h2>Select an audience</h2><p>Open an audience to review exactly who it contains.</p></div>
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

function ImportNoticeCard({
  notice,
  banner = false,
}: {
  notice: LeadImportNotice;
  banner?: boolean;
}) {
  return (
    <div
      className={`audience-import-notice${banner ? " audience-import-banner" : ""} is-${notice.kind}`}
      role={notice.kind === "error" ? "alert" : "status"}
    >
      <div className="audience-import-copy">
        <span>{notice.message}</span>
        {notice.details && notice.details.length > 0 && (
          <ul>
            {notice.details.map((detail, index) => (
              <li key={index}>{detail}</li>
            ))}
          </ul>
        )}
        {notice.hint && <small>{notice.hint}</small>}
      </div>
      {notice.kind === "success" && <a href={withMockMode("/dashboard/leads")}>View leads</a>}
    </div>
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
