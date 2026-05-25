import React from "react";
import Box from "@mui/material/Box";
import { HealthGrade } from "@/types/enums";
import DangerousOutlined from "@mui/icons-material/DangerousOutlined";
import ReportOutlined from "@mui/icons-material/ReportOutlined";
import TrendingDownOutlined from "@mui/icons-material/TrendingDownOutlined";
import LockOpenOutlined from "@mui/icons-material/LockOpenOutlined";
import ThumbUpAltOutlined from "@mui/icons-material/ThumbUpAltOutlined";
import WorkspacePremiumOutlined from "@mui/icons-material/WorkspacePremiumOutlined";
import type { SvgIconComponent } from "@mui/icons-material";

export type GradeKey = HealthGrade;

export const GRADE_ORDER: HealthGrade[] = ["F", "E", "D", "C", "B", "A"];

export const GRADE_VISUAL: Record<
  HealthGrade,
  { iconColor: string; Icon: SvgIconComponent }
> = {
  F: { iconColor: "var(--red)", Icon: DangerousOutlined },
  E: { iconColor: "var(--orange)", Icon: ReportOutlined },
  D: { iconColor: "var(--yellow)", Icon: TrendingDownOutlined },
  C: { iconColor: "color-mix(in srgb, var(--yellow) 70%, var(--orange) 30%)", Icon: LockOpenOutlined },
  B: { iconColor: "var(--accent)", Icon: ThumbUpAltOutlined },
  A: { iconColor: "var(--green)", Icon: WorkspacePremiumOutlined },
};

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

export const HeadCell: React.FC<{
  children?: React.ReactNode;
  align?: "left" | "center" | "right";
}> = ({ children, align = "left" }) => (
  <Box
    component="th"
    sx={{
      padding: "9px 12px",
      borderBottom: "1px solid var(--border)",
      background: "var(--s2)",
      fontFamily: "var(--font-mono)",
      fontSize: "10px",
      fontWeight: 700,
      letterSpacing: "0.08em",
      textTransform: "uppercase",
      color: "var(--muted2)",
      textAlign: align,
      whiteSpace: "nowrap",
    }}
  >
    {children}
  </Box>
);
