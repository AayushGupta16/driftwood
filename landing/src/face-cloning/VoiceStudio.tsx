import { useRef, useState } from 'react';
import { API, post } from './api';
import { inProgress } from './model';
import type { Job, Studio } from './model';
import JobProgress from './JobProgress';

type Props = { studio: Studio; duration: number; canWrite: boolean; onRefresh: () => Promise<void>; onPreview: (job: Job) => void };
export default function VoiceStudio({studio, duration, canWrite, onRefresh, onPreview}: Props) {
  const [script, setScript] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const request = useRef<{script: string; id: string} | null>(null);
  const lock = useRef(false);
  const renders = studio.jobs.filter(job => job.kind === 'render' && job.id !== studio.preview?.id);
  const seconds = Math.ceil(script.trim().split(/\s+/).filter(Boolean).length / 2.3);
  const disabled = !canWrite || busy || studio.busy || !studio.voice || !script.trim();
  const disabledReason = !canWrite ? 'Only workspace owners and admins can generate videos.' : busy || studio.busy ? 'Wait for the current generation to finish.' : !studio.voice ? 'Your voice must finish processing first.' : !script.trim() ? 'Enter the words you want to say.' : undefined;
  async function generate() {
    if (disabled || lock.current) return;
    lock.current = true; setBusy(true); setError('');
    const text = script.trim();
    if (!request.current || request.current.script !== text) request.current = {script: text, id: crypto.randomUUID()};
    try {
      await post(`${API}/generate`, {request_id: request.current.id, script: text});
      await onRefresh();
      request.current = null; setScript('');
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Could not start generation.'); }
    finally { lock.current = false; setBusy(false); }
  }
  return <details className="face-more">
    <summary>Make another video</summary>
    <label className="face-script-label" htmlFor="face-narration">What would you like to say?</label>
    <textarea id="face-narration" rows={4} maxLength={2500} value={script} disabled={!canWrite || busy} onChange={event => setScript(event.target.value)} placeholder="Hey, I wanted to show you something…"/>
    <div className="face-script-meta"><span>{seconds ? `~${seconds}s / ${Math.round(duration)}s available` : `Up to ${Math.round(duration)} seconds`}</span><span>Up to ${studio.video_cost_ceiling_usd.toFixed(2)} + narration per video</span></div>
    {seconds > duration && <p className="face-error">Shorten this script to fit your recording.</p>}
    <button className="face-primary" disabled={disabled} title={disabledReason} onClick={() => void generate()}>{busy ? 'Starting…' : 'Generate video'}</button>
    {!studio.voice && !studio.busy && <p>Record a new take to set up your voice.</p>}
    {error && <p role="alert" className="face-error">{error}</p>}
    {renders.map(job => <div key={job.id} className="face-result">
      {inProgress(job) ? <JobProgress kind="render" status={job.status} createdAt={job.created_at}/> : <>
        <p>{job.script}</p>{job.error && <p className="face-error">{job.error}</p>}
        <div className="face-actions">{job.video_available && <button className="face-secondary" onClick={() => onPreview(job)}>View video</button>}{job.audio_available && <a href={`${API}/generations/${job.id}/audio`} download="narration.mp3">Download audio</a>}</div>
      </>}
    </div>)}
  </details>;
}
