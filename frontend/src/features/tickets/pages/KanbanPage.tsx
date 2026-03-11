import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { useDroppable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { useNavigate } from "react-router-dom";
import { Topbar } from "../../../layouts/Topbar";
import CircularProgress from "@mui/material/CircularProgress";
import Button from "@mui/material/Button";
import Box from "@mui/material/Box";
import { useToast } from "../../../hooks/useToast";
import { getTickets, changeStatus } from "../api/tickets";
import { TicketStatus, TicketPriority, Ticket } from "../../../types";
import AddOutlined from "@mui/icons-material/AddOutlined";
import ConfirmationNumberOutlined from "@mui/icons-material/ConfirmationNumberOutlined";
import AccessTimeOutlined from "@mui/icons-material/AccessTimeOutlined";
import BugReportOutlined from "@mui/icons-material/BugReportOutlined";
import AutoFixHighOutlined from "@mui/icons-material/AutoFixHighOutlined";
import SecurityOutlined from "@mui/icons-material/SecurityOutlined";
import SpeedOutlined from "@mui/icons-material/SpeedOutlined";
import BuildOutlined from "@mui/icons-material/BuildOutlined";
import HelpOutlineOutlined from "@mui/icons-material/HelpOutline";

interface KanbanTicket {
  id: string;
  reference: string;
  title: string;
  project: string;
  priority: TicketPriority;
  type: "bug" | "feature" | "security" | "performance" | "maintenance" | "question";
  slaDeadline?: string;
  slaBreached?: boolean;
  assigneeInitials?: string;
}

type KanbanColumns = Record<TicketStatus, KanbanTicket[]>;

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

const typeColors: Record<KanbanTicket["type"], string> = {
  bug: "var(--red)",
  feature: "var(--accent)",
  security: "var(--orange)",
  performance: "var(--cyan)",
  maintenance: "var(--muted2)",
  question: "var(--purple)",
};

const typeLabels: Record<KanbanTicket["type"], string> = {
  bug: "Bug",
  feature: "Feature",
  security: "Sécurité",
  performance: "Performance",
  maintenance: "Maintenance",
  question: "Question",
};

const typeIcons: Record<KanbanTicket["type"], React.ReactNode> = {
  bug: <BugReportOutlined sx={{ fontSize: 11 }} />,
  feature: <AutoFixHighOutlined sx={{ fontSize: 11 }} />,
  security: <SecurityOutlined sx={{ fontSize: 11 }} />,
  performance: <SpeedOutlined sx={{ fontSize: 11 }} />,
  maintenance: <BuildOutlined sx={{ fontSize: 11 }} />,
  question: <HelpOutlineOutlined sx={{ fontSize: 11 }} />,
};

const columnMeta: Record<TicketStatus, { label: string; color: string; pastel: string }> = {
  new: { label: "Nouveau", color: "var(--accent)", pastel: "#a5b4fc" },
  analysis: { label: "En analyse", color: "var(--cyan)", pastel: "#a5f3fc" },
  in_progress: { label: "En cours", color: "var(--orange)", pastel: "#fdba74" },
  testing: { label: "En test", color: "var(--purple)", pastel: "#d8b4fe" },
  resolved: { label: "Résolu", color: "var(--green)", pastel: "#86efac" },
  closed: { label: "Fermé", color: "var(--muted2)", pastel: "#cbd5e1" },
};

const columnOrder: TicketStatus[] = [
  "new",
  "analysis",
  "in_progress",
  "testing",
  "resolved",
  "closed",
];

const emptyColumns = (): KanbanColumns => ({
  new: [],
  analysis: [],
  in_progress: [],
  testing: [],
  resolved: [],
  closed: [],
});

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
    type: t.type,
    slaDeadline: t.slaDeadline,
    slaBreached: t.slaBreached,
    assigneeInitials: initials,
  };
}

function ticketsToColumns(tickets: Ticket[]): KanbanColumns {
  const cols = emptyColumns();
  for (const t of tickets) {
    if (cols[t.status]) cols[t.status].push(ticketToKanban(t));
  }
  return cols;
}

function findTicketColumn(
  columns: KanbanColumns,
  ticketId: string,
): TicketStatus | null {
  for (const colId of columnOrder) {
    if (columns[colId].some((t) => t.id === ticketId)) return colId;
  }
  return null;
}

