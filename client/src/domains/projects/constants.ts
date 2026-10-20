export const projectKeys = {
  all: ["projects"] as const,
  list: () => [...projectKeys.all, "list"] as const,
  options: () => [...projectKeys.all, "options"] as const,
  availableRepos: () => [...projectKeys.all, "available-repos"] as const,
  details: () => [...projectKeys.all, "detail"] as const,
  detail: (id: string) => [...projectKeys.details(), id] as const,
  repositoryOptions: (id: string, branch: string | null) =>
    [...projectKeys.all, "repository-options", id, branch] as const,
};

export const PROJECTS_EXPORT_FALLBACK_FILE = "techhealth.xlsx";

export const SBOM_FALLBACK_FILE = "sbom.json";

export const COMPLIANCE_REPORT_FALLBACK_FILE = "compliance-report.pdf";

export const SBOM_FORMAT = {
  CycloneDx: "cyclonedx",
  Spdx: "spdx",
  Vex: "vex",
} as const;

export type SbomFormat = (typeof SBOM_FORMAT)[keyof typeof SBOM_FORMAT];
