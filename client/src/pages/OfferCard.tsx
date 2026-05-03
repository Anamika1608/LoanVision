import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getOffer, acceptOffer, declineOffer } from "../lib/api";

interface OfferData {
  id: string;
  eligibleAmount: string;
  interestRate: string;
  tenureOptions: number[];
  selectedTenure: number;
  emiAmount: string;
  processingFee: string;
  processingFeePercent: string;
  riskBand: string;
  validUntil: string;
  status: string;
}

interface RiskData {
  compositeScore: string;
  bureauScore: string;
  riskBand: string;
  fraudFlags: string[];
  decisionRationale: string;
  policyChecksPassed: boolean;
}

interface ApplicationData {
  firstName: string | null;
  lastName: string | null;
  monthlyIncome: string | null;
  loanAmountRequested: string | null;
  status: string;
}

type PageState = "loading" | "offer" | "rejected" | "accepted" | "declined" | "error";

function calculateEMI(principal: number, annualRate: number, months: number): number {
  const r = annualRate / 12 / 100;
  if (r === 0) return principal / months;
  return (principal * r * Math.pow(1 + r, months)) / (Math.pow(1 + r, months) - 1);
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

function getRiskBandColor(band: string): string {
  if (band === "A1" || band === "A2") return "bg-green-100 text-green-800 border-green-300";
  if (band === "B1" || band === "B2") return "bg-yellow-100 text-yellow-800 border-yellow-300";
  if (band === "C1" || band === "C2") return "bg-orange-100 text-orange-800 border-orange-300";
  return "bg-red-100 text-red-800 border-red-300";
}

export default function OfferCard() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const [pageState, setPageState] = useState<PageState>("loading");
  const [offerData, setOfferData] = useState<OfferData | null>(null);
  const [riskData, setRiskData] = useState<RiskData | null>(null);
  const [appData, setAppData] = useState<ApplicationData | null>(null);
  const [selectedTenure, setSelectedTenure] = useState(36);
  const [currentEmi, setCurrentEmi] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!sessionId) return;

    const fetchOffer = async () => {
      try {
        const data = await getOffer(sessionId);
        setAppData(data.application);
        setRiskData(data.riskAssessment);

        if (data.offer) {
          setOfferData(data.offer);
          setSelectedTenure(data.offer.selectedTenure || 36);
          setCurrentEmi(parseFloat(data.offer.emiAmount));

          if (data.offer.status === "accepted") {
            setPageState("accepted");
          } else if (data.offer.status === "rejected") {
            setPageState("declined");
          } else {
            setPageState("offer");
          }
        } else {
          setPageState("rejected");
        }
      } catch {
        setPageState("error");
      }
    };

    const timer = setTimeout(fetchOffer, 1500);
    return () => clearTimeout(timer);
  }, [sessionId]);

  useEffect(() => {
    if (!offerData) return;
    const principal = parseFloat(offerData.eligibleAmount);
    const rate = parseFloat(offerData.interestRate);
    const emi = calculateEMI(principal, rate, selectedTenure);
    setCurrentEmi(emi);
  }, [selectedTenure, offerData]);

  const handleAccept = async () => {
    if (!sessionId) return;
    setSubmitting(true);
    try {
      await acceptOffer(sessionId, selectedTenure);
      setPageState("accepted");
    } catch (err) {
      console.error("Accept error:", err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDecline = async () => {
    if (!sessionId) return;
    setSubmitting(true);
    try {
      await declineOffer(sessionId);
      setPageState("declined");
    } catch (err) {
      console.error("Decline error:", err);
    } finally {
      setSubmitting(false);
    }
  };

  if (pageState === "loading") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 border-4 border-indigo-200 rounded-full"></div>
          <div className="absolute inset-0 border-4 border-indigo-600 rounded-full border-t-transparent animate-spin"></div>
        </div>
        <p className="text-gray-600 font-medium">Analyzing your profile...</p>
        <p className="text-sm text-gray-400">Running risk assessment & generating offer</p>
      </div>
    );
  }

  if (pageState === "error") {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="bg-red-50 border border-red-200 rounded-xl p-8 max-w-md text-center">
          <h2 className="text-xl font-bold text-red-700 mb-2">Something went wrong</h2>
          <p className="text-red-600 text-sm">Unable to fetch your application status. Please try again.</p>
          <button
            onClick={() => navigate("/dashboard")}
            className="mt-4 px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (pageState === "rejected") {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-8 max-w-lg w-full">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Application Declined</h2>
            <p className="text-gray-500 mt-1">Based on our assessment, we're unable to offer a loan at this time.</p>
          </div>

          {riskData && (
            <div className="bg-gray-50 rounded-lg p-4 mb-6 space-y-2">
              {riskData.decisionRationale && (
                <p className="text-sm text-gray-700">{riskData.decisionRationale}</p>
              )}
              {riskData.fraudFlags && riskData.fraudFlags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {(riskData.fraudFlags as string[]).map((flag, i) => (
                    <span key={i} className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded">
                      {flag.replace(/_/g, " ")}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          <button
            onClick={() => navigate("/dashboard")}
            className="w-full py-3 px-4 bg-gray-800 text-white font-medium rounded-lg hover:bg-gray-900 transition-colors"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (pageState === "accepted") {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-8 max-w-lg w-full text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Offer Accepted!</h2>
          <p className="text-gray-600 mb-6">
            Your loan of {offerData ? formatCurrency(parseFloat(offerData.eligibleAmount)) : ""} has been confirmed.
            Disbursement will be processed within 48 hours.
          </p>
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-gray-500">EMI</span>
                <p className="font-semibold text-gray-900">{formatCurrency(currentEmi)}/mo</p>
              </div>
              <div>
                <span className="text-gray-500">Tenure</span>
                <p className="font-semibold text-gray-900">{selectedTenure} months</p>
              </div>
              <div>
                <span className="text-gray-500">Interest Rate</span>
                <p className="font-semibold text-gray-900">{offerData?.interestRate}% p.a.</p>
              </div>
              <div>
                <span className="text-gray-500">Processing Fee</span>
                <p className="font-semibold text-gray-900">{offerData ? formatCurrency(parseFloat(offerData.processingFee)) : ""}</p>
              </div>
            </div>
          </div>
          <button
            onClick={() => navigate("/dashboard")}
            className="w-full py-3 px-4 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (pageState === "declined") {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Offer Declined</h2>
          <p className="text-gray-500 mb-6">You've chosen not to proceed with this loan offer.</p>
          <button
            onClick={() => navigate("/dashboard")}
            className="w-full py-3 px-4 bg-gray-800 text-white font-medium rounded-lg hover:bg-gray-900 transition-colors"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // Main offer view
  return (
    <div className="flex items-center justify-center min-h-[60vh] p-4">
      <div className="bg-white border border-gray-200 rounded-xl shadow-lg p-8 max-w-xl w-full">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900">You're Pre-Approved!</h2>
          {appData && (
            <p className="text-gray-500 mt-1">
              Hi {appData.firstName}, here's your personalized loan offer
            </p>
          )}
        </div>

        {/* Risk Band Badge */}
        {offerData && (
          <div className="flex justify-center mb-4">
            <span className={`px-3 py-1 text-xs font-semibold rounded-full border ${getRiskBandColor(offerData.riskBand)}`}>
              Credit Score: {offerData.riskBand}
            </span>
          </div>
        )}

        {/* Eligible Amount */}
        {offerData && (
          <div className="text-center mb-6">
            <p className="text-sm text-gray-500 mb-1">Eligible Loan Amount</p>
            <p className="text-4xl font-bold text-indigo-700">
              {formatCurrency(parseFloat(offerData.eligibleAmount))}
            </p>
          </div>
        )}

        {/* Key Details */}
        {offerData && (
          <div className="grid grid-cols-3 gap-4 bg-gray-50 rounded-lg p-4 mb-6">
            <div className="text-center">
              <p className="text-xs text-gray-500">Interest Rate</p>
              <p className="text-lg font-semibold text-gray-900">{offerData.interestRate}%</p>
              <p className="text-xs text-gray-400">per annum</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-500">Processing Fee</p>
              <p className="text-lg font-semibold text-gray-900">{formatCurrency(parseFloat(offerData.processingFee))}</p>
              <p className="text-xs text-gray-400">{offerData.processingFeePercent}%</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-500">Valid Until</p>
              <p className="text-lg font-semibold text-gray-900">
                {new Date(offerData.validUntil).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
              </p>
              <p className="text-xs text-gray-400">7 days</p>
            </div>
          </div>
        )}

        {/* Tenure Selector */}
        {offerData && (
          <div className="mb-6">
            <p className="text-sm font-medium text-gray-700 mb-3">Select Tenure</p>
            <div className="flex gap-2">
              {(offerData.tenureOptions as number[]).map((months) => (
                <button
                  key={months}
                  onClick={() => setSelectedTenure(months)}
                  className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                    selectedTenure === months
                      ? "bg-indigo-600 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {months}mo
                </button>
              ))}
            </div>
          </div>
        )}

        {/* EMI Display */}
        <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-4 mb-6 text-center">
          <p className="text-sm text-indigo-600 mb-1">Monthly EMI</p>
          <p className="text-3xl font-bold text-indigo-700">{formatCurrency(currentEmi)}</p>
          <p className="text-xs text-indigo-400 mt-1">for {selectedTenure} months</p>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={handleDecline}
            disabled={submitting}
            className="flex-1 py-3 px-4 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            Decline
          </button>
          <button
            onClick={handleAccept}
            disabled={submitting}
            className="flex-2 py-3 px-4 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
          >
            {submitting ? "Processing..." : "Accept Offer"}
          </button>
        </div>
      </div>
    </div>
  );
}
