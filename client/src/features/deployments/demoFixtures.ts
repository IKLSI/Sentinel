import type {
  DependencyChange,
  ReleaseComparison,
  ReleaseRefs,
} from "@/domains/deployments/types";

export const DEMO_REFS: ReleaseRefs = {
  available: true,
  tags: ["v2.4.0", "v2.3.1", "v2.3.0", "v2.2.0", "v2.1.0", "v2.0.0"],
  branches: ["main", "develop", "release/2.4", "feature/billing"],
  suggestedBase: "v2.3.1",
  suggestedHead: "v2.4.0",
};

const dependency = (
  ecosystem: DependencyChange["ecosystem"],
  name: string,
  change: DependencyChange["change"],
  baseVersion: string | null,
  headVersion: string | null,
  isMajor = false,
  introducedVulnerabilities: string[] = [],
): DependencyChange => ({
  ecosystem,
  name,
  change,
  baseVersion,
  headVersion,
  isMajor,
  introducedVulnerabilities,
});

export const DEMO_COMPARISON: ReleaseComparison = {
  headReference: "v2.4.0",
  summary: {
    fixedVulnerabilityCount: 2,
    historyTruncated: false,
    inventoryIncomplete: false,
    vulnerabilityDataIncomplete: false,
  },
  configuration: [
    {
      file: "server/src/API/appsettings.json",
      key: "Payments:WebhookSecret",
      requiresValue: true,
      severity: "Blocking",
    },
    {
      file: "server/src/API/appsettings.json",
      key: "Payments:ApiKey",
      requiresValue: true,
      severity: "Blocking",
    },
    {
      file: "server/src/API/appsettings.json",
      key: "Mailing:LegacySender",
      requiresValue: false,
      severity: "Warning",
    },
    {
      file: ".env.example",
      key: "SENTRY_DSN",
      requiresValue: true,
      severity: "Blocking",
    },
    {
      file: ".env.example",
      key: "LEGACY_CACHE_URL",
      requiresValue: false,
      severity: "Warning",
    },
  ],
  migrations: [
    {
      name: "20260918101500_DropLegacyInvoices",
      path: "server/src/Infrastructure/Migrations/20260918101500_DropLegacyInvoices.cs",
      risk: "Destructive",
      severity: "Blocking",
      operations: [
        { kind: "DropTable", target: "legacy_invoices" },
        { kind: "DropColumn", target: "projects.billing_ref" },
      ],
    },
    {
      name: "20260922083000_ReplaceTicketStatus",
      path: "server/src/Infrastructure/Migrations/20260922083000_ReplaceTicketStatus.cs",
      risk: "Destructive",
      severity: "Blocking",
      operations: [{ kind: "DropColumn", target: "tickets.status_code" }],
    },
    {
      name: "20260925142000_RenameOrganizationSlug",
      path: "server/src/Infrastructure/Migrations/20260925142000_RenameOrganizationSlug.cs",
      risk: "Risky",
      severity: "Warning",
      operations: [
        { kind: "RenameColumn", target: "organizations.slug" },
        { kind: "AlterColumn", target: "organizations.name" },
      ],
    },
    {
      name: "20261002091000_WidenVersionColumns",
      path: "server/src/Infrastructure/Migrations/20261002091000_WidenVersionColumns.cs",
      risk: "Risky",
      severity: "Warning",
      operations: [{ kind: "AlterColumn", target: "dependencies.version" }],
    },
    {
      name: "20261006120000_AddInventoryCounts",
      path: "server/src/Infrastructure/Migrations/20261006120000_AddInventoryCounts.cs",
      risk: "Safe",
      severity: "Warning",
      operations: [],
    },
  ],
  runtimes: [
    { name: "dotnet", baseVersion: "9.0", headVersion: "10.0" },
    { name: "node", baseVersion: "22", headVersion: "24" },
    { name: "postgres", baseVersion: null, headVersion: "17" },
  ],
  dependencies: [
    dependency("Npm", "lodash", "Upgraded", "4.17.19", "4.17.20", false, [
      "CVE-2026-1043",
    ]),
    dependency("Npm", "react", "Upgraded", "18.3.1", "19.1.0", true),
    dependency("Npm", "vite", "Upgraded", "6.4.0", "8.0.1", true),
    dependency("Npm", "typescript", "Upgraded", "5.9.2", "7.0.0", true),
    dependency("Npm", "zod", "Upgraded", "3.25.0", "4.1.0", true),
    dependency("Npm", "moment", "Removed", "2.30.1", null),
    dependency("Npm", "axios", "Upgraded", "1.12.0", "1.13.2"),
    dependency("NuGet", "Npgsql", "Upgraded", "9.0.3", "10.0.0", true),
    dependency("NuGet", "Serilog", "Upgraded", "4.2.0", "4.3.0"),
    dependency("NuGet", "QuestPDF", "Added", null, "2026.9.1"),
    dependency("GitHubActions", "actions/setup-node", "Added", null, "v5"),
    dependency(
      "GitHubActions",
      "actions/checkout",
      "Upgraded",
      "v4",
      "v5",
      true,
    ),
  ],
  commits: [
    {
      category: "Feature",
      noteTitle: "Ajouter l'onglet Déploiements au détail projet",
    },
    {
      category: "Feature",
      noteTitle: "Export Excel des dépendances vulnérables",
    },
    { category: "Feature", noteTitle: "Comparer deux références du dépôt" },
    {
      category: "Fix",
      noteTitle: "Corriger le calcul du score avec des runtimes EOL",
    },
    { category: "Fix", noteTitle: "Empêcher le doublon de tickets à l'import" },
    {
      category: "Fix",
      noteTitle: "Rétablir le refresh silencieux après expiration",
    },
    { category: "Maintenance", noteTitle: "Montée de version des dépendances" },
    { category: "Maintenance", noteTitle: "Migrer vers .NET 10" },
    { category: "Maintenance", noteTitle: "Nettoyer les migrations obsolètes" },
  ],
};
