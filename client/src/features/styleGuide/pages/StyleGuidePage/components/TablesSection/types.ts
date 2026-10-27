import type { SortDirection } from "@/components/ui/common/table/VirtualTable/TableCells";

export interface SampleProject {
  id: string;
  name: string;
  repository: string;
  score: number;
  grade: string;
  critical: number;
  total: number;
  tickets: number;
}

export type ProjectSortKey = Exclude<
  keyof SampleProject,
  "id" | "repository" | "grade"
>;

export interface ProjectSort {
  key: ProjectSortKey;
  direction: SortDirection;
}
