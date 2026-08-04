import { ROUTES_API } from "@/configs/api-routes.gen";
import { useGetQuery } from "@/domains/helpers";
import { jobsQueryKey } from "@/domains/jobs/constants";
import type { JobsFilters, RecurringJobStatus } from "@/domains/jobs/types";

export const useRecurringJobsQuery = (filters: JobsFilters = {}) =>
  useGetQuery<RecurringJobStatus[]>(
    ROUTES_API.api.jobs.__path,
    {},
    { queryKey: jobsQueryKey(filters), refetchOnMount: "always" },
    filters,
  );
