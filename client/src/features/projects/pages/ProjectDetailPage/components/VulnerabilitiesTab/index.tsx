import type React from "react";
import TaskAltOutlined from "@mui/icons-material/TaskAltOutlined";
import { useMemo } from "react";
import { EmptyState } from "@/components/ui/common/feedback/EmptyState";
import type { VirtualTableColumn } from "@/components/ui/common/table/VirtualTable";
import { useT } from "@/contexts/I18nContext";
import { useGridControls } from "@/hooks/useGridControls";
import { EMPTY_STATE_SX } from "@/features/projects/pages/ProjectDetailPage/constants";
import { riskConfigOf } from "@/features/projects/pages/ProjectDetailPage/helpers";
import {
  type VulnerabilityRow,
  buildVulnerabilityFilterFields,
} from "@/features/projects/pages/ProjectDetailPage/filters";
import { FindingGrid } from "@/features/projects/pages/ProjectDetailPage/components/FindingGrid";
import { VulnRow } from "@/features/projects/pages/ProjectDetailPage/components/VulnerabilitiesTab/components/VulnRow";

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
  vulns: VulnerabilityRow[];
  toolbarAction?: React.ReactNode;
}

export const VulnerabilitiesTab: React.FC<Props> = ({
  vulns,
  toolbarAction,
}) => {
  const t = useT();

  const fields = useMemo(
    () => buildVulnerabilityFilterFields(t, vulns),
    [t, vulns],
  );

  const controls = useGridControls<VulnerabilityRow>({
    rows: vulns,
    searchableValues,
    fields,
    comparators,
    defaultSort: DEFAULT_SORT,
  });

  if (vulns.length === 0) {
    return (
      <EmptyState
        icon={TaskAltOutlined}
        tone="success"
        title={t("tech_health.empty.no_vulns_title")}
        subtitle={t("tech_health.empty.no_vulns_subtitle")}
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
    <FindingGrid<VulnerabilityRow>
      controls={controls}
      fields={fields}
      columns={columns}
      getRowId={(vuln) => vuln.id}
      countKeys={{
        singular: "tech_health.count.vulns_singular",
        plural: "tech_health.count.vulns_plural",
      }}
      action={toolbarAction}
      renderRow={(vuln, index) => (
        <VulnRow key={vuln.id} vuln={vuln} index={index} />
      )}
    />
  );
};
