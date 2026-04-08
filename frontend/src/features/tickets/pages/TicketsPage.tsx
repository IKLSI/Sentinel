import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { StatusChip } from "../../../components/StatusChip";
import { SlaTimer } from "../../../components/SlaTimer";
import { DurationPicker } from "../../../components/DurationPicker";
import CircularProgress from "@mui/material/CircularProgress";
import Button from "@mui/material/Button";
import Box from "@mui/material/Box";
import Tooltip from "@mui/material/Tooltip";
import AddOutlined from "@mui/icons-material/AddOutlined";
import { AppModal } from "../../../components/AppModal";
import { DeleteModal } from "../../../components/DeleteModal";
import ConfirmationNumberOutlined from "@mui/icons-material/ConfirmationNumberOutlined";
import SearchOutlined from "@mui/icons-material/SearchOutlined";
import TuneOutlined from "@mui/icons-material/TuneOutlined";
import EditOutlined from "@mui/icons-material/EditOutlined";
import DeleteOutlineOutlined from "@mui/icons-material/DeleteOutlineOutlined";
import BugReportOutlined from "@mui/icons-material/BugReportOutlined";
import AutoFixHighOutlined from "@mui/icons-material/AutoFixHighOutlined";
import SecurityOutlined from "@mui/icons-material/SecurityOutlined";
import SpeedOutlined from "@mui/icons-material/SpeedOutlined";
import BuildOutlined from "@mui/icons-material/BuildOutlined";
import HelpOutlineOutlined from "@mui/icons-material/HelpOutlineOutlined";
import { useTickets } from "../hooks/useTickets";
import { deleteTicket, createTicket, updateTicket } from "../api/tickets";
import { getProjects, ProjectDto } from "../../techHealth/api/projects";
import { getUsers } from "../../users/api/users";
import {
  Ticket,
  TicketPriority,
  TicketStatus,
  TicketType,
  User,
} from "../../../types";

interface CreateTicketPayload {
  title: string
  description: string
  priority: 'Critical' | 'High' | 'Medium' | 'Low'
  type: 'Bug' | 'Feature' | 'Security' | 'Performance' | 'Maintenance' | 'Question'
  techProjectId?: string
  assignedToId?: string
  estimatedHours?: number
}

function getPageNumbers(page: number, totalPages: number): (number | "...")[] {
  if (totalPages <= 3) return Array.from({ length: totalPages }, (_, i) => i + 1)
  const pages: (number | "...")[] = [1, 2]
  if (page > 3) pages.push("...")
  if (page > 2 && page < totalPages) pages.push(page)
  if (page < totalPages - 1) pages.push("...")
  if (!pages.includes(totalPages)) pages.push(totalPages)
  return pages
}

const navBtnSx = (disabled: boolean) => ({
  all: "unset" as const,
  cursor: disabled ? "default" : "pointer",
  display: "flex", alignItems: "center", justifyContent: "center",
  gap: "6px",
  height: "32px", px: "12px",
  borderRadius: "8px",
  fontSize: "12px", fontWeight: 600,
  color: disabled ? "var(--muted)" : "var(--text-secondary)",
  background: "var(--s2)",
  border: "1px solid var(--border)",
  opacity: disabled ? 0.4 : 1,
  pointerEvents: disabled ? "none" : "auto",
  transition: "background 0.12s, border-color 0.12s, color 0.12s",
  ...(!disabled && { "&:hover": { background: "var(--s3)", borderColor: "var(--border2)", color: "var(--text)" } }),
})

const pageBtnSx = (active: boolean) => ({
  all: "unset" as const,
  cursor: active ? "default" : "pointer",
  minWidth: "32px", height: "32px",
  display: "flex", alignItems: "center", justifyContent: "center",
  borderRadius: "8px",
  fontSize: "12px", fontWeight: active ? 700 : 500,
  color: active ? "#fff" : "var(--text-secondary)",
  background: active ? "var(--accent)" : "transparent",
  boxShadow: active ? "0 2px 8px rgba(99,102,241,0.35)" : "none",
  transition: "background 0.12s, color 0.12s, box-shadow 0.12s",
  ...(!active && { "&:hover": { background: "var(--s2)", color: "var(--text)" } }),
})

const Pagination: React.FC<{
  page: number
  totalPages: number
  total: number
  onChange: (p: number) => void
}> = ({ page, totalPages, total, onChange }) => {
  const pages = getPageNumbers(page, totalPages)
  return (
    <Box sx={{
      display: "flex", alignItems: "center", justifyContent: "space-between",
      px: "16px", py: "10px",
      borderTop: "1px solid var(--border)",
      flexShrink: 0,
      background: "var(--s2)",
    }}>
      <Box sx={{ fontSize: "11px", color: "var(--muted)", fontFamily: "var(--font-mono)", letterSpacing: "0.04em" }}>
        {total} ticket{total > 1 ? "s" : ""}
      </Box>

      <Box sx={{ display: "flex", alignItems: "center", gap: "6px" }}>
        <Box component="button" sx={navBtnSx(page === 1)} onClick={() => onChange(page - 1)}>
          ← Précédent
        </Box>

        <Box sx={{ display: "flex", alignItems: "center", gap: "2px", mx: "4px" }}>
          {pages.map((p, i) =>
            p === "..." ? (
              <Box key={`e-${i}`} sx={{ minWidth: "28px", textAlign: "center", fontSize: "13px", color: "var(--muted)", pb: "2px" }}>
                ···
              </Box>
            ) : (
              <Box key={p} component="button" sx={pageBtnSx(p === page)} onClick={() => p !== page && onChange(p as number)}>
                {p}
              </Box>
            )
          )}
        </Box>

        <Box component="button" sx={navBtnSx(page === totalPages)} onClick={() => onChange(page + 1)}>
          Suivant →
        </Box>
      </Box>
    </Box>
  )
}


