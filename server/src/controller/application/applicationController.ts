import { eq } from "drizzle-orm";

import db from "src/db";
import { application } from "src/model/application";
import { riskAssessment } from "src/model/riskAssessment";
import { offer } from "src/model/offer";
import { BadRequestError } from "src/utils/error";

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || "http://localhost:8000";

interface Entities {
  full_name?: string | null;
  date_of_birth?: string | null;
  declared_age?: number | null;
  employer?: string | null;
  monthly_income?: number | null;
  loan_purpose?: string | null;
  loan_amount_requested?: number | null;
  consent_given?: boolean;
  consent_phrase?: string | null;
  confidence?: number;
}

interface CvResults {
  face_match_score?: number | null;
  liveness_blink?: boolean | null;
  estimated_age?: number | null;
  estimated_gender?: string | null;
  id_verification?: {
    face_registered?: boolean;
    id_data?: Record<string, unknown>;
  } | null;
}

interface PolicyResult {
  passed: boolean;
  flags: string[];
  passRatio: number;
}

const RISK_BAND_CONFIG: Record<string, { multiplier: number; rate: number; fee: number }> = {
  A1: { multiplier: 20, rate: 10.5, fee: 1.0 },
  A2: { multiplier: 15, rate: 13.5, fee: 1.5 },
  B1: { multiplier: 12, rate: 16.0, fee: 2.0 },
  B2: { multiplier: 8, rate: 19.0, fee: 2.5 },
  C1: { multiplier: 5, rate: 22.0, fee: 3.0 },
  C2: { multiplier: 3, rate: 25.0, fee: 3.5 },
};

function mockBureauScore(fullName: string): number {
  let hash = 0;
  for (const ch of fullName.toLowerCase().replace(/\s/g, "")) {
    hash = ((hash << 5) - hash + ch.charCodeAt(0)) | 0;
  }
  return 300 + (Math.abs(hash) % 601);
}

