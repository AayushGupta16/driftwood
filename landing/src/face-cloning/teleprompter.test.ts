/// <reference types="node" />

import { test } from "node:test";
import assert from "node:assert/strict";
import { PROMPTS } from "./model.ts";
import { buildScript, createTracker, normalize, DEFAULT_RATE, MAX_RATE, MIN_RATE, STALL_MS } from "./teleprompter.ts";

const WORDS = buildScript(PROMPTS);
const sentenceWords = (n: number) => WORDS.filter((w) => w.sentence === n);
const upper = (n: number) => sentenceWords(n).map((w) => w.key.toUpperCase());
const endOf = (n: number) => sentenceWords(n).at(-1)!.index + 1;

test("normalize", () => {
  assert.equal(normalize("I’m"), "im");
  assert.equal(normalize("don't"), "dont");
  assert.equal(normalize("Tuesday,"), "tuesday");
  assert.equal(normalize("HELLO"), "hello");
  assert.equal(normalize("3rd."), "3rd");
  assert.equal(normalize("—"), "");
});

test("buildScript gives contiguous indexes, sentence numbers and word count", () => {
  const manual = PROMPTS.reduce((n, [, s]) => n + s.trim().split(/\s+/).length, 0);
  assert.equal(WORDS.length, manual);
  WORDS.forEach((w, i) => assert.equal(w.index, i));
  let sentence = 0;
  let seen = 0;
  for (const w of WORDS) {
    assert.ok(w.sentence === sentence || w.sentence === sentence + 1);
    if (w.sentence !== sentence) {
      assert.equal(seen, PROMPTS[sentence][1].trim().split(/\s+/).length);
      sentence = w.sentence;
      seen = 0;
    }
    seen++;
    assert.equal(w.key, normalize(w.text));
  }
  assert.equal(sentence, PROMPTS.length - 1);
  assert.equal(WORDS[0].text, "Hey,");
  assert.equal(WORDS[1].key, "im");
});

test("feeding sentence 0 word by word reaches its end and reports sentence 1", () => {
  const t = createTracker(WORDS);
  const said: string[] = [];
  let pos = t.position();
  for (const w of upper(0)) {
    said.push(w);
    pos = t.feed(said.join(" "));
    assert.ok(pos.cursor <= endOf(0));
  }
  assert.equal(pos.cursor, endOf(0));
  assert.equal(pos.sentence, 1);
});

test("a transcript missing the first word still reaches the end of sentence 0", () => {
  const t = createTracker(WORDS);
  const pos = t.feed(upper(0).slice(1).join(" "));
  assert.equal(pos.cursor, endOf(0));
  assert.equal(pos.sentence, 1);
});

test("one wrong word in the middle still reaches the end", () => {
  const t = createTracker(WORDS);
  const words = upper(0);
  words[8] = "BANANA";
  const pos = t.feed(words.join(" "));
  assert.equal(pos.cursor, endOf(0));
});

test("IM GLAD, I M GLAD and I AM GLAD all advance past I’m", () => {
  for (const said of ["IM GLAD", "I M GLAD", "I AM GLAD"]) {
    const t = createTracker(WORDS);
    const pos = t.feed(said);
    assert.equal(pos.cursor, 3, said);
    assert.equal(pos.sentence, 0, said);
  }
});

test("a reset keeps the cursor", () => {
  const t = createTracker(WORDS);
  t.feed(upper(0).join(" "));
  assert.equal(t.position().cursor, endOf(0));
  assert.equal(t.feed("").cursor, endOf(0));
  const pos = t.feed(upper(1).slice(0, 3).join(" "));
  assert.equal(pos.cursor, endOf(0) + 3);
  assert.equal(pos.sentence, 1);
});

test("unrelated speech does not move the cursor", () => {
  const t = createTracker(WORDS);
  assert.equal(t.feed("THE WEATHER IS NICE TODAY").cursor, 0);
  t.jumpToSentence(4);
  const start = t.position().cursor;
  assert.equal(t.feed("").cursor, start);
  assert.equal(t.feed("THE WEATHER IS NICE TODAY").cursor, start);
});

test("jumpToSentence moves forward only", () => {
  const t = createTracker(WORDS);
  const pos = t.jumpToSentence(3);
  assert.equal(pos.cursor, sentenceWords(3)[0].index);
  assert.equal(pos.sentence, 3);
  const back = t.jumpToSentence(0);
  assert.equal(back.cursor, sentenceWords(3)[0].index);
  assert.equal(back.sentence, 3);
});

test("reading the whole script in one long transcript finishes", () => {
  const all = WORDS.map((w) => w.key.toUpperCase());
  const t = createTracker(WORDS);
  const pos = t.feed(all.join(" "));
  assert.equal(pos.cursor, WORDS.length);
  assert.equal(pos.sentence, PROMPTS.length - 1);
});

test("reading the whole script as a growing transcript finishes", () => {
  const all = WORDS.map((w) => w.key.toUpperCase());
  const t = createTracker(WORDS);
  let pos = t.position();
  for (let n = 1; n <= all.length; n++) {
    const next = t.feed(all.slice(0, n).join(" "));
    assert.ok(next.cursor >= pos.cursor);
    pos = next;
  }
  assert.equal(pos.cursor, WORDS.length);
  assert.equal(pos.sentence, PROMPTS.length - 1);
});

