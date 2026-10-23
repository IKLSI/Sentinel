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
  getRuntimeUrgency,
} from "@/features/techHealth/pages/ProjectDetailPage/helpers";
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

const sortedUnique = (values: string[]) =>
  [...new Set(values)].sort((a, b) => a.localeCompare(b));

export const buildVulnerabilityFilterFields = (
  t: Translate,
  vulns: VulnerabilityRow[],
): GridFilterField<VulnerabilityRow>[] => [
  {
    key: GRID_FILTER_FIELDS.risk,
    label: t("tech_health.filter.risk"),
    options: Object.values(RiskPriority).map((priority) => ({
      value: priority,
      label: t(RISK_CONFIG[priority].labelKey),
    })),
    valueOf: (vuln) => vuln.priority,
  },
  {
    key: GRID_FILTER_FIELDS.knownExploited,
    label: t("tech_health.filter.known_exploited"),
    options: [
      { value: BOOLEAN_FILTER_VALUES.yes, label: t("tech_health.filter.yes") },
      { value: BOOLEAN_FILTER_VALUES.no, label: t("tech_health.filter.no") },
    ],
    valueOf: (vuln) =>
      vuln.isKnownExploited
        ? BOOLEAN_FILTER_VALUES.yes
        : BOOLEAN_FILTER_VALUES.no,
  },
  {
    key: GRID_FILTER_FIELDS.severity,
    label: t("tech_health.filter.severity"),
    options: Object.values(VulnerabilitySeverity).map((severity) => ({
      value: severity,
      label: t(SEV_CONFIG[severity].labelKey),
    })),
    valueOf: (vuln) => vuln.severity,
  },
  {
    key: GRID_FILTER_FIELDS.library,
    label: t("tech_health.table.dep.library"),
    options: sortedUnique(vulns.map((vuln) => vuln.dependencyName)).map(
      (name) => ({ value: name, label: name }),
    ),
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
    valueOf: (vuln) =>
      vuln.fixedVersion ? BOOLEAN_FILTER_VALUES.yes : BOOLEAN_FILTER_VALUES.no,
  },
];

export const buildDependencyFilterFields = (
  t: Translate,
  dependencies: Dependency[],
): GridFilterField<Dependency>[] => [
  {
    key: GRID_FILTER_FIELDS.status,
    label: t("tech_health.table.dep.status"),
    options: Object.values(DependencyStatus).map((status) => ({
      value: status,
      label: t(DEP_STATUS[status].labelKey),
    })),
    valueOf: (dependency) => dependency.status,
  },
  {
    key: GRID_FILTER_FIELDS.ecosystem,
    label: t("tech_health.table.dep.ecosystem"),
    options: sortedUnique(
      dependencies.map((dependency) => dependency.ecosystem),
    ).map((ecosystem) => ({ value: ecosystem, label: ecosystem })),
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
    options: [
      { value: BOOLEAN_FILTER_VALUES.yes, label: t("tech_health.filter.yes") },
      { value: BOOLEAN_FILTER_VALUES.no, label: t("tech_health.filter.no") },
    ],
    valueOf: (dependency) =>
      dependency.vulnerabilities.length
        ? BOOLEAN_FILTER_VALUES.yes
        : BOOLEAN_FILTER_VALUES.no,
  },
];

export const buildRuntimeFilterFields = (
  t: Translate,
): GridFilterField<Runtime>[] => [
  {
    key: GRID_FILTER_FIELDS.support,
    label: t("tech_health.filter.support"),
    options: Object.values(RuntimeEolStatus).map((status) => ({
      value: status,
      label: t(RUNTIME_STATUS[status].labelKey),
    })),
    valueOf: (runtime) => getRuntimeUrgency(runtime),
  },
];

export const buildGridFilterLabels = (t: Translate): FilterBuilderLabels =>
  buildFilterLabels(t, "tech_health.filter.");
