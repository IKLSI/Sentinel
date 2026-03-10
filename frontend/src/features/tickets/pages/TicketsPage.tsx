import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Topbar } from "../../../layouts/Topbar";
import { StatusChip } from "../../../components/StatusChip";
import { SlaTimer } from "../../../components/SlaTimer";
import CircularProgress from "@mui/material/CircularProgress";
import Button from "@mui/material/Button";
import AddOutlined from "@mui/icons-material/AddOutlined";
import ConfirmationNumberOutlined from "@mui/icons-material/ConfirmationNumberOutlined";
import Box from "@mui/material/Box";
import { useTickets } from "../hooks/useTickets";
import {
  Ticket,
  TicketPriority,
  TicketStatus,
  TicketType,
} from "../../../types";

const priorityColors: Record<TicketPriority, string> = {
  critical: "var(--red)",
  high: "var(--orange)",
  medium: "var(--yellow)",
  low: "var(--green)",
};

const priorityLabels: Record<TicketPriority, string> = {
  critical: "Critique",
  high: "Haute",
  medium: "Moyenne",
  low: "Basse",
};

const statusVariant: Record<
  TicketStatus,
  "red" | "orange" | "blue" | "cyan" | "green" | "gray" | "purple"
> = {
  new: "blue",
  analysis: "cyan",
  in_progress: "orange",
  testing: "purple",
  resolved: "green",
  closed: "gray",
};

const statusLabels: Record<TicketStatus, string> = {
  new: "Nouveau",
  analysis: "En analyse",
  in_progress: "En cours",
  testing: "En test",
  resolved: "Résolu",
  closed: "Fermé",
};

const typeLabels: Record<TicketType, string> = {
  bug: "Bug",
  feature: "Évolution",
  security: "Sécurité",
  performance: "Perf",
  maintenance: "Maintenance",
  question: "Question",
};

