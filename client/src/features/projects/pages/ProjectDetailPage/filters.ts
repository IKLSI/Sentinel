import type { FilterBuilderLabels } from "@/components/ui/forms/FilterBuilder/types";
import type { GridFilterField } from "@/hooks/useGridControls";
import type {
  Dependency,
  Runtime,
  Vulnerability,
} from "@/domains/projects/types";
import {
  DependencyStatus,
  RiskPriority,
  RuntimeEolStatus,
  VulnerabilitySeverity,
} from "@/enums";
import {
  DEP_STATUS,
  RISK_CONFIG,
  RUNTIME_STATUS,
  SEV_CONFIG,
} from "@/features/projects/pages/ProjectDetailPage/constants";
import { getRuntimeUrgency } from "@/features/projects/pages/ProjectDetailPage/helpers";
import { buildFilterLabels } from "@/components/ui/forms/FilterBuilder/labels";
import type { Translate } from "@/contexts/I18nContext";

export type VulnerabilityRow = Vulnerability & {
  dependencyName: string;
  dependencyType: string;
};

const vulnerabilityRowCache = new WeakMap<Vulnerability, VulnerabilityRow>();

const toVulnerabilityRow = (
  dependency: Dependency,
  vulnerability: Vulnerability,
): VulnerabilityRow => {
  const cached = vulnerabilityRowCache.get(vulnerability);
  if (
    cached?.dependencyName === dependency.name &&
    cached.dependencyType === dependency.type
  ) {
    return cached;
  }

  const row = {
    ...vulnerability,
    dependencyName: dependency.name,
    dependencyType: dependency.type,
  };
  vulnerabilityRowCache.set(vulnerability, row);
  return row;
};

export const toVulnerabilityRows = (
  dependencies: Dependency[],
): VulnerabilityRow[] =>
  dependencies.flatMap((dependency) =>
    dependency.vulnerabilities.map((vulnerability) =>
      toVulnerabilityRow(dependency, vulnerability),
    ),
  );

const GRID_FILTER_FIELDS = {
  risk: "risk",
  knownExploited: "knownExploited",
  severity: "severity",
  library: "library",
  fix: "fix",
  status: "status",
  ecosystem: "ecosystem",
  type: "type",
  relation: "relation",
  vulnerable: "vulnerable",
  support: "support",
} as const;

const BOOLEAN_FILTER_VALUES = { yes: "yes", no: "no" } as const;

export const DEPENDENCY_TYPE_PROD = "Prod";
const DEPENDENCY_TYPE_DEV = "Dev";

const DEPENDENCY_RELATION = {
  direct: "direct",
  transitive: "transitive",
} as const;

const distinctOptions = (values: string[]) =>
  [...new Set(values)]
    .sort((a, b) => a.localeCompare(b))
    .map((value) => ({ value, label: value }));

const labelledOptions = <T extends string>(
  t: Translate,
  values: T[],
  config: Record<T, { labelKey: string }>,
) => values.map((value) => ({ value, label: t(config[value].labelKey) }));

const yesNoOptions = (t: Translate) => [
  { value: BOOLEAN_FILTER_VALUES.yes, label: t("tech_health.filter.yes") },
  { value: BOOLEAN_FILTER_VALUES.no, label: t("tech_health.filter.no") },
];

const toYesNo = (flag: boolean) =>
  flag ? BOOLEAN_FILTER_VALUES.yes : BOOLEAN_FILTER_VALUES.no;

export const buildVulnerabilityFilterFields = (
  t: Translate,
  vulns: VulnerabilityRow[],
): GridFilterField<VulnerabilityRow>[] => [
  {
    key: GRID_FILTER_FIELDS.risk,
    label: t("tech_health.filter.risk"),
    options: labelledOptions(t, Object.values(RiskPriority), RISK_CONFIG),
    valueOf: (vuln) => vuln.priority,
  },
  {
    key: GRID_FILTER_FIELDS.knownExploited,
    label: t("tech_health.filter.known_exploited"),
    options: yesNoOptions(t),
    valueOf: (vuln) => toYesNo(vuln.isKnownExploited),
  },
  {
    key: GRID_FILTER_FIELDS.severity,
    label: t("tech_health.filter.severity"),
    options: labelledOptions(
      t,
      Object.values(VulnerabilitySeverity),
      SEV_CONFIG,
    ),
    valueOf: (vuln) => vuln.severity,
  },
  {
    key: GRID_FILTER_FIELDS.library,
    label: t("tech_health.table.dep.library"),
    options: distinctOptions(vulns.map((vuln) => vuln.dependencyName)),
    valueOf: (vuln) => vuln.dependencyName,
  },
  {
    key: GRID_FILTER_FIELDS.fix,
    label: t("tech_health.filter.fix"),
    options: [
      {
        value: BOOLEAN_FILTER_VALUES.yes,
        label: t("tech_health.filter.fix_available"),
      },
      {
        value: BOOLEAN_FILTER_VALUES.no,
        label: t("tech_health.filter.fix_none"),
      },
    ],
    valueOf: (vuln) => toYesNo(Boolean(vuln.fixedVersion)),
  },
];

export const buildDependencyFilterFields = (
  t: Translate,
  dependencies: Dependency[],
): GridFilterField<Dependency>[] => [
  {
    key: GRID_FILTER_FIELDS.status,
    label: t("tech_health.table.dep.status"),
    options: labelledOptions(t, Object.values(DependencyStatus), DEP_STATUS),
    valueOf: (dependency) => dependency.status,
  },
  {
    key: GRID_FILTER_FIELDS.ecosystem,
    label: t("tech_health.table.dep.ecosystem"),
    options: distinctOptions(
      dependencies.map((dependency) => dependency.ecosystem),
    ),
    valueOf: (dependency) => dependency.ecosystem,
  },
  {
    key: GRID_FILTER_FIELDS.type,
    label: t("tech_health.table.dep.type"),
    options: [
      { value: DEPENDENCY_TYPE_PROD, label: t("tech_health.dep.type_prod") },
      { value: DEPENDENCY_TYPE_DEV, label: t("tech_health.dep.type_dev") },
    ],
    valueOf: (dependency) => dependency.type,
  },
  {
    key: GRID_FILTER_FIELDS.relation,
    label: t("tech_health.table.dep.relation"),
    options: [
      {
        value: DEPENDENCY_RELATION.direct,
        label: t("tech_health.dep.relation_direct"),
      },
      {
        value: DEPENDENCY_RELATION.transitive,
        label: t("tech_health.dep.relation_transitive"),
      },
    ],
    valueOf: (dependency) =>
      dependency.isDirect
        ? DEPENDENCY_RELATION.direct
        : DEPENDENCY_RELATION.transitive,
  },
  {
    key: GRID_FILTER_FIELDS.vulnerable,
    label: t("tech_health.filter.vulnerable"),
    options: yesNoOptions(t),
    valueOf: (dependency) => toYesNo(dependency.vulnerabilities.length > 0),
  },
];

export const buildRuntimeFilterFields = (
  t: Translate,
): GridFilterField<Runtime>[] => [
  {
    key: GRID_FILTER_FIELDS.support,
    label: t("tech_health.filter.support"),
    options: labelledOptions(
      t,
      Object.values(RuntimeEolStatus),
      RUNTIME_STATUS,
    ),
    valueOf: (runtime) => getRuntimeUrgency(runtime),
  },
];

export const buildGridFilterLabels = (t: Translate): FilterBuilderLabels =>
  buildFilterLabels(t, "tech_health.filter.");