// ---- pacing -----------------------------------------------------------------

const KEYS = WORDS.map((w) => w.key.toUpperCase());

/** A tracker on a fake clock. `run(until)` ticks every 100 ms up to `until`. */
function paced() {
  let t = 0;
  const tracker = createTracker(WORDS, { now: () => t });
  const run = (until: number, onTick?: (at: number) => void) => {
    while (t < until) {
      t += 100;
      tracker.tick();
      onTick?.(t);
    }
    return tracker.position();
  };
  return { tracker, run, at: () => t, set: (v: number) => { t = v; } };
}

test("pacing: no speech and no feed moves nothing", () => {
  const { run } = paced();
  assert.equal(run(10_000).cursor, 0);
});

test("pacing: speaking with no feed advances at DEFAULT_RATE after the stall", () => {
  const { tracker, run } = paced();
  tracker.speaking(true);
  assert.equal(run(STALL_MS).cursor, 0);
  const pos = run(5000);
  const expected = (DEFAULT_RATE * (5000 - STALL_MS)) / 1000; // 10
  assert.ok(Math.abs(pos.cursor - expected) <= 1, `cursor ${pos.cursor}, expected about ${expected}`);
});

test("pacing: a feed that moves the cursor resets the stall", () => {
  const { tracker, run, set } = paced();
  tracker.speaking(true);
  set(500);
  assert.equal(tracker.feed(KEYS.slice(0, 5).join(" ")).cursor, 5);
  assert.equal(run(1400).cursor, 5);
  assert.ok(run(2600).cursor > 5);
});

test("pacing: speaking(false) stops pacing", () => {
  const { tracker, run } = paced();
  tracker.speaking(true);
  const before = run(3000).cursor;
  assert.ok(before > 0);
  tracker.speaking(false);
  assert.equal(run(13_000).cursor, before);
});

test("pacing: the rate follows the reader", () => {
  const { tracker, run } = paced();
  tracker.speaking(true);
  // 3 words per second for 8 seconds.
  run(8000, (at) => {
    if (at % 1000 === 0) tracker.feed(KEYS.slice(0, 3 * (at / 1000)).join(" "));
  });
  assert.equal(tracker.position().cursor, 24);
  assert.ok(tracker.rate() > DEFAULT_RATE, `rate ${tracker.rate()}`);
  // Stop feeding, keep speaking. The stall ends at 9000.
  const start = run(8000 + STALL_MS).cursor;
  assert.equal(start, 24);
  const moved = run(8000 + STALL_MS + 4000).cursor - start;
  assert.ok(Math.abs(moved - 12) <= 3, `moved ${moved}, expected about 12`);
});

test("pacing: the rate stays inside the clamp", () => {
  const { tracker, run } = paced();
  tracker.speaking(true);
  // 10 words per second for 8 seconds.
  run(8000, (at) => {
    if (at % 1000 === 0) tracker.feed(KEYS.slice(0, 10 * (at / 1000)).join(" "));
  });
  assert.equal(tracker.position().cursor, 80);
  assert.ok(tracker.rate() <= MAX_RATE && tracker.rate() >= MIN_RATE, `rate ${tracker.rate()}`);
  const start = run(8000 + STALL_MS).cursor;
  assert.equal(start, 80);
  const moved = run(8000 + STALL_MS + 4000).cursor - start;
  assert.ok(moved <= MAX_RATE * 4 + 1, `moved ${moved} in 4 s, above MAX_RATE`);
  assert.ok(moved >= MIN_RATE * 4 - 1, `moved ${moved} in 4 s, below MIN_RATE`);
});

test("pacing: recognition behind the paced cursor does not move it back", () => {
  const { tracker, run, at } = paced();
  tracker.speaking(true);
  let pos = tracker.position();
  while (pos.cursor < 12) pos = run(at() + 100);
  assert.equal(pos.cursor, 12);
  assert.equal(tracker.feed(KEYS.slice(6, 11).join(" ")).cursor, 12);
  assert.equal(tracker.position().cursor, 12);
});

test("a distinctive single word moves the cursor past it", () => {
  const t = createTracker(WORDS);
  const word = sentenceWords(0).find((w) => w.key.length >= 6)!;
  const pos = t.feed(word.key.toUpperCase());
  assert.equal(pos.cursor, word.index + 1);
});

test("pacing: reading the whole script through pacing only finishes", () => {
  const { tracker, run } = paced();
  tracker.speaking(true);
  const pos = run(200_000);
  assert.equal(pos.cursor, WORDS.length);
  assert.equal(pos.sentence, PROMPTS.length - 1);
});

test("pacing: stops at the end of the script", () => {
  const { tracker, run } = paced();
  tracker.speaking(true);
  assert.equal(run(200_000).cursor, WORDS.length);
  const pos = run(210_000);
  assert.equal(pos.cursor, WORDS.length);
  assert.equal(pos.sentence, PROMPTS.length - 1);
});
