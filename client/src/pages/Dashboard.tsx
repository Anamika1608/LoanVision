import { useEffect, useState } from "react";
import { getDashboardData, getApplicationDetail } from "../lib/api";

interface Summary {
  totalApplications: number;
  approved: number;
  rejected: number;
  totalDisbursed: number;
  averageCompositeScore: number;
  conversionRate: number;
}

interface ApplicationRow {
  application: {
    id: string;
    sessionId: string;
    status: string;
    firstName: string | null;
    lastName: string | null;
    dateOfBirth: string | null;
    declaredAge: number | null;
    employer: string | null;
    monthlyIncome: string | null;
    loanPurpose: string | null;
    loanAmountRequested: string | null;
    consentGiven: boolean | null;
    createdAt: string;
  };
  riskAssessment: {
    bureauScore: string | null;
    llmConfidenceScore: string | null;
    videoFraudScore: string | null;
    alternateDataScore: string | null;
    compositeScore: string | null;
    riskBand: string | null;
    fraudFlags: string[] | null;
    policyChecksPassed: boolean | null;
    decisionRationale: string | null;
  } | null;
  offer: {
    eligibleAmount: string | null;
    interestRate: string | null;
    tenureOptions: number[] | null;
    selectedTenure: number | null;
    emiAmount: string | null;
    processingFee: string | null;
    processingFeePercent: string | null;
    riskBand: string | null;
    validUntil: string | null;
    status: string | null;
  } | null;
  session: {
    startedAt: string | null;
    endedAt: string | null;
    status: string | null;
    geoLatitude: string | null;
    geoLongitude: string | null;
  } | null;
}

interface CampaignData {
  id: string;
  code: string;
  name: string;
  channel: string;
  productType: string;
  maxUses: number;
  currentUses: number;
  expiresAt: string;
  isActive: boolean;
  createdAt: string;
}

interface DetailData extends ApplicationRow {
  faceVerification: {
    faceMatchScore: string | null;
    estimatedAge: number | null;
    estimatedGender: string | null;
    livenessBlinkDetected: boolean | null;
    livenessScore: string | null;
    idPhotoUrl: string | null;
  } | null;
  resolvedLocation: string | null;
}

function calculateAge(dob: string): number {
  const birth = new Date(dob);
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const monthDiff = now.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < birth.getDate())) age--;
  return age;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

function getRiskBandColor(band: string): string {
  if (band === "A1" || band === "A2") return "bg-green-100 text-green-800";
  if (band === "B1" || band === "B2") return "bg-yellow-100 text-yellow-800";
  if (band === "C1" || band === "C2") return "bg-orange-100 text-orange-800";
  return "bg-red-100 text-red-800";
}

function getOfferStatusColor(status: string): string {
  if (status === "accepted") return "bg-green-100 text-green-800";
  if (status === "rejected") return "bg-red-100 text-red-800";
  return "bg-gray-100 text-gray-800";
}

