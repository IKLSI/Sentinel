import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Topbar } from "../../../layouts/Topbar";
import { HealthScoreCircle } from "../../../components/HealthScoreCircle";
import Button from "@mui/material/Button";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { getDashboardStats } from "../api/dashboard";
import { getProjects } from "../../techHealth/api/projects";
import type { ProjectDto } from "../../techHealth/api/projects";
import { format, formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import WarningAmberOutlined from "@mui/icons-material/WarningAmberOutlined";
import NorthEastOutlined from "@mui/icons-material/NorthEastOutlined";
import TrendingUpOutlined from "@mui/icons-material/TrendingUpOutlined";
import type { HealthGrade } from "../../../types";

const TICKET_STATUS_CONFIG = [
  { key: "New", label: "Nouveau", color: "var(--accent)" },
  { key: "Analysis", label: "Analyse", color: "var(--cyan)" },
  { key: "InProgress", label: "En cours", color: "var(--blue)" },
  { key: "Testing", label: "Tests", color: "var(--yellow)" },
  { key: "Resolved", label: "Résolu", color: "var(--green)" },
  { key: "Closed", label: "Clôturé", color: "var(--muted)" },
];

interface UrgentTicket {
  id: string;
  reference: string;
  title: string;
  priority: string;
  type: string;
  projectName?: string;
  slaBreached: boolean;
  slaDeadline?: string;
}

interface ActivityItem {
  color: string;
  text: string;
  timestamp: string;
  detail?: string;
}

interface StatsData {
  openTickets: number;
  openTicketsDelta: number;
  slaRespected: number;
  slaRespectedDelta: number;
  hoursThisMonth: number;
  billableRevenue: number;
  unbilledRevenue: number;
  criticalVulnerabilities: number;
  ticketsByStatus: Record<string, number>;
  urgentTickets: UrgentTicket[];
  recentActivity: ActivityItem[];
}

const EMPTY_STATS: StatsData = {
  openTickets: 0,
  openTicketsDelta: 0,
  slaRespected: 100,
  slaRespectedDelta: 0,
  hoursThisMonth: 0,
  billableRevenue: 0,
  unbilledRevenue: 0,
  criticalVulnerabilities: 0,
  ticketsByStatus: {},
  urgentTickets: [],
  recentActivity: [],
};

function formatSlaRemaining(deadline?: string): {
  text: string;
  warn: boolean;
} {
  if (!deadline) return { text: "—", warn: false };
  const diff = new Date(deadline).getTime() - Date.now();
  if (diff <= 0) return { text: "Dépassé", warn: true };

  const totalMin = Math.floor(diff / 60000);
  const totalH = Math.floor(diff / 3600000);
  const days = Math.floor(totalH / 24);
  const hours = totalH % 24;
  const mins = totalMin % 60;

  let text: string;
  if (totalMin < 60) text = `${totalMin}min`;
  else if (totalH < 24) text = mins > 0 ? `${totalH}h ${mins}m` : `${totalH}h`;
  else text = hours > 0 ? `${days}j ${hours}h` : `${days}j`;

  return { text, warn: totalH < 4 };
}

const PRIORITY_COLORS: Record<string, string> = {
  critical: "var(--red)",
  high: "var(--orange)",
  medium: "var(--yellow)",
  low: "var(--green)",
};

const ACTIVITY_COLORS: Record<string, string> = {
  red: "var(--red)",
  accent: "var(--accent)",
  green: "var(--green)",
  orange: "var(--orange)",
};

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<StatsData>(EMPTY_STATS);
  const [techProjects, setTechProjects] = useState<ProjectDto[]>([]);

  useEffect(() => {
    getDashboardStats()
      .then((data) => setStats(data))
      .catch(() => {});
    getProjects()
      .then((list) => setTechProjects(list))
      .catch(() => {});
  }, []);

  const month = format(new Date(), "MMMM yyyy", { locale: fr });

  return (
    <>
      <Topbar
        title="Dashboard"
        subtitle={month.charAt(0).toUpperCase() + month.slice(1)}
      />

      <Box sx={{ p: "24px 28px" }}>
        {stats.criticalVulnerabilities > 0 && (
          <Box
            className="alert-banner mb-3"
            onClick={() => navigate("/tech-health")}
          >
            <WarningAmberOutlined
              sx={{ fontSize: 16, color: "var(--red)", flexShrink: 0 }}
            />
            <Box className="alert-text">
              <strong>
                {stats.criticalVulnerabilities} vulnérabilités critiques
              </strong>{" "}
              détectées sur vos projets — vérifier la santé technique.
            </Box>
            <button
              className="alert-btn"
              onClick={(e) => {
                e.stopPropagation();
                navigate("/tech-health");
              }}
            >
              Voir →
            </button>
          </Box>
        )}

        <Box sx={{ display: "flex", gap: 2, mb: 3, flexWrap: "wrap" }}>
          <KpiCard
            label="Tickets ouverts"
            value={stats.openTickets}
            color="var(--accent)"
            subtitle={
              <Box
                component="span"
                className="d-flex align-items-center gap-1"
                sx={{ color: "var(--red)" }}
              >
                <TrendingUpOutlined sx={{ fontSize: 11 }} />
                {stats.openTicketsDelta} cette semaine
              </Box>
            }
          />
          <KpiCard
            label="SLA respectés"
            value={stats.slaRespected}
            unit="%"
            color="var(--green)"
            subtitle={
              <Box
                component="span"
                className="d-flex align-items-center gap-1"
                sx={{ color: "var(--green)" }}
              >
                <TrendingUpOutlined sx={{ fontSize: 11 }} />+
                {stats.slaRespectedDelta}% vs mois dernier
              </Box>
            }
          />
          <KpiCard
            label="Heures ce mois"
            value={stats.hoursThisMonth}
            unit="h"
            color="var(--cyan)"
            subtitle="saisies ce mois"
          />
          <KpiCard
            label="CA facturable"
            value={`${(stats.billableRevenue / 1000).toFixed(0)}k`}
            unit="€"
            color="var(--yellow)"
            subtitle={
              <Box component="span" sx={{ color: "var(--orange)" }}>
                {(stats.unbilledRevenue / 1000).toFixed(1)}k€ non facturés
              </Box>
            }
          />
        </Box>

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 2,
            mb: 3,
          }}
        >
          <Box>
            <Box
              className="d-flex align-items-center justify-content-between mb-2"
              sx={{ minHeight: "40px" }}
            >
              <Typography fontWeight={700} fontSize="13px">
                Tickets urgents
              </Typography>
              <Box
                className="d-flex justify-content-end"
                sx={{ minWidth: "150px" }}
              >
                <Button
                  variant="outlined"
                  size="small"
                  sx={{
                    textTransform: "none",
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                  }}
                  onClick={() => navigate("/tickets")}
                >
                  Voir tous <NorthEastOutlined sx={{ fontSize: 12 }} />
                </Button>
              </Box>
            </Box>
            {stats.urgentTickets.length === 0 ? (
              <Box sx={{ fontSize: "13px", color: "var(--muted)", py: "12px" }}>
                Aucun ticket urgent.
              </Box>
            ) : (
              <Box className="d-flex flex-column gap-1">
                {stats.urgentTickets.map((ticket) => (
                  <TicketRow
                    key={ticket.id}
                    ticket={ticket}
                    onClick={() => navigate(`/tickets/${ticket.id}`)}
                  />
                ))}
              </Box>
            )}
          </Box>

          <Box>
            <Box
              className="d-flex align-items-center justify-content-between mb-2"
              sx={{ minHeight: "40px" }}
            >
              <Typography fontWeight={700} fontSize="13px">
                Activité récente
              </Typography>
              <Box sx={{ minWidth: "150px" }} />
            </Box>
            {stats.recentActivity.length === 0 ? (
              <Box sx={{ fontSize: "13px", color: "var(--muted)", py: "12px" }}>
                Aucune activité récente.
              </Box>
            ) : (
              <Box
                sx={{
                  background: "var(--s1)",
                  border: "1px solid var(--border)",
                  borderRadius: "var(--r)",
                  overflow: "hidden",
                }}
              >
                {stats.recentActivity.map((item, idx) => (
                  <ActivityRow
                    key={idx}
                    item={item}
                    last={idx === stats.recentActivity.length - 1}
                  />
                ))}
              </Box>
            )}
          </Box>
        </Box>

        <Box className="mb-4">
          <Box className="d-flex align-items-center justify-content-between mb-2">
            <Typography fontWeight={700} fontSize="13px">
              Répartition des tickets
            </Typography>
            <Button
              variant="outlined"
              size="small"
              sx={{
                textTransform: "none",
                display: "flex",
                alignItems: "center",
                gap: "10px",
              }}
              onClick={() => navigate("/tickets")}
            >
              Voir tous <NorthEastOutlined sx={{ fontSize: 12 }} />
            </Button>
          </Box>
          <TicketStatusDistribution ticketsByStatus={stats.ticketsByStatus} />
        </Box>

        <Box className="d-flex align-items-center justify-content-between mb-2">
          <Typography fontWeight={700} fontSize="13px">
            Santé technique
          </Typography>
          <Button
            variant="outlined"
            size="small"
            sx={{
              textTransform: "none",
              display: "flex",
              alignItems: "center",
              gap: "10px",
            }}
            onClick={() => navigate("/tech-health")}
          >
            Analyse complète <NorthEastOutlined sx={{ fontSize: 12 }} />
          </Button>
        </Box>
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: "12px",
          }}
        >
          {techProjects.length === 0 ? (
            <Box
              sx={{
                gridColumn: "1 / -1",
                fontSize: "13px",
                color: "var(--muted)",
                py: "16px",
              }}
            >
              Aucun projet technique configuré.
            </Box>
          ) : (
            techProjects.map((p) => (
              <Box
                key={p.id}
                component="button"
                className="d-flex align-items-center gap-3"
                onClick={() => navigate("/tech-health")}
                sx={{
                  background: "var(--s1)",
                  border: "1px solid var(--border)",
                  borderRadius: "var(--r)",
                  p: "16px",
                  cursor: "pointer",
                  transition: "all 0.15s",
                  textAlign: "left",
                  fontFamily: "var(--font-ui)",
                  "&:hover": {
                    borderColor: "var(--accent-border)",
                    background: "var(--s2)",
                  },
                }}
              >
                <HealthScoreCircle
                  score={p.healthScore}
                  grade={p.healthGrade as HealthGrade}
                  size={40}
                />
                <Box className="flex-grow-1 overflow-hidden">
                  <Box
                    className="text-truncate"
                    sx={{
                      fontSize: "12px",
                      fontWeight: 600,
                      color: "var(--text)",
                    }}
                  >
                    {p.name}
                  </Box>
                  <Box
                    className="mt-1"
                    sx={{ fontSize: "11px", color: "var(--muted)" }}
                  >
                    {p.repositoryType}
                  </Box>
                  {p.criticalVulnerabilities > 0 && (
                    <Box
                      className="d-flex align-items-center gap-1 mt-1"
                      sx={{
                        fontSize: "10px",
                        color: "var(--red)",
                        fontFamily: "var(--font-mono)",
                      }}
                    >
                      <WarningAmberOutlined sx={{ fontSize: 9 }} />
                      {p.criticalVulnerabilities} CVE critique
                      {p.criticalVulnerabilities > 1 ? "s" : ""}
                    </Box>
                  )}
                </Box>
              </Box>
            ))
          )}
        </Box>
      </Box>
    </>
  );
};

