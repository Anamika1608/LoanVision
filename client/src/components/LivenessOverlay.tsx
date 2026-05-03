interface LivenessOverlayProps {
  challengeType: "blink" | "head_turn";
  passed: boolean;
}

export default function LivenessOverlay({ challengeType, passed }: LivenessOverlayProps) {
  return (
    <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/45">
      <div className="max-w-xs rounded-3xl border border-black/10 bg-white p-6 text-center">
        {passed ? (
          <>
            <div className="text-4xl mb-3">&#10003;</div>
            <p className="font-medium text-black">Challenge passed!</p>
          </>
        ) : (
          <>
            <div className="text-4xl mb-3">
              {challengeType === "blink" ? "\u{1F441}" : "\u{1F504}"}
            </div>
            <p className="mb-2 text-lg font-medium text-black">
              {challengeType === "blink"
                ? "Please blink your eyes"
                : "Please slowly turn your head left"}
            </p>
            <p className="text-sm text-black/60">
              Look at the camera and follow the instruction
            </p>
            <div className="mt-4 h-1 w-full rounded-full bg-soft-yellow">
              <div className="h-1 rounded-full bg-soft-blue animate-[grow_10s_linear]" />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
