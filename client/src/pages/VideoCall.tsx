import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { startSession, endSession } from "../lib/api";
import { useSocket } from "../hooks/useSocket";
import { useMediaStream } from "../hooks/useMediaStream";
import { useAudioCapture } from "../hooks/useAudioCapture";
import { useTranscription } from "../hooks/useTranscription";
import { useFaceAnalysis } from "../hooks/useFaceAnalysis";
import { useLLMAgent } from "../hooks/useLLMAgent";
import { useLiveness } from "../hooks/useLiveness";
import CallControls from "../components/CallControls";
import TranscriptPanel from "../components/TranscriptPanel";
import AgentBubble from "../components/AgentBubble";
import FaceIndicator from "../components/FaceIndicator";
import LivenessOverlay from "../components/LivenessOverlay";
import VerificationPanel from "../components/VerificationPanel";

interface IdVerification {
  face_registered: boolean;
  id_data: {
    full_name: string | null;
    date_of_birth: string | null;
    id_number: string | null;
    id_type: string | null;
    gender: string | null;
  };
}

export default function VideoCall() {
  const { sessionId } = useParams();
  const navigate = useNavigate();

  const { isConnected, emit, on } = useSocket(sessionId);
  const { videoRef, streamRef, isActive, isMuted, isCameraOff, error, start, stop, toggleMute, toggleCamera } =
    useMediaStream();
  const audioCapture = useAudioCapture();
  const { transcript, fullText, isProcessing, sendAudioChunk, addAgentMessage } = useTranscription(sessionId);
  const { faceResult, stopAnalysis } = useFaceAnalysis(sessionId, videoRef, isActive);
  const { agentMessage, entities, shouldEndCall, requestIdUpload, verificationFailed, isThinking, processTranscript } = useLLMAgent(sessionId);
  const [showIdUpload, setShowIdUpload] = useState(false);
  const [idUploaded, setIdUploaded] = useState(false);
  const [idUploading, setIdUploading] = useState(false);
  const [idVerification, setIdVerification] = useState<IdVerification | null>(null);
  const { activeChallenge, challengePassed, triggerChallenge, stopLiveness } = useLiveness(sessionId, videoRef, on);

  const [callDuration, setCallDuration] = useState(0);
  const [ending, setEnding] = useState(false);
  const lastProcessedRef = useRef("");
  const timerRef = useRef<number | null>(null);

  // Start media + session on mount
  useEffect(() => {
    start();
    if (sessionId) {
      startSession(sessionId).catch(console.error);
    }
    timerRef.current = window.setInterval(() => setCallDuration((d) => d + 1), 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // Wire audio capture to transcription
  useEffect(() => {
    if (isActive && streamRef.current) {
      audioCapture.start(streamRef.current, sendAudioChunk);
    }
    return () => audioCapture.stop();
  }, [isActive]);

  // Wire transcription to LLM (debounced)
  useEffect(() => {
    if (!fullText || fullText === lastProcessedRef.current) return;
    const timer = setTimeout(() => {
      const newChunk = fullText.slice(lastProcessedRef.current.length).trim();
      if (newChunk) {
        const cvData = { ...(faceResult as unknown as Record<string, unknown>) || {} };
        if (idVerification) {
          (cvData as Record<string, unknown>).id_verification = idVerification;
        }
        processTranscript(newChunk, cvData);
        lastProcessedRef.current = fullText;
      }
    }, 1500);
    return () => clearTimeout(timer);
  }, [fullText]);

  // Wire agent messages to transcript panel
  useEffect(() => {
    if (agentMessage) {
      addAgentMessage(agentMessage);
    }
  }, [agentMessage]);

  // Auto-trigger liveness after 15 seconds
  useEffect(() => {
    if (!isActive) return;
    const timer = setTimeout(() => triggerChallenge("blink"), 15000);
    return () => clearTimeout(timer);
  }, [isActive]);

  // Show ID upload when agent requests it (via flag or message content)
  useEffect(() => {
    if (idUploaded) return;
    const idKeywords = ["upload", "government id", "aadhaar", "pan card", "passport", "driving license", "id card", "identity"];
    const msgLower = agentMessage.toLowerCase();
    if (requestIdUpload || idKeywords.some((kw) => msgLower.includes(kw))) {
      setShowIdUpload(true);
    }
  }, [requestIdUpload, agentMessage]);

  // After ID upload, send verification data to LLM to continue conversation
  useEffect(() => {
    if (!idVerification) return;
    const cvData = { ...(faceResult as unknown as Record<string, unknown>) || {} };
    (cvData as Record<string, unknown>).id_verification = idVerification;
    processTranscript("[User uploaded government ID]", cvData);
  }, [idVerification]);

  // Auto-end call when LLM signals completion or verification fails
  useEffect(() => {
    if ((shouldEndCall || verificationFailed) && !ending) {
      setTimeout(handleEndCall, 3000);
    }
  }, [shouldEndCall, verificationFailed]);

  const handleIdUpload = async (file: File) => {
    if (!sessionId) return;
    setIdUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("session_id", sessionId);
    try {
      const { data } = await axios.post("/cv/register-id-photo", formData);
      setIdUploaded(true);
      setShowIdUpload(false);
      setIdVerification({
        face_registered: data.registered,
        id_data: data.id_data || {},
      });
    } catch (err) {
      console.error("ID upload error:", err);
    } finally {
      setIdUploading(false);
    }
  };

  const handleEndCall = async () => {
    setEnding(true);
    stopAnalysis();
    stopLiveness();
    audioCapture.stop();
    stop();
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (sessionId) {
      emit("leave-session", sessionId);
      await endSession(sessionId).catch(console.error);
    }
    navigate(`/offer/${sessionId}`);
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md text-center">
          <h2 className="text-xl font-semibold text-red-700 mb-2">Permission Error</h2>
          <p className="text-red-600">{error}</p>
          <p className="text-sm text-gray-500 mt-2">Please allow camera and microphone access to continue.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-64px)]">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-gray-100 border-b">
        <div className="flex items-center gap-3">
          <span className={`w-2 h-2 rounded-full ${isConnected ? "bg-green-500" : "bg-red-500"}`} />
          <span className="text-sm text-gray-600">{isConnected ? "Connected" : "Connecting..."}</span>
        </div>
        <span className="text-sm font-mono text-gray-700">{formatTime(callDuration)}</span>
        {verificationFailed && (
          <span className="text-sm text-red-600 font-medium animate-pulse">Verification Failed</span>
        )}
        {shouldEndCall && !verificationFailed && (
          <span className="text-sm text-orange-600 font-medium animate-pulse">Completing...</span>
        )}
      </div>

      {/* Main content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Video panel (left 60%) */}
        <div className="relative w-[60%] bg-black flex items-center justify-center">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover [transform:scaleX(-1)]"
          />
          <FaceIndicator faceResult={faceResult} />
          {activeChallenge && <LivenessOverlay challengeType={activeChallenge} passed={challengePassed} />}

          {showIdUpload && !idUploaded && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-white/95 backdrop-blur rounded-xl shadow-lg p-4 flex flex-col items-center gap-3 z-10">
              <p className="text-sm font-medium text-gray-700">Upload your Government ID</p>
              <p className="text-xs text-gray-500">Aadhaar, PAN, Passport, or Driving License</p>
              {idUploading ? (
                <div className="flex items-center gap-2 bg-indigo-100 text-indigo-700 text-sm font-medium px-5 py-2 rounded-lg">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Uploading & Verifying...
                </div>
              ) : (
                <label className="cursor-pointer bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-5 py-2 rounded-lg transition-colors">
                  Choose Photo
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleIdUpload(file);
                    }}
                  />
                </label>
              )}
            </div>
          )}

          {idUploaded && (
            <div className="absolute top-3 right-3 z-10 w-64">
              <VerificationPanel
                idVerification={idVerification}
                faceResult={faceResult}
                entities={entities}
                idUploaded={idUploaded}
              />
            </div>
          )}
        </div>

        {/* Chat panel (right 40%) */}
        <div className="w-[40%] flex flex-col bg-white border-l">
          <div className="p-3 border-b">
            <AgentBubble message={agentMessage} isThinking={isThinking} />
          </div>
          <TranscriptPanel transcript={transcript} isProcessing={isProcessing} />
        </div>
      </div>

      {/* Bottom controls */}
      <div className="flex justify-center py-3 bg-gray-100 border-t">
        <CallControls
          isMuted={isMuted}
          isCameraOff={isCameraOff}
          onToggleMute={toggleMute}
          onToggleCamera={toggleCamera}
          onEndCall={handleEndCall}
        />
      </div>

    </div>
  );
}
