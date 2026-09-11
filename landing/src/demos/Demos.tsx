import { useEffect, useState, type FormEvent } from "react";
import { ExternalIcon, SearchIcon, VideoIcon } from "../assets/icons";
import { useWorkspacePermissions } from "../dashboard/workspace-permissions-context";
import { listDemos, sendFeedback, type Demo, type DemosPage, type Sentiment } from "./api";
import "./demos.css";

const SENTIMENTS: { value: Sentiment; label: string }[] = [
  { value: "general", label: "Suggestion" },
  { value: "looks_good", label: "Looks good" },
  { value: "needs_changes", label: "Needs changes" },
];

function DemoPreview({ demo }: { demo: Demo }) {
  const [failed, setFailed] = useState(false);
  if (failed) return <div className="demo-placeholder"><VideoIcon size={30} /><p>Preview could not load.</p><a href={demo.content_url} target="_blank" rel="noopener noreferrer">Open the demo in a new tab</a></div>;
  if (demo.content_type === "video/mp4") {
    return <video className="demo-video" controls preload="metadata" src={demo.content_url} onError={() => setFailed(true)} aria-label={`Demo for ${demo.company_name}`} />;
  }
  if (demo.content_type.startsWith("image/")) {
    return <img className="demo-image" src={demo.content_url} alt={`Demo for ${demo.company_name}`} onError={() => setFailed(true)} />;
  }
  if (demo.content_type === "text/html") {
    return <iframe className="demo-web" src={demo.content_url} title={`Demo for ${demo.company_name}`} sandbox="" referrerPolicy="no-referrer" />;
  }
  return <div className="demo-placeholder"><VideoIcon size={30} /><p>This demo is available in a separate tab.</p><a href={demo.content_url} target="_blank" rel="noopener noreferrer">Open demo</a></div>;
}

type Draft = { message: string; sentiment: Sentiment };
const EMPTY_DRAFT: Draft = { message: "", sentiment: "general" };

function FeedbackForm({ demo, draft, onDraft }: { demo: Demo; draft: Draft; onDraft: (draft: Draft) => void }) {
  const { canWrite } = useWorkspacePermissions();
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (sending || !draft.message.trim()) return;
    setSending(true);
    setSent(false);
    setError(null);
    try {
      await sendFeedback(demo, draft.message.trim(), draft.sentiment);
      onDraft(EMPTY_DRAFT);
      setSent(true);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Feedback could not be delivered. Please try again.");
    } finally {
      setSending(false);
    }
  }

  return (
    <section className="demo-feedback" aria-labelledby="demo-feedback-title">
      <h3 id="demo-feedback-title">What do you think?</h3>
      <p>Your feedback goes directly to the Driftwood team.</p>
      {!canWrite ? <p className="demo-notice">Your workspace seat is read-only. An owner or admin can leave feedback.</p> : (
        <form onSubmit={submit} aria-busy={sending}>
          <fieldset disabled={sending} className="demo-sentiments">
            <legend className="sr-only">Feedback type</legend>
            {SENTIMENTS.map(({ value, label }) => (
              <label key={value} className={draft.sentiment === value ? "is-selected" : ""}>
                <input type="radio" name="sentiment" value={value} checked={draft.sentiment === value} onChange={() => onDraft({ ...draft, sentiment: value })} />{label}
              </label>
            ))}
          </fieldset>
          <label className="sr-only" htmlFor="demo-feedback-message">Your feedback</label>
          <textarea id="demo-feedback-message" value={draft.message} required maxLength={2000} disabled={sending} placeholder="What worked well? What would you like us to change?" onChange={(event) => { onDraft({ ...draft, message: event.target.value }); setSent(false); }} />
          <div className="demo-feedback-footer">
            <span>{draft.message.length.toLocaleString()} / 2,000</span>
            <button type="submit" className="demo-button is-primary" disabled={sending || !draft.message.trim()}>{sending ? "Sending…" : "Send feedback"}</button>
          </div>
          {error && <p className="demo-notice" role="alert">{error}</p>}
          {sent && <p className="demo-notice" role="status">Feedback sent. The Driftwood team has been notified.</p>}
        </form>
      )}
    </section>
  );
}

