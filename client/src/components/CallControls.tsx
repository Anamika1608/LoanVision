interface CallControlsProps {
  isMuted: boolean;
  isCameraOff: boolean;
  onToggleMute: () => void;
  onToggleCamera: () => void;
  onEndCall: () => void;
  onUploadId: () => void;
}

export default function CallControls({
  isMuted,
  isCameraOff,
  onToggleMute,
  onToggleCamera,
  onEndCall,
  onUploadId,
}: CallControlsProps) {
  return (
    <div className="flex items-center justify-center gap-4 py-3 px-4 bg-gray-900 rounded-xl">
      <button
        onClick={onToggleMute}
        className={`p-3 rounded-full transition-colors ${
          isMuted ? "bg-red-500 text-white" : "bg-gray-700 text-gray-200 hover:bg-gray-600"
        }`}
        title={isMuted ? "Unmute" : "Mute"}
      >
        {isMuted ? "Mic Off" : "Mic On"}
      </button>

      <button
        onClick={onToggleCamera}
        className={`p-3 rounded-full transition-colors ${
          isCameraOff ? "bg-red-500 text-white" : "bg-gray-700 text-gray-200 hover:bg-gray-600"
        }`}
        title={isCameraOff ? "Turn camera on" : "Turn camera off"}
      >
        {isCameraOff ? "Cam Off" : "Cam On"}
      </button>

      <button
        onClick={onUploadId}
        className="p-3 rounded-full bg-gray-700 text-gray-200 hover:bg-gray-600 transition-colors"
        title="Upload ID photo"
      >
        Upload ID
      </button>

      <button
        onClick={onEndCall}
        className="p-3 px-6 rounded-full bg-red-600 text-white hover:bg-red-700 transition-colors font-medium"
        title="End call"
      >
        End Call
      </button>
    </div>
  );
}
