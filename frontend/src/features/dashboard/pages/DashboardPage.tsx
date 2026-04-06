import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { HealthScoreCircle } from "../../../components/HealthScoreCircle";
import Box from "@mui/material/Box";
import { getDashboardStats } from "../api/dashboard";
import { getProjects } from "../../techHealth/api/projects";
import type { ProjectDto } from "../../techHealth/api/projects";
import WarningAmberOutlined from "@mui/icons-material/WarningAmberOutlined";
import ConfirmationNumberOutlined from "@mui/icons-material/ConfirmationNumberOutlined";
import TaskAltOutlined from "@mui/icons-material/TaskAltOutlined";
import AccessTimeOutlined from "@mui/icons-material/AccessTimeOutlined";
import EuroOutlined from "@mui/icons-material/EuroOutlined";
import ChevronRightOutlined from "@mui/icons-material/ChevronRightOutlined";
import ErrorOutlined from "@mui/icons-material/ErrorOutlined";
import InfoOutlined from "@mui/icons-material/InfoOutlined";
import StorageOutlined from "@mui/icons-material/StorageOutlined";
import type { HealthGrade } from "../../../types";

// ── Constants ──────────────────────────────────────────────────────────

const TICKET_STATUS_CONFIG = [
  { key: "New",        label: "Nouveau",  color: "var(--accent)" },
  { key: "InProgress", label: "En cours", color: "var(--cyan)" },
  { key: "Testing",    label: "Tests",    color: "var(--yellow)" },
  { key: "Resolved",   label: "Résolu",   color: "var(--green)" },
  { key: "Closed",     label: "Clôturé",  color: "var(--muted)" },
];

const PRIORITY_CONFIG: Record<string, { color: string; bg: string }> = {
  Critical: { color: "var(--red)",    bg: "var(--red-subtle)"    },
  High:     { color: "var(--orange)", bg: "var(--orange-subtle)" },
  Medium:   { color: "var(--yellow)", bg: "var(--yellow-subtle)" },
  Low:      { color: "var(--green)",  bg: "var(--green-subtle)"  },
};

const PRIORITY_LEVEL: Record<string, number> = {
  Critical: 4, High: 3, Medium: 2, Low: 1,
};


const ACTIVITY_CONFIG: Record<string, { color: string; Icon: React.ElementType }> = {
  accent: { color: "var(--accent)", Icon: InfoOutlined          },
  red:    { color: "var(--red)",    Icon: ErrorOutlined         },
  green:  { color: "var(--green)",  Icon: TaskAltOutlined       },
  yellow: { color: "var(--yellow)", Icon: WarningAmberOutlined  },
  blue:   { color: "var(--blue)",   Icon: StorageOutlined       },
};

// ── Types ──────────────────────────────────────────────────────────────

interface ActivityItem {
  color: string;
  text: string;
  timestamp: string;
  detail?: string;
}

interface UrgentTicket {
  id: string; reference: string; title: string;
  priority: string; type: string; projectName?: string;
  slaBreached: boolean; slaDeadline?: string;
}

interface StatsData {
  openTickets: number; openTicketsDelta: number;
  resolvedThisMonth: number; resolvedThisMonthDelta: number;
  hoursThisMonth: number;
  billableRevenue: number; unbilledRevenue: number;
  criticalVulnerabilities: number;
  slaRespected: number; slaRespectedDelta: number;
  ticketsByStatus: Record<string, number>;
  ticketsByPriority: Record<string, number>;
  unassignedOpenTickets: number;
  overdueInvoicesCount: number;
  overdueInvoicesAmount: number;
  urgentTickets: UrgentTicket[];
  recentActivity: ActivityItem[];
}

const EMPTY_STATS: StatsData = {
  openTickets: 0, openTicketsDelta: 0,
  resolvedThisMonth: 0, resolvedThisMonthDelta: 0,
  hoursThisMonth: 0,
  billableRevenue: 0, unbilledRevenue: 0,
  criticalVulnerabilities: 0,
  slaRespected: 0, slaRespectedDelta: 0,
  ticketsByStatus: {}, ticketsByPriority: {},
  unassignedOpenTickets: 0,
  overdueInvoicesCount: 0, overdueInvoicesAmount: 0,
  urgentTickets: [], recentActivity: [],
};

