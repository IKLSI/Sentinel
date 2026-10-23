import type { components } from "@/types/api.gen";

export type Project = components["schemas"]["ProjectDto"];

export type ProjectSummary = components["schemas"]["ProjectSummaryDto"];

export type ProjectOption = components["schemas"]["ProjectOptionDto"];

export type Dependency = components["schemas"]["DependencyDto"];

export type Runtime = components["schemas"]["RuntimeDto"];

export type Vulnerability = components["schemas"]["VulnerabilityDto"];

export type VulnerabilitySuppression = components["schemas"]["SuppressionDto"];

export type SuppressVulnerability =
  components["schemas"]["SuppressVulnerabilityDto"];

export type FindingTicket = components["schemas"]["FindingTicketDto"];

export type AvailableRepo = components["schemas"]["AvailableRepoDto"];

export type AvailableRepos = components["schemas"]["AvailableReposResponse"];

export type CreateProject = components["schemas"]["CreateProjectDto"];

export type UpdateProject = components["schemas"]["UpdateProjectDto"];

export type ProjectScanSettings =
  components["schemas"]["ProjectScanSettingsDto"];

export type ProjectRepositoryOptions =
  components["schemas"]["ProjectRepositoryOptionsDto"];

export type ProjectBadge = components["schemas"]["ProjectBadgeDto"];

export type Remediation = components["schemas"]["RemediationDto"];
