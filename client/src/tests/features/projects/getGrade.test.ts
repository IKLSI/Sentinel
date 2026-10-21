import { describe, expect, it } from "vitest";
import {
  UNTRACKED_SECTION,
  getGrade,
} from "@/features/projects/pages/ProjectsPage/helpers";

describe("getGrade", () => {
  it("returns the grade sent by the API", () => {
    expect(getGrade("B")).toBe("B");
  });

  it("does not show an unscored project as F", () => {
    expect(getGrade(null)).toBe(UNTRACKED_SECTION);
    expect(getGrade(undefined)).toBe(UNTRACKED_SECTION);
    expect(getGrade("Z")).toBe(UNTRACKED_SECTION);
  });
});
