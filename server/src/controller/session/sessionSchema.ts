import { z } from "zod";

export const createSessionSchema = z.object({
  body: z.object({
    campaignCode: z.string().min(1, { message: "Campaign code is required" }),
    geoLatitude: z.number().optional(),
    geoLongitude: z.number().optional(),
    deviceInfo: z.record(z.unknown()).optional()
  })
});

export const sessionIdParamSchema = z.object({
  params: z.object({
    id: z.string().uuid({ message: "Valid session ID required" })
  })
});
