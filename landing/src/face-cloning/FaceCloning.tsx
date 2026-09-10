import { useEffect, useRef, useState } from 'react';
import { useWorkspacePermissions } from '../dashboard/workspace-permissions-context';
import './face-cloning.css';

type Recording = { id: string; filename: string; byte_size: number; duration: number; width: number; height: number; created_at: string };
const API = '/api/v1/dashboard/face-cloning';
const MAX_BYTES = 200 * 1024 * 1024;
const SCRIPT = [
  ['Warm smile', 'Hey! I wanted to show you something that could make your day a little easier.'],
  ['Thoughtful', 'Right now, this process takes a lot of clicking, checking, and repeating the same steps. And when something breaks, it’s not always obvious why.'],
  ['Curious', 'So, what happens if we let the system handle that work for us?'],
  ['Calm and explanatory', 'Let me walk you through it. First, we open the dashboard. Then we choose the workflow and give it the information it needs.'],
  ['A little enthusiasm', 'And there we go. You can see the result right here, along with exactly what happened at each step.'],
  ['Reassuring', 'You still have control. If something needs your attention, you can review it before moving forward.'],
  ['Friendly finish', 'That’s the idea: less time on repetitive work, and more time for the things that actually need you.'],
];
async function json<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, { credentials: 'include', ...init });
  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error(body?.error?.detail || `Something went wrong (${response.status}). Please try again.`);
  }
  return response.json() as Promise<T>;
}

