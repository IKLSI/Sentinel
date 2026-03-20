import React, {
  useState,
  useRef,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from "@hello-pangea/dnd";
import { useNavigate } from "react-router-dom";
import GlobalStyles from "@mui/material/GlobalStyles";
import Tooltip from "@mui/material/Tooltip";
import Box from "@mui/material/Box";
import { useToast } from "../../../hooks/useToast";
import { getTickets, changeStatus } from "../api/tickets";
import { TicketStatus, TicketPriority, Ticket } from "../../../types";
import BugReportOutlined from "@mui/icons-material/BugReportOutlined";
import AutoFixHighOutlined from "@mui/icons-material/AutoFixHighOutlined";
import SecurityOutlined from "@mui/icons-material/SecurityOutlined";
import SpeedOutlined from "@mui/icons-material/SpeedOutlined";
import BuildOutlined from "@mui/icons-material/BuildOutlined";
import HelpOutlineOutlined from "@mui/icons-material/HelpOutline";
import FolderOutlined from "@mui/icons-material/FolderOutlined";
import SearchOutlined from "@mui/icons-material/SearchOutlined";
import CommentOutlined from "@mui/icons-material/CommentOutlined";
import WarningAmberOutlined from "@mui/icons-material/WarningAmberOutlined";

type KanbanType =
  | "bug"
  | "feature"
  | "security"
  | "performance"
  | "maintenance"
  | "question";

interface KanbanTicket {
  id: string;
  reference: string;
  title: string;
  project: string;
  priority: TicketPriority;
  type: KanbanType;
  assigneeInitials?: string;
  assigneeName?: string;
  slaDeadline?: string;
  slaBreached: boolean;
  commentCount: number;
  jiraKey?: string;
}

type KanbanColumns = Record<TicketStatus, KanbanTicket[]>;



const typeColors: Record<KanbanType, string> = {
  bug: "var(--red)",
  feature: "var(--accent)",
  security: "var(--orange)",
  performance: "var(--cyan)",
  maintenance: "var(--muted2)",
  question: "var(--purple)",
};

const typeSubtles: Record<KanbanType, string> = {
  bug: "var(--red-subtle)",
  feature: "var(--accent-subtle)",
  security: "var(--orange-subtle)",
  performance: "var(--cyan-subtle)",
  maintenance: "rgba(116,136,170,0.10)",
  question: "var(--purple-subtle)",
};

const typeLabels: Record<KanbanType, string> = {
  bug: "Bug",
  feature: "Feature",
  security: "Sécurité",
  performance: "Performance",
  maintenance: "Maintenance",
  question: "Question",
};

const typeIcons: Record<KanbanType, React.ReactElement> = {
  bug: <BugReportOutlined sx={{ fontSize: 11 }} />,
  feature: <AutoFixHighOutlined sx={{ fontSize: 11 }} />,
  security: <SecurityOutlined sx={{ fontSize: 11 }} />,
  performance: <SpeedOutlined sx={{ fontSize: 11 }} />,
  maintenance: <BuildOutlined sx={{ fontSize: 11 }} />,
  question: <HelpOutlineOutlined sx={{ fontSize: 11 }} />,
};

const columnMeta: Record<
  TicketStatus,
  { label: string; color: string; subtle: string; border: string }
> = {
  new: {
    label: "Nouveau",
    color: "var(--accent)",
    subtle: "var(--accent-subtle)",
    border: "var(--accent-border)",
  },
  in_progress: {
    label: "En cours",
    color: "var(--orange)",
    subtle: "var(--orange-subtle)",
    border: "rgba(249,115,22,0.28)",
  },
  testing: {
    label: "En test",
    color: "var(--purple)",
    subtle: "var(--purple-subtle)",
    border: "rgba(168,85,247,0.28)",
  },
  resolved: {
    label: "Résolu",
    color: "var(--green)",
    subtle: "var(--green-subtle)",
    border: "rgba(34,197,94,0.28)",
  },
  closed: {
    label: "Fermé",
    color: "var(--muted2)",
    subtle: "rgba(116,136,170,0.10)",
    border: "rgba(116,136,170,0.22)",
  },
};

const columnOrder: TicketStatus[] = [
  "new",
  "in_progress",
  "testing",
  "resolved",
  "closed",
];

const emptyColumns = (): KanbanColumns => ({
  new: [],
  in_progress: [],
  testing: [],
  resolved: [],
  closed: [],
});

function arrayMove<T>(arr: T[], from: number, to: number): T[] {
  const result = [...arr];
  const [removed] = result.splice(from, 1);
  result.splice(to, 0, removed);
  return result;
}

function ticketToKanban(t: Ticket): KanbanTicket {
  const a = t.assignee;
  const initials = a
    ? `${a.firstName[0] ?? ""}${a.lastName[0] ?? ""}`.toUpperCase()
    : undefined;
  return {
    id: t.id,
    reference: t.reference,
    title: t.title,
    project: t.projectName ?? "",
    priority: t.priority,
    type: t.type as KanbanType,
    assigneeInitials: initials,
    assigneeName: a ? `${a.firstName} ${a.lastName}` : undefined,
    slaDeadline: t.slaDeadline,
    slaBreached: t.slaBreached,
    commentCount: t.comments.length,
    jiraKey: t.jiraKey,
  };
}

function ticketsToColumns(tickets: Ticket[]): KanbanColumns {
  const cols = emptyColumns();
  for (const t of tickets) {
    if (cols[t.status]) cols[t.status].push(ticketToKanban(t));
  }
  return cols;
}

function getSlaChip(
  deadline?: string,
  breached?: boolean,
): { label: string; color: string; subtle: string } | null {
  if (breached)
    return { label: "SLA !", color: "var(--red)", subtle: "var(--red-subtle)" };
  if (!deadline) return null;
  const diff = new Date(deadline).getTime() - Date.now();
  if (diff <= 0)
    return { label: "SLA !", color: "var(--red)", subtle: "var(--red-subtle)" };
  const hours = diff / 3_600_000;
  if (hours < 24) {
    return {
      label: `SLA ${Math.ceil(hours)}h`,
      color: "var(--orange)",
      subtle: "var(--orange-subtle)",
    };
  }
  return null;
}

// ─── Ticket card ─────────────────────────────────────────────────────────────

function TicketCard({
  ticket,
  isDragging = false,
  updatingId,
  onClick,
}: {
  ticket: KanbanTicket;
  isDragging?: boolean;
  updatingId: string | null;
  onClick: () => void;
}) {
  const isUpdating = updatingId === ticket.id;
  const typeColor = typeColors[ticket.type];
  const typeSubtle = typeSubtles[ticket.type];
  const slaChip = getSlaChip(ticket.slaDeadline, ticket.slaBreached);

  return (
    <Box
      onClick={onClick}
      sx={{
        background: isUpdating ? "var(--accent-subtle)" : "var(--s1)",
        border: "1px solid var(--border)",
        borderRadius: "var(--r)",
        padding: "11px 12px 10px 12px",
        cursor: isDragging ? "grabbing" : "pointer",
        boxShadow: isDragging
          ? "0 12px 32px rgba(0,0,0,0.16), 0 2px 8px rgba(0,0,0,0.08)"
          : "none",
        userSelect: "none",
        opacity: isUpdating ? 0.5 : 1,
        transform: isDragging ? "rotate(1.2deg) scale(1.01)" : "none",
        transition: "opacity 0.15s, box-shadow 0.15s, border-color 0.15s, transform 0.12s",
        "&:hover": !isDragging
          ? {
              borderColor: "var(--border2)",
              boxShadow: "0 2px 8px rgba(0,0,0,0.07)",
            }
          : {},
      }}
    >
      {/* Row 1: type badge + SLA */}
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: "8px", gap: "6px" }}>
        <Box
          component="span"
          sx={{
            display: "inline-flex",
            alignItems: "center",
            gap: "3px",
            fontSize: "10px",
            fontWeight: 600,
            color: typeColor,
            background: typeSubtle,
            borderRadius: "4px",
            padding: "2px 7px 2px 5px",
          }}
        >
          {typeIcons[ticket.type]}
          {typeLabels[ticket.type]}
        </Box>

        {slaChip && (
          <Tooltip
            title={
              ticket.slaDeadline
                ? `Deadline : ${new Date(ticket.slaDeadline).toLocaleString("fr-FR")}`
                : "SLA dépassé"
            }
            placement="top"
            arrow
          >
            <Box
              component="span"
              sx={{
                display: "inline-flex",
                alignItems: "center",
                gap: "3px",
                fontSize: "9px",
                fontWeight: 700,
                color: slaChip.color,
                background: slaChip.subtle,
                borderRadius: "4px",
                padding: "2px 6px 2px 4px",
                letterSpacing: "0.02em",
              }}
            >
              <WarningAmberOutlined sx={{ fontSize: 9 }} />
              {slaChip.label}
            </Box>
          </Tooltip>
        )}
      </Box>

      {/* Row 2: title */}
      <Box
        sx={{
          fontSize: "13px",
          fontWeight: 600,
          lineHeight: "1.45",
          color: "var(--text)",
          mb: "9px",
          display: "-webkit-box",
          WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical",
          overflow: "hidden",
          letterSpacing: "-0.015em",
        }}
      >
        {ticket.title}
      </Box>

      {/* Row 3: project */}
      {ticket.project && (
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: "4px",
            mb: "9px",
            minWidth: 0,
            overflow: "hidden",
          }}
        >
          <FolderOutlined sx={{ fontSize: 10, color: "var(--muted2)", flexShrink: 0 }} />
          <Box
            component="span"
            sx={{
              fontSize: "10.5px",
              color: "var(--muted2)",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {ticket.project}
          </Box>
        </Box>
      )}

      {/* Row 4: footer */}
      <Box sx={{ display: "flex", alignItems: "center" }}>
        {/* Left: ref + jira */}
        <Box sx={{ display: "flex", alignItems: "center", gap: "5px", flex: 1, minWidth: 0 }}>
          <Box
            component="span"
            sx={{
              fontFamily: "var(--font-mono)",
              fontSize: "10px",
              fontWeight: 600,
              color: "var(--muted)",
              letterSpacing: "0.03em",
              flexShrink: 0,
            }}
          >
            {ticket.reference}
          </Box>

          {ticket.jiraKey && (
            <Box
              component="span"
              sx={{
                fontFamily: "var(--font-mono)",
                fontSize: "9px",
                fontWeight: 600,
                color: "var(--cyan)",
                flexShrink: 0,
              }}
            >
              · {ticket.jiraKey}
            </Box>
          )}
        </Box>

        {/* Right: comments + assignee */}
        <Box sx={{ display: "flex", alignItems: "center", gap: "7px", flexShrink: 0 }}>
          {ticket.commentCount > 0 && (
            <Tooltip
              title={`${ticket.commentCount} commentaire${ticket.commentCount > 1 ? "s" : ""}`}
              placement="top"
              arrow
            >
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: "3px",
                  fontSize: "10px",
                  color: "var(--muted2)",
                }}
              >
                <CommentOutlined sx={{ fontSize: 11 }} />
                {ticket.commentCount}
              </Box>
            </Tooltip>
          )}

          {ticket.assigneeInitials && (
            <Tooltip
              title={ticket.assigneeName ?? ticket.assigneeInitials}
              placement="top"
              arrow
            >
              <Box
                sx={{
                  width: "22px",
                  height: "22px",
                  borderRadius: "50%",
                  background: "var(--accent-subtle)",
                  border: "1.5px solid var(--accent-border)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "8.5px",
                  fontWeight: 700,
                  color: "var(--accent)",
                  fontFamily: "var(--font-mono)",
                }}
              >
                {ticket.assigneeInitials}
              </Box>
            </Tooltip>
          )}
        </Box>
      </Box>
    </Box>
  );
}

