import { ROUTES_API } from "@/configs/api-routes.gen";
import { useGetQuery } from "@/domains/helpers";
import {
  INTEGRATIONS_QUERY_KEY,
  ORGANIZATION_QUERY_KEY,
} from "@/domains/settings/constants";
import type {
  AppConfig,
  IntegrationSettings,
  OrganizationSettings,
} from "@/domains/settings/types";

export const useOrganizationSettingsQuery = () =>
  useGetQuery<OrganizationSettings>(
    ROUTES_API.api.settings.organization.__path,
    {},
    { queryKey: ORGANIZATION_QUERY_KEY },
  );

export const useIntegrationSettingsQuery = () =>
  useGetQuery<IntegrationSettings>(
    ROUTES_API.api.settings.integrations.__path,
    {},
    { queryKey: INTEGRATIONS_QUERY_KEY },
  );

export const useAppConfigQuery = () =>
  useGetQuery<AppConfig>(ROUTES_API.api.config.__path);
