import { useParams } from "react-router-dom";

export default function CampaignLanding() {
  const { campaignCode } = useParams();

  return (
    <div className="max-w-lg mx-auto text-center">
      <h2 className="text-2xl font-semibold mb-4">Welcome to LoanVision AI</h2>
      <p className="text-gray-600 mb-6">Campaign: {campaignCode}</p>
      <p className="text-gray-500">Video call loan onboarding will begin here.</p>
    </div>
  );
}
