import type React from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";
import { DeleteModal } from "@/components/DeleteModal";
import { useToast } from "@/hooks/useToast";
import { useT } from "@/i18n/I18nContext";
import {
  useTickets,
  TICKETS_QUERY_KEY,
} from "@/features/tickets/hooks/useTickets";
import { dashboardQueryKey } from "@/features/dashboard/hooks/useDashboard";
import {
  createTicket,
  deleteTicket,
  exportTicketsExcel,
  updateTicket,
} from "@/features/tickets/api/tickets";
import { useTicketStatuses } from "@/features/tickets/hooks/useTicketStatuses";
import { changeTicketStatus } from "@/features/tickets/api/ticketStatuses";
import {
  type ProjectDto,
  getProjects,
} from "@/features/techHealth/api/projects";
import { getUsers } from "@/features/users/api/users";
import type {
  Ticket,
  TicketFilters,
  TicketPriority,
  TicketType,
  TicketStatusDef,
  User,
  PaginatedResponse,
} from "@/types";
import {
  type CreateTicketPayload,
  EMPTY_CREATE_TICKET_FORM,
  PRIORITY_ORDER,
} from "./helpers";
import { TicketsToolbar } from "./components/TicketsToolbar";
import { TicketsTable, type SortState } from "./components/TicketsTable";
import { Pagination } from "./components/Pagination";
import { CreateTicketModal } from "./components/CreateTicketModal";
import {
  EditTicketModal,
  type EditFormState,
} from "./components/EditTicketModal";
import { extractApiError } from "@/utils/apiError";
import { SortDirection } from "@/types/enums";

export const TicketsPage: React.FC = () => {
  const t = useT();
  const navigate = useNavigate();
  const location = useLocation();
  const { showToast } = useToast();
  const queryClient = useQueryClient();
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
  const [createForm, setCreateForm] = useState<CreateTicketPayload>(
    EMPTY_CREATE_TICKET_FORM,
  );
  const [createAnother, setCreateAnother] = useState(false);
  const [createSubmitting, setCreateSubmitting] = useState(false);
  const [createEstMinutes, setCreateEstMinutes] = useState(0);
  const [modalProjects, setModalProjects] = useState<ProjectDto[]>([]);
  const [modalUsers, setModalUsers] = useState<User[]>([]);
  const { data: statusesData } = useTicketStatuses();
  const statuses: TicketStatusDef[] = statusesData ?? [];
  const [editTarget, setEditTarget] = useState<Ticket | null>(null);
  const [editForm, setEditForm] = useState<EditFormState>({
    title: "",
    description: "",
    priority: "medium",
    type: "bug",
    status: "",
    projectId: "",
    assignedToId: "",
    estimatedMinutes: 0,
  });
  const [editSaving, setEditSaving] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [sort, setSort] = useState<SortState | null>({
    col: "priority",
    dir: SortDirection.Asc,
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

  const loadModalRefs = useCallback(() => {
    Promise.all([
      getProjects().catch(() => [] as ProjectDto[]),
      getUsers().catch(() => ({ items: [] as User[] })),
    ]).then(([p, u]) => {
      setModalProjects(p);
      setModalUsers(u.items);
    });
  }, []);

  const openCreateModal = useCallback(() => {
    setCreateForm(EMPTY_CREATE_TICKET_FORM);
    setCreateEstMinutes(0);
    setShowCreateModal(true);
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
      queryClient.invalidateQueries({ queryKey: dashboardQueryKey });
      if (createAnother) {
        queryClient.invalidateQueries({ queryKey: [TICKETS_QUERY_KEY] });
        setCreateForm(EMPTY_CREATE_TICKET_FORM);
        setCreateEstMinutes(0);
        showToast(
          t("tickets.list.create_success", { reference: created.reference }),
          "success",
        );
      } else {
        setShowCreateModal(false);
        navigate(`/tickets/${created.id}`);
      }
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
      status: ticket.statusId,
      projectId: ticket.projectId ?? "",
      assignedToId: ticket.assignee?.id ?? "",
      estimatedMinutes:
        ticket.estimatedHours != null
          ? Math.round(ticket.estimatedHours * 60)
          : 0,
    });
    setEditTarget(ticket);
  }, []);

  const toggleSort = useCallback((col: string) => {
    setSort((s) => {
      if (s?.col !== col) return { col, dir: SortDirection.Asc };
      if (s.dir === SortDirection.Asc) return { col, dir: SortDirection.Desc };
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
      };
      if (editForm.projectId) payload.projectId = editForm.projectId;
      if (editForm.assignedToId) payload.assignedToId = editForm.assignedToId;
      if (editForm.estimatedMinutes > 0)
        payload.estimatedHours = editForm.estimatedMinutes / 60;
      const updated = await updateTicket(
        editTarget.id,
        payload as Partial<Ticket>,
      );
      if (editForm.status && editForm.status !== editTarget.statusId) {
        await changeTicketStatus(editTarget.id, editForm.status);
      }
      queryClient.setQueryData<PaginatedResponse<Ticket>>(
        [TICKETS_QUERY_KEY, ticketsFilters],
        (prev) =>
          prev
            ? {
                ...prev,
                items: prev.items.map((tk) =>
                  tk.id === updated.id ? updated : tk,
                ),
              }
            : prev,
      );
      queryClient.invalidateQueries({ queryKey: [TICKETS_QUERY_KEY] });
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
      queryClient.setQueryData<PaginatedResponse<Ticket>>(
        [TICKETS_QUERY_KEY, ticketsFilters],
        (prev) =>
          prev
            ? {
                ...prev,
                items: prev.items.filter((tk) => tk.id !== deleteTarget.id),
              }
            : prev,
      );
      queryClient.invalidateQueries({ queryKey: [TICKETS_QUERY_KEY] });
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

  const ticketsFilters: TicketFilters = {
    page,
    pageSize,
    ...(debouncedSearch ? { search: debouncedSearch } : {}),
    ...(filters.priority
      ? { priority: filters.priority as TicketPriority }
      : {}),
    ...(filters.status ? { status: filters.status } : {}),
    ...(filters.type ? { type: filters.type as TicketType } : {}),
  };

  const { tickets, loading, error } = useTickets(ticketsFilters);

  useEffect(() => {
    if (error) showToast(t("tickets.list.load_error"), "error");
  }, [error, showToast, t]);

  useEffect(() => {
    loadModalRefs();
    if ((location.state as { openCreate?: boolean } | null)?.openCreate) {
      openCreateModal();
    }
  }, [loadModalRefs, location.state, openCreateModal]);

  const filtered = useMemo(() => {
    return (tickets?.items ?? []).slice().sort((a, b) => {
      if (!sort) return 0;
      const mul = sort.dir === SortDirection.Asc ? 1 : -1;
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
  }, [tickets?.items, sort]);

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

        {loading && !tickets ? (
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
        createAnother={createAnother}
        onCreateAnotherChange={setCreateAnother}
      />

      <EditTicketModal
        open={!!editTarget}
        onClose={() => setEditTarget(null)}
        form={editForm}
        onFormChange={setEditForm}
        projects={modalProjects}
        statuses={statuses}
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
        {t("tickets.list.delete_prefix")}
        <strong>{deleteTarget?.reference}</strong>
        {t("tickets.list.delete_suffix")}
        <br />
        {t("common.action_irreversible_before")}
        <b>{t("common.action_irreversible_word")}</b>
        {t("common.action_irreversible_after")}
      </DeleteModal>
    </>
  );
};
