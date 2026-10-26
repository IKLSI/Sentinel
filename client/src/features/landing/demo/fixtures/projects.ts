import type { Project, Remediation } from "@/domains/projects/types";
import {
  DependencyStatus,
  RiskPriority,
  RuntimeEolStatus,
  ScanCoverage,
  ScanFrequency,
  TicketStatus,
  VulnerabilitySeverity,
} from "@/enums";
import { hoursAgo } from "@/features/landing/demo/dates";
import { dependency, runtime } from "@/features/landing/demo/fixtures/builders";
import {
  DEMO_PROJECT_IDS,
  DEMO_PROJECT_NAMES,
  DEMO_RUNTIME_EOL_DATES,
  DEMO_TICKET_IDS,
  DEMO_TICKET_REFERENCES,
} from "@/features/landing/demo/fixtures/ids";

const NO_REMEDIATION = null as unknown as Remediation;

const NUGET = "NuGet";
const PAYMENTS_MANIFEST = "src/Payments.Api/Payments.Api.csproj";
const ADMIN_MANIFEST = "admin/package.json";

const nodeRuntime = (
  version: string,
  eolDate: string,
  status: RuntimeEolStatus,
  progressPercent: number,
) => runtime({ name: "Node.js", version, eolDate, status, progressPercent });

const node22 = () =>
  nodeRuntime("22", DEMO_RUNTIME_EOL_DATES.node22, RuntimeEolStatus.Ok, 48);

const projectBase = {
  branch: "main",
  coverage: ScanCoverage.Covered,
  lastScanError: null,
  lastScanErrorDetail: null,
  repositoryUrl: null,
  rootPath: null,
  scanFrequency: ScanFrequency.Daily,
  remediationAvailable: false,
  remediableVulnerabilities: 0,
  remediationIncludesMajorUpgrade: false,
  remediation: NO_REMEDIATION,
} as const;

