// Voice activity detector. Pure TypeScript, no DOM, so it can run under node:test.

/** The threshold never drops below this RMS, whatever the noise floor. */
export const VOICE_MIN_THRESHOLD = 0.012;
/** The threshold is this many times the noise floor when that is above the minimum. */
export const VOICE_FLOOR_RATIO = 3.5;
/** The noise floor never drops below this RMS. */
export const VOICE_MIN_FLOOR = 0.0005;
/** Per-batch multiplicative rise of the noise floor while the batch is quiet. */
export const VOICE_FLOOR_RISE = 1.02;
/** Per-batch additive rise of the noise floor while the batch is quiet. */
export const VOICE_FLOOR_STEP = 0.0002;
/** Consecutive loud batches (about 100 ms each) before voice becomes active. */
export const VOICE_ATTACK_BATCHES = 2;
/** Seconds without a loud batch before voice becomes inactive. */
export const VOICE_HANGOVER_SECONDS = 0.4;

export type VoiceDetector = {
  /** Feeds one batch. Returns true or false when the voice state changes, null otherwise. */
  push(samples: Float32Array, sampleRate: number): boolean | null;
  /** true while voice is active. */
  active(): boolean;
  /** Clears all state, including the noise floor. */
  reset(): void;
};

export function createVoiceDetector(): VoiceDetector {
  let floor = 0;
  let loudRun = 0;
  let quietSeconds = 0;
  let active = false;

  function reset(): void {
    floor = 0;
    loudRun = 0;
    quietSeconds = 0;
    active = false;
  }

  function push(samples: Float32Array, sampleRate: number): boolean | null {
    if (samples.length === 0 || !(sampleRate > 0)) return null;
    let sum = 0;
    for (let i = 0; i < samples.length; i++) sum += samples[i] * samples[i];
    const rms = Math.sqrt(sum / samples.length);
    const seconds = samples.length / sampleRate;

    const threshold = Math.max(VOICE_MIN_THRESHOLD, floor * VOICE_FLOOR_RATIO);
    const loud = rms > threshold;
    if (!loud) {
      // Speech never moves the floor. Quiet batches let it track the room.
      floor = Math.max(Math.min(floor * VOICE_FLOOR_RISE + VOICE_FLOOR_STEP, rms), VOICE_MIN_FLOOR);
    }

    if (loud) {
      loudRun++;
      quietSeconds = 0;
      if (!active && loudRun >= VOICE_ATTACK_BATCHES) {
        active = true;
        return true;
      }
      return null;
    }

    loudRun = 0;
    quietSeconds += seconds;
    if (active && quietSeconds >= VOICE_HANGOVER_SECONDS) {
      active = false;
      return false;
    }
    return null;
  }

  return { push, active: () => active, reset };
}
