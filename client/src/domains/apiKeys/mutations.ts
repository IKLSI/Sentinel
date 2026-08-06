import { ROUTES_API } from "@/configs/api-routes.gen";
import {
  invalidateKeys,
  useDeleteMutation,
  usePostMutation,
} from "@/domains/helpers";
import { API_KEYS_QUERY_KEY } from "@/domains/apiKeys/constants";
import type { CreateApiKey, CreatedApiKey } from "@/domains/apiKeys/types";

const invalidateApiKeys = () => invalidateKeys([API_KEYS_QUERY_KEY]);

export const useCreateApiKeyMutation = () =>
  usePostMutation<CreatedApiKey, CreatedApiKey, { data: CreateApiKey }>(
    ROUTES_API.api.settings.apiKeys.__path,
    { onSuccess: invalidateApiKeys },
  );

export const useRevokeApiKeyMutation = () =>
  useDeleteMutation<void, void, { id: string }>(
    ROUTES_API.api.settings.apiKeys[":id"].__path,
    { onSuccess: invalidateApiKeys },
  );
