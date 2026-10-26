import type React from "react";
import { memo, useMemo } from "react";
import Box from "@mui/material/Box";
import InventoryOutlined from "@mui/icons-material/InventoryOutlined";
import { EmptyState } from "@/components/ui/common/EmptyState";
import { StatusChip } from "@/components/ui/common/StatusChip";
import { TruncatedText } from "@/components/ui/common/TruncatedText";
import { TD, TR } from "@/components/ui/common/VirtualTable/TableCells";
import type { VirtualTableColumn } from "@/components/ui/common/VirtualTable";
import { AppTooltip } from "@/components/ui/common/AppTooltip";
import { useT } from "@/contexts/I18nContext";
import type { Dependency } from "@/domains/projects/types";
import { FindingKind } from "@/enums";
import { useGridControls } from "@/hooks/useGridControls";
import {
  DEP_STATUS,
  EMPTY_STATE_SX,
} from "@/features/techHealth/pages/ProjectDetailPage/helpers";
import {
  DEPENDENCY_TYPE_PROD,
  buildDependencyFilterFields,
} from "@/features/techHealth/pages/ProjectDetailPage/filters";
import { FindingGrid } from "@/features/techHealth/pages/ProjectDetailPage/components/FindingGrid";
import { FindingTicketCell } from "@/features/techHealth/pages/ProjectDetailPage/components/FindingTicketCell";
import { NO_VALUE } from "@/constants/display";

const COLUMN_KEYS = {
  library: "library",
  ecosystem: "ecosystem",
  type: "type",
  relation: "relation",
  version: "version",
  status: "status",
  vulns: "vulns",
  ticket: "ticket",
} as const;

const DEFAULT_SORT = { key: COLUMN_KEYS.vulns, direction: "desc" } as const;

const statusOf = (dependency: Dependency) =>
  DEP_STATUS[dependency.status] ?? DEP_STATUS.UpToDate;

const comparators = {
  [COLUMN_KEYS.library]: (a: Dependency, b: Dependency) =>
    a.name.localeCompare(b.name),
  [COLUMN_KEYS.ecosystem]: (a: Dependency, b: Dependency) =>
    a.ecosystem.localeCompare(b.ecosystem),
  [COLUMN_KEYS.type]: (a: Dependency, b: Dependency) =>
    a.type.localeCompare(b.type),
  [COLUMN_KEYS.relation]: (a: Dependency, b: Dependency) =>
    Number(b.isDirect) - Number(a.isDirect),
  [COLUMN_KEYS.status]: (a: Dependency, b: Dependency) =>
    statusOf(a).weight - statusOf(b).weight,
  [COLUMN_KEYS.vulns]: (a: Dependency, b: Dependency) =>
    a.vulnerabilities.length - b.vulnerabilities.length ||
    statusOf(a).weight - statusOf(b).weight,
};

const searchableValues = (dependency: Dependency) => [
  dependency.name,
  dependency.manifestPath ?? "",
];

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

const manifestPathSx = {
  fontFamily: "var(--font-mono)",
  fontSize: "10px",
  color: "var(--muted)",
  minWidth: 0,
} as const;

const mutedSx = { color: "var(--muted)" } as const;

interface RowProps {
  dependency: Dependency;
  index: number;
}

const DependencyRow = memo<RowProps>(({ dependency, index }) => {
  const t = useT();
  const status = statusOf(dependency);
  const vulnCount = dependency.vulnerabilities.length;

  return (
    <TR index={index}>
      <TD>
        <TruncatedText mono strong text={dependency.name} />
        {dependency.manifestPath && (
          <Box sx={manifestPathSx}>
            <TruncatedText text={dependency.manifestPath} />
          </Box>
        )}
      </TD>
      <TD>
        <Box component="span" sx={ecosystemSx}>
          {dependency.ecosystem}
        </Box>
      </TD>
      <TD>
        <StatusChip variant="gray">
          {t(
            dependency.type === DEPENDENCY_TYPE_PROD
              ? "tech_health.dep.type_prod"
              : "tech_health.dep.type_dev",
          )}
        </StatusChip>
      </TD>
      <TD>
        <StatusChip variant="gray">
          {t(
            dependency.isDirect
              ? "tech_health.dep.relation_direct"
              : "tech_health.dep.relation_transitive",
          )}
        </StatusChip>
      </TD>
      <TD muted>
        <Box sx={versionSx}>
          {dependency.isVersionPinned ? (
            <span>{dependency.currentVersion}</span>
          ) : (
            <AppTooltip title={t("tech_health.version.range_hint")}>
              <span>{`≥ ${dependency.currentVersion}`}</span>
            </AppTooltip>
          )}
          {dependency.latestVersion &&
            dependency.latestVersion !== dependency.currentVersion && (
              <>
                <Box component="span" sx={mutedSx}>
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
        <StatusChip variant={status.variant}>{t(status.labelKey)}</StatusChip>
      </TD>
      <TD align="center">
        {vulnCount > 0 ? (
          <Box component="span" sx={vulnCountSx}>
            {vulnCount}
          </Box>
        ) : (
          <Box component="span" sx={mutedSx}>
            {NO_VALUE}
          </Box>
        )}
      </TD>
      <TD align="center">
        <FindingTicketCell
          kind={FindingKind.OutdatedDependency}
          findingKey={dependency.findingKey}
          linkedTicket={dependency.linkedTicket}
          actionable={dependency.isOutdated}
        />
      </TD>
    </TR>
  );
});
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
        iconSize={40}
        sx={EMPTY_STATE_SX}
      />
    );
  }

  const columns: VirtualTableColumn[] = [
    {
      key: COLUMN_KEYS.library,
      label: t("tech_health.table.dep.library"),
      width: "21%",
      sortable: true,
    },
    {
      key: COLUMN_KEYS.ecosystem,
      label: t("tech_health.table.dep.ecosystem"),
      width: "10%",
      sortable: true,
    },
    {
      key: COLUMN_KEYS.type,
      label: t("tech_health.table.dep.type"),
      width: "8%",
      sortable: true,
    },
    {
      key: COLUMN_KEYS.relation,
      label: t("tech_health.table.dep.relation"),
      width: "10%",
      sortable: true,
    },
    {
      key: COLUMN_KEYS.version,
      label: t("tech_health.table.dep.version"),
      width: "17%",
    },
    {
      key: COLUMN_KEYS.status,
      label: t("tech_health.table.dep.status"),
      width: "14%",
      sortable: true,
    },
    {
      key: COLUMN_KEYS.vulns,
      label: t("tech_health.table.dep.vulns"),
      width: "9%",
      align: "center",
      sortable: true,
    },
    {
      key: COLUMN_KEYS.ticket,
      label: t("tech_health.table.ticket"),
      width: "11%",
      align: "center",
    },
  ];

  return (
    <FindingGrid<Dependency>
      controls={controls}
      fields={fields}
      columns={columns}
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
