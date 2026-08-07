import type React from "react";
import { memo, useMemo } from "react";
import Box from "@mui/material/Box";
import InventoryOutlined from "@mui/icons-material/InventoryOutlined";
import { EmptyState } from "@/components/ui/common/EmptyState";
import { GridFooter } from "@/components/ui/common/GridFooter";
import { StatusChip } from "@/components/ui/common/StatusChip";
import { TruncatedText } from "@/components/ui/common/TruncatedText";
import { TD, TR } from "@/components/ui/common/VirtualTable/TableCells";
import {
  VirtualTable,
  type VirtualTableColumn,
} from "@/components/ui/common/VirtualTable";
import { useT } from "@/contexts/I18nContext";
import type { Dependency } from "@/domains/projects/types";
import type { DependencyStatus } from "@/enums";
import { useGridControls } from "@/hooks/useGridControls";
import {
  DEP_STATUS,
  EMPTY_STATE_SX,
  GRID_ROW_HEIGHT,
} from "@/features/techHealth/pages/ProjectDetailPage/helpers";
import {
  DEPENDENCY_TYPE_PROD,
  buildDependencyFilterFields,
  buildGridFilterLabels,
} from "@/features/techHealth/pages/ProjectDetailPage/filters";
import { GridToolbar } from "@/features/techHealth/pages/ProjectDetailPage/components/GridToolbar";

const COLUMN_KEYS = {
  library: "library",
  ecosystem: "ecosystem",
  type: "type",
  version: "version",
  status: "status",
  vulns: "vulns",
} as const;

const DEFAULT_SORT = { key: COLUMN_KEYS.vulns, direction: "desc" } as const;

const statusOf = (dependency: Dependency) =>
  DEP_STATUS[dependency.status as DependencyStatus] ?? DEP_STATUS.UpToDate;

const comparators = {
  [COLUMN_KEYS.library]: (a: Dependency, b: Dependency) =>
    a.name.localeCompare(b.name),
  [COLUMN_KEYS.ecosystem]: (a: Dependency, b: Dependency) =>
    a.ecosystem.localeCompare(b.ecosystem),
  [COLUMN_KEYS.type]: (a: Dependency, b: Dependency) =>
    a.type.localeCompare(b.type),
  [COLUMN_KEYS.status]: (a: Dependency, b: Dependency) =>
    statusOf(a).weight - statusOf(b).weight,
  [COLUMN_KEYS.vulns]: (a: Dependency, b: Dependency) =>
    a.vulnerabilities.length - b.vulnerabilities.length ||
    statusOf(a).weight - statusOf(b).weight,
};

const searchableValues = (dependency: Dependency) => [dependency.name];

const ecosystemSx = {
  fontFamily: "var(--font-mono)",
  fontSize: "11px",
  color: "var(--muted2)",
  background: "var(--s3)",
  px: "7px",
  py: "2px",
  borderRadius: "var(--r-xs)",
} as const;

const versionSx = {
  display: "flex",
  alignItems: "center",
  gap: "6px",
  fontFamily: "var(--font-mono)",
  fontSize: "11px",
} as const;

const latestVersionSx = { color: "var(--orange)", fontWeight: 600 } as const;

const vulnCountSx = {
  fontFamily: "var(--font-mono)",
  fontSize: "11px",
  fontWeight: 700,
  color: "var(--red)",
} as const;

const NO_VALUE = "—";

interface RowProps {
  dependency: Dependency;
  typeProd: string;
  typeDev: string;
  index: number;
}

const DependencyRow = memo<RowProps>(
  ({ dependency, typeProd, typeDev, index }) => {
    const t = useT();
    const status = statusOf(dependency);
    const vulnCount = dependency.vulnerabilities.length;

    return (
      <TR index={index}>
        <TD>
          <TruncatedText mono strong text={dependency.name} />
        </TD>
        <TD>
          <Box component="span" sx={ecosystemSx}>
            {dependency.ecosystem}
          </Box>
        </TD>
        <TD>
          <StatusChip variant="gray">
            {dependency.type === DEPENDENCY_TYPE_PROD ? typeProd : typeDev}
          </StatusChip>
        </TD>
        <TD muted>
          <Box sx={versionSx}>
            <span>{dependency.currentVersion}</span>
            {dependency.latestVersion &&
              dependency.latestVersion !== dependency.currentVersion && (
                <>
                  <Box component="span" sx={{ color: "var(--muted)" }}>
                    →
                  </Box>
                  <Box component="span" sx={latestVersionSx}>
                    {dependency.latestVersion}
                  </Box>
                </>
              )}
          </Box>
        </TD>
        <TD>
          <StatusChip variant="gray">{t(status.labelKey)}</StatusChip>
        </TD>
        <TD align="center">
          {vulnCount > 0 ? (
            <Box component="span" sx={vulnCountSx}>
              {vulnCount}
            </Box>
          ) : (
            <Box component="span" sx={{ color: "var(--muted)" }}>
              {NO_VALUE}
            </Box>
          )}
        </TD>
      </TR>
    );
  },
);
DependencyRow.displayName = "DependencyRow";

interface Props {
  dependencies: Dependency[];
}

export const DependenciesTab: React.FC<Props> = ({ dependencies }) => {
  const t = useT();

  const fields = useMemo(
    () => buildDependencyFilterFields(t, dependencies),
    [t, dependencies],
  );

  const {
    search,
    setSearch,
    criterion,
    setCriterion,
    sort,
    toggleSort,
    visibleRows,
  } = useGridControls<Dependency>({
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
        iconSize={40}
        sx={EMPTY_STATE_SX}
      />
    );
  }

  const columns: VirtualTableColumn[] = [
    {
      key: COLUMN_KEYS.library,
      label: t("tech_health.table.dep.library"),
      width: "28%",
      sortable: true,
    },
    {
      key: COLUMN_KEYS.ecosystem,
      label: t("tech_health.table.dep.ecosystem"),
      width: "12%",
      sortable: true,
    },
    {
      key: COLUMN_KEYS.type,
      label: t("tech_health.table.dep.type"),
      width: "10%",
      sortable: true,
    },
    {
      key: COLUMN_KEYS.version,
      label: t("tech_health.table.dep.version"),
      width: "20%",
    },
    {
      key: COLUMN_KEYS.status,
      label: t("tech_health.table.dep.status"),
      width: "18%",
      sortable: true,
    },
    {
      key: COLUMN_KEYS.vulns,
      label: t("tech_health.table.dep.vulns"),
      width: "12%",
      align: "center",
      sortable: true,
    },
  ];

  return (
    <>
      <GridToolbar
        search={search}
        onSearchChange={setSearch}
        criterion={criterion}
        onCriterionChange={setCriterion}
        fields={fields}
        labels={buildGridFilterLabels(t)}
      />

      <VirtualTable<Dependency>
        rows={visibleRows}
        getRowId={(dependency) => dependency.id}
        columns={columns}
        estimateRowHeight={GRID_ROW_HEIGHT}
        sort={sort}
        onSortChange={toggleSort}
        noResultsLabel={t("tech_health.no_results")}
        footer={
          <GridFooter
            total={visibleRows.length}
            label={t(
              visibleRows.length > 1
                ? "tech_health.count.deps_plural"
                : "tech_health.count.deps_singular",
            )}
          />
        }
        renderRow={(dependency, index) => (
          <DependencyRow
            key={dependency.id}
            dependency={dependency}
            typeProd={t("tech_health.dep.type_prod")}
            typeDev={t("tech_health.dep.type_dev")}
            index={index}
          />
        )}
      />
    </>
  );
};
