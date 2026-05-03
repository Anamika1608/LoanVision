import { z } from "zod";

export const createApplicationSchema = z.object({
  body: z.object({
    sessionId: z.string().uuid(),
    entities: z.object({
      full_name: z.string().nullable().optional(),
      date_of_birth: z.string().nullable().optional(),
      declared_age: z.number().nullable().optional(),
      employer: z.string().nullable().optional(),
      monthly_income: z.number().nullable().optional(),
      loan_purpose: z.string().nullable().optional(),
      loan_amount_requested: z.number().nullable().optional(),
      consent_given: z.boolean().optional(),
      consent_phrase: z.string().nullable().optional(),
      confidence: z.number().optional(),
    }),
    cvResults: z.object({
      face_match_score: z.number().nullable().optional(),
      liveness_blink: z.boolean().nullable().optional(),
      estimated_age: z.number().nullable().optional(),
      estimated_gender: z.string().nullable().optional(),
      id_verification: z.object({
        face_registered: z.boolean().optional(),
        id_data: z.record(z.unknown()).optional(),
      }).nullable().optional(),
    }).optional(),
  }),
});

export const sessionIdParamSchema = z.object({
  params: z.object({
    sessionId: z.string().uuid(),
  }),
});

export const acceptOfferSchema = z.object({
  params: z.object({
    sessionId: z.string().uuid(),
  }),
  body: z.object({
    selectedTenure: z.number().int().min(6).max(60),
  }),
});
