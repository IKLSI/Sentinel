import type React from "react";
import StorageOutlined from "@mui/icons-material/StorageOutlined";
import { useMemo } from "react";
import { EmptyState } from "@/components/ui/common/feedback/EmptyState";
import { useI18n } from "@/contexts/I18nContext";
import type { Runtime } from "@/domains/projects/types";
import { useGridControls } from "@/hooks/useGridControls";
import { EMPTY_STATE_SX } from "@/features/projects/pages/ProjectDetailPage/constants";
import { buildRuntimeFilterFields } from "@/features/projects/pages/ProjectDetailPage/filters";
import { FindingGrid } from "@/features/projects/pages/ProjectDetailPage/components/FindingGrid";
import { RuntimeRow } from "@/features/projects/pages/ProjectDetailPage/components/RuntimesTab/components/RuntimeRow";
import {
  DEFAULT_SORT,
  buildRuntimeColumns,
  comparators,
  searchableValues,
} from "@/features/projects/pages/ProjectDetailPage/components/RuntimesTab/helpers";

interface Props {
  runtimes: Runtime[];
}

export const RuntimesTab: React.FC<Props> = ({ runtimes }) => {
  const { t, culture } = useI18n();

  const fields = useMemo(() => buildRuntimeFilterFields(t), [t]);

  const controls = useGridControls<Runtime>({
    rows: runtimes,
    searchableValues,
    fields,
    comparators,
    defaultSort: DEFAULT_SORT,
  });

  if (runtimes.length === 0) {
    return (
      <EmptyState
        icon={StorageOutlined}
        title={t("tech_health.empty.no_runtimes_title")}
        subtitle={t("tech_health.empty.no_runtimes_subtitle")}
        sx={EMPTY_STATE_SX}
      />
    );
  }

  return (
    <FindingGrid<Runtime>
      controls={controls}
      fields={fields}
      columns={buildRuntimeColumns(t)}
      getRowId={(runtime) => runtime.id}
      countKeys={{
        singular: "tech_health.count.runtimes_singular",
        plural: "tech_health.count.runtimes_plural",
      }}
      renderRow={(runtime, index) => (
        <RuntimeRow
          key={runtime.id}
          runtime={runtime}
          index={index}
          locale={culture}
        />
      )}
    />
  );
};
