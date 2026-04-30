import BugReportOutlined from "@mui/icons-material/BugReportOutlined";
import BoltOutlined from "@mui/icons-material/BoltOutlined";
import SecurityOutlined from "@mui/icons-material/SecurityOutlined";
import CheckCircleOutlineOutlined from "@mui/icons-material/CheckCircleOutlineOutlined";
import WarningAmberOutlined from "@mui/icons-material/WarningAmberOutlined";
import InfoOutlined from "@mui/icons-material/InfoOutlined";
import type { ProjectDto } from "@/features/techHealth/api/projects";

export interface ActivityItem {
  color: string;
  text: string;
  timestamp: string;
  detail?: string;
  tooltipText?: string;
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

export interface StatsData {
  openTickets: number;
  openTicketsDelta: number;
  resolvedThisMonth: number;
  resolvedThisMonthDelta: number;
  hoursThisMonth: number;
  criticalVulnerabilities: number;
  ticketsByStatus: Record<string, number>;
  ticketsByPriority: Record<string, number>;
  unassignedOpenTickets: number;
  urgentTickets: UrgentTicket[];
  recentActivity: ActivityItem[];
}

export const EMPTY_STATS: StatsData = {
  openTickets: 0,
  openTicketsDelta: 0,
  resolvedThisMonth: 0,
  resolvedThisMonthDelta: 0,
  hoursThisMonth: 0,
  criticalVulnerabilities: 0,
  ticketsByStatus: {},
  ticketsByPriority: {},
  unassignedOpenTickets: 0,
  urgentTickets: [],
  recentActivity: [],
};

export const STATUS = [
  { key: "New", labelKey: "dashboard.status.new", color: "var(--accent)" },
  {
    key: "InProgress",
    labelKey: "dashboard.status.in_progress",
    color: "var(--cyan)",
  },
  {
    key: "Testing",
    labelKey: "dashboard.status.testing",
    color: "var(--yellow)",
  },
  {
    key: "Resolved",
    labelKey: "dashboard.status.resolved",
    color: "var(--green)",
  },
  {
    key: "Closed",
    labelKey: "dashboard.status.closed",
    color: "var(--muted2)",
  },
];

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
  panelShadow: "0 4px 14px rgba(0,0,0,0.18)",
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
    borderRadius: "20px",
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
    borderRadius: "4px",
  },
  "&::-webkit-scrollbar-track": { background: "transparent" },
  "&:hover": { scrollbarColor: `${p.scrollThumb} transparent` },
  "&:hover::-webkit-scrollbar-thumb": { background: p.scrollThumb },
});

export const avatars = [
  { bg: "linear-gradient(135deg,#f6ced5,#eaa8b6)", text: "#8b1c38" },
  { bg: "linear-gradient(135deg,#d9cef9,#bbb2ef)", text: "#3b2ea2" },
  { bg: "linear-gradient(135deg,#c5e1f7,#9ec8e8)", text: "#1f4c80" },
  { bg: "linear-gradient(135deg,#c3edd8,#9ee0bf)", text: "#1e6b46" },
  { bg: "linear-gradient(135deg,#e6ecf4,#d5deeb)", text: "#64748b" },
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

export const repoPath = (
  repositoryUrl?: string,
  repositoryType?: string,
): string => {
  if (repositoryUrl && URL.canParse(repositoryUrl)) {
    const path = new URL(repositoryUrl).pathname
      .replace(/^\//, "")
      .replace(/\.git$/, "");
    if (path) return path;
  }
  return (repositoryType ?? "git").toLowerCase();
};

export const projectTone = (project: ProjectDto, _isDark: boolean) => {
  if (project.criticalVulnerabilities > 0)
    return {
      labelKey: "dashboard.project_tone.at_risk",
      color: "var(--red)",
      dot: "var(--red)",
      Icon: WarningAmberOutlined,
    };
  if (project.healthScore >= 85)
    return {
      labelKey: "dashboard.project_tone.healthy",
      color: "var(--green)",
      dot: "var(--green)",
      Icon: CheckCircleOutlineOutlined,
    };
  return {
    labelKey: "dashboard.project_tone.monitoring",
    color: "var(--yellow)",
    dot: "var(--yellow)",
    Icon: InfoOutlined,
  };
};
