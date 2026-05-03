import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
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
import IdUploadModal from "../components/IdUploadModal";

export default function VideoCall() {
  const { sessionId } = useParams();
  const navigate = useNavigate();

  const { isConnected, emit, on } = useSocket(sessionId);
  const { videoRef, streamRef, isActive, isMuted, isCameraOff, error, start, stop, toggleMute, toggleCamera } =
    useMediaStream();
  const audioCapture = useAudioCapture();
  const { transcript, fullText, isProcessing, sendAudioChunk, addAgentMessage } = useTranscription(sessionId);
  const { faceResult, stopAnalysis } = useFaceAnalysis(sessionId, videoRef, isActive);
  const { agentMessage, shouldEndCall, isThinking, processTranscript } = useLLMAgent(sessionId);
  const { activeChallenge, challengePassed, triggerChallenge, stopLiveness } = useLiveness(sessionId, videoRef, on);

  const [showIdUpload, setShowIdUpload] = useState(false);
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
        processTranscript(newChunk, (faceResult as unknown as Record<string, unknown>) || {});
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

  // Auto-end call when LLM signals completion
  useEffect(() => {
    if (shouldEndCall && !ending) {
      setTimeout(handleEndCall, 3000);
    }
  }, [shouldEndCall]);

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
        {shouldEndCall && (
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
          onUploadId={() => setShowIdUpload(true)}
        />
      </div>

      {/* ID Upload Modal */}
      {showIdUpload && sessionId && (
        <IdUploadModal
          sessionId={sessionId}
          onComplete={() => setShowIdUpload(false)}
          onClose={() => setShowIdUpload(false)}
        />
      )}
    </div>
  );
}
