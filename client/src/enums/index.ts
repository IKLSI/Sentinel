export const UserRole = {
  Admin: "Admin",
  Developer: "Developer",
} as const;
export type UserRole = (typeof UserRole)[keyof typeof UserRole];

export const UserAccessStatus = {
  Active: "Active",
  Suspended: "Suspended",
} as const;
export type UserAccessStatus =
  (typeof UserAccessStatus)[keyof typeof UserAccessStatus];

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

export const TicketStatus = {
  New: "new",
  InProgress: "inprogress",
  Testing: "testing",
  Resolved: "resolved",
  Closed: "closed",
} as const;
export type TicketStatus = (typeof TicketStatus)[keyof typeof TicketStatus];

export const TicketType = {
  Bug: "bug",
  Feature: "feature",
  Security: "security",
  Performance: "performance",
  Maintenance: "maintenance",
  Question: "question",
} as const;
export type TicketType = (typeof TicketType)[keyof typeof TicketType];

export const FindingKind = {
  Vulnerability: "Vulnerability",
  OutdatedDependency: "OutdatedDependency",
  EolRuntime: "EolRuntime",
} as const;
export type FindingKind = (typeof FindingKind)[keyof typeof FindingKind];

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

export const RiskPriority = {
  Urgent: "Urgent",
  High: "High",
  Moderate: "Moderate",
  Low: "Low",
} as const;
export type RiskPriority = (typeof RiskPriority)[keyof typeof RiskPriority];

export const SuppressionReason = {
  NotAffected: "NotAffected",
  FalsePositive: "FalsePositive",
  WillNotFix: "WillNotFix",
  RiskAccepted: "RiskAccepted",
} as const;
export type SuppressionReason =
  (typeof SuppressionReason)[keyof typeof SuppressionReason];

export const RuntimeEolStatus = {
  Eol: "Eol",
  Danger: "Danger",
  Warn: "Warn",
  Ok: "Ok",
  Unknown: "Unknown",
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
  Asc: "Asc",
  Desc: "Desc",
} as const;
export type SortDirection = (typeof SortDirection)[keyof typeof SortDirection];

export const UserSortField = {
  Member: "Member",
  Role: "Role",
  Status: "Status",
  LastLogin: "LastLogin",
} as const;
export type UserSortField = (typeof UserSortField)[keyof typeof UserSortField];

export const TicketSortField = {
  Title: "Title",
  Priority: "Priority",
  Status: "Status",
  Assignee: "Assignee",
  Comments: "Comments",
} as const;
export type TicketSortField =
  (typeof TicketSortField)[keyof typeof TicketSortField];

export const JobSortField = {
  Job: "Job",
  LastRun: "LastRun",
  Status: "Status",
  NextRun: "NextRun",
} as const;
export type JobSortField = (typeof JobSortField)[keyof typeof JobSortField];

export const ApiKeySortField = {
  Name: "Name",
  Prefix: "Prefix",
  CreatedBy: "CreatedBy",
  Created: "Created",
  Expires: "Expires",
  LastUsed: "LastUsed",
} as const;
export type ApiKeySortField =
  (typeof ApiKeySortField)[keyof typeof ApiKeySortField];

export const SettingsTab = {
  Jobs: "jobs",
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

export const ToastActionKind = {
  View: "view",
  Undo: "undo",
} as const;
export type ToastActionKind =
  (typeof ToastActionKind)[keyof typeof ToastActionKind];

export const ReleaseItemSeverity = {
  Blocking: "Blocking",
  Warning: "Warning",
} as const;
export type ReleaseItemSeverity =
  (typeof ReleaseItemSeverity)[keyof typeof ReleaseItemSeverity];

export const ReleaseCommitCategory = {
  Feature: "Feature",
  Fix: "Fix",
  Maintenance: "Maintenance",
} as const;
export type ReleaseCommitCategory =
  (typeof ReleaseCommitCategory)[keyof typeof ReleaseCommitCategory];