const priorityLabels: Record<TicketPriority, string> = {
  critical: "Critique",
  high: "Haute",
  medium: "Moyenne",
  low: "Basse",
};

const statusVariant: Record<TicketStatus, "blue" | "orange" | "purple" | "green" | "gray" | "cyan"> = {
  new:         "blue",
  in_progress: "orange",
  testing:     "cyan",
  resolved:    "green",
  closed:      "gray",
};

const statusLabels: Record<TicketStatus, string> = {
  new: "Nouveau",
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

const typeIcons: Record<TicketType, React.ReactElement> = {
  bug:         <BugReportOutlined sx={{ fontSize: 10 }} />,
  feature:     <AutoFixHighOutlined sx={{ fontSize: 10 }} />,
  security:    <SecurityOutlined sx={{ fontSize: 10 }} />,
  performance: <SpeedOutlined sx={{ fontSize: 10 }} />,
  maintenance: <BuildOutlined sx={{ fontSize: 10 }} />,
  question:    <HelpOutlineOutlined sx={{ fontSize: 10 }} />,
};

const priorityLevels: Record<string, number> = {
  critical: 4,
  high:     3,
  medium:   2,
  low:      1,
};

const LevelBars: React.FC<{ level: number }> = ({ level }) => (
  <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: '1.5px', height: '10px', flexShrink: 0 }}>
    {[1, 2, 3, 4].map(i => (
      <Box key={i} sx={{ width: '3px', height: `${4 + i * 1.5}px`, borderRadius: '1px', background: 'currentColor', opacity: i <= level ? 1 : 0.2 }} />
    ))}
  </Box>
);

const selectSx = {
  appearance: "none",
  WebkitAppearance: "none",
  background: "var(--s1)",
  backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%236b7280' d='M6 8L1 3h10z'/%3E%3C/svg%3E\")",
  backgroundRepeat: "no-repeat",
  backgroundPosition: "right 12px center",
  border: "1px solid var(--border)",
  borderRadius: "var(--r)",
  px: "12px",
  py: "7px",
  pr: "36px",
  fontSize: "13px",
  color: "var(--text)",
  width: "auto",
  outline: "none",
  fontFamily: "inherit",
};

