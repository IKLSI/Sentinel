export const UserRole = {
  Admin: "Admin",
  Developer: "Developer",
} as const;
export type UserRole = (typeof UserRole)[keyof typeof UserRole];

export const Theme = {
  Dark: "dark",
  Light: "light",
} as const;
export type Theme = (typeof Theme)[keyof typeof Theme];

export const Language = {
  Fr: "fr-FR",
  En: "en-US",
} as const;
export type Language = (typeof Language)[keyof typeof Language];

export const TicketPriority = {
  Critical: "critical",
  High: "high",
  Medium: "medium",
  Low: "low",
} as const;
export type TicketPriority =
  (typeof TicketPriority)[keyof typeof TicketPriority];

export const TicketType = {
  Bug: "bug",
  Feature: "feature",
  Security: "security",
  Performance: "performance",
  Maintenance: "maintenance",
  Question: "question",
} as const;
export type TicketType = (typeof TicketType)[keyof typeof TicketType];

export const HealthGrade = {
  A: "A",
  B: "B",
  C: "C",
  D: "D",
  E: "E",
  F: "F",
} as const;
export type HealthGrade = (typeof HealthGrade)[keyof typeof HealthGrade];

export const ScanCoverage = {
  NotScanned: "NotScanned",
  Failed: "Failed",
  NoManifest: "NoManifest",
  NoDependencies: "NoDependencies",
  Covered: "Covered",
} as const;
export type ScanCoverage = (typeof ScanCoverage)[keyof typeof ScanCoverage];

export const Provider = {
  GitHub: "GitHub",
  GitLab: "GitLab",
} as const;
export type Provider = (typeof Provider)[keyof typeof Provider];

export const DependencyStatus = {
  UpToDate: "UpToDate",
  MinorUpdate: "MinorUpdate",
  MajorUpdate: "MajorUpdate",
  EOL: "EOL",
  Vulnerable: "Vulnerable",
} as const;
export type DependencyStatus =
  (typeof DependencyStatus)[keyof typeof DependencyStatus];

export const VulnerabilitySeverity = {
  Critical: "Critical",
  High: "High",
  Medium: "Medium",
  Low: "Low",
} as const;
export type VulnerabilitySeverity =
  (typeof VulnerabilitySeverity)[keyof typeof VulnerabilitySeverity];

export const DependencyType = {
  Prod: "Prod",
  Dev: "Dev",
} as const;
export type DependencyType =
  (typeof DependencyType)[keyof typeof DependencyType];

export const RuntimeEolStatus = {
  Eol: "eol",
  Danger: "danger",
  Warn: "warn",
  Ok: "ok",
} as const;
export type RuntimeEolStatus =
  (typeof RuntimeEolStatus)[keyof typeof RuntimeEolStatus];

export const JobState = {
  Succeeded: "Succeeded",
  Failed: "Failed",
  Processing: "Processing",
  Enqueued: "Enqueued",
} as const;
export type JobState = (typeof JobState)[keyof typeof JobState];

export const ScanFrequency = {
  Daily: "Daily",
  Weekly: "Weekly",
  Monthly: "Monthly",
  Manual: "Manual",
} as const;
export type ScanFrequency = (typeof ScanFrequency)[keyof typeof ScanFrequency];

export const SortDirection = {
  Asc: "asc",
  Desc: "desc",
} as const;
export type SortDirection = (typeof SortDirection)[keyof typeof SortDirection];

export const SettingsTab = {
  Jobs: "jobs",
  Billing: "billing",
  ApiKeys: "api-keys",
} as const;
export type SettingsTab = (typeof SettingsTab)[keyof typeof SettingsTab];

export const ToastSeverity = {
  Success: "success",
  Error: "error",
  Warning: "warning",
  Info: "info",
} as const;
export type ToastSeverity = (typeof ToastSeverity)[keyof typeof ToastSeverity];