const storefront: Project = {
  ...projectBase,
  id: DEMO_PROJECT_IDS.storefront,
  name: DEMO_PROJECT_NAMES.storefront,
  repositoryType: "GitHub",
  healthScore: 28,
  healthGrade: "F",
  lastScanAt: hoursAgo(2),
  totalDependencies: 412,
  criticalVulnerabilities: 1,
  knownExploitedVulnerabilities: 1,
  totalVulnerabilities: 15,
  dependencies: [
    dependency({
      name: "react-server-dom-webpack",
      current: "19.1.0",
      latest: "19.2.1",
      status: DependencyStatus.Vulnerable,
      vulnerabilities: [
        {
          cve: "CVE-2025-55182",
          cvss: 10,
          severity: VulnerabilitySeverity.Critical,
          priority: RiskPriority.Urgent,
          description: "Remote code execution in React Server Components",
          fixedVersion: "19.1.2",
          knownExploited: true,
          ticket: {
            id: DEMO_TICKET_IDS.rsc,
            reference: DEMO_TICKET_REFERENCES.rsc,
            status: TicketStatus.InProgress,
          },
        },
      ],
    }),
    dependency({
      name: "path-to-regexp",
      current: "0.1.7",
      latest: "8.3.0",
      status: DependencyStatus.Vulnerable,
      transitive: true,
      vulnerabilities: [
        {
          cve: "CVE-2024-45296",
          cvss: 7.5,
          severity: VulnerabilitySeverity.High,
          priority: RiskPriority.Moderate,
          description:
            "path-to-regexp outputs backtracking regular expressions",
          fixedVersion: "0.1.10",
          ticket: {
            id: DEMO_TICKET_IDS.pathToRegexp,
            reference: DEMO_TICKET_REFERENCES.pathToRegexp,
            status: TicketStatus.New,
          },
        },
      ],
    }),
    dependency({
      name: "body-parser",
      current: "1.20.2",
      latest: "2.2.0",
      status: DependencyStatus.Vulnerable,
      transitive: true,
      vulnerabilities: [
        {
          cve: "CVE-2024-45590",
          cvss: 7.5,
          severity: VulnerabilitySeverity.High,
          priority: RiskPriority.Moderate,
          description:
            "body-parser vulnerable to denial of service when url encoding is enabled",
          fixedVersion: "1.20.3",
        },
      ],
    }),
    dependency({
      name: "cross-spawn",
      current: "7.0.3",
      latest: "7.0.6",
      status: DependencyStatus.Vulnerable,
      transitive: true,
      vulnerabilities: [
        {
          cve: "CVE-2024-21538",
          cvss: 7.5,
          severity: VulnerabilitySeverity.High,
          priority: RiskPriority.Moderate,
          description:
            "Regular Expression Denial of Service (ReDoS) in cross-spawn",
          fixedVersion: "7.0.5",
        },
      ],
    }),
    dependency({
      name: "ws",
      current: "8.17.0",
      latest: "8.18.3",
      status: DependencyStatus.Vulnerable,
      transitive: true,
      vulnerabilities: [
        {
          cve: "CVE-2024-37890",
          cvss: 7.5,
          severity: VulnerabilitySeverity.High,
          priority: RiskPriority.Moderate,
          description:
            "ws affected by a DoS when handling a request with many HTTP headers",
          fixedVersion: "8.17.1",
        },
      ],
    }),
    dependency({
      name: "braces",
      current: "3.0.2",
      latest: "3.0.3",
      status: DependencyStatus.Vulnerable,
      transitive: true,
      vulnerabilities: [
        {
          cve: "CVE-2024-4068",
          cvss: 7.5,
          severity: VulnerabilitySeverity.High,
          priority: RiskPriority.Moderate,
          description: "Uncontrolled resource consumption in braces",
          fixedVersion: "3.0.3",
        },
      ],
    }),
    dependency({
      name: "send",
      current: "0.18.0",
      latest: "1.2.0",
      status: DependencyStatus.Vulnerable,
      transitive: true,
      vulnerabilities: [
        {
          cve: "CVE-2024-43799",
          cvss: 5,
          severity: VulnerabilitySeverity.Medium,
          priority: RiskPriority.Moderate,
          description:
            "send vulnerable to template injection that can lead to XSS",
          fixedVersion: "0.19.0",
        },
      ],
    }),
    dependency({
      name: "micromatch",
      current: "4.0.5",
      latest: "4.0.8",
      status: DependencyStatus.Vulnerable,
      transitive: true,
      vulnerabilities: [
        {
          cve: "CVE-2024-4067",
          cvss: 5.3,
          severity: VulnerabilitySeverity.Medium,
          priority: RiskPriority.Moderate,
          description:
            "Regular Expression Denial of Service (ReDoS) in micromatch",
          fixedVersion: "4.0.8",
        },
      ],
    }),
    dependency({
      name: "nanoid",
      current: "3.3.7",
      latest: "5.1.6",
      status: DependencyStatus.Vulnerable,
      transitive: true,
      vulnerabilities: [
        {
          cve: "CVE-2024-55565",
          cvss: 4.3,
          severity: VulnerabilitySeverity.Medium,
          priority: RiskPriority.Moderate,
          description:
            "Predictable results in nanoid generation when given non-integer values",
          fixedVersion: "3.3.8",
        },
      ],
    }),
    dependency({
      name: "cookie",
      current: "0.6.0",
      latest: "1.0.2",
      status: DependencyStatus.Vulnerable,
      transitive: true,
      vulnerabilities: [
        {
          cve: "CVE-2024-47764",
          cvss: 0,
          severity: VulnerabilitySeverity.Low,
          priority: RiskPriority.Low,
          description:
            "cookie accepts cookie name, path, and domain with out of bounds characters",
          fixedVersion: "0.7.0",
        },
      ],
    }),
    dependency({
      name: "node-sass",
      current: "9.0.0",
      status: DependencyStatus.EOL,
      dev: true,
    }),
    dependency({
      name: "request",
      current: "2.88.2",
      status: DependencyStatus.EOL,
    }),
    dependency({
      name: "next",
      current: "15.1.0",
      latest: "16.0.7",
      status: DependencyStatus.MajorUpdate,
    }),
    dependency({
      name: "express",
      current: "4.21.2",
      latest: "5.1.0",
      status: DependencyStatus.MajorUpdate,
    }),
    dependency({
      name: "zod",
      current: "3.23.8",
      latest: "4.1.12",
      status: DependencyStatus.MajorUpdate,
    }),
    dependency({
      name: "typescript",
      current: "5.6.3",
      latest: "5.9.3",
      status: DependencyStatus.MinorUpdate,
      dev: true,
    }),
    dependency({
      name: "react",
      current: "19.1.0",
      latest: "19.2.0",
      status: DependencyStatus.MinorUpdate,
    }),
    dependency({
      name: "lodash",
      current: "4.17.21",
      status: DependencyStatus.UpToDate,
    }),
  ],
  runtimes: [
    nodeRuntime("20", DEMO_RUNTIME_EOL_DATES.node20, RuntimeEolStatus.Eol, 100),
    runtime({
      name: "Python",
      version: "3.12",
      eolDate: DEMO_RUNTIME_EOL_DATES.python312,
      status: RuntimeEolStatus.Ok,
      progressPercent: 4,
    }),
  ],
};

