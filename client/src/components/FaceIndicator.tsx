import type { FaceResult } from "../hooks/useFaceAnalysis";

interface FaceIndicatorProps {
  faceResult: FaceResult | null;
}

export default function FaceIndicator({ faceResult }: FaceIndicatorProps) {
  if (!faceResult) {
    return (
      <div className="absolute left-3 top-3 rounded-full bg-white/85 px-3 py-1 text-xs text-black/70 backdrop-blur">
        Initializing...
      </div>
    );
  }

  return (
    <div className="absolute left-3 top-3 space-y-1 rounded-2xl border border-black/10 bg-white/90 px-3 py-2 text-xs text-black backdrop-blur">
      <div className="flex items-center gap-2">
        <span className={`h-2 w-2 rounded-full ${faceResult.face_detected ? "bg-black" : "bg-black/40"}`} />
        <span>{faceResult.face_detected ? "Face detected" : "No face"}</span>
      </div>
      {faceResult.face_detected && faceResult.gender && (
        <div className="text-black/60">
          {faceResult.gender}
        </div>
      )}
      {faceResult.face_match_score != null && (
        <div className={faceResult.face_match_score > 0.6 ? "text-green-300" : "text-red-300"}>
          Face match: {(faceResult.face_match_score * 100).toFixed(0)}%
        </div>
      )}
    </div>
  );
}
