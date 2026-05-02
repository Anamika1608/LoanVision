import { pgEnum } from "drizzle-orm/pg-core";

export const campaignChannelEnum = pgEnum("campaign_channel", ["sms", "whatsapp", "email", "web"]);

export const sessionStatusEnum = pgEnum("session_status", ["pending", "active", "completed", "expired", "failed"]);

export const applicationStatusEnum = pgEnum("application_status", [
  "in_progress",
  "submitted",
  "approved",
  "rejected",
  "escalated"
]);

export const riskBandEnum = pgEnum("risk_band", ["A1", "A2", "B1", "B2", "C1", "C2", "REJECT"]);

export const offerStatusEnum = pgEnum("offer_status", ["generated", "presented", "accepted", "rejected", "expired"]);

export const auditEventTypeEnum = pgEnum("audit_event_type", [
  "session_start",
  "consent_captured",
  "face_detected",
  "face_matched",
  "age_estimated",
  "liveness_passed",
  "transcript_chunk",
  "entity_extracted",
  "bureau_pulled",
  "risk_computed",
  "offer_generated",
  "offer_presented",
  "policy_check",
  "fraud_flag",
  "session_end"
]);

export const auditSourceEnum = pgEnum("audit_source", ["client", "server", "ai-service"]);
