import { pluralKey } from "@/helpers/plural";
import type { Translate } from "@/contexts/I18nContext";
import { ReleaseItemSeverity } from "@/enums";
import type {
  DependencyChange,
  ConfigurationChange,
  MigrationChange,
  ReleaseComparison,
  RuntimeChange,
} from "@/domains/deployments/types";
import {
  DependencyChangeKind,
  NOTE_CATEGORIES,
  NOTE_CATEGORY_GITMOJI,
  CHECK_STEPS,
  type CheckKind,
} from "@/features/deployments/constants";
import type {
  DependencyGroup,
  VersionRow,
  NoteGroup,
  ReleaseCheckBlock,
  ReleaseCheckStep,
} from "@/features/deployments/types";

const MIGRATION_TIMESTAMP = /^\d{8,}_/;

const RAW_SQL = "RawSql";

const shortPath = (path: string) => path.split("/").slice(-2).join("/");

const migrationBlock = (
  migration: MigrationChange,
  t: Translate,
): ReleaseCheckBlock => ({
  id: `migration:${migration.path}`,
  heading: migration.name.replace(MIGRATION_TIMESTAMP, ""),
  hint: migration.path,
  entries: migration.operations
    .filter((operation) => operation.kind !== RAW_SQL)
    .map((operation, index) => ({
      id: `${migration.path}:${index}`,
      text:
        operation.target ?? t(`deployments.checks.operation.${operation.kind}`),
      note: operation.target
        ? t(`deployments.checks.operation.${operation.kind}`)
        : null,
    })),
});

const configurationBlocks = (
  changes: ConfigurationChange[],
): ReleaseCheckBlock[] =>
  [...new Set(changes.map((change) => change.file))].map((file) => ({
    id: `configuration:${file}`,
    heading: shortPath(file),
    hint: file,
    entries: changes
      .filter((change) => change.file === file)
      .map((change) => ({ id: change.key, text: change.key, note: null })),
  }));

const blocksOf = (
  comparison: ReleaseComparison,
  kind: CheckKind,
  t: Translate,
): {
  severity: ReleaseItemSeverity | undefined;
  blocks: ReleaseCheckBlock[];
} => {
  if (kind === "DestructiveMigration" || kind === "RiskyMigration") {
    const migrations = comparison.migrations.filter(
      (migration) => `${migration.risk}Migration` === kind,
    );
    return {
      severity: migrations[0]?.severity,
      blocks: migrations.map((migration) => migrationBlock(migration, t)),
    };
  }

  const changes = comparison.configuration.filter(
    (change) => change.requiresValue === (kind === "MissingConfiguration"),
  );
  return {
    severity: changes[0]?.severity,
    blocks: configurationBlocks(changes),
  };
};

const checkCount = (kind: CheckKind, blocks: ReleaseCheckBlock[]) =>
  kind.endsWith("Configuration")
    ? blocks.reduce((total, block) => total + block.entries.length, 0)
    : blocks.length;

export const releaseCheckSteps = (
  comparison: ReleaseComparison,
  t: Translate,
): ReleaseCheckStep[] =>
  CHECK_STEPS.flatMap((step) => {
    const found = step.kinds
      .map((kind) => ({ kind, ...blocksOf(comparison, kind, t) }))
      .filter((entry) => entry.severity);
    if (found.length === 0) return [];

    return {
      id: step.id,
      severity: found.some(
        (entry) => entry.severity === ReleaseItemSeverity.Blocking,
      )
        ? ReleaseItemSeverity.Blocking
        : ReleaseItemSeverity.Warning,
      summary: found
        .map((entry) => {
          const count = checkCount(entry.kind, entry.blocks);
          return `${count} ${t(pluralKey(`deployments.checks.kind.${entry.kind}`, count))}`;
        })
        .join(" · "),
      blocks: found.flatMap((entry) => entry.blocks),
    };
  }).map((step, index) => ({ ...step, index: index + 1 }));

const DATA_GAPS = [
  "inventoryIncomplete",
  "vulnerabilityDataIncomplete",
] as const;

export const releaseDataGaps = (comparison: ReleaseComparison) =>
  DATA_GAPS.filter((gap) => comparison.summary[gap]);

