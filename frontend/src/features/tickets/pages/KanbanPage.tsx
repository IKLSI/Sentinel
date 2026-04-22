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
import Button from "@mui/material/Button";
import { useToast } from "../../../hooks/useToast";
import { getTickets, changeStatus } from "../api/tickets";
import { getProjects } from "../../techHealth/api/projects";
import { TicketStatus, TicketPriority, Ticket } from "../../../types";
import BugReportOutlined from "@mui/icons-material/BugReportOutlined";
import AutoFixHighOutlined from "@mui/icons-material/AutoFixHighOutlined";
import SecurityOutlined from "@mui/icons-material/SecurityOutlined";
import SpeedOutlined from "@mui/icons-material/SpeedOutlined";
import BuildOutlined from "@mui/icons-material/BuildOutlined";
import HelpOutlineOutlined from "@mui/icons-material/HelpOutlineOutlined";
import FolderOutlined from "@mui/icons-material/FolderOutlined";
import SearchOutlined from "@mui/icons-material/SearchOutlined";
import CommentOutlined from "@mui/icons-material/CommentOutlined";
import TuneOutlined from "@mui/icons-material/TuneOutlined";
import CheckOutlined from "@mui/icons-material/CheckOutlined";

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

interface ProjectInfo {
  name: string;
  ticketCount: number;
}

