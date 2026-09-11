// Teleprompter alignment: maps a running speech-recognizer transcript onto the
// script so the UI can highlight spoken words and advance sentences.
// Pure TypeScript. No DOM, no React.

export type ScriptWord = { text: string; key: string; sentence: number; index: number };

export type Position = { cursor: number; sentence: number };

/** Number of transcript tokens (from the end) that one alignment pass looks at. */
export const TAIL_TOKENS = 8;
/** Number of script words (from the cursor) that one alignment pass looks at. */
export const WINDOW_WORDS = 14;

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

/**
 * Best in-order alignment of `tail` onto `window`. Returns the match count and
 * the window offset one past the last matched word. Scores each candidate end
 * as matches minus SKIP_PENALTY per skipped script word, so a dense short
 * alignment beats a sparse one that reaches far ahead. Ties go to the earliest end.
 */
function align(tail: string[], window: ScriptWord[]): { count: number; end: number; score: number } {
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
  let best = { count: 0, end: 0, score: 0 };
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

export function createTracker(words: ScriptWord[]) {
  let cursor = 0;
  let seen = 0; // raw token count of the previous transcript in this stream

  const lastSentence = words.length ? words[words.length - 1].sentence : 0;
  const position = (): Position => ({
    cursor,
    sentence: cursor < words.length ? words[cursor].sentence : lastSentence,
  });

  const step = (tail: string[]) => {
    if (cursor >= words.length || tail.length === 0) return;
    const window = words.slice(cursor, cursor + WINDOW_WORDS);
    const joined = joinSingles(tail, new Set(window.map((w) => w.key)));
    const { count, end, score } = align(joined, window);
    // One match is enough at the very start, or when it is the very next word
    // (no skip). A single stray match further inside the window needs company.
    const needed = cursor === 0 || end === 1 ? 1 : 2;
    if (count >= needed && score > 0) cursor += end;
  };

  return {
    feed(transcript: string): Position {
      const tokens = tokenize(transcript);
      if (tokens.length < seen) seen = 0; // new stream
      // Walk the transcript in tail-sized steps so a large jump skips nothing,
      // then always process the newest tail.
      for (let end = seen + TAIL_TOKENS; end < tokens.length; end += TAIL_TOKENS) {
        step(tokens.slice(Math.max(0, end - TAIL_TOKENS), end));
      }
      step(tokens.slice(Math.max(0, tokens.length - TAIL_TOKENS)));
      seen = tokens.length;
      return position();
    },
    jumpToSentence(sentence: number): Position {
      const first = words.findIndex((w) => w.sentence === sentence);
      if (first > cursor) cursor = first;
      return position();
    },
    position,
  };
}
