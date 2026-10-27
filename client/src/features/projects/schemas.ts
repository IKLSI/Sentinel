import { z } from "zod";
import { ScanFrequency, SuppressionReason } from "@/enums";

export const projectSettingsSchema = z.object({
  scanFrequency: z.enum(ScanFrequency),
  branch: z.string(),
  rootPath: z.string(),
});
export type ProjectSettingsFormValues = z.infer<typeof projectSettingsSchema>;

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
