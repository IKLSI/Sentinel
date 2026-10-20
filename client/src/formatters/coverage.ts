import type { ProjectSummary } from "@/domains/projects/types";
import { ScanCoverage } from "@/enums";

export const GRADE_NOT_AVAILABLE = "N/A";

export const isCovered = (project: Pick<ProjectSummary, "coverage">): boolean =>
  project.coverage === ScanCoverage.Covered;
