import { describe, expect, it } from "vitest";
import {
  gitlabIntegrationSchema,
  organizationSchema,
} from "@/features/settings/pages/OrganisationPage/schemas";

describe("organizationSchema", () => {
  it("rejects a blank organization name", () => {
    const result = organizationSchema.safeParse({
      name: "   ",
      securityAlertsEnabled: true,
      alertMinSeverity: "High",
    });

    expect(result.success).toBe(false);
  });
});

describe("gitlabIntegrationSchema", () => {
  it("trims the token and the instance url", () => {
    const result = gitlabIntegrationSchema.parse({
      token: " glpat ",
      baseUrl: " https://git.example ",
    });

    expect(result).toEqual({ token: "glpat", baseUrl: "https://git.example" });
  });
});
