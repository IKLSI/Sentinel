import type { components } from "@/types/api.gen";

export type ScoringModel = components["schemas"]["ScoringModelDto"];

export interface PublicScanRequest {
  repositoryUrl: string;
}

export interface PublicScanResponse {
  grade: string;
  score: number;
  dependencyCount: number;
  vulnerableDependencyCount: number;
  criticalCount: number;
  highCount: number;
  eolRuntimeCount: number;
}
