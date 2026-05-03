import { useState, type ChangeEvent } from "react";
import axios from "axios";

interface IdUploadModalProps {
  sessionId: string;
  onComplete: () => void;
  onClose: () => void;
}

export default function IdUploadModal({ sessionId, onComplete, onClose }: IdUploadModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<{ registered: boolean; face_detected: boolean } | null>(null);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) {
      setFile(f);
      setPreview(URL.createObjectURL(f));
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("session_id", sessionId);

    try {
      const { data } = await axios.post("/cv/register-id-photo", formData);
      setResult(data);
      if (data.registered) {
        setTimeout(onComplete, 1500);
      }
    } catch (err) {
      console.error("ID upload error:", err);
      setResult({ registered: false, face_detected: false });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Upload ID Photo</h3>
        <p className="text-sm text-gray-600 mb-4">
          Upload a clear photo of your government ID (Aadhaar, PAN, or Passport) for face matching.
        </p>

        <input
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 mb-4"
        />

        {preview && (
          <img src={preview} alt="ID Preview" className="w-full h-40 object-contain bg-gray-100 rounded-lg mb-4" />
        )}

        {result && (
          <div className={`text-sm mb-4 ${result.registered ? "text-green-600" : "text-red-600"}`}>
            {result.registered
              ? "Face registered successfully! Matching will now be active."
              : "No face detected in the photo. Please try again with a clearer image."}
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2 px-4 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleUpload}
            disabled={!file || uploading}
            className="flex-1 py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {uploading ? "Uploading..." : "Upload"}
          </button>
        </div>
      </div>
    </div>
  );
}
