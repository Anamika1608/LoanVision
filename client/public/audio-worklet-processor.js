class PCMProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this._buffer = [];
    this._sampleCount = 0;
    this._chunkSize = 16000 * 4; // 4 seconds at 16kHz
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
      this.port.postMessage({
        type: "audio-chunk",
        pcmData: new Float32Array(this._buffer),
      });
      this._buffer = [];
      this._sampleCount = 0;
    }
    return true;
  }
}

registerProcessor("pcm-processor", PCMProcessor);
