import type { FilterCriterion } from "@/components/ui/forms/FilterBuilder/types";
import type { UserCriteriaFilters } from "@/domains/users/types";

export const USER_FILTER_FIELDS = {
  role: "role",
  status: "status",
} as const;

type UserFilterField =
  (typeof USER_FILTER_FIELDS)[keyof typeof USER_FILTER_FIELDS];

export type UserFiltersSearch = Partial<Record<UserFilterField, string>>;

const VALUE_SEPARATOR = ",";

const readValues = (raw: unknown): string[] => {
  if (typeof raw !== "string" || raw.length === 0) return [];

  const values = raw
    .split(VALUE_SEPARATOR)
    .map((value) => value.trim())
    .filter(Boolean);

  return [...new Set(values)];
};

export const criterionFromSearch = (
  search: Record<string, unknown>,
): FilterCriterion | null => {
  for (const field of Object.values(USER_FILTER_FIELDS)) {
    const values = readValues(search[field]);

    if (values.length) return { field, values };
  }

  return null;
};

export const searchFromCriterion = (
  criterion: FilterCriterion | null,
): UserFiltersSearch => {
  const search: UserFiltersSearch = {};

  for (const field of Object.values(USER_FILTER_FIELDS)) {
    search[field] =
      criterion?.field === field && criterion.values.length
        ? criterion.values.join(VALUE_SEPARATOR)
        : undefined;
  }

  return search;
};

export const sanitizeUserFiltersSearch = (
  search: Record<string, unknown>,
): UserFiltersSearch => searchFromCriterion(criterionFromSearch(search));

export const queryFromCriterion = (
  criterion: FilterCriterion | null,
): UserCriteriaFilters =>
  criterion?.values.length
    ? { [criterion.field as UserFilterField]: criterion.values }
    : {};
