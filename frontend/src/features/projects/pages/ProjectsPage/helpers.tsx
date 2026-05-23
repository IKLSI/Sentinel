import React from "react";
import Box from "@mui/material/Box";
import DangerousOutlined from "@mui/icons-material/DangerousOutlined";
import ReportOutlined from "@mui/icons-material/ReportOutlined";
import TrendingDownOutlined from "@mui/icons-material/TrendingDownOutlined";
import LockOpenOutlined from "@mui/icons-material/LockOpenOutlined";
import ThumbUpAltOutlined from "@mui/icons-material/ThumbUpAltOutlined";
import WorkspacePremiumOutlined from "@mui/icons-material/WorkspacePremiumOutlined";
import type { SvgIconComponent } from "@mui/icons-material";

export type GradeKey = "F" | "E" | "D" | "C" | "B" | "A";

export const GRADE_ORDER: GradeKey[] = ["F", "E", "D", "C", "B", "A"];

export const GRADE_VISUAL: Record<
  GradeKey,
  { iconColor: string; Icon: SvgIconComponent }
> = {
  F: { iconColor: "var(--red)", Icon: DangerousOutlined },
  E: { iconColor: "var(--orange)", Icon: ReportOutlined },
  D: { iconColor: "var(--yellow)", Icon: TrendingDownOutlined },
  C: { iconColor: "color-mix(in srgb, var(--yellow) 70%, var(--orange) 30%)", Icon: LockOpenOutlined },
  B: { iconColor: "var(--accent)", Icon: ThumbUpAltOutlined },
  A: { iconColor: "var(--green)", Icon: WorkspacePremiumOutlined },
};

export const getGrade = (grade: string | null | undefined): GradeKey => {
  if (
    grade === "A" ||
    grade === "B" ||
    grade === "C" ||
    grade === "D" ||
    grade === "E" ||
    grade === "F"
  )
    return grade;
  return "F";
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

export const ModalField: React.FC<{
  label: React.ReactNode;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  autoFocus?: boolean;
}> = ({ label, value, onChange, placeholder, autoFocus }) => (
  <Box>
    <Box
      component="label"
      sx={{
        display: "block",
        fontSize: "11px",
        fontWeight: 600,
        mb: "5px",
        color: "var(--muted2)",
        letterSpacing: "0.04em",
      }}
    >
      {label}
    </Box>
    <Box
      component="input"
      autoFocus={autoFocus}
      type="text"
      placeholder={placeholder}
      value={value}
      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
        onChange(e.target.value)
      }
      sx={{
        background: "var(--s1)",
        border: "1px solid var(--border)",
        borderRadius: "var(--r)",
        px: "12px",
        py: "8px",
        fontSize: "13px",
        color: "var(--text)",
        width: "100%",
        outline: "none",
        fontFamily: "inherit",
      }}
    />
  </Box>
);
