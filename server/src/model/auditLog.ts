import { InferSelectModel } from "drizzle-orm";
import { pgTable, uuid, timestamp, jsonb } from "drizzle-orm/pg-core";
import { session } from "./session";
import { auditEventTypeEnum, auditSourceEnum } from "./enums";

export const auditLog = pgTable("audit_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  sessionId: uuid("session_id")
    .references(() => session.id)
    .notNull(),
  eventType: auditEventTypeEnum("event_type").notNull(),
  payload: jsonb("payload"),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
  source: auditSourceEnum("source").notNull()
});

export type AuditLog = InferSelectModel<typeof auditLog>;