const KpiCard: React.FC<{
  label: string;
  value: number | string;
  unit?: string;
  color: string;
  subtitle?: React.ReactNode;
}> = ({ label, value, unit, color, subtitle }) => (
  <Box
    sx={{
      flex: 1,
      minWidth: 180,
      background: "var(--s1)",
      border: "1px solid var(--border)",
      borderRadius: "var(--r)",
      p: "20px 22px",
      position: "relative",
      overflow: "hidden",
      transition: "border-color 0.2s, box-shadow 0.2s",
      "&:hover": {
        borderColor: "var(--border2)",
        boxShadow: "var(--shadow-md)",
      },
    }}
  >
    <Box
      sx={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        height: 2,
        background: color,
        opacity: 0.8,
      }}
    />
    <Box
      sx={{
        position: "absolute",
        top: -30,
        right: -30,
        width: 100,
        height: 100,
        borderRadius: "50%",
        background: color,
        opacity: 0.04,
        pointerEvents: "none",
      }}
    />
    <Box
      sx={{
        fontFamily: "var(--font-mono)",
        fontSize: "9px",
        letterSpacing: "0.14em",
        textTransform: "uppercase",
        color: "var(--muted)",
        mb: "12px",
        fontWeight: 500,
      }}
    >
      {label}
    </Box>
    <Box
      sx={{
        fontSize: "32px",
        fontWeight: 800,
        color,
        letterSpacing: "-0.04em",
        lineHeight: 1,
        mb: "8px",
      }}
    >
      {value}
      {unit && (
        <Box
          component="span"
          sx={{
            fontSize: "16px",
            color: "var(--muted)",
            fontWeight: 400,
            ml: "2px",
          }}
        >
          {unit}
        </Box>
      )}
    </Box>
    {subtitle && (
      <Box sx={{ fontSize: "11px", color: "var(--muted2)", lineHeight: 1.4 }}>
        {subtitle}
      </Box>
    )}
  </Box>
);

