import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { createLinkAsset, deleteAsset, listAssetAgents, listAssets, updateAssetAssignments, uploadAsset } from "./api";
import {
  assetAssignmentLabel,
  assetAssignmentsReady,
  assetKindLabel,
  filterAssets,
  formatBytes,
  type AssetFilter,
  type AssetAgent,
  type AssetAssignmentMode,
  type AssetKind,
  type CompanyAsset,
} from "./model";
import { useWorkspacePermissions } from "../dashboard/workspace-permissions-context";
import {
  CloseIcon,
  ExternalIcon,
  ImageIcon,
  LinkIcon,
  SearchIcon,
  TrashIcon,
  UploadIcon,
} from "./icons";
import { AssetFileDropzone } from "./AssetFileDropzone";
import { AssetThumbnail, AssetViewer } from "./AssetViewer";
import { AssetAddMenu } from "./AssetAddMenu";
import { ASSET_DESTINATIONS } from "./destinations";
import { UPLOAD_OPTIONS, uploadDestinationError, type UploadDestination } from "./upload-options";
import "./assets.css";

const FILTERS: Array<{ id: AssetFilter; label: string }> = [
  { id: "all", label: "All assets" },
  ...ASSET_DESTINATIONS,
];

type Composer = { type: "upload"; destination: UploadDestination; file?: File } | { type: "link"; destination: "link" | "repo" } | null;

function domainFor(url: string | null): string {
  if (!url) return "";
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}


