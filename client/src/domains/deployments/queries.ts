import { ROUTES_API } from "@/configs/api-routes.gen";
import { useGetQuery } from "@/domains/helpers";
import { deploymentKeys } from "@/domains/deployments/constants";
import type {
  ReleaseComparison,
  ReleaseRefs,
} from "@/domains/deployments/types";

export const useDeploymentRefsQuery = (projectId: string | undefined) =>
  useGetQuery<ReleaseRefs>(
    ROUTES_API.api.techHealth.projects[":id"].deployments.refs.__path,
    { id: projectId },
    {
      queryKey: deploymentKeys.refs(projectId ?? ""),
      enabled: !!projectId,
    },
  );

export const useDeploymentComparisonQuery = (
  projectId: string | undefined,
  base: string | undefined,
  head: string | undefined,
) =>
  useGetQuery<ReleaseComparison>(
    ROUTES_API.api.techHealth.projects[":id"].deployments.compare.__path,
    { id: projectId, base, head },
    {
      queryKey: deploymentKeys.comparison(
        projectId ?? "",
        base ?? "",
        head ?? "",
      ),
      enabled: !!projectId && !!base && !!head,
      retry: false,
    },
  );
