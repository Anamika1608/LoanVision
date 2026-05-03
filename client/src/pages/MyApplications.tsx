import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getMyApplications, listCampaigns } from "../lib/api";
import { useAuth } from "../context/AuthContext";

interface ApplicationRow {
  application: {
    id: string;
    sessionId: string;
    status: string;
    firstName: string | null;
    lastName: string | null;
    dateOfBirth: string | null;
    monthlyIncome: string | null;
    loanPurpose: string | null;
    loanAmountRequested: string | null;
    createdAt: string;
  };
  riskAssessment: {
    riskBand: string | null;
    compositeScore: string | null;
  } | null;
  offer: {
    status: string | null;
    eligibleAmount: string | null;
    interestRate: string | null;
    emiAmount: string | null;
    selectedTenure: number | null;
  } | null;
  session: {
    status: string | null;
  } | null;
}

function formatCurrency(val: string | number | null | undefined): string {
  if (!val) return "--";
  const num = typeof val === "string" ? parseFloat(val) : val;
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(num);
}

function statusColor(status: string): string {
  switch (status) {
    case "approved": return "bg-green-100 text-green-700";
    case "rejected": return "bg-red-100 text-red-700";
    case "submitted": return "bg-blue-100 text-blue-700";
    case "in_progress": return "bg-yellow-100 text-yellow-700";
    default: return "bg-gray-100 text-gray-700";
  }
}

function offerStatusColor(status: string | null): string {
  switch (status) {
    case "accepted": return "bg-green-100 text-green-700";
    case "rejected": case "expired": return "bg-red-100 text-red-700";
    case "generated": case "presented": return "bg-blue-100 text-blue-700";
    default: return "bg-gray-100 text-gray-700";
  }
}

function riskBandColor(band: string | null): string {
  if (!band) return "text-gray-500";
  if (band.startsWith("A")) return "text-green-600";
  if (band.startsWith("B")) return "text-yellow-600";
  if (band.startsWith("C")) return "text-orange-600";
  return "text-red-600";
}

export default function MyApplications() {
  const { user } = useAuth();
  const [applications, setApplications] = useState<ApplicationRow[]>([]);
  const [campaigns, setCampaigns] = useState<{ id: string; code: string; name: string; isActive: boolean; expiresAt: string; currentUses: number; maxUses: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      getMyApplications().then((data) => setApplications(data.applications || [])),
      listCampaigns().then((data) => {
        const active = (data.campaigns || []).filter(
          (c: { isActive: boolean; expiresAt: string; currentUses: number; maxUses: number }) =>
            c.isActive && new Date(c.expiresAt) > new Date() && c.currentUses < c.maxUses
        );
        setCampaigns(active);
      }),
    ])
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const toggleExpand = (appId: string) => {
    setExpandedId(expandedId === appId ? null : appId);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-pulse text-lg text-gray-500">Loading your applications...</div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Applications</h1>
          <p className="text-sm text-gray-500 mt-1">
            Welcome, {user?.firstName}. Here are your loan applications.
          </p>
        </div>
        {campaigns.length > 0 && (
          <Link
            to={`/apply/${campaigns[0].code}`}
            className="px-5 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Apply Now
          </Link>
        )}
      </div>

      {/* Applications */}
      {applications.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-xl p-12 text-center">
          <h3 className="text-lg font-medium text-gray-700 mb-2">No applications yet</h3>
          <p className="text-sm text-gray-500">
            Click "Apply Now" to get started with your first loan application.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {applications.map((row) => {
            const app = row.application;
            const isExpanded = expandedId === app.id;

            return (
              <div key={app.id} className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                <button
                  onClick={() => toggleExpand(app.id)}
                  className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="text-left">
                      <p className="font-medium text-gray-900">
                        {app.loanPurpose || "Loan Application"}
                      </p>
                      <p className="text-sm text-gray-500">
                        {new Date(app.createdAt).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="font-medium text-gray-900">
                        {formatCurrency(app.loanAmountRequested)}
                      </p>
                      {row.riskAssessment?.riskBand && (
                        <p className={`text-xs font-semibold ${riskBandColor(row.riskAssessment.riskBand)}`}>
                          {row.riskAssessment.riskBand}
                        </p>
                      )}
                    </div>

                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${statusColor(app.status)}`}>
                      {app.status}
                    </span>

                    {row.offer && (
                      <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${offerStatusColor(row.offer.status)}`}>
                        Offer: {row.offer.status}
                      </span>
                    )}

                    <svg
                      className={`w-5 h-5 text-gray-400 transition-transform ${isExpanded ? "rotate-180" : ""}`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </button>

                {isExpanded && (
                  <div className="border-t px-6 py-5 bg-gray-50">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div>
                        <h4 className="text-sm font-semibold text-gray-500 uppercase mb-3">Application</h4>
                        <div className="space-y-2 text-sm">
                          <Row label="Name" value={`${app.firstName || ""} ${app.lastName || ""}`.trim() || "--"} />
                          <Row label="DOB" value={app.dateOfBirth || "--"} />
                          <Row label="Income" value={formatCurrency(app.monthlyIncome)} />
                          <Row label="Requested" value={formatCurrency(app.loanAmountRequested)} />
                          <Row label="Purpose" value={app.loanPurpose || "--"} />
                        </div>
                      </div>

                      <div>
                        <h4 className="text-sm font-semibold text-gray-500 uppercase mb-3">Risk Assessment</h4>
                        {row.riskAssessment ? (
                          <div className="space-y-2 text-sm">
                            <Row label="Risk Band" value={row.riskAssessment.riskBand || "--"} />
                            <Row
                              label="Composite Score"
                              value={
                                row.riskAssessment.compositeScore
                                  ? (parseFloat(row.riskAssessment.compositeScore) * 100).toFixed(1) + "%"
                                  : "--"
                              }
                            />
                          </div>
                        ) : (
                          <p className="text-sm text-gray-400">Not assessed</p>
                        )}
                      </div>

                      <div>
                        <h4 className="text-sm font-semibold text-gray-500 uppercase mb-3">Offer</h4>
                        {row.offer ? (
                          <div className="space-y-2 text-sm">
                            <Row label="Status" value={row.offer.status || "--"} />
                            <Row label="Amount" value={formatCurrency(row.offer.eligibleAmount)} />
                            <Row label="Interest Rate" value={row.offer.interestRate ? `${row.offer.interestRate}%` : "--"} />
                            <Row label="EMI" value={formatCurrency(row.offer.emiAmount)} />
                            {row.offer.selectedTenure && (
                              <Row label="Tenure" value={`${row.offer.selectedTenure} months`} />
                            )}
                          </div>
                        ) : (
                          <p className="text-sm text-gray-400">No offer generated</p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-gray-500">{label}</span>
      <span className="text-gray-900 font-medium">{value}</span>
    </div>
  );
}
