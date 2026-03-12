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
import Tooltip from "@mui/material/Tooltip";
import Box from "@mui/material/Box";
import { useToast } from "../../../hooks/useToast";
import { getTickets, changeStatus } from "../api/tickets";
import { TicketStatus, TicketPriority, Ticket } from "../../../types";
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
  bug: <BugReportOutlined sx={{ fontSize: 10 }} />,
  feature: <AutoFixHighOutlined sx={{ fontSize: 10 }} />,
  security: <SecurityOutlined sx={{ fontSize: 10 }} />,
  performance: <SpeedOutlined sx={{ fontSize: 10 }} />,
  maintenance: <BuildOutlined sx={{ fontSize: 10 }} />,
  question: <HelpOutlineOutlined sx={{ fontSize: 10 }} />,
};

const columnMeta: Record<TicketStatus, { label: string; color: string; subtle: string; border: string }> = {
  new:         { label: "Nouveau",    color: "var(--accent)",  subtle: "var(--accent-subtle)",  border: "var(--accent-border)" },
  analysis:    { label: "En analyse", color: "var(--cyan)",    subtle: "var(--cyan-subtle)",    border: "rgba(6,182,212,0.28)" },
  in_progress: { label: "En cours",   color: "var(--orange)",  subtle: "var(--orange-subtle)",  border: "rgba(249,115,22,0.28)" },
  testing:     { label: "En test",    color: "var(--purple)",  subtle: "var(--purple-subtle)",  border: "rgba(168,85,247,0.28)" },
  resolved:    { label: "Résolu",     color: "var(--green)",   subtle: "var(--green-subtle)",   border: "rgba(34,197,94,0.28)" },
  closed:      { label: "Fermé",      color: "var(--muted2)",  subtle: "rgba(116,136,170,0.10)", border: "rgba(116,136,170,0.22)" },
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

  const color =
    totalMin < 60 ? "var(--red)"
    : totalH < 4 ? "var(--orange)"
    : totalH < 24 ? "var(--yellow)"
    : "var(--muted)";
  const bg =
    totalMin < 60 ? "var(--red-subtle)"
    : totalH < 4 ? "var(--orange-subtle)"
    : "transparent";
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
        border: "1px solid var(--border)",
        borderRadius: "var(--r)",
        padding: "9px 13px 11px",
        cursor: isDragging ? "grabbing" : "pointer",
        boxShadow: isDragging
          ? "0 20px 48px rgba(0,0,0,0.55), 0 6px 16px rgba(0,0,0,0.3)"
          : `inset 0 2px 0 ${priorityColor}60, 0 1px 3px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.08)`,
        userSelect: "none",
        opacity: isUpdating ? 0.6 : 1,
        transition: "opacity 0.2s, transform 0.18s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.18s",
        animation: justDropped
          ? "kanbanLand 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) forwards"
          : undefined,
        willChange: "transform",
        "&:hover": !isDragging
          ? {
              boxShadow: "0 6px 20px rgba(0,0,0,0.13), 0 2px 6px rgba(0,0,0,0.09)",
              transform: "translateY(-2px)",
            }
          : {},
      }}
    >
      {/* Header: type badge */}
      <Box sx={{ mb: "9px", ml: "-5px" }}>
        <Box
          component="span"
          sx={{
            display: "inline-flex",
            alignItems: "center",
            gap: "3px",
            fontSize: "10px",
            fontWeight: 600,
            color: typeColor,
            background: `${typeColor}12`,
            borderRadius: "4px",
            padding: "2px 7px 2px 5px",
          }}
        >
          {typeIcons[ticket.type]}
          {typeLabels[ticket.type]}
        </Box>
      </Box>

      {/* Title */}
      <Box
        sx={{
          fontSize: "13px",
          fontWeight: 600,
          lineHeight: 1.5,
          color: "var(--text)",
          mb: "11px",
          display: "-webkit-box",
          WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical",
          overflow: "hidden",
          letterSpacing: "-0.015em",
        }}
      >
        {ticket.title}
      </Box>

      {/* Footer */}
      <Box sx={{ display: "flex", alignItems: "center", gap: "5px" }}>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: "4px",
            flex: 1,
            overflow: "hidden",
            minWidth: 0,
          }}
        >
          <Box
            component="span"
            sx={{
              fontFamily: "var(--font-mono)",
              fontSize: "9px",
              fontWeight: 600,
              color: "var(--muted)",
              letterSpacing: "0.04em",
              flexShrink: 0,
            }}
          >
            {ticket.reference}
          </Box>
          {ticket.project && (
            <>
              <Box component="span" sx={{ fontSize: "9px", color: "var(--border2)", flexShrink: 0 }}>·</Box>
              <Box
                component="span"
                sx={{
                  fontSize: "10px",
                  color: "var(--muted2)",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {ticket.project}
              </Box>
            </>
          )}
        </Box>

        <Box sx={{ display: "flex", alignItems: "center", gap: "5px", flexShrink: 0 }}>
          <SlaChip deadline={ticket.slaDeadline} breached={ticket.slaBreached} />
          {ticket.assigneeInitials && (
            <Tooltip title={ticket.assigneeInitials} placement="top" arrow>
              <Box
                sx={{
                  width: "24px",
                  height: "24px",
                  borderRadius: "50%",
                  background: "var(--accent-subtle)",
                  border: "1.5px solid var(--accent-border)",
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
            </Tooltip>
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
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useSortable({ id: ticket.id });

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
  subtle,
  children,
}: {
  colId: string;
  isOver: boolean;
  subtle: string;
  children: React.ReactNode;
}) {
  const { setNodeRef } = useDroppable({ id: colId });

  return (
    <Box
      ref={setNodeRef}
      sx={{
        flex: 1,
        minHeight: "120px",
        background: isOver ? subtle : "var(--s2)",
        borderRadius: "var(--r)",
        padding: "10px",
        display: "flex",
        flexDirection: "column",
        gap: "8px",
        transition: "background 0.2s",
        overflowY: "auto",
        boxShadow: "inset 0 1px 3px rgba(0,0,0,0.08)",
      }}
    >
      {children}
    </Box>
  );
}

export const KanbanPage: React.FC = () => {
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


  return (
    <>
      <Topbar title="" />

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
              sx={{ gap: "14px", minWidth: "fit-content", height: "100%" }}
            >
              {columnOrder.map((colId) => {
                const meta = columnMeta[colId];
                const colTickets = columns[colId];
                return (
                  <Box
                    key={colId}
                    className="d-flex flex-column flex-shrink-0"
                    sx={{ width: "296px" }}
                  >
                    {/* Title card */}
                    <Box
                      sx={{
                        mb: "22px",
                        padding: "11px 14px",
                        background: "var(--s1)",
                        border: "1px solid var(--border)",
                        borderRadius: "var(--r)",
                        boxShadow: "0 2px 8px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.07)",
                      }}
                    >
                      <Box className="d-flex align-items-center" sx={{ gap: "8px" }}>
                        <Box
                          component="span"
                          sx={{
                            fontSize: "12px",
                            fontWeight: 700,
                            color: "var(--text)",
                            letterSpacing: "-0.01em",
                            flex: 1,
                          }}
                        >
                          {meta.label}
                        </Box>
                        <Box
                          component="span"
                          sx={{
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            minWidth: "26px",
                            height: "26px",
                            padding: "0 6px",
                            borderRadius: "99px",
                            background: meta.subtle,
                            border: `1px solid ${meta.border}`,
                            fontFamily: "var(--font-mono)",
                            fontSize: "10px",
                            fontWeight: 700,
                            color: meta.color,
                            flexShrink: 0,
                          }}
                        >
                          {colTickets.length}
                        </Box>
                      </Box>
                    </Box>

                    {/* Content card */}
                    <SortableContext
                      items={colTickets.map((t) => t.id)}
                      strategy={verticalListSortingStrategy}
                    >
                      <DroppableColumn
                        colId={colId}
                        isOver={overColumn === colId}
                        subtle={meta.subtle}
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
                            sx={{
                              display: "flex",
                              flexDirection: "column",
                              alignItems: "center",
                              justifyContent: "center",
                              flex: 1,
                              minHeight: "100px",
                              gap: "8px",
                              opacity: 0.35,
                            }}
                          >
                            <ConfirmationNumberOutlined sx={{ fontSize: 22, color: "var(--muted)" }} />
                          </Box>
                        )}
                      </DroppableColumn>
                    </SortableContext>
                  </Box>
                );
              })}
            </Box>

            <DragOverlay dropAnimation={null}>
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
