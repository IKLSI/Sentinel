import { ROUTES_API } from "@/configs/api-routes.gen";
import { useGetQuery } from "@/domains/helpers";
import { API_KEYS_QUERY_KEY } from "@/domains/apiKeys/constants";
import type { ApiKey } from "@/domains/apiKeys/types";

export const useApiKeysQuery = () =>
  useGetQuery<ApiKey[]>(
    ROUTES_API.api.settings.apiKeys.__path,
    {},
    { queryKey: API_KEYS_QUERY_KEY },
  );
