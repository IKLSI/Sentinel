import type React from "react";
import InventoryOutlined from "@mui/icons-material/InventoryOutlined";
import { useMemo } from "react";
import { EmptyState } from "@/components/ui/common/feedback/EmptyState";
import { useT } from "@/contexts/I18nContext";
import type { Dependency } from "@/domains/projects/types";
import { useGridControls } from "@/hooks/useGridControls";
import { EMPTY_STATE_SX } from "@/features/projects/pages/ProjectDetailPage/constants";
import { buildDependencyFilterFields } from "@/features/projects/pages/ProjectDetailPage/filters";
import { FindingGrid } from "@/features/projects/pages/ProjectDetailPage/components/FindingGrid";
import { DependencyRow } from "@/features/projects/pages/ProjectDetailPage/components/DependenciesTab/components/DependencyRow";
import {
  DEFAULT_SORT,
  buildDependencyColumns,
  comparators,
  searchableValues,
} from "@/features/projects/pages/ProjectDetailPage/components/DependenciesTab/helpers";

interface Props {
  dependencies: Dependency[];
}

export const DependenciesTab: React.FC<Props> = ({ dependencies }) => {
  const t = useT();

  const fields = useMemo(
    () => buildDependencyFilterFields(t, dependencies),
    [t, dependencies],
  );

  const controls = useGridControls<Dependency>({
    rows: dependencies,
    searchableValues,
    fields,
    comparators,
    defaultSort: DEFAULT_SORT,
  });

  if (dependencies.length === 0) {
    return (
      <EmptyState
        icon={InventoryOutlined}
        title={t("tech_health.empty.no_deps_title")}
        subtitle={t("tech_health.empty.no_deps_subtitle")}
        sx={EMPTY_STATE_SX}
      />
    );
  }

  return (
    <FindingGrid<Dependency>
      controls={controls}
      fields={fields}
      columns={buildDependencyColumns(t)}
      getRowId={(dependency) => dependency.id}
      countKeys={{
        singular: "tech_health.count.deps_singular",
        plural: "tech_health.count.deps_plural",
      }}
      renderRow={(dependency, index) => (
        <DependencyRow
          key={dependency.id}
          dependency={dependency}
          index={index}
        />
      )}
    />
  );
};
