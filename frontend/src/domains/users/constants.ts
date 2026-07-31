import type { UsersFilters } from "@/domains/users/types";

export const USERS_QUERY_KEY = "users";

export const usersQueryKey = (filters: UsersFilters = {}) =>
  [USERS_QUERY_KEY, filters] as const;
