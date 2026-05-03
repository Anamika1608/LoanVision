import { useState, useEffect, useRef, useCallback } from "react";
import axios from "axios";
import { captureFrame } from "../lib/frameCapture";

type ChallengeType = "blink" | "head_turn";

export function useLiveness(
  sessionId: string | undefined,
  videoRef: React.RefObject<HTMLVideoElement | null>,
  socketOn: (event: string, handler: (...args: unknown[]) => void) => () => void
) {
  const [activeChallenge, setActiveChallenge] = useState<ChallengeType | null>(null);
  const [challengePassed, setChallengePassed] = useState(false);
  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    if (!sessionId) return;
    const unsub = socketOn("liveness-challenge", (data: unknown) => {
      const d = data as { type?: string };
      const type = (d?.type as ChallengeType) || "blink";
      startChallenge(type);
    });
    return unsub;
  }, [sessionId, socketOn]);

  const startChallenge = useCallback(
    (challengeType: ChallengeType) => {
      setActiveChallenge(challengeType);
      setChallengePassed(false);
      let attempts = 0;
      const maxAttempts = 20;

      intervalRef.current = window.setInterval(async () => {
        attempts++;
        if (attempts > maxAttempts || !videoRef.current || !sessionId) {
          if (intervalRef.current) clearInterval(intervalRef.current);
          setActiveChallenge(null);
          return;
        }

        const blob = await captureFrame(videoRef.current);
        if (!blob) return;

        const formData = new FormData();
        formData.append("file", blob, "liveness.jpg");
        formData.append("session_id", sessionId);
        formData.append("challenge_type", challengeType);

        try {
          const { data } = await axios.post("/cv/liveness-challenge", formData);
          if (data.passed) {
            if (intervalRef.current) clearInterval(intervalRef.current);
            setChallengePassed(true);
            setTimeout(() => setActiveChallenge(null), 2000);
          }
        } catch (err) {
          console.error("Liveness error:", err);
        }
      }, 500);
    },
    [sessionId, videoRef]
  );

  const triggerChallenge = useCallback(
    (type: ChallengeType) => {
      startChallenge(type);
    },
    [startChallenge]
  );

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  return { activeChallenge, challengePassed, triggerChallenge };
}
