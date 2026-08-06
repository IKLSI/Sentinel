import type { JobsFilters } from "@/domains/jobs/types";

export const JOBS_QUERY_KEY = ["settings", "jobs"] as const;

export const jobsQueryKey = (filters: JobsFilters = {}) =>
  [...JOBS_QUERY_KEY, filters] as const;