export const TicketsPage: React.FC = () => {
  const navigate = useNavigate();
  const { tickets, loading, fetchTickets } = useTickets();
  const [displayTickets, setDisplayTickets] = useState<Ticket[]>([]);
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState({ priority: "", status: "", type: "" });
  const [page, setPage] = useState(1);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; reference: string } | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState<CreateTicketPayload>({ title: '', description: '', priority: 'Medium', type: 'Bug' });
  const [createSubmitting, setCreateSubmitting] = useState(false);
  const [createEstMinutes, setCreateEstMinutes] = useState(0);
  const [modalProjects, setModalProjects] = useState<ProjectDto[]>([]);
  const [modalUsers, setModalUsers] = useState<User[]>([]);
  const [editTarget, setEditTarget] = useState<Ticket | null>(null);
  const [editForm, setEditForm] = useState({ title: '', description: '', priority: 'medium', type: 'bug', techProjectId: '', assignedToId: '', estimatedMinutes: 0 });
  const [editSaving, setEditSaving] = useState(false);

  const openCreateModal = () => {
    setCreateForm({ title: '', description: '', priority: 'Medium', type: 'Bug' });
    setCreateEstMinutes(0);
    setShowCreateModal(true);
    Promise.all([
      getProjects().catch(() => [] as ProjectDto[]),
      getUsers().catch(() => ({ items: [] as User[] })),
    ]).then(([p, u]) => { setModalProjects(p); setModalUsers(u.items); });
  };

  const handleCreate = async () => {
    if (!createForm.title.trim()) return;
    setCreateSubmitting(true);
    try {
      const payload: CreateTicketPayload = { ...createForm };
      if (!payload.techProjectId) delete payload.techProjectId;
      if (!payload.assignedToId) delete payload.assignedToId;
      if (createEstMinutes > 0) payload.estimatedHours = createEstMinutes / 60;
      const created = await createTicket(payload as unknown as Partial<Ticket>);
      setShowCreateModal(false);
      navigate(`/tickets/${created.id}`);
    } catch {
      /* ignore */
    } finally {
      setCreateSubmitting(false);
    }
  };

  const openEditModal = (ticket: Ticket) => {
    setEditForm({
      title: ticket.title,
      description: ticket.description ?? '',
      priority: ticket.priority,
      type: ticket.type,
      techProjectId: ticket.projectId ?? '',
      assignedToId: ticket.assignee?.id ?? '',
      estimatedMinutes: ticket.estimatedHours != null ? Math.round(ticket.estimatedHours * 60) : 0,
    });
    setEditTarget(ticket);
    Promise.all([
      getProjects().catch(() => [] as ProjectDto[]),
      getUsers().catch(() => ({ items: [] as User[] })),
    ]).then(([p, u]) => { setModalProjects(p); setModalUsers(u.items); });
  };

  const handleEdit = async () => {
    if (!editTarget) return;
    setEditSaving(true);
    try {
      const payload: Record<string, unknown> = {
        title: editForm.title, description: editForm.description,
        priority: editForm.priority, type: editForm.type,
      };
      if (editForm.techProjectId) payload.techProjectId = editForm.techProjectId;
      if (editForm.assignedToId) payload.assignedToId = editForm.assignedToId;
      if (editForm.estimatedMinutes > 0) payload.estimatedHours = editForm.estimatedMinutes / 60;
      const updated = await updateTicket(editTarget.id, payload as Partial<Ticket>);
      setDisplayTickets((prev) => prev.map((t) => t.id === updated.id ? updated : t));
      setEditTarget(null);
    } catch {
      /* ignore */
    } finally {
      setEditSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteTicket(deleteTarget.id);
      setDisplayTickets((prev) => prev.filter((t) => t.id !== deleteTarget.id));
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
  };
  const filtersRef = useRef<HTMLDivElement>(null);
  const tableWrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!filtersOpen) return;
    const handler = (e: MouseEvent) => {
      if (filtersRef.current && !filtersRef.current.contains(e.target as Node)) setFiltersOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [filtersOpen]);

  const pageSize = 20;

  const [sort, setSort] = useState<{ col: string; dir: "asc" | "desc" } | null>({ col: "Priorité", dir: "asc" });

  const toggleSort = (col: string) => {
    setSort((s) => {
      if (s?.col !== col) return { col, dir: "asc" };
      if (s.dir === "asc") return { col, dir: "desc" };
      return null;
    });
  };

  useEffect(() => {
    fetchTickets({ page, pageSize }).catch(() => {});
  }, [page, pageSize]);

  useEffect(() => {
    if (tickets?.items !== undefined) {
      setDisplayTickets(tickets.items);
    }
  }, [tickets]);

  const PRIORITY_ORDER = { critical: 0, high: 1, medium: 2, low: 3 };
  const STATUS_ORDER   = { new: 0, in_progress: 1, testing: 2, resolved: 3, closed: 4 };

  const q = search.toLowerCase();
  const filtered = displayTickets
    .filter((t) => {
      if (filters.priority && t.priority !== filters.priority) return false;
      if (filters.status && t.status !== filters.status) return false;
      if (filters.type && t.type !== filters.type) return false;
      if (q && !t.title.toLowerCase().includes(q) && !t.reference.toLowerCase().includes(q) && !(t.projectName ?? "").toLowerCase().includes(q)) return false;
      return true;
    })
    .sort((a, b) => {
      if (!sort) return 0;
      const mul = sort.dir === "asc" ? 1 : -1;
      switch (sort.col) {
        case "Référence": return mul * a.reference.localeCompare(b.reference);
        case "Titre":     return mul * a.title.localeCompare(b.title);
        case "Projet":    return mul * (a.projectName ?? "").localeCompare(b.projectName ?? "");
        case "Priorité":  return mul * ((PRIORITY_ORDER[a.priority] ?? 9) - (PRIORITY_ORDER[b.priority] ?? 9));
        case "Type":      return mul * a.type.localeCompare(b.type);
        case "Statut":    return mul * ((STATUS_ORDER[a.status] ?? 9) - (STATUS_ORDER[b.status] ?? 9));
        case "Assigné":   return mul * (`${a.assignee?.firstName ?? ""}${a.assignee?.lastName ?? ""}`).localeCompare(`${b.assignee?.firstName ?? ""}${b.assignee?.lastName ?? ""}`);
        case "Échéance":  return mul * ((a.slaDeadline ?? "").localeCompare(b.slaDeadline ?? ""));
        default: return 0;
      }
    });

  return (
    <>

      <Box className="page-enter" sx={{ p: "36px 28px 24px", height: "100vh", display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: "10px", mb: "16px", flexShrink: 0, position: "relative", zIndex: 2 }}>
          <Box sx={{
            width: "280px", display: "flex", alignItems: "center", gap: "8px",
            background: "var(--s1)", border: "1px solid var(--border)",
            borderRadius: "9px", px: "10px", height: "32px",
            transition: "border-color 0.15s, box-shadow 0.15s",
            "&:focus-within": { borderColor: "var(--accent-border)", boxShadow: "0 0 0 3px rgba(99,102,241,0.08)" },
          }}>
            <SearchOutlined sx={{ color: "var(--muted)", fontSize: "14px", flexShrink: 0 }} />
            <Box
              component="input"
              placeholder="Rechercher..."
              value={search}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
              sx={{
                all: "unset", flex: 1, fontSize: "12.5px",
                color: "var(--text)",
                "&::placeholder": { color: "var(--muted)" },
                "&:focus": { outline: "none", boxShadow: "none !important" },
              }}
            />
          </Box>

          <Box ref={filtersRef} sx={{ position: "relative" }}>
            {(filters.priority || filters.status || filters.type) && (
              <Box sx={{
                position: "absolute", top: -5, right: -5,
                width: 8, height: 8, borderRadius: "50%",
                background: "var(--accent)", zIndex: 1,
                border: "2px solid var(--bg)",
              }} />
            )}
            <Box
              component="button"
              onClick={() => setFiltersOpen((v) => !v)}
              sx={{
                all: "unset", cursor: "pointer",
                display: "flex", alignItems: "center", gap: "7px",
                px: "14px", height: "32px",
                background: filtersOpen ? "var(--accent-subtle)" : "var(--s1)",
                border: `1px solid ${filtersOpen ? "var(--accent-border)" : "var(--border)"}`,
                borderRadius: "9px", fontSize: "13px", fontWeight: 500,
                color: filtersOpen ? "var(--accent)" : "var(--text-secondary)",
                transition: "all 0.12s",
                "&:hover": { background: "var(--s2)", borderColor: "var(--border2)" },
              }}
            >
              <TuneOutlined sx={{ fontSize: 15 }} />
              Filtres
            </Box>

            {filtersOpen && (
              <Box sx={{ position: "absolute", top: "calc(100% + 8px)", left: "50%", transform: "translateX(-50%)", zIndex: 50 }}>
                <Box sx={{ position: "absolute", top: -6, left: "calc(50% - 6px)", width: 0, height: 0, borderLeft: "6px solid transparent", borderRight: "6px solid transparent", borderBottom: "6px solid var(--border)" }} />
                <Box sx={{ position: "absolute", top: -5, left: "calc(50% - 5px)", width: 0, height: 0, borderLeft: "5px solid transparent", borderRight: "5px solid transparent", borderBottom: "5px solid var(--s1)" }} />
                <Box sx={{
                  background: "var(--s1)", border: "1px solid var(--border)",
                  borderRadius: "12px", p: "16px",
                  boxShadow: "0 8px 32px rgba(0,0,0,0.18)",
                  minWidth: "220px",
                  display: "flex", flexDirection: "column", gap: "10px",
                  animation: "fadeInUp 0.12s ease forwards",
                }}>
                  {[
                    { label: "Priorité", key: "priority", value: filters.priority, options: [["", "Toutes"], ["critical", "Critique"], ["high", "Haute"], ["medium", "Moyenne"], ["low", "Basse"]] },
                    { label: "Statut",   key: "status",   value: filters.status,   options: [["", "Tous"], ["new", "Nouveau"], ["in_progress", "En cours"], ["testing", "En test"], ["resolved", "Résolu"], ["closed", "Fermé"]] },
                    { label: "Type",     key: "type",     value: filters.type,     options: [["", "Tous"], ["bug", "Bug"], ["feature", "Évolution"], ["security", "Sécurité"], ["performance", "Perf"]] },
                  ].map(({ label, key, value, options }) => (
                    <Box key={key}>
                      <Box sx={{ fontSize: "10px", fontWeight: 600, color: "var(--muted)", letterSpacing: "0.1em", textTransform: "uppercase", mb: "5px" }}>
                        {label}
                      </Box>
                      <Box component="select" value={value}
                        onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFilters((f) => ({ ...f, [key]: e.target.value }))}
                        sx={{ ...selectSx, width: "100%", boxSizing: "border-box" }}
                      >
                        {options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                      </Box>
                    </Box>
                  ))}

                  {(filters.priority || filters.status || filters.type) && (
                    <Box
                      component="button"
                      onClick={() => { setFilters({ priority: "", status: "", type: "" }); setFiltersOpen(false); }}
                      sx={{
                        all: "unset", cursor: "pointer",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        gap: "6px", mt: "4px",
                        fontSize: "12px", fontWeight: 600,
                        color: "var(--red)",
                        background: "var(--red-subtle)",
                        border: "1px solid rgba(239,68,68,0.2)",
                        borderRadius: "7px",
                        py: "8px",
                        transition: "background 0.12s, border-color 0.12s",
                        "&:hover": { background: "rgba(239,68,68,0.14)", borderColor: "rgba(239,68,68,0.35)" },
                      }}
                    >
                      Réinitialiser
                    </Box>
                  )}
                </Box>
              </Box>
            )}
          </Box>

          <Box sx={{ flex: 1 }} />

          <Button
            variant="contained"
            size="small"
            sx={{ display: "flex", alignItems: "center", gap: "6px", flexShrink: 0 }}
            onClick={openCreateModal}
          >
            <AddOutlined sx={{ fontSize: 14 }} />
            Nouveau ticket
          </Button>
        </Box>

        {loading && displayTickets.length === 0 ? (
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              padding: "40px",
            }}
          >
            <CircularProgress />
          </Box>
        ) : (
          <Box
            sx={{
              background: "var(--s1)",
              border: "1px solid var(--border)",
              borderRadius: "var(--r)",
              overflow: "hidden",
              flex: 1,
              display: "flex",
              flexDirection: "column",
              opacity: loading ? 0.6 : 1,
              transition: "opacity 0.15s",
            }}
          >
            {filtered.length === 0 ? (
              <Box sx={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Box className="empty-state">
                  <Box className="empty-state-icon">
                    <ConfirmationNumberOutlined sx={{ fontSize: 40 }} />
                  </Box>
                  <Box className="empty-state-title">Aucun ticket trouvé</Box>
                  <Box className="empty-state-subtitle">
                    {displayTickets.length === 0
                      ? "Créez votre premier ticket"
                      : "Modifiez vos filtres"}
                  </Box>
                </Box>
              </Box>
            ) : (
              <>
              <Box component="table" sx={{ width: "100%", borderCollapse: "collapse", tableLayout: "fixed", flexShrink: 0 }}>
                <Box component="colgroup">
                  {(["9%","23%","13%","9%","9%","10%","10%","10%","7%"] as const).map((w, i) => (
                    <Box key={i} component="col" sx={{ width: w }} />
                  ))}
                </Box>
                <Box component="thead">
                  <Box component="tr">
                    {["Référence", "Titre", "Projet", "Priorité", "Type", "Statut", "Échéance", "Assigné", ""].map((h) => {
                        const sortable = h !== "";
                        const isActive = sort?.col === h;
                        return (
                          <Box
                            component="th"
                            key={h}
                            onClick={() => sortable && toggleSort(h)}
                            sx={{
                              fontFamily: "var(--font-mono)",
                              fontSize: "10px",
                              fontWeight: 700,
                              letterSpacing: "0.08em",
                              textTransform: "uppercase",
                              color: isActive ? "var(--accent)" : "var(--muted)",
                              textAlign: "left",
                              padding: "10px 14px",
                              borderBottom: "1px solid var(--border)",
                              background: "var(--s2)",
                              whiteSpace: "nowrap",
                              cursor: sortable ? "pointer" : "default",
                              userSelect: "none",
                              transition: "color 0.12s",
                              "&:hover": sortable ? { color: "var(--text-secondary)" } : {},
                            }}
                          >
                            <Box sx={{ display: "flex", alignItems: "center", gap: "5px" }}>
                              {h}
                              {sortable && isActive && (
                                <Box sx={{ fontSize: "12px", color: "var(--accent)", lineHeight: 1, display: "flex", alignItems: "center" }}>
                                  {sort?.dir === "asc" ? "↑" : "↓"}
                                </Box>
                              )}
                            </Box>
                          </Box>
                        );
                      })}
                    </Box>
                  </Box>
                </Box>
              <Box ref={tableWrapRef} sx={{ flex: 1, overflowY: "auto" }}>
                <Box component="table" sx={{ width: "100%", borderCollapse: "collapse", tableLayout: "fixed" }}>
                  <Box component="colgroup">
                    {(["9%","23%","13%","9%","9%","10%","10%","10%","7%"] as const).map((w, i) => (
                      <Box key={i} component="col" sx={{ width: w }} />
                    ))}
                  </Box>
                  <Box component="tbody">
                    {filtered.map((ticket) => (
                      <Box
                        component="tr"
                        key={ticket.id}
                        onClick={() => navigate(`/tickets/${ticket.id}`)}
                        sx={{
                          cursor: "pointer",
                          "&:hover td": { background: "var(--s2)" },
                        }}
                      >
                        <Box
                          component="td"
                          sx={{
                            padding: "10px 14px",
                            borderBottom: "1px solid var(--border)",
                            fontFamily: "var(--font-mono)",
                            fontSize: "11px",
                            color: "var(--muted)",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {ticket.reference}
                        </Box>
                        <Box
                          component="td"
                          sx={{
                            padding: "10px 14px",
                            borderBottom: "1px solid var(--border)",
                            fontSize: "12.5px",
                            maxWidth: "300px",
                          }}
                        >
                          <Box
                            sx={{
                              whiteSpace: "nowrap",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                            }}
                          >
                            {ticket.title}
                          </Box>
                        </Box>
                        <Box
                          component="td"
                          sx={{
                            padding: "10px 14px",
                            borderBottom: "1px solid var(--border)",
                            fontSize: "12px",
                            color: "var(--muted2)",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {ticket.projectName ?? "—"}
                        </Box>
                        <Box
                          component="td"
                          sx={{
                            padding: "10px 14px",
                            borderBottom: "1px solid var(--border)",
                          }}
                        >
                          <StatusChip
                            startAdornment={<LevelBars level={priorityLevels[ticket.priority] ?? 1} />}
                          >
                            {priorityLabels[ticket.priority]}
                          </StatusChip>
                        </Box>
                        <Box
                          component="td"
                          sx={{
                            padding: "10px 14px",
                            borderBottom: "1px solid var(--border)",
                          }}
                        >
                          <StatusChip startAdornment={typeIcons[ticket.type]}>
                            {typeLabels[ticket.type]}
                          </StatusChip>
                        </Box>
                        <Box
                          component="td"
                          sx={{
                            padding: "10px 14px",
                            borderBottom: "1px solid var(--border)",
                          }}
                        >
                          <StatusChip variant={statusVariant[ticket.status]} pill>
                            {statusLabels[ticket.status]}
                          </StatusChip>
                        </Box>
                        <Box
                          component="td"
                          sx={{
                            padding: "10px 14px",
                            borderBottom: "1px solid var(--border)",
                          }}
                        >
                          <SlaTimer
                            deadline={ticket.slaDeadline}
                            breached={ticket.slaBreached}
                            compact
                          />
                        </Box>
                        <Box
                          component="td"
                          sx={{
                            padding: "10px 14px",
                            borderBottom: "1px solid var(--border)",
                            fontSize: "12px",
                            color: "var(--muted2)",
                          }}
                        >
                          {ticket.assignee
                            ? `${ticket.assignee.firstName} ${ticket.assignee.lastName}`
                            : "—"}
                        </Box>
                        <Box
                          component="td"
                          onClick={(e: React.MouseEvent) => e.stopPropagation()}
                          sx={{ padding: "6px 10px", borderBottom: "1px solid var(--border)", whiteSpace: "nowrap" }}
                        >
                          <Box sx={{ display: "flex", alignItems: "center", gap: "4px" }}>
                            <Box
                              component="button"
                              onClick={(e: React.MouseEvent) => { e.stopPropagation(); openEditModal(ticket); }}
                              title="Modifier"
                              sx={{
                                all: "unset", cursor: "pointer",
                                width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center",
                                borderRadius: "6px", color: "var(--muted)",
                                transition: "background 0.12s, color 0.12s",
                                "&:hover": { background: "var(--accent-subtle)", color: "var(--accent)" },
                              }}
                            >
                              <EditOutlined sx={{ fontSize: 14 }} />
                            </Box>
                            <Box
                              component="button"
                              onClick={(e: React.MouseEvent) => { e.stopPropagation(); setDeleteTarget({ id: ticket.id, reference: ticket.reference }); }}
                              title="Supprimer"
                              sx={{
                                all: "unset", cursor: "pointer",
                                width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center",
                                borderRadius: "6px", color: "var(--muted)",
                                transition: "background 0.12s, color 0.12s",
                                "&:hover": { background: "var(--red-subtle)", color: "var(--red)" },
                              }}
                            >
                              <DeleteOutlineOutlined sx={{ fontSize: 14 }} />
                            </Box>
                          </Box>
                        </Box>
                      </Box>
                    ))}
                  </Box>
                </Box>
              </Box>
              </>
            )}

            <Pagination
              page={page}
              totalPages={tickets?.totalPages ?? 1}
              total={tickets?.total ?? filtered.length}
              onChange={setPage}
            />
          </Box>
        )}
      </Box>

      <AppModal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Nouveau ticket"
        actions={
          <>
            <Button variant="outlined" size="small" sx={{ textTransform: "none" }} onClick={() => setShowCreateModal(false)}>Annuler</Button>
            <Button variant="contained" size="small" sx={{ textTransform: "none" }} onClick={handleCreate} disabled={!createForm.title.trim() || createSubmitting}>
              {createSubmitting ? <CircularProgress size={14} sx={{ color: "#fff" }} /> : "Créer le ticket"}
            </Button>
          </>
        }
      >
        <Box sx={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          <Box>
            <Box component="label" sx={{ display: "block", fontSize: "11px", fontWeight: 600, mb: "5px", color: "var(--muted2)", letterSpacing: "0.04em" }}>Titre <Box component="span" sx={{ color: "var(--red)" }}>*</Box></Box>
            <Box component="input" autoFocus type="text" placeholder="Description courte du problème" value={createForm.title}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCreateForm((f) => ({ ...f, title: e.target.value }))}
              sx={{ background: "var(--s1)", border: "1px solid var(--border)", borderRadius: "var(--r)", px: "12px", py: "8px", fontSize: "13px", color: "var(--text)", width: "100%", outline: "none", fontFamily: "inherit" }}
            />
          </Box>
          <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
            <Box>
              <Box component="label" sx={{ display: "block", fontSize: "11px", fontWeight: 600, mb: "5px", color: "var(--muted2)", letterSpacing: "0.04em" }}>Priorité</Box>
              <Box component="select" value={createForm.priority}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setCreateForm((f) => ({ ...f, priority: e.target.value as CreateTicketPayload['priority'] }))}
                sx={{ appearance: "none", WebkitAppearance: "none", background: "var(--s1)", backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%236b7280' d='M6 8L1 3h10z'/%3E%3C/svg%3E\")", backgroundRepeat: "no-repeat", backgroundPosition: "right 12px center", border: "1px solid var(--border)", borderRadius: "var(--r)", px: "12px", py: "7px", pr: "36px", fontSize: "13px", color: "var(--text)", width: "100%", outline: "none", fontFamily: "inherit" }}
              >
                <option value="Critical">Critique</option>
                <option value="High">Haute</option>
                <option value="Medium">Moyenne</option>
                <option value="Low">Basse</option>
              </Box>
            </Box>
            <Box>
              <Box component="label" sx={{ display: "block", fontSize: "11px", fontWeight: 600, mb: "5px", color: "var(--muted2)", letterSpacing: "0.04em" }}>Type</Box>
              <Box component="select" value={createForm.type}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setCreateForm((f) => ({ ...f, type: e.target.value as CreateTicketPayload['type'] }))}
                sx={{ appearance: "none", WebkitAppearance: "none", background: "var(--s1)", backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%236b7280' d='M6 8L1 3h10z'/%3E%3C/svg%3E\")", backgroundRepeat: "no-repeat", backgroundPosition: "right 12px center", border: "1px solid var(--border)", borderRadius: "var(--r)", px: "12px", py: "7px", pr: "36px", fontSize: "13px", color: "var(--text)", width: "100%", outline: "none", fontFamily: "inherit" }}
              >
                <option value="Bug">Bug</option>
                <option value="Feature">Évolution</option>
                <option value="Security">Sécurité</option>
                <option value="Performance">Performance</option>
                <option value="Maintenance">Maintenance</option>
                <option value="Question">Question</option>
              </Box>
            </Box>
          </Box>
          <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
            <Box>
              <Box component="label" sx={{ display: "block", fontSize: "11px", fontWeight: 600, mb: "5px", color: "var(--muted2)", letterSpacing: "0.04em" }}>Projet</Box>
              <Box component="select" value={createForm.techProjectId ?? ''}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setCreateForm((f) => ({ ...f, techProjectId: e.target.value || undefined }))}
                sx={{ appearance: "none", WebkitAppearance: "none", background: "var(--s1)", backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%236b7280' d='M6 8L1 3h10z'/%3E%3C/svg%3E\")", backgroundRepeat: "no-repeat", backgroundPosition: "right 12px center", border: "1px solid var(--border)", borderRadius: "var(--r)", px: "12px", py: "7px", pr: "36px", fontSize: "13px", color: "var(--text)", width: "100%", outline: "none", fontFamily: "inherit" }}
              >
                <option value="">Aucun projet</option>
                {modalProjects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </Box>
            </Box>
            <Box>
              <Box component="label" sx={{ display: "block", fontSize: "11px", fontWeight: 600, mb: "5px", color: "var(--muted2)", letterSpacing: "0.04em" }}>Assigné à</Box>
              <Box component="select" value={createForm.assignedToId ?? ''}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setCreateForm((f) => ({ ...f, assignedToId: e.target.value || undefined }))}
                sx={{ appearance: "none", WebkitAppearance: "none", background: "var(--s1)", backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%236b7280' d='M6 8L1 3h10z'/%3E%3C/svg%3E\")", backgroundRepeat: "no-repeat", backgroundPosition: "right 12px center", border: "1px solid var(--border)", borderRadius: "var(--r)", px: "12px", py: "7px", pr: "36px", fontSize: "13px", color: "var(--text)", width: "100%", outline: "none", fontFamily: "inherit" }}
              >
                <option value="">Non assigné</option>
                {modalUsers.map((u) => <option key={u.id} value={u.id}>{u.firstName} {u.lastName}</option>)}
              </Box>
            </Box>
          </Box>
          <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
            <Box>
              <Box sx={{ display: "flex", alignItems: "center", gap: "6px", mb: "8px" }}>
                <Box component="label" sx={{ display: "block", fontSize: "11px", fontWeight: 600, color: "var(--muted2)", letterSpacing: "0.04em" }}>Estimation</Box>
                <Tooltip title="Formats acceptés : 2h30, 1h, 90m, 1.5" placement="right" arrow>
                  <Box sx={{ width: 14, height: 14, borderRadius: "50%", border: "1px solid var(--border2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "9px", fontWeight: 700, color: "var(--muted)", cursor: "default", lineHeight: 1, flexShrink: 0 }}>i</Box>
                </Tooltip>
              </Box>
              <DurationPicker value={createEstMinutes} onChange={setCreateEstMinutes} width="100%" />
            </Box>
          </Box>
          <Box>
            <Box component="label" sx={{ display: "block", fontSize: "11px", fontWeight: 600, mb: "5px", color: "var(--muted2)", letterSpacing: "0.04em" }}>Description (Markdown supporté)</Box>
            <Box component="textarea" rows={5} placeholder="Décrivez le problème..." value={createForm.description}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setCreateForm((f) => ({ ...f, description: e.target.value }))}
              sx={{ background: "var(--s1)", border: "1px solid var(--border)", borderRadius: "var(--r)", px: "12px", py: "8px", fontSize: "13px", color: "var(--text)", width: "100%", outline: "none", fontFamily: "inherit", resize: "vertical", boxSizing: "border-box", maxWidth: "100%", minHeight: "80px", maxHeight: "300px" }}
            />
          </Box>
        </Box>
      </AppModal>

      <AppModal
        open={!!editTarget}
        onClose={() => !editSaving && setEditTarget(null)}
        title="Modifier le ticket"
        actions={
          <>
            <Button variant="outlined" size="small" sx={{ textTransform: "none" }} onClick={() => setEditTarget(null)} disabled={editSaving}>Annuler</Button>
            <Button variant="contained" size="small" sx={{ textTransform: "none" }} onClick={handleEdit} disabled={!editForm.title.trim() || editSaving}>
              {editSaving ? <CircularProgress size={14} sx={{ color: "#fff" }} /> : "Enregistrer"}
            </Button>
          </>
        }
      >
        <Box sx={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          <Box>
            <Box component="label" sx={{ display: "block", fontSize: "11px", fontWeight: 600, mb: "5px", color: "var(--muted2)", letterSpacing: "0.04em" }}>Titre <Box component="span" sx={{ color: "var(--red)" }}>*</Box></Box>
            <Box component="input" autoFocus type="text" value={editForm.title}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditForm((f) => ({ ...f, title: e.target.value }))}
              sx={{ background: "var(--s1)", border: "1px solid var(--border)", borderRadius: "var(--r)", px: "12px", py: "8px", fontSize: "13px", color: "var(--text)", width: "100%", outline: "none", fontFamily: "inherit" }}
            />
          </Box>
          <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
            <Box>
              <Box component="label" sx={{ display: "block", fontSize: "11px", fontWeight: 600, mb: "5px", color: "var(--muted2)", letterSpacing: "0.04em" }}>Priorité</Box>
              <Box component="select" value={editForm.priority}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setEditForm((f) => ({ ...f, priority: e.target.value }))}
                sx={{ appearance: "none", WebkitAppearance: "none", background: "var(--s1)", backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%236b7280' d='M6 8L1 3h10z'/%3E%3C/svg%3E\")", backgroundRepeat: "no-repeat", backgroundPosition: "right 12px center", border: "1px solid var(--border)", borderRadius: "var(--r)", px: "12px", py: "7px", pr: "36px", fontSize: "13px", color: "var(--text)", width: "100%", outline: "none", fontFamily: "inherit" }}
              >
                <option value="critical">Critique</option>
                <option value="high">Haute</option>
                <option value="medium">Moyenne</option>
                <option value="low">Basse</option>
              </Box>
            </Box>
            <Box>
              <Box component="label" sx={{ display: "block", fontSize: "11px", fontWeight: 600, mb: "5px", color: "var(--muted2)", letterSpacing: "0.04em" }}>Type</Box>
              <Box component="select" value={editForm.type}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setEditForm((f) => ({ ...f, type: e.target.value }))}
                sx={{ appearance: "none", WebkitAppearance: "none", background: "var(--s1)", backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%236b7280' d='M6 8L1 3h10z'/%3E%3C/svg%3E\")", backgroundRepeat: "no-repeat", backgroundPosition: "right 12px center", border: "1px solid var(--border)", borderRadius: "var(--r)", px: "12px", py: "7px", pr: "36px", fontSize: "13px", color: "var(--text)", width: "100%", outline: "none", fontFamily: "inherit" }}
              >
                <option value="bug">Bug</option>
                <option value="feature">Évolution</option>
                <option value="security">Sécurité</option>
                <option value="performance">Performance</option>
                <option value="maintenance">Maintenance</option>
                <option value="question">Question</option>
              </Box>
            </Box>
          </Box>
          <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
            <Box>
              <Box component="label" sx={{ display: "block", fontSize: "11px", fontWeight: 600, mb: "5px", color: "var(--muted2)", letterSpacing: "0.04em" }}>Projet</Box>
              <Box component="select" value={editForm.techProjectId}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setEditForm((f) => ({ ...f, techProjectId: e.target.value }))}
                sx={{ appearance: "none", WebkitAppearance: "none", background: "var(--s1)", backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%236b7280' d='M6 8L1 3h10z'/%3E%3C/svg%3E\")", backgroundRepeat: "no-repeat", backgroundPosition: "right 12px center", border: "1px solid var(--border)", borderRadius: "var(--r)", px: "12px", py: "7px", pr: "36px", fontSize: "13px", color: "var(--text)", width: "100%", outline: "none", fontFamily: "inherit" }}
              >
                <option value="">— Aucun projet —</option>
                {modalProjects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </Box>
            </Box>
            <Box>
              <Box component="label" sx={{ display: "block", fontSize: "11px", fontWeight: 600, mb: "5px", color: "var(--muted2)", letterSpacing: "0.04em" }}>Assigné à</Box>
              <Box component="select" value={editForm.assignedToId}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setEditForm((f) => ({ ...f, assignedToId: e.target.value }))}
                sx={{ appearance: "none", WebkitAppearance: "none", background: "var(--s1)", backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%236b7280' d='M6 8L1 3h10z'/%3E%3C/svg%3E\")", backgroundRepeat: "no-repeat", backgroundPosition: "right 12px center", border: "1px solid var(--border)", borderRadius: "var(--r)", px: "12px", py: "7px", pr: "36px", fontSize: "13px", color: "var(--text)", width: "100%", outline: "none", fontFamily: "inherit" }}
              >
                <option value="">Non assigné</option>
                {modalUsers.map((u) => <option key={u.id} value={u.id}>{u.firstName} {u.lastName}</option>)}
              </Box>
            </Box>
          </Box>
          <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
            <Box>
              <Box sx={{ display: "flex", alignItems: "center", gap: "6px", mb: "8px" }}>
                <Box component="label" sx={{ display: "block", fontSize: "11px", fontWeight: 600, color: "var(--muted2)", letterSpacing: "0.04em" }}>Estimation</Box>
                <Tooltip title="Formats acceptés : 2h30, 1h, 90m, 1.5" placement="right" arrow>
                  <Box sx={{ width: 14, height: 14, borderRadius: "50%", border: "1px solid var(--border2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "9px", fontWeight: 700, color: "var(--muted)", cursor: "default", lineHeight: 1, flexShrink: 0 }}>i</Box>
                </Tooltip>
              </Box>
              <DurationPicker value={editForm.estimatedMinutes} onChange={(v) => setEditForm((f) => ({ ...f, estimatedMinutes: v }))} width="100%" />
            </Box>
          </Box>
          <Box>
            <Box component="label" sx={{ display: "block", fontSize: "11px", fontWeight: 600, mb: "5px", color: "var(--muted2)", letterSpacing: "0.04em" }}>Description (Markdown supporté)</Box>
            <Box component="textarea" rows={5} value={editForm.description}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setEditForm((f) => ({ ...f, description: e.target.value }))}
              sx={{ background: "var(--s1)", border: "1px solid var(--border)", borderRadius: "var(--r)", px: "12px", py: "8px", fontSize: "13px", color: "var(--text)", width: "100%", outline: "none", fontFamily: "inherit", resize: "vertical", boxSizing: "border-box", maxWidth: "100%", minHeight: "80px", maxHeight: "300px" }}
            />
          </Box>
        </Box>
      </AppModal>

      <DeleteModal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={deleting}
        title="Supprimer ce ticket ?"
      >
        Cette action est irréversible. Le ticket <strong>{deleteTarget?.reference}</strong> sera définitivement supprimé.
      </DeleteModal>
    </>
  );
};