function fmtSlaCompact(deadline: string): { label: string; color: string; bg: string } {
  const diff = new Date(deadline).getTime() - Date.now();
  if (diff <= 0) return { label: "Dépassé", color: "var(--red)", bg: "var(--red-subtle)" };

  const totalMin = Math.floor(diff / 60000);
  const totalH = Math.floor(diff / 3600000);
  const days = Math.floor(totalH / 24);
  const hours = totalH % 24;
  const mins = totalMin % 60;

  let label: string;
  if (totalMin < 60) label = `${totalMin}min`;
  else if (totalH < 24) label = mins > 0 ? `${totalH}h ${mins}m` : `${totalH}h`;
  else label = hours > 0 ? `${days}j ${hours}h` : `${days}j`;

  const color = totalMin < 60 ? "var(--red)" : totalH < 4 ? "var(--orange)" : totalH < 24 ? "var(--yellow)" : "var(--muted)";
  const bg = totalMin < 60 ? "var(--red-subtle)" : totalH < 4 ? "var(--orange-subtle)" : "transparent";
  return { label, color, bg };
}

function SlaChip({ deadline, breached }: { deadline?: string; breached?: boolean }) {
  if (!deadline && !breached) return null;

  const { label, color, bg } = breached || !deadline
    ? { label: "Dépassé", color: "var(--red)", bg: "var(--red-subtle)" }
    : fmtSlaCompact(deadline);

  const hasBorder = breached || (deadline && new Date(deadline) < new Date());

  return (
    <Box
      component="span"
      sx={{
        display: "inline-flex",
        alignItems: "center",
        gap: "3px",
        fontFamily: "var(--font-mono)",
        fontSize: "9px",
        fontWeight: 700,
        color,
        background: bg,
        border: hasBorder ? "1px solid rgba(239,68,68,0.25)" : "none",
        borderRadius: "var(--r-sm)",
        padding: "2px 5px",
        flexShrink: 0,
      }}
    >
      <AccessTimeOutlined sx={{ fontSize: 9 }} />
      {label}
    </Box>
  );
}

function TicketCard({
  ticket,
  isDragging = false,
  updatingId,
  justDropped = false,
}: {
  ticket: KanbanTicket;
  isDragging?: boolean;
  updatingId: string | null;
  justDropped?: boolean;
}) {
  const navigate = useNavigate();
  const isUpdating = updatingId === ticket.id;
  const typeColor = typeColors[ticket.type];
  const priorityColor = priorityColors[ticket.priority];

  return (
    <Box
      onClick={() => !isDragging && navigate(`/tickets/${ticket.id}`)}
      sx={{
        background: isUpdating ? "var(--accent-subtle)" : "var(--s1)",
        border: `1px solid ${
          isDragging
            ? "var(--accent-border)"
            : isUpdating
              ? "var(--accent-border)"
              : "var(--border)"
        }`,
        borderRadius: "var(--r)",
        padding: "10px 12px",
        cursor: isDragging ? "grabbing" : "pointer",
        boxShadow: isDragging ? "var(--shadow-lg)" : "var(--shadow)",
        userSelect: "none",
        opacity: isUpdating ? 0.65 : 1,
        transition:
          "border-color 0.15s, opacity 0.2s, transform 0.18s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.18s",
        animation: justDropped
          ? "kanbanLand 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) forwards"
          : undefined,
        willChange: "transform",
        "&:hover": !isDragging ? {
          borderColor: "var(--border2)",
          boxShadow: "var(--shadow-md)",
          transform: "translateY(-2px)",
        } : {},
      }}
    >
      <Box className="d-flex align-items-center justify-content-between" sx={{ mb: "6px", gap: "6px" }}>
        <Box
          component="span"
          sx={{
            fontFamily: "var(--font-mono)",
            fontSize: "11px",
            fontWeight: 700,
            color: "var(--accent)",
            letterSpacing: "0.04em",
          }}
        >
          {ticket.reference}
        </Box>
        <Box
          component="span"
          sx={{
            display: "inline-flex",
            alignItems: "center",
            gap: "3px",
            fontSize: "10px",
            fontWeight: 600,
            color: typeColor,
            background: `${typeColor}15`,
            border: `1px solid ${typeColor}30`,
            borderRadius: "4px",
            padding: "1px 6px",
            flexShrink: 0,
          }}
        >
          {typeIcons[ticket.type]}
          {typeLabels[ticket.type]}
        </Box>
      </Box>

      <Box
        sx={{
          fontSize: "13px",
          fontWeight: 600,
          lineHeight: 1.4,
          color: "var(--text)",
          mb: "8px",
          display: "-webkit-box",
          WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical",
          overflow: "hidden",
        }}
      >
        {ticket.title}
      </Box>

      <Box className="d-flex align-items-center" sx={{ gap: "5px" }}>
        <Box
          component="span"
          className="d-inline-flex align-items-center flex-shrink-0"
          sx={{ gap: "3px", fontSize: "10px", fontWeight: 700, color: priorityColor }}
        >
          <Box
            component="span"
            sx={{
              width: 5,
              height: 5,
              borderRadius: "50%",
              background: priorityColor,
              display: "inline-block",
            }}
          />
          {priorityLabels[ticket.priority]}
        </Box>
        {ticket.project && (
          <Box
            component="span"
            className="text-truncate"
            sx={{ fontSize: "10px", color: "var(--muted2)", flex: 1 }}
          >
            · {ticket.project}
          </Box>
        )}
        <Box className="d-flex align-items-center flex-shrink-0" sx={{ ml: "auto", gap: "5px" }}>
          <SlaChip deadline={ticket.slaDeadline} breached={ticket.slaBreached} />
          {ticket.assigneeInitials && (
            <Box
              sx={{
                width: "20px",
                height: "20px",
                borderRadius: "50%",
                background: "var(--accent-subtle)",
                border: "1px solid var(--accent-border)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "8px",
                fontWeight: 700,
                color: "var(--accent)",
                fontFamily: "var(--font-mono)",
                flexShrink: 0,
              }}
            >
              {ticket.assigneeInitials}
            </Box>
          )}
        </Box>
      </Box>
    </Box>
  );
}