const TicketStatusDistribution: React.FC<{
  ticketsByStatus: Record<string, number>;
}> = ({ ticketsByStatus }) => {
  const total = TICKET_STATUS_CONFIG.reduce(
    (sum, { key }) => sum + (ticketsByStatus[key] ?? 0),
    0,
  );

  return (
    <Box
      sx={{
        background: "var(--s1)",
        border: "1px solid var(--border)",
        borderRadius: "var(--r)",
        overflow: "hidden",
      }}
    >
      <Box className="d-flex" sx={{ height: "6px" }}>
        {TICKET_STATUS_CONFIG.map(({ key, color }) => {
          const count = ticketsByStatus[key] ?? 0;
          const pct = total > 0 ? (count / total) * 100 : 0;
          return pct > 0 ? (
            <Box
              key={key}
              sx={{
                width: `${pct}%`,
                background: color,
                transition: "width 0.4s ease",
              }}
              title={`${key}: ${count}`}
            />
          ) : null;
        })}
      </Box>
      <Box sx={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)" }}>
        {TICKET_STATUS_CONFIG.map(({ key, label, color }, idx) => {
          const count = ticketsByStatus[key] ?? 0;
          const pct = total > 0 ? Math.round((count / total) * 100) : 0;
          return (
            <Box
              key={key}
              sx={{
                p: "18px 20px 16px",
                borderRight: idx < 5 ? "1px solid var(--border)" : "none",
              }}
            >
              <Box className="d-flex align-items-baseline gap-1 mb-1">
                <Box
                  component="span"
                  sx={{
                    fontFamily: "var(--font-mono)",
                    fontSize: "26px",
                    fontWeight: 700,
                    color,
                    lineHeight: 1,
                  }}
                >
                  {count}
                </Box>
                <Box
                  component="span"
                  sx={{
                    fontFamily: "var(--font-mono)",
                    fontSize: "10px",
                    color: "var(--muted)",
                    fontWeight: 500,
                  }}
                >
                  {pct}%
                </Box>
              </Box>
              <Box
                sx={{
                  fontSize: "11px",
                  color: "var(--muted)",
                  fontWeight: 600,
                  mb: "8px",
                }}
              >
                {label}
              </Box>
              <Box
                sx={{
                  height: "3px",
                  background: "var(--border)",
                  borderRadius: "2px",
                  overflow: "hidden",
                }}
              >
                <Box
                  sx={{
                    width: `${pct}%`,
                    height: "100%",
                    background: color,
                    borderRadius: "2px",
                    transition: "width 0.4s ease",
                  }}
                />
              </Box>
            </Box>
          );
        })}
      </Box>
      <Box
        className="d-flex align-items-center justify-content-between"
        sx={{ borderTop: "1px solid var(--border)", p: "10px 20px" }}
      >
        <Box component="span" sx={{ fontSize: "11px", color: "var(--muted)" }}>
          Total tous statuts
        </Box>
        <Box
          component="span"
          sx={{
            fontFamily: "var(--font-mono)",
            fontWeight: 700,
            fontSize: "13px",
            color: "var(--text)",
          }}
        >
          {total}
        </Box>
      </Box>
    </Box>
  );
};

