import { HealthGrade } from "@/enums";

interface GradeTone {
  color: string;
  subtle: string;
}

export const GRADE_TONES: Record<HealthGrade, GradeTone> = {
  [HealthGrade.A]: { color: "var(--green)", subtle: "var(--green-subtle)" },
  [HealthGrade.B]: { color: "var(--teal)", subtle: "var(--teal-subtle)" },
  [HealthGrade.C]: { color: "var(--yellow)", subtle: "var(--yellow-subtle)" },
  [HealthGrade.D]: { color: "var(--orange)", subtle: "var(--orange-subtle)" },
  [HealthGrade.E]: { color: "var(--red)", subtle: "var(--red-subtle)" },
  [HealthGrade.F]: { color: "var(--red)", subtle: "var(--red-subtle)" },
};

export const NO_GRADE_TONE: GradeTone = {
  color: "var(--muted2)",
  subtle: "var(--s3)",
};

const isHealthGrade = (value: string): value is HealthGrade =>
  Object.values(HealthGrade).some((grade) => grade === value);

export const gradeToneOf = (grade?: string | null): GradeTone | null => {
  const normalized = grade?.toUpperCase();
  return normalized && isHealthGrade(normalized)
    ? GRADE_TONES[normalized]
    : null;
};