function SortableCard({
  ticket,
  updatingId,
  justDroppedId,
}: {
  ticket: KanbanTicket;
  updatingId: string | null;
  justDroppedId: string | null;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    isDragging,
  } = useSortable({ id: ticket.id });

  return (
    <Box
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      style={{
        transform: CSS.Transform.toString(transform),
        transition: isDragging ? undefined : "transform 120ms ease",
        opacity: isDragging ? 0 : 1,
        borderRadius: "var(--r)",
      }}
    >
      <TicketCard
        ticket={ticket}
        updatingId={updatingId}
        justDropped={justDroppedId === ticket.id}
      />
    </Box>
  );
}

function DroppableColumn({
  colId,
  isOver,
  color,
  children,
}: {
  colId: string;
  isOver: boolean;
  color: string;
  children: React.ReactNode;
}) {
  const { setNodeRef } = useDroppable({ id: colId });

  return (
    <Box
      ref={setNodeRef}
      sx={{
        flex: 1,
        minHeight: "120px",
        background: isOver ? `${color}0d` : "var(--s2)",
        border: `1px solid ${isOver ? color : "var(--border2)"}`,
        borderRadius: "var(--r)",
        padding: "8px",
        display: "flex",
        flexDirection: "column",
        gap: "8px",
        transition: "background 0.2s, border-color 0.2s",
        overflowY: "auto",
      }}
    >
      {children}
    </Box>
  );
}

