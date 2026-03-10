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

function formatSlaRemaining(deadline?: string): { text: string; warn: boolean } {
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
          <div
            className="alert-banner"
            style={{ cursor: "pointer", marginBottom: "20px" }}
            onClick={() => navigate("/tech-health")}
          >
            <WarningAmberOutlined
              sx={{ fontSize: 16 }}
              style={{ color: "var(--red)", flexShrink: 0 }}
            />
            <div className="alert-text">
              <strong>
                {stats.criticalVulnerabilities} vulnérabilités critiques
              </strong>{" "}
              détectées sur vos projets — vérifier la santé technique.
            </div>
            <button
              className="alert-btn"
              onClick={(e) => {
                e.stopPropagation();
                navigate("/tech-health");
              }}
            >
              Voir →
            </button>
          </div>
        )}

        <Box sx={{ display: "flex", gap: 2, mb: 3, flexWrap: "wrap" }}>
          <KpiCardMui
            label="Tickets ouverts"
            value={stats.openTickets}
            color="var(--accent)"
            subtitle={
              <span
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                  color: "var(--red)",
                }}
              >
                <TrendingUpOutlined sx={{ fontSize: 11 }} />
                {stats.openTicketsDelta} cette semaine
              </span>
            }
          />
          <KpiCardMui
            label="SLA respectés"
            value={stats.slaRespected}
            unit="%"
            color="var(--green)"
            subtitle={
              <span
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                  color: "var(--green)",
                }}
              >
                <TrendingUpOutlined sx={{ fontSize: 11 }} />+{stats.slaRespectedDelta}% vs mois
                dernier
              </span>
            }
          />
          <KpiCardMui
            label="Heures ce mois"
            value={stats.hoursThisMonth}
            unit="h"
            color="var(--cyan)"
            subtitle="saisies ce mois"
          />
          <KpiCardMui
            label="CA facturable"
            value={`${(stats.billableRevenue / 1000).toFixed(0)}k`}
            unit="€"
            color="var(--yellow)"
            subtitle={
              <span style={{ color: "var(--orange)" }}>
                {(stats.unbilledRevenue / 1000).toFixed(1)}k€ non facturés
              </span>
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
          <div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: "10px",
                minHeight: "40px",
              }}
            >
              <Typography fontWeight={700} fontSize="13px">
                Tickets urgents
              </Typography>
              <div
                style={{
                  minWidth: "150px",
                  display: "flex",
                  justifyContent: "flex-end",
                }}
              >
                <Button
                  variant="outlined"
                  size="small"
                  sx={{ textTransform: "none", display: "flex", alignItems: "center", gap: "10px" }}
                  onClick={() => navigate("/tickets")}
                >
                  Voir tous <NorthEastOutlined sx={{ fontSize: 12 }} />
                </Button>
              </div>
            </div>
            {stats.urgentTickets.length === 0 ? (
              <div
                style={{
                  fontSize: "13px",
                  color: "var(--muted)",
                  padding: "12px 0",
                }}
              >
                Aucun ticket urgent.
              </div>
            ) : (
              <div
                style={{ display: "flex", flexDirection: "column", gap: "6px" }}
              >
                {stats.urgentTickets.map((ticket) => (
                  <TicketRow
                    key={ticket.id}
                    ticket={ticket}
                    onClick={() => navigate(`/tickets/${ticket.id}`)}
                  />
                ))}
              </div>
            )}
          </div>

          <div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: "10px",
                minHeight: "40px",
              }}
            >
              <Typography fontWeight={700} fontSize="13px">
                Activité récente
              </Typography>
              <div style={{ minWidth: "150px" }} />
            </div>
            {stats.recentActivity.length === 0 ? (
              <div
                style={{
                  fontSize: "13px",
                  color: "var(--muted)",
                  padding: "12px 0",
                }}
              >
                Aucune activité récente.
              </div>
            ) : (
              <div
                style={{
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
              </div>
            )}
          </div>
        </Box>

        <div style={{ marginBottom: "24px" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: "10px",
            }}
          >
            <Typography fontWeight={700} fontSize="13px">
              Répartition des tickets
            </Typography>
            <Button
              variant="outlined"
              size="small"
              sx={{ textTransform: "none", display: "flex", alignItems: "center", gap: "10px" }}
              onClick={() => navigate("/tickets")}
            >
              Voir tous <NorthEastOutlined sx={{ fontSize: 12 }} />
            </Button>
          </div>
          <TicketStatusDistribution ticketsByStatus={stats.ticketsByStatus} />
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "10px",
          }}
        >
          <Typography fontWeight={700} fontSize="13px">
            Santé technique
          </Typography>
          <Button
            variant="outlined"
            size="small"
            sx={{ textTransform: "none", display: "flex", alignItems: "center", gap: "10px" }}
            onClick={() => navigate("/tech-health")}
          >
            Analyse complète <NorthEastOutlined sx={{ fontSize: 12 }} />
          </Button>
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: "12px",
            marginBottom: "0",
          }}
        >
          {techProjects.length === 0 ? (
            <div
              style={{
                gridColumn: "1 / -1",
                fontSize: "13px",
                color: "var(--muted)",
                padding: "16px 0",
              }}
            >
              Aucun projet technique configuré.
            </div>
          ) : (
            techProjects.map((p) => (
              <button
                key={p.id}
                onClick={() => navigate("/tech-health")}
                style={{
                  background: "var(--s1)",
                  border: "1px solid var(--border)",
                  borderRadius: "var(--r)",
                  padding: "16px",
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  cursor: "pointer",
                  transition: "all 0.15s",
                  textAlign: "left",
                  fontFamily: "var(--font-ui)",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "var(--accent-border)";
                  e.currentTarget.style.background = "var(--s2)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "var(--border)";
                  e.currentTarget.style.background = "var(--s1)";
                }}
              >
                <HealthScoreCircle
                  score={p.healthScore}
                  grade={p.healthGrade as HealthGrade}
                  size={40}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: "12px",
                      fontWeight: 600,
                      color: "var(--text)",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {p.name}
                  </div>
                  <div
                    style={{
                      fontSize: "11px",
                      color: "var(--muted)",
                      marginTop: "2px",
                    }}
                  >
                    {p.repositoryType}
                  </div>
                  {p.criticalVulnerabilities > 0 && (
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                        marginTop: "4px",
                        fontSize: "10px",
                        color: "var(--red)",
                        fontFamily: "var(--font-mono)",
                      }}
                    >
                      <WarningAmberOutlined sx={{ fontSize: 9 }} />
                      {p.criticalVulnerabilities} CVE critique
                      {p.criticalVulnerabilities > 1 ? "s" : ""}
                    </div>
                  )}
                </div>
              </button>
            ))
          )}
        </div>
      </Box>
    </>
  );
};

