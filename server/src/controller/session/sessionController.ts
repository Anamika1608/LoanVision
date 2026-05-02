import { eq } from "drizzle-orm";

import db from "src/db";
import { session } from "src/model/session";
import { campaign } from "src/model/campaign";
import { BadRequestError } from "src/utils/error";

export const createSession = async (
  userId: string | undefined,
  campaignCode: string,
  geoLatitude?: number,
  geoLongitude?: number,
  deviceInfo?: Record<string, unknown>
) => {
  const [campaignRecord] = await db.select().from(campaign).where(eq(campaign.code, campaignCode)).limit(1);

  if (!campaignRecord || !campaignRecord.isActive) {
    throw new BadRequestError("Invalid or inactive campaign");
  }

  const [newSession] = await db
    .insert(session)
    .values({
      userId: userId || undefined,
      campaignId: campaignCode,
      status: "pending",
      geoLatitude: geoLatitude?.toString(),
      geoLongitude: geoLongitude?.toString(),
      deviceInfo
    })
    .returning();

  return newSession;
};

export const startSession = async (sessionId: string) => {
  const [updated] = await db
    .update(session)
    .set({ status: "active", startedAt: new Date(), updatedAt: new Date() })
    .where(eq(session.id, sessionId))
    .returning();

  if (!updated) {
    throw new BadRequestError("Session not found");
  }

  return updated;
};

export const endSession = async (sessionId: string) => {
  const [existing] = await db.select().from(session).where(eq(session.id, sessionId)).limit(1);

  if (!existing) {
    throw new BadRequestError("Session not found");
  }

  const endedAt = new Date();
  const duration = existing.startedAt
    ? Math.round((endedAt.getTime() - new Date(existing.startedAt).getTime()) / 1000)
    : 0;

  const [updated] = await db
    .update(session)
    .set({ status: "completed", endedAt, updatedAt: new Date() })
    .where(eq(session.id, sessionId))
    .returning();

  return { ...updated, duration };
};

export const getSession = async (sessionId: string) => {
  const [sessionRecord] = await db.select().from(session).where(eq(session.id, sessionId)).limit(1);

  if (!sessionRecord) {
    throw new BadRequestError("Session not found");
  }

  return sessionRecord;
};
