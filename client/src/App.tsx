import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import CampaignLanding from "./pages/CampaignLanding";
import VideoCall from "./pages/VideoCall";
import OfferCard from "./pages/OfferCard";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/apply/:campaignCode" element={<CampaignLanding />} />
          <Route path="/video-call/:sessionId" element={<VideoCall />} />
          <Route path="/offer/:sessionId" element={<OfferCard />} />
          <Route path="/login" element={<Login />} />
          <Route path="/dashboard" element={<Dashboard />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
