import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";

import db from "src/db";
import { campaign } from "src/model/campaign";
import { BadRequestError } from "src/utils/error";

export const createCampaign = async (
  name: string,
  channel: "sms" | "whatsapp" | "email" | "web",
  productType: string,
  maxUses: number,
  expiresAt: string
) => {
  const code = nanoid(10);

  const [newCampaign] = await db
    .insert(campaign)
    .values({
      code,
      name,
      channel,
      productType,
      maxUses,
      expiresAt: new Date(expiresAt)
    })
    .returning();

  return newCampaign;
};

export const validateCampaignCode = async (code: string) => {
  const [campaignRecord] = await db.select().from(campaign).where(eq(campaign.code, code)).limit(1);

  if (!campaignRecord) {
    throw new BadRequestError("Invalid campaign code");
  }
  if (!campaignRecord.isActive) {
    throw new BadRequestError("Campaign is no longer active");
  }
  if (new Date() > campaignRecord.expiresAt) {
    throw new BadRequestError("Campaign has expired");
  }
  if (campaignRecord.currentUses >= campaignRecord.maxUses) {
    throw new BadRequestError("Campaign has reached maximum uses");
  }

  await db
    .update(campaign)
    .set({ currentUses: campaignRecord.currentUses + 1 })
    .where(eq(campaign.code, code));

  return campaignRecord;
};

export const listCampaigns = async () => {
  return await db.select().from(campaign);
};
