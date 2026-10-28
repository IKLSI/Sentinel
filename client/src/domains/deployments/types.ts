import type { components } from "@/types/api.gen";

export type ReleaseRefs = components["schemas"]["ReleaseRefsDto"];

export type ReleaseComparison = components["schemas"]["ReleaseComparisonDto"];

export type DependencyChange = components["schemas"]["DependencyChangeDto"];

export type MigrationChange = components["schemas"]["MigrationChangeDto"];

export type ConfigurationChange =
  components["schemas"]["ConfigurationChangeDto"];

export type RuntimeChange = components["schemas"]["RuntimeChangeDto"];
