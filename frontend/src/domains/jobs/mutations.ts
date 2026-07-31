import { ROUTES_API } from "@/configs/api-routes.gen";
import type { ApiMessageResponse } from "@/domains/auth/types";
import { invalidateKeys, usePostMutation } from "@/domains/helpers";
import {
  JOBS_QUERY_KEY,
  JOBS_REFRESH_DELAY_MS,
} from "@/domains/jobs/constants";

export const useTriggerTechHealthScanMutation = () =>
  usePostMutation<
    ApiMessageResponse,
    ApiMessageResponse,
    Record<string, never>
  >(ROUTES_API.api.jobs.techHealthScan.trigger.__path, {
    onSuccess: () => {
      setTimeout(() => invalidateKeys([JOBS_QUERY_KEY]), JOBS_REFRESH_DELAY_MS);
    },
  });
