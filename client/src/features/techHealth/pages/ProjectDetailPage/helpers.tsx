import type React from "react";
import type { Runtime } from "@/domains/projects/types";
import {
  type DependencyStatus,
  type RiskPriority,
  type VulnerabilitySeverity,
  RuntimeEolStatus,
} from "@/enums";

export interface TabDef {
  icon: React.ReactNode;
  label: string;
}

export type StatusVariant = "green" | "blue" | "orange" | "red" | "gray";

export const GRID_ROW_HEIGHT = 44;

export const EMPTY_STATE_SX = {
  flex: 1,
  justifyContent: "center",
  background: "var(--s1)",
  border: "1px solid var(--border)",
  borderRadius: "var(--r)",
} as const;

export const DEP_STATUS: Record<
  DependencyStatus,
  { labelKey: string; variant: StatusVariant; weight: number }
> = {
  Vulnerable: {
    labelKey: "tech_health.dep_status.vulnerable",
    variant: "red",
    weight: 5,
  },
  EOL: {
    labelKey: "tech_health.dep_status.eol",
    variant: "orange",
    weight: 4,
  },
  MajorUpdate: {
    labelKey: "tech_health.dep_status.major_update",
    variant: "blue",
    weight: 3,
  },
  MinorUpdate: {
    labelKey: "tech_health.dep_status.minor_update",
    variant: "gray",
    weight: 2,
  },
  UpToDate: {
    labelKey: "tech_health.dep_status.up_to_date",
    variant: "green",
    weight: 1,
  },
};

export const SEV_CONFIG: Record<
  VulnerabilitySeverity,
  { labelKey: string; variant: StatusVariant; color: string; weight: number }
> = {
  Critical: {
    labelKey: "tech_health.severity.critical",
    variant: "red",
    color: "var(--red)",
    weight: 4,
  },
  High: {
    labelKey: "tech_health.severity.high",
    variant: "orange",
    color: "var(--orange)",
    weight: 3,
  },
  Medium: {
    labelKey: "tech_health.severity.medium",
    variant: "blue",
    color: "var(--yellow)",
    weight: 2,
  },
  Low: {
    labelKey: "tech_health.severity.low",
    variant: "gray",
    color: "var(--green)",
    weight: 1,
  },
};

export const RISK_CONFIG: Record<
  RiskPriority,
  { labelKey: string; color: string; weight: number }
> = {
  Urgent: {
    labelKey: "tech_health.risk.urgent",
    color: "var(--red)",
    weight: 4,
  },
  High: {
    labelKey: "tech_health.risk.high",
    color: "var(--orange)",
    weight: 3,
  },
  Moderate: {
    labelKey: "tech_health.risk.moderate",
    color: "var(--accent)",
    weight: 2,
  },
  Low: { labelKey: "tech_health.risk.low", color: "var(--muted2)", weight: 1 },
};

export const SEVERITY_REASON_LABEL_KEYS: Record<VulnerabilitySeverity, string> =
  {
    Critical: "tech_health.risk.reason.severity_critical",
    High: "tech_health.risk.reason.severity_high",
    Medium: "tech_health.risk.reason.severity_medium",
    Low: "tech_health.risk.reason.severity_low",
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
    stripe: "var(--green)",
    border: "var(--border)",
  },
  unknown: {
    text: "var(--muted2)",
    stripe: "var(--border2)",
    border: "var(--border)",
  },
};

export const RUNTIME_STATUS: Record<
  RuntimeEolStatus,
  { labelKey: string; variant: StatusVariant; weight: number }
> = {
  eol: {
    labelKey: "tech_health.runtime_status.eol",
    variant: "red",
    weight: 4,
  },
  danger: {
    labelKey: "tech_health.runtime_status.imminent",
    variant: "orange",
    weight: 3,
  },
  warn: {
    labelKey: "tech_health.runtime_status.soon",
    variant: "blue",
    weight: 2,
  },
  ok: {
    labelKey: "tech_health.runtime_status.supported",
    variant: "green",
    weight: 1,
  },
  unknown: {
    labelKey: "tech_health.runtime_status.unknown",
    variant: "gray",
    weight: 0,
  },
};

const MILLISECONDS_PER_DAY = 86400000;
const DANGER_THRESHOLD_DAYS = 90;
const WARN_THRESHOLD_DAYS = 180;
const PROGRESS_WINDOW_DAYS = 365;
const MIN_PROGRESS_PERCENT = 4;
const MAX_PROGRESS_PERCENT = 100;

export function getRuntimeDaysRemaining(r: Runtime): number | null {
  if (!r.eolDate) return null;
  return Math.round(
    (new Date(r.eolDate).getTime() - Date.now()) / MILLISECONDS_PER_DAY,
  );
}

export function getRuntimeUrgency(r: Runtime): RuntimeEolStatus {
  const days = getRuntimeDaysRemaining(r);

  if (days === null) {
    if (r.isEol === null || r.isEol === undefined)
      return RuntimeEolStatus.Unknown;
    return r.isEol ? RuntimeEolStatus.Eol : RuntimeEolStatus.Ok;
  }

  if (days < 0) return RuntimeEolStatus.Eol;
  if (days < DANGER_THRESHOLD_DAYS) return RuntimeEolStatus.Danger;
  if (days < WARN_THRESHOLD_DAYS) return RuntimeEolStatus.Warn;
  return RuntimeEolStatus.Ok;
}

export function getRuntimeProgress(r: Runtime): number {
  const urgency = getRuntimeUrgency(r);
  if (urgency === RuntimeEolStatus.Unknown) return 0;
  if (urgency === RuntimeEolStatus.Eol) return MAX_PROGRESS_PERCENT;

  const days = getRuntimeDaysRemaining(r);
  if (days === null) return MIN_PROGRESS_PERCENT;

  const consumed =
    ((PROGRESS_WINDOW_DAYS - days) / PROGRESS_WINDOW_DAYS) *
    MAX_PROGRESS_PERCENT;

  return Math.min(
    MAX_PROGRESS_PERCENT,
    Math.max(MIN_PROGRESS_PERCENT, Math.round(consumed)),
  );
}

export function getDaysLabel(
  r: Runtime,
  t: (key: string, vars?: Record<string, string | number>) => string,
): string {
  const days = getRuntimeDaysRemaining(r);

  if (days === null) {
    if (r.isEol === null || r.isEol === undefined)
      return t("tech_health.runtime.not_assessed");
    return r.isEol
      ? t("tech_health.runtime.expired")
      : t("tech_health.runtime.supported");
  }

  if (days < 0)
    return t("tech_health.runtime.expired_since", { days: Math.abs(days) });
  return t("tech_health.runtime.days_remaining", { days });
}

export const riskConfigOf = (vulnerability: { priority: string }) =>
  RISK_CONFIG[vulnerability.priority as RiskPriority] ?? RISK_CONFIG.Low;