export default function Assets() {
  const { canWrite } = useWorkspacePermissions();
  const [assets, setAssets] = useState<CompanyAsset[]>([]);
  const [agents, setAgents] = useState<AssetAgent[]>([]);
  const [filter, setFilter] = useState<AssetFilter>("all");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);
  const [viewingAsset, setViewingAsset] = useState<CompanyAsset | null>(null);
  const [composer, setComposer] = useState<Composer>(null);
  const composerTriggerRef = useRef<HTMLElement | null>(null);
  const [assignmentAsset, setAssignmentAsset] = useState<CompanyAsset | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [agentsLoading, setAgentsLoading] = useState(true);
  const [agentsError, setAgentsError] = useState(false);
  const [agentsErrorVisible, setAgentsErrorVisible] = useState(false);
  const [armedDeleteId, setArmedDeleteId] = useState<string | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);

  useEffect(() => {
    function preventFileNavigation(event: globalThis.DragEvent) {
      if (event.dataTransfer?.types.includes("Files")) event.preventDefault();
    }
    window.addEventListener("dragover", preventFileNavigation);
    window.addEventListener("drop", preventFileNavigation);
    return () => {
      window.removeEventListener("dragover", preventFileNavigation);
      window.removeEventListener("drop", preventFileNavigation);
    };
  }, []);

  /* An armed Remove disarms itself after a beat — no stale confirm buttons
     (the Review-queue arm-then-confirm idiom). */
  useEffect(() => {
    if (!armedDeleteId) return;
    const timer = window.setTimeout(() => setArmedDeleteId(null), 5000);
    return () => window.clearTimeout(timer);
  }, [armedDeleteId]);

  useEffect(() => {
    let current = true;
    listAssets()
      .then((rows) => {
        if (current) setAssets(rows);
      })
      .catch((reason: unknown) => {
        if (current) {
          setLoadFailed(true);
          setError(reason instanceof Error ? reason.message : "Assets could not load.");
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
    listAssetAgents()
      .then((rows) => {
        if (current) setAgents(rows);
      })
      .catch(() => {
        if (current) {
          setAgentsError(true);
          setAgentsErrorVisible(true);
        }
      })
      .finally(() => {
        if (current) setAgentsLoading(false);
      });
    return () => { current = false; };
  }, []);

  const visible = useMemo(
    () => filterAssets(assets, filter, query),
    [assets, filter, query],
  );
  const assignmentsReady = assetAssignmentsReady(agentsLoading, agentsError);
  const destination = ASSET_DESTINATIONS.find((item) => item.id === filter);
  const ViewIcon = destination?.icon ?? ImageIcon;
  const viewAction = filter === "all" ? "Add asset" : filter === "link" ? "Add link" : UPLOAD_OPTIONS[filter].action;

  function openComposer(kind: AssetKind, file?: File) {
    composerTriggerRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    setComposer(kind === "link" ? { type: "link", destination: kind } : { type: "upload", destination: kind, file });
  }

  function closeComposer() {
    setComposer(null);
    requestAnimationFrame(() => composerTriggerRef.current?.focus());
  }

  function addAsset(asset: CompanyAsset) {
    setAssets((current) => [asset, ...current]);
    setFilter(asset.kind);
    setQuery("");
    closeComposer();
    setError(null);
  }

  function updateAsset(asset: CompanyAsset) {
    setAssets((current) => current.map((candidate) => candidate.id === asset.id ? asset : candidate));
    setAssignmentAsset(null);
    setError(null);
  }

  /* First press arms the card's Remove ("Remove? Confirm"), the second
     executes. One in-flight delete at a time; the busy state disables the
     button so a double-click can't send two DELETEs. */
  async function removeAsset(asset: CompanyAsset) {
    if (removingId) return;
    if (armedDeleteId !== asset.id) {
      setArmedDeleteId(asset.id);
      return;
    }
    setArmedDeleteId(null);
    setRemovingId(asset.id);
    setError(null);
    try {
      await deleteAsset(asset.id);
      setAssets((current) => current.filter((candidate) => candidate.id !== asset.id));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "The asset could not be removed.");
    } finally {
      setRemovingId(null);
    }
  }

  return (
    <section className="asset-page" aria-labelledby="assets-heading">
      <header className="asset-page-heading">
        <h1 id="assets-heading">Assets</h1>
        {canWrite ? (
          <div className="asset-heading-actions">
            <AssetAddMenu onChoose={openComposer} />
          </div>
        ) : <span className="asset-read-only">Read-only access</span>}
      </header>

      {error && !loadFailed && (
        <div className="asset-error" role="alert">
          <span>{error}</span>
          <button type="button" onClick={() => setError(null)}>Dismiss</button>
        </div>
      )}

      {agentsErrorVisible && !loadFailed && (
        <div className="asset-error" role="alert">
          <span>Agent access details are temporarily unavailable. Assets remain viewable.</span>
          <button type="button" onClick={() => setAgentsErrorVisible(false)}>Dismiss</button>
        </div>
      )}

      <div className="asset-toolbar">
        {/* Filter buttons, not ARIA tabs: no roving tabindex or arrow-key
            contract here, so the honest semantics are a group of toggles. */}
        <div className="asset-filters" role="group" aria-label="Asset type">
          {FILTERS.map((item) => {
            const count = item.id === "all"
              ? assets.length
              : assets.filter((asset) => asset.kind === item.id).length;
            return (
              <button
                key={item.id}
                type="button"
                className={filter === item.id ? "is-active" : ""}
                onClick={() => setFilter(item.id)}
                aria-pressed={filter === item.id}
              >
                {item.label}<span>{count}</span>
              </button>
            );
          })}
        </div>
        <label className="asset-search">
          <SearchIcon size={16} />
          <span className="sr-only">Search assets</span>
          <input
            type="search"
            placeholder="Search names, notes, or tags"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </label>
      </div>

      <div className="asset-view-heading">
        <div>
          <h2>{destination?.label ?? "All assets"}</h2>
          <p>{destination?.description ?? "Files and references your agents can use."}</p>
        </div>
        {canWrite && filter === "all" && <AssetAddMenu onChoose={openComposer} secondary />}
        {canWrite && filter === "link" && <button className="asset-button asset-button-secondary" type="button" onClick={() => openComposer("link")}><LinkIcon size={16} /> Add link</button>}
        {canWrite && filter === "repo" && <button className="asset-button asset-button-secondary" type="button" onClick={(event) => { composerTriggerRef.current = event.currentTarget; setComposer({ type: "link", destination: "repo" }); }}><LinkIcon size={16} /> Add repository URL</button>}
      </div>
      {canWrite && filter !== "all" && filter !== "link" && (
        <AssetFileDropzone key={filter} destination={filter} compact onFile={(file) => { if (file) openComposer(filter, file); }} />
      )}

      <div className="asset-library" aria-live="polite" aria-busy={loading}>
        {loading ? (
          /* Card skeletons mirror the loaded grid so nothing jumps when the
             library lands (ux-principles rules 1+2). */
          <>
            <p className="sr-only" role="status">Loading private assets…</p>
            <div className="asset-grid" aria-hidden="true">
              {[0, 1, 2, 3, 4, 5].map((index) => (
                <div className="asset-card asset-card-skeleton" key={index}>
                  <div className="asset-visual asset-skel-visual" />
                  <div className="asset-card-body">
                    <span className="asset-skel asset-skel-kind" />
                    <span className="asset-skel asset-skel-title" />
                    <span className="asset-skel asset-skel-line" />
                    <span className="asset-skel asset-skel-line-short" />
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : loadFailed ? (
          <div className="asset-state" role="alert"><ImageIcon size={27} /><h2>Assets are unavailable</h2><p>We could not load the private library. Try again before adding or changing an asset.</p><button className="asset-button asset-button-secondary" type="button" onClick={() => window.location.reload()}>Try again</button></div>
        ) : visible.length === 0 ? (
          <div className="asset-state">
            <ViewIcon size={27} />
            <h2>{query.trim() ? "No assets match your search" : destination ? `No ${destination.label.toLowerCase()} yet` : "Your asset library is empty"}</h2>
            <p>{query.trim() ? "Try another search or clear it to see this tab’s assets." : canWrite ? destination ? `Add your first ${filter === "repo" ? "repository" : filter === "audio" ? "audio file" : filter} to this tab.` : "Choose the type of asset you want to add." : "An owner or admin can add assets to this tab."}</p>
            {query.trim() ? (
              <button className="asset-button asset-button-secondary" type="button" onClick={() => setQuery("")}>Clear search</button>
            ) : canWrite && filter !== "all" ? (
              <button className="asset-button asset-button-secondary" type="button" onClick={() => openComposer(filter)}>
                {filter === "link" ? <LinkIcon size={16} /> : <UploadIcon size={16} />}{viewAction}
              </button>
            ) : null}
          </div>
        ) : (
          <div className="asset-grid">
            {visible.map((asset) => {
              /* Links and URL-backed repos open the URL. Media previews in
                 the viewer. File-backed skills and repos only download. */
              const destination = asset.kind === "link" || asset.kind === "repo" ? asset.externalUrl : null;
              const previewable = asset.kind === "image" || asset.kind === "video" || asset.kind === "audio";
              const downloadOnly = (asset.kind === "skill" || asset.kind === "repo") && asset.contentUrl;
              const armed = armedDeleteId === asset.id;
              const removing = removingId === asset.id;
              return (
                <article className="asset-card" key={asset.id}>
                  {destination ? (
                    <a className="asset-visual" href={destination} target="_blank" rel="noreferrer" aria-label={`Open ${asset.name}`}>
                      <AssetThumbnail asset={asset} />
                      <span className="asset-open-mark"><ExternalIcon size={14} /></span>
                    </a>
                  ) : downloadOnly ? (
                    <a className="asset-visual" href={asset.contentUrl ?? undefined} download={asset.originalFilename || asset.name} aria-label={`Download ${asset.name}`}>
                      <AssetThumbnail asset={asset} />
                      <span className="asset-preview-label">Download</span>
                    </a>
                  ) : previewable && asset.contentUrl ? (
                    <button className="asset-visual" type="button" onClick={() => setViewingAsset(asset)} aria-label={`Preview ${asset.name}`} aria-haspopup="dialog">
                      <AssetThumbnail asset={asset} />
                      <span className="asset-preview-label">{asset.kind === "image" ? "View image" : asset.kind === "video" ? "Play video" : "Play audio"}</span>
                    </button>
                  ) : (
                    <div className="asset-visual"><AssetThumbnail asset={asset} /></div>
                  )}
                  <div className="asset-card-body">
                    <div className="asset-card-title">
                      <div>
                        <span className={`asset-kind asset-kind-${asset.kind}`}>{assetKindLabel(asset.kind)}</span>
                        <h2>{asset.name}</h2>
                      </div>
                      {canWrite && (
                        <button
                          className={`asset-delete${armed ? " is-armed" : ""}`}
                          type="button"
                          onClick={() => void removeAsset(asset)}
                          disabled={removing}
                          aria-label={
                            removing
                              ? `Removing ${asset.name}`
                              : armed
                                ? `Confirm removing ${asset.name}`
                                : `Remove ${asset.name}`
                          }
                          title={armed || removing ? undefined : "Remove asset"}
                        >
                          {removing ? (
                            <span className="asset-delete-spinner" aria-hidden="true" />
                          ) : armed ? (
                            "Remove? Confirm"
                          ) : (
                            <TrashIcon size={16} />
                          )}
                        </button>
                      )}
                    </div>
                    {asset.description && <p>{asset.description}</p>}
                    {asset.tags.length > 0 && (
                      <ul className="asset-tags" aria-label="Tags">
                        {asset.tags.map((tag) => <li key={tag}>{tag}</li>)}
                      </ul>
                    )}
                    <div className="asset-meta">
                      <span>{formatBytes(asset.byteSize)}</span>
                      {destination && <span>{domainFor(destination)}</span>}
                    </div>
                    <div className="asset-access">
                      <span><small>Agent access</small><strong>{agentsLoading ? "Loading agents…" : agentsError ? "Unavailable" : assetAssignmentLabel(asset, agents)}</strong></span>
                      {canWrite && !agentsError && (
                        <button
                          type="button"
                          onClick={() => setAssignmentAsset(asset)}
                          disabled={!assignmentsReady}
                          title={assignmentsReady ? undefined : "Available once workspace agents load"}
                        >
                          Manage
                        </button>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>

      {viewingAsset && <AssetViewer key={viewingAsset.id} asset={viewingAsset} onClose={() => setViewingAsset(null)} />}
      {composer?.type === "upload" && (
        <UploadComposer initialFile={composer.file} destination={composer.destination} onRepositoryLink={() => setComposer({ type: "link", destination: "repo" })} onClose={closeComposer} onCreated={addAsset} />
      )}
      {composer?.type === "link" && (
        <LinkComposer kind={composer.destination} onRepositoryUpload={() => setComposer({ type: "upload", destination: "repo" })} onClose={closeComposer} onCreated={addAsset} />
      )}
      {assignmentAsset && (
        <AssignmentComposer
          asset={assignmentAsset}
          agents={agents}
          agentsReady={assignmentsReady}
          onClose={() => setAssignmentAsset(null)}
          onSaved={updateAsset}
        />
      )}
    </section>
  );
}

type ComposerProps = {
  onClose: () => void;
  onCreated: (asset: CompanyAsset) => void;
};

function ComposerShell({
  title,
  intro,
  locked = false,
  onClose,
  children,
}: {
  title: string;
  intro: string;
  /* While locked (an upload in flight), Escape, backdrop, and the close
     button won't dismiss the dialog — closing would leave the request
     running with no visible state. */
  locked?: boolean;
  onClose: () => void;
  children: React.ReactNode;
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
      returnFocus?.focus();
    };
  }, []);

  function closeFromBackdrop(event: React.MouseEvent<HTMLDialogElement>) {
    if (event.target !== event.currentTarget || locked) return;
    const bounds = event.currentTarget.getBoundingClientRect();
    if (
      event.clientX < bounds.left || event.clientX > bounds.right ||
      event.clientY < bounds.top || event.clientY > bounds.bottom
    ) onClose();
  }

  return (
    <dialog
      ref={dialogRef}
      className="asset-dialog"
      aria-modal="true"
      aria-labelledby="asset-dialog-title"
      onCancel={(event) => {
        event.preventDefault();
        if (!locked) onClose();
      }}
      onKeyDown={(event) => {
        if (event.key === "Escape") {
          event.preventDefault();
          if (!locked) onClose();
        }
      }}
      onMouseDown={closeFromBackdrop}
    >
      <div className="asset-dialog-heading">
        <div><h2 id="asset-dialog-title">{title}</h2><p>{intro}</p></div>
        <button type="button" onClick={onClose} disabled={locked} aria-label="Close" autoFocus><CloseIcon size={18} /></button>
      </div>
      {children}
    </dialog>
  );
}

function AssignmentComposer({
  asset,
  agents,
  agentsReady,
  onClose,
  onSaved,
}: {
  asset: CompanyAsset;
  agents: AssetAgent[];
  agentsReady: boolean;
  onClose: () => void;
  onSaved: (asset: CompanyAsset) => void;
}) {
  const [mode, setMode] = useState<AssetAssignmentMode>(asset.assignmentMode);
  const [selected, setSelected] = useState(() => new Set(asset.assignedAgentIds));
  const [saving, setSaving] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!agentsReady) return;
    setSaving(true);
    setSubmitError(null);
    try {
      onSaved(await updateAssetAssignments(asset.id, {
        assignmentMode: mode,
        agentIds: [...selected],
      }));
    } catch (reason) {
      setSubmitError(reason instanceof Error ? reason.message : "Agent access could not be saved.");
      setSaving(false);
    }
  }

  return (
    <ComposerShell
      title={`Agent access for ${asset.name}`}
      intro="Control which workspace agents can retrieve this asset while preparing outreach."
      onClose={onClose}
    >
      <form className="asset-form asset-assignment-form" onSubmit={(event) => void submit(event)}>
        <fieldset className="asset-assignment-modes">
          <legend>Who can use this asset?</legend>
          <label>
            <input type="radio" name="assignment-mode" checked={mode === "all"} onChange={() => setMode("all")} />
            <span><strong>All workspace agents</strong><small>Includes agents added later.</small></span>
          </label>
          <label>
            <input type="radio" name="assignment-mode" checked={mode === "selected"} onChange={() => setMode("selected")} />
            <span><strong>Selected agents</strong><small>Only the agents checked below.</small></span>
          </label>
        </fieldset>
        {mode === "selected" && (
          <fieldset className="asset-agent-list">
            <legend>Selected agents</legend>
            {!agentsReady ? (
              <p>Loading workspace agents…</p>
            ) : agents.length === 0 ? (
              <p>No workspace agents are available. Saving will leave this asset inaccessible to agents.</p>
            ) : agents.map((agent) => (
              <label key={agent.id}>
                <input
                  type="checkbox"
                  checked={selected.has(agent.id)}
                  onChange={() => setSelected((current) => {
                    const next = new Set(current);
                    if (next.has(agent.id)) next.delete(agent.id);
                    else next.add(agent.id);
                    return next;
                  })}
                />
                <span><strong>{agent.label}</strong><small>{agent.paused ? "Paused" : "Active"}</small></span>
              </label>
            ))}
          </fieldset>
        )}
        {mode === "selected" && selected.size === 0 && (
          <p className="asset-access-warning" role="note">No agent will be able to retrieve this asset.</p>
        )}
        {submitError && <p className="asset-dialog-error" role="alert">{submitError}</p>}
        <div className="asset-form-actions">
          <button className="asset-button asset-button-secondary" type="button" onClick={onClose} disabled={saving}>Cancel</button>
          <button className="asset-button asset-button-primary" type="submit" disabled={saving || !agentsReady}>{saving ? "Saving…" : agentsReady ? "Save access" : "Loading agents…"}</button>
        </div>
      </form>
    </ComposerShell>
  );
}

function UploadComposer({ destination, initialFile, onRepositoryLink, onClose, onCreated }: ComposerProps & { destination: UploadDestination; initialFile?: File; onRepositoryLink: () => void }) {
  const [file, setFile] = useState<File | null>(initialFile ?? null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState("");
  const [saving, setSaving] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const options = UPLOAD_OPTIONS[destination];
  const kind = destination === "skill" || destination === "repo" ? destination : undefined;

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!file || saving) return;
    const validationError = uploadDestinationError(file, destination);
    if (validationError) {
      setSubmitError(validationError);
      return;
    }
    setSaving(true);
    setSubmitError(null);
    try {
      onCreated(await uploadAsset({ file, name, description, tags, kind }));
    } catch (reason) {
      setSubmitError(reason instanceof Error ? reason.message : "The asset could not be uploaded.");
      setSaving(false);
    }
  }

  return (
    <ComposerShell title={options.title} intro={`Add to ${ASSET_DESTINATIONS.find((item) => item.id === destination)?.label}. Files stay private to this workspace.`} locked={saving} onClose={onClose}>
      <form className="asset-form" onSubmit={(event) => void submit(event)}>
        <AssetFileDropzone destination={destination} file={file} disabled={saving} onFile={(next) => { setFile(next); setSubmitError(null); }} />
        {destination === "skill" && <p className="asset-form-note">Choose a Markdown file or an archive containing SKILL.md.</p>}
        {destination === "repo" && <button className="asset-source-switch" type="button" onClick={onRepositoryLink} disabled={saving}><LinkIcon size={15} /> Use a repository URL instead</button>}
        <label>Display name <span>Optional</span><input value={name} onChange={(event) => setName(event.target.value)} maxLength={255} placeholder={file?.name ?? "Product walkthrough"} disabled={saving} /></label>
        <label>Description <span>Optional</span><textarea value={description} onChange={(event) => setDescription(event.target.value)} maxLength={2000} rows={3} placeholder="How should the agent use this?" disabled={saving} /></label>
        <label>Tags <span>Comma separated</span><input value={tags} onChange={(event) => setTags(event.target.value)} maxLength={1000} placeholder="product, proof, enterprise" disabled={saving} /></label>
        {saving && file && (
          /* A large file can take a while: narrate what is happening in place
             (ux-principles rule 4). */
          <div className="asset-upload-progress" role="status">
            <span className="asset-upload-bar" aria-hidden="true"><span /></span>
            <span>Uploading {file.name} ({formatBytes(file.size)})… keep this dialog open until it finishes.</span>
          </div>
        )}
        {submitError && <p className="asset-dialog-error" role="alert">{submitError}</p>}
        <div className="asset-form-actions"><button className="asset-button asset-button-secondary" type="button" onClick={onClose} disabled={saving}>Cancel</button><button className="asset-button asset-button-primary" type="submit" disabled={!file || saving} title={!file ? "Choose a file to upload" : undefined}>{saving ? "Uploading…" : options.action}</button></div>
      </form>
    </ComposerShell>
  );
}

function LinkComposer({ kind, onRepositoryUpload, onClose, onCreated }: ComposerProps & { kind: "link" | "repo"; onRepositoryUpload: () => void }) {
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState("");
  const [saving, setSaving] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  async function submit(event: FormEvent) {
    event.preventDefault();
    /* The server refuses a non-https repo with a structured validation body,
       so say it here in plain words instead. */
    if (kind === "repo" && !url.trim().toLowerCase().startsWith("https://")) {
      setSubmitError("A repository link must start with https://.");
      return;
    }
    setSaving(true);
    setSubmitError(null);
    try {
      onCreated(await createLinkAsset({
        name,
        url,
        description,
        tags: tags.split(",").map((tag) => tag.trim()).filter(Boolean),
        kind,
      }));
    } catch (reason) {
      setSubmitError(reason instanceof Error ? reason.message : "The link could not be saved.");
      setSaving(false);
    }
  }

  return (
    <ComposerShell title={kind === "repo" ? "Add a repository URL" : "Add a link"} intro={kind === "repo" ? "Save a repository URL to Repos for your agents to clone." : "Save a web page to Links for your agents to reference."} locked={saving} onClose={onClose}>
      <form className="asset-form" onSubmit={(event) => void submit(event)}>
        <label>Display name<input required value={name} onChange={(event) => setName(event.target.value)} maxLength={255} placeholder={kind === "repo" ? "Product repository" : "Enterprise case study"} disabled={saving} /></label>
        <label>URL<input required type="url" value={url} onChange={(event) => setUrl(event.target.value)} placeholder="https://" disabled={saving} /></label>
        {kind === "repo" && <button className="asset-source-switch" type="button" onClick={onRepositoryUpload} disabled={saving}><UploadIcon size={15} /> Upload a repository archive instead</button>}
        <label>Description <span>Optional</span><textarea value={description} onChange={(event) => setDescription(event.target.value)} maxLength={2000} rows={3} placeholder="When should the agent use this?" disabled={saving} /></label>
        <label>Tags <span>Comma separated</span><input value={tags} onChange={(event) => setTags(event.target.value)} maxLength={1000} placeholder="case study, proof" disabled={saving} /></label>
        {submitError && <p className="asset-dialog-error" role="alert">{submitError}</p>}
        <div className="asset-form-actions"><button className="asset-button asset-button-secondary" type="button" onClick={onClose} disabled={saving}>Cancel</button><button className="asset-button asset-button-primary" type="submit" disabled={saving}>{saving ? "Saving…" : kind === "repo" ? "Save repository" : "Save link"}</button></div>
      </form>
    </ComposerShell>
  );
}
