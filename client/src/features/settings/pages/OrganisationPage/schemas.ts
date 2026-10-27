import { z } from "zod";

export const organizationSchema = z.object({
  name: z.string().trim().min(1, { message: "settings.toast.name_required" }),
  securityAlertsEnabled: z.boolean(),
  alertMinSeverity: z.string(),
});
export type OrganizationFormValues = z.infer<typeof organizationSchema>;

export const githubIntegrationSchema = z.object({
  token: z.string().trim().min(1, { message: "settings.toast.token_required" }),
});
export type GithubIntegrationFormValues = z.infer<
  typeof githubIntegrationSchema
>;

export const gitlabIntegrationSchema = githubIntegrationSchema.extend({
  baseUrl: z.string().trim(),
});
export type GitlabIntegrationFormValues = z.infer<
  typeof gitlabIntegrationSchema
>;
