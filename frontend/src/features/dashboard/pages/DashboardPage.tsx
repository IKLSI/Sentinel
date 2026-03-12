import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Topbar } from "../../../layouts/Topbar";
import { HealthScoreCircle } from "../../../components/HealthScoreCircle";
import Box from "@mui/material/Box";
import { getDashboardStats } from "../api/dashboard";
import { getProjects } from "../../techHealth/api/projects";
import type { ProjectDto } from "../../techHealth/api/projects";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import WarningAmberOutlined from "@mui/icons-material/WarningAmberOutlined";
import TrendingUpOutlined from "@mui/icons-material/TrendingUpOutlined";
import type { HealthGrade } from "../../../types";

const TICKET_STATUS_CONFIG = [
  { key: "New",         label: "Nouveau",  color: "var(--accent)" },
  { key: "Analysis",   label: "Analyse",  color: "var(--cyan)" },
  { key: "InProgress", label: "En cours", color: "var(--blue)" },
  { key: "Testing",    label: "Tests",    color: "var(--yellow)" },
  { key: "Resolved",   label: "Résolu",   color: "var(--green)" },
  { key: "Closed",     label: "Clôturé",  color: "var(--muted)" },
];

interface UrgentTicket {
  id: string; reference: string; title: string;
  priority: string; type: string; projectName?: string;
  slaBreached: boolean; slaDeadline?: string;
}
interface ActivityItem {
  color: string; text: string; timestamp: string; detail?: string;
}
interface StatsData {
  openTickets: number; openTicketsDelta: number;
  slaRespected: number; slaRespectedDelta: number;
  hoursThisMonth: number; billableRevenue: number;
  unbilledRevenue: number; criticalVulnerabilities: number;
  ticketsByStatus: Record<string, number>;
  urgentTickets: UrgentTicket[];
  recentActivity: ActivityItem[];
}

const EMPTY_STATS: StatsData = {
  openTickets: 0, openTicketsDelta: 0, slaRespected: 100,
  slaRespectedDelta: 0, hoursThisMonth: 0, billableRevenue: 0,
  unbilledRevenue: 0, criticalVulnerabilities: 0,
  ticketsByStatus: {}, urgentTickets: [], recentActivity: [],
};

function formatSlaRemaining(deadline?: string): { text: string; warn: boolean } {
  if (!deadline) return { text: "—", warn: false };
  const diff = new Date(deadline).getTime() - Date.now();
  if (diff <= 0) return { text: "Dépassé", warn: true };
  const totalMin = Math.floor(diff / 60000);
  const totalH   = Math.floor(diff / 3600000);
  const days     = Math.floor(totalH / 24);
  const hours    = totalH % 24;
  const mins     = totalMin % 60;
  let text: string;
  if (totalMin < 60)    text = `${totalMin}min`;
  else if (totalH < 24) text = mins > 0 ? `${totalH}h ${mins}m` : `${totalH}h`;
  else                  text = hours > 0 ? `${days}j ${hours}h` : `${days}j`;
  return { text, warn: totalH < 4 };
}

const PRIORITY_COLORS: Record<string, string> = {
  critical: "var(--red)", high: "var(--orange)",
  medium: "var(--yellow)", low: "var(--green)",
};
const ACTIVITY_COLORS: Record<string, string> = {
  red: "var(--red)", accent: "var(--accent)",
  green: "var(--green)", orange: "var(--orange)",
};

const Card: React.FC<{
  title: string;
  action?: React.ReactNode;
  noPadding?: boolean;
  children: React.ReactNode;
  sx?: object;
}> = ({ title, action, noPadding, children, sx }) => (
  <Box sx={{
    background: "var(--s1)",
    border: "1px solid var(--border)",
    borderRadius: "12px",
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",
    ...sx,
  }}>
    <Box sx={{
      display: "flex", alignItems: "center",
      justifyContent: "space-between",
      px: "16px", py: "10px", minHeight: "48px",
      borderBottom: "1px solid var(--border)",
    }}>
      <Box sx={{
        fontSize: "11px", fontWeight: 700,
        color: "var(--muted)", letterSpacing: "0.08em",
        textTransform: "uppercase",
      }}>
        {title}
      </Box>
      {action}
    </Box>
    <Box sx={noPadding ? { flex: 1 } : { p: "14px 16px", flex: 1 }}>
      {children}
    </Box>
  </Box>
);

