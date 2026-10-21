import { describe, expect, it } from "vitest";
import type { ScoringExampleLine } from "@/domains/publicScan/types";
import {
  buildTimelineScale,
  describeRuntimeStatus,
  describeScoreLine,
  formatMultiplier,
  formatPoints,
  gradeColorOf,
  joinNames,
} from "@/features/landing/helpers";

const t = (key: string, vars?: Record<string, string | number>) =>
  vars ? `${key}:${JSON.stringify(vars)}` : key;

const line = (overrides: Partial<ScoringExampleLine>): ScoringExampleLine => ({
  kind: "high_vulnerability",
  modifiers: [],
  multiplier: null,
  count: 1,
  points: 10,
  identifiers: [],
  packages: [],
  runtimeName: null,
  runtimeVersion: null,
  eolDate: null,
  outdated: null,
  totalDirect: null,
  ...overrides,
});

describe("gradeColorOf", () => {
  it("maps known grades and falls back to the accent", () => {
    expect(gradeColorOf("A")).toBe("var(--green)");
    expect(gradeColorOf(null)).toBe("var(--accent)");
  });
});

describe("formatPoints", () => {
  it("uses a minus sign and the locale decimal separator", () => {
    expect(formatPoints(22.5, "fr-FR")).toBe("−22,5");
    expect(formatPoints(22.5, "en-US")).toBe("−22.5");
  });
});

describe("formatMultiplier", () => {
  it("shows common fractions as glyphs and others with the locale", () => {
    expect(formatMultiplier(0.25, "fr-FR")).toBe("×¼");
    expect(formatMultiplier(1.5, "fr-FR")).toBe("×1,5");
    expect(formatMultiplier(2, "en-US")).toBe("×2");
  });
});

describe("joinNames", () => {
  it("joins names with the given conjunction", () => {
    expect(joinNames([".NET 8"], "et")).toBe(".NET 8");
    expect(joinNames(["A", "B", "C"], "and")).toBe("A, B and C");
  });
});

describe("describeScoreLine", () => {
  it("pluralises vulnerability lines and lists identifiers with modifiers", () => {
    expect(
      describeScoreLine(
        line({
          kind: "critical_vulnerability",
          count: 2,
          identifiers: ["CVE-1"],
          modifiers: ["likely_exploited"],
        }),
        t,
        "fr-FR",
      ),
    ).toEqual({
      label: 'landing.score.line.critical_vulnerability_other:{"count":2}',
      detail: "CVE-1, landing.score.modifier.likely_exploited",
    });
  });

  it("describes version lag with direct dependency counts", () => {
    expect(
      describeScoreLine(
        line({ kind: "version_lag", outdated: 1, totalDirect: 4 }),
        t,
        "fr-FR",
      ).detail,
    ).toBe('landing.score.detail.outdated_one:{"count":1,"total":4}');
  });

  it("names the runtime and its end-of-life date", () => {
    expect(
      describeScoreLine(
        line({
          kind: "approaching_eol_runtime",
          runtimeName: ".NET",
          runtimeVersion: "8",
          eolDate: "2026-11-10T00:00:00Z",
        }),
        t,
        "fr-FR",
      ),
    ).toEqual({
      label: 'landing.score.line.approaching_eol_runtime:{"runtime":".NET 8"}',
      detail: 'landing.score.detail.eol_on:{"date":"10 novembre 2026"}',
    });
  });
});

describe("describeRuntimeStatus", () => {
  const item = {
    name: "Node.js 20",
    releaseDate: null,
    endOfLifeDate: "2026-04-30T00:00:00Z",
    status: "ended",
    daysRemaining: -174,
  };

  it("counts the days since the end of life", () => {
    expect(describeRuntimeStatus(item, t, "fr-FR")).toBe(
      'landing.timeline.status.ended_other:{"count":174}',
    );
  });

  it("shows the end-of-life date of a supported runtime", () => {
    expect(
      describeRuntimeStatus(
        { ...item, status: "supported", endOfLifeDate: "2028-11-14T00:00:00Z" },
        t,
        "fr-FR",
      ),
    ).toBe('landing.timeline.status.supported:{"date":"14 nov. 2028"}');
  });
});

describe("buildTimelineScale", () => {
  it("spans from the previous year to the year after the last end of life", () => {
    const scale = buildTimelineScale(
      [
        {
          name: ".NET 10",
          releaseDate: "2025-11-11T00:00:00Z",
          endOfLifeDate: "2028-11-14T00:00:00Z",
          status: "supported",
          daysRemaining: 755,
        },
      ],
      "2026-10-21T00:00:00Z",
    );

    expect(scale.years).toEqual([2025, 2026, 2027, 2028, 2029]);
    expect(scale.from).toBe(Date.UTC(2025, 0, 1));
  });
});
