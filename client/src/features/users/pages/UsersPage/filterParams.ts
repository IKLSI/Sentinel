import { createFilterSearchParams } from "@/components/ui/forms/FilterBuilder/searchParams";
import type { UserCriteriaFilters } from "@/domains/users/types";

export const USER_FILTER_FIELDS = {
  role: "role",
  status: "status",
} as const;

type UserFilterField =
  (typeof USER_FILTER_FIELDS)[keyof typeof USER_FILTER_FIELDS];

export type UserFiltersSearch = Partial<Record<UserFilterField, string>>;

export const {
  criterionFromSearch,
  searchFromCriterion,
  sanitizeSearch: sanitizeUserFiltersSearch,
  queryFromCriterion,
} = createFilterSearchParams<UserFilterField, UserCriteriaFilters>(
  USER_FILTER_FIELDS,
);