// ─── Skeleton card ────────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <Box
      sx={{
        background: "var(--bg)",
        border: "1px solid var(--border)",
        borderLeft: "3px solid var(--border2)",
        borderRadius: "var(--r)",
        padding: "10px 11px 10px 10px",
        animation: "pulse 1.4s ease-in-out infinite",
      }}
    >
      <Box sx={{ display: "flex", gap: "6px", mb: "8px" }}>
        <Box sx={{ width: 52, height: 16, borderRadius: 4, background: "var(--s2)" }} />
      </Box>
      <Box sx={{ height: 12, borderRadius: 4, background: "var(--s2)", mb: "6px" }} />
      <Box sx={{ height: 12, borderRadius: 4, background: "var(--s2)", width: "70%", mb: "9px" }} />
      <Box sx={{ display: "flex", gap: "6px" }}>
        <Box sx={{ width: 6, height: 6, borderRadius: "50%", background: "var(--s2)" }} />
        <Box sx={{ width: 48, height: 10, borderRadius: 4, background: "var(--s2)" }} />
      </Box>
    </Box>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export const KanbanPage: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [columns, setColumns] = useState<KanbanColumns>(emptyColumns());
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const wasDragging = useRef(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getTickets({ pageSize: 200 });
      setColumns(ticketsToColumns(result.items));
    } catch {
      showToast("Impossible de charger les tickets", "error");
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    load();
  }, [load]);

  const filteredColumns = useMemo<KanbanColumns>(() => {
    const term = search.toLowerCase().trim();
    if (!term) return columns;
    const filter = (tickets: KanbanTicket[]) =>
      tickets.filter(
        (t) =>
          t.title.toLowerCase().includes(term) ||
          t.reference.toLowerCase().includes(term),
      );
    return {
      new: filter(columns.new),
      in_progress: filter(columns.in_progress),
      testing: filter(columns.testing),
      resolved: filter(columns.resolved),
      closed: filter(columns.closed),
    };
  }, [columns, search]);

  const hasFilters = !!search;

  const onDragEnd = useCallback(
    async (result: DropResult) => {
      setTimeout(() => {
        wasDragging.current = false;
      }, 0);

      if (!result.destination) return;
      const { draggableId, source, destination } = result;
      const sourceCol = source.droppableId as TicketStatus;
      const destCol = destination.droppableId as TicketStatus;
      if (sourceCol === destCol && source.index === destination.index) return;

      if (sourceCol === destCol) {
        const visibleItems = filteredColumns[sourceCol];
        const movedId = visibleItems[source.index]?.id;
        const targetId = visibleItems[destination.index]?.id;
        if (!movedId || !targetId) return;
        setColumns((prev) => {
          const items = [...prev[sourceCol]];
          return {
            ...prev,
            [sourceCol]: arrayMove(
              items,
              items.findIndex((t) => t.id === movedId),
              items.findIndex((t) => t.id === targetId),
            ),
          };
        });
        return;
      }

      const movedTicket = columns[sourceCol].find((t) => t.id === draggableId);
      if (!movedTicket) return;

      const afterId = filteredColumns[destCol][destination.index]?.id;
      setColumns((prev) => {
        const sourceItems = prev[sourceCol].filter((t) => t.id !== draggableId);
        const destItems = [...prev[destCol]];
        const insertAt = afterId
          ? destItems.findIndex((t) => t.id === afterId)
          : destItems.length;
        destItems.splice(
          insertAt >= 0 ? insertAt : destItems.length,
          0,
          movedTicket,
        );
        return { ...prev, [sourceCol]: sourceItems, [destCol]: destItems };
      });

      setUpdatingId(draggableId);
      try {
        await changeStatus(draggableId, destCol);
      } catch {
        showToast("Erreur lors du changement de statut", "error");
        load();
      } finally {
        setUpdatingId(null);
      }
    },
    [columns, filteredColumns, showToast, load],
  );

  return (
    <>
      <GlobalStyles
        styles={{
          ".kanban-col-body": {
            scrollbarWidth: "thin",
            scrollbarColor: "var(--border2) transparent",
          },
          ".kanban-col-body::-webkit-scrollbar": { width: "3px" },
          ".kanban-col-body::-webkit-scrollbar-track": {
            background: "transparent",
          },
          ".kanban-col-body::-webkit-scrollbar-thumb": {
            background: "var(--border2)",
            borderRadius: "4px",
          },
        }}
      />

      <Box
        className="kanban-content page-enter"
        sx={{
          display: "flex",
          flexDirection: "column",
          height: "100vh",
          overflow: "hidden",
        }}
      >
        {/* ── Header ─────────────────────────────────────────────────── */}
        <Box
          sx={{
            px: "28px",
            pt: "36px",
            pb: "14px",
            flexShrink: 0,
          }}
        >
          <Box
            sx={{
              width: "280px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              background: "var(--s1)",
              border: "1px solid var(--border)",
              borderRadius: "9px",
              px: "10px",
              height: "32px",
              transition: "border-color 0.15s, box-shadow 0.15s",
              "&:focus-within": {
                borderColor: "var(--accent-border)",
                boxShadow: "0 0 0 3px rgba(99,102,241,0.08)",
              },
            }}
          >
            <SearchOutlined
              sx={{ color: "var(--muted)", fontSize: "14px", flexShrink: 0 }}
            />
            <Box
              component="input"
              placeholder="Rechercher..."
              value={search}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setSearch(e.target.value)
              }
              sx={{
                all: "unset",
                flex: 1,
                fontSize: "12.5px",
                color: "var(--text)",
                "&::placeholder": { color: "var(--muted)" },
                "&:focus": { outline: "none", boxShadow: "none !important" },
              }}
            />
          </Box>
        </Box>

        {/* ── Board ──────────────────────────────────────────────────── */}
        {loading ? (
          <Box
            sx={{
              flex: 1,
              overflowX: "auto",
              overflowY: "hidden",
              px: "28px",
              pb: "20px",
              minHeight: 0,
            }}
          >
            <div
              style={{
                display: "flex",
                gap: "12px",
                minWidth: "fit-content",
                height: "100%",
              }}
            >
              {columnOrder.map((colId) => {
                const meta = columnMeta[colId];
                return (
                  <div
                    key={colId}
                    style={{
                      width: "280px",
                      height: "100%",
                      display: "flex",
                      flexDirection: "column",
                    }}
                  >
                    {/* Column header skeleton */}
                    <Box
                      sx={{
                        mb: "8px",
                        padding: "11px 14px",
                        background: "var(--s1)",
                        border: "1px solid var(--border)",
                        borderTop: `2px solid ${meta.color}`,
                        borderRadius: "var(--r)",
                        flexShrink: 0,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                      }}
                    >
                      <Box sx={{ display: "flex", alignItems: "center", gap: "7px" }}>
                        <Box sx={{ width: 7, height: 7, borderRadius: "50%", background: meta.color }} />
                        <Box sx={{ fontSize: "11px", fontWeight: 700, color: "var(--text)", letterSpacing: "0.04em", textTransform: "uppercase" }}>
                          {meta.label}
                        </Box>
                      </Box>
                      <Box sx={{ width: 22, height: 20, borderRadius: 99, background: "var(--s2)" }} />
                    </Box>

                    {/* Skeleton cards */}
                    <Box
                      sx={{
                        flex: 1,
                        minHeight: 0,
                        display: "flex",
                        flexDirection: "column",
                        gap: "6px",
                        padding: "8px 0 16px",
                        background: "var(--s1)",
                        border: "1px solid var(--border)",
                        borderRadius: "var(--r)",
                        px: "8px",
                        overflowY: "hidden",
                      }}
                    >
                      {[1, 2, 3].map((i) => (
                        <SkeletonCard key={i} />
                      ))}
                    </Box>
                  </div>
                );
              })}
            </div>
          </Box>
        ) : (
          <Box
            sx={{
              flex: 1,
              overflowX: "auto",
              overflowY: "hidden",
              px: "28px",
              pb: "20px",
              minHeight: 0,
            }}
          >
            <DragDropContext
              onBeforeDragStart={() => {
                wasDragging.current = true;
              }}
              onDragEnd={onDragEnd}
            >
              <div
                style={{
                  display: "flex",
                  gap: "12px",
                  minWidth: "fit-content",
                  height: "100%",
                }}
              >
                {columnOrder.map((colId) => {
                  const meta = columnMeta[colId];
                  const colTickets = filteredColumns[colId];
                  const totalInCol = columns[colId].length;

                  return (
                    <div
                      key={colId}
                      style={{
                        width: "280px",
                        height: "100%",
                        display: "flex",
                        flexDirection: "column",
                      }}
                    >
                      {/* Column header */}
                      <Box
                        sx={{
                          mb: "8px",
                          padding: "11px 14px",
                          background: "var(--s1)",
                          border: "1px solid var(--border)",
                          borderTop: `2px solid ${meta.color}`,
                          borderRadius: "var(--r)",
                          flexShrink: 0,
                        }}
                      >
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            gap: "8px",
                          }}
                        >
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: "7px",
                            }}
                          >
                            <Box
                              sx={{
                                width: "7px",
                                height: "7px",
                                borderRadius: "50%",
                                background: meta.color,
                                flexShrink: 0,
                              }}
                            />
                            <Box
                              sx={{
                                fontSize: "11px",
                                fontWeight: 700,
                                color: "var(--text)",
                                letterSpacing: "0.04em",
                                textTransform: "uppercase",
                              }}
                            >
                              {meta.label}
                            </Box>
                          </Box>
                          <Box
                            component="span"
                            sx={{
                              display: "inline-flex",
                              alignItems: "center",
                              justifyContent: "center",
                              minWidth: "22px",
                              height: "20px",
                              padding: "0 6px",
                              borderRadius: "99px",
                              background: meta.subtle,
                              border: `1px solid ${meta.border}`,
                              fontFamily: "var(--font-mono)",
                              fontSize: "10px",
                              fontWeight: 700,
                              color: meta.color,
                            }}
                          >
                            {hasFilters && colTickets.length !== totalInCol
                              ? `${colTickets.length}/${totalInCol}`
                              : colTickets.length}
                          </Box>
                        </Box>
                      </Box>

                      {/* Droppable cards area */}
                      <Droppable droppableId={colId}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.droppableProps}
                            className="kanban-col-body"
                            style={{
                              flex: 1,
                              minHeight: 0,
                              overflowY: "auto",
                              display: "flex",
                              flexDirection: "column",
                              gap: "6px",
                              padding: "8px 8px 16px 8px",
                              background: snapshot.isDraggingOver
                                ? meta.subtle
                                : "var(--s1)",
                              border: `1px solid ${snapshot.isDraggingOver ? meta.border : "var(--border)"}`,
                              borderRadius: "var(--r)",
                              transition: "background 0.15s, border-color 0.15s",
                            }}
                          >
                            {colTickets.map((ticket, index) => (
                              <Draggable
                                key={ticket.id}
                                draggableId={ticket.id}
                                index={index}
                              >
                                {(provided, snapshot) => (
                                  <div
                                    ref={provided.innerRef}
                                    {...provided.draggableProps}
                                    {...provided.dragHandleProps}
                                    style={{ ...provided.draggableProps.style }}
                                  >
                                    <TicketCard
                                      ticket={ticket}
                                      isDragging={snapshot.isDragging}
                                      updatingId={updatingId}
                                      onClick={() => {
                                        if (!wasDragging.current)
                                          navigate(`/tickets/${ticket.id}`);
                                      }}
                                    />
                                  </div>
                                )}
                              </Draggable>
                            ))}
                            {provided.placeholder}

                            {colTickets.length === 0 && (
                              <Box
                                sx={{
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  flex: 1,
                                  opacity: 0.25,
                                }}
                              >
                                <Box
                                  sx={{
                                    width: "24px",
                                    height: "24px",
                                    border: "2px dashed var(--muted2)",
                                    borderRadius: "6px",
                                  }}
                                />
                              </Box>
                            )}
                          </div>
                        )}
                      </Droppable>
                    </div>
                  );
                })}
              </div>
            </DragDropContext>
          </Box>
        )}
      </Box>
    </>
  );
};