const dependencyId = (change: DependencyChange) =>
  `dependency:${change.ecosystem}:${change.name}`;

const dependencyRow = (change: DependencyChange): VersionRow => ({
  id: dependencyId(change),
  name: change.name,
  change: change.change,
  baseVersion: change.baseVersion,
  headVersion: change.headVersion,
  isMajor: change.isMajor,
  vulnerabilities: change.introducedVulnerabilities,
});

const runtimeChange = (runtime: RuntimeChange) => {
  if (!runtime.baseVersion) return DependencyChangeKind.Added;
  if (!runtime.headVersion) return DependencyChangeKind.Removed;
  return DependencyChangeKind.Upgraded;
};

const runtimeRows = (comparison: ReleaseComparison): VersionRow[] =>
  comparison.runtimes.map((runtime) => ({
    id: `runtime:${runtime.name}`,
    name: runtime.name,
    change: runtimeChange(runtime),
    baseVersion: runtime.baseVersion,
    headVersion: runtime.headVersion,
    isMajor: false,
    vulnerabilities: [],
  }));

const isHiddenMinorUpdate = (change: DependencyChange) =>
  change.change === DependencyChangeKind.Upgraded &&
  !change.isMajor &&
  change.introducedVulnerabilities.length === 0;

const CHANGE_ORDER: readonly string[] = Object.values(DependencyChangeKind);

const byImportance = (first: VersionRow, second: VersionRow) =>
  second.vulnerabilities.length - first.vulnerabilities.length ||
  CHANGE_ORDER.indexOf(first.change) - CHANGE_ORDER.indexOf(second.change) ||
  Number(second.isMajor) - Number(first.isMajor) ||
  first.name.localeCompare(second.name);

export const dependencyGroups = (
  comparison: ReleaseComparison,
): DependencyGroup[] => {
  const runtimes = runtimeRows(comparison).sort(byImportance);
  const shown = comparison.dependencies.filter(
    (change) => !isHiddenMinorUpdate(change),
  );
  const ecosystems = [...new Set(shown.map((change) => change.ecosystem))].sort(
    (first, second) => first.localeCompare(second),
  );

  return [
    ...(runtimes.length > 0
      ? [
          {
            key: "runtimes",
            ecosystem: null,
            rows: runtimes,
            vulnerabilityCount: 0,
          },
        ]
      : []),
    ...ecosystems.map((ecosystem) => {
      const rows = shown
        .filter((change) => change.ecosystem === ecosystem)
        .map(dependencyRow)
        .sort(byImportance);
      const vulnerabilityCount = rows.reduce(
        (total, row) => total + row.vulnerabilities.length,
        0,
      );

      return {
        key: `ecosystem:${ecosystem}`,
        ecosystem,
        rows,
        vulnerabilityCount,
      };
    }),
  ];
};

export const notesByCategory = (comparison: ReleaseComparison): NoteGroup[] =>
  NOTE_CATEGORIES.map((category) => ({
    category,
    titles: [
      ...new Set(
        comparison.commits
          .filter((commit) => commit.category === category)
          .map((commit) => commit.noteTitle),
      ),
    ],
  })).filter((group) => group.titles.length > 0);

const categoryHeading = (category: string, t: Translate) =>
  `${NOTE_CATEGORY_GITMOJI[category] ?? ""} ${t(`deployments.notes.category.${category}`)}`.trim();

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

export const releaseNotesText = (
  groups: NoteGroup[],
  version: string,
  t: Translate,
) =>
  [
    t("deployments.notes.heading", { version }),
    ...groups.flatMap((group) => [
      "",
      categoryHeading(group.category, t),
      ...group.titles.map((title) => `- ${title}`),
    ]),
  ].join("\n");

export const releaseNotesHtml = (
  groups: NoteGroup[],
  version: string,
  t: Translate,
) =>
  [
    `<h2>${escapeHtml(t("deployments.notes.heading", { version }))}</h2>`,
    ...groups.map(
      (group) =>
        `<h3>${escapeHtml(categoryHeading(group.category, t))}</h3><ul>${group.titles
          .map((title) => `<li>${escapeHtml(title)}</li>`)
          .join("")}</ul>`,
    ),
  ].join("");
