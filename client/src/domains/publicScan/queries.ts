import { ROUTES_API } from "@/configs/api-routes.gen";
import { useGetQuery } from "@/domains/helpers";
import { SCORING_MODEL_QUERY_KEY } from "@/domains/publicScan/constants";
import type { ScoringModel } from "@/domains/publicScan/types";

export const useScoringModelQuery = () =>
  useGetQuery<ScoringModel>(
    ROUTES_API.api.public.scoringModel.__path,
    {},
    { queryKey: SCORING_MODEL_QUERY_KEY, staleTime: Number.POSITIVE_INFINITY },
  );
