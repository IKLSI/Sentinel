import type { Runtime } from "@/domains/projects/types";
import { type RiskPriority, RuntimeEolStatus } from "@/enums";
import { RISK_CONFIG } from "@/features/projects/pages/ProjectDetailPage/constants";

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

const OSV_VULNERABILITY_URL = "https://osv.dev/vulnerability/";

const NVD_VULNERABILITY_URL = "https://nvd.nist.gov/vuln/detail/";

const isCve = (identifier: string | null): identifier is string =>
  identifier?.toUpperCase().startsWith("CVE-") ?? false;

export const vulnerabilityReferenceUrl = (vuln: {
  cveAlias: string | null;
  cveId: string;
}) =>
  isCve(vuln.cveAlias)
    ? `${NVD_VULNERABILITY_URL}${encodeURIComponent(vuln.cveAlias)}`
    : `${OSV_VULNERABILITY_URL}${encodeURIComponent(vuln.cveId)}`;

export const formatPercent = (value: number) => `${Math.round(value * 100)} %`;
