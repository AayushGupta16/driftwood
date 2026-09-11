import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useWorkspacePermissions } from '../dashboard/workspace-permissions-context';
import { API, json, post, uploadFile } from './api';
import { cameraError, clock, inProgress, PROMPTS, recordingMime } from './model';
import type { Job, Recording, Studio } from './model';
import VoiceStudio from './VoiceStudio';
import { recordingMediaUrl } from './mock';
import { createRecognizer, preloadRecognizer, recognizerSupported } from './asr';
import type { Recognizer } from './asr';
import { buildScript, createTracker } from './teleprompter';
import './face-cloning.css';

type Phase = 'idle' | 'requesting' | 'countdown' | 'recording' | 'saving' | 'save-error';
type Take = { file: File; upload?: { id: string; upload_url: string; content_type: string }; uploaded: boolean };
const MIN_SECONDS = 60;
const MAX_SECONDS = 175;
const MAX_BYTES = 200 * 1024 * 1024;
const SCRIPT = buildScript(PROMPTS);
const LINES = PROMPTS.map((_, index) => SCRIPT.filter(word => word.sentence === index));

export default function FaceCloning() {
  const { canWrite } = useWorkspacePermissions();
  const [recording, setRecording] = useState<Recording | null>(null);
  const [studio, setStudio] = useState<Studio | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [phase, setPhase] = useState<Phase>('idle');
  const [newTake, setNewTake] = useState(false);
  const [consent, setConsent] = useState(false);
  const [sentence, setSentence] = useState(0);
  const [cursor, setCursor] = useState(0);
  const [voiceOff, setVoiceOff] = useState(() => !recognizerSupported());
  const [seconds, setSeconds] = useState(0);
  const [countdown, setCountdown] = useState(3);
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState('');
  const [loadError, setLoadError] = useState('');
  const [preview, setPreview] = useState<Job | null>(null);
  const [confirmRemove, setConfirmRemove] = useState(false);
  const [removing, setRemoving] = useState(false);
  const video = useRef<HTMLVideoElement>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const recorder = useRef<MediaRecorder | null>(null);
  const stream = useRef<MediaStream | null>(null);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const recognizer = useRef<Recognizer | null>(null);
  const tracker = useRef<ReturnType<typeof createTracker> | null>(null);
  const prompter = useRef<HTMLDivElement>(null);
  const preloaded = useRef(false);
  const mounted = useRef(true);
  const refreshSequence = useRef(0);
  const busy = useRef(false);
  const pending = useRef<Take | null>(null);
  const intent = useRef<'discard' | 'save'>('discard');
  const saveRef = useRef<(take: Take) => Promise<void>>(async () => {});
  const previewJob = studio?.preview;
  const showingRecorder = !recording || newTake;
  const capturing = phase === 'recording' || phase === 'countdown';
  const working = capturing || phase === 'requesting' || phase === 'saving';

  function release() {
    if (timer.current) clearInterval(timer.current);
    timer.current = null;
    stream.current?.getTracks().forEach(track => { track.onended = null; track.stop(); });
    stream.current = null;
    if (video.current) video.current.srcObject = null;
    const engine = recognizer.current;
    recognizer.current = null; tracker.current = null;
    if (engine) { try { engine.stop(); engine.dispose(); } catch { /* Already gone. */ } }
  }
  async function refresh() {
    const sequence = ++refreshSequence.current;
    const [page, next] = await Promise.all([json<{recording: Recording | null}>(API), json<Studio>(`${API}/studio`)]);
    if (mounted.current && sequence === refreshSequence.current) { setRecording(page.recording); setStudio(next); setLoaded(true); setLoadError(''); }
  }
  useEffect(() => {
    mounted.current = true;
    let active = true;
    let poll: ReturnType<typeof setTimeout>;
    async function update() {
      try { await refresh(); }
      catch (reason) { if (active) setLoadError(cameraError(reason)); }
      if (active) poll = setTimeout(() => void update(), 5000);
    }
    void update();
    return () => {
      active = false; mounted.current = false; clearTimeout(poll);
      intent.current = 'discard';
      if (recorder.current?.state === 'recording') recorder.current.stop();
      release();
    };
  }, []);
  useEffect(() => {
    if (!working && phase !== 'save-error') return;
    const warn = (event: BeforeUnloadEvent) => { event.preventDefault(); };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [working, phase]);
  useEffect(() => {
    if (showingRecorder && !preloaded.current && recognizerSupported()) { preloaded.current = true; preloadRecognizer(); }
  }, [showingRecorder]);
  useLayoutEffect(() => {
    const box = prompter.current;
    const line = box?.querySelector<HTMLElement>(`[data-line="${sentence}"]`);
    if (!box || !line) return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const top = Math.max(0, line.offsetTop - box.clientHeight * 0.18);
    if (typeof box.scrollTo === 'function') box.scrollTo({ top, behavior: reduced ? 'auto' : 'smooth' });
    else box.scrollTop = top;
  }, [sentence]);
  useEffect(() => {
    if (preview) dialog.current?.showModal();
    else dialog.current?.close();
  }, [preview]);
  useEffect(() => {
    if (!confirmRemove) return;
    const timeout = setTimeout(() => setConfirmRemove(false), 5000);
    return () => clearTimeout(timeout);
  }, [confirmRemove]);

  async function save(take: Take) {
    setPhase('saving'); setError(''); setProgress(take.uploaded ? null : 0);
    try {
      if (!take.upload) take.upload = await post(`${API}/upload`, { filename: take.file.name, byte_size: take.file.size });
      if (!take.uploaded) {
        await uploadFile(take.upload!.upload_url, take.file, take.upload!.content_type, setProgress);
        take.uploaded = true;
      }
      if (mounted.current) setProgress(null);
      const saved = await post<Recording>(`${API}/${take.upload!.id}/complete`, { create_preview: true, consent: true });
      pending.current = null;
      if (!mounted.current) return;
      setRecording(saved); setNewTake(false); setPhase('idle');
      // The server has reserved the preview even if the following refresh fails.
      setStudio(current => current ? {...current, busy: true, preview: {id: '', kind: 'render', status: 'waiting_for_voice', script: null, error: null, created_at: new Date().toISOString(), audio_available: false, video_available: false}} : current);
      void refresh().catch(reason => { if (mounted.current) setLoadError(cameraError(reason)); });
    } catch (reason) {
      // An uncertain storage PUT can be abandoned safely before any jobs exist.
      if (!take.uploaded) take.upload = undefined;
      if (mounted.current) { setError(cameraError(reason)); setPhase('save-error'); }
    } finally { busy.current = false; }
  }
  useEffect(() => { saveRef.current = save; });

  function finish() {
    if (recorder.current?.state !== 'recording') return;
    intent.current = 'save';
    setPhase('saving');
    recorder.current.stop();
    release();
  }
  function cancel() {
    intent.current = 'discard';
    if (recorder.current?.state === 'recording') recorder.current.stop();
    release(); busy.current = false; setPhase('idle'); setSeconds(0); setSentence(0); setCursor(0);
  }
  async function start() {
    if (busy.current || !consent) return;
    busy.current = true; intent.current = 'discard'; setError(''); setSentence(0); setCursor(0); setSeconds(0); setPhase('requesting');
    try {
      if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) throw new Error('Recording is unavailable in this browser. Open this page in a current Chrome or Safari browser.');
      const mimeType = recordingMime(type => MediaRecorder.isTypeSupported(type));
      if (!mimeType) throw new Error('This browser cannot record a supported video. Try Chrome or Safari.');
      const media = await navigator.mediaDevices.getUserMedia({ video: { width: {ideal: 1280}, height: {ideal: 720}, frameRate: {ideal: 30, max: 30}, facingMode: 'user' }, audio: {echoCancellation: true, noiseSuppression: true} });
      if (!mounted.current) { media.getTracks().forEach(track => track.stop()); return; }
      stream.current = media;
      const settings = media.getVideoTracks()[0]?.getSettings();
      if (!settings || Math.min(settings.width ?? 0, settings.height ?? 0) < 720) throw new Error('Your camera needs to support at least 720p. Try another camera.');
      if (!media.getAudioTracks().length) throw new Error('No microphone was found. Connect one and try again.');
      if (video.current) { video.current.srcObject = media; await video.current.play(); }
      listen(media);
      const capture = new MediaRecorder(media, {mimeType, videoBitsPerSecond: 3_000_000, audioBitsPerSecond: 128_000});
      recorder.current = capture;
      const chunks: Blob[] = [];
      let bytes = 0;
      const fail = () => { cancel(); setError('Recording was interrupted. Check your camera and microphone, then start again.'); };
      media.getTracks().forEach(track => { track.onended = fail; });
      capture.onerror = fail;
      capture.ondataavailable = event => {
        if (event.data.size) { chunks.push(event.data); bytes += event.data.size; }
        if (bytes > MAX_BYTES && capture.state === 'recording') { cancel(); setError('The recording is too large. Please record a shorter take.'); }
      };
      capture.onstop = () => {
        const current = recorder.current === capture;
        if (current) recorder.current = null;
        if (!current || intent.current !== 'save' || !mounted.current) return;
        const file = new File(chunks, `recording-${crypto.randomUUID()}.${mimeType.includes('webm') ? 'webm' : 'mp4'}`, { type: mimeType });
        if (!file.size || file.size > MAX_BYTES) { setError('The recording could not be saved. Please record again.'); setPhase('idle'); busy.current = false; return; }
        const take = {file, uploaded: false}; pending.current = take;
        void saveRef.current(take);
      };
      let count = 3;
      setCountdown(count); setPhase('countdown');
      timer.current = setInterval(() => {
        count -= 1;
        if (count > 0) { setCountdown(count); return; }
        if (timer.current) clearInterval(timer.current);
        try { capture.start(1000); }
        catch { fail(); return; }
        tracker.current = createTracker(SCRIPT);
        recognizer.current?.reset();
        setCursor(0); setSentence(0);
        setPhase('recording');
        const started = Date.now();
        timer.current = setInterval(() => {
          const elapsed = Math.floor((Date.now() - started) / 1000);
          setSeconds(elapsed);
          if (elapsed >= MAX_SECONDS) finish();
        }, 250);
      }, 1000);
    } catch (reason) {
      release(); busy.current = false;
      if (mounted.current) { setPhase('idle'); setError(cameraError(reason)); }
    }
  }
  // The recognizer warms during the countdown. It must never delay the recording.
  function listen(media: MediaStream) {
    if (!recognizerSupported()) { setVoiceOff(true); return; }
    try {
      const engine = createRecognizer({
        onPartial: text => {
          if (recognizer.current !== engine || !tracker.current || !mounted.current) return;
          const position = tracker.current.feed(text);
          setCursor(position.cursor); setSentence(position.sentence);
        },
        onError: () => { if (recognizer.current === engine && mounted.current) setVoiceOff(true); },
      });
      recognizer.current = engine;
      engine.start(media).catch(() => { if (recognizer.current === engine && mounted.current) setVoiceOff(true); });
    } catch { setVoiceOff(true); }
  }
  function next() {
    if (sentence >= PROMPTS.length - 1) { finish(); return; }
    const position = tracker.current?.jumpToSentence(sentence + 1);
    if (position) { setSentence(position.sentence); setCursor(position.cursor); }
    else setSentence(value => value + 1);
  }
  async function remove() {
    if (busy.current) return;
    if (!confirmRemove) { setConfirmRemove(true); return; }
    setRemoving(true);
    busy.current = true; setError('');
    try {
      await json(API, {method: 'DELETE'});
      setRecording(null); setNewTake(false); setConsent(false); setConfirmRemove(false); setStudio(current => current ? {...current, preview: null} : current);
    } catch (reason) { setError(cameraError(reason)); }
    finally { busy.current = false; setRemoving(false); }
  }
  const recordingDisabled = !loaded || !canWrite || !consent || !!studio?.busy || !!loadError;
  const disabledReason = !canWrite ? 'Only workspace owners and admins can record.' : !loaded || loadError ? 'Waiting for workspace status.' : studio?.busy ? 'Wait for the current generation to finish.' : !consent ? 'Confirm permission to use your face and voice.' : undefined;
  const cue = phase === 'recording' && sentence === PROMPTS.length - 1 && seconds < MIN_SECONDS ? `Keep speaking naturally · ${MIN_SECONDS - seconds}s to go` : PROMPTS[sentence][0];

  return <div className="face-cloning">
    <header><h1>Face cloning</h1></header>
    <section className={`face-capture ${!loaded ? 'face-loading' : ''}`} aria-label="Face recording">
      {showingRecorder ? <>
        <div className="face-prompt">
          <div className="face-steps"><span>{sentence + 1} / {PROMPTS.length}</span><div aria-hidden="true">{PROMPTS.map((_, index) => <i key={index} className={index <= sentence ? 'is-current' : ''}/>)}</div></div>
          <div ref={prompter} className="face-script" data-sentence={sentence} data-cursor={cursor} aria-label="Script">
            {LINES.map((words, index) => <p key={index} data-line={index} className={index === sentence ? 'is-current' : ''}>
              <small>{PROMPTS[index][0]}</small>
              {words.map(word => <span key={word.index} className={word.index < cursor ? 'is-spoken' : word.index === cursor ? 'is-current' : ''}>{word.text}</span>).flatMap(node => [node, ' '])}
            </p>)}
          </div>
          {voiceOff && <p className="face-voice-off">Voice tracking is off in this browser. Use Next sentence.</p>}
        </div>
        <div className={`face-camera ${capturing ? 'is-live' : ''}`}>
          <video ref={video} muted playsInline aria-label="Live camera preview" />
          {!capturing && <svg className="face-outline" viewBox="0 0 240 190" aria-hidden="true"><rect x="8" y="8" width="224" height="174" rx="28"/><ellipse cx="120" cy="72" rx="32" ry="40"/><path d="M48 175c0-67 144-67 144 0"/></svg>}
          {phase === 'countdown' && <span className="face-countdown" role="status">{countdown}</span>}
        </div>
        <div className="face-capture-footer"><span>{cue}</span><span className={phase === 'recording' ? 'face-timer is-recording' : 'face-timer'}>{phase === 'recording' && <i/>}{clock(seconds)}<span> / at least 1:00</span></span></div>
      </> : <div className="face-saved">
        <video src={recordingMediaUrl(`${API}/content?v=${recording?.id}`)} muted playsInline preload="metadata" aria-label="Saved face recording" />
        <div className="face-saved-status" role="status">
          {inProgress(previewJob) ? <><div className="face-processing" aria-label="Generating preview"/><h2>{previewJob?.status === 'waiting_for_voice' ? 'Preparing your voice' : 'Generating your preview'}</h2><p>You can leave this page. We’ll keep going.</p></>
            : previewJob?.video_available ? <><span className="face-ready-mark" aria-hidden="true">✓</span><h2>Your preview is ready</h2><button className="face-primary" onClick={() => setPreview(previewJob)}>View preview</button></>
            : previewJob?.status === 'failed' ? <><h2>Preview couldn’t finish</h2><p className="face-error">{previewJob.error || 'Please contact support to continue.'}</p></>
            : <><h2>Your recording is saved</h2><p>{Math.round(recording?.duration ?? 0)} seconds</p></>}
        </div>
      </div>}
    </section>
    <div className="face-controls">
      {showingRecorder && phase === 'idle' && <>
        {canWrite && <label className="face-consent"><input type="checkbox" checked={consent} onChange={event => setConsent(event.target.checked)}/> I have permission to use this face and voice.</label>}
        <div className="face-actions"><button className="face-primary" disabled={recordingDisabled} title={disabledReason} onClick={() => void start()}>Start recording</button>{recording && <button className="face-secondary" onClick={() => {setNewTake(false); setError('');}}>Cancel</button>}</div>
      </>}
      {(phase === 'requesting' || phase === 'countdown') && <div className="face-actions"><button className="face-primary" disabled title="Recording will start after camera access and the countdown.">{phase === 'requesting' ? 'Opening camera…' : `Starting in ${countdown}…`}</button>{phase === 'countdown' && <button className="face-secondary" onClick={cancel}>Cancel</button>}</div>}
      {phase === 'recording' && <div className="face-actions"><button className="face-primary" disabled={sentence === PROMPTS.length - 1 && seconds < MIN_SECONDS} title={seconds < MIN_SECONDS ? 'Keep recording for at least one minute.' : undefined} onClick={next}>{sentence < PROMPTS.length - 1 ? 'Next sentence' : 'Finish recording'}</button><button className="face-secondary" onClick={cancel}>Start over</button></div>}
      {phase === 'saving' && <div className="face-save-progress" role="status"><strong>{progress === null ? 'Preparing your preview…' : `Saving recording · ${progress}%`}</strong><progress max={100} value={progress ?? undefined}/><p>Keep this page open until saving finishes.</p></div>}
      {phase === 'save-error' && <div className="face-actions"><button className="face-primary" onClick={() => { if (pending.current && !busy.current) {busy.current = true; void save(pending.current);} }}>Retry saving</button><button className="face-secondary" onClick={() => {pending.current = null; cancel();}}>Record again</button></div>}
      {!showingRecorder && canWrite && <div className="face-actions"><button className="face-secondary" disabled={!!studio?.busy || removing} title={removing ? 'Removing your recording.' : studio?.busy ? 'Wait for generation to finish.' : undefined} onClick={() => {setNewTake(true); setSentence(0); setCursor(0); setSeconds(0); setConsent(false); setError('');}}>Record again</button><button className="face-text" disabled={!!studio?.busy || removing} title={removing ? 'Removing your recording.' : studio?.busy ? 'Wait for generation to finish.' : undefined} onClick={() => void remove()}>{removing ? 'Removing…' : confirmRemove ? 'Confirm removal' : 'Remove recording'}</button></div>}
      {error && <p className="face-error" role="alert">{error}</p>}
      {loadError && <p className="face-error" role="alert">{loadError} <button className="face-text" onClick={() => void refresh().catch(reason => setLoadError(cameraError(reason)))}>Refresh</button></p>}
      {!canWrite && <p>Only workspace owners and admins can record.</p>}
    </div>
    {recording && !showingRecorder && studio && <VoiceStudio studio={studio} duration={recording.duration} canWrite={canWrite} onRefresh={refresh} onPreview={setPreview}/>}
    <dialog ref={dialog} className="face-preview-dialog" aria-labelledby="face-preview-title" onClose={() => setPreview(null)} onClick={event => {if (event.target === event.currentTarget) setPreview(null);}}>
      {preview && <><div className="face-preview-heading"><h2 id="face-preview-title">Your preview</h2><button className="face-secondary" onClick={() => setPreview(null)} aria-label="Close preview">Close</button></div><video src={recordingMediaUrl(`${API}/generations/${preview.id}/video`)} controls playsInline autoPlay aria-label="Generated video preview"/></>}
    </dialog>
  </div>;
}