const payments: Project = {
  ...projectBase,
  id: DEMO_PROJECT_IDS.payments,
  name: DEMO_PROJECT_NAMES.payments,
  repositoryType: "GitLab",
  healthScore: 41,
  healthGrade: "E",
  lastScanAt: hoursAgo(3),
  totalDependencies: 186,
  criticalVulnerabilities: 2,
  knownExploitedVulnerabilities: 0,
  totalVulnerabilities: 4,
  dependencies: [
    dependency({
      name: "minimist",
      current: "1.2.5",
      latest: "1.2.8",
      status: DependencyStatus.Vulnerable,
      transitive: true,
      manifestPath: ADMIN_MANIFEST,
      vulnerabilities: [
        {
          cve: "CVE-2021-44906",
          cvss: 9.8,
          severity: VulnerabilitySeverity.Critical,
          priority: RiskPriority.High,
          description: "Prototype Pollution in minimist",
          fixedVersion: "1.2.6",
        },
      ],
    }),
    dependency({
      name: "@babel/traverse",
      current: "7.22.5",
      latest: "7.28.4",
      status: DependencyStatus.Vulnerable,
      dev: true,
      transitive: true,
      manifestPath: ADMIN_MANIFEST,
      vulnerabilities: [
        {
          cve: "CVE-2023-45133",
          cvss: 9.3,
          severity: VulnerabilitySeverity.Critical,
          priority: RiskPriority.Moderate,
          description:
            "Babel vulnerable to arbitrary code execution when compiling specifically crafted malicious code",
          fixedVersion: "7.23.2",
        },
      ],
    }),
    dependency({
      name: "json5",
      current: "2.2.1",
      latest: "2.2.3",
      status: DependencyStatus.Vulnerable,
      transitive: true,
      manifestPath: ADMIN_MANIFEST,
      vulnerabilities: [
        {
          cve: "CVE-2022-46175",
          cvss: 7.1,
          severity: VulnerabilitySeverity.High,
          priority: RiskPriority.Moderate,
          description: "Prototype Pollution in JSON5 via Parse Method",
          fixedVersion: "2.2.2",
        },
      ],
    }),
    dependency({
      name: "tough-cookie",
      current: "4.1.2",
      latest: "6.0.0",
      status: DependencyStatus.Vulnerable,
      transitive: true,
      manifestPath: ADMIN_MANIFEST,
      vulnerabilities: [
        {
          cve: "CVE-2023-26136",
          cvss: 6.5,
          severity: VulnerabilitySeverity.Medium,
          priority: RiskPriority.Moderate,
          description: "tough-cookie Prototype Pollution vulnerability",
          fixedVersion: "4.1.3",
        },
      ],
    }),
    dependency({
      name: "Serilog.AspNetCore",
      ecosystem: NUGET,
      current: "8.0.3",
      latest: "9.0.0",
      status: DependencyStatus.MajorUpdate,
      manifestPath: PAYMENTS_MANIFEST,
    }),
    dependency({
      name: "Swashbuckle.AspNetCore",
      ecosystem: NUGET,
      current: "6.9.0",
      latest: "9.0.6",
      status: DependencyStatus.MajorUpdate,
      manifestPath: PAYMENTS_MANIFEST,
    }),
    dependency({
      name: "Polly",
      ecosystem: NUGET,
      current: "8.5.2",
      latest: "8.6.4",
      status: DependencyStatus.MinorUpdate,
      manifestPath: PAYMENTS_MANIFEST,
    }),
    dependency({
      name: "Newtonsoft.Json",
      ecosystem: NUGET,
      current: "13.0.4",
      status: DependencyStatus.UpToDate,
      manifestPath: PAYMENTS_MANIFEST,
    }),
  ],
  runtimes: [
    runtime({
      name: ".NET",
      version: "8.0",
      eolDate: DEMO_RUNTIME_EOL_DATES.dotnet8,
      status: RuntimeEolStatus.Danger,
      progressPercent: 95,
    }),
    node22(),
  ],
};

