import type { UsersFilters } from "@/domains/users/types";

export const USERS_QUERY_KEY = "users";

export const GDPR_EXPORT_FALLBACK_FILE = "sentinel-export.zip";

export const usersQueryKey = (filters: UsersFilters = {}) =>
  [USERS_QUERY_KEY, filters] as const;

export const userOptionsQueryKey = [USERS_QUERY_KEY, "options"] as const;
