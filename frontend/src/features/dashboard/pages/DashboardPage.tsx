import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";
import ChevronRightOutlined from "@mui/icons-material/ChevronRightOutlined";
import ConfirmationNumberOutlined from "@mui/icons-material/ConfirmationNumberOutlined";
import CheckCircleOutlineOutlined from "@mui/icons-material/CheckCircleOutlineOutlined";
import PersonOffOutlined from "@mui/icons-material/PersonOffOutlined";
import ShieldOutlined from "@mui/icons-material/ShieldOutlined";
import TrendingUpOutlined from "@mui/icons-material/TrendingUpOutlined";
import TrendingDownOutlined from "@mui/icons-material/TrendingDownOutlined";
import BugReportOutlined from "@mui/icons-material/BugReportOutlined";
import BoltOutlined from "@mui/icons-material/BoltOutlined";
import SecurityOutlined from "@mui/icons-material/SecurityOutlined";
import MessageOutlined from "@mui/icons-material/MessageOutlined";
import ErrorOutlineOutlined from "@mui/icons-material/ErrorOutlineOutlined";
import CheckOutlined from "@mui/icons-material/CheckOutlined";
import WarningAmberOutlined from "@mui/icons-material/WarningAmberOutlined";
import InfoOutlined from "@mui/icons-material/InfoOutlined";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { getDashboardStats } from "../api/dashboard";
import { getProjects } from "../../techHealth/api/projects";
import type { ProjectDto } from "../../techHealth/api/projects";
import { useToast } from "../../../hooks/useToast";

interface ActivityItem {
  color: string;
  text: string;
  timestamp: string;
  detail?: string;
}

