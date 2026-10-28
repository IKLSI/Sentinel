import { describe, expect, it } from "vitest";
import type {
  DependencyChange,
  ReleaseComparison,
} from "@/domains/deployments/types";
import {
  dependencySections,
  releaseCheckGroups,
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

describe("dependencySections", () => {
  it("lists vulnerable packages, then the other packages by change kind", () => {
    expect(
      dependencySections(comparison).map((section) => [
        section.key,
        section.rows.map((row) => row.name),
      ]),
    ).toEqual([
      ["Vulnerable", ["lodash"]],
      ["Upgraded", ["left-pad", "react"]],
      ["Added", ["zod"]],
    ]);
  });
});

describe("releaseCheckGroups", () => {
  const summarize = (target: ReleaseComparison) =>
    releaseCheckGroups(target, translate).map((group) => [
      group.kind,
      group.severity,
      group.count,
      group.blocks.map((block) => [
        block.heading,
        block.entries.map((entry) => [entry.text, entry.note]),
      ]),
    ]);

  it("lists each migration with its targets and each config file with its keys", () => {
    expect(summarize(comparison)).toEqual([
      [
        "DestructiveMigration",
        "Blocking",
        1,
        [
          [
            "DropLegacy",
            [["Users.Legacy", "deployments.checks.operation.DropColumn"]],
          ],
        ],
      ],
      [
        "MissingConfiguration",
        "Blocking",
        1,
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
        "MissingConfiguration",
        "Blocking",
        2,
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
