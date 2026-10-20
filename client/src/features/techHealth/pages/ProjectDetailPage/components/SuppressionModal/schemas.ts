import { z } from "zod";
import { SuppressionReason } from "@/enums";

export const suppressionSchema = z.object({
  reason: z.enum([
    SuppressionReason.NotAffected,
    SuppressionReason.FalsePositive,
    SuppressionReason.WillNotFix,
    SuppressionReason.RiskAccepted,
  ]),
  expiresAt: z.string(),
});
export type SuppressionFormValues = z.infer<typeof suppressionSchema>;
