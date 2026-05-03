import { useRef, useCallback } from "react";
import { encodeWAV } from "../lib/wavEncoder";

export function useAudioCapture() {
  const audioContextRef = useRef<AudioContext | null>(null);
  const onChunkRef = useRef<((blob: Blob) => void) | null>(null);

  const start = useCallback(async (stream: MediaStream, onChunk: (blob: Blob) => void) => {
    onChunkRef.current = onChunk;

    const ctx = new AudioContext({ sampleRate: 16000 });
    audioContextRef.current = ctx;

    await ctx.audioWorklet.addModule("/audio-worklet-processor.js");
    const source = ctx.createMediaStreamSource(stream);
    const processor = new AudioWorkletNode(ctx, "pcm-processor");

    processor.port.onmessage = (event) => {
      if (event.data.type === "audio-chunk") {
        const wavBlob = encodeWAV(event.data.pcmData);
        onChunkRef.current?.(wavBlob);
      }
    };

    source.connect(processor);
    processor.connect(ctx.destination);
  }, []);

  const stop = useCallback(() => {
    audioContextRef.current?.close();
    audioContextRef.current = null;
  }, []);

  return { start, stop };
}
