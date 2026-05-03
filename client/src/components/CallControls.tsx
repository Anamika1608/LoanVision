interface CallControlsProps {
  isMuted: boolean;
  isCameraOff: boolean;
  onToggleMute: () => void;
  onToggleCamera: () => void;
  onEndCall: () => void;
}

export default function CallControls({
  isMuted,
  isCameraOff,
  onToggleMute,
  onToggleCamera,
  onEndCall,
}: CallControlsProps) {
  return (
    <div className="flex items-center justify-center gap-3 rounded-full border border-black/10 bg-white px-3 py-2">
      <button
        onClick={onToggleMute}
        className={`p-3 rounded-full transition-colors ${
          isMuted ? "bg-black text-white" : "bg-soft-blue text-black hover:bg-sky-300"
        }`}
        title={isMuted ? "Unmute" : "Mute"}
      >
        {isMuted ? "Mic Off" : "Mic On"}
      </button>

      <button
        onClick={onToggleCamera}
        className={`p-3 rounded-full transition-colors ${
          isCameraOff ? "bg-black text-white" : "bg-soft-yellow text-black hover:bg-yellow-200"
        }`}
        title={isCameraOff ? "Turn camera on" : "Turn camera off"}
      >
        {isCameraOff ? "Cam Off" : "Cam On"}
      </button>

      <button
        onClick={onEndCall}
        className="rounded-full bg-black px-6 py-3 font-medium text-white transition-colors hover:bg-black/85"
        title="End call"
      >
        End Call
      </button>
    </div>
  );
}
