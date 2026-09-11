// Page-side API for the in-browser teleprompter speech recognizer.
// The engine runs in a classic web worker (asr.worker.js). Microphone audio
// reaches it through an AudioWorklet (asr.worklet.js). See
// docs/teleprompter-asr.md for the file list and the message protocol.

// The worklet URL is imported as an asset. `no-inline` keeps it a real file
// under /assets/ instead of a data: URL, which a strict CSP would block.
import workletUrl from './asr.worklet.js?url&no-inline';
import { createVoiceDetector } from './voice-detector';

export type Recognizer = {
  /** Begins feeding the stream's audio track to the worker. Waits for the engine to be ready. */
  start(stream: MediaStream): Promise<void>;
  /** Stops feeding audio. The engine stays loaded. */
  stop(): void;
  /** Frees and recreates the stream inside the worker so the transcript starts empty. */
  reset(): void;
  /** Terminates the worker and closes the AudioContext. */
  dispose(): void;
};

export type RecognizerEvents = {
  onPartial(text: string): void;
  onError(message: string): void;
  /** Voice activity. Called only when the value changes. The first call is always true. */
  onVoice?(active: boolean): void;
};

const ASR_BASE = '/asr/';
const LARGE_FILES = [
  'sherpa-onnx-wasm-main-asr.wasm',
  'encoder-epoch-99-avg-1.int8.onnx',
  'decoder-epoch-99-avg-1.int8.onnx',
  'joiner-epoch-99-avg-1.int8.onnx',
  'tokens.txt',
];

type WorkerMessage =
  | { type: 'ready' }
  | { type: 'partial'; text: string }
  | { type: 'resetDone' }
  | { type: 'error'; message: string };

/** true when Worker, AudioWorklet, and WebAssembly exist. */
export function recognizerSupported(): boolean {
  return (
    typeof Worker !== 'undefined' &&
    typeof AudioWorkletNode !== 'undefined' &&
    typeof AudioContext !== 'undefined' &&
    typeof WebAssembly !== 'undefined'
  );
}

/**
 * Warms the browser cache: fetches the five large files and discards the
 * bodies. Safe to call many times. Never throws.
 */
export function preloadRecognizer(): void {
  try {
    if (typeof fetch === 'undefined') return;
    for (const name of LARGE_FILES) {
      // Read the whole body. Cancelling it would abort the request before
      // the browser stores the file in its HTTP cache.
      fetch(ASR_BASE + name)
        .then((res) => res.arrayBuffer())
        .then(() => {})
        .catch(() => {});
    }
  } catch {
    // Preloading is best effort.
  }
}

/**
 * Creates the worker immediately and starts loading the engine. Loading
 * errors go to onError. start() waits for ready.
 */
export function createRecognizer(events: RecognizerEvents): Recognizer {
  const worker = new Worker(new URL('./asr.worker.js', import.meta.url));
  let disposed = false;
  let audioContext: AudioContext | null = null;
  let workletReady: Promise<void> | null = null;
  let sourceNode: MediaStreamAudioSourceNode | null = null;
  let captureNode: AudioWorkletNode | null = null;
  let feeding = false;
  const voice = createVoiceDetector();

  function setVoice(change: boolean | null): void {
    if (change !== null) events.onVoice?.(change);
  }

  let readyResolve: () => void = () => {};
  let readyReject: (err: Error) => void = () => {};
  const ready = new Promise<void>((resolve, reject) => {
    readyResolve = resolve;
    readyReject = reject;
  });
  // A load failure is reported through onError. Keep the promise from
  // surfacing as an unhandled rejection when nobody calls start().
  ready.catch(() => {});

  worker.onmessage = (e: MessageEvent<WorkerMessage>) => {
    const m = e.data;
    if (m.type === 'ready') {
      readyResolve();
    } else if (m.type === 'partial') {
      events.onPartial(m.text);
    } else if (m.type === 'error') {
      readyReject(new Error(m.message));
      events.onError(m.message);
    }
  };
  worker.onerror = (e: ErrorEvent) => {
    const message = e.message || 'speech recognizer worker failed';
    readyReject(new Error(message));
    events.onError(message);
  };

  function getContext(): AudioContext {
    if (!audioContext) {
      audioContext = new AudioContext({ sampleRate: 16000 });
      workletReady = audioContext.audioWorklet.addModule(workletUrl);
    }
    return audioContext;
  }

  function stopFeeding(): void {
    feeding = false;
    if (voice.active()) {
      voice.reset();
      setVoice(false);
    }
    if (captureNode) {
      captureNode.port.onmessage = null;
      captureNode.disconnect();
      captureNode = null;
    }
    if (sourceNode) {
      sourceNode.disconnect();
      sourceNode = null;
    }
  }

  return {
    async start(stream: MediaStream): Promise<void> {
      if (disposed) throw new Error('recognizer is disposed');
      const track = stream.getAudioTracks()[0];
      if (!track) throw new Error('stream has no audio track');
      const ctx = getContext();
      await Promise.all([ready, workletReady]);
      if (disposed) return;
      if (ctx.state === 'suspended') await ctx.resume();
      stopFeeding();
      voice.reset();
      feeding = true;
      sourceNode = ctx.createMediaStreamSource(new MediaStream([track]));
      captureNode = new AudioWorkletNode(ctx, 'asr-capture', {
        numberOfInputs: 1,
        numberOfOutputs: 0,
        channelCount: 1,
        channelCountMode: 'explicit',
        channelInterpretation: 'speakers',
      });
      captureNode.port.onmessage = (e: MessageEvent<{ type: 'audio'; samples: Float32Array; sampleRate: number }>) => {
        if (!feeding || disposed) return;
        const m = e.data;
        setVoice(voice.push(m.samples, m.sampleRate));
        worker.postMessage(m, [m.samples.buffer]);
      };
      sourceNode.connect(captureNode);
    },

    stop(): void {
      stopFeeding();
    },

    reset(): void {
      if (disposed) return;
      worker.postMessage({ type: 'reset' });
    },

    dispose(): void {
      if (disposed) return;
      disposed = true;
      stopFeeding();
      worker.terminate();
      if (audioContext) {
        audioContext.close().catch(() => {});
        audioContext = null;
      }
    },
  };
}
