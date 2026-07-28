import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getRecurringJobs, triggerTechHealthScan } from "../api/jobs";

export const JOBS_QUERY_KEY = ["settings", "jobs"] as const;

export const useRecurringJobs = () => {
  const query = useQuery({
    queryKey: JOBS_QUERY_KEY,
    queryFn: ({ signal }) => getRecurringJobs(signal),
  });

  return {
    jobs: query.data ?? [],
    loading: query.isLoading,
  };
};

export const useTriggerTechHealthScan = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: triggerTechHealthScan,
    onSuccess: () => {
      setTimeout(
        () => queryClient.invalidateQueries({ queryKey: JOBS_QUERY_KEY }),
        1500,
      );
    },
  });
};
