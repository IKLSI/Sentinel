import type { Ticket } from "@/domains/tickets/types";
import type { UserOption } from "@/domains/users/types";
import { FindingKind, TicketPriority, TicketStatus, TicketType } from "@/enums";
import { daysAgo } from "@/features/landing/demo/dates";
import {
  DEMO_PROJECT_IDS,
  DEMO_PROJECT_NAMES,
  DEMO_TICKET_IDS,
  DEMO_TICKET_REFERENCES,
  DEMO_USER_IDS,
  DEMO_USER_NAMES,
} from "@/features/landing/demo/fixtures/ids";

type DemoTicketKey = keyof typeof DEMO_TICKET_IDS;
type DemoProjectKey = keyof typeof DEMO_PROJECT_IDS;
type DemoUserKey = keyof typeof DEMO_USER_IDS;

interface TicketSeed {
  key: DemoTicketKey;
  title: string;
  type: TicketType;
  priority: TicketPriority;
  status: TicketStatus;
  project: DemoProjectKey;
  assignee?: DemoUserKey;
  commentCount: number;
  createdDaysAgo: number;
  findingKey?: string;
  findingKind?: FindingKind;
}

const DEMO_TICKETS_PAGE_SIZE = 10;

export const DEMO_TICKETS_TOTAL = 23;

export const DEMO_TICKETS_TOTAL_PAGES = Math.ceil(
  DEMO_TICKETS_TOTAL / DEMO_TICKETS_PAGE_SIZE,
);

const toTicket = (seed: TicketSeed): Ticket => ({
  id: DEMO_TICKET_IDS[seed.key],
  reference: DEMO_TICKET_REFERENCES[seed.key],
  title: seed.title,
  description: seed.title,
  type: seed.type,
  priority: seed.priority,
  status: seed.status,
  projectId: DEMO_PROJECT_IDS[seed.project],
  projectName: DEMO_PROJECT_NAMES[seed.project],
  assignedToId: seed.assignee ? DEMO_USER_IDS[seed.assignee] : null,
  assignedToName: seed.assignee ? DEMO_USER_NAMES[seed.assignee] : null,
  commentCount: seed.commentCount,
  comments: [],
  history: [],
  createdAt: daysAgo(seed.createdDaysAgo),
  createdByName: DEMO_USER_NAMES.camille,
  findingKey: seed.findingKey ?? null,
  findingKind: seed.findingKind ?? null,
});

export const DEMO_TICKETS: Ticket[] = [
  toTicket({
    key: "rsc",
    title: "Corriger CVE-2025-55182 sur react-server-dom-webpack",
    type: TicketType.Security,
    priority: TicketPriority.Critical,
    status: TicketStatus.InProgress,
    project: "storefront",
    assignee: "camille",
    commentCount: 4,
    createdDaysAgo: 0,
    findingKey: "npm:react-server-dom-webpack:cve-2025-55182",
    findingKind: FindingKind.Vulnerability,
  }),
  toTicket({
    key: "dotnet",
    title: "Planifier la migration de .NET 8 vers .NET 10",
    type: TicketType.Maintenance,
    priority: TicketPriority.Critical,
    status: TicketStatus.New,
    project: "payments",
    commentCount: 2,
    createdDaysAgo: 2,
    findingKey: "runtime:.NET:8.0",
    findingKind: FindingKind.EolRuntime,
  }),
  toTicket({
    key: "pathToRegexp",
    title: "Corriger CVE-2024-45296 sur path-to-regexp",
    type: TicketType.Security,
    priority: TicketPriority.High,
    status: TicketStatus.New,
    project: "storefront",
    assignee: "ines",
    commentCount: 0,
    createdDaysAgo: 4,
    findingKey: "npm:path-to-regexp:cve-2024-45296",
    findingKind: FindingKind.Vulnerability,
  }),
  toTicket({
    key: "safari",
    title: "Le formulaire de contact échoue sur Safari",
    type: TicketType.Bug,
    priority: TicketPriority.High,
    status: TicketStatus.InProgress,
    project: "portal",
    assignee: "mathis",
    commentCount: 3,
    createdDaysAgo: 5,
  }),
  toTicket({
    key: "invoices",
    title: "Exporter les factures au format CSV",
    type: TicketType.Feature,
    priority: TicketPriority.Medium,
    status: TicketStatus.Testing,
    project: "portal",
    assignee: "ines",
    commentCount: 5,
    createdDaysAgo: 8,
  }),
  toTicket({
    key: "catalog",
    title: "Le catalogue met plus de 3 s à s'afficher",
    type: TicketType.Performance,
    priority: TicketPriority.Medium,
    status: TicketStatus.InProgress,
    project: "storefront",
    assignee: "ines",
    commentCount: 1,
    createdDaysAgo: 9,
  }),
  toTicket({
    key: "sourceMap",
    title: "Mettre à jour source-map-js vers 1.2.1",
    type: TicketType.Maintenance,
    priority: TicketPriority.Low,
    status: TicketStatus.New,
    project: "mobile",
    commentCount: 0,
    createdDaysAgo: 11,
    findingKey: "npm:source-map-js",
    findingKind: FindingKind.OutdatedDependency,
  }),
  toTicket({
    key: "rotation",
    title: "Quelle politique de rotation pour les clés API ?",
    type: TicketType.Question,
    priority: TicketPriority.Low,
    status: TicketStatus.Resolved,
    project: "payments",
    assignee: "mathis",
    commentCount: 6,
    createdDaysAgo: 13,
  }),
  toTicket({
    key: "android",
    title: "Plantage au lancement sur Android 15",
    type: TicketType.Bug,
    priority: TicketPriority.Medium,
    status: TicketStatus.Closed,
    project: "mobile",
    assignee: "ines",
    commentCount: 2,
    createdDaysAgo: 16,
  }),
  toTicket({
    key: "tls",
    title: "Renouveler le certificat TLS de l'API",
    type: TicketType.Security,
    priority: TicketPriority.High,
    status: TicketStatus.Resolved,
    project: "payments",
    assignee: "camille",
    commentCount: 1,
    createdDaysAgo: 18,
  }),
];

const demoUser = (key: DemoUserKey, name: string): UserOption => ({
  id: DEMO_USER_IDS[key],
  name,
});

export const DEMO_USERS: UserOption[] = [
  demoUser("camille", "Camille Laurent"),
  demoUser("mathis", "Mathis Roux"),
  demoUser("ines", "Inès Benali"),
];
