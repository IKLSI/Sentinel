import { z } from "zod";

export const createApiKeySchema = z.object({
  name: z.string().trim().min(1),
  expiresAt: z.string().optional(),
});
export type CreateApiKeyFormValues = z.infer<typeof createApiKeySchema>;
