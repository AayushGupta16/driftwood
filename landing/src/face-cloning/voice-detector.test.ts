/// <reference types="node" />

import { test } from "node:test";
import assert from "node:assert/strict";
import { createVoiceDetector, VOICE_HANGOVER_SECONDS } from "./voice-detector.ts";

const RATE = 16000;
const BATCH_SECONDS = 0.1;
const BATCH = Math.round(RATE * BATCH_SECONDS);

function sine(amplitude: number, freq = 220, phase = 0): Float32Array {
  const out = new Float32Array(BATCH);
  for (let i = 0; i < BATCH; i++) {
    out[i] = amplitude * Math.sin(phase + (2 * Math.PI * freq * i) / RATE);
  }
  return out;
}

const silence = () => new Float32Array(BATCH);

/** Feeds `seconds` of batches and returns the non-null results. */
function feed(
  detector: ReturnType<typeof createVoiceDetector>,
  seconds: number,
  make: () => Float32Array,
): boolean[] {
  const changes: boolean[] = [];
  const n = Math.round(seconds / BATCH_SECONDS);
  for (let i = 0; i < n; i++) {
    const r = detector.push(make(), RATE);
    if (r !== null) changes.push(r);
  }
  return changes;
}

test("silence never becomes active", () => {
  const d = createVoiceDetector();
  assert.deepEqual(feed(d, 5, silence), []);
  assert.equal(d.active(), false);
});

test("a 0.2 amplitude sine for 300 ms becomes active exactly once", () => {
  const d = createVoiceDetector();
  assert.deepEqual(feed(d, 0.3, () => sine(0.2)), [true]);
  assert.equal(d.active(), true);
});

test("silence after speech becomes inactive after about 400 ms", () => {
  const d = createVoiceDetector();
  feed(d, 0.3, () => sine(0.2));
  assert.equal(d.active(), true);
  const results: (boolean | null)[] = [];
  for (let i = 0; i < 6; i++) results.push(d.push(silence(), RATE));
  const off = results.indexOf(false);
  assert.ok(off >= 0, "never became inactive");
  const elapsed = (off + 1) * BATCH_SECONDS;
  assert.ok(Math.abs(elapsed - VOICE_HANGOVER_SECONDS) < 0.11, `inactive after ${elapsed}s`);
  assert.deepEqual(results.filter((r) => r !== null), [false]);
  assert.equal(d.active(), false);
});

test("a quiet hum at amplitude 0.004 never becomes active", () => {
  const d = createVoiceDetector();
  assert.deepEqual(feed(d, 5, () => sine(0.004, 60)), []);
  assert.equal(d.active(), false);
});

test("speech at 0.05 over a hum floor of 0.004 becomes active", () => {
  const d = createVoiceDetector();
  assert.deepEqual(feed(d, 3, () => sine(0.004, 60)), []);
  assert.deepEqual(feed(d, 0.3, () => sine(0.05)), [true]);
  assert.equal(d.active(), true);
});
