import { describe, expect, it } from "vitest";
import {
  arcPath,
  deltaColor,
  flowSeries,
  formatDelta,
  gradeMeta,
  nextActionLabel,
} from "@/features/dashboard/pages/DashboardPage/helpers";
import { pluralKey } from "@/helpers/plural";

const EMPTY_ACTION = {
  target: null,
  version: null,
  ticketId: null,
  ticketReference: null,
};

const t = (key: string, vars?: Record<string, string | number>) =>
  vars ? `${key}:${JSON.stringify(vars)}` : key;

describe("formatDelta", () => {
  it("returns null when there is no history", () => {
    expect(formatDelta(t, null)).toBeNull();
    expect(formatDelta(t, undefined)).toBeNull();
  });

  it("uses the matching key for a rise, a fall and a flat score", () => {
    expect(formatDelta(t, 5)).toBe('dashboard.delta.up:{"value":5}');
    expect(formatDelta(t, -11)).toBe('dashboard.delta.down:{"value":-11}');
    expect(formatDelta(t, 0)).toBe("dashboard.delta.flat");
  });
});

describe("deltaColor", () => {
  it("colors rises in green and falls in red", () => {
    expect(deltaColor(3)).toBe("var(--green)");
    expect(deltaColor(-3)).toBe("var(--red)");
    expect(deltaColor(0)).toBe("var(--muted2)");
  });
});

describe("pluralKey", () => {
  it("suffixes the key with the plural form", () => {
    expect(pluralKey("dashboard.hero.critical", 1)).toBe(
      "dashboard.hero.critical_one",
    );
    expect(pluralKey("dashboard.hero.critical", 0)).toBe(
      "dashboard.hero.critical_other",
    );
  });
});

describe("gradeMeta", () => {
  it("falls back to a neutral color without grade", () => {
    expect(gradeMeta(null).color).toBe("var(--muted2)");
    expect(gradeMeta("a").color).toBe("var(--green)");
  });
});

describe("nextActionLabel", () => {
  it("uses the dedicated key when no target version is known", () => {
    expect(
      nextActionLabel(t, {
        ...EMPTY_ACTION,
        kind: "UpdateDependency",
        target: "next",
      }),
    ).toBe(
      'dashboard.next_action.UpdateDependency_without_version:{"target":"next"}',
    );
  });

  it("passes the ticket reference for an assignment", () => {
    expect(
      nextActionLabel(t, {
        ...EMPTY_ACTION,
        kind: "AssignTicket",
        ticketReference: "TKT-000048",
      }),
    ).toContain('"reference":"TKT-000048"');
  });
});

describe("arcPath", () => {
  it("draws the half circle from left to right", () => {
    const path = arcPath(100, 100, 50, 0, 100);

    expect(path.startsWith("M50,")).toBe(true);
    expect(path.endsWith("A50,50 0 0 1 150,100")).toBe(true);
  });
});

describe("flowSeries", () => {
  it("extrait la série demandée", () => {
    const flow = [
      { date: "2026-10-01", detected: 3, resolved: 1 },
      { date: "2026-10-02", detected: 5, resolved: 2 },
    ];

    expect(flowSeries(flow, "detected")).toEqual([3, 5]);
    expect(flowSeries(flow, "resolved")).toEqual([1, 2]);
  });
});
