# Teleprompter speech recognizer

The teleprompter on the Face Cloning page follows the speaker with an in-browser speech recognizer. No audio leaves the browser.

## Engine

The engine is sherpa-onnx v1.13.7 compiled to WebAssembly (SIMD, no pthreads). It runs the streaming zipformer English model `sherpa-onnx-streaming-zipformer-en-20M-2023-02-17` in int8. The output is uppercase English with no punctuation. Every partial result holds the full text of the stream so far.

The engine needs no SharedArrayBuffer and no COOP/COEP headers.

## Files

All seven files are served same-origin from `/asr/`. They live in `landing/public/asr/`.

| File | Bytes | In git | Source |
|---|---|---|---|
| `sherpa-onnx-wasm-main-asr.js` | 78,744 | yes | sherpa-onnx release tarball, patched (see below) |
| `sherpa-onnx-asr.js` | 53,867 | yes | sherpa-onnx release tarball, unchanged |
| `sherpa-onnx-wasm-main-asr.wasm` | 13,150,239 | no | sherpa-onnx release tarball |
| `encoder-epoch-99-avg-1.int8.onnx` | 42,845,182 | no | Hugging Face model repo |
| `decoder-epoch-99-avg-1.int8.onnx` | 539,499 | no | Hugging Face model repo |
| `joiner-epoch-99-avg-1.int8.onnx` | 259,572 | no | Hugging Face model repo |
| `tokens.txt` | 5,048 | no | Hugging Face model repo |

Release tarball: `https://github.com/k2-fsa/sherpa-onnx/releases/download/v1.13.7/sherpa-onnx-wasm-simd-v1.13.7-en-asr-zipformer.tar.bz2`

Model repo: `https://huggingface.co/csukuangfj/sherpa-onnx-streaming-zipformer-en-20M-2023-02-17/resolve/main/<name>`

## Build-time fetch

The five large files are not in git. `landing/.gitignore` lists `public/asr/*.wasm`, `public/asr/*.onnx`, and `public/asr/tokens.txt`.

`landing/scripts/fetch-asr.mjs` downloads them. `package.json` runs it as `prebuild`, so `npm run build` on Vercel fetches them before `vite build`. The script:

1. Skips a file when it exists with the exact expected byte size.
2. Downloads the release tarball to a temp directory and extracts only the `.wasm` member.
3. Downloads the four model files from Hugging Face.
4. Fails with a clear message when a downloaded file does not have the expected byte size.

It uses Node 24 and the system `tar`. It has no dependencies. Run it by hand with `node scripts/fetch-asr.mjs` from `landing/`.

## Loader patch

The release tarball ships `sherpa-onnx-wasm-main-asr.js` with an Emscripten preload block. That block downloads a 190 MB `.data` pack that holds a different, larger model. We do not use that pack. The committed copy of the loader has that block removed. It is the IIFE that starts with `(()=>{var isPthread=` and ends with `remote_package_size:190951044})})()`, near the top of the file. Nothing else changed.

When sherpa-onnx is upgraded, redo this patch on the new loader, then update the file sizes in `scripts/fetch-asr.mjs` and in this document. The model files are fetched by the worker and written into MEMFS with `Module.FS_createDataFile` in `preRun`, so the `.data` pack is never needed.

## Page API

`landing/src/face-cloning/asr.ts` exports:

```ts
recognizerSupported(): boolean
// true when Worker, AudioWorklet, and WebAssembly exist.

preloadRecognizer(): void
// Fetches the five large files and discards the bodies, to warm the browser cache.
// Safe to call many times. Never throws. Call it on the consent screen.

createRecognizer(events: { onPartial(text: string): void; onError(message: string): void }): Recognizer
// Creates the worker at once and starts loading the engine. Load errors go to onError.

type Recognizer = {
  start(stream: MediaStream): Promise<void>; // waits for the engine, then feeds the first audio track
  stop(): void;                              // stops feeding; the engine stays loaded
  reset(): void;                             // the transcript starts empty
  dispose(): void;                           // terminates the worker and closes the AudioContext
};
```

`onPartial` receives the full transcript so far. It fires only when the text changed. `reset()` does not fire `onPartial`. The page clears its own display when it calls `reset()`.

## How audio flows

1. `start()` creates one `AudioContext` with `{ sampleRate: 16000 }`. A browser can ignore that request.
2. `start()` wraps the first audio track in a new `MediaStream`, so the video track is untouched.
3. `asr.worklet.js` is an `AudioWorkletProcessor`. It takes channel 0, collects about 100 ms of samples at the context's real sample rate, and posts one `Float32Array` batch with the sample rate to the page.
4. The page forwards each batch to the worker with a transferred buffer.
5. `asr.worker.js` resamples to 16 kHz with linear interpolation when the sample rate is not 16 kHz. It keeps the fractional position between batches so the seam is continuous.
6. The worker feeds the engine in chunks of 1600 samples (100 ms), calls `decode` while `isReady`, and posts a partial when the text changed.

## Worker messages

Page to worker:

- `{ type: 'audio', samples: Float32Array, sampleRate: number }` mono PCM in [-1, 1].
- `{ type: 'reset' }` frees the stream and creates a new one.

Worker to page:

- `{ type: 'ready' }`
- `{ type: 'partial', text: string }`
- `{ type: 'resetDone' }`
- `{ type: 'error', message: string }`

The worker is a classic worker and uses `importScripts`. `type: 'module'` breaks it. Vite bundles the worker and the worklet as separate files under `/assets/`. The worklet URL is imported with `?url&no-inline` so Vite does not inline it as a `data:` URL.

## Measured latency

From the spike (Playwright, one 5.2 s clip, 100 ms chunks on a real-time schedule, latency from chunk sent to token shown):

- Chromium: median 323 ms.
- WebKit: median 325 ms.
- Firefox: median 477 ms, max 584 ms.

Engine load from worker start to `ready`, with the files in the local cache: Chromium 442 ms, WebKit 502 ms, Firefox 1,782 ms.

## Content Security Policy

`landing/vercel.json` sets `script-src 'self' ...` without `'wasm-unsafe-eval'`. Chromium blocks `WebAssembly.instantiate` under that policy. The CSP header needs `'wasm-unsafe-eval'` in `script-src` before this recognizer works on the deployed site.
