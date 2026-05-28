import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useNavigate } from "react-router-dom";
import Box from "@mui/material/Box";
import GlobalStyles from "@mui/material/GlobalStyles";
import { useToast } from "@/hooks/useToast";
import { useT } from "@/i18n/I18nContext";
import { getTickets, createTicket } from "@/features/tickets/api/tickets";
import {
  getTicketStatuses,
  createTicketStatus,
  deleteTicketStatus,
  changeTicketStatus,
} from "@/features/tickets/api/ticketStatuses";
import { ProjectDto, getProjects } from "@/features/techHealth/api/projects";
import { getUsers } from "@/features/users/api/users";
import { User, Ticket } from "@/types";
import { CreateTicketPayload } from "@/features/tickets/pages/TicketsPage/helpers";
import { CreateTicketModal } from "@/features/tickets/pages/TicketsPage/components/CreateTicketModal";
import {
  KanbanColumns,
  KanbanColumnDef,
  KanbanTicket,
  KanbanDropResult,
  ProjectInfo,
  arrayMove,
  apiColToColDef,
  ticketsToColumns,
} from "./helpers";
import { KanbanToolbar } from "./components/KanbanToolbar";
import { ProjectPicker } from "./components/ProjectPicker";
import { KanbanBoard } from "./components/KanbanBoard";
import { AddColumnDialog } from "./components/AddColumnDialog";
import { extractApiError } from "@/utils/apiError";
import { useQueryClient } from "@tanstack/react-query";
import { dashboardQueryKey } from "@/features/dashboard/hooks/useDashboard";

