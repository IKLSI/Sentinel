import type {
  ActivityItem,
  DashboardStats,
  ProjectHealth,
  ScorePoint,
  UrgentTicket,
  VulnerabilityFlowPoint,
} from "@/domains/dashboard/types";
import { TicketPriority, TicketType } from "@/enums";
import {
  daysAgo,
  daysUntil,
  hoursAgo,
  isoDateDaysAgo,
} from "@/features/landing/demo/dates";
import {
  DEMO_PROJECT_IDS,
  DEMO_PROJECT_NAMES,
  DEMO_RUNTIME_EOL_DATES,
  DEMO_TICKET_IDS,
  DEMO_TICKET_REFERENCES,
  DEMO_USER_NAMES,
} from "@/features/landing/demo/fixtures/ids";

const SCORE_TREND = [
  60, 60, 61, 60, 61, 61, 62, 61, 62, 62, 62, 63, 62, 63, 63, 63, 64, 63, 64,
  64, 64, 65, 64, 65, 65, 65, 66, 65, 66, 66,
];

const DETECTED_PER_DAY = [
  4, 6, 3, 10, 5, 7, 2, 6, 9, 4, 5, 7, 3, 6, 8, 5, 4, 7, 6, 3, 9, 5, 6, 4, 7, 5,
  8, 6, 4, 12,
];

const RESOLVED_PER_DAY = [
  2, 4, 3, 5, 2, 4, 1, 3, 6, 2, 4, 5, 2, 3, 5, 4, 3, 4, 4, 2, 6, 3, 4, 3, 5, 3,
  5, 4, 3, 8,
];

const lastDayOffset = (values: number[], index: number) =>
  values.length - 1 - index;

const scoreHistory: ScorePoint[] = SCORE_TREND.map((score, index) => ({
  date: isoDateDaysAgo(lastDayOffset(SCORE_TREND, index)),
  score,
}));

const vulnerabilityFlow: VulnerabilityFlowPoint[] = DETECTED_PER_DAY.map(
  (detected, index) => ({
    date: isoDateDaysAgo(lastDayOffset(DETECTED_PER_DAY, index)),
    detected,
    resolved: RESOLVED_PER_DAY[index] ?? 0,
  }),
);

const projects: ProjectHealth[] = [
  {
    id: DEMO_PROJECT_IDS.storefront,
    name: DEMO_PROJECT_NAMES.storefront,
    score: 28,
    grade: "F",
    scoreDelta: -3,
    coverage: "Covered",
    hasScanError: false,
    criticalVulnerabilityCount: 3,
    highVulnerabilityCount: 5,
    eolRuntimeCount: 2,
    lastScanAt: hoursAgo(2),
    repositoryType: "GitHub",
    nextAction: {
      kind: "UpdateDependency",
      target: "react-server-dom-webpack",
      version: "19.1.2",
      ticketId: null,
      ticketReference: null,
    },
  },
  {
    id: DEMO_PROJECT_IDS.payments,
    name: DEMO_PROJECT_NAMES.payments,
    score: 41,
    grade: "E",
    scoreDelta: 4,
    coverage: "Covered",
    hasScanError: false,
    criticalVulnerabilityCount: 1,
    highVulnerabilityCount: 4,
    eolRuntimeCount: 1,
    lastScanAt: hoursAgo(3),
    repositoryType: "GitLab",
    nextAction: {
      kind: "PlanRuntimeMigration",
      target: ".NET",
      version: "8",
      ticketId: null,
      ticketReference: null,
    },
  },
  {
    id: DEMO_PROJECT_IDS.portal,
    name: DEMO_PROJECT_NAMES.portal,
    score: 82,
    grade: "B",
    scoreDelta: 9,
    coverage: "Covered",
    hasScanError: false,
    criticalVulnerabilityCount: 0,
    highVulnerabilityCount: 2,
    eolRuntimeCount: 0,
    lastScanAt: hoursAgo(5),
    repositoryType: "GitHub",
    nextAction: {
      kind: "UpdateDependency",
      target: "shell-quote",
      version: "1.8.1",
      ticketId: null,
      ticketReference: null,
    },
  },
  {
    id: DEMO_PROJECT_IDS.mobile,
    name: DEMO_PROJECT_NAMES.mobile,
    score: 87,
    grade: "B",
    scoreDelta: 2,
    coverage: "Covered",
    hasScanError: false,
    criticalVulnerabilityCount: 0,
    highVulnerabilityCount: 0,
    eolRuntimeCount: 0,
    lastScanAt: hoursAgo(6),
    repositoryType: "GitHub",
    nextAction: {
      kind: "UpdateDependency",
      target: "source-map-js",
      version: "1.2.1",
      ticketId: null,
      ticketReference: null,
    },
  },
];

