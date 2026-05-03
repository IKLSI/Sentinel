import React from "react";
import Box from "@mui/material/Box";
import Tooltip from "@mui/material/Tooltip";
import { format } from "date-fns";

export const WORK_HOURS_TARGET = 7 * 60;

const PROJECT_PALETTE = [
  "var(--accent)",
  "var(--purple)",
  "var(--cyan)",
  "var(--green)",
  "var(--yellow)",
  "var(--red)",
  "var(--accent2)",
  "var(--cyan)",
  "var(--blue)",
  "var(--orange)",
];

export const getProjectColor = (name: string): string => {
  let hash = 0;
  for (let i = 0; i < name.length; i++)
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return PROJECT_PALETTE[Math.abs(hash) % PROJECT_PALETTE.length];
};

export const getUserAvatar = () => ({
  bg: "linear-gradient(135deg,#f6ced5,#eaa8b6)",
  text: "#8b1c38",
});

export const getCurrentUserAvatar = () => ({
  bg: "linear-gradient(135deg,color-mix(in srgb, var(--blue) 14%, white), color-mix(in srgb, var(--blue) 26%, white))",
  text: "var(--blue)",
});

export const getUserInitials = (name: string) => {
  const parts = name.trim().split(" ");
  if (parts.length >= 2)
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
};

export const formatDuration = (minutes: number) => {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (m === 0) return `${h}h`;
  return `${h}h${m.toString().padStart(2, "0")}`;
};

export const parseDateLocal = (dateStr: string) => {
  const [y, mo, d] = dateStr.split("-").map(Number);
  return new Date(y, mo - 1, d);
};

export type FormState = {
  date: string;
  durationMinutes: number;
  title: string;
  description: string;
  techProjectId: string;
  ticketId: string;
};

export const emptyForm = (date?: string): FormState => ({
  date: date ?? format(new Date(), "yyyy-MM-dd"),
  durationMinutes: 0,
  title: "",
  description: "",
  techProjectId: "",
  ticketId: "",
});

export const inputSx = {
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
  boxSizing: "border-box" as const,
};

export const FormField: React.FC<{
  label: React.ReactNode;
  labelSuffix?: React.ReactNode;
  children: React.ReactNode;
}> = ({ label, labelSuffix, children }) => (
  <Box>
    <Box sx={{ display: "flex", alignItems: "center", gap: "5px", mb: "5px" }}>
      <Box
        component="label"
        sx={{
          fontSize: "11px",
          fontWeight: 600,
          color: "var(--muted2)",
          letterSpacing: "0.04em",
        }}
      >
        {label}
      </Box>
      {labelSuffix}
    </Box>
    {children}
  </Box>
);

const getHoverIconColor = (hoverBg?: string) => {
  if (!hoverBg) return "var(--text)";

  const match = hoverBg.match(/var\(--[a-z0-9-]+\)|#[0-9a-fA-F]{3,8}/);
  return match?.[0] ?? "var(--text)";
};

export const IconNavBtn: React.FC<{
  onClick: (e: React.MouseEvent<HTMLButtonElement>) => void;
  disabled?: boolean;
  title?: string;
  hoverBg?: string;
  hoverColor?: string;
  children: React.ReactNode;
}> = ({ onClick, disabled, title, hoverBg, hoverColor, children }) => (
  <Tooltip
    title={title ?? ""}
    arrow
    placement="top"
    enterDelay={0}
    enterNextDelay={0}
    disableHoverListener={!title}
  >
    <Box component="span" sx={{ display: "inline-flex" }}>
      <Box
        component="button"
        onClick={onClick}
        disabled={disabled}
        sx={{
          background: "transparent",
          border: "none",
          borderRadius: 'var(--r-sm)',
          width: "26px",
          height: "26px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: disabled ? "not-allowed" : "pointer",
          color: disabled ? "var(--border2)" : "var(--muted2)",
          fontFamily: "var(--font-ui)",
          transition: "color 0.12s",
          ...(!disabled
            ? { "&:hover": { color: hoverColor ?? getHoverIconColor(hoverBg) } }
            : {}),
        }}
      >
        {children}
      </Box>
    </Box>
  </Tooltip>
);
