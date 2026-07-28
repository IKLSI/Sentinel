import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getOrganizationSettings,
  updateOrganizationSettings,
  getIntegrationSettings,
  connectGithub,
  connectGitlab,
} from "../api/settings";

export const ORGANIZATION_QUERY_KEY = ["settings", "organization"] as const;
export const INTEGRATIONS_QUERY_KEY = ["settings", "integrations"] as const;

export const useOrganizationSettings = () => {
  const query = useQuery({
    queryKey: ORGANIZATION_QUERY_KEY,
    queryFn: ({ signal }) => getOrganizationSettings(signal),
  });

  return {
    org: query.data ?? null,
    loading: query.isLoading,
  };
};

export const useUpdateOrganizationSettings = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateOrganizationSettings,
    onSuccess: (updated) =>
      queryClient.setQueryData(ORGANIZATION_QUERY_KEY, updated),
  });
};

export const useIntegrationSettings = () => {
  const query = useQuery({
    queryKey: INTEGRATIONS_QUERY_KEY,
    queryFn: ({ signal }) => getIntegrationSettings(signal),
  });

  return {
    integrations: query.data ?? { hasGithubToken: false, hasGitlabToken: false },
    loading: query.isLoading,
  };
};

export const useConnectGithub = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: connectGithub,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: INTEGRATIONS_QUERY_KEY }),
  });
};

export const useConnectGitlab = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: connectGitlab,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: INTEGRATIONS_QUERY_KEY }),
  });
};
