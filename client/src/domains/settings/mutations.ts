import { ROUTES_API } from "@/configs/api-routes.gen";
import { queryClient } from "@/configs/queryClient";
import { usePostMutation, usePutMutation } from "@/domains/helpers";
import { ORGANIZATION_QUERY_KEY } from "@/domains/settings/constants";
import type {
  ConnectIntegration,
  OrganizationSettings,
  UpdateOrganizationSettings,
} from "@/domains/settings/types";

export const useUpdateOrganizationSettingsMutation = () =>
  usePutMutation<
    OrganizationSettings,
    OrganizationSettings,
    { data: UpdateOrganizationSettings }
  >(ROUTES_API.api.settings.organization.__path, {
    onSuccess: (updated) =>
      queryClient.setQueryData(ORGANIZATION_QUERY_KEY, updated),
  });

export const useConnectGithubMutation = () =>
  usePostMutation<void, void, { data: ConnectIntegration }>(
    ROUTES_API.api.settings.integrations.github.__path,
  );

export const useConnectGitlabMutation = () =>
  usePostMutation<void, void, { data: ConnectIntegration }>(
    ROUTES_API.api.settings.integrations.gitlab.__path,
  );