interface UrgentTicket {
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

interface StatsData {
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

const EMPTY_STATS: StatsData = {
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

const STATUS = [
  { key: "New", label: "Nouveau", color: "#6366f1" },
  { key: "InProgress", label: "En cours", color: "#58aee8" },
  { key: "Testing", label: "Tests", color: "#e8bb3a" },
  { key: "Resolved", label: "Résolu", color: "#5dc895" },
  { key: "Closed", label: "Clôturé", color: "#94a3b8" },
];

const panelSx = {
  background: "#fff",
  borderRadius: "20px",
  border: "1px solid rgba(226,232,240,0.9)",
  boxShadow: "0 4px 14px rgba(15,23,42,0.08)",
  overflow: "hidden",
  minHeight: 0,
} as const;

const avatars = [
  { bg: "linear-gradient(135deg,#f6ced5,#eaa8b6)", text: "#8b1c38" },
  { bg: "linear-gradient(135deg,#d9cef9,#bbb2ef)", text: "#3b2ea2" },
  { bg: "linear-gradient(135deg,#c5e1f7,#9ec8e8)", text: "#1f4c80" },
  { bg: "linear-gradient(135deg,#c3edd8,#9ee0bf)", text: "#1e6b46" },
  { bg: "linear-gradient(135deg,#e6ecf4,#d5deeb)", text: "#64748b" },
];

const initials = (s: string) => {
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


const ticketIcon = (type: string) => {
  if (type === "security") return SecurityOutlined;
  if (type === "performance") return BoltOutlined;
  return BugReportOutlined;
};


const ticketPriority = (priority: string) => {
  if (priority === "critical") return { label: "Critique", color: "#c7364f" };
  if (priority === "high") return { label: "Haute", color: "#c56a1a" };
  if (priority === "medium") return { label: "Moyenne", color: "#1f6fb2" };
  return { label: "Basse", color: "#2f8f63" };
};

const PRIORITY_ORDER: Record<string, number> = {
  critical: 4,
  high: 3,
  medium: 2,
  low: 1,
};


const repoPath = (repositoryUrl?: string, repositoryType?: string): string => {
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

const projectTone = (project: ProjectDto) => {
  if (project.criticalVulnerabilities > 0)
    return {
      label: "À risque",
      color: "#c7364f",
      dot: "#e74660",
      Icon: WarningAmberOutlined,
    };
  if (project.healthScore >= 85)
    return {
      label: "Sain",
      color: "#2f8f63",
      dot: "#56c58f",
      Icon: CheckCircleOutlineOutlined,
    };
  return {
    label: "Surveillance",
    color: "#ad6f2f",
    dot: "#e6a94c",
    Icon: InfoOutlined,
  };
};

const Donut: React.FC<{ map: Record<string, number> }> = ({ map }) => {
  const total = STATUS.reduce((sum, s) => sum + (map[s.key] ?? 0), 0);
  const r = 40;
  const c = 2 * Math.PI * r;
  let offset = 0;
  return (
    <Box sx={{ position: "relative", width: "140px", height: "140px" }}>
      <svg
        viewBox="0 0 100 100"
        style={{ width: "140px", height: "140px", transform: "rotate(-90deg)" }}
      >
        <defs>
          <style>{`
            @keyframes donut-draw { from { stroke-dashoffset: ${c.toFixed(1)}; } }
            .donut-seg { animation: donut-draw 0.8s ease-out both; }
          `}</style>
        </defs>
        <circle
          cx="50"
          cy="50"
          r={r}
          stroke="#eef3fa"
          strokeWidth="10"
          fill="none"
        />
        {STATUS.map((s, i) => {
          const value = map[s.key] ?? 0;
          if (!value || !total) return null;
          const seg = (value / total) * c;
          const dashOffset = -offset;
          const out = (
            <circle
              key={s.key}
              className="donut-seg"
              cx="50"
              cy="50"
              r={r}
              stroke={s.color}
              strokeWidth="10"
              fill="none"
              strokeLinecap="round"
              strokeDasharray={`${Math.max(seg - 1.5, 0)} ${c}`}
              strokeDashoffset={dashOffset}
              style={{ animationDelay: `${i * 0.1}s` }}
            />
          );
          offset += seg;
          return out;
        })}
      </svg>
      <Box
        sx={{
          position: "absolute",
          inset: 0,
          display: "grid",
          placeItems: "center",
        }}
      >
        <Box sx={{ textAlign: "center" }}>
          <Box
            sx={{
              fontSize: "36px",
              fontWeight: 800,
              lineHeight: 1,
              letterSpacing: "-0.04em",
              color: "#111827",
            }}
          >
            {total}
          </Box>
          <Box
            sx={{
              mt: "3px",
              fontFamily: "var(--font-mono)",
              fontSize: "12px",
              letterSpacing: "0.18em",
              color: "#6b7a95",
            }}
          >
            TOTAL
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

const KpiCard: React.FC<{
  label: string;
  value: number;
  valueColor: string;
  icon: React.ReactNode;
  delta?: number;
  inverse?: boolean;
  badge?: boolean;
}> = ({
  label,
  value,
  valueColor,
  icon,
  delta,
  inverse = false,
  badge = false,
}) => {
  const positive = (delta ?? 0) >= 0;
  const good = inverse ? !positive : positive;
  return (
    <Box
      sx={{
        ...panelSx,
        p: "12px 15px",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
        }}
      >
        <Box
          sx={{
            fontFamily: "var(--font-mono)",
            fontSize: "10px",
            letterSpacing: "0.16em",
            textTransform: "uppercase",
            color: "#6f829f",
          }}
        >
          {label}
        </Box>
        <Box
          sx={{
            width: "36px",
            height: "36px",
            borderRadius: "12px",
            display: "grid",
            placeItems: "center",
            color: valueColor,
            bgcolor: `${valueColor}18`,
          }}
        >
          {icon}
        </Box>
      </Box>
      <Box
        sx={{ mt: "8px", display: "flex", alignItems: "baseline", gap: "7px" }}
      >
        <Box
          sx={{
            fontSize: "34px",
            fontWeight: 800,
            lineHeight: 1,
            letterSpacing: "-0.04em",
            color: valueColor,
          }}
        >
          {value}
        </Box>
        {delta !== undefined &&
          delta !== 0 &&
          (badge ? (
            <Box
              sx={{
                display: "inline-flex",
                alignItems: "center",
                gap: "2px",
                color: "#c7364f",
                fontWeight: 700,
                fontSize: "16px",
              }}
            >
              <TrendingUpOutlined sx={{ fontSize: 14 }} />
              {Math.abs(delta)}
            </Box>
          ) : (
            <Box
              sx={{
                display: "inline-flex",
                alignItems: "center",
                gap: "2px",
                color: good ? "#2f8f63" : "#c7364f",
                fontWeight: 700,
                fontSize: "16px",
              }}
            >
              {good ? (
                <TrendingUpOutlined sx={{ fontSize: 14 }} />
              ) : (
                <TrendingDownOutlined sx={{ fontSize: 14 }} />
              )}
              {Math.abs(delta)}
            </Box>
          ))}
      </Box>
    </Box>
  );
};

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [stats, setStats] = useState<StatsData>(EMPTY_STATS);
  const [projects, setProjects] = useState<ProjectDto[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      const [statsRes, projectsRes] = await Promise.allSettled([
        getDashboardStats(),
        getProjects(),
      ]);
      if (!mounted) return;
      if (statsRes.status === "fulfilled") setStats(statsRes.value);
      else
        showToast(
          "Impossible de charger les statistiques du dashboard.",
          "error",
        );
      if (projectsRes.status === "fulfilled") setProjects(projectsRes.value);
      else showToast("Impossible de charger les projets.", "error");
      setLoading(false);
    };
    void load();
    return () => {
      mounted = false;
    };
  }, [showToast]);

  const urgent = useMemo(
    () =>
      [...stats.urgentTickets]
        .sort(
          (a, b) =>
            (PRIORITY_ORDER[b.priority] ?? 0) -
            (PRIORITY_ORDER[a.priority] ?? 0),
        )
        .slice(0, 8),
    [stats.urgentTickets],
  );
  const activity = stats.recentActivity.slice(0, 8);
  const projectRows = projects.slice(0, 4);

  const bugCount = urgent.filter((t) => t.type === "bug").length;
  const secCount = urgent.filter((t) => t.type === "security").length;
  const totalStatuses = STATUS.reduce(
    (sum, s) => sum + (stats.ticketsByStatus[s.key] ?? 0),
    0,
  );
  const urgentSummary = useMemo(() => {
    if (urgent.length === 0) return "Aucun ticket urgent pour le moment";
    const parts: string[] = [];
    if (bugCount > 0) parts.push(`${bugCount} ${bugCount > 1 ? "bugs" : "bug"}`);
    if (secCount > 0)
      parts.push(`${secCount} ${secCount > 1 ? "failles de sécurité" : "faille de sécurité"}`);
    const otherCount = urgent.length - bugCount - secCount;
    if (otherCount > 0)
      parts.push(`${otherCount} ${otherCount > 1 ? "autres" : "autre"}`);
    return parts.join(" · ");
  }, [bugCount, secCount, urgent]);



  const projectsSyncText = useMemo(() => {
    const latestScan = projects
      .map((project) => project.lastScanAt)
      .filter((value): value is string => Boolean(value))
      .map((value) => new Date(value))
      .filter((date) => !Number.isNaN(date.getTime()))
      .sort((a, b) => b.getTime() - a.getTime())[0];

    if (!latestScan) return "Aucune synchronisation disponible";
    return `Dernière synchronisation ${formatDistanceToNow(latestScan, { addSuffix: true, locale: fr })}`;
  }, [projects]);

  if (loading) {
    return (
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh" }}>
        <CircularProgress size={36} thickness={3} sx={{ color: "#6366f1" }} />
      </Box>
    );
  }

  return (
    <Box sx={{ p: "16px 20px", minHeight: "100vh" }}>
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "repeat(12, minmax(0, 1fr))",
          gridTemplateRows: "auto 1.1fr 1fr",
          gap: "14px",
          height: "calc(100vh - 32px)",
          minHeight: "720px",
        }}
      >
        <Box sx={{ gridColumn: "span 3" }}>
          <KpiCard
            label="Tickets ouverts"
            value={stats.openTickets}
            valueColor="#5c50d8"
            icon={<ConfirmationNumberOutlined sx={{ fontSize: 17 }} />}
            delta={stats.openTicketsDelta}
            inverse
          />
        </Box>
        <Box sx={{ gridColumn: "span 3" }}>
          <KpiCard
            label="Résolus / mois"
            value={stats.resolvedThisMonth}
            valueColor="#3a9578"
            icon={<CheckCircleOutlineOutlined sx={{ fontSize: 17 }} />}
            delta={stats.resolvedThisMonthDelta}
          />
        </Box>
        <Box sx={{ gridColumn: "span 3" }}>
          <KpiCard
            label="Non assignés"
            value={stats.unassignedOpenTickets}
            valueColor="#cd7422"
            icon={<PersonOffOutlined sx={{ fontSize: 17 }} />}
          />
        </Box>
        <Box sx={{ gridColumn: "span 3" }}>
          <KpiCard
            label="Vulns critiques"
            value={stats.criticalVulnerabilities}
            valueColor="#c7364f"
            icon={<ShieldOutlined sx={{ fontSize: 17 }} />}
            delta={stats.criticalVulnerabilities}
            badge
          />
        </Box>

        <Box
          sx={{
            ...panelSx,
            gridColumn: "span 7",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <Box
            sx={{
              px: "18px",
              py: "12px",
              borderBottom: "1px solid #e6ebf3",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <Box>
              <Box
                sx={{
                  fontSize: "15px",
                  lineHeight: 1.1,
                  fontWeight: 700,
                  color: "#121829",
                  letterSpacing: "-0.02em",
                }}
              >
                Tickets urgents
              </Box>
              <Box sx={{ mt: "6px", color: "#5f718d", fontSize: "11px" }}>
                {urgentSummary}
              </Box>
            </Box>
            <Box
              component="button"
              onClick={() => navigate("/tickets")}
              sx={{
                all: "unset",
                cursor: "pointer",
                color: "#5a3ee1",
                fontSize: "11px",
                fontWeight: 700,
                display: "inline-flex",
                alignItems: "center",
                gap: "2px",
              }}
            >
              Voir tout <ChevronRightOutlined sx={{ fontSize: 18 }} />
            </Box>
          </Box>
          <Box
            sx={{
              p: "8px",
              display: "flex",
              flexDirection: "column",
              gap: "7px",
              flex: 1,
              minHeight: 0,
              overflowY: "auto",
              scrollbarWidth: "thin",
              scrollbarColor: "transparent transparent",
              "&::-webkit-scrollbar": { width: "4px" },
              "&::-webkit-scrollbar-thumb": { background: "transparent", borderRadius: "4px" },
              "&::-webkit-scrollbar-track": { background: "transparent" },
              "&:hover": { scrollbarColor: "#c8d1e0 transparent" },
              "&:hover::-webkit-scrollbar-thumb": { background: "#c8d1e0" },
            }}
          >
            {Array.from({ length: 8 }).map((_, i) => {
              const t = urgent[i];
              if (!t) {
                return (
                  <Box key={`urgent-empty-${i}`} sx={{ minHeight: "48px" }} />
                );
              }
              const Icon = ticketIcon(t.type);
              const badge = ticketPriority(t.priority);
              const av = avatars[i % avatars.length];
              return (
                <Box
                  key={t.id}
                  component="button"
                  onClick={() => navigate(`/tickets/${t.id}`)}
                  sx={{
                    all: "unset",
                    cursor: "pointer",
                    borderRadius: "12px",
                    minHeight: "48px",
                    px: "10px",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    background: "#fff",
                    transition: "background 120ms ease, box-shadow 120ms ease",
                    "&:hover": {
                      background: "#f0f4ff",
                      boxShadow: "0 0 0 1.5px #6366f122",
                    },
                    "&:active": {
                      background: "#e8eeff",
                    },
                  }}
                >
                  <Icon
                    sx={{
                      fontSize: 16,
                      color:
                        t.type === "security"
                          ? "#cf2943"
                          : t.type === "performance"
                            ? "#ca7825"
                            : "#61708b",
                    }}
                  />
                  <Box sx={{ minWidth: 0, flex: 1 }}>
                    <Box
                      sx={{
                        fontSize: "12px",
                        fontWeight: 700,
                        color: "#131a2b",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {t.title}
                    </Box>
                    <Box
                      sx={{
                        mt: "2px",
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                        fontSize: "10px",
                        color: "#5d6d87",
                        whiteSpace: "nowrap",
                      }}
                    >
                      <span>{t.projectName ?? t.reference}</span>
                      <span
                        style={{
                          color: badge.color,
                          textTransform: "uppercase",
                          letterSpacing: "0.08em",
                          fontWeight: 700,
                        }}
                      >
                        • {badge.label}
                      </span>
                      <span style={{ color: "#c8d1e0" }}>•</span>
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 2,
                        }}
                      >
                        <MessageOutlined
                          sx={{ fontSize: 12, color: "#7c8ca4" }}
                        />
                        {t.commentCount ?? 0}
                      </span>
                    </Box>
                  </Box>
                  <Box
                    sx={{
                      width: 28,
                      height: 28,
                      borderRadius: "999px",
                      background: av.bg,
                      color: av.text,
                      fontWeight: 700,
                      display: "grid",
                      placeItems: "center",
                      fontSize: "10px",
                    }}
                  >
                    {t.assignedToName ? initials(t.assignedToName) : "?"}
                  </Box>
                </Box>
              );
            })}
          </Box>
        </Box>

        <Box
          sx={{
            ...panelSx,
            gridColumn: "span 5",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <Box
            sx={{ px: "18px", py: "12px", borderBottom: "1px solid #e6ebf3" }}
          >
            <Box
              sx={{
                fontSize: "15px",
                lineHeight: 1.1,
                fontWeight: 700,
                color: "#121829",
                letterSpacing: "-0.02em",
              }}
            >
              Activité récente
            </Box>
            <Box sx={{ mt: "6px", color: "#5f718d", fontSize: "11px" }}>
              Mise à jour temps réel
            </Box>
          </Box>
          <Box sx={{ p: "8px 14px", flex: 1, minHeight: 0, overflowY: "auto", scrollbarWidth: "thin", scrollbarColor: "transparent transparent", "&::-webkit-scrollbar": { width: "4px" }, "&::-webkit-scrollbar-thumb": { background: "transparent", borderRadius: "4px" }, "&::-webkit-scrollbar-track": { background: "transparent" }, "&:hover": { scrollbarColor: "#c8d1e0 transparent" }, "&:hover::-webkit-scrollbar-thumb": { background: "#c8d1e0" } }}>
            <Box sx={{ display: "flex", flexDirection: "column" }}>
              {activity.map((a, idx) => {
                const danger = a.color === "red";
                const accentColor = danger ? "#c7364f" : "#2f8f63";
                const boldPrefix = danger ? "Vulnérabilité critique" : "Ticket résolu";
                const rest = a.text.startsWith(boldPrefix)
                  ? a.text.slice(boldPrefix.length)
                  : a.text;
                const hasBoldPrefix = a.text.startsWith(boldPrefix);
                return (
                  <React.Fragment key={`${a.timestamp}-${a.text}`}>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      minHeight: "48px",
                    }}
                  >
                    <Box
                      sx={{
                        width: 26,
                        height: 26,
                        borderRadius: "999px",
                        bgcolor: danger ? "#f8dce3" : "#c7efd9",
                        color: accentColor,
                        display: "grid",
                        placeItems: "center",
                        flexShrink: 0,
                        zIndex: 1,
                      }}
                    >
                      {danger ? (
                        <ErrorOutlineOutlined sx={{ fontSize: 14 }} />
                      ) : (
                        <CheckOutlined sx={{ fontSize: 14 }} />
                      )}
                    </Box>
                    <Box sx={{ minWidth: 0 }}>
                      <Box
                        sx={{
                          fontSize: "11px",
                          color: "#131a2b",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {hasBoldPrefix ? (
                          <>
                            <Box
                              component="span"
                              sx={{ fontWeight: 700, color: accentColor }}
                            >
                              {boldPrefix}
                            </Box>
                            <span>{rest}</span>
                          </>
                        ) : (
                          <Box component="span" sx={{ fontWeight: 700 }}>{a.text}</Box>
                        )}
                      </Box>
                      <Box
                        sx={{
                          mt: "1px",
                          fontSize: "10px",
                          color: "#60728f",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {a.detail}
                      </Box>
                    </Box>
                  </Box>
                  {idx < activity.length - 1 && (
                    <Box
                      sx={{
                        width: "1px",
                        height: "16px",
                        bgcolor: "#d9e2ef",
                        ml: "13px",
                        flexShrink: 0,
                        my: "-4.5px",
                      }}
                    />
                  )}
                  </React.Fragment>
                );
              })}
            </Box>
          </Box>

        </Box>

        <Box sx={{ ...panelSx, gridColumn: "span 4", p: "16px 18px", display: "flex", flexDirection: "column" }}>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <Box>
              <Box sx={{ fontSize: "15px", fontWeight: 700, color: "#131a2b", letterSpacing: "-0.02em", lineHeight: 1.1 }}>
                Répartition
              </Box>
              <Box sx={{ mt: "4px", color: "#5f718d", fontSize: "11px" }}>
                Statut des tickets actifs
              </Box>
            </Box>
          </Box>
          <Box
            sx={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              gap: "20px",
              mt: "12px",
            }}
          >
            <Donut map={stats.ticketsByStatus} />
            <Box sx={{ flex: 1, display: "flex", flexDirection: "column", gap: "10px" }}>
              {STATUS.map((s) => {
                const count = stats.ticketsByStatus[s.key] ?? 0;
                const pct =
                  totalStatuses > 0
                    ? Math.round((count / totalStatuses) * 100)
                    : 0;
                return (
                  <Box
                    key={s.key}
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      fontSize: "13px",
                      color: "#131a2b",
                    }}
                  >
                    <Box sx={{ display: "inline-flex", alignItems: "center", gap: "8px" }}>
                      <Box sx={{ width: 9, height: 9, borderRadius: "999px", bgcolor: s.color, flexShrink: 0 }} />
                      <span>{s.label}</span>
                    </Box>
                    <Box sx={{ fontFamily: "var(--font-mono)", fontSize: "12px" }}>
                      <strong>{count}</strong>{" "}
                      <span style={{ color: "#7f8ea7" }}>{pct}%</span>
                    </Box>
                  </Box>
                );
              })}
            </Box>
          </Box>
        </Box>

        <Box
          sx={{
            ...panelSx,
            gridColumn: "span 8",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <Box
            sx={{
              px: "18px",
              py: "12px",
              borderBottom: "1px solid #e6ebf3",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <Box>
              <Box
                sx={{
                  fontSize: "15px",
                  lineHeight: 1.1,
                  fontWeight: 700,
                  color: "#131a2b",
                  letterSpacing: "-0.02em",
                }}
              >
                Projets
              </Box>
              <Box sx={{ mt: "6px", color: "#5f718d", fontSize: "11px" }}>
                {projectsSyncText}
              </Box>
            </Box>
            <Box
              component="button"
              onClick={() => navigate("/projects")}
              sx={{
                all: "unset",
                cursor: "pointer",
                color: "#5a3ee1",
                fontSize: "11px",
                fontWeight: 700,
                display: "inline-flex",
                alignItems: "center",
                gap: "2px",
              }}
            >
              Voir tout <ChevronRightOutlined sx={{ fontSize: 18 }} />
            </Box>
          </Box>
          <Box
            sx={{
              p: "10px",
              display: "flex",
              flexDirection: "column",
              gap: "8px",
              flex: 1,
              minHeight: 0,
              overflowY: "auto",
              scrollbarWidth: "thin",
              scrollbarColor: "transparent transparent",
              "&::-webkit-scrollbar": { width: "4px" },
              "&::-webkit-scrollbar-thumb": { background: "transparent", borderRadius: "4px" },
              "&::-webkit-scrollbar-track": { background: "transparent" },
              "&:hover": { scrollbarColor: "#c8d1e0 transparent" },
              "&:hover::-webkit-scrollbar-thumb": { background: "#c8d1e0" },
            }}
          >
            {projectRows.map((p) => {
              const t = projectTone(p);
              const totalTickets = p.totalTickets;
              return (
                <Box
                  key={p.id}
                  component="button"
                  onClick={() => navigate(`/projects/${p.id}`)}
                  sx={{
                    all: "unset",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    minHeight: "48px",
                    px: "10px",
                    gap: "10px",
                    borderRadius: "12px",
                    background: "#fff",
                    transition: "background 120ms ease, box-shadow 120ms ease",
                    "&:hover": {
                      background: "#f0f4ff",
                      boxShadow: "0 0 0 1.5px #6366f122",
                    },
                    "&:active": {
                      background: "#e8eeff",
                    },
                  }}
                >
                  <t.Icon sx={{ fontSize: 18, color: t.color, flexShrink: 0 }} />
                  <Box sx={{ minWidth: 0, flex: 1 }}>
                    <Box sx={{ fontSize: "12px", fontWeight: 700, color: "#131a2b", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {p.name}
                    </Box>
                    <Box sx={{ mt: "2px", fontSize: "10px", fontFamily: "var(--font-mono)", color: "#7a8faa", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {repoPath(p.repositoryUrl, p.repositoryType)}
                    </Box>
                  </Box>
                  <Box sx={{ display: "flex", alignItems: "center", gap: "12px", flexShrink: 0 }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "11px", fontWeight: 600, color: "#4a5a72" }}>
                      <ConfirmationNumberOutlined sx={{ fontSize: 14, color: "#687a95" }} />
                      <span>{totalTickets}</span>
                    </Box>
                    <Box sx={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "11px", fontWeight: 600, color: p.criticalVulnerabilities > 0 ? "#c7364f" : "#4a5a72" }}>
                      <ShieldOutlined sx={{ fontSize: 14 }} />
                      <span>{p.criticalVulnerabilities}</span>
                    </Box>
                  </Box>
                </Box>
              );
            })}
          </Box>
        </Box>
      </Box>
    </Box>
  );
};
