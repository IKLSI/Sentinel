import { ROUTES_API } from "@/configs/api-routes.gen";
import { useGetQuery } from "@/domains/helpers";
import {
  RUNTIME_LIFECYCLES_QUERY_KEY,
  SCORING_MODEL_QUERY_KEY,
} from "@/domains/publicScan/constants";
import type {
  RuntimeLifecycles,
  ScoringModel,
} from "@/domains/publicScan/types";

export const useScoringModelQuery = () =>
  useGetQuery<ScoringModel>(
    ROUTES_API.api.public.scoringModel.__path,
    {},
    { queryKey: SCORING_MODEL_QUERY_KEY, staleTime: Number.POSITIVE_INFINITY },
  );

export const useRuntimeLifecyclesQuery = () =>
  useGetQuery<RuntimeLifecycles>(
    ROUTES_API.api.public.runtimeLifecycles.__path,
    {},
    { queryKey: RUNTIME_LIFECYCLES_QUERY_KEY },
  );
