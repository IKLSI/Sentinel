import { NO_GRADE_TONE, gradeToneOf } from "@/constants/grades";
import type { ActivityItem, NextAction } from "@/domains/dashboard/types";
import { SCORE_DELTA_NEUTRAL } from "@/features/dashboard/pages/DashboardPage/constants";
import type { Translate } from "@/contexts/I18nContext";

export const gradeMeta = (grade?: string | null) =>
  gradeToneOf(grade) ?? NO_GRADE_TONE;

export const formatDayLabel = (isoDate: string, locale: string) =>
  new Intl.DateTimeFormat(locale, { day: "numeric", month: "short" }).format(
    new Date(`${isoDate}T12:00:00`),
  );

export const formatDelta = (t: Translate, delta: number | null | undefined) => {
  if (delta === null || delta === undefined) return null;
  if (delta > SCORE_DELTA_NEUTRAL)
    return t("dashboard.delta.up", { value: delta });
  if (delta < SCORE_DELTA_NEUTRAL)
    return t("dashboard.delta.down", { value: delta });
  return t("dashboard.delta.flat");
};

export const deltaColor = (delta: number | null | undefined) => {
  if (delta === null || delta === undefined) return "var(--muted2)";
  if (delta > SCORE_DELTA_NEUTRAL) return "var(--green)";
  if (delta < SCORE_DELTA_NEUTRAL) return "var(--red)";
  return "var(--muted2)";
};

const toPoint = (cx: number, cy: number, radius: number, percent: number) => {
  const angle = Math.PI * (1 - percent / 100);
  return {
    x: cx + radius * Math.cos(angle),
    y: cy - radius * Math.sin(angle),
  };
};

export const arcPath = (
  cx: number,
  cy: number,
  radius: number,
  fromPercent: number,
  toPercent: number,
) => {
  const start = toPoint(cx, cy, radius, fromPercent);
  const end = toPoint(cx, cy, radius, toPercent);
  return `M${start.x},${start.y} A${radius},${radius} 0 0 1 ${end.x},${end.y}`;
};

export const arcPoint = toPoint;

export const nextActionLabel = (t: Translate, action: NextAction) => {
  if (action.kind === "UpdateDependency" && !action.version)
    return t("dashboard.next_action.UpdateDependency_without_version", {
      target: action.target ?? "",
    });

  return t(`dashboard.next_action.${action.kind}`, {
    target: action.target ?? "",
    version: action.version ?? "",
    reference: action.ticketReference ?? "",
  });
};

const CVSS_DECIMALS = 1;

export const activityEmphasis = (t: Translate, item: ActivityItem) => {
  const count = item.count ?? 0;
  const isPlural = count > 1;
  switch (item.type) {
    case "resolved":
      return isPlural
        ? t("dashboard.activity.bold_resolved_plural", { count })
        : t("dashboard.activity.bold_resolved");
    case "created":
      return isPlural
        ? t("dashboard.activity.bold_created_plural", { count })
        : t("dashboard.activity.bold_created");
    case "vuln":
      return isPlural
        ? `${count} ${t("dashboard.activity.bold_critical_plural")}`
        : t("dashboard.activity.bold_critical");
    default:
      return "";
  }
};

export const activitySuffix = (t: Translate, item: ActivityItem) => {
  const isPlural = (item.count ?? 0) > 1;
  const reference = item.reference ?? "";
  switch (item.type) {
    case "resolved":
      return isPlural
        ? ""
        : t("dashboard.activity.suffix_resolved", { reference });
    case "created":
      return isPlural
        ? ""
        : t("dashboard.activity.suffix_created", { reference });
    case "vuln":
      return t(
        isPlural
          ? "dashboard.activity.suffix_vuln_plural"
          : "dashboard.activity.suffix_vuln",
        { project: item.projectName ?? "" },
      );
    default:
      return item.detail ?? "";
  }
};

const vulnDetailKey = (otherCount: number) => {
  if (otherCount > 1) return "dashboard.activity.vuln_detail_more_plural";
  if (otherCount === 1) return "dashboard.activity.vuln_detail_more";
  return "dashboard.activity.vuln_detail_single";
};

export const activityDetail = (t: Translate, item: ActivityItem) => {
  if (item.type !== "vuln") return item.detail;
  if (!item.vulnCveId) return null;
  const otherCount = item.vulnOtherCount ?? 0;
  return t(vulnDetailKey(otherCount), {
    project: item.projectName ?? "",
    count: otherCount,
    cvss: item.vulnCvssScore?.toFixed(CVSS_DECIMALS) ?? "",
  });
};

export const activityTarget = (item: ActivityItem) => {
  if (item.ticketId)
    return { to: "/tickets/$id", params: { id: item.ticketId } } as const;
  if (item.projectId)
    return { to: "/projects/$id", params: { id: item.projectId } } as const;
  return null;
};
