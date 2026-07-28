import type { ProjectDto } from "@/features/techHealth/api/projects";
import { ScanCoverage } from "@/types/enums";

export const GRADE_NOT_AVAILABLE = "N/A";

const COVERAGE_REASON_KEYS: Record<ScanCoverage, string> = {
  [ScanCoverage.NotScanned]: "tech_health.coverage.not_scanned",
  [ScanCoverage.Failed]: "tech_health.coverage.failed",
  [ScanCoverage.NoManifest]: "tech_health.coverage.no_manifest",
  [ScanCoverage.NoDependencies]: "tech_health.coverage.no_dependencies",
  [ScanCoverage.Covered]: "",
};

export const isCovered = (project: ProjectDto): boolean =>
  project.coverage === ScanCoverage.Covered;

export const coverageReasonKey = (project: ProjectDto): string =>
  COVERAGE_REASON_KEYS[project.coverage] ??
  COVERAGE_REASON_KEYS[ScanCoverage.NotScanned];
