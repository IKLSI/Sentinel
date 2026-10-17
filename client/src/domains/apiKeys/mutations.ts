import { ROUTES_API } from "@/configs/api-routes.gen";
import { useDeleteMutation, usePostMutation } from "@/domains/helpers";
import type { CreateApiKey, CreatedApiKey } from "@/domains/apiKeys/types";

export const useCreateApiKeyMutation = () =>
  usePostMutation<CreatedApiKey, CreatedApiKey, { data: CreateApiKey }>(
    ROUTES_API.api.settings.apiKeys.__path,
  );

export const useRevokeApiKeyMutation = () =>
  useDeleteMutation<void, void, { id: string }>(
    ROUTES_API.api.settings.apiKeys[":id"].__path,
  );
