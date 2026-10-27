import type { Translate } from "@/contexts/I18nContext";
import type { Dependency } from "@/domains/projects/types";
import type { VirtualTableColumn } from "@/components/ui/common/table/VirtualTable";
import { DEP_STATUS } from "@/features/projects/pages/ProjectDetailPage/constants";

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

export const DEFAULT_SORT = {
  key: COLUMN_KEYS.vulns,
  direction: "desc",
} as const;

export const statusOf = (dependency: Dependency) =>
  DEP_STATUS[dependency.status] ?? DEP_STATUS.UpToDate;

export const comparators = {
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

export const searchableValues = (dependency: Dependency) => [
  dependency.name,
  dependency.manifestPath ?? "",
];

export const buildDependencyColumns = (t: Translate): VirtualTableColumn[] => [
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
