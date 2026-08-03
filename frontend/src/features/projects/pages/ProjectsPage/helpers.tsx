import { HealthGrade } from "@/enums";
import DangerousOutlined from "@mui/icons-material/DangerousOutlined";
import ReportOutlined from "@mui/icons-material/ReportOutlined";
import TrendingDownOutlined from "@mui/icons-material/TrendingDownOutlined";
import LockOpenOutlined from "@mui/icons-material/LockOpenOutlined";
import ThumbUpAltOutlined from "@mui/icons-material/ThumbUpAltOutlined";
import WorkspacePremiumOutlined from "@mui/icons-material/WorkspacePremiumOutlined";
import RemoveCircleOutlineOutlined from "@mui/icons-material/RemoveCircleOutlineOutlined";
import type { SvgIconComponent } from "@mui/icons-material";
import type { Project } from "@/domains/projects/types";
import { isCovered } from "@/formatters/coverage";

export const UNTRACKED_SECTION = "NONE" as const;

export type SectionKey = HealthGrade | typeof UNTRACKED_SECTION;

export const SECTION_ORDER: SectionKey[] = [
  "F",
  "E",
  "D",
  "C",
  "B",
  "A",
  UNTRACKED_SECTION,
];

export const GRADE_VISUAL: Record<
  SectionKey,
  { iconColor: string; Icon: SvgIconComponent }
> = {
  F: { iconColor: "var(--red)", Icon: DangerousOutlined },
  E: { iconColor: "var(--orange)", Icon: ReportOutlined },
  D: { iconColor: "var(--yellow)", Icon: TrendingDownOutlined },
  C: {
    iconColor: "color-mix(in srgb, var(--yellow) 70%, var(--orange) 30%)",
    Icon: LockOpenOutlined,
  },
  B: { iconColor: "var(--accent)", Icon: ThumbUpAltOutlined },
  A: { iconColor: "var(--green)", Icon: WorkspacePremiumOutlined },
  [UNTRACKED_SECTION]: {
    iconColor: "var(--muted2)",
    Icon: RemoveCircleOutlineOutlined,
  },
};

export const isUntracked = (project: Project): boolean => !isCovered(project);

export const getGrade = (grade: string | null | undefined): HealthGrade => {
  if (
    grade === HealthGrade.A ||
    grade === HealthGrade.B ||
    grade === HealthGrade.C ||
    grade === HealthGrade.D ||
    grade === HealthGrade.E ||
    grade === HealthGrade.F
  )
    return grade;
  return HealthGrade.F;
};

export interface ProjectSortState {
  col: string;
  dir: "asc" | "desc";
}

export const sortProjects = (
  items: Project[],
  sort: ProjectSortState | null,
): Project[] => {
  if (!sort) return items;
  const mul = sort.dir === "asc" ? 1 : -1;
  return items.slice().sort((a, b) => {
    switch (sort.col) {
      case "name":
        return mul * a.name.localeCompare(b.name);
      case "vulnerabilities":
        return (
          mul *
            ((a.totalVulnerabilities ?? 0) - (b.totalVulnerabilities ?? 0)) ||
          (b.criticalVulnerabilities ?? 0) - (a.criticalVulnerabilities ?? 0)
        );
      case "critical":
        return (
          mul *
            ((a.criticalVulnerabilities ?? 0) -
              (b.criticalVulnerabilities ?? 0)) ||
          (b.totalVulnerabilities ?? 0) - (a.totalVulnerabilities ?? 0)
        );
      case "tickets":
        return mul * ((a.totalTickets ?? 0) - (b.totalTickets ?? 0));
      default:
        return 0;
    }
  });
};
