import type React from "react";
import type { Runtime } from "@/domains/projects/types";
import {
  type DependencyStatus,
  type VulnerabilitySeverity,
  RuntimeEolStatus,
} from "@/enums";

export interface TabDef {
  icon: React.ReactNode;
  label: string;
  count: number;
  accentColor?: string;
}

export const EMPTY_STATE_SX = {
  flex: 1,
  justifyContent: "center",
  background: "var(--s1)",
  border: "1px solid var(--border)",
  borderRadius: "var(--r)",
} as const;

export const DEP_STATUS: Record<
  DependencyStatus,
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
  VulnerabilitySeverity,
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
  RuntimeEolStatus,
  { text: string; stripe: string; border: string }
> = {
  eol: {
    text: "var(--red)",
    stripe: "var(--red)",
    border: "color-mix(in srgb, var(--red) 30%, transparent)",
  },
  danger: {
    text: "var(--orange)",
    stripe: "var(--orange)",
    border: "color-mix(in srgb, var(--orange) 25%, transparent)",
  },
  warn: {
    text: "var(--yellow)",
    stripe: "var(--yellow)",
    border: "color-mix(in srgb, var(--yellow) 25%, transparent)",
  },
  ok: {
    text: "var(--green)",
    stripe: "var(--accent)",
    border: "var(--border)",
  },
  unknown: {
    text: "var(--muted2)",
    stripe: "var(--border)",
    border: "var(--border)",
  },
};

export function getRuntimeUrgency(r: Runtime): RuntimeEolStatus {
  if (!r.eolDate) {
    if (r.isEol === null || r.isEol === undefined)
      return RuntimeEolStatus.Unknown;
    return r.isEol ? RuntimeEolStatus.Eol : RuntimeEolStatus.Ok;
  }
  const days = Math.round(
    (new Date(r.eolDate).getTime() - Date.now()) / 86400000,
  );
  if (days < 0) return RuntimeEolStatus.Eol;
  if (days < 90) return RuntimeEolStatus.Danger;
  if (days < 180) return RuntimeEolStatus.Warn;
  return RuntimeEolStatus.Ok;
}

export function getDaysLabel(
  r: Runtime,
  t: (key: string, vars?: Record<string, string | number>) => string,
): string {
  if (!r.eolDate) {
    if (r.isEol === null || r.isEol === undefined)
      return t("tech_health.runtime.not_assessed");
    return r.isEol
      ? t("tech_health.runtime.expired")
      : t("tech_health.runtime.supported");
  }
  const days = Math.round(
    (new Date(r.eolDate).getTime() - Date.now()) / 86400000,
  );
  if (days < 0)
    return t("tech_health.runtime.expired_since", { days: Math.abs(days) });
  return t("tech_health.runtime.days_remaining", { days });
}
