import type { FaceResult } from "../hooks/useFaceAnalysis";

interface IdData {
  full_name: string | null;
  date_of_birth: string | null;
  id_number: string | null;
  id_type: string | null;
  gender: string | null;
  raw_text?: string;
}

interface IdVerification {
  face_registered: boolean;
  id_data: IdData;
}

interface VerificationPanelProps {
  idVerification: IdVerification | null;
  faceResult: FaceResult | null;
  entities: Record<string, unknown>;
  idUploaded: boolean;
}

function CheckRow({ label, status, detail }: { label: string; status: "pass" | "fail" | "pending" | "na"; detail?: string }) {
  const icons = { pass: "✓", fail: "✗", pending: "…", na: "—" };
  const colors = {
    pass: "text-green-400",
    fail: "text-red-400",
    pending: "text-yellow-400",
    na: "text-gray-500",
  };

  return (
    <div className="flex items-start gap-2 py-1.5 border-b border-gray-700/50 last:border-0">
      <span className={`font-bold text-sm w-4 ${colors[status]}`}>{icons[status]}</span>
      <div className="flex-1 min-w-0">
        <div className="text-xs font-medium text-gray-300">{label}</div>
        {detail && <div className="text-xs text-gray-500 truncate">{detail}</div>}
      </div>
    </div>
  );
}

export default function VerificationPanel({ idVerification, faceResult, entities, idUploaded }: VerificationPanelProps) {
  if (!idUploaded) return null;

  const idData = idVerification?.id_data;
  const faceMatchScore = faceResult?.face_match_score;

  const nameMatch = (() => {
    if (!idData?.full_name || !entities.full_name) return "pending";
    const idName = (idData.full_name as string).toLowerCase().trim();
    const declared = (entities.full_name as string).toLowerCase().trim();
    if (idName === declared) return "pass";
    const idFirst = idName.split(" ")[0];
    const declaredFirst = declared.split(" ")[0];
    if (idName.includes(declaredFirst) || declared.includes(idFirst)) return "pass";
    return "fail";
  })();

  const dobMatch = (() => {
    if (!idData?.date_of_birth || !entities.date_of_birth) return "pending";
    return idData.date_of_birth === entities.date_of_birth ? "pass" : "fail";
  })();

  const faceMatchStatus = (() => {
    if (faceMatchScore === undefined || faceMatchScore === null) return "pending";
    return faceMatchScore > 0.6 ? "pass" : "fail";
  })();

  const ageMatch = (() => {
    if (!faceResult?.age || !entities.date_of_birth) return "pending";
    const dob = entities.date_of_birth as string;
    const birthYear = parseInt(dob.split("-")[0]);
    if (isNaN(birthYear)) return "pending";
    const currentYear = new Date().getFullYear();
    const declaredAge = currentYear - birthYear;
    const cvAge = faceResult.age;
    return Math.abs(declaredAge - cvAge) <= 5 ? "pass" : "fail";
  })();

  return (
    <div className="bg-gray-800/95 backdrop-blur rounded-lg p-3 text-white shadow-lg">
      <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
        Verification Status
      </div>

      {/* OCR Results */}
      <div className="mb-2">
        <div className="text-[10px] font-medium text-gray-500 uppercase mb-1">ID OCR Data</div>
        <div className="bg-gray-900/60 rounded px-2 py-1.5 space-y-0.5">
          <div className="text-xs text-gray-300">
            <span className="text-gray-500">Name:</span> {idData?.full_name || "—"}
          </div>
          <div className="text-xs text-gray-300">
            <span className="text-gray-500">DOB:</span> {idData?.date_of_birth || "—"}
          </div>
          <div className="text-xs text-gray-300">
            <span className="text-gray-500">ID:</span> {idData?.id_number || "—"} {idData?.id_type ? `(${idData.id_type})` : ""}
          </div>
          <div className="text-xs text-gray-300">
            <span className="text-gray-500">Gender:</span> {idData?.gender || "—"}
          </div>
        </div>
      </div>

      {/* Checks */}
      <div className="text-[10px] font-medium text-gray-500 uppercase mb-1">Cross-Verification</div>
      <CheckRow
        label="Face Match (ID vs Live)"
        status={faceMatchStatus}
        detail={faceMatchScore != null ? `Score: ${(faceMatchScore * 100).toFixed(1)}%` : "Waiting for match..."}
      />
      <CheckRow
        label="Name Match"
        status={nameMatch}
        detail={
          nameMatch === "pending"
            ? "Waiting for both names..."
            : `Declared: "${entities.full_name}" | ID: "${idData?.full_name}"`
        }
      />
      <CheckRow
        label="DOB Match"
        status={dobMatch}
        detail={
          dobMatch === "pending"
            ? "Waiting for both DOBs..."
            : `Declared: ${entities.date_of_birth} | ID: ${idData?.date_of_birth}`
        }
      />
      <CheckRow
        label="Age Consistency (CV vs DOB)"
        status={ageMatch}
        detail={
          faceResult?.age
            ? `CV age: ~${faceResult.age} | DOB age: ${entities.date_of_birth ? new Date().getFullYear() - parseInt((entities.date_of_birth as string).split("-")[0]) : "?"}`
            : "Waiting for age estimate..."
        }
      />
      <CheckRow
        label="ID Face Registered"
        status={idVerification?.face_registered ? "pass" : "fail"}
        detail={idVerification?.face_registered ? "Embedding stored for matching" : "No face detected in ID"}
      />
    </div>
  );
}
