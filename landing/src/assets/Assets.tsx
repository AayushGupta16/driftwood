import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { createLinkAsset, deleteAsset, listAssetAgents, listAssets, updateAssetAssignments, uploadAsset } from "./api";
import {
  assetAssignmentLabel,
  assetAssignmentsReady,
  assetDestination,
  assetKindLabel,
  filterAssets,
  formatBytes,
  type AssetFilter,
  type AssetAgent,
  type AssetAssignmentMode,
  type CompanyAsset,
} from "./model";
import { useWorkspacePermissions } from "../dashboard/workspace-permissions-context";
import {
  AudioIcon,
  CloseIcon,
  ExternalIcon,
  ImageIcon,
  LinkIcon,
  SearchIcon,
  TrashIcon,
  UploadIcon,
  VideoIcon,
} from "./icons";
import "./assets.css";

const FILTERS: Array<{ id: AssetFilter; label: string }> = [
  { id: "all", label: "All assets" },
  { id: "image", label: "Images" },
  { id: "video", label: "Videos" },
  { id: "audio", label: "Audio" },
  { id: "link", label: "Links" },
];

type Composer = "upload" | "link" | null;

function domainFor(url: string | null): string {
  if (!url) return "";
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

function AssetVisual({ asset }: { asset: CompanyAsset }) {
  if (asset.kind === "image" && asset.contentUrl) {
    return <img src={asset.contentUrl} alt="" loading="lazy" />;
  }
  if (asset.kind === "video") {
    return <div className="asset-visual-placeholder"><VideoIcon size={27} /><span>Video</span></div>;
  }
  if (asset.kind === "audio") {
    return <div className="asset-visual-placeholder"><AudioIcon size={27} /><span>Audio</span></div>;
  }
  return (
    <div className="asset-visual-placeholder asset-link-visual">
      <LinkIcon size={25} />
      <span>{domainFor(asset.externalUrl)}</span>
    </div>
  );
}

export default function Assets() {
  const { canWrite } = useWorkspacePermissions();
  const [assets, setAssets] = useState<CompanyAsset[]>([]);
  const [agents, setAgents] = useState<AssetAgent[]>([]);
  const [filter, setFilter] = useState<AssetFilter>("all");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);
  const [composer, setComposer] = useState<Composer>(null);
  const [assignmentAsset, setAssignmentAsset] = useState<CompanyAsset | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [agentsLoading, setAgentsLoading] = useState(true);
  const [agentsError, setAgentsError] = useState(false);
  const [agentsErrorVisible, setAgentsErrorVisible] = useState(false);
  const [armedDeleteId, setArmedDeleteId] = useState<string | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);

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

  function addAsset(asset: CompanyAsset) {
    setAssets((current) => [asset, ...current]);
    setComposer(null);
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
            <button className="asset-button asset-button-secondary" type="button" onClick={() => setComposer("link")}>
              <LinkIcon size={16} /> Add link
            </button>
            <button className="asset-button asset-button-primary" type="button" onClick={() => setComposer("upload")}>
              <UploadIcon size={16} /> Upload asset
            </button>
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
            <ImageIcon size={27} />
            <h2>{assets.length === 0 ? "Your asset library is empty" : "No assets match this view"}</h2>
            <p>{assets.length === 0 ? canWrite ? "Upload an image, video, or audio file, or add a link your agents can reference." : "An owner or admin can add the first asset." : "Try another type or clear the search."}</p>
          </div>
        ) : (
          <div className="asset-grid">
            {visible.map((asset) => {
              const destination = assetDestination(asset);
              const armed = armedDeleteId === asset.id;
              const removing = removingId === asset.id;
              return (
                <article className="asset-card" key={asset.id}>
                  {destination ? (
                    <a className="asset-visual" href={destination} target="_blank" rel="noreferrer" aria-label={`Open ${asset.name}`}>
                      <AssetVisual asset={asset} />
                      <span className="asset-open-mark"><ExternalIcon size={14} /></span>
                    </a>
                  ) : (
                    <div className="asset-visual"><AssetVisual asset={asset} /></div>
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
                      {asset.kind === "link" && <span>{domainFor(asset.externalUrl)}</span>}
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

      {composer === "upload" && (
        <UploadComposer onClose={() => setComposer(null)} onCreated={addAsset} />
      )}
      {composer === "link" && (
        <LinkComposer onClose={() => setComposer(null)} onCreated={addAsset} />
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

function UploadComposer({ onClose, onCreated }: ComposerProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState("");
  const [saving, setSaving] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!file) return;
    if (file.size > 25 * 1024 * 1024) {
      setSubmitError("Choose a file smaller than 25 MB.");
      return;
    }
    setSaving(true);
    setSubmitError(null);
    try {
      onCreated(await uploadAsset({ file, name, description, tags }));
    } catch (reason) {
      setSubmitError(reason instanceof Error ? reason.message : "The asset could not be uploaded.");
      setSaving(false);
    }
  }

  return (
    <ComposerShell title="Upload an asset" intro="Images, videos, and audio stay private to this workspace." locked={saving} onClose={onClose}>
      <form className="asset-form" onSubmit={(event) => void submit(event)}>
        <button className="asset-dropzone" type="button" onClick={() => inputRef.current?.click()} disabled={saving}>
          <UploadIcon size={23} />
          <strong>{file ? file.name : "Choose an image, video, or audio file"}</strong>
          <span>{file ? formatBytes(file.size) : "PNG, JPEG, GIF, WebP, MP4, MOV, WebM, MP3, WAV, M4A, or OGG · up to 25 MB"}</span>
        </button>
        <input ref={inputRef} className="sr-only" type="file" accept="image/png,image/jpeg,image/gif,image/webp,video/mp4,video/quicktime,video/webm,audio/mpeg,audio/wav,audio/x-wav,audio/mp4,audio/x-m4a,audio/ogg,audio/webm" onChange={(event) => setFile(event.target.files?.[0] ?? null)} />
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
        <div className="asset-form-actions"><button className="asset-button asset-button-secondary" type="button" onClick={onClose} disabled={saving}>Cancel</button><button className="asset-button asset-button-primary" type="submit" disabled={!file || saving}>{saving ? "Uploading…" : "Upload asset"}</button></div>
      </form>
    </ComposerShell>
  );
}

function LinkComposer({ onClose, onCreated }: ComposerProps) {
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState("");
  const [saving, setSaving] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setSubmitError(null);
    try {
      onCreated(await createLinkAsset({
        name,
        url,
        description,
        tags: tags.split(",").map((tag) => tag.trim()).filter(Boolean),
      }));
    } catch (reason) {
      setSubmitError(reason instanceof Error ? reason.message : "The link could not be saved.");
      setSaving(false);
    }
  }

  return (
    <ComposerShell title="Add a reference link" intro="Save approved work, documentation, or proof the agent should know." onClose={onClose}>
      <form className="asset-form" onSubmit={(event) => void submit(event)}>
        <label>Display name<input required value={name} onChange={(event) => setName(event.target.value)} maxLength={255} placeholder="Enterprise case study" /></label>
        <label>URL<input required type="url" value={url} onChange={(event) => setUrl(event.target.value)} placeholder="https://" /></label>
        <label>Description <span>Optional</span><textarea value={description} onChange={(event) => setDescription(event.target.value)} maxLength={2000} rows={3} placeholder="When should the agent use this?" /></label>
        <label>Tags <span>Comma separated</span><input value={tags} onChange={(event) => setTags(event.target.value)} maxLength={1000} placeholder="case study, proof" /></label>
        {submitError && <p className="asset-dialog-error" role="alert">{submitError}</p>}
        <div className="asset-form-actions"><button className="asset-button asset-button-secondary" type="button" onClick={onClose} disabled={saving}>Cancel</button><button className="asset-button asset-button-primary" type="submit" disabled={saving}>{saving ? "Saving…" : "Save link"}</button></div>
      </form>
    </ComposerShell>
  );
}
