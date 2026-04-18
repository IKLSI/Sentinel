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
import Dialog from "@mui/material/Dialog";
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
import TuneOutlined from "@mui/icons-material/TuneOutlined";

type KanbanType =
  | "bug"
  | "feature"
  | "security"
  | "performance"
  | "maintenance"
  | "question";

function toggleItem<T>(arr: T[], val: T): T[] {
  return arr.includes(val) ? arr.filter((x) => x !== val) : [...arr, val];
}

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
}

type KanbanColumns = Record<TicketStatus, KanbanTicket[]>;



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
    color: "var(--cyan)",
    subtle: "var(--cyan-subtle)",
    border: "rgba(6,182,212,0.28)",
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
  };
}

function ticketsToColumns(tickets: Ticket[]): KanbanColumns {
  const cols = emptyColumns();
  for (const t of tickets) {
    if (cols[t.status]) cols[t.status].push(ticketToKanban(t));
  }
  return cols;
}

// ─── Project picker ───────────────────────────────────────────────────────────


function projectInitials(name: string): string {
  const words = name.trim().split(/\s+/);
  if (words.length >= 2) return (words[0][0] + words[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

function ProjectPicker({
  open,
  onClose,
  allProjects,
  selected,
  onToggle,
  onClear,
}: {
  open: boolean;
  onClose: () => void;
  allProjects: string[];
  selected: string[];
  onToggle: (p: string) => void;
  onClear: () => void;
}) {
  const [search, setSearch] = useState("");
  const [cursor, setCursor] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const visible = allProjects.filter((p) =>
    p.toLowerCase().includes(search.toLowerCase()),
  );

  useEffect(() => {
    if (open) {
      setSearch("");
      setCursor(-1);
      setTimeout(() => inputRef.current?.focus(), 80);
    }
  }, [open]);

  useEffect(() => { setCursor(-1); }, [search]);

  useEffect(() => {
    if (cursor >= 0 && listRef.current) {
      const el = listRef.current.children[cursor] as HTMLElement;
      el?.scrollIntoView({ block: "nearest" });
    }
  }, [cursor]);

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setCursor((c) => Math.min(c + 1, visible.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setCursor((c) => Math.max(c - 1, 0));
    } else if (e.key === "Enter" && cursor >= 0) {
      e.preventDefault();
      onToggle(visible[cursor]);
    } else if (e.key === "Escape") {
      onClose();
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          background: "var(--s1)",
          border: "1px solid var(--border2)",
          borderRadius: "18px",
          boxShadow: "0 48px 120px rgba(0,0,0,0.5), 0 12px 40px rgba(0,0,0,0.22)",
          width: "520px",
          maxWidth: "calc(100vw - 32px)",
          m: 2,
          overflow: "hidden",
        },
      }}
      sx={{
        "& .MuiBackdrop-root": {
          backdropFilter: "blur(14px)",
          backgroundColor: "rgba(0,0,0,0.55)",
        },
      }}
    >
      {/* ── Search ── */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: "14px",
          px: "20px",
          height: "58px",
          borderBottom: "1px solid var(--border)",
        }}
      >
        <SearchOutlined sx={{ fontSize: "20px", color: "var(--muted)", flexShrink: 0 }} />
        <Box
          component="input"
          ref={inputRef}
          placeholder="Filtrer par projet..."
          value={search}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
          onKeyDown={handleKey}
          sx={{
            all: "unset",
            flex: 1,
            fontSize: "15px",
            letterSpacing: "-0.015em",
            color: "var(--text)",
            "&::placeholder": { color: "var(--muted)" },
          }}
        />
      </Box>

      {/* ── Selected chips ── */}
      {selected.length > 0 && (
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            flexWrap: "wrap",
            px: "16px",
            py: "10px",
            borderBottom: "1px solid var(--border)",
            background: "rgba(0,0,0,0.06)",
          }}
        >
          {selected.map((p) => {
            return (
              <Box
                key={p}
                sx={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "5px",
                  pl: "8px",
                  pr: "5px",
                  height: "24px",
                  borderRadius: "99px",
                  background: "var(--accent-subtle)",
                  border: "1px solid var(--accent-border)",
                  fontSize: "11.5px",
                  fontWeight: 600,
                  color: "var(--accent)",
                  maxWidth: "180px",
                  flexShrink: 0,
                }}
              >
                <Box sx={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {p}
                </Box>
                <Box
                  onClick={(e) => { e.stopPropagation(); onToggle(p); }}
                  sx={{
                    width: "15px",
                    height: "15px",
                    borderRadius: "50%",
                    background: "rgba(0,0,0,0.15)",
                    color: "var(--accent)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    flexShrink: 0,
                    "&:hover": { background: "var(--accent)", color: "#fff" },
                    transition: "all 0.1s",
                  }}
                >
                  <svg width="6" height="6" viewBox="0 0 6 6" fill="none">
                    <path d="M1 1L5 5M5 1L1 5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                  </svg>
                </Box>
              </Box>
            );
          })}
          <Box
            component="button"
            onClick={onClear}
            sx={{
              display: "inline-flex",
              alignItems: "center",
              gap: "4px",
              height: "24px",
              px: "9px",
              borderRadius: "99px",
              border: "1px solid var(--border2)",
              background: "transparent",
              color: "var(--muted)",
              fontSize: "11px",
              fontWeight: 500,
              cursor: "pointer",
              outline: "none",
              flexShrink: 0,
              ml: "2px",
              transition: "border-color 0.15s, color 0.15s, background 0.15s",
              "&:hover": {
                borderColor: "rgba(239,68,68,0.4)",
                background: "rgba(239,68,68,0.07)",
                color: "#ef4444",
              },
            }}
          >
            Tout effacer
            <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
              <path d="M1 1L7 7M7 1L1 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </Box>
        </Box>
      )}

      {/* ── List ── */}
      <Box sx={{ position: "relative" }}>
      <Box
        ref={listRef}
        sx={{
          maxHeight: "336px",
          overflowY: "auto",
          pt: "6px",
          pb: "32px",
          scrollbarWidth: "thin",
          scrollbarColor: "var(--border2) transparent",
          "&::-webkit-scrollbar": { width: "3px" },
          "&::-webkit-scrollbar-thumb": { background: "var(--border2)", borderRadius: "4px" },
        }}
      >
        {visible.length === 0 ? (
          <Box
            sx={{
              py: "40px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <Box sx={{ opacity: 0.18 }}>
              <FolderOutlined sx={{ fontSize: "32px", color: "var(--muted)" }} />
            </Box>
            <Box sx={{ fontSize: "13px", color: "var(--muted)" }}>Aucun projet trouvé</Box>
          </Box>
        ) : (
          visible.map((project, i) => {
            const isSelected = selected.includes(project);
            const isCursor = cursor === i;
            const initials = projectInitials(project);
            return (
              <Box
                key={project}
                onClick={() => onToggle(project)}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  mx: "6px",
                  mb: "2px",
                  cursor: "pointer",
                  userSelect: "none",
                }}
              >
                {/* Spacer avant l'avatar */}
                <Box sx={{ width: "8px", flexShrink: 0 }} />

                {/* Zone colorée : avatar → fin */}
                <Box
                  sx={{
                    flex: 1,
                    display: "flex",
                    alignItems: "center",
                    gap: "13px",
                    pl: "10px",
                    pr: "10px",
                    py: "6px",
                    borderRadius: "10px",
                    background: isSelected
                      ? "var(--accent-subtle)"
                      : isCursor
                      ? "var(--s2)"
                      : "transparent",
                    transition: "background 0.08s",
                    "&:hover": { background: isSelected ? "var(--accent-subtle)" : "var(--s2)" },
                  }}
                >

                {/* Avatar */}
                <Box
                  sx={{
                    width: "34px",
                    height: "34px",
                    borderRadius: "9px",
                    background: isSelected ? "var(--accent)" : "var(--accent-subtle)",
                    border: `1.5px solid ${isSelected ? "var(--accent)" : "var(--accent-border)"}`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "10.5px",
                    fontWeight: 700,
                    color: isSelected ? "#fff" : "var(--accent)",
                    fontFamily: "var(--font-mono)",
                    letterSpacing: "0.04em",
                    flexShrink: 0,
                    transition: "all 0.15s",
                  }}
                >
                  {initials}
                </Box>

                {/* Name */}
                <Box
                  sx={{
                    flex: 1,
                    fontSize: "13.5px",
                    fontWeight: isSelected ? 500 : 400,
                    color: isSelected ? "var(--text)" : "var(--text-secondary)",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    letterSpacing: "-0.012em",
                  }}
                >
                  {project}
                </Box>

                {/* Checkmark */}
                <Box
                  sx={{
                    width: "18px",
                    height: "18px",
                    borderRadius: "50%",
                    flexShrink: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: isSelected ? "var(--accent)" : "transparent",
                    border: `1.5px solid ${isSelected ? "var(--accent)" : "var(--border2)"}`,
                    transition: "all 0.15s",
                  }}
                >
                  {isSelected && (
                    <svg width="8" height="7" viewBox="0 0 8 7" fill="none">
                      <path d="M1 3.5L3 5.5L7 1" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </Box>

                </Box>{/* fin zone colorée */}
              </Box>
            );
          })
        )}
      </Box>

      {/* Gradient fade */}
      <Box
        sx={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: "52px",
          background: "linear-gradient(to bottom, transparent, var(--s1))",
          pointerEvents: "none",
        }}
      />
      </Box>

    </Dialog>
  );
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

  return (
    <Box
      onClick={onClick}
      sx={{
        background: isUpdating ? "var(--accent-subtle)" : "var(--s1)",
        border: "1px solid var(--border)",
        borderRadius: "var(--r)",
        padding: "11px 12px",
        overflow: "hidden",
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
      {/* Row 1: type badge */}
      <Box sx={{ mb: "8px" }}>
        <Box
          component="span"
          sx={{
            display: "inline-flex",
            alignItems: "center",
            gap: "3px",
            fontSize: "10px",
            fontWeight: 600,
            color: "var(--text-secondary)",
            background: "rgba(148,163,184,0.08)",
            borderRadius: "4px",
            padding: "2px 7px 2px 5px",
          }}
        >
          {typeIcons[ticket.type]}
          {typeLabels[ticket.type]}
        </Box>
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
  const [filterOpen, setFilterOpen] = useState(false);
  const [filteredProjects, setFilteredProjects] = useState<string[]>([]);
  const wasDragging = useRef(false);

  const allProjects = useMemo(() => {
    const set = new Set<string>();
    for (const col of Object.values(columns)) {
      for (const t of col) {
        if (t.project) set.add(t.project);
      }
    }
    return Array.from(set).sort();
  }, [columns]);

  const activeFilterCount = filteredProjects.length;

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
    const filter = (tickets: KanbanTicket[]) => {
      let result = tickets;
      if (term)
        result = result.filter(
          (t) =>
            t.title.toLowerCase().includes(term) ||
            t.reference.toLowerCase().includes(term),
        );
      if (filteredProjects.length)
        result = result.filter((t) => filteredProjects.includes(t.project));
      return result;
    };
    return {
      new: filter(columns.new),
      in_progress: filter(columns.in_progress),
      testing: filter(columns.testing),
      resolved: filter(columns.resolved),
      closed: filter(columns.closed),
    };
  }, [columns, search, filteredProjects]);

  const hasFilters = !!search || activeFilterCount > 0;

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
        className="kanban-content"
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
            display: "flex",
            alignItems: "center",
            gap: "8px",
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

          {/* Filter button */}
          <Box
            component="button"
            onClick={() => setFilterOpen(true)}
            sx={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              height: "32px",
              px: "12px",
              borderRadius: "9px",
              border: `1px solid ${activeFilterCount > 0 ? "var(--accent-border)" : "var(--border)"}`,
              background:
                activeFilterCount > 0 ? "var(--accent-subtle)" : "var(--s1)",
              color:
                activeFilterCount > 0
                  ? "var(--accent)"
                  : "var(--text-secondary)",
              fontSize: "12.5px",
              fontWeight: activeFilterCount > 0 ? 600 : 500,
              cursor: "pointer",
              transition: "all 0.15s",
              outline: "none",
              flexShrink: 0,
              "&:hover": {
                borderColor:
                  activeFilterCount > 0
                    ? "var(--accent-border)"
                    : "var(--border2)",
                background:
                  activeFilterCount > 0 ? "var(--accent-subtle)" : "var(--s2)",
              },
            }}
          >
            <TuneOutlined sx={{ fontSize: "14px" }} />
            Filtres
            {activeFilterCount > 0 && (
              <Box
                component="span"
                sx={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: "16px",
                  height: "16px",
                  borderRadius: "50%",
                  background: "var(--accent)",
                  color: "#fff",
                  fontSize: "9px",
                  fontWeight: 700,
                  fontFamily: "var(--font-mono)",
                }}
              >
                {activeFilterCount}
              </Box>
            )}
          </Box>
        </Box>

        <ProjectPicker
          open={filterOpen}
          onClose={() => setFilterOpen(false)}
          allProjects={allProjects}
          selected={filteredProjects}
          onToggle={(p) => setFilteredProjects((prev) => toggleItem(prev, p))}
          onClear={() => setFilteredProjects([])}
        />

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
                            {colTickets.length}
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
                                  opacity: 0.2,
                                }}
                              >
                                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                  <path d="M3 9.5h18v9A2 2 0 0 1 19 20.5H5A2 2 0 0 1 3 18.5V9.5z" stroke="var(--muted2)" strokeWidth="1.5" strokeLinejoin="round"/>
                                  <path d="M3 9.5l2.5-6h13l2.5 6" stroke="var(--muted2)" strokeWidth="1.5" strokeLinejoin="round"/>
                                  <path d="M12 3.5v6" stroke="var(--muted2)" strokeWidth="1.5" strokeLinecap="round"/>
                                  <path d="M8 9.5c0 2.2 1.8 4 4 4s4-1.8 4-4" stroke="var(--muted2)" strokeWidth="1.5" strokeLinecap="round"/>
                                </svg>
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
