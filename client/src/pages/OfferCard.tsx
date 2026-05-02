import { useParams } from "react-router-dom";

export default function OfferCard() {
  const { sessionId } = useParams();

  return (
    <div className="text-center">
      <h2 className="text-2xl font-semibold mb-4">Loan Offer</h2>
      <p className="text-gray-600">Session: {sessionId}</p>
    </div>
  );
}
