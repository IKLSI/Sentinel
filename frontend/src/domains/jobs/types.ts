import type { components } from "@/types/api.gen";
import type { JobSortField, SortDirection } from "@/enums";

export type RecurringJobStatus = components["schemas"]["RecurringJobStatusDto"];

export type JobsFilters = {
  sortBy?: JobSortField;
  sortDirection?: SortDirection;
};
