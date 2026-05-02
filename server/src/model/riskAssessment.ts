import { InferSelectModel } from "drizzle-orm";
import { pgTable, uuid, decimal, boolean, text, timestamp, jsonb } from "drizzle-orm/pg-core";
import { application } from "./application";
import { session } from "./session";
import { riskBandEnum } from "./enums";

export const riskAssessment = pgTable("risk_assessments", {
  id: uuid("id").primaryKey().defaultRandom(),
  applicationId: uuid("application_id")
    .references(() => application.id)
    .notNull(),
  sessionId: uuid("session_id")
    .references(() => session.id)
    .notNull(),
  bureauScore: decimal("bureau_score", { precision: 5, scale: 4 }),
  mlPropensityScore: decimal("ml_propensity_score", { precision: 5, scale: 4 }),
  videoFraudScore: decimal("video_fraud_score", { precision: 5, scale: 4 }),
  llmConfidenceScore: decimal("llm_confidence_score", { precision: 5, scale: 4 }),
  alternateDataScore: decimal("alternate_data_score", { precision: 5, scale: 4 }),
  compositeScore: decimal("composite_score", { precision: 5, scale: 4 }),
  riskBand: riskBandEnum("risk_band"),
  fraudFlags: jsonb("fraud_flags"),
  policyChecksPassed: boolean("policy_checks_passed"),
  decisionRationale: text("decision_rationale"),
  createdAt: timestamp("created_at").notNull().defaultNow()
});

export type RiskAssessment = InferSelectModel<typeof riskAssessment>;
