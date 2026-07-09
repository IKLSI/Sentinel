import BugReportOutlined from "@mui/icons-material/BugReportOutlined";
import BoltOutlined from "@mui/icons-material/BoltOutlined";
import SecurityOutlined from "@mui/icons-material/SecurityOutlined";

export interface ActivityItem {
  color: string;
  text: string;
  timestamp: string;
  detail?: string;
  tooltipText?: string;
  ticketId?: string;
  projectId?: string;
  count?: number;
  type?: string;
  reference?: string;
  projectName?: string;
  vulnCveId?: string;
  vulnOtherCount?: number;
  vulnCvssScore?: number;
}

export interface UrgentTicket {
  id: string;
  reference: string;
  title: string;
  priority: string;
  type: string;
  status: string;
  projectName?: string;
  assignedToName?: string;
  commentCount: number;
}

export interface VulnerabilityDetectionDataPoint {
  date: string;
  count: number;
}

export interface StatsData {
  openTickets: number;
  openTicketsDelta: number;
  resolvedThisMonth: number;
  resolvedThisMonthDelta: number;
  hoursThisMonth: number;
  criticalVulnerabilities: number;
  ticketsByStatus: Record<string, number>;
  ticketsByStatusColor: Record<string, string>;
  ticketsByPriority: Record<string, number>;
  unassignedOpenTickets: number;
  urgentTickets: UrgentTicket[];
  recentActivity: ActivityItem[];
  vulnerabilitiesDetectedPerDay: VulnerabilityDetectionDataPoint[];
}

export const EMPTY_STATS: StatsData = {
  openTickets: 0,
  openTicketsDelta: 0,
  resolvedThisMonth: 0,
  resolvedThisMonthDelta: 0,
  hoursThisMonth: 0,
  criticalVulnerabilities: 0,
  ticketsByStatus: {},
  ticketsByStatusColor: {},
  ticketsByPriority: {},
  unassignedOpenTickets: 0,
  urgentTickets: [],
  recentActivity: [],
  vulnerabilitiesDetectedPerDay: [],
};

export interface DashPalette {
  panelBg: string;
  panelBorder: string;
  panelShadow: string;
  headerBorder: string;
  textPrimary: string;
  textHeading: string;
  textSecondary: string;
  textMuted: string;
  textMuted2: string;
  kpiLabel: string;
  donutTrack: string;
  donutCenter: string;
  donutCenterLabel: string;
  donutPct: string;
  seeAll: string;
  rowBg: string;
  rowHoverBg: string;
  rowActiveBg: string;
  rowHoverRing: string;
  rowTitle: string;
  rowSub: string;
  bullet: string;
  commentIcon: string;
  typeIconDefault: string;
  typeIconSecurity: string;
  typeIconPerformance: string;
  activityDangerBg: string;
  activityDangerFg: string;
  activityOkBg: string;
  activityOkFg: string;
  activityCreatedFg: string;
  activityDetail: string;
  activityDivider: string;
  scrollThumb: string;
  vulnDanger: string;
  vulnNeutral: string;
  vulnIcon: string;
  badgeCritical: string;
  loader: string;
}

export const buildPalette = (_isDark: boolean): DashPalette => ({
  panelBg: "var(--s1)",
  panelBorder: "var(--border)",
  panelShadow: "0 2px 6px rgba(0,0,0,0.08)",
  headerBorder: "var(--border)",
  textPrimary: "var(--text)",
  textHeading: "var(--text)",
  textSecondary: "var(--text-secondary)",
  textMuted: "var(--muted2)",
  textMuted2: "var(--muted2)",
  kpiLabel: "var(--text-secondary)",
  donutTrack: "var(--s3)",
  donutCenter: "var(--text)",
  donutCenterLabel: "var(--text-secondary)",
  donutPct: "var(--muted2)",
  seeAll: "var(--accent)",
  rowBg: "transparent",
  rowHoverBg: "var(--accent-subtle)",
  rowActiveBg: "color-mix(in srgb, var(--accent) 18%, transparent)",
  rowHoverRing: "var(--accent-border)",
  rowTitle: "var(--text)",
  rowSub: "var(--text-secondary)",
  bullet: "var(--border2)",
  commentIcon: "var(--muted2)",
  typeIconDefault: "var(--muted2)",
  typeIconSecurity: "var(--red)",
  typeIconPerformance: "var(--yellow)",
  activityDangerBg: "color-mix(in srgb, var(--red) 18%, transparent)",
  activityDangerFg: "var(--red)",
  activityOkBg: "color-mix(in srgb, var(--green) 18%, transparent)",
  activityOkFg: "var(--green)",
  activityCreatedFg: "var(--accent)",
  activityDetail: "var(--text-secondary)",
  activityDivider: "var(--border)",
  scrollThumb: "var(--border2)",
  vulnDanger: "var(--red)",
  vulnNeutral: "var(--text-secondary)",
  vulnIcon: "var(--muted2)",
  badgeCritical: "var(--red)",
  loader: "var(--accent)",
});

