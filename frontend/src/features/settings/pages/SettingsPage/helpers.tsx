import React from "react";
import Box from "@mui/material/Box";
import { SettingsTab } from "@/types/enums";

export type Tab = SettingsTab;
export { SettingsTab };

export const TIMEZONE_VALUES = [
  "Europe/Paris",
  "Europe/London",
  "Europe/Berlin",
  "Europe/Madrid",
  "Europe/Rome",
  "Europe/Zurich",
  "America/New_York",
  "America/Chicago",
  "America/Los_Angeles",
  "America/Sao_Paulo",
  "Asia/Tokyo",
  "Asia/Shanghai",
  "Asia/Dubai",
  "Australia/Sydney",
  "UTC",
] as const;

export function getPageNumbers(
  page: number,
  totalPages: number,
): (number | "...")[] {
  if (totalPages <= 3)
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  const pages: (number | "...")[] = [1, 2];
  if (page > 3) pages.push("...");
  if (page > 2 && page < totalPages) pages.push(page);
  if (page < totalPages - 1) pages.push("...");
  if (!pages.includes(totalPages)) pages.push(totalPages);
  return pages;
}

export const navBtnSx = (disabled: boolean) => ({
  all: "unset" as const,
  cursor: disabled ? "default" : "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "6px",
  height: "30px",
  px: "10px",
  borderRadius: 'var(--r-sm)',
  fontSize: "12px",
  fontWeight: 600,
  color: disabled ? "var(--muted)" : "var(--text-secondary)",
  background: "var(--s2)",
  border: "1px solid var(--border)",
  opacity: disabled ? 0.35 : 1,
  pointerEvents: disabled ? "none" : "auto",
  transition: "background 0.12s, color 0.12s",
  ...(!disabled && {
    "&:hover": { background: "var(--s3)", color: "var(--text)" },
  }),
});

export const pageBtnSx = (active: boolean) => ({
  all: "unset" as const,
  cursor: active ? "default" : "pointer",
  minWidth: "30px",
  height: "30px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  borderRadius: 'var(--r-sm)',
  fontSize: "12px",
  fontWeight: active ? 700 : 500,
  color: active ? "var(--s1)" : "var(--text-secondary)",
  background: active ? "var(--accent)" : "transparent",
  boxShadow: active ? "0 2px 8px var(--accent-border)" : "none",
  transition: "background 0.12s, color 0.12s",
  ...(!active && {
    "&:hover": { background: "var(--s2)", color: "var(--text)" },
  }),
});

export const inp = {
  width: "100%",
  display: "block",
  boxSizing: "border-box",
  background: "var(--s2)",
  border: "1px solid var(--border)",
  borderRadius: 'var(--r-sm)',
  padding: "6px 10px",
  fontSize: "12px",
  color: "var(--text)",
  fontFamily: "inherit",
  outline: "none",
  transition: "border-color 0.15s, box-shadow 0.15s",
  "&:focus": {
    borderColor: "var(--accent-border)",
    boxShadow: "0 0 0 3px var(--accent-subtle)",
  },
} as const;

export const CARD_SX = {
  background: "var(--s1)",
  border: "1px solid var(--border)",
  borderRadius: 'var(--r-md)',
  overflow: "hidden",
} as const;

export function CardHeader({ label }: { label: string }) {
  return (
    <Box
      sx={{
        px: "16px",
        minHeight: "40px",
        display: "flex",
        alignItems: "center",
        borderBottom: "1px solid var(--border)",
        background: "var(--s2)",
      }}
    >
      <Box
        sx={{
          fontSize: "10px",
          fontWeight: 700,
          color: "var(--muted)",
          letterSpacing: "0.1em",
          textTransform: "uppercase",
        }}
      >
        {label}
      </Box>
    </Box>
  );
}

export function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <Box
      sx={{
        fontSize: "11px",
        fontWeight: 600,
        color: "var(--text-secondary)",
        mb: "5px",
        letterSpacing: "0.01em",
      }}
    >
      {children}
    </Box>
  );
}
