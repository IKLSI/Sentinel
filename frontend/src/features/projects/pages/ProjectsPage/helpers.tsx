import type React from "react";
import Box from "@mui/material/Box";
import { HealthGrade } from "@/types/enums";
import DangerousOutlined from "@mui/icons-material/DangerousOutlined";
import ReportOutlined from "@mui/icons-material/ReportOutlined";
import TrendingDownOutlined from "@mui/icons-material/TrendingDownOutlined";
import LockOpenOutlined from "@mui/icons-material/LockOpenOutlined";
import ThumbUpAltOutlined from "@mui/icons-material/ThumbUpAltOutlined";
import WorkspacePremiumOutlined from "@mui/icons-material/WorkspacePremiumOutlined";
import RemoveCircleOutlineOutlined from "@mui/icons-material/RemoveCircleOutlineOutlined";
import type { SvgIconComponent } from "@mui/icons-material";
import type { ProjectDto } from "@/features/techHealth/api/projects";

export const UNTRACKED_SECTION = "NONE" as const;

export type GradeKey = HealthGrade;
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

export const isUntracked = (project: ProjectDto): boolean =>
  project.totalDependencies === 0;

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

export const HeadCell: React.FC<{
  children?: React.ReactNode;
  align?: "left" | "center" | "right";
  col?: string;
  sort?: ProjectSortState | null;
  onToggleSort?: (col: string) => void;
}> = ({ children, align = "left", col, sort, onToggleSort }) => {
  const sortable = !!col && !!onToggleSort;
  const isActive = sortable && sort?.col === col;
  return (
    <Box
      component="th"
      onClick={() => {
        if (sortable && col) onToggleSort?.(col);
      }}
      sx={{
        padding: "9px 12px",
        borderBottom: "1px solid var(--border)",
        background: "var(--s2)",
        fontFamily: "var(--font-mono)",
        fontSize: "10px",
        fontWeight: 700,
        letterSpacing: "0.08em",
        textTransform: "uppercase",
        color: isActive ? "var(--accent)" : "var(--muted2)",
        textAlign: align,
        whiteSpace: "nowrap",
        cursor: sortable ? "pointer" : "default",
        userSelect: "none",
        transition: "color 0.12s",
        "&:hover": sortable ? { color: "var(--text-secondary)" } : {},
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: align === "center" ? "center" : "flex-start",
          gap: "5px",
        }}
      >
        {children}
        {isActive && (
          <Box
            sx={{
              fontSize: "12px",
              color: "var(--accent)",
              lineHeight: 1,
              display: "flex",
              alignItems: "center",
            }}
          >
            {sort?.dir === "asc" ? "↑" : "↓"}
          </Box>
        )}
      </Box>
    </Box>
  );
};