const actionLinkSx = {
  all: "unset" as const,
  cursor: "pointer",
  fontSize: "11px",
  fontWeight: 600,
  color: "var(--accent)",
  px: "10px", py: "5px",
  borderRadius: "6px",
  background: "var(--accent-subtle)",
  border: "1px solid var(--accent-border)",
  transition: "background 0.12s, border-color 0.12s",
  "&:hover": { background: "color-mix(in srgb, var(--accent-subtle) 180%, transparent)", borderColor: "var(--accent)" },
};

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [stats, setStats]               = useState<StatsData>(EMPTY_STATS);
  const [techProjects, setTechProjects] = useState<ProjectDto[]>([]);

  useEffect(() => {
    getDashboardStats().then(setStats).catch(() => {});
    getProjects().then(setTechProjects).catch(() => {});
  }, []);

  return (
    <>
      <Topbar title="" subtitle={undefined} />

      <Box sx={{ p: "20px 24px", display: "flex", flexDirection: "column", gap: "14px" }}>

        {stats.criticalVulnerabilities > 0 && (
          <Box className="alert-banner" onClick={() => navigate("/tech-health")}>
            <WarningAmberOutlined sx={{ fontSize: 15, color: "var(--red)", flexShrink: 0 }} />
            <Box className="alert-text">
              <strong>{stats.criticalVulnerabilities} vulnérabilités critiques</strong>{" "}
              détectées — vérifier la santé technique.
            </Box>
            <button className="alert-btn" onClick={(e) => { e.stopPropagation(); navigate("/tech-health"); }}>
              Voir →
            </button>
          </Box>
        )}

        <Box sx={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
          <KpiCard label="Tickets ouverts" value={stats.openTickets} color="var(--accent)"
            trend={<><TrendingUpOutlined sx={{ fontSize: 10 }} /> {stats.openTicketsDelta} cette semaine</>}
            trendColor="var(--red)"
          />
          <KpiCard label="SLA respectés" value={stats.slaRespected} unit="%" color="var(--green)"
            trend={<>+{stats.slaRespectedDelta}% vs mois dernier</>}
            trendColor="var(--green)"
          />
          <KpiCard label="Heures ce mois" value={stats.hoursThisMonth} unit="h" color="var(--cyan)"
            trend="saisies ce mois"
          />
          <KpiCard label="CA facturable" value={`${(stats.billableRevenue / 1000).toFixed(0)}k`} unit="€"
            color="var(--yellow)"
            trend={<>{(stats.unbilledRevenue / 1000).toFixed(1)}k€ non facturés</>}
            trendColor="var(--orange)"
          />
        </Box>

        <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
          <Card
            title="Tickets urgents"
            action={<Box component="button" sx={actionLinkSx} onClick={() => navigate("/tickets")}>Voir +</Box>}
          >
            {stats.urgentTickets.length === 0 ? (
              <Box sx={{ fontSize: "12px", color: "var(--muted)" }}>Aucun ticket urgent.</Box>
            ) : (
              <Box sx={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                {stats.urgentTickets.slice(0, 3).map((t) => (
                  <TicketRow key={t.id} ticket={t} onClick={() => navigate(`/tickets/${t.id}`)} />
                ))}
              </Box>
            )}
          </Card>

          <Card title="Activité récente" noPadding>
            {stats.recentActivity.length === 0 ? (
              <Box sx={{ fontSize: "12px", color: "var(--muted)", p: "14px 16px" }}>Aucune activité.</Box>
            ) : (
              <Box>
                {stats.recentActivity.slice(0, 3).map((item, idx) => (
                  <ActivityRow key={idx} item={item} last={idx === Math.min(stats.recentActivity.length, 3) - 1} />
                ))}
              </Box>
            )}
          </Card>
        </Box>

        <Card
          title="Répartition des tickets"
          noPadding
          action={<Box component="button" sx={actionLinkSx} onClick={() => navigate("/tickets")}>Voir +</Box>}
        >
          <TicketDistribution ticketsByStatus={stats.ticketsByStatus} />
        </Card>

        <Card
          title="Santé technique"
          action={<Box component="button" sx={actionLinkSx} onClick={() => navigate("/tech-health")}>Voir +</Box>}
        >
          <Box sx={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "8px" }}>
            {techProjects.length === 0 ? (
              <Box sx={{ gridColumn: "1/-1", fontSize: "12px", color: "var(--muted)" }}>
                Aucun projet configuré.
              </Box>
            ) : (
              techProjects.map((p) => (
                <Box
                  key={p.id}
                  component="button"
                  onClick={() => navigate("/tech-health")}
                  sx={{
                    all: "unset", display: "flex", alignItems: "center", gap: "10px",
                    background: "var(--s2)", border: "1px solid var(--border)",
                    borderRadius: "9px", p: "12px", cursor: "pointer",
                    transition: "border-color 0.15s, background 0.15s",
                    "&:hover": { borderColor: "var(--accent-border)", background: "var(--accent-subtle)" },
                  }}
                >
                  <HealthScoreCircle score={p.healthScore} grade={p.healthGrade as HealthGrade} size={36} />
                  <Box sx={{ flex: 1, overflow: "hidden" }}>
                    <Box sx={{ fontSize: "11.5px", fontWeight: 600, color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {p.name}
                    </Box>
                    <Box sx={{ fontSize: "10px", color: "var(--muted)", mt: "1px", fontFamily: "var(--font-mono)" }}>
                      {p.repositoryType}
                    </Box>
                    {p.criticalVulnerabilities > 0 && (
                      <Box sx={{ display: "flex", alignItems: "center", gap: "3px", mt: "3px", fontSize: "10px", color: "var(--red)", fontFamily: "var(--font-mono)" }}>
                        <WarningAmberOutlined sx={{ fontSize: 9 }} />
                        {p.criticalVulnerabilities} CVE
                      </Box>
                    )}
                  </Box>
                </Box>
              ))
            )}
          </Box>
        </Card>

      </Box>
    </>
  );
};

const KpiCard: React.FC<{
  label: string; value: number | string; unit?: string;
  color: string; trend?: React.ReactNode; trendColor?: string;
}> = ({ label, value, unit, color, trend, trendColor }) => (
  <Box sx={{
    flex: 1, minWidth: 160,
    background: "var(--s1)", border: "1px solid var(--border)",
    borderRadius: "12px", p: "16px 18px",
    borderTop: `2px solid ${color}`,
    transition: "box-shadow 0.2s",
    "&:hover": { boxShadow: "0 4px 20px rgba(0,0,0,0.08)" },
  }}>
    <Box sx={{
      fontSize: "10px", fontWeight: 600, color: "var(--muted)",
      letterSpacing: "0.1em", textTransform: "uppercase", mb: "10px",
    }}>
      {label}
    </Box>
    <Box sx={{
      fontSize: "30px", fontWeight: 800, color,
      letterSpacing: "-0.04em", lineHeight: 1, mb: "8px",
      fontFamily: "var(--font-mono)",
    }}>
      {value}
      {unit && (
        <Box component="span" sx={{ fontSize: "14px", color: "var(--muted)", fontWeight: 400, ml: "2px" }}>
          {unit}
        </Box>
      )}
    </Box>
    {trend && (
      <Box sx={{
        fontSize: "11px", color: trendColor ?? "var(--muted2)",
        display: "flex", alignItems: "center", gap: "3px",
      }}>
        {trend}
      </Box>
    )}
  </Box>
);

const TicketDistribution: React.FC<{ ticketsByStatus: Record<string, number> }> = ({ ticketsByStatus }) => {
  const total = TICKET_STATUS_CONFIG.reduce((s, { key }) => s + (ticketsByStatus[key] ?? 0), 0);
  return (
    <Box sx={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)" }}>
      {TICKET_STATUS_CONFIG.map(({ key, label, color }, idx) => {
        const count = ticketsByStatus[key] ?? 0;
        const pct   = total > 0 ? Math.round((count / total) * 100) : 0;
        return (
          <Box key={key} sx={{
            p: "14px 16px",
            borderRight: idx < 5 ? "1px solid var(--border)" : "none",
          }}>
            <Box sx={{ display: "flex", alignItems: "baseline", gap: "4px", mb: "4px" }}>
              <Box component="span" sx={{ fontFamily: "var(--font-mono)", fontSize: "22px", fontWeight: 700, color, lineHeight: 1 }}>
                {count}
              </Box>
              <Box component="span" sx={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--muted)" }}>
                {pct}%
              </Box>
            </Box>
            <Box sx={{ fontSize: "10px", color: "var(--muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", mb: "8px" }}>
              {label}
            </Box>
            <Box sx={{ height: "2px", background: "var(--border)", borderRadius: "99px", overflow: "hidden" }}>
              <Box sx={{ width: `${pct}%`, height: "100%", background: color, borderRadius: "99px", transition: "width 0.5s ease" }} />
            </Box>
          </Box>
        );
      })}
    </Box>
  );
};

const TicketRow: React.FC<{ ticket: UrgentTicket; onClick: () => void }> = ({ ticket, onClick }) => {
  const sla = formatSlaRemaining(ticket.slaDeadline);
  return (
    <Box onClick={onClick} sx={{
      display: "flex", alignItems: "center", gap: "10px",
      p: "9px 11px", borderRadius: "8px",
      border: "1px solid var(--border)", background: "var(--s2)",
      cursor: "pointer", transition: "background 0.12s, border-color 0.12s",
      "&:hover": { background: "var(--accent-subtle)", borderColor: "var(--accent-border)" },
    }}>
      <Box sx={{
        width: 7, height: 7, borderRadius: "50%", flexShrink: 0,
        background: PRIORITY_COLORS[ticket.priority] ?? "var(--muted)",
      }} />
      <Box sx={{ flex: 1, overflow: "hidden" }}>
        <Box sx={{ fontSize: "10px", color: "var(--muted)", fontFamily: "var(--font-mono)", mb: "2px" }}>
          {ticket.reference}{ticket.projectName ? ` · ${ticket.projectName}` : ""}
        </Box>
        <Box sx={{ fontSize: "12px", fontWeight: 500, color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {ticket.title}
        </Box>
      </Box>
      <Box sx={{
        fontFamily: "var(--font-mono)", fontSize: "10px", fontWeight: 600, flexShrink: 0,
        color: ticket.slaBreached ? "var(--red)" : sla.warn ? "var(--orange)" : "var(--green)",
      }}>
        {ticket.slaBreached ? "Breach" : sla.text}
      </Box>
    </Box>
  );
};

const ActivityRow: React.FC<{ item: ActivityItem; last: boolean }> = ({ item, last }) => {
  const ago   = formatDistanceToNow(new Date(item.timestamp), { locale: fr, addSuffix: false });
  const color = ACTIVITY_COLORS[item.color] ?? "var(--accent)";
  return (
    <Box sx={{
      display: "flex", gap: "12px", alignItems: "center",
      px: "16px", py: "11px",
      borderBottom: last ? "none" : "1px solid var(--border)",
      transition: "background 0.1s",
      "&:hover": { background: "var(--s2)" },
    }}>
      <Box sx={{ width: 6, height: 6, borderRadius: "50%", background: color, flexShrink: 0 }} />
      <Box sx={{ flex: 1, overflow: "hidden" }}>
        <Box sx={{ fontSize: "12px", color: "var(--text-secondary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {item.text}
        </Box>
      </Box>
      <Box sx={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--muted)", flexShrink: 0 }}>
        {ago}
      </Box>
    </Box>
  );
};
