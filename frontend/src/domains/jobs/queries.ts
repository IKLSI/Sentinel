import { ROUTES_API } from "@/configs/api-routes.gen";
import { useGetQuery } from "@/domains/helpers";
import { JOBS_QUERY_KEY } from "@/domains/jobs/constants";
import type { RecurringJobStatus } from "@/domains/jobs/types";

export const useRecurringJobsQuery = () =>
  useGetQuery<RecurringJobStatus[]>(
    ROUTES_API.api.jobs.__path,
    {},
    { queryKey: JOBS_QUERY_KEY, refetchOnMount: "always" },
  );
