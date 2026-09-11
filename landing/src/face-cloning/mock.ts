import type { Job, Recording, Studio } from './model';
import { activeMockMode } from '../mock-mode.ts';

let capturedVideo: string | undefined;
export const recordingMediaUrl = (path: string) => activeMockMode() ? capturedVideo : path;

// Called only from dashboard mock mode. No requests reach the live API.
export function faceMock(params: URLSearchParams) {
  const key = 'driftwood.face-studio.fixture';
  const queryState = params.get('face');
  const initial = queryState && ['ready', 'generating', 'failed'].includes(queryState);
  let recording: Recording | null = initial ? {id: 'fixture-recording', filename: 'recording.webm', duration: 65, created_at: new Date().toISOString()} : null;
  let started = initial ? Date.now() - (queryState === 'ready' || queryState === 'failed' ? 30000 : 0) : 0;
  let source: Blob | null = null;
  if (!queryState) {
    try { const saved = JSON.parse(sessionStorage.getItem(key) || 'null'); if (saved) {recording = saved.recording; started = saved.started;} } catch { /* Empty fixture. */ }
  }
  function persist() { sessionStorage.setItem(key, JSON.stringify({recording, started})); }
  let preview: Job | null = null;
  return (init?: RequestInit, url = '') => {
    const path = new URL(url, location.origin).pathname;
    if (path.endsWith('/fixture-upload')) {
      source = init?.body instanceof Blob ? init.body : null;
      if (capturedVideo) URL.revokeObjectURL(capturedVideo);
      capturedVideo = source ? URL.createObjectURL(source) : undefined;
      return {saved: true};
    }
    if (path.endsWith('/upload')) return {id: 'fixture-recording', upload_url: '/api/v1/dashboard/face-cloning/fixture-upload', content_type: 'video/webm'};
    if (path.endsWith('/complete')) {
      if (queryState === 'save-error') return new Response(JSON.stringify({error: {detail: 'Connection interrupted. Your take is still here; retry saving.'}}), {status: 503});
      recording = {id: 'fixture-recording', filename: 'recording.webm', duration: 65, created_at: new Date().toISOString()};
      started = Date.now(); persist(); return recording;
    }
    if (path.endsWith('/video') || path.endsWith('/content')) return source ? new Response(source, {headers: {'Content-Type': source.type}}) : new Response(null, {status: 204});
    if (path.endsWith('/studio')) {
      const elapsed = Date.now() - started;
      preview = recording ? {id: 'fixture-preview', kind: 'render', status: elapsed < 7000 ? 'waiting_for_voice' : elapsed < 18000 ? 'running' : queryState === 'failed' ? 'failed' : 'ready', script: null, error: queryState === 'failed' ? 'Voice setup could not finish. Contact support to continue.' : null, created_at: new Date(started).toISOString(), audio_available: elapsed >= 18000, video_available: elapsed >= 18000 && queryState !== 'failed'} : null;
      return {preview, voice: preview?.status === 'ready' ? {...preview, id: 'fixture-voice', kind: 'voice'} : null, jobs: preview ? [preview] : [], busy: !!preview && ['waiting_for_voice', 'running'].includes(preview.status), video_cost_ceiling_usd: 8.67} satisfies Studio;
    }
    if (init?.method === 'DELETE') {recording = null; started = 0; persist(); return {deleted: true};}
    if (path.endsWith('/generate')) return new Response(JSON.stringify({error: {detail: 'This is a preview. Open your live dashboard to generate a custom video.'}}), {status: 400});
    return {recording};
  };
}

// Opt-in local QA uses an animated canvas + tone, never the user's devices.
export function installCaptureFixture(mode: string) {
  let starts = 0;
  let stops = 0;
  let requests = 0;
  let bytes = 0;
  let chunks = 0;
  const status = document.createElement('output');
  status.id = 'face-qa-status';
  status.style.cssText = 'position:fixed;bottom:0;right:0;background:#fff;padding:4px;font:11px sans-serif;z-index:9999';
  document.body.append(status);
  const update = () => { status.textContent = `QA · camera ${requests} · recorder starts ${starts} · stops ${stops} · chunks ${chunks} · bytes ${bytes}`; };
  update();
  const NativeRecorder = window.MediaRecorder;
  window.MediaRecorder = class extends NativeRecorder {
    constructor(stream: MediaStream, options?: MediaRecorderOptions) {
      super(stream, options);
      this.addEventListener('dataavailable', event => {chunks++; bytes += event.data.size; update();});
    }
    start(timeslice?: number) { super.start(timeslice); starts++; update(); }
    stop() { super.stop(); stops++; update(); }
  };
  navigator.mediaDevices.getUserMedia = async () => {
    requests++; update();
    if (mode === 'denied') throw new DOMException('Permission denied', 'NotAllowedError');
    const canvas = document.createElement('canvas');
    canvas.width = 1280; canvas.height = 720;
    const context = canvas.getContext('2d')!;
    const draw = () => {
      context.fillStyle = '#15557e'; context.fillRect(0, 0, 1280, 720);
      context.fillStyle = 'white'; context.font = '40px sans-serif'; context.fillText('Synthetic camera · continuous take', 160, 330);
      context.fillText(new Date().toISOString(), 270, 400);
    };
    draw();
    const animation = setInterval(draw, 33);
    const media = canvas.captureStream(30);
    const audioApi = window as unknown as {
      MediaStreamTrackGenerator: new (options: {kind: string}) => MediaStreamTrack & {writable: WritableStream<unknown>};
      AudioData: new (options: {format: string; sampleRate: number; numberOfFrames: number; numberOfChannels: number; timestamp: number; data: Float32Array}) => {close: () => void};
    };
    const audio = new audioApi.MediaStreamTrackGenerator({kind: 'audio'});
    const writer = audio.writable.getWriter();
    let sample = 0;
    let writing = false;
    const health = setInterval(() => {
      if (writing) return;
      writing = true;
      const samples = Float32Array.from({length: 960}, (_, index) => .2 * Math.sin(2 * Math.PI * 440 * (sample + index) / 48000));
      const frame = new audioApi.AudioData({format: 'f32', sampleRate: 48000, numberOfFrames: 960, numberOfChannels: 1, timestamp: sample * 1e6 / 48000, data: samples});
      sample += 960;
      void writer.write(frame).catch(() => {}).finally(() => {frame.close(); writing = false;});
    }, 20);
    media.addTrack(audio);
    media.getTracks().forEach(track => {
      const stop = track.stop.bind(track);
      track.stop = () => {stop(); clearInterval(animation); clearInterval(health); void writer.abort().catch(() => {});};
    });
    return media;
  };
}