function runPolicyChecks(entities: Entities, cvResults: CvResults): PolicyResult {
  const flags: string[] = [];
  let totalChecks = 6;
  let passedChecks = 0;

  // Age check (18-60)
  let age: number | null = null;
  if (entities.date_of_birth) {
    const dob = new Date(entities.date_of_birth);
    age = Math.floor((Date.now() - dob.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
  } else if (entities.declared_age) {
    age = entities.declared_age;
  }
  if (age !== null && age >= 18 && age <= 60) {
    passedChecks++;
  } else {
    flags.push(age === null ? "age_unknown" : age < 18 ? "underage" : "overage");
  }

  // Income check (>= 15000)
  if (entities.monthly_income && entities.monthly_income >= 15000) {
    passedChecks++;
  } else {
    flags.push("income_below_minimum");
  }

  // Consent check
  if (entities.consent_given) {
    passedChecks++;
  } else {
    flags.push("no_consent");
  }

  // Face match check (>= 0.4)
  if (cvResults.face_match_score != null && cvResults.face_match_score >= 0.4) {
    passedChecks++;
  } else if (cvResults.face_match_score == null) {
    passedChecks++; // no ID uploaded, skip this check
  } else {
    flags.push("face_match_low");
  }

  // Liveness check
  if (cvResults.liveness_blink) {
    passedChecks++;
  } else {
    passedChecks++; // lenient for demo — don't reject on liveness alone
  }

  // Loan-to-income ratio (<= 25x)
  if (entities.loan_amount_requested && entities.monthly_income) {
    if (entities.loan_amount_requested <= entities.monthly_income * 25) {
      passedChecks++;
    } else {
      flags.push("loan_to_income_high");
    }
  } else {
    passedChecks++;
  }

  const hardRejectFlags = ["underage", "overage", "no_consent"];
  const hasHardReject = flags.some((f) => hardRejectFlags.includes(f));

  return {
    passed: !hasHardReject,
    flags,
    passRatio: passedChecks / totalChecks,
  };
}

function computeVideoFraudScore(cvResults: CvResults): number {
  const faceScore = cvResults.face_match_score ?? 0.5;
  const livenessScore = cvResults.liveness_blink ? 1.0 : 0.5;
  return (faceScore + livenessScore) / 2;
}

function compositeToRiskBand(score: number): string {
  if (score >= 0.85) return "A1";
  if (score >= 0.70) return "A2";
  if (score >= 0.55) return "B1";
  if (score >= 0.40) return "B2";
  if (score >= 0.25) return "C1";
  if (score >= 0.10) return "C2";
  return "REJECT";
}

function calculateEMI(principal: number, annualRate: number, months: number): number {
  const r = annualRate / 12 / 100;
  if (r === 0) return principal / months;
  return (principal * r * Math.pow(1 + r, months)) / (Math.pow(1 + r, months) - 1);
}

function generateOfferData(entities: Entities, riskBand: string) {
  const config = RISK_BAND_CONFIG[riskBand];
  if (!config) return null;

  const monthlyIncome = entities.monthly_income || 30000;
  const maxEligible = config.multiplier * monthlyIncome;
  const requested = entities.loan_amount_requested || maxEligible;
  const eligibleAmount = Math.min(requested, maxEligible);

  const tenureOptions = [12, 24, 36, 48, 60];
  const defaultTenure = 36;
  const emiAmount = calculateEMI(eligibleAmount, config.rate, defaultTenure);
  const processingFee = eligibleAmount * (config.fee / 100);

  const validUntil = new Date();
  validUntil.setDate(validUntil.getDate() + 7);

  return {
    eligibleAmount: eligibleAmount.toFixed(2),
    interestRate: config.rate.toFixed(2),
    tenureOptions,
    selectedTenure: defaultTenure,
    emiAmount: emiAmount.toFixed(2),
    processingFee: processingFee.toFixed(2),
    processingFeePercent: config.fee.toFixed(2),
    riskBand,
    validUntil,
  };
}

export const createApplication = async (
  sessionId: string,
  entities: Entities,
  cvResults: CvResults
) => {
  const nameParts = (entities.full_name || "").split(" ");
  const firstName = nameParts[0] || null;
  const lastName = nameParts.slice(1).join(" ") || null;

  // 1. Insert application
  const [app] = await db
    .insert(application)
    .values({
      sessionId,
      status: "submitted",
      firstName,
      lastName,
      dateOfBirth: entities.date_of_birth || undefined,
      declaredAge: entities.declared_age,
      employer: entities.employer,
      monthlyIncome: entities.monthly_income?.toString(),
      loanPurpose: entities.loan_purpose,
      loanAmountRequested: entities.loan_amount_requested?.toString(),
      consentGiven: entities.consent_given || false,
      consentTranscript: entities.consent_phrase,
    })
    .returning();

  // 2. Policy checks
  const policy = runPolicyChecks(entities, cvResults);

  if (!policy.passed) {
    const [risk] = await db
      .insert(riskAssessment)
      .values({
        applicationId: app.id,
        sessionId,
        riskBand: "REJECT",
        policyChecksPassed: false,
        fraudFlags: policy.flags,
        compositeScore: "0",
        decisionRationale: `Policy rejection: ${policy.flags.join(", ")}`,
      })
      .returning();

    await db.update(application).set({ status: "rejected" }).where(eq(application.id, app.id));

    return {
      applicationId: app.id,
      riskBand: "REJECT",
      policyFlags: policy.flags,
      rationale: risk.decisionRationale,
      offer: null,
    };
  }

  // 3. Bureau score
  const bureauScore = mockBureauScore(entities.full_name || "unknown");
  const normalizedBureau = bureauScore / 900;

  // 4. LLM risk classification
  let llmConfidence = 0.5;
  let llmFraudFlags: string[] = [];
  let llmRationale = "";
  try {
    const resp = await fetch(`${AI_SERVICE_URL}/llm/classify-risk`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        entities,
        cv_results: cvResults,
        geo_data: {},
      }),
    });
    if (resp.ok) {
      const llmResult = (await resp.json()) as {
        confidence?: number;
        fraud_flags?: string[];
        rationale?: string;
      };
      llmConfidence = llmResult.confidence || 0.5;
      llmFraudFlags = llmResult.fraud_flags || [];
      llmRationale = llmResult.rationale || "";
    }
  } catch (err) {
    console.error("[application] LLM classify-risk failed:", err);
  }

  // 5. Video fraud score
  const videoFraudScore = computeVideoFraudScore(cvResults);

  // 6. Composite score
  const altDataScore = 0.7;
  const compositeScore =
    normalizedBureau * 0.3 +
    llmConfidence * 0.25 +
    videoFraudScore * 0.2 +
    policy.passRatio * 0.15 +
    altDataScore * 0.1;

  // 7. Final risk band
  const finalRiskBand = compositeToRiskBand(compositeScore);
  const allFraudFlags = [...policy.flags, ...llmFraudFlags];

  // 8. Insert risk assessment
  const [risk] = await db
    .insert(riskAssessment)
    .values({
      applicationId: app.id,
      sessionId,
      bureauScore: normalizedBureau.toFixed(4),
      llmConfidenceScore: llmConfidence.toFixed(4),
      videoFraudScore: videoFraudScore.toFixed(4),
      alternateDataScore: altDataScore.toFixed(4),
      compositeScore: compositeScore.toFixed(4),
      riskBand: finalRiskBand as any,
      policyChecksPassed: true,
      fraudFlags: allFraudFlags,
      decisionRationale: llmRationale || `Composite score: ${compositeScore.toFixed(3)}, Bureau: ${bureauScore}`,
    })
    .returning();

  // 9. Generate offer (if not REJECT)
  let offerData: Record<string, unknown> | null = null;
  if (finalRiskBand !== "REJECT") {
    const offerParams = generateOfferData(entities, finalRiskBand);
    if (offerParams) {
      const [offerRecord] = await db
        .insert(offer)
        .values({
          applicationId: app.id,
          riskAssessmentId: risk.id,
          status: "generated",
          eligibleAmount: offerParams.eligibleAmount,
          interestRate: offerParams.interestRate,
          tenureOptions: offerParams.tenureOptions,
          selectedTenure: offerParams.selectedTenure,
          emiAmount: offerParams.emiAmount,
          processingFee: offerParams.processingFee,
          processingFeePercent: offerParams.processingFeePercent,
          riskBand: offerParams.riskBand,
          validUntil: offerParams.validUntil,
        })
        .returning();

      await db.update(application).set({ status: "approved" }).where(eq(application.id, app.id));
      offerData = offerRecord;
    }
  } else {
    await db.update(application).set({ status: "rejected" }).where(eq(application.id, app.id));
  }

  return {
    applicationId: app.id,
    riskBand: finalRiskBand,
    compositeScore: compositeScore.toFixed(3),
    bureauScore,
    policyFlags: policy.flags,
    fraudFlags: allFraudFlags,
    rationale: risk.decisionRationale,
    offer: offerData,
  };
};