export default function Demos() {
  const [page, setPage] = useState<DemosPage | null>(null);
  const [queryInput, setQueryInput] = useState("");
  const [query, setQuery] = useState("");
  const [offset, setOffset] = useState(0);
  const [refresh, setRefresh] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, Draft>>({});

  useEffect(() => {
    const controller = new AbortController();
    listDemos(query, offset, controller.signal)
      .then((result) => { if (!controller.signal.aborted) { setPage(result); setError(null); } })
      .catch((reason: unknown) => { if (!controller.signal.aborted) setError(reason instanceof Error ? reason.message : "Demos could not load."); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [query, offset, refresh]);

  const selected = page?.demos.find((demo) => demo.lead_id === selectedId) ?? page?.demos[0];

  function search(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setQuery(queryInput.trim());
    setOffset(0);
    setRefresh((value) => value + 1);
  }

  return (
    <section className="demos-page" aria-labelledby="demos-heading">
      <header className="demos-heading">
        <div><h1 id="demos-heading">Demos</h1><p>See what we’ve created for your leads. Help us make the next version better.</p></div>
        <button className="demo-button" type="button" disabled={loading} onClick={() => { setLoading(true); setRefresh((value) => value + 1); }}>Refresh</button>
      </header>
      <form className="demos-search" role="search" onSubmit={search}>
        <SearchIcon size={17} /><label className="sr-only" htmlFor="demo-search">Search demos</label>
        <input id="demo-search" type="search" placeholder="Search company, lead, or demo" maxLength={200} value={queryInput} onChange={(event) => setQueryInput(event.target.value)} />
        <button type="submit" className="demo-button" disabled={loading}>Search</button>
      </form>
      {loading ? <div className="demos-state" role="status">Loading demos…</div> : error ? (
        <div className="demos-state" role="alert"><h2>Demos could not load</h2><p>{error}</p><button className="demo-button" onClick={() => { setLoading(true); setRefresh((value) => value + 1); }}>Try again</button></div>
      ) : !selected ? (
        <div className="demos-state"><VideoIcon size={30} /><h2>{query ? "No matching demos" : "Your demos will appear here"}</h2><p>{query ? "Try another company or lead name." : "Once a demo is ready and attached to a lead, you can preview it and share feedback here."}</p></div>
      ) : (
        <div className="demos-layout">
          <aside className="demos-library" aria-label="Created demos">
            <p className="demos-count">{page!.total} {page!.total === 1 ? "demo" : "demos"}{query ? " found" : " created"}</p>
            <div className="demos-list">
              {page!.demos.map((demo) => (
                <button key={demo.lead_id} className={`demo-list-item ${selected.lead_id === demo.lead_id ? "is-active" : ""}`} type="button" aria-pressed={selected.lead_id === demo.lead_id} onClick={() => setSelectedId(demo.lead_id)}>
                  <span className="demo-list-icon"><VideoIcon size={19} /></span>
                  <span><strong>{demo.company_name}</strong><span>{demo.lead_name ?? demo.name}</span><small>{new Date(demo.updated_at).toLocaleDateString(undefined, { month: "short", day: "numeric" })}</small></span>
                </button>
              ))}
            </div>
            {page!.total > page!.limit && <div className="demos-pagination">
              <button className="demo-button" disabled={offset === 0} onClick={() => { setLoading(true); setOffset(Math.max(0, offset - page!.limit)); }}>Previous</button>
              <span>{offset + 1}–{offset + page!.demos.length} of {page!.total}</span>
              <button className="demo-button" disabled={offset + page!.limit >= page!.total} onClick={() => { setLoading(true); setOffset(offset + page!.limit); }}>Next</button>
            </div>}
          </aside>
          <article className="demo-detail" aria-label={`Demo for ${selected.company_name}`}>
            <div className="demo-detail-heading">
              <div><h2>{selected.company_name}</h2><p>For {selected.lead_name ?? "your lead"} · Updated {new Date(selected.updated_at).toLocaleDateString()}</p></div>
              <a className="demo-button" href={selected.content_url} target="_blank" rel="noopener noreferrer">Open demo <ExternalIcon size={15} /></a>
            </div>
            <div className="demo-preview"><DemoPreview key={`${selected.artifact_id}-${selected.updated_at}`} demo={selected} /></div>
            {selected.description && <p className="demo-description">{selected.description}</p>}
            <FeedbackForm key={selected.lead_id} demo={selected} draft={drafts[selected.lead_id] ?? EMPTY_DRAFT} onDraft={(draft) => setDrafts((current) => ({ ...current, [selected.lead_id]: draft }))} />
          </article>
        </div>
      )}
    </section>
  );
}
