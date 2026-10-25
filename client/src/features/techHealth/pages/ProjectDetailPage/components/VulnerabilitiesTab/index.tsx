import type React from "react";
import { useMemo } from "react";
import CheckCircleOutlined from "@mui/icons-material/CheckCircleOutlined";
import { EmptyState } from "@/components/ui/common/EmptyState";
import { Pagination } from "@/components/ui/common/Pagination";
import {
  VirtualTable,
  type VirtualTableColumn,
} from "@/components/ui/common/VirtualTable";
import { useT } from "@/contexts/I18nContext";
import { useGridControls } from "@/hooks/useGridControls";
import { PAGE_SIZE_OPTIONS } from "@/hooks/usePagination";
import {
  EMPTY_STATE_SX,
  GRID_ROW_HEIGHT,
  riskConfigOf,
} from "@/features/techHealth/pages/ProjectDetailPage/helpers";
import {
  type VulnerabilityRow,
  buildGridFilterLabels,
  buildVulnerabilityFilterFields,
} from "@/features/techHealth/pages/ProjectDetailPage/filters";
import { GridToolbar } from "@/features/techHealth/pages/ProjectDetailPage/components/GridToolbar";
import { VulnRow } from "@/features/techHealth/pages/ProjectDetailPage/components/VulnRow";

const COLUMN_KEYS = {
  risk: "risk",
  library: "library",
  description: "description",
  cvss: "cvss",
  epss: "epss",
  reference: "reference",
  fixedVersion: "fixedVersion",
  ticket: "ticket",
  suppression: "suppression",
} as const;

const DEFAULT_SORT = { key: COLUMN_KEYS.risk, direction: "desc" } as const;

const comparators = {
  [COLUMN_KEYS.risk]: (a: VulnerabilityRow, b: VulnerabilityRow) =>
    riskConfigOf(a).weight - riskConfigOf(b).weight ||
    (a.epssScore ?? 0) - (b.epssScore ?? 0) ||
    a.cvssScore - b.cvssScore,
  [COLUMN_KEYS.library]: (a: VulnerabilityRow, b: VulnerabilityRow) =>
    a.dependencyName.localeCompare(b.dependencyName),
  [COLUMN_KEYS.description]: (a: VulnerabilityRow, b: VulnerabilityRow) =>
    a.description.localeCompare(b.description),
  [COLUMN_KEYS.cvss]: (a: VulnerabilityRow, b: VulnerabilityRow) =>
    a.cvssScore - b.cvssScore,
  [COLUMN_KEYS.epss]: (a: VulnerabilityRow, b: VulnerabilityRow) =>
    (a.epssScore ?? -1) - (b.epssScore ?? -1),
};

const searchableValues = (vuln: VulnerabilityRow) => [
  vuln.description,
  vuln.dependencyName,
  vuln.cveId,
  vuln.cveAlias,
];

interface Props {
  projectId: string;
  vulns: VulnerabilityRow[];
  toolbarAction?: React.ReactNode;
}

export const VulnerabilitiesTab: React.FC<Props> = ({
  projectId,
  vulns,
  toolbarAction,
}) => {
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
    pagedRows,
    pagination,
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
      key: COLUMN_KEYS.risk,
      label: t("tech_health.table.vuln.risk"),
      width: "15%",
      sortable: true,
    },
    {
      key: COLUMN_KEYS.library,
      label: t("tech_health.table.dep.library"),
      width: "14%",
      sortable: true,
    },
    {
      key: COLUMN_KEYS.description,
      label: t("tech_health.table.vuln.vulnerability"),
      width: "21%",
      sortable: true,
    },
    {
      key: COLUMN_KEYS.cvss,
      label: t("tech_health.table.vuln.cvss"),
      width: "6%",
      align: "center",
      sortable: true,
    },
    {
      key: COLUMN_KEYS.epss,
      label: t("tech_health.table.vuln.epss"),
      width: "6%",
      align: "center",
      sortable: true,
    },
    {
      key: COLUMN_KEYS.reference,
      label: t("tech_health.table.vuln.cve_ref"),
      width: "12%",
    },
    {
      key: COLUMN_KEYS.fixedVersion,
      label: t("tech_health.table.vuln.fixed_version"),
      width: "9%",
    },
    {
      key: COLUMN_KEYS.ticket,
      label: t("tech_health.table.ticket"),
      width: "9%",
      align: "center",
    },
    {
      key: COLUMN_KEYS.suppression,
      label: t("tech_health.table.vuln.exception"),
      width: "8%",
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
        action={toolbarAction}
      />

      <VirtualTable<VulnerabilityRow>
        rows={pagedRows}
        getRowId={(vuln) => vuln.id}
        columns={columns}
        estimateRowHeight={GRID_ROW_HEIGHT}
        sort={sort}
        onSortChange={toggleSort}
        noResultsLabel={t("tech_health.no_results")}
        footer={
          <Pagination
            page={pagination.page}
            totalPages={pagination.totalPages}
            total={visibleRows.length}
            onChange={pagination.setPage}
            pageSize={pagination.pageSize}
            pageSizeOptions={PAGE_SIZE_OPTIONS}
            onPageSizeChange={pagination.setPageSize}
            countLabel={t(
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
