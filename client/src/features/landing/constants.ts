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
  "CocoaPods",
] as const;

export const CI_INTEGRATION = "GitHub Actions";

export const GRADE_COLORS: Record<string, string> = {
  A: "var(--green)",
  B: "var(--cyan)",
  C: "var(--yellow)",
  D: "var(--orange)",
  E: "color-mix(in srgb, var(--orange) 55%, var(--red))",
  F: "var(--red)",
};

export const DEFAULT_GRADE_COLOR = "var(--accent)";

export const LANDING_GRADE_COLORS: Record<string, string> = {
  A: "var(--grade-a)",
  B: "var(--grade-b)",
  C: "var(--grade-c)",
  D: "var(--grade-d)",
  E: "var(--grade-e)",
  F: "var(--grade-f)",
};

export const LANDING_GRADES = Object.keys(LANDING_GRADE_COLORS);

export const LANDING_THEME = {
  "--page": "#ffffff",
  "--tint": "#f6f6fb",
  "--line": "#ececf3",
  "--ink": "#101124",
  "--ink-2": "#4a4e70",
  "--ink-3": "#686c8a",
  "--indigo": "#5048e5",
  "--indigo-soft": "#f0efff",
  "--grade-a": "#16a34a",
  "--grade-b": "#0891b2",
  "--grade-c": "#d97706",
  "--grade-d": "#ea580c",
  "--grade-e": "#c2410c",
  "--grade-f": "#dc2626",
  "--font-display": '"Bricolage Grotesque", var(--font-ui), sans-serif',
  "--font-text": '"Plus Jakarta Sans", var(--font-ui), sans-serif',
  "--font-code": '"JetBrains Mono", ui-monospace, monospace',
  "--bg": "#ffffff",
  "--s1": "#ffffff",
  "--s2": "#f5f7fc",
  "--s3": "#eaedfa",
  "--border": "#dde3f2",
  "--border2": "#c8d2eb",
  "--text": "#0e1220",
  "--text-secondary": "#3a4768",
  "--muted": "#8898bb",
  "--muted2": "#5c6f90",
} as const;

export const LANDING_EASING = "cubic-bezier(.2,.8,.2,1)";

export const LANDING_NAV_OFFSET = "80px";

export const LANDING_WRAP_SX = {
  width: "100%",
  maxWidth: 1160,
  mx: "auto",
  px: { xs: "20px", md: "40px" },
  boxSizing: "border-box",
} as const;

export const LANDING_SECTION_IDS = {
  howItWorks: "fonctionnement",
  score: "note",
  timeline: "echeances",
  faq: "faq",
} as const;

export const NAV_LINKS = [
  { id: LANDING_SECTION_IDS.howItWorks, labelKey: "landing.nav.how_it_works" },
  { id: LANDING_SECTION_IDS.score, labelKey: "landing.nav.score" },
  { id: LANDING_SECTION_IDS.timeline, labelKey: "landing.nav.timeline" },
  { id: LANDING_SECTION_IDS.faq, labelKey: "landing.nav.faq" },
] as const;

export const FAQ_ITEM_IDS = [
  "source_code",
  "private_repos",
  "security",
  "data_sources",
  "false_positive",
  "ci",
] as const;

export const SCORE_LINE_COLORS = {
  critical: "#dc2626",
  vulnerability: "#f97316",
  endOfLife: "#8b5cf6",
  versionLag: "#a5a1ff",
} as const;

export const SCORE_LINE_KINDS = {
  criticalVulnerability: "critical_vulnerability",
  highVulnerability: "high_vulnerability",
  mediumVulnerability: "medium_vulnerability",
  lowVulnerability: "low_vulnerability",
  eolDependency: "eol_dependency",
  eolRuntime: "eol_runtime",
  approachingEolRuntime: "approaching_eol_runtime",
  versionLag: "version_lag",
} as const;

export const RUNTIME_STATUSES = {
  supported: "supported",
  approaching: "approaching",
  ended: "ended",
  unknown: "unknown",
} as const;

export const DATA_SOURCES = [
  { name: "OSV.dev", href: "https://osv.dev" },
  { name: "FIRST EPSS", href: "https://www.first.org/epss/" },
  {
    name: "CISA KEV",
    href: "https://www.cisa.gov/known-exploited-vulnerabilities-catalog",
  },
  { name: "endoflife.date", href: "https://endoflife.date" },
] as const;

export const STEP_CHIP_SX = {
  background: "#ffffff",
  boxShadow: "0 0 0 1px var(--line)",
} as const;

export const STEP_SOURCES = ["OSV.dev", "EPSS", "CISA KEV", "endoflife.date"];

export const SHOWCASE = {
  onlineStore: "Boutique en ligne",
  customerPortal: "Portail client",
  onlineStoreRepository: "acme/boutique-en-ligne",
  customerPortalRepository: "plateforme/portail-client",
  manifest: "package-lock.json",
  stepTicket: "TKT-000035",
  stepGrade: "B",
  stepScore: 82,
  mailTicket: "TKT-000001",
  assignee: "Camille",
  reportDate: "2026-10-21T12:00:00Z",
  sbomFile: "sbom-portail-client.json",
  sbomComponents: 412,
} as const;

export const SHOWCASE_VULNERABILITIES = [
  {
    packageName: "react-server-dom-webpack",
    cve: "CVE-2025-55182",
    fixedVersion: "19.1.2",
    severityKey: "landing.deliverables.mail.exploited",
    color: "var(--grade-f)",
  },
  {
    packageName: "path-to-regexp",
    cve: "CVE-2024-45296",
    fixedVersion: "0.1.10",
    severityKey: "landing.deliverables.mail.high",
    color: "var(--grade-d)",
  },
] as const;

export const SHOWCASE_REPORT_AXES = [
  { labelKey: "landing.deliverables.report.security", value: 88 },
  { labelKey: "landing.deliverables.report.runtimes", value: 95 },
  {
    labelKey: "landing.deliverables.report.freshness",
    value: 71,
    color: "var(--grade-c)",
  },
] as const;
