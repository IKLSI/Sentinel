import React from "react";
import Box from "@mui/material/Box";
import { RuntimeDto } from "@/features/techHealth/api/projects";

export interface TabDef {
  icon: React.ReactNode;
  label: string;
  count: number;
  accentColor?: string;
}

export const DEP_STATUS: Record<
  string,
  { labelKey: string; variant: "green" | "blue" | "orange" | "red" | "gray" }
> = {
  UpToDate: { labelKey: "tech_health.dep_status.up_to_date", variant: "green" },
  MinorUpdate: {
    labelKey: "tech_health.dep_status.minor_update",
    variant: "blue",
  },
  MajorUpdate: {
    labelKey: "tech_health.dep_status.major_update",
    variant: "orange",
  },
  EOL: { labelKey: "tech_health.dep_status.eol", variant: "red" },
  Vulnerable: { labelKey: "tech_health.dep_status.vulnerable", variant: "red" },
};

export const SEV_CONFIG: Record<
  string,
  {
    labelKey: string;
    variant: "red" | "orange" | "blue" | "gray";
    color: string;
    bg: string;
  }
> = {
  Critical: {
    labelKey: "tech_health.severity.critical",
    variant: "red",
    color: "var(--red)",
    bg: "var(--red-subtle)",
  },
  High: {
    labelKey: "tech_health.severity.high",
    variant: "orange",
    color: "var(--orange)",
    bg: "var(--orange-subtle)",
  },
  Medium: {
    labelKey: "tech_health.severity.medium",
    variant: "blue",
    color: "var(--yellow)",
    bg: "var(--yellow-subtle)",
  },
  Low: {
    labelKey: "tech_health.severity.low",
    variant: "gray",
    color: "var(--green)",
    bg: "var(--green-subtle)",
  },
};

export const EOL_COLOR: Record<
  string,
  { text: string; stripe: string; border: string }
> = {
  eol: {
    text: "var(--red)",
    stripe: "var(--red)",
    border: "rgba(239,68,68,0.3)",
  },
  danger: {
    text: "var(--orange)",
    stripe: "var(--orange)",
    border: "rgba(249,115,22,0.25)",
  },
  warn: {
    text: "var(--yellow)",
    stripe: "var(--yellow)",
    border: "rgba(234,179,8,0.25)",
  },
  ok: {
    text: "var(--green)",
    stripe: "var(--accent)",
    border: "var(--border)",
  },
};

export function getRuntimeUrgency(r: RuntimeDto): keyof typeof EOL_COLOR {
  if (!r.eolDate) return r.isEol ? "eol" : "ok";
  const days = Math.round(
    (new Date(r.eolDate).getTime() - Date.now()) / 86400000,
  );
  if (days < 0) return "eol";
  if (days < 90) return "danger";
  if (days < 180) return "warn";
  return "ok";
}

export function getDaysLabel(
  r: RuntimeDto,
  t: (key: string, vars?: Record<string, string | number>) => string,
): string {
  if (!r.eolDate) return r.isEol ? t("tech_health.runtime.expired") : "—";
  const days = Math.round(
    (new Date(r.eolDate).getTime() - Date.now()) / 86400000,
  );
  if (days < 0)
    return t("tech_health.runtime.expired_since", { days: Math.abs(days) });
  return t("tech_health.runtime.days_remaining", { days });
}

export const TH: React.FC<{ children: React.ReactNode; width?: string }> = ({
  children,
  width,
}) => (
  <Box
    component="th"
    sx={{
      fontFamily: "var(--font-mono)",
      fontSize: "10px",
      fontWeight: 700,
      letterSpacing: "0.08em",
      textTransform: "uppercase",
      color: "var(--muted)",
      textAlign: "left",
      padding: "10px 16px",
      background: "var(--s2)",
      borderBottom: "1px solid var(--border)",
      whiteSpace: "nowrap",
      width: width ?? "auto",
      position: "sticky",
      top: 0,
      zIndex: 1,
    }}
  >
    {children}
  </Box>
);

export const TD: React.FC<{
  children: React.ReactNode;
  mono?: boolean;
  muted?: boolean;
}> = ({ children, mono, muted }) => (
  <Box
    component="td"
    sx={{
      padding: "11px 16px",
      borderBottom: "1px solid var(--border)",
      fontSize: "13px",
      fontFamily: mono ? "var(--font-mono)" : "inherit",
      color: muted ? "var(--muted2)" : "var(--text)",
      verticalAlign: "middle",
    }}
  >
    {children}
  </Box>
);

export const TR: React.FC<{ children: React.ReactNode; accent?: string }> = ({
  children,
}) => (
  <Box
    component="tr"
    sx={{
      "&:last-child td": { borderBottom: "none" },
    }}
  >
    {children}
  </Box>
);
