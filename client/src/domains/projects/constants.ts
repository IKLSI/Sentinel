export const PROJECTS_QUERY_KEY = ["projects"] as const;

export const AVAILABLE_REPOS_QUERY_KEY = ["available-repos"] as const;

export const PROJECT_OPTIONS_QUERY_KEY = ["project-options"] as const;

export const PROJECT_DETAIL_QUERY_KEY = ["project"] as const;

export const projectRepositoryOptionsQueryKey = (
  id: string,
  branch: string | null,
) => ["project-repository-options", id, branch] as const;

export const projectQueryKey = (id: string) =>
  [...PROJECT_DETAIL_QUERY_KEY, id] as const;

export const PROJECTS_EXPORT_FALLBACK_FILE = "techhealth.xlsx";

export const SBOM_FALLBACK_FILE = "sbom.json";

export const COMPLIANCE_REPORT_FALLBACK_FILE = "compliance-report.pdf";

export const SBOM_FORMAT = {
  CycloneDx: "cyclonedx",
  Spdx: "spdx",
  Vex: "vex",
} as const;

export type SbomFormat = (typeof SBOM_FORMAT)[keyof typeof SBOM_FORMAT];
