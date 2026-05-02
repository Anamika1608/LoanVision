import { InferSelectModel } from "drizzle-orm";
import { pgTable, uuid, decimal, integer, varchar, timestamp, jsonb } from "drizzle-orm/pg-core";
import { application } from "./application";
import { riskAssessment } from "./riskAssessment";
import { offerStatusEnum } from "./enums";

export const offer = pgTable("offers", {
  id: uuid("id").primaryKey().defaultRandom(),
  applicationId: uuid("application_id")
    .references(() => application.id)
    .notNull(),
  riskAssessmentId: uuid("risk_assessment_id")
    .references(() => riskAssessment.id)
    .notNull(),
  status: offerStatusEnum("status").notNull().default("generated"),
  eligibleAmount: decimal("eligible_amount", { precision: 12, scale: 2 }),
  interestRate: decimal("interest_rate", { precision: 5, scale: 2 }),
  tenureOptions: jsonb("tenure_options"),
  selectedTenure: integer("selected_tenure"),
  emiAmount: decimal("emi_amount", { precision: 12, scale: 2 }),
  processingFee: decimal("processing_fee", { precision: 10, scale: 2 }),
  processingFeePercent: decimal("processing_fee_percent", { precision: 5, scale: 2 }),
  riskBand: varchar("risk_band", { length: 10 }),
  validUntil: timestamp("valid_until"),
  createdAt: timestamp("created_at").notNull().defaultNow()
});

export type Offer = InferSelectModel<typeof offer>;