// ── Helpers ────────────────────────────────────────────────────────────

function formatRelativeTime(ts: string): string {
  const diff = Date.now() - new Date(ts).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 2) return "à l'instant";
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.floor(hours / 24)}j`;
}

// ── SVG: Donut Chart ────────────────────────────────────────────────────

const DonutChart: React.FC<{
  segments: { color: string; value: number; key: string }[];
  size?: number;
}> = ({ segments, size = 96 }) => {
  const sw = 10;
  const r = (size - sw) / 2;
  const circ = 2 * Math.PI * r;
  const total = segments.reduce((s, seg) => s + seg.value, 0);

  if (total === 0) return (
    <Box sx={{
      width: size, height: size, flexShrink: 0,
      display: "flex", alignItems: "center", justifyContent: "center",
    }}>
      <Box sx={{
        width: size - sw * 2, height: size - sw * 2,
        borderRadius: "50%", border: `${sw}px solid var(--s3)`,
      }} />
    </Box>
  );

  let cumPct = 0;
  return (
    <Box sx={{ position: "relative", width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)", display: "block" }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--s3)" strokeWidth={sw} />
        {segments.map((seg) => {
          if (seg.value === 0) return null;
          const pct = seg.value / total;
          const dash = pct * circ - 1.5;
          const offset = circ * (1 - cumPct);
          cumPct += pct;
          return (
            <circle
              key={seg.key}
              cx={size / 2} cy={size / 2} r={r}
              fill="none" stroke={seg.color} strokeWidth={sw}
              strokeDasharray={`${Math.max(dash, 0)} ${circ - Math.max(dash, 0)}`}
              strokeDashoffset={offset}
              style={{ transition: "stroke-dasharray 0.9s cubic-bezier(0.16,1,0.3,1)" }}
            />
          );
        })}
      </svg>
      <Box sx={{
        position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        zIndex: 1,
      }}>
        <Box sx={{
          fontSize: "18px", fontWeight: 800, color: "var(--text)",
          fontFamily: "var(--font-mono)", lineHeight: 1, letterSpacing: "-0.04em",
        }}>
          {total}
        </Box>
        <Box sx={{
          fontSize: "8px", color: "var(--muted)", mt: "3px",
          textTransform: "uppercase", letterSpacing: "0.1em",
        }}>
          total
        </Box>
      </Box>
    </Box>
  );
};

// ── Shared primitives ──────────────────────────────────────────────────

const Panel: React.FC<{ children: React.ReactNode; sx?: object; delay?: number }> = ({
  children, sx, delay = 0,
}) => (
  <Box sx={{
    background: "var(--s1)",
    border: "1px solid var(--border)",
    borderRadius: "14px",
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",
    minHeight: 0,
    animation: "fadeInUp 0.5s cubic-bezier(0.16,1,0.3,1) both",
    animationDelay: `${delay}ms`,
    willChange: "opacity, transform",
    transition: "border-color 0.2s",
    "&:hover": { borderColor: "var(--border2)" },
    ...sx,
  }}>
    {children}
  </Box>
);

const PanelHead: React.FC<{
  title: string;
  action?: React.ReactNode;
  badge?: React.ReactNode;
}> = ({ title, action, badge }) => (
  <Box sx={{
    display: "flex", alignItems: "center", justifyContent: "space-between",
    px: "16px", py: "12px", minHeight: "46px",
    flexShrink: 0, gap: "8px",
    background: "linear-gradient(180deg, var(--s2) 0%, transparent 100%)",
  }}>
    <Box sx={{ display: "flex", alignItems: "center", gap: "8px", minWidth: 0 }}>
      <Box sx={{
        fontSize: "11px", fontWeight: 700, letterSpacing: "0.06em",
        textTransform: "uppercase", color: "var(--muted2)", flexShrink: 0,
      }}>
        {title}
      </Box>
      {badge}
    </Box>
    {action}
  </Box>
);

const ViewBtn: React.FC<{ onClick: () => void; label?: string }> = ({ onClick, label = "Voir tout" }) => (
  <Box
    component="button" onClick={onClick}
    sx={{
      all: "unset", cursor: "pointer", display: "flex", alignItems: "center", gap: "2px",
      fontSize: "10px", fontWeight: 600, color: "var(--muted2)",
      px: "8px", py: "4px", borderRadius: "6px",
      transition: "color 0.12s, background 0.12s", flexShrink: 0,
      "&:hover": { color: "var(--accent)", background: "var(--accent-subtle)" },
    }}
  >
    {label}
    <ChevronRightOutlined sx={{ fontSize: 12 }} />
  </Box>
);

const CountBadge: React.FC<{ count: number; color?: string }> = ({ count, color = "var(--muted)" }) => (
  <Box sx={{
    fontSize: "9px", fontWeight: 700, fontFamily: "var(--font-mono)",
    color, background: "var(--s3)", border: "1px solid var(--border)",
    px: "6px", py: "1px", borderRadius: "99px", flexShrink: 0,
  }}>
    {count}
  </Box>
);

// ── Page ───────────────────────────────────────────────────────────────

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [stats, setStats]               = useState<StatsData>(EMPTY_STATS);
  const [techProjects, setTechProjects] = useState<ProjectDto[]>([]);
  const [loaded, setLoaded]             = useState(false);

  useEffect(() => {
    Promise.all([
      getDashboardStats().then(setStats).catch(() => {}),
      getProjects().then(setTechProjects).catch(() => {}),
    ]).finally(() => setLoaded(true));
  }, []);

  return (
    <Box sx={{
      p: "20px",
      display: "flex", flexDirection: "column", gap: "12px",
      height: "100vh", boxSizing: "border-box", overflow: "hidden",
    }}>

      {/* ── KPIs ───────────────────────────────────────────────── */}
      <Box sx={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px", flexShrink: 0 }}>
        <KpiCard
          delay={60} loaded={loaded}
          label="Tickets ouverts" value={stats.openTickets}
          color="var(--accent)" icon={<ConfirmationNumberOutlined sx={{ fontSize: 16 }} />}
          delta={stats.openTicketsDelta}
        />
        <KpiCard
          delay={110} loaded={loaded}
          label="Résolus ce mois" value={stats.resolvedThisMonth}
          color="var(--green)" icon={<TaskAltOutlined sx={{ fontSize: 16 }} />}
          delta={stats.resolvedThisMonthDelta}
        />
        <KpiCard
          delay={160} loaded={loaded}
          label="Non assignés" value={stats.unassignedOpenTickets}
          color="var(--yellow)" icon={<AccessTimeOutlined sx={{ fontSize: 16 }} />}
        />
        <KpiCard
          delay={210} loaded={loaded}
          label="Factures en retard" value={stats.overdueInvoicesCount}
          color="var(--red)" icon={<EuroOutlined sx={{ fontSize: 16 }} />}
        />
      </Box>

      {/* ── Milieu : tickets urgents + activité ────────────────── */}
      <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", flex: 1, minHeight: 0 }}>
        <Panel delay={260}>
          <PanelHead
            title="Tickets urgents"
            action={<ViewBtn onClick={() => navigate("/tickets")} />}
          />
          <Box sx={{ p: "8px", display: "flex", flexDirection: "column", gap: "4px", flex: 1, overflowY: "auto", minHeight: 0 }}>
            {stats.urgentTickets.length === 0 ? (
              <EmptyState text="Aucun ticket critique ou élevé en cours." />
            ) : (
              stats.urgentTickets.map((t) => (
                <TicketRow key={t.id} ticket={t} onClick={() => navigate(`/tickets/${t.id}`)} />
              ))
            )}
          </Box>
        </Panel>

        <Panel delay={300}>
          <PanelHead
            title="Activité récente"
          />
          <Box sx={{ p: "8px", display: "flex", flexDirection: "column", gap: "4px", flex: 1, overflowY: "auto", minHeight: 0 }}>
            {stats.recentActivity.length === 0 ? (
              <EmptyState text="Aucune activité récente." />
            ) : (
              stats.recentActivity.map((item, idx) => (
                <ActivityCard key={idx} item={item} />
              ))
            )}
          </Box>
        </Panel>
      </Box>

      {/* ── Bas : statuts | santé ──────────────────────────────── */}
      <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", flex: 1, minHeight: 0 }}>

        <Panel delay={340}>
          <PanelHead
            title="Répartition par statut"
            action={<ViewBtn onClick={() => navigate("/tickets")} />}
          />
          <Box sx={{ p: "20px 22px", flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
            <StatusDistribution ticketsByStatus={stats.ticketsByStatus} />
          </Box>
        </Panel>

        <Panel delay={420}>
          <PanelHead
            title="Santé technique"
            badge={techProjects.length > 0
              ? <CountBadge count={techProjects.length} />
              : undefined}
            action={<ViewBtn onClick={() => navigate("/tech-health")} />}
          />
          <Box sx={{ p: "8px", display: "flex", flexDirection: "column", gap: "4px", flex: 1, overflowY: "auto", minHeight: 0 }}>
            {techProjects.length === 0 ? (
              <EmptyState text="Aucun projet configuré." />
            ) : (
              techProjects.slice(0, 4).map((p) => (
                <TechProjectRow key={p.id} project={p} onClick={() => navigate("/tech-health")} />
              ))
            )}
          </Box>
        </Panel>

      </Box>
    </Box>
  );
};

// ── Empty State ────────────────────────────────────────────────────────

const EmptyState: React.FC<{ text: string }> = ({ text }) => (
  <Box sx={{
    flex: 1, display: "flex", alignItems: "center", justifyContent: "center",
    py: "20px",
  }}>
    <Box sx={{ fontSize: "11px", color: "var(--muted)", textAlign: "center" }}>
      {text}
    </Box>
  </Box>
);

// ── KPI Card ──────────────────────────────────────────────────────────

const KpiCard: React.FC<{
  label: string;
  value: number | string;
  unit?: string;
  color: string;
  icon: React.ReactNode;
  delay?: number;
  loaded?: boolean;
  delta?: number;
}> = ({ label, value, unit, color, icon, delay = 0, loaded = true, delta }) => (
  <Box sx={{
    background: "var(--s1)",
    border: "1px solid var(--border)",
    borderRadius: "14px",
    p: "20px 22px 18px",
    display: "flex",
    flexDirection: "column",
    position: "relative",
    overflow: "hidden",
    animation: "fadeInUp 0.5s cubic-bezier(0.16,1,0.3,1) both",
    animationDelay: `${delay}ms`,
    willChange: "opacity, transform",
    cursor: "default",
    "&::after": {
      content: '""',
      position: "absolute", bottom: "-32px", right: "-32px",
      width: "110px", height: "110px", borderRadius: "50%",
      background: `radial-gradient(circle, ${color} 0%, transparent 70%)`,
      opacity: 0.08, pointerEvents: "none",
    },
  }}>
    {/* Icon + delta row */}
    <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", mb: "14px" }}>
      <Box sx={{
        width: "32px", height: "32px", borderRadius: "9px", flexShrink: 0,
        background: `color-mix(in srgb, ${color} 14%, transparent)`,
        border: `1px solid color-mix(in srgb, ${color} 22%, transparent)`,
        display: "flex", alignItems: "center", justifyContent: "center",
        color,
      }}>
        {icon}
      </Box>
      {loaded && delta !== undefined && delta !== 0 && (
        <Box sx={{
          fontSize: "10px", fontWeight: 700, fontFamily: "var(--font-mono)",
          color: delta > 0 ? "var(--green)" : "var(--red)",
          background: delta > 0 ? "var(--green-subtle)" : "var(--red-subtle)",
          border: `1px solid color-mix(in srgb, ${delta > 0 ? "var(--green)" : "var(--red)"} 28%, transparent)`,
          px: "6px", py: "2px", borderRadius: "5px",
        }}>
          {delta > 0 ? "+" : ""}{delta}
        </Box>
      )}
    </Box>

    {/* Value */}
    <Box sx={{ display: "flex", alignItems: "baseline", gap: "2px", mb: "6px" }}>
      <Box sx={{
        fontFamily: "var(--font-mono)", fontSize: "36px", fontWeight: 800,
        color: loaded ? "var(--text)" : "var(--s3)",
        letterSpacing: "-0.06em", lineHeight: 1,
        transition: "color 0.3s",
      }}>
        {loaded ? value : "—"}
      </Box>
      {unit && loaded && (
        <Box component="span" sx={{
          fontSize: "14px", color: "var(--muted)", fontWeight: 500, ml: "2px",
        }}>
          {unit}
        </Box>
      )}
    </Box>

    {/* Label */}
    <Box sx={{
      fontSize: "10px", fontWeight: 600, letterSpacing: "0.07em",
      textTransform: "uppercase", color: "var(--muted)",
    }}>
      {label}
    </Box>

  </Box>
);

// ── Ticket Row ─────────────────────────────────────────────────────────

const TicketRow: React.FC<{ ticket: UrgentTicket; onClick: () => void }> = ({ ticket, onClick }) => {
  const key = ticket.priority.charAt(0).toUpperCase() + ticket.priority.slice(1);
  const p   = PRIORITY_CONFIG[key] ?? PRIORITY_CONFIG.Medium;
  return (
    <Box
      component="button"
      onClick={onClick}
      sx={{
        all: "unset", display: "flex", alignItems: "center", gap: "10px",
        background: "var(--s2)", border: "1px solid var(--border)",
        borderRadius: "8px", p: "6px 12px", cursor: "pointer", flex: 1,
        transition: "border-color 0.15s, background 0.15s, transform 0.15s",
        "&:hover": {
          borderColor: `color-mix(in srgb, ${p.color} 35%, transparent)`,
          background: p.bg,
          transform: "translateX(2px)",
        },
      }}
    >
      {/* Level bars */}
      <Box sx={{ display: "flex", alignItems: "flex-end", gap: "1.5px", height: "10px", flexShrink: 0, color: p.color }}>
        {[1, 2, 3, 4].map(i => (
          <Box key={i} sx={{ width: "3px", height: `${4 + i * 1.5}px`, borderRadius: "1px", background: "currentColor", opacity: i <= (PRIORITY_LEVEL[key] ?? 1) ? 1 : 0.15 }} />
        ))}
      </Box>

      {/* Titre + méta */}
      <Box sx={{ flex: 1, overflow: "hidden" }}>
        <Box sx={{
          fontSize: "12px", fontWeight: 600, color: "var(--text)",
          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
          letterSpacing: "-0.02em",
        }}>
          {ticket.title}
        </Box>
        <Box sx={{ display: "flex", alignItems: "center", gap: "5px", mt: "2px" }}>
          <Box sx={{ fontSize: "9px", color: "var(--muted)", fontFamily: "var(--font-mono)" }}>
            {ticket.reference}
          </Box>
          {ticket.projectName && (
            <>
              <Box sx={{ width: "2px", height: "2px", borderRadius: "50%", background: "var(--border2)", flexShrink: 0 }} />
              <Box sx={{ fontSize: "9px", color: "var(--muted2)", fontFamily: "var(--font-mono)" }}>
                {ticket.projectName}
              </Box>
            </>
          )}
        </Box>
      </Box>

      {/* Right */}
      <ChevronRightOutlined sx={{ fontSize: 13, color: "var(--muted)", opacity: 0.35, flexShrink: 0 }} />
    </Box>
  );
};

// ── Activity Card ──────────────────────────────────────────────────────

const ActivityCard: React.FC<{ item: ActivityItem }> = ({ item }) => {
  const cfg = ACTIVITY_CONFIG[item.color] ?? ACTIVITY_CONFIG.accent;
  return (
    <Box sx={{
      display: "flex", alignItems: "center", gap: "10px",
      background: "var(--s2)", border: "1px solid var(--border)",
      borderRadius: "8px", p: "6px 12px", cursor: "default",
    }}>
      <Box sx={{
        width: "28px", height: "28px", borderRadius: "8px", flexShrink: 0,
        display: "flex", alignItems: "center", justifyContent: "center",
        color: cfg.color,
      }}>
        <cfg.Icon sx={{ fontSize: 14 }} />
      </Box>
      <Box sx={{ flex: 1, overflow: "hidden" }}>
        <Box sx={{
          fontSize: "12px", fontWeight: 600, color: "var(--text)",
          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
          letterSpacing: "-0.02em",
        }}>
          {item.text}
        </Box>
        {item.detail && (
          <Box sx={{ fontSize: "9px", color: "var(--muted)", fontFamily: "var(--font-mono)", mt: "2px" }}>
            {item.detail}
          </Box>
        )}
      </Box>
    </Box>
  );
};

// ── Status Distribution ────────────────────────────────────────────────

const StatusDistribution: React.FC<{ ticketsByStatus: Record<string, number> }> = ({ ticketsByStatus }) => {
  const safeStatus = ticketsByStatus ?? {};
  const total = TICKET_STATUS_CONFIG.reduce((s, { key }) => s + (safeStatus[key] ?? 0), 0);
  const segments = TICKET_STATUS_CONFIG.map(({ key, color }) => ({
    key, color, value: safeStatus[key] ?? 0,
  }));
  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: "28px" }}>
      <DonutChart segments={segments} size={136} />
      <Box sx={{ display: "flex", flexDirection: "column", gap: "10px", flex: 1 }}>
        {TICKET_STATUS_CONFIG.map(({ key, label, color }) => {
          const count = safeStatus[key] ?? 0;
          const pct   = total > 0 ? Math.round((count / total) * 100) : 0;
          return (
            <Box key={key}>
              <Box sx={{ display: "flex", alignItems: "center", gap: "7px", mb: "5px" }}>
                <Box sx={{
                  width: "8px", height: "8px", borderRadius: "3px",
                  background: color, flexShrink: 0,
                }} />
                <Box sx={{ flex: 1, fontSize: "11px", color: "var(--muted2)", letterSpacing: "-0.01em" }}>
                  {label}
                </Box>
                <Box sx={{
                  fontFamily: "var(--font-mono)", fontSize: "11px",
                  fontWeight: 700, color: "var(--text)",
                }}>
                  {count}
                </Box>
                <Box sx={{
                  fontFamily: "var(--font-mono)", fontSize: "9px",
                  color: "var(--muted)", minWidth: "28px", textAlign: "right",
                }}>
                  {pct}%
                </Box>
              </Box>
              <Box sx={{ height: "3px", background: "var(--s3)", borderRadius: "99px", overflow: "hidden" }}>
                <Box sx={{
                  height: "100%", width: `${pct}%`, background: color,
                  borderRadius: "99px",
                  transition: "width 0.9s cubic-bezier(0.16,1,0.3,1)",
                }} />
              </Box>
            </Box>
          );
        })}
      </Box>
    </Box>
  );
};

// ── Tech Project Row ───────────────────────────────────────────────────

const TechProjectRow: React.FC<{ project: ProjectDto; onClick: () => void }> = ({ project, onClick }) => (
  <Box
    component="button" onClick={onClick}
    sx={{
      all: "unset", display: "flex", alignItems: "center", gap: "10px",
      background: "var(--s2)", border: "1px solid var(--border)",
      borderRadius: "8px", p: "6px 12px", cursor: "pointer", flex: 1,
      transition: "border-color 0.15s, background 0.15s, transform 0.15s",
      "&:hover": {
        borderColor: "var(--accent-border)",
        background: "var(--accent-subtle)",
        transform: "translateX(2px)",
      },
    }}
  >
    <HealthScoreCircle score={project.healthScore} grade={project.healthGrade as HealthGrade} size={36} />
    <Box sx={{ flex: 1, overflow: "hidden" }}>
      <Box sx={{
        fontSize: "12px", fontWeight: 600, color: "var(--text)",
        overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
        letterSpacing: "-0.02em",
      }}>
        {project.name}
      </Box>
      <Box sx={{
        fontSize: "9px", color: "var(--muted)", mt: "2px",
        fontFamily: "var(--font-mono)",
      }}>
        {project.repositoryType}
      </Box>
    </Box>
    {project.criticalVulnerabilities > 0 && (
      <Box sx={{
        display: "flex", alignItems: "center", gap: "4px",
        fontSize: "9px", color: "var(--red)", fontFamily: "var(--font-mono)", fontWeight: 700,
        flexShrink: 0, background: "var(--red-subtle)", px: "6px", py: "3px", borderRadius: "5px",
        border: "1px solid color-mix(in srgb, var(--red) 25%, transparent)",
      }}>
        <WarningAmberOutlined sx={{ fontSize: 10 }} />
        {project.criticalVulnerabilities} CVE
      </Box>
    )}
    <ChevronRightOutlined sx={{ fontSize: 14, color: "var(--muted)", opacity: 0.4, flexShrink: 0 }} />
  </Box>
);
