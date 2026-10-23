import type { FilterCriterion } from "@/components/ui/forms/FilterBuilder/types";

const VALUE_SEPARATOR = ",";

const readValues = (raw: unknown): string[] => {
  if (typeof raw !== "string" || raw.length === 0) return [];

  const values = raw
    .split(VALUE_SEPARATOR)
    .map((value) => value.trim())
    .filter(Boolean);

  return [...new Set(values)];
};

export function createFilterSearchParams<TField extends string, TQuery>(
  fields: Readonly<Record<string, TField>>,
) {
  const fieldList = Object.values(fields);

  const criterionFromSearch = (
    search: Record<string, unknown>,
  ): FilterCriterion | null => {
    for (const field of fieldList) {
      const values = readValues(search[field]);

      if (values.length) return { field, values };
    }

    return null;
  };

  const searchFromCriterion = (
    criterion: FilterCriterion | null,
  ): Partial<Record<TField, string>> => {
    const search: Partial<Record<TField, string>> = {};

    for (const field of fieldList) {
      search[field] =
        criterion?.field === field && criterion.values.length
          ? criterion.values.join(VALUE_SEPARATOR)
          : undefined;
    }

    return search;
  };

  const sanitizeSearch = (
    search: Record<string, unknown>,
  ): Partial<Record<TField, string>> =>
    searchFromCriterion(criterionFromSearch(search));

  const queryFromCriterion = (criterion: FilterCriterion | null): TQuery =>
    (criterion?.values.length
      ? { [criterion.field]: criterion.values }
      : {}) as TQuery;

  return {
    criterionFromSearch,
    searchFromCriterion,
    sanitizeSearch,
    queryFromCriterion,
  };
}
