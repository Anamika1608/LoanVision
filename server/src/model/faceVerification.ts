import { InferSelectModel } from "drizzle-orm";
import { pgTable, uuid, boolean, decimal, integer, varchar, text, timestamp } from "drizzle-orm/pg-core";
import { session } from "./session";

export const faceVerification = pgTable("face_verifications", {
  id: uuid("id").primaryKey().defaultRandom(),
  sessionId: uuid("session_id")
    .references(() => session.id)
    .notNull(),
  faceDetected: boolean("face_detected"),
  faceMatchScore: decimal("face_match_score", { precision: 5, scale: 4 }),
  estimatedAge: integer("estimated_age"),
  estimatedGender: varchar("estimated_gender", { length: 10 }),
  livenessBlinkDetected: boolean("liveness_blink_detected"),
  livenessHeadTurnDetected: boolean("liveness_head_turn_detected"),
  livenessScore: decimal("liveness_score", { precision: 5, scale: 4 }),
  antiSpoofingPassed: boolean("anti_spoofing_passed"),
  framesCaptured: integer("frames_captured"),
  idPhotoUrl: text("id_photo_url"),
  createdAt: timestamp("created_at").notNull().defaultNow()
});

export type FaceVerification = InferSelectModel<typeof faceVerification>;
