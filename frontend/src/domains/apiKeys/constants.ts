import type { ApiKeysFilters } from "@/domains/apiKeys/types";

export const API_KEYS_QUERY_KEY = ["settings", "apiKeys"] as const;

export const apiKeysQueryKey = (filters: ApiKeysFilters = {}) =>
  [...API_KEYS_QUERY_KEY, filters] as const;
