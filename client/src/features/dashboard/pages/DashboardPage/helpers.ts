import type { NextAction } from "@/domains/dashboard/types";
import { SCORE_DELTA_NEUTRAL } from "@/features/dashboard/pages/DashboardPage/constants";

type Translate = (
  key: string,
  vars?: Record<string, string | number>,
) => string;

interface GradeMeta {
  color: string;
  subtle: string;
}

const GRADE_METAS: Record<string, GradeMeta> = {
  A: { color: "var(--green)", subtle: "var(--green-subtle)" },
  B: { color: "var(--teal)", subtle: "var(--teal-subtle)" },
  C: { color: "var(--yellow)", subtle: "var(--yellow-subtle)" },
  D: { color: "var(--orange)", subtle: "var(--orange-subtle)" },
  E: { color: "var(--red)", subtle: "var(--red-subtle)" },
  F: { color: "var(--red)", subtle: "var(--red-subtle)" },
};

const NOT_AVAILABLE_META: GradeMeta = {
  color: "var(--muted2)",
  subtle: "var(--s3)",
};

export const gradeMeta = (grade?: string | null): GradeMeta =>
  grade
    ? (GRADE_METAS[grade.toUpperCase()] ?? NOT_AVAILABLE_META)
    : NOT_AVAILABLE_META;

export const pluralKey = (base: string, count: number) =>
  `${base}_${count === 1 ? "one" : "other"}`;

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