export const KanbanPage: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const t = useT();
  const queryClient = useQueryClient();

  const [columnDefs, setColumnDefs] = useState<KanbanColumnDef[]>([]);
  const [columns, setColumns] = useState<KanbanColumns>({});
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterOpen, setFilterOpen] = useState(false);
  const [filteredProjects, setFilteredProjects] = useState<string[]>([]);
  const [addColOpen, setAddColOpen] = useState(false);
  const [collapsedColumns, setCollapsedColumns] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem("sentinel:kanban:collapsed");
      return saved ? new Set<string>(JSON.parse(saved)) : new Set<string>();
    } catch {
      return new Set<string>();
    }
  });
  const wasDragging = useRef(false);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState<CreateTicketPayload>({
    title: "",
    description: "",
    priority: "Medium",
    type: "Bug",
    isInternal: false,
  });
  const [createSubmitting, setCreateSubmitting] = useState(false);
  const [createEstMinutes, setCreateEstMinutes] = useState(0);
  const [modalProjects, setModalProjects] = useState<ProjectDto[]>([]);
  const [modalUsers, setModalUsers] = useState<User[]>([]);

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
    for (const colId of Object.keys(columns)) {
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

  const loadModalRefs = () => {
    Promise.all([
      getProjects().catch(() => [] as ProjectDto[]),
      getUsers().catch(() => ({ items: [] as User[] })),
    ]).then(([p, u]) => {
      setModalProjects(p);
      setModalUsers(u.items);
    });
  };

  const openCreateModal = useCallback(() => {
    setCreateForm({ title: "", description: "", priority: "Medium", type: "Bug", isInternal: false });
    setCreateEstMinutes(0);
    setShowCreateModal(true);
    loadModalRefs();
  }, []);

  const handleCreate = async () => {
    if (!createForm.title.trim()) return;
    setCreateSubmitting(true);
    try {
      const payload: CreateTicketPayload = { ...createForm };
      if (!payload.projectId) delete payload.projectId;
      if (!payload.assignedToId) delete payload.assignedToId;
      if (createEstMinutes > 0) payload.estimatedHours = createEstMinutes / 60;
      await createTicket(payload as unknown as Partial<Ticket>);
      setShowCreateModal(false);
      queryClient.invalidateQueries({ queryKey: dashboardQueryKey });
      load();
    } catch (err) {
      showToast(extractApiError(err, t("tickets.list.create_error")), "error");
    } finally {
      setCreateSubmitting(false);
    }
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [ticketsResult, apiCols] = await Promise.all([
        getTickets({ pageSize: 200 }),
        getTicketStatuses(),
      ]);
      const defs = apiCols.map(apiColToColDef);
      setColumnDefs(defs);
      setColumns(ticketsToColumns(ticketsResult.items, defs));
    } catch {
      showToast(t("tickets.kanban.error.load_failed"), "error");
    } finally {
      setLoading(false);
    }
  }, [showToast, t]);

  useEffect(() => {
    load();
  }, [load]);

  const filteredColumns = useMemo<KanbanColumns>(() => {
    const term = search.toLowerCase().trim();
    const filter = (tickets: KanbanTicket[]) => {
      let result = tickets;
      if (term)
        result = result.filter(
          (tk) =>
            tk.title.toLowerCase().includes(term) ||
            tk.reference.toLowerCase().includes(term),
        );
      if (filteredProjects.length)
        result = result.filter((tk) => filteredProjects.includes(tk.project));
      return result;
    };
    return Object.fromEntries(
      columnDefs.map((c) => [c.id, filter(columns[c.id] ?? [])]),
    );
  }, [columns, columnDefs, search, filteredProjects]);

  const onDrop = useCallback(
    async ({ ticketId, sourceColId, sourceIndex, destColId, destIndex }: KanbanDropResult) => {
      if (sourceColId === destColId && sourceIndex === destIndex) return;

      if (sourceColId === destColId) {
        const visibleItems = filteredColumns[sourceColId];
        const movedId = visibleItems[sourceIndex]?.id;
        const clampedDest = Math.min(destIndex, visibleItems.length - 1);
        const targetId = visibleItems[clampedDest]?.id;
        if (!movedId || !targetId) return;
        setColumns((prev) => {
          const items = [...(prev[sourceColId] ?? [])];
          return {
            ...prev,
            [sourceColId]: arrayMove(
              items,
              items.findIndex((tk) => tk.id === movedId),
              items.findIndex((tk) => tk.id === targetId),
            ),
          };
        });
        return;
      }

      const movedTicket = (columns[sourceColId] ?? []).find((tk) => tk.id === ticketId);
      if (!movedTicket) return;

      const afterId = (filteredColumns[destColId] ?? [])[destIndex]?.id;
      setColumns((prev) => {
        const sourceItems = (prev[sourceColId] ?? []).filter((tk) => tk.id !== ticketId);
        const destItems = [...(prev[destColId] ?? [])];
        const insertAt = afterId
          ? destItems.findIndex((tk) => tk.id === afterId)
          : destItems.length;
        destItems.splice(insertAt >= 0 ? insertAt : destItems.length, 0, movedTicket);
        return { ...prev, [sourceColId]: sourceItems, [destColId]: destItems };
      });

      setUpdatingId(ticketId);
      try {
        await changeTicketStatus(ticketId, destColId);
        window.dispatchEvent(new Event("dashboard:refresh"));
      } catch (err) {
        showToast(
          extractApiError(err, t("tickets.kanban.error.status_change_failed")),
          "error",
        );
        load();
      } finally {
        setUpdatingId(null);
      }
    },
    [columns, filteredColumns, showToast, load, t],
  );

  const handleAddColumn = useCallback(
    async (name: string, color: string) => {
      try {
        const created = await createTicketStatus(name, color);
        const def = apiColToColDef(created);
        setColumnDefs((prev) => [...prev, def]);
        setColumns((prev) => ({ ...prev, [def.id]: [] }));
        setAddColOpen(false);
        window.dispatchEvent(new Event("dashboard:refresh"));
      } catch (err) {
        showToast(extractApiError(err, "Impossible de créer la colonne"), "error");
      }
    },
    [showToast],
  );

  useEffect(() => {
    try {
      localStorage.setItem("sentinel:kanban:collapsed", JSON.stringify([...collapsedColumns]));
    } catch {}
  }, [collapsedColumns]);

  const toggleCollapse = useCallback((id: string) => {
    setCollapsedColumns((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }, []);

  const handleCardClick = useCallback((id: string) => {
    navigate(`/tickets/${id}`);
  }, [navigate]);

  const handleOpenAddColumn = useCallback(() => {
    setAddColOpen(true);
  }, []);

  const handleDeleteColumn = useCallback(
    async (id: string) => {
      try {
        await deleteTicketStatus(id);
        setColumnDefs((prev) => prev.filter((c) => c.id !== id));
        setColumns((prev) => {
          const next = { ...prev };
          delete next[id];
          return next;
        });
        window.dispatchEvent(new Event("dashboard:refresh"));
      } catch (err) {
        showToast(extractApiError(err, "Impossible de supprimer la colonne"), "error");
      }
    },
    [showToast],
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
          ".kanban-col-body::-webkit-scrollbar-track": { background: "transparent" },
          ".kanban-col-body::-webkit-scrollbar-thumb": {
            background: "var(--border2)",
            borderRadius: "var(--r-xs)",
          },
        }}
      />

      <Box
        className="kanban-content"
        sx={{ display: "flex", flexDirection: "column", height: "100vh", overflow: "hidden" }}
      >
        <KanbanToolbar
          search={search}
          onSearchChange={setSearch}
          activeFilterCount={activeFilterCount}
          onOpenFilters={() => setFilterOpen(true)}
          onCreate={openCreateModal}
        />

        <ProjectPicker
          open={filterOpen}
          onClose={() => setFilterOpen(false)}
          allProjects={allProjects}
          selected={filteredProjects}
          onApply={setFilteredProjects}
        />

        <KanbanBoard
          loading={loading}
          filteredColumns={filteredColumns}
          columnDefs={columnDefs}
          updatingId={updatingId}
          wasDraggingRef={wasDragging}
          onDrop={onDrop}
          onCardClick={handleCardClick}
          onDeleteColumn={handleDeleteColumn}
          onAddColumn={handleOpenAddColumn}
          collapsedColumns={collapsedColumns}
          onToggleCollapse={toggleCollapse}
        />

        <AddColumnDialog
          open={addColOpen}
          onClose={() => setAddColOpen(false)}
          onConfirm={handleAddColumn}
        />
      </Box>

      <CreateTicketModal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        form={createForm}
        onFormChange={setCreateForm}
        estMinutes={createEstMinutes}
        onEstMinutesChange={setCreateEstMinutes}
        projects={modalProjects}
        users={modalUsers}
        submitting={createSubmitting}
        onSubmit={handleCreate}
      />
    </>
  );
};
