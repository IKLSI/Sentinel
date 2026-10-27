import { HealthGrade } from "@/enums";
import {
  DEP_STATUS,
  RUNTIME_STATUS,
  SEV_CONFIG,
} from "@/features/projects/pages/ProjectDetailPage/constants";

export const STATUS_GROUPS = [
  { labelKey: "tech_health.filter.severity", entries: SEV_CONFIG },
  { labelKey: "tech_health.tab.dependencies", entries: DEP_STATUS },
  { labelKey: "tech_health.tab.runtimes", entries: RUNTIME_STATUS },
] as const;

export const SAMPLE_GRADE_SCORES: Record<HealthGrade, number> = {
  [HealthGrade.A]: 96,
  [HealthGrade.B]: 84,
  [HealthGrade.C]: 71,
  [HealthGrade.D]: 55,
  [HealthGrade.E]: 38,
  [HealthGrade.F]: 14,
};

export const GRADE_RING_SIZE = 44;

export const GRADE_LABEL_SX = {
  fontFamily: "var(--font-mono)",
  fontSize: "14px",
  fontWeight: 700,
  lineHeight: 1,
} as const;

export const NO_GRADE_SYMBOL = "–";
