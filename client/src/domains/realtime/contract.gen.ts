/**
 * Fichier généré automatiquement par "pnpm generate:realtime".
 * Source : server/src/Domain/Constants/Realtime{Constants,Resources}.cs
 * Ne pas modifier à la main.
 */

export const REALTIME_HUB_PATH = "/hubs/sync";

export const REALTIME_INVALIDATE_METHOD = "invalidate";

export const REALTIME_RESOURCES = {
  Projects: "projects",
  Project: "project",
  Tickets: "tickets",
  Ticket: "ticket",
  Jobs: "jobs",
  Users: "users",
  ApiKeys: "apiKeys",
  Organization: "organization",
  Integrations: "integrations",
} as const;

export type RealtimeResource =
  (typeof REALTIME_RESOURCES)[keyof typeof REALTIME_RESOURCES];
