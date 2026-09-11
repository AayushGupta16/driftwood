// Downloads the large sherpa-onnx ASR files into public/asr/ before `vite build`.
// The two small JS files in public/asr/ are committed. These five are not.
// Node 24, no dependencies. Run: node scripts/fetch-asr.mjs
import { createWriteStream } from 'node:fs';
import { mkdir, mkdtemp, rm, stat, copyFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { pipeline } from 'node:stream/promises';
import { Readable } from 'node:stream';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';

const execFileP = promisify(execFile);
const outDir = fileURLToPath(new URL('../public/asr/', import.meta.url));

const RELEASE = 'v1.13.7';
const TARBALL = `https://github.com/k2-fsa/sherpa-onnx/releases/download/${RELEASE}/sherpa-onnx-wasm-simd-${RELEASE}-en-asr-zipformer.tar.bz2`;
const WASM = { name: 'sherpa-onnx-wasm-main-asr.wasm', size: 13150239 };

const HF = 'https://huggingface.co/csukuangfj/sherpa-onnx-streaming-zipformer-en-20M-2023-02-17/resolve/main/';
const MODEL = [
  { name: 'encoder-epoch-99-avg-1.int8.onnx', size: 42845182 },
  { name: 'decoder-epoch-99-avg-1.int8.onnx', size: 539499 },
  { name: 'joiner-epoch-99-avg-1.int8.onnx', size: 259572 },
  { name: 'tokens.txt', size: 5048 },
];

async function sizeOf(file) {
  try {
    return (await stat(file)).size;
  } catch {
    return -1;
  }
}

async function haveExact(file, size) {
  return (await sizeOf(file)) === size;
}

async function checkSize(file, size) {
  const got = await sizeOf(file);
  if (got !== size) {
    throw new Error(`fetch-asr: ${path.basename(file)} has ${got} bytes, expected ${size} bytes. Delete the file and run again. If the size stays wrong, the upstream file changed.`);
  }
}

async function download(url, dest) {
  const res = await fetch(url, { redirect: 'follow' });
  if (!res.ok || !res.body) {
    throw new Error(`fetch-asr: GET ${url} returned ${res.status} ${res.statusText}`);
  }
  await pipeline(Readable.fromWeb(res.body), createWriteStream(dest));
}

async function fetchModelFile({ name, size }) {
  const dest = path.join(outDir, name);
  if (await haveExact(dest, size)) {
    console.log(`fetch-asr: skip ${name} (present, ${size} bytes)`);
    return;
  }
  console.log(`fetch-asr: download ${name}`);
  await download(HF + name, dest);
  await checkSize(dest, size);
  console.log(`fetch-asr: ok ${name} (${size} bytes)`);
}

async function fetchWasm() {
  const dest = path.join(outDir, WASM.name);
  if (await haveExact(dest, WASM.size)) {
    console.log(`fetch-asr: skip ${WASM.name} (present, ${WASM.size} bytes)`);
    return;
  }
  const tmp = await mkdtemp(path.join(tmpdir(), 'fetch-asr-'));
  try {
    const tarball = path.join(tmp, 'asr.tar.bz2');
    console.log(`fetch-asr: download ${TARBALL}`);
    await download(TARBALL, tarball);
    // Extract only the .wasm. The tarball also holds a 190 MB .data pack that we do not use.
    // List members first and extract the exact member name. This works with GNU tar and BSD tar.
    const { stdout } = await execFileP('tar', ['-tjf', tarball], { maxBuffer: 1 << 20 });
    const member = stdout.split('\n').find((line) => line.endsWith('/' + WASM.name) || line === WASM.name);
    if (!member) throw new Error(`fetch-asr: ${WASM.name} not found in ${TARBALL}`);
    await execFileP('tar', ['-xjf', tarball, '-C', tmp, member]);
    await copyFile(path.join(tmp, member), dest);
    await checkSize(dest, WASM.size);
    console.log(`fetch-asr: ok ${WASM.name} (${WASM.size} bytes)`);
  } finally {
    await rm(tmp, { recursive: true, force: true });
  }
}

await mkdir(outDir, { recursive: true });
await Promise.all([fetchWasm(), ...MODEL.map(fetchModelFile)]);
console.log('fetch-asr: done');
