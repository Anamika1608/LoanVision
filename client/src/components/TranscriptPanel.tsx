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
    <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 space-y-3">
      {transcript.length === 0 && (
        <p className="text-gray-400 text-sm text-center mt-8">Conversation will appear here...</p>
      )}

      {transcript.map((entry) => (
        <div
          key={entry.id}
          className={`flex ${entry.speaker === "user" ? "justify-end" : "justify-start"}`}
        >
          <div
            className={`max-w-[85%] px-3 py-2 rounded-lg text-sm ${
              entry.speaker === "user"
                ? "bg-blue-600 text-white"
                : "bg-gray-200 text-gray-800"
            }`}
          >
            {entry.text}
          </div>
        </div>
      ))}

      {isProcessing && (
        <div className="flex justify-end">
          <div className="bg-blue-100 text-blue-600 px-3 py-2 rounded-lg text-sm animate-pulse">
            Listening...
          </div>
        </div>
      )}
    </div>
  );
}
