import { gradeToneOf } from "@/constants/grades";
import type { Translate } from "@/contexts/I18nContext";
import type {
  RuntimeLifecycleItem,
  ScoringExampleLine,
} from "@/domains/publicScan/types";
import { pluralKey } from "@/helpers/plural";
import {
  DEFAULT_GRADE_COLOR,
  LANDING_GRADE_COLORS,
  RUNTIME_STATUSES,
  SCORE_LINE_COLORS,
  SCORE_LINE_KINDS,
} from "@/features/landing/constants";

const MINUS_SIGN = "−";
const MULTIPLIER_SIGN = "×";
const AXIS_PADDING_MONTH = 6;

const UNICODE_FRACTIONS: Record<number, string> = {
  0.25: "¼",
  0.5: "½",
  0.75: "¾",
};

const VULNERABILITY_KINDS: string[] = [
  SCORE_LINE_KINDS.highVulnerability,
  SCORE_LINE_KINDS.mediumVulnerability,
  SCORE_LINE_KINDS.lowVulnerability,
];

const END_OF_LIFE_KINDS: string[] = [
  SCORE_LINE_KINDS.eolDependency,
  SCORE_LINE_KINDS.eolRuntime,
  SCORE_LINE_KINDS.approachingEolRuntime,
];

export const gradeColorOf = (grade: string | null | undefined): string =>
  gradeToneOf(grade)?.color ?? DEFAULT_GRADE_COLOR;

export const landingGradeColorOf = (grade: string | null | undefined) =>
  (grade && LANDING_GRADE_COLORS[grade]) || "var(--indigo)";

export const scoreLineColorOf = (kind: string): string => {
  if (kind === SCORE_LINE_KINDS.criticalVulnerability)
    return SCORE_LINE_COLORS.critical;
  if (VULNERABILITY_KINDS.includes(kind))
    return SCORE_LINE_COLORS.vulnerability;
  if (END_OF_LIFE_KINDS.includes(kind)) return SCORE_LINE_COLORS.endOfLife;
  return SCORE_LINE_COLORS.versionLag;
};

const formatNumber = (value: number, culture: string) =>
  new Intl.NumberFormat(culture, { maximumFractionDigits: 1 }).format(value);

export const formatPoints = (points: number, culture: string) =>
  `${MINUS_SIGN}${formatNumber(points, culture)}`;

export const formatMultiplier = (multiplier: number, culture: string) =>
  `${MULTIPLIER_SIGN}${
    UNICODE_FRACTIONS[multiplier] ??
    new Intl.NumberFormat(culture, { maximumFractionDigits: 3 }).format(
      multiplier,
    )
  }`;

export const formatLongDate = (iso: string, culture: string) =>
  new Intl.DateTimeFormat(culture, {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(iso));

export const formatShortDate = (iso: string, culture: string) =>
  new Intl.DateTimeFormat(culture, {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(iso));

export const joinNames = (names: string[], conjunction: string) =>
  names.length <= 1
    ? names.join("")
    : `${names.slice(0, -1).join(", ")} ${conjunction} ${names[names.length - 1]}`;

const runtimeLabel = (line: ScoringExampleLine) =>
  [line.runtimeName, line.runtimeVersion].filter(Boolean).join(" ");

const modifierLabels = (line: ScoringExampleLine, t: Translate) =>
  line.modifiers.map((modifier) => t(`landing.score.modifier.${modifier}`));

export const describeScoreLine = (
  line: ScoringExampleLine,
  t: Translate,
  culture: string,
): { label: string; detail: string } => {
  const kindKey = `landing.score.line.${line.kind}`;

  switch (line.kind) {
    case SCORE_LINE_KINDS.eolRuntime:
    case SCORE_LINE_KINDS.approachingEolRuntime:
      return {
        label: t(kindKey, { runtime: runtimeLabel(line) }),
        detail: line.eolDate
          ? t(
              line.kind === SCORE_LINE_KINDS.eolRuntime
                ? "landing.score.detail.eol_since"
                : "landing.score.detail.eol_on",
              { date: formatLongDate(line.eolDate, culture) },
            )
          : "",
      };
    case SCORE_LINE_KINDS.versionLag:
      return {
        label: t(kindKey),
        detail:
          line.outdated != null && line.totalDirect != null
            ? t(pluralKey("landing.score.detail.outdated", line.outdated), {
                count: line.outdated,
                total: line.totalDirect,
              })
            : "",
      };
    case SCORE_LINE_KINDS.eolDependency:
      return {
        label: t(pluralKey(kindKey, line.count), { count: line.count }),
        detail: [...line.packages, ...modifierLabels(line, t)].join(", "),
      };
    default:
      return {
        label: t(pluralKey(kindKey, line.count), { count: line.count }),
        detail: [...line.identifiers, ...modifierLabels(line, t)].join(", "),
      };
  }
};

interface TimelineScale {
  from: number;
  to: number;
  years: number[];
}

export const buildTimelineScale = (
  items: RuntimeLifecycleItem[],
  asOf: string,
): TimelineScale => {
  const currentYear = new Date(asOf).getUTCFullYear();
  const endYears = items
    .map((item) => item.endOfLifeDate)
    .filter((date): date is string => date !== null)
    .map((date) => new Date(date).getUTCFullYear());
  const firstYear = currentYear - 1;
  const lastYear = Math.max(currentYear + 1, ...endYears.map((y) => y + 1));

  return {
    from: Date.UTC(firstYear, 0, 1),
    to: Date.UTC(lastYear, AXIS_PADDING_MONTH, 1),
    years: Array.from(
      { length: lastYear - firstYear + 1 },
      (_, index) => firstYear + index,
    ),
  };
};

export const timelinePercent = (time: number, scale: TimelineScale) =>
  Math.max(
    0,
    Math.min(100, ((time - scale.from) / (scale.to - scale.from)) * 100),
  );

export const timelineSpan = (
  item: RuntimeLifecycleItem,
  scale: TimelineScale,
): { left: number; width: number } | null => {
  if (!item.releaseDate && !item.endOfLifeDate) return null;
  const start = item.releaseDate ? Date.parse(item.releaseDate) : scale.from;
  const end = item.endOfLifeDate ? Date.parse(item.endOfLifeDate) : scale.to;
  const left = timelinePercent(start, scale);
  const width = Math.max(timelinePercent(end, scale) - left, 0);
  return { left, width };
};

export const describeRuntimeStatus = (
  item: RuntimeLifecycleItem,
  t: Translate,
  culture: string,
): string => {
  const days =
    item.daysRemaining === null ? null : Math.abs(item.daysRemaining);

  switch (item.status) {
    case RUNTIME_STATUSES.ended:
      return days === null
        ? t("landing.timeline.legend.ended")
        : t(pluralKey("landing.timeline.status.ended", days), { count: days });
    case RUNTIME_STATUSES.approaching:
      return days === null
        ? t("landing.timeline.status.unknown")
        : t(pluralKey("landing.timeline.status.approaching", days), {
            count: days,
          });
    case RUNTIME_STATUSES.supported:
      return item.endOfLifeDate
        ? t("landing.timeline.status.supported", {
            date: formatShortDate(item.endOfLifeDate, culture),
          })
        : t("landing.timeline.legend.supported");
    default:
      return t("landing.timeline.status.unknown");
  }
};
