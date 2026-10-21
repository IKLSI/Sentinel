export const ECOSYSTEMS = [
  "npm",
  "PyPI",
  "NuGet",
  "Maven",
  "Gradle",
  "Composer",
  "RubyGems",
  "Go",
  "Cargo",
  "Hex",
  "Pub",
  "Swift",
] as const;

export const GRADE_COLORS: Record<string, string> = {
  A: "var(--green)",
  B: "var(--cyan)",
  C: "var(--yellow)",
  D: "var(--orange)",
  E: "color-mix(in srgb, var(--orange) 55%, var(--red))",
  F: "var(--red)",
};

export const DISPLAYED_GRADES = Object.entries(GRADE_COLORS);

export const DEFAULT_GRADE_COLOR = "var(--accent)";

export const MAX_HEALTH_SCORE = 100;

export const PROCESS_STEPS = [
  {
    id: "connect",
    color: "var(--accent)",
  },
  {
    id: "scan",
    color: "var(--purple)",
  },
  {
    id: "act",
    color: "var(--green)",
  },
] as const;

interface CompareFeature {
  id: string;
  badge?: string;
}

export const COMPARE_FEATURES: CompareFeature[] = [
  { id: "cve" },
  { id: "eol" },
  { id: "score" },
  { id: "remediation" },
];

export const FAQ_ITEM_IDS = [
  "source_code",
  "data_sources",
  "ecosystems",
  "security",
  "ci",
] as const;

export const LANDING_NAV_HEIGHT = "64px";

export const LANDING_NAV_TOP = { xs: "16px", md: "20px" } as const;
