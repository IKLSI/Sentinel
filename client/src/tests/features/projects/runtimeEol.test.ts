import { describe, expect, it } from "vitest";
import type { Runtime } from "@/domains/projects/types";
import { RuntimeEolStatus } from "@/enums";
import {
  getDaysLabel,
  getRuntimeProgress,
  getRuntimeUrgency,
} from "@/features/projects/pages/ProjectDetailPage/helpers";

const t = (key: string, vars?: Record<string, string | number>) =>
  vars ? `${key}:${JSON.stringify(vars)}` : key;

const runtime = (overrides: Partial<Runtime>): Runtime => ({
  id: "00000000-0000-0000-0000-000000000000",
  name: "Node.js",
  version: "20.11.0",
  versions: ["20.11.0"],
  eolDate: null,
  isEol: null,
  isMinimumConstraint: false,
  eolStatus: RuntimeEolStatus.Unknown,
  daysRemaining: null,
  eolProgressPercent: 0,
  findingKey: "node.js",
  linkedTicket: null as unknown as Runtime["linkedTicket"],
  ...overrides,
});

describe("getRuntimeUrgency", () => {
  it("uses the status assessed by the API", () => {
    expect(
      getRuntimeUrgency(runtime({ eolStatus: RuntimeEolStatus.Danger })),
    ).toBe(RuntimeEolStatus.Danger);
  });

  it("falls back to unknown for an unexpected status", () => {
    expect(
      getRuntimeUrgency(
        runtime({ eolStatus: "Later" as Runtime["eolStatus"] }),
      ),
    ).toBe(RuntimeEolStatus.Unknown);
  });
});

describe("getRuntimeProgress", () => {
  it("uses the progress computed by the API", () => {
    expect(getRuntimeProgress(runtime({ eolProgressPercent: 80 }))).toBe(80);
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
    expect(getDaysLabel(runtime({ daysRemaining: 10 }), t)).toContain(
      "tech_health.runtime.days_remaining",
    );
    expect(getDaysLabel(runtime({ daysRemaining: -10 }), t)).toContain(
      "tech_health.runtime.expired_since",
    );
  });
});
