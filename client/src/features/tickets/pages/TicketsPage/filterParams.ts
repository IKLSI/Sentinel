import { createFilterSearchParams } from "@/components/ui/forms/FilterBuilder/searchParams";
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

export const {
  criterionFromSearch,
  searchFromCriterion,
  sanitizeSearch: sanitizeTicketFiltersSearch,
  queryFromCriterion,
} = createFilterSearchParams<TicketFilterField, TicketCriteriaFilters>(
  TICKET_FILTER_FIELDS,
);
