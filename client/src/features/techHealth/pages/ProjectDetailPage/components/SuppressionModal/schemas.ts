import { z } from "zod";
import { SuppressionReason } from "@/enums";

export const JUSTIFICATION_MAX_LENGTH = 1000;

export const suppressionSchema = z.object({
  reason: z.enum([
    SuppressionReason.NotAffected,
    SuppressionReason.FalsePositive,
    SuppressionReason.WillNotFix,
    SuppressionReason.RiskAccepted,
  ]),
  justification: z.string().trim().min(1).max(JUSTIFICATION_MAX_LENGTH),
  expiresAt: z.string(),
});
export type SuppressionFormValues = z.infer<typeof suppressionSchema>;