const urgentTickets: UrgentTicket[] = [
  {
    id: DEMO_TICKET_IDS.rsc,
    reference: DEMO_TICKET_REFERENCES.rsc,
    title: "Corriger CVE-2025-55182 sur react-server-dom-webpack",
    projectName: DEMO_PROJECT_NAMES.storefront,
    priority: TicketPriority.Critical,
    type: TicketType.Security,
    assignedToName: DEMO_USER_NAMES.camille,
    commentCount: 4,
  },
  {
    id: DEMO_TICKET_IDS.dotnet,
    reference: DEMO_TICKET_REFERENCES.dotnet,
    title: "Planifier la migration de .NET 8 vers .NET 10",
    projectName: DEMO_PROJECT_NAMES.payments,
    priority: TicketPriority.Critical,
    type: TicketType.Maintenance,
    assignedToName: null,
    commentCount: 2,
  },
  {
    id: DEMO_TICKET_IDS.safari,
    reference: DEMO_TICKET_REFERENCES.safari,
    title: "Le formulaire de contact échoue sur Safari",
    projectName: DEMO_PROJECT_NAMES.portal,
    priority: TicketPriority.High,
    type: TicketType.Bug,
    assignedToName: DEMO_USER_NAMES.mathis,
    commentCount: 3,
  },
  {
    id: DEMO_TICKET_IDS.catalog,
    reference: DEMO_TICKET_REFERENCES.catalog,
    title: "Le catalogue met plus de 3 s à s'afficher",
    projectName: DEMO_PROJECT_NAMES.storefront,
    priority: TicketPriority.Medium,
    type: TicketType.Performance,
    assignedToName: DEMO_USER_NAMES.ines,
    commentCount: 1,
  },
];

const ticketActivity = (
  type: "created" | "resolved",
  ticket: keyof typeof DEMO_TICKET_IDS,
  detail: string,
  timestamp: string,
): ActivityItem => ({
  type,
  color: type === "resolved" ? "green" : "accent",
  timestamp,
  ticketId: DEMO_TICKET_IDS[ticket],
  reference: DEMO_TICKET_REFERENCES[ticket],
  detail,
  projectId: null,
  projectName: null,
  count: null,
  vulnCveId: null,
  vulnCvssScore: null,
  vulnOtherCount: null,
});

const recentActivity: ActivityItem[] = [
  ticketActivity(
    "created",
    "rsc",
    "Corriger CVE-2025-55182 sur react-server-dom-webpack",
    hoursAgo(11),
  ),
  {
    type: "vuln",
    color: "red",
    timestamp: hoursAgo(12),
    projectId: DEMO_PROJECT_IDS.storefront,
    projectName: DEMO_PROJECT_NAMES.storefront,
    count: 1,
    vulnCveId: "CVE-2025-55182",
    vulnCvssScore: 10,
    vulnOtherCount: 0,
    ticketId: null,
    reference: null,
    detail: null,
  },
  ticketActivity(
    "resolved",
    "rotation",
    "Politique de rotation des clés API",
    daysAgo(1),
  ),
  {
    ...ticketActivity(
      "created",
      "dotnet",
      DEMO_PROJECT_NAMES.payments,
      daysAgo(2),
    ),
    ticketId: null,
    reference: null,
    projectId: DEMO_PROJECT_IDS.payments,
    projectName: DEMO_PROJECT_NAMES.payments,
    count: 3,
  },
  ticketActivity(
    "resolved",
    "tls",
    "Renouveler le certificat TLS de l'API",
    daysAgo(3),
  ),
  ticketActivity(
    "created",
    "pathToRegexp",
    "Corriger CVE-2024-45296 sur path-to-regexp",
    daysAgo(4),
  ),
];

export const DEMO_DASHBOARD: DashboardStats = {
  overview: {
    averageScore: 66,
    grade: "C",
    scoreDelta: 6,
    projectCount: projects.length,
    gradeDistribution: [
      { grade: "B", count: 2 },
      { grade: "E", count: 1 },
      { grade: "F", count: 1 },
    ],
    majorUpdatesInProduction: 9,
    runtimesEndingSoon: 1,
    nextRuntimeEolInDays: daysUntil(DEMO_RUNTIME_EOL_DATES.dotnet8),
    vulnerabilities: {
      critical: 3,
      high: 68,
      medium: 79,
      low: 26,
      knownExploited: 1,
      total: 176,
    },
    dependencies: {
      upToDate: 957,
      minorUpdate: 453,
      majorUpdate: 440,
      endOfLife: 18,
      vulnerable: 56,
      total: 1924,
    },
  },
  scoreHistory,
  vulnerabilityFlow,
  projects,
  urgentTickets,
  recentActivity,
};
