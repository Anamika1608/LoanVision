import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Layout from "./components/Layout";
import ProtectedRoute, { PublicOnlyRoute } from "./components/ProtectedRoute";
import CampaignLanding from "./pages/CampaignLanding";
import VideoCall from "./pages/VideoCall";
import OfferCard from "./pages/OfferCard";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import MyApplications from "./pages/MyApplications";
import Landing from "./pages/Landing";

function RootRedirect() {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/landing" replace />;
  if (user.role === "admin") return <Navigate to="/dashboard" replace />;
  return <Navigate to="/my-applications" replace />;
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<RootRedirect />} />
            <Route path="/landing" element={<Landing />} />

            <Route path="/login" element={<PublicOnlyRoute><Login /></PublicOnlyRoute>} />
            <Route path="/register" element={<PublicOnlyRoute><Register /></PublicOnlyRoute>} />

            <Route path="/dashboard" element={<ProtectedRoute requiredRole="admin"><Dashboard /></ProtectedRoute>} />
            <Route path="/my-applications" element={<ProtectedRoute requiredRole="user"><MyApplications /></ProtectedRoute>} />

            <Route path="/apply/:campaignCode" element={<CampaignLanding />} />
            <Route path="/video-call/:sessionId" element={<ProtectedRoute><VideoCall /></ProtectedRoute>} />
            <Route path="/offer/:sessionId" element={<ProtectedRoute><OfferCard /></ProtectedRoute>} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
