import { useState, useCallback } from "react";
import axios from "axios";

export interface TranscriptEntry {
  id: string;
  text: string;
  timestamp: number;
  speaker: "user" | "agent";
}

export function useTranscription(sessionId: string | undefined) {
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
  const [fullText, setFullText] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const sendAudioChunk = useCallback(
    async (wavBlob: Blob) => {
      if (!sessionId) return;
      setIsProcessing(true);

      const formData = new FormData();
      formData.append("file", wavBlob, "chunk.wav");
      formData.append("session_id", sessionId);

      try {
        const { data } = await axios.post("/stt/transcribe", formData);
        const text = data.full_text?.trim();

        if (text) {
          setTranscript((prev) => [
            ...prev,
            { id: crypto.randomUUID(), text, timestamp: Date.now(), speaker: "user" },
          ]);
          setFullText((prev) => (prev ? prev + " " + text : text));
        }
      } catch (err) {
        console.error("STT error:", err);
      } finally {
        setIsProcessing(false);
      }
    },
    [sessionId]
  );

  const addAgentMessage = useCallback((text: string) => {
    setTranscript((prev) => [
      ...prev,
      { id: crypto.randomUUID(), text, timestamp: Date.now(), speaker: "agent" },
    ]);
  }, []);

  return { transcript, fullText, isProcessing, sendAudioChunk, addAgentMessage };
}
