import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createApiKey, listApiKeys, revokeApiKey } from "../api/apiKeys";

export const API_KEYS_QUERY_KEY = ["settings", "apiKeys"] as const;

export const useApiKeys = () => {
  const query = useQuery({
    queryKey: API_KEYS_QUERY_KEY,
    queryFn: ({ signal }) => listApiKeys(signal),
  });

  return {
    keys: query.data ?? [],
    loading: query.isLoading,
  };
};

export const useCreateApiKey = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createApiKey,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: API_KEYS_QUERY_KEY }),
  });
};

export const useRevokeApiKey = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: revokeApiKey,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: API_KEYS_QUERY_KEY }),
  });
};
