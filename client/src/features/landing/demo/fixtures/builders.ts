import type {
  Dependency,
  FindingTicket,
  Remediation,
  Runtime,
  Vulnerability,
  VulnerabilitySuppression,
} from "@/domains/projects/types";
import {
  DependencyStatus,
  type RiskPriority,
  type RuntimeEolStatus,
  type VulnerabilitySeverity,
} from "@/enums";
import { daysUntil } from "@/features/landing/demo/dates";

const NO_TICKET = null as unknown as FindingTicket;
const NO_SUPPRESSION = null as unknown as VulnerabilitySuppression;
const NO_REMEDIATION = null as unknown as Remediation;

const NPM = "npm";
const PRODUCTION = "Prod";
const DEVELOPMENT = "Dev";
const ROOT_MANIFEST = "package.json";

interface VulnerabilitySeed {
  cve: string;
  cvss: number;
  severity: VulnerabilitySeverity;
  priority: RiskPriority;
  description: string;
  fixedVersion: string;
  knownExploited?: boolean;
  ticket?: FindingTicket;
}

interface DependencySeed {
  name: string;
  current: string;
  latest?: string;
  status: DependencyStatus;
  ecosystem?: string;
  dev?: boolean;
  transitive?: boolean;
  manifestPath?: string;
  vulnerabilities?: VulnerabilitySeed[];
  ticket?: FindingTicket;
}

interface RuntimeSeed {
  name: string;
  version: string;
  eolDate: string;
  status: RuntimeEolStatus;
  progressPercent: number;
}

const toVulnerability = (
  findingPrefix: string,
  seed: VulnerabilitySeed,
): Vulnerability => ({
  id: `${findingPrefix}:${seed.cve}`,
  cveId: seed.cve,
  cveAlias: seed.cve,
  cvssScore: seed.cvss,
  severity: seed.severity,
  priority: seed.priority,
  description: seed.description,
  fixedVersion: seed.fixedVersion,
  epssScore: null,
  epssPercentile: null,
  findingKey: `${findingPrefix}:${seed.cve.toLowerCase()}`,
  isKnownExploited: seed.knownExploited ?? false,
  isMaliciousPackage: false,
  linkedTicket: seed.ticket ?? NO_TICKET,
  suppression: NO_SUPPRESSION,
  canRemediate: false,
  isMajorUpgrade: false,
  remediation: NO_REMEDIATION,
});

export const dependency = (seed: DependencySeed): Dependency => {
  const ecosystem = seed.ecosystem ?? NPM;
  const findingKey = `${ecosystem}:${seed.name}`;
  return {
    id: findingKey,
    name: seed.name,
    ecosystem,
    currentVersion: seed.current,
    latestVersion: seed.latest ?? seed.current,
    status: seed.status,
    type: seed.dev ? DEVELOPMENT : PRODUCTION,
    isDirect: !seed.transitive,
    isOutdated: seed.status !== DependencyStatus.UpToDate,
    isVersionPinned: true,
    manifestPath: seed.manifestPath ?? ROOT_MANIFEST,
    findingKey,
    linkedTicket: seed.ticket ?? NO_TICKET,
    vulnerabilities: (seed.vulnerabilities ?? []).map((vulnerability) =>
      toVulnerability(findingKey, vulnerability),
    ),
  };
};

export const runtime = (seed: RuntimeSeed): Runtime => {
  const daysRemaining = daysUntil(seed.eolDate);
  const findingKey = `runtime:${seed.name}:${seed.version}`;
  return {
    id: findingKey,
    name: seed.name,
    version: seed.version,
    versions: [seed.version],
    eolDate: `${seed.eolDate}T00:00:00Z`,
    daysRemaining,
    isEol: daysRemaining < 0,
    eolStatus: seed.status,
    eolProgressPercent: seed.progressPercent,
    findingKey,
    isMinimumConstraint: false,
    linkedTicket: NO_TICKET,
  };
};
