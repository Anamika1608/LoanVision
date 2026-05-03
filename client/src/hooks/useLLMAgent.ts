import { useState, useCallback, useRef } from "react";
import axios from "axios";

interface ConversationEntry {
  role: "user" | "assistant";
  content: string;
}

export function useLLMAgent(sessionId: string | undefined) {
  const [agentMessage, setAgentMessage] = useState("");
  const [entities, setEntities] = useState<Record<string, unknown>>({});
  const [shouldEndCall, setShouldEndCall] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const conversationHistory = useRef<ConversationEntry[]>([]);

  const processTranscript = useCallback(
    async (transcriptChunk: string, cvResults: Record<string, unknown>) => {
      if (!sessionId || !transcriptChunk.trim()) return;
      setIsThinking(true);

      conversationHistory.current.push({ role: "user", content: transcriptChunk });

      try {
        const { data } = await axios.post("/llm/process", {
          session_id: sessionId,
          transcript_chunk: transcriptChunk,
          conversation_history: conversationHistory.current,
          cv_results: cvResults,
        });

        const { next_question, entities_extracted, should_end_call } = data;

        setAgentMessage(next_question);
        setEntities(entities_extracted || {});
        setShouldEndCall(should_end_call || false);

        conversationHistory.current.push({ role: "assistant", content: next_question });
      } catch (err) {
        console.error("LLM error:", err);
      } finally {
        setIsThinking(false);
      }
    },
    [sessionId]
  );

  return { agentMessage, entities, shouldEndCall, isThinking, processTranscript };
}