const KpiCardMui: React.FC<{
  label: string;
  value: number | string;
  unit?: string;
  color: string;
  subtitle?: React.ReactNode;
}> = ({ label, value, unit, color, subtitle }) => (
  <div
    style={{
      flex: 1,
      minWidth: 180,
      background: "var(--s1)",
      border: "1px solid var(--border)",
      borderRadius: "var(--r)",
      padding: "20px 22px",
      position: "relative",
      overflow: "hidden",
      transition: "border-color 0.2s, box-shadow 0.2s",
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.borderColor = "var(--border2)";
      e.currentTarget.style.boxShadow = "var(--shadow-md)";
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.borderColor = "var(--border)";
      e.currentTarget.style.boxShadow = "none";
    }}
  >
    <div
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        height: 2,
        background: color,
        opacity: 0.8,
      }}
    />
    <div
      style={{
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
    <div
      style={{
        fontFamily: "var(--font-mono)",
        fontSize: "9px",
        letterSpacing: "0.14em",
        textTransform: "uppercase",
        color: "var(--muted)",
        marginBottom: "12px",
        fontWeight: 500,
      }}
    >
      {label}
    </div>
    <div
      style={{
        fontSize: "32px",
        fontWeight: 800,
        color,
        letterSpacing: "-0.04em",
        lineHeight: 1,
        marginBottom: "8px",
      }}
    >
      {value}
      {unit && (
        <span
          style={{
            fontSize: "16px",
            color: "var(--muted)",
            fontWeight: 400,
            marginLeft: 2,
          }}
        >
          {unit}
        </span>
      )}
    </div>
    {subtitle && (
      <div
        style={{ fontSize: "11px", color: "var(--muted2)", lineHeight: 1.4 }}
      >
        {subtitle}
      </div>
    )}
  </div>
);

const TicketStatusDistribution: React.FC<{
  ticketsByStatus: Record<string, number>;
}> = ({ ticketsByStatus }) => {
  const total = TICKET_STATUS_CONFIG.reduce(
    (sum, { key }) => sum + (ticketsByStatus[key] ?? 0),
    0,
  );

  return (
    <div
      style={{
        background: "var(--s1)",
        border: "1px solid var(--border)",
        borderRadius: "var(--r)",
        overflow: "hidden",
      }}
    >
      <div style={{ display: "flex", height: "6px" }}>
        {TICKET_STATUS_CONFIG.map(({ key, color }) => {
          const count = ticketsByStatus[key] ?? 0;
          const pct = total > 0 ? (count / total) * 100 : 0;
          return pct > 0 ? (
            <div
              key={key}
              style={{
                width: `${pct}%`,
                background: color,
                transition: "width 0.4s ease",
              }}
              title={`${key}: ${count}`}
            />
          ) : null;
        })}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)" }}>
        {TICKET_STATUS_CONFIG.map(({ key, label, color }, idx) => {
          const count = ticketsByStatus[key] ?? 0;
          const pct = total > 0 ? Math.round((count / total) * 100) : 0;
          return (
            <div
              key={key}
              style={{
                padding: "18px 20px 16px",
                borderRight: idx < 5 ? "1px solid var(--border)" : "none",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "baseline",
                  gap: "4px",
                  marginBottom: "4px",
                }}
              >
                <span
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: "26px",
                    fontWeight: 700,
                    color,
                    lineHeight: 1,
                  }}
                >
                  {count}
                </span>
                <span
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: "10px",
                    color: "var(--muted)",
                    fontWeight: 500,
                  }}
                >
                  {pct}%
                </span>
              </div>
              <div
                style={{
                  fontSize: "11px",
                  color: "var(--muted)",
                  fontWeight: 600,
                  marginBottom: "8px",
                }}
              >
                {label}
              </div>
              <div
                style={{
                  height: "3px",
                  background: "var(--border)",
                  borderRadius: "2px",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    width: `${pct}%`,
                    height: "100%",
                    background: color,
                    borderRadius: "2px",
                    transition: "width 0.4s ease",
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
      <div
        style={{
          borderTop: "1px solid var(--border)",
          padding: "10px 20px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <span style={{ fontSize: "11px", color: "var(--muted)" }}>
          Total tous statuts
        </span>
        <span
          style={{
            fontFamily: "var(--font-mono)",
            fontWeight: 700,
            fontSize: "13px",
            color: "var(--text)",
          }}
        >
          {total}
        </span>
      </div>
    </div>
  );
};

const TicketRow: React.FC<{
  ticket: UrgentTicket;
  onClick: () => void;
}> = ({ ticket, onClick }) => {
  const sla = formatSlaRemaining(ticket.slaDeadline);
  return (
    <div
      onClick={onClick}
      style={{
        background: "var(--s1)",
        border: "1px solid var(--border)",
        borderLeft: `3px solid ${PRIORITY_COLORS[ticket.priority] ?? "var(--muted)"}`,
        borderRadius: "var(--r)",
        padding: "12px 14px",
        display: "flex",
        alignItems: "center",
        gap: "12px",
        cursor: "pointer",
        transition: "all 0.12s",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = "var(--s2)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = "var(--s1)";
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "10px",
            color: "var(--muted)",
            marginBottom: "3px",
            letterSpacing: "0.05em",
          }}
        >
          {ticket.reference}
          {ticket.projectName ? ` · ${ticket.projectName}` : ""}
        </div>
        <div
          style={{
            fontSize: "13px",
            fontWeight: 500,
            color: "var(--text)",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {ticket.title}
        </div>
      </div>
      <div style={{ flexShrink: 0, textAlign: "right" }}>
        {ticket.slaBreached ? (
          <span
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "11px",
              fontWeight: 700,
              color: "var(--red)",
              display: "flex",
              alignItems: "center",
              gap: "4px",
            }}
          >
            <WarningAmberOutlined sx={{ fontSize: 11 }} />
            Breach
          </span>
        ) : (
          <span
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "11px",
              fontWeight: 600,
              color: sla.warn ? "var(--orange)" : "var(--green)",
            }}
          >
            {sla.text}
          </span>
        )}
      </div>
    </div>
  );
};

const ActivityRow: React.FC<{
  item: ActivityItem;
  last: boolean;
}> = ({ item, last }) => {
  const ago = formatDistanceToNow(new Date(item.timestamp), {
    locale: fr,
    addSuffix: false,
  });
  return (
    <div
      style={{
        display: "flex",
        gap: "12px",
        padding: "12px 16px",
        borderBottom: last ? "none" : "1px solid var(--border)",
        alignItems: "flex-start",
      }}
    >
      <div
        style={{
          width: "6px",
          height: "6px",
          borderRadius: "50%",
          background: ACTIVITY_COLORS[item.color] ?? "var(--accent)",
          marginTop: "5px",
          flexShrink: 0,
        }}
      />
      <div style={{ flex: 1 }}>
        <div
          style={{
            fontSize: "13px",
            color: "var(--text-secondary)",
            lineHeight: 1.4,
          }}
        >
          {item.text}
        </div>
        <div
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "10px",
            color: "var(--muted)",
            marginTop: "3px",
          }}
        >
          Il y a {ago}
          {item.detail ? ` · ${item.detail}` : ""}
        </div>
      </div>
    </div>
  );
};
