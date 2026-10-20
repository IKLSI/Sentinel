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

interface Grade {
  letter: string;
  threshold: string;
  color: string;
}

export const GRADES: Grade[] = [
  {
    letter: "A",
    threshold: "≥ 90",
    color: "var(--green)",
  },
  {
    letter: "B",
    threshold: "≥ 75",
    color: "var(--cyan)",
  },
  {
    letter: "C",
    threshold: "≥ 60",
    color: "var(--yellow)",
  },
  {
    letter: "D",
    threshold: "≥ 45",
    color: "var(--orange)",
  },
  {
    letter: "E",
    threshold: "≥ 30",
    color: "color-mix(in srgb, var(--orange) 55%, var(--red))",
  },
  {
    letter: "F",
    threshold: "< 30",
    color: "var(--red)",
  },
];

export const LEDGER_ROWS: { id: string; amount: number }[] = [
  { id: "critical_vulnerability", amount: -15 },
  { id: "eol_runtime", amount: -15 },
  { id: "high_vulnerability", amount: -10 },
  { id: "eol_dependency", amount: -10 },
  { id: "medium_vulnerability", amount: -5 },
  { id: "low_vulnerability", amount: -2 },
  { id: "major_version_lag", amount: -2 },
  { id: "minor_version_lag", amount: -1 },
];

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
