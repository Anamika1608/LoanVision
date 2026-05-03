import type { FaceResult } from "../hooks/useFaceAnalysis";

interface FaceIndicatorProps {
  faceResult: FaceResult | null;
}

export default function FaceIndicator({ faceResult }: FaceIndicatorProps) {
  if (!faceResult) {
    return (
      <div className="absolute top-3 left-3 bg-black/60 text-gray-300 text-xs px-2 py-1 rounded">
        Initializing...
      </div>
    );
  }

  return (
    <div className="absolute top-3 left-3 bg-black/60 text-white text-xs px-3 py-2 rounded space-y-1">
      <div className="flex items-center gap-2">
        <span className={`w-2 h-2 rounded-full ${faceResult.face_detected ? "bg-green-400" : "bg-red-400"}`} />
        <span>{faceResult.face_detected ? "Face detected" : "No face"}</span>
      </div>
      {faceResult.face_detected && faceResult.gender && (
        <div className="text-gray-300">
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
