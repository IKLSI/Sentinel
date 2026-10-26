import { keepPreviousData } from "@tanstack/react-query";
import { ROUTES_API } from "@/configs/api-routes.gen";
import { useGetQuery } from "@/domains/helpers";
import { apiKeysQueryKey } from "@/domains/apiKeys/constants";
import type { ApiKey, ApiKeysFilters } from "@/domains/apiKeys/types";

export const useApiKeysQuery = (filters: ApiKeysFilters = {}) =>
  useGetQuery<ApiKey[]>(
    ROUTES_API.api.settings.apiKeys.__path,
    {},
    {
      queryKey: apiKeysQueryKey(filters),
      placeholderData: keepPreviousData,
    },
    filters,
  );
