import type { components } from "@/types/api.gen";

export type OrganizationSettings =
  components["schemas"]["OrganizationSettingsDto"];

export type UpdateOrganizationSettings =
  components["schemas"]["UpdateOrganizationSettingsDto"];

export type IntegrationSettings =
  components["schemas"]["IntegrationSettingsDto"];

export type ConnectIntegration = components["schemas"]["ConnectIntegrationDto"];

export type AppConfig = components["schemas"]["AppConfigDto"];
