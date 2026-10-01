import type React from "react";
import { memo, useMemo } from "react";
import Box from "@mui/material/Box";
import CheckCircleOutlined from "@mui/icons-material/CheckCircleOutlined";
import { AppTooltip } from "@/components/ui/common/AppTooltip";
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
import { FindingKind, type VulnerabilitySeverity } from "@/enums";
import { useGridControls } from "@/hooks/useGridControls";
import {
  EMPTY_STATE_SX,
  GRID_ROW_HEIGHT,
  SEV_CONFIG,
} from "@/features/techHealth/pages/ProjectDetailPage/helpers";
import {
  type VulnerabilityRow,
  buildGridFilterLabels,
  buildVulnerabilityFilterFields,
} from "@/features/techHealth/pages/ProjectDetailPage/filters";
import { GridToolbar } from "@/features/techHealth/pages/ProjectDetailPage/components/GridToolbar";
import { FindingTicketCell } from "@/features/techHealth/pages/ProjectDetailPage/components/FindingTicketCell";

const COLUMN_KEYS = {
  score: "score",
  severity: "severity",
  library: "library",
  description: "description",
  reference: "reference",
  fixedVersion: "fixedVersion",
  ticket: "ticket",
} as const;

const DEFAULT_SORT = { key: COLUMN_KEYS.score, direction: "desc" } as const;

const configOf = (vuln: VulnerabilityRow) =>
  SEV_CONFIG[vuln.severity as VulnerabilitySeverity] ?? SEV_CONFIG.Low;

const comparators = {
  [COLUMN_KEYS.score]: (a: VulnerabilityRow, b: VulnerabilityRow) =>
    a.cvssScore - b.cvssScore,
  [COLUMN_KEYS.severity]: (a: VulnerabilityRow, b: VulnerabilityRow) =>
    configOf(a).weight - configOf(b).weight,
  [COLUMN_KEYS.library]: (a: VulnerabilityRow, b: VulnerabilityRow) =>
    a.dependencyName.localeCompare(b.dependencyName),
  [COLUMN_KEYS.description]: (a: VulnerabilityRow, b: VulnerabilityRow) =>
    a.description.localeCompare(b.description),
};

const searchableValues = (vuln: VulnerabilityRow) => [
  vuln.description,
  vuln.dependencyName,
  vuln.cveId,
  vuln.cveAlias,
];

const scoreSx = {
  fontFamily: "var(--font-mono)",
  fontSize: "13px",
  fontWeight: 700,
} as const;

const referenceSx = {
  fontFamily: "var(--font-mono)",
  fontSize: "10px",
  color: "var(--cyan)",
  background: "var(--cyan-subtle)",
  px: "7px",
  py: "3px",
  borderRadius: "var(--r-xs)",
} as const;

const NO_VALUE = "—";

const VulnRow = memo<{
  vuln: VulnerabilityRow;
  projectId: string;
  index: number;
}>(({ vuln, projectId, index }) => {
  const t = useT();
  const config = configOf(vuln);

  return (
    <TR index={index}>
      <TD>
        <Box component="span" sx={{ ...scoreSx, color: config.color }}>
          {vuln.cvssScore > 0 ? vuln.cvssScore.toFixed(1) : NO_VALUE}
        </Box>
      </TD>
      <TD>
        <StatusChip variant={config.variant}>{t(config.labelKey)}</StatusChip>
      </TD>
      <TD>
        <TruncatedText mono strong text={vuln.dependencyName} />
      </TD>
      <TD>
        <TruncatedText text={vuln.description} />
      </TD>
      <TD>
        <AppTooltip title={vuln.cveAlias ? vuln.cveId : ""}>
          <Box component="span" sx={referenceSx}>
            {vuln.cveAlias ?? vuln.cveId}
          </Box>
        </AppTooltip>
      </TD>
      <TD mono muted>
        {vuln.fixedVersion ?? NO_VALUE}
      </TD>
      <TD align="center">
        <FindingTicketCell
          projectId={projectId}
          kind={FindingKind.Vulnerability}
          findingKey={vuln.findingKey}
          linkedTicket={vuln.linkedTicket}
          actionable
        />
      </TD>
    </TR>
  );
});
VulnRow.displayName = "VulnRow";

interface Props {
  projectId: string;
  vulns: VulnerabilityRow[];
}

export const VulnerabilitiesTab: React.FC<Props> = ({ projectId, vulns }) => {
  const t = useT();

  const fields = useMemo(
    () => buildVulnerabilityFilterFields(t, vulns),
    [t, vulns],
  );

  const {
    search,
    setSearch,
    criterion,
    setCriterion,
    sort,
    toggleSort,
    visibleRows,
  } = useGridControls<VulnerabilityRow>({
    rows: vulns,
    searchableValues,
    fields,
    comparators,
    defaultSort: DEFAULT_SORT,
  });

  if (vulns.length === 0) {
    return (
      <EmptyState
        icon={CheckCircleOutlined}
        title={t("tech_health.empty.no_vulns_title")}
        subtitle={t("tech_health.empty.no_vulns_subtitle")}
        iconSize={40}
        sx={EMPTY_STATE_SX}
      />
    );
  }

  const columns: VirtualTableColumn[] = [
    {
      key: COLUMN_KEYS.score,
      label: t("tech_health.table.vuln.score"),
      width: "7%",
      sortable: true,
    },
    {
      key: COLUMN_KEYS.severity,
      label: t("tech_health.filter.severity"),
      width: "12%",
      sortable: true,
    },
    {
      key: COLUMN_KEYS.library,
      label: t("tech_health.table.dep.library"),
      width: "17%",
      sortable: true,
    },
    {
      key: COLUMN_KEYS.description,
      label: t("tech_health.table.vuln.vulnerability"),
      width: "30%",
      sortable: true,
    },
    {
      key: COLUMN_KEYS.reference,
      label: t("tech_health.table.vuln.cve_ref"),
      width: "13%",
    },
    {
      key: COLUMN_KEYS.fixedVersion,
      label: t("tech_health.table.vuln.fixed_version"),
      width: "11%",
    },
    {
      key: COLUMN_KEYS.ticket,
      label: t("tech_health.table.ticket"),
      width: "10%",
      align: "center",
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

      <VirtualTable<VulnerabilityRow>
        rows={visibleRows}
        getRowId={(vuln) => vuln.id}
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
                ? "tech_health.count.vulns_plural"
                : "tech_health.count.vulns_singular",
            )}
          />
        }
        renderRow={(vuln, index) => (
          <VulnRow
            key={vuln.id}
            vuln={vuln}
            projectId={projectId}
            index={index}
          />
        )}
      />
    </>
  );
};
