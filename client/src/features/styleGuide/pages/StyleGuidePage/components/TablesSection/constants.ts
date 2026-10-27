import type {
  ProjectSortKey,
  SampleProject,
} from "@/features/styleGuide/pages/StyleGuidePage/components/TablesSection/types";

const project = (
  name: string,
  repository: string,
  [score, critical, total, tickets]: readonly number[],
  grade: string,
): SampleProject => ({
  id: name,
  name,
  repository,
  score,
  grade,
  critical,
  total,
  tickets,
});

export const SAMPLE_PROJECTS: readonly SampleProject[] = [
  project("sentinel-api", "github.com/acme/sentinel-api", [82, 0, 4, 2], "B"),
  project(
    "sentinel-client",
    "github.com/acme/sentinel-client",
    [91, 0, 1, 0],
    "A",
  ),
  project(
    "billing-worker-legacy-monolith-migration",
    "gitlab.com/acme/platform/billing-worker-legacy-monolith-migration",
    [47, 3, 18, 5],
    "D",
  ),
  project("docs-site", "github.com/acme/docs-site", [68, 1, 7, 1], "C"),
];

const column = (
  key: ProjectSortKey,
  label: string,
  width: string,
  align: "left" | "center" = "center",
) => ({ key, labelKey: `projects.table.${label}`, width, align });

export const PROJECT_COLUMNS = [
  column("name", "project", "auto", "left"),
  column("score", "score", "90px"),
  column("critical", "critical", "100px"),
  column("total", "vulnerabilities", "80px"),
  column("tickets", "tickets", "90px"),
];

export const ACTIONS_COLUMN_WIDTH = "120px";

export const TABLE_MIN_WIDTH = "640px";
