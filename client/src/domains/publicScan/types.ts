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