export default function FaceCloning() {
  const { canWrite } = useWorkspacePermissions();
  const [recording, setRecording] = useState<Recording | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let active = true;
    json<{ recording: Recording | null }>(API).then(data => {
      if (active) { setRecording(data.recording); setLoaded(true); }
    }).catch(reason => { if (active) setError(reason.message); });
    return () => { active = false; };
  }, []);
  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);

  function choose(next: File | undefined) {
    setError(''); setMessage('');
    if (!next) return;
    if (!next.name.toLowerCase().endsWith('.mp4')) { setError('Choose an MP4 video. Export it with the H.264 codec.'); return; }
    if (!next.size || next.size > MAX_BYTES) { setError('Choose a video under 200 MB.'); return; }
    setFile(next); setPreview(URL.createObjectURL(next));
  }
  async function save() {
    if (!file || busy) return;
    setBusy(true); setError(''); setMessage(''); setProgress(0);
    try {
      const upload = await json<{ id: string; upload_url: string }>(`${API}/upload`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename: file.name, byte_size: file.size }),
      });
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('PUT', upload.upload_url);
        xhr.setRequestHeader('Content-Type', 'video/mp4');
        xhr.timeout = 10 * 60 * 1000;
        xhr.upload.onprogress = event => { if (event.lengthComputable) setProgress(Math.round(event.loaded / event.total * 100)); };
        xhr.onload = () => xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new Error('Upload failed. Your saved recording has not changed. Please try again.'));
        xhr.onerror = () => reject(new Error('The upload lost its connection. Please try again.'));
        xhr.ontimeout = () => reject(new Error('Upload timed out. Please try again on a faster connection.'));
        xhr.send(file);
      });
      setProgress(null); setMessage('Checking your video…');
      const saved = await json<Recording>(`${API}/${upload.id}/complete`, { method: 'POST' });
      setRecording(saved); setFile(null); setPreview('');
      if (input.current) input.current.value = '';
      setMessage('Recording saved. Your agent can use it in future demo videos.');
    } catch (reason) {
      setMessage(''); setError(reason instanceof Error ? reason.message : 'Could not save your recording.');
    } finally { setBusy(false); setProgress(null); }
  }
  async function remove() {
    setBusy(true); setError(''); setMessage('');
    try { await json(API, { method: 'DELETE' }); setRecording(null); setDeleting(false); setMessage('Recording removed. Existing demo videos are unchanged.'); }
    catch (reason) { setError(reason instanceof Error ? reason.message : 'Could not remove the recording.'); }
    finally { setBusy(false); }
  }

  return <div className="face-cloning">
    <header><h1>Face Cloning</h1></header>
    <div className="face-grid">
      <section className="face-card" aria-labelledby="recording-title">
        <h2 id="recording-title">{recording ? 'Your saved recording' : 'Clone yourself'}</h2>
        <p>Save one recording for this workspace. Uploading saves your footage; video generation happens later, separately for each demo.</p>
        {!loaded && !error && <p role="status">Loading your recording…</p>}
        {loaded && <>
          {(file && preview) || recording ? <video key={file ? preview : recording?.id} src={file ? preview : `${API}/content?v=${recording?.id}`} controls playsInline preload="metadata" aria-label={file ? 'Selected recording preview' : 'Saved recording preview'} /> : <div className="face-empty"><svg viewBox="0 0 80 80" aria-hidden="true"><circle cx="40" cy="29" r="13" /><path d="M16 68c0-24 48-24 48 0M8 24V8h16M56 8h16v16M72 56v16H56M24 72H8V56" /></svg><p>Your next demo, with you in it.</p></div>}
          {recording && !file && <p className="face-meta">{recording.filename} · {Math.round(recording.duration)} sec · {recording.width} × {recording.height}</p>}
          {file && <p className="face-meta">Selected: {file.name} · {(file.size / 1024 / 1024).toFixed(1)} MB</p>}
          {canWrite ? <div className="face-actions">
            <input ref={input} id="face-file" type="file" accept="video/mp4,.mp4" disabled={busy} onChange={event => choose(event.target.files?.[0])} />
            <button className="face-secondary" disabled={busy} onClick={() => input.current?.click()}>{recording || file ? 'Choose another video' : 'Choose video'}</button>
            {file && <button className="face-primary" disabled={busy} onClick={() => void save()}>{busy ? progress === null ? 'Checking video…' : `Uploading ${progress}%` : recording ? 'Replace recording' : 'Save recording'}</button>}
            {recording && !file && !deleting && <button className="face-text" disabled={busy} onClick={() => setDeleting(true)}>Remove recording</button>}
          </div> : <p>Only workspace owners and admins can change the recording.</p>}
          {deleting && canWrite && <div className="face-confirm"><p>Remove this source recording? It will no longer be available for future demos.</p><button className="face-secondary" disabled={busy} onClick={() => setDeleting(false)}>Keep recording</button><button className="face-primary" disabled={busy} onClick={() => void remove()}>Remove</button></div>}
          {progress !== null && <progress max="100" value={progress} aria-label="Video upload progress" />}
        </>}
        {error && <p className="face-error" role="alert">{error}{!loaded && <> <button className="face-text" onClick={() => window.location.reload()}>Reload</button></>}</p>}
        {message && <p role="status">{message}</p>}
        <p className="face-meta">Your source recording is private to this workspace. It is shared with our video provider when used to render a demo.</p>
      </section>
      <section className="face-card" aria-labelledby="recording-guide"><h2 id="recording-guide">A good recording makes the difference.</h2>
        <ol className="face-tips"><li><strong>Look toward the lens.</strong><span>Put a teleprompter close to the camera. Avoid looking down at a phone or across at another screen.</span></li><li><strong>Make your face easy to see.</strong><span>Use soft light in front of you, a steady camera at eye level, and a simple background. Keep your full face and shoulders in frame.</span></li><li><strong>Speak like you’re explaining it to someone.</strong><span>Blink normally and use small, natural movements. Keep hands away from your mouth and avoid exaggerated expressions.</span></li><li><strong>Aim for 60–90 seconds.</strong><span>Use the script below, or something with similar pacing. Leave two seconds before and after speaking. One person in frame, with no filters or captions.</span></li></ol>
        <div className="face-spec"><strong>File requirements</strong><p>H.264 MP4 · 15 seconds to 3 minutes · 720p to 4K · 20–60 fps · up to 200 MB</p><p>1080p at 30 fps is ideal. On iPhone, choose Camera → Formats → Most Compatible before recording.</p></div>
      </section>
    </div>
    <details className="face-card face-script"><summary>Need something to say? Use this recording script.</summary><p>Read the words naturally. The cues guide your delivery; don’t read them aloud. You don’t need to memorize it or act out big emotions.</p>{SCRIPT.map(([cue, words]) => <div key={cue}><span>{cue}</span><p>{words}</p></div>)}</details>
  </div>;
}
