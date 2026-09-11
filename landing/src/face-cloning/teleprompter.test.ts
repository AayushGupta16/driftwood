/// <reference types="node" />

import { test } from "node:test";
import assert from "node:assert/strict";
import { PROMPTS } from "./model.ts";
import { buildScript, createTracker, normalize } from "./teleprompter.ts";

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
