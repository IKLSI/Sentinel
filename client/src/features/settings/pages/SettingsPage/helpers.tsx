import type React from "react";
import Box from "@mui/material/Box";
import { SettingsTab } from "@/enums";
import { CARD_SX } from "@/helpers/cardSx";

export { CARD_SX };

export type Tab = SettingsTab;
export { SettingsTab };

export const SEVERITY_VALUES = ["Critical", "High", "Medium", "Low"] as const;

export const inp = {
  width: "100%",
  display: "block",
  boxSizing: "border-box",
  background: "var(--s2)",
  border: "1px solid var(--border)",
  borderRadius: "var(--r-sm)",
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
