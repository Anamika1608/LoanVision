import axios from "axios";

const api = axios.create({
  baseURL: "/api/v1",
  withCredentials: true
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && !window.location.pathname.startsWith("/login")) {
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export default api;

export async function loginUser(email: string, password: string) {
  const { data } = await api.post("/auth/login", { email, password });
  return data;
}

export async function registerUser(body: {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
  phone?: string;
}) {
  const { data } = await api.post("/auth/register", body);
  return data;
}

export async function getMe() {
  const { data } = await api.get("/auth/me");
  return data;
}

export async function logoutUser() {
  const { data } = await api.post("/auth/logout");
  return data;
}

export async function getMyApplications() {
  const { data } = await api.get("/dashboard/my-applications");
  return data;
}

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

export async function listCampaigns() {
  const { data } = await api.get("/campaign");
  return data;
}

export async function createCampaign(body: {
  name: string;
  channel: string;
  productType: string;
  maxUses: number;
  expiresAt: string;
}) {
  const { data } = await api.post("/campaign", body);
  return data;
}

export async function getDashboardData() {
  const { data } = await api.get("/dashboard");
  return data;
}

export async function getApplicationDetail(applicationId: string) {
  const { data } = await api.get(`/dashboard/application/${applicationId}`);
  return data;
}
