import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../lib/api";

interface SessionData {
  id: string;
  status: string;
  startedAt: string | null;
  endedAt: string | null;
}

export default function OfferCard() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const [session, setSession] = useState<SessionData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!sessionId) return;
    api
      .get(`/session/${sessionId}`)
      .then(({ data }) => setSession(data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [sessionId]);

  const getDuration = () => {
    if (!session?.startedAt || !session?.endedAt) return "N/A";
    const start = new Date(session.startedAt).getTime();
    const end = new Date(session.endedAt).getTime();
    const seconds = Math.round((end - start) / 1000);
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}m ${s}s`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-pulse text-gray-500">Loading results...</div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-8 max-w-lg w-full">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl text-green-600">&#10003;</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Application Processed</h2>
          <p className="text-gray-500 mt-1">Your video verification is complete</p>
        </div>

        <div className="bg-gray-50 rounded-lg p-4 mb-6 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Session ID</span>
            <span className="text-gray-900 font-mono text-xs">{sessionId?.slice(0, 8)}...</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Status</span>
            <span className="text-green-600 font-medium">{session?.status || "Completed"}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Duration</span>
            <span className="text-gray-900">{getDuration()}</span>
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 mb-6">
          <h3 className="font-medium text-blue-900 mb-2">Loan Offer</h3>
          <p className="text-sm text-blue-700">
            Based on your profile, we are processing your personalized loan offer. You will receive a notification
            shortly with the details including eligible amount, interest rate, and tenure options.
          </p>
        </div>

        <button
          onClick={() => navigate("/dashboard")}
          className="w-full py-3 px-4 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
        >
          Go to Dashboard
        </button>
      </div>
    </div>
  );
}
