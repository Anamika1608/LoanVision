import { useState, useEffect, useRef, useCallback } from "react";
import axios from "axios";
import { captureFrame } from "../lib/frameCapture";

export interface FaceResult {
  face_detected: boolean;
  age?: number;
  gender?: string;
  bbox?: { x: number; y: number; width: number; height: number };
  face_match_score?: number | null;
  liveness?: { ear_left?: number; ear_right?: number };
}

export function useFaceAnalysis(
  sessionId: string | undefined,
  videoRef: React.RefObject<HTMLVideoElement | null>,
  isActive: boolean
) {
  const [faceResult, setFaceResult] = useState<FaceResult | null>(null);
  const [intervalMs, setIntervalMs] = useState(3000);
  const intervalRef = useRef<number | null>(null);

  const analyze = useCallback(async () => {
    if (!videoRef.current || !sessionId) return;
    const blob = await captureFrame(videoRef.current);
    if (!blob) return;

    const formData = new FormData();
    formData.append("file", blob, "frame.jpg");
    formData.append("session_id", sessionId);

    try {
      const { data } = await axios.post("/cv/analyze-frame", formData);
      setFaceResult(data);
    } catch (err) {
      console.error("CV error:", err);
    }
  }, [sessionId, videoRef]);

  const stopAnalysis = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!isActive || !sessionId) return;

    analyze();
    intervalRef.current = window.setInterval(analyze, intervalMs);

    return stopAnalysis;
  }, [isActive, sessionId, intervalMs, analyze, stopAnalysis]);

  return { faceResult, setIntervalMs, stopAnalysis };
}
