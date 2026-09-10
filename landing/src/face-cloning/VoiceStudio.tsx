import {useEffect, useRef, useState} from 'react';
import {API, json, post, uploadFile} from './api';
import JobProgress from './JobProgress';

type Job = {id: string; kind: string; status: string; filename: string; script: string | null; error: string | null; duration: number | null; created_at: string; audio_available: boolean; video_available: boolean};
type Studio = {voice: Job | null; jobs: Job[]; busy: boolean; max_render_usd: number; video_cost_ceiling_usd: number; daily_render_limit: number};
const labels: Record<string,string> = {queued: 'Queued', launching: 'Starting', running: 'Processing', ready: 'Ready', failed: 'Could not finish', verification_required: 'Verification required'};
const inProgress = (job: Job) => ['queued', 'launching', 'running'].includes(job.status);

export default function VoiceStudio({recordingId, duration, canWrite}: {recordingId: string | undefined; duration: number; canWrite: boolean}) {
  const [studio,setStudio] = useState<Studio | null>(null);
  const [error,setError] = useState('');
  const [busy,setBusy] = useState('');
  const [source,setSource] = useState<'video'|'audio'>('video');
  const [file,setFile] = useState<File | null>(null);
  const [sampleUrl,setSampleUrl] = useState('');
  const [consent,setConsent] = useState(false);
  const [script,setScript] = useState('');
  const [progress,setProgress] = useState<number | null>(null);
  const [confirmRemove,setConfirmRemove] = useState('');
  const [reload,setReload] = useState(0);
  const input = useRef<HTMLInputElement>(null);
  // Retain a request ID after a lost response. Clicking again checks the same
  // request rather than authorizing another paid generation.
  const pending = useRef<{key: string; id: string} | null>(null);

  useEffect(() => {
    let active = true;
    let timer: ReturnType<typeof setTimeout>;
    const poll = async () => {
      try {
        const data = await json<Studio>(`${API}/studio`);
        if (active) setStudio(data);
      } catch (reason) { if (active) setError(reason instanceof Error ? reason.message : 'Could not load voice setup.'); }
      if (active) timer = setTimeout(() => void poll(), 5000);
    };
    void poll();
    return () => { active = false; clearTimeout(timer); };
  },[recordingId,reload]);
  useEffect(() => () => { if(sampleUrl) URL.revokeObjectURL(sampleUrl); },[sampleUrl]);

  async function refresh() { setStudio(await json<Studio>(`${API}/studio`)); }
  function requestId(key: string) {
    if (!pending.current || pending.current.key !== key) pending.current = {key, id: crypto.randomUUID()};
    return pending.current.id;
  }
  function choose(next: File | undefined) {
    if (!next) return;
    if (!/\.(mp3|wav|m4a)$/i.test(next.name) || !next.size || next.size > 50 * 1024 * 1024) { setError('Choose a WAV, MP3 or M4A file under 50 MB.'); return; }
    setFile(next); setSampleUrl(URL.createObjectURL(next)); setError('');
  }
  async function createVoice() {
    if (busy || !consent) return;
    setBusy('voice'); setError('');
    try {
      if (source === 'video') {
        await post(`${API}/voice/from-video`, {request_id: requestId(`voice:${recordingId}`), consent});
      } else {
        if (!file) throw new Error('Choose a voice recording first.');
        setProgress(0);
        const upload = await post<{id: string; upload_url: string; content_type: string}>(`${API}/voice/upload`, {request_id: crypto.randomUUID(), consent, filename: file.name, byte_size: file.size});
        await uploadFile(upload.upload_url,file,upload.content_type,setProgress);
        await json(`${API}/voice/${upload.id}/complete`, {method:'POST'});
        setFile(null); setSampleUrl('');
      }
      await refresh();
      pending.current = null;
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Could not create the voice.'); }
    finally { setBusy(''); setProgress(null); }
  }
  async function generate() {
    if (busy || !script.trim()) return;
    setBusy('render'); setError('');
    try {
      await post(`${API}/generate`, {request_id: requestId(`render:${script.trim()}`), script: script.trim()});
      pending.current = null;
      await refresh();
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Could not start generation.'); }
    finally { setBusy(''); }
  }
  async function removeVoice(id: string) {
    setBusy('remove'); setError('');
    try { await json(`${API}/voice/${id}`, {method:'DELETE'}); setConfirmRemove(''); await refresh(); }
    catch (reason) { setError(reason instanceof Error ? reason.message : 'Could not remove the voice.'); }
    finally { setBusy(''); }
  }
  const locked = !!busy || !!studio?.busy || !studio;
  const voiceJob = studio?.jobs.find(job => job.kind === 'voice');
  const estimatedSeconds = script.trim() ? Math.ceil(script.trim().split(/\s+/).length / 2.3) : 0;
  const renders = studio?.jobs.filter(job => job.kind === 'render') ?? [];
  const activeRender = renders.find(inProgress);
  return <div className="face-studio">
    <div className="face-grid">
      <section className="face-card" aria-labelledby="voice-title">
        <h2 id="voice-title">Your voice</h2>
        <p>Use the speech in your face recording, or upload a clearer voice sample. ElevenLabs creates a voice you can reuse for new scripts.</p>
        {!studio && <p role="status">Loading voice setup…</p>}
        {studio?.voice && <div className="face-voice-ready"><strong>Voice ready</strong><p className="face-meta">Created from {studio.voice.filename}</p></div>}
        {voiceJob && inProgress(voiceJob) && <JobProgress key={voiceJob.id} kind="voice" status={voiceJob.status} createdAt={voiceJob.created_at} />}
        {busy==='voice' && progress===null && !(voiceJob && inProgress(voiceJob)) && <JobProgress kind="voice" status="submitting" />}
        {voiceJob && (voiceJob.status === 'verification_required' || voiceJob.status === 'failed') && <div role="status"><strong>{labels[voiceJob.status]}</strong><p>{voiceJob.error || 'Extracting the audio and setting up your ElevenLabs voice. You can leave this page and come back.'}</p></div>}
        {canWrite ? <>
          <fieldset className="face-source" disabled={locked}><legend>Voice source</legend>
            <label><input type="radio" name="voice-source" checked={source==='video'} onChange={()=>setSource('video')}/> Use my face recording</label>
            <label><input type="radio" name="voice-source" checked={source==='audio'} onChange={()=>setSource('audio')}/> Upload a voice sample</label>
          </fieldset>
          {source === 'video' && !recordingId && <p>Save your face recording above first.</p>}
          {source === 'audio' && <><input ref={input} className="face-upload-input" type="file" accept="audio/mpeg,audio/wav,audio/mp4,.mp3,.wav,.m4a" disabled={locked} onChange={event=>choose(event.target.files?.[0])}/><button className="face-secondary" disabled={locked} onClick={()=>input.current?.click()}>Choose audio</button>{file && <p className="face-meta">{file.name}</p>}{sampleUrl && <audio src={sampleUrl} controls aria-label="Voice sample preview"/>}<p className="face-meta">WAV, MP3 or M4A · 15 seconds to 3 minutes · up to 50 MB. Aim for 60–90 seconds of one person speaking clearly, without music.</p></>}
          <label className="face-consent"><input type="checkbox" checked={consent} disabled={locked} onChange={event=>setConsent(event.target.checked)}/> I own this voice or have permission to clone and use it.</label>
          <div className="face-actions"><button className="face-primary" disabled={locked || !consent || (source==='video' ? !recordingId : !file)} onClick={()=>void createVoice()}>{busy==='voice' ? progress===null ? 'Starting voice setup…' : `Uploading ${progress}%` : studio?.voice ? 'Replace voice' : 'Create voice'}</button>
          {studio?.voice && <button className="face-text" disabled={locked} onClick={()=>setConfirmRemove(studio.voice!.id)}>Remove voice</button>}</div>
          {progress!==null && <progress value={progress} max="100" aria-label="Voice upload progress"/>}
          {confirmRemove && <div className="face-confirm"><p>Remove this voice from ElevenLabs? Existing generated videos will remain available.</p><button className="face-secondary" disabled={locked} onClick={()=>setConfirmRemove('')}>Keep voice</button><button className="face-primary" disabled={locked} onClick={()=>void removeVoice(confirmRemove)}>Remove</button></div>}
          {voiceJob?.status==='verification_required' && <button className="face-text" disabled={locked} onClick={()=>setConfirmRemove(voiceJob.id)}>Remove unverified voice</button>}
        </> : <p>Only workspace owners and admins can set up a voice or generate videos.</p>}
      </section>
      <section className="face-card" aria-labelledby="generate-title"><h2 id="generate-title">Create a video</h2>
        <p>Write the exact words you want to say. We’ll generate the narration in your saved voice, then sync your face recording to that audio.</p>
        <label className="face-script-label" htmlFor="face-narration">Your script</label>
        <textarea id="face-narration" rows={8} maxLength={2500} value={script} disabled={!canWrite || !!busy} onChange={event=>setScript(event.target.value)} placeholder="Hey, I wanted to walk you through something…"/>
        <p className="face-meta">{script.length.toLocaleString()} / 2,500 characters{estimatedSeconds>0 && ` · roughly ${estimatedSeconds} seconds of speech`}</p>
        {recordingId && <p className="face-meta">Keep the narration within your {Math.round(duration)}-second face recording. If it runs longer, we’ll save the audio and ask you to shorten the script.</p>}
        {estimatedSeconds>duration && recordingId && <p className="face-error">This script may be longer than your recording. Consider shortening it before generating.</p>}
        {(!studio?.voice || !recordingId) && <p>Save a face recording and finish voice setup to enable generation.</p>}
        {studio && recordingId && <p className="face-meta">Each generation uses paid ElevenLabs and fal credits. Video rendering is up to ${studio.video_cost_ceiling_usd.toFixed(2)} for your recording, plus narration. Up to {studio.daily_render_limit} generations per day.</p>}
        {canWrite && <button className="face-primary" disabled={locked || !studio?.voice || !recordingId || !script.trim()} onClick={()=>void generate()}>{busy==='render' ? 'Starting generation…' : 'Generate audio + video'}</button>}
        {activeRender && <JobProgress key={activeRender.id} kind="render" status={activeRender.status} createdAt={activeRender.created_at} />}
        {busy==='render' && !activeRender && <JobProgress kind="render" status="submitting" />}
        {studio?.busy && !activeRender && <p role="status">Voice setup is processing. You can generate a video when it finishes.</p>}
      </section>
    </div>
    {error && <p className="face-error" role="alert">{error} <button className="face-text" onClick={()=>{setError('');setReload(value=>value+1);}}>Refresh status</button></p>}
    <section className="face-card face-results" aria-labelledby="results-title"><h2 id="results-title">Generated videos</h2>
      {studio && renders.length===0 && <p>Your generated audio and videos will appear here.</p>}
      {renders.map(job=><article className="face-result" key={job.id}><div className="face-result-heading"><strong>{labels[job.status] || job.status}</strong><span>{new Date(job.created_at).toLocaleString()}</span></div>{job.script && <p className="face-result-script">{job.script}</p>}{inProgress(job) && <p role="status">Creating your narration and lip-synced video…</p>}{job.error && <p className="face-error">{job.error}</p>}{job.video_available && <video src={`${API}/generations/${job.id}/video`} controls playsInline preload="metadata" aria-label="Generated talking-head video"/>}{job.audio_available && <audio src={`${API}/generations/${job.id}/audio`} controls preload="metadata" aria-label="Generated narration"/>}<div className="face-actions">{job.audio_available && <a href={`${API}/generations/${job.id}/audio`} download="narration.mp3">Download audio</a>}{job.video_available && <a href={`${API}/generations/${job.id}/video`} download="talking-head.mp4">Download video</a>}</div></article>)}
    </section>
  </div>;
}
