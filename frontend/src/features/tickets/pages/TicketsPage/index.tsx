import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";
import { DeleteModal } from "@/components/DeleteModal";
import { useToast } from "@/hooks/useToast";
import { useT } from "@/i18n/I18nContext";
import { useTickets } from "@/features/tickets/hooks/useTickets";
import {
  createTicket,
  deleteTicket,
  exportTicketsExcel,
  updateTicket,
} from "@/features/tickets/api/tickets";
import { getTicketStatuses } from "@/features/tickets/api/ticketStatuses";
import { ProjectDto, getProjects } from "@/features/techHealth/api/projects";
import { getUsers } from "@/features/users/api/users";
import { Ticket, TicketStatusDef, User } from "@/types";
import { CreateTicketPayload, PRIORITY_ORDER } from "./helpers";
import { TicketsToolbar } from "./components/TicketsToolbar";
import { TicketsTable, SortState } from "./components/TicketsTable";
import { Pagination } from "./components/Pagination";
import { CreateTicketModal } from "./components/CreateTicketModal";
import { EditTicketModal, EditFormState } from "./components/EditTicketModal";
import { extractApiError } from "@/utils/apiError";
import { TICKETS_OPEN_CREATE_EVENT } from "@/components/CommandPalette";

export const TicketsPage: React.FC = () => {
  const t = useT();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { tickets, loading, fetchTickets } = useTickets();
  const [displayTickets, setDisplayTickets] = useState<Ticket[]>([]);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [filters, setFilters] = useState({
    priority: "",
    status: "",
    type: "",
  });
  const [page, setPage] = useState(1);
  const [deleteTarget, setDeleteTarget] = useState<{
    id: string;
    reference: string;
  } | null>(null);
  const [deleting, setDeleting] = useState(false);
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
  const [statuses, setStatuses] = useState<TicketStatusDef[]>([]);
  const [editTarget, setEditTarget] = useState<Ticket | null>(null);
  const [editForm, setEditForm] = useState<EditFormState>({
    title: "",
    description: "",
    priority: "medium",
    type: "bug",
    projectId: "",
    assignedToId: "",
    estimatedMinutes: 0,
    isInternal: false,
  });
  const [editSaving, setEditSaving] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [sort, setSort] = useState<SortState | null>({
    col: "priority",
    dir: "asc",
  });

  const pageSize = 20;

  const handleExport = async () => {
    setExporting(true);
    try {
      await exportTicketsExcel({
        priority: filters.priority || undefined,
        status: filters.status || undefined,
        type: filters.type || undefined,
        search: debouncedSearch || undefined,
      });
    } catch {
      showToast(t("tickets.list.export_error"), "error");
    } finally {
      setExporting(false);
    }
  };

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
    setCreateForm({
      title: "",
      description: "",
      priority: "Medium",
      type: "Bug",
      isInternal: false,
    });
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
      const created = await createTicket(payload as unknown as Partial<Ticket>);
      setShowCreateModal(false);
      navigate(`/tickets/${created.id}`);
    } catch (err) {
      showToast(extractApiError(err, t("tickets.list.create_error")), "error");
    } finally {
      setCreateSubmitting(false);
    }
  };

  const openEditModal = useCallback((ticket: Ticket) => {
    setEditForm({
      title: ticket.title,
      description: ticket.description ?? "",
      priority: ticket.priority,
      type: ticket.type,
      projectId: ticket.projectId ?? "",
      assignedToId: ticket.assignee?.id ?? "",
      estimatedMinutes:
        ticket.estimatedHours != null
          ? Math.round(ticket.estimatedHours * 60)
          : 0,
      isInternal: ticket.isInternal,
    });
    setEditTarget(ticket);
    loadModalRefs();
  }, []);

  const toggleSort = useCallback((col: string) => {
    setSort((s) => {
      if (s?.col !== col) return { col, dir: "asc" };
      if (s.dir === "asc") return { col, dir: "desc" };
      return null;
    });
  }, []);

  const onDeleteTarget = useCallback((id: string, reference: string) => {
    setDeleteTarget({ id, reference });
  }, []);

  const handleEdit = async () => {
    if (!editTarget) return;
    setEditSaving(true);
    try {
      const payload: Record<string, unknown> = {
        title: editForm.title,
        description: editForm.description,
        priority: editForm.priority,
        type: editForm.type,
        isInternal: editForm.isInternal,
      };
      if (editForm.projectId) payload.projectId = editForm.projectId;
      if (editForm.assignedToId) payload.assignedToId = editForm.assignedToId;
      if (editForm.estimatedMinutes > 0)
        payload.estimatedHours = editForm.estimatedMinutes / 60;
      const updated = await updateTicket(
        editTarget.id,
        payload as Partial<Ticket>,
      );
      setDisplayTickets((prev) =>
        prev.map((tk) => (tk.id === updated.id ? updated : tk)),
      );
      setEditTarget(null);
      window.dispatchEvent(new Event("dashboard:refresh"));
    } catch (err) {
      showToast(extractApiError(err, t("tickets.list.edit_error")), "error");
    } finally {
      setEditSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteTicket(deleteTarget.id);
      setDisplayTickets((prev) =>
        prev.filter((tk) => tk.id !== deleteTarget.id),
      );
      setDeleteTarget(null);
      window.dispatchEvent(new Event("dashboard:refresh"));
    } catch (err) {
      showToast(extractApiError(err, t("tickets.list.delete_error")), "error");
    } finally {
      setDeleting(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    const params: Record<string, unknown> = { page, pageSize };
    if (debouncedSearch) params.search = debouncedSearch;
    if (filters.priority) params.priority = filters.priority;
    if (filters.status) params.status = filters.status;
    if (filters.type) params.type = filters.type;
    fetchTickets(params).catch(() => {
      showToast(t("tickets.list.load_error"), "error");
    });
  }, [page, pageSize, debouncedSearch, filters, fetchTickets, showToast, t]);

  useEffect(() => {
    const ctrl = new AbortController();
    getTicketStatuses(ctrl.signal).then(setStatuses).catch(() => {});
    return () => ctrl.abort();
  }, []);

  useEffect(() => {
    const handler = () => openCreateModal();
    window.addEventListener(TICKETS_OPEN_CREATE_EVENT, handler);
    return () => window.removeEventListener(TICKETS_OPEN_CREATE_EVENT, handler);
  }, [openCreateModal]);

  useEffect(() => {
    if (tickets?.items !== undefined) {
      setDisplayTickets(tickets.items);
    }
  }, [tickets]);

  const filtered = useMemo(() => {
    return displayTickets.slice().sort((a, b) => {
      if (!sort) return 0;
      const mul = sort.dir === "asc" ? 1 : -1;
      switch (sort.col) {
        case "title":
          return mul * a.title.localeCompare(b.title);
        case "priority":
          return (
            mul *
            ((PRIORITY_ORDER[a.priority] ?? 9) -
              (PRIORITY_ORDER[b.priority] ?? 9))
          );
        case "status":
          return mul * a.statusName.localeCompare(b.statusName);
        case "assignee":
          return (
            mul *
            `${a.assignee?.firstName ?? ""}${a.assignee?.lastName ?? ""}`.localeCompare(
              `${b.assignee?.firstName ?? ""}${b.assignee?.lastName ?? ""}`,
            )
          );
        default:
          return 0;
      }
    });
  }, [displayTickets, sort]);

  const hasFiltersApplied = !!(
    debouncedSearch ||
    filters.priority ||
    filters.status ||
    filters.type
  );

  return (
    <>
      <Box
        className="page-enter"
        sx={{
          p: "20px 28px",
          height: "100vh",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        <TicketsToolbar
          search={search}
          onSearchChange={setSearch}
          filters={filters}
          onFiltersChange={(f) => {
            setFilters(f);
            setPage(1);
          }}
          onCreate={openCreateModal}
          onExport={handleExport}
          exporting={exporting}
          statuses={statuses}
        />

        {loading && displayTickets.length === 0 ? (
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flex: 1,
            }}
          >
            <CircularProgress size={24} />
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
            <TicketsTable
              tickets={filtered}
              sort={sort}
              onToggleSort={toggleSort}
              onEdit={openEditModal}
              onDelete={onDeleteTarget}
              hasFiltersApplied={hasFiltersApplied}
            />

            <Pagination
              page={page}
              totalPages={tickets?.totalPages ?? 1}
              total={tickets?.total ?? 0}
              onChange={setPage}
            />
          </Box>
        )}
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

      <EditTicketModal
        open={!!editTarget}
        onClose={() => setEditTarget(null)}
        form={editForm}
        onFormChange={setEditForm}
        projects={modalProjects}
        users={modalUsers}
        saving={editSaving}
        onSubmit={handleEdit}
      />

      <DeleteModal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={deleting}
        title={t("tickets.list.delete_title")}
      >
        {t("tickets.list.delete_prefix")}<strong>{deleteTarget?.reference}</strong>{t("tickets.list.delete_suffix")}<br />{t("common.action_irreversible_before")}<b>{t("common.action_irreversible_word")}</b>{t("common.action_irreversible_after")}
      </DeleteModal>
    </>
  );
};
