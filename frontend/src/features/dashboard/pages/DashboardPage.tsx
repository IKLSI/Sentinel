import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { HealthScoreCircle } from "../../../components/HealthScoreCircle";
import Box from "@mui/material/Box";
import { getDashboardStats } from "../api/dashboard";
import { getProjects } from "../../techHealth/api/projects";
import type { ProjectDto } from "../../techHealth/api/projects";
import WarningAmberOutlined from "@mui/icons-material/WarningAmberOutlined";
import type { HealthGrade } from "../../../types";

// ── Constants ──────────────────────────────────────────────────────────

const TICKET_STATUS_CONFIG = [
  { key: "New",        label: "Nouveau",  color: "var(--accent)" },
  { key: "InProgress", label: "En cours", color: "var(--cyan)" },
  { key: "Testing",    label: "Tests",    color: "var(--yellow)" },
  { key: "Resolved",   label: "Résolu",   color: "var(--green)" },
  { key: "Closed",     label: "Clôturé",  color: "var(--muted)" },
];

const PRIORITY_CONFIG: Record<string, { color: string; bg: string; label: string }> = {
  Critical: { color: "var(--red)",    bg: "var(--red-subtle)",    label: "Critique" },
  High:     { color: "var(--orange)", bg: "var(--orange-subtle)", label: "Élevée"   },
  Medium:   { color: "var(--yellow)", bg: "var(--yellow-subtle)", label: "Moyenne"  },
  Low:      { color: "var(--green)",  bg: "var(--green-subtle)",  label: "Faible"   },
};

const ACTIVITY_COLOR: Record<string, string> = {
  accent: "var(--accent)",
  red:    "var(--red)",
  green:  "var(--green)",
  yellow: "var(--yellow)",
  blue:   "var(--blue)",
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
  const sw = 11;
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
          fontSize: "17px", fontWeight: 800, color: "var(--text)",
          fontFamily: "var(--font-mono)", lineHeight: 1,
        }}>
          {total}
        </Box>
        <Box sx={{
          fontSize: "8px", color: "var(--muted)", mt: "2px",
          textTransform: "uppercase", letterSpacing: "0.08em",
        }}>
          tickets
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
    borderRadius: "12px",
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",
    animation: "fadeInUp 0.5s cubic-bezier(0.16,1,0.3,1) both",
    animationDelay: `${delay}ms`,
    willChange: "opacity, transform",
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
    px: "18px", py: "13px", minHeight: "48px",
    borderBottom: "1px solid var(--border)", flexShrink: 0, gap: "8px",
  }}>
    <Box sx={{ display: "flex", alignItems: "center", gap: "8px", minWidth: 0 }}>
      <Box sx={{
        fontSize: "10px", fontWeight: 700, letterSpacing: "0.09em",
        textTransform: "uppercase", color: "var(--muted)", flexShrink: 0,
      }}>
        {title}
      </Box>
      {badge}
    </Box>
    {action}
  </Box>
);

