class PCMProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this._buffer = [];
    this._sampleCount = 0;
    this._chunkSize = 16000 * 7; // 7 seconds at 16kHz
    this._energyThreshold = 0.01; // RMS threshold to detect speech
  }

  process(inputs) {
    const input = inputs[0];
    if (input.length === 0) return true;

    const channelData = input[0];
    for (let i = 0; i < channelData.length; i++) {
      this._buffer.push(channelData[i]);
      this._sampleCount++;
    }

    if (this._sampleCount >= this._chunkSize) {
      const pcm = new Float32Array(this._buffer);

      let sumSq = 0;
      for (let i = 0; i < pcm.length; i++) {
        sumSq += pcm[i] * pcm[i];
      }
      const rms = Math.sqrt(sumSq / pcm.length);

      if (rms > this._energyThreshold) {
        this.port.postMessage({
          type: "audio-chunk",
          pcmData: pcm,
        });
      }

      this._buffer = [];
      this._sampleCount = 0;
    }
    return true;
  }
}

registerProcessor("pcm-processor", PCMProcessor);
