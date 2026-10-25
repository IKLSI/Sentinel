import { HealthGrade, SortDirection } from "@/enums";
import { GRADE_TONES, NO_GRADE_TONE } from "@/constants/grades";
import DangerousOutlined from "@mui/icons-material/DangerousOutlined";
import ReportOutlined from "@mui/icons-material/ReportOutlined";
import TrendingDownOutlined from "@mui/icons-material/TrendingDownOutlined";
import LockOpenOutlined from "@mui/icons-material/LockOpenOutlined";
import ThumbUpAltOutlined from "@mui/icons-material/ThumbUpAltOutlined";
import WorkspacePremiumOutlined from "@mui/icons-material/WorkspacePremiumOutlined";
import RemoveCircleOutlineOutlined from "@mui/icons-material/RemoveCircleOutlineOutlined";
import type { SvgIconComponent } from "@mui/icons-material";
import type { ProjectSummary } from "@/domains/projects/types";
import { isCovered } from "@/formatters/coverage";
import type { SortState } from "@/hooks/useSortState";

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
  F: { iconColor: GRADE_TONES.F.color, Icon: DangerousOutlined },
  E: { iconColor: GRADE_TONES.E.color, Icon: ReportOutlined },
  D: { iconColor: GRADE_TONES.D.color, Icon: TrendingDownOutlined },
  C: { iconColor: GRADE_TONES.C.color, Icon: LockOpenOutlined },
  B: { iconColor: GRADE_TONES.B.color, Icon: ThumbUpAltOutlined },
  A: { iconColor: GRADE_TONES.A.color, Icon: WorkspacePremiumOutlined },
  [UNTRACKED_SECTION]: {
    iconColor: NO_GRADE_TONE.color,
    Icon: RemoveCircleOutlineOutlined,
  },
};

export const isUntracked = (project: ProjectSummary): boolean =>
  !isCovered(project);

export const getGrade = (grade: string | null | undefined): SectionKey => {
  if (
    grade === HealthGrade.A ||
    grade === HealthGrade.B ||
    grade === HealthGrade.C ||
    grade === HealthGrade.D ||
    grade === HealthGrade.E ||
    grade === HealthGrade.F
  )
    return grade;
  return UNTRACKED_SECTION;
};

export const sortProjects = (
  items: ProjectSummary[],
  sort: SortState<string>,
): ProjectSummary[] => {
  const mul = sort.dir === SortDirection.Asc ? 1 : -1;
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
      case "score":
        return (
          mul * ((a.healthScore ?? -1) - (b.healthScore ?? -1)) ||
          a.name.localeCompare(b.name)
        );
      case "tickets":
        return mul * ((a.totalTickets ?? 0) - (b.totalTickets ?? 0));
      default:
        return 0;
    }
  });
};
