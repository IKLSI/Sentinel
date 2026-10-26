import type { Runtime } from "@/domains/projects/types";
import { SEVERITY_TONES } from "@/constants/severities";
import {
  type DependencyStatus,
  type RiskPriority,
  type VulnerabilitySeverity,
  RuntimeEolStatus,
} from "@/enums";

export type StatusVariant =
  | "green"
  | "blue"
  | "orange"
  | "red"
  | "gray"
  | "yellow"
  | "slate";

export const GRID_ROW_HEIGHT = 40;

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
    color: SEVERITY_TONES.Critical,
    weight: 4,
  },
  High: {
    labelKey: "tech_health.severity.high",
    variant: "orange",
    color: SEVERITY_TONES.High,
    weight: 3,
  },
  Medium: {
    labelKey: "tech_health.severity.medium",
    variant: "yellow",
    color: SEVERITY_TONES.Medium,
    weight: 2,
  },
  Low: {
    labelKey: "tech_health.severity.low",
    variant: "slate",
    color: SEVERITY_TONES.Low,
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
  [RuntimeEolStatus.Eol]: {
    text: "var(--red)",
    stripe: "var(--red)",
    border: "color-mix(in srgb, var(--red) 30%, transparent)",
  },
  [RuntimeEolStatus.Danger]: {
    text: "var(--orange)",
    stripe: "var(--orange)",
    border: "color-mix(in srgb, var(--orange) 25%, transparent)",
  },
  [RuntimeEolStatus.Warn]: {
    text: "var(--yellow)",
    stripe: "var(--yellow)",
    border: "color-mix(in srgb, var(--yellow) 25%, transparent)",
  },
  [RuntimeEolStatus.Ok]: {
    text: "var(--green)",
    stripe: "var(--green)",
    border: "var(--border)",
  },
  [RuntimeEolStatus.Unknown]: {
    text: "var(--muted2)",
    stripe: "var(--border2)",
    border: "var(--border)",
  },
};

export const RUNTIME_STATUS: Record<
  RuntimeEolStatus,
  { labelKey: string; variant: StatusVariant; weight: number }
> = {
  [RuntimeEolStatus.Eol]: {
    labelKey: "tech_health.runtime_status.eol",
    variant: "red",
    weight: 4,
  },
  [RuntimeEolStatus.Danger]: {
    labelKey: "tech_health.runtime_status.imminent",
    variant: "orange",
    weight: 3,
  },
  [RuntimeEolStatus.Warn]: {
    labelKey: "tech_health.runtime_status.soon",
    variant: "blue",
    weight: 2,
  },
  [RuntimeEolStatus.Ok]: {
    labelKey: "tech_health.runtime_status.supported",
    variant: "green",
    weight: 1,
  },
  [RuntimeEolStatus.Unknown]: {
    labelKey: "tech_health.runtime_status.unknown",
    variant: "gray",
    weight: 0,
  },
};

export const getRuntimeDaysRemaining = (r: Runtime): number | null =>
  r.daysRemaining ?? null;

export const getRuntimeUrgency = (r: Runtime): RuntimeEolStatus =>
  (Object.values(RuntimeEolStatus) as string[]).includes(r.eolStatus)
    ? (r.eolStatus as RuntimeEolStatus)
    : RuntimeEolStatus.Unknown;

export const getRuntimeProgress = (r: Runtime): number => r.eolProgressPercent;

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
