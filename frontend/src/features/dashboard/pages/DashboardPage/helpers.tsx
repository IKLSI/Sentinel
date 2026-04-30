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
  { key: "New", labelKey: "dashboard.status.new", color: "#6366f1" },
  {
    key: "InProgress",
    labelKey: "dashboard.status.in_progress",
    color: "#58aee8",
  },
  { key: "Testing", labelKey: "dashboard.status.testing", color: "#e8bb3a" },
  { key: "Resolved", labelKey: "dashboard.status.resolved", color: "#5dc895" },
  { key: "Closed", labelKey: "dashboard.status.closed", color: "#94a3b8" },
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

export const buildPalette = (isDark: boolean): DashPalette =>
  isDark
    ? {
        panelBg: "#0d1120",
        panelBorder: "#1e2a42",
        panelShadow: "0 4px 14px rgba(0,0,0,0.45)",
        headerBorder: "#1e2a42",
        textPrimary: "#e6eaf6",
        textHeading: "#e6eaf6",
        textSecondary: "#a0aec9",
        textMuted: "#7488aa",
        textMuted2: "#7488aa",
        kpiLabel: "#a0aec9",
        donutTrack: "#192036",
        donutCenter: "#e6eaf6",
        donutCenterLabel: "#a0aec9",
        donutPct: "#7488aa",
        seeAll: "#818cf8",
        rowBg: "transparent",
        rowHoverBg: "rgba(99,102,241,0.10)",
        rowActiveBg: "rgba(99,102,241,0.18)",
        rowHoverRing: "rgba(129,140,248,0.30)",
        rowTitle: "#e6eaf6",
        rowSub: "#a0aec9",
        bullet: "#263352",
        commentIcon: "#7488aa",
        typeIconDefault: "#94a3b8",
        typeIconSecurity: "#f87171",
        typeIconPerformance: "#f59e0b",
        activityDangerBg: "rgba(239,68,68,0.18)",
        activityDangerFg: "#f87171",
        activityOkBg: "rgba(34,197,94,0.18)",
        activityOkFg: "#4ade80",
        activityDetail: "#a0aec9",
        activityDivider: "#1e2a42",
        scrollThumb: "#263352",
        vulnDanger: "#f87171",
        vulnNeutral: "#a0aec9",
        vulnIcon: "#7488aa",
        badgeCritical: "#f87171",
        loader: "#818cf8",
      }
    : {
        panelBg: "#fff",
        panelBorder: "rgba(226,232,240,0.9)",
        panelShadow: "0 4px 14px rgba(15,23,42,0.08)",
        headerBorder: "#e6ebf3",
        textPrimary: "#131a2b",
        textHeading: "#121829",
        textSecondary: "#5f718d",
        textMuted: "#6b7a95",
        textMuted2: "#7f8ea7",
        kpiLabel: "#6f829f",
        donutTrack: "#eef3fa",
        donutCenter: "#111827",
        donutCenterLabel: "#6b7a95",
        donutPct: "#7f8ea7",
        seeAll: "#5a3ee1",
        rowBg: "#fff",
        rowHoverBg: "#f0f4ff",
        rowActiveBg: "#e8eeff",
        rowHoverRing: "#6366f122",
        rowTitle: "#131a2b",
        rowSub: "#5d6d87",
        bullet: "#c8d1e0",
        commentIcon: "#7c8ca4",
        typeIconDefault: "#61708b",
        typeIconSecurity: "#cf2943",
        typeIconPerformance: "#ca7825",
        activityDangerBg: "#f8dce3",
        activityDangerFg: "#c7364f",
        activityOkBg: "#c7efd9",
        activityOkFg: "#2f8f63",
        activityDetail: "#60728f",
        activityDivider: "#d9e2ef",
        scrollThumb: "#c8d1e0",
        vulnDanger: "#c7364f",
        vulnNeutral: "#4a5a72",
        vulnIcon: "#687a95",
        badgeCritical: "#c7364f",
        loader: "#6366f1",
      };

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

export const ticketPriority = (priority: string, isDark: boolean) => {
  if (priority === "critical")
    return {
      labelKey: "dashboard.priority.critical",
      color: isDark ? "#f87171" : "#c7364f",
    };
  if (priority === "high")
    return {
      labelKey: "dashboard.priority.high",
      color: isDark ? "#fb923c" : "#c56a1a",
    };
  if (priority === "medium")
    return {
      labelKey: "dashboard.priority.medium",
      color: isDark ? "#60a5fa" : "#1f6fb2",
    };
  return {
    labelKey: "dashboard.priority.low",
    color: isDark ? "#4ade80" : "#2f8f63",
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
  if (repositoryUrl) {
    try {
      const path = new URL(repositoryUrl).pathname
        .replace(/^\//, "")
        .replace(/\.git$/, "");
      if (path) return path;
    } catch {}
  }
  return (repositoryType ?? "git").toLowerCase();
};

export const projectTone = (project: ProjectDto, isDark: boolean) => {
  if (project.criticalVulnerabilities > 0)
    return {
      labelKey: "dashboard.project_tone.at_risk",
      color: isDark ? "#f87171" : "#c7364f",
      dot: isDark ? "#f87171" : "#e74660",
      Icon: WarningAmberOutlined,
    };
  if (project.healthScore >= 85)
    return {
      labelKey: "dashboard.project_tone.healthy",
      color: isDark ? "#4ade80" : "#2f8f63",
      dot: isDark ? "#4ade80" : "#56c58f",
      Icon: CheckCircleOutlineOutlined,
    };
  return {
    labelKey: "dashboard.project_tone.monitoring",
    color: isDark ? "#fbbf24" : "#ad6f2f",
    dot: isDark ? "#fbbf24" : "#e6a94c",
    Icon: InfoOutlined,
  };
};
