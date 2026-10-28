import type { SvgIconComponent } from "@mui/icons-material";
import AutoAwesomeOutlined from "@mui/icons-material/AutoAwesomeOutlined";
import BugReportOutlined from "@mui/icons-material/BugReportOutlined";
import BuildOutlined from "@mui/icons-material/BuildOutlined";
import { ReleaseCommitCategory, ReleaseItemSeverity } from "@/enums";

export const DependencySectionKey = {
  Vulnerable: "Vulnerable",
  Upgraded: "Upgraded",
  Added: "Added",
  Downgraded: "Downgraded",
  Removed: "Removed",
} as const;
export type DependencySectionKey =
  (typeof DependencySectionKey)[keyof typeof DependencySectionKey];

export const DEPENDENCY_SECTIONS: readonly DependencySectionKey[] = [
  DependencySectionKey.Vulnerable,
  DependencySectionKey.Upgraded,
  DependencySectionKey.Added,
  DependencySectionKey.Downgraded,
  DependencySectionKey.Removed,
];

export const DEPENDENCY_SECTION_TONES: Record<DependencySectionKey, string> = {
  [DependencySectionKey.Vulnerable]: "var(--red)",
  [DependencySectionKey.Upgraded]: "var(--accent)",
  [DependencySectionKey.Added]: "var(--green)",
  [DependencySectionKey.Downgraded]: "var(--orange)",
  [DependencySectionKey.Removed]: "var(--muted2)",
};

export const NOTE_CATEGORIES = [
  ReleaseCommitCategory.Feature,
  ReleaseCommitCategory.Fix,
  ReleaseCommitCategory.Maintenance,
] as const;

export const NOTE_CATEGORY_STYLES: Record<
  string,
  { Icon: SvgIconComponent; tone: string }
> = {
  [ReleaseCommitCategory.Feature]: {
    Icon: AutoAwesomeOutlined,
    tone: "var(--accent)",
  },
  [ReleaseCommitCategory.Fix]: { Icon: BugReportOutlined, tone: "var(--teal)" },
  [ReleaseCommitCategory.Maintenance]: {
    Icon: BuildOutlined,
    tone: "var(--muted2)",
  },
};

export const NOTE_CATEGORY_GITMOJI: Record<string, string> = {
  [ReleaseCommitCategory.Feature]: "✨",
  [ReleaseCommitCategory.Fix]: "🐛",
  [ReleaseCommitCategory.Maintenance]: "🔧",
};

export const CHECK_KINDS = [
  "DestructiveMigration",
  "MissingConfiguration",
  "RiskyMigration",
  "RemovedConfiguration",
] as const;
export type CheckKind = (typeof CHECK_KINDS)[number];

export const CHECK_SEVERITY_TONES: Record<ReleaseItemSeverity, string> = {
  [ReleaseItemSeverity.Blocking]: "var(--red)",
  [ReleaseItemSeverity.Warning]: "var(--orange)",
};

export const REVIEW_GRID_COLUMNS = {
  xs: "1fr",
  lg: "repeat(3, minmax(0, 1fr))",
} as const;

const SCROLL_SX = {
  flex: 1,
  minHeight: 0,
  overflowY: "auto",
} as const;

export const PANEL_SX = {
  display: "flex",
  flexDirection: "column",
  minHeight: { xs: "320px", lg: 0 },
} as const;

export const PANEL_BODY_SX = {
  ...SCROLL_SX,
  px: "24px",
  pt: "4px",
  pb: "20px",
} as const;