const portal: Project = {
  ...projectBase,
  id: DEMO_PROJECT_IDS.portal,
  name: DEMO_PROJECT_NAMES.portal,
  repositoryType: "GitHub",
  healthScore: 82,
  healthGrade: "B",
  lastScanAt: hoursAgo(5),
  totalDependencies: 238,
  criticalVulnerabilities: 0,
  knownExploitedVulnerabilities: 0,
  totalVulnerabilities: 0,
  dependencies: [
    dependency({
      name: "shell-quote",
      current: "1.8.0",
      latest: "1.8.1",
      status: DependencyStatus.MinorUpdate,
      transitive: true,
    }),
    dependency({
      name: "react",
      current: "18.3.1",
      latest: "19.2.0",
      status: DependencyStatus.MajorUpdate,
    }),
    dependency({
      name: "vite",
      current: "5.4.11",
      latest: "7.1.9",
      status: DependencyStatus.MajorUpdate,
      dev: true,
    }),
    dependency({
      name: "axios",
      current: "1.12.2",
      status: DependencyStatus.UpToDate,
    }),
  ],
  runtimes: [node22()],
};

const mobile: Project = {
  ...projectBase,
  id: DEMO_PROJECT_IDS.mobile,
  name: DEMO_PROJECT_NAMES.mobile,
  repositoryType: "GitHub",
  healthScore: 87,
  healthGrade: "B",
  lastScanAt: hoursAgo(6),
  totalDependencies: 296,
  criticalVulnerabilities: 0,
  knownExploitedVulnerabilities: 0,
  totalVulnerabilities: 0,
  dependencies: [
    dependency({
      name: "source-map-js",
      current: "1.2.0",
      latest: "1.2.1",
      status: DependencyStatus.MinorUpdate,
      transitive: true,
    }),
    dependency({
      name: "react-native",
      current: "0.76.5",
      latest: "0.81.4",
      status: DependencyStatus.MajorUpdate,
    }),
    dependency({
      name: "expo",
      current: "52.0.0",
      latest: "54.0.12",
      status: DependencyStatus.MajorUpdate,
    }),
    dependency({
      name: "zustand",
      current: "5.0.8",
      status: DependencyStatus.UpToDate,
    }),
  ],
  runtimes: [node22()],
};

const DEMO_PROJECTS: Project[] = [storefront, payments, portal, mobile];

export const DEMO_PROJECT_OPTIONS = DEMO_PROJECTS.map(({ id, name }) => ({
  id,
  name,
}));

export const findDemoProject = (id: string | undefined): Project =>
  DEMO_PROJECTS.find((project) => project.id === id) ?? storefront;
