import { useEffect, useRef } from "react";
import type { TranscriptEntry } from "../hooks/useTranscription";

interface TranscriptPanelProps {
  transcript: TranscriptEntry[];
  isProcessing: boolean;
}

export default function TranscriptPanel({ transcript, isProcessing }: TranscriptPanelProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [transcript]);

  return (
    <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto p-3">
      {transcript.length === 0 && (
        <p className="mt-8 text-center text-sm text-black/40">Conversation will appear here...</p>
      )}

      {transcript.map((entry) => (
        <div
          key={entry.id}
          className={`flex ${entry.speaker === "user" ? "justify-end" : "justify-start"}`}
        >
          <div
            className={`max-w-[85%] px-3 py-2 rounded-lg text-sm ${
              entry.speaker === "user"
                ? "bg-soft-blue text-black"
                : "bg-soft-yellow text-black"
            }`}
          >
            {entry.text}
          </div>
        </div>
      ))}

      {isProcessing && (
        <div className="flex justify-end">
          <div className="animate-pulse rounded-lg bg-soft-blue px-3 py-2 text-sm text-black/70">
            Listening...
          </div>
        </div>
      )}
    </div>
  );
}
