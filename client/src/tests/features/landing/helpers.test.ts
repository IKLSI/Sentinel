import { describe, expect, it } from "vitest";
import {
  formatGradeThreshold,
  formatPenalty,
  gradeColorOf,
} from "@/features/landing/helpers";

const grades = [
  { grade: "A", minScore: 90 },
  { grade: "E", minScore: 30 },
  { grade: "F", minScore: 0 },
];

describe("formatGradeThreshold", () => {
  it("shows the minimum score of each grade", () => {
    expect(formatGradeThreshold(grades, 0)).toBe("≥ 90");
    expect(formatGradeThreshold(grades, 1)).toBe("≥ 30");
  });

  it("shows the lowest grade as below the previous threshold", () => {
    expect(formatGradeThreshold(grades, 2)).toBe("< 30");
  });
});

describe("formatPenalty", () => {
  it("prefixes the points with a minus sign", () => {
    expect(formatPenalty(15)).toBe("-15");
  });
});

describe("gradeColorOf", () => {
  it("falls back to the accent color for an unknown grade", () => {
    expect(gradeColorOf("Z")).toBe("var(--accent)");
    expect(gradeColorOf(null)).toBe("var(--accent)");
  });
});