export const buildPanelSx = (p: DashPalette) =>
  ({
    background: p.panelBg,
    borderRadius: "var(--r-xl)",
    border: `1px solid ${p.panelBorder}`,
    boxShadow: p.panelShadow,
    overflow: "hidden",
    minHeight: 0,
  }) as const;

export const buildScrollSx = (p: DashPalette) => ({
  scrollbarWidth: "thin" as const,
  scrollbarColor: "transparent transparent",
  "&::-webkit-scrollbar": { width: "4px" },
  "&::-webkit-scrollbar-thumb": {
    background: "transparent",
    borderRadius: "var(--r-xs)",
  },
  "&::-webkit-scrollbar-track": { background: "transparent" },
  "&:hover": { scrollbarColor: `${p.scrollThumb} transparent` },
  "&:hover::-webkit-scrollbar-thumb": { background: p.scrollThumb },
});

export const avatars = [
  {
    bg: "linear-gradient(135deg,var(--prio-bg-1),var(--prio-bg-2))",
    text: "var(--prio-fg)",
  },
];

export const initials = (s: string) => {
  const parts = s.split(/[\s-_]+/).filter(Boolean);
  const fromWords = parts
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
  if (fromWords.length >= 2) return fromWords.slice(0, 2);

  const compact = s.replace(/[\s-_]+/g, "").toUpperCase();
  if (compact.length >= 2) return compact.slice(0, 2);
  return compact.padEnd(2, "A").slice(0, 2);
};

export const ticketIcon = (type: string) => {
  if (type === "security") return SecurityOutlined;
  if (type === "performance") return BoltOutlined;
  return BugReportOutlined;
};

export const ticketPriority = (priority: string, _isDark: boolean) => {
  if (priority === "critical")
    return {
      labelKey: "dashboard.priority.critical",
      color: "var(--red)",
    };
  if (priority === "high")
    return {
      labelKey: "dashboard.priority.high",
      color: "var(--orange)",
    };
  if (priority === "medium")
    return {
      labelKey: "dashboard.priority.medium",
      color: "var(--blue)",
    };
  return {
    labelKey: "dashboard.priority.low",
    color: "var(--green)",
  };
};

export const PRIORITY_ORDER: Record<string, number> = {
  critical: 4,
  high: 3,
  medium: 2,
  low: 1,
};

export const GRADE_ORDER: Record<string, number> = {
  F: 0,
  E: 1,
  D: 2,
  C: 3,
  B: 4,
  A: 5,
};

export interface GradeMeta {
  color: string;
  subtle: string;
}

const GRADE_METAS: Record<string, GradeMeta> = {
  A: { color: "var(--green)", subtle: "var(--green-subtle)" },
  B: { color: "var(--teal)", subtle: "var(--teal-subtle)" },
  C: { color: "var(--yellow)", subtle: "var(--yellow-subtle)" },
  D: { color: "var(--orange)", subtle: "var(--orange-subtle)" },
  E: { color: "var(--red)", subtle: "var(--red-subtle)" },
  F: { color: "var(--red)", subtle: "var(--red-subtle)" },
};

export const gradeMeta = (grade?: string): GradeMeta =>
  GRADE_METAS[(grade ?? "A").toUpperCase()] ?? GRADE_METAS.A;

const SCORE_GRADE_THRESHOLDS: Array<[number, string]> = [
  [90, "A"],
  [75, "B"],
  [60, "C"],
  [45, "D"],
];

export const scoreToGrade = (score: number): string => {
  const match = SCORE_GRADE_THRESHOLDS.find(([min]) => score >= min);
  return match ? match[1] : "E";
};

export const HEALTH_CRITICAL_THRESHOLD = 50;
