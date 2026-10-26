import type React from "react";
import { useMemo } from "react";
import { ListSkeleton } from "@/components/ui/common/ListSkeleton";
import { LoadingRegion } from "@/components/ui/common/LoadingRegion";
import { useT } from "@/contexts/I18nContext";
import { useDependenciesWithoutVulnerabilitiesQuery } from "@/domains/projects/queries";
import type { Dependency } from "@/domains/projects/types";
import { DependenciesTab } from "@/features/techHealth/pages/ProjectDetailPage/components/DependenciesTab";
import { useQueryErrorToast } from "@/hooks/useQueryErrorToast";

interface Props {
  projectId: string;
  vulnerableDependencies: Dependency[];
}

export const ProjectDependencies: React.FC<Props> = ({
  projectId,
  vulnerableDependencies,
}) => {
  const t = useT();
  const { data: otherDependencies, isError } =
    useDependenciesWithoutVulnerabilitiesQuery(projectId);
  const dependencies = useMemo(() => {
    if (!otherDependencies) return undefined;
    const vulnerableIds = new Set(vulnerableDependencies.map(({ id }) => id));
    return [
      ...vulnerableDependencies,
      ...otherDependencies.filter(({ id }) => !vulnerableIds.has(id)),
    ];
  }, [vulnerableDependencies, otherDependencies]);

  useQueryErrorToast(isError, "tech_health.error.load_failed");

  if (!dependencies)
    return (
      <LoadingRegion label={t("tech_health.dependencies.loading")}>
        <ListSkeleton rows={8} />
      </LoadingRegion>
    );

  return <DependenciesTab dependencies={dependencies} />;
};
