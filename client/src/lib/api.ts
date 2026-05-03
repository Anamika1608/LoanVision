import axios from "axios";

const api = axios.create({
  baseURL: "/api/v1",
  withCredentials: true
});

export default api;

export async function validateCampaign(code: string) {
  const { data } = await api.get<{ valid: boolean; productType: string; campaignName: string }>(`/campaign/${code}`);
  return data;
}

export async function createSession(body: {
  campaignCode: string;
  geoLatitude?: number;
  geoLongitude?: number;
  deviceInfo?: Record<string, unknown>;
}) {
  const { data } = await api.post<{ sessionId: string; socketRoom: string; status: string }>("/session", body);
  return data;
}

export async function startSession(sessionId: string) {
  const { data } = await api.patch<{ sessionId: string; status: string }>(`/session/${sessionId}/start`);
  return data;
}

export async function endSession(sessionId: string) {
  const { data } = await api.patch<{ sessionId: string; status: string; duration: number }>(`/session/${sessionId}/end`);
  return data;
}

export async function submitApplication(body: {
  sessionId: string;
  entities: Record<string, unknown>;
  cvResults: Record<string, unknown>;
}) {
  const { data } = await api.post("/application", body);
  return data;
}

export async function getOffer(sessionId: string) {
  const { data } = await api.get(`/application/${sessionId}/offer`);
  return data;
}

export async function acceptOffer(sessionId: string, selectedTenure: number) {
  const { data } = await api.patch(`/application/${sessionId}/offer/accept`, { selectedTenure });
  return data;
}

export async function declineOffer(sessionId: string) {
  const { data } = await api.patch(`/application/${sessionId}/offer/decline`);
  return data;
}