function getChannelColor(channel: string): string {
  const colors: Record<string, string> = {
    web: "bg-blue-100 text-blue-800",
    sms: "bg-purple-100 text-purple-800",
    whatsapp: "bg-green-100 text-green-800",
    email: "bg-orange-100 text-orange-800",
  };
  return colors[channel] || "bg-gray-100 text-gray-800";
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function getDuration(startedAt: string | null, endedAt: string | null): string {
  if (!startedAt || !endedAt) return "—";
  const seconds = Math.round(
    (new Date(endedAt).getTime() - new Date(startedAt).getTime()) / 1000
  );
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}m ${s}s`;
}

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [applications, setApplications] = useState<ApplicationRow[]>([]);
  const [campaigns, setCampaigns] = useState<CampaignData[]>([]);
  const [expandedAppId, setExpandedAppId] = useState<string | null>(null);
  const [detailData, setDetailData] = useState<DetailData | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => {
    getDashboardData()
      .then((data) => {
        setSummary(data.summary);
        setApplications(data.applications);
        setCampaigns(data.campaigns);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleExpand = async (appId: string) => {
    if (expandedAppId === appId) {
      setExpandedAppId(null);
      setDetailData(null);
      return;
    }
    setExpandedAppId(appId);
    setDetailLoading(true);
    try {
      const data = await getApplicationDetail(appId);
      setDetailData(data);
    } catch (err) {
      console.error("Detail fetch error:", err);
    } finally {
      setDetailLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="relative w-12 h-12">
          <div className="absolute inset-0 border-4 border-indigo-200 rounded-full"></div>
          <div className="absolute inset-0 border-4 border-indigo-600 rounded-full border-t-transparent animate-spin"></div>
        </div>
        <p className="text-gray-500">Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Loan Origination Dashboard</h2>

      {/* Summary Stats */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
            <p className="text-sm text-gray-500">Total Applications</p>
            <p className="text-2xl font-bold text-indigo-700">{summary.totalApplications}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
            <p className="text-sm text-gray-500">Approved</p>
            <p className="text-2xl font-bold text-green-700">{summary.approved}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
            <p className="text-sm text-gray-500">Rejected</p>
            <p className="text-2xl font-bold text-red-700">{summary.rejected}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
            <p className="text-sm text-gray-500">Total Disbursed</p>
            <p className="text-2xl font-bold text-emerald-700">
              {formatCurrency(summary.totalDisbursed)}
            </p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
            <p className="text-sm text-gray-500">Conversion Rate</p>
            <p className="text-2xl font-bold text-blue-700">
              {(summary.conversionRate * 100).toFixed(1)}%
            </p>
          </div>
        </div>
      )}

      {/* Applications Table */}
      <div>
        <h3 className="text-lg font-semibold text-gray-800 mb-3">Applications</h3>
        {applications.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
            <p className="text-gray-500">No applications yet. Start a video call to create one.</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Applicant
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Loan Amount
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Risk Band
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Offer Status
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Score
                  </th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {applications.map((row) => {
                  const app = row.application;
                  const isExpanded = expandedAppId === app.id;
                  return (
                    <TableRow
                      key={app.id}
                      row={row}
                      isExpanded={isExpanded}
                      detailData={isExpanded ? detailData : null}
                      detailLoading={isExpanded && detailLoading}
                      onToggle={() => handleExpand(app.id)}
                    />
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Campaigns */}
      <div>
        <h3 className="text-lg font-semibold text-gray-800 mb-3">Campaigns</h3>
        {campaigns.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
            <p className="text-gray-500">No campaigns created yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {campaigns.map((c) => (
              <CampaignCard key={c.id} campaign={c} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function TableRow({
  row,
  isExpanded,
  detailData,
  detailLoading,
  onToggle,
}: {
  row: ApplicationRow;
  isExpanded: boolean;
  detailData: DetailData | null;
  detailLoading: boolean;
  onToggle: () => void;
}) {
  const app = row.application;
  const risk = row.riskAssessment;
  const ofr = row.offer;
  const name = [app.firstName, app.lastName].filter(Boolean).join(" ") || "—";
  const amount = app.loanAmountRequested ? formatCurrency(parseFloat(app.loanAmountRequested)) : "—";
  const score = risk?.compositeScore ? (parseFloat(risk.compositeScore) * 100).toFixed(0) + "%" : "—";
  const riskBand = risk?.riskBand || ofr?.riskBand || null;

  return (
    <>
      <tr className={`hover:bg-gray-50 cursor-pointer ${isExpanded ? "bg-indigo-50" : ""}`} onClick={onToggle}>
        <td className="px-4 py-3 text-sm font-medium text-gray-900">{name}</td>
        <td className="px-4 py-3 text-sm text-gray-600">{formatDate(app.createdAt)}</td>
        <td className="px-4 py-3 text-sm text-gray-900">{amount}</td>
        <td className="px-4 py-3">
          {riskBand ? (
            <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${getRiskBandColor(riskBand)}`}>
              {riskBand}
            </span>
          ) : (
            <span className="text-sm text-gray-400">—</span>
          )}
        </td>
        <td className="px-4 py-3">
          {ofr?.status ? (
            <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${getOfferStatusColor(ofr.status)}`}>
              {ofr.status}
            </span>
          ) : (
            <span className="text-xs text-gray-400">{app.status}</span>
          )}
        </td>
        <td className="px-4 py-3 text-sm text-gray-900 font-mono">{score}</td>
        <td className="px-4 py-3 text-right">
          <button className="text-indigo-600 hover:text-indigo-800 text-sm font-medium">
            {isExpanded ? "Close" : "View"}
          </button>
        </td>
      </tr>
      {isExpanded && (
        <tr>
          <td colSpan={7} className="px-4 py-4 bg-gray-50 border-t border-gray-200">
            {detailLoading ? (
              <div className="flex justify-center py-6">
                <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : detailData ? (
              <DetailView data={detailData} />
            ) : null}
          </td>
        </tr>
      )}
    </>
  );
}

function DetailView({ data }: { data: DetailData }) {
  const app = data.application;
  const risk = data.riskAssessment;
  const ofr = data.offer;
  const sess = data.session;
  const face = data.faceVerification;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Applicant Info */}
      <div className="bg-white rounded-lg p-4 border border-gray-200">
        <h4 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wider">Applicant</h4>
        <div className="space-y-2 text-sm">
          <Row label="Name" value={[app.firstName, app.lastName].filter(Boolean).join(" ") || "—"} />
          <Row label="DOB" value={app.dateOfBirth || "—"} />
          <Row label="Age" value={app.dateOfBirth ? calculateAge(app.dateOfBirth).toString() : (app.declaredAge?.toString() || "—")} />
          <Row label="Employer" value={app.employer || "—"} />
          <Row label="Income" value={app.monthlyIncome ? formatCurrency(parseFloat(app.monthlyIncome)) : "—"} />
          <Row label="Purpose" value={app.loanPurpose || "—"} />
          <Row label="Requested" value={app.loanAmountRequested ? formatCurrency(parseFloat(app.loanAmountRequested)) : "—"} />
          <div className="flex justify-between">
            <span className="text-gray-500">Consent</span>
            {app.consentGiven ? (
              <span className="text-green-600 font-medium">Given</span>
            ) : (
              <span className="text-red-600 font-medium">No</span>
            )}
          </div>
        </div>
      </div>

      {/* Risk Assessment */}
      <div className="bg-white rounded-lg p-4 border border-gray-200">
        <h4 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wider">Risk Assessment</h4>
        {risk ? (
          <div className="space-y-2 text-sm">
            <ScoreRow label="Bureau" value={risk.bureauScore} />
            <ScoreRow label="LLM Confidence" value={risk.llmConfidenceScore} />
            <ScoreRow label="Video Fraud" value={risk.videoFraudScore} />
            <ScoreRow label="Alt Data" value={risk.alternateDataScore} />
            <div className="border-t border-gray-100 pt-2 mt-2">
              <div className="flex justify-between items-center">
                <span className="text-gray-700 font-semibold">Composite</span>
                <span className="text-lg font-bold text-gray-900">
                  {risk.compositeScore ? (parseFloat(risk.compositeScore) * 100).toFixed(0) + "%" : "—"}
                </span>
              </div>
            </div>
            {risk.riskBand && (
              <div className="flex justify-between items-center">
                <span className="text-gray-500">Band</span>
                <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${getRiskBandColor(risk.riskBand)}`}>
                  {risk.riskBand}
                </span>
              </div>
            )}
            {risk.fraudFlags && (risk.fraudFlags as string[]).length > 0 && (
              <div className="pt-1">
                <span className="text-xs text-gray-500">Flags:</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {(risk.fraudFlags as string[]).map((f, i) => (
                    <span key={i} className="text-xs bg-red-100 text-red-700 px-1.5 py-0.5 rounded">
                      {f.replace(/_/g, " ")}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {risk.decisionRationale && (
              <p className="text-xs text-gray-500 mt-2 leading-relaxed">{risk.decisionRationale}</p>
            )}
          </div>
        ) : (
          <p className="text-sm text-gray-400">No risk data</p>
        )}
      </div>

      {/* Offer Details */}
      <div className="bg-white rounded-lg p-4 border border-gray-200">
        <h4 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wider">Offer</h4>
        {ofr ? (
          <div className="space-y-2 text-sm">
            <Row label="Amount" value={ofr.eligibleAmount ? formatCurrency(parseFloat(ofr.eligibleAmount)) : "—"} />
            <Row label="Rate" value={ofr.interestRate ? `${ofr.interestRate}% p.a.` : "—"} />
            <Row label="Tenure" value={ofr.selectedTenure ? `${ofr.selectedTenure} months` : "—"} />
            <Row label="EMI" value={ofr.emiAmount ? formatCurrency(parseFloat(ofr.emiAmount)) : "—"} />
            <Row label="Proc. Fee" value={ofr.processingFee ? `${formatCurrency(parseFloat(ofr.processingFee))} (${ofr.processingFeePercent}%)` : "—"} />
            <div className="flex justify-between items-center">
              <span className="text-gray-500">Status</span>
              {ofr.status && (
                <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${getOfferStatusColor(ofr.status)}`}>
                  {ofr.status}
                </span>
              )}
            </div>
            <Row label="Valid Until" value={ofr.validUntil ? formatDate(ofr.validUntil) : "—"} />
          </div>
        ) : (
          <p className="text-sm text-gray-400">No offer generated</p>
        )}
      </div>

      {/* ID Photo, Screenshot & Session */}
      <div className="bg-white rounded-lg p-4 border border-gray-200">
        <h4 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wider">Verification</h4>
        <div className="space-y-3">
          <div>
            <p className="text-xs text-gray-500 mb-1">Live Photo</p>
            <div className="rounded-lg overflow-hidden bg-gray-100 aspect-[4/3] flex items-center justify-center">
              <img
                src={`/cv/screenshot/${app.sessionId}`}
                alt="Live screenshot"
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                  (e.target as HTMLImageElement).parentElement!.innerHTML =
                    '<p class="text-xs text-gray-400">No screenshot</p>';
                }}
              />
            </div>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1">Government ID</p>
            <div className="rounded-lg overflow-hidden bg-gray-100 aspect-[4/3] flex items-center justify-center">
              <img
                src={`/cv/id-photo/${app.sessionId}`}
                alt="Government ID"
                className="w-full h-full object-contain"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                  (e.target as HTMLImageElement).parentElement!.innerHTML =
                    '<p class="text-xs text-gray-400">No ID photo</p>';
                }}
              />
            </div>
          </div>
          {face && (
            <div className="space-y-1 text-sm">
              {face.faceMatchScore && (
                <Row label="Face Match" value={`${(parseFloat(face.faceMatchScore) * 100).toFixed(0)}%`} />
              )}
              {face.estimatedGender && <Row label="Gender" value={face.estimatedGender} />}
              {face.livenessBlinkDetected != null && (
                <Row label="Blink" value={face.livenessBlinkDetected ? "Detected" : "No"} />
              )}
            </div>
          )}
          <div className="border-t border-gray-100 pt-2 space-y-1 text-sm">
            <Row label="Duration" value={getDuration(sess?.startedAt || null, sess?.endedAt || null)} />
            <Row label="Status" value={sess?.status || "—"} />
            {sess?.geoLatitude && sess?.geoLongitude && (
              <Row
                label="Location"
                value={
                  data.resolvedLocation
                    ? `${data.resolvedLocation} (${parseFloat(sess.geoLatitude).toFixed(2)}, ${parseFloat(sess.geoLongitude).toFixed(2)})`
                    : `${parseFloat(sess.geoLatitude).toFixed(2)}, ${parseFloat(sess.geoLongitude).toFixed(2)}`
                }
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-gray-500">{label}</span>
      <span className="text-gray-900 text-right">{value}</span>
    </div>
  );
}

function ScoreRow({ label, value }: { label: string; value: string | null }) {
  const num = value ? parseFloat(value) : null;
  return (
    <div className="flex justify-between items-center">
      <span className="text-gray-500">{label}</span>
      <span className="text-gray-900 font-mono text-xs">
        {num != null ? (num * 100).toFixed(0) + "%" : "—"}
      </span>
    </div>
  );
}

function CampaignCard({ campaign }: { campaign: CampaignData }) {
  const usagePercent = campaign.maxUses > 0 ? (campaign.currentUses / campaign.maxUses) * 100 : 0;
  const isExpired = new Date(campaign.expiresAt) < new Date();

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
      <div className="flex items-start justify-between mb-2">
        <div>
          <h4 className="font-medium text-gray-900">{campaign.name}</h4>
          <p className="text-xs font-mono text-gray-500 mt-0.5">{campaign.code}</p>
        </div>
        <div className="flex gap-1.5">
          <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getChannelColor(campaign.channel)}`}>
            {campaign.channel}
          </span>
          {isExpired || !campaign.isActive ? (
            <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-red-100 text-red-700">
              {isExpired ? "Expired" : "Inactive"}
            </span>
          ) : (
            <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-green-100 text-green-700">
              Active
            </span>
          )}
        </div>
      </div>
      <p className="text-xs text-gray-500 mb-3">{campaign.productType}</p>
      <div className="mb-1 flex justify-between text-xs text-gray-500">
        <span>Usage</span>
        <span>{campaign.currentUses} / {campaign.maxUses}</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className="bg-indigo-500 h-2 rounded-full transition-all"
          style={{ width: `${Math.min(usagePercent, 100)}%` }}
        />
      </div>
      <p className="text-xs text-gray-400 mt-2">
        Created {formatDate(campaign.createdAt)}
      </p>
    </div>
  );
}
