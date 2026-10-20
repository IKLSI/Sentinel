import { z } from "zod";
import { ScanFrequency } from "@/enums";

export const projectSettingsSchema = z.object({
  scanFrequency: z.enum(ScanFrequency),
  branch: z.string(),
  rootPath: z.string(),
});
export type ProjectSettingsFormValues = z.infer<typeof projectSettingsSchema>;
