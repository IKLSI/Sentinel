import React from "react";
import Box from "@mui/material/Box";
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
  comment: string;
  techProjectId: string;
  ticketId: string;
};

export const emptyForm = (date?: string): FormState => ({
  date: date ?? format(new Date(), "yyyy-MM-dd"),
  durationMinutes: 0,
  comment: "",
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

export const IconNavBtn: React.FC<{
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}> = ({ onClick, disabled, children }) => (
  <Box
    component="button"
    onClick={onClick}
    disabled={disabled}
    sx={{
      background: "var(--s1)",
      border: "1px solid var(--border)",
      borderRadius: "6px",
      width: "28px",
      height: "28px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      cursor: disabled ? "not-allowed" : "pointer",
      color: disabled ? "var(--border2)" : "var(--muted2)",
      fontFamily: "var(--font-ui)",
      transition: "background 0.12s, color 0.12s",
      ...(!disabled
        ? { "&:hover": { background: "var(--s3)", color: "var(--text)" } }
        : {}),
    }}
  >
    {children}
  </Box>
);

export const RowActionBtn: React.FC<{
  icon: React.ReactNode;
  onClick: () => void;
  title: string;
  danger?: boolean;
}> = ({ icon, onClick, title, danger }) => (
  <Box
    component="button"
    title={title}
    onClick={onClick}
    sx={{
      background: "none",
      border: "none",
      cursor: "pointer",
      color: "var(--muted)",
      padding: "5px",
      borderRadius: "6px",
      display: "flex",
      alignItems: "center",
      fontFamily: "var(--font-ui)",
      transition: "color 0.12s, background 0.12s",
      "&:hover": {
        color: danger ? "var(--red)" : "var(--text)",
        background: danger ? "var(--red-subtle)" : "var(--s3)",
      },
    }}
  >
    {icon}
  </Box>
);
