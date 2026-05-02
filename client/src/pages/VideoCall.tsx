import { useParams } from "react-router-dom";

export default function VideoCall() {
  const { sessionId } = useParams();

  return (
    <div className="text-center">
      <h2 className="text-2xl font-semibold mb-4">Video Call</h2>
      <p className="text-gray-600">Session: {sessionId}</p>
    </div>
  );
}
