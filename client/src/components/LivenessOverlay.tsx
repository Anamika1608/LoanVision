interface LivenessOverlayProps {
  challengeType: "blink" | "head_turn";
  passed: boolean;
}

export default function LivenessOverlay({ challengeType, passed }: LivenessOverlayProps) {
  return (
    <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-10">
      <div className="bg-white rounded-xl p-6 text-center max-w-xs">
        {passed ? (
          <>
            <div className="text-4xl mb-3">&#10003;</div>
            <p className="text-green-600 font-medium">Challenge passed!</p>
          </>
        ) : (
          <>
            <div className="text-4xl mb-3">
              {challengeType === "blink" ? "\u{1F441}" : "\u{1F504}"}
            </div>
            <p className="text-lg font-medium text-gray-900 mb-2">
              {challengeType === "blink"
                ? "Please blink your eyes"
                : "Please slowly turn your head left"}
            </p>
            <p className="text-sm text-gray-500">
              Look at the camera and follow the instruction
            </p>
            <div className="mt-4 w-full bg-gray-200 rounded-full h-1">
              <div className="bg-blue-600 h-1 rounded-full animate-[grow_10s_linear]" />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
