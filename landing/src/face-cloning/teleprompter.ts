// Teleprompter alignment: maps a running speech-recognizer transcript onto the
// script so the UI can highlight spoken words and advance sentences.
// Pure TypeScript. No DOM, no React.
//
// Two things move the cursor:
// 1. Recognition: `feed` aligns the transcript tail onto the script.
// 2. Pacing: `tick` advances the cursor at the reader's learned rate while the
//    microphone reports speech and recognition has not confirmed the position
//    for STALL_MS. Recognition then only corrects drift.

export type ScriptWord = { text: string; key: string; sentence: number; index: number };

export type Position = { cursor: number; sentence: number };

export type TrackerOptions = { now?: () => number };

/** Number of transcript tokens (from the end) that one alignment pass looks at. */
export const TAIL_TOKENS = 8;
/** Number of script words (from the cursor) that one alignment pass looks at. */
export const WINDOW_WORDS = 20;
/** Pacing starts when recognition has not confirmed the position for this long. */
export const STALL_MS = 1000;
/** Words per second (150 words per minute). */
export const DEFAULT_RATE = 2.5;
export const MIN_RATE = 1.7;
export const MAX_RATE = 3.7;
/** Speaking time between two rate updates. */
const LEARN_MS = 4000;
/** A script word whose key has at least this many characters is distinctive. */
const DISTINCTIVE_CHARS = 6;

/** Lowercase, keep only a-z and 0-9. "I’m" -> "im", "Tuesday," -> "tuesday". */
export function normalize(word: string): string {
  return word.toLowerCase().replace(/[^a-z0-9]/g, '');
}

export function buildScript(prompts: readonly (readonly [string, string])[]): ScriptWord[] {
  const words: ScriptWord[] = [];
  prompts.forEach(([, sentence], sentenceIndex) => {
    for (const text of sentence.split(/\s+/)) {
      if (!text) continue;
      words.push({ text, key: normalize(text), sentence: sentenceIndex, index: words.length });
    }
  });
  return words;
}

function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (Math.abs(a.length - b.length) > 1) return 2;
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const row = [i];
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      row[j] = Math.min(prev[j] + 1, row[j - 1] + 1, prev[j - 1] + cost);
    }
    prev = row;
  }
  return prev[b.length];
}

/** True when a transcript token counts as the script word with key `key`. */
export function matches(token: string, key: string): boolean {
  if (token === key) return true;
  if (token.length >= 4 && key.length >= 4 && (token.startsWith(key) || key.startsWith(token))) return true;
  if (token.length >= 5 && key.length >= 5 && levenshtein(token, key) <= 1) return true;
  return false;
}

function tokenize(transcript: string): string[] {
  return transcript.split(/\s+/).map(normalize).filter(Boolean);
}

/** Join a single-letter token with the next token when the pair forms a key in the window. */
function joinSingles(tokens: string[], windowKeys: Set<string>): string[] {
  const out: string[] = [];
  for (let i = 0; i < tokens.length; i++) {
    const next = tokens[i + 1];
    if (tokens[i].length === 1 && next !== undefined && windowKeys.has(tokens[i] + next)) {
      out.push(tokens[i] + next);
      i++;
    } else {
      out.push(tokens[i]);
    }
  }
  return out;
}

/** Penalty per skipped script word when scoring an alignment. */
const SKIP_PENALTY = 0.34;

type Alignment = { count: number; end: number; score: number };

/**
 * Best in-order alignment of `tail` onto `window`. Returns the match count and
 * the window offset one past the last matched word. Scores each candidate end
 * as matches minus SKIP_PENALTY per skipped script word, so a dense short
 * alignment beats a sparse one that reaches far ahead. Ties go to the earliest end.
 */
function align(tail: string[], window: ScriptWord[]): Alignment {
  const n = tail.length;
  const m = window.length;
  // dp[i][j]: max matches using tail[0..i) and window[0..j).
  const dp: number[][] = Array.from({ length: n + 1 }, () => new Array<number>(m + 1).fill(0));
  for (let i = 1; i <= n; i++) {
    for (let j = 1; j <= m; j++) {
      const hit = matches(tail[i - 1], window[j - 1].key) ? dp[i - 1][j - 1] + 1 : 0;
      dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1], hit);
    }
  }
  let best: Alignment = { count: 0, end: 0, score: 0 };
  for (let end = 1; end <= m; end++) {
    let count = 0;
    for (let i = 1; i <= n; i++) {
      if (matches(tail[i - 1], window[end - 1].key)) count = Math.max(count, dp[i - 1][end - 1] + 1);
    }
    if (count === 0) continue;
    const score = count - SKIP_PENALTY * (end - count);
    if (score > best.score) best = { count, end, score };
  }
  return best;
}

/**
 * Earliest window word that is distinctive (a long key) and that a long
 * transcript token matches. One such hit is enough to place the reader.
 */
function distinctive(tail: string[], window: ScriptWord[]): Alignment | null {
  for (let end = 1; end <= window.length; end++) {
    const key = window[end - 1].key;
    if (key.length < DISTINCTIVE_CHARS) continue;
    if (tail.some((token) => token.length >= DISTINCTIVE_CHARS && matches(token, key))) {
      return { count: 1, end, score: 1 - SKIP_PENALTY * (end - 1) };
    }
  }
  return null;
}

