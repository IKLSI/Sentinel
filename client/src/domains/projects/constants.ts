export const PROJECTS_QUERY_KEY = ["projects"] as const;

export const AVAILABLE_REPOS_QUERY_KEY = ["available-repos"] as const;

export const projectQueryKey = (id: string) => ["project", id] as const;

export const PROJECTS_EXPORT_FALLBACK_FILE = "techhealth.xlsx";

export const SBOM_FALLBACK_FILE = "sbom.json";

export const COMPLIANCE_REPORT_FALLBACK_FILE = "compliance-report.pdf";

export const SBOM_FORMAT = {
  CycloneDx: "cyclonedx",
  Spdx: "spdx",
} as const;

export type SbomFormat = (typeof SBOM_FORMAT)[keyof typeof SBOM_FORMAT];
