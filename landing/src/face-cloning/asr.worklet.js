// AudioWorklet processor for the teleprompter speech recognizer.
// Takes channel 0 of the input, collects about 100 ms of samples at the
// context's own sample rate, then posts one Float32Array batch to the page.
// The worker resamples to 16 kHz when the context does not run at 16 kHz.
class AsrCaptureProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    // `sampleRate` is a global in the AudioWorklet scope.
    this.batchSize = Math.max(128, Math.round(sampleRate / 10));
    this.buffer = new Float32Array(this.batchSize);
    this.filled = 0;
  }

  process(inputs) {
    const channel = inputs[0] && inputs[0][0];
    if (!channel) return true;
    let offset = 0;
    while (offset < channel.length) {
      const n = Math.min(channel.length - offset, this.batchSize - this.filled);
      this.buffer.set(channel.subarray(offset, offset + n), this.filled);
      this.filled += n;
      offset += n;
      if (this.filled === this.batchSize) {
        const out = this.buffer;
        this.port.postMessage({ type: 'audio', samples: out, sampleRate }, [out.buffer]);
        this.buffer = new Float32Array(this.batchSize);
        this.filled = 0;
      }
    }
    return true;
  }
}

registerProcessor('asr-capture', AsrCaptureProcessor);