const TicketRow: React.FC<{ ticket: UrgentTicket; onClick: () => void }> = ({
  ticket,
  onClick,
}) => {
  const sla = formatSlaRemaining(ticket.slaDeadline);
  return (
    <Box
      className="d-flex align-items-center gap-3"
      onClick={onClick}
      sx={{
        background: "var(--s1)",
        border: "1px solid var(--border)",
        borderLeft: `3px solid ${PRIORITY_COLORS[ticket.priority] ?? "var(--muted)"}`,
        borderRadius: "var(--r)",
        p: "12px 14px",
        cursor: "pointer",
        transition: "all 0.12s",
        "&:hover": { background: "var(--s2)" },
      }}
    >
      <Box className="flex-grow-1 overflow-hidden">
        <Box
          sx={{
            fontFamily: "var(--font-mono)",
            fontSize: "10px",
            color: "var(--muted)",
            mb: "3px",
            letterSpacing: "0.05em",
          }}
        >
          {ticket.reference}
          {ticket.projectName ? ` · ${ticket.projectName}` : ""}
        </Box>
        <Box
          className="text-truncate"
          sx={{ fontSize: "13px", fontWeight: 500, color: "var(--text)" }}
        >
          {ticket.title}
        </Box>
      </Box>
      <Box className="flex-shrink-0 text-end">
        {ticket.slaBreached ? (
          <Box
            component="span"
            className="d-flex align-items-center gap-1"
            sx={{
              fontFamily: "var(--font-mono)",
              fontSize: "11px",
              fontWeight: 700,
              color: "var(--red)",
            }}
          >
            <WarningAmberOutlined sx={{ fontSize: 11 }} />
            Breach
          </Box>
        ) : (
          <Box
            component="span"
            sx={{
              fontFamily: "var(--font-mono)",
              fontSize: "11px",
              fontWeight: 600,
              color: sla.warn ? "var(--orange)" : "var(--green)",
            }}
          >
            {sla.text}
          </Box>
        )}
      </Box>
    </Box>
  );
};

const ActivityRow: React.FC<{ item: ActivityItem; last: boolean }> = ({
  item,
  last,
}) => {
  const ago = formatDistanceToNow(new Date(item.timestamp), {
    locale: fr,
    addSuffix: false,
  });
  return (
    <Box
      className="d-flex gap-3 align-items-start"
      sx={{
        p: "12px 16px",
        borderBottom: last ? "none" : "1px solid var(--border)",
      }}
    >
      <Box
        sx={{
          width: 6,
          height: 6,
          borderRadius: "50%",
          background: ACTIVITY_COLORS[item.color] ?? "var(--accent)",
          mt: "5px",
          flexShrink: 0,
        }}
      />
      <Box className="flex-grow-1">
        <Box
          sx={{
            fontSize: "13px",
            color: "var(--text-secondary)",
            lineHeight: 1.4,
          }}
        >
          {item.text}
        </Box>
        <Box
          sx={{
            fontFamily: "var(--font-mono)",
            fontSize: "10px",
            color: "var(--muted)",
            mt: "3px",
          }}
        >
          Il y a {ago}
          {item.detail ? ` · ${item.detail}` : ""}
        </Box>
      </Box>
    </Box>
  );
};
