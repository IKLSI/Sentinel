import type { components } from "@/types/api.gen";

export type Project = components["schemas"]["ProjectDto"];

export type Dependency = components["schemas"]["DependencyDto"];

export type Runtime = components["schemas"]["RuntimeDto"];

export type Vulnerability = components["schemas"]["VulnerabilityDto"];

export type AvailableRepos = components["schemas"]["AvailableReposResponse"];

export type CreateProject = components["schemas"]["CreateProjectDto"];

export type UpdateProject = components["schemas"]["UpdateProjectDto"];

export type ProjectScanFrequency =
  components["schemas"]["ProjectScanFrequencyDto"];
