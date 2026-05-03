import { z } from "zod";

export const applicationDetailParamSchema = z.object({
  params: z.object({
    applicationId: z.string().uuid(),
  }),
});
