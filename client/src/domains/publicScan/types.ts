import type { components } from "@/types/api.gen";

export type ScoringModel = components["schemas"]["ScoringModelDto"];

export type ScoringExample = components["schemas"]["ScoringExampleDto"];

export type ScoringExampleLine = components["schemas"]["ScoringExampleLineDto"];

export type RuntimeLifecycles = components["schemas"]["RuntimeLifecyclesDto"];

export type RuntimeLifecycleItem =
  components["schemas"]["RuntimeLifecycleItemDto"];

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
