import { useEffect, useState } from "react";
import { EmailPreview } from "../EmailPreview";
import type { Campaign } from "./model";
import { withMockMode } from "../mock-mode";

type DemoRequest = { id: string; status: string; lead_count: number; error?: string | null };
export default function CampaignOutputs({ campaign, editable }: { campaign: Campaign; editable: boolean }) {
  const [brief, setBrief] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<DemoRequest | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [requestKey] = useState(() => crypto.randomUUID());
  const [history, setHistory] = useState<DemoRequest[]>([]);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [historyRevision, setHistoryRevision] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    fetch(`/api/v1/dashboard/campaigns/${encodeURIComponent(campaign.id)}/demo-requests`, {credentials:'include',signal:controller.signal}).then(async (response) => {
      if (!response.ok) throw new Error('Demo request history could not load.');
      const rows = await response.json();
      if (!Array.isArray(rows)) throw new Error('Demo request history could not load.');
      if (!controller.signal.aborted) {setHistory(rows);setHistoryError(null);}
    }).catch((reason) => {if (!controller.signal.aborted) setHistoryError(reason.message);});
    return () => controller.abort();
  },[campaign.id,historyRevision]);
  const [preview, setPreview] = useState(false);
  const contact = campaign.contacts.find((person) => person.selected);
  const email = campaign.steps.find((step) => step.kind === "email");
  const selectedIds = campaign.contacts.filter((person) => person.selected && person.selectable).map((person) => person.id);
  useEffect(() => { if (!preview) return; const close = (e: KeyboardEvent) => { if (e.key === 'Escape') setPreview(false); }; window.addEventListener('keydown', close); return () => window.removeEventListener('keydown', close); }, [preview]);
  function personalize(text: string) {
    return text.replaceAll('{{first_name}}', contact?.name.split(' ')[0] ?? '[first name]').replaceAll('{{company}}', contact?.company ?? '[company]').replaceAll('{{demo_link}}', '[personalized demo link]');
  }
  return <section className="campaign-outbound-guide">
    <div className="campaign-outbound-steps"><span><b>1</b> {campaign.audienceId ? campaign.audience : 'Choose audience'}</span><span><b>2</b> Create demos</span><span><b>3</b> Preview email</span><span><b>4</b> Approval & sending</span></div>
    <div className="campaign-outbound-actions"><div><strong>Show prospects what they gain</strong><p>Describe the outcome the personalized demo should show. For example: catch release issues earlier by running tests in parallel.</p></div><button className="campaign-secondary" disabled={!email} onClick={() => setPreview((value) => !value)}>{preview ? 'Close email preview' : 'Preview email'}</button><a className="campaign-secondary" href={withMockMode('/dashboard/demos')}>View demos</a></div>
    {editable && <form onSubmit={async (event) => {
      event.preventDefault(); if (busy || result || !selectedIds.length) return; setBusy(true); setError(null);
      try {
        const response = await fetch(`/api/v1/dashboard/campaigns/${encodeURIComponent(campaign.id)}/demo-requests`, { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json', 'Idempotency-Key': requestKey }, body: JSON.stringify({ brief: brief.trim(), lead_ids: selectedIds, expected_lock_version: campaign.lockVersion }) });
        if (!response.ok) throw new Error(response.status === 404 ? 'Demo requests are not available on this backend yet.' : `Demo request failed (${response.status}). Please try again.`);
        const data = await response.json() as DemoRequest;
        if (!data.id || !['queued','handed_to_agent','blocked'].includes(data.status) || !Number.isInteger(data.lead_count)) throw new Error('The request was not confirmed. Please try again.');
        setResult(data);setHistoryRevision((n) => n+1);
      } catch (reason) { setError(reason instanceof Error ? reason.message : 'Could not request demos.'); } finally { setBusy(false); }
    }}><label htmlFor="demo-outcome">Demo outcome</label><div><input id="demo-outcome" placeholder="What should the prospect see improving for their team?" value={brief} onChange={(e) => setBrief(e.target.value)} disabled={busy || !!result} required maxLength={2000} /><button className="campaign-primary" disabled={busy || !!result || !brief.trim() || selectedIds.length === 0}>{busy ? 'Requesting…' : result ? 'Demos requested' : `Request ${selectedIds.length} demos`}</button></div><small>Creates a demo request for eligible selected contacts. Email sending still requires approval.</small></form>}
    {result && <p className="campaign-request-notice" role="status">{result.lead_count} demo requests {result.status === "handed_to_agent" ? "handed to your agent" : result.status === "blocked" ? "blocked" : "queued for your agent"}. {result.error ?? "Follow progress with your team; published results appear in Demos. No email has been sent."}</p>}
    {error && <p role="alert">{error}</p>}
    {(history.length > 0 || historyError) && <div><strong>Demo requests</strong> <button className="campaign-secondary" onClick={() => setHistoryRevision((n) => n+1)}>Refresh requests</button>{historyError && <p role="alert">{historyError}</p>}{history.map((request) => <p key={request.id}>{request.lead_count} demos · {request.status === 'handed_to_agent' ? 'Handed to your agent' : request.status === 'blocked' ? 'Blocked' : 'Queued for your agent'}{request.error ? `: ${request.error}` : ''}</p>)}</div>}
    {preview && email && <div className="campaign-email-preview"><div><strong>Email preview{contact ? ` for ${contact.name}` : ''}</strong><span>Draft · not sent{email.body.includes('{{demo_link}}') ? ' · demo link pending' : ''}</span></div><EmailPreview subject={personalize(email.subject)} body={personalize(email.body)} /></div>}
  </section>;
}
