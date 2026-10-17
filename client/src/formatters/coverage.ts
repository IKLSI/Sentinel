import type { ProjectSummary } from "@/domains/projects/types";
import { ScanCoverage } from "@/enums";

export const GRADE_NOT_AVAILABLE = "N/A";

const COVERAGE_REASON_KEYS: Record<ScanCoverage, string> = {
  [ScanCoverage.NotScanned]: "tech_health.coverage.not_scanned",
  [ScanCoverage.Failed]: "tech_health.coverage.failed",
  [ScanCoverage.NoManifest]: "tech_health.coverage.no_manifest",
  [ScanCoverage.NoDependencies]: "tech_health.coverage.no_dependencies",
  [ScanCoverage.Covered]: "",
};

export const isCovered = (project: Pick<ProjectSummary, "coverage">): boolean =>
  project.coverage === ScanCoverage.Covered;

export const coverageReasonKey = (
  project: Pick<ProjectSummary, "coverage">,
): string =>
  COVERAGE_REASON_KEYS[project.coverage as ScanCoverage] ??
  COVERAGE_REASON_KEYS[ScanCoverage.NotScanned];