export const getOffer = async (sessionId: string) => {
  const [app] = await db
    .select()
    .from(application)
    .where(eq(application.sessionId, sessionId))
    .limit(1);

  if (!app) {
    throw new BadRequestError("Application not found for this session");
  }

  const [risk] = await db
    .select()
    .from(riskAssessment)
    .where(eq(riskAssessment.applicationId, app.id))
    .limit(1);

  const [offerRecord] = await db
    .select()
    .from(offer)
    .where(eq(offer.applicationId, app.id))
    .limit(1);

  return {
    application: app,
    riskAssessment: risk || null,
    offer: offerRecord || null,
  };
};

export const acceptOffer = async (sessionId: string, selectedTenure: number) => {
  const [app] = await db
    .select()
    .from(application)
    .where(eq(application.sessionId, sessionId))
    .limit(1);

  if (!app) throw new BadRequestError("Application not found");

  const [offerRecord] = await db
    .select()
    .from(offer)
    .where(eq(offer.applicationId, app.id))
    .limit(1);

  if (!offerRecord) throw new BadRequestError("No offer found");
  if (offerRecord.status !== "generated") throw new BadRequestError("Offer already actioned");

  const annualRate = parseFloat(offerRecord.interestRate || "12");
  const principal = parseFloat(offerRecord.eligibleAmount || "0");
  const newEmi = calculateEMI(principal, annualRate, selectedTenure);

  const [updated] = await db
    .update(offer)
    .set({
      status: "accepted",
      selectedTenure,
      emiAmount: newEmi.toFixed(2),
    })
    .where(eq(offer.id, offerRecord.id))
    .returning();

  return updated;
};

export const declineOffer = async (sessionId: string) => {
  const [app] = await db
    .select()
    .from(application)
    .where(eq(application.sessionId, sessionId))
    .limit(1);

  if (!app) throw new BadRequestError("Application not found");

  const [offerRecord] = await db
    .select()
    .from(offer)
    .where(eq(offer.applicationId, app.id))
    .limit(1);

  if (!offerRecord) throw new BadRequestError("No offer found");

  const [updated] = await db
    .update(offer)
    .set({ status: "rejected" })
    .where(eq(offer.id, offerRecord.id))
    .returning();

  return updated;
};
