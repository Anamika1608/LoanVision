import { InferSelectModel } from "drizzle-orm";
import {
  pgTable,
  uuid,
  varchar,
  integer,
  decimal,
  text,
  boolean,
  timestamp,
  date
} from "drizzle-orm/pg-core";
import { user } from "./user";
import { session } from "./session";
import { applicationStatusEnum } from "./enums";

export const application = pgTable("applications", {
  id: uuid("id").primaryKey().defaultRandom(),
  sessionId: uuid("session_id")
    .references(() => session.id)
    .notNull(),
  userId: uuid("user_id").references(() => user.id),
  status: applicationStatusEnum("status").notNull().default("in_progress"),
  firstName: varchar("first_name", { length: 50 }),
  lastName: varchar("last_name", { length: 50 }),
  dateOfBirth: date("date_of_birth"),
  estimatedAge: integer("estimated_age"),
  declaredAge: integer("declared_age"),
  employer: varchar("employer", { length: 100 }),
  monthlyIncome: decimal("monthly_income", { precision: 12, scale: 2 }),
  loanPurpose: text("loan_purpose"),
  loanAmountRequested: decimal("loan_amount_requested", { precision: 12, scale: 2 }),
  consentGiven: boolean("consent_given").default(false),
  consentTimestamp: timestamp("consent_timestamp"),
  consentTranscript: text("consent_transcript"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow()
});

export type Application = InferSelectModel<typeof application>;
