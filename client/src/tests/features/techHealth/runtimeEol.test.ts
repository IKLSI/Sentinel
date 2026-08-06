import { describe, expect, it } from "vitest";
import type { Runtime } from "@/domains/projects/types";
import { RuntimeEolStatus } from "@/enums";
import {
  getDaysLabel,
  getRuntimeUrgency,
} from "@/features/techHealth/pages/ProjectDetailPage/helpers";

const t = (key: string, vars?: Record<string, string | number>) =>
  vars ? `${key}:${JSON.stringify(vars)}` : key;

const runtime = (overrides: Partial<Runtime>): Runtime => ({
  id: "00000000-0000-0000-0000-000000000000",
  name: "Node.js",
  version: "20.11.0",
  versions: ["20.11.0"],
  eolDate: null,
  isEol: null,
  ...overrides,
});

const inDays = (days: number) =>
  new Date(Date.now() + days * 86400000).toISOString();

describe("getRuntimeUrgency", () => {
  it("returns unknown when the lifecycle could not be resolved", () => {
    expect(getRuntimeUrgency(runtime({ isEol: null }))).toBe(
      RuntimeEolStatus.Unknown,
    );
  });

  it("returns ok for a runtime confirmed as supported", () => {
    expect(getRuntimeUrgency(runtime({ isEol: false }))).toBe(
      RuntimeEolStatus.Ok,
    );
  });

  it("returns eol for a runtime flagged without a date", () => {
    expect(getRuntimeUrgency(runtime({ isEol: true }))).toBe(
      RuntimeEolStatus.Eol,
    );
  });

  it("grades the remaining support window", () => {
    expect(getRuntimeUrgency(runtime({ eolDate: inDays(30) }))).toBe(
      RuntimeEolStatus.Danger,
    );
    expect(getRuntimeUrgency(runtime({ eolDate: inDays(120) }))).toBe(
      RuntimeEolStatus.Warn,
    );
    expect(getRuntimeUrgency(runtime({ eolDate: inDays(400) }))).toBe(
      RuntimeEolStatus.Ok,
    );
    expect(getRuntimeUrgency(runtime({ eolDate: inDays(-10) }))).toBe(
      RuntimeEolStatus.Eol,
    );
  });
});

describe("getDaysLabel", () => {
  it("distinguishes an unassessed runtime from a supported one", () => {
    expect(getDaysLabel(runtime({ isEol: null }), t)).toBe(
      "tech_health.runtime.not_assessed",
    );
    expect(getDaysLabel(runtime({ isEol: false }), t)).toBe(
      "tech_health.runtime.supported",
    );
    expect(getDaysLabel(runtime({ isEol: true }), t)).toBe(
      "tech_health.runtime.expired",
    );
  });

  it("counts the days left when an end-of-life date is known", () => {
    expect(getDaysLabel(runtime({ eolDate: inDays(10) }), t)).toContain(
      "tech_health.runtime.days_remaining",
    );
    expect(getDaysLabel(runtime({ eolDate: inDays(-10) }), t)).toContain(
      "tech_health.runtime.expired_since",
    );
  });
});