export const TicketsPage: React.FC = () => {
  const navigate = useNavigate();
  const { tickets, loading, fetchTickets } = useTickets();
  const [displayTickets, setDisplayTickets] = useState<Ticket[]>([]);
  const [filters, setFilters] = useState({
    priority: "",
    status: "",
    type: "",
    slaBreached: false,
  });
  const [page, setPage] = useState(1);
  const defaultPageSize = 30;

  useEffect(() => {
    fetchTickets({ page, pageSize: defaultPageSize }).catch(() => {});
  }, [page]);

  useEffect(() => {
    if (tickets?.items !== undefined) {
      setDisplayTickets(tickets.items);
    }
  }, [tickets]);

  const filtered = displayTickets.filter((t) => {
    if (filters.priority && t.priority !== filters.priority) return false;
    if (filters.status && t.status !== filters.status) return false;
    if (filters.type && t.type !== filters.type) return false;
    if (filters.slaBreached && !t.slaBreached) return false;
    return true;
  });

  const canGoNext =
    tickets != null && page < tickets.totalPages && tickets.items.length > 0;

  return (
    <>
      <Topbar
        title="Tickets"
        subtitle={`${filtered.length} ticket(s)`}
        actions={
          <Button
            variant="contained"
            size="small"
            sx={{
              textTransform: "none",
              display: "flex",
              alignItems: "center",
              gap: "10px",
            }}
            onClick={() => navigate("/tickets/new")}
          >
            <AddOutlined sx={{ fontSize: 14 }} />
            Nouveau ticket
          </Button>
        }
      />
      <Box sx={{ p: "24px 28px" }}>
        <div
          style={{
            display: "flex",
            gap: "10px",
            marginBottom: "20px",
            flexWrap: "wrap",
          }}
        >
          <select
            style={{
              background: "var(--s1)",
              border: "1px solid var(--border)",
              borderRadius: "var(--r)",
              padding: "8px 12px",
              fontSize: "13px",
              color: "var(--text)",
              width: "auto",
              outline: "none",
              fontFamily: "inherit",
            }}
            value={filters.priority}
            onChange={(e) =>
              setFilters((f) => ({ ...f, priority: e.target.value }))
            }
          >
            <option value="">Toutes priorités</option>
            <option value="critical">Critique</option>
            <option value="high">Haute</option>
            <option value="medium">Moyenne</option>
            <option value="low">Basse</option>
          </select>

          <select
            style={{
              background: "var(--s1)",
              border: "1px solid var(--border)",
              borderRadius: "var(--r)",
              padding: "8px 12px",
              fontSize: "13px",
              color: "var(--text)",
              width: "auto",
              outline: "none",
              fontFamily: "inherit",
            }}
            value={filters.status}
            onChange={(e) =>
              setFilters((f) => ({ ...f, status: e.target.value }))
            }
          >
            <option value="">Tous statuts</option>
            <option value="new">Nouveau</option>
            <option value="analysis">En analyse</option>
            <option value="in_progress">En cours</option>
            <option value="testing">En test</option>
            <option value="resolved">Résolu</option>
            <option value="closed">Fermé</option>
          </select>

          <select
            style={{
              background: "var(--s1)",
              border: "1px solid var(--border)",
              borderRadius: "var(--r)",
              padding: "8px 12px",
              fontSize: "13px",
              color: "var(--text)",
              width: "auto",
              outline: "none",
              fontFamily: "inherit",
            }}
            value={filters.type}
            onChange={(e) =>
              setFilters((f) => ({ ...f, type: e.target.value }))
            }
          >
            <option value="">Tous types</option>
            <option value="bug">Bug</option>
            <option value="feature">Évolution</option>
            <option value="security">Sécurité</option>
            <option value="performance">Perf</option>
          </select>

          <label
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              cursor: "pointer",
              fontSize: "13px",
              color: "var(--muted2)",
            }}
          >
            <input
              type="checkbox"
              checked={filters.slaBreached}
              onChange={(e) =>
                setFilters((f) => ({ ...f, slaBreached: e.target.checked }))
              }
            />
            SLA dépassé uniquement
          </label>
        </div>

        {loading ? (
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              padding: "40px",
            }}
          >
            <CircularProgress />
          </div>
        ) : (
          <div
            style={{
              background: "var(--s1)",
              border: "1px solid var(--border)",
              borderRadius: "var(--r)",
              overflow: "hidden",
              minHeight: "560px",
              display: "flex",
              flexDirection: "column",
            }}
          >
            {filtered.length === 0 ? (
              <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <div className="empty-state">
                  <div className="empty-state-icon">
                    <ConfirmationNumberOutlined sx={{ fontSize: 40 }} />
                  </div>
                  <div className="empty-state-title">Aucun ticket trouvé</div>
                  <div className="empty-state-subtitle">
                    {displayTickets.length === 0
                      ? "Créez votre premier ticket"
                      : "Modifiez vos filtres"}
                  </div>
                </div>
              </div>
            ) : (
            <div style={{ flex: 1 }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    {[
                      "Référence",
                      "Titre",
                      "Projet",
                      "Priorité",
                      "Type",
                      "Statut",
                      "SLA",
                      "Assigné",
                    ].map((h) => (
                      <th
                        key={h}
                        style={{
                          fontFamily: "var(--font-mono)",
                          fontSize: "9px",
                          letterSpacing: "0.12em",
                          textTransform: "uppercase",
                          color: "var(--muted)",
                          textAlign: "left",
                          padding: "10px 14px",
                          borderBottom: "1px solid var(--border)",
                          background: "var(--s2)",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(
                    filtered.map((ticket) => (
                      <tr
                        key={ticket.id}
                        onClick={() => navigate(`/tickets/${ticket.id}`)}
                        style={{ cursor: "pointer" }}
                        onMouseEnter={(e) =>
                          Array.from(e.currentTarget.cells).forEach(
                            (c) => (c.style.background = "var(--s2)"),
                          )
                        }
                        onMouseLeave={(e) =>
                          Array.from(e.currentTarget.cells).forEach(
                            (c) => (c.style.background = "transparent"),
                          )
                        }
                      >
                        <td
                          style={{
                            padding: "10px 14px",
                            borderBottom: "1px solid var(--border)",
                            fontFamily: "var(--font-mono)",
                            fontSize: "11px",
                            color: "var(--muted)",
                            whiteSpace: "nowrap",
                          }}
                        >
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "8px",
                            }}
                          >
                            <div
                              style={{
                                width: "4px",
                                height: "20px",
                                borderRadius: "2px",
                                background: priorityColors[ticket.priority],
                                flexShrink: 0,
                              }}
                            />
                            {ticket.reference}
                          </div>
                        </td>
                        <td
                          style={{
                            padding: "10px 14px",
                            borderBottom: "1px solid var(--border)",
                            fontSize: "12.5px",
                            maxWidth: "300px",
                          }}
                        >
                          <div
                            style={{
                              whiteSpace: "nowrap",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                            }}
                          >
                            {ticket.title}
                          </div>
                        </td>
                        <td
                          style={{
                            padding: "10px 14px",
                            borderBottom: "1px solid var(--border)",
                            fontSize: "12px",
                            color: "var(--muted2)",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {ticket.projectName ?? "—"}
                        </td>
                        <td
                          style={{
                            padding: "10px 14px",
                            borderBottom: "1px solid var(--border)",
                          }}
                        >
                          <StatusChip
                            variant={
                              ticket.priority === "critical"
                                ? "red"
                                : ticket.priority === "high"
                                  ? "orange"
                                  : ticket.priority === "medium"
                                    ? "yellow"
                                    : "green"
                            }
                          >
                            {priorityLabels[ticket.priority]}
                          </StatusChip>
                        </td>
                        <td
                          style={{
                            padding: "10px 14px",
                            borderBottom: "1px solid var(--border)",
                          }}
                        >
                          <StatusChip variant="gray">
                            {typeLabels[ticket.type]}
                          </StatusChip>
                        </td>
                        <td
                          style={{
                            padding: "10px 14px",
                            borderBottom: "1px solid var(--border)",
                          }}
                        >
                          <StatusChip variant={statusVariant[ticket.status]}>
                            {statusLabels[ticket.status]}
                          </StatusChip>
                        </td>
                        <td
                          style={{
                            padding: "10px 14px",
                            borderBottom: "1px solid var(--border)",
                          }}
                        >
                          <SlaTimer
                            deadline={ticket.slaDeadline}
                            breached={ticket.slaBreached}
                          />
                        </td>
                        <td
                          style={{
                            padding: "10px 14px",
                            borderBottom: "1px solid var(--border)",
                            fontSize: "12px",
                            color: "var(--muted2)",
                          }}
                        >
                          {ticket.assignee
                            ? `${ticket.assignee.firstName} ${ticket.assignee.lastName}`
                            : "—"}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            )}

            <div
              style={{
                padding: "12px 14px",
                borderTop: "1px solid var(--border)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <div style={{ fontSize: "12px", color: "var(--muted)" }}>
                {filtered.length} ticket(s)
              </div>
              <div
                style={{ display: "flex", alignItems: "center", gap: "8px" }}
              >
                <Button
                  variant="outlined"
                  size="small"
                  sx={{ textTransform: "none" }}
                  disabled={page === 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  ← Précédent
                </Button>
                <span
                  style={{
                    fontSize: "12px",
                    color: "var(--muted2)",
                    lineHeight: "30px",
                    margin: "0 14px",
                  }}
                >
                  Page {page}
                </span>
                <Button
                  variant="outlined"
                  size="small"
                  sx={{ textTransform: "none" }}
                  disabled={!canGoNext}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Suivant →
                </Button>
              </div>
            </div>
          </div>
        )}
      </Box>
    </>
  );
};
