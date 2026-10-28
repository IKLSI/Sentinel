import { describe, expect, it } from "vitest";
import type {
  DependencyChange,
  ReleaseComparison,
} from "@/domains/deployments/types";
import {
  dependencyGroups,
  releaseCheckSteps,
  releaseDataGaps,
  notesByCategory,
  releaseNotesHtml,
  releaseNotesText,
} from "@/features/deployments/helpers";
import { sanitizeProjectDetailSearch } from "@/features/projects/pages/ProjectDetailPage/searchParams";

const translate = (key: string, vars?: Record<string, string | number>) =>
  vars ? `${key}:${Object.values(vars).join(",")}` : key;

type Commit = ReleaseComparison["commits"][number];

const commit = (noteTitle: string, category: Commit["category"]): Commit => ({
  noteTitle,
  category,
});

const dependency = (
  name: string,
  introducedVulnerabilities: string[] = [],
  change: DependencyChange["change"] = "Upgraded",
): DependencyChange => ({
  name,
  ecosystem: "Npm",
  baseVersion: "1.0.0",
  headVersion: "2.0.0",
  change,
  isMajor: name === "react",
  introducedVulnerabilities,
});

const comparison: ReleaseComparison = {
  headReference: "v4.2.0",
  summary: {
    fixedVulnerabilityCount: 0,
    inventoryIncomplete: false,
    vulnerabilityDataIncomplete: true,
    historyTruncated: false,
  },
  configuration: [
    {
      file: "appsettings.json",
      key: "Smtp:ApiKey",
      requiresValue: true,
      severity: "Blocking",
    },
  ],
  migrations: [
    {
      path: "Migrations/20261021120000_DropLegacy.cs",
      name: "20261021120000_DropLegacy",
      risk: "Destructive",
      operations: [{ kind: "DropColumn", target: "Users.Legacy" }],
      severity: "Blocking",
    },
  ],
  runtimes: [{ name: ".NET", baseVersion: "8.0", headVersion: "10.0" }],
  dependencies: [
    dependency("left-pad"),
    dependency("react"),
    dependency("lodash", ["CVE-2026-1"]),
    dependency("zod", [], "Added"),
  ],
  commits: [
    commit("Bump deps", "Maintenance"),
    commit("Correction login", "Fix"),
    commit("Ajout export", "Feature"),
  ],
};

describe("dependencyGroups", () => {
  it("puts runtimes first, then one group per ecosystem with vulnerable packages first", () => {
    expect(
      dependencyGroups(comparison).map((group) => [
        group.key,
        group.rows.map((row) => row.name),
        group.vulnerabilityCount,
      ]),
    ).toEqual([
      ["runtimes", [".NET"], 0],
      ["ecosystem:Npm", ["lodash", "react", "zod"], 1],
    ]);
  });
});

describe("dependencyGroups ordering", () => {
  it("clusters rows by change kind instead of interleaving them", () => {
    const rows = dependencyGroups({
      ...comparison,
      runtimes: [],
      dependencies: [
        dependency("a-removed", [], "Removed"),
        dependency("b-added", [], "Added"),
        dependency("c-removed", [], "Removed"),
        dependency("react"),
        dependency("e-added", [], "Added"),
      ],
    })[0].rows.map((row) => row.name);

    expect(rows).toEqual([
      "react",
      "b-added",
      "e-added",
      "a-removed",
      "c-removed",
    ]);
  });
});

describe("releaseCheckSteps", () => {
  const summarize = (target: ReleaseComparison) =>
    releaseCheckSteps(target, translate).map((step) => [
      step.index,
      step.id,
      step.severity,
      step.summary,
      step.blocks.map((block) => [
        block.heading,
        block.entries.map((entry) => [entry.text, entry.note]),
      ]),
    ]);

  it("lists each migration with its targets and each config file with its keys", () => {
    expect(summarize(comparison)).toEqual([
      [
        1,
        "Database",
        "Blocking",
        "1 deployments.checks.kind.DestructiveMigration_one",
        [
          [
            "DropLegacy",
            [["Users.Legacy", "deployments.checks.operation.DropColumn"]],
          ],
        ],
      ],
      [
        2,
        "Configuration",
        "Blocking",
        "1 deployments.checks.kind.MissingConfiguration_one",
        [["appsettings.json", [["Smtp:ApiKey", null]]]],
      ],
    ]);
  });

  it("groups configuration keys under their file and counts keys", () => {
    expect(
      summarize({
        ...comparison,
        migrations: [],
        configuration: ["Smtp:ApiKey", "Api:Token"].map((key) => ({
          file: "server/Job/appsettings.json",
          key,
          requiresValue: true,
          severity: "Blocking" as const,
        })),
      }),
    ).toEqual([
      [
        1,
        "Configuration",
        "Blocking",
        "2 deployments.checks.kind.MissingConfiguration_other",
        [
          [
            "Job/appsettings.json",
            [
              ["Smtp:ApiKey", null],
              ["Api:Token", null],
            ],
          ],
        ],
      ],
    ]);
  });

  it("reports data gaps separately", () => {
    expect(releaseDataGaps(comparison)).toEqual([
      "vulnerabilityDataIncomplete",
    ]);
  });
});

describe("releaseNotesText", () => {
  it("renders a heading and one bullet list per category", () => {
    const text = releaseNotesText(
      notesByCategory(comparison).slice(0, 1),
      "v4.2.0",
      translate,
    );

    expect(text).toBe(
      [
        "deployments.notes.heading:v4.2.0",
        "",
        "✨ deployments.notes.category.Feature",
        "- Ajout export",
      ].join("\n"),
    );
  });

  it("renders escaped html with real lists for rich paste", () => {
    const html = releaseNotesHtml(
      [{ category: "Fix", titles: ["Corriger <script> & co"] }],
      "v4.2.0",
      translate,
    );

    expect(html).toBe(
      "<h2>deployments.notes.heading:v4.2.0</h2><h3>🐛 deployments.notes.category.Fix</h3><ul><li>Corriger &lt;script&gt; &amp; co</li></ul>",
    );
  });
});

describe("sanitizeProjectDetailSearch", () => {
  it("keeps known tabs and valid references", () => {
    expect(
      sanitizeProjectDetailSearch({
        tab: "deployments",
        base: "v1.0.0",
        head: "main",
      }),
    ).toEqual({ tab: "deployments", base: "v1.0.0", head: "main" });
  });

  it("drops unknown tabs and blank or oversized references", () => {
    expect(
      sanitizeProjectDetailSearch({
        tab: "unknown",
        base: "   ",
        head: "x".repeat(256),
      }),
    ).toEqual({ tab: undefined, base: undefined, head: undefined });
  });
});