const clampRate = (rate: number) => Math.min(MAX_RATE, Math.max(MIN_RATE, rate));

export function createTracker(words: ScriptWord[], options: TrackerOptions = {}) {
  const now = options.now ?? Date.now;
  let cursor = 0; // position shown to the reader: max of recognition and pacing
  let confirmed = 0; // position recognition last aligned to
  let seen = 0; // raw token count of the previous transcript in this stream

  let rate = DEFAULT_RATE; // words per second
  let active = false; // microphone reports speech
  let lastConfirmedAt = now(); // last move by feed, or last speaking(true) edge
  let lastTickAt = lastConfirmedAt;
  let carry = 0; // fractional words owed by pacing

  let spokenMs = 0; // total speaking time
  let spokenAt = lastConfirmedAt; // when spokenMs was last accrued
  let rateCursor = 0; // cursor at the last rate update
  let rateSpokenMs = 0; // spokenMs at the last rate update

  const lastSentence = words.length ? words[words.length - 1].sentence : 0;
  const position = (): Position => ({
    cursor,
    sentence: cursor < words.length ? words[cursor].sentence : lastSentence,
  });

  const accrue = (t: number) => {
    if (active && t > spokenAt) spokenMs += t - spokenAt;
    spokenAt = t;
  };

  const confirm = (t: number) => {
    lastConfirmedAt = t;
    carry = 0;
  };

  const learn = () => {
    const ms = spokenMs - rateSpokenMs;
    if (ms < LEARN_MS) return;
    const observed = (cursor - rateCursor) / (ms / 1000);
    rate = clampRate(0.7 * rate + 0.3 * observed);
    rateCursor = cursor;
    rateSpokenMs = spokenMs;
  };

  /** Alignment of `tail` onto the window that starts at `base`, or null when it is too weak. */
  const alignFrom = (base: number, tail: string[]): Alignment | null => {
    const window = words.slice(base, base + WINDOW_WORDS);
    if (window.length === 0) return null;
    const joined = joinSingles(tail, new Set(window.map((w) => w.key)));
    const best = align(joined, window);
    // One match is enough at the very start, or when it is the very next word
    // (no skip). A single stray match further inside the window needs company.
    const needed = base === 0 || best.end === 1 ? 1 : 2;
    if (best.count >= needed && best.score > 0) return best;
    return distinctive(joined, window);
  };

  const step = (tail: string[], t: number) => {
    if (confirmed >= words.length || tail.length === 0) return;
    // Recognition may lag behind the paced cursor, so try both origins and
    // keep the denser alignment. Ties go to the recognition origin.
    const fromConfirmed = alignFrom(confirmed, tail);
    const fromCursor = cursor > confirmed ? alignFrom(cursor, tail) : null;
    let pick = fromConfirmed;
    let next = fromConfirmed ? confirmed + fromConfirmed.end : confirmed;
    if (fromCursor && (!fromConfirmed || fromCursor.score > fromConfirmed.score)) {
      pick = fromCursor;
      next = cursor + fromCursor.end;
    }
    if (!pick) return;
    confirmed = Math.max(confirmed, next);
    if (confirmed > cursor) {
      cursor = confirmed;
      confirm(t);
      learn();
    } else if (pick.count >= 2) {
      // Recognition is behind the paced cursor but the reader is clearly still
      // on this passage: hold pacing for another STALL_MS.
      confirm(t);
    }
  };

  return {
    feed(transcript: string): Position {
      const t = now();
      accrue(t);
      const tokens = tokenize(transcript);
      if (tokens.length < seen) seen = 0; // new stream
      // Walk the transcript in tail-sized steps so a large jump skips nothing,
      // then always process the newest tail.
      for (let end = seen + TAIL_TOKENS; end < tokens.length; end += TAIL_TOKENS) {
        step(tokens.slice(Math.max(0, end - TAIL_TOKENS), end), t);
      }
      step(tokens.slice(Math.max(0, tokens.length - TAIL_TOKENS)), t);
      seen = tokens.length;
      return position();
    },
    speaking(on: boolean): void {
      if (on === active) return;
      const t = now();
      accrue(t);
      active = on;
      if (on) {
        confirm(t);
        lastTickAt = t;
      }
    },
    tick(): Position {
      const t = now();
      accrue(t);
      if (active && cursor < words.length && t - lastConfirmedAt >= STALL_MS) {
        // Count only time after the stall threshold, so a late first tick
        // does not jump the cursor.
        const from = Math.max(lastTickAt, lastConfirmedAt + STALL_MS);
        if (t > from) carry += (rate * (t - from)) / 1000;
        while (carry >= 1 && cursor < words.length) {
          carry -= 1;
          cursor++;
        }
      }
      lastTickAt = t;
      return position();
    },
    jumpToSentence(sentence: number): Position {
      const first = words.findIndex((w) => w.sentence === sentence);
      if (first > cursor) {
        cursor = first;
        confirmed = first;
        confirm(now());
        // A jump is not reading: do not let it inflate the learned rate.
        rateCursor = cursor;
        rateSpokenMs = spokenMs;
      }
      return position();
    },
    position,
    /** Learned pace in words per second. */
    rate: () => rate,
  };
}
