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
  bg: "linear-gradient(135deg,var(--prio-bg-1),var(--prio-bg-2))",
  text: "var(--prio-fg)",
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
  startTime: string;
  endTime: string;
  title: string;
  description: string;
  projectId: string;
  ticketId: string;
};

export const emptyForm = (date?: string, startTime?: string): FormState => {
  let endTime = "";
  if (startTime) {
    const [h, m] = startTime.split(":").map(Number);
    const total = h * 60 + m + 15;
    endTime = `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
  }
  return {
    date: date ?? format(new Date(), "yyyy-MM-dd"),
    durationMinutes: 0,
    startTime: startTime ?? "",
    endTime,
    title: "",
    description: "",
    projectId: "",
    ticketId: "",
  };
};

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
          border: "1.5px solid transparent",
          borderRadius: "var(--r-sm)",
          width: "28px",
          height: "28px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: disabled ? "not-allowed" : "pointer",
          color: disabled ? "var(--border2)" : "var(--muted2)",
          fontFamily: "var(--font-ui)",
          transition:
            "background 0.12s ease, border-color 0.12s ease, color 0.12s ease",
          ...(!disabled
            ? {
                "&:hover": {
                  background: hoverBg ?? "var(--accent-subtle)",
                  borderColor: "var(--accent-border)",
                  color: hoverColor ?? "var(--accent)",
                },
                "&:active": {
                  background:
                    "color-mix(in srgb, var(--accent) 18%, transparent)",
                },
              }
            : {}),
        }}
      >
        {children}
      </Box>
    </Box>
  </Tooltip>
);