export const KanbanPage: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [columns, setColumns] = useState<KanbanColumns>(emptyColumns());
  const [loading, setLoading] = useState(true);
  const [activeTicket, setActiveTicket] = useState<KanbanTicket | null>(null);
  const [overColumn, setOverColumn] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [justDroppedId, setJustDroppedId] = useState<string | null>(null);
  const sourceColRef = useRef<TicketStatus | null>(null);

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

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  );

  const onDragStart = ({ active }: DragStartEvent) => {
    const ticket = columnOrder
      .flatMap((c) => columns[c])
      .find((t) => t.id === active.id);
    if (ticket) setActiveTicket(ticket);
    sourceColRef.current = findTicketColumn(columns, active.id as string);
  };

  const onDragOver = ({ active, over }: DragOverEvent) => {
    if (!over) {
      setOverColumn(null);
      return;
    }

    const activeId = active.id as string;
    const overId = over.id as string;

    const activeCol = findTicketColumn(columns, activeId);
    const overCol = columnOrder.includes(overId as TicketStatus)
      ? (overId as TicketStatus)
      : findTicketColumn(columns, overId);

    setOverColumn(overCol);

    if (!activeCol || !overCol || activeCol === overCol) return;

    setColumns((prev) => {
      const activeItems = prev[activeCol].filter((t) => t.id !== activeId);
      const movedTicket = prev[activeCol].find((t) => t.id === activeId)!;
      const overItems = [...prev[overCol]];
      const overIndex = overItems.findIndex((t) => t.id === overId);
      const insertAt = overIndex >= 0 ? overIndex : overItems.length;
      overItems.splice(insertAt, 0, movedTicket);
      return { ...prev, [activeCol]: activeItems, [overCol]: overItems };
    });
  };

  const onDragEnd = async ({ active, over }: DragEndEvent) => {
    setActiveTicket(null);
    setOverColumn(null);

    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;
    const sourceCol = sourceColRef.current;

    const destCol = columnOrder.includes(overId as TicketStatus)
      ? (overId as TicketStatus)
      : findTicketColumn(columns, overId);

    if (!destCol || !sourceCol) return;

    if (sourceCol === destCol) {
      const items = columns[destCol];
      const oldIndex = items.findIndex((t) => t.id === activeId);
      const newIndex = items.findIndex((t) => t.id === overId);
      if (oldIndex !== newIndex && newIndex >= 0) {
        setColumns((prev) => ({
          ...prev,
          [destCol]: arrayMove(prev[destCol], oldIndex, newIndex),
        }));
      }
      return;
    }

    setJustDroppedId(activeId);
    setTimeout(() => setJustDroppedId(null), 700);

    setUpdatingId(activeId);
    try {
      await changeStatus(activeId, destCol);
    } catch {
      showToast("Erreur lors du changement de statut", "error");
    } finally {
      setUpdatingId(null);
    }
  };

  const totalTickets = Object.values(columns).reduce(
    (s, col) => s + col.length,
    0,
  );

  return (
    <>
      <Topbar
        title="Kanban"
        subtitle={`${totalTickets} tickets`}
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

      {loading && (
        <Box
          className="d-flex justify-content-center align-items-center"
          sx={{ height: "calc(100vh - 56px)" }}
        >
          <CircularProgress size={28} />
        </Box>
      )}

      {!loading && (
        <Box
          sx={{
            padding: "20px 24px",
            overflowX: "auto",
            height: "calc(100vh - 56px)",
            boxSizing: "border-box",
          }}
        >
          <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={onDragStart}
            onDragOver={onDragOver}
            onDragEnd={onDragEnd}
          >
            <Box
              className="d-flex"
              sx={{ gap: "12px", minWidth: "fit-content", height: "100%" }}
            >
              {columnOrder.map((colId) => {
                const meta = columnMeta[colId];
                const colTickets = columns[colId];

                return (
                  <Box
                    key={colId}
                    className="d-flex flex-column flex-shrink-0"
                    sx={{ width: "280px" }}
                  >
                    <Box
                      className="d-flex align-items-center"
                      sx={{
                        gap: "8px",
                        mb: "10px",
                        padding: "8px 12px",
                        background: `${meta.color}10`,
                        border: `1px solid ${meta.color}25`,
                        borderRadius: "var(--r-sm)",
                      }}
                    >
                      <Box
                        component="span"
                        sx={{
                          fontSize: "11px",
                          fontWeight: 700,
                          color: meta.color,
                          letterSpacing: "0.08em",
                          textTransform: "uppercase",
                          flex: 1,
                        }}
                      >
                        {meta.label}
                      </Box>
                      <Box
                        component="span"
                        sx={{
                          fontFamily: "var(--font-mono)",
                          fontSize: "11px",
                          fontWeight: 700,
                          background: meta.pastel,
                          color: "#1e293b",
                          padding: "2px 8px",
                          borderRadius: "10px",
                          minWidth: "24px",
                          textAlign: "center",
                        }}
                      >
                        {colTickets.length}
                      </Box>
                    </Box>

                    <SortableContext
                      items={colTickets.map((t) => t.id)}
                      strategy={verticalListSortingStrategy}
                    >
                      <DroppableColumn
                        colId={colId}
                        isOver={overColumn === colId}
                        color={meta.color}
                      >
                        {colTickets.map((ticket) => (
                          <SortableCard
                            key={ticket.id}
                            ticket={ticket}
                            updatingId={updatingId}
                            justDroppedId={justDroppedId}
                          />
                        ))}
                        {colTickets.length === 0 && (
                          <Box
                            className="d-flex align-items-center justify-content-center flex-grow-1"
                            sx={{ minHeight: "80px", opacity: 0.25, color: "var(--muted)" }}
                          >
                            <ConfirmationNumberOutlined sx={{ fontSize: 22 }} />
                          </Box>
                        )}
                      </DroppableColumn>
                    </SortableContext>
                  </Box>
                );
              })}
            </Box>

            <DragOverlay
              dropAnimation={null}
            >
              {activeTicket && (
                <Box
                  sx={{
                    transform: "rotate(1.5deg) scale(1.04)",
                    filter: "drop-shadow(0 12px 24px rgba(0,0,0,0.5))",
                  }}
                >
                  <TicketCard
                    ticket={activeTicket}
                    isDragging
                    updatingId={null}
                  />
                </Box>
              )}
            </DragOverlay>
          </DndContext>
        </Box>
      )}
    </>
  );
};
