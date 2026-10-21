import type { ScoringModel } from "@/domains/publicScan/types";
import {
  DEFAULT_GRADE_COLOR,
  GRADE_COLORS,
} from "@/features/landing/constants";

type GradeThreshold = ScoringModel["grades"][number];

export const gradeColorOf = (grade: string | null | undefined): string =>
  (grade && GRADE_COLORS[grade]) || DEFAULT_GRADE_COLOR;

export const formatGradeThreshold = (
  grades: GradeThreshold[],
  index: number,
): string => {
  const isLowest = index === grades.length - 1 && index > 0;
  return isLowest
    ? `< ${grades[index - 1].minScore}`
    : `≥ ${grades[index].minScore}`;
};

export const formatPenalty = (points: number): string => `-${points}`;
