import type { FilterCriterion } from "@/components/ui/forms/FilterBuilder/types";
import type { TicketCriteriaFilters } from "@/domains/tickets/types";

export const TICKET_FILTER_FIELDS = {
  priority: "priority",
  status: "status",
  type: "type",
  assignedTo: "assignedTo",
  project: "project",
} as const;

export const UNSET_FILTER_VALUE = "none";

type TicketFilterField =
  (typeof TICKET_FILTER_FIELDS)[keyof typeof TICKET_FILTER_FIELDS];

export type TicketFiltersSearch = Partial<Record<TicketFilterField, string>>;

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
  for (const field of Object.values(TICKET_FILTER_FIELDS)) {
    const values = readValues(search[field]);

    if (values.length) return { field, values };
  }

  return null;
};

export const searchFromCriterion = (
  criterion: FilterCriterion | null,
): TicketFiltersSearch => {
  const search: TicketFiltersSearch = {};

  for (const field of Object.values(TICKET_FILTER_FIELDS)) {
    search[field] =
      criterion?.field === field && criterion.values.length
        ? criterion.values.join(VALUE_SEPARATOR)
        : undefined;
  }

  return search;
};

export const sanitizeTicketFiltersSearch = (
  search: Record<string, unknown>,
): TicketFiltersSearch => searchFromCriterion(criterionFromSearch(search));

export const queryFromCriterion = (
  criterion: FilterCriterion | null,
): TicketCriteriaFilters =>
  criterion?.values.length
    ? { [criterion.field as TicketFilterField]: criterion.values }
    : {};
