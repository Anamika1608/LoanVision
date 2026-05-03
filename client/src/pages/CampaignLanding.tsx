import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { validateCampaign, createSession } from "../lib/api";
import { useAuth } from "../context/AuthContext";

export default function CampaignLanding() {
  const { campaignCode } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [campaign, setCampaign] = useState<{ campaignName: string; productType: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [consented, setConsented] = useState(false);
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    if (!campaignCode) return;
    validateCampaign(campaignCode)
      .then((data) => {
        if (data.valid) {
          setCampaign({ campaignName: data.campaignName, productType: data.productType });
        } else {
          setError("This campaign link is no longer valid.");
        }
      })
      .catch(() => setError("Campaign not found or has expired."))
      .finally(() => setLoading(false));
  }, [campaignCode]);

  const handleStart = async () => {
    if (!campaignCode || !consented) return;
    if (!user) {
      navigate(`/login?redirect=/apply/${campaignCode}`);
      return;
    }
    setStarting(true);

    let geoLatitude: number | undefined;
    let geoLongitude: number | undefined;

    try {
      const pos = await new Promise<GeolocationPosition>((resolve, reject) =>
        navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 })
      );
      geoLatitude = pos.coords.latitude;
      geoLongitude = pos.coords.longitude;
    } catch {
      // Geolocation not available or denied - continue without it
    }

    const deviceInfo = {
      userAgent: navigator.userAgent,
      screenWidth: window.screen.width,
      screenHeight: window.screen.height,
      language: navigator.language,
    };

    try {
      const { sessionId } = await createSession({
        campaignCode,
        geoLatitude,
        geoLongitude,
        deviceInfo,
      });
      navigate(`/video-call/${sessionId}`);
    } catch {
      setError("Failed to create session. Please try again.");
      setStarting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-pulse text-lg text-gray-500">Loading campaign...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md text-center">
          <h2 className="text-xl font-semibold text-red-700 mb-2">Invalid Campaign</h2>
          <p className="text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-8 max-w-lg w-full">
        <h2 className="text-2xl font-bold text-gray-900 mb-1">{campaign?.campaignName}</h2>
        <p className="text-sm text-gray-500 mb-6">Product: {campaign?.productType}</p>

        <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 mb-6">
          <h3 className="font-medium text-blue-900 mb-2">What to expect</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>A short video call with our AI loan agent</li>
            <li>Face verification and liveness check</li>
            <li>Voice-based information collection</li>
            <li>Instant loan offer based on your profile</li>
          </ul>
        </div>

        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
          <h3 className="font-medium text-gray-900 mb-2">Permissions required</h3>
          <ul className="text-sm text-gray-700 space-y-1">
            <li>Camera access (face verification)</li>
            <li>Microphone access (voice interaction)</li>
            <li>Location access (optional, for KYC)</li>
          </ul>
        </div>

        <label className="flex items-start gap-3 mb-6 cursor-pointer">
          <input
            type="checkbox"
            checked={consented}
            onChange={(e) => setConsented(e.target.checked)}
            className="mt-1 w-4 h-4 rounded border-gray-300"
          />
          <span className="text-sm text-gray-700">
            I consent to video recording, audio recording, and geolocation capture for KYC verification purposes.
          </span>
        </label>

        <button
          onClick={handleStart}
          disabled={!consented || starting}
          className="w-full py-3 px-4 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {starting ? "Starting..." : "Start Video Call"}
        </button>
      </div>
    </div>
  );
}
