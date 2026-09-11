// Classic web worker for the teleprompter speech recognizer.
// Runs sherpa-onnx WebAssembly (SIMD, no pthreads) with the streaming
// zipformer English 20M int8 model. All engine and model files are served
// same-origin from /asr/. See docs/teleprompter-asr.md.
//
// Messages in:
//   { type: 'audio', samples: Float32Array, sampleRate: number }  mono PCM in [-1, 1]
//   { type: 'reset' }   free the stream and create a new one, transcript starts empty
// Messages out:
//   { type: 'ready' }
//   { type: 'partial', text: string }   full transcript so far, posted only when it changed
//   { type: 'resetDone' }
//   { type: 'error', message: string }

/* global importScripts, createOnlineRecognizer */

const ASR_BASE = '/asr/';
const TARGET_RATE = 16000;
const CHUNK = 1600; // 100 ms at 16 kHz
const MODEL = {
  encoder: 'encoder-epoch-99-avg-1.int8.onnx',
  decoder: 'decoder-epoch-99-avg-1.int8.onnx',
  joiner: 'joiner-epoch-99-avg-1.int8.onnx',
  tokens: 'tokens.txt',
};

let recognizer = null;
let stream = null;
let lastText = '';
const files = {};

// Pending 16 kHz samples not yet handed to acceptWaveform.
let pending = new Float32Array(CHUNK);
let pendingLen = 0;

// Linear-interpolation resampler state. `phase` is the fractional read
// position carried over between batches so the seam between two batches is
// continuous. `lastSample` is the final input sample of the previous batch.
let phase = 0;
let lastSample = 0;
let lastRate = 0;

function fail(err) {
  postMessage({ type: 'error', message: String((err && err.stack) || err) });
}

// Assigned on the global scope on purpose: the Emscripten loader reads
// `Module` from globalThis, and a bundler must not remove it as unused.
self.Module = {
  locateFile: (name) => ASR_BASE + name,
  print: () => {},
  printErr: () => {},
  preRun: [
    () => {
      for (const [name, bytes] of Object.entries(files)) {
        self.Module.FS_createDataFile('/', name, bytes, true, false, false);
      }
    },
  ],
  onRuntimeInitialized: () => {
    try {
      recognizer = createOnlineRecognizer(self.Module, {
        featConfig: { sampleRate: TARGET_RATE, featureDim: 80 },
        modelConfig: {
          transducer: { encoder: '/' + MODEL.encoder, decoder: '/' + MODEL.decoder, joiner: '/' + MODEL.joiner },
          paraformer: { encoder: '', decoder: '' },
          zipformer2Ctc: { model: '' },
          nemoCtc: { model: '' },
          toneCtc: { model: '' },
          tokens: '/' + MODEL.tokens,
          numThreads: 1,
          provider: 'cpu',
          debug: 0,
          modelType: '',
          modelingUnit: '',
          bpeVocab: '',
        },
        decodingMethod: 'greedy_search',
        maxActivePaths: 4,
        enableEndpoint: 0,
        rule1MinTrailingSilence: 2.4,
        rule2MinTrailingSilence: 1.2,
        rule3MinUtteranceLength: 20,
        hotwordsFile: '',
        hotwordsScore: 1.5,
        ctcFstDecoderConfig: { graph: '', maxActive: 3000 },
        ruleFsts: '',
        ruleFars: '',
      });
      stream = recognizer.createStream();
      postMessage({ type: 'ready' });
    } catch (err) {
      fail(err);
    }
  },
};

// Resample `input` from `rate` to 16 kHz with linear interpolation.
function resample(input, rate) {
  if (rate === TARGET_RATE) return input;
  if (rate !== lastRate) {
    lastRate = rate;
    phase = 0;
    lastSample = 0;
  }
  const step = rate / TARGET_RATE;
  // Positions are relative to the previous batch's last sample at index -1.
  const outLen = Math.floor((input.length - phase) / step) + 1;
  const out = new Float32Array(Math.max(0, outLen));
  let pos = phase - 1; // -1 means lastSample
  let n = 0;
  for (; n < out.length; n++) {
    const i = Math.floor(pos);
    const frac = pos - i;
    const a = i < 0 ? lastSample : input[i];
    const bIdx = i + 1;
    if (bIdx >= input.length) break;
    const b = input[bIdx];
    out[n] = a + (b - a) * frac;
    pos += step;
  }
  phase = pos + 1 - input.length;
  lastSample = input[input.length - 1];
  return n === out.length ? out : out.subarray(0, n);
}

function decodeAndPost() {
  while (recognizer.isReady(stream)) recognizer.decode(stream);
  const text = recognizer.getResult(stream).text || '';
  if (text !== lastText) {
    lastText = text;
    postMessage({ type: 'partial', text });
  }
}

function feed(samples) {
  let offset = 0;
  while (offset < samples.length) {
    const n = Math.min(samples.length - offset, CHUNK - pendingLen);
    pending.set(samples.subarray(offset, offset + n), pendingLen);
    pendingLen += n;
    offset += n;
    if (pendingLen === CHUNK) {
      stream.acceptWaveform(TARGET_RATE, pending);
      pendingLen = 0;
      decodeAndPost();
    }
  }
}

function reset() {
  if (stream) stream.free();
  stream = recognizer.createStream();
  lastText = '';
  pendingLen = 0;
  phase = 0;
  lastSample = 0;
  postMessage({ type: 'resetDone' });
}

onmessage = (e) => {
  const m = e.data;
  try {
    if (m.type === 'audio') {
      if (!recognizer) return; // audio before ready is dropped
      feed(resample(m.samples, m.sampleRate));
    } else if (m.type === 'reset') {
      if (!recognizer) return;
      reset();
    }
  } catch (err) {
    fail(err);
  }
};

(async () => {
  await Promise.all(
    Object.values(MODEL).map(async (name) => {
      const res = await fetch(ASR_BASE + name);
      if (!res.ok) throw new Error(`fetch ${ASR_BASE}${name}: ${res.status}`);
      files[name] = new Uint8Array(await res.arrayBuffer());
    }),
  );
  importScripts(ASR_BASE + 'sherpa-onnx-wasm-main-asr.js'); // runs preRun, then onRuntimeInitialized
  importScripts(ASR_BASE + 'sherpa-onnx-asr.js');
})().catch(fail);
