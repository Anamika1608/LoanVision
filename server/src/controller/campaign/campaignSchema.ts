import { z } from "zod";

export const createCampaignSchema = z.object({
  body: z.object({
    name: z.string().min(1, { message: "Campaign name is required" }),
    channel: z.enum(["sms", "whatsapp", "email", "web"]),
    productType: z.string().min(1, { message: "Product type is required" }),
    maxUses: z.number().int().positive(),
    expiresAt: z.string().datetime({ message: "Valid ISO datetime required" })
  })
});

export const validateCampaignCodeSchema = z.object({
  params: z.object({
    code: z.string().min(1, { message: "Campaign code is required" })
  })
});
