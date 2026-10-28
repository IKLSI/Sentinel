import type { Translate } from "@/contexts/I18nContext";
import type { ReleaseItemSeverity } from "@/enums";
import type {
  DependencyChange,
  ConfigurationChange,
  MigrationChange,
  ReleaseComparison,
} from "@/domains/deployments/types";
import {
  DEPENDENCY_SECTIONS,
  DependencySectionKey,
  NOTE_CATEGORIES,
  NOTE_CATEGORY_GITMOJI,
  CHECK_KINDS,
  type CheckKind,
} from "@/features/deployments/constants";
import type {
  DependencySection,
  VersionRow,
  NoteGroup,
  ReleaseCheckBlock,
  ReleaseCheckGroup,
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

export const releaseCheckGroups = (
  comparison: ReleaseComparison,
  t: Translate,
): ReleaseCheckGroup[] =>
  CHECK_KINDS.flatMap((kind) => {
    const { severity, blocks } = blocksOf(comparison, kind, t);
    if (!severity) return [];

    return {
      kind,
      severity,
      blocks,
      count: kind.endsWith("Configuration")
        ? blocks.reduce((total, block) => total + block.entries.length, 0)
        : blocks.length,
    };
  });

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

const isVulnerable = (change: DependencyChange) =>
  change.introducedVulnerabilities.length > 0;

const sectionRows = (
  comparison: ReleaseComparison,
  key: DependencySectionKey,
): VersionRow[] =>
  comparison.dependencies
    .filter((change) =>
      key === DependencySectionKey.Vulnerable
        ? isVulnerable(change)
        : !isVulnerable(change) && change.change === key,
    )
    .map(dependencyRow);

export const dependencySections = (
  comparison: ReleaseComparison,
): DependencySection[] =>
  DEPENDENCY_SECTIONS.map((key) => ({
    key,
    rows: sectionRows(comparison, key),
  })).filter((section) => section.rows.length > 0);

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