function projectInitials(name: string): string {
  const words = name.trim().split(/\s+/);
  if (words.length >= 2) return (words[0][0] + words[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

const avatarPalette = [
  "#7c3aed",
  "#059669",
  "#dc2626",
  "#b45309",
  "#0891b2",
  "#be185d",
  "#4f46e5",
  "#16a34a",
  "#9333ea",
  "#d97706",
];

function getAvatarColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++)
    hash = (hash * 31 + name.charCodeAt(i)) | 0;
  return avatarPalette[Math.abs(hash) % avatarPalette.length];
}

function ProjectPicker({
  open,
  onClose,
  allProjects,
  selected,
  onApply,
}: {
  open: boolean;
  onClose: () => void;
  allProjects: ProjectInfo[];
  selected: string[];
  onApply: (projects: string[]) => void;
}) {
  const [search, setSearch] = useState("");
  const [pending, setPending] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setPending(selected);
      setSearch("");
      setTimeout(() => inputRef.current?.focus(), 80);
    }
  }, [open]);

  const visible = allProjects.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()),
  );

  const toggle = (name: string) => setPending((prev) => toggleItem(prev, name));

  const selectAll = () => {
    const names = visible.map((p) => p.name);
    const allSel = names.every((n) => pending.includes(n));
    setPending((prev) =>
      allSel
        ? prev.filter((n) => !names.includes(n))
        : [...new Set([...prev, ...names])],
    );
  };

  const handleApply = () => {
    onApply(pending);
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      slotProps={{
        paper: {
          sx: {
            bgcolor: "var(--s1)",
            border: "1px solid",
            borderColor: "divider",
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
            maxHeight: "600px",
          },
        },
      }}
    >
      {/* ── Header ── */}
      <Box
        sx={{
          fontSize: "14px",
          fontWeight: 700,
          letterSpacing: "-0.02em",
          p: "16px 24px",
          borderBottom: "1px solid var(--border)",
          background:
            "linear-gradient(135deg, var(--accent-subtle) 0%, var(--s2) 60%)",
          flexShrink: 0,
          color: "var(--text)",
        }}
      >
        Filtrer par projet
      </Box>

      {/* ── Search ── */}
      <Box sx={{ px: "20px", pt: "16px", pb: "0", flexShrink: 0 }}>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            background: "var(--bg)",
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
            ref={inputRef}
            placeholder="Rechercher..."
            value={search}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setSearch(e.target.value)
            }
            onKeyDown={(e: React.KeyboardEvent) => {
              if (e.key === "Escape") onClose();
            }}
            aria-label="Rechercher un projet"
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

      {/* ── Group header ── */}
      <Box
        sx={{
          px: "20px",
          pt: "14px",
          pb: "6px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexShrink: 0,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <Box
            sx={{
              fontSize: "11px",
              fontWeight: 700,
              color: "var(--text)",
              letterSpacing: "0.04em",
              textTransform: "uppercase",
            }}
          >
            Projets
          </Box>
          <Box sx={{ fontSize: "11px", color: "var(--muted)" }}>
            {visible.length}
          </Box>
        </Box>
        <Box
          component="button"
          onClick={selectAll}
          sx={{
            border: "none",
            background: "transparent",
            color: "var(--accent)",
            fontSize: "12px",
            fontWeight: 600,
            cursor: "pointer",
            outline: "none",
            "&:hover": { textDecoration: "underline" },
          }}
        >
          Tout sélectionner
        </Box>
      </Box>

      {/* ── List ── */}
      <Box
        sx={{
          flex: 1,
          minHeight: 0,
          overflowY: "auto",
          px: "12px",
          pb: "8px",
          scrollbarWidth: "none",
          "&::-webkit-scrollbar": { display: "none" },
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
            <FolderOutlined
              sx={{ fontSize: "28px", color: "var(--muted2)", opacity: 0.4 }}
            />
            <Box
              sx={{ fontSize: "13px", color: "var(--muted)", fontWeight: 500 }}
            >
              Aucun résultat
            </Box>
          </Box>
        ) : (
          visible.map((project) => {
            const isSelected = pending.includes(project.name);
            const color = getAvatarColor(project.name);
            const initials = projectInitials(project.name);
            return (
              <Box
                key={project.name}
                onClick={() => toggle(project.name)}
                onMouseDown={(e) => e.preventDefault()}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: "11px",
                  px: "10px",
                  py: "9px",
                  borderRadius: "10px",
                  mb: "2px",
                  background: isSelected
                    ? "rgba(99,102,241,0.08)"
                    : "transparent",
                  cursor: "pointer",
                  userSelect: "none",
                  "&:hover": {
                    background: isSelected
                      ? "rgba(99,102,241,0.11)"
                      : "var(--s2)",
                  },
                  transition: "background 0.1s",
                }}
              >
                {/* Avatar */}
                <Box
                  sx={{
                    width: "36px",
                    height: "36px",
                    borderRadius: "9px",
                    background: color,
                    flexShrink: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "11px",
                    fontWeight: 700,
                    color: "#fff",
                    fontFamily: "var(--font-mono)",
                    letterSpacing: "0.04em",
                  }}
                >
                  {initials}
                </Box>

                {/* Info */}
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Box
                    sx={{
                      fontSize: "13px",
                      fontWeight: isSelected ? 600 : 500,
                      color: "var(--text)",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {project.name}
                  </Box>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: "5px",
                      mt: "2px",
                    }}
                  >
                    <Box sx={{ fontSize: "11.5px", color: "var(--muted2)" }}>
                      {project.ticketCount} ticket
                      {project.ticketCount !== 1 ? "s" : ""}
                    </Box>
                  </Box>
                </Box>

                {/* Checkbox */}
                <Box
                  sx={{
                    width: "16px",
                    height: "16px",
                    borderRadius: "4px",
                    flexShrink: 0,
                    border: isSelected ? "none" : "1.5px solid var(--border2)",
                    background: isSelected ? "var(--accent)" : "transparent",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    transition: "all 0.15s",
                  }}
                >
                  {isSelected && (
                    <CheckOutlined sx={{ fontSize: "11px", color: "#fff" }} />
                  )}
                </Box>
              </Box>
            );
          })
        )}
      </Box>

      {/* ── Footer ── */}
      <Box
        sx={{
          p: "14px 20px",
          borderTop: "1px solid var(--border)",
          background: "var(--s2)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexShrink: 0,
          gap: "8px",
        }}
      >
        <Box
          sx={{ fontSize: "12.5px", color: "var(--muted2)", fontWeight: 500 }}
        >
          {pending.length} projet{pending.length !== 1 ? "s" : ""} sélectionné
          {pending.length !== 1 ? "s" : ""}
        </Box>
        <Box sx={{ display: "flex", gap: "8px" }}>
          <Button
            variant="outlined"
            size="small"
            className="btn-cancel"
            sx={{ textTransform: "none" }}
            onClick={() => setPending([])}
          >
            Réinitialiser
          </Button>
          <Button
            variant="contained"
            size="small"
            sx={{ textTransform: "none" }}
            onClick={handleApply}
          >
            Appliquer les filtres
          </Button>
        </Box>
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
        transition:
          "opacity 0.15s, box-shadow 0.15s, border-color 0.15s, transform 0.12s",
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
          <FolderOutlined
            sx={{ fontSize: 10, color: "var(--muted2)", flexShrink: 0 }}
          />
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
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: "5px",
            flex: 1,
            minWidth: 0,
          }}
        >
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
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: "7px",
            flexShrink: 0,
          }}
        >
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
        <Box
          sx={{
            width: 52,
            height: 16,
            borderRadius: 4,
            background: "var(--s2)",
          }}
        />
      </Box>
      <Box
        sx={{ height: 12, borderRadius: 4, background: "var(--s2)", mb: "6px" }}
      />
      <Box
        sx={{
          height: 12,
          borderRadius: 4,
          background: "var(--s2)",
          width: "70%",
          mb: "9px",
        }}
      />
      <Box sx={{ display: "flex", gap: "6px" }}>
        <Box
          sx={{
            width: 6,
            height: 6,
            borderRadius: "50%",
            background: "var(--s2)",
          }}
        />
        <Box
          sx={{
            width: 48,
            height: 10,
            borderRadius: 4,
            background: "var(--s2)",
          }}
        />
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

  const [allProjectNames, setAllProjectNames] = useState<string[]>([]);

  useEffect(() => {
    getProjects()
      .then((projects) =>
        setAllProjectNames([...new Set(projects.map((p) => p.name))].sort()),
      )
      .catch(() => {});
  }, []);

  const allProjects = useMemo<ProjectInfo[]>(() => {
    const counts: Record<string, number> = {};
    for (const colId of columnOrder) {
      for (const ticket of columns[colId]) {
        counts[ticket.project] = (counts[ticket.project] ?? 0) + 1;
      }
    }
    return allProjectNames.map((name) => ({
      name,
      ticketCount: counts[name] ?? 0,
    }));
  }, [allProjectNames, columns]);

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
          onApply={setFilteredProjects}
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
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: "7px",
                        }}
                      >
                        <Box
                          sx={{
                            width: 7,
                            height: 7,
                            borderRadius: "50%",
                            background: meta.color,
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
                        sx={{
                          width: 22,
                          height: 20,
                          borderRadius: 99,
                          background: "var(--s2)",
                        }}
                      />
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
                              transition:
                                "background 0.15s, border-color 0.15s",
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
                                <svg
                                  width="28"
                                  height="28"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  xmlns="http://www.w3.org/2000/svg"
                                >
                                  <path
                                    d="M3 9.5h18v9A2 2 0 0 1 19 20.5H5A2 2 0 0 1 3 18.5V9.5z"
                                    stroke="var(--muted2)"
                                    strokeWidth="1.5"
                                    strokeLinejoin="round"
                                  />
                                  <path
                                    d="M3 9.5l2.5-6h13l2.5 6"
                                    stroke="var(--muted2)"
                                    strokeWidth="1.5"
                                    strokeLinejoin="round"
                                  />
                                  <path
                                    d="M12 3.5v6"
                                    stroke="var(--muted2)"
                                    strokeWidth="1.5"
                                    strokeLinecap="round"
                                  />
                                  <path
                                    d="M8 9.5c0 2.2 1.8 4 4 4s4-1.8 4-4"
                                    stroke="var(--muted2)"
                                    strokeWidth="1.5"
                                    strokeLinecap="round"
                                  />
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