const ViewBtn: React.FC<{ onClick: () => void }> = ({ onClick }) => (
  <Box
    component="button" onClick={onClick}
    sx={{
      all: "unset", cursor: "pointer", fontSize: "10px", fontWeight: 600,
      color: "var(--accent)", px: "8px", py: "4px", borderRadius: "5px",
      background: "var(--accent-subtle)", border: "1px solid var(--accent-border)",
      transition: "background 0.12s, border-color 0.12s", flexShrink: 0,
      "&:hover": {
        background: "color-mix(in srgb, var(--accent-subtle) 200%, transparent)",
        borderColor: "var(--accent)",
      },
    }}
  >
    Voir +
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
    <Box sx={{ p: "28px 28px 48px", display: "flex", flexDirection: "column", gap: "16px" }}>


      {/* ── KPIs ───────────────────────────────────────────────── */}
      <Box sx={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px" }}>

        <KpiCard delay={50}  loaded={loaded} label="Tickets ouverts"  value={stats.openTickets}                                               color="var(--accent)" />
        <KpiCard delay={100} loaded={loaded} label="Tickets résolus"  value={stats.resolvedThisMonth}                                        color="var(--green)"  />
        <KpiCard delay={150} loaded={loaded} label="Heures ce mois"   value={stats.hoursThisMonth}    unit="h"                               color="var(--cyan)"   />
        <KpiCard delay={200} loaded={loaded} label="CA facturable"     value={loaded ? `${(stats.billableRevenue / 1000).toFixed(0)}k` : "—"} unit="€" color="var(--yellow)" />
      </Box>

      {/* ── Milieu : tickets urgents + activité ────────────────── */}
      <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
        <Panel delay={240}>
          <PanelHead
            title="Tickets urgents"
            action={<ViewBtn onClick={() => navigate("/tickets")} />}
          />
          <Box sx={{ p: "18px 18px 16px", flex: 1 }}>
            {stats.urgentTickets.length === 0 ? (
              <Box sx={{ fontSize: "12px", color: "var(--muted)", textAlign: "center", pt: "10px" }}>
                Aucun ticket critique ou élevé en cours.
              </Box>
            ) : (
              <Box sx={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {stats.urgentTickets.map((t) => (
                  <TicketRow key={t.id} ticket={t} onClick={() => navigate(`/tickets/${t.id}`)} />
                ))}
              </Box>
            )}
          </Box>
        </Panel>

        <Panel delay={280}>
          <PanelHead title="Activité récente" />
          <Box sx={{ p: "18px 18px 16px", flex: 1 }}>
            {stats.recentActivity.length === 0 ? (
              <Box sx={{ fontSize: "11px", color: "var(--muted)", textAlign: "center", pt: "10px" }}>
                Aucune activité récente.
              </Box>
            ) : (
              <Box sx={{ display: "flex", flexDirection: "column" }}>
                {stats.recentActivity.map((item, idx) => (
                  <ActivityRow
                    key={idx}
                    item={item}
                    isLast={idx === stats.recentActivity.length - 1}
                  />
                ))}
              </Box>
            )}
          </Box>
        </Panel>
      </Box>

      {/* ── Bas : statuts | santé ──────────────────────────────── */}
      <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>

        <Panel delay={320}>
          <PanelHead
            title="Répartition par statut"
            action={<ViewBtn onClick={() => navigate("/tickets")} />}
          />
          <Box sx={{ p: "18px 20px 20px" }}>
            <StatusDistribution ticketsByStatus={stats.ticketsByStatus} />
          </Box>
        </Panel>

        <Panel delay={400}>
          <PanelHead
            title="Santé technique"
            action={<ViewBtn onClick={() => navigate("/tech-health")} />}
          />
          <Box sx={{ p: "10px 12px 12px", display: "flex", flexDirection: "column", gap: "7px" }}>
            {techProjects.length === 0 ? (
              <Box sx={{ fontSize: "12px", color: "var(--muted)", p: "10px 6px", textAlign: "center" }}>
                Aucun projet configuré.
              </Box>
            ) : (
              techProjects.slice(0, 3).map((p) => (
                <TechProjectRow key={p.id} project={p} onClick={() => navigate("/tech-health")} />
              ))
            )}
          </Box>
        </Panel>

      </Box>
    </Box>
  );
};

// ── KPI Card ──────────────────────────────────────────────────────────

const KpiCard: React.FC<{
  label: string;
  value: number | string;
  unit?: string;
  color: string;
  delay?: number;
  loaded?: boolean;
}> = ({ label, value, unit, color, delay = 0, loaded = true }) => (
  <Box sx={{
    background: "var(--s1)",
    border: "1px solid var(--border)",
    borderRadius: "12px",
    p: "24px 26px",
    display: "flex",
    flexDirection: "column",
    gap: "10px",
    position: "relative",
    overflow: "hidden",
    animation: "fadeInUp 0.5s cubic-bezier(0.16,1,0.3,1) both",
    animationDelay: `${delay}ms`,
    willChange: "opacity, transform",
    transition: "border-color 0.2s, box-shadow 0.2s",
    "&:hover": { borderColor: "var(--border2)", boxShadow: "var(--shadow)" },
    "&::after": {
      content: '""',
      position: "absolute", bottom: "-20px", right: "-20px",
      width: "80px", height: "80px", borderRadius: "50%",
      background: color, opacity: 0.04, pointerEvents: "none",
    },
  }}>
    <Box sx={{ display: "flex", alignItems: "baseline", gap: "3px" }}>
      <Box sx={{
        fontFamily: "var(--font-mono)", fontSize: "42px", fontWeight: 800,
        color: loaded ? color : "var(--muted)", letterSpacing: "-0.05em", lineHeight: 1,
      }}>
        {value}
      </Box>
      {unit && (
        <Box component="span" sx={{ fontSize: "16px", color: "var(--muted)", fontWeight: 400, ml: "2px" }}>
          {unit}
        </Box>
      )}
    </Box>
    <Box sx={{
      fontSize: "10px", fontWeight: 600, letterSpacing: "0.08em",
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
      onClick={onClick}
      sx={{
        display: "flex", alignItems: "center", gap: "9px",
        px: "4px", py: "8px", cursor: "pointer", borderRadius: "6px",
        transition: "background 0.12s",
        "&:hover": { background: "var(--s2)", "& .t-title": { color: "var(--accent)" } },
      }}
    >
      <Box sx={{
        fontSize: "9px", fontWeight: 700, color: p.color, background: p.bg,
        px: "6px", py: "2px", borderRadius: "4px", flexShrink: 0,
        letterSpacing: "0.06em", textTransform: "uppercase",
        minWidth: "48px", textAlign: "center",
      }}>
        {p.label}
      </Box>
      <Box sx={{ fontFamily: "var(--font-mono)", fontSize: "9.5px", color: "var(--muted)", flexShrink: 0 }}>
        {ticket.reference}
      </Box>
      <Box className="t-title" sx={{
        flex: 1, fontSize: "12px", fontWeight: 500, color: "var(--text)",
        overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
        letterSpacing: "-0.015em", transition: "color 0.12s",
      }}>
        {ticket.title}
      </Box>
      {ticket.projectName && (
        <Box sx={{ fontSize: "9.5px", color: "var(--muted2)", flexShrink: 0, fontFamily: "var(--font-mono)" }}>
          {ticket.projectName}
        </Box>
      )}
    </Box>
  );
};

// ── Activity Timeline ──────────────────────────────────────────────────

const ActivityRow: React.FC<{ item: ActivityItem; isLast: boolean }> = ({ item, isLast }) => {
  const color = ACTIVITY_COLOR[item.color] ?? "var(--accent)";
  const rel   = item.timestamp ? formatRelativeTime(item.timestamp) : "";
  return (
    <Box sx={{ display: "flex", gap: "12px", pb: isLast ? "0" : "16px" }}>
      <Box sx={{
        display: "flex", flexDirection: "column", alignItems: "center",
        flexShrink: 0, width: "12px", pt: "4px",
      }}>
        <Box sx={{
          width: "7px", height: "7px", borderRadius: "50%", background: color,
          flexShrink: 0, boxShadow: `0 0 6px ${color}66`,
        }} />
        {!isLast && (
          <Box sx={{ width: "1px", flex: 1, background: "var(--border)", mt: "3px" }} />
        )}
      </Box>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Box sx={{
          fontSize: "12px", color: "var(--text-secondary)", lineHeight: 1.5, mb: "4px",
          overflow: "hidden", textOverflow: "ellipsis",
          display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical",
        }}>
          {item.text}
        </Box>
        <Box sx={{ display: "flex", alignItems: "center", gap: "5px" }}>
          {item.detail && (
            <>
              <Box sx={{ fontSize: "9px", color: "var(--muted)", fontFamily: "var(--font-mono)" }}>
                {item.detail}
              </Box>
              <Box sx={{ width: "2px", height: "2px", borderRadius: "50%", background: "var(--border2)" }} />
            </>
          )}
          <Box sx={{ fontSize: "9px", color: "var(--muted)", fontFamily: "var(--font-mono)" }}>
            il y a {rel}
          </Box>
        </Box>
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
    <Box sx={{ display: "flex", flexDirection: "column", gap: "14px" }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: "24px" }}>
        <DonutChart segments={segments} size={130} />
        <Box sx={{ display: "flex", flexDirection: "column", gap: "11px", flex: 1 }}>
          {TICKET_STATUS_CONFIG.map(({ key, label, color }) => {
            const count = safeStatus[key] ?? 0;
            const pct   = total > 0 ? Math.round((count / total) * 100) : 0;
            return (
              <Box key={key}>
                <Box sx={{ display: "flex", alignItems: "center", gap: "6px", mb: "4px" }}>
                  <Box sx={{ width: "7px", height: "7px", borderRadius: "2px", background: color, flexShrink: 0 }} />
                  <Box sx={{ flex: 1, fontSize: "12px", color: "var(--muted2)" }}>{label}</Box>
                  <Box sx={{ fontFamily: "var(--font-mono)", fontSize: "12px", fontWeight: 700, color: "var(--text)" }}>
                    {count}
                  </Box>
                </Box>
                <Box sx={{ height: "4px", background: "var(--s3)", borderRadius: "99px", overflow: "hidden" }}>
                  <Box sx={{
                    height: "100%", width: `${pct}%`, background: color,
                    borderRadius: "99px", transition: "width 0.8s cubic-bezier(0.16,1,0.3,1)",
                  }} />
                </Box>
              </Box>
            );
          })}
        </Box>
      </Box>
    </Box>
  );
};

// ── Tech Project Row ───────────────────────────────────────────────────

const TechProjectRow: React.FC<{ project: ProjectDto; onClick: () => void }> = ({ project, onClick }) => (
  <Box
    component="button" onClick={onClick}
    sx={{
      all: "unset", display: "flex", alignItems: "center", gap: "9px",
      background: "var(--s2)", border: "1px solid var(--border)",
      borderRadius: "9px", p: "12px 14px", cursor: "pointer",
      transition: "border-color 0.15s, background 0.15s",
      "&:hover": { borderColor: "var(--accent-border)", background: "var(--accent-subtle)" },
    }}
  >
    <HealthScoreCircle score={project.healthScore} grade={project.healthGrade as HealthGrade} size={36} />
    <Box sx={{ flex: 1, overflow: "hidden" }}>
      <Box sx={{
        fontSize: "11px", fontWeight: 600, color: "var(--text)",
        overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
      }}>
        {project.name}
      </Box>
      <Box sx={{ fontSize: "9.5px", color: "var(--muted)", mt: "1px", fontFamily: "var(--font-mono)" }}>
        {project.repositoryType}
      </Box>
    </Box>
    {project.criticalVulnerabilities > 0 && (
      <Box sx={{
        display: "flex", alignItems: "center", gap: "3px",
        fontSize: "9px", color: "var(--red)", fontFamily: "var(--font-mono)", fontWeight: 700,
        flexShrink: 0, background: "var(--red-subtle)", px: "5px", py: "2px", borderRadius: "4px",
      }}>
        <WarningAmberOutlined sx={{ fontSize: 9 }} />
        {project.criticalVulnerabilities} CVE
      </Box>
    )}
  </Box>
);
